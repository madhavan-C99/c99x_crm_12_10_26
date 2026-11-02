import logging
from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import ValidationError

from adm.models.campaign_assigned_agent import campaign_assigned_agent
from adm.models.pipeline_category import PipelineCategory
from adm.models.user import User
from adm.services.query_services import exec_raw_sql
from adm.services.admin_dashboard_services import trigger_dashboard_update
from adm.services.lead_services import bulk_transfer_leads_admin
from adm.tasks import trigger_dashboard_update_task
from telecalling.models.leads import CampaignName, Lead

logger = logging.getLogger(__name__)


def fetch_pipeline_categories(request_user=None, user=None, **data):
    current_user = request_user or user
    org_id = getattr(current_user, 'organization_id', None) if current_user else None
    return exec_raw_sql('L_CATEGORIES', {'organization_id': org_id} if org_id else {}) or []


def create_campaign(request_user=None, user=None, **data):
    current_user = request_user or user
    name = (data.get("name") or "").strip()
    if not name:
        raise ValidationError("Campaign Name is required.")

    user_org = getattr(current_user, 'organization', None) if (current_user and getattr(current_user, 'is_authenticated', False)) else None
    
    # Duplicate Campaign Name Check
    dupe_qs = CampaignName.objects.filter(name__iexact=name)
    if user_org:
        dupe_qs = dupe_qs.filter(organization=user_org)
    if dupe_qs.exists():
        raise ValidationError("A campaign with this name already exists.")

    p_cat_id = data.get("pipeline_id") or data.get("pipeline_category_id")
    if p_cat_id and not PipelineCategory.objects.filter(id=p_cat_id).exists():
        raise ValidationError("Selected pipeline category not found.")

    manager_id = data.get("manager_id") or data.get("user_id") or data.get("user")
    if manager_id and not User.objects.filter(id=manager_id).exists():
        raise ValidationError("Selected campaign manager not found.")

    with transaction.atomic():
        dist_input = data.get("distribution_type") or data.get("lead_distribution_type") or "on_demand"
        clean_dist = "equally_shared" if ("equal" in str(dist_input).lower() or "round" in str(dist_input).lower()) else "on_demand"

        campaign = CampaignName.objects.create(
            name=name,
            pipeline_category_id=p_cat_id,
            manager_id=manager_id,
            lead_distribution_type=clean_dist,
            created_by=getattr(current_user, "username", "admin"),
            organization=user_org
        )

        agent_ids = data.get("agent_ids") or data.get("user_ids") or []
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
            trigger_dashboard_update(organization_id=user_org.id if user_org else None)
        except Exception:
            pass
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


def toggle_campaign_status(request_user=None, user=None, **data):
    current_user = request_user or user
    campaign_id = data.get("campaign_id") or data.get("id")
    if not campaign_id:
        raise ValidationError("Campaign ID is required.")

    user_org = getattr(current_user, 'organization', None) if (current_user and getattr(current_user, 'is_authenticated', False)) else None
    qs = CampaignName.objects.filter(id=campaign_id)
    if user_org:
        qs = qs.filter(organization=user_org)
    campaign = qs.first()
    if not campaign:
        raise ValidationError("Campaign not found.")

    campaign.is_active = bool(data.get("is_active", True))
    campaign.save(update_fields=['is_active'])

    try:
        trigger_dashboard_update(organization_id=user_org.id if user_org else None)
    except Exception:
        pass
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


def fetch_campaign_detail(request_user=None, user=None, **data):
    current_user = request_user or user
    org_id = getattr(current_user, 'organization_id', None) if current_user else None
    p_id = data.get("pipeline_id") or 0
    c_id = data.get("campaign_id") or data.get("id") or 0
    c_name = str(data.get("campaign_name") or data.get("name") or "").strip()

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
        'campaign_name': camp_obj.name
    })

    if not campaign_info:
        detail = {
            "campaign_id": camp_obj.id,
            "campaign_name": camp_obj.name,
            "name": camp_obj.name,
            "pipeline_id": camp_obj.pipeline_category_id,
            "pipeline_category_id": camp_obj.pipeline_category_id,
            "pipeline_name": camp_obj.pipeline_category.category_name if camp_obj.pipeline_category else "",
            "manager_id": camp_obj.manager_id,
            "manager_name": getattr(camp_obj.manager, 'username', '') if camp_obj.manager else "",
            "is_active": camp_obj.is_active,
            "lead_distribution_type": camp_obj.lead_distribution_type,
            "distribution_type": camp_obj.lead_distribution_type,
            "agents": []
        }
    else:
        detail = dict(campaign_info[0])

    # Authoritative sync from latest camp_obj model instance
    camp_obj.refresh_from_db()
    detail["campaign_id"] = camp_obj.id
    detail["id"] = camp_obj.id
    detail["campaign_name"] = camp_obj.name
    detail["name"] = camp_obj.name
    detail["pipeline_id"] = camp_obj.pipeline_category_id
    detail["pipeline_category_id"] = camp_obj.pipeline_category_id
    if camp_obj.pipeline_category:
        detail["pipeline_name"] = camp_obj.pipeline_category.category_name
    detail["manager_id"] = camp_obj.manager_id
    if camp_obj.manager:
        mgr_full = (f"{camp_obj.manager.first_name} {camp_obj.manager.last_name}".strip()) or camp_obj.manager.username
        detail["manager_name"] = mgr_full
    detail["is_active"] = camp_obj.is_active
    detail["lead_distribution_type"] = camp_obj.lead_distribution_type
    detail["distribution_type"] = camp_obj.lead_distribution_type

    raw_agents = exec_raw_sql('D_FETCH_CAMPAIGN_AGENTS', {
        'organization_id': org_id,
        'campaign_id': camp_obj.id
    }) or []
    if not isinstance(raw_agents, list):
        raw_agents = []
    
    assigned_agent_ids = list(
        campaign_assigned_agent.objects.filter(campaign=camp_obj, is_active=True).values_list('agent_user_id', flat=True)
    )

    for a in raw_agents:
        a_id = a.get('agent_id') or a.get('id')
        a_name = a.get('user_name') or a.get('name') or ''
        a['id'] = a_id
        a['agent_id'] = a_id
        a['user_id'] = a_id
        a['name'] = a_name
        a['username'] = a_name
        is_assigned = a_id in assigned_agent_ids
        a['is_assigned'] = is_assigned
        a['is_active'] = is_assigned
        a['status'] = is_assigned

    assigned_agents = [a for a in raw_agents if (a.get('agent_id') or a.get('id')) in assigned_agent_ids]

    # Ensure EVERY agent assigned in campaign_assigned_agent is present in assigned_agents
    existing_agent_ids = {a.get('agent_id') or a.get('id') for a in assigned_agents}
    missing_ids = [aid for aid in assigned_agent_ids if aid not in existing_agent_ids]
    if missing_ids:
        missing_users = User.objects.filter(id__in=missing_ids)
        for u in missing_users:
            u_name = (f"{u.first_name} {u.last_name}".strip()) or u.username
            u_item = {
                "agent_id": u.id,
                "id": u.id,
                "user_id": u.id,
                "name": u_name,
                "user_name": u_name,
                "username": u_name,
                "email": u.email or "",
                "mobile": u.mobile or "",
                "is_assigned": True,
                "is_active": True,
                "status": True,
                "leads_count": Lead.objects.filter(campaign=camp_obj, assigned_to=u).count()
            }
            assigned_agents.append(u_item)
            raw_agents.append(u_item)

    # Attach leads_count and assigned_leads to each assigned agent
    for a in assigned_agents:
        aid = a.get('agent_id') or a.get('id')
        if aid and ('leads_count' not in a or a['leads_count'] is None):
            a['leads_count'] = Lead.objects.filter(campaign=camp_obj, assigned_to_id=aid).count()
        a['assigned_leads'] = a.get('leads_count', 0)

    detail['agents'] = assigned_agents
    detail['all_agents'] = raw_agents
    detail['agent_ids'] = assigned_agent_ids
    detail['users'] = assigned_agents
    detail['user_ids'] = assigned_agent_ids
    detail['total_agents'] = len(assigned_agents)

    # Embed stats & telecallers directly into View Campaign response
    from adm.services.enquiry_sheet_services import fetch_campaign_enquiry_sheet
    try:
        enq_data = fetch_campaign_enquiry_sheet(
            user=current_user,
            pipeline_id=camp_obj.pipeline_category_id,
            campaign_id=camp_obj.id,
            campaign_name=camp_obj.name
        )
        detail['stats'] = enq_data.get('stats', [])
        detail['telecallers'] = enq_data.get('telecallers', [])
        detail['total_leads'] = enq_data.get('total_leads', 0)
        detail['totalLeads'] = detail['total_leads']
    except Exception:
        pass

    return detail


def update_campaign_detail(request_user=None, user=None, **data):
    current_user = request_user or (user if hasattr(user, 'organization') else None)
    
    # 1. Service Level Validation & Field Normalization
    c_id = data.get("campaign_id") or data.get("id")
    c_name = (data.get("campaign_name") or data.get("name") or "").strip()
    if not c_id and not c_name:
        raise ValidationError("Campaign ID or Campaign Name is required.")

    # Manager ID Normalization (manager_id, user, user_id)
    mgr_id = data.get("manager_id")
    if mgr_id is None:
        if data.get("user") is not None and not hasattr(data.get("user"), 'organization'):
            mgr_id = data.get("user")
        elif data.get("user_id") is not None:
            mgr_id = data.get("user_id")

    user_org = getattr(current_user, 'organization', None) if (current_user and getattr(current_user, 'is_authenticated', False)) else None
    camp_qs = CampaignName.objects.all()
    if user_org:
        camp_qs = camp_qs.filter(organization=user_org)
    campaign = camp_qs.filter(id=c_id).first() if c_id else camp_qs.filter(name__iexact=str(c_name).strip()).first()
    if not campaign:
        raise ValidationError("Campaign not found.")

    with transaction.atomic():
        update_fields = []

        new_name = c_name
        if new_name and campaign.name != new_name:
            dupe_qs = CampaignName.objects.filter(name__iexact=new_name).exclude(id=campaign.id)
            if user_org:
                dupe_qs = dupe_qs.filter(organization=user_org)
            if dupe_qs.exists():
                raise ValidationError("A campaign with this name already exists.")
            campaign.name = new_name
            update_fields.append("name")

        p_id = data.get("pipeline_id") or data.get("pipeline_category_id")
        if p_id and p_id != campaign.pipeline_category_id:
            if not PipelineCategory.objects.filter(id=p_id).exists():
                raise ValidationError("Selected pipeline category not found.")
            campaign.pipeline_category_id = p_id
            update_fields.append("pipeline_category_id")

        if mgr_id and mgr_id != campaign.manager_id:
            if not User.objects.filter(id=mgr_id).exists():
                raise ValidationError("Selected campaign manager user not found.")
            campaign.manager_id = mgr_id
            update_fields.append("manager_id")

        if data.get("is_active") is not None:
            campaign.is_active = data["is_active"]
            update_fields.append("is_active")

        dist_input = data.get("lead_distribution_type") or data.get("distribution_type")
        if dist_input and campaign.lead_distribution_type != str(dist_input).strip():
            clean_dist = "equally_shared" if ("equal" in str(dist_input).lower() or "round" in str(dist_input).lower()) else "on_demand"
            campaign.lead_distribution_type = clean_dist
            update_fields.append("lead_distribution_type")

        if update_fields:
            campaign.save(update_fields=update_fields)

        # 2. Agent IDs Normalization (agent_ids, user_ids, agents, users)
        raw_agents_list = data.get("agent_ids")
        if raw_agents_list is None:
            raw_agents_list = data.get("user_ids")
        if raw_agents_list is None:
            raw_agents_list = data.get("agents")
        if raw_agents_list is None:
            raw_agents_list = data.get("users")

        agent_notes = []

        if raw_agents_list is not None:
            target_ids = []
            for item in raw_agents_list:
                if isinstance(item, dict):
                    tid = item.get("id") or item.get("agent_id") or item.get("user_id")
                    if tid:
                        try:
                            target_ids.append(int(tid))
                        except (ValueError, TypeError):
                            pass
                else:
                    try:
                        target_ids.append(int(item))
                    except (ValueError, TypeError):
                        pass

            valid_ids = list(User.objects.filter(id__in=target_ids).values_list('id', flat=True))

            # Current assigned agents for this campaign
            current_assignments = campaign_assigned_agent.objects.filter(campaign=campaign)
            current_agent_ids = set(current_assignments.values_list('agent_user_id', flat=True))
            new_target_agent_ids = set(valid_ids)

            # Determine which agents are being removed
            removed_agent_ids = current_agent_ids - new_target_agent_ids

            transfer_dest_id = (
                data.get("transfer_to_user_id") 
                or data.get("transfer_to") 
                or data.get("to_telecaller_id") 
                or data.get("reassign_to")
            )

            for rem_id in removed_agent_ids:
                held_leads_count = Lead.objects.filter(campaign=campaign, assigned_to_id=rem_id).count()
                if held_leads_count > 0:
                    if transfer_dest_id:
                        dest_user = User.objects.filter(id=transfer_dest_id, is_active=True).first()
                        if not dest_user:
                            raise ValidationError(f"Transfer destination user (ID {transfer_dest_id}) not found or is inactive.")
                        if dest_user.id == rem_id:
                            raise ValidationError("Cannot transfer leads to the same agent being removed.")
                        
                        bulk_transfer_leads_admin(
                            user=current_user,
                            from_telecaller_id=rem_id,
                            to_telecaller_id=dest_user.id,
                            campaign_id=campaign.id,
                            reason=f"Transferred from User #{rem_id} upon removal from Campaign '{campaign.name}'"
                        )
                        agent_notes.append(
                            f"Transferred {held_leads_count} leads from agent #{rem_id} to agent '{dest_user.get_full_name() or dest_user.username}'."
                        )
                    else:
                        rem_user = User.objects.filter(id=rem_id).first()
                        rem_name = (f"{rem_user.first_name} {rem_user.last_name}".strip()) or getattr(rem_user, 'username', f'ID {rem_id}') if rem_user else f"ID {rem_id}"
                        lead_word = "lead" if held_leads_count == 1 else "leads"
                        raise ValidationError(
                            f"Cannot remove agent '{rem_name}' from campaign '{campaign.name}'. "
                            f"They currently have {held_leads_count} {lead_word} assigned in this campaign. "
                            f"Please transfer their leads before removing them from the campaign."
                        )

            # Safely delete removed agents from campaign_assigned_agent
            if removed_agent_ids:
                campaign_assigned_agent.objects.filter(
                    campaign=campaign,
                    agent_user_id__in=removed_agent_ids
                ).delete()

            # Add or activate all new/existing valid_ids
            for aid in valid_ids:
                ca, created = campaign_assigned_agent.objects.get_or_create(
                    campaign=campaign,
                    agent_user_id=aid,
                    defaults={
                        'organization': user_org,
                        'pipeline': campaign.pipeline_category,
                        'is_active': True
                    }
                )
                if not created and not ca.is_active:
                    ca.is_active = True
                    ca.save(update_fields=['is_active'])

        # 3. Agent toggles: individual status update
        for item in data.get("agent_toggles", []):
            raw_agent_id = (
                item.get("agent_id") 
                or item.get("user_id") 
                or item.get("user") 
                or item.get("id")
            )
            raw_status = item.get("is_active") if item.get("is_active") is not None else item.get("status")

            if raw_agent_id is not None and raw_status is not None:
                try:
                    agent_id = int(raw_agent_id)
                except (ValueError, TypeError):
                    continue

                new_status = bool(raw_status) if not isinstance(raw_status, str) else raw_status.lower() in ['true', '1', 'active']

                ca, _ = campaign_assigned_agent.objects.get_or_create(
                    campaign=campaign, 
                    agent_user_id=agent_id,
                    defaults={
                        'organization': user_org,
                        'pipeline': campaign.pipeline_category,
                        'is_active': new_status
                    }
                )
                ca.is_active = new_status
                ca.save(update_fields=['is_active'])

                # Manual Control: Toggling OFF stops new incoming leads.
                if new_status is False:
                    held_count = Lead.objects.filter(campaign=campaign, assigned_to_id=agent_id).exclude(pipeline_stage__stage_type='closed_won').count()
                    if held_count > 0:
                        agent_notes.append(f"Agent #{agent_id} paused from new leads ({held_count} active leads remain assigned; use Transfer Leads if you wish to reassign).")

        try:
            trigger_dashboard_update(organization_id=user_org.id if user_org else None)
        except Exception:
            pass

        try:
            trigger_dashboard_update_task()
        except Exception:
            pass

    detail = fetch_campaign_detail(request_user=current_user, campaign_id=campaign.id)

    msg = "Campaign details updated successfully."
    if agent_notes:
        msg += " " + " ".join(agent_notes)

    detail["message"] = msg
    return detail


def delete_campaign(request_user=None, user=None, **data):
    current_user = request_user or user
    campaign_id = data.get("campaign_id") or data.get("id")
    if not campaign_id:
        raise ValidationError("Campaign ID is required.")

    user_org = getattr(current_user, 'organization', None) if (current_user and getattr(current_user, 'is_authenticated', False)) else None
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
    user_id = current_user.id if (current_user and getattr(current_user, 'is_authenticated', False)) else None

    with transaction.atomic():
        campaign_assigned_agent.objects.filter(campaign=campaign).delete()
        campaign.save_delete(user_id=user_id)

        try:
            trigger_dashboard_update(organization_id=user_org.id if user_org else None)
        except Exception:
            pass

        try:
            trigger_dashboard_update_task()
        except Exception:
            pass

    return {
        "campaign_id": campaign_id,
        "campaign_name": campaign_name,
        "message": f"Campaign '{campaign_name}' deleted successfully."
    }