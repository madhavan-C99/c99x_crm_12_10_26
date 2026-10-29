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

GOOGLE_SHEET_SCRIPT_TEMPLATE = """// =========================================================================
// 📌 CRM ALL-IN-ONE SYNC (GOOGLE FORM + GOOGLE SHEET MANUAL TYPING)
// Features: 
// 1. Instant Live Sync on Typing (onEdit)
// 2. Google Form Submission Sync (onFormSubmit)
// 3. 10-Digit Mobile Validation with Visual Error Alerts
// 4. Smart Auto-Update (Name, Course, Location)
// 5. Zero Concurrency Duplicate Locking (SYNCING...)
// =========================================================================

var CRM_WEBHOOK_URL = "{webhook_url}";
var CRM_SECRET_KEY = "{secret_key}";
var TARGET_CAMPAIGN_ID = {campaign_id}; // 👈 Frontend generates this Campaign ID automatically!

// 1. One-Click Menu in Sheet
function onOpen() {{
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("CRM Sync 🔄")
    .addItem("▶️ Setup / Reset Triggers", "setupAllTriggers")
    .addSeparator()
    .addItem("⚡ Sync All Missed Leads (Manual)", "syncAllLeadsToCRM")
    .addToUi();
}}

// 2. Automated Trigger Setup
function setupAllTriggers() {{
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {{
    ScriptApp.deleteTrigger(triggers[i]);
  }}

  var sheet = SpreadsheetApp.getActiveSpreadsheet();

  // A. Trigger for Google Form Submissions
  ScriptApp.newTrigger("handleFormSubmit")
    .forSpreadsheet(sheet)
    .onFormSubmit()
    .create();

  // B. Trigger for Manual Typing in Sheet
  ScriptApp.newTrigger("handleInstantEdit")
    .forSpreadsheet(sheet)
    .onEdit()
    .create();

  SpreadsheetApp.getActiveSpreadsheet().toast("✅ Form & Sheet Sync Activated Successfully!", "CRM Sync", 5);
}}

// 3. Google Form Submission Handler
function handleFormSubmit(e) {{
  if (!e || !e.range) return;
  var row = e.range.getRow();
  var sheet = e.range.getSheet();
  syncSingleRow(sheet, row, 0);
}}

// 4. Manual Typing OnEdit Handler
function handleInstantEdit(e) {{
  if (!e || !e.range) return;
  var row = e.range.getRow();
  if (row < 2) return; // Ignore Header Row
  var sheet = e.range.getSheet();
  var col = e.range.getColumn();
  syncSingleRow(sheet, row, col);
}}

// 5. Core Ingestion Engine (Validations, Locking & Auto-Update)
function syncSingleRow(sheet, r, editedCol) {{
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var statusColIdx = headers.indexOf("CRM Status") + 1;
  
  if (statusColIdx === 0) {{
    statusColIdx = lastCol + 1;
    sheet.getRange(1, statusColIdx).setValue("CRM Status").setFontWeight("bold");
  }}

  // Dynamic Header Index Detection
  var nameColIdx = 0, phoneColIdx = 0, courseColIdx = 0, locColIdx = 0;
  for (var i = 0; i < headers.length; i++) {{
    var h = String(headers[i]).toLowerCase().trim();
    if (h.includes("name") || h.includes("student")) nameColIdx = i + 1;
    else if (h.includes("mobile") || h.includes("phone") || h.includes("contact")) phoneColIdx = i + 1;
    else if (h.includes("course")) courseColIdx = i + 1;
    else if (h.includes("location") || h.includes("city") || h.includes("place")) locColIdx = i + 1;
  }}

  var currentStatus = String(sheet.getRange(r, statusColIdx).getValue()).trim();

  // 💡 Smart Update Check: If already SYNCED, only re-send if Name, Course, or Location was edited
  var isDetailUpdate = (editedCol === nameColIdx || editedCol === courseColIdx || editedCol === locColIdx);
  if ((currentStatus === "SYNCED" || currentStatus.startsWith("SYNCED")) && !isDetailUpdate) {{
    return;
  }}
  if (currentStatus === "SYNCING...") {{
    return;
  }}

  var rawName = nameColIdx > 0 ? String(sheet.getRange(r, nameColIdx).getValue()).trim() : "";
  var rawPhone = phoneColIdx > 0 ? String(sheet.getRange(r, phoneColIdx).getValue()).trim() : "";
  var course = courseColIdx > 0 ? String(sheet.getRange(r, courseColIdx).getValue()).trim() : "";
  var location = locColIdx > 0 ? String(sheet.getRange(r, locColIdx).getValue()).trim() : "";

  var name = rawName !== "" ? rawName : "Website Enquiry";

  // Sanitize Mobile (+91 & 0 stripping)
  var cleanDigits = rawPhone.replace(/[^0-9]/g, "");
  if (cleanDigits.length === 12 && cleanDigits.startsWith("91")) cleanDigits = cleanDigits.substring(2);
  else if (cleanDigits.length === 11 && cleanDigits.startsWith("0")) cleanDigits = cleanDigits.substring(1);

  if (cleanDigits.length === 0) return;

  // ❌ 10-Digit Validation Error Alert
  if (cleanDigits.length !== 10) {{
    sheet.getRange(r, statusColIdx)
      .setValue("❌ Invalid Phone (" + cleanDigits.length + " digits)")
      .setBackground("#f8d7da");
    return;
  }}

  // 🔒 INSTANT ROW LOCK (Prevents duplicate triggers while typing)
  sheet.getRange(r, statusColIdx).setValue("SYNCING...").setBackground("#fff3cd");
  SpreadsheetApp.flush();

  var payload = {{
    secret_token: CRM_SECRET_KEY,
    name: name,
    mobile: cleanDigits,
    course: course,
    city: location,
    campaign_id: TARGET_CAMPAIGN_ID
  }};

  var options = {{
    method: "post",
    contentType: "application/json",
    headers: {{ "ngrok-skip-browser-warning": "true" }},
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  }};

  try {{
    var res = UrlFetchApp.fetch(CRM_WEBHOOK_URL, options);
    var code = res.getResponseCode();
    var resText = res.getContentText();
    
    if (code >= 200 && code < 300) {{
      if (resText.includes("duplicate") && !isDetailUpdate) {{
        sheet.getRange(r, statusColIdx).setValue("SYNCED (Duplicate)").setBackground("#e2e3e5");
      }} else {{
        sheet.getRange(r, statusColIdx).setValue("SYNCED").setBackground("#d4edda"); // Green
      }}
    }} else {{
      sheet.getRange(r, statusColIdx).setValue("FAILED").setBackground("#f8d7da");
    }}
  }} catch (err) {{
    sheet.getRange(r, statusColIdx).setValue("FAILED").setBackground("#f8d7da");
  }}
}}

// 6. Manual Bulk Sync Backup
function syncAllLeadsToCRM() {{
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  for (var r = 2; r <= lastRow; r++) {{
    syncSingleRow(sheet, r, 0);
    Utilities.sleep(150);
  }}
}}"""


GOOGLE_FORM_SCRIPT_TEMPLATE = """// =========================================================================
// 📌 CRM DIRECT GOOGLE FORM SYNC (PURE FORM - NO SHEET REQUIRED)
// Setup Instructions:
// 1. In your Google Form -> Click 3 Dots Menu (top right) -> Script Editor.
// 2. Paste this code, select "setup" from the dropdown and click "Run".
// =========================================================================

var CRM_WEBHOOK_URL = "{webhook_url}";
var CRM_SECRET_KEY = "{secret_key}";

// 1. One-Time Setup Function
function setup() {{
  var form = FormApp.getActiveForm();
  var triggers = ScriptApp.getUserTriggers(form);
  for (var i = 0; i < triggers.length; i++) {{
    ScriptApp.deleteTrigger(triggers[i]);
  }}
  
  ScriptApp.newTrigger("onFormSubmit")
    .forForm(form)
    .onFormSubmit()
    .create();
    
  Logger.log("✅ Google Form Real-Time Sync Activated!");
}}

// 2. Real-Time Form Submission Handler
function onFormSubmit(e) {{
  if (!e || !e.response) return;
  var itemResponses = e.response.getItemResponses();
  var responseData = [];
  
  for (var i = 0; i < itemResponses.length; i++) {{
    var item = itemResponses[i];
    responseData.push({{
      question: item.getItem().getTitle(),
      answer: String(item.getResponse() || "")
    }});
  }}
  
  var payload = {{
    formTitle: FormApp.getActiveForm().getTitle(),
    responseId: e.response.getId(),
    respondentEmail: e.response.getRespondentEmail() || "",
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
    UrlFetchApp.fetch(CRM_WEBHOOK_URL, options);
  }} catch (err) {{
    Logger.log("Sync Error: " + err);
  }}
}}"""

# Default backward compatibility alias
SCRIPT_TEMPLATE = GOOGLE_SHEET_SCRIPT_TEMPLATE


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

    script_code = GOOGLE_FORM_SCRIPT_TEMPLATE.format(
        webhook_url=webhook_url,
        secret_key=secret
    )

    conn = GoogleFormConnection.objects.create(
        organization=org,
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
    conns = GoogleFormConnection.objects.filter(
        organization=user.organization
    ).exclude(uid__startswith="gsheet_").select_related('pipeline', 'campaign')
    result = []
    for c in conns:
        webhook_url = c.webhook_url or f"{host}/adm/webhook/google_forms/{c.uid}"
        script_code = GOOGLE_FORM_SCRIPT_TEMPLATE.format(
            webhook_url=webhook_url,
            secret_key=c.secret
        )
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
    conn = GoogleFormConnection.objects.filter(id=connection_id, organization=user.organization).first()
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
        existing_qs = existing_qs.filter(organization=conn.organization)
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



# =========================================================================
# 📊 GOOGLE SHEET CONNECTION SERVICES (SpreadsheetApp Sync)
# =========================================================================

def create_google_sheet_connection_service(user, data: dict, host: str) -> dict:
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

    uid = f"gsheet_{secrets.token_hex(6)}"
    secret = f"sec_gs_{secrets.token_hex(8)}"
    camp_id = getattr(campaign, 'id', 1)
    webhook_url = f"{host}/adm/webhook/google_sheet_lead"

    script_code = GOOGLE_SHEET_SCRIPT_TEMPLATE.format(
        webhook_url=webhook_url,
        secret_key=secret,
        campaign_id=camp_id
    )

    conn = GoogleFormConnection.objects.create(
        organization=org,
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


def fetch_google_sheet_connections_service(user, host: str) -> list:
    conns = GoogleFormConnection.objects.filter(
        organization=user.organization,
        uid__startswith="gsheet_"
    ).select_related('pipeline', 'campaign')
    result = []
    for c in conns:
        camp_obj = getattr(c, 'campaign', None)
        camp_id = getattr(camp_obj, 'id', 1)
        webhook_url = f"{host}/adm/webhook/google_sheet_lead"
        script_code = GOOGLE_SHEET_SCRIPT_TEMPLATE.format(
            webhook_url=webhook_url,
            secret_key=c.secret,
            campaign_id=camp_id
        )
        pipe_obj = getattr(c, 'pipeline', None)

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


def delete_google_sheet_connection_service(user, connection_id):
    return delete_google_form_connection_service(user, connection_id)
