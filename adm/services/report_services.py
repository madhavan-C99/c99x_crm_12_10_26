import math
import json
import re
from datetime import datetime, date, timedelta
try:
    import zoneinfo
    IST_TZ = zoneinfo.ZoneInfo("Asia/Kolkata")
except Exception:
    IST_TZ = None

from rest_framework.exceptions import ValidationError, AuthenticationFailed
from adm.services.query_services import exec_raw_sql
from django.utils import timezone
from adm.models import ReportCatalog, UserRecentReport
from telecalling.models import PipelineStage


def get_pipeline_stage_columns(pipeline_id):
    stage_qs = PipelineStage.objects.filter(is_active=True)
    if pipeline_id not in ["All", "all", "", "none", "null"] and str(pipeline_id).isdigit():
        stage_qs = stage_qs.filter(pipeline_category_id=int(pipeline_id))

    dynamic_cols = []
    seen_slugs = set()
    for s in stage_qs.order_by('order_no', 'id'):
        raw_slug = re.sub(r'[^a-zA-Z0-9_]', '', s.name.lower().replace(' ', '_').replace('-', '_'))
        s_slug = raw_slug
        cnt = 1
        while s_slug in seen_slugs:
            s_slug = f"{raw_slug}_{cnt}"
            cnt += 1
        seen_slugs.add(s_slug)

        color = "#16A34A" if s.stage_type in ['closed_won', 'terminal_joined'] or 'won' in s.name.lower() \
                else "#DC2626" if s.stage_type in ['closed_lost', 'terminal_closed'] or 'loss' in s.name.lower() \
                else "#475569" if 'interested' in s.name.lower() else "#2563EB"

        dynamic_cols.append({
            "field": s_slug,
            "headerName": s.name,
            "align": "center",
            "is_stage": True,
            "color": color
        })

    return [
        {"field": "s_no", "headerName": "No", "align": "center", "is_stage": False},
        {"field": "user_name", "headerName": "User Name", "align": "center", "is_stage": False},
        {"field": "reporting_manager", "headerName": "Reporting Manager", "align": "center", "is_stage": False},
        {"field": "mobile_number", "headerName": "Mobile Number", "align": "center", "is_stage": False},
        {"field": "conversion_percentage", "headerName": "Conversion %", "align": "center", "is_stage": False, "color": "#16A34A"},
        {"field": "total_assigned_leads", "headerName": "Total Assigned Leads", "align": "center", "is_stage": False},
    ] + dynamic_cols


def get_campaign_stage_columns(pipeline_id):
    stage_qs = PipelineStage.objects.filter(is_active=True)
    if pipeline_id not in ["All", "all", "", "none", "null"] and str(pipeline_id).isdigit():
        stage_qs = stage_qs.filter(pipeline_category_id=int(pipeline_id))

    dynamic_cols = []
    seen_slugs = set()
    for s in stage_qs.order_by('order_no', 'id'):
        raw_slug = re.sub(r'[^a-zA-Z0-9_]', '', s.name.lower().replace(' ', '_').replace('-', '_'))
        s_slug = raw_slug
        cnt = 1
        while s_slug in seen_slugs:
            s_slug = f"{raw_slug}_{cnt}"
            cnt += 1
        seen_slugs.add(s_slug)

        color = "#16A34A" if s.stage_type in ['closed_won', 'terminal_joined'] or 'won' in s.name.lower() or 'closed' in s.name.lower() or 'joined' in s.name.lower() or 'conversion' in s.name.lower() \
                else "#DC2626" if s.stage_type in ['closed_lost', 'terminal_closed'] or 'loss' in s.name.lower() \
                else "#2563EB" if 'new' in s.name.lower() \
                else "#475569"

        dynamic_cols.append({
            "field": s_slug,
            "headerName": s.name,
            "align": "center",
            "is_stage": True,
            "color": color
        })

    return [
        {"field": "s_no", "headerName": "No", "align": "center", "is_stage": False},
        {"field": "campaign_name", "headerName": "Campaign", "align": "center", "is_stage": False},
        {"field": "total_leads", "headerName": "Total Leads", "align": "center", "is_stage": False},
        {"field": "total_assigned_leads", "headerName": "Total Assigned Leads", "align": "center", "is_stage": False},
        {"field": "total_unassigned_leads", "headerName": "Total Unassigned Leads", "align": "center", "is_stage": False},
    ] + dynamic_cols


def get_campaign_lead_columns():
    return [
        {"field": "s_no", "headerName": "No", "align": "center", "is_stage": False},
        {"field": "campaign_name", "headerName": "Campaign", "align": "center", "is_stage": False},
        {"field": "total_open_leads", "headerName": "Total Open Leads", "align": "center", "is_stage": False},
        {"field": "total_in_progress_leads", "headerName": "Total In-Progress Lead", "align": "center", "is_stage": True, "color": "#2563EB"},
        {"field": "total_closed_leads", "headerName": "Total Closed Leads", "align": "center", "is_stage": True, "color": "#16A34A"},
        {"field": "total_disconnected_lost_leads", "headerName": "Total Disconnected Lead (Lost)", "align": "center", "is_stage": True, "color": "#DC2626"},
        {"field": "total_disconnected_pending_leads", "headerName": "Total Disconnected (Pending)", "align": "center", "is_stage": True, "color": "#D97706"},
        {"field": "total_connected_converted_leads", "headerName": "Total Connected Leads (Converted/Joined)", "align": "center", "is_stage": True, "color": "#16A34A"},
        {"field": "total_connected_lost_leads", "headerName": "Total Connected Leads (Lost/Closed)", "align": "center", "is_stage": True, "color": "#DC2626"}
    ]


def fetch_reports_service(user, search: str = None):
    qry_vars = {'user_id': user.id}
    if search:
        qry_vars['search'] = str(search).strip()
    return exec_raw_sql('D_FETCH_ALL_REPORTS_CATALOG', qry_vars) or []


def resolve_report_date_range(date_filter_str, from_date_val=None, to_date_val=None, single_date_val=None):
    """
    Parses and calculates the exact start and end dates from date_filter name or direct inputs.
    Returns: (sql_filter, start_date_str, end_date_str, label)
    """
    if IST_TZ:
        today = datetime.now(IST_TZ).date()
    else:
        today = timezone.localdate() if hasattr(timezone, 'localdate') else date.today()

    raw_filter = str(date_filter_str or "").strip()
    raw_from = str(from_date_val or "").strip()
    raw_to = str(to_date_val or "").strip()
    raw_single = str(single_date_val or "").strip()

    def _parse_d(val):
        if not val:
            return None
        if isinstance(val, date):
            return val
        s = str(val)[:10].strip()
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d", "%d/%m/%Y"):
            try:
                return datetime.strptime(s, fmt).date()
            except ValueError:
                continue
        return None

    # Priority 1: String range format "YYYY-MM-DD to YYYY-MM-DD" or "YYYY-MM-DD - YYYY-MM-DD"
    if " to " in raw_filter.lower() or (" - " in raw_filter and len(raw_filter) >= 21):
        delim = " to " if " to " in raw_filter.lower() else " - "
        parts = [p.strip() for p in raw_filter.split(delim, 1)]
        d1, d2 = _parse_d(parts[0]), _parse_d(parts[1])
        if d1 and d2:
            s_min, s_max = min(d1, d2), max(d1, d2)
            return "Custom Date", s_min.strftime("%Y-%m-%d"), s_max.strftime("%Y-%m-%d"), "Custom Date"

    d_from = _parse_d(raw_from)
    d_to = _parse_d(raw_to)
    d_single = _parse_d(raw_single)

    norm_filter = raw_filter.lower().replace("-", "_").replace(" ", "_")

    if norm_filter in ["custom", "custom_date", "customdate"]:
        start = d_from or d_single or today
        end = d_to or d_single or start
        s_min, s_max = min(start, end), max(start, end)
        return "Custom Date", s_min.strftime("%Y-%m-%d"), s_max.strftime("%Y-%m-%d"), "Custom Date"

    if (d_from or d_to) and norm_filter in ["", "all", "none"]:
        start = d_from or d_to
        end = d_to or d_from
        s_min, s_max = min(start, end), max(start, end)
        return "Custom Date", s_min.strftime("%Y-%m-%d"), s_max.strftime("%Y-%m-%d"), "Custom Date"

    if norm_filter in ["today", "daily"]:
        d_str = today.strftime("%Y-%m-%d")
        return "Today", d_str, d_str, "Today"
    elif norm_filter in ["yesterday"]:
        y_str = (today - timedelta(days=1)).strftime("%Y-%m-%d")
        return "Yesterday", y_str, y_str, "Yesterday"
    elif norm_filter in ["last_7_days", "last7days", "7_days", "this_week", "thisweek", "weekly", "week"]:
        start_str = (today - timedelta(days=7)).strftime("%Y-%m-%d")
        end_str = today.strftime("%Y-%m-%d")
        return "Last 7 Days", start_str, end_str, "Last 7 Days"
    elif norm_filter in ["last_30_days", "last30days", "30_days"]:
        start_str = (today - timedelta(days=30)).strftime("%Y-%m-%d")
        end_str = today.strftime("%Y-%m-%d")
        return "Last 30 Days", start_str, end_str, "Last 30 Days"
    elif norm_filter in ["this_month", "thismonth", "month", "monthly"]:
        start_str = today.replace(day=1).strftime("%Y-%m-%d")
        end_str = today.strftime("%Y-%m-%d")
        return "This Month", start_str, end_str, "This Month"
    elif norm_filter in ["last_month", "lastmonth", "previous_month"]:
        last_month_end = today.replace(day=1) - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        return "Custom Date", last_month_start.strftime("%Y-%m-%d"), last_month_end.strftime("%Y-%m-%d"), "Last Month"
    elif norm_filter in ["this_year", "thisyear", "year", "yearly"]:
        start_str = today.replace(month=1, day=1).strftime("%Y-%m-%d")
        end_str = today.strftime("%Y-%m-%d")
        return "Custom Date", start_str, end_str, "This Year"
    elif norm_filter in ["all", "all_time", "overall", "none", ""]:
        return "All", "", "", "All"

    if d_from or d_to:
        start = d_from or d_to
        end = d_to or d_from
        s_min, s_max = min(start, end), max(start, end)
        return "Custom Date", s_min.strftime("%Y-%m-%d"), s_max.strftime("%Y-%m-%d"), "Custom Date"

    return "All", "", "", "All"


def execute_report_service(data: dict = None, user=None, **kwargs):
    """
    Executes raw SQL report or dynamic collection query.
    Supports both direct payload dict and keyword arguments from Django REST view.
    """
    if data is None:
        data = kwargs
    elif isinstance(data, dict):
        data = {**data, **kwargs}
    else:
        data = dict(kwargs)

    user_obj = user or data.get("user")

    report_key = str(data.get("report_key") or "").strip().lower()
    if not report_key:
        raise ValidationError("report_key is required.")

    is_login_report = report_key in ["login_report", "hourly_login_report", "login"]
    if is_login_report:
        query_key = "R_LOGIN_REPORT"
    else:
        key_clean = report_key if report_key.endswith("_report") else f"{report_key}_report"
        query_key = f"R_{key_clean.upper()}"

    raw_date_filter = data.get("date_filter")
    raw_from_date = data.get("from_date") or data.get("start_date") or ""
    raw_to_date = data.get("to_date") or data.get("end_date") or ""
    raw_single_date = data.get("date") or ""

    sql_date_filter, calc_from, calc_to, date_label = resolve_report_date_range(
        raw_date_filter, raw_from_date, raw_to_date, raw_single_date
    )

    search = str(data.get("search") or "").strip()

    raw_user_id = data.get("user_id")
    if raw_user_id is None or str(raw_user_id).strip().lower() in ["", "all", "none", "null", "0"]:
        user_id = "All"
    else:
        user_id = str(raw_user_id).strip()

    reporting_manager = str(data.get("reporting_manager_id") or data.get("reporting_manager") or "All").strip()
    pipeline_id = str(data.get("pipeline_id") or "All").strip()
    campaign_id = str(data.get("campaign_id") or "All").strip()
    campaign_status = str(data.get("campaign_status") or "All").strip()

    try:
        page = max(1, int(data.get("page") or 1))
    except (ValueError, TypeError):
        page = 1

    try:
        limit = max(1, int(data.get("limit") or 50))
    except (ValueError, TypeError):
        limit = 50

    org_id = data.get("organization_id") or getattr(user_obj, "organization_id", None) or 0

    qry_vars = {
        "organization_id": org_id,
        "date_filter": sql_date_filter,
        "date": raw_single_date or calc_from or "",
        "from_date": calc_from if is_login_report else "",
        "to_date": calc_to if is_login_report else "",
        "start_date": calc_from,
        "end_date": calc_to,
        "search": search,
        "user_id": user_id,
        "reporting_manager": reporting_manager,
        "reporting_manager_id": reporting_manager,
        "pipeline_id": pipeline_id,
        "campaign_id": campaign_id,
        "campaign_status": campaign_status,
        "page": page,
        "limit": limit
    }

    # Execute single exact CollectionQuery with fallback for missing report queries
    try:
        rows = exec_raw_sql(query_key, qry_vars) or []
    except Exception as e:
        if query_key in ["R_CAMPAIGN_SOURCE_REPORT", "R_CAMPAIGN_SOURCE"] or "campaign_source" in report_key:
            from telecalling.models import Lead
            from django.db.models import Count, F
            org_id = qry_vars.get("organization_id")
            qs = Lead.objects.all()
            if org_id and str(org_id).isdigit() and int(org_id) > 0:
                qs = qs.filter(organization_id=int(org_id))
            pipe_id = qry_vars.get("pipeline_id")
            if pipe_id and str(pipe_id).isdigit() and int(pipe_id) > 0:
                qs = qs.filter(pipeline_id=int(pipe_id))
            camp_id = qry_vars.get("campaign_id")
            if camp_id and str(camp_id).isdigit() and int(camp_id) > 0:
                qs = qs.filter(campaign_id=int(camp_id))
            if calc_from and calc_to:
                qs = qs.filter(created_at__date__gte=calc_from, created_at__date__lte=calc_to)

            aggregated = list(
                qs.values("campaign__name", "lead_source__name")
                .annotate(
                    total_leads=Count("id"),
                    campaign_name=F("campaign__name"),
                    source_name=F("lead_source__name")
                )
                .order_by("-total_leads")
            )
            rows = []
            for idx, item in enumerate(aggregated, 1):
                rows.append({
                    "s_no": idx,
                    "campaign_name": item.get("campaign_name") or "Unassigned Campaign",
                    "source_name": item.get("source_name") or "Direct / None",
                    "total_leads": item.get("total_leads") or 0,
                    "full_count": len(aggregated)
                })
        else:
            raise

    # Dedicated Response Format for Login & Hourly Report
    if is_login_report:
        row = rows[0] if rows else {}
        summary = row.get("summary") or {
            "total_calls": 0,
            "connected_calls": 0,
            "connected_percent": "0.0%",
            "unconnected_calls": 0,
            "unconnected_percent": "0.0%"
        }
        hourly_data = row.get("hourly_data") or []
        activity_logs = row.get("activity_logs") or []

        if isinstance(summary, str):
            summary = json.loads(summary)
        if isinstance(hourly_data, str):
            hourly_data = json.loads(hourly_data)
        if isinstance(activity_logs, str):
            activity_logs = json.loads(activity_logs)

        return {
            "success": True,
            "message": "Login Report fetched successfully",
            "date_filter": date_label,
            "from_date": calc_from,
            "to_date": calc_to,
            "start_date": calc_from,
            "end_date": calc_to,
            "data": {
                "summary": summary,
                "hourly_data": hourly_data,
                "activity_logs": activity_logs
            }
        }

    total_records = int(rows[0]["full_count"]) if rows and "full_count" in rows[0] else len(rows)

    start_sno = (page - 1) * limit + 1
    formatted_data = []
    for idx, r in enumerate(rows):
        row_dict = dict(r)
        row_dict.pop("full_count", None)
        row_dict["id"] = start_sno + idx
        row_dict["s_no"] = start_sno + idx

        # Format avg_seconds into "MMm SSs" if present
        if "avg_seconds" in row_dict:
            avg_sec = int(row_dict.pop("avg_seconds") or 0)
            mins = avg_sec // 60
            secs = avg_sec % 60
            row_dict["avgCallingTime"] = f"{mins:02d}m {secs:02d}s"

        formatted_data.append(row_dict)

    # Dynamic Columns Configuration & Stage Unpacking
    columns = None
    if "campaign_lead" in report_key:
        columns = get_campaign_lead_columns()
    elif "campaign_stage" in report_key:
        columns = get_campaign_stage_columns(pipeline_id)
        for r in formatted_data:
            stg_counts = r.pop("stage_counts", {})
            if isinstance(stg_counts, str):
                try:
                    stg_counts = json.loads(stg_counts)
                except Exception:
                    stg_counts = {}
            r.update(stg_counts or {})
            for c in columns:
                if c.get("is_stage"):
                    r[c["field"]] = r.get(c["field"], 0)
    elif "user_stage" in report_key:
        columns = get_pipeline_stage_columns(pipeline_id)
        for r in formatted_data:
            stg_counts = r.pop("stage_counts", {})
            if isinstance(stg_counts, str):
                try:
                    stg_counts = json.loads(stg_counts)
                except Exception:
                    stg_counts = {}
            r.update(stg_counts or {})
            for c in columns:
                if c.get("is_stage"):
                    r[c["field"]] = r.get(c["field"], 0)

    total_pages = math.ceil(total_records / limit) if total_records > 0 else 0

    custom_message = (
        "User Deal Report fetched successfully" if "user_deal" in report_key
        else "Campaign Lead Report fetched successfully" if "campaign_lead" in report_key
        else "Campaign Stage Report fetched successfully" if "campaign_stage" in report_key
        else "Campaign Report fetched successfully" if "campaign" in report_key
        else "User Follow Up Report fetched successfully" if "user_followup" in report_key
        else "User Stage Report fetched successfully" if "user_stage" in report_key
        else "Lead Disposition Report fetched successfully" if "lead_disposition" in report_key
        else f"Report '{report_key}' retrieved successfully"
    )

    response_payload = {
        "success": True,
        "message": custom_message,
        "date_filter": date_label,
        "from_date": calc_from,
        "to_date": calc_to,
        "start_date": calc_from,
        "end_date": calc_to,
        "total_records": total_records,
        "total_pages": total_pages,
        "current_page": page,
        "limit": limit,
        "data": formatted_data
    }

    if columns is not None:
        response_payload["columns"] = columns

    return response_payload


def track_report_view_service(user, report_key: str):
    if not report_key:
        raise ValidationError("report_key is required")

    report = ReportCatalog.objects.filter(report_key=report_key).first()
    if not report:
        return {"message": "Report not found in catalog, tracking skipped"}

    now_utc = timezone.now()
    UserRecentReport.objects.update_or_create(
        user=user,
        report=report,
        defaults={'viewed_at': now_utc}
    )

    return {"message": "Report view tracked successfully"}


def fetch_recently_viewed_reports_service(user, limit: int = 5):
    recent_records = UserRecentReport.objects.filter(
        user=user
    ).select_related('report').order_by('-viewed_at')[:limit]

    reports_data = []
    for item in recent_records:
        r = item.report
        local_item_dt = timezone.localtime(item.viewed_at) if item.viewed_at else None

        reports_data.append({
            "id": r.id,
            "report_name": r.report_name,
            "report_key": r.report_key,
            "report_category": r.report_category,
            "route_name": r.route_name,
            "icon": r.icon,
            "viewed_at": local_item_dt.strftime("%d-%m-%Y %I:%M %p") if local_item_dt else None,
            "date": local_item_dt.strftime("%d-%m-%Y") if local_item_dt else None,
            "time": local_item_dt.strftime("%I:%M %p") if local_item_dt else None
        })

    return reports_data
