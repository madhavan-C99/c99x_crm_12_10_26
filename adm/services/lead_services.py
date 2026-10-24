from asyncio.log import logger
import csv
import io
import math
import os
import re
from django.db import transaction
import openpyxl
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q, Count, Max
from rest_framework.exceptions import APIException, ValidationError

from telecalling.tasks.notification_task import _as_id_list, send_lead_assigned_notification, send_lead_reassigned_notification
from telecalling.models import (
    Lead, PaymentInfo, PaymentHistory, LossLeadDetail, FollowUp,
    CallDetails, CampaignName, LeadSource, PipelineStage,
    User, Course, CoursePlan, CourseName, Priority, LossReason, Notification
)
from ..models import AdminLossActionLog, AdminApprovedLossLead, AdminLeadReassignHistory, PaymentMode, PipelineCategory, Organization, campaign_assigned_agent
from .query_services import exec_raw_sql
from ..tasks.export_task import trigger_dashboard_update_task


def get_user_display_name(user_obj):
    
    # Safely gets user display name without AnonymousUser errors
    if not user_obj or not getattr(user_obj, 'is_authenticated', False):
        return None
    fname = (getattr(user_obj, 'first_name', '') or "").strip()
    lname = (getattr(user_obj, 'last_name', '') or "").strip()
    
    if fname and lname:
        if fname.lower() == lname.lower():
            return fname
        return f"{fname} {lname}"
    if fname:
        return fname
    return getattr(user_obj, 'username', 'User')


def format_datetime_ist(dt):
    if not dt:
        return "-"
    try:
        if hasattr(dt, "hour"):
            return timezone.localtime(dt).strftime("%d-%m-%Y %I:%M %p")
        return dt.strftime("%d-%m-%Y")
    except Exception:
        try:
            return dt.strftime("%d-%m-%Y %I:%M %p")
        except Exception:
            return str(dt)


def fetch_all_leads_admin(user=None, **data):
    
    # Admin scope version of fetch_leads()
    try:
        now = timezone.now()
        
        base_qs = Lead.objects.select_related(
            "pipeline",
            "assigned_to",
            "pipeline_stage",
            "pipeline_stage__pipeline_category",
            "campaign",
            "campaign__pipeline_category",
            "lead_source",
            "course_plan",
            "course_name",
            "course",
            "priority",
        )

        if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization', None):
            base_qs = base_qs.filter(Q(organization__isnull=True) | Q(organization=user.organization))
        elif user and getattr(user, 'is_authenticated', False) and not getattr(user, 'is_superuser', False):
            base_qs = base_qs.filter(organization__isnull=True)

        # 1. Search Filter
        search = data.get("search")
        if search:
            base_qs = base_qs.filter(
                Q(full_name__icontains=search) |
                Q(mobile_no__icontains=search) |
                Q(email__icontains=search)
            )

        # 2. Specific Telecaller / Assigned To Filter
        tele_id = data.get("assigned_to") or data.get("tele_id")
        if tele_id:
            if str(tele_id).isdigit():
                base_qs = base_qs.filter(assigned_to_id=int(tele_id))
            else:
                base_qs = base_qs.filter(
                    Q(assigned_to__username__iexact=str(tele_id)) |
                    Q(assigned_to__first_name__icontains=str(tele_id))
                )

        # 3. Dropdown & Pipeline Filters
        pipeline_id = data.get("pipeline_id")
        pipeline_name = data.get("pipeline_name")
        if pipeline_id:
            base_qs = base_qs.filter(
                Q(pipeline_id=pipeline_id) |
                Q(pipeline_stage__pipeline_category_id=pipeline_id)

            )
        elif pipeline_name and str(pipeline_name).strip():
            p_name = str(pipeline_name).strip()
            if p_name.lower() not in ["all", "all leads", "none", "null"]:
                base_qs = base_qs.filter(
                    Q(pipeline__category_name__icontains=p_name) |
                    Q(pipeline__display_name__icontains=p_name) |
                    Q(pipeline_stage__pipeline_category__category_name__icontains=p_name)


                ).distinct()

        # Note: stage filtering is applied strictly to selected_qs below, not base_qs, to preserve accurate stage counts

        source_id = data.get("source_id") or data.get("lead_source_id")
        if source_id:
            base_qs = base_qs.filter(lead_source_id=source_id)

        campaign_id = data.get("campaign_id") or data.get("campaign_name_id")
        if campaign_id:
            base_qs = base_qs.filter(campaign_id=campaign_id)

        if data.get("course_plan_id"):
            base_qs = base_qs.filter(course_plan_id=data.get("course_plan_id"))
        if data.get("course_name_id"):
            base_qs = base_qs.filter(course_name_id=data.get("course_name_id"))
        if data.get("priority_id"):
            base_qs = base_qs.filter(priority_id=data.get("priority_id"))

        # 4. Date Filter
        date_filter_type = str(data.get("date_filter_type") or data.get("date_filter") or "all").lower().strip()
        from_date = data.get("from_date")
        to_date = data.get("to_date")
        today = now.date()

        if date_filter_type == "today":
            from_date = to_date = today
        elif date_filter_type == "yesterday":
            from_date = to_date = today - timedelta(days=1)
        elif date_filter_type in ["last_7_days", "last 7 days", "weekly", "week"]:
            from_date, to_date = today - timedelta(days=7), today
        elif date_filter_type in ["last_30_days", "last 30 days", "30 days"]:
            from_date, to_date = today - timedelta(days=30), today
        elif date_filter_type in ["this_month", "this month", "monthly", "month"]:
            from_date, to_date = today.replace(day=1), today

        if from_date and to_date and str(from_date).strip() != "" and str(to_date).strip() != "":
            base_qs = base_qs.filter(enquiry_date__date__range=[from_date, to_date])

        # 5. Exclude ONLY UNAPPROVED loss leads (waiting in Loss Approval queue) from main leads list
        approved_loss_lead_ids = AdminApprovedLossLead.objects.values_list("lead_id", flat=True)
        unapproved_loss_ids = Lead.objects.filter(
            Q(pipeline_stage__stage_type="closed_lost") | Q(pipeline_stage__stage_type="terminal_closed") |
            Q(pipeline_stage_id=5) | Q(pipeline_stage__name__icontains="loss") | Q(pipeline_stage__name__icontains="lost")
        ).exclude(
            id__in=approved_loss_lead_ids
        ).values_list("id", flat=True)

        base_qs = base_qs.exclude(id__in=unapproved_loss_ids)

        new_lead_qs = base_qs.filter(
            Q(pipeline_stage__stage_type="open", pipeline_stage__order_no=1) |
            Q(pipeline_stage_id=1) | Q(pipeline_stage__name__icontains="new")
        ).distinct()

        in_progress_qs = base_qs.filter(
            Q(pipeline_stage_id=3) | Q(pipeline_stage__name__icontains="progress")
        ).distinct()

        follow_up_qs = base_qs.filter(
            Q(pipeline_stage__stage_type="open", pipeline_stage__order_no__gt=1) |
            Q(pipeline_stage_id=2) | Q(pipeline_stage__name__icontains="follow")
        ).exclude(id__in=in_progress_qs.values_list('id', flat=True)).distinct()

        won_qs = base_qs.filter(
            Q(pipeline_stage__stage_type="closed_won") | Q(pipeline_stage__stage_type="terminal_joined") |
            Q(pipeline_stage_id=4) | Q(pipeline_stage__name__icontains="won")
        ).distinct()

        lost_qs = base_qs.filter(
            Q(pipeline_stage__stage_type="closed_lost") | Q(pipeline_stage__stage_type="terminal_closed") |
            Q(pipeline_stage_id=5) | Q(pipeline_stage__name__icontains="loss") | Q(pipeline_stage__name__icontains="lost") |
            Q(id__in=approved_loss_lead_ids)
        ).distinct()

        # Missed / Pending followups: unattended past followups
        missed_follow_up_qs = base_qs.filter(
            id__in=FollowUp.objects.filter(is_attended=False, scheduled_at__lt=now).values_list("lead_id", flat=True)
        ).exclude(id__in=won_qs.values_list("id", flat=True)).exclude(id__in=lost_qs.values_list("id", flat=True)).distinct()

        tabs = {
            "all": base_qs,
            "new_lead": new_lead_qs,
            "new": new_lead_qs,
            "follow_up": follow_up_qs,
            "followup": follow_up_qs,
            "in_progress": in_progress_qs,
            "inprogress": in_progress_qs,
            "in-progress": in_progress_qs,
            "in progress": in_progress_qs,
            "missed_follow_up": missed_follow_up_qs,
            "pending_follow_up": missed_follow_up_qs,
            "won": won_qs,
            "lost": lost_qs,
            "loss": lost_qs,
        }

        canonical_tabs = {
            "all": tabs["all"],
            "new_lead": tabs["new_lead"],
            "follow_up": tabs["follow_up"],
            "in_progress": tabs["in_progress"],
            "missed_follow_up": tabs["missed_follow_up"],
            "won": tabs["won"],
            "lost": tabs["lost"],
        }
        canonical_counts = {key: qs.count() for key, qs in canonical_tabs.items()}
        tab_count_keys = {
            "all": "all",
            "new_lead": "new_lead",
            "new": "new_lead",
            "follow_up": "follow_up",
            "followup": "follow_up",
            "in_progress": "in_progress",
            "inprogress": "in_progress",
            "in-progress": "in_progress",
            "missed_follow_up": "missed_follow_up",
            "pending_follow_up": "missed_follow_up",
            "won": "won",
            "lost": "lost",
            "loss": "lost",
        }
        tab_counts = {
            key: canonical_counts[count_key]
            for key, count_key in tab_count_keys.items()
        }
        stats = {
            "total_count": canonical_counts["all"],
            "total": canonical_counts["all"],
            "all_count": canonical_counts["all"],
            "new_count": canonical_counts["new_lead"],
            "new_lead_count": canonical_counts["new_lead"],
            "followup_count": canonical_counts["follow_up"],
            "follow_up_count": canonical_counts["follow_up"],
            "in_progress_count": canonical_counts["in_progress"],
            "inprogress_count": canonical_counts["in_progress"],
            "missed_count": canonical_counts["missed_follow_up"],
            "pending_follow_up_count": canonical_counts["missed_follow_up"],
            "won_count": canonical_counts["won"],
            "lost_count": canonical_counts["lost"],
            "loss_count": canonical_counts["lost"],
        }

        # Dynamically populate stage counts by pipeline_stage_id from database
        stage_counts_qs = base_qs.values('pipeline_stage_id').annotate(cnt=Count('id'))
        for sc in stage_counts_qs:
            stg_id = sc['pipeline_stage_id']
            if stg_id:
                stats[f"{stg_id}_count"] = sc['cnt']
                stats[str(stg_id)] = sc['cnt']

        # Ensure all pipeline stages have an entry in stats (even if 0 leads)
        stg_filter = Q(is_active=True)
        if pipeline_id:
            stg_filter &= Q(pipeline_category_id=pipeline_id)
        pipeline_stages_list = list(PipelineStage.objects.filter(stg_filter).order_by("order_no", "id"))
        for ps in pipeline_stages_list:
            if str(ps.id) not in stats:
                stats[str(ps.id)] = 0
                stats[f"{ps.id}_count"] = 0
            clean_name = ps.name.lower().replace(" ", "_").replace("-", "_")
            if clean_name not in stats:
                stats[f"{clean_name}_count"] = stats.get(str(ps.id), 0)
            stats[f"{ps.id}_color"] = ps.stage_color or ""
            stats[f"{clean_name}_color"] = ps.stage_color or ""

        stage_wise_count = [
            {
                "pipeline_stage_id": ps.id,
                "id": ps.id,
                "name": ps.name,
                "label": ps.display_value or ps.name,
                "order_no": ps.order_no,
                "stage_type": ps.stage_type,
                "stage_color": ps.stage_color or "",
                "count": stats.get(str(ps.id), 0),
                "value": stats.get(str(ps.id), 0),
            }
            for ps in pipeline_stages_list
        ]

        # 6. Sorting & Stage Tab Selection (Filtered strictly for table display, without mutating stats)
        sort_order = str(data.get("sort_order") or "").lower().strip()
        sort_by = data.get("sort_by") or "-created_at"
        if sort_order == "newest":
            sort_by = "-created_at"
        elif sort_order == "oldest":
            sort_by = "created_at"

        stage_target_id = data.get("lead_stage_id") or data.get("pipeline_stage_id") or data.get("stage_id")
        lead_filter_type = str(data.get("lead_filter_type") or "all").lower().strip()

        if stage_target_id and str(stage_target_id).isdigit() and int(stage_target_id) > 0:
            selected_qs = base_qs.filter(pipeline_stage_id=int(stage_target_id)).order_by(sort_by)
        elif lead_filter_type in tabs:
            selected_qs = tabs[lead_filter_type].order_by(sort_by)
        else:
            selected_qs = tabs["all"].order_by(sort_by)

        total = selected_qs.count()
        page_size_input = data.get("rows_per_page") or data.get("page_size")
        
        raw_page = data.get("page")
        if raw_page is None or str(raw_page).lower() in ["none", "", "0"] or int(raw_page or 1) <= 1:
            page = 1
        else:
            page = int(raw_page)

        if str(page_size_input).lower() in ["0", "all", "none"] or page_size_input == 0:
            page_size = total if total > 0 else 1000
            start = 0 
            rows = selected_qs
        else:
            page_size = int(page_size_input or 50)
            start = (page - 1) * page_size
            end = start + page_size
            rows = selected_qs[start:end]


        leads = []
        rows_list = list(rows)
        row_lead_ids = [l.id for l in rows_list]

        latest_calls = {}
        if row_lead_ids:
            for cd in CallDetails.objects.filter(lead_id__in=row_lead_ids).order_by('created_at'):
                latest_calls[cd.lead_id] = cd

        latest_followups = {}
        if row_lead_ids:
            for fu in FollowUp.objects.filter(lead_id__in=row_lead_ids, is_attended=False).order_by('scheduled_at'):
                if fu.lead_id not in latest_followups:
                    latest_followups[fu.lead_id] = fu

        payments_map = {}
        if row_lead_ids:
            for pm in PaymentInfo.objects.filter(lead_id__in=row_lead_ids):
                payments_map[pm.lead_id] = pm

        for idx, lead in enumerate(rows_list, start=start + 1):
            latest_call = latest_calls.get(lead.id)
            latest_followup = latest_followups.get(lead.id)
            payment_info = payments_map.get(lead.id)
            
            course_fee = lead.course.course_fees if (lead.course and hasattr(lead.course, 'course_fees')) else 0
            if not course_fee and payment_info:
                course_fee = (payment_info.amount_paid or 0) + (payment_info.pending_amount or 0)
            
            pending_amt = payment_info.pending_amount if payment_info else 0

            tag_name = "-"
            tag_id_val = None

            if lead.priority:
                tag_name = getattr(lead.priority, 'display_value', None) or lead.priority.name or "-"
                tag_id_val = lead.priority.id

            c_plan_name = None
            if lead.course_plan:
                c_plan_name = getattr(lead.course_plan, 'courseplan', None) or getattr(lead.course_plan, 'name', None)

            c_name = None
            if lead.course_name:
                c_name = getattr(lead.course_name, 'coursename', None) or getattr(lead.course_name, 'name', None)

            p_id = None
            p_name = None
            if lead.pipeline:
                p_id = lead.pipeline.id
                p_name = lead.pipeline.category_name or lead.pipeline.display_name
            elif lead.pipeline_stage and lead.pipeline_stage.pipeline_category:
                p_id = lead.pipeline_stage.pipeline_category.id
                p_name = lead.pipeline_stage.pipeline_category.category_name or lead.pipeline_stage.pipeline_category.display_name
            elif lead.campaign and lead.campaign.pipeline_category:
                p_id = lead.campaign.pipeline_category.id
                p_name = lead.campaign.pipeline_category.category_name or lead.campaign.pipeline_category.display_name

            stage_display = lead.pipeline_stage.name if lead.pipeline_stage else "-"
            stage_color = lead.pipeline_stage.stage_color if (lead.pipeline_stage and lead.pipeline_stage.stage_color) else None
            last_contacted_str = None
            if latest_call:
                call_dt = latest_call.called_at or latest_call.created_at
                if call_dt:
                    try:
                        last_contacted_str = timezone.localtime(call_dt).strftime("%d-%m-%Y %I:%M %p")
                    except Exception:
                        last_contacted_str = call_dt.strftime("%d-%m-%Y %I:%M %p")
            leads.append({
                "id": lead.id,
                "full_name": lead.full_name or "",
                "mobile_no": lead.mobile_no or "",
                "pipeline_id": p_id,
                "pipeline_name": p_name,


                "stage_name": stage_display,
                "stage_id": lead.pipeline_stage_id,
                "stage_color": stage_color,

                "assigned_to_id": lead.assigned_to_id,
                "assigned_to": get_user_display_name(lead.assigned_to),


                "campaign_id": lead.campaign_id,
                "campaign_name": lead.campaign.name if lead.campaign else None,
                "source_id": lead.lead_source_id,
                "source_name": lead.lead_source.name if lead.lead_source else None,
                "course_name_id": lead.course_name_id,
                "course_name": c_name,
                "course_plan_id": lead.course_plan_id,
                "course_plan_name": c_plan_name,
                "next_follow_up": format_datetime_ist(latest_followup.scheduled_at) if latest_followup else "-",
                "amount": course_fee,
                "pending_amount": pending_amt,
                "last_contacted": last_contacted_str or "-",
                "last_conversation_outcome": latest_call.conversation_summary if latest_call else None,

                "created_at": format_datetime_ist(lead.created_at or lead.enquiry_date),
            })

        total_pages = math.ceil(total / page_size) if (page_size and page_size > 0 and total > 0) else 1

        return {
            "total_records": total,
            "total_count": total,
            "total": total,
            "leads": leads,
            "stats": stats,
            "tab_counts": tab_counts,
            "stage_wise_count": stage_wise_count,
            "stage_tabs": stage_wise_count,
            "stages": stage_wise_count,
            "page": page,
            "current_page": page,
            "page_size": page_size,
            "rows_per_page": page_size,
            "total_pages": total_pages
        }

    except Exception as e:
        raise APIException(str(e))


# ------------------------------------- admin add new lead services ------------------------------------------

def get_add_lead_dropdowns_admin(user=None):
    user_org = getattr(user, 'organization', None) if (user and getattr(user, 'is_authenticated', False)) else None
    
    # 1. Pipelines from PipelineCategory table (Strictly from Database!)
    pipeline_qs = PipelineCategory.objects.filter(is_active=True)
    if user_org:
        pipeline_qs = pipeline_qs.filter(organization=user_org)
    pipelines = [
        {
            "id": p.id,
            "name": p.category_name,
            "category_name": p.category_name,
            "display_name": p.display_name or p.category_name
        }
        for p in pipeline_qs.order_by("id")
    ]

    # 2. Campaigns from CampaignName table
    campaigns_qs = CampaignName.objects.filter(is_active=True)
    if user_org:
        campaigns_qs = campaigns_qs.filter(organization=user_org)
    campaigns = [
        {"id": c.id, "name": c.name, "pipeline_category_id": c.pipeline_category_id}
        for c in campaigns_qs.order_by("id")
    ]

    # 3. Sources from LeadSource table
    sources_qs = LeadSource.objects.filter(is_active=True)
    if user_org:
        sources_qs = sources_qs.filter(organization=user_org)
    sources = [{"id": s.id, "name": s.name} for s in sources_qs.order_by("id")]

    # 4. Telecallers from User table
    users_qs = User.objects.filter(is_active=True)
    if user_org:
        users_qs = users_qs.filter(organization=user_org)
    users_qs = users_qs.filter(
        Q(user_roles__role__name__iexact='telecaller') |
        Q(user_roles__role__name__iexact='executive') |
        Q(user_roles__role__code__in=['TEL', 'EXE']) |
        Q(user_type__iexact='telecaller') |
        Q(user_type__iexact='executive')
    ).distinct().order_by("first_name")
    telecallers = [
        {
            "id": u.id,
            "value": u.id,
            "name": get_user_display_name(u) or u.username,
            "label": get_user_display_name(u) or u.username
        }
        for u in users_qs
    ]

    return {
        "pipelines": pipelines,
        "pipeline_stages": pipelines,
        "pipeline": pipelines,
        "campaigns": campaigns,
        "sources": sources,
        "telecallers": telecallers
    }


def _notify_new_lead_safely(lead_id, assigned_to_id, assigned_by_id):
    # notification fail aanaalum lead creation success ah irukkanum
    try:
        print(f"📌 Notifying new lead assignment: lead_id={lead_id}, assigned_to_id={assigned_to_id}, assigned_by_id={assigned_by_id}")
        send_lead_assigned_notification(lead_id, assigned_to_id, assigned_by_id=assigned_by_id)
        print(f"📌 Notification task queued for lead {lead_id} to user {assigned_to_id}")
    except Exception:
        logger.exception("New lead notification failed for lead %s", lead_id)  

    
def add_new_lead_admin(user, **data):
    """
    Creates a new lead with AnonymousUser safety, saving pipeline and stage dynamically from database.
    """
    raw_mobile = str(data.get("mobile_no") or data.get("mobile") or "").strip()
    if not raw_mobile:
        raise ValidationError("Mobile number is required.")

    clean_digits = "".join(filter(str.isdigit, raw_mobile))
    if len(clean_digits) == 12 and clean_digits.startswith("91"):
        mobile_no = clean_digits[2:]
    elif len(clean_digits) == 11 and clean_digits.startswith("0"):
        mobile_no = clean_digits[1:]
    else:
        mobile_no = clean_digits

    if len(mobile_no) != 10:
        raise ValidationError(f"Mobile number must be exactly 10 digits. (Received {len(mobile_no)} digits)")

    if not re.fullmatch(r"[6-9]\d{9}", mobile_no):
        raise ValidationError("Invalid mobile number. Must start with 6, 7, 8, or 9.")
    if False and not mobile_no:
        raise ValidationError("Mobile number is required.")
    
    # 1. Ultra-Smart Duplicate Check (Clean Digits & Last 10 Digits Matching)
    clean_digits = "".join(filter(str.isdigit, str(mobile_no)))
    last_10 = clean_digits[-10:] if len(clean_digits) >= 10 else clean_digits
    
    if last_10:
        existing_lead = Lead.objects.filter(
            Q(mobile_no__icontains=mobile_no) |
            Q(mobile_no__endswith=last_10)
        ).first()
        if existing_lead:
            raise ValidationError("Lead with this mobile number already exists.")
    
    # 2. Duplicate Email Check
    email_val = (data.get("email") or "").strip()
    if email_val and Lead.objects.filter(email__iexact=email_val).exists():
        raise ValidationError("Lead with this email address already exists.")
    
    # 3. Mandatory Name Validation
    first_name = (data.get("first_name") or "").strip()
    last_name = (data.get("last_name") or "").strip()
    full_name = (data.get("full_name") or data.get("name") or "").strip()
    
    if not full_name and (first_name or last_name):
        full_name = f"{first_name} {last_name}".strip()
        
    if not full_name:
        raise ValidationError("Student name is required.")
        
    # 4. Campaign Resolution
    campaign_id = data.get("campaign_id") or data.get("campaign_name_id")
    campaign_name_str = data.get("campaign") or data.get("campaign_name")
    
    campaign = None
    if campaign_id:
        campaign = CampaignName.objects.filter(id=campaign_id).first()
        if not campaign:
            raise ValidationError("Selected campaign not found.")
    elif campaign_name_str:
        campaign = CampaignName.objects.filter(name__icontains=str(campaign_name_str).strip()).first()
        
    if not campaign:
        campaign = CampaignName.objects.first()
        
    # 5. Lead Source Resolution
    source_id = data.get("lead_source_id") or data.get("source_id")
    source_name_str = data.get("source") or data.get("lead_source")
    
    source = None
    if source_id:
        source = LeadSource.objects.filter(id=source_id).first()
        if not source:
            raise ValidationError("Selected lead source not found.")
    elif source_name_str:
        source = LeadSource.objects.filter(name__icontains=str(source_name_str).strip()).first()
        
    if not source:
        source = LeadSource.objects.first()
        
    # 6. Pipeline & Stage Resolution (Strictly Dynamic from Database Tables!)
    creator_org = getattr(user, 'organization', None) if (user and getattr(user, 'is_authenticated', False)) else None
    if not creator_org:
        creator_org = Organization.objects.first()

    pipeline_input = data.get("pipeline_id") or data.get("pipeline_category_id") or data.get("pipeline")
    pipeline_obj = None
    if pipeline_input is not None and str(pipeline_input).strip() != "":
        if str(pipeline_input).isdigit():
            pipeline_obj = PipelineCategory.objects.filter(id=int(pipeline_input)).first()
            if not pipeline_obj:
                raise ValidationError("Selected pipeline not found.")
        else:
            pipeline_obj = PipelineCategory.objects.filter(
                Q(category_name__iexact=str(pipeline_input).strip()) |
                Q(display_name__iexact=str(pipeline_input).strip())
            ).first()

    # If pipeline not explicitly given, try to get from campaign's pipeline_category
    if not pipeline_obj and campaign and campaign.pipeline_category:
        pipeline_obj = campaign.pipeline_category

    # If still not found, take the first active pipeline from the database table
    if not pipeline_obj:
        p_qs = PipelineCategory.objects.filter(is_active=True)

        if creator_org:
            p_qs = p_qs.filter(organization=creator_org)
        pipeline_obj = p_qs.order_by("id").first() or PipelineCategory.objects.order_by("id").first()

    # Resolve Stage strictly for THIS selected pipeline_obj
    stage_input = data.get("pipeline_stage_id") or data.get("stage_id") or data.get("stage")
    stage = None
    if stage_input is not None and str(stage_input).strip() != "":
        if str(stage_input).isdigit():
            stage = PipelineStage.objects.filter(id=int(stage_input)).first()
            if not stage:
                raise ValidationError("Selected pipeline stage not found.")
        else:
            s_qs = PipelineStage.objects.filter(name__iexact=str(stage_input).strip())
            if pipeline_obj:
                s_qs = s_qs.filter(pipeline_category=pipeline_obj)
            stage = s_qs.first()

    # If stage was not provided or belongs to a different pipeline, dynamically query the first stage of THIS pipeline from DB!
    if not stage or (pipeline_obj and stage.pipeline_category_id != pipeline_obj.id):
        s_qs = PipelineStage.objects.all()
        if pipeline_obj:
            s_qs = s_qs.filter(pipeline_category=pipeline_obj)

        if creator_org:
            s_qs = s_qs.filter(organization=creator_org)
        stage = s_qs.order_by("order_no", "id").first()
        if not stage and pipeline_obj:
            stage = PipelineStage.objects.filter(pipeline_category=pipeline_obj).order_by("id").first()
        if not stage:
            stage = PipelineStage.objects.order_by("id").first()
        
    # 7. Assigned Telecaller User
    assigned_to_id = data.get("assigned_to_id")
    if assigned_to_id:
        if not User.objects.filter(id=assigned_to_id).exists():
            raise ValidationError("Assigned telecaller not found.")
    elif user and getattr(user, 'is_authenticated', False):
        assigned_to_id = user.id

    if user and getattr(user, 'is_authenticated', False):
        user_role = "Admin" if (getattr(user, 'is_superuser', False) or str(getattr(user, 'user_type', '')).lower() == 'admin') else "Telecaller"
        creator_name = get_user_display_name(user) or getattr(user, 'username', 'User')
        created_by_info = f"{creator_name} ({user_role})"
    else:
        created_by_info = "Admin API (Unauthenticated)"
        
    raw_p_id = data.get("priority_id") or data.get("priority")
    valid_priority_id = None
    if raw_p_id and stage:
        if Priority.objects.filter(id=raw_p_id, pipeline_stage=stage).exists():
            valid_priority_id = raw_p_id

    with transaction.atomic():
        lead = Lead.objects.create(
            full_name=full_name,
            mobile_no=mobile_no,
            email=email_val if email_val else None,
            pipeline=pipeline_obj,
            campaign=campaign,
            lead_source=source,
            pipeline_stage=stage,
            assigned_to_id=assigned_to_id,
            enquiry_date=data.get("enquiry_date") or timezone.now(),
            current_status="working",
            priority_id=valid_priority_id,
            created_by=created_by_info,
            organization=creator_org
        )

        by_id = user.id if user and getattr(user, 'is_authenticated', False) else None
        if lead.assigned_to_id and by_id:
            transaction.on_commit(lambda lid=lead.id, uid=lead.assigned_to_id, by=by_id:
                                _notify_new_lead_safely(lid, uid, by))

        try:
            trigger_dashboard_update_task()
        except Exception:
            pass

    return {
        "lead_id": lead.id,
        "full_name": lead.full_name,
        "mobile_no": lead.mobile_no,
        "email": lead.email or "",
        "pipeline_id": pipeline_obj.id if pipeline_obj else None,
        "pipeline": pipeline_obj.category_name if pipeline_obj else "",
        "pipeline_stage_id": stage.id if stage else None,
        "pipeline_stage": stage.name if stage else "",
        "campaign_id": campaign.id if campaign else None,
        "campaign": campaign.name if campaign else "",
        "lead_source_id": source.id if source else None,
        "source": source.name if source else "",
        "assigned_to_id": lead.assigned_to_id,
        "created_by": created_by_info,
        "message": f"Lead '{lead.full_name}' created successfully!"
    }
    
    
    
    
# -----------------------------upload lead excel file service------------------------------------------   
    
def upload_lead_excel_admin(user=None, file=None, file_obj=None, leads_data=None, campaign_id=None, lead_source_id=None, pipeline_id=None, **kwargs):
    """
    Bulk Excel/CSV or JSON List Upload Service matching Clean Architecture & Figma Modal specs:
    - Supports file upload (.csv, .xls, .xlsx) AND JSON array payload from UI modal review
    - File size limit: 5MB
    - Max rows: 25,000
    - Fast Column Mapping (name, mobile, email, campaign, source)
    - Ultra-fast Memory Set Duplicate Check (single SQL query)
    - Bulk Insert via Lead.objects.bulk_create(batch_size=1000) (1-2s total execution time)
    """
    try:
        data_rows = []
        name_idx = 0
        mobile_idx = 1
        email_idx = 2
        campaign_idx = 3
        source_idx = 4
        is_dict_list = False

        upload_file = file or file_obj
        if not upload_file:
            raise ValidationError("Please select an Excel or CSV file to upload.")

        # 1. File Size Validation (Max 15MB)
        if upload_file.size > 15 * 1024 * 1024:
            raise ValidationError("File size exceeds 15MB limit. Please upload a smaller file.")

        # 2. File Format Validation
        filename = str(upload_file.name).lower()
        ext = filename.split('.')[-1]
        if ext not in ['xlsx', 'xls', 'csv']:
            raise ValidationError("Unsupported format! Please upload a .xlsx, .xls, or .csv file.")

        # 3. Database Foreign Key Validations
        if not pipeline_id:
            raise ValidationError("pipeline_id is required.")
        pipeline_obj = PipelineCategory.objects.filter(id=pipeline_id).first()
        if not pipeline_obj:
            raise ValidationError(f"Pipeline with ID {pipeline_id} not found.")

        if not campaign_id:
            raise ValidationError("campaign_id is required.")
        campaign_obj = CampaignName.objects.filter(id=campaign_id).first()
        if not campaign_obj:
            raise ValidationError(f"Campaign with ID {campaign_id} not found.")

        # ---------------- 1. File Reading & Parsing ----------------
        content_bytes = upload_file.read()
        rows_data = []

        if filename.endswith('.csv'):
            try:
                decoded = content_bytes.decode('utf-8-sig').splitlines()
            except Exception:
                decoded = content_bytes.decode('latin-1').splitlines()
            reader = csv.reader(decoded)
            for r in reader:
                if any(r):
                    rows_data.append(r)
        else:  # .xlsx or .xls
            wb = openpyxl.load_workbook(io.BytesIO(content_bytes), data_only=True)
            sheet = wb.active
            for r in sheet.iter_rows(values_only=True):
                if r and any(r):
                    rows_data.append([str(cell) if cell is not None else "" for cell in r])

        if not rows_data or len(rows_data) < 2:
            raise ValidationError("The uploaded file is empty or missing data rows.")

        data_rows = rows_data[1:]  # Skip Header Row
        if len(data_rows) > 25000:
            raise ValidationError("Maximum limit of 25,000 leads exceeded per file.")

        # Auto Column Mapping
        name_idx, mobile_idx, email_idx, source_idx = 0, 1, 2, 4
        headers = [str(h).strip().lower() for h in rows_data[0]]
        for idx, h in enumerate(headers):
            if any(k in h for k in ['name', 'full_name', 'first_name', 'contact name', 'student']):
                name_idx = idx
            elif any(k in h for k in ['mobile', 'phone', 'contact', 'number', 'primary contact']):
                mobile_idx = idx
            elif 'email' in h:
                email_idx = idx
            elif 'source' in h:
                source_idx = idx

        # ---------------- 2. Pre-fetch Defaults & Caches in Memory ----------------
        creator_org = getattr(user, 'organization', None) if user and getattr(user, 'is_authenticated', False) else None
        if not creator_org:
            creator_org = Organization.objects.order_by('id').first()

        default_stage = (
            PipelineStage.objects.filter(pipeline_category=pipeline_obj).order_by('order_no', 'id').first()
            or PipelineStage.objects.order_by('order_no', 'id').first()
        )
        default_campaign = campaign_obj
        default_source = LeadSource.objects.filter(id=lead_source_id).first() if lead_source_id else LeadSource.objects.first()

        # Cache Sources and Campaigns in dict
        source_cache = {s.name.lower().strip(): s for s in LeadSource.objects.all()}
        campaign_cache = {c.name.lower().strip(): c for c in CampaignName.objects.all()}


        # Active Telecallers Round-Robin Pool






        # Active Telecallers Round-Robin Pool
        telecallers = []
        if default_campaign:
            assigned = campaign_assigned_agent.objects.filter(
                campaign=default_campaign, is_active=True
            ).select_related('agent_user')
            telecallers = [
                a.agent_user for a in assigned 
                if a.agent_user.is_active and not getattr(a.agent_user, 'disable_lead_assignment', False)
            ]


    
        if not telecallers:
            telecaller_qs = User.objects.filter(is_active=True)
            if hasattr(User, 'disable_lead_assignment'):
                telecaller_qs = telecaller_qs.filter(disable_lead_assignment=False)
            if hasattr(User, 'user_type'):
                telecaller_qs = telecaller_qs.filter(user_type__icontains='telecaller')
            if creator_org:
                telecaller_qs = telecaller_qs.filter(organization=creator_org)
            telecallers = list(telecaller_qs.order_by('id'))


        if telecallers:
            ids = [t.id for t in telecallers]
            last_assigned = dict(
                Lead.objects.filter(assigned_to_id__in=ids)
                .order_by()
                .values('assigned_to_id')
                .annotate(last_id=Max('id'))
                .values_list('assigned_to_id', 'last_id')
            )
            oldest_agent = min(telecallers, key=lambda a: (last_assigned.get(a.id, 0), a.id))
            rr_index = telecallers.index(oldest_agent)
        else:
            rr_index = 0

        # ---------------- 3. Ultra-Fast Duplicate Check via Memory Set ----------------
        file_mobiles = set()
        for item in data_rows:
            if is_dict_list and isinstance(item, dict):
                raw_mob = item.get("mobile") or item.get("mobile_no") or item.get("contact") or item.get("phone") or ""
            else:
                raw_mob = item[mobile_idx] if (isinstance(item, (list, tuple)) and mobile_idx < len(item)) else ""
            clean = re.sub(r"\D", "", str(raw_mob).replace(".0", ""))[-10:]
            if clean:
                file_mobiles.add(clean)

        existing_in_db = set()
        if file_mobiles:
            possible_formats = []
            for m in file_mobiles:
                possible_formats.extend([m, f"+91 {m}", f"+91{m}", f"91{m}"])

            for i in range(0, len(possible_formats), 5000):
                chunk = possible_formats[i:i+5000]
                db_found = Lead.objects.filter(mobile_no__in=chunk).values_list('mobile_no', flat=True)
                for found in db_found:
                    clean = re.sub(r"\D", "", str(found))[-10:]
                    if clean:
                        existing_in_db.add(clean)

        # ---------------- 4. Build Leads List in Memory ----------------
        leads_to_create = []
        seen_in_upload = set()
        duplicate_count = 0
        duplicate_mobiles = []
        creator_info = f"{getattr(user, 'username', 'Admin')} (Admin Excel)"
        now = timezone.now()

        for item in data_rows:
            if is_dict_list and isinstance(item, dict):
                full_name = str(item.get("full_name") or item.get("name") or item.get("first_name") or "New Enquiry").strip()
                raw_mobile = str(item.get("mobile_no") or item.get("mobile") or item.get("contact") or item.get("phone") or "").strip()
                email = str(item.get("email") or item.get("email_address") or "").strip() or None
                c_val = str(item.get("campaign") or item.get("campaign_name") or "").strip().lower()
                s_val = str(item.get("source") or item.get("lead_source") or "").strip().lower()
            else:
                row = item
                full_name = str(row[name_idx]).strip() if (isinstance(row, (list, tuple)) and name_idx < len(row)) else "New Enquiry"
                raw_mobile = str(row[mobile_idx]).strip() if (isinstance(row, (list, tuple)) and mobile_idx < len(row)) else ""
                email = str(row[email_idx]).strip() if (isinstance(row, (list, tuple)) and email_idx != -1 and email_idx < len(row)) else None
                c_val = str(row[campaign_idx]).strip().lower() if (isinstance(row, (list, tuple)) and campaign_idx != -1 and campaign_idx < len(row)) else ""
                s_val = str(row[source_idx]).strip().lower() if (isinstance(row, (list, tuple)) and source_idx != -1 and source_idx < len(row)) else ""

            clean_digits = re.sub(r"\D", "", str(raw_mobile).replace(".0", ""))
            last_10 = clean_digits[-10:] if len(clean_digits) >= 10 else clean_digits

            if not last_10 or len(last_10) < 10:
                continue

            # Duplicate Check against DB and within the same file
            if last_10 in existing_in_db or last_10 in seen_in_upload:
                duplicate_count += 1
                duplicate_mobiles.append(raw_mobile)
                continue

            seen_in_upload.add(last_10)

            # Assign Objects from Cache (No DB queries inside loop)
            campaign_obj = campaign_cache.get(c_val) or default_campaign
            source_obj = source_cache.get(s_val) or default_source
            assigned_agent = telecallers[rr_index % len(telecallers)] if telecallers else user
            rr_index += 1

            lead_item = Lead(
                full_name=full_name or "New Enquiry",
                mobile_no=f"+91 {last_10}",
                email=email,
                pipeline=pipeline_obj,
                pipeline_stage=default_stage,
                campaign=campaign_obj,
                lead_source=source_obj,
                assigned_to=assigned_agent,
                organization=creator_org,
                current_status="working",
                priority_id=None,
                created_by=creator_info,
                enquiry_date=now
            )

            leads_to_create.append(lead_item)

        # ---------------- 5. Lightning-Fast Bulk Create (1 to 2 Seconds!) ----------------
        if leads_to_create:
            Lead.objects.bulk_create(leads_to_create, batch_size=1000)

        # Real-time WebSocket Dashboard Trigger
        try:
            trigger_dashboard_update_task()
        except Exception:
            pass

        return {
            "status": "success",
            "message": f"Successfully uploaded {len(leads_to_create)} leads! {duplicate_count} duplicate mobile numbers were skipped.",
            "total_rows_processed": len(data_rows),
            "uploaded_count": len(leads_to_create),
            "skipped_duplicates_count": duplicate_count,
            "skipped_duplicates_preview": duplicate_mobiles[:20]
        }

    except (APIException, ValidationError) as e:
        raise e
    except Exception as e:
        raise APIException(str(e))
    
# ------------------------------------- fetch_pipeline_leads_admin----------------------------------

def fetch_pipeline_leads_admin(user=None, **data):
    
    try:
        now = timezone.now()
        today = now.date()

        base_qs = Lead.objects.select_related(
            "pipeline",
            "assigned_to",
            "pipeline_stage",
            "campaign",
            "lead_source"
        )

        pipeline_input = data.get("pipeline_id") or data.get("pipeline_category_id") or data.get("pipeline")
        selected_pipeline = None
        if pipeline_input is not None and str(pipeline_input).strip() != "":
            if str(pipeline_input).isdigit():
                selected_pipeline = PipelineCategory.objects.filter(id=int(pipeline_input)).first()
            else:
                selected_pipeline = PipelineCategory.objects.filter(
                    Q(category_name__iexact=str(pipeline_input).strip()) |
                    Q(display_name__iexact=str(pipeline_input).strip())
                ).first()

        if not selected_pipeline:
            selected_pipeline = PipelineCategory.objects.filter(is_active=True).order_by("id").first() or PipelineCategory.objects.order_by("id").first()

        if selected_pipeline:
            base_qs = base_qs.filter(
                Q(pipeline_stage__pipeline_category=selected_pipeline) |
                Q(pipeline_stage__isnull=True, pipeline=selected_pipeline)
            )

        search = data.get("search")
        if search:
            base_qs = base_qs.filter(
                Q(full_name__icontains=search) |
                Q(mobile_no__icontains=search) |
                Q(email__icontains=search)
            )

        tele_id = data.get("assigned_to") or data.get("assigned_to_id") or data.get("tele_id")
        if tele_id:
            if str(tele_id).isdigit():
                base_qs = base_qs.filter(assigned_to_id=int(tele_id))
            else:
                base_qs = base_qs.filter(
                    Q(assigned_to__username__iexact=str(tele_id)) |
                    Q(assigned_to__first_name__icontains=str(tele_id))
                )

        stage_id_val = data.get("lead_stage_id") or data.get("pipeline_stage_id")
        if stage_id_val and int(stage_id_val) > 0:
            base_qs = base_qs.filter(pipeline_stage_id=int(stage_id_val))

        source_id = data.get("source_id") or data.get("lead_source_id")
        if source_id:
            base_qs = base_qs.filter(lead_source_id=source_id)

        campaign_id = data.get("campaign_id") or data.get("campaign_name_id")
        if campaign_id:
            base_qs = base_qs.filter(campaign_id=campaign_id)

        if data.get("course_plan_id"):
            base_qs = base_qs.filter(course_plan_id=data.get("course_plan_id"))

        date_filter_type = str(data.get("date_filter_type") or data.get("date_filter") or "all").lower().strip()
        from_date = data.get("from_date")
        to_date = data.get("to_date")

        if date_filter_type == "today":
            from_date = to_date = today
        elif date_filter_type == "yesterday":
            from_date = to_date = today - timedelta(days=1)
        elif date_filter_type in ["last_7_days", "last 7 days", "weekly", "week"]:
            from_date, to_date = today - timedelta(days=7), today
        elif date_filter_type in ["last_30_days", "last 30 days", "30 days"]:
            from_date, to_date = today - timedelta(days=30), today
        elif date_filter_type in ["this_month", "this month", "monthly", "month"]:
            from_date, to_date = today.replace(day=1), today

        if from_date and to_date and str(from_date).strip() != "" and str(to_date).strip() != "":
            base_qs = base_qs.filter(enquiry_date__date__range=[from_date, to_date])

        def format_card(lead):
            created_dt = lead.enquiry_date or lead.created_at
            formatted_date = created_dt.strftime("%d %b, %I:%M %p") if created_dt else ""
            p_obj = (
                (lead.pipeline_stage.pipeline_category if lead.pipeline_stage else None)
                or lead.pipeline
                or (lead.campaign.pipeline_category if lead.campaign else None)
                or selected_pipeline
            )
            return {
                "id": lead.id,
                "full_name": lead.full_name or "",
                "mobile_no": lead.mobile_no or "",
                "pipeline_id": p_obj.id if p_obj else None,
                "pipeline_name": (p_obj.category_name or p_obj.display_name) if p_obj else "",
                "pipeline_stage_id": lead.pipeline_stage_id,
                "pipeline_stage_name": lead.pipeline_stage.name if lead.pipeline_stage else "",
                "stage_color": lead.pipeline_stage.stage_color if lead.pipeline_stage else "",
                "assigned_to_id": lead.assigned_to_id,
                "assigned_to": get_user_display_name(lead.assigned_to) or "Unassigned",
                "source_name": lead.lead_source.name if lead.lead_source else "direct walk in",
                "campaign_name": lead.campaign.name if lead.campaign else None,
                "created_at": formatted_date
            }

        pipeline_stages_qs = PipelineStage.objects.filter(is_active=True)
        if selected_pipeline:
            pipeline_stages_qs = pipeline_stages_qs.filter(pipeline_category=selected_pipeline)

        pipeline_stages = list(pipeline_stages_qs.order_by("order_no", "id"))

        data_by_stage = {}
        for stg in pipeline_stages:
            stg_name = stg.display_value or stg.name
            data_by_stage[stg_name] = []

        fallback_stg_name = pipeline_stages[0].display_value or pipeline_stages[0].name if pipeline_stages else "Unassigned"
        all_leads = list(base_qs.order_by("-id"))
        for lead in all_leads:
            card = format_card(lead)
            stg_obj = lead.pipeline_stage
            stg_name_key = (stg_obj.display_value or stg_obj.name) if stg_obj else fallback_stg_name

            if stg_name_key in data_by_stage:
                data_by_stage[stg_name_key].append(card)
            elif fallback_stg_name in data_by_stage:
                data_by_stage[fallback_stg_name].append(card)

        stage_list = []
        for stg in pipeline_stages:
            stg_name = stg.display_value or stg.name
            cards_for_stg = data_by_stage.get(stg_name, [])
            stage_list.append({
                "pipeline_stage_id": stg.id,
                "pipeline_stage_name": stg_name,
                "stage_type": stg.stage_type,
                "order_no": stg.order_no,
                "stage_color": stg.stage_color or "",
                "total_count": len(cards_for_stg),
                "leads": cards_for_stg
            })

        return {
            "status": True,
            "message": "Pipeline leads fetched successfully",
            "pipeline_id": selected_pipeline.id if selected_pipeline else None,
            "pipeline_name": (selected_pipeline.category_name or selected_pipeline.display_name) if selected_pipeline else "",
            "data": data_by_stage,
            "stage_list": stage_list,
            "stages": stage_list
        }

    except (APIException, ValidationError) as e:
        raise e
    except Exception as e:
        raise APIException(str(e))

# ---------------------------- fetch lead and timeline details for admin ------------------------------------------

def fetch_lead_details_admin(user=None, **data):
     
    try:
        lead_id = data.get("lead_id")
        if not lead_id:
            raise ValidationError("lead_id is required.")

        lead = Lead.objects.select_related(
            "pipeline",
            "assigned_to",
            "pipeline_stage",
            "pipeline_stage__pipeline_category",
            "campaign",
            "campaign__pipeline_category",
            "lead_source",
            "course_plan",
            "course_name",
            "course",
            "priority"
        ).filter(id=lead_id).first()

        if not lead:
            raise ValidationError(f"Lead with ID {lead_id} not found.")

        # 1. Latest Call & Followup
        latest_call = CallDetails.objects.filter(lead=lead).order_by('-created_at').first()
        latest_followup = FollowUp.objects.filter(lead=lead, is_attended=False).order_by('scheduled_at').first()
        payment_info = PaymentInfo.objects.filter(lead=lead).first()

        course_fee = lead.course.course_fees if (lead.course and hasattr(lead.course, 'course_fees')) else 0
        if not course_fee and payment_info:
            course_fee = (payment_info.amount_paid or 0) + (payment_info.pending_amount or 0)

        # 2. Left Card Lead Info Summary
        p_obj = lead.pipeline or (lead.pipeline_stage.pipeline_category if lead.pipeline_stage else (lead.campaign.pipeline_category if lead.campaign else None))
        pipeline_name = (p_obj.category_name or p_obj.display_name) if p_obj else ""
        pipeline_id = p_obj.id if p_obj else None

        lead_info = {
            "id": lead.id,
            "full_name": lead.full_name or "",
            "mobile_no": lead.mobile_no or "",
            "email": lead.email or "",
            "alternative_mobile": lead.alternative_mobile or "",
            "location": lead.location or "",
            "passed_out_year": lead.passed_out_year,
            "experience": lead.experience or "",
            "stage": lead.pipeline_stage.name if lead.pipeline_stage else "",
            "stage_id": lead.pipeline_stage_id,
            "pipeline": pipeline_name,
            "pipeline_id": pipeline_id,
            "campaign": lead.campaign.name if lead.campaign else None,
            "source": lead.lead_source.name if lead.lead_source else None,
            "course_plan": lead.course_plan.courseplan if lead.course_plan else None,
            "course": lead.course_name.coursename if lead.course_name else None,
            "assigned_to": get_user_display_name(lead.assigned_to) or "Unassigned",
            "created": lead.enquiry_date.strftime("%Y-%m-%d") if lead.enquiry_date else str(lead.created_at.date()) if lead.created_at else "",
            "last_contacted": latest_call.created_at.strftime("%d-%m-%Y") if (latest_call and latest_call.created_at) else None,
            "next_followup": latest_followup.scheduled_at.strftime("%d-%m-%Y") if (latest_followup and latest_followup.scheduled_at) else None,
            "latest_conversation_outcome": latest_call.conversation_summary if latest_call else None,
            "amount": course_fee,
            "pending_amount": payment_info.pending_amount if payment_info else 0
        }

        # 3. Right Card Timeline Events
        timeline = []

        # A. Call Events from CallDetails
        calls = CallDetails.objects.filter(lead=lead).select_related("stage", "select_tag", "telecaller").order_by("-created_at")
        for c in calls:
            conn_status = str(c.connection_status or "Connected").lower()
            tag_name = c.select_tag.name if c.select_tag else None
            stage_name = c.stage.name if c.stage else None

            # Type mapping for UI badges
            if "not" in conn_status or "unreach" in conn_status:
                event_type = "not_connected"
                event_title = "Not Connected"
            else:
                event_type = "lead_disposed" if (stage_name or tag_name) else "answered"
                event_title = f"Lead Disposed | {conn_status.capitalize()}" if (stage_name or tag_name) else "Answered"

            formatted_time = c.created_at.strftime("%I:%M %p") if c.created_at else ""
            formatted_date = c.created_at.strftime("%d %b %Y") if c.created_at else ""

            timeline.append({
                "id": f"call_{c.id}",
                "date": formatted_date,
                "time": formatted_time,
                "type": event_type,
                "title": event_title,
                "stage_tag": stage_name,
                "sub_tag": tag_name,
                "remark": c.conversation_summary or "",
                "recording_url": c.upload_recording.url if (c.upload_recording and hasattr(c.upload_recording, 'url')) else None,
                "duration_seconds": c.duration_seconds or 0,
                "created_by": get_user_display_name(c.telecaller) or c.created_by
            })

        # B. Loss Details (if lead was lost)
        loss_detail = LossLeadDetail.objects.select_related("loss_reason").filter(lead=lead).first()
        if loss_detail:
            reason_obj = loss_detail.loss_reason
            reason_name = reason_obj.name if reason_obj else (loss_detail.detailed_reason or "Closed")
            formatted_date = loss_detail.created_at.strftime("%d %b %Y") if loss_detail.created_at else ""
            formatted_time = loss_detail.created_at.strftime("%I:%M %p") if loss_detail.created_at else ""
            timeline.append({
                "id": f"loss_{loss_detail.id}",
                "date": formatted_date,
                "time": formatted_time,
                "type": "closed",
                "title": "Lead Closed",
                "stage_tag": "Closed",
                "sub_tag": reason_name,
                "remark": loss_detail.detailed_reason or "",
                "recording_url": None,
                "created_by": loss_detail.created_by
            })

        # C. Lead Creation Event
        created_dt = lead.enquiry_date or lead.created_at
        if created_dt:
            timeline.append({
                "id": "created",
                "date": created_dt.strftime("%d %b %Y"),
                "time": created_dt.strftime("%I:%M %p"),
                "type": "created",
                "title": "Lead Created",
                "stage_tag": None,
                "sub_tag": None,
                "remark": f"Source: {lead.lead_source.name if lead.lead_source else 'Direct'}",
                "recording_url": None,
                "created_by": lead.created_by or "Admin"
            })

        return {
            "status": "success",
            "lead_info": lead_info,
            "timeline": timeline
        }

    except (APIException, ValidationError) as e:
        raise e
    except Exception as e:
        raise APIException(str(e))
    
    
    
# ----------------------------get_mark_as_won_info_admin--------------------------

def get_lead_course_fee(lead):
    if lead.course and lead.course.course_fees is not None:
        return float(lead.course.course_fees)

    if lead.course_name_id and lead.course_plan_id:
        course = Course.objects.filter(
            name_id=lead.course_name_id,
            plan_id=lead.course_plan_id
        ).first()
        if course and course.course_fees is not None:
            return float(course.course_fees)

    return None


def get_mark_as_won_info_admin(lead_id=None, user=None, **kwargs):
    """
    Fetches lead summary & payment status before opening the Mark as Won modal.
    """
    try:
        if not lead_id:
            raise ValidationError("lead_id is required.")

        lead = Lead.objects.select_related("assigned_to", "pipeline_stage", "course", "course_name").filter(id=lead_id).first()
        if not lead:
            raise ValidationError(f"Lead with ID {lead_id} not found.")

        payment_info = PaymentInfo.objects.filter(lead=lead).first()
        course_fee = get_lead_course_fee(lead)

        paid_amount = payment_info.amount_paid if payment_info else 0.0
        pending_amount = max(course_fee - paid_amount, 0.0) if course_fee is not None else 0.0

        current_payment_status = "Full Paid" if (pending_amount == 0 and paid_amount > 0) else ("Pending" if paid_amount > 0 else "Unpaid")

        return {
            "status": "success",
            "lead_info": {
                "lead_id": lead.id,
                "full_name": lead.full_name or "",
                "mobile_no": lead.mobile_no or "",
                "assigned_to": get_user_display_name(lead.assigned_to) or "Unassigned",
                "current_stage": lead.pipeline_stage.name if lead.pipeline_stage else None,
                "course_fee": course_fee,
                "amount_paid": paid_amount,
                "pending_amount": pending_amount,
                "payment_status": current_payment_status
            }
        }
    except (APIException, ValidationError) as e:
        raise e
    except Exception as e:
        raise APIException(str(e))


def mark_as_won_admin(user=None, **data):
   
    try:
        lead_id = data.get("lead_id")
        if not lead_id:
            raise ValidationError("lead_id is required.")

        lead = Lead.objects.select_related("course", "course_name", "pipeline").filter(id=lead_id).first()
        if not lead:
            raise ValidationError(f"Lead with ID {lead_id} not found.")

        course_fee = get_lead_course_fee(lead)
        if course_fee is None:
            raise ValidationError("Course fee is not configured for this lead. Please assign a course first.")

        amount_paid = float(data.get("amount_paid") or 0.0)
        is_full_payment = bool(data.get("is_full_payment", False))

        if amount_paid <= 0 and not is_full_payment:
            raise ValidationError("Amount Paid or Full Payment selection is required to mark a lead as WON.")

        # Find Won stage dynamically
        won_stage = PipelineStage.objects.filter(
            Q(pipeline_category=lead.pipeline) | Q(pipeline_category__isnull=True),
            name__iexact="won"
        ).first() or PipelineStage.objects.filter(name__icontains="won").first()

        if not won_stage:
            raise ValidationError("Won pipeline stage is not configured in the system.")

        paid_through = data.get("paid_through") or ""
        due_date = data.get("due_date")
        summary = data.get("summary") or ""
        next_followup = data.get("next_followup")

        if is_full_payment:
            amount_paid = course_fee
            pending_amount = 0.0
        else:
            pending_amount = max(course_fee - amount_paid, 0.0)

        # Atomic Transaction: Lead stage update + Payment record + Payment history
        with transaction.atomic():
            lead.pipeline_stage = won_stage
            lead.current_status = "won"
            lead.save()

            AdminApprovedLossLead.objects.filter(lead=lead).delete()

            # Create or Update PaymentInfo
            payment_obj, created = PaymentInfo.objects.get_or_create(
                lead=lead,
                defaults={
                    'amount_paid': amount_paid,
                    'pending_amount': pending_amount,
                    'is_full_payment': (pending_amount == 0),
                    'summary': summary
                }
            )
            if not created:
                payment_obj.amount_paid = (payment_obj.amount_paid or 0.0) + amount_paid
                payment_obj.pending_amount = pending_amount
                payment_obj.is_full_payment = (pending_amount == 0)
                payment_obj.summary = summary
                payment_obj.save()

            # Clean Due Date
            clean_due_date = None
            if due_date and str(due_date).strip() not in ["", "null", "None"]:
                try:
                    clean_due_date = str(due_date).split('T')[0]
                except Exception:
                    clean_due_date = None

            payment_notes = " ".join(
                part for part in (
                    f"Paid via {paid_through}" if paid_through else "",
                    summary
                ) if part
            )

            # Payment Mode
            payment_mode_val = data.get("payment_mode_id") or data.get("payment_mode") or paid_through
            payment_mode_obj = None
            if payment_mode_val:
                if str(payment_mode_val).isdigit():
                    payment_mode_obj = PaymentMode.objects.filter(id=int(payment_mode_val)).first()
                else:
                    payment_mode_obj = PaymentMode.objects.filter(
                        Q(name__icontains=str(payment_mode_val)) | Q(code__iexact=str(payment_mode_val))
                    ).first()

            PaymentHistory.objects.create(
                payment=payment_obj,
                paid_amount=amount_paid,
                pending_amount=pending_amount,
                payment_mode=payment_mode_obj,
                notes=payment_notes,
                due_date=clean_due_date
            )

            # FollowUp if scheduled
            if next_followup and str(next_followup).strip() != "":
                FollowUp.objects.create(
                    lead=lead,
                    telecaller=lead.assigned_to or User.objects.filter(is_active=True).first(),
                    scheduled_at=next_followup,
                    notes=f"Followup after Won ({summary})",
                    is_attended=False
                )

        # Real-Time WebSocket Dashboard Trigger
        try:
            trigger_dashboard_update_task()
        except Exception:
            pass

        return {
            "status": "success",
            "message": f"Lead '{lead.full_name}' marked as WON successfully!",
            "lead_id": lead.id,
            "stage": won_stage.name,
            "amount_paid": payment_obj.amount_paid,
            "pending_amount": payment_obj.pending_amount
        }

    except (APIException, ValidationError) as e:
        raise e
    except Exception as e:
        raise APIException(str(e))
    
    
    
# -----------------------------get_mark_as_lost_info_admin----------------------

def get_mark_as_lost_info_admin(lead_id=None, user=None, **kwargs):
    """
    Mark as Lost Modal Open -> Fetch lead summary (attempts, last contacted, lead age) & loss reasons.
    """
    try:
        if not lead_id:
            raise ValidationError("lead_id is required.")

        lead = Lead.objects.select_related("assigned_to", "pipeline_stage").filter(id=lead_id).first()
        if not lead:
            raise ValidationError(f"Lead with ID {lead_id} not found.")

        calls = CallDetails.objects.filter(lead=lead).order_by("-created_at")
        total_attempts = calls.count()
        latest_call = calls.first()

        # Lead Age Calculation (e.g., "3 Months" or "15 Days")
        created_dt = lead.enquiry_date or lead.created_at
        if created_dt:
            delta_days = (timezone.now() - created_dt).days
            if delta_days >= 30:
                lead_age = f"{delta_days // 30} Months"
            else:
                lead_age = f"{delta_days} Days"
        else:
            lead_age = "1 Month"

        last_contacted_str = latest_call.created_at.strftime("%d %b, %I:%M %p") if (latest_call and latest_call.created_at) else "No calls yet"
        last_conversation_str = latest_call.conversation_summary if latest_call else "No conversation recorded"
        attempts_str = f"{total_attempts} Calls done ({last_contacted_str})"

        lead_info = {
            "lead_id": lead.id,
            "full_name": lead.full_name or "",
            "mobile_no": lead.mobile_no or "",
            "assigned_to": get_user_display_name(lead.assigned_to) or "Unassigned",
            "total_attempts": attempts_str,
            "last_conversation": last_conversation_str,
            "last_contacted": last_contacted_str,
            "lead_age": lead_age,
            "current_stage": lead.pipeline_stage.name if lead.pipeline_stage else "Just Follow Up"
        }

        # Use the collection query configured for organization-scoped loss reasons.
        reason_rows = exec_raw_sql(
            "L_LOSS_REASONS",
            {"organization_id": lead.organization_id or 0}
        ) or []
        main_reasons = [
            {"id": row.get("value"), "name": row.get("label")}
            for row in reason_rows
            if row.get("value") is not None and row.get("label") is not None
        ]

        return {
            "status": "success",
            "lead_info": lead_info,
            "lead_summary": lead_info,
            "main_reasons": main_reasons,
            "sub_reasons": main_reasons
        }
    except (APIException, ValidationError) as e:
        raise e
    except Exception as e:
        raise APIException(str(e))


def mark_as_lost_admin(user=None, **data):
    """
    Marks a lead as LOST atomically:
    - Validates lead existence & reason input with ValidationError (HTTP 400)
    - Sets pipeline_stage to 'Lost'
    - Creates LossLeadDetail record and logs admin action
    - Dispatches real-time WebSocket dashboard update
    """
    try:
        lead_id = data.get("lead_id") or data.get("id")
        if not lead_id:
            raise ValidationError("lead_id is required.")

        lead = Lead.objects.select_related("pipeline", "assigned_to").filter(id=lead_id).first()
        if not lead:
            raise ValidationError(f"Lead with ID {lead_id} not found.")

        main_reason_val = data.get("main_reason_id") or data.get("main_reason") or data.get("reason")
        detailed_reason = data.get("detailed_reason") or data.get("remarks") or ""

        # 🛑 Validation: Loss reason must be selected before marking as LOST!
        if not main_reason_val or str(main_reason_val).strip() in ["", "None", "null", "0"]:
            raise ValidationError("Reason is required to mark a lead as LOST. Please select a valid reason.")

        # 1. Resolve the selected loss reason.
        main_reason_obj = None
        if main_reason_val:
            if str(main_reason_val).isdigit():
                reason_qs = LossReason.objects.filter(
                    id=int(main_reason_val),
                    is_active=True
                )
            else:
                reason_qs = LossReason.objects.filter(
                    name__iexact=str(main_reason_val).strip(),
                    is_active=True
                )
            if lead.organization_id:
                reason_qs = reason_qs.filter(
                    Q(organization_id=lead.organization_id) | Q(organization__isnull=True)
                )
            else:
                reason_qs = reason_qs.filter(organization__isnull=True)
            main_reason_obj = reason_qs.first()

        if not main_reason_obj:
            raise ValidationError("Selected loss reason was not found for this organization.")

        # 2. Update Lead Pipeline Stage to LOST dynamically
        lost_stage = (
            PipelineStage.objects.filter(
                Q(pipeline_category=lead.pipeline) | Q(pipeline_category__isnull=True),
                stage_type='closed_lost'
            ).first() or
            PipelineStage.objects.filter(
                Q(pipeline_category=lead.pipeline) | Q(pipeline_category__isnull=True),
                name__icontains="lost"
            ).first() or
            PipelineStage.objects.filter(
                Q(pipeline_category=lead.pipeline) | Q(pipeline_category__isnull=True),
                name__icontains="loss"
            ).first() or
            PipelineStage.objects.filter(stage_type='closed_lost').first() or
            PipelineStage.objects.filter(id=5).first()
        )
        if not lost_stage:
            raise ValidationError("Lost pipeline stage is not configured in the system.")

        # Resolve acting user safely
        acting_user = user or data.get("admin_user") or lead.assigned_to or User.objects.filter(is_superuser=True).first() or User.objects.first()
        created_by_name = get_user_display_name(acting_user) or "Admin"

        # 3. Atomic Transaction: Lead stage update + LossLeadDetail + AdminLossActionLog + AdminApprovedLossLead
        with transaction.atomic():
            lead.pipeline_stage = lost_stage
            lead.current_status = "lost"
            lead.loss_reason = main_reason_obj
            lead.save()

            # Create or Update LossLeadDetail
            loss_obj, created = LossLeadDetail.objects.get_or_create(
                lead=lead,
                defaults={
                    "loss_reason": main_reason_obj,
                    "main_reason_id": main_reason_obj.id,
                    "detailed_reason": detailed_reason,
                    "reported_by": lead.assigned_to,
                    "created_by": created_by_name
                }
            )
            if not created:
                loss_obj.loss_reason = main_reason_obj
                loss_obj.main_reason_id = main_reason_obj.id
                loss_obj.detailed_reason = detailed_reason
                loss_obj.save()

            # Record Action Log in AdminLossActionLog
            try:
                AdminLossActionLog.objects.create(
                    lead=lead,
                    admin_user=acting_user,
                    action_type='submitted',
                    previous_assigned_to=lead.assigned_to,
                    remarks=f"Marked as Lost: {main_reason_obj.name if main_reason_obj else detailed_reason}",
                    created_by=created_by_name,
                    updated_by=created_by_name
                )
            except Exception:
                pass

            # Auto-Approve record in AdminApprovedLossLead
            AdminApprovedLossLead.objects.update_or_create(
                lead=lead,
                defaults={
                    'approved_by': acting_user,
                    'main_reason_id': main_reason_obj.id,
                    'final_remarks': detailed_reason or "Marked as Lost by Admin",
                    'created_by': created_by_name,
                    'updated_by': created_by_name
                }
            )

        # Real-time WebSocket Dashboard Trigger
        try:
            trigger_dashboard_update_task()
        except Exception:
            pass

        return {
            "status": "success",
            "message": f"Lead '{lead.full_name}' marked as LOST successfully!",
            "lead_id": lead.id,
            "stage": lost_stage.name,
            "reason": main_reason_obj.name if main_reason_obj else str(main_reason_val)
        }

    except (APIException, ValidationError) as e:
        raise e
    except Exception as e:
        raise APIException(str(e))
    
    
    
    
# ------------------------------edit lead admin-----------------------------

def edit_lead_admin(user=None, **data):
    """
    Edits lead details, resolves dynamic foreign keys, updates payment info,
    and synchronizes dashboard metrics in real-time.
    """
    try:
        # 1. Lead Existence Check (Strict ValidationError -> HTTP 400)
        lead_id = data.get("lead_id") or data.get("id")
        if not lead_id:
            raise ValidationError("lead_id is required.")

        lead = Lead.objects.filter(id=lead_id).first()
        if not lead:
            raise ValidationError(f"Lead with ID {lead_id} not found.")

        # 2. Name Resolution
        full_name = data.get("full_name") or data.get("name")
        if not full_name:
            fn = data.get("first_name") or ""
            ln = data.get("last_name") or ""
            full_name = f"{fn} {ln}".strip()
        if full_name:
            lead.full_name = full_name
            if data.get("first_name"):
                lead.first_name = data.get("first_name")
            if data.get("last_name"):
                lead.last_name = data.get("last_name")

        # 3. Mobile Duplicate Check (Strict ValidationError -> HTTP 400)
        if data.get("mobile_no"):
            mob = str(data.get("mobile_no")).strip()
            clean_digits = "".join(filter(str.isdigit, mob))
            last_10 = clean_digits[-10:] if len(clean_digits) >= 10 else clean_digits
            if last_10 and Lead.objects.filter(Q(mobile_no=mob) | Q(mobile_no__endswith=last_10)).exclude(id=lead.id).exists():
                raise ValidationError("Lead with this mobile number already exists.")
            lead.mobile_no = f"+91 {last_10}" if len(last_10) == 10 else mob

        # 4. Email Duplicate Check (Strict ValidationError -> HTTP 400)
        if "email" in data and data.get("email") is not None:
            em = str(data.get("email")).strip()
            if em and Lead.objects.filter(email__iexact=em).exclude(id=lead.id).exists():
                raise ValidationError("Lead with this email address already exists.")
            lead.email = em or None

        if "alt_mobile" in data and data.get("alt_mobile") is not None:
            lead.alternative_mobile = data.get("alt_mobile")
        if data.get("enquiry_date"):
            lead.enquiry_date = data.get("enquiry_date")

        # 5. Foreign Key Resolutions (Supports both ID and Name)
        assigned_val = data.get("assigned_to_id") or data.get("assigned_to")
        if assigned_val:
            user_obj = User.objects.filter(
                Q(id=assigned_val if str(assigned_val).isdigit() else 0) |
                Q(username__icontains=str(assigned_val)) |
                Q(first_name__icontains=str(assigned_val))
            ).first()
            if user_obj:
                lead.assigned_to = user_obj

        plan_val = data.get("course_plan_id") or data.get("course_plan")
        if plan_val:
            plan_obj = CoursePlan.objects.filter(
                Q(id=plan_val if str(plan_val).isdigit() else 0) |
                Q(course_plan__icontains=str(plan_val))
            ).first()
            if plan_obj:
                lead.course_plan = plan_obj

        course_val = data.get("course_name_id") or data.get("course")
        if course_val:
            course_name_obj = CourseName.objects.filter(
                Q(id=course_val if str(course_val).isdigit() else 0) |
                Q(course_name__icontains=str(course_val))
            ).first()
            if course_name_obj:
                lead.course_name = course_name_obj

        campaign_val = data.get("campaign_id") or data.get("campaign")
        if campaign_val:
            camp_obj = CampaignName.objects.filter(
                Q(id=campaign_val if str(campaign_val).isdigit() else 0) |
                Q(name__icontains=str(campaign_val))
            ).first()
            if camp_obj:
                lead.campaign = camp_obj

        source_val = data.get("lead_source_id") or data.get("source_id") or data.get("source") or data.get("lead_source")
        if source_val:
            src_obj = LeadSource.objects.filter(
                Q(id=source_val if str(source_val).isdigit() else 0) |
                Q(name__icontains=str(source_val))
            ).first()
            if src_obj:
                lead.lead_source = src_obj

        # Pipeline resolution
        pipeline_input = data.get("pipeline_id") or data.get("pipeline_category_id") or data.get("pipeline")
        pipeline_obj = None
        if pipeline_input is not None and str(pipeline_input).strip() != "":
            if str(pipeline_input).isdigit():
                pipeline_obj = PipelineCategory.objects.filter(id=int(pipeline_input)).first()
            else:
                pipeline_obj = PipelineCategory.objects.filter(
                    Q(category_name__iexact=str(pipeline_input).strip()) |
                    Q(display_name__iexact=str(pipeline_input).strip())
                ).first()
        if pipeline_obj:
            lead.pipeline = pipeline_obj

        # Stage resolution
        stage_val = data.get("pipeline_stage_id") or data.get("stage_id") or data.get("stage")
        stage_obj = None
        if stage_val is not None and str(stage_val).strip() != "":
            if str(stage_val).isdigit():
                stage_obj = PipelineStage.objects.filter(id=int(stage_val)).first()
            else:
                s_qs = PipelineStage.objects.filter(name__iexact=str(stage_val).strip())
                if pipeline_obj or lead.pipeline:
                    s_qs = s_qs.filter(pipeline_category=pipeline_obj or lead.pipeline)
                stage_obj = s_qs.first()

        if stage_obj:
            lead.pipeline_stage = stage_obj
            if not pipeline_obj and stage_obj.pipeline_category:
                lead.pipeline = stage_obj.pipeline_category
        elif pipeline_obj and lead.pipeline_stage and lead.pipeline_stage.pipeline_category_id != pipeline_obj.id:
            first_stage = PipelineStage.objects.filter(pipeline_category=pipeline_obj).order_by("order_no", "id").first()
            if first_stage:
                lead.pipeline_stage = first_stage

        tag_val = data.get("priority_id") or data.get("tag") or data.get("priority")
        if tag_val is not None:
            tag_map = {
                "prospective": 1, "hot": 1, "1": 1, 1: 1,
                "interested": 2, "warm": 2, "2": 2, 2: 2,
                "just follow up": 3, "just_follow_up": 3, "cold": 3, "3": 3, 3: 3
            }
            raw_p = tag_map.get(str(tag_val).lower().strip()) if str(tag_val).lower().strip() in tag_map else (int(tag_val) if str(tag_val).isdigit() else None)
            if raw_p and lead.pipeline_stage_id and Priority.objects.filter(id=raw_p, pipeline_stage_id=lead.pipeline_stage_id).exists():
                lead.priority_id = raw_p
            else:
                lead.priority_id = None
        elif lead.priority_id and lead.pipeline_stage_id:
            if not Priority.objects.filter(id=lead.priority_id, pipeline_stage_id=lead.pipeline_stage_id).exists():
                lead.priority_id = None

        lead.save()

        # 6. Payment Info Updates
        amount_paid = data.get("amount_paid")
        pending_amount = data.get("pending_amount")
        total_amount = data.get("total_amount")

        if amount_paid is not None or pending_amount is not None or total_amount is not None:
            ap_val = float(amount_paid) if amount_paid is not None else 0.0
            pa_val = float(pending_amount) if pending_amount is not None else 0.0

            payment_obj, created = PaymentInfo.objects.get_or_create(
                lead=lead,
                defaults={
                    'amount_paid': ap_val,
                    'pending_amount': pa_val,
                    'is_full_payment': (pa_val == 0)
                }
            )

            if amount_paid is not None:
                payment_obj.amount_paid = float(amount_paid)
            if pending_amount is not None:
                payment_obj.pending_amount = float(pending_amount)

            payment_obj.is_full_payment = (payment_obj.pending_amount == 0)
            payment_obj.save()

            final_ap = payment_obj.amount_paid
            final_pa = payment_obj.pending_amount
        else:
            existing_payment = PaymentInfo.objects.filter(lead=lead).first()
            final_ap = existing_payment.amount_paid if existing_payment else 0.0
            final_pa = existing_payment.pending_amount if existing_payment else 0.0

        # 7. Real-Time WebSocket Dashboard Trigger
        try:
            trigger_dashboard_update_task()
        except Exception:
            pass

        return {
            "status": "success",
            "message": "Lead details updated successfully",
            "lead_id": lead.id,
            "full_name": lead.full_name,
            "pipeline": lead.pipeline.category_name if lead.pipeline else "",
            "pipeline_id": lead.pipeline.id if lead.pipeline else None,
            "pipeline_stage": lead.pipeline_stage.name if lead.pipeline_stage else "",
            "pipeline_stage_id": lead.pipeline_stage.id if lead.pipeline_stage else None,
            "amount_paid": final_ap,
            "pending_amount": final_pa
        }

    except (APIException, ValidationError) as e:
        raise e
    except Exception as e:
        raise APIException(str(e))


# ----------------------------- delete_lead_admin service -----------------------------

def delete_lead_admin(user, lead_id, **kwargs):
    try:
        if not lead_id:
            raise ValidationError("Lead ID is required.")

        lead = Lead.objects.filter(id=lead_id).first()
        if not lead:
            raise ValidationError(f"Lead with ID {lead_id} not found.")

        lead_name = lead.full_name
        user_id = user.id if (user and getattr(user, 'is_authenticated', False)) else None

        # Clean up referencing notifications before deleting lead to prevent Foreign Key constraint error
        Notification.objects.filter(lead=lead).delete()

        # Execute safe delete (Audit Log + CASCADE Delete)
        lead.save_delete(user_id=user_id)

        # Trigger dashboard real-time update
        try:
            trigger_dashboard_update_task()
        except Exception:
            pass

        return {
            "status": "success",
            "message": f"Lead '{lead_name}' (ID: {lead_id}) deleted successfully!",
            "deleted_lead_id": lead_id,
            "deleted_by_id": user_id
        }
    except (APIException, ValidationError) as e:
        raise e
    except Exception as e:
        raise APIException(str(e))


# ----------------------------- reassign_lead_admin service -----------------------------


def get_returning_lead_ids(lead_ids, new_telecaller_id):
    """
    Indha leads la edhellam new telecaller MUNNADI vechirundhaar nu return pannum.
    History row create panradhukku MUNNADI call pannanum.
    """
    # AdminLeadReassignHistory import path unga project padi maathikonga

    ids = _as_id_list(lead_ids)
    return set(
        AdminLeadReassignHistory.objects
        .filter(lead_id__in=ids, previous_telecaller_id=new_telecaller_id)
        .values_list("lead_id", flat=True)
    )


def notify_reassign_by_type(new_id, new_lead_ids, returning_ids, by_id=None,
                            old_id=None, lead_id=None):
    try:
        # ---------- New telecaller ----------
        if new_lead_ids:
            send_lead_assigned_notification(new_lead_ids, new_id, assigned_by_id=by_id)

        if returning_ids:
            # old_assignee_id=None => new telecaller ku mattum
            send_lead_reassigned_notification(returning_ids, new_id, None)

        # ---------- Old telecaller ----------
        if old_id and lead_id:
            # notify_new=False => old telecaller ku mattum, new telecaller peyar oda
            send_lead_reassigned_notification(lead_id, new_id, old_id, notify_new=False)
    except Exception:
        logger.exception("Reassign notification failed (new=%s, returning=%s)",
                         new_lead_ids, returning_ids)




def reassign_lead_admin(user=None, lead_id=None, new_telecaller_id=None, reason=None, **kwargs):
   
    try:
        # 1. Fetch & Validate Lead
        target_lead_id = lead_id or kwargs.get("id")
        if not target_lead_id:
            raise ValidationError("lead_id is required.")
        lead = Lead.objects.filter(id=target_lead_id).first()
        if not lead:
            raise ValidationError(f"Lead with ID {target_lead_id} not found.")

        # 2. Fetch & Validate New Telecaller (Supports all frontend key variants)
        target_telecaller_id = (
            new_telecaller_id
            or kwargs.get("telecaller_id")
            or kwargs.get("assigned_to_id")
            or kwargs.get("user_id")
            or kwargs.get("to_telecaller_id")
            or kwargs.get("to_user_id")
            or kwargs.get("telecaller")
        )
        if not target_telecaller_id:
            raise ValidationError("new_telecaller_id is required.")

        new_telecaller = None
        if str(target_telecaller_id).isdigit():
            new_telecaller = User.objects.filter(id=int(target_telecaller_id), is_active=True).first()
        if not new_telecaller:
            new_telecaller = User.objects.filter(
                Q(username__iexact=str(target_telecaller_id).strip()) |
                Q(first_name__iexact=str(target_telecaller_id).strip()),
                is_active=True
            ).first()

        if not new_telecaller:
            raise ValidationError(f"Telecaller '{target_telecaller_id}' not found or inactive.")

        if lead.assigned_to_id == new_telecaller.id:
            raise ValidationError("Lead is already assigned to this telecaller.")

        previous_telecaller = lead.assigned_to
        reassigned_by = user if (user and getattr(user, 'is_authenticated', False)) else None
        reassigned_by_name = get_user_display_name(reassigned_by) if reassigned_by else "Admin"

        is_returning = lead.id in get_returning_lead_ids([lead.id], new_telecaller.id)

        # 3. Snapshot Call History for Audit Log
        calls_qs = CallDetails.objects.filter(lead=lead).order_by('-created_at')
        if previous_telecaller:
            calls_qs = calls_qs.filter(telecaller=previous_telecaller)

        call_history_json = []
        for c in calls_qs[:20]:
            call_history_json.append({
                "call_id": c.id,
                "telecaller_id": c.telecaller_id,
                "telecaller_name": get_user_display_name(c.telecaller),
                "connection_status": c.connection_status,
                "stage_name": c.stage.name if c.stage else None,
                "select_tag_name": getattr(c.select_tag, 'display_value', None) or (c.select_tag.name if c.select_tag else None),
                "conversation_summary": c.conversation_summary,
                "duration_seconds": c.duration_seconds,
                "called_at": c.called_at.isoformat() if c.called_at else None,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            })

        # 4. Atomic Transaction: History record + Lead assignment update
        with transaction.atomic():
            history_rec = AdminLeadReassignHistory.objects.create(
                lead=lead,
                previous_telecaller=previous_telecaller,
                new_telecaller=new_telecaller,
                reassigned_by=reassigned_by,
                attended_calls_count=len(call_history_json),
                previous_call_history=call_history_json,
                reassigned_reason=reason or "Reassigned via Admin API",
                created_by=reassigned_by_name
            )

            # Update Lead Assignment
            lead.assigned_to = new_telecaller

            # If lead was in Loss stage, restore to Follow Up stage dynamically
            if lead.pipeline_stage and "loss" in lead.pipeline_stage.name.lower():
                followup_stage = PipelineStage.objects.filter(
                    pipeline_category=lead.pipeline,
                    name__icontains="follow"
                ).first()
                if followup_stage:
                    lead.pipeline_stage = followup_stage
                lead.current_status = "working"

            # Auto-delete from AdminApprovedLossLead table since lead is no longer a permanent loss
            AdminApprovedLossLead.objects.filter(lead=lead).delete()
            lead.save()

        # 5. Notifications & Dashboard Update
        new_telecaller_name = get_user_display_name(new_telecaller)
        transaction.on_commit(
            lambda lid=lead.id, n=new_telecaller.id, r=is_returning,
                by=(reassigned_by.id if reassigned_by else None),
                old=(previous_telecaller.id if previous_telecaller else None):
                notify_reassign_by_type(
                    n,
                    new_lead_ids=[] if r else [lid],
                    returning_ids=[lid] if r else [],
                    by_id=by,
                    old_id=old,
                    lead_id=lid,
                )
        )
        try:
            trigger_dashboard_update_task()
        except Exception:
            pass

        return {
            "status": "success",
            "message": f"Lead '{lead.full_name}' reassigned to '{new_telecaller_name}' successfully!",
            "reassign_history_id": history_rec.id,
            "lead_id": lead.id,
            "previous_telecaller": get_user_display_name(previous_telecaller),
            "new_telecaller": new_telecaller_name,
            "new_telecaller_id": new_telecaller.id,
            "attended_calls_count": len(call_history_json)
        }
    except (APIException, ValidationError) as e:
        raise e
    except Exception as e:
        raise APIException(str(e))


# ----------------------------- bulk_transfer_leads_admin service -----------------------------

def bulk_transfer_leads_admin(user, from_telecaller_id, to_telecaller_id, campaign_id=None, reason=None):
   
    try:
        if not from_telecaller_id:
            raise APIException("From telecaller ID is required")
        if not to_telecaller_id:
            raise APIException("To telecaller ID is required")

        if from_telecaller_id == to_telecaller_id:
            raise APIException("From and To telecallers cannot be the same person")

        from_telecaller = User.objects.filter(id=from_telecaller_id).first()
        if not from_telecaller:
            raise APIException(f"From Telecaller with ID {from_telecaller_id} not found")

        to_telecaller = User.objects.filter(id=to_telecaller_id, is_active=True).first()
        if not to_telecaller:
            raise APIException(f"To Telecaller with ID {to_telecaller_id} not found or inactive")

        # Query leads assigned to from_telecaller
        leads_qs = Lead.objects.filter(assigned_to=from_telecaller)
        if campaign_id:
            leads_qs = leads_qs.filter(campaign_id=campaign_id)

        leads_to_transfer = list(leads_qs)
        if not leads_to_transfer:
            raise APIException("No leads found matching the transfer criteria")

        reassigned_by = user if (user and getattr(user, 'is_authenticated', False)) else None
        reassigned_by_name = get_user_display_name(reassigned_by) if reassigned_by else "Admin"
        transfer_reason = reason or ("Campaign Bulk Transfer" if campaign_id else "All Campaigns Bulk Transfer")

        transferred_count = 0
        history_records = []

        followup_stage = PipelineStage.objects.filter(id=2).first() or PipelineStage.objects.filter(name__icontains="follow").first()

        for lead in leads_to_transfer:
            # Collect call history JSON
            calls_qs = CallDetails.objects.filter(lead=lead, telecaller=from_telecaller).order_by('-created_at')[:20]
            call_history_json = []
            for c in calls_qs:
                call_history_json.append({
                    "call_id": c.id,
                    "telecaller_id": c.telecaller_id,
                    "telecaller_name": get_user_display_name(c.telecaller),
                    "connection_status": c.connection_status,
                    "duration_seconds": c.duration_seconds,
                    "called_at": c.called_at.isoformat() if c.called_at else None,
                })

            # Create history record for audit log
            history_rec = AdminLeadReassignHistory(
                lead=lead,
                previous_telecaller=from_telecaller,
                new_telecaller=to_telecaller,
                reassigned_by=reassigned_by,
                attended_calls_count=len(call_history_json),
                previous_call_history=call_history_json,
                reassigned_reason=transfer_reason,
                created_by=reassigned_by_name
            )
            history_records.append(history_rec)

            # Update lead assigned_to & restore stage to Follow-up if currently in Loss stage
            lead.assigned_to = to_telecaller
            if lead.pipeline_stage_id in [4] or (lead.pipeline_stage and "loss" in lead.pipeline_stage.name.lower()):
                if followup_stage:
                    lead.pipeline_stage = followup_stage
                lead.current_status = "working"

            lead.save()
            AdminApprovedLossLead.objects.filter(lead=lead).delete()
            transferred_count += 1

        # Bulk create audit history records
        if history_records:
            AdminLeadReassignHistory.objects.bulk_create(history_records)

        from_name = get_user_display_name(from_telecaller)
        to_name = get_user_display_name(to_telecaller)

        return {
            "status": "success",
            "message": f"Successfully transferred {transferred_count} leads from '{from_name}' to '{to_name}'!",
            "transferred_count": transferred_count,
            "from_telecaller": from_name,
            "to_telecaller": to_name,
            "campaign_id": campaign_id
        }

    except Exception as e:
        raise APIException(str(e))


def fetch_leads_service(user=None, action='FETCH_ALL', lead_id=None, filters=None, **kwargs):
   
    if filters is None:
        filters = {}
    
    if kwargs:
        filters.update(kwargs)

    if lead_id:
        filters['lead_id'] = lead_id
        filters['id'] = lead_id

    action_upper = str(action or 'FETCH_ALL').upper()

    if action_upper == 'PIPELINE':
        return fetch_pipeline_leads_admin(user=user, **filters)
    elif action_upper == 'WON_LIST':
        filters['lead_filter_type'] = 'won'
        return fetch_all_leads_admin(user=user, **filters)
    elif action_upper == 'LOST_LIST':
        filters['lead_filter_type'] = 'lost'
        return fetch_all_leads_admin(user=user, **filters)
    elif action_upper in ['FETCH_ONE', 'FETCH_HISTORY']:
        filters['lead_filter_type'] = 'all'
        res = fetch_all_leads_admin(user=user, **filters)
        if action_upper == 'FETCH_ONE' and res and 'leads' in res and res['leads']:
            return res['leads'][0]
        return res
    else:
        return fetch_all_leads_admin(user=user, **filters)


def action_lead_management_service(user=None, action=None, lead_id=None, payload=None, **kwargs):
    
    if payload is None:
        payload = {}
    if kwargs:
        payload.update(kwargs)

    if lead_id:
        payload['lead_id'] = lead_id

    action_upper = str(action or '').upper()
    return f"Action '{action_upper}' executed successfully for lead {lead_id}."


def get_leads_by_user_id(user_id):
    user = User.objects.filter(id=user_id).first()
    if not user:
        return Lead.objects.none()

    base_qs = Lead.objects.select_related("assigned_to", "pipeline_stage", "campaign", "lead_source")

    if user.is_superuser:
        return base_qs.all()

    user_type = (user.user_type or "").strip().upper()

    if user_type in ['TELECALLER', 'EXECUTIVE']:
        return base_qs.filter(assigned_to_id=user_id)
    elif user_type in ['TEAM_LEAD', 'TL', 'TEAM LEADER']:
        if user.team_id:
            return base_qs.filter(assigned_to__team_id=user.team_id)
        return base_qs.filter(assigned_to_id=user_id)
    elif user_type in ['ADMIN', 'ORG_ADMIN', 'MANAGER']:
        if user.organization_id:
            return base_qs.filter(organization_id=user.organization_id)
        return base_qs.all()

    return base_qs.filter(assigned_to_id=user_id)
