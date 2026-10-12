from django.db.models import Count, Q
from django.utils import timezone
from datetime import date, datetime, timedelta
from rest_framework.exceptions import APIException

from telecalling.models.leads import Lead, CampaignName, PipelineStage, Priority, LeadSource
from telecalling.models.courses import Course, CourseName, CoursePlan
from telecalling.models.call_details import CallDetails
from telecalling.models.follow_up import FollowUp
from adm.models.user import User
from adm.models.reassign_lead_history import AdminLeadReassignHistory
from telecalling.models.delete_base_model import SafeDeleteModel

from .query_services import exec_raw_sql

# 🌟 HELPER FUNCTION: FLEXIBLE TEXT MATCHING (Handles spaces, hyphens, and case differences)
def normalize_str(s):
    return str(s or '').lower().replace('-', ' ').replace('_', ' ').strip()

def is_text_match(a, b):
    if not a or not b:
        return False
    return normalize_str(a) == normalize_str(b)


def calculate_closing_date(starting_date, course_plan):
    if not starting_date or not course_plan:
        return None

    import re
    duration_str = str(getattr(course_plan, 'duration', '') or getattr(course_plan, 'course_plan', '') or '').lower()

    month_match = re.search(r'(\d+)\s*month', duration_str)
    if month_match:
        months = int(month_match.group(1))
        return starting_date + timedelta(days=months * 30)

    day_match = re.search(r'(\d+)\s*day', duration_str)
    if day_match:
        days = int(day_match.group(1))
        return starting_date + timedelta(days=days)

    return None


def resolve_campaign_info(campaign_id=None, campaign_name=None):
    c_id = 0
    c_name = ""

    if campaign_id and str(campaign_id).strip() not in ["null", "None", "", "0"]:
        try:
            c_id = int(campaign_id)
        except ValueError:
            c_id = 0

    if campaign_name and str(campaign_name).strip() not in ["null", "None", "", "All Leads", "Enquiry Sheet"]:
        c_name = str(campaign_name).strip()

    # Look up CampaignName model if c_id exists but c_name is empty
    if c_id > 0 and not c_name:
        camp_obj = CampaignName.objects.filter(id=c_id).first()
        if camp_obj:
            c_name = camp_obj.name

    # Look up CampaignName model if c_name exists but c_id is 0
    if c_name and c_id == 0:
        camp_obj = CampaignName.objects.filter(name__iexact=c_name).first()
        if camp_obj:
            c_id = camp_obj.id

    return c_id, c_name


# 1. ENQUIRY SHEET CARDS SERVICE
def fetch_campaign_enquiry_sheet(user, campaign_id=None, campaign_name=None, **kwargs):
    try:
        c_id, c_name = resolve_campaign_info(campaign_id, campaign_name)

        org_id = user.organization_id if (user and hasattr(user, 'organization_id') and user.organization_id) else 0
        qry_vars = {
            "campaign_id": c_id,
            "campaign_name": c_name,
            "organization_id": org_id
        }
            
        raw_cards = exec_raw_sql("D_FETCH_ENQUIRY_SHEET_CARDS", qry_vars) or []
        raw_dist = exec_raw_sql("D_FETCH_ENQUIRY_SHEET_DISTRIBUTION", qry_vars) or []
        
        stats_list = []
        if isinstance(raw_cards, list) and len(raw_cards) > 0 and isinstance(raw_cards[0], dict):
            stats_list = raw_cards[0].get('summary_stats', raw_cards)
        else:
            stats_list = raw_cards

        camp_obj = None
        if c_id:
            camp_obj = CampaignName.objects.filter(id=c_id).first()
        elif c_name:
            camp_obj = CampaignName.objects.filter(name__iexact=c_name).first()

        is_active = camp_obj.is_active if camp_obj else True
        if camp_obj:
            c_id = camp_obj.id

        return {
            "campaign_id": c_id,
            "campaign_name": c_name or (camp_obj.name if camp_obj else "Enquiry Sheet"),
            "is_active": is_active,
            "stats": stats_list,
            "distribution_rows": raw_dist,
            "telecallers": raw_dist
        }
    except Exception as e:
        raise APIException(e)


# 2. LEAD SUMMARY REPORT TABLE SERVICE (RAW SQL CollectionQuery + ORM Commented Backup)
def fetch_lead_summary_report(user, campaign_id=None, campaign_name=None, search=None, **kwargs):
    try:
        c_id, c_name = resolve_campaign_info(campaign_id, campaign_name)

        date_filter_type = kwargs.get("date_range") or kwargs.get("date_filter_type") or ""
        from_date = kwargs.get("from_date", "")
        to_date = kwargs.get("to_date", "")

        try:
            import zoneinfo
            ist = zoneinfo.ZoneInfo('Asia/Kolkata')
            today = datetime.now(ist).date()
        except Exception:
            today = datetime.now().date()

        d_str = str(date_filter_type).strip().lower()

        if d_str in ["today", "daily"]:
            from_date = today
            to_date = today
        elif d_str == "yesterday":
            from_date = today - timedelta(days=1)
            to_date = from_date
        elif d_str in ["weekly", "week", "7"]:
            from_date = today - timedelta(days=7)
            to_date = today
        elif d_str in ["monthly", "month", "30"]:
            from_date = today - timedelta(days=30)
            to_date = today
        elif d_str in ["year", "yearly", "all"]:
            from_date = ""
            to_date = ""
        elif "," in d_str or " to " in d_str:
            parts = d_str.replace(" to ", ",").split(",")
            if len(parts) == 2:
                from_date = parts[0].strip()
                to_date = parts[1].strip()

        def clean_date_val(val):
            s = str(val or '').strip()
            if s in ["0", "null", "None", "All", "all", ""]:
                return ""
            return s

        org_id = user.organization_id if (user and hasattr(user, 'organization_id') and user.organization_id) else 0
        qry_vars = {
            "campaign_id": c_id,
            "campaign_name": c_name,
            "organization_id": org_id,
            "from_date": clean_date_val(from_date),
            "to_date": clean_date_val(to_date),
            "assigned_to": str(kwargs.get("assigned_to") or ""),
            "stages": str(kwargs.get("stages") or kwargs.get("stage") or ""),
            "search": str(search or kwargs.get("search") or ""),
            "lead_source": str(kwargs.get("lead_source") or ""),
            "course_name": str(kwargs.get("course_name") or ""),
            "course_plan": str(kwargs.get("course_plan") or ""),
            "priority": str(kwargs.get("priority") or ""),
            "payment_status": str(kwargs.get("payment_status") or ""),
            "filter_campaign": str(kwargs.get("filter_campaign") or ""),
        }

        rows = exec_raw_sql("D_FETCH_LEAD_SUMMARY_REPORT", qry_vars) or []
        total_records = len(rows)

        page = int(kwargs.get("page") or 1)
        page_size = int(kwargs.get("page_size") or 50)
        start = (page - 1) * page_size
        paged_rows = rows[start:start + page_size]

        for idx, r in enumerate(paged_rows, start=start + 1):
            r['no'] = idx

        return {
            "campaign_name": c_name or "All Leads",
            "total_records": total_records,
            "total_count": total_records,
            "page": page,
            "page_size": page_size,
            "rows": paged_rows
        }
    except Exception as e:
        raise APIException(e)


# 3. UPDATE LEAD SUMMARY SERVICE (POST METHOD)
def update_lead_summary(lead_id, payload):
    try:
        if not lead_id:
            return {"status": "error", "message": "Lead ID is required"}

        lead = Lead.objects.get(id=lead_id)

        first_name = payload.get('firstName') or payload.get('first_name') or ''
        last_name = payload.get('lastName') or payload.get('last_name') or ''
        full_name = f"{first_name} {last_name}".strip()
        if full_name:
            lead.full_name = full_name

        if payload.get('mobile'):
            lead.mobile_no = str(payload.get('mobile')).strip()

        if payload.get('email') is not None:
            lead.email = str(payload.get('email')).strip()

        # Flexible Assigned User matching (by ID, username, or name parts)
        assigned_val = payload.get('assignedTo') or payload.get('assigned_to')
        if assigned_val:
            val_str = str(assigned_val).strip()
            user_obj = None
            if val_str.isdigit():
                user_obj = User.objects.filter(id=int(val_str)).first()
            if not user_obj:
                user_obj = User.objects.filter(
                    Q(username__iexact=val_str) |
                    Q(first_name__iexact=val_str)
                ).first()
            if not user_obj:
                first_part = val_str.split()[0] if val_str.split() else val_str
                user_obj = User.objects.filter(
                    Q(username__icontains=first_part) |
                    Q(first_name__icontains=first_part)
                ).first()
            if user_obj:
                lead.assigned_to = user_obj

        # Flexible Campaign matching
        campaign_name = payload.get('campaign') or payload.get('campaign_name')
        if campaign_name and str(campaign_name).strip():
            camp_name_clean = str(campaign_name).strip()
            camp_obj = CampaignName.objects.filter(name__iexact=camp_name_clean).first()
            if not camp_obj:
                camp_obj = CampaignName.objects.create(name=camp_name_clean, is_active=True)
            lead.campaign = camp_obj

        # Flexible Pipeline Stage matching
        stage_name = payload.get('stage') or payload.get('lead_stage')
        if stage_name and str(stage_name).strip():
            st_clean = str(stage_name).strip().replace('-', ' ').replace('_', ' ')
            stage_obj = None
            for ps in PipelineStage.objects.all():
                ps_norm = ps.name.lower().replace('-', ' ').replace('_', ' ')
                if ps_norm in st_clean.lower() or st_clean.lower() in ps_norm:
                    stage_obj = ps
                    break
            if not stage_obj:
                stage_obj = PipelineStage.objects.create(name=str(stage_name).strip(), is_active=True)
            lead.pipeline_stage = stage_obj
            lead.current_status = stage_obj.name

        # Flexible Priority Tag matching
        tag_val = payload.get('tag') or payload.get('priority')
        if tag_val and str(tag_val).strip() not in ['-', '']:
            tag_clean = str(tag_val).strip()
            pr_obj = Priority.objects.filter(name__iexact=tag_clean).first()
            if not pr_obj:
                pr_obj = Priority.objects.filter(name__icontains=tag_clean).first()
            if pr_obj:
                lead.priority = pr_obj

        # Flexible Course, Course Plan & Deal Amount matching
        course_name_val = payload.get('course') or payload.get('course_name')
        plan_name_val = payload.get('plan') or payload.get('course_plan')
        deal_amount_val = payload.get('amountPaid') or payload.get('deal_amount') or payload.get('amount_paid')

        if course_name_val and str(course_name_val).strip():
            cn_clean = str(course_name_val).strip()
            cn_obj = CourseName.objects.filter(Q(course_name__iexact=cn_clean) | Q(course_name__icontains=cn_clean)).first()
            if not cn_obj:
                cn_obj = CourseName.objects.create(course_name=cn_clean)
            lead.course_name = cn_obj

        if plan_name_val and str(plan_name_val).strip():
            cp_clean = str(plan_name_val).strip()
            cp_obj = CoursePlan.objects.filter(Q(course_plan__iexact=cp_clean) | Q(course_plan__icontains=cp_clean)).first()
            if not cp_obj:
                cp_obj = CoursePlan.objects.create(course_plan=cp_clean)
            lead.course_plan = cp_obj

        if deal_amount_val is not None:
            amt_digits = ''.join(c for c in str(deal_amount_val) if c.isdigit())
            if amt_digits:
                fees_int = int(amt_digits)
                if lead.course:
                    lead.course.course_fees = fees_int
                    lead.course.save()
                else:
                    existing_crs = Course.objects.filter(course_name=lead.course_name, course_plan=lead.course_plan).first()
                    if existing_crs:
                        lead.course = existing_crs
                    else:
                        today = timezone.now().date()
                        closing_dt = calculate_closing_date(today, lead.course_plan)
                        crs_obj = Course.objects.create(
                            course_name=lead.course_name,
                            course_plan=lead.course_plan,
                            course_fees=fees_int,
                            starting_date=today,
                            closing_date=closing_dt,
                            total_seats=0,
                            admission_count=0,
                            seats_left=0,
                            is_active=True
                        )
                        lead.course = crs_obj

        lead.save()
        return {"status": "success", "message": "Lead updated successfully", "lead_id": lead.id}
    except Lead.DoesNotExist:
        return {"status": "error", "message": f"Lead with ID {lead_id} not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def resolve_user_id(user):
    if not user:
        return None
    if isinstance(user, int):
        return user
    if isinstance(user, str) and user.isdigit():
        return int(user)
    if hasattr(user, 'id') and user.id:
        return user.id

    u_str = str(user).strip()
    u_obj = User.objects.filter(
        Q(username__iexact=u_str) |
        Q(first_name__iexact=u_str)
    ).first()
    if not u_obj and ' ' in u_str:
        first_p = u_str.split()[0]
        u_obj = User.objects.filter(
            Q(username__icontains=first_p) |
            Q(first_name__icontains=first_p)
        ).first()
    if u_obj:
        return u_obj.id
    return None


# 4. DELETE LEAD SUMMARY SERVICE (DELETE METHOD)
def delete_lead_summary(lead_id, user=None):
    try:
        if not lead_id:
            return {"status": "error", "message": "Lead ID is required"}

        lead = Lead.objects.get(id=lead_id)
        user_id = resolve_user_id(user)

        # SafeDeleteModel overrides default delete() with a dummy `return None`.
        # Calling save_delete() creates a DeletedDataLog entry and calls super().delete() to physically remove from DB.
        try:
            lead.save_delete(user_id=user_id)
        except Exception:
            super(SafeDeleteModel, lead).delete()

        return {"status": "success", "message": "Lead deleted successfully", "lead_id": lead_id}
    except Lead.DoesNotExist:
        return {"status": "error", "message": f"Lead with ID {lead_id} not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# 5. BULK MOVE LEADS TO ANOTHER CAMPAIGN SERVICE
def move_lead_campaign(lead_ids, target_campaign, note=None):
    try:
        if not lead_ids or not isinstance(lead_ids, list):
            return {"status": "error", "message": "No leads selected"}

        if not target_campaign or not str(target_campaign).strip():
            return {"status": "error", "message": "Target campaign is required"}

        camp_name_clean = str(target_campaign).strip()
        camp_obj = CampaignName.objects.filter(name__iexact=camp_name_clean).first()
        if not camp_obj:
            camp_obj = CampaignName.objects.create(name=camp_name_clean, is_active=True)

        updated_count = Lead.objects.filter(id__in=lead_ids).update(campaign=camp_obj)

        return {
            "status": "success",
            "message": f"Successfully moved {updated_count} leads to campaign '{camp_obj.name}'",
            "moved_count": updated_count,
            "target_campaign": camp_obj.name
        }
    except Exception as e:
        raise APIException(e)


# 6. BULK ASSIGN LEADS TO TELECALLER SERVICE
def assign_lead_telecaller(lead_ids, telecaller, note=None):
    try:
        if not lead_ids or not isinstance(lead_ids, list):
            return {"status": "error", "message": "No leads selected"}

        if not telecaller or not str(telecaller).strip():
            return {"status": "error", "message": "Telecaller is required"}

        val_str = str(telecaller).strip()
        user_obj = None
        if val_str.isdigit():
            user_obj = User.objects.filter(id=int(val_str)).first()

        if not user_obj:
            user_obj = User.objects.filter(
                Q(username__iexact=val_str) |
                Q(first_name__iexact=val_str)
            ).first()

        if not user_obj:
            first_part = val_str.split()[0] if val_str.split() else val_str
            user_obj = User.objects.filter(
                Q(username__icontains=first_part) |
                Q(first_name__icontains=first_part)
            ).first()

        if not user_obj:
            return {"status": "error", "message": f"Telecaller '{telecaller}' not found"}

        updated_count = 0
        leads = Lead.objects.filter(id__in=lead_ids)
        for lead in leads:
            previous_telecaller = lead.assigned_to
            if previous_telecaller != user_obj:
                calls_qs = CallDetails.objects.filter(lead=lead)
                if previous_telecaller:
                    calls_qs = calls_qs.filter(telecaller=previous_telecaller)

                call_history_json = []
                for c in calls_qs.order_by('-created_at')[:20]:
                    call_history_json.append({
                        "call_id": c.id,
                        "telecaller_id": c.telecaller_id,
                        "connection_status": c.connection_status,
                        "duration_seconds": c.duration_seconds,
                        "created_at": c.created_at.isoformat() if c.created_at else None,
                    })

                AdminLeadReassignHistory.objects.create(
                    lead=lead,
                    previous_telecaller=previous_telecaller,
                    new_telecaller=user_obj,
                    attended_calls_count=len(call_history_json),
                    previous_call_history=call_history_json,
                    reassigned_reason=note or "Bulk Reassign via Enquiry Sheet"
                )
                lead.assigned_to = user_obj
                lead.save()
                updated_count += 1
            else:
                updated_count += 1

        display_name = f"{user_obj.first_name or ''} {user_obj.last_name or ''}".strip() or user_obj.username

        return {
            "status": "success",
            "message": f"Successfully assigned {updated_count} leads to {display_name}",
            "assigned_count": updated_count,
            "telecaller": display_name
        }
    except Exception as e:
        raise APIException(e)


# 7. BULK CHANGE LEAD STATUS SERVICE
def change_lead_status(lead_ids, status_name, note=None):
    try:
        if not lead_ids or not isinstance(lead_ids, list):
            return {"status": "error", "message": "No leads selected"}

        if not status_name or not str(status_name).strip():
            return {"status": "error", "message": "Lead status is required"}

        st_clean = str(status_name).strip()
        stage_obj = None
        for ps in PipelineStage.objects.all():
            ps_norm = ps.name.lower().replace('-', ' ').replace('_', ' ')
            if ps_norm in st_clean.lower() or st_clean.lower() in ps_norm:
                stage_obj = ps
                break
        if not stage_obj:
            stage_obj = PipelineStage.objects.create(name=st_clean, is_active=True)

        updated_count = Lead.objects.filter(id__in=lead_ids).update(
            pipeline_stage=stage_obj,
            current_status=stage_obj.name
        )

        return {
            "status": "success",
            "message": f"Successfully updated status to '{stage_obj.name}' for {updated_count} leads",
            "updated_count": updated_count,
            "status_name": stage_obj.name
        }
    except Exception as e:
        raise APIException(e)


# 8. BULK DELETE LEADS SERVICE
def bulk_delete_leads(lead_ids, user=None):
    try:
        if not lead_ids or not isinstance(lead_ids, list):
            return {"status": "error", "message": "No leads selected"}

        user_id = resolve_user_id(user)
        deleted_count = 0
        leads_qs = Lead.objects.filter(id__in=lead_ids)
        for lead in leads_qs:
            try:
                lead.save_delete(user_id=user_id)
            except Exception:
                super(SafeDeleteModel, lead).delete()
            deleted_count += 1

        return {
            "status": "success",
            "message": f"Successfully deleted {deleted_count} leads",
            "deleted_count": deleted_count
        }
    except Exception as e:
        raise APIException(e)


# 9. CALL LOG REPORT SERVICE
def fetch_call_log_report(user, **data):
    try:
        c_id, c_name = resolve_campaign_info(
            campaign_id=data.get('campaign_id'),
            campaign_name=data.get('campaign_name')
        )

        date_range = data.get('date_range', '')
        from_date = ''
        to_date = ''

        if date_range and str(date_range).lower() != 'all':
            if ',' in str(date_range):
                parts = [p.strip() for p in str(date_range).split(',')]
                from_date = parts[0] if parts[0] else ''
                to_date = parts[1] if len(parts) > 1 and parts[1] else ''
            else:
                d_str = str(date_range).lower().strip()
                today = date.today()
                if d_str == 'today':
                    from_date = today.strftime('%Y-%m-%d')
                    to_date = today.strftime('%Y-%m-%d')
                elif d_str == 'yesterday':
                    yest = today - timedelta(days=1)
                    from_date = yest.strftime('%Y-%m-%d')
                    to_date = yest.strftime('%Y-%m-%d')
                elif d_str == 'last_7_days':
                    from_date = (today - timedelta(days=7)).strftime('%Y-%m-%d')
                    to_date = today.strftime('%Y-%m-%d')
                elif d_str == 'last_30_days':
                    from_date = (today - timedelta(days=30)).strftime('%Y-%m-%d')
                    to_date = today.strftime('%Y-%m-%d')
                elif d_str == 'this_month':
                    from_date = today.replace(day=1).strftime('%Y-%m-%d')
                    to_date = today.strftime('%Y-%m-%d')

        qry_vars = {
            'campaign_id': c_id,
            'campaign_name': c_name or '',
            'filter_campaign': data.get('filter_campaign', '') or '',
            'from_date': from_date,
            'to_date': to_date,
            'assigned_to': data.get('assigned_to', '') or '',
            'call_status': data.get('call_status', '') or '',
            'call_direction': data.get('call_direction', '') or '',
            'course_name': data.get('course_name', '') or '',
            'course_plan': data.get('course_plan', '') or '',
            'lead_source': data.get('lead_source', '') or '',
            'priority': data.get('priority', '') or '',
            'search': data.get('search', '') or '',
        }

        raw_rows = exec_raw_sql("D_FETCH_CALL_LOG_REPORT", qry_vars) or []
        total_records = len(raw_rows) if isinstance(raw_rows, list) else 0

        page = int(data.get('page') or 1)
        page_size = int(data.get('page_size') or 50)
        start = (page - 1) * page_size
        paged_raw_rows = raw_rows[start:start + page_size] if isinstance(raw_rows, list) else []

        formatted_rows = []
        for idx, r in enumerate(paged_raw_rows, start=start + 1):
            r['no'] = idx
            formatted_rows.append(r)

        return {
            "campaign_id": c_id,
            "campaign_name": c_name or "All Call Logs",
            "total_records": total_records,
            "total_count": total_records,
            "page": page,
            "page_size": page_size,
            "rows": formatted_rows
        }
    except Exception as e:
        raise APIException(e)


def fetch_disposition_log(user, campaign_id=None, campaign_name=None, search=None, **kwargs):
    try:
        c_id = 0
        c_name = campaign_name
        if campaign_id and str(campaign_id).strip() not in ["null", "None", ""]:
            c_id = int(campaign_id)

        from_date = ""
        to_date = ""
        date_range_str = kwargs.get("date_range") or ""
        if date_range_str:
            parts = [p.strip() for p in date_range_str.split("to")]
            if len(parts) == 2:
                from_date, to_date = parts[0], parts[1]

        qry_vars = {
            'campaign_id': c_id,
            'campaign_name': c_name or '',
            'filter_campaign': kwargs.get('filter_campaign', '') or '',
            'from_date': from_date,
            'to_date': to_date,
            'assigned_to': kwargs.get('assigned_to', '') or '',
            'stages': kwargs.get('stages', '') or '',
            'search': search or '',
        }

        rows = exec_raw_sql("D_FETCH_DISPOSITION_LOG", qry_vars) or []
        total_records = len(rows)

        page = int(kwargs.get('page') or 1)
        page_size = int(kwargs.get('page_size') or 50)
        start = (page - 1) * page_size
        paged_rows = rows[start:start + page_size]

        for idx, r in enumerate(paged_rows, start=start + 1):
            r['no'] = idx

        return {
            "campaign_name": c_name or "Education",
            "total_records": total_records,
            "total_count": total_records,
            "page": page,
            "page_size": page_size,
            "rows": paged_rows
        }
    except Exception as e:
        raise APIException(e)