import logging
import re
from collections import Counter, defaultdict

from django.contrib.auth import get_user_model
from django.core.validators import validate_email
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from telecalling.models import Lead, CampaignName, LeadSource, PipelineStage
from telecalling.tasks.notification_task import send_lead_assigned_notification
from adm.models import Organization
from adm.tasks.export_task import trigger_dashboard_update_task

logger = logging.getLogger(__name__)

User = get_user_model()


def verify_lead_rows(user=None, rows=None, **kwargs):
    """
    Validates a list of lead dictionaries before final submission.
    - Checks required name and valid 10-digit mobile number
    - Validates email format if provided
    - Checks duplicate mobile numbers within the payload
    - Ultra-fast indexed B-tree check for existing mobile numbers in DB
    """
    if rows is None or not isinstance(rows, list):
        raise ValidationError("Rows must be a list.")
    if len(rows) == 0:
        raise ValidationError("Rows list cannot be empty.")
    if len(rows) > 25000:
        raise ValidationError("Maximum limit of 25,000 leads exceeded per request.")

    org = getattr(user, "organization", None) if user and getattr(user, "is_authenticated", False) else None
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
            except DjangoValidationError:
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

    # 1. Intra-payload Duplicate Check
    for index, row in enumerate(normalized_rows):
        mobile = row.get("mobile")
        if mobile and mobile_counts[mobile] > 1:
            errors_by_row[index].append({
                "field": "mobile",
                "message": "This mobile number is duplicated in the uploaded data."
            })

    # 2. Database Duplicate Check via Fast Indexed IN Query
    valid_mobiles = {
        row["mobile"][-10:]
        for row in normalized_rows
        if row.get("mobile") and re.fullmatch(r"[6-9]\d{9}", row["mobile"][-10:])
    }

    existing_mobiles = set()
    if valid_mobiles:
        possible_formats = []
        for m in valid_mobiles:
            possible_formats.extend([m, f"+91 {m}", f"+91{m}", f"91{m}"])

        for i in range(0, len(possible_formats), 5000):
            chunk = possible_formats[i:i+5000]
            lead_qs = Lead.objects.filter(mobile_no__in=chunk)
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


def _notify_assigned_safely(lead_ids, assigned_to_id, by_id):
    try:
        send_lead_assigned_notification(lead_ids, assigned_to_id, assigned_by_id=by_id)
    except Exception:
        logger.exception("Bulk lead notification failed for user %s", assigned_to_id)


def submit_lead_rows(user=None, rows=None, campaign_id=None, source_id=None, assigned_to_id=None, pipeline_stage_id=None, **kwargs):
    """
    Submits validated lead rows to the database in bulk:
    - Validates mandatory campaign_id and active assigned telecallers
    - Pre-fetches foreign keys into memory (zero DB queries inside the loop)
    - Distributes leads round-robin among active agents of the campaign
    - Performs atomic Lead.objects.bulk_create(batch_size=1000)
    - Triggers notification tasks and real-time dashboard updates
    """
    if rows is None or not isinstance(rows, list):
        raise ValidationError("Rows must be a list.")
    if len(rows) == 0:
        raise ValidationError("Rows list cannot be empty.")

    if not campaign_id:
        raise ValidationError("campaign_id is required.")

    default_campaign = CampaignName.objects.filter(id=campaign_id).first()
    if not default_campaign:
        raise ValidationError(f"Campaign with ID {campaign_id} not found.")

    # 1. Telecallers Check for Default Campaign
    campaign_telecallers = list(default_campaign.assigned_agents.filter(is_active=True))
    if not campaign_telecallers:
        raise ValidationError(f"No active telecaller in campaign '{default_campaign.name}'. Please assign active telecallers to this campaign.")

    # 2. Run Verification
    result = verify_lead_rows(user=user, rows=rows)
    rows_validation_info = result.get("rows", [])
    normalized_rows = result.get("normalized_rows", [])

    org = getattr(user, "organization", None) if user and getattr(user, "is_authenticated", False) else None
    if not org:
        org = Organization.objects.first()

    default_source = LeadSource.objects.filter(id=source_id).first() if source_id else LeadSource.objects.first()

    default_stage = None
    if pipeline_stage_id:
        default_stage = PipelineStage.objects.filter(id=pipeline_stage_id).first()
    if not default_stage and default_campaign and default_campaign.pipeline_category:
        default_stage = PipelineStage.objects.filter(
            pipeline_category=default_campaign.pipeline_category,
            is_active=True
        ).order_by("order_no", "id").first()
    if not default_stage:
        default_stage = PipelineStage.objects.order_by("order_no", "id").first()

    # 3. Pre-fetch Foreign Keys & Agents into Memory (Zero DB Queries Inside Loop)
    campaign_cache = {c.id: c for c in CampaignName.objects.all()}
    campaign_agents_cache = {c.id: list(c.assigned_agents.filter(is_active=True)) for c in CampaignName.objects.all()}
    source_cache = {s.id: s for s in LeadSource.objects.all()}
    stage_cache = {stg.id: stg for stg in PipelineStage.objects.all()}
    user_cache = {u.id: u for u in User.objects.filter(is_active=True)}

    rr_index = 0
    leads = []
    duplicate_count = 0
    duplicate_mobiles = []
    creator_info = f"{getattr(user, 'username', 'Admin')} (Lead Import)"
    now = timezone.now()

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

        # If row has other required field errors (e.g. invalid name), skip
        has_blocking_errors = any(err.get("field") in ["name", "mobile", "email"] for err in row_errors)
        if has_blocking_errors:
            continue

        row_camp_id = row.get("campaign_id") or campaign_id
        row_src_id = row.get("source_id") or source_id
        row_tele_id = row.get("assigned_to_id") or assigned_to_id
        row_stage_id = row.get("pipeline_stage_id")

        camp = campaign_cache.get(row_camp_id) or default_campaign
        src = source_cache.get(row_src_id) or default_source
        stage = stage_cache.get(row_stage_id) or default_stage

        row_campaign_agents = campaign_agents_cache.get(camp.id, []) if camp else campaign_telecallers
        if camp and not row_campaign_agents:
            raise ValidationError(f"No active telecaller in campaign '{camp.name}'.")

        tele_user = None
        if row_tele_id:
            tele_user = user_cache.get(row_tele_id)

        if not tele_user:
            if row_campaign_agents:
                tele_user = row_campaign_agents[rr_index % len(row_campaign_agents)]
                rr_index += 1
            else:
                tele_user = user

        formatted_mobile = f"+91 {row['mobile']}" if row.get("mobile") else ""

        lead_item = Lead(
            full_name=row.get("name") or "New Enquiry",
            email=row.get("email") or None,
            mobile_no=formatted_mobile or row.get("mobile", ""),
            organization=org,
            campaign=camp,
            lead_source=src,
            assigned_to=tele_user,
            pipeline_stage=stage,
            current_status="working",
            created_by=creator_info,
            enquiry_date=now
        )
        leads.append(lead_item)

    # 4. Atomic Bulk Insertion & Notifications
    if leads:
        with transaction.atomic():
            Lead.objects.bulk_create(leads, batch_size=1000)

            # Telecaller wise grouping for notifications
            assigned_map = defaultdict(list)
            for lead in leads:
                if lead.pk:
                    assigned_map[lead.assigned_to_id].append(lead.pk)

            for tc_id, ids in assigned_map.items():
                by_id = user.id if (user and tc_id != user.id) else None
                transaction.on_commit(
                    lambda uid=tc_id, ids=list(ids), by=by_id:
                        _notify_assigned_safely(ids, uid, by)
                )

        # Real-time WebSocket Dashboard Trigger
        try:
            trigger_dashboard_update_task()
        except Exception:
            pass

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
