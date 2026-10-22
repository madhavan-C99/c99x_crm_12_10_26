import hmac
import hashlib
import json
import logging
import urllib.request
import urllib.parse
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from rest_framework.exceptions import ValidationError

from adm.models.facebook_models import FBAccount, FBConnection, FBConnectionForm, FBLeadLog
from adm.services.fb_crypto_services import encrypt_token, decrypt_token
from telecalling.models import Lead, CampaignName, LeadSource, PipelineStage, User
from adm.models import PipelineCategory
from adm.services.meta_webhook_services import sanitize_meta_phone, get_next_round_robin_telecaller
from adm.tasks import trigger_dashboard_update_task

logger = logging.getLogger(__name__)
GRAPH_API_VERSION = getattr(settings, "GRAPH_API_VERSION", "v26.0")
FB_APP_ID = getattr(settings, "META_APP_ID", "1165682855523450")
FB_APP_SECRET = getattr(settings, "META_APP_SECRET", "MY_META_APP_SECRET_123")


# 1. CRM Helpers for Integration UI Dropdowns
def fetch_crm_pipelines_service(user):
    user_org = getattr(user, 'organization', None) if user else None
    qs = PipelineCategory.objects.all()
    if user_org:
        qs = qs.filter(organization=user_org)
    return [{
        "id": p.id,
        "name": p.name,
        "stages": [{"id": s.id, "name": s.name} for s in p.stages.all().order_by("order_no", "id")]
    } for p in qs]


def fetch_crm_campaigns_service(user):
    user_org = getattr(user, 'organization', None) if user else None
    qs = CampaignName.objects.filter(is_active=True)
    if user_org:
        qs = qs.filter(organization=user_org)
    return [{
        "id": c.id,
        "name": c.name,
        "pipelineId": c.pipeline_category_id
    } for c in qs]


def fetch_crm_fields_service(user):
    return [
        {"key": "full_name", "label": "Full Name"},
        {"key": "phone_number", "label": "Phone Number"},
        {"key": "email", "label": "Email Address"},
        {"key": "city", "label": "City / Location"},
        {"key": "course", "label": "Course Interested"}
    ]


# 2. OAuth Start: Signed State Generator
def generate_fb_oauth_url(user, reauth: bool = False, redirect_uri: str = "") -> str:
    org_id = getattr(user, 'organization_id', 1)
    user_id = user.id if user else 1
    state_payload = f"{org_id}:{user_id}:{int(timezone.now().timestamp())}"
    signature = hmac.new(settings.SECRET_KEY.encode(), state_payload.encode(), hashlib.sha256).hexdigest()
    state = f"{state_payload}:{signature}"

    scopes = "leads_retrieval,pages_manage_metadata,pages_show_list,pages_read_engagement"
    params = {
        "client_id": FB_APP_ID,
        "redirect_uri": redirect_uri,
        "state": state,
        "scope": scopes,
        "response_type": "code"
    }
    if reauth:
        params["auth_type"] = "reauthenticate"

    return f"https://www.facebook.com/{GRAPH_API_VERSION}/dialog/oauth?{urllib.parse.urlencode(params)}"


# 3. OAuth Callback: Exchange code for 60-day Long-Lived Token
def exchange_code_for_fb_account(code: str, state: str, redirect_uri: str) -> FBAccount:
    parts = state.split(":")
    if len(parts) != 4:
        raise ValidationError("Invalid OAuth state parameter.")
    org_id, user_id, ts, signature = int(parts[0]), int(parts[1]), int(parts[2]), parts[3]
    expected = hmac.new(settings.SECRET_KEY.encode(), f"{org_id}:{user_id}:{ts}".encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise ValidationError("Invalid OAuth security signature.")

    # Short-lived token
    token_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/oauth/access_token?" + urllib.parse.urlencode({
        "client_id": FB_APP_ID,
        "client_secret": FB_APP_SECRET,
        "redirect_uri": redirect_uri,
        "code": code
    })
    req = urllib.request.urlopen(token_url)
    res_data = json.loads(req.read().decode())
    short_token = res_data.get("access_token")

    # Long-lived token (60 Days)
    long_token_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/oauth/access_token?" + urllib.parse.urlencode({
        "grant_type": "fb_exchange_token",
        "client_id": FB_APP_ID,
        "client_secret": FB_APP_SECRET,
        "fb_exchange_token": short_token
    })
    l_req = urllib.request.urlopen(long_token_url)
    l_data = json.loads(l_req.read().decode())
    long_token = l_data.get("access_token")
    expires_in = l_data.get("expires_in", 5184000)

    # Fetch User Details
    me_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/me?fields=id,name&access_token={long_token}"
    me_req = urllib.request.urlopen(me_url)
    me_data = json.loads(me_req.read().decode())

    account, _ = FBAccount.objects.update_or_create(
        org_id=org_id,
        fb_user_id=me_data["id"],
        defaults={
            "name": me_data.get("name", "Facebook User"),
            "user_token": encrypt_token(long_token),
            "token_expires_at": timezone.now() + timedelta(seconds=expires_in),
            "created_by": str(user_id)
        }
    )
    return account


# 4. Fetch Pages of Account (using InputSerializer account_id)
def fetch_facebook_pages(user, account_id: int):
    account = FBAccount.objects.filter(id=account_id, org=user.organization).first()
    if not account:
        raise ValidationError("Facebook Account not found.")

    user_token = decrypt_token(account.user_token)
    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/me/accounts?fields=id,name,access_token&access_token={user_token}"
    req = urllib.request.urlopen(url)
    data = json.loads(req.read().decode()).get("data", [])

    existing_connected = set(FBConnection.objects.filter(org=user.organization).values_list("page_id", flat=True))
    return [{
        "id": p["id"],
        "name": p["name"],
        "connected": p["id"] in existing_connected
    } for p in data]


# 5. Fetch Forms of Page (using InputSerializer account_id & page_id)
def fetch_page_lead_forms(user, page_id: str, account_id: int):
    account = FBAccount.objects.filter(id=account_id, org=user.organization).first()
    if not account:
        raise ValidationError("Facebook Account not found.")

    user_token = decrypt_token(account.user_token)
    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{page_id}/leadgen_forms?fields=id,name,status,leads_count&access_token={user_token}"
    req = urllib.request.urlopen(url)
    data = json.loads(req.read().decode()).get("data", [])
    return [{
        "id": f["id"],
        "name": f["name"],
        "status": f.get("status", "ACTIVE"),
        "leadCount": f.get("leads_count", 0)
    } for f in data]


# 6. Create Connection & Subscribe to Webhook
def create_fb_connection(user, account_id, page_id, pipeline_id, routing_data, field_mapping, form_mode, form_ids):
    org = user.organization
    account = FBAccount.objects.filter(id=account_id, org=org).first()
    if not account:
        raise ValidationError("Facebook Account not found.")

    # 409 Conflict: Same Page cannot be connected twice in same Org
    if FBConnection.objects.filter(org=org, page_id=page_id).exists():
        raise ValidationError("This Facebook Page is already connected in your organization.")

    user_token = decrypt_token(account.user_token)
    p_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{page_id}?fields=access_token,name&access_token={user_token}"
    p_req = urllib.request.urlopen(p_url)
    p_data = json.loads(p_req.read().decode())
    page_token = p_data.get("access_token")
    page_name = p_data.get("name")

    # Subscribe Page to Webhook
    sub_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{page_id}/subscribed_apps"
    sub_data = urllib.parse.urlencode({"subscribed_fields": "leadgen", "access_token": page_token}).encode()
    urllib.request.urlopen(urllib.request.Request(sub_url, data=sub_data, method="POST"))

    routing_type = routing_data.get("type", "existing")
    pipeline = PipelineCategory.objects.filter(id=pipeline_id).first()
    if not pipeline:
        raise ValidationError("Pipeline Category not found.")

    with transaction.atomic():
        campaign = None
        if routing_type == "new":
            campaign_name = (routing_data.get("campaignName") or f"{page_name} Campaign").strip()
            campaign = CampaignName.objects.create(name=campaign_name, pipeline_category=pipeline, organization=org)
        elif routing_type == "existing":
            campaign = CampaignName.objects.filter(id=routing_data.get("campaignId")).first()

        fallback_campaign = None
        if routing_type == "rules" and routing_data.get("fallbackCampaignId"):
            fallback_campaign = CampaignName.objects.filter(id=routing_data["fallbackCampaignId"]).first()

        conn = FBConnection.objects.create(
            org=org,
            fb_account=account,
            page_id=page_id,
            page_name=page_name,
            page_token=encrypt_token(page_token),
            routing_type=routing_type,
            campaign=campaign,
            rules=routing_data.get("rules", []),
            fallback_campaign=fallback_campaign,
            pipeline=pipeline,
            field_mapping=field_mapping,
            form_mode=form_mode,
            status="active",
            created_by=user.username
        )

        if form_mode == "specific" and form_ids:
            for fid in set(form_ids):
                FBConnectionForm.objects.create(connection=conn, form_id=fid, form_name=fid, created_by=user.username)

    return conn


# 7. List Active Connections for Logged-in Org
def list_fb_connections_service(user, host: str):
    conns = FBConnection.objects.filter(org=user.organization).select_related('campaign', 'pipeline', 'fb_account')
    result = []
    for c in conns:
        result.append({
            "id": c.id,
            "uid": c.uid,
            "page": {"id": c.page_id, "name": c.page_name},
            "facebookAccount": {"name": c.fb_account.name},
            "pipeline": {"id": c.pipeline.id, "name": c.pipeline.name},
            "campaign": {"id": c.campaign.id if c.campaign else None, "name": c.campaign.name if c.campaign else None, "how": c.routing_type},
            "formMode": c.form_mode,
            "forms": [{"id": f.form_id, "name": f.form_name} for f in c.forms.all()],
            "status": c.status,
            "createdAt": c.created_at,
            "webhookUrl": f"{host}/adm/manual_fb_lead_push_admin?uid={c.uid}"
        })
    return result


# 8. Delete Connection (using InputSerializer connection_id)
def delete_fb_connection_service(user, connection_id: int):
    conn = FBConnection.objects.filter(id=connection_id, org=user.organization).first()
    if not conn:
        raise ValidationError("Connection not found.")

    page_id = conn.page_id
    page_token = decrypt_token(conn.page_token)
    conn.delete()

    if not FBConnection.objects.filter(page_id=page_id).exists():
        try:
            unsub_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{page_id}/subscribed_apps?access_token={page_token}"
            urllib.request.urlopen(urllib.request.Request(unsub_url, method="DELETE"))
        except Exception:
            pass


# 9. Lead Ingestion Processor
def process_single_leadgen_event(leadgen_id: str, form_id: str, page_id: str = "", connection_uid: str = "", direct_data: dict = None):
    conn = None
    if connection_uid:
        conn = FBConnection.objects.filter(uid=connection_uid, status="active").first()
    elif page_id:
        conn = FBConnection.objects.filter(page_id=page_id, status="active").first()

    # Fallback to single-tenant if no multi-tenant connection found (maintains backward compatibility!)
    if not conn:
        logger.info("No FBConnection found for page_id=%s. Routing via standard ingest.", page_id)
        from adm.services.meta_webhook_services import ingest_meta_lead_to_crm
        return ingest_meta_lead_to_crm(leadgen_id=leadgen_id, form_id=form_id, page_id=page_id, direct_data=direct_data)

    # Idempotency check
    if FBLeadLog.objects.filter(leadgen_id=leadgen_id).exists():
        logger.info("Leadgen ID %s already processed. Skipping duplicate.", leadgen_id)
        return

    # Specific Forms Filter
    if conn.form_mode == "specific":
        if not conn.forms.filter(form_id=form_id).exists():
            FBLeadLog.objects.create(connection=conn, leadgen_id=leadgen_id, form_id=form_id, status="skipped")
            return

    # Graph API Lead Fetch
    page_token = decrypt_token(conn.page_token)
    lead_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{leadgen_id}?fields=created_time,field_data,form_id&access_token={page_token}"
    lead_data = direct_data or {}
    if not lead_data or not lead_data.get("field_data"):
        try:
            req = urllib.request.urlopen(lead_url)
            lead_data = json.loads(req.read().decode())
        except Exception as e:
            FBLeadLog.objects.create(connection=conn, leadgen_id=leadgen_id, form_id=form_id, status="failed", error=str(e))
            return

    field_map = {f.get("name"): f.get("values", [""])[0] for f in lead_data.get("field_data", [])}
    full_name = field_map.get("full_name") or field_map.get("first_name") or "Meta Customer"
    raw_phone = field_map.get("phone_number") or ""
    phone_number = sanitize_meta_phone(raw_phone)
    email = field_map.get("email") or ""
    city = field_map.get("city") or ""

    # Rules Routing: Form Name matching
    campaign = conn.campaign
    if conn.routing_type == "rules":
        form_name = str(form_id).lower()
        matched_id = None
        for r in conn.rules:
            if r.get("contains", "").lower() in form_name:
                matched_id = r.get("campaign_id")
                break
        campaign = CampaignName.objects.filter(id=matched_id).first() if matched_id else conn.fallback_campaign

    stage = PipelineStage.objects.filter(pipeline_category=conn.pipeline).order_by("order_no", "id").first()
    source_obj, _ = LeadSource.objects.get_or_create(name="Facebook/Instagram Lead Ads", defaults={"is_active": True})
    assigned_user = get_next_round_robin_telecaller(campaign)

    with transaction.atomic():
        lead = Lead.objects.create(
            organization=conn.org,
            full_name=full_name,
            mobile_no=phone_number,
            email=email or None,
            location=city or None,
            lead_source=source_obj,
            campaign=campaign,
            pipeline=conn.pipeline,
            pipeline_stage=stage,
            assigned_to=assigned_user,
            enquiry_date=timezone.now(),
            current_status="working",
            created_by=f"Meta Ads ({conn.page_name})"
        )

        FBLeadLog.objects.create(
            connection=conn,
            leadgen_id=leadgen_id,
            form_id=form_id,
            status="created",
            raw_payload=lead_data
        )

    try:
        trigger_dashboard_update_task()
    except Exception:
        pass
    
    return lead
