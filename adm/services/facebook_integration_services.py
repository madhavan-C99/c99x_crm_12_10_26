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
from django.db.models import Q
from rest_framework.exceptions import ValidationError

from adm.models.facebook_models import FBAccount, FBConnection, FBConnectionForm, FBLeadLog
from adm.services.fb_crypto_services import encrypt_token, decrypt_token
from telecalling.models import Lead, CampaignName, LeadSource, PipelineStage, User
from telecalling.models.delete_base_model import SafeDeleteModel
from adm.models import PipelineCategory
from adm.services.meta_webhook_services import sanitize_meta_phone, get_next_round_robin_telecaller
from adm.tasks import trigger_dashboard_update_task

logger = logging.getLogger(__name__)
GRAPH_API_VERSION = getattr(settings, "GRAPH_API_VERSION", "v21.0")
FB_APP_ID = getattr(settings, "META_APP_ID", "2018600725468029")
FB_APP_SECRET = getattr(settings, "META_APP_SECRET", "MY_META_APP_SECRET_123")


# 1. CRM Helpers for Integration UI Dropdowns
def fetch_crm_pipelines_service(user):
    user_org = getattr(user, 'organization', None) if user else None
    qs = PipelineCategory.objects.all()
    if user_org:
        qs = qs.filter(organization=user_org)
    result = []
    for p in qs:
        stages_rel = getattr(p, 'pipeline_stages', None) or getattr(p, 'stages', None) or getattr(p, 'pipelinestage_set', None)
        stages_list = []
        if stages_rel is not None:
            stages_list = [{"id": s.id, "name": getattr(s, 'name', '')} for s in stages_rel.all().order_by("order_no", "id")]
        result.append({
            "id": p.id,
            "name": getattr(p, 'category_name', getattr(p, 'name', str(p))),
            "category_name": getattr(p, 'category_name', getattr(p, 'name', str(p))),
            "stages": stages_list
        })
    return result


def fetch_crm_campaigns_service(user, pipeline_id=None):
    user_org = getattr(user, 'organization', None) if user else None
    qs = CampaignName.objects.filter(is_active=True)
    if user_org:
        qs = qs.filter(organization=user_org)
    if pipeline_id:
        try:
            qs = qs.filter(pipeline_category_id=int(pipeline_id))
        except (ValueError, TypeError):
            pass
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
    account = FBAccount.objects.filter(id=account_id, organization=user.organization).first()
    if not account:
        raise ValidationError("Facebook Account not found.")

    user_token = decrypt_token(account.user_token)
    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/me/accounts?fields=id,name,access_token&access_token={user_token}"
    req = urllib.request.urlopen(url)
    data = json.loads(req.read().decode()).get("data", [])

    existing_connected = set(FBConnection.objects.filter(organization=user.organization).values_list("page_id", flat=True))
    return [{
        "id": p["id"],
        "name": p["name"],
        "connected": p["id"] in existing_connected
    } for p in data]


# 5. Fetch Forms of Page (using InputSerializer account_id & page_id)
def fetch_page_lead_forms(user, page_id: str, account_id: int):
    account = FBAccount.objects.filter(id=account_id, organization=user.organization).first()
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
def create_fb_connection(user, account_id=None, page_id=None, pipeline_id=None, routing_data=None, field_mapping=None, form_mode="all", form_ids=None, facebook_account=None, page_name="", forms=None):
    org = user.organization
    routing_data = routing_data or {}
    form_ids = form_ids or []
    forms = forms or []

    account = None
    if facebook_account:
        fb_user_id = str(facebook_account.get("id") or "")
        name = facebook_account.get("name") or "Facebook User"
        raw_user_token = facebook_account.get("accessToken") or ""
        if not raw_user_token:
            raise ValidationError("Missing Facebook Access Token.")

        # 🚀 Auto-Exchange: Convert Frontend short-lived token to 60-day Long-Lived User Token
        long_user_token = raw_user_token
        try:
            exchange_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/oauth/access_token?" + urllib.parse.urlencode({
                "grant_type": "fb_exchange_token",
                "client_id": FB_APP_ID,
                "client_secret": FB_APP_SECRET,
                "fb_exchange_token": raw_user_token
            })
            ex_req = urllib.request.urlopen(exchange_url)
            ex_data = json.loads(ex_req.read().decode())
            if ex_data.get("access_token"):
                long_user_token = ex_data["access_token"]
                logger.info("Successfully exchanged short-lived token for long-lived user token for %s", fb_user_id)
        except Exception as e:
            logger.warning("Could not exchange FB token for long-lived: %s", e)

        account, _ = FBAccount.objects.update_or_create(
            organization=org,
            fb_user_id=fb_user_id,
            defaults={
                "name": name,
                "user_token": encrypt_token(long_user_token),
                "token_expires_at": timezone.now() + timedelta(days=60),
                "created_by": user.username
            }
        )
    elif account_id:
        account = FBAccount.objects.filter(id=account_id, organization=org).first()

    if not account:
        raise ValidationError("Facebook Account not found.")

    # 409 Conflict: Same Page cannot be connected twice in same Org
    if FBConnection.objects.filter(organization=org, page_id=page_id).exists():
        raise ValidationError("This Facebook Page is already connected in your organization.")

    user_token = decrypt_token(account.user_token)
    p_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{page_id}?fields=access_token,name&access_token={user_token}"
    p_req = urllib.request.urlopen(p_url)
    p_data = json.loads(p_req.read().decode())
    page_token = p_data.get("access_token") or user_token
    fetched_page_name = p_data.get("name") or page_name or f"Page {page_id}"

    # Subscribe Page to Webhook
    try:
        sub_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{page_id}/subscribed_apps"
        sub_data = urllib.parse.urlencode({"subscribed_fields": "leadgen", "access_token": page_token}).encode()
        urllib.request.urlopen(urllib.request.Request(sub_url, data=sub_data, method="POST"))
    except Exception as e:
        logger.warning(f"Could not auto-subscribe page {page_id} to webhook: {e}")

    routing_type = routing_data.get("type", "existing")
    pipeline = PipelineCategory.objects.filter(id=pipeline_id).first()
    if not pipeline:
        raise ValidationError("Pipeline Category not found.")

    with transaction.atomic():
        campaign = None
        if routing_type == "new":
            campaign_name = (routing_data.get("campaignName") or f"{fetched_page_name} Campaign").strip()
            campaign = CampaignName.objects.create(name=campaign_name, pipeline_category=pipeline, organization=org)
        elif routing_type == "existing":
            raw_camp_id = routing_data.get("campaignId") or routing_data.get("campaign_id")
            if raw_camp_id:
                try:
                    campaign = CampaignName.objects.filter(id=int(raw_camp_id)).first()
                except (ValueError, TypeError):
                    campaign = None
            if not campaign:
                raise ValidationError("Selected campaign not found.")
            if campaign.pipeline_category_id and campaign.pipeline_category_id != pipeline.id:
                c_pipe = campaign.pipeline_category.category_name if campaign.pipeline_category else f"Pipeline {campaign.pipeline_category_id}"
                p_name = pipeline.category_name or f"Pipeline {pipeline.id}"
                raise ValidationError(f"Selected campaign '{campaign.name}' belongs to '{c_pipe}'. Please select a campaign that belongs to the '{p_name}' pipeline.")

        fallback_campaign = None
        fallback_id = routing_data.get("fallbackCampaignId") or routing_data.get("defaultCampaignId")
        if routing_type == "rules":
            rules = routing_data.get("rules", [])
            for r in rules:
                r_camp_id = r.get("campaign_id") or r.get("campaignId")
                if r_camp_id:
                    rc = CampaignName.objects.filter(id=int(r_camp_id)).first()
                    if rc and rc.pipeline_category_id and rc.pipeline_category_id != pipeline.id:
                        rc_pipe = rc.pipeline_category.category_name if rc.pipeline_category else f"Pipeline {rc.pipeline_category_id}"
                        p_name = pipeline.category_name or f"Pipeline {pipeline.id}"
                        raise ValidationError(f"Rule campaign '{rc.name}' belongs to '{rc_pipe}'. All rule campaigns must belong to the '{p_name}' pipeline.")
            if fallback_id:
                try:
                    fallback_campaign = CampaignName.objects.filter(id=int(fallback_id)).first()
                except (ValueError, TypeError):
                    fallback_campaign = None
                if fallback_campaign and fallback_campaign.pipeline_category_id and fallback_campaign.pipeline_category_id != pipeline.id:
                    fb_pipe = fallback_campaign.pipeline_category.category_name if fallback_campaign.pipeline_category else f"Pipeline {fallback_campaign.pipeline_category_id}"
                    p_name = pipeline.category_name or f"Pipeline {pipeline.id}"
                    raise ValidationError(f"Fallback campaign '{fallback_campaign.name}' belongs to '{fb_pipe}'. Please select a campaign that belongs to the '{p_name}' pipeline.")

        conn = FBConnection.objects.create(
            organization=org,
            fb_account=account,
            page_id=page_id,
            page_name=fetched_page_name,
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

        if form_mode == "specific":
            # Map form names if forms array is provided
            form_name_map = {}
            for f in forms:
                if isinstance(f, dict) and f.get("id"):
                    form_name_map[str(f["id"])] = f.get("name") or str(f["id"])

            all_fids = set(form_ids)
            for f in forms:
                if isinstance(f, dict) and f.get("id"):
                    all_fids.add(str(f["id"]))

            for fid in all_fids:
                fname = form_name_map.get(str(fid), str(fid))
                FBConnectionForm.objects.create(connection=conn, form_id=str(fid), form_name=fname, created_by=user.username)

    return conn


# 7. List Active Connections for Logged-in Org
def list_fb_connections_service(user, host: str):
    conns = FBConnection.objects.filter(organization=user.organization).select_related('campaign', 'pipeline', 'fb_account')
    result = []
    for c in conns:
        campaign_obj = getattr(c, 'campaign', None)
        routing_dict = {
            "type": getattr(c, 'routing_type', 'existing'),
            "campaignName": getattr(campaign_obj, 'name', '') if campaign_obj else "",
            "campaignId": str(getattr(campaign_obj, 'id', '')) if campaign_obj else ""
        }

        # Safe reverse relations for forms
        forms_qs = getattr(c, 'forms', None) or getattr(c, 'fbconnectionform_set', None)
        forms_list = []
        form_ids = []
        if forms_qs is not None:
            for f in forms_qs.all():
                form_id = getattr(f, 'form_id', '')
                form_name = getattr(f, 'form_name', form_id)
                form_ids.append(form_id)
                forms_list.append({"id": form_id, "name": form_name, "leadCount": 0, "status": "active"})

        # Safe reverse relations for logs
        logs_qs = getattr(c, 'logs', None) or getattr(c, 'fbleadlog_set', None)
        leads_count = logs_qs.filter(status="created").count() if logs_qs is not None else 0

        # Safe pipeline extraction (PipelineCategory uses category_name, not name!)
        pipeline_obj = getattr(c, 'pipeline', None)
        pipeline_id = getattr(pipeline_obj, 'id', None)
        pipeline_name = getattr(pipeline_obj, 'category_name', getattr(pipeline_obj, 'name', str(pipeline_obj) if pipeline_obj else ""))

        fb_acc = getattr(c, 'fb_account', None)
        fb_acc_name = getattr(fb_acc, 'name', '') if fb_acc else ""

        created_time = getattr(c, 'created_at', None) or getattr(c, 'created_date', None)

        result.append({
            "id": f"conn_{c.id}",
            "numericId": c.id,
            "pipelineId": pipeline_id,
            "pipelineName": pipeline_name,
            "pageId": getattr(c, 'page_id', ''),
            "pageName": getattr(c, 'page_name', f"Page {getattr(c, 'page_id', '')}"),
            "routing": routing_dict,
            "formMode": getattr(c, 'form_mode', 'all'),
            "formIds": form_ids,
            "forms": forms_list,
            "webhookUrl": f"{host}/api/v1/integrations/meta/webhook/",
            "status": getattr(c, 'status', 'active'),
            "createdAt": created_time.isoformat() if created_time else None,
            "totalLeadsSynced": leads_count,
            # Backward compatibility nested fields
            "uid": getattr(c, 'uid', str(c.id)),
            "page": {"id": getattr(c, 'page_id', ''), "name": getattr(c, 'page_name', '')},
            "facebookAccount": {"name": fb_acc_name},
            "pipeline": {"id": pipeline_id, "name": pipeline_name},
            "campaign": {"id": getattr(campaign_obj, 'id', None), "name": getattr(campaign_obj, 'name', None), "how": getattr(c, 'routing_type', 'existing')}
        })
    return result


# 8. Delete Connection (using InputSerializer connection_id)
def delete_fb_connection_service(user, connection_id):
    if isinstance(connection_id, str):
        clean_id = connection_id.replace("conn_", "").strip()
        connection_id = int(clean_id) if clean_id.isdigit() else clean_id

    conn = FBConnection.objects.filter(id=connection_id, organization=user.organization).first()
    if not conn:
        raise ValidationError("Connection not found.")

    page_id = conn.page_id
    page_token = decrypt_token(conn.page_token)
    user_id = getattr(user, 'id', None)

    # 1. Delete associated forms safely
    forms_qs = getattr(conn, 'forms', None) or getattr(conn, 'fbconnectionform_set', None)
    if forms_qs is not None:
        for f in forms_qs.all():
            try:
                f.save_delete(user_id=user_id)
            except Exception:
                super(SafeDeleteModel, f).delete()

    # 2. Delete connection safely from database
    try:
        conn.save_delete(user_id=user_id)
    except Exception:
        super(SafeDeleteModel, conn).delete()

    # 3. Unsubscribe page from Meta app if no other connections for this page
    if not FBConnection.objects.filter(page_id=page_id).exists():
        try:
            unsub_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{page_id}/subscribed_apps?access_token={page_token}"
            urllib.request.urlopen(urllib.request.Request(unsub_url, method="DELETE"))
        except Exception:
            pass


# 9. Lead Ingestion Processor
def process_single_leadgen_event(leadgen_id: str, form_id: str, page_id: str = "", connection_uid: str = "", direct_data: dict = None, ad_id: str = "", campaign_id: str = "", **kwargs):
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

    # Robust Multi-Format Duplicate Check against Lead Table
    clean_10 = phone_number[-10:] if len(phone_number) >= 10 else phone_number
    existing_lead_qs = Lead.objects.filter(
        Q(mobile_no=clean_10) |
        Q(mobile_no=f"+91 {clean_10}") |
        Q(mobile_no=f"+91{clean_10}") |
        Q(mobile_no=f"91{clean_10}") |
        Q(mobile_no__endswith=clean_10)
    )
    if conn and getattr(conn, 'org', None):
        existing_lead_qs = existing_lead_qs.filter(organization=conn.organization)
    existing_lead = existing_lead_qs.first()

    if existing_lead:
        logger.info("Meta Ad Lead #%s (%s) already exists in CRM. Skipping duplicate creation.", existing_lead.id, phone_number)
        FBLeadLog.objects.create(connection=conn, leadgen_id=leadgen_id, form_id=form_id, status="duplicate", error="Duplicate lead already exists in CRM")
        return existing_lead

    # Rules Routing: Form Name / Question field matching (supports equals, contains, not_equals)
    campaign = conn.campaign
    if conn.routing_type == "rules":
        matched_id = None
        for r in conn.rules:
            r_field = r.get("field", "form_name")
            r_op = r.get("operator", "contains")
            r_val = str(r.get("value") if r.get("value") is not None else r.get("contains", "")).lower()

            target_val = str(form_id).lower() if r_field == "form_name" else str(field_map.get(r_field, "")).lower()

            is_match = False
            if r_op == "equals":
                is_match = (target_val == r_val)
            elif r_op == "not_equals":
                is_match = (target_val != r_val)
            elif r_op == "contains":
                is_match = (r_val in target_val)

            if is_match:
                matched_id = r.get("campaign_id") or r.get("campaignId")
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
