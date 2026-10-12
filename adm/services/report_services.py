import math
import json
import re
from rest_framework.exceptions import APIException
from adm.services.query_services import exec_raw_sql
from django.utils import timezone
from adm.models import ReportCatalog, UserRecentReport
from telecalling.models import PipelineStage


def get_pipeline_stage_columns(pipeline_id):
    """Dynamic columns configuration for User Stage Report"""
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
    """Dynamic columns configuration for Campaign Stage Report"""
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
    """Columns specification for Campaign Lead Report"""
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


def fetch_reports_service(search=None):
    qry_vars = {}
    if search and str(search).strip():
        qry_vars['search'] = str(search).strip()

    return exec_raw_sql('D_FETCH_ALL_REPORTS_CATALOG', qry_vars) or []


def execute_report_service(data: dict):
  
    report_key = str(data.get("report_key") or "").strip().lower()
    if not report_key:
        raise APIException("report_key is required.")

    # Normalize report_key: Ensure clean key and ensure query_key matches R_<NAME>_REPORT
    key_clean = report_key if report_key.endswith("_report") else f"{report_key}_report"
    query_key = f"R_{key_clean.upper()}"

    date_filter = str(data.get("date_filter") or "All").strip()
    from_date = str(data.get("from_date") or data.get("start_date") or "").strip()
    to_date = str(data.get("to_date") or data.get("end_date") or "").strip()
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

    qry_vars = {
        "date_filter": date_filter,
        "from_date": from_date,
        "to_date": to_date,
        "start_date": from_date,
        "end_date": to_date,
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

    # Execute single exact CollectionQuery
    rows = exec_raw_sql(query_key, qry_vars) or []

    total_records = int(rows[0]["full_count"]) if rows and "full_count" in rows[0] else len(rows)

    formatted_data = []
    for r in rows:
        row_dict = dict(r)
        row_dict.pop("full_count", None)

        # Format avg_seconds into "MMm SSs" if present
        if "avg_seconds" in row_dict:
            avg_sec = int(row_dict.pop("avg_seconds") or 0)
            mins = avg_sec // 60
            secs = avg_sec % 60
            row_dict["avgCallingTime"] = f"{mins:02d}m {secs:02d}s"

        formatted_data.append(row_dict)

    # 📌 Dynamic Columns Configuration & Stage Unpacking
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

    custom_message = "User Deal Report fetched successfully" if "user_deal" in report_key \
                     else "Campaign Lead Report fetched successfully" if "campaign_lead" in report_key \
                     else "Campaign Stage Report fetched successfully" if "campaign_stage" in report_key \
                     else "Campaign Report fetched successfully" if "campaign" in report_key \
                     else "User Follow Up Report fetched successfully" if "user_followup" in report_key \
                     else "User Stage Report fetched successfully" if "user_stage" in report_key \
                     else "Lead Disposition Report fetched successfully" if "lead_disposition" in report_key \
                     else f"Report '{report_key}' retrieved successfully"

    response_payload = {
        "success": True,
        "message": custom_message,
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
    
    if not user or not getattr(user, 'is_authenticated', False):
        raise APIException("Authentication required to track report view.")

    key_clean = str(report_key or "").strip()
    if not key_clean:
        raise APIException("report_key is required.")

    report_obj = ReportCatalog.objects.filter(report_key__iexact=key_clean).first()
    if not report_obj:
        raise APIException(f"Report catalog with key '{key_clean}' not found.")

    obj, created = UserRecentReport.objects.update_or_create(
        user=user,
        report=report_obj,
        defaults={'viewed_at': timezone.now()}
    )

    return {
        "report_id": report_obj.id,
        "report_key": report_obj.report_key,
        "viewed_at": obj.viewed_at.strftime('%Y-%m-%dT%H:%M:%SZ') if obj.viewed_at else None
    }


def fetch_recently_viewed_reports_service(user, limit=5):
    
    if not user or not getattr(user, 'is_authenticated', False):
        raise APIException("Authentication required to fetch recently viewed reports.")

    recent_objs = UserRecentReport.objects.filter(user=user).select_related('report').order_by('-viewed_at')[:limit]

    reports_data = []
    for item in recent_objs:
        r = item.report
        reports_data.append({
            "id": r.id,
            "name": r.report_name,
            "description": r.description or "",
            "category": r.category or "",
            "reportKey": r.report_key or ""
        })

    return reports_data

