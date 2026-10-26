import asyncio
import zoneinfo
from datetime import datetime, timedelta
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncMonth, Coalesce
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from datetime import date
from .query_services import exec_raw_sql
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from rest_framework.exceptions import APIException

from telecalling.models import (
    Lead, CallDetails, FollowUp, PaymentInfo, 
    LeadSource, LossReason, PipelineStage
)
from adm.models import User


# ----------------- Date Filter Helper -----------------
def parse_date_filter(date_filter_str, custom_from=None, custom_to=None):
    try:
        ist = zoneinfo.ZoneInfo('Asia/Kolkata')
        today = datetime.now(ist).date()
    except Exception:
        today = datetime.now().date()

    raw_str = str(date_filter_str or "All").strip()

    # Priority 1: Direct custom_from / custom_to parameters
    if custom_from and custom_to:
        try:
            f_date = datetime.strptime(str(custom_from)[:10], '%Y-%m-%d').date() if isinstance(custom_from, str) else custom_from
            t_date = datetime.strptime(str(custom_to)[:10], '%Y-%m-%d').date() if isinstance(custom_to, str) else custom_to
            return f_date, t_date, f"{f_date.strftime('%b %d')} - {t_date.strftime('%b %d')}"
        except Exception:
            pass

    # Priority 2: String range format "YYYY-MM-DD to YYYY-MM-DD" or "YYYY-MM-DD - YYYY-MM-DD"
    if " to " in raw_str.lower() or " - " in raw_str:
        delimiter = " to " if " to " in raw_str.lower() else " - "
        parts = [p.strip() for p in raw_str.split(delimiter, 1)]
        if len(parts) == 2 and parts[0] and parts[1]:
            try:
                f_date = datetime.strptime(parts[0][:10], '%Y-%m-%d').date()
                t_date = datetime.strptime(parts[1][:10], '%Y-%m-%d').date()
                return f_date, t_date, f"{f_date.strftime('%b %d')} - {t_date.strftime('%b %d')}"
            except Exception:
                pass

    df = raw_str.lower().replace("-", "_")

    if df in ["all", "all time", "overall", "all_time", "none", ""]:
        return None, None, "overall"
    elif df in ["today", "daily"]:
        return today, today, "vs yesterday"
    elif df == "yesterday":
        y = today - timedelta(days=1)
        return y, y, "vs previous day"
    elif df in ["last_7_days", "last 7 days", "this week", "weekly", "week"]:
        start = today - timedelta(days=7)
        return start, today, "vs last 7 days"
    elif df in ["this_month", "this month", "monthly", "month"]:
        start = today.replace(day=1)
        return start, today, "vs last month"
    elif df in ["last_30_days", "last 30 days", "30 days"]:
        start = today - timedelta(days=30)
        return start, today, "vs previous 30 days"
    elif df in ["this_year", "this year", "yearly", "year"]:
        start = today.replace(month=1, day=1)
        return start, today, "vs last year"
    elif df in ["last_year", "last year", "previous_year", "previous year"]:
        start_ly = date(today.year - 1, 1, 1)
        end_ly = date(today.year - 1, 12, 31)
        return start_ly, end_ly, f"vs {today.year - 2}"
    else:
        return None, None, "overall"

def calc_metric_trend(current_val, prev_val, trend_label, is_percentage=False):
    if not trend_label or trend_label == "overall":
        return f"+0% {trend_label}" if trend_label else "+0% overall"
    if is_percentage:
        diff = round(current_val - prev_val)
        sign = "+" if diff > 0 else ""
        return f"{sign}{diff}% {trend_label}"
    if prev_val == 0:
        pct = 100 if current_val > 0 else 0
    else:
        pct = round(((current_val - prev_val) / prev_val) * 100)
    sign = "+" if pct > 0 else ""
    return f"{sign}{pct}% {trend_label}"


# ----------------- Master Data Payload Engine -----------------

def get_admin_dashboard_payload(user=None, pipeline_id=None, campaign_id=None, date_filter="All", from_date=None, to_date=None):
    
    from_date, to_date, trend_label = parse_date_filter(date_filter, from_date, to_date)

    # 1. Base Queryset (Scoped to Pipeline, Campaign & Organization)
    base_leads_qs = Lead.objects.all()
    if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization', None):
        base_leads_qs = base_leads_qs.filter(Q(organization=user.organization) | Q(organization__isnull=True))
    if pipeline_id and str(pipeline_id).isdigit() and int(pipeline_id) > 0:
        base_leads_qs = base_leads_qs.filter(
            Q(pipeline_stage__pipeline_category_id=int(pipeline_id)) |
            Q(campaign__pipeline_category_id=int(pipeline_id))
        )
    if campaign_id and str(campaign_id).isdigit() and int(campaign_id) > 0:
        base_leads_qs = base_leads_qs.filter(campaign_id=int(campaign_id))

    # 2. Date-Filtered Leads Queryset (For cards, funnel, and lead sources)
    if from_date and to_date:
        leads_qs = base_leads_qs.filter(created_at__date__range=[from_date, to_date])
    else:
        leads_qs = base_leads_qs  # 'All' selected -> overall pipeline leads

    # 1. METRICS
    total_leads_count = leads_qs.count()

    # Calls Made (Scoped to pipeline, campaign and date)
    calls_qs = CallDetails.objects.all()
    if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization', None):
        calls_qs = calls_qs.filter(Q(organization=user.organization) | Q(organization__isnull=True))
    if pipeline_id and str(pipeline_id).isdigit() and int(pipeline_id) > 0:
        calls_qs = calls_qs.filter(
            Q(lead__pipeline_stage__pipeline_category_id=int(pipeline_id)) |
            Q(lead__campaign__pipeline_category_id=int(pipeline_id))
        )
    if campaign_id and str(campaign_id).isdigit() and int(campaign_id) > 0:
        calls_qs = calls_qs.filter(lead__campaign_id=int(campaign_id))

    if from_date and to_date:
        calls_made = calls_qs.filter(created_at__date__range=[from_date, to_date]).count()
    else:
        calls_made = calls_qs.count()

    # Follow Up / Working Leads (Within selected period)
    follow_up_count = leads_qs.filter(
        Q(pipeline_stage__name__icontains="follow") |
        Q(pipeline_stage__name__icontains="todo") |
        Q(pipeline_stage__name__icontains="track")
    ).count()

    try:
        now_ist = datetime.now(zoneinfo.ZoneInfo('Asia/Kolkata'))
    except Exception:
        now_ist = timezone.now()

    # Missed Follow-ups count (Exclude leads already Won or Loss)
    missed_base_qs = FollowUp.objects.filter(is_attended=False).exclude(
        Q(lead__pipeline_stage__stage_type__in=['closed_won', 'closed_lost', 'terminal_joined', 'terminal_closed']) |
        (Q(lead__pipeline_stage__name__icontains="won") & ~Q(lead__pipeline_stage__name__icontains="loss") & ~Q(lead__pipeline_stage__name__icontains="lost")) |
        Q(lead__pipeline_stage__name__icontains="loss") |
        Q(lead__pipeline_stage__name__icontains="lost") |
        (Q(lead__pipeline_stage__name__icontains="convert") & ~Q(lead__pipeline_stage__name__icontains="loss") & ~Q(lead__pipeline_stage__name__icontains="lost")) |
        Q(lead__pipeline_stage__name__icontains="join") |
        Q(lead__pipeline_stage__name__icontains="admit") |
        Q(lead__pipeline_stage__name__icontains="closed")
    )
    if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization', None):
        missed_base_qs = missed_base_qs.filter(
            Q(lead__organization=user.organization) | Q(lead__organization__isnull=True)
        )
    if pipeline_id and str(pipeline_id).isdigit() and int(pipeline_id) > 0:
        missed_base_qs = missed_base_qs.filter(
            Q(lead__pipeline_stage__pipeline_category_id=int(pipeline_id)) |
            Q(lead__campaign__pipeline_category_id=int(pipeline_id))
        )
    if campaign_id and str(campaign_id).isdigit() and int(campaign_id) > 0:
        missed_base_qs = missed_base_qs.filter(lead__campaign_id=int(campaign_id))

    if from_date and to_date:
        missed_count = missed_base_qs.filter(
            scheduled_at__date__range=[from_date, to_date],
            scheduled_at__lte=now_ist
        ).count()
    else:
        missed_count = missed_base_qs.filter(scheduled_at__lte=now_ist).count()

    won_stage_filter = (
        Q(pipeline_stage__stage_type='closed_won') |
        (Q(pipeline_stage__name__icontains="won") & ~Q(pipeline_stage__name__icontains="loss") & ~Q(pipeline_stage__name__icontains="lost")) |
        (Q(pipeline_stage__name__icontains="convert") & ~Q(pipeline_stage__name__icontains="loss") & ~Q(pipeline_stage__name__icontains="lost"))
    )
    loss_stage_filter = (
        Q(pipeline_stage__stage_type='closed_lost') |
        Q(pipeline_stage__name__icontains="loss") |
        Q(pipeline_stage__name__icontains="lost")
    )
    converted_count = leads_qs.filter(won_stage_filter).count()
    loss_count = leads_qs.filter(loss_stage_filter).count()

    conv_rate = f"{round((converted_count / total_leads_count) * 100)}%" if total_leads_count > 0 else "0%"

    # Payments (STRICT - NO FALLBACK TO ALL-TIME! Multi-tenant Organization Scoped)
    payments_qs = PaymentInfo.objects.all()
    if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization', None):
        payments_qs = payments_qs.filter(
            Q(lead__organization=user.organization) | Q(lead__organization__isnull=True)
        )
    if pipeline_id and str(pipeline_id).isdigit() and int(pipeline_id) > 0:
        payments_qs = payments_qs.filter(
            Q(lead__pipeline_stage__pipeline_category_id=int(pipeline_id)) |
            Q(lead__campaign__pipeline_category_id=int(pipeline_id))
        )
    if campaign_id and str(campaign_id).isdigit() and int(campaign_id) > 0:
        payments_qs = payments_qs.filter(lead__campaign_id=int(campaign_id))

    if from_date and to_date:
        period_payments = payments_qs.filter(created_at__date__range=[from_date, to_date])
        rev_sum = period_payments.aggregate(total=Sum('amount_paid'))['total'] or 0
        pending_sum = period_payments.aggregate(total=Sum('pending_amount'))['total'] or 0
    else:
        rev_sum = payments_qs.aggregate(total=Sum('amount_paid'))['total'] or 0
        pending_sum = payments_qs.aggregate(total=Sum('pending_amount'))['total'] or 0

    total_rev_str = f"{int(rev_sum):,}"
    pending_str = f"{int(pending_sum):,}"

    # Dynamic Trends Calculation (Compare with preceding period of identical duration)
    prev_from_date, prev_to_date = None, None
    if from_date and to_date:
        delta_days = (to_date - from_date).days + 1
        prev_to_date = from_date - timedelta(days=1)
        prev_from_date = prev_to_date - timedelta(days=delta_days - 1)

    if prev_from_date and prev_to_date:
        prev_leads_qs = base_leads_qs.filter(created_at__date__range=[prev_from_date, prev_to_date])
        prev_total_leads = prev_leads_qs.count()
        prev_calls = calls_qs.filter(created_at__date__range=[prev_from_date, prev_to_date]).count()
        prev_follow_up = prev_leads_qs.filter(
            Q(pipeline_stage__name__icontains="follow") |
            Q(pipeline_stage__name__icontains="todo") |
            Q(pipeline_stage__name__icontains="track")
        ).count()
        prev_missed = missed_base_qs.filter(scheduled_at__date__range=[prev_from_date, prev_to_date]).count()
        prev_converted = prev_leads_qs.filter(won_stage_filter).count()
        prev_loss = prev_leads_qs.filter(loss_stage_filter).count()
        prev_conv_rate_num = round((prev_converted / prev_total_leads) * 100) if prev_total_leads > 0 else 0

        prev_payments = payments_qs.filter(created_at__date__range=[prev_from_date, prev_to_date])
        prev_rev = prev_payments.aggregate(total=Sum('amount_paid'))['total'] or 0
        prev_pending = prev_payments.aggregate(total=Sum('pending_amount'))['total'] or 0
    else:
        prev_total_leads = prev_calls = prev_follow_up = prev_missed = 0
        prev_converted = prev_loss = prev_conv_rate_num = 0
        prev_rev = prev_pending = 0

    curr_conv_rate_num = round((converted_count / total_leads_count) * 100) if total_leads_count > 0 else 0

    metrics = {
        "total_leads":      {"value": str(total_leads_count), "trend": calc_metric_trend(total_leads_count, prev_total_leads, trend_label)},
        "calls_made":       {"value": str(calls_made),        "trend": calc_metric_trend(calls_made, prev_calls, trend_label)},
        "follow_up":        {"value": str(follow_up_count),   "trend": calc_metric_trend(follow_up_count, prev_follow_up, trend_label)},
        "missed_follow_up": {"value": str(missed_count),      "trend": calc_metric_trend(missed_count, prev_missed, trend_label)},
        "converted_leads":  {"value": str(converted_count),   "trend": calc_metric_trend(converted_count, prev_converted, trend_label)},
        "loss_leads":       {"value": str(loss_count),        "trend": calc_metric_trend(loss_count, prev_loss, trend_label)},
        "conversion_rate":  {"value": conv_rate,              "trend": calc_metric_trend(curr_conv_rate_num, prev_conv_rate_num, trend_label, is_percentage=True)},
        "total_revenue":    {"value": total_rev_str,          "trend": calc_metric_trend(int(rev_sum), int(prev_rev), trend_label)},
        "pending_payment":  {"value": pending_str,            "trend": calc_metric_trend(int(pending_sum), int(prev_pending), trend_label)}
    }

    # 2. MISSED FOLLOW-UPS (Table rows)
    missed_table_qs = missed_base_qs.filter(scheduled_at__lte=now_ist)
    if from_date and to_date:
        missed_table_qs = missed_table_qs.filter(scheduled_at__date__range=[from_date, to_date])

    missed_records = missed_table_qs.select_related('lead', 'telecaller', 'lead__pipeline_stage').order_by('-scheduled_at')[:20]

    missed_followups = []
    for mf in missed_records:
        sched_date = mf.scheduled_at.strftime('%b %d') if mf.scheduled_at else "Today"
        is_urgent = False
        if mf.scheduled_at:
            try:
                is_urgent = (now_ist.date() - mf.scheduled_at.date()).days >= 1
            except Exception:
                is_urgent = False

        telecaller_name = "Unassigned"
        if mf.telecaller:
            telecaller_name = mf.telecaller.get_full_name() or mf.telecaller.username

        mob = (mf.lead.mobile_no or mf.lead.alternative_mobile or "-") if mf.lead else "-"

        missed_followups.append({
            "id": mf.id,
            "followup_id": mf.id,
            "lead_id": mf.lead_id,
            "student_name": mf.lead.full_name if mf.lead else "Unknown",
            "mobile_no": mob,
            "mobile": mob,
            "mobile_number": mob,
            "phone": mob,
            "contact_no": mob,
            "lead_stage": mf.lead.pipeline_stage.name if (mf.lead and mf.lead.pipeline_stage) else "Hot",
            "follow_up_date": sched_date,
            "telecaller": telecaller_name,
            "flag": "red" if is_urgent else "orange"
        })

    # 3. PIPELINE STAGES (Funnel - from filtered leads_qs)
    stages_qs = PipelineStage.objects.filter(is_active=True).order_by('order_no')
    if user and getattr(user, 'is_authenticated', False) and getattr(user, 'organization', None):
        stages_qs = stages_qs.filter(Q(organization=user.organization) | Q(organization__isnull=True))
    if pipeline_id and str(pipeline_id).isdigit() and int(pipeline_id) > 0:
        stages_qs = stages_qs.filter(pipeline_category_id=int(pipeline_id))

    stage_counts = dict(leads_qs.values_list('pipeline_stage_id').annotate(cnt=Count('id')))
    pipeline_stages = []
    for stg in stages_qs[:7]:
        pipeline_stages.append({
            "id": stg.id,
            "name": stg.name,
            "count": stage_counts.get(stg.id, 0),
            "stage_color": stg.stage_color or "",
        })

    # 4. MONTHLY BAR DATA (Last 6 Months - trend from base_leads_qs)
    ref_date = to_date or now_ist.date()
    six_months_start = (ref_date.replace(day=1) - timedelta(days=150)).replace(day=1)

    monthly_stats = base_leads_qs.filter(created_at__date__gte=six_months_start).annotate(
        m=TruncMonth('created_at')
    ).values('m').annotate(
        total=Count('id'),
        won=Count('id', filter=won_stage_filter),
        loss=Count('id', filter=loss_stage_filter)
    )
    month_data_map = {item['m'].strftime('%b'): item for item in monthly_stats if item.get('m')}

    monthly_bar_data = []
    month_cursor = ref_date.replace(day=1)
    for _ in range(6):
        m_name = month_cursor.strftime('%b')
        m_info = month_data_map.get(m_name, {})
        monthly_bar_data.insert(0, {
            "month": m_name,
            "total": m_info.get("total", 0),
            "won": m_info.get("won", 0),
            "loss": m_info.get("loss", 0)
        })
        month_cursor = (month_cursor - timedelta(days=1)).replace(day=1)

    # 5. MONTHLY REVENUE DATA (Last 6 Months - Filter-Scoped)
    rev_stats = payments_qs.filter(created_at__date__gte=six_months_start).annotate(
        m=TruncMonth('created_at')
    ).values('m').annotate(total=Sum('amount_paid'))
    rev_map = {item['m'].strftime('%b'): item.get('total', 0) for item in rev_stats if item.get('m')}

    monthly_revenue_data = []
    rev_cursor = ref_date.replace(day=1)
    for _ in range(6):
        m_name = rev_cursor.strftime('%b')
        m_rev = rev_map.get(m_name, 0) or 0
        monthly_revenue_data.insert(0, {"month": m_name, "val": round(float(m_rev) / 1000, 1)})
        rev_cursor = (rev_cursor - timedelta(days=1)).replace(day=1)

    # 6. LEAD SOURCES (from filtered leads_qs)
    SOURCE_COLORS = ["#84CC16", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6"]
    src_stats = leads_qs.values('lead_source__name').annotate(cnt=Count('id')).order_by('-cnt')[:5]
    lead_source_total = sum(s['cnt'] for s in src_stats)

    lead_sources = []
    for idx, s in enumerate(src_stats):
        s_cnt = s['cnt']
        s_name = s['lead_source__name'] or "Direct / Other"
        pct = round((s_cnt / lead_source_total * 100)) if lead_source_total > 0 else 0
        lead_sources.append({
            "name": s_name,
            "count": s_cnt,
            "percentage": pct,
            "color": SOURCE_COLORS[idx % len(SOURCE_COLORS)]
        })

    # 7. LOSS ITEMS & KEY INSIGHT (from filtered leads_qs)
    LOSS_COLORS = ["#F87171", "#FB923C", "#FACC15", "#8B5CF6", "#60A5FA", "#A3E635", "#EC4899", "#14B8A6"]
    loss_stats = leads_qs.annotate(
        resolved_reason=Coalesce('loss_reason__name', 'loss_detail__loss_reason__name')
    ).filter(resolved_reason__isnull=False).values('resolved_reason').annotate(cnt=Count('id')).order_by('-cnt')[:6]

    loss_total = sum(l['cnt'] for l in loss_stats)

    loss_items = []
    for idx, lr in enumerate(loss_stats):
        pct = round((lr['cnt'] / loss_total * 100)) if loss_total > 0 else 0
        loss_items.append({
            "reason": lr['resolved_reason'] or "Unknown",
            "count": lr['cnt'],
            "percentage": pct,
            "color": LOSS_COLORS[idx % len(LOSS_COLORS)]
        })

    if loss_items:
        top_item = loss_items[0]
        top_pct = top_item["percentage"]
        top_name = top_item["reason"].lower()
        key_insight = f"Key Insight: {top_pct}% of leads are lost due to {top_name}. Consider addressing this in your sales approach."
    else:
        key_insight = "No lost leads recorded for the selected period."

    return {
        "metrics": metrics,
        "missed_followups": missed_followups,
        "pipeline_stages": pipeline_stages,
        "total_lost": loss_count,
        "monthly_bar_data": monthly_bar_data,
        "monthly_revenue_data": monthly_revenue_data,
        "lead_source_total": lead_source_total,
        "lead_sources": lead_sources,
        "loss_items": loss_items,
        "key_insight": key_insight
    }


# ----------------- Decoupled Live Trigger (TL Required Layer) -----------------

def trigger_dashboard_update():
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            return

        message = {
            "type": "broadcast_dashboard_update"
        }

        # Check if an event loop is already active in the current thread
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            # In Async Context (ASGI / Async views / Async test scripts)
            asyncio.ensure_future(
                channel_layer.group_send("admin_dashboard", message),
                loop=loop
            )
        else:
            # In Synchronous Thread (Standard Django views / Huey workers)
            async_to_sync(channel_layer.group_send)("admin_dashboard", message)

    except Exception as e:
        print(f"[WS TRIGGER ERROR] {e}")


def normalize_dashboard_date_filter(date_filter="Today", from_date=None, to_date=None):
    today = timezone.localdate()
    raw_str = str(date_filter or "Today").strip()

    # Priority 1: Direct from_date / to_date parameters
    if from_date and to_date:
        return str(from_date)[:10], str(to_date)[:10]

    # Priority 2: String range format "YYYY-MM-DD to YYYY-MM-DD" or "YYYY-MM-DD - YYYY-MM-DD"
    if " to " in raw_str.lower() or " - " in raw_str:
        delimiter = " to " if " to " in raw_str.lower() else " - "
        parts = [p.strip() for p in raw_str.split(delimiter, 1)]
        if len(parts) == 2 and parts[0] and parts[1]:
            try:
                f_d = datetime.strptime(parts[0][:10], '%Y-%m-%d').date()
                t_d = datetime.strptime(parts[1][:10], '%Y-%m-%d').date()
                return f_d.isoformat(), t_d.isoformat()
            except Exception:
                pass

    df = raw_str.lower().replace("-", "_")

    if df in ("today", "daily"):
        return today.isoformat(), today.isoformat()
    elif df == "yesterday":
        yest = today - timedelta(days=1)
        return yest.isoformat(), yest.isoformat()
    elif df in ("last_7_days", "last 7 days", "this week", "weekly", "week"):
        start_w = today - timedelta(days=7)
        return start_w.isoformat(), today.isoformat()
    elif df in ("this_month", "this month", "monthly", "month"):
        start_m = today.replace(day=1)
        return start_m.isoformat(), today.isoformat()
    elif df in ("last_30_days", "last 30 days", "30 days"):
        start_30 = today - timedelta(days=30)
        return start_30.isoformat(), today.isoformat()
    elif df in ("yearly", "year", "this_year", "this year"):
        start_y = date(today.year, 1, 1)
        return start_y.isoformat(), today.isoformat()
    elif df in ("last_year", "last year", "previous_year", "previous year"):
        start_ly = date(today.year - 1, 1, 1)
        end_ly = date(today.year - 1, 12, 31)
        return start_ly.isoformat(), end_ly.isoformat()
    elif df in ("all", "all_time", "overall"):
        return "", ""
    
    return today.isoformat(), today.isoformat()

def fetch_dashboard_pending_payments(user, pipeline_id=None, campaign_id=None, date_filter="Today", from_date=None, to_date=None):
    org_id = getattr(user, 'organization_id', 0) if user else 0
    from_d, to_d = normalize_dashboard_date_filter(date_filter, from_date, to_date)

    qry_vars = {
        "organization_id": org_id,
        "pipeline_id": pipeline_id if pipeline_id not in (None, "", "null") else 0,
        "campaign_id": campaign_id if campaign_id not in (None, "", "null") else 0,
        "from_date": from_d,
        "to_date": to_d,
    }

    records = exec_raw_sql('D_ADMIN_DASHBOARD_PENDING_PAYMENTS', qry_vars)
    return records or []


def fetch_dashboard_performance_overview(user, pipeline_id=None, campaign_id=None, date_filter="Today", from_date=None, to_date=None):
    org_id = getattr(user, 'organization_id', 0) if user else 0
    from_d, to_d = normalize_dashboard_date_filter(date_filter, from_date, to_date)

    qry_vars = {
        "organization_id": org_id,
        "pipeline_id": pipeline_id if pipeline_id not in (None, "", "null") else 0,
        "campaign_id": campaign_id if campaign_id not in (None, "", "null") else 0,
        "from_date": from_d,
        "to_date": to_d,
    }

    records = exec_raw_sql('D_ADMIN_DASHBOARD_PERFORMANCE_OVERVIEW', qry_vars)
    return records or []


def fetch_dashboard_best_performer(user, pipeline_id=None, campaign_id=None, date_filter="Today", from_date=None, to_date=None):
    org_id = getattr(user, 'organization_id', 0) if user else 0
    from_d, to_d = normalize_dashboard_date_filter(date_filter, from_date, to_date)

    qry_vars = {
        "organization_id": org_id,
        "pipeline_id": pipeline_id if pipeline_id not in (None, "", "null") else 0,
        "campaign_id": campaign_id if campaign_id not in (None, "", "null") else 0,
        "from_date": from_d,
        "to_date": to_d,
    }

    records = exec_raw_sql('D_ADMIN_DASHBOARD_BEST_PERFORMER', qry_vars)
    if records and len(records) > 0:
        best = records[0]
    else:
        best = {
            "name": "-",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
            "deals_closed": 0,
            "calls_made": 0,
            "revenue": "₹0"
        }

    return best


def fetch_admin_dashboard_export_data(user, **filters):
    
    pipeline_id = filters.get("pipeline_id")
    campaign_id = filters.get("campaign_id")
    date_filter = filters.get("date_filter", "Today")
    from_date = filters.get("from_date")
    to_date = filters.get("to_date")

    payments = fetch_dashboard_pending_payments(user, pipeline_id, campaign_id, date_filter, from_date, to_date)
    performance = fetch_dashboard_performance_overview(user, pipeline_id, campaign_id, date_filter, from_date, to_date)
    best_perf = fetch_dashboard_best_performer(user, pipeline_id, campaign_id, date_filter, from_date, to_date)

    return {
        "pending_payments": payments.get("data", []),
        "performance_overview": performance.get("data", []),
        "best_performer": best_perf.get("data", {}),
        "filters": {
            "pipeline_id": pipeline_id,
            "campaign_id": campaign_id,
            "date_filter": date_filter
        }
    }


def generate_admin_dashboard_excel(file_path, dashboard_data, user=None):
    wb = openpyxl.Workbook()

    header_fill = PatternFill(fill_type="solid", fgColor="84C225")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    data_font = Font(name="Calibri", size=10)
    title_font = Font(name="Calibri", size=14, bold=True, color="333333")
    meta_font = Font(name="Calibri", size=10, italic=True, color="666666")
    center_align = Alignment(horizontal="center", vertical="center")
    border = Border(
        left=Side(style="thin", color="D9D9D9"),
        right=Side(style="thin", color="D9D9D9"),
        top=Side(style="thin", color="D9D9D9"),
        bottom=Side(style="thin", color="D9D9D9")
    )

    # 1. Performance Overview Sheet
    ws1 = wb.active
    ws1.title = "Performance Overview"
    ws1.cell(row=1, column=1, value="Admin Dashboard - Performance Overview").font = title_font
    ws1.cell(row=2, column=1, value=f"Generated on {timezone.now().strftime('%d %b %Y, %I:%M %p')}").font = meta_font

    perf_headers = ["ID", "Telecaller", "Total Leads", "Calls Made", "Connected", "Missed Followup", "Conversion", "Rating"]
    for col_idx, h in enumerate(perf_headers, start=1):
        c = ws1.cell(row=4, column=col_idx, value=h)
        c.fill = header_fill
        c.font = header_font
        c.alignment = center_align
        c.border = border

    row_idx = 5
    for row in (dashboard_data.get("performance_overview", []) if isinstance(dashboard_data, dict) else []):
        ws1.row_dimensions[row_idx].height = 22
        vals = [
            row.get("id"), row.get("telecaller"), row.get("total_leads"),
            row.get("calls_made"), row.get("connected"), row.get("missed_followup"),
            row.get("conversion"), row.get("rating")
        ]
        for col_idx, val in enumerate(vals, start=1):
            c = ws1.cell(row=row_idx, column=col_idx, value=val)
            c.font = data_font
            c.alignment = center_align
            c.border = border
        row_idx += 1

    # 2. Pending Payments Sheet
    ws2 = wb.create_sheet(title="Pending Payments")
    ws2.cell(row=1, column=1, value="Admin Dashboard - Pending Payments").font = title_font
    ws2.cell(row=2, column=1, value=f"Generated on {timezone.now().strftime('%d %b %Y, %I:%M %p')}").font = meta_font

    pay_headers = ["ID", "Student Name", "Course", "Amount (₹)", "Due Date", "Status", "Telecaller"]
    for col_idx, h in enumerate(pay_headers, start=1):
        c = ws2.cell(row=4, column=col_idx, value=h)
        c.fill = header_fill
        c.font = header_font
        c.alignment = center_align
        c.border = border

    row_idx = 5
    for row in (dashboard_data.get("pending_payments", []) if isinstance(dashboard_data, dict) else []):
        ws2.row_dimensions[row_idx].height = 22
        vals = [
            row.get("id"), row.get("student_name"), row.get("course"),
            row.get("amount"), row.get("due_date"), row.get("status"), row.get("telecaller")
        ]
        for col_idx, val in enumerate(vals, start=1):
            c = ws2.cell(row=row_idx, column=col_idx, value=val)
            c.font = data_font
            c.alignment = center_align
            c.border = border
        row_idx += 1

    # 3. Best Performer Summary Sheet
    ws3 = wb.create_sheet(title="Best Performer")
    ws3.cell(row=1, column=1, value="Admin Dashboard - Best Performer").font = title_font
    bp = dashboard_data.get("best_performer", {}) if isinstance(dashboard_data, dict) else {}
    bp_data = [
        ("Telecaller Name", bp.get("name")),
        ("Deals Closed", bp.get("deals_closed")),
        ("Calls Made", bp.get("calls_made")),
        ("Total Revenue", bp.get("revenue"))
    ]
    for r_i, (k, v) in enumerate(bp_data, start=4):
        c1 = ws3.cell(row=r_i, column=1, value=k)
        c1.fill = header_fill
        c1.font = header_font
        c1.border = border
        c2 = ws3.cell(row=r_i, column=2, value=v)
        c2.font = data_font
        c2.border = border

    for sheet in [ws1, ws2, ws3]:
        for col in sheet.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            sheet.column_dimensions[get_column_letter(col[0].column)].width = max(max_len + 4, 15)

    wb.save(file_path)

