import logging
from huey.contrib.djhuey import task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from telecalling.models.leads import Lead
from telecalling.services.on_demand_services import serialize_pool_lead, get_unassigned_pool_leads
logger = logging.getLogger(__name__)


@task()
def broadcast_new_pool_lead_task(lead_id):
    """
    Huey background task to broadcast a newly created/imported unassigned lead
    to the live On-Demand Lead Pool over WebSocket.
    
    Usage:
        broadcast_new_pool_lead_task(lead.id)
    """
    try:


        lead = (
            Lead.objects.filter(id=lead_id, assigned_to__isnull=True)
            .select_related("campaign", "lead_source", "priority", "course_name", "course")
            .first()
        )

        if not lead:
            logger.info(f"[broadcast_new_pool_lead_task] Lead {lead_id} not found or already assigned.")
            return

        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("[broadcast_new_pool_lead_task] Channel layer not available.")
            return

        payload = {
            "type": "new_lead",
            "lead": serialize_pool_lead(lead),
        }

        # 1. Broadcast to general pool group
        async_to_sync(channel_layer.group_send)("on_demand_lead_pool", payload)

        # 2. Broadcast to organization-specific group
        if lead.organization_id:
            async_to_sync(channel_layer.group_send)(
                f"on_demand_lead_pool_{lead.organization_id}",
                payload,
            )

        logger.info(f"✅ [broadcast_new_pool_lead_task] Successfully broadcast lead #{lead_id} ({lead.full_name}) to On-Demand Pool.")

    except Exception as e:
        logger.error(f"❌ [broadcast_new_pool_lead_task] Error broadcasting lead #{lead_id}: {e}", exc_info=True)


@task()
def broadcast_pool_refresh_task(organization_id=None):
    """
    Huey background task to broadcast a full pool refresh to connected clients.
    
    Usage:
        broadcast_pool_refresh_task(org_id)
    """
    try:

        channel_layer = get_channel_layer()
        if not channel_layer:
            return

        leads = get_unassigned_pool_leads(organization_id=organization_id)
        payload = {
            "type": "pool_data",
            "action": "pool_data",
            "payload": leads,
            "count": len(leads),
        }

        async_to_sync(channel_layer.group_send)("on_demand_lead_pool", payload)
        if organization_id:
            async_to_sync(channel_layer.group_send)(
                f"on_demand_lead_pool_{organization_id}",
                payload,
            )

        logger.info(f"✅ [broadcast_pool_refresh_task] Pool refresh broadcast sent (count: {len(leads)}).")

    except Exception as e:
        logger.error(f"❌ [broadcast_pool_refresh_task] Error: {e}", exc_info=True)
