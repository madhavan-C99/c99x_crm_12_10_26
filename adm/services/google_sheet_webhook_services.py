import logging
from django.conf import settings
from django.utils import timezone
from django.db import connection, transaction
from django.db.models import Q

from telecalling.models import (
    Lead, CampaignName, LeadSource, PipelineStage, User, CourseName, CoursePlan
)
from adm.models import PipelineCategory
from adm.services.meta_webhook_services import sanitize_meta_phone, get_next_round_robin_telecaller
from adm.tasks import trigger_dashboard_update_task

logger = logging.getLogger(__name__)


def ingest_google_sheet_lead_to_crm(data: dict) -> dict:
    """
    Ingests enquiry leads from Google Sheets into CRM:
    1. Checks temporary pause switch
    2. Validates and sanitizes 10-digit mobile number
    3. Duplicate Check (skips duplicate leads to avoid confusing telecallers)
    4. Resolves Course Name / Course Plan if provided
    5. Resolves LeadSource, Campaign, Pipeline & Stage
    6. Auto Round-Robin assignment to eligible telecaller
    7. Sets enquiry_date = now (Office Hours 10 AM - 7 PM compliant)
    8. Triggers real-time dashboard notification
    """
    if getattr(settings, "GOOGLE_SHEET_LEADS_PAUSED", False):
        logger.warning("Google Sheet lead ingestion is paused in settings.")
        return {"status": "paused", "message": "Google Sheet lead ingestion is currently paused."}

    raw_phone = data.get("mobile") or data.get("phone") or data.get("mobile_no") or ""
    phone_number = sanitize_meta_phone(raw_phone)
    if len(phone_number) != 10:
        logger.error("Invalid phone number length from Google Sheet: %s", raw_phone)
        return {"status": "error", "message": f"Invalid 10-digit phone number: {raw_phone}"}

    full_name = data.get("name") or data.get("full_name") or "Website Enquiry"
    email = data.get("email") or ""
    city = data.get("city") or data.get("location") or ""
    course_text = data.get("course") or data.get("course_name") or ""

    # Source
    source_name = data.get("source") or "Website / Google Form"
    source_obj, _ = LeadSource.objects.get_or_create(name=source_name, defaults={'is_active': True})

    # Optional Course matching
    course_name_obj = None
    course_plan_obj = None
    if course_text:
        course_name_obj = CourseName.objects.filter(course_name__icontains=str(course_text).strip(), is_active=True).first()
        course_plan_obj = CoursePlan.objects.filter(course_plan__icontains=str(course_text).strip(), is_active=True).first()

    # Campaign, Pipeline & Stage resolution
    camp_id = data.get("campaign_id") or data.get("campaign")
    org_id = data.get("organization_id") or data.get("org_id")
    camp_qs = CampaignName.objects.filter(is_active=True)
    if org_id and str(org_id).isdigit():
        camp_qs = camp_qs.filter(organization_id=int(org_id))
    if camp_id and str(camp_id).isdigit():
        campaign = camp_qs.filter(id=int(camp_id)).first() or camp_qs.first()
    elif camp_id:
        campaign = camp_qs.filter(name__iexact=str(camp_id).strip()).first() or camp_qs.first()
    else:
        campaign = camp_qs.first()

    pipeline = campaign.pipeline_category if (campaign and campaign.pipeline_category) else PipelineCategory.objects.first()
    stage = None
    if pipeline:
        stage = PipelineStage.objects.filter(pipeline_category=pipeline).order_by('order_no', 'id').first()
    if not stage:
        stage = PipelineStage.objects.order_by('order_no', 'id').first()

    # Atomic creation with PostgreSQL Advisory Concurrency Lock
    auto_assign = getattr(settings, "GOOGLE_SHEET_AUTO_ASSIGN", True)


    with transaction.atomic():
        # 🔒 1. Database-Level Lock: Prevents simultaneous duplicate ingestion for same phone
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_xact_lock(hashtext(%s));", [phone_number])

        # 🔒 2. Duplicate Check INSIDE the Lock & Transaction
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
            logger.info("Google Sheet lead already exists in CRM (Lead #%s, %s)", existing_lead.id, phone_number)
            updated_fields = []
            if city and existing_lead.location != city:
                existing_lead.location = city
                updated_fields.append("location")
            if course_name_obj and existing_lead.course_name_id != getattr(course_name_obj, 'id', None):
                existing_lead.course_name = course_name_obj
                updated_fields.append("course_name")
            if course_plan_obj and existing_lead.course_plan_id != getattr(course_plan_obj, 'id', None):
                existing_lead.course_plan = course_plan_obj
                updated_fields.append("course_plan")
            if full_name and full_name != "Sheet Lead" and existing_lead.full_name != full_name:
                existing_lead.full_name = full_name
                updated_fields.append("full_name")
            if updated_fields:
                existing_lead.save(update_fields=updated_fields)
                logger.info("Updated existing lead #%s with latest fields: %s", existing_lead.id, updated_fields)
            return {
                "status": "updated" if updated_fields else "duplicate",
                "lead_id": existing_lead.id,
                "message": f"Lead already exists in CRM with Mobile #{phone_number}"
            }




        assigned_user = get_next_round_robin_telecaller(campaign) if auto_assign else None
        lead = Lead.objects.create(
            organization=getattr(campaign, 'organization', None),
            full_name=full_name,
            mobile_no=phone_number,
            email=email or None,
            location=city or None,
            course_name=course_name_obj,
            course_plan=course_plan_obj,
            lead_source=source_obj,
            campaign=campaign,
            pipeline=pipeline,
            pipeline_stage=stage,
            assigned_to=assigned_user,
            enquiry_date=timezone.now(),
            current_status="working",
            created_by=f"Google Sheet ({source_name})"
        )

    # Real-time dashboard update trigger
    try:
        trigger_dashboard_update_task()
    except Exception:
        pass

    logger.info("Successfully ingested Google Sheet Lead #%s (%s, %s) -> Assigned to: %s",
                lead.id, full_name, phone_number, assigned_user.username if assigned_user else "Unassigned")

    return {
        "status": "success",
        "lead_id": lead.id,
        "assigned_to": assigned_user.username if assigned_user else "Unassigned",
        "message": "Lead ingested successfully"
    }
