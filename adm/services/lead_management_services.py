from django.db.models import Q
from rest_framework.exceptions import APIException
from django.utils import timezone
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
        mobile_no = data.get("mobile_no", "").strip()
        email = data.get("email", "").strip() or None
        campaign_id = data.get("campaign_id")
        lead_source_id = data.get("lead_source_id")
        assigned_to_id = data.get("assigned_to_id")
        enquiry_date = data.get("enquiry_date")

        if not full_name:
            raise APIException("First Name or Full Name is required")
        if not mobile_no:
            raise APIException("Mobile Number is required")

        user_org = getattr(user, 'organization', None) if (user and getattr(user, 'is_authenticated', False)) else None

        # Check duplicate mobile number
        dup_qs = Lead.objects.filter(mobile_no=mobile_no)
        if user_org:
            dup_qs = dup_qs.filter(organization=user_org)
        if dup_qs.exists():
            existing = dup_qs.first()
            raise APIException(f"Mobile number {mobile_no} already exists (Lead: {existing.full_name})")

        # Get default 'new lead' stage
        stage_qs = PipelineStage.objects.filter(name__iexact="new lead")
        if user_org:
            stage_qs = stage_qs.filter(organization=user_org)
        stage = stage_qs.first() or PipelineStage.objects.filter(name__iexact="new lead").first()
        stage_id = stage.id if stage else 1

        creator = (getattr(user, "username", None) if user and hasattr(user, "username") else None) or "admin"

        lead = Lead.objects.create(
            full_name=full_name,
            mobile_no=mobile_no,
            email=email,
            campaign_id=campaign_id,
            lead_source_id=lead_source_id,
            pipeline_stage_id=stage_id,
            assigned_to_id=assigned_to_id,
            enquiry_date=enquiry_date or timezone.now(),
            created_by=creator,
            organization=user_org
        )

        return {
            "message": f"Lead {lead.full_name} Created Successfully",
            "lead_id": lead.id,
            "full_name": lead.full_name,
            "mobile_no": lead.mobile_no
        }
    except Exception as e:
        raise APIException(str(e))