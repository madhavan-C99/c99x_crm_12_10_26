from datetime import timedelta
from django.utils import timezone
from django.db.models import Q
from rest_framework.exceptions import APIException, ValidationError
from telecalling.models.courses import CourseName, CoursePlan
from telecalling.models.leads import Lead, CampaignName, LeadSource, Priority, PipelineStage
from adm.models.user import User
from .query_services import exec_raw_sql


def fetch_pipeline_stats(user, **data):
    try:
        org_id = user.organization_id if (user and hasattr(user, 'organization_id') and user.organization_id) else 0
        raw_p_id = data.get("pipeline_category_id") or data.get("pipeline_id")
        try:
            pipeline_id = int(raw_p_id) if raw_p_id is not None and str(raw_p_id).strip() != "" else 0
        except (ValueError, TypeError):
            pipeline_id = 0

        payload = {**data, "organization_id": org_id, "pipeline_id": pipeline_id, "pipeline_category_id": pipeline_id}
        raw_res = exec_raw_sql("D_FETCH_PIPELINE_STATS", payload)
        item = raw_res[0] if (raw_res and isinstance(raw_res, list) and len(raw_res) > 0) else {}

        if isinstance(item.get("total_campaign"), dict):
            return item

        total_collected = int(item.get("total_leads_collected") or 0)

        # -----------------------------------------------------------------
        # Dynamic Trend Calculations (This Week vs Last Week)
        # -----------------------------------------------------------------
        if total_collected == 0:
            leads_note = "0 this week"
            leads_trend = "up"
            rate_note = "0.0% vs last week"
            rate_trend = "up"
        else:
            now = timezone.now()
            week_start = now - timedelta(days=7)
            last_week_start = now - timedelta(days=14)

            base_leads = Lead.objects.all()
            if org_id:
                base_leads = base_leads.filter(organization_id=org_id)
            if pipeline_id:
                base_leads = base_leads.filter(
                    Q(pipeline_id=pipeline_id) |
                    Q(pipeline_stage__pipeline_category_id=pipeline_id) |
                    Q(campaign__pipeline_category_id=pipeline_id)
                )
            # 1. Dynamic Leads Growth (This Week vs Last Week)
            leads_this_week = base_leads.filter(created_at__gte=week_start).count()
            leads_last_week = base_leads.filter(created_at__gte=last_week_start, created_at__lt=week_start).count()
            lead_diff = leads_this_week - leads_last_week

            if lead_diff > 0:
                leads_note = f"+{lead_diff} this week"
                leads_trend = "up"
            elif lead_diff < 0:
                leads_note = f"{lead_diff} this week"
                leads_trend = "down"
            else:
                leads_note = f"{leads_this_week} this week"
                leads_trend = "up"

            # 2. Dynamic Conversion Rate Growth (This Week vs Last Week across any pipeline)
            won_filter = (
                Q(pipeline_stage__stage_type__in=['closed_won', 'terminal_joined']) |
                (Q(pipeline_stage__name__icontains='won') & ~Q(pipeline_stage__name__icontains='loss') & ~Q(pipeline_stage__name__icontains='lost')) |
                (Q(pipeline_stage__name__icontains='join') & ~Q(pipeline_stage__name__icontains='loss') & ~Q(pipeline_stage__name__icontains='lost')) |
                (Q(pipeline_stage__name__icontains='admit') & ~Q(pipeline_stage__name__icontains='loss') & ~Q(pipeline_stage__name__icontains='lost')) |
                (Q(pipeline_stage__name__icontains='enrol') & ~Q(pipeline_stage__name__icontains='loss') & ~Q(pipeline_stage__name__icontains='lost'))
            )
            won_this_week = base_leads.filter(created_at__gte=week_start).filter(won_filter).count()
            won_last_week = base_leads.filter(created_at__gte=last_week_start, created_at__lt=week_start).filter(won_filter).count()

            rate_this = (won_this_week / leads_this_week * 100.0) if leads_this_week > 0 else 0.0
            rate_last = (won_last_week / leads_last_week * 100.0) if leads_last_week > 0 else 0.0
            rate_diff = round(rate_this - rate_last, 1)

            if rate_diff > 0:
                rate_note = f"+{rate_diff}% vs last week"
                rate_trend = "up"
            elif rate_diff < 0:
                rate_note = f"{rate_diff}% vs last week"
                rate_trend = "down"
            else:
                rate_note = f"{rate_diff}% vs last week"
                rate_trend = "up"

        return {
            "total_campaign": {
                "value": item.get("total_campaign", 0),
                "note": "Across this Pipeline",
                "show_trend": False
            },
            "total_leads_collected": {
                "value": total_collected,
                "note": leads_note,
                "show_trend": True,
                "trend": leads_trend
            },
            "avg_conversion_rate": {
                "value": float(item.get("avg_conversion_rate") or 0.0),
                "note": rate_note,
                "show_trend": True,
                "trend": rate_trend
            },
            "top_lead_source": {
                "value": item.get("top_lead_source") or "N/A",
                "note": item.get("source_note") or "0% of all leads",
                "show_trend": True,
                "trend": "up"
            }
        }
    except ValidationError:
        raise
    except Exception as e:
        raise APIException(str(e))


def fetch_campaign_cards(user, **data):
    try:
        org_id = user.organization_id if (user and hasattr(user, 'organization_id') and user.organization_id) else 0
        raw_p_id = data.get("pipeline_category_id") or data.get("pipeline_id")
        try:
            pipeline_id = int(raw_p_id) if raw_p_id is not None and str(raw_p_id).strip() != "" else 0
        except (ValueError, TypeError):
            pipeline_id = 0

        # Mismatch check if both pipeline_id and campaign_id are provided
        camp_id = data.get("campaign_id")
        if pipeline_id > 0 and camp_id and str(camp_id).strip() not in ["", "0", "null", "None", "All", "all"]:
            try:
                c_id_int = int(camp_id)
                c_obj = CampaignName.objects.filter(id=c_id_int).first()
                if c_obj:
                    if c_obj.pipeline_category_id and c_obj.pipeline_category_id != pipeline_id:
                        raise ValidationError(
                            f"Campaign '{c_obj.name}' (ID {c_id_int}) does not belong to Pipeline ID {pipeline_id}."
                        )
            except ValueError:
                pass

        payload = {**data, "organization_id": org_id, "pipeline_id": pipeline_id, "pipeline_category_id": pipeline_id}
        raw_cards = exec_raw_sql("D_FETCH_CAMPAIGN_CARDS", payload)
        if raw_cards and isinstance(raw_cards, list):
            # Strict filter by campaign_id if passed
            if camp_id and str(camp_id).strip() not in ["", "0", "null", "None", "All", "all"]:
                try:
                    c_id_int = int(camp_id)
                    raw_cards = [c for c in raw_cards if c.get("id") == c_id_int]
                except ValueError:
                    pass

            # Strict filter by campaign_name if passed
            camp_name = data.get("campaign_name")
            if camp_name and str(camp_name).strip() not in ["", "null", "None", "All", "all", "All Leads"]:
                raw_cards = [c for c in raw_cards if str(c.get("name", "")).strip().lower() == str(camp_name).strip().lower()]

            # Status filter ('active', 'paused', 'all')
            status_filter = str(data.get("status") or "").strip().lower()
            if status_filter in ["active", "true"]:
                raw_cards = [c for c in raw_cards if c.get("isActive") is True]
            elif status_filter in ["paused", "inactive", "false"]:
                raw_cards = [c for c in raw_cards if c.get("isActive") is False]

            # Direct boolean filter is_active
            is_active_filter = data.get("is_active")
            if is_active_filter is not None:
                raw_cards = [c for c in raw_cards if bool(c.get("isActive")) == bool(is_active_filter)]

            search_text = str(data.get("search") or "").strip().lower()
            if search_text:
                raw_cards = [c for c in raw_cards if search_text in str(c.get("name", "")).lower()]
            return raw_cards
        return []
    except ValidationError:
        raise
    except Exception as e:
        raise APIException(str(e))


def fetch_filter_options(user, **data):
    try:
        user_org = getattr(user, 'organization', None) if (user and getattr(user, 'is_authenticated', False)) else None

        # 1. Campaigns scoped to organization
        camp_qs = CampaignName.objects.filter(is_active=True)
        lead_qs = Lead.objects.all()
        if user_org:
            camp_qs = camp_qs.filter(organization=user_org)
            lead_qs = lead_qs.filter(organization=user_org)

        c1 = list(camp_qs.values_list('name', flat=True))
        c2 = list(lead_qs.values_list('campaign__name', flat=True))
        campaigns = sorted(list(set([c for c in (c1 + c2) if c and str(c).strip()])))

        # 2. Courses
        co1 = list(CourseName.objects.filter(is_active=True).values_list('course_name', flat=True))
        co2 = list(lead_qs.values_list('course__course_name__course_name', flat=True))
        courses = sorted(list(set([c for c in (co1 + co2) if c and str(c).strip()])))

        # 3. Course Plans
        p1 = list(CoursePlan.objects.filter(is_active=True).values_list('course_plan', flat=True))
        p2 = list(lead_qs.values_list('course__course_plan__course_plan', flat=True))
        course_plans = sorted(list(set([p for p in (p1 + p2) if p and str(p).strip()])))

        # 4. Lead Sources scoped to organization
        src_qs = LeadSource.objects.filter(is_active=True)
        if user_org:
            src_qs = src_qs.filter(Q(organization=user_org) | Q(organization__isnull=True))
        s1 = list(src_qs.values_list('name', flat=True))
        s2 = list(lead_qs.values_list('lead_source__name', flat=True))
        lead_sources = sorted(list(set([s for s in (s1 + s2) if s and str(s).strip()])))

        # 5. Priorities
        pr1 = list(Priority.objects.values_list('name', flat=True))
        pr2 = list(lead_qs.values_list('priority__name', flat=True))
        priorities = sorted(list(set([p for p in (pr1 + pr2) if p and str(p).strip()])))

        # 6. Telecallers / Users
        telecallers = []
        users_qs = User.objects.all()
        leads_qs = Lead.objects.all()
        if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization', None):
            users_qs = users_qs.filter(organization=user.organization)
            leads_qs = leads_qs.filter(organization=user.organization)
        elif user and getattr(user, 'is_authenticated', False):
            users_qs = users_qs.none()
            leads_qs = leads_qs.none()

        for u in users_qs:
            full_name = f"{u.first_name or ''} {u.last_name or ''}".strip() or u.username
            if full_name and full_name not in telecallers:
                telecallers.append(full_name)

        lead_assigned = leads_qs.exclude(assigned_to__isnull=True).select_related('assigned_to')
        for l in lead_assigned:
            if l.assigned_to:
                name = f"{l.assigned_to.first_name or ''} {l.assigned_to.last_name or ''}".strip() or l.assigned_to.username
                if name and name not in telecallers:
                    telecallers.append(name)
        telecallers = sorted(telecallers)

        # 7. Pipeline Stages
        stage_tags_map = {}
        ps1 = list(PipelineStage.objects.values_list('name', flat=True))
        ps2 = list(Lead.objects.exclude(pipeline_stage__name__isnull=True).values_list('pipeline_stage__name', flat=True).distinct())
        stages = sorted(list(set([st for st in (ps1 + ps2) if st and str(st).strip()])))

        for ps in PipelineStage.objects.all():
            tags = list(Priority.objects.filter(pipeline_stage_id=ps.id).values_list('name', flat=True))
            if tags:
                stage_tags_map[ps.name.lower()] = tags

        return {
            "campaigns": ["All"] + campaigns,
            "courses": ["All"] + courses,
            "course_plans": ["All"] + course_plans,
            "lead_sources": ["All"] + lead_sources,
            "payment_statuses": ["All", "Paid", "Pending", "Partial", "Overdue"],
            "priorities": ["All"] + priorities,
            "stages": stages,
            "stage_tags_map": stage_tags_map,
            "telecallers": telecallers,
        }
    except Exception as e:
        raise APIException(e)