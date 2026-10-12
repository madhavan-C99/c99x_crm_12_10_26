import csv
import os
import openpyxl
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q, Count
from rest_framework.exceptions import APIException
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from telecalling.models import (
    Lead, PaymentInfo, PaymentHistory, LossLeadDetail, FollowUp,
    CallDetails, CampaignName, LeadSource, PipelineStage,
    User, Course, CoursePlan, CourseName, Priority, LossReason, Notification
)
from ..models import AdminLossActionLog, AdminApprovedLossLead, AdminLeadReassignHistory, PaymentMode
from .query_services import exec_raw_sql

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


def fetch_all_leads_admin(user=None, **data):
    
    # Admin scope version of fetch_leads()
    try:
        now = timezone.now()
        
        base_qs = Lead.objects.select_related(
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
                Q(pipeline_stage__pipeline_category_id=pipeline_id) |
                Q(campaign__pipeline_category_id=pipeline_id)
            )
        elif pipeline_name and str(pipeline_name).strip():
            p_name = str(pipeline_name).strip()
            if p_name.lower() not in ["all", "all leads", "none", "null"]:
                base_qs = base_qs.filter(
                    Q(campaign__pipeline_category__category_name__icontains=p_name) |
                    Q(campaign__name__icontains=p_name)
                ).distinct()

        # Popup stage filter (from filter popup menu)
        popup_stage_id = data.get("pipeline_stage_id")
        if popup_stage_id and str(popup_stage_id).isdigit() and int(popup_stage_id) > 0:
            base_qs = base_qs.filter(pipeline_stage_id=int(popup_stage_id))

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
        date_filter_type = str(data.get("date_filter_type") or "all").lower().strip()
        from_date = data.get("from_date")
        to_date = data.get("to_date")
        today = now.date()

        if date_filter_type == "today":
            from_date = to_date = today
        elif date_filter_type == "yesterday":
            from_date = to_date = today - timedelta(days=1)
        elif date_filter_type == "weekly":
            from_date, to_date = today - timedelta(days=7), today
        elif date_filter_type in ["monthly", "this_month", "this month"]:
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

        follow_up_qs = base_qs.filter(
            Q(pipeline_stage__stage_type="open", pipeline_stage__order_no__gt=1) |
            Q(pipeline_stage_id=2) | Q(pipeline_stage__name__icontains="follow")
        ).distinct()

        won_qs = base_qs.filter(
            Q(pipeline_stage__stage_type="closed_won") | Q(pipeline_stage__stage_type="terminal_joined") |
            Q(pipeline_stage_id=4) | Q(pipeline_stage__name__icontains="won")
        ).distinct()

        lost_qs = base_qs.filter(
            Q(pipeline_stage__stage_type="closed_lost") | Q(pipeline_stage__stage_type="terminal_closed") |
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
            "new_count": canonical_counts["new_lead"],
            "followup_count": canonical_counts["follow_up"],
            "follow_up_count": canonical_counts["follow_up"],
            "missed_count": canonical_counts["missed_follow_up"],
            "pending_follow_up_count": canonical_counts["missed_follow_up"],
            "won_count": canonical_counts["won"],
            "lost_count": canonical_counts["lost"],
            "loss_count": canonical_counts["lost"],
        }

        # Populate dynamic ${stage_id}_count and ${stage_id} keys for frontend LeadStats stage badges
        stage_counts_qs = base_qs.values('pipeline_stage_id').annotate(cnt=Count('id'))
        for sc in stage_counts_qs:
            stg_id = sc['pipeline_stage_id']
            if stg_id:
                stats[f"{stg_id}_count"] = sc['cnt']
                stats[str(stg_id)] = sc['cnt']

        # 6. Sorting & Stage Tab Selection
        sort_order = str(data.get("sort_order") or "").lower().strip()
        sort_by = data.get("sort_by") or "-created_at"
        if sort_order == "newest":
            sort_by = "-created_at"
        elif sort_order == "oldest":
            sort_by = "created_at"

        lead_stage_id = data.get("lead_stage_id")
        lead_filter_type = str(data.get("lead_filter_type") or "all").lower().strip()

        if lead_stage_id and str(lead_stage_id).isdigit() and int(lead_stage_id) > 0:
            selected_qs = base_qs.filter(pipeline_stage_id=int(lead_stage_id)).order_by(sort_by)
        else:
            selected_qs = tabs.get(lead_filter_type, tabs["all"]).order_by(sort_by)

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
            if lead.pipeline_stage and lead.pipeline_stage.pipeline_category:
                p_id = lead.pipeline_stage.pipeline_category.id
                p_name = lead.pipeline_stage.pipeline_category.category_name or lead.pipeline_stage.pipeline_category.display_name
            elif lead.campaign and lead.campaign.pipeline_category:
                p_id = lead.campaign.pipeline_category.id
                p_name = lead.campaign.pipeline_category.category_name or lead.campaign.pipeline_category.display_name

            leads.append({
                "id": lead.id,
                "full_name": lead.full_name or "",
                "mobile_no": lead.mobile_no or "",
                "pipeline_id": p_id,
                "pipeline_name": p_name,
                "pipeline_stage_id": lead.pipeline_stage_id,
                "pipeline_stage_name": lead.pipeline_stage.name if lead.pipeline_stage else "New",
                "assigned_to_id": lead.assigned_to_id,
                "assigned_to": get_user_display_name(lead.assigned_to),
                "priority_id": lead.priority_id,
                "priority_name": tag_name,
                "campaign_id": lead.campaign_id,
                "campaign_name": lead.campaign.name if lead.campaign else None,
                "source_id": lead.lead_source_id,
                "source_name": lead.lead_source.name if lead.lead_source else None,
                "course_name_id": lead.course_name_id,
                "course_name": c_name,
                "course_plan_id": lead.course_plan_id,
                "course_plan_name": c_plan_name,
                "next_followup": latest_followup.scheduled_at if latest_followup else None,
                "amount": course_fee,
                "pending_amount": pending_amt,
                "last_contacted": latest_call.called_at if latest_call else None,
                "last_conversation_outcome": latest_call.conversation_summary if latest_call else None,
                "enquiry_date": lead.enquiry_date or lead.created_at,
            })

        import math
        total_pages = math.ceil(total / page_size) if (page_size and page_size > 0 and total > 0) else 1

        return {
            "status": True,
            "message": "Leads fetched successfully",
            "total_count": total,
            "total_records": total,
            "total": total,
            "leads": leads,
            "stats": stats,   
            "tab_counts": tab_counts,
            "page": page,
            "current_page": page,
            "page_size": page_size,
            "rows_per_page": page_size,
            "total_pages": total_pages
        }

    except Exception as e:
        raise APIException(str(e))


# ------------------------------------- admin add new lead services ------------------------------------------

def get_user_display_name(user_obj):
    """Safely gets user display name without AnonymousUser errors"""
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


def get_add_lead_dropdowns_admin():
  
    try:
        pipelines = [
            {"id": "Education", "name": "Education"},
            {"id": "Product", "name": "Product"}
        ]
        campaigns_qs = CampaignName.objects.all()
        campaigns = [{"id": c.id, "name": c.name} for c in campaigns_qs]
        sources_qs = LeadSource.objects.all()
        sources = [{"id": s.id, "name": s.name} for s in sources_qs]
        users_qs = User.objects.filter(is_active=True).filter(
            Q(user_roles__role__name__iexact='telecaller') |
            Q(user_roles__role__code__iexact='TEL') |
            Q(user_type__iexact='telecaller')
        ).distinct().order_by("first_name")
        telecallers = [{"id": u.id, "name": get_user_display_name(u)} for u in users_qs]
        return {
            "pipelines": pipelines,
            "pipeline_stages": pipelines,
            "pipeline": pipelines,
            "campaigns": campaigns,
            "sources": sources,
            "telecallers": telecallers
        }
    except Exception as e:
        raise APIException(str(e))
    
    
def add_new_lead_admin(user, **data):
    """
    Creates a new lead with AnonymousUser safety and Figma specs.
    """
    try:
        mobile_no = (data.get("mobile_no") or data.get("mobile") or "").strip()
        if not mobile_no:
            raise APIException("Mobile number is required")
        
        # 1. Ultra-Smart Duplicate Check (Clean Digits & Last 10 Digits Matching)
        clean_digits = "".join(filter(str.isdigit, str(mobile_no)))
        last_10 = clean_digits[-10:] if len(clean_digits) >= 10 else clean_digits
        
        existing_lead = None
        if last_10:
            existing_lead = Lead.objects.filter(
                Q(mobile_no__icontains=mobile_no) |
                Q(mobile_no__endswith=last_10)
            ).select_related('assigned_to').first()
            
        if existing_lead:
            return {
                "status": "failed",
                "message": "Lead with this mobile number already exists."
            }
        
        email_val = (data.get("email") or "").strip()
        if email_val and Lead.objects.filter(email__iexact=email_val).exists():
            return {
                "status": "failed",
                "message": "Lead with this email address already exists."
            }
        
        # 2. Mandatory Name Validation
        first_name = (data.get("first_name") or "").strip()
        last_name = (data.get("last_name") or "").strip()
        full_name = (data.get("full_name") or data.get("name") or "").strip()
        
        if not full_name and (first_name or last_name):
            full_name = f"{first_name} {last_name}".strip()
            
        if not full_name:
            raise APIException("Student name is required")
            
        # 3. Campaign (by ID or Name)
        campaign_id = data.get("campaign_id") or data.get("campaign_name_id")
        campaign_name_str = data.get("campaign") or data.get("campaign_name")
        
        campaign = None
        if campaign_id:
            campaign = CampaignName.objects.filter(id=campaign_id).first()
        elif campaign_name_str:
            campaign = CampaignName.objects.filter(name__icontains=str(campaign_name_str).strip()).first()
            
        if not campaign:
            campaign = CampaignName.objects.first()
            
        # 4. Lead Source (by ID or Name)
        source_id = data.get("lead_source_id") or data.get("source_id")
        source_name_str = data.get("source") or data.get("lead_source")
        
        source = None
        if source_id:
            source = LeadSource.objects.filter(id=source_id).first()
        elif source_name_str:
            source = LeadSource.objects.filter(name__icontains=str(source_name_str).strip()).first()
            
        if not source:
            source = LeadSource.objects.first()
            
        # 5. Pipeline Name
        pipeline_name = str(data.get("pipeline") or "Education").strip()
        stage_id = data.get("pipeline_stage_id") or 1
        stage = PipelineStage.objects.filter(id=stage_id).first()
        if not stage:
            stage = PipelineStage.objects.filter(name__icontains="new").first()
            
        # 6. Assigned Telecaller User
        assigned_to_id = data.get("assigned_to_id")
        if not assigned_to_id and user and getattr(user, 'is_authenticated', False):
            assigned_to_id = user.id
            
        # 7. Safe Creator Name Check
        creator_org = getattr(user, 'organization', None)
        if not creator_org:
            from adm.models import Organization
            creator_org = Organization.objects.first()

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

        lead = Lead.objects.create(
            full_name=full_name,
            mobile_no=mobile_no,
            email=data.get("email"),
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
        return {
            "status": "success",
            "message": f"Lead '{lead.full_name}' created successfully!",
            "lead_id": lead.id,
            "pipeline": pipeline_name,
            "created_by": created_by_info,
            "assigned_to_id": lead.assigned_to_id
        }
    except Exception as e:
        raise APIException(str(e))
    
    
    
    
# -----------------------------upload lead excel file service------------------------------------------   
    
def upload_lead_excel_admin(file_obj=None, leads_data=None, user=None):
    """
    Bulk Excel/CSV or JSON List Upload Service matching Figma Modal specs:
    - Supports file upload (.csv, .xls, .xlsx) AND JSON array payload from UI modal review
    - File size limit: 3MB
    - Max rows: 25,000
    - Auto maps columns (name, mobile, email, campaign, source)
    - Skips duplicate mobile numbers (Smart 10-digit matching)
    """
    try:
        data_rows = []
        name_idx = 0
        mobile_idx = 1
        email_idx = 2
        campaign_idx = 3
        source_idx = 4
        is_dict_list = False

        if file_obj:
            # 1. Validate File Object
            if isinstance(file_obj, str) or not hasattr(file_obj, 'size') or not hasattr(file_obj, 'read') or not hasattr(file_obj, 'name'):
                raise APIException("Invalid file upload. Please select a valid Excel (.xlsx, .xls) or CSV file.")

            # 2. File Size Validation (Max 3MB = 3 * 1024 * 1024 bytes)
            if file_obj.size > 3 * 1024 * 1024:
                raise APIException("File size exceeds the 3MB limit. Please upload a file smaller than 3MB.")
            
            # 3. File Extension Validation
            filename = str(file_obj.name).lower()
            if not (filename.endswith('.csv') or filename.endswith('.xlsx') or filename.endswith('.xls')):
                raise APIException("Unsupported file format! Please upload a .csv, .xls, or .xlsx file.")
            
            content_bytes = file_obj.read()
            file_obj.seek(0)
            rows_data = []

            if filename.endswith('.csv'):
                try:
                    decoded_file = content_bytes.decode('utf-8-sig').splitlines()
                except Exception:
                    decoded_file = content_bytes.decode('latin-1').splitlines()
                reader = csv.reader(decoded_file)
                for row in reader:
                    if any(row):
                        rows_data.append(row)
            else:  # .xlsx or .xls
                is_parsed = False
                try:
                    import io
                    wb = openpyxl.load_workbook(io.BytesIO(content_bytes), data_only=True)
                    sheet = wb.active
                    for row in sheet.iter_rows(values_only=True):
                        if row and any(row):
                            rows_data.append([str(cell) if cell is not None else "" for cell in row])
                    is_parsed = True
                except Exception:
                    try:
                        try:
                            text_lines = content_bytes.decode('utf-8-sig').splitlines()
                        except Exception:
                            text_lines = content_bytes.decode('latin-1').splitlines()
                        reader = csv.reader(text_lines)
                        temp_rows = []
                        for row in reader:
                            if any(row):
                                temp_rows.append(row)
                        if len(temp_rows) >= 2:
                            rows_data = temp_rows
                            is_parsed = True
                    except Exception:
                        pass

                if not is_parsed:
                    raise APIException(
                        "Unable to read the file format. If you are uploading an older Excel (.xls) binary file, "
                        "please save/convert it as Excel Workbook (.xlsx) or CSV (.csv) format and try again."
                    )
            if not rows_data or len(rows_data) < 2:
                raise APIException("The uploaded file is empty or missing data rows.")

            # Row limit check (Max 25,000 rows as per Figma)
            data_rows = rows_data[1:]
            if len(data_rows) > 25000:
                raise APIException("Maximum limit of 25,000 leads exceeded per file.")

            headers = [str(h).strip().lower() for h in rows_data[0]]
            name_idx = -1
            mobile_idx = -1
            email_idx = -1
            campaign_idx = -1
            source_idx = -1
            for idx, h in enumerate(headers):
                if any(k in h for k in ['name', 'full_name', 'first_name', 'student', 'contact name']):
                    if name_idx == -1: name_idx = idx
                elif any(k in h for k in ['mobile', 'phone', 'contact', 'number', 'primary contact']):
                    if mobile_idx == -1: mobile_idx = idx
                elif 'email' in h:
                    if email_idx == -1: email_idx = idx
                elif 'campaign' in h:
                    if campaign_idx == -1: campaign_idx = idx
                elif 'source' in h:
                    if source_idx == -1: source_idx = idx

            if mobile_idx == -1: mobile_idx = 1 if len(headers) > 1 else 0
            if name_idx == -1: name_idx = 0

        elif leads_data and isinstance(leads_data, list):
            data_rows = leads_data
            is_dict_list = True
        else:
            raise APIException("Please select an Excel/CSV file or provide valid leads data to upload.")

        if not data_rows:
            raise APIException("No lead data rows provided to upload.")

        # Default Foreign Keys
        default_stage = PipelineStage.objects.filter(id=1).first() or PipelineStage.objects.first()
        default_campaign = CampaignName.objects.first()
        default_source = LeadSource.objects.first()
        default_agent = User.objects.filter(is_active=True).first()

        creator_info = "Admin Excel Upload"
        creator_org = getattr(user, 'organization', None) if user and getattr(user, 'is_authenticated', False) else None
        if not creator_org:
            from adm.models import Organization
            creator_org = Organization.objects.order_by('id').first()

        if user and getattr(user, 'is_authenticated', False):
            creator_info = f"{getattr(user, 'username', 'User')} (Admin Excel)"

        # Round Robin Telecaller Assignment Setup
        telecaller_qs = User.objects.filter(is_active=True)
        if creator_org:
            telecaller_qs = telecaller_qs.filter(organization=creator_org)
        telecallers = list(telecaller_qs.filter(user_roles__role__name__icontains="executive"))
        if not telecallers:
            telecallers = list(telecaller_qs.order_by("id"))

        last_assigned_lead = Lead.objects.exclude(assigned_to=None).order_by('-id').first()
        rr_index = 0
        if last_assigned_lead and last_assigned_lead.assigned_to in telecallers:
            rr_index = (telecallers.index(last_assigned_lead.assigned_to) + 1) % len(telecallers)

        def get_next_telecaller():
            nonlocal rr_index
            if not telecallers:
                return default_agent
            assigned = telecallers[rr_index]
            rr_index = (rr_index + 1) % len(telecallers)
            return assigned

        success_count = 0
        duplicate_count = 0
        duplicate_mobiles = []

        # 5. Loop Through Rows & Insert Leads into telecalling_lead Table
        for item in data_rows:
            if is_dict_list and isinstance(item, dict):
                full_name = (
                    item.get("full_name") or item.get("name") or item.get("Contact Name") or
                    item.get("first_name") or "New Enquiry"
                )
                mobile_no = (
                    item.get("mobile_no") or item.get("mobile") or item.get("contact") or
                    item.get("phone") or item.get("Primary Contact Number *") or ""
                )
                email = item.get("email") or item.get("email_address") or item.get("Email Address")
                campaign_val = str(item.get("campaign") or item.get("campaign_name") or "").strip()
                source_val = str(item.get("source") or item.get("lead_source") or "").strip()
            else:
                row = item
                full_name = str(row[name_idx]).strip() if (isinstance(row, (list, tuple)) and name_idx < len(row)) else "New Enquiry"
                mobile_no = str(row[mobile_idx]).strip() if (isinstance(row, (list, tuple)) and mobile_idx < len(row)) else ""
                email = str(row[email_idx]).strip() if (isinstance(row, (list, tuple)) and email_idx != -1 and email_idx < len(row)) else None
                campaign_val = str(row[campaign_idx]).strip() if (isinstance(row, (list, tuple)) and campaign_idx != -1 and campaign_idx < len(row)) else ""
                source_val = str(row[source_idx]).strip() if (isinstance(row, (list, tuple)) and source_idx != -1 and source_idx < len(row)) else ""

            raw_mobile = str(mobile_no).replace(".0", "").strip()
            clean_digits = "".join(filter(str.isdigit, raw_mobile))
            last_10 = clean_digits[-10:] if len(clean_digits) >= 10 else clean_digits

            if not last_10:
                continue

            # Duplicate Mobile Check (Smart 10-digit matching)
            if Lead.objects.filter(
                Q(mobile_no=raw_mobile) |
                Q(mobile_no__endswith=last_10) |
                Q(mobile_no__icontains=last_10)
            ).exists():
                duplicate_count += 1
                duplicate_mobiles.append(raw_mobile)
                continue

            campaign_obj = CampaignName.objects.filter(name__icontains=campaign_val).first() if campaign_val else default_campaign
            source_obj = LeadSource.objects.filter(name__icontains=source_val).first() if source_val else default_source
            assigned_agent = get_next_telecaller() or default_agent

            Lead.objects.create(
                full_name=str(full_name).strip() or "New Enquiry",
                mobile_no=raw_mobile,
                email=str(email).strip() if email else None,
                campaign=campaign_obj or default_campaign,
                lead_source=source_obj or default_source,
                pipeline_stage=default_stage,
                assigned_to=assigned_agent,
                organization=creator_org,
                current_status="working",
                priority_id=None,
                created_by=creator_info,
                enquiry_date=timezone.now()
            )
            success_count += 1

        if success_count == 0 and duplicate_count > 0:
            return {
                "status": "success",
                "message": f"0 new leads added. All {duplicate_count} lead(s) already exist in the database and were skipped.",
                "total_rows": len(data_rows),
                "success_count": 0,
                "duplicate_count": duplicate_count,
                "skipped_duplicates": duplicate_mobiles
            }

        return {
            "status": "success",
            "message": f"{success_count} leads uploaded successfully! {duplicate_count} duplicate mobile numbers skipped.",
            "total_rows": len(data_rows),
            "success_count": success_count,
            "duplicate_count": duplicate_count,
            "skipped_duplicates": duplicate_mobiles[:10]
        }
    except Exception as e:
        if isinstance(e, APIException):
            raise
        raise APIException(str(e))

    


# --------------------------------export leads to excel service------------------------------------------

# def export_all_leads_admin(user=None, request_host=None, **data):
    
#     try:
#         data['page_size'] = "all"
#         result = fetch_all_leads_admin(user=user, **data)
#         leads = result.get("leads", [])

#         import openpyxl
#         from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
#         from openpyxl.utils import get_column_letter

#         wb = openpyxl.Workbook()
#         ws = wb.active
#         ws.title = "Leads_Export"

#         requested_cols = data.get("columns") or []
        
#         column_map = {
#             "s_no": ("S.No", lambda idx, l: idx),
#             "id": ("Lead ID", lambda idx, l: l.get("id")),
#             "full_name": ("Full Name", lambda idx, l: l.get("full_name") or ""),
#             "name": ("Name", lambda idx, l: l.get("full_name") or ""),
#             "mobile_no": ("Mobile No", lambda idx, l: l.get("mobile_no") or ""),
#             "mobile": ("Mobile", lambda idx, l: l.get("mobile_no") or ""),
#             "email": ("Email", lambda idx, l: l.get("email") or ""),
#             "assigned_to": ("Assigned To", lambda idx, l: l.get("assigned_to") or "Unassigned"),
#             "stage": ("Stage", lambda idx, l: l.get("stage") or ""),
#             "tag": ("Priority Tag", lambda idx, l: l.get("tag") or ""),
#             "campaign": ("Campaign", lambda idx, l: l.get("campaign") or ""),
#             "source": ("Source", lambda idx, l: l.get("source") or ""),
#             "course_plan": ("Course Plan", lambda idx, l: l.get("course_plan") or ""),
#             "course": ("Course", lambda idx, l: l.get("course") or ""),
#             "pending_amount": ("Pending Amount", lambda idx, l: l.get("pending_amount") or 0),
#             "total_amount": ("Total Amount", lambda idx, l: l.get("amount") or 0),
#             "created_at": ("Created At", lambda idx, l: str(l.get("created")) if l.get("created") else "")
#         }

#         if requested_cols:
#             active_col_keys = [c for c in requested_cols if c in column_map]
#             if not active_col_keys:
#                 active_col_keys = ["s_no", "name", "mobile", "assigned_to", "stage", "campaign", "source"]
#         else:
#             active_col_keys = ["s_no", "name", "mobile", "assigned_to", "stage", "campaign", "source"]

#         headers = [column_map[k][0] for k in active_col_keys]
#         ws.append(headers)

#         for idx, lead in enumerate(leads, start=1):
#             row_vals = [column_map[k][1](idx, lead) for k in active_col_keys]
#             ws.append(row_vals)

#         header_fill = PatternFill(start_color="84C225", end_color="84C225", fill_type="solid")
#         header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
#         data_font = Font(name="Calibri", size=10)
#         center_align = Alignment(horizontal="center", vertical="center")

#         thin_border = Border(
#             left=Side(style='thin', color='D9D9D9'),
#             right=Side(style='thin', color='D9D9D9'),
#             top=Side(style='thin', color='D9D9D9'),
#             bottom=Side(style='thin', color='D9D9D9')
#         )

#         ws.row_dimensions[1].height = 26
#         for col_num in range(1, len(headers) + 1):
#             cell = ws.cell(row=1, column=col_num)
#             cell.fill = header_fill
#             cell.font = header_font
#             cell.alignment = center_align
#             cell.border = thin_border

#         for row_num in range(2, ws.max_row + 1):
#             ws.row_dimensions[row_num].height = 22
#             for col_num in range(1, len(headers) + 1):
#                 cell = ws.cell(row=row_num, column=col_num)
#                 cell.font = data_font
#                 cell.border = thin_border
#                 cell.alignment = center_align

#         for col in ws.columns:
#             max_len = 0
#             col_letter = get_column_letter(col[0].column)
#             for cell in col:
#                 val_str = str(cell.value or '')
#                 if len(val_str) > max_len:
#                     max_len = len(val_str)
#             ws.column_dimensions[col_letter].width = max(max_len + 6, 16)

#         today_str = timezone.now().strftime("%Y%m%d")
#         file_name = f"Admin_Leads_{today_str}.xlsx"
#         export_dir = os.path.join(settings.MEDIA_ROOT, 'exports')
#         os.makedirs(export_dir, exist_ok=True)
#         file_path = os.path.join(export_dir, file_name)

#         wb.save(file_path)

#         rel_url = f"/media/exports/{file_name}"
#         full_url = f"{request_host}{rel_url}" if request_host else rel_url

#         return {
#             "status": True,
#             "message": f"Successfully exported {len(leads)} leads!",
#             "total_exported": len(leads),
#             "file_name": file_name,
#             "download_url": full_url
#         }
#     except Exception as e:
#         raise APIException(str(e))
    

    
# ------------------------------------- fetch_pipeline_leads_admin----------------------------------

def fetch_pipeline_leads_admin(**data):
    
    try:
        now = timezone.now()
        today = now.date()

        base_qs = Lead.objects.select_related(
            "assigned_to",
            "pipeline_stage",
            "campaign",
            "lead_source"
        )

        pipeline_id = data.get("pipeline_id")
        if pipeline_id:
            base_qs = base_qs.filter(
                Q(pipeline_stage__pipeline_category_id=pipeline_id) |
                Q(campaign__pipeline_category_id=pipeline_id)
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

        date_filter_type = str(data.get("date_filter_type") or "all").lower().strip()
        from_date = data.get("from_date")
        to_date = data.get("to_date")

        if date_filter_type == "today":
            from_date = to_date = today
        elif date_filter_type == "yesterday":
            from_date = to_date = today - timedelta(days=1)
        elif date_filter_type == "weekly":
            from_date, to_date = today - timedelta(days=7), today
        elif date_filter_type in ["monthly", "this_month", "this month"]:
            from_date, to_date = today.replace(day=1), today

        if from_date and to_date and str(from_date).strip() != "" and str(to_date).strip() != "":
            base_qs = base_qs.filter(enquiry_date__date__range=[from_date, to_date])

        def format_card(lead):
            created_dt = lead.enquiry_date or lead.created_at
            formatted_date = created_dt.strftime("%d %b, %I:%M %p") if created_dt else ""
            stg_id = lead.pipeline_stage_id or 1
            return {
                "id": lead.id,
                "full_name": lead.full_name or "",
                "mobile_no": lead.mobile_no or "",
                "pipeline_stage_id": stg_id,
                "pipeline_stage_name": lead.pipeline_stage.name if lead.pipeline_stage else "",
                "assigned_to_id": lead.assigned_to_id,
                "assigned_to": get_user_display_name(lead.assigned_to) or "Unassigned",
                "source_name": lead.lead_source.name if lead.lead_source else "direct walk in",
                "campaign_name": lead.campaign.name if lead.campaign else None,
                "created_at": formatted_date
            }

        pipeline_id_val = data.get("pipeline_id")
        pipeline_stages_qs = PipelineStage.objects.filter(is_active=True)
        if pipeline_id_val and str(pipeline_id_val).isdigit() and int(pipeline_id_val) > 0:
            pipeline_stages_qs = pipeline_stages_qs.filter(pipeline_category_id=int(pipeline_id_val))
        else:
            pipeline_stages_qs = pipeline_stages_qs.filter(pipeline_category_id=1)

        pipeline_stages = list(pipeline_stages_qs.order_by("order_no", "id"))

        data_by_stage = {}
        for stg in pipeline_stages:
            stg_name = stg.display_value or stg.name
            data_by_stage[stg_name] = []

        all_leads = list(base_qs.order_by("-id"))
        for lead in all_leads:
            card = format_card(lead)
            stg_obj = lead.pipeline_stage
            stg_name_key = (stg_obj.display_value or stg_obj.name) if stg_obj else "New Lead"

            if stg_name_key not in data_by_stage:
                data_by_stage[stg_name_key] = []
            data_by_stage[stg_name_key].append(card)

        stage_list = []
        for stg in pipeline_stages:
            stg_name = stg.display_value or stg.name
            cards_for_stg = data_by_stage.get(stg_name, [])
            stage_list.append({
                "pipeline_stage_id": stg.id,
                "pipeline_stage_name": stg_name,
                "stage_type": stg.stage_type,
                "order_no": stg.order_no,
                "total_count": len(cards_for_stg),
                "leads": cards_for_stg
            })

        return {
            "status": True,
            "message": "Pipeline leads fetched successfully",
            "data": data_by_stage,
            "stage_list": stage_list,
            "stages": stage_list
        }

    except Exception as e:
        raise APIException(str(e))

# ---------------------------- fetch lead and timeline details for admin ------------------------------------------

def fetch_lead_details_admin(**data):
     
    try:
        lead_id = data.get("lead_id")
        if not lead_id:
            raise APIException("Lead ID is required")

        lead = Lead.objects.select_related(
            "assigned_to",
            "pipeline_stage",
            "campaign",
            "lead_source",
            "course_plan",
            "course_name",
            "course",
            "priority"
        ).filter(id=lead_id).first()

        if not lead:
            raise APIException("Lead not found")

        # 1. Latest Call & Followup
        latest_call = CallDetails.objects.filter(lead=lead).order_by('-created_at').first()
        latest_followup = FollowUp.objects.filter(lead=lead, is_attended=False).order_by('scheduled_at').first()
        payment_info = PaymentInfo.objects.filter(lead=lead).first()

        course_fee = lead.course.course_fees if (lead.course and hasattr(lead.course, 'course_fees')) else 0
        if not course_fee and payment_info:
            course_fee = (payment_info.amount_paid or 0) + (payment_info.pending_amount or 0)

        # 2. Left Card Lead Info Summary
        lead_info = {
            "id": lead.id,
            "full_name": lead.full_name or "",
            "mobile_no": lead.mobile_no or "",
            "email": lead.email or "",
            "alternative_mobile": lead.alternative_mobile or "",
            "location": lead.location or "",
            "passed_out_year": lead.passed_out_year,
            "experience": lead.experience or "",
            "stage": lead.pipeline_stage.name if lead.pipeline_stage else "New Lead",
            "pipeline": "Education",
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
            "data": {
                "lead_info": lead_info,
                "timeline": timeline
            }
        }

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


def get_mark_as_won_info_admin(lead_id):
   
    try:
        lead = Lead.objects.select_related("assigned_to", "pipeline_stage", "course", "course_name").filter(id=lead_id).first()
        if not lead:
            raise APIException("Lead not found")

        payment_info = PaymentInfo.objects.filter(lead=lead).first()
        course_fee = get_lead_course_fee(lead)

        paid_amount = payment_info.amount_paid if payment_info else 0
        pending_amount = max(course_fee - paid_amount, 0) if course_fee is not None else None

        current_payment_status = "Full Paid" if (pending_amount == 0 and paid_amount > 0) else ("Pending" if paid_amount > 0 else "Unpaid")

        lead_info = {
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

        return {
            "status": "success",
            "data": {
                "lead_info": lead_info
            }
        }
    except Exception as e:
        raise APIException(str(e))


def mark_as_won_admin(**data):
  
    try:
        lead_id = data.get("lead_id")
        if not lead_id:
            raise APIException("Lead ID is required")

        lead = Lead.objects.select_related("course").filter(id=lead_id).first()
        if not lead:
            raise APIException("Lead not found")

        course_fee = get_lead_course_fee(lead)
        if course_fee is None:
            raise APIException("Course fee is not configured for this lead.")

        paid_through = data.get("paid_through") or ""
        amount_paid = float(data.get("amount_paid") or 0)
        is_full_payment = bool(data.get("is_full_payment", False))
        due_date = data.get("due_date")
        summary = data.get("summary") or ""
        next_followup = data.get("next_followup")

        # 🛑 1. Validation: Must enter valid Amount Paid (>0) OR select Full Payment!
        if amount_paid <= 0 and not is_full_payment:
            raise APIException("Amount Paid or Full Payment selection is required to mark a lead as WON. Please enter valid amount_paid or select Full Payment.")

        won_stage = PipelineStage.objects.filter(name__iexact="won").first()
        if not won_stage:
            won_stage = PipelineStage.objects.filter(name__icontains="won").first()
        if not won_stage:
            raise APIException("Won pipeline stage is not configured.")

        lead.pipeline_stage = won_stage
        lead.current_status = "won"
        lead.save()
        try:
            AdminApprovedLossLead.objects.filter(lead=lead).delete()
        except Exception:
            pass

        # 🛡️ 3. Safe Course Fee Calculation (Prevents NoneType error if lead.course is None)
        if is_full_payment:
            amount_paid = course_fee
            pending_amount = 0.0
        else:
            pending_amount = max(course_fee - amount_paid, 0.0)

        # 4. Create or Update PaymentInfo
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
            payment_obj.amount_paid = (payment_obj.amount_paid or 0) + amount_paid
            payment_obj.pending_amount = pending_amount
            payment_obj.is_full_payment = (pending_amount == 0)
            payment_obj.summary = summary
            payment_obj.save()

        # 5. Create PaymentHistory Record safely parsing due_date
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

        # 5. Create FollowUp if next_followup date is provided
        if next_followup and str(next_followup).strip() != "":
            FollowUp.objects.create(
                lead=lead,
                telecaller=lead.assigned_to or User.objects.filter(is_active=True).first(),
                scheduled_at=next_followup,
                notes=f"Followup after Won ({summary})",
                is_attended=False
            )

        return {
            "status": "success",
            "message": f"Lead '{lead.full_name}' marked as WON successfully!",
            "lead_id": lead.id,
            "stage": won_stage.name,
            "amount_paid": payment_obj.amount_paid,
            "pending_amount": payment_obj.pending_amount
        }

    except Exception as e:
        raise APIException(str(e))
    
    
    
# -----------------------------get_mark_as_lost_info_admin----------------------

def get_mark_as_lost_info_admin(lead_id):
    """
    Mark as Lost Modal Open -> Fetch lead summary (attempts, last contacted, lead age) & loss reasons.
    """
    try:
        lead = Lead.objects.select_related("assigned_to", "pipeline_stage").filter(id=lead_id).first()
        if not lead:
            raise APIException("Lead not found")

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
            "data": {
                "lead_info": lead_info,
                "main_reasons": main_reasons,
                "sub_reasons": main_reasons
            }
        }
    except Exception as e:
        raise APIException(str(e))


def mark_as_lost_admin(**data):
   
    try:
        lead_id = data.get("lead_id") or data.get("id")
        if not lead_id:
            raise APIException("Lead ID is required")

        lead = Lead.objects.filter(id=lead_id).first()
        if not lead:
            raise APIException("Lead not found")

        main_reason_val = data.get("main_reason_id") or data.get("main_reason") or data.get("reason")
        detailed_reason = data.get("detailed_reason") or data.get("remarks") or data.get("reason") or ""

        # 🛑 Validation: Loss reason must be selected before marking as LOST!
        if not main_reason_val or str(main_reason_val).strip() in ["", "None", "null", "0"]:
            raise APIException("Reason is required to mark a lead as LOST. Please select a valid reason.")

        # 2. Resolve the selected loss reason.
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
            raise APIException("Selected loss reason was not found for this organization.")

        # 1. Update Lead Pipeline Stage to LOST.
        lost_stage = (
            PipelineStage.objects.filter(stage_type='closed_lost').first() or
            PipelineStage.objects.filter(Q(name__icontains="loss") | Q(name__icontains="lost")).first() or
            PipelineStage.objects.filter(id=5).first()
        )
        if lost_stage:
            lead.pipeline_stage = lost_stage
            lead.save()

        # 3. Create or Update LossLeadDetail
        loss_obj, created = LossLeadDetail.objects.get_or_create(
            lead=lead,
            defaults={
                "loss_reason": main_reason_obj,
                "main_reason_id": main_reason_obj.id,
                "detailed_reason": detailed_reason,
                "reported_by": lead.assigned_to,
                "created_by": "Admin"
            }
        )
        if not created:
            loss_obj.loss_reason = main_reason_obj
            loss_obj.main_reason_id = main_reason_obj.id
            loss_obj.detailed_reason = detailed_reason
            loss_obj.save()
        lead.loss_reason = main_reason_obj
        lead.save(update_fields=["loss_reason", "updated_at"])

        # Resolve acting user safely
        acting_user = data.get("user") or data.get("admin_user") or lead.assigned_to or User.objects.filter(is_superuser=True).first() or User.objects.first()
        created_by_name = get_user_display_name(acting_user) or "Admin"

        # 4. Record Action Log in AdminLossActionLog & Auto-Approve for Admin View
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

        return {
            "status": "success",
            "message": f"Lead '{lead.full_name}' marked as LOST successfully!",
            "lead_id": lead.id,
            "stage": "Lost"
        }

    except Exception as e:
        raise APIException(str(e))
    
    
    
    
# ------------------------------edit lead admin-----------------------------

def edit_lead_admin(**data):
    
    try:
        lead_id = data.get("lead_id") or data.get("id")
        if not lead_id:
            raise APIException("Lead ID is required")

        lead = Lead.objects.filter(id=lead_id).first()
        if not lead:
            raise APIException("Lead not found")

        # 1. Name Resolution
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

        # 2. Basic Info Updates & Duplicate Checks
        if data.get("mobile_no"):
            mob = str(data.get("mobile_no")).strip()
            clean_digits = "".join(filter(str.isdigit, mob))
            last_10 = clean_digits[-10:] if len(clean_digits) >= 10 else clean_digits
            if last_10 and Lead.objects.filter(Q(mobile_no=mob) | Q(mobile_no__endswith=last_10)).exclude(id=lead.id).exists():
                return {
                    "status": "failed",
                    "message": "Lead with this mobile number already exists."
                }
            lead.mobile_no = mob

        if "email" in data and data.get("email") is not None:
            em = str(data.get("email")).strip()
            if em and Lead.objects.filter(email__iexact=em).exclude(id=lead.id).exists():
                return {
                    "status": "failed",
                    "message": "Lead with this email address already exists."
                }
            lead.email = em

        if "alt_mobile" in data and data.get("alt_mobile") is not None:
            lead.alternative_mobile = data.get("alt_mobile")
        if data.get("enquiry_date"):
            try:
                lead.enquiry_date = data.get("enquiry_date")
            except Exception:
                pass

        # 3. Foreign Key Resolutions (Supports both Names and IDs)
        assigned_val = data.get("assigned_to")
        if assigned_val:
            user_obj = User.objects.filter(Q(id=assigned_val if str(assigned_val).isdigit() else 0) | Q(username__icontains=assigned_val) | Q(first_name__icontains=assigned_val)).first()
            if user_obj:
                lead.assigned_to = user_obj

        plan_val = data.get("course_plan")
        if plan_val:
            plan_obj = CoursePlan.objects.filter(Q(id=plan_val if str(plan_val).isdigit() else 0) | Q(course_plan__icontains=plan_val)).first()
            if plan_obj:
                lead.course_plan = plan_obj

        course_val = data.get("course")
        if course_val:
            course_name_obj = CourseName.objects.filter(Q(id=course_val if str(course_val).isdigit() else 0) | Q(course_name__icontains=course_val)).first()
            if course_name_obj:
                lead.course_name = course_name_obj

        campaign_val = data.get("campaign")
        if campaign_val:
            camp_obj = CampaignName.objects.filter(Q(id=campaign_val if str(campaign_val).isdigit() else 0) | Q(name__icontains=campaign_val)).first()
            if camp_obj:
                lead.campaign = camp_obj

        stage_val = data.get("stage") or data.get("pipeline") or data.get("pipeline_stage_id")
        if stage_val:
            stage_obj = PipelineStage.objects.filter(Q(id=stage_val if str(stage_val).isdigit() else 0) | Q(name__icontains=stage_val)).first()
            if stage_obj:
                lead.pipeline_stage = stage_obj

        tag_val = data.get("tag") or data.get("priority_id") or data.get("priority")
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

        # 4. Payment Info Updates & Auto-sync with Pending Payments Page
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

        return {
            "status": "success",
            "message": "Lead details updated successfully",
            "data": {
                "lead_id": lead.id,
                "amount_paid": final_ap,
                "pending_amount": final_pa
            }
        }

    except Exception as e:
        raise APIException(str(e))


# ----------------------------- delete_lead_admin service -----------------------------

def delete_lead_admin(user, lead_id):
  
    try:
        if not lead_id:
            raise APIException("Lead ID is required")

        lead = Lead.objects.filter(id=lead_id).first()
        if not lead:
            raise APIException(f"Lead with ID {lead_id} not found")

        lead_name = lead.full_name
        user_id = user.id if (user and getattr(user, 'is_authenticated', False)) else None

        # Clean up referencing notifications before deleting lead to prevent Foreign Key constraint error
        Notification.objects.filter(lead=lead).delete()

        # Execute safe delete (Audit Log + CASCADE Delete)
        lead.save_delete(user_id=user_id)

        return {
            "status": "success",
            "message": f"Lead '{lead_name}' (ID: {lead_id}) deleted successfully!",
            "deleted_lead_id": lead_id,
            "deleted_by_id": user_id
        }
    except Exception as e:
        raise APIException(str(e))


# ----------------------------- reassign_lead_admin service -----------------------------

def reassign_lead_admin(user, lead_id, new_telecaller_id, reason=None):
    
    try:
        if not lead_id:
            raise APIException("Lead ID is required")
        if not new_telecaller_id:
            raise APIException("New telecaller ID is required")

        lead = Lead.objects.filter(id=lead_id).first()
        if not lead:
            raise APIException(f"Lead with ID {lead_id} not found")

        new_telecaller = User.objects.filter(id=new_telecaller_id, is_active=True).first()
        if not new_telecaller:
            raise APIException(f"Telecaller with ID {new_telecaller_id} not found or inactive")

        previous_telecaller = lead.assigned_to
        reassigned_by = user if (user and getattr(user, 'is_authenticated', False)) else None
        reassigned_by_name = get_user_display_name(reassigned_by) if reassigned_by else "Admin"

        # Collect previous call history JSON from CallDetails table
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

        # Insert audit log into adm_lead_reassign_history table
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

        # Update Lead assigned_to & restore stage if in Loss stage
        lead.assigned_to = new_telecaller
        if lead.pipeline_stage_id in [4] or (lead.pipeline_stage and "loss" in lead.pipeline_stage.name.lower()):
            followup_stage = PipelineStage.objects.filter(id=2).first() or PipelineStage.objects.filter(name__icontains="follow").first()
            if followup_stage:
                lead.pipeline_stage = followup_stage
            lead.current_status = "working"

        # Auto-delete from AdminApprovedLossLead table since lead is no longer a permanent loss!
        AdminApprovedLossLead.objects.filter(lead=lead).delete()

        lead.save()

        new_telecaller_name = get_user_display_name(new_telecaller)

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
    """
    Unified Generic Lead Actions Workflow Engine.
    Handles MARK_WON, MARK_LOST, REASSIGN, CHANGE_STATUS.
    """
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
