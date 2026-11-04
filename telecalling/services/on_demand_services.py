import json
import logging
from django.db import transaction
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework.exceptions import APIException

from telecalling.models.leads import Lead, PipelineStage
from adm.models.user import User

logger = logging.getLogger(__name__)


def serialize_pool_lead(lead):
    """
    Format a Lead model instance into an On-Demand Pool lead object.
    """
    phone = str(lead.mobile_no or "").strip()
    masked_phone = f"{phone[:5]} •••••" if len(phone) >= 5 else phone

    # Determine course display name (must always be a string for JSON serialization)
    course_display = "General Inquiry"
    try:
        if lead.course_name:
            course_display = str(getattr(lead.course_name, "course_name", lead.course_name) or "General Inquiry")
        elif lead.course:
            if getattr(lead.course, "course_name", None):
                cn = lead.course.course_name
                course_display = str(getattr(cn, "course_name", cn) or "General Inquiry")
            else:
                course_display = str(lead.course)
    except Exception:
        course_display = "General Inquiry"

    # Priority name and score calculation
    p_name = lead.priority.name.lower() if (lead.priority and lead.priority.name) else "normal"
    score = 70
    if "hot" in p_name:
        score = 95
        p_name = "hot"
    elif "warm" in p_name:
        score = 85
        p_name = "warm"
    elif "cold" in p_name:
        score = 50
        p_name = "cold"
    else:
        p_name = "normal"

    return {
        "id": lead.id,
        "fullName": lead.full_name or "Unknown Lead",
        "phone": phone,
        "maskedPhone": masked_phone,
        "email": lead.email or "",
        "city": lead.location or "",
        "state": "",
        "campaign": lead.campaign.name if lead.campaign else "General Campaign",
        "campaignId": str(lead.campaign_id or ""),
        "source": lead.lead_source.name if lead.lead_source else "Direct",
        "sourceId": str(lead.lead_source_id or ""),
        "priority": p_name,
        "score": score,
        "courseInterest": course_display,
        "receivedAt": lead.created_at.isoformat() if lead.created_at else timezone.now().isoformat(),
        "organizationId": lead.organization_id,
    }


def get_unassigned_pool_leads(organization_id=None, limit=100, user=None):
    """
    Fetch all active unassigned leads for the on-demand pool.
    Deduplicates by mobile_no so each contact number appears only ONCE (latest inquiry).
    """
    try:
        qs = Lead.objects.filter(
            assigned_to__isnull=True
        ).select_related(
            "campaign",
            "lead_source",
            "priority",
            "course_name",
            "course",
        ).order_by("-created_at")

        # Organization filter: If user is non-superadmin and has an organization, filter by org
        is_super = getattr(user, "is_superuser", False) if user else False
        if organization_id and not is_super:
            org_qs = qs.filter(organization_id=organization_id)
            if org_qs.exists():
                qs = org_qs

        # Deduplicate by phone number - keep latest inquiry only
        seen_phones = set()
        unique_leads = []
        for l in qs:
            phone = str(l.mobile_no or "").strip()
            if phone and phone in seen_phones:
                continue
            if phone:
                seen_phones.add(phone)

            unique_leads.append(serialize_pool_lead(l))
            if len(unique_leads) >= limit:
                break

        return unique_leads
    except Exception as e:
        logger.error(f"[get_unassigned_pool_leads] Error: {e}", exc_info=True)
        return []


def fetch_on_demand_pool_leads_service(user, **data):
    """
    Service wrapper for fetching on-demand pool leads (Standard CRM Service structure).
    """
    limit = int(data.get("limit") or 100)
    org_id = getattr(user, "organization_id", None)
    return get_unassigned_pool_leads(organization_id=org_id, limit=limit, user=user)


def claim_pool_lead_service(user, **data):
    """
    Atomically claim an unassigned lead and broadcast across all connected telecallers.
    Standard CRM Service structure with user as first argument.
    """
    try:
        lead_id = data.get("lead_id")
        if not lead_id:
            raise APIException("lead_id is required.")

        if not user or not user.is_authenticated:
            raise APIException("Authentication required.")

        with transaction.atomic():
            lead = (
                Lead.objects.select_for_update()
                .filter(id=lead_id, assigned_to__isnull=True)
                .first()
            )

            if not lead:
                return {
                    "success": False,
                    "message": "Lead is no longer available in the pool (already claimed by another telecaller).",
                }

            # Optional org check (if non-superadmin user belongs to an org, check match)
            if getattr(user, "organization_id", None) and lead.organization_id:
                if user.organization_id != lead.organization_id and not getattr(user, "is_superuser", False):
                    return {
                        "success": False,
                        "message": "You do not have permission to claim leads from another organization.",
                    }

            lead.assigned_to = user
            lead.current_status = "working"
            lead.updated_by = user.username or str(user.id)

            # Auto-assign initial pipeline stage if missing
            if not lead.pipeline_stage_id:
                pipeline_id = lead.pipeline_id or getattr(user, "pipeline_id", None)
                first_stage = None
                if pipeline_id:
                    first_stage = (
                        PipelineStage.objects.filter(
                            pipeline_category_id=pipeline_id,
                            name__icontains="New Lead",
                        ).first()
                        or PipelineStage.objects.filter(
                            pipeline_category_id=pipeline_id
                        )
                        .order_by("order_no")
                        .first()
                    )
                if not first_stage:
                    first_stage = PipelineStage.objects.filter(
                        name__icontains="New Lead"
                    ).first()

                if first_stage:
                    lead.pipeline_stage = first_stage
                    if not lead.pipeline_id and first_stage.pipeline_category_id:
                        lead.pipeline_id = first_stage.pipeline_category_id

            lead.save()

            # Auto-assign any duplicate unassigned records with the same phone to this user
            if lead.mobile_no:
                Lead.objects.filter(
                    mobile_no=lead.mobile_no,
                    assigned_to__isnull=True
                ).exclude(id=lead.id).update(
                    assigned_to=user,
                    current_status="working",
                    updated_by=user.username or str(user.id),
                    pipeline_stage=lead.pipeline_stage,
                    pipeline_id=lead.pipeline_id,
                )

        # Real-time WebSocket Broadcast: Inform ALL connected telecallers
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                claimed_payload = {
                    "type": "broadcast_lead_claimed",
                    "lead_id": lead.id,
                    "claimed_by_name": user.get_full_name() or user.username,
                    "claimed_by_id": user.id,
                }
                # Broadcast to organization-specific group
                if lead.organization_id:
                    async_to_sync(channel_layer.group_send)(
                        f"on_demand_lead_pool_{lead.organization_id}",
                        claimed_payload,
                    )
                # Broadcast to generic pool group
                async_to_sync(channel_layer.group_send)(
                    "on_demand_lead_pool",
                    claimed_payload,
                )
        except Exception as ws_err:
            logger.warning(f"[claim_pool_lead_service] WebSocket broadcast error: {ws_err}")

        return {
            "success": True,
            "message": f"Lead '{lead.full_name}' claimed successfully!",
            "lead_id": lead.id,
            "lead_name": lead.full_name,
        }

    except APIException:
        raise
    except Exception as e:
        logger.error(f"[claim_pool_lead_service] Error: {e}", exc_info=True)
        return {"success": False, "message": str(e)}


def broadcast_new_lead_to_pool(lead):
    """
    Broadcast a newly created/imported unassigned lead to the live On-Demand Lead Pool.
    """
    try:
        if lead.assigned_to_id is not None:
            return

        channel_layer = get_channel_layer()
        if not channel_layer:
            return

        payload = {
            "type": "broadcast_new_lead",
            "lead": serialize_pool_lead(lead),
        }

        if lead.organization_id:
            async_to_sync(channel_layer.group_send)(
                f"on_demand_lead_pool_{lead.organization_id}",
                payload,
            )
        async_to_sync(channel_layer.group_send)(
            "on_demand_lead_pool",
            payload,
        )
    except Exception as e:
        logger.warning(f"[broadcast_new_lead_to_pool] Error broadcasting new lead: {e}")
