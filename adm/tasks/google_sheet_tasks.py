"""
========================================================================================
📌 LEGACY GOOGLE SHEETS POLLING TASK (COMMENTED OUT / ARCHIVED)
========================================================================================
Notice: Direct Apps Script webhook integration is active (adm/views/google_form_views.py).
Periodic polling task is commented out to prevent background overhead.
========================================================================================

from huey import crontab
from huey.contrib.djhuey import db_periodic_task
from adm.models.google_sheet_models import GoogleSheetConnection
from adm.services.google_sheet_services import sync_single_google_sheet_connection
import logging

logger = logging.getLogger(__name__)


# @db_periodic_task(crontab(minute='*/1'))
# def sync_active_google_sheets_task():
#     connections = GoogleSheetConnection.objects.filter(status="active").select_related("google_account", "campaign", "pipeline")
#     for conn in connections:
#         try:
#             synced = sync_single_google_sheet_connection(conn)
#             if synced > 0:
#                 logger.info(f"Successfully synced {synced} leads from Sheet: {conn.spreadsheet_name}")
#         except Exception as e:
#             logger.error(f"Error syncing Google Sheet {conn.id}: {e}")
"""
