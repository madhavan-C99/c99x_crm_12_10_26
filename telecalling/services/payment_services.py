from ..models import Course, CoursePlan
from ..models.leads import Lead
from ..models.paymentinfo import PaymentFollowUp,PaymentInfo,PaymentHistory 
from rest_framework.exceptions import APIException
from datetime import datetime, timedelta,timezone
from adm.services.query_services import exec_raw_sql
from django.db import transaction
from decimal import Decimal

def fetch_all_payment(user,**data):
    try:
        id=user.id
        
        
        date_filter_type = data.get("date_filter_type", "year")
        from_date = data.get("from_date")
        to_date = data.get("to_date")
        
        today = datetime.now().date()

        # Logic for Daily, Weekly, Monthly, Yesterday
        if date_filter_type == "today":
            from_date = today
            to_date = today
        elif date_filter_type == "yesterday":
            from_date = today - timedelta(days=1)
            to_date = from_date
        elif date_filter_type == "weekly":
            from_date = today - timedelta(days=7)
            to_date = today
        elif date_filter_type == "monthly":
            from_date = today - timedelta(days=30)
            to_date = today
        elif date_filter_type == "year":
            from_date = "2026-01-01" 
            to_date = today
        elif date_filter_type=="custom":
            from_date=from_date
            to_date=to_date

   
        params = {
            "id": id,
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
        print(params)
        pay=exec_raw_sql("D_FETCH_ALL_PENDING_PAYMENTS",params)

        return pay
        
    except Exception as e:
        raise APIException(e)
  
  
 
 
def pending_payment_tile(user,**data):
    try:
        id=user.id
        tile=exec_raw_sql("D_FETCH_PAYMENT_TILES",{"id":id, "pipeline_id": data.get("pipeline_id") or 0})
        return tile   
    
    except Exception as e:
        raise APIException(e)
  
  
    
    
@transaction.atomic
def payment_details(user, **data):
    try:

        lead = Lead.objects.filter(id=data.get("lead_id")).first()

        if not lead:
            raise APIException("Lead not found")

        paid_amount = round(float(data.get("paid_amount") or 0), 2)

        if paid_amount <= 0:
            raise APIException("Paid amount must be greater than 0")

        # ==========================================
        # TOTAL FEE (same order as PaymentInfo.save())
        # ==========================================

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
            raise APIException("Course fee is not configured for this lead.")

        # ==========================================
        # CHECK EXISTING PAYMENT INFO
        # ==========================================

        payment_info = PaymentInfo.objects.filter(lead=lead).first()

        already_paid = float(payment_info.amount_paid) if payment_info else 0.0

        if round(already_paid + paid_amount, 2) > total_fee:
            raise APIException("Paid amount is more than the pending amount")

        # ==========================================
        # FIRST PAYMENT / UPDATE EXISTING
        # ==========================================

        if not payment_info:
            payment_info = PaymentInfo.objects.create(
                lead=lead,
                amount_paid=paid_amount,
                summary=data.get("notes"),
                created_by=str(user),
            )
        else:
            payment_info.amount_paid = round(already_paid + paid_amount, 2)
            payment_info.summary = data.get("notes")
            payment_info.updated_by = str(user)
            payment_info.save()

        # ==========================================
        # PAYMENT HISTORY ENTRY
        # ==========================================

        payment_history = PaymentHistory.objects.create(
            payment_info=payment_info,
            paid_amount=paid_amount,
            pending_amount=payment_info.pending_amount,
            due_stage_id=data.get("payment_status_id"),
            due_date=data.get("due_date"),
            notes=data.get("notes"),
            created_by=str(user),
        )

        # ==========================================
        # MARK EXISTING FOLLOWUP AS ATTENDED / COMPLETED
        # ==========================================

        if payment_info.is_full_payment:
            PaymentFollowUp.objects.filter(
                payment_info__lead=lead,
                is_attended=False
            ).update(
                is_attended=True,
                attended_at=datetime.now(),
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
                existing_followup.attended_at = datetime.now()
                existing_followup.followup_status = "Completed"
                existing_followup.updated_by = str(user)
                existing_followup.save()

            if data.get("next_followup"):
                PaymentFollowUp.objects.create(
                    payment_info=payment_info,
                    followup_date=data.get("next_followup"),
                    created_by=str(user),
                )

        return "Payment Updated Successfully"

    except APIException:
        raise
    except Exception as e:
        raise APIException(str(e))
    
    
    
    
def payment_history(user,**data):
    try:
        id=data.get("lead_id")
        lead = Lead.objects.filter(id=data.get("lead_id")).first()

        if not lead:
            raise APIException("Lead not found")
        print(lead)
        history=exec_raw_sql("D_FETCH_ONE_LEAD_PAYMENT_HISTORY",{"id":id})
        print(history)
        return history
        
    except Exception as e:
        raise APIException(e)
    
    

