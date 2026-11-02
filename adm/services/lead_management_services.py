import re
from django.db.models import Q
from rest_framework.exceptions import APIException, ValidationError
from django.utils import timezone
from adm.tasks import trigger_dashboard_update_task
from adm.models.user import User
from telecalling.models.leads import Lead, CampaignName, LeadSource, PipelineStage
from adm.models.pipeline_category import PipelineCategory


def fetch_add_lead_dropdowns(user, **data):
    try:
        campaigns_qs = CampaignName.objects.filter(is_active=True)
        categories_qs = PipelineCategory.objects.filter(is_active=True)
        sources_qs = LeadSource.objects.filter(is_active=True)
        telecallers_qs = User.objects.filter(is_active=True).filter(
            Q(user_roles__role__name__iexact="telecaller") | 
            Q(user_roles__role__name__iexact="executive") | 
            Q(user_roles__role__code__in=["TEL", "EXE"]) | 
            Q(user_type__icontains="telecaller") |
            Q(user_type__icontains="executive")
        ).distinct()
        
        user_org = getattr(user, 'organization', None) if (user and getattr(user, 'is_authenticated', False)) else None
        if not user_org:
            return {
                "campaigns": [],
                "pipeline_categories": [],
                "sources": [],
                "users": [],
            }

        campaigns_qs = campaigns_qs.filter(organization=user_org)
        categories_qs = categories_qs.filter(organization=user_org)
        sources_qs = sources_qs.filter(organization=user_org)
        telecallers_qs = telecallers_qs.filter(organization=user_org)

        campaigns = campaigns_qs.values("id", "name").order_by("id")
        categories = categories_qs.values("id", "category_name", "display_name").order_by("id")
        sources = sources_qs.values("id", "name").order_by("id")
        telecallers = telecallers_qs.values(
            "id", "username", "first_name", "last_name"
        ).order_by("id")

        users_list = []
        for t in telecallers:
            name = f"{t['first_name'] or ''} {t['last_name'] or ''}".strip() or t["username"]
            users_list.append({"id": t["id"], "name": name, "username": t["username"]})

        return {
            "campaigns": list(campaigns),
            "pipeline_categories": list(categories),
            "sources": list(sources),
            "users": users_list,
        }
    except Exception as e:
        raise APIException(str(e))


def create_new_lead(user, **data):
    try:
        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()
        full_name = f"{first_name} {last_name}".strip()
        raw_mobile = str(data.get("mobile_no") or "").strip()
        email = data.get("email", "").strip() or None
        campaign_id = data.get("campaign_id")
        lead_source_id = data.get("lead_source_id")
        assigned_to_id = data.get("assigned_to_id")
        enquiry_date = data.get("enquiry_date")

        if not full_name:
            raise ValidationError("First Name or Full Name is required")
        if not raw_mobile:
            raise ValidationError("Mobile Number is required")

        clean_digits = re.sub(r"\D", "", raw_mobile)
        if len(clean_digits) == 12 and clean_digits.startswith("91"):
            mobile_no = clean_digits[2:]
        elif len(clean_digits) == 11 and clean_digits.startswith("0"):
            mobile_no = clean_digits[1:]
        else:
            mobile_no = clean_digits

        if not re.fullmatch(r"[6-9]\d{9}", mobile_no):
            raise ValidationError(f"Invalid Indian mobile number: '{raw_mobile}'. Must be a 10-digit number starting with 6, 7, 8, or 9.")

        user_org = getattr(user, 'organization', None) if (user and getattr(user, 'is_authenticated', False)) else None

        # Check duplicate mobile number
        dup_qs = Lead.objects.filter(mobile_no=mobile_no)
        if user_org:
            dup_qs = dup_qs.filter(organization=user_org)
        if dup_qs.exists():
            existing = dup_qs.first()
            raise ValidationError(f"Mobile number {mobile_no} already exists (Lead: {existing.full_name})")

        # Validate assigned telecaller active & assignment permissions
        if assigned_to_id:
            agent_qs = User.objects.filter(id=assigned_to_id, is_active=True)
            if user_org:
                agent_qs = agent_qs.filter(organization=user_org)
            agent = agent_qs.first()
            if not agent:
                raise ValidationError("Selected telecaller not found or is inactive.")
            if getattr(agent, 'disable_lead_assignment', False):
                raise ValidationError(f"Telecaller '{agent.username}' is currently paused from lead assignments.")

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
            enquiry_date=enquiry_date or timezone.now(),
            created_by=creator,
            organization=user_org
        )

        try:
            trigger_dashboard_update_task()
        except Exception:
            pass

        return {
            "message": f"Lead {lead.full_name} Created Successfully",
            "lead_id": lead.id,
            "full_name": lead.full_name,
            "mobile_no": lead.mobile_no
        }
    except Exception as e:
        raise APIException(str(e))
