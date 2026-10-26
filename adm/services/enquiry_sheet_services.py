from django.db.models import Count, Q
from django.utils import timezone
from datetime import date, datetime, timedelta
from rest_framework.exceptions import APIException, ValidationError

from adm.models import campaign_assigned_agent, PipelineCategory
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
def fetch_campaign_enquiry_sheet(user, pipeline_id, campaign_id, campaign_name=None, **kwargs):
    try:
        # 1. Pipeline-Campaign validation check
        camp_obj = CampaignName.objects.filter(
            id=campaign_id, 
            pipeline_category_id=pipeline_id
        ).first()

        if not camp_obj:
            raise ValidationError(
                f"Campaign ID {campaign_id} does not belong to Pipeline ID {pipeline_id}."
            )

        # 2. Get active stages of the selected pipeline in order
        pipeline_stages = list(
            PipelineStage.objects.filter(
                pipeline_category_id=pipeline_id, 
                is_active=True
            ).order_by('order_no')
        )

        # 3. Campaign Leads
        campaign_leads = Lead.objects.filter(campaign_id=campaign_id)
        total_leads = campaign_leads.count()

        # Stage Counts for Cards
        stage_counts = dict(
            campaign_leads.values_list('pipeline_stage_id').annotate(cnt=Count('id'))
        )

        stats = [
            {
                "label": "Total Leads",
                "value": total_leads,
                "color": "#ffffff"
            }
        ]
        for stg in pipeline_stages:
            stats.append({
                "label": stg.name,
                "value": stage_counts.get(stg.id, 0),
                "color": stg.stage_color or "#ffffff"
            })

        # 4. Telecallers Calculation (Only active agents for this campaign)
        assigned_agent_ids = list(
            campaign_assigned_agent.objects.filter(
                campaign_id=campaign_id, 
                is_active=True
            ).values_list('agent_user_id', flat=True)
        )
        lead_agent_ids = list(
            campaign_leads.filter(assigned_to__isnull=False)
            .values_list('assigned_to_id', flat=True)
            .distinct()
        )
        all_agent_ids = list(dict.fromkeys(assigned_agent_ids + lead_agent_ids))

        telecallers = []
        for uid in all_agent_ids:
            user_obj = User.objects.filter(id=uid, is_active=True).first()
            if not user_obj:
                continue

            agent_leads = campaign_leads.filter(assigned_to_id=uid)
            agent_stage_counts = dict(
                agent_leads.values_list('pipeline_stage_id').annotate(cnt=Count('id'))
            )

            # Stage counts as key-value pairs {"Stage Name": count}
            values = {
                stg.name: agent_stage_counts.get(stg.id, 0)
                for stg in pipeline_stages
            }

            # Only skip if the user is NOT actively assigned to this campaign AND has 0 leads
            if uid not in assigned_agent_ids and sum(values.values()) == 0:
                continue

            name = (f"{user_obj.first_name} {user_obj.last_name}".strip()) or user_obj.username
            telecallers.append({
                "agent": name,
                "values": values
            })

        # Sort telecallers by highest leads count
        telecallers.sort(key=lambda x: sum(x['values'].values()), reverse=True)

        return {
            "campaign_id": camp_obj.id,
            "campaign_name": camp_obj.name,
            "is_active": camp_obj.is_active,
            "stats": stats,
            "telecallers": telecallers
        }

    except ValidationError:
        raise
    except Exception as e:
        raise APIException(str(e))


# 2. LEAD SUMMARY REPORT TABLE SERVICE (RAW SQL CollectionQuery + ORM Commented Backup)
def fetch_lead_summary_report(user, campaign_id=None, campaign_name=None, search=None, pipeline_id=None, **kwargs):
    try:
        # 1. Resolve & Validate pipeline_id safely
        raw_p_id = pipeline_id or kwargs.get("pipeline_id") or kwargs.get("pipeline_category_id")
        try:
            p_id = int(raw_p_id) if raw_p_id is not None and str(raw_p_id).strip() not in ["", "null", "None", "0"] else 0
        except (ValueError, TypeError):
            p_id = 0

        pipe_obj = None
        if p_id > 0:
            pipe_obj = PipelineCategory.objects.filter(id=p_id).first()
            if not pipe_obj:
                raise ValidationError(f"Pipeline with ID {p_id} not found.")

        # 2. Resolve & Validate campaign_id safely
        raw_c_id = campaign_id or kwargs.get("campaign_id")
        try:
            c_id = int(raw_c_id) if raw_c_id is not None and str(raw_c_id).strip() not in ["", "null", "None", "0"] else 0
        except (ValueError, TypeError):
            c_id = 0

        c_name = str(campaign_name or kwargs.get("campaign_name") or "").strip()
        if c_name in ["All Leads", "Enquiry Sheet", "null", "None", "All"]:
            c_name = ""

        camp_obj = None
        if c_id > 0:
            camp_obj = CampaignName.objects.filter(id=c_id).first()
            if not camp_obj:
                raise ValidationError(f"Campaign with ID {c_id} not found.")
            c_name = camp_obj.name
        elif c_name:
            camp_obj = CampaignName.objects.filter(name__iexact=c_name).first()
            if camp_obj:
                c_id = camp_obj.id

        # 3. 🚨 MISMATCH VALIDATION: Pipeline and Campaign must match!
        if p_id > 0 and camp_obj:
            camp_pipe_id = camp_obj.pipeline_category_id or 1
            if camp_pipe_id != p_id:
                p_display = pipe_obj.display_name or pipe_obj.category_name if pipe_obj else f"ID {p_id}"
                raise ValidationError(
                    f"Campaign '{camp_obj.name}' (ID {camp_obj.id}) does not belong to Pipeline '{p_display}' (ID {p_id})."
                )

        # Clear c_name if no campaign was selected so query doesn't restrict by campaign
        if c_id == 0:
            c_name = ""

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
        elif d_str in ["last_7_days", "last 7 days", "weekly", "week", "7"]:
            from_date = today - timedelta(days=7)
            to_date = today
        elif d_str in ["this_month", "this month", "monthly", "month"]:
            from_date = today.replace(day=1)
            to_date = today
        elif d_str in ["last_30_days", "last 30 days", "30 days", "30"]:
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
            "pipeline_id": p_id,
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

        pipeline_title = (pipe_obj.display_name or pipe_obj.category_name) if pipe_obj else ""
        report_title = c_name if c_name else (pipeline_title if pipeline_title else "All Leads")

        return {
            "pipeline_id": p_id,
            "pipeline_name": pipeline_title,
            "campaign_id": c_id,
            "campaign_name": report_title,
            "total_records": total_records,
            "total_count": total_records,
            "page": page,
            "page_size": page_size,
            "rows": paged_rows
        }
    except ValidationError:
        raise
    except Exception as e:
        raise APIException(str(e))


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
                target_camp_id = lead.campaign_id
                if target_camp_id and campaign_assigned_agent.objects.filter(campaign_id=target_camp_id, is_active=True).exists():
                    is_valid = campaign_assigned_agent.objects.filter(campaign_id=target_camp_id, agent_user=user_obj, is_active=True).exists()
                    if is_valid:
                        lead.assigned_to = user_obj
                    else:
                        camp_name = getattr(lead.campaign, 'name', '') or f"Campaign #{target_camp_id}"
                        target_name = (f"{user_obj.first_name or ''} {user_obj.last_name or ''}".strip()) or user_obj.username
                        return {
                            "status": "error",
                            "message": f"Cannot assign lead to '{target_name}'. This agent is not assigned to the '{camp_name}' campaign."
                        }
                else:
                    lead.assigned_to = user_obj

        # Flexible Campaign matching (Only associate if existing campaign found; avoid creating orphaned campaigns)
        campaign_name = payload.get('campaign') or payload.get('campaign_name')
        if campaign_name and str(campaign_name).strip():
            camp_name_clean = str(campaign_name).strip()
            camp_qs = CampaignName.objects.filter(name__iexact=camp_name_clean)
            if hasattr(lead, 'organization') and lead.organization:
                camp_qs = camp_qs.filter(organization=lead.organization)
            camp_obj = camp_qs.first()
            if camp_obj:
                lead.campaign = camp_obj

        # Flexible Pipeline Stage matching scoped to Lead's Pipeline Category
        stage_name = payload.get('stage') or payload.get('lead_stage')
        if stage_name and str(stage_name).strip():
            st_clean = str(stage_name).strip()
            p_cat_id = lead.pipeline_id or getattr(lead.pipeline_stage, 'pipeline_category_id', None) or getattr(lead.campaign, 'pipeline_category_id', None)
            stages_qs = PipelineStage.objects.filter(is_active=True)
            if p_cat_id:
                stages_qs = stages_qs.filter(pipeline_category_id=p_cat_id)

            stage_obj = stages_qs.filter(name__iexact=st_clean).first()
            if not stage_obj:
                target_norm = st_clean.lower().replace('-', ' ').replace('_', ' ')
                for ps in stages_qs:
                    ps_norm = ps.name.lower().replace('-', ' ').replace('_', ' ')
                    if ps_norm == target_norm:
                        stage_obj = ps
                        break
            if stage_obj:
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
            if cn_obj:
                lead.course_name = cn_obj

        if plan_name_val and str(plan_name_val).strip():
            cp_clean = str(plan_name_val).strip()
            cp_qs = CoursePlan.objects.filter(Q(course_plan__iexact=cp_clean) | Q(course_plan__icontains=cp_clean))
            if lead.course_name_id:
                cp_qs = cp_qs.filter(course_name_id=lead.course_name_id)
            cp_obj = cp_qs.first()
            if cp_obj:
                lead.course_plan = cp_obj

        if deal_amount_val is not None and str(deal_amount_val).strip() != "":
            import re
            clean_digits = re.sub(r"[^\d.]", "", str(deal_amount_val).strip())
            try:
                deal_amount_float = round(float(clean_digits), 2) if clean_digits else 0.0
            except (ValueError, TypeError):
                deal_amount_float = 0.0

            if deal_amount_float > 0:
                from telecalling.models.paymentinfo import PaymentInfo
                p_info = PaymentInfo.objects.filter(lead=lead).first()
                if p_info:
                    p_info.amount_paid = deal_amount_float
                    p_info.pending_amount = max(0.0, p_info.pending_amount)
                    p_info.save()
                else:
                    PaymentInfo.objects.create(
                        lead=lead,
                        amount_paid=deal_amount_float,
                        pending_amount=0.0,
                        is_full_payment=True,
                        payment_status=1,
                        created_by="Admin (Enquiry Sheet)"
                    )

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
def move_lead_campaign(lead_ids, target_campaign, note=None, user=None):
    try:
        if not lead_ids or not isinstance(lead_ids, list):
            return {"status": "error", "message": "No leads selected"}

        if not target_campaign or not str(target_campaign).strip():
            return {"status": "error", "message": "Target campaign is required"}

        camp_name_clean = str(target_campaign).strip()
        camp_qs = CampaignName.objects.all()
        if user and getattr(user, 'organization', None):
            camp_qs = camp_qs.filter(organization=user.organization)

        camp_obj = None
        if camp_name_clean.isdigit():
            camp_obj = camp_qs.filter(id=int(camp_name_clean)).first()
        if not camp_obj:
            camp_obj = camp_qs.filter(name__iexact=camp_name_clean).first()
        if not camp_obj:
            camp_obj = CampaignName.objects.create(
                name=camp_name_clean,
                organization=getattr(user, 'organization', None),
                is_active=True
            )

        leads_qs = Lead.objects.filter(id__in=lead_ids)
        if user and getattr(user, 'organization', None):
            leads_qs = leads_qs.filter(organization=user.organization)

        updated_count = leads_qs.update(campaign=camp_obj)

        return {
            "status": "success",
            "message": f"Successfully moved {updated_count} leads to campaign '{camp_obj.name}'",
            "moved_count": updated_count,
            "target_campaign": camp_obj.name
        }
    except Exception as e:
        raise APIException(e)


# 6. BULK ASSIGN LEADS TO TELECALLER SERVICE
def assign_lead_telecaller(lead_ids, telecaller, note=None, user=None):
    try:
        if not lead_ids or not isinstance(lead_ids, list):
            return {"status": "error", "message": "No leads selected"}

        if not telecaller or not str(telecaller).strip():
            return {"status": "error", "message": "Telecaller is required"}

        val_str = str(telecaller).strip()
        user_qs = User.objects.filter(is_active=True)
        if user and getattr(user, 'organization', None):
            user_qs = user_qs.filter(organization=user.organization)

        user_obj = None
        if val_str.isdigit():
            user_obj = user_qs.filter(id=int(val_str)).first()

        if not user_obj:
            user_obj = user_qs.filter(
                Q(username__iexact=val_str) |
                Q(first_name__iexact=val_str)
            ).first()

        if not user_obj:
            first_part = val_str.split()[0] if val_str.split() else val_str
            user_obj = user_qs.filter(
                Q(username__icontains=first_part) |
                Q(first_name__icontains=first_part)
            ).first()

        if not user_obj:
            return {"status": "error", "message": f"Telecaller '{telecaller}' not found"}

        updated_count = 0
        leads_qs = Lead.objects.filter(id__in=lead_ids)
        if user and getattr(user, 'organization', None):
            leads_qs = leads_qs.filter(organization=user.organization)

        # Rule 2 Permanent Safeguard: Restrict reassignment to assigned campaign agents
        campaign_ids = list(leads_qs.exclude(campaign__isnull=True).values_list('campaign_id', flat=True).distinct())
        for cid in campaign_ids:
            has_campaign_agents = campaign_assigned_agent.objects.filter(campaign_id=cid, is_active=True).exists()
            if has_campaign_agents:
                is_member = campaign_assigned_agent.objects.filter(campaign_id=cid, agent_user=user_obj, is_active=True).exists()
                if not is_member:
                    camp_name = CampaignName.objects.filter(id=cid).values_list('name', flat=True).first() or f"Campaign #{cid}"
                    display_name = (f"{user_obj.first_name or ''} {user_obj.last_name or ''}".strip()) or user_obj.username
                    return {
                        "status": "error",
                        "message": f"Cannot assign lead to '{display_name}'. This agent is not assigned to the '{camp_name}' campaign. Please select an active agent of this campaign."
                    }

        for lead in leads_qs:
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
def change_lead_status(lead_ids, status_name, note=None, user=None):
    try:
        if not lead_ids or not isinstance(lead_ids, list):
            return {"status": "error", "message": "No leads selected"}

        if not status_name or not str(status_name).strip():
            return {"status": "error", "message": "Lead status is required"}

        st_clean = str(status_name).strip()
        stages_qs = PipelineStage.objects.filter(is_active=True)
        if user and getattr(user, 'organization', None):
            stages_qs = stages_qs.filter(Q(organization=user.organization) | Q(organization__isnull=True))

        stage_obj = stages_qs.filter(name__iexact=st_clean).first()
        if not stage_obj:
            target_norm = st_clean.lower().replace('-', ' ').replace('_', ' ')
            for ps in stages_qs:
                ps_norm = ps.name.lower().replace('-', ' ').replace('_', ' ')
                if ps_norm == target_norm:
                    stage_obj = ps
                    break

        if not stage_obj:
            return {"status": "error", "message": f"Pipeline stage '{status_name}' does not exist. Please select a valid stage."}

        leads_qs = Lead.objects.filter(id__in=lead_ids)
        if user and getattr(user, 'organization', None):
            leads_qs = leads_qs.filter(organization=user.organization)

        updated_count = leads_qs.update(
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
        if user and getattr(user, 'organization', None):
            leads_qs = leads_qs.filter(organization=user.organization)
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
        p_id = kwargs.get("pipeline_id") or 0
        c_id = 0
        c_name = campaign_name
        if campaign_id and str(campaign_id).strip() not in ["null", "None", ""]:
            c_id = int(campaign_id)

        # Validate Campaign & Pipeline matching
        if c_id:
            camp_obj = CampaignName.objects.filter(id=c_id).first()
            if camp_obj:
                if not c_name:
                    c_name = camp_obj.name
                camp_pipe_id = camp_obj.pipeline_category_id or 0
                if p_id and camp_pipe_id and camp_pipe_id != p_id:
                    pipe_obj = PipelineCategory.objects.filter(id=p_id).first()
                    pipe_name = getattr(pipe_obj, 'category_name', '') or getattr(pipe_obj, 'display_name', '') or p_id
                    raise ValidationError(
                        f"Campaign '{camp_obj.name}' (ID {c_id}) does not belong to Pipeline '{pipe_name}' (ID {p_id})."
                    )
        elif c_name and str(c_name).strip() not in ["", "null", "None", "All Leads", "Enquiry Sheet", "Education", "500 inquiry Sheet"]:
            camp_obj = CampaignName.objects.filter(name__iexact=str(c_name).strip()).first()
            if camp_obj:
                c_id = camp_obj.id
                camp_pipe_id = camp_obj.pipeline_category_id or 0
                if p_id and camp_pipe_id and camp_pipe_id != p_id:
                    pipe_obj = PipelineCategory.objects.filter(id=p_id).first()
                    pipe_name = getattr(pipe_obj, 'category_name', '') or getattr(pipe_obj, 'display_name', '') or p_id
                    raise ValidationError(
                        f"Campaign '{camp_obj.name}' (ID {camp_obj.id}) does not belong to Pipeline '{pipe_name}' (ID {p_id})."
                    )

        from_date = ""
        to_date = ""
        date_range_str = kwargs.get("date_range") or kwargs.get("date_filter") or ""
        if date_range_str:
            if "to" in date_range_str or "," in date_range_str:
                parts = [p.strip() for p in date_range_str.replace(",", "to").split("to")]
                if len(parts) == 2:
                    from_date, to_date = parts[0], parts[1]
            else:
                d_str = str(date_range_str).lower().strip()
                today = date.today()
                if d_str == "today":
                    from_date = to_date = today.strftime('%Y-%m-%d')
                elif d_str == "yesterday":
                    yest = today - timedelta(days=1)
                    from_date = to_date = yest.strftime('%Y-%m-%d')
                elif d_str in ["last_7_days", "last 7 days", "weekly"]:
                    from_date = (today - timedelta(days=7)).strftime('%Y-%m-%d')
                    to_date = today.strftime('%Y-%m-%d')
                elif d_str in ["last_30_days", "last 30 days", "monthly"]:
                    from_date = (today - timedelta(days=30)).strftime('%Y-%m-%d')
                    to_date = today.strftime('%Y-%m-%d')
                elif d_str in ["this_month", "this month"]:
                    from_date = today.replace(day=1).strftime('%Y-%m-%d')
                    to_date = today.strftime('%Y-%m-%d')

        qry_vars = {
            'organization_id': getattr(user, 'organization_id', 0) if user else 0,
            'pipeline_id': p_id,
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
            "pipeline_id": p_id,
            "campaign_id": c_id,
            "campaign_name": c_name or "",
            "total_records": total_records,
            "total_count": total_records,
            "page": page,
            "page_size": page_size,
            "rows": paged_rows
        }
    except ValidationError:
        raise
    except Exception as e:
        raise APIException(e)