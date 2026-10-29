from django.urls import path, re_path
from .views.team_views import *
from .views.organization_views import *
from .views.lead_views import *
from .views.payment_views import *
from .views.loss_lead_approval_views import *
from .views.performance_views import *
from .views.permission_views import *
from .views.query_views import *
from .views.user_views import *
from .views.loss_reason_views import *
from .views.settings_pipeline_views import *
from .views.campaign_stats_views import *
from .views.enquiry_sheet_views import *
from .views.campaign_management_views import *
from .views.add_new_lead_views import *
from .views.generic_engine_views import *
from .views.lead_import_views import *
from .views.course_views import *
from .views.report_views import *
from .views.admin_dashboard_views import *
from .views.session_views import *
from .views.token_views import *
from .views.meta_webhook_views import *
from .views.google_sheet_webhook_views import *
from .views.facebook_integration_views import *
# from .views.google_sheet_integration_views import *  # (Legacy Google Sheets OAuth - Commented Out)
from .views.google_form_views import *
from .views.whatsapp_sync_views import *

urlpatterns = [
    
    # 📌 Meta (Facebook & Instagram) Lead Ads Webhook
    path('webhook/meta_lead', MetaLeadWebhookAPIView.as_view()),
    
    # 📌 Google Sheet / Website Enquiry Webhook
    path('webhook/google_sheet_lead', GoogleSheetLeadWebhookAPIView.as_view()),
    
    # 📌 FACEBOOK & INSTAGRAM LEAD ADS (Multi-Tenant Architecture)
    path('fetch_fb_pipelines_admin', FetchCRMPipelinesAdminView.as_view()),
    path('fetch_fb_campaigns_admin', FetchCRMCampaignsAdminView.as_view()),
    path('fetch_fb_fields_admin', FetchCRMFieldsAdminView.as_view()),
    path('fb_oauth_start_admin', FBOAuthStartAdminView.as_view()),
    path('fb_oauth_callback', FBOAuthCallbackView.as_view()),
    path('fetch_fb_pages_admin', FetchFBPagesAdminView.as_view()),
    path('fetch_fb_forms_admin', FetchFBFormsAdminView.as_view()),

    # 🔗 Frontend Core Integration Endpoints
    path('integrations/facebook/create_connection', CreateFBConnectionAdminView.as_view()),
    path('integrations/facebook/connections', FetchFBConnectionsAdminView.as_view()),
    path('integrations/facebook/delete_connection', DeleteFBConnectionAdminView.as_view()),

    # 📌 LEGACY GOOGLE SHEETS OAUTH (Commented Out - Replaced by Google Forms Apps Script)
    # path('integrations_google_oauth_start', GoogleOAuthStartView.as_view()),
    # path('integrations_google_oauth_callback', GoogleOAuthCallbackView.as_view()),
    # path('integrations_google_spreadsheets', FetchGoogleSpreadsheetsView.as_view()),
    # path('integrations_google_sheet_details', FetchGoogleSheetDetailsView.as_view()),
    # path('integrations_google_create_connection', CreateGoogleSheetConnectionView.as_view()),
    # path('integrations_google_connections', FetchGoogleSheetConnectionsView.as_view()),
    # path('integrations_google_delete_connection', DeleteGoogleSheetConnectionView.as_view()),

    # 📊 Google Sheets Separate APIs (SpreadsheetApp Sync)
    path('create_google_sheet_connection', CreateGoogleSheetConnectionAdminView.as_view()),
    path('fetch_google_sheet_connections', FetchGoogleSheetConnectionsAdminView.as_view()),
    path('delete_google_sheet_connection', DeleteGoogleSheetConnectionAdminView.as_view()),

    # 📝 Google Forms Separate APIs (Pure FormApp - Zero Sheet Needed)
    path('create_google_form_connection', CreateGoogleFormConnectionAdminView.as_view()),
    path('fetch_google_form_connections', FetchGoogleFormConnectionsAdminView.as_view()),
    path('delete_google_form_connection', DeleteGoogleFormConnectionAdminView.as_view()),
    path('webhook/google_forms/<str:uid>', GoogleFormLeadWebhookView.as_view()),

    # 📱 WhatsApp Lead Sync Integration Endpoints
    path('create_whatsapp_connection_admin', CreateWhatsAppConnectionAdminView.as_view()),
    path('fetch_whatsapp_connections_admin', FetchWhatsAppConnectionsAdminView.as_view()),
    path('delete_whatsapp_connection_admin', DeleteWhatsAppConnectionAdminView.as_view()),
    path('whatsapp_connect/<str:token>/config', WhatsAppConnectConfigView.as_view()),
    path('whatsapp_connect/<str:token>/leads', WhatsAppConnectLeadsView.as_view()),
    path('whatsapp_check_permission', WhatsAppCheckPermissionView.as_view()),
    path('whatsapp_by_phone', WhatsAppByPhoneView.as_view()),
    path('whatsapp_backend_filter_import', WhatsAppBackendFilterImportView.as_view()),


    
    # 📌 Admin Dashboard Collection Query APIs
    path('dashboard_pending_payments', DashboardPendingPaymentsApi.as_view()),
    path('dashboard_performance_overview', DashboardPerformanceOverviewApi.as_view()),
    path('dashboard_best_performer', DashboardBestPerformerApi.as_view()),

    
    # 🚀 Generic Engines
    path('export_data_api', ExportDataApi.as_view()),
    path('export_logs', ExportLogsApi.as_view()),
    path('export_download', ExportDownloadApi.as_view()),
    path('get_select_options', GetSelectOptions.as_view()),
    path('create_lead_api', CreateLeadApi.as_view()),
    path('get_roles_and_permissions', GetRolesAndPermissionsApi.as_view()),


    # 📌 Report Management APIs
    path('fetch_reports', FetchReportsApi.as_view()),
    path('execute_reports', ExecuteReportApi.as_view()),
    path('reports_track_view', TrackReportViewApi.as_view()),
    path('reports_recently_viewed', FetchRecentlyViewedReportsApi.as_view()),
  
    
    # 📌 Course Management APIs
    path('fetch_courses_sidebar_admin', FetchCoursesSidebarApi.as_view()),
    path('fetch_course_details_admin', FetchCourseDetailsApi.as_view()),
    path('create_courses', CreateCourseApi.as_view()),
    path('edit_courses', EditCourseApi.as_view()),
    path('delete_course_admin', DeleteCourseAdminApi.as_view()),

    path('create_course_plan_admin', CreateCoursePlanAdminApi.as_view()),
    path('edit_plans', EditPlanApi.as_view()),
    path('delete_course_plan_admin', DeleteCoursePlanAdminApi.as_view()),
    
    path('create_batches', CreateBatchApi.as_view()),
    path('edit_batches', EditBatchApi.as_view()),
    path('edit_course_batch_admin', EditCourseBatchAdminApi.as_view()),
    path('delete_course_batch_admin', DeleteCourseBatchAdminApi.as_view()),
  
    
    # 📌 User Management Settings APIs
    path('fetch_users_admin', FetchAllUsersAdminApi.as_view()),
    path('create_user_admin', CreateUserAdminApi.as_view()),
    path('edit_user_admin', EditUserAdminApi.as_view()),
    path('toggle_user_status_admin', ToggleUserStatusAdminApi.as_view()),
    path('change_user_password_admin', ChangeUserPasswordAdminApi.as_view()),
    path('enable_disable_lead_assignment_admin', EnableDisableLeadAssignmentAdminApi.as_view()),
    path('transfer_leads_admin', TransferLeadsAdminApi.as_view()),
    path('delete_user_admin', DeleteUserAdminApi.as_view()),
    path('fetch_user_campaigns_admin', FetchUserCampaignsAdminApi.as_view()),
    path('get_user_transfer_campaigns_admin', FetchUserTransferCampaignsAdminApi.as_view()),
    path('fetch_transfer_telecallers_admin', FetchTransferTelecallersAdminApi.as_view()),
    path('transfer_single_campaign_leads_admin', TransferSingleCampaignLeadsAdminApi.as_view()),
    path('transfer_all_campaigns_leads_admin', TransferAllCampaignsLeadsAdminApi.as_view()),
    path('fetch_user_delete_summary_admin', FetchUserDeleteSummaryAdminApi.as_view()),


    # 📌 Lead Management APIs
    path('fetch_all_leads_admin', FetchAllLeadsAdmin.as_view()),
    path('add_new_lead_admin', AddNewLeadAdmin.as_view()),
    path('upload_lead_excel_admin', UploadLeadExcelAdmin.as_view()),
    path('fetch_pipeline_leads_admin', FetchPipelineLeadsAdmin.as_view()),
    path('fetch_lead_details_admin', FetchLeadDetailsAdmin.as_view()),
    path('get_mark_as_won_info_admin', GetMarkAsWonInfoAdmin.as_view()),
    path('mark_as_won_admin', MarkAsWonAdmin.as_view()),
    path('get_mark_as_lost_info_admin', GetMarkAsLostInfoAdmin.as_view()),
    path('mark_as_lost_admin', MarkAsLostAdmin.as_view()),
    path('edit_lead_admin', EditLeadAdmin.as_view()),
    path('delete_lead_admin', DeleteLeadAdmin.as_view()),
    path('reassign_lead_admin', ReassignLeadAdmin.as_view()),
    path('verify_lead_import', VerifyLeadImportView.as_view()),
    path('submit_lead_import', SubmitLeadImportView.as_view()),
    path('fetch_one_telecalling_user', FetchOneUserTelecallingApi.as_view()),
  
    
    # 📌 Pending Payments APIs
    path('fetch_all_pending_payments_admin', FetchAllPendingPaymentsAdmin.as_view()),


    # 📌 Loss Lead Approval Request APIs
    path('fetch_loss_lead_approval_requests_admin', FetchLossLeadApprovalRequestsAdmin.as_view()),
    path('export_loss_lead_approval_requests_admin', ExportLossLeadApprovalRequestsAdmin.as_view()),
    path('action_loss_lead_approval_admin', ActionLossLeadApprovalAdmin.as_view()),


    # 📌 Performance Overview APIs
    path('fetch_performance_overview_admin', FetchPerformanceOverviewAdmin.as_view()),
    path('fetch_monthly_target_admin', FetchMonthlyTargetAdmin.as_view()),
    path('fetch_target_dropdowns_admin', FetchTargetDropdownsAdmin.as_view()),
    path('set_monthly_target_admin', SetMonthlyTargetAdmin.as_view()),
    path('assign_users_to_team_admin', AssignUsersToTeamAdmin.as_view()),
    path('update_telecaller_target_admin', UpdateTelecallerTargetAdmin.as_view()),
  
    
    # 📌 Role & Permission Management APIs
    path('perm_add', AddPermAPIView.as_view()),
    path('perm_list', FetchPermsListAPIView.as_view()),
    path('role_list', FetchRolesListAPIView.as_view()),
    path('role_assign_perm', AssignRolePermAPIView.as_view()),
    path('update_role_permission', UpdateRolePermissionApi.as_view()),
    
    
    # 📌 User Authentication APIs
    path('create_token', CreateToken.as_view()),
    path('api_token_refresh', RefreshTokenView.as_view()),
    path('api_user_permissions', FetchUserPermissionsView.as_view()),
    path('create_user', CreateUserView.as_view()),
    
    
    # 📌 Campaign Analytics & Enquiry Sheet
    path('campaign_stats_tile', EducationPipelineStats.as_view()),
    path('campaign_cards_tile', CampaignCardsList.as_view()),
    path('campaign_enquiry_sheet', CampaignEnquirySheetView.as_view()),
    path('lead_summary_report', LeadSummaryReportView.as_view()),
    path('update_lead_summary', UpdateLeadSummaryView.as_view()),
    path('delete_lead_summary', DeleteLeadSummaryView.as_view()),
    path('move_lead_campaign', MoveLeadCampaignView.as_view()),
    path('assign_lead_telecaller', AssignLeadTelecallerView.as_view()),
    path('change_lead_status', ChangeLeadStatusView.as_view()),
    path('call_log_report', CallLogReportView.as_view()),
    path('disposition_log_report', DispositionLogView.as_view()),
    path('create_campaign', CreateCampaignView.as_view()),
    path('toggle_campaign_status', ToggleCampaignStatusView.as_view()),
    path('get_campaign_detail', FetchCampaignDetailView.as_view()),
    path('update_campaign_detail', UpdateCampaignDetailView.as_view()),
    path('delete_campaign', DeleteCampaignView.as_view()),


    # 📌 Team Management APIs
    path('fetch_all_teams_admin', FetchAllTeamsAdminApi.as_view()),
    path('create_team_admin', CreateTeamAdminApi.as_view()),
    path('edit_team_admin', EditTeamAdminApi.as_view()),
    path('delete_team_admin', DeleteTeamAdminApi.as_view()),


    # 📌 Organization APIs
    path('create_organization_profile_admin', CreateOrganizationProfileAdminApi.as_view()),
    path('get_organization_profile_admin', GetOrganizationProfileAdminApi.as_view()),
    path('edit_organization_profile_admin', EditOrganizationProfileAdminApi.as_view()),


    # 📌 Loss Reasons Management APIs
    path('fetch_loss_reasons_admin', FetchLossReasonsAdminApi.as_view()),
    path('create_loss_reason_admin', CreateLossReasonAdminApi.as_view()),
    path('update_loss_reason_admin', UpdateLossReasonAdminApi.as_view()),
    path('get_loss_reasons_admin', GetLossReasonsAdminApi.as_view()),
    path('add_loss_reason_admin', AddLossReasonAdminApi.as_view()),
    path('delete_loss_reason_admin', DeleteLossReasonAdminApi.as_view()),
    

    # 📌 Dedicated Settings Pipeline APIs
    path('settings_pipeline_categories', FetchPipelineCategoriesView.as_view()),
    path('settings_create_pipeline_category', CreatePipelineCategoryView.as_view()),
    path('settings_update_pipeline_stages', UpdatePipelineStagesView.as_view()),
    path('settings_check_stage_leads', CheckStageLeadsView.as_view()),
    path('settings_delete_pipeline_stage', TransferPipelineStageDataView.as_view()),
    path('settings_transfer_pipeline_stage_data', TransferPipelineStageDataView.as_view()),
    path('settings_check_tag_leads', CheckTagLeadsView.as_view()),
    path('settings_delete_tag', TransferPipelineTagDataView.as_view()),
    path('settings_transfer_pipeline_tag_data', TransferPipelineTagDataView.as_view()),
    path('settings_pipeline_stage_tranfered_data', FetchPipelineStageTranferedDataView.as_view()),
    path('get_pipeline_categories', FetchPipelineCategoriesView.as_view()),
    path('create_pipeline_category', CreatePipelineCategoryView.as_view()),
    
    # 📌 Session Management APIs
    path("sessions/", SessionListView.as_view()),
    path("sessions/<int:session_id>/logout/", SessionLogoutView.as_view()),
    path("sessions/logout-others/", LogoutOtherSessionsView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("token/refresh/", SessionTokenRefreshView.as_view()),
]