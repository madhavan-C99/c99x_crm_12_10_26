"""
========================================================================================
📌 LEGACY GOOGLE SHEETS OAUTH SERVICES (COMMENTED OUT / PRESERVED AS REFERENCE)
========================================================================================
Notice: This OAuth & Google Drive polling system was replaced by the faster,
zero-verification Google Forms Direct Apps Script integration (see adm/services/google_form_services.py).
All code is preserved below as reference and can be re-enabled whenever needed.
========================================================================================

import json
import urllib.request
import urllib.parse
import hashlib
import logging
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from rest_framework.exceptions import ValidationError

from adm.models.google_sheet_models import GoogleAccount, GoogleSheetConnection, GoogleSheetLeadLog
from adm.services.fb_crypto_services import encrypt_token, decrypt_token
from adm.services.facebook_integration_services import get_next_round_robin_telecaller
from telecalling.models import Lead, CampaignName, LeadSource, PipelineStage
from telecalling.models.delete_base_model import SafeDeleteModel
from adm.models import PipelineCategory

logger = logging.getLogger(__name__)

GOOGLE_CLIENT_ID = getattr(settings, "GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = getattr(settings, "GOOGLE_CLIENT_SECRET", "")


# 1. OAuth URL Generator (Prompt for Refresh Token)
def generate_google_oauth_url(user, redirect_uri: str) -> str:
    org_id = getattr(user, 'organization_id', 1)
    user_id = user.id if user else 1
    state = f"{org_id}:{user_id}:{int(timezone.now().timestamp())}"
    
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
        "access_type": "offline",  # 🔑 Mandatory for getting Refresh Token!
        "prompt": "consent",
        "state": state
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"


# 2. Exchange Code for Refresh Token & Save Encrypted
def exchange_code_for_google_account(code: str, redirect_uri: str, user) -> GoogleAccount:
    token_url = "https://oauth2.googleapis.com/token"
    data = urllib.parse.urlencode({
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code"
    }).encode("utf-8")

    req = urllib.request.Request(token_url, data=data, method="POST")
    res = json.loads(urllib.request.urlopen(req).read().decode())
    
    access_token = res.get("access_token")
    refresh_token = res.get("refresh_token")
    
    # Fetch User Profile info from Google
    userinfo_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
    profile = json.loads(urllib.request.urlopen(userinfo_url).read().decode())

    org = user.organization
    defaults = {
        "google_email": profile.get("email", ""),
        "name": profile.get("name", "Google User"),
        "created_by": user.username,
        "updated_by": user.username
    }
    if refresh_token:
        defaults["refresh_token"] = encrypt_token(refresh_token)

    account, _ = GoogleAccount.objects.update_or_create(
        organization=org,
        google_user_id=profile["id"],
        defaults=defaults
    )
    return account


# 3. Get Fresh Access Token via Stored Encrypted Refresh Token
def get_valid_google_access_token(account: GoogleAccount) -> str:
    raw_refresh_token = decrypt_token(account.refresh_token)
    token_url = "https://oauth2.googleapis.com/token"
    data = urllib.parse.urlencode({
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "refresh_token": raw_refresh_token,
        "grant_type": "refresh_token"
    }).encode("utf-8")

    req = urllib.request.Request(token_url, data=data, method="POST")
    res = json.loads(urllib.request.urlopen(req).read().decode())
    return res["access_token"]


# 4. Fetch User's Spreadsheets from Google Drive
def fetch_user_spreadsheets_service(user, account_id: int):
    account = GoogleAccount.objects.filter(id=account_id, organization=user.organization).first()
    if not account:
        raise ValidationError("Google Account not found.")

    access_token = get_valid_google_access_token(account)
    # Search Spreadsheets in Drive
    query = urllib.parse.quote("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false")
    drive_url = f"https://www.googleapis.com/drive/v3/files?q={query}&fields=files(id,name,modifiedTime)&pageSize=100"
    
    req = urllib.request.Request(drive_url, headers={"Authorization": f"Bearer {access_token}"})
    data = json.loads(urllib.request.urlopen(req).read().decode())
    return data.get("files", [])


# 5. Fetch Sheet Tabs & Row 1 Column Headers
def fetch_sheet_details_service(user, account_id: int, spreadsheet_id: str):
    account = GoogleAccount.objects.filter(id=account_id, organization=user.organization).first()
    if not account:
        raise ValidationError("Google Account not found.")

    access_token = get_valid_google_access_token(account)
    
    # 1. Fetch Sheet Metadata (Tabs)
    meta_url = f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}?fields=sheets.properties"
    req = urllib.request.Request(meta_url, headers={"Authorization": f"Bearer {access_token}"})
    meta_data = json.loads(urllib.request.urlopen(req).read().decode())
    
    tabs = [s["properties"]["title"] for s in meta_data.get("sheets", [])]
    first_tab = tabs[0] if tabs else "Sheet1"

    # 2. Fetch Row 1 (Header Columns)
    tab_encoded = urllib.parse.quote(first_tab)
    header_url = f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{tab_encoded}!1:1"
    h_req = urllib.request.Request(header_url, headers={"Authorization": f"Bearer {access_token}"})
    h_data = json.loads(urllib.request.urlopen(h_req).read().decode())
    
    headers = h_data.get("values", [[]])[0]
    return {"tabs": tabs, "headers": headers}


# 6. Create Google Sheet Connection
def create_google_sheet_connection_service(user, account_id: int, spreadsheet_id: str, spreadsheet_name: str, sheet_tab_name: str, pipeline_id: int, routing_data: dict, field_mapping: dict, sync_historical: bool = False):
    org = user.organization
    account = GoogleAccount.objects.filter(id=account_id, organization=org).first()
    if not account:
        raise ValidationError("Google Account not found.")

    pipeline = PipelineCategory.objects.filter(id=pipeline_id).first()
    if not pipeline:
        raise ValidationError("Pipeline Category not found.")

    # Calculate Current Last Row
    last_row = 1
    if not sync_historical:
        try:
            access_token = get_valid_google_access_token(account)
            tab_enc = urllib.parse.quote(sheet_tab_name)
            cnt_url = f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{tab_enc}!A:A"
            req = urllib.request.Request(cnt_url, headers={"Authorization": f"Bearer {access_token}"})
            cnt_data = json.loads(urllib.request.urlopen(req).read().decode())
            last_row = len(cnt_data.get("values", []))
        except Exception:
            last_row = 1

    campaign = None
    if routing_data.get("type") == "existing":
        campaign = CampaignName.objects.filter(id=routing_data.get("campaignId")).first()
    elif routing_data.get("type") == "new":
        camp_name = routing_data.get("campaignName") or f"{spreadsheet_name} Leads"
        campaign = CampaignName.objects.create(name=camp_name, pipeline_category=pipeline, organization=org)

    conn, _ = GoogleSheetConnection.objects.update_or_create(
        organization=org,
        spreadsheet_id=spreadsheet_id,
        sheet_tab_name=sheet_tab_name,
        defaults={
            "google_account": account,
            "spreadsheet_name": spreadsheet_name,
            "pipeline": pipeline,
            "campaign": campaign,
            "field_mapping": field_mapping or {},
            "last_synced_row": max(1, last_row),
            "status": "active",
            "created_by": user.username,
            "updated_by": user.username
        }
    )
    return conn


# 7. List Active Connections for Logged-in Org
def list_google_sheet_connections_service(user):
    conns = GoogleSheetConnection.objects.filter(organization=user.organization).select_related("pipeline", "campaign")
    data = []
    for c in conns:
        data.append({
            "id": f"gs_conn_{c.id}",
            "numericId": c.id,
            "spreadsheetId": c.spreadsheet_id,
            "spreadsheetName": c.spreadsheet_name,
            "sheetTabName": c.sheet_tab_name,
            "sheetUrl": f"https://docs.google.com/spreadsheets/d/{c.spreadsheet_id}/edit",
            "pipelineId": c.pipeline.id if c.pipeline else None,
            "pipelineName": getattr(c.pipeline, 'category_name', getattr(c.pipeline, 'name', str(c.pipeline))) if c.pipeline else "",
            "routing": {
                "type": "existing",
                "campaignName": c.campaign.name if c.campaign else "",
                "campaignId": str(c.campaign.id) if c.campaign else ""
            },
            "totalLeadsSynced": c.logs.filter(status="created").count(),
            "status": c.status,
            "createdAt": c.created_at.isoformat() if c.created_at else None
        })
    return data


# 8. Delete Connection
def delete_google_sheet_connection_service(user, connection_id):
    if isinstance(connection_id, str):
        clean_id = connection_id.replace("gs_conn_", "").strip()
        connection_id = int(clean_id) if clean_id.isdigit() else clean_id

    conn = GoogleSheetConnection.objects.filter(id=connection_id, organization=user.organization).first()
    if not conn:
        raise ValidationError("Connection not found.")

    user_id = getattr(user, 'id', None)
    try:
        conn.save_delete(user_id=user_id)
    except Exception:
        super(SafeDeleteModel, conn).delete()


# 9. Ingest Newly Added Rows into CRM
def sync_single_google_sheet_connection(conn: GoogleSheetConnection):
    account = conn.google_account
    try:
        access_token = get_valid_google_access_token(account)
    except Exception as e:
        logger.error(f"Google Token Refresh Error for conn {conn.id}: {e}")
        conn.status = "error"
        conn.save(update_fields=["status"])
        return 0

    tab_enc = urllib.parse.quote(conn.sheet_tab_name)
    start_row = conn.last_synced_row + 1
    # Read newly appended rows
    range_url = f"https://sheets.googleapis.com/v4/spreadsheets/{conn.spreadsheet_id}/values/{tab_enc}!A{start_row}:Z"
    
    try:
        req = urllib.request.Request(range_url, headers={"Authorization": f"Bearer {access_token}"})
        res = json.loads(urllib.request.urlopen(req).read().decode())
    except Exception as e:
        logger.error(f"Failed to fetch rows from Google Sheet {conn.spreadsheet_id}: {e}")
        return 0

    new_rows = res.get("values", [])
    if not new_rows:
        return 0

    # Also fetch Header Row 1 for mapping column names to cell indexes
    header_url = f"https://sheets.googleapis.com/v4/spreadsheets/{conn.spreadsheet_id}/values/{tab_enc}!1:1"
    h_res = json.loads(urllib.request.urlopen(urllib.request.Request(header_url, headers={"Authorization": f"Bearer {access_token}"})).read().decode())
    headers = [h.strip() for h in h_res.get("values", [[]])[0]]
    header_idx_map = {name: idx for idx, name in enumerate(headers)}

    stage = PipelineStage.objects.filter(pipeline_category=conn.pipeline).order_by("order_no", "id").first()
    source_obj, _ = LeadSource.objects.get_or_create(name="Google Sheets / Google Forms", defaults={"is_active": True})
    assigned_user = get_next_round_robin_telecaller(conn.campaign)

    synced_count = 0
    mapping = conn.field_mapping

    for idx, row in enumerate(new_rows):
        current_row_no = start_row + idx

        def get_val(crm_field_name, fallback_keys=None):
            mapped_header = mapping.get(crm_field_name)
            if mapped_header and mapped_header in header_idx_map:
                col_i = header_idx_map[mapped_header]
                if col_i < len(row):
                    return str(row[col_i]).strip()
            if fallback_keys:
                for k in fallback_keys:
                    if k in header_idx_map and header_idx_map[k] < len(row):
                        return str(row[header_idx_map[k]]).strip()
            return ""

        full_name = get_val("full_name", ["Full Name", "Name", "Student Name"]) or "Google Form Lead"
        raw_phone = get_val("phone_number", ["Phone Number", "Phone", "Mobile", "Mobile Number", "Contact Number"])
        email = get_val("email", ["Email", "Email Address"])
        city = get_val("city", ["City", "Location", "Which City?"])

        # Sanitize Phone (+91 strip, 10 digits)
        digits = "".join([c for c in raw_phone if c.isdigit()])
        if digits.startswith("91") and len(digits) == 12:
            digits = digits[2:]
        phone_number = digits[-10:] if len(digits) >= 10 else digits

        row_hash = hashlib.sha256(f"{conn.spreadsheet_id}:{current_row_no}:{phone_number}".encode()).hexdigest()

        # Idempotency duplicate check
        if GoogleSheetLeadLog.objects.filter(row_hash=row_hash).exists():
            continue

        if not phone_number or len(phone_number) < 10:
            GoogleSheetLeadLog.objects.create(connection=conn, row_number=current_row_no, row_hash=row_hash, status="failed", error="Invalid phone number")
            continue

        with transaction.atomic():
            Lead.objects.create(
                organization=conn.org,
                full_name=full_name,
                mobile_no=phone_number,
                email=email or None,
                location=city or None,
                lead_source=source_obj,
                campaign=conn.campaign,
                pipeline=conn.pipeline,
                pipeline_stage=stage,
                assigned_to=assigned_user,
                enquiry_date=timezone.now(),
                current_status="working",
                created_by=f"Google Sheet ({conn.spreadsheet_name})"
            )
            GoogleSheetLeadLog.objects.create(
                connection=conn,
                row_number=current_row_no,
                row_hash=row_hash,
                status="created",
                raw_payload={"row": row}
            )
            synced_count += 1

    conn.last_synced_row += len(new_rows)
    conn.save(update_fields=["last_synced_row"])
    return synced_count
"""
