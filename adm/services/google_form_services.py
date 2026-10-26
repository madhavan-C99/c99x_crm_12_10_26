import secrets
import logging
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import ValidationError

from adm.models.google_form_models import GoogleFormConnection
from telecalling.models import Lead, CampaignName, LeadSource, PipelineStage
from telecalling.models.delete_base_model import SafeDeleteModel
from adm.models import PipelineCategory
from adm.services.meta_webhook_services import sanitize_meta_phone, get_next_round_robin_telecaller
from adm.tasks import trigger_dashboard_update_task

logger = logging.getLogger(__name__)

SCRIPT_TEMPLATE = """// =========================================================================
// 📌 CRM Google Sheet & Form Auto-Sync Script
// 📖 Setup Instructions:
// 1. In Google Form -> Responses -> Click "Link to Sheets".
// 2. Open the linked Google Sheet -> Go to Extensions -> Apps Script.
// 3. Paste this code, select "setup" from the dropdown and click "Run".
// =========================================================================

var CRM_WEBHOOK_URL = "{webhook_url}";
var CRM_SECRET_KEY = "{secret_key}";

// 1. SETUP FUNCTION: Sets up both Instant Form Submission & Hourly Auto-Recovery triggers
function setup() {{
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {{
    ScriptApp.deleteTrigger(triggers[i]);
  }}
  
  // A. Trigger for new Form Submissions (Instant Real-time)
  ScriptApp.newTrigger("onFormSubmit")
    .forSpreadsheet(sheet)
    .onFormSubmit()
    .create();
    
  // B. Trigger for Hourly Auto-Sync (Recovers any missed/failed leads every 1 hour)
  ScriptApp.newTrigger("autoSyncMissedLeads")
    .timeBased()
    .everyHours(1)
    .create();
    
  Logger.log("Trigger setup completed successfully! Real-time & Hourly Auto-Sync active.");
}}

// 2. Menu Item: Allows manual one-click sync anytime
function onOpen() {{
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("CRM Sync 🔄")
    .addItem("Sync Missed Leads to CRM", "autoSyncMissedLeads")
    .addToUi();
}}

// 3. Real-time Trigger: Triggered when Form is submitted
function onFormSubmit(e) {{
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var row = e.range.getRow();
  sendRowToCRM(sheet, row);
}}

// 4. Hourly Recovery: Finds any non-SYNCED rows and syncs them automatically
function autoSyncMissedLeads() {{
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  if (lastRow < 2) return;
  
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var statusColIdx = headers.indexOf("CRM Status") + 1;
  
  if (statusColIdx === 0) return;
  
  for (var r = 2; r <= lastRow; r++) {{
    var status = String(sheet.getRange(r, statusColIdx).getValue()).trim();
    if (status !== "SYNCED") {{
      sendRowToCRM(sheet, r, statusColIdx);
      Utilities.sleep(1500);
    }}
  }}
}}

// 5. Core Ingestion: Sends row to CRM and marks SYNCED (green) or FAILED (red)
function sendRowToCRM(sheet, rowIdx, statusColIdx) {{
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sheet.getRange(rowIdx, 1, 1, lastCol).getValues()[0];
  
  if (!statusColIdx) {{
    statusColIdx = headers.indexOf("CRM Status") + 1;
    if (statusColIdx === 0) {{
      statusColIdx = lastCol + 1;
      sheet.getRange(1, statusColIdx).setValue("CRM Status");
    }}
  }}
  
  var responseData = [];
  for (var i = 0; i < headers.length; i++) {{
    if (headers[i] && headers[i] !== "CRM Status") {{
      var rawVal = values[i];
      var formattedVal = Array.isArray(rawVal) ? rawVal.join(", ") : String(rawVal || "");
      responseData.push({{
        question: String(headers[i]),
        answer: formattedVal
      }});
    }}
  }}
  
  var payload = {{
    formTitle: sheet.getName(),
    responseId: "sheet_row_" + rowIdx + "_" + new Date().getTime(),
    responses: responseData,
    secret: CRM_SECRET_KEY
  }};
  
  var options = {{
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  }};
  
  try {{
    var res = UrlFetchApp.fetch(CRM_WEBHOOK_URL, options);
    var code = res.getResponseCode();
    if (code >= 200 && code < 300) {{
      sheet.getRange(rowIdx, statusColIdx).setValue("SYNCED").setBackground("#d4edda");
      return true;
    }} else {{
      sheet.getRange(rowIdx, statusColIdx).setValue("FAILED").setBackground("#f8d7da");
      return false;
    }}
  }} catch (err) {{
    sheet.getRange(rowIdx, statusColIdx).setValue("FAILED").setBackground("#f8d7da");
    return false;
  }}
}}"""


# 1. Create Connection + Generate Apps Script
def create_google_form_connection_service(user, data: dict, host: str) -> dict:
    org = user.organization
    name = data.get("name", "").strip()
    if not name:
        raise ValidationError("Connection name is required.")

    routing = data.get("routing", {})
    routing_type = routing.get("type", "existing")
    
    campaign = None
    if routing_type == "existing":
        camp_id = routing.get("campaignId")
        campaign = CampaignName.objects.filter(id=camp_id).first()
        if not campaign:
            raise ValidationError(f"Campaign with ID {camp_id} not found.")
        if campaign.organization and campaign.organization != org:
            raise ValidationError(f"Campaign with ID {camp_id} does not belong to your organization.")
    elif routing_type == "new":
        camp_name = routing.get("campaignName", "").strip()
        if not camp_name:
            raise ValidationError("New campaignName is required.")
        default_pipe = PipelineCategory.objects.filter(organization=org).first()
        campaign = CampaignName.objects.create(
            name=camp_name,
            organization=org,
            pipeline_category=default_pipe,
            is_active=True,
            created_by=user.username
        )

    pipeline = getattr(campaign, 'pipeline_category', None) or PipelineCategory.objects.filter(organization=org).first()
    if not pipeline:
        raise ValidationError("No active Pipeline found for this organization.")

    uid = f"gform_{secrets.token_hex(6)}"
    secret = f"sec_gf_{secrets.token_hex(8)}"
    webhook_url = f"{host}/adm/webhook/google_forms/{uid}"

    script_code = SCRIPT_TEMPLATE.format(webhook_url=webhook_url, secret_key=secret)

    conn = GoogleFormConnection.objects.create(
        org=org,
        uid=uid,
        name=name,
        pipeline=pipeline,
        campaign=campaign,
        webhook_url=webhook_url,
        secret=secret,
        status="waiting",
        created_by=user.username
    )

    return {
        "id": conn.id,
        "uid": conn.uid,
        "name": conn.name,
        "webhookUrl": webhook_url,
        "secret": conn.secret,
        "scriptCode": script_code,
        "status": conn.status
    }


# 2. List Connections (for Frontend Polling)
def fetch_google_form_connections_service(user, host: str) -> list:
    conns = GoogleFormConnection.objects.filter(org=user.organization).select_related('pipeline', 'campaign')
    result = []
    for c in conns:
        webhook_url = c.webhook_url or f"{host}/adm/webhook/google_forms/{c.uid}"
        script_code = SCRIPT_TEMPLATE.format(webhook_url=webhook_url, secret_key=c.secret)
        pipe_obj = getattr(c, 'pipeline', None)
        camp_obj = getattr(c, 'campaign', None)

        result.append({
            "id": c.id,
            "uid": c.uid,
            "name": c.name,
            "pipeline": {
                "id": getattr(pipe_obj, 'id', None),
                "name": getattr(pipe_obj, 'category_name', getattr(pipe_obj, 'name', ''))
            },
            "campaign": {
                "id": getattr(camp_obj, 'id', None),
                "name": getattr(camp_obj, 'name', '')
            },
            "totalLeadsSynced": c.total_leads_synced,
            "failedLeadsCount": c.failed_leads_count,
            "status": c.status,
            "webhookUrl": webhook_url,
            "secret": c.secret,
            "scriptCode": script_code,
            "createdAt": c.created_at.isoformat() if c.created_at else None
        })
    return result


# 3. Delete Connection
def delete_google_form_connection_service(user, connection_id):
    conn = GoogleFormConnection.objects.filter(id=connection_id, org=user.organization).first()
    if not conn:
        raise ValidationError("Connection not found.")
    user_id = getattr(user, 'id', None)
    try:
        conn.save_delete(user_id=user_id)
    except Exception:
        super(SafeDeleteModel, conn).delete()


# 4. Ingest Lead from Google Form Webhook
def ingest_google_form_lead_service(uid: str, payload: dict) -> dict:
    conn = GoogleFormConnection.objects.filter(uid=uid).first()
    if not conn:
        return {"status": "error", "message": f"Connection with UID {uid} not found.", "code": 404}

    secret = payload.get("secret", "").strip()
    if secret != conn.secret:
        conn.status = "error"
        conn.failed_leads_count += 1
        conn.save(update_fields=["status", "failed_leads_count", "updated_at"])
        return {"status": "error", "message": "Forbidden: Invalid secret key.", "code": 403}

    responses = payload.get("responses", [])
    
    def extract_field(keywords, default=""):
        for r in responses:
            q = str(r.get("question", "")).lower()
            if any(k in q for k in keywords):
                val = r.get("answer")
                if val:
                    return str(val).strip()
        return default

    full_name = extract_field(["full name", "name", "student", "applicant", "candidate"], default="Google Form Lead")
    raw_phone = extract_field(["mobile", "phone", "contact", "whatsapp", "number"])
    email = payload.get("respondentEmail") or extract_field(["email", "mail"])
    city = extract_field(["city", "location", "place", "town", "native"])
    course_text = extract_field(["course", "subject", "branch"])
    course_obj = None
    if course_text:
        from telecalling.models import CourseName
        course_obj = CourseName.objects.filter(course_name__icontains=course_text.strip(), is_active=True).first()

    phone_number = sanitize_meta_phone(raw_phone)
    if not phone_number or len(phone_number) < 10:
        conn.failed_leads_count += 1
        conn.save(update_fields=["failed_leads_count", "updated_at"])
        return {"status": "error", "message": f"Valid 10-digit mobile number required.", "code": 400}

    # Robust Multi-Format Duplicate Check
    clean_10 = phone_number[-10:] if len(phone_number) >= 10 else phone_number
    existing_qs = Lead.objects.filter(
        Q(mobile_no=clean_10) |
        Q(mobile_no=f"+91 {clean_10}") |
        Q(mobile_no=f"+91{clean_10}") |
        Q(mobile_no=f"91{clean_10}") |
        Q(mobile_no__endswith=clean_10)
    )
    if conn and getattr(conn, 'org', None):
        existing_qs = existing_qs.filter(organization=conn.org)
    existing = existing_qs.first()
    if existing:
        conn.total_leads_synced += 1
        if conn.status == "waiting":
            conn.status = "active"
        conn.save(update_fields=["total_leads_synced", "status", "updated_at"])
        return {"status": "duplicate", "leadId": existing.id, "message": f"Lead with {phone_number} already in CRM."}

    stage = PipelineStage.objects.filter(pipeline_category=conn.pipeline).order_by("order_no", "id").first()
    source_obj, _ = LeadSource.objects.get_or_create(name="Google Forms", defaults={"is_active": True})
    assigned_user = get_next_round_robin_telecaller(conn.campaign)

    with transaction.atomic():
        lead = Lead.objects.create(
            organization=conn.org,
            full_name=full_name,
            mobile_no=phone_number,
            email=email or None,
            location=city or None,
            course_name=course_obj,
            lead_source=source_obj,
            campaign=conn.campaign,
            pipeline=conn.pipeline,
            pipeline_stage=stage,
            assigned_to=assigned_user,
            enquiry_date=timezone.now(),
            current_status="working",
            created_by=f"Google Form ({conn.name})"
        )

        conn.total_leads_synced += 1
        if conn.status == "waiting":
            conn.status = "active"
        conn.save(update_fields=["total_leads_synced", "status", "updated_at"])

    try:
        trigger_dashboard_update_task()
    except Exception:
        pass

    return {"status": "success", "leadId": lead.id}
