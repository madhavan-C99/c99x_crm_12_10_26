import re
import secrets
import logging
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import ValidationError

from adm.models.whatsapp_models import WhatsAppConnection
from adm.models.user import User
from telecalling.models import Lead, LeadSource, PipelineStage, CourseName, CampaignName
from telecalling.models.delete_base_model import SafeDeleteModel
from adm.services.meta_webhook_services import pick_round_robin_agent
from adm.tasks import trigger_dashboard_update_task

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# 1. CRM ADMIN SERVICES (CREATE, FETCH, DELETE CONNECTIONS)
# ─────────────────────────────────────────────────────────────────────────────

def create_whatsapp_connection_service(user, data: dict, host: str = "") -> dict:
    """
    Creates a new WhatsApp Connection for a Campaign and WhatsApp Number.
    Generates a unique connection token and connection URL.
    """
    campaign_id = data.get("campaign_id") or data.get("campaign")
    raw_number = data.get("whatsapp_number") or data.get("phone") or ""
    client_name = data.get("client_name") or data.get("name")

    if not raw_number:
        raise ValidationError("WhatsApp mobile number is required.")

    clean_digits = re.sub(r'\D', '', str(raw_number))
    if len(clean_digits) == 10:
        clean_number = f"91{clean_digits}"
    elif len(clean_digits) >= 10:
        clean_number = clean_digits
    else:
        raise ValidationError("Please provide a valid 10-digit mobile number.")

    campaign = None
    pipeline = None
    if campaign_id:
        campaign = CampaignName.objects.filter(id=campaign_id).select_related('pipeline_category').first()
        if campaign:
            pipeline = getattr(campaign, 'pipeline_category', None)

    org = getattr(user, 'organization', None)
    resolved_client_name = client_name or getattr(org, 'organization_name', None) or "CRM Admin"

    # Auto-purge abandoned inactive tokens older than 15 minutes to keep DB clean
    expiry_cutoff = timezone.now() - timezone.timedelta(minutes=15)
    WhatsAppConnection.objects.filter(status__in=['pending', 'inactive'], created_at__lt=expiry_cutoff).delete()

    token = secrets.token_hex(16)

    conn = WhatsAppConnection.objects.create(
        organization=org,
        token=token,
        client_name=resolved_client_name,
        whatsapp_number=clean_number,
        pipeline=pipeline,
        campaign=campaign,
        status="pending",
        created_by=getattr(user, 'username', 'Admin')
    )

    clean_host = host.rstrip('/') if host else ""
    connection_url = f"{clean_host}/adm/whatsapp_connect/{token}"

    return {
        "id": conn.id,
        "token": token,
        "connectionUrl": connection_url,
        "clientName": conn.client_name,
        "whatsappNumber": conn.whatsapp_number,
        "campaignId": campaign.id if campaign else None,
        "campaignName": campaign.name if campaign else "General WhatsApp Campaign",
        "pipelineId": pipeline.id if pipeline else None,
        "status": conn.status
    }


def fetch_whatsapp_connections_service(user, host: str = "") -> list:
    """Fetches all active WhatsApp connections for the user's organization."""
    conns = WhatsAppConnection.objects.filter(status='active')
    if user and getattr(user, 'organization', None):
        conns = conns.filter(Q(organization=user.organization) | Q(organization__isnull=True))

    conns = conns.select_related('campaign', 'pipeline').order_by('-id')

    clean_host = host.rstrip('/') if host else ""
    result = []
    for c in conns:
        connection_url = f"{clean_host}/adm/whatsapp_connect/{c.token}"
        result.append({
            "id": c.id,
            "token": c.token,
            "connectionUrl": connection_url,
            "clientName": c.client_name,
            "whatsappNumber": c.whatsapp_number,
            "campaign": {
                "id": c.campaign.id if c.campaign else None,
                "name": c.campaign.name if c.campaign else "General WhatsApp"
            },
            "pipeline": {
                "id": c.pipeline.id if c.pipeline else None,
                "name": getattr(c.pipeline, 'category_name', getattr(c.pipeline, 'display_name', '')) if c.pipeline else ""
            },
            "totalLeadsSynced": c.total_leads_synced,
            "status": c.status,
            "createdAt": c.created_at.isoformat() if c.created_at else None
        })
    return result


def delete_whatsapp_connection_service(user, connection_id: int) -> dict:
    """Deletes / soft-deletes a WhatsApp connection."""
    conn = WhatsAppConnection.objects.filter(id=connection_id).first()
    if not conn:
        raise ValidationError("WhatsApp connection not found.")

    user_id = getattr(user, 'id', None)
    try:
        conn.save_delete(user_id=user_id)
    except Exception:
        super(SafeDeleteModel, conn).delete()

    return {"message": "WhatsApp connection deleted successfully", "connectionId": connection_id}


# ─────────────────────────────────────────────────────────────────────────────
# 2. CHROME EXTENSION WEBHOOK SERVICES (CONFIG & LEADS INGESTION)
# ─────────────────────────────────────────────────────────────────────────────

def get_whatsapp_config_service(token: str) -> dict:
    """
    Called by Extension: GET /adm/whatsapp_connect/:token/config
    Returns campaign config and registered WhatsApp number.
    """
    conn = WhatsAppConnection.objects.filter(token=token, status__in=['pending', 'inactive', 'active']).select_related('campaign', 'organization').first()
    if not conn:
        raise ValidationError("Invalid or expired connection token.")

    # ⏳ 15-Minute Expiry Check for unactivated tokens
    if conn.status in ['pending', 'inactive']:
        if conn.created_at and (timezone.now() - conn.created_at > timezone.timedelta(minutes=15)):
            conn.delete()
            raise ValidationError("This connection link has expired (15-minute limit). Please generate a new connection link in CRM.")

        # 🤝 Handshake Activation: Update status from 'inactive' to 'active' on first handshake
        conn.status = 'active'
        conn.save(update_fields=['status', 'updated_at'])

    clean_wa_number = re.sub(r'\D', '', str(conn.whatsapp_number or ''))
    campaign_name = conn.campaign.name if conn.campaign else "General WhatsApp Campaign"
    client_name = conn.client_name or (conn.organization.organization_name if conn.organization else "CRM Admin")

    return {
        "clientName": client_name,
        "campaignName": campaign_name,
        "whatsappNumber": clean_wa_number
    }


def ingest_whatsapp_leads_service(token: str, payload: dict) -> dict:
    """
    Called by Extension: POST /adm/whatsapp_connect/:token/leads
    Ingests leads captured from WhatsApp Web with duplicate checking & round-robin allocation.
    """
    conn = WhatsAppConnection.objects.filter(token=token, status='active').select_related('campaign', 'pipeline', 'organization').first()
    if not conn:
        raise ValidationError("Unauthorized or expired connection token.")

    incoming_wa = re.sub(r'\D', '', str(payload.get("whatsappNumber", "")))
    registered_wa = re.sub(r'\D', '', str(conn.whatsapp_number or ""))

    if incoming_wa and registered_wa and incoming_wa != registered_wa:
        logger.warning(f"[WhatsApp Sync] Number mismatch for token {token}: incoming {incoming_wa} vs registered {registered_wa}")

    raw_leads = payload.get("leads", [])
    if not isinstance(raw_leads, list):
        raise ValidationError("Payload must contain a 'leads' list.")

    source_obj, _ = LeadSource.objects.get_or_create(
        name="WhatsApp Web",
        defaults={"is_active": True}
    )

    # Resolve Default Pipeline Stage
    default_stage = None
    if conn.pipeline:
        default_stage = PipelineStage.objects.filter(pipeline_category=conn.pipeline, is_active=True).order_by('order_no', 'id').first()
    if not default_stage and conn.campaign and getattr(conn.campaign, 'pipeline_category', None):
        default_stage = PipelineStage.objects.filter(pipeline_category=conn.campaign.pipeline_category, is_active=True).order_by('order_no', 'id').first()
    if not default_stage:
        default_stage = PipelineStage.objects.filter(is_active=True).order_by('order_no', 'id').first()

    created_count = 0
    duplicate_count = 0

    for item in raw_leads:
        if not isinstance(item, dict):
            continue

        phone_raw = str(item.get("phone") or item.get("mobile") or "").strip()
        digits = re.sub(r'\D', '', phone_raw)
        if len(digits) < 10:
            continue

        clean_10 = digits[-10:]
        lead_name = (item.get("name") or f"WhatsApp Lead ({clean_10})").strip()
        course_text = (item.get("course") or "").strip()

        # Robust Multi-format Duplicate Check
        duplicate_qs = Lead.objects.filter(
            Q(mobile_no=clean_10) |
            Q(mobile_no=f"+91{clean_10}") |
            Q(mobile_no=f"91{clean_10}") |
            Q(mobile_no__endswith=clean_10)
        )
        if conn.organization:
            duplicate_qs = duplicate_qs.filter(organization=conn.organization)
        if conn.campaign:
            duplicate_qs = duplicate_qs.filter(campaign=conn.campaign)

        if duplicate_qs.exists():
            duplicate_count += 1
            continue

        # Match course name if available
        course_obj = None
        if course_text:
            course_obj = CourseName.objects.filter(course_name__icontains=course_text).first()

        # Telecaller Round-Robin allocation
        assigned_user = pick_round_robin_agent(conn.campaign)

        with transaction.atomic():
            Lead.objects.create(
                organization=conn.organization,
                full_name=lead_name,
                mobile_no=clean_10,
                campaign=conn.campaign,
                pipeline=conn.pipeline,
                pipeline_stage=default_stage,
                course_name=course_obj,
                lead_source=source_obj,
                assigned_to=assigned_user,
                enquiry_date=timezone.now(),
                current_status="working",
                created_by="WhatsApp Web Sync"
            )
            created_count += 1

    if created_count > 0:
        conn.total_leads_synced += created_count
        conn.save(update_fields=['total_leads_synced', 'updated_at'])
        try:
            trigger_dashboard_update_task()
        except Exception:
            pass

    return {
        "created": created_count,
        "duplicates": duplicate_count
    }


# ─────────────────────────────────────────────────────────────────────────────
# 3. CHROME EXTENSION ASSISTANT SERVICES (PERMISSION CHECK, LOOKUP, BULK IMPORT)
# ─────────────────────────────────────────────────────────────────────────────

def check_whatsapp_permission_service(mobile: str) -> dict:
    """
    Checks if a WhatsApp number is registered as an authorized CRM staff or connection.
    Called by Extension on launch to verify user access.
    """
    if not mobile:
        return {"allowed": False, "message": "Mobile number is required."}

    clean_digits = re.sub(r'\D', '', str(mobile))
    clean_10 = clean_digits[-10:] if len(clean_digits) >= 10 else clean_digits

    # Check in User model
    user = User.objects.filter(mobile__endswith=clean_10, is_active=True).first()
    if user:
        return {
            "allowed": True,
            "user": {
                "id": user.id,
                "name": f"{user.first_name} {user.last_name}".strip() or user.username,
                "username": user.username,
                "mobile": user.mobile
            },
            "message": "Authorized Staff Member"
        }

    # Check in active WhatsApp connections
    conn = WhatsAppConnection.objects.filter(whatsapp_number__endswith=clean_10, status='active').first()
    if conn:
        return {
            "allowed": True,
            "user": {
                "id": None,
                "name": conn.client_name,
                "mobile": conn.whatsapp_number
            },
            "message": "Authorized WhatsApp Connection"
        }

    return {
        "allowed": False,
        "message": "Mobile number is not registered or authorized in the CRM."
    }


def get_lead_details_by_phone_service(phone: str) -> dict:
    """
    Sidebar feature: Looks up CRM lead details by phone number.
    Returns lead details if already present in CRM, else found=False.
    """
    if not phone:
        raise ValidationError("Phone number is required.")

    clean_10 = re.sub(r'\D', '', str(phone))[-10:]
    if len(clean_10) < 10:
        raise ValidationError("Invalid phone number format.")

    lead = Lead.objects.filter(
        Q(mobile_no=clean_10) |
        Q(mobile_no=f"+91{clean_10}") |
        Q(mobile_no=f"91{clean_10}") |
        Q(mobile_no__endswith=clean_10)
    ).select_related('assigned_to', 'campaign', 'pipeline_stage', 'course_name').first()

    if not lead:
        return {"found": False, "lead": None, "message": "Lead not found in CRM"}

    return {
        "found": True,
        "lead": {
            "id": lead.id,
            "fullName": lead.full_name,
            "mobileNo": lead.mobile_no,
            "campaign": lead.campaign.name if lead.campaign else None,
            "pipelineStage": lead.pipeline_stage.stage_name if lead.pipeline_stage else None,
            "course": lead.course_name.course_name if lead.course_name else None,
            "assignedTo": lead.assigned_to.username if lead.assigned_to else "Unassigned",
            "currentStatus": lead.current_status,
            "enquiryDate": lead.enquiry_date.isoformat() if lead.enquiry_date else None
        }
    }


def backend_filter_import_chats_service(payload: dict) -> dict:
    """
    1-Click Bulk Import: Takes an array of WhatsApp chats, filters out existing leads,
    and imports only new leads with Round-Robin allocation.
    """
    chats = payload.get("chats", [])
    token = payload.get("token")
    raw_wa = payload.get("whatsappNumber") or ""

    conn = None
    if token:
        conn = WhatsAppConnection.objects.filter(token=token, status='active').first()
    if not conn and raw_wa:
        clean_wa = re.sub(r'\D', '', str(raw_wa))[-10:]
        conn = WhatsAppConnection.objects.filter(whatsapp_number__endswith=clean_wa, status='active').first()

    pseudo_leads = []
    for chat in chats:
        pseudo_leads.append({
            "name": chat.get("name") or chat.get("chatTitle") or "WhatsApp Lead",
            "phone": chat.get("phone") or chat.get("chatId") or chat.get("mobile"),
            "message": chat.get("lastMessage") or "",
            "course": chat.get("course") or ""
        })

    if conn:
        result = ingest_whatsapp_leads_service(conn.token, {"leads": pseudo_leads, "whatsappNumber": raw_wa})
        return {
            "totalProcessed": len(chats),
            "created": result.get("created", 0),
            "duplicates": result.get("duplicates", 0)
        }

    # Duplicate check fallback if no connection token
    existing_count = 0
    new_candidates = 0
    for item in pseudo_leads:
        phone_raw = str(item.get("phone") or "").strip()
        digits = re.sub(r'\D', '', phone_raw)
        if len(digits) >= 10:
            clean_10 = digits[-10:]
            if Lead.objects.filter(mobile_no__endswith=clean_10).exists():
                existing_count += 1
            else:
                new_candidates += 1

    return {
        "totalProcessed": len(chats),
        "created": 0,
        "duplicates": existing_count,
        "newCandidates": new_candidates,
        "message": "Token not provided; analyzed existing vs new counts."
    }
