import secrets
import logging
from unittest import result
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import ValidationError

from adm.models.google_form_models import GoogleFormConnection
from telecalling.models import Lead, CampaignName, LeadSource, PipelineStage, CourseName
from telecalling.models.delete_base_model import SafeDeleteModel
from adm.models import PipelineCategory
from adm.services.meta_webhook_services import sanitize_meta_phone, get_next_round_robin_telecaller
from adm.tasks import trigger_dashboard_update_task

logger = logging.getLogger(__name__)


# =========================================================================
# 🛡️ BULLETPROOF PHONE VALIDATION & DUPLICATE CHECK HELPERS
# =========================================================================

def validate_and_clean_phone(raw_phone: str):
    """
    Strictly cleans and validates an Indian mobile number.
    Returns (clean_10_digits, error_message).
    - Rejects extra digits (>10)
    - Rejects incomplete digits (<10)
    - Rejects numbers not starting with 6, 7, 8, or 9
    - Rejects dummy numbers (all same digits like 9999999999)
    - Automatically strips prefixes: +91, 091, 910, 0
    """
    if not raw_phone or not str(raw_phone).strip():
        return None, "Mobile number is required and cannot be empty."

    raw_str = str(raw_phone).strip()
    digits = "".join(filter(str.isdigit, raw_str))

    if not digits:
        return None, f"Invalid mobile number '{raw_str}': No numeric digits found."

    # Normalize country code & leading zero prefixes:
    if len(digits) == 13 and (digits.startswith("910") or digits.startswith("091")):
        digits = digits[3:]
    elif len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]

    # Check exact digit count
    if len(digits) > 10:
        return None, f"Invalid mobile number '{raw_str}': Contains {len(digits)} digits (extra digits detected). Exactly 10 digits required."

    if len(digits) < 10:
        return None, f"Invalid mobile number '{raw_str}': Contains only {len(digits)} digits (incomplete). Exactly 10 digits required."

    # Strict Indian Mobile Starting Digit Rule (Must start with 6, 7, 8, or 9)
    if digits[0] not in ('6', '7', '8', '9'):
        return None, f"Invalid mobile number '{digits}': Must start with 6, 7, 8, or 9 (entered starts with '{digits[0]}')."

    # Dummy / Repeated Digits check (e.g. 9999999999, 8888888888, 0000000000)
    if len(set(digits)) == 1:
        return None, f"Invalid mobile number '{digits}': Dummy / repeated digits detected."

    return digits, None


def check_lead_duplicate(clean_10_digits: str, organization=None):
    """
    Checks if a lead with the given 10-digit mobile number already exists in DB.
    Checks all variations (+91, 91, 0, formatted with spaces/dashes, endswith).
    Returns existing Lead instance or None.
    """
    from django.db.models import Q, F, Func, Value

    if not clean_10_digits or len(clean_10_digits) != 10:
        return None

    dup_qs = Lead.objects.filter(
        Q(mobile_no=clean_10_digits) |
        Q(mobile_no=f"+91 {clean_10_digits}") |
        Q(mobile_no=f"+91{clean_10_digits}") |
        Q(mobile_no=f"91{clean_10_digits}") |
        Q(mobile_no=f"0{clean_10_digits}") |
        Q(mobile_no__endswith=clean_10_digits)
    )
    if organization:
        dup_qs = dup_qs.filter(Q(organization=organization) | Q(organization__isnull=True))

    existing = dup_qs.first()
    if existing:
        return existing

    # Fallback: Postgres regex digit-strip to catch messy custom formatting (e.g. "+91 98765-43210")
    try:
        fallback_qs = Lead.objects.annotate(
            clean_num=Func(
                F('mobile_no'),
                Value('[^0-9]'),
                Value(''),
                Value('g'),
                function='REGEXP_REPLACE'
            )
        ).filter(clean_num__endswith=clean_10_digits)
        if organization:
            fallback_qs = fallback_qs.filter(Q(organization=organization) | Q(organization__isnull=True))
        return fallback_qs.first()
    except Exception:
        return None


def extract_phone_field(responses):
    """
    Intelligently extracts the primary phone/mobile number from Google Form responses,
    strictly avoiding questions like 'Contact Address', 'Roll Number', 'Registration Number',
    'Aadhar Number', 'Door Number', or 'Alternative Phone'.
    """
    for r in responses:
        q = str(r.get("question", "")).lower().strip()
        if any(neg in q for neg in ["address", "alt", "secondary", "parent", "guardian", "father", "mother", "roll", "reg", "serial", "aadhar", "door", "pin", "account"]):
            continue
        if any(pos in q for pos in ["mobile number", "phone number", "whatsapp number", "contact number", "mobile", "phone", "whatsapp"]):
            val = str(r.get("answer") or "").strip()
            if val:
                return val

    for r in responses:
        q = str(r.get("question", "")).lower().strip()
        if any(neg in q for neg in ["address", "person", "name", "roll", "reg", "serial", "aadhar", "door", "pin", "account"]):
            continue
        if "contact" in q:
            val = str(r.get("answer") or "").strip()
            if val:
                return val

    for r in responses:
        q = str(r.get("question", "")).lower().strip()
        if any(neg in q for neg in ["address", "roll", "reg", "serial", "aadhar", "door", "pin", "account"]):
            continue
        if any(pos in q for pos in ["mobile", "phone", "whatsapp"]):
            val = str(r.get("answer") or "").strip()
            if val:
                return val

    return ""


def extract_name_field(responses, default="Google Form Lead"):
    for r in responses:
        q = str(r.get("question", "")).lower().strip()
        if any(neg in q for neg in ["father", "mother", "parent", "guardian", "college", "school", "company", "place"]):
            continue
        if any(pos in q for pos in ["full name", "student name", "candidate name", "applicant name", "your name", "name"]):
            val = str(r.get("answer") or "").strip()
            if val:
                return val
    return default


def extract_email_field(responses):
    for r in responses:
        q = str(r.get("question", "")).lower().strip()
        if "email" in q or "mail" in q:
            val = str(r.get("answer") or "").strip()
            if val:
                return val
    return ""


def extract_city_field(responses):
    for r in responses:
        q = str(r.get("question", "")).lower().strip()
        if any(k in q for k in ["city", "location", "place", "town", "native"]):
            val = str(r.get("answer") or "").strip()
            if val:
                return val
    return ""


def extract_course_field(responses):
    for r in responses:
        q = str(r.get("question", "")).lower().strip()
        if any(k in q for k in ["course", "subject", "branch", "program"]):
            val = str(r.get("answer") or "").strip()
            if val:
                return val
    return ""

GOOGLE_SHEET_SCRIPT_TEMPLATE = """// =========================================================================
// 📌 CRM ALL-IN-ONE SYNC (GOOGLE FORM + GOOGLE SHEET MANUAL TYPING)
// Features: 
// 1. Instant Live Sync on Typing (onEdit)
// 2. Google Form Submission Sync (onFormSubmit)
// 3. Strict 10-Digit Mobile Validation with Visual Alerts
// 4. Duplicate Check in CRM DB (skips duplicates, shows warning in Sheet)
// 5. Zero Concurrency Duplicate Locking (SYNCING...)
// =========================================================================

var CRM_WEBHOOK_URL = "{webhook_url}";
var CRM_SECRET_KEY = "{secret_key}";
var TARGET_CAMPAIGN_ID = {campaign_id}; // 👈 Frontend generates this Campaign ID automatically!

// 1. 🚀 MAIN SETUP FUNCTION (Apps Script-la "Run" click pannina direct-ah idhu thaan run aagum!)
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

  // B. Trigger for Manual Typing in Sheet (Instant Live Sync)
  ScriptApp.newTrigger("handleInstantEdit")
    .forSpreadsheet(sheet)
    .onEdit()
    .create();

  SpreadsheetApp.getActiveSpreadsheet().toast("✅ Live Sync Activated! Syncing all rows...", "CRM Sync", 5);

  // 🚀 Auto-sync any existing rows in the sheet immediately on setup
  syncAllLeadsToCRM();
}}

// 2. Menu in Sheet (Backup only)
function onOpen() {{
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("CRM Sync 🔄")
    .addItem("▶️ Setup / Reset Triggers", "setupAllTriggers")
    .addSeparator()
    .addItem("⚡ Sync All Missed Leads (Manual)", "syncAllLeadsToCRM")
    .addToUi();
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

  // Dynamic Header Index Detection (Prioritizes primary phone, avoids address and parent phone)
  var nameColIdx = 0, phoneColIdx = 0, fallbackPhoneIdx = 0, courseColIdx = 0, locColIdx = 0;
  for (var i = 0; i < headers.length; i++) {{
    var h = String(headers[i]).toLowerCase().trim();
    if (h.includes("name") && !h.includes("father") && !h.includes("mother") && !h.includes("college")) {{
      if (nameColIdx === 0) nameColIdx = i + 1;
    }} else if (h.includes("course") || h.includes("subject") || h.includes("branch")) {{
      if (courseColIdx === 0) courseColIdx = i + 1;
    }} else if (h.includes("location") || h.includes("city") || h.includes("place")) {{
      if (locColIdx === 0) locColIdx = i + 1;
    }} else {{
      var isExcluded = (h.includes("address") || h.includes("alt") || h.includes("secondary") || h.includes("parent") || h.includes("guardian") || h.includes("roll") || h.includes("reg") || h.includes("serial") || h.includes("aadhar") || h.includes("door") || h.includes("pin"));
      var isPhone = (h.includes("mobile") || h.includes("phone") || h.includes("whatsapp") || (h.includes("contact") && !h.includes("person") && !h.includes("name")));
      if (isPhone && !isExcluded && phoneColIdx === 0) {{
        phoneColIdx = i + 1;
      }} else if (isPhone && fallbackPhoneIdx === 0) {{
        fallbackPhoneIdx = i + 1;
      }}
    }}
  }}

  var activePhoneCol = phoneColIdx > 0 ? phoneColIdx : fallbackPhoneIdx;

  var currentStatus = String(sheet.getRange(r, statusColIdx).getValue()).trim();

  // 💡 Smart Update Check: If already SYNCED, only re-send if Name, Course, or Location was edited
  var isDetailUpdate = (editedCol === nameColIdx || editedCol === courseColIdx || editedCol === locColIdx);
  if ((currentStatus === "SYNCED" || currentStatus.startsWith("SYNCED") || currentStatus.startsWith("⚠️ Duplicate")) && !isDetailUpdate) {{
    return;
  }}
  if (currentStatus === "SYNCING...") {{
    return;
  }}

  var rawName = nameColIdx > 0 ? String(sheet.getRange(r, nameColIdx).getDisplayValue()).trim() : "";
  // 🚨 CRITICAL: Use getDisplayValue() to avoid float/scientific notation corruption!
  var rawPhone = activePhoneCol > 0 ? String(sheet.getRange(r, activePhoneCol).getDisplayValue()).trim() : "";
  var course = courseColIdx > 0 ? String(sheet.getRange(r, courseColIdx).getDisplayValue()).trim() : "";
  var location = locColIdx > 0 ? String(sheet.getRange(r, locColIdx).getDisplayValue()).trim() : "";

  var name = rawName !== "" ? rawName : "Website Enquiry";

  // Strict Mobile Normalization & Prefix Stripping (+91, 091, 910, 0)
  var cleanDigits = rawPhone.replace(/[^0-9]/g, "");
  if (cleanDigits.length === 13 && (cleanDigits.indexOf("910") === 0 || cleanDigits.indexOf("091") === 0)) {{
    cleanDigits = cleanDigits.substring(3);
  }} else if (cleanDigits.length === 12 && cleanDigits.indexOf("91") === 0) {{
    cleanDigits = cleanDigits.substring(2);
  }} else if (cleanDigits.length === 11 && cleanDigits.indexOf("0") === 0) {{
    cleanDigits = cleanDigits.substring(1);
  }}

  if (cleanDigits.length === 0) return;

  // ❌ Strict 10-Digit Validation with Clear Visual Alerts
  if (cleanDigits.length > 10) {{
    sheet.getRange(r, statusColIdx)
      .setValue("❌ Extra Digits (" + cleanDigits.length + " digits)")
      .setBackground("#f8d7da");
    return;
  }}
  if (cleanDigits.length < 10) {{
    sheet.getRange(r, statusColIdx)
      .setValue("❌ Incomplete (" + cleanDigits.length + " digits)")
      .setBackground("#f8d7da");
    return;
  }}
  var firstDigit = cleanDigits.charAt(0);
  if (firstDigit !== "6" && firstDigit !== "7" && firstDigit !== "8" && firstDigit !== "9") {{
    sheet.getRange(r, statusColIdx)
      .setValue("❌ Must start 6-9 (got " + firstDigit + ")")
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
    var resJson = {{}};
    try {{ resJson = JSON.parse(resText); }} catch (e) {{}}
    
    if (code >= 200 && code < 300) {{
      if (resJson.status === "duplicate" || resText.includes("duplicate")) {{
        var dupId = resJson.lead_id || resJson.leadId || "";
        sheet.getRange(r, statusColIdx)
          .setValue("⚠️ Duplicate (In CRM" + (dupId ? " #" + dupId : "") + ")")
          .setBackground("#fff3cd");
      }} else {{
        var leadId = resJson.lead_id || resJson.leadId || "";
        sheet.getRange(r, statusColIdx)
          .setValue("✅ SYNCED" + (leadId ? " (ID: " + leadId + ")" : ""))
          .setBackground("#d4edda"); // Green
      }}
    }} else {{
      var errMsg = resJson.message || "Failed (" + code + ")";
      sheet.getRange(r, statusColIdx).setValue("❌ " + errMsg).setBackground("#f8d7da");
    }}
  }} catch (err) {{
    sheet.getRange(r, statusColIdx).setValue("❌ Failed: " + err.message).setBackground("#f8d7da");
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
// 🚀 C99X CRM - GOOGLE FORM DIRECT STANDALONE SYNC SCRIPT
// =========================================================================

var CRM_WEBHOOK_URL    = "{webhook_url}";
var CRM_SECRET_KEY     = "{secret_key}";
var TARGET_CAMPAIGN_ID = {campaign_id};

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

function onFormSubmit(e) {{
  if (!e || !e.response) return;
  var form = FormApp.getActiveForm();
  var itemResponses = e.response.getItemResponses();
  var responseData = [];
  var primaryPhone = "";
  var fallbackPhone = "";
  
  for (var i = 0; i < itemResponses.length; i++) {{
    var item = itemResponses[i];
    var title = item.getItem().getTitle();
    var val = String(item.getResponse() || "").trim();
    responseData.push({{
      question: title,
      answer: val
    }});
    
    var tLow = title.toLowerCase();
    var isExcluded = (
      tLow.includes("address") ||
      tLow.includes("alt") ||
      tLow.includes("secondary") ||
      tLow.includes("parent") ||
      tLow.includes("guardian") ||
      tLow.includes("father") ||
      tLow.includes("mother") ||
      tLow.includes("roll") ||
      tLow.includes("reg") ||
      tLow.includes("serial") ||
      tLow.includes("aadhar") ||
      tLow.includes("door") ||
      tLow.includes("pin")
    );

    if (!isExcluded) {{
      if (tLow.includes("mobile") || tLow.includes("phone") || tLow.includes("whatsapp")) {{
        if (!primaryPhone) primaryPhone = val;
      }} else if (tLow.includes("contact") && !tLow.includes("person") && !tLow.includes("name")) {{
        if (!fallbackPhone) fallbackPhone = val;
      }}
    }}
  }}
  
  var rawPhone = primaryPhone || fallbackPhone || "";

  // 🛡️ Strict 10-Digit Normalization
  var cleanDigits = rawPhone.replace(/[^0-9]/g, "");
  if (cleanDigits.length === 13 && (cleanDigits.indexOf("910") === 0 || cleanDigits.indexOf("091") === 0)) {{
    cleanDigits = cleanDigits.substring(3);
  }} else if (cleanDigits.length === 12 && cleanDigits.indexOf("91") === 0) {{
    cleanDigits = cleanDigits.substring(2);
  }} else if (cleanDigits.length === 11 && cleanDigits.indexOf("0") === 0) {{
    cleanDigits = cleanDigits.substring(1);
  }}
  
  // ❌ Strict 10-Digit Validation
  if (cleanDigits.length > 10) {{
    Logger.log("❌ REJECTED: Mobile number '" + rawPhone + "' contains " + cleanDigits.length + " digits (extra digits detected). Exactly 10 digits required!");
    return;
  }}
  if (cleanDigits.length < 10) {{
    Logger.log("❌ REJECTED: Mobile number '" + rawPhone + "' contains only " + cleanDigits.length + " digits (incomplete). Exactly 10 digits required!");
    return;
  }}
  var firstDigit = cleanDigits.charAt(0);
  if (firstDigit !== "6" && firstDigit !== "7" && firstDigit !== "8" && firstDigit !== "9") {{
    Logger.log("❌ REJECTED: Mobile number must start with 6, 7, 8, or 9 (starts with '" + firstDigit + "')!");
    return;
  }}

  var payload = {{
    formTitle: form.getTitle(),
    responseId: e.response.getId(),
    respondentEmail: e.response.getRespondentEmail() || "",
    responses: responseData,
    secret: CRM_SECRET_KEY,
    campaign_id: TARGET_CAMPAIGN_ID
  }};
  
  var options = {{
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  }};
  
  try {{
    var res = UrlFetchApp.fetch(CRM_WEBHOOK_URL, options);
    var resCode = res.getResponseCode();
    var resBody = res.getContentText();
    var resJson = {{}};
    try {{ resJson = JSON.parse(resBody); }} catch (e) {{}}

    if (resCode >= 200 && resCode < 300) {{
      if (resJson.status === "duplicate") {{
        Logger.log("⚠️ CRM DUPLICATE: " + (resJson.message || "Lead already exists in DB. Skipped creation!"));
      }} else {{
        Logger.log("✅ Lead Synced to CRM: Lead ID " + (resJson.leadId || resJson.lead_id));
      }}
    }} else {{
      Logger.log("❌ CRM REJECTED (" + resCode + "): " + (resJson.message || resBody));
    }}
  }} catch (err) {{
    Logger.log("❌ Sync Error: " + err);
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

    camp_id = getattr(campaign, 'id', 1)
    script_code = GOOGLE_FORM_SCRIPT_TEMPLATE.format(
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


# 2. List Connections (for Frontend Polling)
def fetch_google_form_connections_service(user, host: str) -> list:
    conns = GoogleFormConnection.objects.filter(
        organization=user.organization
    ).exclude(uid__startswith="gsheet_").select_related('pipeline', 'campaign')
    result = []
    for c in conns:
        webhook_url = c.webhook_url or f"{host}/adm/webhook/google_forms/{c.uid}"
        camp_obj = getattr(c, 'campaign', None)
        camp_id = getattr(camp_obj, 'id', 1)
        script_code = GOOGLE_FORM_SCRIPT_TEMPLATE.format(
            webhook_url=webhook_url,
            secret_key=c.secret,
            campaign_id=camp_id
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
    conn = GoogleFormConnection.objects.filter(uid=uid).select_related('pipeline', 'campaign', 'organization').first()
    if not conn:
        return {"status": "error", "message": f"Connection with UID {uid} not found.", "code": 404}

    secret = payload.get("secret", "").strip()
    if secret != conn.secret:
        conn.status = "error"
        conn.failed_leads_count += 1
        conn.save(update_fields=["status", "failed_leads_count", "updated_at"])
        return {"status": "error", "message": "Forbidden: Invalid secret key.", "code": 403}

    responses = payload.get("responses", [])

    # 1. Smart Field Extraction (avoids negative keywords like Roll No, Address, Aadhar)
    full_name = extract_name_field(responses, default="Google Form Lead")
    raw_phone = extract_phone_field(responses)
    email = payload.get("respondentEmail") or extract_email_field(responses)
    city = extract_city_field(responses)
    course_text = extract_course_field(responses)
    course_obj = None
    if course_text:
        course_obj = CourseName.objects.filter(course_name__icontains=course_text.strip(), is_active=True).first()

    # 2. Strict Phone Validation (rejects extra digits, incomplete, invalid start)
    phone_number, phone_err = validate_and_clean_phone(raw_phone)
    if phone_err:
        conn.failed_leads_count += 1
        conn.save(update_fields=["failed_leads_count", "updated_at"])
        return {
            "status": "error",
            "message": phone_err,
            "raw_phone": raw_phone,
            "code": 400
        }

    # 3. Robust Multi-Format DB Duplicate Check (DO NOT CREATE LEAD IF DUPLICATE)
    existing = check_lead_duplicate(phone_number, organization=conn.organization)
    if existing:
        conn.total_leads_synced += 1
        if conn.status == "waiting":
            conn.status = "active"
        conn.save(update_fields=["total_leads_synced", "status", "updated_at"])
        return {
            "status": "duplicate",
            "leadId": existing.id,
            "message": f"Lead with mobile #{phone_number} already exists in CRM (Lead #{existing.id} - {existing.full_name}). Skipped duplicate creation.",
            "code": 200
        }

    stage = PipelineStage.objects.filter(pipeline_category=conn.pipeline, is_active=True).order_by("order_no", "id").first()
    if not stage:
        stage = PipelineStage.objects.filter(pipeline_category=conn.pipeline).order_by("order_no", "id").first()

    source_obj, _ = LeadSource.objects.get_or_create(name="Google Forms", defaults={"is_active": True, "organization": None})
    assigned_user = get_next_round_robin_telecaller(conn.campaign)

    with transaction.atomic():
        lead = Lead.objects.create(
            organization=conn.organization,
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

    return {
        "status": "success",
        "leadId": lead.id,
        "message": "Lead ingested successfully."
    }


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
    clean_host = host.replace("http://", "https://") if ("ngrok" in host or "devtunnels" in host) else host
    webhook_url = f"{clean_host}/adm/webhook/google_sheet_lead"

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
        clean_host = host.replace("http://", "https://") if ("ngrok" in host or "devtunnels" in host) else host
        webhook_url = f"{clean_host}/adm/webhook/google_sheet_lead"
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