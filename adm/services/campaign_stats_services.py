from rest_framework.exceptions import APIException
from telecalling.models.courses import CourseName, CoursePlan
from telecalling.models.leads import Lead, CampaignName, LeadSource, Priority, PipelineStage
from adm.models.user import User
from .query_services import exec_raw_sql


def fetch_pipeline_stats(user, **data):
    try:
        org_id = user.organization_id if (user and hasattr(user, 'organization_id') and user.organization_id) else 0
        payload = {**data, "organization_id": org_id}
        raw_res = exec_raw_sql("D_FETCH_PIPELINE_STATS", payload)
        if raw_res and isinstance(raw_res, list) and len(raw_res) > 0:
            item = raw_res[0]
            if isinstance(item.get("total_campaign"), dict):
                return item
            
            return {
                "total_campaign": {
                    "value": item.get("total_campaign", 0),
                    "note": "Across this Pipeline",
                    "show_trend": False
                },
                "total_leads_collected": {
                    "value": item.get("total_leads_collected", 0),
                    "note": f"{item.get('leads_note', '-21 this week')}",
                    "show_trend": True,
                    "trend": item.get("leads_trend", "down")
                },
                "avg_conversion_rate": {
                    "value": float(item.get("avg_conversion_rate") or 0.0),
                    "note": f"{item.get('rate_note', '-17.7% vs last week')}",
                    "show_trend": True,
                    "trend": item.get("rate_trend", "down")
                },
                "top_lead_source": {
                    "value": item.get("top_lead_source") or "N/A",
                    "note": f"{item.get('source_note', '79.1% of all leads')}",
                    "show_trend": True,
                    "trend": "up"
                }
            }
        elif raw_res and isinstance(raw_res, dict):
            return raw_res
        return {
            "total_campaign": {"value": 0, "note": "Across this Pipeline", "show_trend": False},
            "total_leads_collected": {"value": 0, "note": "0 this week", "show_trend": True, "trend": "up"},
            "avg_conversion_rate": {"value": 0.0, "note": "0% vs last week", "show_trend": True, "trend": "up"},
            "top_lead_source": {"value": "N/A", "note": "0% of all leads", "show_trend": True, "trend": "up"},
        }
    except Exception as e:
        raise APIException(e)


def fetch_campaign_cards(user, **data):
    try:
        org_id = user.organization_id if (user and hasattr(user, 'organization_id') and user.organization_id) else 0
        payload = {**data, "organization_id": org_id}
        raw_cards = exec_raw_sql("D_FETCH_CAMPAIGN_CARDS", payload)
        if raw_cards and isinstance(raw_cards, list):
            search_text = str(data.get("search") or "").strip().lower()
            if search_text:
                raw_cards = [c for c in raw_cards if search_text in str(c.get("name", "")).lower()]
            return raw_cards
        return []
    except Exception as e:
        raise APIException(e)


def fetch_filter_options(user, **data):
    try:
        # 1. Campaigns
        c1 = list(CampaignName.objects.values_list('name', flat=True))
        c2 = list(Lead.objects.values_list('campaign__name', flat=True))
        campaigns = sorted(list(set([c for c in (c1 + c2) if c and str(c).strip()])))

        # 2. Courses
        co1 = list(CourseName.objects.values_list('course_name', flat=True))
        co2 = list(Lead.objects.values_list('course__course_name__course_name', flat=True))
        courses = sorted(list(set([c for c in (co1 + co2) if c and str(c).strip()])))

        # 3. Course Plans
        p1 = list(CoursePlan.objects.values_list('course_plan', flat=True))
        p2 = list(Lead.objects.values_list('course__course_plan__course_plan', flat=True))
        course_plans = sorted(list(set([p for p in (p1 + p2) if p and str(p).strip()])))

        # 4. Lead Sources
        s1 = list(LeadSource.objects.values_list('name', flat=True))
        s2 = list(Lead.objects.values_list('lead_source__name', flat=True))
        lead_sources = sorted(list(set([s for s in (s1 + s2) if s and str(s).strip()])))

        # 5. Priorities
        pr1 = list(Priority.objects.values_list('name', flat=True))
        pr2 = list(Lead.objects.values_list('priority__name', flat=True))
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