import json
import re
import logging
import urllib.request
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from django.db.models import Max, Q

from telecalling.models import (
    Lead, CampaignName, LeadSource, PipelineStage 
)
from ..models.user import User
from adm.models import PipelineCategory, campaign_assigned_agent
from adm.tasks import trigger_dashboard_update_task

logger = logging.getLogger(__name__)
GRAPH_API_VERSION = getattr(settings, "GRAPH_API_VERSION", "v26.0")


def sanitize_meta_phone(raw_phone: str) -> str:
    """Strips +91, 91, 0 prefix and validates strict 10-digit Indian mobile (starts with 6-9).
    Returns clean 10-digit string on success, empty string "" on invalid/junk numbers.
    No blind slicing - rejects numbers that do not strictly match Indian mobile format.
    """
    import re
    digits = "".join(filter(str.isdigit, str(raw_phone or "")))
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    # Strict validation: exactly 10 digits, starting with 6, 7, 8, or 9
    if len(digits) == 10 and re.match(r'^[6-9]\d{9}$', digits):
        return digits
    return ""  # Invalid -> caller must reject with error response


def fetch_meta_lead_from_graph_api(leadgen_id: str) -> dict:
    """Calls Meta Graph API to fetch customer's form submission data"""
    if not leadgen_id:
        return {}

    token = getattr(settings, "META_PAGE_ACCESS_TOKEN", "")
    if not token:
        logger.warning("META_PAGE_ACCESS_TOKEN is not configured in settings.")
        return {}

    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{leadgen_id}?fields=created_time,id,field_data,platform,ad_id,form_id,page_id&access_token={token}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        logger.error("Meta Graph API fetch failed for %s: %s", leadgen_id, e)
    return {}


def pick_round_robin_agent(campaign=None):
    """
    Campaign-Aware Allocation:
    1. If campaign distribution is 'on_demand' -> Returns None (assigned_to = NULL, Unassigned Pool).
    2. If campaign distribution is 'equally_shared' / 'round_robin' -> Equal round-robin among campaign agents.
    3. If no campaign specified -> Global telecaller fallback.
    """
    if campaign:
        # 🌟 1. On-Demand Check:
        dist_type = str(getattr(campaign, 'lead_distribution_type', '') or '').strip().lower()
        if dist_type in ['on_demand', 'manual', 'unassigned']:
            logger.info("Campaign '%s' is On-Demand. Keeping lead in Unassigned Pool (assigned_to=NULL).", getattr(campaign, 'name', ''))
            return None

        # 🌟 2. Equally Shared: Distribute ONLY among this campaign's active agents
        assigned = campaign_assigned_agent.objects.filter(
            campaign=campaign, is_active=True
        ).select_related('agent_user')
        agents = [
            a.agent_user for a in assigned 
            if a.agent_user.is_active and not getattr(a.agent_user, 'disable_lead_assignment', False)
        ]

        # If campaign has no agents assigned yet, keep lead unassigned (Safeguard)
        if not agents:
            return None

    # Global active telecaller fallback (only if NO campaign specified at all)
    if not campaign:
        tele_qs = User.objects.filter(is_active=True)
        if hasattr(User, 'disable_lead_assignment'):
            tele_qs = tele_qs.filter(disable_lead_assignment=False)
        if hasattr(User, 'user_type'):
            tele_qs = tele_qs.filter(user_type__icontains='telecaller')
        agents = list(tele_qs)

    if not agents:
        return None

    ids = [a.id for a in agents]

    # Row-level lock to prevent concurrent webhook hits from picking the same agent
    try:
        list(User.objects.select_for_update().filter(id__in=ids).values_list('id', flat=True))
    except Exception:
        pass

    lead_filter = Lead.objects.filter(assigned_to_id__in=ids)
    if campaign:
        lead_filter = lead_filter.filter(campaign=campaign)

    last_assigned = dict(
        lead_filter
        .order_by()
        .values('assigned_to_id')
        .annotate(last_id=Max('id'))
        .values_list('assigned_to_id', 'last_id')
    )

    return min(agents, key=lambda a: (last_assigned.get(a.id, 0), a.id))


# Backward-compatible alias
get_next_round_robin_telecaller = pick_round_robin_agent


def ingest_meta_lead_to_crm(leadgen_id: str, form_id: str = "", page_id: str = "", ad_id: str = "", campaign_id: str = "", direct_data: dict = None):
    """
    Main CRM Ingestion Logic:
    1. Checks Temporary Pause Switch
    2. Fetches Customer Data via Graph API
    3. Sanitizes 10-digit Phone & Duplicate Check
    4. Connects to 10 AM - 7 PM Office Timings (enquiry_date = now)
    5. Stores in Lead table (Round-Robin or Unassigned Pool)
    """
    # 1. Kill-Switch: Skip if temporarily paused
    if getattr(settings, "META_LEADS_PAUSED", False):
        logger.warning("Meta Lead Ingestion is currently PAUSED. Skipping leadgen_id: %s", leadgen_id)
        return None

    # 2. Fetch Lead Field Details from Meta Cloud
    meta_data = fetch_meta_lead_from_graph_api(leadgen_id) or direct_data or {}
    field_map = {}
    for f in meta_data.get("field_data", []):
        name = f.get("name")
        vals = f.get("values", [])
        if name and vals:
            field_map[name] = vals[0]

    full_name = field_map.get("full_name") or field_map.get("first_name") or "Meta Customer"
    raw_phone = field_map.get("phone_number") or field_map.get("mobile_number") or ""
    email = field_map.get("email") or ""
    city = field_map.get("city") or field_map.get("location") or ""

    # 3. Clean 10-Digit Phone
    phone_number = sanitize_meta_phone(raw_phone)
    if len(phone_number) != 10:
        logger.error("Invalid phone number length from Meta (%s): %s", leadgen_id, raw_phone)
        return None

    # 5. Resolve Source (Instagram vs Meta Ads)
    platform = str(meta_data.get("platform", "instagram" if "ig" in str(meta_data).lower() else "meta")).lower()
    source_name = "Instagram" if "instagram" in platform or "ig" in platform else "Facebook"
    source_obj, _ = LeadSource.objects.get_or_create(name=source_name, defaults={'is_active': True, 'organization': None})

    # 6. Resolve Campaign, Pipeline & Stage
    campaign = None
    if campaign_id and str(campaign_id).isdigit():
        campaign = CampaignName.objects.filter(id=int(campaign_id), is_active=True).first()
    if not campaign:
        campaign = CampaignName.objects.filter(is_active=True).first()

    pipeline = campaign.pipeline_category if (campaign and campaign.pipeline_category) else PipelineCategory.objects.first()
    stage = None
    if pipeline:
        stage = PipelineStage.objects.filter(pipeline_category=pipeline).order_by('order_no', 'id').first()
    if not stage:
        stage = PipelineStage.objects.order_by('order_no', 'id').first()

    # 4. Multi-Tenant Duplicate Check (Scoped to campaign's organization)
    dup_qs = Lead.objects.filter(
        Q(mobile_no=phone_number) |
        Q(mobile_no=f"+91 {phone_number}") |
        Q(mobile_no=f"+91{phone_number}") |
        Q(mobile_no=f"91{phone_number}") |
        Q(mobile_no__endswith=phone_number)
    )
    if campaign and getattr(campaign, 'organization', None):
        dup_qs = dup_qs.filter(organization=campaign.organization)
    existing_lead = dup_qs.first()
    if existing_lead:
        logger.info("Meta lead already exists in CRM (Lead #%s, %s)", existing_lead.id, phone_number)
        return existing_lead

    # 7. Form Submission Timestamp (Connects directly to 10 AM - 7 PM Speed Score)
    created_time = timezone.now()

    # 8. Atomic Database Creation with True Round-Robin Assignment
    auto_assign = getattr(settings, "META_AUTO_ASSIGN_ROUND_ROBIN", True)
    with transaction.atomic():
        assigned_user = pick_round_robin_agent(campaign) if auto_assign else None
        lead = Lead.objects.create(
            organization=getattr(campaign, 'organization', None),
            full_name=full_name,
            mobile_no=phone_number,
            email=email or None,
            lead_source=source_obj,
            campaign=campaign,
            pipeline=pipeline,
            pipeline_stage=stage,
            assigned_to=assigned_user,
            enquiry_date=created_time,
            current_status="working",
            created_by=f"Meta Webhook ({source_name})"
        )

    # 10. Real-time Dashboard Trigger
    try:
        trigger_dashboard_update_task()
    except Exception:
        pass

    logger.info("Successfully ingested Meta Lead #%s (%s, %s) -> Assigned to: %s", 
                lead.id, full_name, phone_number, assigned_user.username if assigned_user else "Unassigned Pool")
    return lead



def fetch_instagram_user_profile(sender_id: str) -> dict:
    """Calls Graph API to fetch Instagram sender's real name/username"""
    token = getattr(settings, "META_PAGE_ACCESS_TOKEN", "")
    if not token or not sender_id:
        return {}
    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{sender_id}?fields=name,username,profile_pic&access_token={token}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        logger.warning("Could not fetch IG user profile for %s: %s", sender_id, e)
    return {}


def process_instagram_dm_event(messaging_event: dict, page_id: str = ""):
    """
    Parses incoming Instagram DM:
    1. Ignores Bot/Page echo replies
    2. Extracts message text & 10-digit mobile number via Regex
    3. Fetches Insta username
    4. Creates Lead in DB & assigns via Round-Robin
    5. Triggers Live Telecaller Dashboard alert
    """
    message = messaging_event.get("message", {})
    if not message or message.get("is_echo", False):
        return None

    sender_id = str(messaging_event.get("sender", {}).get("id", ""))
    msg_text = str(message.get("text", "")).strip()
    if not msg_text or not sender_id:
        return None

    # 1. Extract 10-digit Indian Mobile Number from chat text if present
    phone_match = re.search(r'(?:(?:\+|0{0,2})91[\s-]*)?([6-9]\d{9})\b', msg_text)
    if phone_match:
        phone_number = phone_match.group(1)
    else:
        # Fallback to unique Instagram sender ID identifier (fits in 15 chars)
        phone_number = f"IG_{sender_id[-8:]}"

    # 2. Fetch Customer's Insta Name / Username
    profile = fetch_instagram_user_profile(sender_id)
    customer_name = profile.get("name") or profile.get("username") or f"Insta User (@{sender_id[-6:]})"

    # 3. Resolve Campaign & Source
    source_obj, _ = LeadSource.objects.get_or_create(name="Instagram", defaults={'is_active': True, 'organization': None})
    campaign = None
    if page_id:
        from adm.models.facebook_models import FBConnection
        fb_conn = FBConnection.objects.filter(page_id=page_id, status="active").first()
        if fb_conn and fb_conn.campaign:
            campaign = fb_conn.campaign

    if not campaign:
        campaign = CampaignName.objects.filter(is_active=True).first()

    pipeline = getattr(campaign, 'pipeline_category', None) or PipelineCategory.objects.first()
    stage = None
    if pipeline:
        stage = PipelineStage.objects.filter(pipeline_category=pipeline).order_by('order_no', 'id').first()
    if not stage:
        stage = PipelineStage.objects.order_by('order_no', 'id').first()

    # 4. Duplicate Check (If customer DMs multiple times)
    existing_lead = Lead.objects.filter(
        Q(mobile_no=phone_number) |
        Q(mobile_no=f"+91{phone_number}") |
        Q(mobile_no=f"91{phone_number}") |
        Q(mobile_no__endswith=phone_number)
    ).first()
    if existing_lead:
        logger.info("Instagram DM from existing lead #%s (%s): %s", existing_lead.id, phone_number, msg_text)
        return existing_lead

    # 5. Atomic DB Lead Creation with Round-Robin Telecaller
    auto_assign = getattr(settings, "META_AUTO_ASSIGN_ROUND_ROBIN", True)
    with transaction.atomic():
        assigned_user = pick_round_robin_agent(campaign) if auto_assign else None
        lead = Lead.objects.create(
            organization=getattr(campaign, 'organization', None),
            full_name=customer_name,
            mobile_no=phone_number,
            lead_source=source_obj,
            campaign=campaign,
            pipeline=pipeline,
            pipeline_stage=stage,
            assigned_to=assigned_user,
            enquiry_date=timezone.now(),
            current_status="working",
            created_by="Instagram DM Webhook"
        )

    # 6. Instant WebSocket Trigger (Screen Alert for Telecaller)
    try:
        trigger_dashboard_update_task()
    except Exception:
        pass

    logger.info("Successfully ingested Instagram DM Lead #%s (%s, %s) -> Assigned to: %s",
                lead.id, customer_name, phone_number, assigned_user.username if assigned_user else "Unassigned Pool")
    return lead
