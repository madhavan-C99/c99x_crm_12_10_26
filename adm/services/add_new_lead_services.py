import re
from django.db.models import Q
from rest_framework.exceptions import APIException, ValidationError
from django.utils import timezone
from datetime import datetime, date
from adm.models import campaign_assigned_agent, PipelineCategory, User
from telecalling.models.leads import Lead, CampaignName, LeadSource, PipelineStage
from adm.tasks import trigger_dashboard_update_task


def fetch_add_lead_dropdowns(user, **data):
    try:
        campaign_id = data.get("campaign_id")
        campaign_name = data.get("campaign_name")

        campaigns_qs = CampaignName.objects.filter(is_active=True)
        categories_qs = PipelineCategory.objects.filter(is_active=True)
        sources_qs = LeadSource.objects.filter(is_active=True)
        telecallers_qs = User.objects.filter(is_active=True).filter(
            Q(user_roles__role__name__iexact="telecaller") | 
            Q(user_roles__role__code__iexact="TEL") | 
            Q(user_type__icontains="telecaller")
        ).distinct()

        if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization', None):
            campaigns_qs = campaigns_qs.filter(organization=user.organization)
            categories_qs = categories_qs.filter(organization=user.organization)
            sources_qs = sources_qs.filter(organization=user.organization)
            telecallers_qs = telecallers_qs.filter(organization=user.organization)

        campaigns = campaigns_qs.values("id", "name").order_by("id")
        categories = categories_qs.values("id", "category_name", "display_name").order_by("id")
        sources = sources_qs.values("id", "name").order_by("id")

        telecallers = telecallers_qs.values(
            "id", "username", "first_name", "last_name"
        ).order_by("id")

        campaign = None
        campaign_check_qs = CampaignName.objects.all()
        if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization', None):
            campaign_check_qs = campaign_check_qs.filter(organization=user.organization)

        if campaign_id:
            campaign = campaign_check_qs.filter(id=campaign_id).first()
        elif campaign_name:
            campaign = campaign_check_qs.filter(name__iexact=campaign_name.strip()).first()

        assigned_map = {}
        if campaign:
            assigned_map = {
                ca.agent_user_id: ca.is_active
                for ca in campaign_assigned_agent.objects.filter(campaign=campaign)
            }

        users_list = []
        for t in telecallers:
            name = f"{t['first_name'] or ''} {t['last_name'] or ''}".strip() or t["username"]
            is_active_for_campaign = assigned_map.get(t["id"], True) if campaign else True
            users_list.append({
                "id": t["id"],
                "name": name,
                "username": t["username"],
                "is_active_for_campaign": is_active_for_campaign,
            })

        return {
            "campaigns": list(campaigns),
            "pipeline_categories": list(categories),
            "sources": list(sources),
            "users": users_list,
        }
    except ValidationError:
        raise
    except Exception as e:
        raise APIException(str(e))


def create_new_lead(user, **data):
    try:
        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()
        full_name = f"{first_name} {last_name}".strip()
        mobile_no = data.get("mobile_no", "").strip()
        email = data.get("email", "").strip() or None
        campaign_id = data.get("campaign_id")
        lead_source_id = data.get("lead_source_id")
        assigned_to_id = data.get("assigned_to_id")
        enquiry_date_raw = data.get("enquiry_date")

        if not full_name:
            raise ValidationError("First Name or Full Name is required")
        if not mobile_no:
            raise ValidationError("Mobile Number is required")

        clean_digits = "".join(filter(str.isdigit, str(mobile_no)))
        if len(clean_digits) == 12 and clean_digits.startswith("91"):
            mobile_no = clean_digits[2:]
        elif len(clean_digits) == 11 and clean_digits.startswith("0"):
            mobile_no = clean_digits[1:]
        else:
            mobile_no = clean_digits

        if len(mobile_no) != 10:
            raise ValidationError(f"Mobile number must be exactly 10 digits. (Received {len(mobile_no)} digits)")
        if not re.fullmatch(r"[6-9]\d{9}", mobile_no):
            raise ValidationError("Invalid mobile number. Must start with 6, 7, 8, or 9.")

        user_org = getattr(user, 'organization', None) if (user and getattr(user, 'is_authenticated', False)) else None

        # Check duplicate mobile number
        dup_qs = Lead.objects.filter(mobile_no=mobile_no)
        if user_org:
            dup_qs = dup_qs.filter(organization=user_org)
        if dup_qs.exists():
            existing = dup_qs.first()
            raise ValidationError(f"Mobile number {mobile_no} already exists (Lead: {existing.full_name})")

        # Check if selected agent has lead assignment disabled or is paused for campaign
        if assigned_to_id:
            assigned_user = User.objects.filter(id=assigned_to_id).first()
            if assigned_user and assigned_user.disable_lead_assignment:
                raise ValidationError("Selected telecaller has lead assignment disabled!")

        if assigned_to_id and campaign_id:
            ca = campaign_assigned_agent.objects.filter(campaign_id=campaign_id, agent_user_id=assigned_to_id).first()
            if ca and not ca.is_active:
                raise ValidationError("Selected telecaller is currently paused/disabled for this campaign!")

        # Parse date safely
        parsed_date = None
        if enquiry_date_raw:
            try:
                if isinstance(enquiry_date_raw, str) and enquiry_date_raw.strip():
                    raw_str = enquiry_date_raw.strip()
                    if "-" in raw_str:
                        parts = raw_str.split("-")
                        if len(parts) == 3 and len(parts[0]) == 4:
                            parsed_date = datetime.strptime(raw_str, "%Y-%m-%d")
                        elif len(parts) == 3 and len(parts[2]) == 4:
                            parsed_date = datetime.strptime(raw_str, "%d-%m-%Y")
                elif isinstance(enquiry_date_raw, (date, datetime)):
                    parsed_date = enquiry_date_raw
            except Exception:
                parsed_date = timezone.now()

        if not parsed_date:
            parsed_date = timezone.now()

        creator = (getattr(user, "username", None) if user and hasattr(user, "username") else None) or "admin"
        p_id = data.get("pipeline_id") or data.get("pipeline_category_id")

        # Resolve pipeline stage: check if provided in data or pick first stage of the pipeline
        input_stage = data.get("pipeline_stage_id") or data.get("stage_id") or data.get("stage")
        stage = None
        if input_stage is not None and str(input_stage).strip() != "":
            if str(input_stage).isdigit():
                stage = PipelineStage.objects.filter(id=int(input_stage)).first()
            else:
                s_qs = PipelineStage.objects.filter(name__iexact=str(input_stage).strip())
                if p_id and str(p_id).isdigit():
                    s_qs = s_qs.filter(pipeline_category_id=int(p_id))
                stage = s_qs.first()

        if not stage and p_id and str(p_id).isdigit():
            stage = PipelineStage.objects.filter(pipeline_category_id=int(p_id), is_active=True).order_by("order_no", "id").first()

        if not stage:
            stage_qs = PipelineStage.objects.filter(is_active=True)
            if user_org:
                stage_qs = stage_qs.filter(organization=user_org)
            stage = stage_qs.order_by("order_no", "id").first()

        stage_id = stage.id if stage else None

        if not p_id and stage and getattr(stage, 'pipeline_category_id', None):
            p_id = stage.pipeline_category_id
        if not p_id:
            from adm.models.pipeline_category import PipelineCategory
            default_p = PipelineCategory.objects.filter(is_active=True).order_by('id').first()
            if default_p:
                p_id = default_p.id

        lead = Lead.objects.create(
            full_name=full_name,
            mobile_no=mobile_no,
            email=email,
            pipeline_id=p_id,
            campaign_id=campaign_id,
            lead_source_id=lead_source_id,
            pipeline_stage_id=stage_id,
            assigned_to_id=assigned_to_id,
            enquiry_date=parsed_date,
            created_by=creator,
            organization=user_org
        )

        try:
            trigger_dashboard_update_task()
        except Exception as _e:
            pass

        return {
            "message": f"Lead {lead.full_name} Created Successfully",
            "lead_id": lead.id,
            "full_name": lead.full_name,
            "mobile_no": lead.mobile_no
        }
    except ValidationError:
        raise
    except Exception as e:
        raise APIException(str(e))
