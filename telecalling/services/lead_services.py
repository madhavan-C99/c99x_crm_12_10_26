from ..models import *
from ..models.courses import Course
from ..models.leads import Lead
from ..models.paymentinfo import PaymentInfo,PaymentFollowUp
from rest_framework.exceptions import APIException
from datetime import datetime, timedelta
from django.utils import timezone
from adm.services.query_services import exec_raw_sql
from ..tasks import *
from django.utils.dateparse import parse_datetime
from django.db.models import F, Q,Count
from django.db.models.functions import Coalesce
from  ..tasks.course_task import *
from ..models.leads import PipelineStage, Priority
from ..models.loss_reason import LossReason
from adm.models.pipeline_category import PipelineCategory
from adm.tasks import trigger_dashboard_update_task


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






def _resolve_date_range(date_filter_type, from_date, to_date):
    try:
        ist = zoneinfo.ZoneInfo("Asia/Kolkata")
        today = datetime.now(ist).date()
    except Exception:
        today = datetime.now().date()
 
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
        from_date = today - timedelta(days=365)
        to_date = today
    elif date_filter_type == "custom":
        pass  # keep whatever from_date/to_date the client sent
 
    return today, from_date, to_date
 
 




def _resolve_pipeline(user, pipeline_id):
    user_org = getattr(user, "organization_id", None)
 
    pipeline_id = int(pipeline_id) if pipeline_id and str(pipeline_id).isdigit() and int(pipeline_id) > 0 else 0
 
    if pipeline_id > 0:
        pipeline = PipelineCategory.objects.filter(id=pipeline_id, is_active=True).first()
    else:
        pipe_qs = PipelineCategory.objects.filter(is_active=True)
        if user_org:
            pipe_qs = pipe_qs.filter(Q(organization_id=user_org) | Q(organization__isnull=True))
        pipeline = pipe_qs.filter(is_default=True).first() or pipe_qs.first()
 
    return pipeline


PAYMENT_STATUS_LOOKUP = "payments__status"


def fetch_leads(user, **data):
    try:
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
                "label": stage.display_value or stage.name,
                "order_no": stage.order_no,
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


# def fetch_leads(user,**data):
#     try: 
#         # id=data.get("tele_id")
#         id=user.id
#         lead_filter_type=data.get("lead_filter_type")
#         date_filter_type = data.get("date_filter_type", "year")
#         from_date = data.get("from_date")
#         to_date = data.get("to_date")
        
#         try:
#             import zoneinfo
#             ist = zoneinfo.ZoneInfo('Asia/Kolkata')
#             today = datetime.now(ist).date()
#         except Exception:
#             today = datetime.now().date()

#         # Logic for Daily, Weekly, Monthly, Yesterday
#         if date_filter_type in ["today", "daily"]:
#             from_date = today
#             to_date = today
#         elif date_filter_type == "yesterday":
#             from_date = today - timedelta(days=1)
#             to_date = from_date
#         elif date_filter_type in ["weekly", "week"]:
#             from_date = today - timedelta(days=7)
#             to_date = today
#         elif date_filter_type in ["monthly", "month"]:
#             from_date = today - timedelta(days=30)
#             to_date = today
#         elif date_filter_type in ["year", "yearly"]:
#             from_date = "2026-01-01" 
#             to_date = today
#         elif date_filter_type == "custom":
#             from_date = from_date
#             to_date = to_date

   
#         params = {
#             "id": id,
#             "organization_id": getattr(user, 'organization_id', 0) or 0,
#             "filter_type": str(lead_filter_type) if lead_filter_type else "",
#             "lead_filter_type": str(lead_filter_type) if lead_filter_type else "",
#             "from_date": str(from_date) if from_date else "",
#             "to_date": str(to_date) if to_date else "",
#             "date_filter": str(date_filter_type),
#             "pipeline_id": data.get("pipeline_id") or 0,
#             "pipeline_stage_id": data.get("pipeline_stage_id") or 0,
#             "campaign_name_id": data.get("campaign_name_id") or 0,
#             "campaign_id": data.get("campaign_name_id") or 0,
#             "lead_source_id": data.get("lead_source_id") or 0,
#             "course_name_id": data.get("course_name_id") or 0,
#             "priority_id": data.get("priority_id") or 0,
#             "course_plan_id": data.get("course_plan_id") or 0,
#             "payment_status": data.get("payment_status") or 0,
#             "followup_status": data.get("followup_status") or "",
#         }
#         # params = {
#         #     "id":id,
#         #     "filter_type": f"'{filter_type}'" if filter_type else "NULL" 
#         # }
#         print(params)
#         lead=exec_raw_sql("D_FETCH_ALL_LEADS_DATA",params)
#         count=exec_raw_sql("D_FETCH_ALL_LEAD_LABEL_COUNT",params)
#         # print(count)
#         # print(lead)
#         return lead,count
#     except Exception as e:
#         raise APIException(e)
        
      
def fetch_pipeline_leads(user, **data):
    try:
        filter_type = data.get("date_filter_type", "year")

        from_date = data.get("from_date")
        to_date = data.get("to_date")

        try:
            import zoneinfo
            ist = zoneinfo.ZoneInfo('Asia/Kolkata')
            today = datetime.now(ist).date()
        except Exception:
            today = datetime.now().date()
            
        ref_date = data.get("ref_date", today)

        if filter_type in ["today", "daily"]:
            from_date = today
            to_date = today
        elif filter_type == "yesterday":
            from_date = today - timedelta(days=1)
            to_date = from_date
        elif filter_type in ["weekly", "week"]:
            from_date = today - timedelta(days=7)
            to_date = today
        elif filter_type in ["monthly", "month"]:
            from_date = today - timedelta(days=30)
            to_date = today
        elif filter_type in ["year", "yearly"]:
            from_date = today - timedelta(days=365)
            to_date = today
        elif filter_type == "custom":
            from_date = from_date
            to_date = to_date

        params = {
            "id": user.id,
            "telecaller_id": user.id,
            "from_date": str(from_date),
            "to_date": str(to_date),
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
        print(params)
        lead = exec_raw_sql("D_FETCH_PIPELINE_STATGE_LEADS", params)
        

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
    
    
    
    
    
  
    
    
DROPDOWN_MODEL_MAP = {
    "lead_source": LeadSource,
    "campaign_name": CampaignName,
    "priority": Priority,
    "pipeline_stage": PipelineStage,
    "preferred_timing": PreferredTime,
    "education": Education,
    "course_name": CourseName,
    "course_plan": CoursePlan,
    "course_time": CourseTiming,
    "lead_filter":FilterLeads,
    "payment_stage":PaymentStage,
    "payment_status":PaymentStage,
    "pending_amount":AmountStage,
    "call_stage":PipelineStage,
    "payment_filter":FilterPayment,
    "pipeline_filter":FilterPipeline
}   


DROPDOWN_VALUE_MAP = {
    "course_name": "coursename",
    "course_plan": "courseplan",
    "course_time": "coursetime",
    "lead_source": "name",
    "campaign_name": "name",
    "priority": "name",
    "pipeline_stage": "name",
    "preferred_timing": "name",
    "education": "name",
    "lead_filter":"name",
    "payment_stage":"name",
    "payment_status":"name",
    "pending_amount":"name",
    "call_stage":"name",
    "call_select_tag":"name",
    "payment_filter":"name",
    "pipeline_filter":"name"
}


DROPDOWN_FILTER_MAP = {
    "course_plan": ["courses__name_id"],
    "course_time": ["courses__name_id", "courses__plan_id"],
    # "call_select_tag": ["stages__id"],
    "priority": ["pipeline_stage_id"],
}


def get_selected_option(**data):
    try:
        input_key = data.get("dropdown_category")

        if input_key not in DROPDOWN_MODEL_MAP:
            return []

        model = DROPDOWN_MODEL_MAP[input_key]
        filters = {}

        # is_active field irundha check pannum
        if "is_active" in [f.name for f in model._meta.fields]:
            filters["is_active"] = True

        # ---- multi-field dependent filter ----
        if input_key in DROPDOWN_FILTER_MAP:
            filter_fields = DROPDOWN_FILTER_MAP[input_key]

            if input_key == "course_time":
                name_id = data.get("course_name_id")
                plan_id = data.get("filter_id")

                if name_id not in [None, "", 0, "0"]:
                    filters["courses__name_id"] = name_id
                if plan_id not in [None, "", 0, "0"]:
                    filters["courses__plan_id"] = plan_id

            else:
                filter_id = data.get("filter_id")
                if filter_id not in [None, "", 0, "0"]:
                    filters[filter_fields[0]] = filter_id

        # ✅ Fallback: is_active=True records ethum illana, filter-a remove panni fetch pannum
        if "is_active" in filters and not model.objects.filter(**filters).exists():
            filters.pop("is_active")

        value_field = DROPDOWN_VALUE_MAP.get(input_key, "name")

        if "display_value" in [f.name for f in model._meta.fields]:
            label_expr = Coalesce(F("display_value"), F(value_field))
        else:
            label_expr = F(value_field)

        annotations = {
            "label": label_expr,
            "value": F("id"),
        }

        values_fields = ["label", "value"]

        # ---- course_time ku mattum course_fees um anupanum ----
        if input_key == "course_time":
            annotations["course_fees"] = F("courses__course_fees")
            values_fields.append("course_fees")

        raw_list = list(
            model.objects.filter(**filters)
            .annotate(**annotations)
            .values(*values_fields)
            .order_by("id")
        )

        # ✅ Safe deduplication in Python (PostgreSQL distinct on annotated field issue-a prevent panni)
        seen = set()
        unique_results = []
        for item in raw_list:
            lbl = item.get("label")
            if lbl and lbl not in seen:
                seen.add(lbl)
                unique_results.append(item)

        return unique_results

    except Exception as e:
        print(f"Error in get_selected_option ({data.get('dropdown_category')}): {str(e)}")
        raise APIException(str(e))
    
    
def lead_form_details(user, **data):
    try:
        # ✅ Lead fetch
        lead = Lead.objects.filter(id=data.get("lead_id")).first()
        
        if lead is None:
            raise APIException("Lead Not Found")
        
        print("Received data:", data)

        # >>> CHANGED: fetch Won stage once by name, and parse the incoming
        # pipeline_stage_id safely (handles both int 3 and string "3")
        won_stage = PipelineStage.objects.filter(name__iexact="won").first()
        try:
            requested_stage_id = int(data.get("pipeline_stage_id"))
        except (TypeError, ValueError):
            requested_stage_id = None
        is_moving_to_won = bool(won_stage) and requested_stage_id == won_stage.id
        # <<< CHANGED

        # ✅ Basic Info Update
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

        # ✅ Lead Info Update
        if data.get("enquiry_date"):
            lead.enquiry_date = data.get("enquiry_date")
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
        
        # ✅ Course Management
        course = None
        if data.get("course_name_id") and data.get("course_plan_id") and data.get("course_timing_id"):
            course = Course.objects.filter(
                course_name_id=data.get("course_name_id"),
                course_plan_id=data.get("course_plan_id"),
                course_time_id=data.get("course_timing_id"),
            ).first()
            
            if course is None:
                raise APIException("Course Not Found")
            
            lead.course = course
            print(f"Course assigned: {course}")

            # ✅ Seat Management - Only if moving to Won stage
            # >>> CHANGED: uses won_stage/is_moving_to_won computed above instead of
            # `old_pipeline_stage != 3 and data.get("pipeline_stage_id") == 3`
            # (that missed string "3" sent from frontend)
            old_pipeline_stage = lead.pipeline_stage_id
            if is_moving_to_won and old_pipeline_stage != won_stage.id:
                if course.seats_left <= 0:
                    raise APIException("No seats available")

                course.admission_count += 1
                course.save()
                print(f"Admission Count Updated: {course.admission_count}")
            # <<< CHANGED
        
        # ✅ Pipeline Stage Mapping Rule:
        # If stage is NOT Unreached (5), NOT Won (3), NOT Loss (4):
        # Automatically map to Follow Up (2) so it shows under Follow Up card in Pipeline page!
        if data.get("pipeline_stage_id"):
            st_val = data.get("pipeline_stage_id")
            st_obj = None
            if str(st_val).isdigit():
                st_obj = PipelineStage.objects.filter(id=int(st_val)).first()
            else:
                st_obj = PipelineStage.objects.filter(name__iexact=str(st_val)).first()
            
            st_name = st_obj.name.lower().strip() if st_obj else ""
            if "unreach" in st_name or st_val in [5, "5"]:
                unreach_stage = PipelineStage.objects.filter(name__icontains="unreach").first()
                lead.pipeline_stage = unreach_stage or st_obj
            elif "won" in st_name or st_val in [3, "3"]:
                won_stage = PipelineStage.objects.filter(name__icontains="won").first()
                lead.pipeline_stage = won_stage or st_obj
            elif "loss" in st_name or st_val in [4, "4"]:
                loss_stage = PipelineStage.objects.filter(name__icontains="loss").first()
                lead.pipeline_stage = loss_stage or st_obj
            else:
                followup_stage = PipelineStage.objects.filter(name__icontains="follow").first()
                lead.pipeline_stage = followup_stage or st_obj
        
        if "priority_id" in data:
            p_val = data.get("priority_id")
            if p_val in [None, "", 0, "0", "null", "None"]:
                lead.priority_id = None
            else:
                try:
                    lead.priority_id = int(p_val)
                except (ValueError, TypeError):
                    lead.priority_id = None
        
        # ✅ Save Lead - IMPORTANT: Save before payment processing
        validate_and_sanitize_lead_priority(lead)
        lead.updated_by = str(user)
        lead.save()
        print(f"Lead saved successfully. Pipeline stage: {lead.pipeline_stage_id}")
        
        # ✅ Payment Info Update - Only when pipeline stage is Won
        # CHANGED: was `data.get("pipeline_stage_id") == 3` (missed string "3")
        # if is_moving_to_won:
        #     print("Processing payment for Won stage...")
            
        #     # Validate required fields for payment
        #     if not lead.course:
        #         raise APIException("Course information is required for payment")
            
        #     paid_amount = float(data.get("amount_paid", 0))
        #     total_fee = float(lead.course.course_fees)
        #     print(f"Total Fee: {total_fee}, Paid Amount: {paid_amount}")
            
        #     # ✅ Check existing payment info
        #     payment_info = PaymentInfo.objects.filter(lead=lead).first()
            
        #     # ✅ First payment
        #     if not payment_info:
        #         print("Creating new payment info...")
        #         pending_amount = max(0.0, total_fee - paid_amount)
        #         is_full = (pending_amount <= 0 and total_fee > 0)
                
        #         payment_info = PaymentInfo.objects.create(
        #             lead=lead,
        #             amount_paid=paid_amount,
        #             pending_amount=pending_amount,
        #             is_full_payment=is_full,
        #             payment_status=1 if is_full else 2,
        #             summary=data.get("notes", ""),
        #             created_by=str(user),
        #         )
        #         print(f"Payment info created: {payment_info.id}")
            
        #     # ✅ Update existing payment
        #     else:
        #         print(f"Updating existing payment info: {payment_info.id}")
        #         total_paid = payment_info.amount_paid + paid_amount
        #         new_pending = max(0.0, total_fee - total_paid)
        #         is_full = (new_pending <= 0 and total_fee > 0)
                
        #         payment_info.amount_paid = total_paid
        #         payment_info.pending_amount = new_pending
        #         payment_info.is_full_payment = is_full
        #         payment_info.payment_status = 1 if is_full else 2
        #         payment_info.summary = data.get("notes", payment_info.summary)
        #         payment_info.updated_by = str(user)
        #         payment_info.save()  # ✅ CRITICAL FIX: Save the updated payment info
        #         print(f"Payment info updated. Total paid: {total_paid}, Pending: {new_pending}")
            
        #     # ✅ Payment History Entry
        #     payment_history = PaymentHistory.objects.create(
        #         payment=payment_info,
        #         paid_amount=paid_amount,
        #         pending_amount=data.get("pending_amount", payment_info.pending_amount),
        #         due_stage_id=data.get("payment_status_id"),
        #         due_date=data.get("due_date"),
        #         notes=data.get("notes", ""),
        #         created_by=str(user),
        #     )
        #     print(f"Payment history created: {payment_history.id}")
            
            # ✅ Mark existing followup as attended (Optional - Commented in your code)
            # existing_followup = PaymentFollowUp.objects.filter(
            #     payment__payment__lead=lead,
            #     is_attended=False,
            #     followup_status="Pending"
            # ).order_by("-created_at").first()
            # 
            # if existing_followup:
            #     existing_followup.is_attended = True
            #     existing_followup.attended_at = datetime.now()
            #     existing_followup.followup_status = "Completed"
            #     existing_followup.updated_by = str(user)
            #     existing_followup.save()
            
            # ✅ New followup entry (Optional - Commented in your code)
            # if data.get("next_followup"):
            #     followup_datetime = data.get("next_followup")
            #     if isinstance(followup_datetime, str):
            #         followup_datetime = parse_datetime(followup_datetime)
            #     
            #     PaymentFollowUp.objects.create(
            #         payment=payment_history,
            #         followup_date=followup_datetime,
            #         created_by=str(user),
            #     )
        
        # ✅ Referral Details
        referal_list = data.get("referal_list") or []
        for re in referal_list:
            ReferalDetails.objects.create(
                referal_name=re.get("name", ""),
                referal_number=re.get("number", ""),
                referal_lead=lead,
                created_by=user
            )

        try:
            trigger_dashboard_update_task()
        except Exception as _e:
            print(f"[WS TASK ERROR in lead_form_details] {_e}")

        return {"message": "Lead Updated Successfully"}
    
    except Exception as e:
        print(f"Error in lead_form_details: {str(e)}")
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
    
    
    
def call_connect_api(user,**data):
    try:
        lead = Lead.objects.filter(id=data.get("lead_id")).first()
        
        if lead is None:
            raise APIException("Lead Not Found")
        
                # ==========================================
        # FOLLOWUP SLOT VALIDATION FIRST
        # ==========================================

        if data.get("next_followup"):

            followup_datetime = data.get("next_followup")

            if isinstance(followup_datetime, str):
                dt = parse_datetime(followup_datetime)
                if dt is None:
                    try:
                        dt = datetime.strptime(followup_datetime[:19], "%Y-%m-%dT%H:%M:%S")
                    except (ValueError, TypeError):
                        try:
                            dt = datetime.strptime(followup_datetime[:10], "%Y-%m-%d")
                        except (ValueError, TypeError):
                            dt = None
                followup_datetime = dt

            if not followup_datetime:
                raise APIException("Invalid followup datetime")

            import zoneinfo
            ist = zoneinfo.ZoneInfo('Asia/Kolkata')
            if timezone.is_naive(followup_datetime):
                followup_datetime = timezone.make_aware(followup_datetime, ist)
            else:
                followup_datetime = followup_datetime.astimezone(ist)

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
                raise APIException(
                    "Follow-up already scheduled for this time."
                )

        
        stage_id = data.get("stage_id")
        select_tag_id = data.get("select_tag_id")

        parsed_stage_id = int(stage_id) if stage_id and str(stage_id) not in ['None', '', '0', 'null'] else None
        parsed_tag_id = int(select_tag_id) if select_tag_id and str(select_tag_id) not in ['None', '', '0', 'null'] else None

        if parsed_stage_id:
            stage_obj = PipelineStage.objects.filter(id=parsed_stage_id).first()
            stage_name = stage_obj.name.lower().strip() if stage_obj else ""

            if "unreach" in stage_name or parsed_stage_id == 5:
                unreach_stage = PipelineStage.objects.filter(name__icontains="unreach").first()
                lead.pipeline_stage = unreach_stage or stage_obj
            elif "won" in stage_name or parsed_stage_id == 3:
                won_stage = PipelineStage.objects.filter(name__icontains="won").first()
                lead.pipeline_stage = won_stage or stage_obj
            elif "loss" in stage_name or parsed_stage_id == 4:
                loss_stage = PipelineStage.objects.filter(name__icontains="loss").first()
                lead.pipeline_stage = loss_stage or stage_obj
            else:
                followup_stage = PipelineStage.objects.filter(name__icontains="follow").first()
                lead.pipeline_stage = followup_stage or stage_obj

        lead.priority_id = parsed_tag_id
        validate_and_sanitize_lead_priority(lead)
        lead.save()

        current_stage = lead.pipeline_stage_id
        # CHANGED: won_stage_id fetched by name, reused below instead of hardcoded 3
        won_stage_id = PipelineStage.objects.filter(name__iexact="won").first()
        won_stage_id = won_stage_id.id if won_stage_id else None
        print(data)
    
        conn_stat = data.get("connection_status") or "Connected"
        call_dir = data.get("call_direction") or ("Incoming" if str(conn_stat).strip().lower() == "incoming" else "Outgoing")

        # CallDetails.select_tag stores a stage-linked Priority.
        tag_exists = Priority.objects.filter(
            id=parsed_tag_id,
            pipeline_stage_id=parsed_stage_id
        ).exists()
        select_tag_val = parsed_tag_id if tag_exists else None

        # 🟢 Safe Stage assignment for CallDetails (prevents FK error if stage_id is not in adm_stages):
        stage_exists = PipelineStage.objects.filter(id=parsed_stage_id).exists()
        stage_val = parsed_stage_id if stage_exists else None

        call=CallDetails.objects.create(
                lead=lead,
                telecaller=user,
                connection_status=conn_stat,
                call_direction=call_dir,
                duration_seconds=data.get("call_duration") or 0,
                stage_id=stage_val,
                select_tag_id=select_tag_val,
                conversation_summary=data.get("call_summary"),
                upload_recording=data.get("upload_record"),
                created_by=str(user)    
            )
        print("call",call)
        existing_call =FollowUp.objects.filter(lead=lead,is_attended=False).order_by('-id').first()
        print("existing",existing_call)
        if existing_call:
            existing_call.is_attended=True
            existing_call.attended_at=datetime.now()
            existing_call.attended_via_call=call
            existing_call.updated_by =str(user)  
            existing_call.save()
        
        # ==========================================
        # ✅ MARK EXISTING FOLLOWUP AS ATTENDED
        # ==========================================

        existing_followup = PaymentFollowUp.objects.filter(
            payment__payment__lead=lead,
            is_attended=False,
            followup_status="Pending"
        ).order_by("-created_at").first()

        if existing_followup:
            existing_followup.is_attended = True
            existing_followup.attended_at = datetime.now()
            existing_followup.followup_status = "Completed"
            existing_followup.attended_via_call=call
            existing_followup.updated_by = str(user)
            existing_followup.save()
            
            
        print("exsitng update")
        payment_history = PaymentHistory.objects.filter(payment__lead=lead).first()
        print(payment_history)
        if data.get("next_followup"):

            # CHANGED: current_stage == 3  ->  current_stage == won_stage_id
            if current_stage == won_stage_id and payment_history:

                PaymentFollowUp.objects.create(
                    payment=payment_history,
                    followup_date=followup_datetime,
                    created_from_call=call,
                    created_by=user,
                )

            else:

                FollowUp.objects.create(
                    lead=lead,
                    telecaller=user,
                    scheduled_at=followup_datetime,
                    created_from_call=call,
                    created_by=user,
                )
            
        return "done"
       
    except Exception as e:
        raise APIException(e)
    
    
    
    
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

        lead = Lead.objects.filter(id=data.get("lead_id")).first()

        if lead is None:
            raise APIException("Lead Not Found")

        # ==========================================
        # FOLLOWUP SLOT VALIDATION FIRST
        # ==========================================

        if data.get("next_followup"):

            followup_datetime = data.get("next_followup")

            if isinstance(followup_datetime, str):
                dt = parse_datetime(followup_datetime)
                if dt is None:
                    try:
                        dt = datetime.strptime(followup_datetime[:19], "%Y-%m-%dT%H:%M:%S")
                    except (ValueError, TypeError):
                        try:
                            dt = datetime.strptime(followup_datetime[:10], "%Y-%m-%d")
                        except (ValueError, TypeError):
                            dt = None
                followup_datetime = dt

            if not followup_datetime:
                raise APIException("Invalid followup datetime")

            import zoneinfo
            ist = zoneinfo.ZoneInfo('Asia/Kolkata')
            if timezone.is_naive(followup_datetime):
                followup_datetime = timezone.make_aware(followup_datetime, ist)
            else:
                followup_datetime = followup_datetime.astimezone(ist)

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
                raise APIException(
                    "Follow-up already scheduled for this time."
                )

        # ==========================================
        # BELOW CODE EXECUTES ONLY IF VALIDATION PASS
        # ==========================================
        # >>> CHANGED: name-based stage lookups instead of hardcoded IDs (3 / 5 / 7)
        won_stage = PipelineStage.objects.filter(name__iexact="won").first()
        if won_stage is None:
            raise APIException("Pipeline stage 'won' is not configured")

        current_stage = lead.pipeline_stage_id

        # Only update stage if not Won
        if current_stage != won_stage.id:
            # 🟢 Call Disconnect ஆனாலே நேரடியாக "Call Not Connected" (ID 7) Stage-க்கு மாறும்
            not_connected_stage = PipelineStage.objects.filter(name__icontains="not connected").first()
            if not not_connected_stage:
                not_connected_stage = PipelineStage.objects.filter(id=7).first()

            if not_connected_stage:
                lead.pipeline_stage = not_connected_stage
                lead.save()
        # <<< CHANGED

        call = CallDetails.objects.create(
            lead=lead,
            telecaller=user,
            connection_status="Disconnected",
            created_by=user,
        )
        # >>> CHANGED: name-based disconnect-reason check instead of hardcoded id==7,
        # and call.save() added so other_reason actually persists
        disconnect_tag = DisconnectStage.objects.filter(id=data.get("select_tag_id")).first()
        if disconnect_tag and disconnect_tag.name.strip().lower() == "other reason":
            call.other_reason = data.get("other_reason")
            call.save(update_fields=["other_reason"])
        # <<< CHANGED

        existing_call = FollowUp.objects.filter(
            lead=lead,
            is_attended=False
        ).order_by("-id").first()

        if existing_call:
            existing_call.is_attended = True
            existing_call.attended_at = timezone.now()  # CHANGED: was datetime.now()
            existing_call.attended_via_call = call
            existing_call.updated_by = str(user)
            existing_call.save()

        DisconnectedDetails.objects.create(
            call=call,
            select_tag_id=data.get("select_tag_id"),
            retry_notes=data.get("retry_notes"),
            created_by=str(user),
        )

        # ==========================================
        # ✅ MARK EXISTING FOLLOWUP AS ATTENDED
        # ==========================================

        existing_followup = PaymentFollowUp.objects.filter(
            payment__payment__lead=lead,
            is_attended=False,
            followup_status="Pending"
        ).order_by("-created_at").first()

        if existing_followup:
            existing_followup.is_attended = True
            existing_followup.attended_at = timezone.now()  # CHANGED: was datetime.now()
            existing_followup.followup_status = "Completed"
            existing_followup.attended_via_call = call
            existing_followup.updated_by = str(user)
            existing_followup.save()

        # CHANGED: removed debug print() calls
        payment_history = PaymentHistory.objects.filter(payment__lead=lead).first()
        if data.get("next_followup"):

            # CHANGED: current_stage == 3  ->  current_stage == won_stage.id
            if current_stage == won_stage.id and payment_history:

                PaymentFollowUp.objects.create(
                    payment=payment_history,
                    followup_date=followup_datetime,
                    created_from_call=call,
                    created_by=user,
                )

            else:

                FollowUp.objects.create(
                    lead=lead,
                    telecaller=user,
                    scheduled_at=followup_datetime,
                    created_from_call=call,
                    created_by=user,
                )

        try:
            trigger_dashboard_update_task()
        except Exception as _e:
            print(f"[WS TASK ERROR in call_disconnect_api] {_e}")

        return "done"

    except APIException:
        # CHANGED: don't swallow our own validation errors into a generic message
        raise
    except Exception as e:
        raise APIException(str(e))
    
    
def add_new_lead(user,**data):
    try:
        pipeline = PipelineStage.objects.filter(name__iexact="new lead").first() or PipelineStage.objects.first()
        if not pipeline:
            raise APIException("Pipeline Stage 'New Lead' Not Found")
        
        campaign=CampaignName.objects.filter(id=data.get("campaign_id")).first()
        if campaign is None:
            raise APIException("Campaign Not Found")
        
        number_exists=Lead.objects.filter(mobile_no=data.get("mobile")).first()
        print(number_exists)
        if number_exists:
            raise APIException(
               f"{data.get("mobile")} already exists. Assigned to {number_exists.assigned_to}"
            )
        
        user_org = getattr(user, 'organization', None)
        if not user_org:
            from adm.models import Organization
            user_org = Organization.objects.first()

        lead=Lead.objects.create(
            full_name=data.get("full_name"),
            mobile_no=data.get("mobile"),
            enquiry_date=data.get("enquiry_date"),
            campaign_id=campaign.id,
            lead_source_id=data.get("lead_source_id"),
            pipeline_stage_id=pipeline.id,
            assigned_to_id=user.id,
            priority_id=None,
            created_by=user,
            organization=user_org
        )
        send_lead_assigned_notification(lead.id, lead.assigned_to_id,assigned_by_id=None)

        try:
            trigger_dashboard_update_task()
        except Exception as _e:
            print(f"[WS TASK ERROR in add_new_lead] {_e}")

        return f"{lead.full_name} New Lead created successfully"
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
    
    
def loss_detail_update(user,**data):
    try:
        lead = Lead.objects.filter(id=data.get("lead_id")).first()

        if lead is None:
            raise APIException("Lead Not Found")
        reason_id = data.get("main_reason_id")
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
                raise APIException("Selected loss reason was not found for this organization.")

        print(lead)
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
        
        stage_id = data.get("pipeline_stage_id") or 4
        lead.pipeline_stage_id = int(stage_id)
        if "priority_id" in data and data.get("priority_id") is not None:
            lead.priority_id = data.get("priority_id")
        lead.current_status = "Loss"
        validate_and_sanitize_lead_priority(lead)
        lead.save()

        try:
            trigger_dashboard_update_task()
        except Exception as _e:
            print(f"[WS TASK ERROR in loss_detail_update] {_e}")

        return f"{loss.lead} this lead is {loss.follow_up_days} days followup you will add loss lead "
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
        lead = Lead.objects.filter(id=lead_id).first()
        if not lead:
            raise APIException("Lead not found")

        course = lead.course or (Course.objects.filter(id=lead.course_id).first() if lead.course_id else None)
        if course is None:
            raise APIException("Course Not Found for this lead")

        lead.course = course

        # >>> CHANGED: name-based won stage + type-safe compare
        # (was `old_pipeline_stage != 3 and data.get("pipeline_stage_id") == 3`
        #  which missed string "3" sent from frontend)
        won_stage = PipelineStage.objects.filter(name__iexact="won").first()
        try:
            requested_stage_id = int(data.get("pipeline_stage_id"))
        except (TypeError, ValueError):
            requested_stage_id = None

        old_pipeline_stage = lead.pipeline_stage_id
        if (won_stage and old_pipeline_stage != won_stage.id
                and requested_stage_id == won_stage.id):

            if course.seats_left <= 0:
                raise APIException("No seats available")

            course.admission_count += 1
            course.updated_by=str(user)

            course.save()

        # CHANGED: use validated int instead of raw unchecked input
        lead.pipeline_stage_id = requested_stage_id if requested_stage_id is not None else data.get("pipeline_stage_id")
        lead.priority_id=data.get("priority")
        validate_and_sanitize_lead_priority(lead)

        if data.get("next_followup"):

            followup_datetime = data.get("next_followup")

            if isinstance(followup_datetime, str):
                followup_datetime = parse_datetime(followup_datetime)

                print("date",followup_datetime)
            existing_followup = PaymentFollowUp.objects.filter(
                payment__payment__lead__assigned_to=lead.assigned_to,
                followup_date__year=followup_datetime.year,
                followup_date__month=followup_datetime.month,
                followup_date__day=followup_datetime.day,
                followup_date__hour=followup_datetime.hour,
                followup_date__minute=followup_datetime.minute,
                followup_status="Pending"
            ).exists()

            print("exitfolow",existing_followup)
            if existing_followup:
                raise APIException(
                    f"Follow-up already exists at {followup_datetime.strftime('%d-%m-%Y %H:%M')}"
                )       

        paid_amount = float(data.get("paid_amount", 0))
        total_fee = 0.0
        if lead.course and lead.course.course_fees and lead.course.course_fees > 0:
            total_fee = float(lead.course.course_fees)
        elif lead.course_plan and lead.course_plan.fee_amount and lead.course_plan.fee_amount > 0:
            total_fee = float(lead.course_plan.fee_amount)
        elif lead.course_name_id and lead.course_plan_id:
            c_obj = Course.objects.filter(course_name_id=lead.course_name_id, course_plan_id=lead.course_plan_id, course_fees__gt=0).first()
            if c_obj and c_obj.course_fees:
                total_fee = float(c_obj.course_fees)

        # ==========================================
        # CHECK EXISTING PAYMENT INFO
        # ==========================================

        payment_info = PaymentInfo.objects.filter(
            lead=lead
        ).first()

        # 🟢 சரியான கட்டணக் கணக்கீடு:
        if payment_info:
            total_paid = payment_info.amount_paid + paid_amount
        else:
            total_paid = paid_amount

        if total_paid >= total_fee:
            total_paid = total_fee
            pending_amount = 0.0
        else:
            pending_amount = max(0.0, total_fee - total_paid)
        is_full = (pending_amount <= 0)

        # ==========================================
        # FIRST PAYMENT
        # ==========================================

        if not payment_info:
            print("Pending Amount:", pending_amount)
            payment_info = PaymentInfo.objects.create(
                lead=lead,
                amount_paid=total_paid,
                pending_amount=pending_amount,
                is_full_payment=is_full,
                payment_status=1 if is_full else 2,
                summary=data.get("notes"),
                created_by=str(user),
            )

        # ==========================================
        # UPDATE EXISTING PAYMENT
        # ==========================================

        else:
            print("Pending Amount:", pending_amount)
            payment_info.amount_paid = total_paid
            payment_info.pending_amount = pending_amount
            payment_info.is_full_payment = is_full
            payment_info.payment_status = 1 if is_full else 2
            payment_info.summary = data.get("notes", payment_info.summary)
            payment_info.updated_by = str(user)

            payment_info.save()

        # ==========================================
        # PAYMENT HISTORY ENTRY
        # ==========================================

        payment_history = PaymentHistory.objects.create(
            payment=payment_info,
            paid_amount=paid_amount,
            pending_amount=payment_info.pending_amount,
            due_date=data.get("due_date"),
            notes=data.get("notes"),
            created_by=str(user),
        )
        print("Payment History:", payment_history)

        # ==========================================
        # FOLLOWUP UPDATE & ENTRY
        # ==========================================

        if payment_info.pending_amount == 0 or payment_info.is_full_payment:
            PaymentFollowUp.objects.filter(
                payment__payment__lead=lead,
                is_attended=False
            ).update(
                is_attended=True,
                attended_at=datetime.now(),
                followup_status="Completed",
                updated_by=str(user)
            )
        else:
            existing_followup = PaymentFollowUp.objects.filter(
                payment__payment__lead=lead,
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
                    payment=payment_history,
                    followup_date=data.get("next_followup"),
                    created_by=str(user),
                )
                lead.current_status="Follow Up"
            
        lead.save()

        try:
            trigger_dashboard_update_task()
        except Exception as _e:
            print(f"[WS TASK ERROR in won_detail_update] {_e}")

        return "Payment Updated Successfully"

    except Exception as e:
        raise APIException(str(e))