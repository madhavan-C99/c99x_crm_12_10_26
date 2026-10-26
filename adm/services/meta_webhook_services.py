import json
import logging
import urllib.request
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from django.db.models import Max, Q

from telecalling.models import (
    Lead, CampaignName, LeadSource, PipelineStage, User
)
from adm.models import PipelineCategory, campaign_assigned_agent
from adm.tasks import trigger_dashboard_update_task

logger = logging.getLogger(__name__)
GRAPH_API_VERSION = getattr(settings, "GRAPH_API_VERSION", "v26.0")


def sanitize_meta_phone(raw_phone: str) -> str:
    """Strips +91, 91, 0 and returns clean 10 digits"""
    digits = "".join(filter(str.isdigit, str(raw_phone or "")))
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    elif len(digits) > 10:
        digits = digits[-10:]
    return digits


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
    True Round-Robin Allocation:
    1. Fetches on-duty, active telecallers for this campaign.
    2. Falls back to global active telecallers if no campaign agents exist.
    3. Acquires row locks via select_for_update() to prevent race conditions on concurrent leads.
    4. Finds the highest Lead ID assigned to each telecaller.
    5. Returns the agent whose last assigned lead is the oldest (lowest Lead ID),
       prioritizing agents who haven't received any leads yet (last_id = 0).
    """
    agents = []
    if campaign:
        assigned = campaign_assigned_agent.objects.filter(
            campaign=campaign, is_active=True
        ).select_related('agent_user')
        agents = [
            a.agent_user for a in assigned 
            if a.agent_user.is_active and not getattr(a.agent_user, 'disable_lead_assignment', False)
        ]

    # Global active telecaller fallback
    if not agents:
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

    last_assigned = dict(
        Lead.objects.filter(assigned_to_id__in=ids)
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
    source_name = "Instagram" if "instagram" in platform or "ig" in platform else "Meta Ads"
    source_obj, _ = LeadSource.objects.get_or_create(name=source_name, defaults={'is_active': True})

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
