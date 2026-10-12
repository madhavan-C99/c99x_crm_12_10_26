from rest_framework.exceptions import APIException
from django.db.models import Q, Prefetch
from django.db import transaction
from utils.constants import UITheme

from adm.models import (
    PipelineCategory, Organization, PipelineStageTranferedData, PipelineStageDeletedLog
)
from telecalling.models import (
    PipelineStage, Priority, Lead, CampaignName, CallDetails, FollowUp, PaymentInfo
)

DEFAULT_STAGES_BLUEPRINT = [
    {"name": "New Lead", "tags": []},
    {"name": "Follow-up", "tags": ["Prospective", "Interested", "Just follow-up"]},
    {"name": "Unreached", "tags": ["NP", "Busy"]},
    {"name": "Pending", "tags": []},
    {"name": "Contact Attempt", "tags": ["NP W1", "NP W2", "NP W3", "switch Off", "Invalid"]},
    {"name": "Future", "tags": ["Next", "Later"]},
]


def _get_org(user):
    if not user:
        return Organization.objects.first()
    org = getattr(user, 'organization', None)
    if not org and hasattr(user, 'organization_id') and user.organization_id:
        org = Organization.objects.filter(id=user.organization_id).first()
    if not org:
        org = Organization.objects.first()
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

    return {
        "id": stage.id,
        "name": stage.display_value or stage.name,
        "order_no": stage.order_no,
        "stage_type": stage.stage_type,
        "isFirst": stage.order_no == 1,
        "tags": tags_list,
    }


def fetch_pipeline_categories(user, **data):
    
    try:
        org = _get_org(user)
        qs = PipelineCategory.objects.filter(is_active=True)
        if org:
            qs = qs.filter(Q(organization=org) | Q(organization__isnull=True))

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
                    "tags": [],
                },
                "closed": {
                    "id": "closed",
                    "name": "Loss",
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
    except Exception as e:
        raise APIException(str(e))


def create_pipeline_category(user, **data):
   
    try:
        name = data.get("name")
        if not name or not name.strip():
            raise APIException("Pipeline category name is required")

        trimmed_name = name.strip()
        org = _get_org(user)

        qs = PipelineCategory.objects.filter(
            category_name__iexact=trimmed_name,
            is_active=True
        )
        if org:
            qs = qs.filter(Q(organization=org) | Q(organization__isnull=True))

        if qs.exists():
            raise APIException(f"Pipeline Category with name '{trimmed_name}' already exists.")

        is_def = bool(data.get("is_default", False))
        if is_def:
            defaults_qs = PipelineCategory.objects.filter(is_active=True)
            if org:
                defaults_qs = defaults_qs.filter(Q(organization=org) | Q(organization__isnull=True))
            defaults_qs.update(is_default=False)

        cat = PipelineCategory.objects.create(
            category_name=trimmed_name,
            display_name=trimmed_name,
            organization=org,
            is_default=is_def,
            is_active=True,
            created_by=user.username if user else "admin"
        )

        stages_input = data.get("stages") or DEFAULT_STAGES_BLUEPRINT
        for idx, s_info in enumerate(stages_input):
            s_name = s_info.get("name") if isinstance(s_info, dict) else str(s_info)
            s_tags = s_info.get("tags", []) if isinstance(s_info, dict) else []

            stage_obj = PipelineStage.objects.create(
                pipeline_category=cat,
                organization=org,
                name=s_name,
                display_value=s_name,
                order_no=idx + 1,
                stage_type="open",
                is_active=True,
                created_by=user.username if user else "admin"
            )
            _sync_stage_priorities(stage_obj, s_tags)

        terminals_input = data.get("terminals") or {}
        joined_name = terminals_input.get("joined", {}).get("name", "Joined") if isinstance(terminals_input.get("joined"), dict) else "Joined"
        joined_tags = terminals_input.get("joined", {}).get("tags", []) if isinstance(terminals_input.get("joined"), dict) else []

        st_joined = PipelineStage.objects.create(
            pipeline_category=cat,
            organization=org,
            name=joined_name,
            display_value=joined_name,
            order_no=98,
            stage_type="closed_won",
            is_active=True,
            created_by=user.username if user else "admin"
        )
        _sync_stage_priorities(st_joined, joined_tags)

        closed_name = terminals_input.get("closed", {}).get("name", "Closed") if isinstance(terminals_input.get("closed"), dict) else "Closed"
        closed_tags = terminals_input.get("closed", {}).get("tags", []) if isinstance(terminals_input.get("closed"), dict) else []

        st_closed = PipelineStage.objects.create(
            pipeline_category=cat,
            organization=org,
            name=closed_name,
            display_value=closed_name,
            order_no=99,
            stage_type="closed_lost",
            is_active=True,
            created_by=user.username if user else "admin"
        )
        _sync_stage_priorities(st_closed, closed_tags)

        all_cats = fetch_pipeline_categories(user)
        created_item = next((c for c in all_cats if c["id"] == cat.id), None)
        return created_item or {"id": cat.id, "display_name": cat.display_name}
    except Exception as e:
        raise APIException(str(e))


def update_pipeline_stages(user, **data):
    
    try:
        pipeline_id = data.get("pipeline_id")
        if not pipeline_id:
            raise APIException("pipeline_id is required")

        cat = PipelineCategory.objects.filter(id=pipeline_id).first()
        if not cat:
            raise APIException(f"Pipeline with id {pipeline_id} not found")

        org = _get_org(user)
        display_name = data.get("display_name") or data.get("name")
        if display_name and display_name.strip():
            trimmed_display = display_name.strip()
            collision_qs = PipelineCategory.objects.filter(
                category_name__iexact=trimmed_display,
                is_active=True
            ).exclude(id=cat.id)
            if org:
                collision_qs = collision_qs.filter(Q(organization=org) | Q(organization__isnull=True))
            if collision_qs.exists():
                raise APIException(f"Another pipeline with the name '{trimmed_display}' already exists.")

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
                    other_defaults = other_defaults.filter(Q(organization=org) | Q(organization__isnull=True))
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
                order_no = idx + 1

                stage_obj = None
                if isinstance(raw_id, int):
                    stage_obj = PipelineStage.objects.filter(id=raw_id, pipeline_category=cat).first()

                if not stage_obj:
                    stage_obj = PipelineStage.objects.create(
                        pipeline_category=cat,
                        organization=org,
                        name=stage_name,
                        display_value=stage_name,
                        order_no=order_no,
                        stage_type="open",
                        is_active=True,
                        created_by=user.username if user else "admin",
                    )
                else:
                    stage_obj.name = stage_name
                    stage_obj.display_value = stage_name
                    stage_obj.order_no = order_no
                    stage_obj.stage_type = "open"
                    stage_obj.is_active = True
                    stage_obj.save()

                active_stage_ids.append(stage_obj.id)
                _sync_stage_priorities(stage_obj, s_data.get("tags", []))

            PipelineStage.objects.filter(
                pipeline_category=cat,
                stage_type__in=["open", "standard"]
            ).exclude(id__in=active_stage_ids).update(is_active=False)

        if has_terminals:
            incoming_terminals = data.get("terminals") or data.get("terminals_data") or {}

            if "joined" in incoming_terminals:
                t_joined = incoming_terminals["joined"]
                raw_id = t_joined.get("id")
                t_name = t_joined.get("name", "Joined")
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
                        organization=org,
                        name=t_name,
                        display_value=t_name,
                        order_no=98,
                        stage_type="closed_won",
                        is_active=True,
                        created_by=user.username if user else "admin",
                    )
                else:
                    stage_obj.name = t_name
                    stage_obj.display_value = t_name
                    stage_obj.stage_type = "closed_won"
                    stage_obj.is_active = True
                    stage_obj.save()

                _sync_stage_priorities(stage_obj, t_joined.get("tags", []))

            if "closed" in incoming_terminals:
                t_closed = incoming_terminals["closed"]
                raw_id = t_closed.get("id")
                t_name = t_closed.get("name", "Closed")
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
                        organization=org,
                        name=t_name,
                        display_value=t_name,
                        order_no=99,
                        stage_type="closed_lost",
                        is_active=True,
                        created_by=user.username if user else "admin",
                    )
                else:
                    stage_obj.name = t_name
                    stage_obj.display_value = t_name
                    stage_obj.stage_type = "closed_lost"
                    stage_obj.is_active = True
                    stage_obj.save()

                _sync_stage_priorities(stage_obj, t_closed.get("tags", []))

        updated_cats = fetch_pipeline_categories(user)
        updated_item = next((c for c in updated_cats if c["id"] == cat.id), None)
        return updated_item or {"id": cat.id, "display_name": cat.display_name}
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
            raise APIException("stage_id is required")

        stage = PipelineStage.objects.filter(id=stage_id).first()
        if not stage:
            raise APIException(f"Pipeline stage {stage_id} not found")

        org = _get_org(user)
        leads_qs = Lead.objects.filter(pipeline_stage=stage)
        if org:
            leads_qs = leads_qs.filter(Q(organization=org) | Q(organization__isnull=True))

        total_leads = leads_qs.count()
        return {
            "stage_id": stage.id,
            "stage_name": stage.display_value or stage.name,
            "leads_count": total_leads,
            "has_leads": total_leads > 0,
        }
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
            raise APIException("stage_id is required")

        stage = PipelineStage.objects.filter(id=stage_id).first()
        if not stage:
            raise APIException(f"Pipeline stage {stage_id} not found")

        cat = PipelineCategory.objects.filter(id=pipeline_id).first() if pipeline_id else stage.pipeline_category

        org = _get_org(user)
        affected_leads_qs = Lead.objects.filter(pipeline_stage=stage)
        if org:
            affected_leads_qs = affected_leads_qs.filter(Q(organization=org) | Q(organization__isnull=True))

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
            leads_qs = leads_qs.filter(Q(organization=org) | Q(organization__isnull=True))

        total_leads = leads_qs.count()
        return {
            "tag_id": prio.id,
            "tag_name": prio.display_value or prio.name,
            "leads_count": total_leads,
            "has_leads": total_leads > 0,
        }
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
            raise APIException("Target priority/tag to delete not found")

        org = _get_org(user)
        affected_leads_qs = Lead.objects.filter(priority=prio)
        if stage_id:
            affected_leads_qs = affected_leads_qs.filter(pipeline_stage_id=stage_id)
        if org:
            affected_leads_qs = affected_leads_qs.filter(Q(organization=org) | Q(organization__isnull=True))

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
    except Exception as e:
        raise APIException(str(e))


def fetch_pipeline_stage_tranfered_data(user, **data):
    """
    Fetch transferred and audit records from adm_pipeline_stage_tranfered_data.
    """
    try:
        pipeline_id = data.get("pipeline_id")
        stage_id = data.get("stage_id")
        limit = int(data.get("limit", 50))

        org = _get_org(user)
        qs = PipelineStageTranferedData.objects.all()
        if org:
            qs = qs.filter(Q(organization_id=org.id) | Q(organization_id__isnull=True))

        if pipeline_id:
            qs = qs.filter(pipeline_id=pipeline_id)
        if stage_id:
            qs = qs.filter(original_stage_id=stage_id)

        logs = qs.order_by("-deleted_at")[:limit]

        result = []
        for log in logs:
            result.append({
                "id": log.id,
                "pipeline_id": log.pipeline_id,
                "pipeline_name": log.pipeline_name,
                "original_stage_id": log.original_stage_id,
                "stage_name": log.stage_name,
                "stage_type": log.stage_type,
                "order_no": log.order_no,
                "organization_id": log.organization_id,
                "organization_name": log.organization_name,
                "leads_transferred_count": log.leads_transferred_count,
                "transferred_lead_ids": log.transferred_lead_ids,
                "target_stage_id": log.target_stage_id,
                "target_stage_name": log.target_stage_name,
                "target_tag_id": log.target_tag_id,
                "target_tag_name": log.target_tag_name,
                "deletion_reason": log.deletion_reason,
                "deleted_by": log.deleted_by,
                "deleted_at": log.deleted_at.strftime("%Y-%m-%d %H:%M:%S") if log.deleted_at else ""
            })

        return result
    except Exception as e:
        raise APIException(str(e))
