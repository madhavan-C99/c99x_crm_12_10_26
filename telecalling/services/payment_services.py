import zoneinfo
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import APIException, PermissionDenied, ValidationError,NotFound

from ..models import Course, CoursePlan
from ..models.leads import Lead
from ..models.paymentinfo import PaymentFollowUp, PaymentInfo, PaymentHistory 
from adm.services.query_services import exec_raw_sql

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
            from django.utils.dateparse import parse_datetime
            parsed = parse_datetime(dt_clean)
            if parsed:
                if timezone.is_naive(parsed):
                    return timezone.make_aware(parsed, IST)
                return parsed.astimezone(IST)
        except Exception:
            pass
    return None


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


def fetch_all_payment(user, **data):
    try:
        user_id = user.id
        date_filter_type = data.get("date_filter_type", "year")
        from_date = data.get("from_date")
        to_date = data.get("to_date")

        today = now_ist().date()

        if date_filter_type in ["today", "daily"]:
            from_date = today
            to_date = today
        elif date_filter_type == "yesterday":
            from_date = today - timedelta(days=1)
            to_date = from_date
        elif date_filter_type in ["weekly", "week"]:
            from_date = today - timedelta(days=7)
            to_date = today
        elif date_filter_type in ["monthly", "month"]:
            from_date = today - timedelta(days=30)
            to_date = today
        elif date_filter_type in ["year", "yearly"]:
            from_date = f"{today.year}-01-01" 
            to_date = today
        elif date_filter_type == "custom":
            from_date = from_date
            to_date = to_date

        params = {
            "id": user_id,
            "organization_id": getattr(user, 'organization_id', 0) or 0,
            "from_date": str(from_date) if from_date else "",
            "to_date": str(to_date) if to_date else "",
            "filter_type": str(date_filter_type) if date_filter_type else "",
            "pipeline_id": data.get("pipeline_id") or 0,
            "amount_stage_id": data.get("pending_amount_id") or 0,
            "course_name_id": data.get("course_name_id") or 0,
            "course_time_id": data.get("course_time_id") or 0,
            "course_plan_id": data.get("course_plan_id") or 0,
            "payment_stage": data.get("payment_stage_id") or 0
        }
        pay = exec_raw_sql("D_FETCH_ALL_PENDING_PAYMENTS", params)
        return pay

    except Exception as e:
        raise APIException(str(e))


def pending_payment_tile(user, **data):
    try:
        user_id = user.id
        params = {
            "id": user_id,
            "organization_id": getattr(user, 'organization_id', 0) or 0,
            "pipeline_id": data.get("pipeline_id") or 0
        }
        tile = exec_raw_sql("D_FETCH_PAYMENT_TILES", params)
        return tile

    except Exception as e:
        raise APIException(str(e))


def payment_details(user, **data):
    try:
        lead_id = data.get("lead_id")
        if not lead_id:
            raise ValidationError("lead_id is required.")

        lead = Lead.objects.select_related("course", "course_plan", "assigned_to").filter(id=lead_id).first()
        if not lead:
            raise NotFound("Lead not found.")

        # Guard: Validate Lead Ownership
        check_lead_ownership(user, lead)

        paid_amount = round(float(data.get("paid_amount") or 0), 2)
        if paid_amount <= 0:
            raise ValidationError("Paid amount must be greater than 0.")

        # 1. TOTAL FEE CALCULATION
        total_fee = 0.0
        if getattr(lead, 'course_plan', None) and getattr(lead.course_plan, 'fee_amount', None):
            total_fee = float(lead.course_plan.fee_amount)
        elif getattr(lead, 'course', None) and getattr(lead.course, 'course_fees', None):
            total_fee = float(lead.course.course_fees)
        elif lead.course_name_id and lead.course_plan_id:
            c_plan = CoursePlan.objects.filter(id=lead.course_plan_id).first()
            if c_plan and c_plan.fee_amount:
                total_fee = float(c_plan.fee_amount)
            else:
                c_obj = Course.objects.filter(
                    course_name_id=lead.course_name_id,
                    course_plan_id=lead.course_plan_id
                ).first()
                if c_obj and c_obj.course_fees:
                    total_fee = float(c_obj.course_fees)

        if total_fee <= 0:
            raise ValidationError("Course fee is not configured for this lead. Please configure the course fee first.")

        # 2. ATOMIC TRANSACTION FOR ACCURATE DB SAVES
        with transaction.atomic():
            payment_info = PaymentInfo.objects.filter(lead=lead).first()
            already_paid = float(payment_info.amount_paid) if payment_info else 0.0
            new_total_paid = round(already_paid + paid_amount, 2)

            if new_total_paid > total_fee:
                raise ValidationError(f"Paid amount exceeds pending fee. Maximum payable amount is {round(total_fee - already_paid, 2)}.")

            pending_amount = max(0.0, round(total_fee - new_total_paid, 2))
            is_full = (pending_amount <= 0)

            # IST Dates
            parsed_due_date = parse_ist_date(data.get("due_date")) if (not is_full and data.get("due_date")) else None
            parsed_next_followup = parse_ist_datetime(data.get("next_followup")) if (not is_full and data.get("next_followup")) else None

            # First payment or update existing
            if not payment_info:
                payment_info = PaymentInfo.objects.create(
                    lead=lead,
                    amount_paid=new_total_paid,
                    pending_amount=pending_amount,
                    is_full_payment=is_full,
                    payment_status=1 if is_full else 2,
                    summary=data.get("notes") or "",
                    created_by=str(user),
                )
            else:
                payment_info.amount_paid = new_total_paid
                payment_info.pending_amount = pending_amount
                payment_info.is_full_payment = is_full
                payment_info.payment_status = 1 if is_full else 2
                payment_info.summary = data.get("notes") or payment_info.summary
                payment_info.updated_by = str(user)
                payment_info.save()

            # Payment History
            payment_history = PaymentHistory.objects.create(
                payment_info=payment_info,
                paid_amount=paid_amount,
                pending_amount=pending_amount,
                due_stage_id=data.get("payment_status_id"),
                due_date=parsed_due_date,
                notes=data.get("notes") or "",
                created_by=str(user),
            )

            current_now_ist = now_ist()

            # Attend existing pending payment followups
            PaymentFollowUp.objects.filter(
                payment_info__lead=lead,
                is_attended=False
            ).update(
                is_attended=True,
                attended_at=current_now_ist,
                followup_status="Completed",
                updated_by=str(user)
            )

            # If partial payment, schedule next payment followup in IST
            new_followup = None
            if not is_full and parsed_next_followup:
                new_followup = PaymentFollowUp.objects.create(
                    payment_info=payment_info,
                    followup_date=parsed_next_followup,
                    followup_status="Pending",
                    created_by=str(user),
                )

        # Trigger dashboard live metrics update
        try:
            from adm.tasks import trigger_dashboard_update_task
            trigger_dashboard_update_task()
        except Exception:
            pass

        return {
            "status": "success",
            "message": "Payment updated successfully",
            "data": {
                "payment_id": payment_info.id,
                "lead_id": lead.id,
                "amount_paid": payment_info.amount_paid,
                "pending_amount": payment_info.pending_amount,
                "is_full_payment": payment_info.is_full_payment,
                "payment_status": payment_info.payment_status,
                "due_date": str(parsed_due_date) if parsed_due_date else None,
                "next_followup": format_ist_datetime(new_followup.followup_date) if new_followup else None,
                "updated_at": format_ist_datetime(current_now_ist)
            }
        }

    except (ValidationError, NotFound, PermissionDenied):
        raise
    except Exception as e:
        raise APIException(str(e))


def payment_history(user, **data):
    try:
        lead_id = data.get("lead_id")
        lead = Lead.objects.filter(id=lead_id).first()
        if not lead:
            raise NotFound("Lead not found.")

        check_lead_ownership(user, lead)
        history = exec_raw_sql("D_FETCH_ONE_LEAD_PAYMENT_HISTORY", {"id": lead_id})
        return history

    except (NotFound, PermissionDenied):
        raise
    except Exception as e:
        raise APIException(str(e))
