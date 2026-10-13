import os
import uuid
import logging
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from huey.contrib.djhuey import task
from adm.models.export_log import ExportLog
from adm.models.user import User
import adm.services.generic_export_services as export_services

logger = logging.getLogger('django')


def run_export_generation(export_id, user_id, report_key, file_format, columns, filters):
    
    log = ExportLog.objects.filter(id=export_id).first()
    user = User.objects.filter(id=user_id).first()
    if not log or not user:
        return

    try:
        log.status = "processing"
        log.save(update_fields=['status', 'updated_at'])

        # 1. Fetch Records (No Limit)
        raw_rows = export_services.fetch_export_records("reports", user, {**filters, "report_key": report_key})

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
        else:
            export_cols = list(raw_rows[0].keys())

        if not export_cols:
            export_cols = list(raw_rows[0].keys())

        # 3. Create File on Disk
        media_export_dir = os.path.join(settings.MEDIA_ROOT, 'exports')
        os.makedirs(media_export_dir, exist_ok=True)
        today_str = datetime.now().strftime('%Y-%m-%d')
        filename = f"{report_key}_{today_str}_{uuid.uuid4().hex[:6]}.{file_format}"
        file_path = os.path.join(media_export_dir, filename)

        if file_format == "xlsx":
            export_services.generate_excel_file(file_path, export_cols, raw_rows)
        elif file_format == "csv":
            export_services.generate_csv_file(file_path, export_cols, raw_rows)
        elif file_format == "pdf":
            export_services.generate_pdf_file(file_path, export_cols, raw_rows, log.report_type)
        else:
            export_services.generate_excel_file(file_path, export_cols, raw_rows)

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
    
    run_export_generation(export_id, user_id, report_key, file_format, columns, filters)
