import os
import uuid
import logging
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from huey.contrib.djhuey import task
from adm.models.export_log import ExportLog
from adm.models.user import User
from adm.services.admin_dashboard_services import trigger_dashboard_update

logger = logging.getLogger('django')


@task()
def trigger_dashboard_update_task():
    try:
        trigger_dashboard_update()
    except Exception as e:
        logger.error(f"trigger_dashboard_update_task failed: {str(e)}", exc_info=True)

@task()
def run_export_generation(export_id, user_id, report_key, file_format, columns, filters):
    import adm.services.generic_export_services as export_services

    log = ExportLog.objects.filter(id=export_id).first()
    if not log:
        return

    user = User.objects.filter(id=user_id).first()
    if not user:
        log.status = "failed"
        log.error_message = f"User with ID {user_id} not found"
        log.save(update_fields=['status', 'error_message', 'updated_at'])
        return

    try:
        log.status = "processing"
        log.save(update_fields=['status', 'updated_at'])

        # 1. Fetch Records (No Limit)
        CORE_ENTITIES = [
            "leads",
            "pending_payments",
            "loss_approvals",
            "performance",
            "admin_dashboard",
            "telecalling_dashboard",
            "daily_report"
        ]

        clean_key = str(report_key or "").strip().lower().replace("-", "_")
        if clean_key == "lead":
            clean_key = "leads"
        elif clean_key in ["pending_payment", "payments", "payment"]:
            clean_key = "pending_payments"
        elif clean_key in ["loss_approval", "loss"]:
            clean_key = "loss_approvals"
        elif clean_key in ["telecaller_performance", "performance_overview"]:
            clean_key = "performance"
        elif clean_key == "dashboard":
            clean_key = "telecalling_dashboard"

        target_entity = clean_key if clean_key in CORE_ENTITIES else "reports"
        raw_rows = export_services.fetch_export_records(target_entity, user, {**filters, "report_key": report_key})

        if not raw_rows:
            log.status = "failed"
            log.error_message = "No data found for the selected filters"
            log.save(update_fields=['status', 'error_message', 'updated_at'])
            return

        # 2. Columns selection (supports both dict elements and string field names)
        if columns:
            export_cols = [
                c.get("field") if isinstance(c, dict) else str(c).strip()
                for c in columns
                if (isinstance(c, dict) and c.get("field")) or (isinstance(c, str) and str(c).strip())
            ]
        elif isinstance(raw_rows, list) and raw_rows:
            export_cols = list(raw_rows[0].keys())
        elif isinstance(raw_rows, dict):
            export_cols = list(raw_rows.keys())
        else:
            export_cols = []

        if not export_cols:
            if isinstance(raw_rows, list) and raw_rows:
                export_cols = list(raw_rows[0].keys())
            elif isinstance(raw_rows, dict):
                export_cols = list(raw_rows.keys())
            else:
                export_cols = []

        # 3. Create File on Disk
        media_export_dir = os.path.join(settings.MEDIA_ROOT, 'exports')
        os.makedirs(media_export_dir, exist_ok=True)
        today_str = datetime.now().strftime('%Y-%m-%d')
        filename = f"{report_key}_{today_str}_{uuid.uuid4().hex[:6]}.{file_format}"
        file_path = os.path.join(media_export_dir, filename)

        report_display = log.report_type or export_services.REPORT_DISPLAY_NAMES.get(report_key, report_key.replace('_', ' ').title())
        desc = f"All in one {report_display.lower()}"

        if file_format == "xlsx":
            export_services.generate_excel_file(
                file_path,
                export_cols,
                raw_rows,
                report_name=report_display,
                description=desc,
                user=user
            )
        elif file_format == "csv":
            export_services.generate_csv_file(
                file_path,
                export_cols,
                raw_rows,
                report_name=report_display,
                description=desc,
                user=user
            )
        elif file_format == "pdf":
            from utils.pdf import SPECIALIZED_PDF_GENERATORS
            if report_key in SPECIALIZED_PDF_GENERATORS:
                SPECIALIZED_PDF_GENERATORS[report_key](file_path, raw_rows, user=user)
            else:
                export_services.generate_pdf_file(
                    file_path,
                    export_cols,
                    raw_rows,
                    report_title=report_display,
                    report_name=report_display,
                    description=desc,
                    user=user
                )
        else:
            export_services.generate_excel_file(
                file_path,
                export_cols,
                raw_rows,
                report_name=report_display,
                description=desc,
                user=user
            )

        # 4. Update status to completed & set download_url (7 days expiry)
        log.status = "completed"
        log.file_path = file_path
        log.file_name = filename
        log.download_url = f"{settings.MEDIA_URL}exports/{filename}"
        log.expires_at = timezone.now() + timedelta(days=7)
        log.save(update_fields=['status', 'file_path', 'file_name', 'download_url', 'expires_at', 'updated_at'])

    except Exception as e:
        logger.error(f"Export job {export_id} failed: {str(e)}", exc_info=True)
        log.status = "failed"
        log.error_message = str(e)
        log.save(update_fields=['status', 'error_message', 'updated_at'])


@task()
def process_export_task(export_id, user_id, report_key, file_format, columns, filters):
    
    try:
        run_export_generation(export_id, user_id, report_key, file_format, columns, filters)
    except Exception as e:
        logger.error(f"process_export_task unhandled error for export_id={export_id}: {str(e)}", exc_info=True)
        try:
            log = ExportLog.objects.filter(id=export_id).first()
            if log and log.status != "completed":
                log.status = "failed"
                log.error_message = f"Task error: {str(e)}"
                log.save(update_fields=['status', 'error_message', 'updated_at'])
        except Exception:
            pass
