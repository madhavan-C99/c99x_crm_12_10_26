import logging
from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import ValidationError

from adm.models.campaign_assigned_agent import campaign_assigned_agent
from adm.models.pipeline_category import PipelineCategory
from adm.models.user import User
from adm.services.query_services import exec_raw_sql
from adm.tasks import trigger_dashboard_update_task
from telecalling.models.leads import CampaignName, Lead

logger = logging.getLogger(__name__)


def fetch_pipeline_categories(user, **data):
    org_id = getattr(user, 'organization_id', None) if user else None
    return exec_raw_sql('L_CATEGORIES', {'organization_id': org_id} if org_id else {}) or []


def create_campaign(user, **data):
    name = (data.get("name") or "").strip()
    if not name:
        raise ValidationError("Campaign Name is required.")

    user_org = getattr(user, 'organization', None) if (user and getattr(user, 'is_authenticated', False)) else None
    
    # Duplicate Campaign Name Check
    dupe_qs = CampaignName.objects.filter(name__iexact=name)
    if user_org:
        dupe_qs = dupe_qs.filter(organization=user_org)
    if dupe_qs.exists():
        raise ValidationError("A campaign with this name already exists.")

    p_cat_id = data.get("pipeline_id") or data.get("pipeline_category_id")
    if p_cat_id and not PipelineCategory.objects.filter(id=p_cat_id).exists():
        raise ValidationError("Selected pipeline category not found.")

    manager_id = data.get("manager_id")
    if manager_id and not User.objects.filter(id=manager_id).exists():
        raise ValidationError("Selected campaign manager not found.")

    with transaction.atomic():
        campaign = CampaignName.objects.create(
            name=name,
            pipeline_category_id=p_cat_id,
            manager_id=manager_id,
            lead_distribution_type=data.get("distribution_type", "on_demand"),
            created_by=getattr(user, "username", "admin"),
            organization=user_org
        )

        agent_ids = data.get("agent_ids", [])
        agent_objs = []
        if agent_ids:
            valid_agents = list(User.objects.filter(id__in=agent_ids).values_list('id', flat=True))
            agent_objs = [
                campaign_assigned_agent(campaign=campaign, agent_user_id=aid)
                for aid in valid_agents
            ]
            if agent_objs:
                campaign_assigned_agent.objects.bulk_create(agent_objs)

        try:
            trigger_dashboard_update_task()
        except Exception:
            pass

    return {
        "campaign_id": campaign.id,
        "campaign_name": campaign.name,
        "pipeline_category_id": campaign.pipeline_category_id,
        "manager_id": campaign.manager_id,
        "distribution_type": campaign.lead_distribution_type,
        "assigned_agents_count": len(agent_objs),
        "message": f"Campaign '{campaign.name}' created successfully."
    }


def toggle_campaign_status(user, **data):
    campaign_id = data.get("campaign_id")
    if not campaign_id:
        raise ValidationError("Campaign ID is required.")

    user_org = getattr(user, 'organization', None) if (user and getattr(user, 'is_authenticated', False)) else None
    qs = CampaignName.objects.filter(id=campaign_id)
    if user_org:
        qs = qs.filter(organization=user_org)
    campaign = qs.first()
    if not campaign:
        raise ValidationError("Campaign not found.")

    campaign.is_active = bool(data.get("is_active", True))
    campaign.save(update_fields=['is_active'])

    try:
        trigger_dashboard_update_task()
    except Exception:
        pass

    status_text = "Resumed" if campaign.is_active else "Paused"
    return {
        "campaign_id": campaign.id,
        "campaign_name": campaign.name,
        "is_active": campaign.is_active,
        "message": f"Campaign '{campaign.name}' {status_text} successfully."
    }


def fetch_campaign_detail(user, **data):
    org_id = getattr(user, 'organization_id', None) if user else None
    p_id = data.get("pipeline_id") or 0
    c_id = data.get("campaign_id") or 0
    c_name = str(data.get("campaign_name") or "").strip()

    if not c_id and not c_name:
        raise ValidationError("Campaign ID or Campaign Name is required.")

    # Find Campaign object for validation
    camp_obj = None
    if c_id:
        camp_obj = CampaignName.objects.filter(id=c_id).first()
    elif c_name:
        camp_obj = CampaignName.objects.filter(name__iexact=c_name).first()

    if not camp_obj:
        raise ValidationError("Campaign not found.")

    # Strict Pipeline Mismatch Warning
    if p_id:
        camp_pipe_id = camp_obj.pipeline_category_id or 0
        if camp_pipe_id and camp_pipe_id != p_id:
            pipe_obj = PipelineCategory.objects.filter(id=p_id).first()
            pipe_name = getattr(pipe_obj, 'category_name', '') or getattr(pipe_obj, 'display_name', '') or p_id
            raise ValidationError(
                f"Campaign '{camp_obj.name}' (ID {camp_obj.id}) does not belong to Pipeline '{pipe_name}' (ID {p_id})."
            )

    campaign_info = exec_raw_sql('D_FETCH_CAMPAIGN_DETAIL', {
        'organization_id': org_id,
        'campaign_id': camp_obj.id,
        'campaign_name': c_name
    })

    if not campaign_info:
        detail = {
            "campaign_id": camp_obj.id,
            "campaign_name": camp_obj.name,
            "pipeline_id": camp_obj.pipeline_category_id,
            "pipeline_name": camp_obj.pipeline_category.category_name if camp_obj.pipeline_category else "",
            "manager_id": camp_obj.manager_id,
            "manager_name": getattr(camp_obj.manager, 'username', '') if camp_obj.manager else "",
            "is_active": camp_obj.is_active,
            "lead_distribution_type": camp_obj.lead_distribution_type,
            "agents": []
        }
    else:
        detail = campaign_info[0]

    raw_agents = exec_raw_sql('D_FETCH_CAMPAIGN_AGENTS', {
        'organization_id': org_id,
        'campaign_id': detail.get('campaign_id') or camp_obj.id
    }) or []
    detail['agents'] = [a for a in raw_agents if a.get('is_assigned') is True]

    if 'name' in detail and not detail.get('campaign_name'):
        detail['campaign_name'] = detail['name']
    if 'campaign_name' in detail and not detail.get('name'):
        detail['name'] = detail['campaign_name']

    return detail


def update_campaign_detail(user, **data):
    c_id = data.get("campaign_id")
    c_name = data.get("campaign_name")
    if not c_id and not c_name:
        raise ValidationError("Campaign ID or Campaign Name is required.")

    user_org = getattr(user, 'organization', None) if (user and getattr(user, 'is_authenticated', False)) else None
    camp_qs = CampaignName.objects.all()
    if user_org:
        camp_qs = camp_qs.filter(organization=user_org)
    campaign = camp_qs.filter(id=c_id).first() if c_id else camp_qs.filter(name__iexact=str(c_name).strip()).first()
    if not campaign:
        raise ValidationError("Campaign not found.")

    with transaction.atomic():
        update_fields = []
        if data.get("is_active") is not None:
            campaign.is_active = data["is_active"]
            update_fields.append("is_active")
        if data.get("lead_distribution_type"):
            campaign.lead_distribution_type = data["lead_distribution_type"]
            update_fields.append("lead_distribution_type")
        if update_fields:
            campaign.save(update_fields=update_fields)

        agent_notes = []
        for item in data.get("agent_toggles", []):
            agent_id = item.get("agent_id")
            new_status = item.get("is_active")
            if agent_id is not None and new_status is not None:
                ca, _ = campaign_assigned_agent.objects.get_or_create(campaign=campaign, agent_user_id=agent_id)
                ca.is_active = new_status
                ca.save()

                # Manual Control: Toggling OFF stops new incoming leads.
                # Inform admin if the agent still holds active leads so admin can choose to transfer manually.
                if new_status is False:
                    held_count = Lead.objects.filter(campaign=campaign, assigned_to_id=agent_id).exclude(pipeline_stage__stage_type='closed_won').count()
                    if held_count > 0:
                        agent_notes.append(f"Agent #{agent_id} paused from new leads ({held_count} active leads remain assigned; use Transfer Leads if you wish to reassign).")

        try:
            trigger_dashboard_update_task()
        except Exception:
            pass

    msg = "Campaign details updated successfully."
    if agent_notes:
        msg += " " + " ".join(agent_notes)

    return {
        "campaign_id": campaign.id,
        "campaign_name": campaign.name,
        "is_active": campaign.is_active,
        "lead_distribution_type": campaign.lead_distribution_type,
        "message": msg
    }


def delete_campaign(user, **data):
    campaign_id = data.get("campaign_id")
    if not campaign_id:
        raise ValidationError("Campaign ID is required.")

    user_org = getattr(user, 'organization', None) if (user and getattr(user, 'is_authenticated', False)) else None
    qs = CampaignName.objects.filter(id=campaign_id)
    if user_org:
        qs = qs.filter(organization=user_org)
    campaign = qs.first()
    if not campaign:
        raise ValidationError(f"Campaign with ID {campaign_id} not found.")

    lead_count = Lead.objects.filter(campaign=campaign).count()
    if lead_count > 0:
        lead_word = "lead" if lead_count == 1 else "leads"
        raise ValidationError(
            f"Cannot delete campaign '{campaign.name}'. It contains {lead_count} {lead_word}. "
            f"Please reassign or delete these leads before deleting the campaign."
        )

    campaign_name = campaign.name
    user_id = user.id if (user and getattr(user, 'is_authenticated', False)) else None

    with transaction.atomic():
        campaign_assigned_agent.objects.filter(campaign=campaign).delete()
        campaign.save_delete(user_id=user_id)

        try:
            trigger_dashboard_update_task()
        except Exception:
            pass

    return {
        "campaign_id": campaign_id,
        "campaign_name": campaign_name,
        "message": f"Campaign '{campaign_name}' deleted successfully."
    }