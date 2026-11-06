from rest_framework.exceptions import APIException, ValidationError
from django.db.models import Q, Prefetch
from django.db import transaction
from utils.constants import UITheme

from adm.models import (
    PipelineCategory, Organization, PipelineStageTranferedData, PipelineStageDeletedLog
)
from telecalling.models import (
    PipelineStage, Priority, Lead, CampaignName, CallDetails, FollowUp, PaymentInfo
)

CORE_STAGE_NAMES = {
    "new lead",
    "not connected",
    "follow up",
    "unreached",
    "loss request",
    "won",
    "loss",
    "joined",
    "closed",
}

CORE_STAGE_ORDER = {
    "new lead": 1,
    "not connected": 2,
    "follow up": 3,
    "unreached": 4,
    "loss request": 5,
    "won": 98,
    "joined": 98,
    "loss": 99,
    "closed": 99,
}

DEFAULT_CORE_STAGES = [
    {
        "name": "New Lead",
        "order_no": 1,
        "stage_type": "open",
        "stage_color": "#1D4ED8",
        "tags": [],
    },
    {
        "name": "Not Connected",
        "order_no": 2,
        "stage_type": "open",
        "stage_color": "#F59E0B",
        "tags": [],
    },
    {
        "name": "Follow Up",
        "order_no": 3,
        "stage_type": "open",
        "stage_color": "#EC4899",
        "tags": [
            {"name": "Hot", "color": "#EF4444"},
            {"name": "Warm", "color": "#FBBF24"},
            {"name": "Cold", "color": "#94A3B8"},
        ],
    },
    {
        "name": "Unreached",
        "order_no": 4,
        "stage_type": "open",
        "stage_color": "#64748B",
        "tags": [],
    },
    {
        "name": "Loss Request",
        "order_no": 5,
        "stage_type": "open",
        "stage_color": "#8B5CF6",
        "tags": [],
    },
]

DEFAULT_TERMINALS = {
    "joined": {
        "name": "Won",
        "order_no": 98,
        "stage_type": "closed_won",
        "stage_color": "#84CC16",
        "tags": [],
    },
    "closed": {
        "name": "Loss",
        "order_no": 99,
        "stage_type": "closed_lost",
        "stage_color": "#EF4444",
        "tags": [],
    },
}


def is_protected_core_stage(stage):
    """
    Returns True if the stage is one of the 6 core system stages that cannot be deleted:
      - New Lead
      - Not Connected
      - Follow Up
      - Loss Request
      - Won (closed_won)
      - Loss (closed_lost)
    """
    if not stage:
        return False
    st_type = getattr(stage, "stage_type", None) or ""
    if st_type in ["closed_won", "closed_lost", "terminal_joined", "terminal_closed"]:
        return True
    name = (getattr(stage, "name", "") or "").strip().lower()
    disp = (getattr(stage, "display_value", "") or "").strip().lower()
    return name in CORE_STAGE_NAMES or disp in CORE_STAGE_NAMES


def _get_org(user):
    if not user:
        return None
    org = getattr(user, 'organization', None)
    if not org and hasattr(user, 'organization_id') and user.organization_id:
        org = Organization.objects.filter(id=user.organization_id).first()
    if not org:
        return None
    return org


def _format_stage(stage):
    tags_list = []
    for prio in stage.priorities.all():
        if not prio.is_active:
            continue
        tag_name = prio.display_value or prio.name

        hex_c = (prio.color or UITheme.DEFAULT_PIPELINE_TAG_COLOR).strip()
        bg_c = f"{hex_c}1F" if (hex_c.startswith("#") and len(hex_c) == 7) else "rgba(59, 130, 246, 0.12)"
        color_props = {
            "borderColor": hex_c,
            "textColor": hex_c,
            "bgColor": bg_c,
            "color": hex_c,
        }

        tags_list.append({
            "id": prio.id,
            "name": tag_name,
            **color_props,
        })

    is_protected = is_protected_core_stage(stage)

    return {
        "id": stage.id,
        "name": stage.display_value or stage.name,
        "order_no": stage.order_no,
        "stage_type": stage.stage_type,
        "isFirst": stage.order_no == 1,
        "tags": tags_list,
        "stage_color": stage.stage_color or "",
        "is_deletable": not is_protected,
        "can_delete": not is_protected,
        "is_system_core": is_protected,
    }


def _ensure_pipeline_default_stages(cat, org=None, user=None):
    """
    Ensure the 6 mandatory core pipeline stages exist for a pipeline category:
      1: New Lead (open)
      2: Not Connected (open)
      3: Follow Up (open)
      4: Loss Request (open)
      98: Won (closed_won)
      99: Loss (closed_lost)
    """
    if not cat:
        return

    target_org = org or cat.organization
    creator = getattr(user, "username", "admin") if user else "admin"

    # 1. Open core stages
    for s_def in DEFAULT_CORE_STAGES:
        st_name = s_def["name"]
        st_order = s_def["order_no"]
        st_color = s_def["stage_color"]
        st_tags = s_def.get("tags", [])

        # Match by name or display_value (case-insensitive)
        existing = PipelineStage.objects.filter(
            pipeline_category=cat
        ).filter(
            Q(name__iexact=st_name) | Q(display_value__iexact=st_name) |
            (Q(name__iexact="follow-up") if st_name == "Follow Up" else Q())
        ).first()

        if existing:
            updated = False
            if not existing.is_active:
                existing.is_active = True
                updated = True
            if existing.order_no != st_order:
                existing.order_no = st_order
                updated = True
            if existing.stage_type != "open":
                existing.stage_type = "open"
                updated = True
            if not existing.stage_color:
                existing.stage_color = st_color
                updated = True
            if updated:
                existing.save()

            if st_tags and not existing.priorities.filter(is_active=True).exists():
                _sync_stage_priorities(existing, st_tags)
        else:
            new_st = PipelineStage.objects.create(
                pipeline_category=cat,
                organization=target_org,
                name=st_name,
                display_value=st_name,
                order_no=st_order,
                stage_type="open",
                stage_color=st_color,
                is_active=True,
                created_by=creator,
            )
            if st_tags:
                _sync_stage_priorities(new_st, st_tags)

    # Adjust any custom stages to start at order 6+
    custom_stages = PipelineStage.objects.filter(
        pipeline_category=cat,
        stage_type="open",
        is_active=True
    ).exclude(
        Q(name__iexact="new lead") |
        Q(name__iexact="not connected") |
        Q(name__iexact="follow up") |
        Q(name__iexact="follow-up") |
        Q(name__iexact="unreached") |
        Q(name__iexact="loss request") |
        Q(order_no__gte=90)
    ).order_by("order_no", "id")

    for c_idx, cust_st in enumerate(custom_stages, start=6):
        if cust_st.order_no != c_idx:
            cust_st.order_no = c_idx
            cust_st.save()

    # 2. Terminal stages (Won & Loss)
    won_stage = PipelineStage.objects.filter(
        pipeline_category=cat
    ).filter(
        Q(stage_type__in=["closed_won", "terminal_joined"]) |
        Q(name__iexact="won") |
        Q(display_value__iexact="won")
    ).first()

    if won_stage:
        w_updated = False
        if not won_stage.is_active:
            won_stage.is_active = True
            w_updated = True
        if won_stage.order_no != 98:
            won_stage.order_no = 98
            w_updated = True
        if won_stage.stage_type != "closed_won":
            won_stage.stage_type = "closed_won"
            w_updated = True
        if not won_stage.stage_color:
            won_stage.stage_color = "#84CC16"
            w_updated = True
        if w_updated:
            won_stage.save()
    else:
        PipelineStage.objects.create(
            pipeline_category=cat,
            organization=target_org,
            name="Won",
            display_value="Won",
            order_no=98,
            stage_type="closed_won",
            stage_color="#84CC16",
            is_active=True,
            created_by=creator,
        )

    loss_stage = PipelineStage.objects.filter(
        pipeline_category=cat
    ).filter(
        Q(stage_type__in=["closed_lost", "terminal_closed"]) |
        Q(name__iexact="loss") |
        Q(display_value__iexact="loss")
    ).first()

    if loss_stage:
        l_updated = False
        if not loss_stage.is_active:
            loss_stage.is_active = True
            l_updated = True
        if loss_stage.order_no != 99:
            loss_stage.order_no = 99
            l_updated = True
        if loss_stage.stage_type != "closed_lost":
            loss_stage.stage_type = "closed_lost"
            l_updated = True
        if not loss_stage.stage_color:
            loss_stage.stage_color = "#EF4444"
            l_updated = True
        if l_updated:
            loss_stage.save()
    else:
        PipelineStage.objects.create(
            pipeline_category=cat,
            organization=target_org,
            name="Loss",
            display_value="Loss",
            order_no=99,
            stage_type="closed_lost",
            stage_color="#EF4444",
            is_active=True,
            created_by=creator,
        )


def fetch_pipeline_categories(user, **data):
    try:
        org = _get_org(user)
        if not org:
            return []
        qs = PipelineCategory.objects.filter(is_active=True, organization=org)

        for cat in qs:
            _ensure_pipeline_default_stages(cat, org, user)

        categories = qs.order_by("id").prefetch_related(
            Prefetch(
                "pipeline_stages",
                queryset=PipelineStage.objects.filter(is_active=True).order_by("order_no", "id").prefetch_related(
                    Prefetch(
                        "priorities",
                        queryset=Priority.objects.filter(is_active=True).order_by("id")
                    )
                )
            )
        )
        result = []

        for cat in categories:
            stages_qs = cat.pipeline_stages.all()

            stages_list = []
            terminals_dict = {
                "joined": {
                    "id": "joined",
                    "name": "Won",
                    "order_no": 98,
                    "stage_type": "closed_won",
                    "stage_color": "#84CC16",
                    "is_deletable": False,
                    "can_delete": False,
                    "is_system_core": True,
                    "tags": [],
                },
                "closed": {
                    "id": "closed",
                    "name": "Loss",
                    "order_no": 99,
                    "stage_type": "closed_lost",
                    "stage_color": "#EF4444",
                    "is_deletable": False,
                    "can_delete": False,
                    "is_system_core": True,
                    "tags": [],
                },
            }

            for stage in stages_qs:
                formatted = _format_stage(stage)
                if stage.stage_type in ["closed_won", "terminal_joined"]:
                    terminals_dict["joined"] = formatted
                elif stage.stage_type in ["closed_lost", "terminal_closed"]:
                    terminals_dict["closed"] = formatted
                else:
                    stages_list.append(formatted)

            result.append({
                "id": cat.id,
                "category_name": cat.category_name,
                "display_name": cat.display_name or cat.category_name,
                "organization_id": cat.organization_id,
                "is_default": bool(cat.is_default),
                "stages_data": stages_list,
                "terminals_data": terminals_dict,
            })

        return result
    except ValidationError:
        raise
    except Exception as e:
        raise APIException(str(e))


def create_pipeline_category(user, **data):
    try:
        name = data.get("name")
        if not name or not name.strip():
            raise ValidationError("Pipeline category name is required")

        trimmed_name = name.strip()
        org = _get_org(user)

        qs = PipelineCategory.objects.filter(
            category_name__iexact=trimmed_name,
            is_active=True
        )
        if org:
            qs = qs.filter(organization=org)

        if qs.exists():
            raise ValidationError(f"Pipeline Category with name '{trimmed_name}' already exists.")

        is_def = bool(data.get("is_default", False))
        if is_def:
            defaults_qs = PipelineCategory.objects.filter(is_active=True)
            if org:
                defaults_qs = defaults_qs.filter(organization=org)
            defaults_qs.update(is_default=False)

        cat = PipelineCategory.objects.create(
            category_name=trimmed_name,
            display_name=trimmed_name,
            organization=org,
            is_default=is_def,
            is_active=True,
            created_by=user.username if user else "admin"
        )

        # 1. First ensure 6 mandatory core stages exist
        _ensure_pipeline_default_stages(cat, org, user)

        # 2. Process any user stages (update core stages or create custom stages at order 5, 6, ...)
        stages_input = (
            data.get("stages") or
            data.get("stages_data") or
            data.get("pipeline_stages") or
            data.get("custom_stages") or
            data.get("stage_data") or
            data.get("stages_list")
        )

        if stages_input:
            custom_idx = 6
            for s_info in stages_input:
                s_name = s_info.get("name") if isinstance(s_info, dict) else str(s_info)
                if not s_name or not s_name.strip():
                    continue
                s_name_clean = s_name.strip()
                s_tags = s_info.get("tags", []) if isinstance(s_info, dict) else []
                s_color = (s_info.get("stage_color") or s_info.get("color") or "").strip() if isinstance(s_info, dict) else ""
                if not s_color:
                    s_color = "#3B82F6"

                core_st = PipelineStage.objects.filter(
                    pipeline_category=cat,
                    name__iexact=s_name_clean,
                    is_active=True
                ).first()

                if core_st:
                    if s_color:
                        core_st.stage_color = s_color
                        core_st.save()
                    if s_tags:
                        _sync_stage_priorities(core_st, s_tags)
                else:
                    # New custom stage (e.g. bid, confirmed)
                    cust_obj = PipelineStage.objects.create(
                        pipeline_category=cat,
                        organization=org or cat.organization,
                        name=s_name_clean,
                        display_value=s_name_clean,
                        order_no=custom_idx,
                        stage_type="open",
                        stage_color=s_color,
                        is_active=True,
                        created_by=user.username if user else "admin"
                    )
                    custom_idx += 1
                    if s_tags:
                        _sync_stage_priorities(cust_obj, s_tags)

        # 3. Terminals override if specified
        terminals_input = data.get("terminals") or data.get("terminals_data") or {}
        if terminals_input:
            if "joined" in terminals_input:
                j_info = terminals_input["joined"]
                j_name = j_info.get("name") or "Won"
                j_color = (j_info.get("stage_color") or j_info.get("color") or "").strip() or "#84CC16"
                st_j = PipelineStage.objects.filter(pipeline_category=cat, stage_type__in=["closed_won", "terminal_joined"]).first()
                if st_j:
                    st_j.name = j_name
                    st_j.display_value = j_name
                    st_j.stage_color = j_color
                    st_j.save()
                    if j_info.get("tags"):
                        _sync_stage_priorities(st_j, j_info["tags"])
            if "closed" in terminals_input:
                c_info = terminals_input["closed"]
                c_name = c_info.get("name") or "Loss"
                c_color = (c_info.get("stage_color") or c_info.get("color") or "").strip() or "#EF4444"
                st_c = PipelineStage.objects.filter(pipeline_category=cat, stage_type__in=["closed_lost", "terminal_closed"]).first()
                if st_c:
                    st_c.name = c_name
                    st_c.display_value = c_name
                    st_c.stage_color = c_color
                    st_c.save()
                    if c_info.get("tags"):
                        _sync_stage_priorities(st_c, c_info["tags"])

        all_cats = fetch_pipeline_categories(user)
        created_item = next((c for c in all_cats if c["id"] == cat.id), None)
        return created_item or {"id": cat.id, "display_name": cat.display_name}
    except ValidationError:
        raise
    except Exception as e:
        raise APIException(str(e))


def update_pipeline_stages(user, **data):
    try:
        pipeline_id = data.get("pipeline_id")
        if not pipeline_id:
            raise ValidationError("pipeline_id is required")

        cat = PipelineCategory.objects.filter(id=pipeline_id).first()
        if not cat:
            raise ValidationError(f"Pipeline with id {pipeline_id} not found")

        org = _get_org(user)
        display_name = data.get("display_name") or data.get("name")
        if display_name and display_name.strip():
            trimmed_display = display_name.strip()
            collision_qs = PipelineCategory.objects.filter(
                category_name__iexact=trimmed_display,
                is_active=True
            ).exclude(id=cat.id)
            if org:
                collision_qs = collision_qs.filter(organization=org)
            if collision_qs.exists():
                raise ValidationError(f"Another pipeline with the name '{trimmed_display}' already exists.")

            cat.display_name = trimmed_display
            cat.category_name = trimmed_display
            cat.save()

        if "is_default" in data and data.get("is_default") is not None:
            is_def = bool(data.get("is_default"))
            if is_def:
                other_defaults = PipelineCategory.objects.filter(
                    is_active=True
                ).exclude(id=cat.id)
                if org:
                    other_defaults = other_defaults.filter(organization=org)
                other_defaults.update(is_default=False)
                cat.is_default = True
            else:
                cat.is_default = False
            cat.save()

        has_stages = "stages" in data or "stages_data" in data
        has_terminals = "terminals" in data or "terminals_data" in data

        if has_stages:
            incoming_stages = data.get("stages") or data.get("stages_data") or []
            active_stage_ids = []

            for idx, s_data in enumerate(incoming_stages):
                raw_id = s_data.get("id")
                stage_name = s_data.get("name", f"Stage {idx + 1}").strip()
                s_color = (s_data.get("stage_color") or s_data.get("color") or "").strip()
                if not s_color:
                    raise ValidationError(f"Stage color is required for stage '{stage_name}'.")

                core_order = CORE_STAGE_ORDER.get(stage_name.lower())
                order_no = core_order if core_order is not None else (idx + 1)

                stage_obj = None
                if isinstance(raw_id, int):
                    stage_obj = PipelineStage.objects.filter(id=raw_id, pipeline_category=cat).first()

                if not stage_obj:
                    stage_obj = PipelineStage.objects.filter(
                        pipeline_category=cat,
                        name__iexact=stage_name
                    ).first()

                if not stage_obj:
                    stage_obj = PipelineStage.objects.create(
                        pipeline_category=cat,
                        organization=org or cat.organization,
                        name=stage_name,
                        display_value=stage_name,
                        order_no=order_no,
                        stage_type="open",
                        stage_color=s_color,
                        is_active=True,
                        created_by=user.username if user else "admin",
                    )
                else:
                    stage_obj.name = stage_name
                    stage_obj.display_value = stage_name
                    stage_obj.order_no = order_no
                    stage_obj.stage_type = "open"
                    stage_obj.stage_color = s_color
                    stage_obj.is_active = True
                    stage_obj.save()

                active_stage_ids.append(stage_obj.id)
                _sync_stage_priorities(stage_obj, s_data.get("tags", []))

            stages_to_deactivate = PipelineStage.objects.filter(
                pipeline_category=cat,
                stage_type__in=["open", "standard"],
                is_active=True
            ).exclude(id__in=active_stage_ids)

            for s in stages_to_deactivate:
                if not is_protected_core_stage(s):
                    s.is_active = False
                    s.save()

        if has_terminals:
            incoming_terminals = data.get("terminals") or data.get("terminals_data") or {}

            if "joined" in incoming_terminals:
                t_joined = incoming_terminals["joined"]
                raw_id = t_joined.get("id")
                t_name = t_joined.get("name") or "Won"
                t_color = (t_joined.get("stage_color") or t_joined.get("color") or "").strip() or "#84CC16"
                stage_obj = None
                if isinstance(raw_id, int):
                    stage_obj = PipelineStage.objects.filter(id=raw_id, pipeline_category=cat).first()
                if not stage_obj:
                    stage_obj = PipelineStage.objects.filter(
                        pipeline_category=cat, stage_type__in=["closed_won", "terminal_joined"]
                    ).first()

                if not stage_obj:
                    stage_obj = PipelineStage.objects.create(
                        pipeline_category=cat,
                        organization=org or cat.organization,
                        name=t_name,
                        display_value=t_name,
                        order_no=98,
                        stage_type="closed_won",
                        stage_color=t_color,
                        is_active=True,
                        created_by=user.username if user else "admin",
                    )
                else:
                    stage_obj.name = t_name
                    stage_obj.display_value = t_name
                    stage_obj.order_no = 98
                    stage_obj.stage_type = "closed_won"
                    if t_color:
                        stage_obj.stage_color = t_color
                    stage_obj.is_active = True
                    stage_obj.save()

                _sync_stage_priorities(stage_obj, t_joined.get("tags", []))

            if "closed" in incoming_terminals:
                t_closed = incoming_terminals["closed"]
                raw_id = t_closed.get("id")
                t_name = t_closed.get("name") or "Loss"
                t_color = (t_closed.get("stage_color") or t_closed.get("color") or "").strip() or "#EF4444"
                stage_obj = None
                if isinstance(raw_id, int):
                    stage_obj = PipelineStage.objects.filter(id=raw_id, pipeline_category=cat).first()
                if not stage_obj:
                    stage_obj = PipelineStage.objects.filter(
                        pipeline_category=cat, stage_type__in=["closed_lost", "terminal_closed"]
                    ).first()

                if not stage_obj:
                    stage_obj = PipelineStage.objects.create(
                        pipeline_category=cat,
                        organization=org or cat.organization,
                        name=t_name,
                        display_value=t_name,
                        order_no=99,
                        stage_type="closed_lost",
                        stage_color=t_color,
                        is_active=True,
                        created_by=user.username if user else "admin",
                    )
                else:
                    stage_obj.name = t_name
                    stage_obj.display_value = t_name
                    stage_obj.order_no = 99
                    stage_obj.stage_type = "closed_lost"
                    if t_color:
                        stage_obj.stage_color = t_color
                    stage_obj.is_active = True
                    stage_obj.save()

                _sync_stage_priorities(stage_obj, t_closed.get("tags", []))

        _ensure_pipeline_default_stages(cat, org, user)

        updated_cats = fetch_pipeline_categories(user)
        updated_item = next((c for c in updated_cats if c["id"] == cat.id), None)
        return updated_item or {"id": cat.id, "display_name": cat.display_name}
    except ValidationError:
        raise
    except Exception as e:
        raise APIException(str(e))


def _sync_stage_priorities(stage_obj, tags_list):
    active_prio_ids = []

    for tag in tags_list:
        if isinstance(tag, dict):
            tag_name = tag.get("name")
            prio_id = tag.get("id")
            hex_color = tag.get("borderColor") or tag.get("color") or tag.get("textColor") or "#3B82F6"
        else:
            tag_name = str(tag)
            prio_id = None
            hex_color = "#3B82F6"

        if not tag_name or not str(tag_name).strip():
            continue

        tag_name_clean = str(tag_name).strip()
        hex_color_clean = str(hex_color).strip()

        prio_obj = None
        if isinstance(prio_id, int):
            prio_obj = Priority.objects.filter(id=prio_id, pipeline_stage=stage_obj).first()

        if not prio_obj:
            prio_obj = Priority.objects.create(
                pipeline_stage=stage_obj,
                name=tag_name_clean,
                display_value=tag_name_clean,
                color=hex_color_clean,
                is_active=True
            )
        else:
            prio_obj.name = tag_name_clean
            prio_obj.display_value = tag_name_clean
            prio_obj.color = hex_color_clean
            prio_obj.is_active = True
            prio_obj.save()

        active_prio_ids.append(prio_obj.id)

    Priority.objects.filter(
        pipeline_stage=stage_obj
    ).exclude(id__in=active_prio_ids).update(is_active=False)


def check_stage_leads(user, **data):
    try:
        stage_id = data.get("stage_id")
        if not stage_id:
            raise ValidationError("stage_id is required")

        stage = PipelineStage.objects.filter(id=stage_id).first()
        if not stage:
            raise ValidationError(f"Pipeline stage {stage_id} not found")

        org = _get_org(user)
        leads_qs = Lead.objects.filter(pipeline_stage=stage)
        if org:
            leads_qs = leads_qs.filter(organization=org)

        total_leads = leads_qs.count()
        is_protected = is_protected_core_stage(stage)
        return {
            "stage_id": stage.id,
            "stage_name": stage.display_value or stage.name,
            "leads_count": total_leads,
            "has_leads": total_leads > 0,
            "is_deletable": not is_protected,
            "can_delete": not is_protected,
            "is_system_core": is_protected,
        }
    except ValidationError:
        raise
    except Exception as e:
        raise APIException(str(e))


def transfer_and_delete_pipeline_stage(user, **data):
    try:
        stage_id = data.get("stage_id")
        pipeline_id = data.get("pipeline_id")
        target_stage_id = data.get("target_stage_id")
        target_priority_id = data.get("target_priority_id")
        deletion_reason = data.get("deletion_reason", "")

        if not stage_id:
            raise ValidationError("stage_id is required")

        stage = PipelineStage.objects.filter(id=stage_id).first()
        if not stage:
            raise ValidationError(f"Pipeline stage {stage_id} not found")

        if is_protected_core_stage(stage):
            stage_name = stage.display_value or stage.name
            raise ValidationError(
                f"'{stage_name}' is a core system stage and cannot be deleted. "
                "You can only update its name, color, and tags."
            )

        cat = PipelineCategory.objects.filter(id=pipeline_id).first() if pipeline_id else stage.pipeline_category

        org = _get_org(user)
        affected_leads_qs = Lead.objects.filter(pipeline_stage=stage)
        if org:
            affected_leads_qs = affected_leads_qs.filter(organization=org)

        affected_lead_ids = list(affected_leads_qs.values_list("id", flat=True))
        transferred_count = len(affected_lead_ids)

        target_stage = None
        if target_stage_id:
            target_stage = PipelineStage.objects.filter(id=target_stage_id).first()

        target_priority = None
        if target_priority_id:
            target_priority = Priority.objects.filter(id=target_priority_id).first()

        with transaction.atomic():
            if target_stage and affected_lead_ids:
                update_fields = {"pipeline_stage": target_stage}
                if target_priority:
                    update_fields["priority"] = target_priority
                affected_leads_qs.update(**update_fields)

            stage.is_active = False
            stage.save()

            Priority.objects.filter(pipeline_stage=stage).update(is_active=False)

            log_entry = PipelineStageTranferedData.objects.create(
                original_stage_id=stage.id,
                pipeline_id=cat.id if cat else None,
                pipeline_name=cat.display_name if cat else "",
                stage_name=stage.display_value or stage.name,
                stage_type=stage.stage_type or "standard",
                order_no=stage.order_no,
                organization_id=org.id if org else None,
                organization_name=org.organization_name if org else "",
                leads_transferred_count=transferred_count,
                transferred_lead_ids=affected_lead_ids,
                target_stage_id=target_stage.id if target_stage else None,
                target_stage_name=target_stage.display_value if target_stage else "",
                target_tag_id=target_priority.id if target_priority else None,
                target_tag_name=target_priority.display_value if target_priority else "",
                deletion_reason=deletion_reason,
                deleted_by=user.username if user else "admin"
            )

        return {
            "status": "success",
            "message": "Stage deleted and leads transferred successfully",
            "transferred_leads_count": transferred_count,
            "log_id": log_entry.id
        }
    except ValidationError:
        raise
    except Exception as e:
        raise APIException(str(e))


def check_tag_leads(user, **data):
    try:
        tag_id = data.get("tag_id")
        tag_name = data.get("tag_name")
        stage_id = data.get("stage_id")

        prio = None
        if tag_id:
            prio = Priority.objects.filter(id=tag_id).first()
        elif tag_name:
            prio = Priority.objects.filter(name__iexact=str(tag_name).strip()).first()

        if not prio:
            return {"tag_id": tag_id, "tag_name": tag_name, "leads_count": 0, "has_leads": False}

        org = _get_org(user)
        leads_qs = Lead.objects.filter(priority=prio)
        if stage_id:
            leads_qs = leads_qs.filter(pipeline_stage_id=stage_id)
        if org:
            leads_qs = leads_qs.filter(organization=org)

        total_leads = leads_qs.count()
        return {
            "tag_id": prio.id,
            "tag_name": prio.display_value or prio.name,
            "leads_count": total_leads,
            "has_leads": total_leads > 0,
        }
    except ValidationError:
        raise
    except Exception as e:
        raise APIException(str(e))


def transfer_and_delete_pipeline_tag(user, **data):
    try:
        tag_id = data.get("tag_id")
        tag_name = data.get("tag_name")
        stage_id = data.get("stage_id")
        pipeline_id = data.get("pipeline_id")
        target_stage_id = data.get("target_stage_id")
        target_tag_id = data.get("target_tag_id")
        deletion_reason = data.get("deletion_reason", "")

        prio = None
        if tag_id:
            prio = Priority.objects.filter(id=tag_id).first()
        elif tag_name:
            prio = Priority.objects.filter(name__iexact=str(tag_name).strip()).first()

        if not prio:
            raise ValidationError("Target priority/tag to delete not found")

        org = _get_org(user)
        affected_leads_qs = Lead.objects.filter(priority=prio)
        if stage_id:
            affected_leads_qs = affected_leads_qs.filter(pipeline_stage_id=stage_id)
        if org:
            affected_leads_qs = affected_leads_qs.filter(organization=org)

        affected_lead_ids = list(affected_leads_qs.values_list("id", flat=True))
        transferred_count = len(affected_lead_ids)

        target_stage = PipelineStage.objects.filter(id=target_stage_id).first() if target_stage_id else None
        target_priority = Priority.objects.filter(id=target_tag_id).first() if target_tag_id else None

        with transaction.atomic():
            if affected_lead_ids:
                update_fields = {}
                if target_stage:
                    update_fields["pipeline_stage"] = target_stage
                if target_priority:
                    update_fields["priority"] = target_priority
                if update_fields:
                    affected_leads_qs.update(**update_fields)

            prio.is_active = False
            prio.save()

            stage_obj = prio.pipeline_stage
            cat = PipelineCategory.objects.filter(id=pipeline_id).first() if pipeline_id else (stage_obj.pipeline_category if stage_obj else None)

            log_entry = PipelineStageTranferedData.objects.create(
                original_stage_id=stage_obj.id if stage_obj else 0,
                pipeline_id=cat.id if cat else None,
                pipeline_name=cat.display_name if cat else "",
                stage_name=stage_obj.display_value if stage_obj else "",
                stage_type="tag_deletion",
                organization_id=org.id if org else None,
                organization_name=org.organization_name if org else "",
                leads_transferred_count=transferred_count,
                transferred_lead_ids=affected_lead_ids,
                target_stage_id=target_stage.id if target_stage else None,
                target_stage_name=target_stage.display_value if target_stage else "",
                target_tag_id=target_priority.id if target_priority else None,
                target_tag_name=target_priority.display_value if target_priority else "",
                deletion_reason=deletion_reason,
                deleted_by=user.username if user else "admin"
            )

        return {
            "status": "success",
            "message": "Tag deleted and leads transferred successfully",
            "transferred_leads_count": transferred_count,
            "log_id": log_entry.id
        }
    except ValidationError:
        raise
    except Exception as e:
        raise APIException(str(e))


def fetch_pipeline_stage_tranfered_data(user, **data):
    try:
        pipeline_id = data.get("pipeline_id")
        stage_id = data.get("stage_id")
        limit = int(data.get("limit", 50))

        org = _get_org(user)
        qs = PipelineStageTranferedData.objects.all()
        if org:
            qs = qs.filter(organization_id=org.id)

        if pipeline_id:
            qs = qs.filter(pipeline_id=pipeline_id)
        if stage_id:
            qs = qs.filter(original_stage_id=stage_id)

        logs = qs.order_by("-deleted_at")[:limit]

        result = []
        for l in logs:
            result.append({
                "id": l.id,
                "original_stage_id": l.original_stage_id,
                "pipeline_id": l.pipeline_id,
                "pipeline_name": l.pipeline_name,
                "stage_name": l.stage_name,
                "stage_type": l.stage_type,
                "order_no": l.order_no,
                "organization_id": l.organization_id,
                "organization_name": l.organization_name,
                "leads_transferred_count": l.leads_transferred_count,
                "target_stage_id": l.target_stage_id,
                "target_stage_name": l.target_stage_name,
                "target_tag_id": l.target_tag_id,
                "target_tag_name": l.target_tag_name,
                "deletion_reason": l.deletion_reason,
                "deleted_by": l.deleted_by,
                "deleted_at": l.deleted_at.isoformat() if l.deleted_at else None,
            })
        return result
    except ValidationError:
        raise
    except Exception as e:
        raise APIException(str(e))


def fetch_default_pipeline_stages(user=None, **data):
    
    return {
        "stages_data": [
            {
                "name": s["name"],
                "order_no": s["order_no"],
                "stage_type": s["stage_type"],
                "stage_color": s["stage_color"],
                "isFirst": s["order_no"] == 1,
                "is_deletable": False,
                "can_delete": False,
                "is_system_core": True,
                "tags": s.get("tags", []),
            }
            for s in DEFAULT_CORE_STAGES
        ],
        "terminals_data": {
            k: {
                "name": v["name"],
                "order_no": v["order_no"],
                "stage_type": v["stage_type"],
                "stage_color": v["stage_color"],
                "is_deletable": False,
                "can_delete": False,
                "is_system_core": True,
                "tags": [],
            }
            for k, v in DEFAULT_TERMINALS.items()
        }
    }
