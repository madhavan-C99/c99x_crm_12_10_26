import re
from collections import Counter

from django.contrib.auth import get_user_model
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import ValidationError as APIValidationError

from telecalling.models import Lead, CampaignName, LeadSource, PipelineStage

User = get_user_model()


def verify_lead_rows(rows, user):
    if not isinstance(rows, list):
        raise APIValidationError({"rows": "Rows must be a list."})

    org = getattr(user, "organization", None)
    normalized_rows = []
    errors_by_row = []
    mobile_counts = Counter()

    for row_number, row in enumerate(rows, start=1):
        if not isinstance(row, dict):
            normalized_rows.append({})
            errors_by_row.append([{
                "field": "row",
                "message": "Each row must be an object."
            }])
            continue

        name = str(row.get("name") or "").strip()
        email = str(row.get("email") or "").strip().lower()
        raw_mobile = re.sub(r"\D", "", str(row.get("mobile") or ""))
        mobile = raw_mobile[-10:] if len(raw_mobile) >= 10 else raw_mobile
        campaign_id = row.get("campaign_id")
        source_id = row.get("source_id")
        assigned_to_id = row.get("assigned_to_id")
        pipeline_stage_id = row.get("pipeline_stage_id")

        normalized_rows.append({
            "name": name,
            "email": email,
            "mobile": mobile,
            "campaign_id": campaign_id,
            "source_id": source_id,
            "assigned_to_id": assigned_to_id,
            "pipeline_stage_id": pipeline_stage_id,
        })

        errors = []

        if not name:
            errors.append({
                "field": "name",
                "message": "Name is required."
            })

        if email:
            try:
                validate_email(email)
            except ValidationError:
                errors.append({
                    "field": "email",
                    "message": "Enter a valid email address."
                })

        if not re.fullmatch(r"[6-9]\d{9}", mobile):
            errors.append({
                "field": "mobile",
                "message": "Enter a valid 10-digit mobile number."
            })
        else:
            mobile_counts[mobile] += 1

        errors_by_row.append(errors)

    for index, row in enumerate(normalized_rows):
        mobile = row.get("mobile")
        if mobile and mobile_counts[mobile] > 1:
            errors_by_row[index].append({
                "field": "mobile",
                "message": "This mobile number is duplicated in the uploaded data."
            })

    valid_mobiles = {
        row["mobile"][-10:]
        for row in normalized_rows
        if row.get("mobile") and re.fullmatch(r"[6-9]\d{9}", row["mobile"][-10:])
    }

    existing_mobiles = set()
    if valid_mobiles:
        mobile_q = Q()
        for m in valid_mobiles:
            mobile_q |= Q(mobile_no__endswith=m)

        lead_qs = Lead.objects.filter(mobile_q)
        if org:
            org_id = getattr(org, "id", org)
            lead_qs = lead_qs.filter(Q(organization_id=org_id) | Q(organization__isnull=True))

        for db_mob in lead_qs.values_list("mobile_no", flat=True):
            clean_db_mob = re.sub(r"\D", "", str(db_mob or ""))[-10:]
            if clean_db_mob:
                existing_mobiles.add(clean_db_mob)

    for index, row in enumerate(normalized_rows):
        row_mob = row.get("mobile", "")[-10:]
        if row_mob in existing_mobiles:
            errors_by_row[index].append({
                "field": "mobile",
                "message": "A lead with this mobile number already exists."
            })

    error_count = sum(len(errors) for errors in errors_by_row)

    return {
        "total_rows": len(rows),
        "valid_rows": sum(not errors for errors in errors_by_row),
        "invalid_rows": sum(bool(errors) for errors in errors_by_row),
        "error_count": error_count,
        "rows": [
            {
                "row_number": index + 1,
                "errors": errors,
            }
            for index, errors in enumerate(errors_by_row)
        ],
        "normalized_rows": normalized_rows,
    }


def submit_lead_rows(rows, user, campaign_id=None, source_id=None, assigned_to_id=None, pipeline_stage_id=None):
    result = verify_lead_rows(rows, user)
    rows_validation_info = result.get("rows", [])
    normalized_rows = result.get("normalized_rows", [])

    org = getattr(user, "organization", None)

    default_campaign = CampaignName.objects.filter(id=campaign_id).first() if campaign_id else None
    default_source = LeadSource.objects.filter(id=source_id).first() if source_id else None

    # 🎯 1. Fetch active telecallers assigned to the SELECTED campaign ONLY
    campaign_telecallers = list(default_campaign.assigned_agents.filter(is_active=True)) if default_campaign else []

    # 🛑 2. Strict Check: If campaign selected has no active telecallers, THROW ERROR!
    if default_campaign and not campaign_telecallers:
        raise APIValidationError(f"No active telecaller in campaign '{default_campaign.name}'. Please assign active telecallers to this campaign.")

    default_stage = None
    if pipeline_stage_id:
        default_stage = PipelineStage.objects.filter(id=pipeline_stage_id).first()
    if not default_stage and default_campaign and default_campaign.pipeline_category:
        default_stage = PipelineStage.objects.filter(
            pipeline_category=default_campaign.pipeline_category,
            is_active=True
        ).order_by("order_no").first()
    if not default_stage:
        default_stage = PipelineStage.objects.first()

    rr_index = 0
    leads = []
    duplicate_count = 0
    duplicate_mobiles = []

    for idx, row in enumerate(normalized_rows):
        row_errors = rows_validation_info[idx].get("errors", []) if idx < len(rows_validation_info) else []
        
        # Check if row has duplicate or mobile error
        is_duplicate_or_invalid = any(
            "duplicate" in str(err.get("message", "")).lower() or "already exists" in str(err.get("message", "")).lower()
            for err in row_errors
        )
        if is_duplicate_or_invalid:
            duplicate_count += 1
            if row.get("mobile"):
                duplicate_mobiles.append(row["mobile"])
            continue

        row_camp_id = row.get("campaign_id") or campaign_id
        row_src_id = row.get("source_id") or source_id
        row_tele_id = row.get("assigned_to_id") or assigned_to_id
        row_stage_id = row.get("pipeline_stage_id")

        camp = CampaignName.objects.filter(id=row_camp_id).first() if row_camp_id else default_campaign
        src = LeadSource.objects.filter(id=row_src_id).first() if row_src_id else default_source
        stage = PipelineStage.objects.filter(id=row_stage_id).first() if row_stage_id else default_stage

        # Get row-specific campaign agents
        row_campaign_agents = list(camp.assigned_agents.filter(is_active=True)) if (camp and camp != default_campaign) else campaign_telecallers
        if camp and not row_campaign_agents:
            raise APIValidationError(f"No active telecaller in campaign '{camp.name}'.")

        # Assign Telecaller: Specific ID or Round Robin among active telecallers of THIS campaign only
        tele_user = None
        if row_tele_id:
            tele_user = User.objects.filter(id=row_tele_id, is_active=True).first()

        if not tele_user:
            if row_campaign_agents:
                tele_user = row_campaign_agents[rr_index % len(row_campaign_agents)]
                rr_index += 1
            else:
                tele_user = user

        formatted_mobile = f"+91 {row['mobile']}" if row.get("mobile") else ""

        lead_item = Lead(
            full_name=row.get("name") or "New Enquiry",
            email=row.get("email"),
            mobile_no=formatted_mobile or row.get("mobile", ""),
            organization=org,
            campaign=camp,
            lead_source=src,
            assigned_to=tele_user,
            pipeline_stage=stage,
            created_by=user.username if hasattr(user, "username") else "admin",
        )
        leads.append(lead_item)

    if leads:
        with transaction.atomic():
            Lead.objects.bulk_create(leads)

    if len(leads) == 0 and duplicate_count > 0:
        return {
            "status": "success",
            "created_count": 0,
            "duplicate_count": duplicate_count,
            "message": f"0 new leads added. All {duplicate_count} lead(s) already exist in database and were skipped.",
            "skipped_duplicates": duplicate_mobiles
        }

    msg_detail = f"{len(leads)} leads created and assigned to active telecallers in campaign '{default_campaign.name if default_campaign else 'Campaign'}' via Round-Robin! {duplicate_count} duplicate mobile numbers skipped."

    return {
        "status": "success",
        "created_count": len(leads),
        "duplicate_count": duplicate_count,
        "message": msg_detail,
        "skipped_duplicates": duplicate_mobiles
    }

