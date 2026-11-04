from django.contrib import admin
from django.urls import path
from .views.whatsapp_view import WhatsappWebhook
# from .views.user_views import * 
from .views.file_views import *
from .views.dynamic_exprt_excel import *
from .views.dynamic_pdf import *
from .views.daily_report_views import *
from .views.lead_views import *
from .views.payment_views import *
from .views.dashboard_views import *
from .views.target_dashboard_views import FetchDashboardTargetsView, NudgeTelecallerTargetView
from .views.on_demand_views import FetchOnDemandPoolLeadsView, ClaimOnDemandLeadView
from .views.user_setting_views import *
from .views.export_views import *

from adm.views.settings_pipeline_views import FetchPipelineCategoriesView

urlpatterns = [
    path('api/whatsapp/webhook/', WhatsappWebhook.as_view()),
    path('api/whatsapp/webhook', WhatsappWebhook.as_view()),
    path('whatsapp/webhook/', WhatsappWebhook.as_view()),
    # path('admin/', admin.site.urls),  # Already configured in root crm_api/urls.py
    path('get_active_pipelines', FetchPipelineCategoriesView.as_view()),
    # path('get_select_option', GetSelectOption.as_view()), # 🔄 Replaced by /adm/get_select_options
    # path('collection_query', CollectionQueryApi.as_view()), # 🔄 Replaced by /adm/get_select_options
    path('lead_upload_excel', ExcelUpload.as_view()),
    path('lead_preview_excel', PreviewLeadExcel.as_view()),
    path('daily_report_api', DailyReportApi.as_view()),
    # path('add_new_lead', AddNewLead.as_view()), # 🔄 Replaced by /adm/create_lead_api
    path('fetch_pipeline_lead', FetchPipelineLead.as_view()),
    path('fetch_all_leads', FetchAllLeads.as_view()),
    path('fetch_one_lead', FetchOneLead.as_view()),
    path('lookup_lead_number', LookupLeadNumberView.as_view()),
    path('fetch_lead_payment_history', PaymentHistoryApi.as_view()),
    path('fetch_lead_call_history', FetchCallHistoryApi.as_view()),
    path('fetch_one_lead_form', LeadFormDetail.as_view()),
    path('fetch_one_loss_data', FetchOneLossLeadDetail.as_view()),
    path('loss_detail_update', LossLeadUpdateApi.as_view()),
    path('fetch_one_won_data', FetchOneWonLeadDetail.as_view()),
    path('won_detail_update', WonLeadUpdateApi.as_view()),
    path('call_connect_api', CallConnectForm.as_view()),
    path('call_disconncet_api', CallDisconnectForm.as_view()),
    path('fetch_all_payments', FetchAllPayment.as_view()),
    path('payment_details', PaymentDetails.as_view()),
    path('pending_payment_tile', PendingPaymentTiles.as_view()),
    path('dashboard_tile', DashboardTopTile.as_view()),
    path('pipeline_funnel', FetchPipelineFunnel.as_view()),
    path('tele_performance', FetchTelePerformance.as_view()),
    path('fetch_dashboard_targets', FetchDashboardTargetsView.as_view()),
    path('nudge_telecaller', NudgeTelecallerTargetView.as_view()),
    path('fetch_on_demand_pool_leads', FetchOnDemandPoolLeadsView.as_view()),
    path('claim_on_demand_lead', ClaimOnDemandLeadView.as_view()),
    path('add_course', AddCourseDetails.as_view()),
    path('update_course_count', UpdateCourse.as_view()),
    
    path('get_all_settings/', GetAllSettingsApi.as_view()),
    path('notification_api/', NotificationSettingApi.as_view()),
    path('followup_update_api/', FollowUpSettingApi.as_view()),
    path('disconnect_select_tag', CallDisconnectSelectTag.as_view()),
    path('mark_notification_read/', MarkNotificationRead.as_view()),
    path('dashboard/pdf-data/', GetDashboardPDFData.as_view(), name='dashboard-pdf-data'),
    path('daily-report/submit', SubmitDailyReportView.as_view(), name='daily-report-submit'),
]
