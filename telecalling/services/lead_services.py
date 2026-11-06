# from ..models import *
from ..models.paymentinfo import PaymentHistory, PaymentFollowUp
from ..models.courses import Course
from ..models.leads import Lead
from ..models.notification import Notification
from ..models.paymentinfo import PaymentInfo,PaymentFollowUp
from rest_framework.exceptions import APIException
from datetime import datetime, timedelta, date
from django.utils import timezone
from adm.services.query_services import exec_raw_sql
from ..tasks import *
from django.utils.dateparse import parse_datetime
from django.db.models import F, Q,Count
from  ..tasks.course_task import *
import zoneinfo

from ..models.leads import PipelineStage
from ..models.loss_reason import LossReason
from adm.models.pipeline_category import PipelineCategory
from ..tasks.notification_task import send_lead_assigned_notification,send_loss_request_notification
import logging
from django.db import transaction
from rest_framework.exceptions import APIException, ValidationError, NotFound, PermissionDenied
import zoneinfo
from django.db import transaction

IST = zoneinfo.ZoneInfo('Asia/Kolkata')


def now_ist():
    return timezone.now().astimezone(IST)


def format_ist_datetime(dt):
    if not dt:
        return None
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, IST)
    else:
        dt = dt.astimezone(IST)
    return dt.strftime('%Y-%m-%d %H:%M:%S')


def parse_ist_datetime(dt_val):
    if not dt_val:
        return None
    if isinstance(dt_val, datetime):
        if timezone.is_naive(dt_val):
            return timezone.make_aware(dt_val, IST)
        return dt_val.astimezone(IST)

    if isinstance(dt_val, str):
        dt_clean = dt_val.strip()
        if not dt_clean:
            return None
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d"):
            try:
                parsed = datetime.strptime(dt_clean[:19], fmt)
                return timezone.make_aware(parsed, IST)
            except (ValueError, TypeError):
                pass
        try:
            parsed = parse_datetime(dt_clean)
            if parsed:
                if timezone.is_naive(parsed):
                    return timezone.make_aware(parsed, IST)
                return parsed.astimezone(IST)
        except Exception:
            pass
    return None




def mark_attended_followup_notifications_read(lead, user=None):
    try:

        
        q = (
            (Q(follow_up__lead=lead) | Q(payment__payment_info__lead=lead) | Q(lead=lead))
            & Q(notification_type__in=[
                "followup_reminder", "missed_followup",
                "payment_followup_reminder", "missed_payment_followup",
                "admin_missed_alert", "admin_payment_followup_missed"
            ])
            & Q(is_read=False)
        )
        notifs = list(Notification.objects.filter(q).values('id', 'user_id'))
        if not notifs:
            return
        
        Notification.objects.filter(q).update(
            is_read=True,
            updated_at=timezone.now(),
            updated_by=str(user) if user else "system"
        )
        
        channel_layer = get_channel_layer()
        user_ids = set(n['user_id'] for n in notifs if n['user_id'])
        if user and hasattr(user, 'id'):
            user_ids.add(user.id)
            
        for uid in user_ids:
            try:
                async_to_sync(channel_layer.group_send)(
                    f"reminder_user_{uid}",
                    {"type": "refresh_remainder", "user_id": uid}
                )
                async_to_sync(channel_layer.group_send)(
                    f"notif_user_{uid}",
                    {"type": "refresh_notifications", "user_id": uid}
                )
            except Exception:
                pass
    except Exception as e:
        logger.warning("Failed to mark followup notifications as read: %s", e)



def parse_ist_date(date_val):
    if not date_val:
        return None
    if isinstance(date_val, datetime):
        return date_val.astimezone(IST).date()
    if hasattr(date_val, 'year') and hasattr(date_val, 'month') and hasattr(date_val, 'day'):
        return date_val
    if isinstance(date_val, str):
        date_clean = date_val.strip()[:10]
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                return datetime.strptime(date_clean, fmt).date()
            except (ValueError, TypeError):
                pass
    return None


def check_lead_ownership(user, lead):
    """
    Validates that user has rights to operate on this lead.
    Allowed if:
    - User is superuser / admin / manager / asst_manager
    - Lead is assigned to user
    - Lead is assigned to a member of user's led teams (Team Lead)
    - Lead is unassigned in user's organization
    """
    if not user or not user.is_authenticated:
        raise PermissionDenied("Authentication required")
    if getattr(user, 'is_superuser', False):
        return True

    user_role_obj = user.user_roles.select_related('role').first() if hasattr(user, 'user_roles') else None
    role_code = (user_role_obj.role.code if user_role_obj and user_role_obj.role else '').upper()
    role_name = (user_role_obj.role.name if user_role_obj and user_role_obj.role else '').lower()
    is_management = role_code in ['ADM', 'DEV', 'ORG_ADMIN', 'MGR', 'AMGR'] or role_name in ['admin', 'superadmin', 'manager', 'asst_manager']
    if is_management:
        if getattr(lead, 'organization_id', None) and getattr(user, 'organization_id', None):
            if lead.organization_id != user.organization_id:
                raise PermissionDenied("You do not have permission to access leads of another organization")
        return True

    if lead.assigned_to_id == user.id:
        return True

    if hasattr(user, 'led_teams') and user.led_teams.exists():
        led_team_ids = set(user.led_teams.values_list('id', flat=True))
        if lead.assigned_to and lead.assigned_to.team_id in led_team_ids:
            return True

    if not lead.assigned_to_id:
        if getattr(lead, 'organization_id', None) and getattr(user, 'organization_id', None):
            if lead.organization_id == user.organization_id:
                return True

    raise PermissionDenied("You do not have permission to modify this lead as it is not assigned to you.")


logger = logging.getLogger(__name__)




def validate_and_sanitize_lead_priority(lead):
    """
    Ensures that lead.priority_id belongs to lead.pipeline_stage_id.
    If priority tag is invalid for the current pipeline stage (e.g. Lead moved to Won or Loss),
    resets lead.priority_id to None.
    """
    if lead.priority_id:
        if not lead.pipeline_stage_id:
            lead.priority_id = None
        else:
            is_valid = Priority.objects.filter(id=lead.priority_id, pipeline_stage_id=lead.pipeline_stage_id).exists()
            if not is_valid:
                lead.priority_id = None







def _resolve_date_range(date_filter_type, from_date=None, to_date=None):
    try:
        ist = zoneinfo.ZoneInfo("Asia/Kolkata")
        today = datetime.now(ist).date()
    except Exception:
        today = datetime.now().date()
 
    ft = str(date_filter_type or "").lower().strip()

    if ft in ["today", "daily"]:
        from_date = today
        to_date = today
    elif ft == "yesterday":
        from_date = today - timedelta(days=1)
        to_date = from_date
    elif ft in ["last_7_days", "last 7 days", "weekly", "week", "7_days"]:
        from_date = today - timedelta(days=7)
        to_date = today
    elif ft in ["last_30_days", "last 30 days", "30_days"]:
        from_date = today - timedelta(days=30)
        to_date = today
    elif ft in ["this_month", "this month", "monthly", "month"]:
        from_date = today.replace(day=1)
        to_date = today
    elif ft in ["last_year", "last year", "previous_year"]:
        from_date = today.replace(year=today.year - 1, month=1, day=1)
        to_date = today.replace(year=today.year - 1, month=12, day=31)
    elif ft in ["year", "yearly", "this_year", "this year"]:
        from_date = today.replace(month=1, day=1)
        to_date = today
    elif ft in ["all", "all_time", "overall"]:
        from_date = date(1970, 1, 1)
        to_date = today
    elif ft == "custom":
        if from_date and isinstance(from_date, str) and str(from_date) != "None":
            try:
                from_date = datetime.strptime(from_date, "%Y-%m-%d").date()
            except Exception:
                from_date = date(1970, 1, 1)
        else:
            from_date = from_date or date(1970, 1, 1)
        if to_date and isinstance(to_date, str) and str(to_date) != "None":
            try:
                to_date = datetime.strptime(to_date, "%Y-%m-%d").date()
            except Exception:
                to_date = today
        else:
            to_date = to_date or today
    else:
        from_date = date(1970, 1, 1)
        to_date = today

    return today, from_date, to_date
 
 



def _resolve_pipeline(user, pipeline_id):
    user_org = getattr(user, "organization_id", None)
    is_super = getattr(user, 'is_superuser', False) if user else False
    
    # 1. Org ID இல்லாத சாதாரண பயனருக்கு None என Block செய்தோம்:
    if not user_org and not is_super:
        return None
 
    pipeline_id = int(pipeline_id) if pipeline_id and str(pipeline_id).isdigit() and int(pipeline_id) > 0 else 0
 
    if pipeline_id > 0:
        pipe_filter = {'id': pipeline_id, 'is_active': True}
        if user_org:
            pipe_filter['organization_id'] = user_org
        pipeline = PipelineCategory.objects.filter(**pipe_filter).first()
    else:
        pipe_qs = PipelineCategory.objects.filter(is_active=True)
        if user_org:
            # 2. Strictly user-ன் organization_id மட்டுமே filter ஆகிறது (No Fallback):
            pipe_qs = pipe_qs.filter(organization_id=user_org)
        pipeline = pipe_qs.filter(is_default=True).first() or pipe_qs.first()
 
    return pipeline


PAYMENT_STATUS_LOOKUP = "payments__payment_status"


def fetch_leads(user, **data):
    try:
        user_org = getattr(user, 'organization', None) if user else None
        is_super = getattr(user, 'is_superuser', False) if user else False
        if not user_org and not is_super:
            return [], {"total_leads": 0, "stage_wise_count": []}
        
        
        lead_filter_type = data.get("lead_filter_type")
        date_filter_type = data.get("date_filter_type", "year")
        from_date = data.get("from_date")
        to_date = data.get("to_date")

        today, from_date, to_date = _resolve_date_range(
            date_filter_type, from_date, to_date
        )

        pipeline_stage_id = data.get("pipeline_stage_id") or 0
        campaign_id = data.get("campaign_name_id") or 0
        lead_source_id = data.get("lead_source_id") or 0
        course_name_id = data.get("course_name_id") or 0
        priority_id = data.get("priority_id") or 0
        course_plan_id = data.get("course_plan_id") or 0
        payment_status = data.get("payment_status") or 0
        raw_pipeline_id = data.get("pipeline_id")

        # ---- 1. Resolve pipeline ----
        pipeline = _resolve_pipeline(user, raw_pipeline_id)
        if not pipeline:
            return [], {"total_leads": 0, "stage_wise_count": []}

        # ---- 2. Pipeline stages ----
        stages_qs = PipelineStage.objects.filter(
            pipeline_category=pipeline,
            is_active=True,
        ).order_by("order_no", "id")

        # ---- 3. Base queryset ----
        qs = Lead.objects.filter(
            assigned_to=user,
            pipeline_stage__pipeline_category=pipeline,
        )

        if from_date and to_date:
            qs = qs.filter(created_at__date__range=[from_date, to_date])

        if pipeline_stage_id:
            qs = qs.filter(pipeline_stage_id=pipeline_stage_id)
        if campaign_id:
            qs = qs.filter(campaign_id=campaign_id)
        if lead_source_id:
            qs = qs.filter(lead_source_id=lead_source_id)
        if course_name_id:
            qs = qs.filter(course_name_id=course_name_id)
        if priority_id:
            qs = qs.filter(priority_id=priority_id)
        if course_plan_id:
            qs = qs.filter(course_plan_id=course_plan_id)
        if payment_status:
            qs = qs.filter(**{PAYMENT_STATUS_LOOKUP: payment_status})

        # Top-level tab filter: New / Follow Up / Won / Loss
        if lead_filter_type:
            # "follow_up" -> "Follow Up" handling
            clean_type = lead_filter_type.replace("_", " ")
            qs = qs.filter(
                pipeline_stage__name__iregex=rf"^({lead_filter_type}|{clean_type})$"
            )

        if payment_status:
            qs = qs.distinct()

        # Database Query Optimization:
        # FK relations-க்கு select_related, Reverse relations-க்கு prefetch_related
        qs = (
            qs.select_related(
                "lead_source",
                "campaign",
                "pipeline_stage",
                "course_name",
                "course_plan",
                "priority",
                "course",
            )
            .prefetch_related("payments", "calls")
            .order_by("-created_at")
        )

        # ---- Frontend-க்கு தேவையான சரியான Key-களில் Data Format செய்தல் ----
        leads = []
        for lead in qs:
            # 1. Payments Info
            payments = list(lead.payments.all())
            latest_payment = payments[-1] if payments else None

            amount_paid = latest_payment.amount_paid if latest_payment else 0
            pending_amount = (
                latest_payment.pending_amount if latest_payment else None
            )
            is_full_payment = (
                latest_payment.is_full_payment if latest_payment else False
            )

            # Total fee calculation
            if (
                lead.course
                and getattr(lead.course, "course_fees", None) is not None
            ):
                total_amount = lead.course.course_fees
            elif latest_payment and pending_amount is not None:
                total_amount = (amount_paid or 0) + (pending_amount or 0)
            else:
                total_amount = None

            # 2. Last Call info (called_at)
            calls = list(lead.calls.all())
            latest_call = calls[-1] if calls else None
            called_at_str = (
                latest_call.called_at.isoformat()
                if (latest_call and latest_call.called_at)
                else None
            )

            # 3. Created on / Enquiry date
            enq_date = getattr(lead, "enquiry_date", None) or lead.created_at
            enquiry_date_str = enq_date.isoformat() if enq_date else None

            # 4. Course and Plan Name resolution
            c_name = ""
            if lead.course_name:
                c_name = getattr(
                    lead.course_name,
                    "course_name",
                    getattr(lead.course_name, "coursename", ""),
                )

            c_plan = ""
            if lead.course_plan:
                c_plan = getattr(
                    lead.course_plan,
                    "course_plan",
                    getattr(lead.course_plan, "courseplan", ""),
                )
            
            # 4. Course and Plan Name resolution
            # c_name = ""
            # if lead.course_name:
            #     c_name = lead.course_name.course_name or ""

            # c_plan = ""
            # if lead.course_plan:
            #     c_plan = lead.course_plan.course_plan or ""

            leads.append(
                {
                    "id": lead.id,
                    "full_name": lead.full_name or "-",
                    "mobile_no": lead.mobile_no or "-",
                    "alternative_mobile": lead.alternative_mobile or "-",
                    "email": lead.email or "-",
                    "source": lead.lead_source.name
                    if lead.lead_source
                    else "-",
                    "campaign_name": lead.campaign.name
                    if lead.campaign
                    else "-",
                    "stage": lead.pipeline_stage.name
                    if lead.pipeline_stage
                    else "-",
                    "stage_color": lead.pipeline_stage.stage_color if lead.pipeline_stage else "",
                    "tag": lead.priority.name if lead.priority else "-",
                    "course_plan": c_plan or "-",
                    "course_name": c_name or "-",
                    # Payment fields (LeadTable renderCell-க்கு தேவையானவை)
                    "payment_amount": pending_amount,
                    "is_full_payment": is_full_payment,
                    "pending_amount": pending_amount,
                    "amount_paid": amount_paid,
                    "total_amount": total_amount,
                    # Date fields (LeadTable formatDate-க்கு தேவையானவை)
                    "enquiry_date": enquiry_date_str,
                    "called_at": called_at_str,
                }
            )

        # ---- 4. Counts breakdown ----
        count_qs = Lead.objects.filter(
            assigned_to=user,
            pipeline_stage__pipeline_category=pipeline,
        )
        if from_date and to_date:
            count_qs = count_qs.filter(
                created_at__date__range=[from_date, to_date]
            )
        if campaign_id:
            count_qs = count_qs.filter(campaign_id=campaign_id)
        if lead_source_id:
            count_qs = count_qs.filter(lead_source_id=lead_source_id)
        if course_name_id:
            count_qs = count_qs.filter(course_name_id=course_name_id)
        if priority_id:
            count_qs = count_qs.filter(priority_id=priority_id)
        if course_plan_id:
            count_qs = count_qs.filter(course_plan_id=course_plan_id)
        if payment_status:
            count_qs = count_qs.filter(
                **{PAYMENT_STATUS_LOOKUP: payment_status}
            ).distinct()

        total_leads = count_qs.count()

        stage_counts_raw = count_qs.values("pipeline_stage_id").annotate(
            total=Count("id")
        )
        stage_count_map = {
            row["pipeline_stage_id"]: row["total"] for row in stage_counts_raw
        }

        stage_wise_count = [
            {
                "pipeline_stage_id": stage.id,
                "id": stage.id,
                "label": stage.display_value or stage.name,
                "name": stage.name,
                "order_no": stage.order_no,
                "stage_color": stage.stage_color or "",
                "count": stage_count_map.get(stage.id, 0),
            }
            for stage in stages_qs
        ]

        count = {
            "pipeline_id": pipeline.id,
            "pipeline_name": pipeline.display_name or pipeline.category_name,
            "total_leads": total_leads,
            "stage_wise_count": stage_wise_count,
        }

        return leads, count

    except Exception as e:
        raise APIException(e)

      
def fetch_pipeline_leads(user, **data):
    try:
        filter_type = data.get("date_filter_type", "year")

        from_date = data.get("from_date")
        to_date = data.get("to_date")

        today, from_date, to_date = _resolve_date_range(filter_type, from_date, to_date)
        ref_date = data.get("ref_date", today)

        params = {
            "id": user.id,
            "telecaller_id": user.id,
            "from_date": str(from_date) if from_date else "1970-01-01",
            "to_date": str(to_date) if to_date else str(today),
            "filter_type": filter_type,
            "pipeline_id": data.get("pipeline_id") or 0,
            "pipeline_stage_id": data.get("pipeline_stage_id") or 0,
            "lead_source_id": data.get("lead_source_id") or 0,
            "course_name_id": data.get("course_name_id") or 0,
            "priority_id": data.get("priority_id") or 0,
            "course_plan_id": data.get("course_plan_id") or 0,
            "payment_status": data.get("payment_status") or 0,
            "followup_status": data.get("followup_status") or "",
        }
        lead = exec_raw_sql("D_FETCH_PIPELINE_STATGE_LEADS", params)

        # Stage sorting: New Lead, Won, Loss -> DESC (newest first); all other stages -> ASC (earliest first)
        def _card_date_sort_key(c):
            return str(c.get("date") or c.get("loss_approved_at") or c.get("loss_requested_at") or c.get("updated_at") or c.get("created_at") or "")

        def _is_desc_stage(stg_dict):
            stg_type = str(stg_dict.get("stage_type") or "").lower()
            stg_name = str(stg_dict.get("name") or "").lower()
            is_first = bool(stg_dict.get("is_first"))
            return (
                stg_type in ("closed_won", "closed_lost")
                or stg_name in ("won", "loss", "new lead", "new")
                or is_first
            )

        def _process_stage_sorting(stg_dict):
            stg_type = str(stg_dict.get("stage_type") or "").lower()
            stg_name = str(stg_dict.get("name") or "").lower()
            is_desc = _is_desc_stage(stg_dict)

            # Won & Loss: remove past/current/future tabs
            if stg_type in ("closed_won", "closed_lost") or stg_name in ("won", "loss"):
                stg_dict.pop("past", None)
                stg_dict.pop("current", None)
                stg_dict.pop("future", None)
                stg_dict["has_buckets"] = False

            if isinstance(stg_dict.get("data"), list):
                stg_dict["data"].sort(key=_card_date_sort_key, reverse=is_desc)

            for b in ("past", "current", "future"):
                if isinstance(stg_dict.get(b), dict) and isinstance(stg_dict[b].get("data"), list):
                    stg_dict[b]["data"].sort(key=_card_date_sort_key, reverse=is_desc)

        if isinstance(lead, list):
            for row in lead:
                if isinstance(row, dict) and "pipeline_data" in row:
                    p_data = row["pipeline_data"]
                    if isinstance(p_data, list):
                        for p in p_data:
                            if isinstance(p, dict):
                                for stg in p.get("stages", []):
                                    if isinstance(stg, dict):
                                        _process_stage_sorting(stg)
                                p_dict = p.get("pipeline_data")
                                if isinstance(p_dict, dict):
                                    for val in p_dict.values():
                                        if isinstance(val, dict):
                                            _process_stage_sorting(val)

        return lead
    except Exception as e:
        raise APIException(e)
    
    
        
def course_count(**data):
    try:
        
        course=Course.objects.filter(id=data.get("id")).first()
        
        print(course)
        if course is  None:
            raise APIException("Course id Already exists")
        
        course.admission_count+=data.get("count")
        
        print(course.admission_count)
        course.save()
        course_count_task()
        
        return f"{course.course_name} is count updated"
    except Exception as e:
        raise APIException(e)
    
    
    
    
    
  
    
    
   
     
def lead_form_details(user, **data):
    try:
        lead_id = data.get("lead_id")
        lead = Lead.objects.filter(id=lead_id).first()
        if lead is None:
            raise NotFound("Lead Not Found")

        check_lead_ownership(user, lead)

        lead_pipe_id = (
            getattr(lead, 'pipeline_id', None)
            or (lead.pipeline_stage.pipeline_category_id if getattr(lead, 'pipeline_stage', None) else None)
            or (lead.campaign.pipeline_category_id if getattr(lead, 'campaign', None) else None)
        )
        won_stage = (
            PipelineStage.objects.filter(pipeline_category_id=lead_pipe_id, stage_type='closed_won').first()
            or PipelineStage.objects.filter(pipeline_category_id=lead_pipe_id, name__icontains='won').first()
            or PipelineStage.objects.filter(stage_type='closed_won').first()
            or PipelineStage.objects.filter(name__iexact="won").first()
        )
        try:
            requested_stage_id = int(data.get("pipeline_stage_id"))
        except (TypeError, ValueError):
            requested_stage_id = None
        is_moving_to_won = bool(won_stage) and requested_stage_id == won_stage.id

        upd_m = data.get("mobile")
        upd_alt = data.get("alternative_mobile")
        if upd_m or upd_alt:
            clean_m = "".join(filter(str.isdigit, str(upd_m))) if upd_m else ""
            last_10_m = clean_m[-10:] if len(clean_m) >= 10 else clean_m

            clean_alt = "".join(filter(str.isdigit, str(upd_alt))) if upd_alt else ""
            last_10_alt = clean_alt[-10:] if len(clean_alt) >= 10 else clean_alt

            # Check if alternate matches own primary mobile
            curr_lead_m = "".join(filter(str.isdigit, str(lead.mobile_no or "")))[-10:]
            if last_10_alt and (last_10_alt == last_10_m or (not last_10_m and last_10_alt == curr_lead_m)):
                raise ValidationError("Alternate mobile number cannot be the same as the primary mobile number.")

            dup_q = Q()
            if last_10_m:
                dup_q |= Q(mobile_no__endswith=last_10_m) | Q(alternative_mobile__endswith=last_10_m)
            if last_10_alt:
                dup_q |= Q(mobile_no__endswith=last_10_alt) | Q(alternative_mobile__endswith=last_10_alt)

            if dup_q:
                dup_qs = Lead.objects.filter(dup_q).exclude(id=lead.id).select_related("assigned_to", "campaign")
                target_org = lead.organization or getattr(user, "organization", None)
                if target_org:
                    dup_qs = dup_qs.filter(organization=target_org)
                existing = dup_qs.first()
                if existing:
                    assigned_user = existing.assigned_to
                    assigned_name = f"{getattr(assigned_user, 'first_name', '')} {getattr(assigned_user, 'last_name', '')}".strip() or getattr(assigned_user, 'username', 'Unknown') if assigned_user else "Unassigned"
                    campaign_name = existing.campaign.name if getattr(existing, 'campaign', None) else "General"

                    is_alt_match = bool(
                        last_10_alt and (
                            last_10_alt in str(existing.mobile_no or "") or
                            last_10_alt in str(existing.alternative_mobile or "")
                        )
                    )
                    num_type = "alternate mobile number" if is_alt_match else "mobile number"
                    raise ValidationError(
                        f"Lead with this {num_type} already exists in '{campaign_name}' campaign and is assigned to {assigned_name}."
                    )

        with transaction.atomic():
            if data.get("fullname"):
                lead.full_name = data.get("fullname")
            if data.get("mobile"):
                lead.mobile_no = data.get("mobile")
            if data.get("alternative_mobile"):
                lead.alternative_mobile = data.get("alternative_mobile")
            if data.get("email"):
                lead.email = data.get("email")
            if data.get("location"):
                lead.location = data.get("location")
            if data.get("education"):
                edu_name = str(data.get("education")).strip()
                if edu_name:
                    edu_obj, _ = Education.objects.get_or_create(
                        name__iexact=edu_name,
                        defaults={"name": edu_name, "is_active": True, "created_by": str(user)}
                    )
                    lead.education = edu_obj
            elif data.get("education_id"):
                lead.education_id = data.get("education_id")
            if data.get("passed_out_year"):
                lead.passed_out_year = data.get("passed_out_year")
            if data.get("experience"):
                lead.experience = data.get("experience")

            if data.get("enquiry_date"):
                parsed_enq = parse_ist_date(data.get("enquiry_date")) or parse_ist_datetime(data.get("enquiry_date"))
                if parsed_enq:
                    lead.enquiry_date = parsed_enq
            if data.get("current_status"):
                lead.current_status = data.get("current_status")
            if data.get("lead_source_id"):
                lead.lead_source_id = data.get("lead_source_id")
            if data.get("campaign_name_id"):
                lead.campaign_id = data.get("campaign_name_id")
            if data.get("course_plan_id"):
                lead.course_plan_id = data.get("course_plan_id")
            if data.get("course_name_id"):
                lead.course_name_id = data.get("course_name_id")
            if data.get("course_timing_id"):
                lead.course_timing_id = data.get("course_timing_id")
            if data.get("preferred_timing_id"):
                lead.preferred_timing_id = data.get("preferred_timing_id")

            # Course resolution
            course = None
            if data.get("course_name_id") and data.get("course_plan_id") and data.get("course_timing_id"):
                course = Course.objects.filter(
                    course_name_id=data.get("course_name_id"),
                    course_plan_id=data.get("course_plan_id"),
                    course_time_id=data.get("course_timing_id"),
                ).first()
                if course is None:
                    raise ValidationError("Course Not Found")
                lead.course = course

                old_pipeline_stage = lead.pipeline_stage_id
                if is_moving_to_won and old_pipeline_stage != won_stage.id:
                    if course.seats_left <= 0:
                        raise ValidationError("No seats available for this course.")
                    course.admission_count += 1
                    course.save()

            if data.get("pipeline_stage_id"):
                st_val = data.get("pipeline_stage_id")
                st_obj = None
                if str(st_val).isdigit():
                    st_obj = PipelineStage.objects.filter(id=int(st_val)).first()
                else:
                    st_obj = PipelineStage.objects.filter(name__iexact=str(st_val)).first()

                if st_obj:
                    lead.pipeline_stage = st_obj
                    st_name = st_obj.name.lower().strip()
                    st_type = getattr(st_obj, 'stage_type', '').lower().strip()

                    if st_type == 'closed_won' or ('won' in st_name and 'loss' not in st_name and 'lost' not in st_name):
                        lead.current_status = "Won"
                    elif st_type == 'closed_lost' or 'loss' in st_name or 'lost' in st_name:
                        lead.current_status = "Loss"
                    else:
                        lead.current_status = "Working" 

            if "priority_id" in data:
                p_val = data.get("priority_id")
                if p_val in [None, "", 0, "0", "null", "None"]:
                    lead.priority_id = None
                else:
                    try:
                        lead.priority_id = int(p_val)
                    except (ValueError, TypeError):
                        lead.priority_id = None

            validate_and_sanitize_lead_priority(lead)
            lead.updated_by = str(user)
            lead.save()

            referal_list = data.get("referal_list") or []
            for re in referal_list:
                ReferalDetails.objects.create(
                    referal_name=re.get("name", ""),
                    referal_number=re.get("number", ""),
                    referal_lead=lead,
                    created_by=user
                )

        return {
            "status": "success",
            "message": "Lead Updated Successfully",
            "data": {
                "lead_id": lead.id,
                "full_name": lead.full_name,
                "current_status": lead.current_status,
                "pipeline_stage_id": lead.pipeline_stage_id,
                "updated_at": format_ist_datetime(now_ist())
            }
        }

    except (ValidationError, NotFound, PermissionDenied):
        raise
    except Exception as e:
        raise APIException(str(e))



def fetch_one_lead(**data):
    try:
        lead = Lead.objects.filter(id=data.get("lead_id")).first()
        
        if lead is None:
            raise APIException("Lead Not Found")
        lead=exec_raw_sql("D_FETCH_ONE_LEAD",{"id":data.get("lead_id")})
        


        
        return lead
    except Exception as e:
        raise APIException(e)


def fetch_call_history(**data):
    try:
        lead = Lead.objects.filter(id=data.get("lead_id")).first()
        
        if lead is None:
            raise APIException("Lead Not Found")
        lead=exec_raw_sql("D_FETCH_ONE_LEAD_CALL_HISTORY",{"id":data.get("lead_id")})
        
        print(lead)

        
        return lead
    except Exception as e:
        raise APIException(e)
    
    
    
def call_connect_api(user, **data):
    try:
        lead_id = data.get("lead_id")
        lead = Lead.objects.filter(id=lead_id).first()
        if lead is None:
            raise NotFound("Lead Not Found")

        check_lead_ownership(user, lead)

        followup_datetime = parse_ist_datetime(data.get("next_followup"))

        if followup_datetime:
            exists = FollowUp.objects.filter(
                telecaller=user,
                scheduled_at__year=followup_datetime.year,
                scheduled_at__month=followup_datetime.month,
                scheduled_at__day=followup_datetime.day,
                scheduled_at__hour=followup_datetime.hour,
                scheduled_at__minute=followup_datetime.minute,
                is_attended=False
            ).exists()

            if exists:
                raise ValidationError("Follow-up already scheduled for this time.")

        with transaction.atomic():
            stage_id = data.get("stage_id")
            select_tag_id = data.get("select_tag_id")

            parsed_stage_id = int(stage_id) if stage_id and str(stage_id) not in ['None', '', '0', 'null'] else None
            parsed_tag_id = int(select_tag_id) if select_tag_id and str(select_tag_id) not in ['None', '', '0', 'null'] else None

            if parsed_stage_id:
                stage_obj = PipelineStage.objects.filter(id=parsed_stage_id).first()
                if stage_obj:
                    lead.pipeline_stage = stage_obj

            lead.priority_id = parsed_tag_id
            validate_and_sanitize_lead_priority(lead)
            lead.save()

            current_stage = lead.pipeline_stage_id
            won_stage = PipelineStage.objects.filter(
                id=current_stage,
                stage_type="closed_won",
                is_active=True,
                organization_id=lead.organization_id
            ).first()
            is_won_stage = won_stage is not None

            conn_stat = data.get("connection_status") or "Connected"
            call_dir = data.get("call_direction") or ("Incoming" if str(conn_stat).strip().lower() == "incoming" else "Outgoing")

            tag_exists = Priority.objects.filter(id=parsed_tag_id, pipeline_stage_id=parsed_stage_id).exists()
            select_tag_val = parsed_tag_id if tag_exists else None

            stage_exists = PipelineStage.objects.filter(id=parsed_stage_id).exists()
            stage_val = parsed_stage_id if stage_exists else None

            call = CallDetails.objects.create(
                lead=lead,
                telecaller=user,
                connection_status=conn_stat,
                call_direction=call_dir,
                duration_seconds=int(data.get("call_duration") or 0),
                stage_id=stage_val,
                select_tag_id=select_tag_val,
                conversation_summary=data.get("call_summary"),
                upload_recording=data.get("upload_record"),
                created_by=str(user),
                organization_id=lead.organization_id
            )

            current_time_ist = now_ist()

            # Mark ALL existing normal followups as attended in IST
            FollowUp.objects.filter(lead=lead, is_attended=False).update(
                is_attended=True,
                attended_at=current_time_ist,
                attended_via_call=call,
                updated_by=str(user),
                organization_id=lead.organization_id
            )

            # Mark ALL existing payment followups as attended/completed in IST
            PaymentFollowUp.objects.filter(
                payment_info__lead=lead,
                is_attended=False
            ).update(
                is_attended=True,
                attended_at=current_time_ist,
                followup_status="Completed",
                attended_via_call=call,
                updated_by=str(user),
                organization_id=lead.organization_id
            )

            # Mark related notifications read
            mark_attended_followup_notifications_read(lead, user)

            # Schedule next followup if requested
            payment_info = PaymentInfo.objects.filter(lead=lead).order_by("-created_at").first()
            if followup_datetime:
                if is_won_stage and payment_info and not payment_info.is_full_payment:
                    PaymentFollowUp.objects.create(
                        payment_info=payment_info,
                        followup_date=followup_datetime,
                        created_from_call=call,
                        created_by=str(user),
                        organization_id=lead.organization_id
                    )
                else:
                    FollowUp.objects.create(
                        lead=lead,
                        telecaller=user,
                        scheduled_at=followup_datetime,
                        created_from_call=call,
                        created_by=str(user),
                        organization_id=lead.organization_id
                    )

        return {
            "status": "success",
            "message": "Call connected details saved successfully",
            "data": {
                "call_id": call.id,
                "lead_id": lead.id,
                "stage_id": stage_val,
                "next_followup": format_ist_datetime(followup_datetime) if followup_datetime else None,
                "called_at": format_ist_datetime(call.called_at or current_time_ist)
            }
        }

    except (ValidationError, NotFound, PermissionDenied):
        raise
    except Exception as e:
        raise APIException(str(e))
    
    
    
def upload_call_recording_service(user, **data):
    try:
        call_id = data.get("call_id")
        if not call_id:
            raise ValidationError("call_id is required")

        call = CallDetails.objects.filter(id=call_id).first()
        if not call:
            raise NotFound("Call record not found")

        upload_file = data.get("upload_record")
        if upload_file:
            call.upload_recording = upload_file

        call_notes = data.get("call_notes")
        if call_notes is not None and str(call_notes).strip() != "":
            call.conversation_summary = str(call_notes).strip()

        call.updated_by = str(getattr(user, "username", user))
        call.save()

        rec_url = call.upload_recording.url if (call.upload_recording and hasattr(call.upload_recording, "url")) else None

        return {
            "success": True,
            "message": "Call recording uploaded successfully",
            "call_id": call.id,
            "recording_url": rec_url,
            "conversation_summary": call.conversation_summary,
        }
    except (ValidationError, NotFound, PermissionDenied):
        raise
    except Exception as e:
        raise APIException(str(e))


def delete_call_recording_service(user, **data):
    try:
        call_id = data.get("call_id")
        if not call_id:
            raise ValidationError("call_id is required")

        call = CallDetails.objects.filter(id=call_id).first()
        if not call:
            raise NotFound("Call record not found")

        if call.upload_recording:
            try:
                call.upload_recording.delete(save=False)
            except Exception:
                pass
            call.upload_recording = None
            call.updated_by = str(getattr(user, "username", user))
            call.save()

        return {
            "success": True,
            "message": "Call recording removed successfully",
            "call_id": call.id
        }
    except (ValidationError, NotFound, PermissionDenied):
        raise
    except Exception as e:
        raise APIException(str(e))


def call_disconnect_select_api(user,**data):
    try:

        lead = Lead.objects.filter(id=data.get("lead_id")).first()
        
        id=data.get("lead_id")

        if lead is None:
            raise APIException("Lead Not Found")   
        
        tag=exec_raw_sql("D_FETCH_DISCONNECT_SELECT",{"id":id})

        return tag
        
    except Exception as e:
        raise APIException(str(e))    

def call_disconnect_api(user, **data):
    try:
        lead_id = data.get("lead_id")
        lead = Lead.objects.filter(id=lead_id).first()
        if lead is None:
            raise NotFound("Lead Not Found")

        check_lead_ownership(user, lead)

        # ----------------------------------------------------
        # 1. Backend Source of Truth: Check Connected Call History
        # ----------------------------------------------------
        has_connected_call = CallDetails.objects.filter(
            lead=lead,
            connection_status__iexact="Connected"
        ).exists()

        # ----------------------------------------------------
        # 2. Determine / Enforce Follow-up Datetime
        # ----------------------------------------------------
        followup_datetime = parse_ist_datetime(data.get("next_followup"))

        # Fallback / Enforcement if no followup date provided:
        if not followup_datetime:
            if has_connected_call:
                # Connected before -> Unreached rule: Current Date Time + 1 Day
                followup_datetime = now_ist() + timedelta(days=1)
            else:
                # Never connected before -> Dynamic retry interval based on disconnect attempts
                prior_disconnect_count = CallDetails.objects.filter(
                    lead=lead,
                    connection_status__iexact="Disconnected"
                ).count()

                if prior_disconnect_count == 0:
                    delta = timedelta(hours=1)
                elif prior_disconnect_count == 1:
                    delta = timedelta(days=1)
                elif prior_disconnect_count == 2:
                    delta = timedelta(days=3)
                else:
                    delta = timedelta(weeks=3)

                prev_fu = FollowUp.objects.filter(lead=lead).order_by("-id").first()
                base_dt = prev_fu.scheduled_at if (prev_fu and prev_fu.scheduled_at) else now_ist()
                followup_datetime = base_dt + delta

        # Avoid hard collision on the exact minute with other leads for the same telecaller
        if followup_datetime:
            while FollowUp.objects.filter(
                telecaller=user,
                scheduled_at__year=followup_datetime.year,
                scheduled_at__month=followup_datetime.month,
                scheduled_at__day=followup_datetime.day,
                scheduled_at__hour=followup_datetime.hour,
                scheduled_at__minute=followup_datetime.minute,
                is_attended=False
            ).exclude(lead=lead).exists():
                followup_datetime = followup_datetime + timedelta(minutes=5)

        with transaction.atomic():
            current_stage = lead.pipeline_stage_id
            is_won_stage = PipelineStage.objects.filter(
                id=current_stage,
                stage_type="closed_won",
                organization_id=lead.organization_id
            ).exists()

            if not is_won_stage:
                chosen_stage_id = data.get("stage_id") or data.get("pipeline_stage_id")
                chosen_stage = None
                if chosen_stage_id:
                    chosen_stage = PipelineStage.objects.filter(
                        id=chosen_stage_id,
                        organization_id=lead.organization_id
                    ).first()

                if chosen_stage:
                    lead.pipeline_stage = chosen_stage
                    lead.save(update_fields=["pipeline_stage"])
                else:
                    p_cat_id = lead.pipeline_id or getattr(lead.pipeline_stage, "pipeline_category_id", None)
                    target_stage = None
                    if has_connected_call:
                        target_stage = (
                            PipelineStage.objects.filter(
                                organization_id=lead.organization_id,
                                pipeline_category_id=p_cat_id,
                                name__icontains="unreached"
                            ).first()
                            or PipelineStage.objects.filter(
                                organization_id=lead.organization_id,
                                name__icontains="unreached"
                            ).first()
                            or PipelineStage.objects.filter(
                                organization_id=lead.organization_id,
                                pipeline_category_id=p_cat_id,
                                order_no=4,
                                stage_type__in=["open", "in_progress"]
                            ).exclude(name__icontains="loss").first()
                        )
                    else:
                        target_stage = (
                            PipelineStage.objects.filter(
                                organization_id=lead.organization_id,
                                pipeline_category_id=p_cat_id,
                                name__icontains="not connected"
                            ).first()
                            or PipelineStage.objects.filter(
                                organization_id=lead.organization_id,
                                pipeline_category_id=p_cat_id,
                                name__icontains="unconnected"
                            ).first()
                            or PipelineStage.objects.filter(
                                organization_id=lead.organization_id,
                                pipeline_category_id=p_cat_id,
                                order_no=2,
                                stage_type__in=["open", "in_progress"]
                            ).first()
                            or PipelineStage.objects.filter(
                                organization_id=lead.organization_id,
                                name__icontains="not connected"
                            ).first()
                        )

                    if target_stage:
                        lead.pipeline_stage = target_stage
                        lead.save(update_fields=["pipeline_stage"])

            call = CallDetails.objects.create(
                lead=lead,
                telecaller=user,
                stage=lead.pipeline_stage,
                connection_status=data.get("connection_status") or "Disconnected",
                call_direction="Outgoing",
                created_by=str(user),
                organization_id=lead.organization_id
            )
 
            tag_id = data.get("select_tag_id")
            if tag_id:
                try:
                    tag_id = int(tag_id)
                except (ValueError, TypeError):
                    pass
            disconnect_tag = DisconnectStage.objects.filter(id=tag_id).first() if tag_id else None
            is_other = disconnect_tag and disconnect_tag.name.strip().lower() == "other reason"

            DisconnectedDetails.objects.create(
                call=call,
                disconnect_stage_id=tag_id if tag_id else None,
                other_reason=data.get("other_reason") if is_other else None,
                retry_notes=data.get("retry_notes"),
                created_by=str(user),
                organization_id=lead.organization_id
            )

            current_time_ist = now_ist()

            FollowUp.objects.filter(
                lead=lead,
                is_attended=False
            ).update(
                is_attended=True,
                attended_at=current_time_ist,
                attended_via_call=call,
                updated_by=str(user),
                organization_id=lead.organization_id
            )
            mark_attended_followup_notifications_read(lead, user)

            if followup_datetime:
                FollowUp.objects.create(
                    lead=lead,
                    telecaller=user,
                    scheduled_at=followup_datetime,
                    created_from_call=call,
                    created_by=str(user),
                    organization_id=lead.organization_id
                )

        return {
            "status": "success",
            "message": "Call disconnected details saved successfully",
            "data": {
                "call_id": call.id,
                "lead_id": lead.id,
                "next_followup": format_ist_datetime(followup_datetime) if followup_datetime else None,
                "called_at": format_ist_datetime(call.called_at or current_time_ist)
            }
        }

    except (ValidationError, NotFound, PermissionDenied):
        raise
    except Exception as e:
        raise APIException(str(e))


def _notify_new_lead_safely(lead_id, assigned_to_id, assigned_by_id):
    # notification fail aanaalum lead creation success ah irukkanum
    try:
        send_lead_assigned_notification(lead_id, assigned_to_id, assigned_by_id=assigned_by_id)
    except Exception:
        logger.exception("New lead notification failed for lead %s", lead_id)


def add_new_lead(user, **data):
    try:
        stage = (PipelineStage.objects.filter(name__iexact="new lead").first()
                 or PipelineStage.objects.first())
        if not stage:
            raise NotFound("Pipeline Stage 'New Lead' Not Found")

        campaign = CampaignName.objects.filter(id=data.get("campaign_id")).first()
        if not campaign:
            raise NotFound("Campaign Not Found")

        raw_m = str(data.get("mobile") or data.get("mobile_no") or "").strip()
        clean_m = "".join(filter(str.isdigit, raw_m))
        mobile = clean_m[-10:] if len(clean_m) >= 10 else clean_m
        if len(mobile) != 10:
            raise ValidationError("Invalid mobile number. Must be 10 digits.")

        raw_alt = str(data.get("alternative_mobile") or data.get("alt_mobile") or "").strip()
        clean_alt = "".join(filter(str.isdigit, raw_alt))
        alt_m = clean_alt[-10:] if len(clean_alt) >= 10 else ""

        dup_q = Q(mobile_no__endswith=mobile) | Q(alternative_mobile__endswith=mobile)
        if alt_m:
            dup_q |= Q(mobile_no__endswith=alt_m) | Q(alternative_mobile__endswith=alt_m)

        user_org = getattr(user, "organization", None)
        dup_qs = Lead.objects.filter(dup_q).select_related("assigned_to", "campaign")
        if user_org:
            dup_qs = dup_qs.filter(organization=user_org)

        existing = dup_qs.first()
        if existing:
            assigned_user = existing.assigned_to
            assigned_name = f"{getattr(assigned_user, 'first_name', '')} {getattr(assigned_user, 'last_name', '')}".strip() or getattr(assigned_user, 'username', 'Unknown') if assigned_user else "Unassigned"
            campaign_name = existing.campaign.name if getattr(existing, 'campaign', None) else "General"
            raise ValidationError(
                f"Lead with this mobile number already exists in '{campaign_name}' campaign and is assigned to {assigned_name}."
            )

        user_org = getattr(user, "organization", None)
        if not user_org:
            raise ValidationError("Organization not found for this user")

        with transaction.atomic():
            lead = Lead.objects.create(
                full_name=data.get("full_name"),
                mobile_no=mobile,
                alternative_mobile=alt_m if alt_m else None,
                enquiry_date=data.get("enquiry_date"),
                pipeline_id=getattr(stage, "pipeline_category_id", None) or getattr(campaign, "pipeline_category_id", None) or 1,
                campaign_id=campaign.id,
                lead_source_id=data.get("lead_source_id"),
                pipeline_stage_id=stage.id,
                assigned_to_id=user.id,
                priority_id=None,
                created_by=user,
                organization=user_org,
            )

            # assignee vera aala irundha mattum notification (self ku vendaam)
            if lead.assigned_to_id != user.id:
                transaction.on_commit(
                    lambda lid=lead.id, uid=lead.assigned_to_id, by=user.id:
                        _notify_new_lead_safely(lid, uid, by)
                )

        return f"{lead.full_name} New Lead created successfully"

    except APIException:
        raise
    except Exception as e:
        raise APIException(str(e))

    
def fetch_one_loss_detail(user,**data):
    try:
        id=data.get("lead_id")
        lead = Lead.objects.filter(id=data.get("lead_id")).first()
        print(lead)
        if lead is None:
            raise APIException("Lead Not Found")
        
        loss=exec_raw_sql("D_FETCH_ONE_LOSS_LEAD_DATA",{"id":id})
        print(loss)
        
        return loss
    except Exception as e:
        raise APIException(str(e))
    
    
    
def loss_detail_update(user, **data):
    try:
        lead_id = data.get("lead_id")
        lead = Lead.objects.filter(id=lead_id).first()
        if lead is None:
            raise NotFound("Lead Not Found")

        check_lead_ownership(user, lead)

        reason_id = data.get("main_reason_id")
        prev_status = lead.pipeline_stage
        reason = None
        if reason_id:
            reason_qs = LossReason.objects.filter(id=reason_id, is_active=True)
            if lead.organization_id:
                reason_qs = reason_qs.filter(
                    Q(organization_id=lead.organization_id) | Q(organization__isnull=True)
                )
            else:
                reason_qs = reason_qs.filter(organization__isnull=True)
            reason = reason_qs.first()
            if not reason:
                raise ValidationError("Selected loss reason was not found for this organization.")

        with transaction.atomic():
            loss, created = LossLeadDetail.objects.update_or_create(
                lead=lead,
                defaults={
                    "reported_by": user,
                    "follow_up_days": data.get("follow_up_days") or 0,
                    "loss_reason": reason,
                    "main_reason_id": reason.id if reason else None,
                    "detailed_reason": data.get("loss_reason") or data.get("notes") or "",
                    "updated_by": str(user),
                }
            )
            lead.loss_reason = reason
            lead.save(update_fields=["loss_reason", "updated_at"])

            stage_id = data.get("pipeline_stage_id")
            if stage_id:
                lead.pipeline_stage_id = int(stage_id)
            else:
                lead_pipe_id = (
                    getattr(lead, 'pipeline_id', None)
                    or (lead.pipeline_stage.pipeline_category_id if getattr(lead, 'pipeline_stage', None) else None)
                    or (lead.campaign.pipeline_category_id if getattr(lead, 'campaign', None) else None)
                )
                loss_stage = (
                    PipelineStage.objects.filter(pipeline_category_id=lead_pipe_id, stage_type='closed_lost').first()
                    or PipelineStage.objects.filter(pipeline_category_id=lead_pipe_id, name__icontains='loss').first()
                    or PipelineStage.objects.filter(stage_type='closed_lost').first()
                    or PipelineStage.objects.filter(name__icontains='loss').first()
                )
                if loss_stage:
                    lead.pipeline_stage = loss_stage
            if "priority_id" in data and data.get("priority_id") is not None:
                lead.priority_id = data.get("priority_id")
            lead.current_status = "Loss"
            validate_and_sanitize_lead_priority(lead)
            lead.save()

            current_time_ist = now_ist()
            # Mark all open followups as attended
            FollowUp.objects.filter(lead=lead, is_attended=False).update(
                is_attended=True,
                attended_at=current_time_ist,
                updated_by=str(user)
            )
            PaymentFollowUp.objects.filter(payment_info__lead=lead, is_attended=False).update(
                is_attended=True,
                attended_at=current_time_ist,
                followup_status="Completed",
                updated_by=str(user)
            )

            if str(prev_status).lower() != "loss":
                try:
                    send_loss_request_notification(
                        lead.id,
                        user.id,
                        data.get("loss_reason") or data.get("notes") or (reason.name if reason else None),
                        loss.id,
                    )
                except Exception as e:
                    logger.warning("Loss request notification failed: %s", e)

        return {
            "status": "success",
            "message": f"Lead '{lead.full_name}' marked as Lost and request submitted successfully.",
            "data": {
                "lead_id": lead.id,
                "loss_detail_id": loss.id,
                "status": "Loss",
                "updated_at": format_ist_datetime(current_time_ist)
            }
        }
    except (ValidationError, NotFound, PermissionDenied):
        raise
    except Exception as e:
        raise APIException(str(e))


def fetch_one_won_detail(user,**data):
    try:
        id=data.get("lead_id")
        lead = Lead.objects.filter(id=data.get("lead_id")).first()

        if lead is None:
            raise APIException("Lead Not Found")
        print(lead)
        won=exec_raw_sql("D_FETCH_ONE_WON_LEAD_DATA",{"id":id})
        
        print(won)
        return won
    except Exception as e:
        raise APIException(str(e))
    
    
        
def won_detail_update(user, **data):
    try:
        lead_id = data.get("lead_id")
        lead = Lead.objects.select_related("course", "course_plan", "assigned_to").filter(id=lead_id).first()
        if not lead:
            raise NotFound("Lead not found")

        check_lead_ownership(user, lead)

        course = lead.course or (Course.objects.filter(id=lead.course_id).first() if lead.course_id else None)
        if course is None:
            raise ValidationError("Course Not Found for this lead")

        lead.course = course

        # Name-based won stage + type-safe compare
        lead_pipe_id = (
            getattr(lead, 'pipeline_id', None)
            or (lead.pipeline_stage.pipeline_category_id if getattr(lead, 'pipeline_stage', None) else None)
            or (lead.campaign.pipeline_category_id if getattr(lead, 'campaign', None) else None)
        )
        won_stage = (
            PipelineStage.objects.filter(pipeline_category_id=lead_pipe_id, stage_type='closed_won').first()
            or PipelineStage.objects.filter(pipeline_category_id=lead_pipe_id, name__icontains='won').first()
            or PipelineStage.objects.filter(stage_type='closed_won').first()
            or PipelineStage.objects.filter(name__iexact="won").first()
        )
        try:
            requested_stage_id = int(data.get("pipeline_stage_id"))
        except (TypeError, ValueError):
            requested_stage_id = None

        parsed_due_date = parse_ist_date(data.get("due_date"))
        followup_datetime = parse_ist_datetime(data.get("next_followup"))

        if followup_datetime and lead.assigned_to:
            existing_followup = PaymentFollowUp.objects.filter(
                payment_info__lead__assigned_to=lead.assigned_to,
                followup_date__year=followup_datetime.year,
                followup_date__month=followup_datetime.month,
                followup_date__day=followup_datetime.day,
                followup_date__hour=followup_datetime.hour,
                followup_date__minute=followup_datetime.minute,
                followup_status="Pending"
            ).exists()

            if existing_followup:
                raise ValidationError(
                    f"Payment follow-up already exists at {format_ist_datetime(followup_datetime)}"
                )

        paid_amount = round(float(data.get("paid_amount", 0)), 2)
        total_fee = 0.0
        if lead.course and lead.course.course_fees and lead.course.course_fees > 0:
            total_fee = float(lead.course.course_fees)
        elif lead.course_plan and lead.course_plan.fee_amount and lead.course_plan.fee_amount > 0:
            total_fee = float(lead.course_plan.fee_amount)
        elif lead.course_name_id and lead.course_plan_id:
            c_obj = Course.objects.filter(course_name_id=lead.course_name_id, course_plan_id=lead.course_plan_id, course_fees__gt=0).first()
            if c_obj and c_obj.course_fees:
                total_fee = float(c_obj.course_fees)

        with transaction.atomic():
            old_pipeline_stage = lead.pipeline_stage_id
            if (won_stage and old_pipeline_stage != won_stage.id and requested_stage_id == won_stage.id):
                if course.seats_left <= 0:
                    raise ValidationError("No seats available for this course.")
                course.admission_count += 1
                course.updated_by = str(user)
                course.save()

            # Set pipeline stage and status to WON
            if won_stage:
                lead.pipeline_stage = won_stage
                lead.current_status = "Won"
            elif requested_stage_id:
                lead.pipeline_stage_id = requested_stage_id
                lead.current_status = "Won"

            lead.priority_id = data.get("priority_id") or data.get("priority")
            validate_and_sanitize_lead_priority(lead)

            # Payment calculations
            payment_info = PaymentInfo.objects.filter(lead=lead).first()
            already_paid = float(payment_info.amount_paid) if payment_info else 0.0
            new_total_paid = round(already_paid + paid_amount, 2)

            passed_pending = data.get("pending_amount")
            if passed_pending is not None and str(passed_pending).strip() != "":
                pending_amount = max(0.0, round(float(passed_pending), 2))
            else:
                if total_fee > 0 and new_total_paid > total_fee:
                    new_total_paid = total_fee
                pending_amount = max(0.0, round(total_fee - new_total_paid, 2)) if total_fee > 0 else 0.0

            is_full = (pending_amount <= 0)

            incoming_status = data.get("payment_status")
            if is_full:
                status_id = 1
            elif incoming_status in ["Active Due", "Today Due", "Over Due", "Partial"]:
                status_id = 2
            elif incoming_status == "Pending":
                status_id = 3
            else:
                status_id = 1 if is_full else (2 if new_total_paid > 0 else 3)

            if not payment_info:
                payment_info = PaymentInfo.objects.create(
                    lead=lead,
                    amount_paid=new_total_paid,
                    pending_amount=pending_amount,
                    is_full_payment=is_full,
                    payment_status=status_id,
                    summary=data.get("notes"),
                    created_by=str(user),
                )
            else:
                payment_info.amount_paid = new_total_paid
                payment_info.pending_amount = pending_amount
                payment_info.is_full_payment = is_full
                payment_info.payment_status = status_id
                payment_info.summary = data.get("notes", payment_info.summary)
                payment_info.updated_by = str(user)
                payment_info.save()

            payment_history = PaymentHistory.objects.create(
                payment_info=payment_info,
                paid_amount=paid_amount,
                pending_amount=payment_info.pending_amount,
                due_date=parsed_due_date if not is_full else None,
                notes=data.get("notes"),
                created_by=str(user),
            )

            current_time_ist = now_ist()

            # Attend existing normal followups
            FollowUp.objects.filter(lead=lead, is_attended=False).update(
                is_attended=True,
                attended_at=current_time_ist,
                updated_by=str(user)
            )

            if is_full:
                PaymentFollowUp.objects.filter(
                    payment_info__lead=lead,
                    is_attended=False
                ).update(
                    is_attended=True,
                    attended_at=current_time_ist,
                    followup_status="Completed",
                    updated_by=str(user)
                )
            else:
                existing_followup = PaymentFollowUp.objects.filter(
                    payment_info__lead=lead,
                    is_attended=False,
                    followup_status="Pending"
                ).order_by("-created_at").first()

                if existing_followup:
                    existing_followup.is_attended = True
                    existing_followup.attended_at = current_time_ist
                    existing_followup.followup_status = "Completed"
                    existing_followup.updated_by = str(user)
                    existing_followup.save()

                sched_date = followup_datetime or (
                    datetime.combine(parsed_due_date, datetime.min.time().replace(hour=10)).replace(tzinfo=zoneinfo.ZoneInfo('Asia/Kolkata'))
                    if parsed_due_date else None
                )
                if sched_date:
                    PaymentFollowUp.objects.create(
                        payment_info=payment_info,
                        followup_date=sched_date,
                        followup_status="Pending",
                        created_by=str(user),
                    )

            # Preserve status as Won!
            lead.current_status = "Won"
            lead.save()

        try:
            from adm.tasks import trigger_dashboard_update_task
            trigger_dashboard_update_task()
        except Exception:
            pass

        return {
            "status": "success",
            "message": f"Lead '{lead.full_name}' marked as Won successfully.",
            "data": {
                "lead_id": lead.id,
                "amount_paid": payment_info.amount_paid,
                "pending_amount": payment_info.pending_amount,
                "is_full_payment": payment_info.is_full_payment,
                "payment_status": payment_info.payment_status,
                "due_date": str(payment_history.due_date) if payment_history.due_date else None,
                "next_followup": format_ist_datetime(followup_datetime) if followup_datetime else None,
                "updated_at": format_ist_datetime(current_time_ist)
            }
        }

    except (ValidationError, NotFound, PermissionDenied):
        raise
    except Exception as e:
        raise APIException(str(e))