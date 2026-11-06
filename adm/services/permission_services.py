from django.db import models, transaction
from rest_framework.exceptions import PermissionDenied, APIException, ValidationError
from adm.models import Perm, PermGroup, Role, UserRole
import logging

logger = logging.getLogger('django')


# 1. UNIVERSAL BASE UTILITIES (11 APIs - Auto-Granted to all authenticated users)
UNIVERSAL_BASE_APIS = {
    'api_notification_api',
    'api_mark_notification_read',
    'api_tw_fa_api',
    'api_caller_setting_api',
    'api_lead_preference_api',
    'api_coursename',
    'api_get_all_settings_api',
    'api_get_select_option',
    'api_get_selected_option',
    'api_filter_options_view_admin',
    'api_get_filter_dropdowns_admin',
    'api_fetch_one_user_admin',
    'api_fetch_one_telecalling_user',
    'api_fetch_dashboard_targets',
    'api_fetch_on_demand_pool_leads',
    'api_claim_on_demand_lead',
    'api_upload_call_recording',
    'api_delete_call_recording',
    'api_call_disconnect_form',
    'api_call_disconnect_select_tag',
}

# 2. SUPER ADMIN & DEVELOPER UTILITIES (9 APIs - DEV/SuperAdmin Only)
DEV_ONLY_APIS = {
    'api_collection_query',
    'api_add_perm',
    'api_fetch_perms_list',
    'api_fetch_roles_list',
    'api_assign_role_perm',
    'api_testing_notifiy',
    'api_whatsapp_webhook',
    'api_export_column',
    'api_export_json_data',
}

# 3. 36 GRANULAR BUSINESS FEATURES BUNDLING ENGINE (121 Business APIs)
FEATURE_BUNDLES = {
    # Module 1: Lead Management (11 Features, 39 APIs)
    "feat_lead_view": [
        "api_fetch_all_leads_admin", "api_fetch_all_leads", "api_fetch_lead_details_admin",
        "api_fetch_one_lead", "api_lead_summary_report_admin", "api_lead_form_detail",
        "api_dashboard_top_tile", "api_get_dashboard_p_d_f_data"
    ],
    "feat_lead_add": [
        "api_add_new_lead_admin", "api_add_new_lead",
        "api_lead_mgmt_add_new_lead_admin", "api_lead_mgmt_add_dropdowns_admin"
    ],
    "feat_lead_edit": [
        "api_edit_lead_admin", "api_update_lead_summary_admin", "api_followup_update_api"
    ],
    "feat_lead_mark_won": [
        "api_mark_as_won_admin", "api_won_lead_update_api", "api_fetch_one_won_lead_detail",
        "api_get_mark_as_won_info_admin"
    ],
    "feat_lead_mark_lost": [
        "api_mark_as_lost_admin", "api_loss_lead_update_api", "api_fetch_one_loss_lead_detail",
        "api_get_mark_as_lost_info_admin"
    ],
    "feat_lead_delete": [
        "api_delete_lead_admin", "api_delete_lead_summary_admin"
    ],
    "feat_lead_reassign": [
        "api_reassign_lead_admin", "api_transfer_leads_admin",
        "api_assign_lead_telecaller_admin", "api_fetch_transfer_telecallers_admin"
    ],
    "feat_lead_auto_allocation": [
        "api_toggle_lead_assignment_admin", "api_enable_disable_lead_assignment_admin"
    ],
    "feat_lead_import": [
        "api_upload_lead_excel_admin", "api_excel_upload",
        "api_preview_lead_excel", "api_verify_lead_import", "api_submit_lead_import"
    ],
    "feat_lead_export": [
        "api_export_all_leads_admin", "api_dynamic_export_excel"
    ],
    "feat_lead_loss_approvals": [
        "api_fetch_loss_lead_approval_requests_admin", "api_get_loss_lead_approval_filter_dropdowns_admin",
        "api_export_loss_lead_approval_requests_admin", "api_action_loss_lead_approval_admin"
    ],

    # Module 2: User & Team Management (9 Features, 30 APIs)
    "feat_staff_roster": [
        "api_fetch_all_users_admin", "api_fetch_user_dropdowns_admin", "api_fetch_one_user_admin",
        "api_fetch_user_campaigns_admin", "api_fetch_user_transfer_campaigns_admin"
    ],
    "feat_staff_create_edit": [
        "api_create_user_admin", "api_create_user", "api_edit_user_admin"
    ],
    "feat_staff_password": [
        "api_change_user_password_admin"
    ],
    "feat_staff_deactivate_delete": [
        "api_toggle_user_status_admin", "api_delete_user_admin", "api_fetch_user_delete_summary_admin"
    ],
    "feat_team_organization": [
        "api_fetch_all_teams_admin", "api_create_team_admin", "api_edit_team_admin",
        "api_delete_team_admin", "api_fetch_team_dropdowns_admin"
    ],
    "feat_team_assignment": [
        "api_assign_users_to_team_admin"
    ],
    "feat_target_allocation": [
        "api_set_monthly_target_admin", "api_fetch_monthly_target_admin",
        "api_fetch_target_dropdowns_admin", "api_update_telecaller_target_admin"
    ],
    "feat_loss_reasons": [
        "api_fetch_loss_reasons_admin", "api_create_loss_reason_admin", "api_update_loss_reason_admin",
        "api_get_loss_reasons_admin", "api_add_loss_reason_admin", "api_delete_loss_reason_admin"
    ],
    "feat_roles_matrix": [
        "api_create_role", "api_get_roles_and_permissions", "api_update_role_permission"
    ],

    # Module 3: Reports & Analytics (6 Features, 22 APIs)
    "feat_exec_dashboard": [
        "api_admin_dashboard"
    ],
    "feat_call_logs": [
        "api_call_log_report_admin", "api_disposition_log_admin", "api_fetch_call_history_api",
        "api_call_connect_form", "api_call_disconnect_form", "api_call_disconnect_select_tag",
        "api_upload_call_recording", "api_delete_call_recording"
    ],
    "feat_dcr_reports": [
        "api_daily_report_api", "api_submit_daily_report_view", "api_download_daily_report_view",
        "api_fetch_reports_admin", "api_execute_report_admin"
    ],
    "feat_team_performance": [
        "api_fetch_performance_overview_admin", "api_get_performance_filter_dropdowns_admin",
        "api_export_performance_overview_admin", "api_fetch_tele_performance"
    ],
    "feat_payments_view": [
        "api_get_pending_payment_filter_dropdowns_admin", "api_fetch_all_pending_payments_admin",
        "api_fetch_all_payment", "api_pending_payment_tiles", "api_payment_history_api"
    ],
    "feat_payments_collect": [
        "api_export_pending_payments_admin", "api_payment_details", "api_dynamic_pdf_genrate"
    ],

    # Module 4: Organization Settings (4 Features, 9 APIs)
    "feat_org_profile": [
        "api_get_organization_profile_admin", "api_create_organization_profile_admin",
        "api_edit_organization_profile_admin"
    ],
    "feat_curriculum": [
        "api_add_course", "api_update_course",
        "api_create_course", "api_edit_course", "api_delete_course",
        "api_create_batch", "api_edit_batch", "api_edit_course_batch", "api_delete_course_batch",
        "api_create_course_plan", "api_edit_plan", "api_delete_course_plan"
    ],
    "feat_dropdowns_master": [
        "api_create_dropdown_sub", "api_dropdown_cate_create"
    ],
    "feat_communication_templates": [
        "api_message_Setting_api", "api_notes_setting_api"
    ],
    "feat_integrations_manage": [
        "api_integrations_facebook", "api_integrations_google", "api_integrations_whatsapp"
    ],

    # Module 5: Campaign Management (4 Features, 12 APIs)
    "feat_campaign_cards": [
        "api_campaign_cards_list_admin", "api_campaign_enquiry_sheet_admin",
        "api_fetch_campaign_detail_admin", "api_campaign_managers_admin", "api_campaign_agents_admin",
        "api_disposition_log_report_admin"
    ],
    "feat_campaign_manage": [
        "api_create_campaign_admin", "api_update_campaign_detail_admin", "api_toggle_campaign_status_admin"
    ],
    "feat_campaign_delete": [
        "api_delete_campaign_admin"
    ],
    "feat_campaign_migration": [
        "api_move_lead_campaign_admin", "api_transfer_single_campaign_leads_admin",
        "api_transfer_all_campaigns_leads_admin"
    ],

    # Module 6: Pipeline Management (2 Features, 6 APIs)
    "feat_pipeline_kanban": [
        "api_fetch_pipeline_leads_admin", "api_fetch_pipeline_lead", "api_fetch_pipeline_funnel",
        "api_education_pipeline_stats_admin", "api_change_lead_status_admin"
    ],
    "feat_pipeline_categories": [
        "api_pipeline_categories_admin"
    ],

    # Legacy Backward-Compatibility Aliases
    "feat_staff_manage": [
        "api_create_user_admin", "api_create_user", "api_edit_user_admin",
        "api_toggle_user_status_admin", "api_change_user_password_admin",
        "api_delete_user_admin", "api_fetch_user_delete_summary_admin"
    ],
    "feat_payments_collection": [
        "api_get_pending_payment_filter_dropdowns_admin", "api_fetch_all_pending_payments_admin",
        "api_export_pending_payments_admin", "api_fetch_all_payment", "api_pending_payment_tiles",
        "api_payment_details", "api_payment_history_api", "api_dynamic_pdf_genrate"
    ],
    "feat_dropdowns_templates": [
        "api_create_dropdown_sub", "api_dropdown_cate_create", "api_message_Setting_api", "api_notes_setting_api"
    ]
}

# User-Friendly Action Names for APIs (Translating technical API codes into intuitive UI action names)
USER_FRIENDLY_API_NAMES = {
    # Lead Management Actions
    "api_fetch_all_leads_admin": "View All Leads Directory",
    "api_fetch_all_leads": "Search & Filter Leads",
    "api_fetch_lead_details_admin": "View Full Lead Profile & History",
    "api_fetch_one_lead": "Quick View Lead Details",
    "api_lead_summary_report_admin": "View Lead Summary Reports",
    "api_lead_form_detail": "View Lead Form Details",
    "api_dashboard_top_tile": "View Lead Metric Dashboard Tiles",
    "api_get_dashboard_p_d_f_data": "Download Dashboard Summary PDF",
    "api_add_new_lead_admin": "Create New Lead (Admin)",
    "api_add_new_lead": "Add Walk-in / Inbound Lead",
    "api_lead_mgmt_add_new_lead_admin": "Submit New Lead Form",
    "api_lead_mgmt_add_dropdowns_admin": "Load Lead Creation Form Options",
    "api_edit_lead_admin": "Edit Lead Contact Information",
    "api_update_lead_summary_admin": "Update Lead Status & Notes",
    "api_followup_update_api": "Schedule & Update Follow-up Reminders",
    "api_mark_as_won_admin": "Mark Lead as Won (Admission)",
    "api_won_lead_update_api": "Update Won Deal & Fee Details",
    "api_fetch_one_won_lead_detail": "View Won Lead Confirmation Details",
    "api_get_mark_as_won_info_admin": "Verify Won Admission Info",
    "api_mark_as_lost_admin": "Submit Lead Drop / Loss Request",
    "api_loss_lead_update_api": "Update Loss Reason & Remarks",
    "api_fetch_one_loss_lead_detail": "View Dropped Lead Details",
    "api_get_mark_as_lost_info_admin": "Fetch Drop Reason Options",
    "api_delete_lead_admin": "Delete Lead Record",
    "api_delete_lead_summary_admin": "Delete Lead Summary Records",
    "api_reassign_lead_admin": "Reassign Lead to Telecaller",
    "api_transfer_leads_admin": "Bulk Transfer Leads",
    "api_assign_lead_telecaller_admin": "Assign Leads to Staff",
    "api_fetch_transfer_telecallers_admin": "View Available Telecallers for Transfer",
    "api_toggle_lead_assignment_admin": "Toggle Automatic Lead Assignment",
    "api_enable_disable_lead_assignment_admin": "Enable / Disable Round-Robin Distribution",
    "api_upload_lead_excel_admin": "Upload Excel / CSV Lead Sheet",
    "api_excel_upload": "Process File Upload",
    "api_preview_lead_excel": "Preview Uploaded Lead Sheet",
    "api_verify_lead_import": "Validate Lead Import Data",
    "api_submit_lead_import": "Confirm & Import Leads into CRM",
    "api_export_all_leads_admin": "Export Leads to Excel",
    "api_dynamic_export_excel": "Custom Column Data Export",
    "api_fetch_loss_lead_approval_requests_admin": "View Pending Drop Approval Requests",
    "api_get_loss_lead_approval_filter_dropdowns_admin": "Filter Drop Approval Requests",
    "api_export_loss_lead_approval_requests_admin": "Export Drop Requests to Excel",
    "api_action_loss_lead_approval_admin": "Approve or Reject Drop Requests",

    # User & Team Management Actions
    "api_fetch_all_users_admin": "View Staff & User Roster",
    "api_fetch_user_dropdowns_admin": "Load User Roles & Department Dropdowns",
    "api_fetch_one_user_admin": "View User Profile Details",
    "api_fetch_user_campaigns_admin": "View User Assigned Campaigns",
    "api_fetch_user_transfer_campaigns_admin": "View Available Transfer Campaigns",
    "api_create_user_admin": "Create New User Account (Admin)",
    "api_create_user": "Register Staff Member",
    "api_edit_user_admin": "Edit User Profile & Permissions",
    "api_change_user_password_admin": "Reset & Change Staff Password",
    "api_toggle_user_status_admin": "Activate / Deactivate User Account",
    "api_delete_user_admin": "Delete User Account",
    "api_fetch_user_delete_summary_admin": "View Lead Reassignment on User Deletion",
    "api_fetch_all_teams_admin": "View All Teams & Branch Hierarchy",
    "api_create_team_admin": "Create New Team",
    "api_edit_team_admin": "Edit Team Details & Branch",
    "api_delete_team_admin": "Delete Team",
    "api_fetch_team_dropdowns_admin": "Load Team Filter Options",
    "api_assign_users_to_team_admin": "Assign Members & Managers to Team",
    "api_set_monthly_target_admin": "Set Monthly Calling & Revenue Targets",
    "api_fetch_monthly_target_admin": "View Team Monthly Targets",
    "api_fetch_target_dropdowns_admin": "Load Target Period & Team Options",
    "api_update_telecaller_target_admin": "Update Telecaller Individual Targets",
    "api_fetch_loss_reasons_admin": "View Drop & Loss Reasons List",
    "api_create_loss_reason_admin": "Create Custom Drop Reason",
    "api_update_loss_reason_admin": "Edit Drop Reason",
    "api_get_loss_reasons_admin": "Filter Loss Reasons by Pipeline",
    "api_add_loss_reason_admin": "Add Loss Reason to Pipeline",
    "api_delete_loss_reason_admin": "Delete Drop Reason",
    "api_create_role": "Create New Custom Role",
    "api_get_roles_and_permissions": "View Roles & Permission Matrix",
    "api_update_role_permission": "Modify Role Access Permissions",

    # Reports & Analytics Actions
    "api_admin_dashboard": "View Executive Dashboard & Analytics",
    "api_call_log_report_admin": "View Telecaller Call Logs",
    "api_disposition_log_admin": "View Call Dispositions & Outcomes",
    "api_fetch_call_history_api": "View Call Audio & History",
    "api_call_connect_form": "Open Call Connect Disposition Form",
    "api_call_disconnect_form": "Submit Call Outcome & Follow-up Notes",
    "api_call_disconnect_select_tag": "Tag Call Disconnect Reasons",
    "api_upload_call_recording": "Upload Call Audio Recording",
    "api_delete_call_recording": "Delete Call Audio Recording",
    "api_daily_report_api": "View Daily Calling Reports (DCR)",
    "api_submit_daily_report_view": "Submit Daily Activity Report",
    "api_download_daily_report_view": "Download Daily Calling Summary Report",
    "api_fetch_reports_admin": "Fetch Custom Reports List",
    "api_execute_report_admin": "Execute & Run Custom Report",
    "api_fetch_performance_overview_admin": "View Team Performance Dashboard",
    "api_get_performance_filter_dropdowns_admin": "Filter Performance by Date & Team",
    "api_export_performance_overview_admin": "Export Performance Report to Excel",
    "api_fetch_tele_performance": "View Telecaller Conversion KPIs",
    "api_get_pending_payment_filter_dropdowns_admin": "Filter Pending Payments",
    "api_fetch_all_pending_payments_admin": "View Overdue & Pending Installments",
    "api_fetch_all_payment": "View All Payment Records",
    "api_pending_payment_tiles": "View Pending Fee Summary KPI Cards",
    "api_payment_history_api": "View Student Payment History",
    "api_export_pending_payments_admin": "Export Fee Overdues to Excel",
    "api_payment_details": "Collect Fee Payment & Record Transaction",
    "api_dynamic_pdf_genrate": "Generate & Print Payment Receipt PDF",

    # Organization Settings Actions
    "api_get_organization_profile_admin": "View Company Profile & Branding",
    "api_create_organization_profile_admin": "Setup Organization Details",
    "api_edit_organization_profile_admin": "Update Company Info, Logo & Address",
    "api_add_course": "Add Academic Course / Program",
    "api_update_course": "Edit Course Fees & Program Details",
    "api_create_course": "Create Course Offering",
    "api_edit_course": "Edit Course Offering",
    "api_delete_course": "Delete Course Offering",
    "api_create_batch": "Create Course Batch",
    "api_edit_batch": "Edit Course Batch",
    "api_edit_course_batch": "Update Course Batch Details",
    "api_delete_course_batch": "Delete Course Batch",
    "api_create_course_plan": "Create Course Fee Plan",
    "api_edit_plan": "Edit Course Fee Plan",
    "api_delete_course_plan": "Delete Course Fee Plan",
    "api_create_dropdown_sub": "Manage Custom Form Dropdowns & Lead Sources",
    "api_dropdown_cate_create": "Create New Dropdown Categories",
    "api_message_Setting_api": "Manage WhatsApp & SMS Message Templates",
    "api_notes_setting_api": "Configure Disposition Quick Notes",
    "api_integrations_facebook": "Connect Facebook & Instagram Lead Ads",
    "api_integrations_google": "Sync Google Forms & Spreadsheets",
    "api_integrations_whatsapp": "Configure WhatsApp CRM Sync",

    # Campaign Management Actions
    "api_campaign_cards_list_admin": "View Marketing Campaign Cards",
    "api_campaign_enquiry_sheet_admin": "View Campaign Enquiry Sheet",
    "api_disposition_log_report_admin": "View Campaign Disposition Reports",
    "api_fetch_campaign_detail_admin": "View Campaign Overview & Metrics",
    "api_campaign_managers_admin": "View Campaign Assigned Managers",
    "api_campaign_agents_admin": "Assign Calling Agents to Campaign",
    "api_create_campaign_admin": "Create New Marketing Campaign",
    "api_update_campaign_detail_admin": "Edit Campaign Name & Schedule",
    "api_toggle_campaign_status_admin": "Pause / Resume Campaign",
    "api_delete_campaign_admin": "Delete Campaign",
    "api_move_lead_campaign_admin": "Move Leads Between Campaigns",
    "api_transfer_single_campaign_leads_admin": "Transfer Single Campaign Leads",
    "api_transfer_all_campaigns_leads_admin": "Bulk Transfer All Campaign Leads",

    # Pipeline Management Actions
    "api_fetch_pipeline_leads_admin": "View Sales Pipeline & Kanban Board",
    "api_fetch_pipeline_lead": "Search Leads in Pipeline Stages",
    "api_fetch_pipeline_funnel": "View Conversion Funnel Analytics",
    "api_education_pipeline_stats_admin": "View Pipeline Stage Statistics",
    "api_change_lead_status_admin": "Move Leads Between Pipeline Stages",
    "api_pipeline_categories_admin": "Configure Deal Stages & Funnel Categories",
}

# Page Definition Metadata for Page-wise & Component-wise RBAC
PAGE_DEFINITIONS = [
    {
        "key": "page_leads",
        "name": "Leads Directory",
        "description": "Lead table, customer directory, won/lost marking, imports & exports",
        "is_settings": False,
        "module_code": "LEAD_MANAGEMENT",
    },
    {
        "key": "page_pipeline",
        "name": "Sales Pipeline & Kanban",
        "description": "Deal stages, student admission funnels and conversion tracking",
        "is_settings": False,
        "module_code": "PIPELINE",
    },
    {
        "key": "page_loss_approvals",
        "name": "Loss Lead Approvals",
        "description": "Manager review for telecaller dropped lead approval requests",
        "is_settings": False,
        "module_code": "LEAD_MANAGEMENT",
    },
    {
        "key": "page_payments",
        "name": "Pending Payments",
        "description": "Fee tracking, installment overdues, payment collection & receipts",
        "is_settings": False,
        "module_code": "REPORTS",
    },
    {
        "key": "page_campaigns",
        "name": "Campaigns",
        "description": "Marketing campaigns, performance enquiry cards, agent assignments",
        "is_settings": False,
        "module_code": "CAMPAIGN",
    },
    {
        "key": "page_reports",
        "name": "Reports & Performance",
        "description": "Executive dashboard, call history, DCR reports and telecaller KPIs",
        "is_settings": False,
        "module_code": "REPORTS",
    },
    {
        "key": "settings_users",
        "name": "Settings: User Management",
        "description": "Staff roster, user creation, password reset, and deactivation",
        "is_settings": True,
        "module_code": "USERS",
    },
    {
        "key": "settings_teams",
        "name": "Settings: Teams Hierarchy",
        "description": "Branch teams, manager assignments and telecaller groupings",
        "is_settings": True,
        "module_code": "USERS",
    },
    {
        "key": "settings_targets",
        "name": "Settings: Monthly Targets",
        "description": "Monthly calling quotas and revenue targets for telecallers",
        "is_settings": True,
        "module_code": "USERS",
    },
    {
        "key": "settings_roles",
        "name": "Settings: Roles & Permissions",
        "description": "Role definitions and granular page/action permission matrix",
        "is_settings": True,
        "module_code": "USERS",
    },
    {
        "key": "settings_courses",
        "name": "Settings: Course Management",
        "description": "Academic course programs, curriculum and pricing tiers",
        "is_settings": True,
        "module_code": "ORGANIZATION_SETTINGS",
    },
    {
        "key": "settings_loss_reasons",
        "name": "Settings: Pipeline & Loss Reasons",
        "description": "Customizable drop reasons and pipeline categorization",
        "is_settings": True,
        "module_code": "USERS",
    },
    {
        "key": "settings_org_profile",
        "name": "Settings: Organization Profile",
        "description": "Company registration, branding logos and contact details",
        "is_settings": True,
        "module_code": "ORGANIZATION_SETTINGS",
    },
    {
        "key": "settings_dropdowns",
        "name": "Settings: Dropdowns & Templates",
        "description": "Lead categories, disposition templates and message presets",
        "is_settings": True,
        "module_code": "ORGANIZATION_SETTINGS",
    },
    {
        "key": "settings_integrations",
        "name": "Settings: Integrations",
        "description": "Facebook Lead Ads, Google Forms, Sheets & WhatsApp integrations",
        "is_settings": True,
        "module_code": "ORGANIZATION_SETTINGS",
    },
]

FEATURE_DEFINITIONS = [
    # Module 1: Lead Management (Page: Leads Directory)
    {
        "id": "feat_lead_view",
        "name": "View & Search Leads",
        "module_code": "LEAD_MANAGEMENT",
        "page_key": "page_leads",
        "tier": "VIEW",
        "component_name": "Lead Table & Summary Cards",
        "info": "Access lead directory, search leads, view lead details and summary tiles",
        "api_count": 8,
    },
    {
        "id": "feat_lead_edit",
        "name": "Edit Lead Details & Notes",
        "module_code": "LEAD_MANAGEMENT",
        "page_key": "page_leads",
        "tier": "ACTION",
        "component_name": "Edit Details & Follow-up Notes",
        "info": "Update contact details, record follow-up notes, and edit lead summaries",
        "api_count": 3,
    },
    {
        "id": "feat_lead_mark_won",
        "name": "Mark Lead as Won (Conversion)",
        "module_code": "LEAD_MANAGEMENT",
        "page_key": "page_leads",
        "tier": "ACTION",
        "component_name": "Won Admission Conversion",
        "info": "Enroll student, mark lead as Won, and record initial fee breakdown",
        "api_count": 4,
    },
    {
        "id": "feat_lead_mark_lost",
        "name": "Mark Lead as Lost (Drop Request)",
        "module_code": "LEAD_MANAGEMENT",
        "page_key": "page_leads",
        "tier": "ACTION",
        "component_name": "Drop Request (Lost)",
        "info": "Submit lead drop request with loss reason for manager approval",
        "api_count": 4,
    },
    {
        "id": "feat_lead_add",
        "name": "Add New Lead (Manual / Walk-in)",
        "module_code": "LEAD_MANAGEMENT",
        "page_key": "page_leads",
        "tier": "ADMIN",
        "component_name": "Add Lead Button",
        "info": "Create single leads manually, fetch required dropdowns and form presets",
        "api_count": 4,
    },
    {
        "id": "feat_lead_delete",
        "name": "Delete Leads",
        "module_code": "LEAD_MANAGEMENT",
        "page_key": "page_leads",
        "tier": "ADMIN",
        "component_name": "Delete Action",
        "info": "Permanently delete lead records or lead summaries from CRM",
        "api_count": 2,
    },
    {
        "id": "feat_lead_reassign",
        "name": "Reassign & Transfer Leads",
        "module_code": "LEAD_MANAGEMENT",
        "page_key": "page_leads",
        "tier": "ADMIN",
        "component_name": "Reassign Telecallers",
        "info": "Reassign leads between telecallers and transfer lead ownership",
        "api_count": 4,
    },
    {
        "id": "feat_lead_auto_allocation",
        "name": "Lead Auto-Allocation (Round-Robin)",
        "module_code": "LEAD_MANAGEMENT",
        "page_key": "page_leads",
        "tier": "ADMIN",
        "component_name": "Auto-Allocation Switch",
        "info": "Toggle automated lead assignment and round-robin distribution",
        "api_count": 2,
    },
    {
        "id": "feat_lead_import",
        "name": "Bulk Upload (Excel / CSV Import)",
        "module_code": "LEAD_MANAGEMENT",
        "page_key": "page_leads",
        "tier": "ADMIN",
        "component_name": "Excel / CSV Import",
        "info": "Upload external lead sheets via Excel, preview data, verify fields and submit import",
        "api_count": 5,
    },
    {
        "id": "feat_lead_export",
        "name": "Export Leads & Data Sheets",
        "module_code": "LEAD_MANAGEMENT",
        "page_key": "page_leads",
        "tier": "ADMIN",
        "component_name": "Excel Export Button",
        "info": "Download leads to Excel/CSV with dynamic field column selection",
        "api_count": 2,
    },
    {
        "id": "feat_lead_loss_approvals",
        "name": "Loss Lead Approvals",
        "module_code": "LEAD_MANAGEMENT",
        "page_key": "page_loss_approvals",
        "tier": "ADMIN",
        "component_name": "Approve / Reject Drop Requests",
        "info": "Review telecaller drop requests, inspect reasons, approve closure or return to call",
        "api_count": 4,
    },

    # Module 2: User & Team Management (Pages: Settings Users, Teams, Targets, Roles, Loss Reasons)
    {
        "id": "feat_staff_roster",
        "name": "Staff Directory & User Profiles",
        "module_code": "USERS",
        "page_key": "settings_users",
        "tier": "VIEW",
        "component_name": "View Staff List & Profiles",
        "info": "View active users, branch staff lists, team assignments and staff dropdowns",
        "api_count": 5,
    },
    {
        "id": "feat_staff_create_edit",
        "name": "Create & Edit Staff Profiles",
        "module_code": "USERS",
        "page_key": "settings_users",
        "tier": "ADMIN",
        "component_name": "Add & Edit Staff Members",
        "info": "Add new staff members, edit profile details and assign designations",
        "api_count": 3,
    },
    {
        "id": "feat_staff_password",
        "name": "Reset / Change Staff Password",
        "module_code": "USERS",
        "page_key": "settings_users",
        "tier": "ADMIN",
        "component_name": "Password Reset Privilege",
        "info": "Security privilege to reset staff passwords and update credentials",
        "api_count": 1,
    },
    {
        "id": "feat_staff_deactivate_delete",
        "name": "Deactivate & Delete Staff",
        "module_code": "USERS",
        "page_key": "settings_users",
        "tier": "ADMIN",
        "component_name": "Deactivate & Delete Users",
        "info": "Toggle active/inactive status and permanently remove staff accounts",
        "api_count": 3,
    },
    {
        "id": "feat_team_organization",
        "name": "Teams & Branch Hierarchy",
        "module_code": "USERS",
        "page_key": "settings_teams",
        "tier": "ADMIN",
        "component_name": "Manage Teams & Branches",
        "info": "Create teams, edit team hierarchy, delete teams and fetch team dropdowns",
        "api_count": 5,
    },
    {
        "id": "feat_team_assignment",
        "name": "Assign Staff to Teams",
        "module_code": "USERS",
        "page_key": "settings_teams",
        "tier": "ADMIN",
        "component_name": "Assign Staff to Teams",
        "info": "Assign, reallocate and transfer telecallers across operational teams",
        "api_count": 1,
    },
    {
        "id": "feat_target_allocation",
        "name": "Target & Quota Allocation",
        "module_code": "USERS",
        "page_key": "settings_targets",
        "tier": "ADMIN",
        "component_name": "Set Monthly Quotas & Targets",
        "info": "Set monthly targets for telecallers, view target achievement dropdowns and track quotas",
        "api_count": 4,
    },
    {
        "id": "feat_loss_reasons",
        "name": "Loss Reasons Configuration",
        "module_code": "USERS",
        "page_key": "settings_loss_reasons",
        "tier": "ADMIN",
        "component_name": "Configure Loss Reasons",
        "info": "Configure pipeline-specific lead rejection and drop reasons",
        "api_count": 6,
    },
    {
        "id": "feat_roles_matrix",
        "name": "Roles & Permission Matrix",
        "module_code": "USERS",
        "page_key": "settings_roles",
        "tier": "ADMIN",
        "component_name": "Manage Roles & Permissions",
        "info": "Create custom roles, configure role permissions matrix and access control",
        "api_count": 3,
    },

    # Module 3: Reports & Analytics (Pages: Reports, Payments)
    {
        "id": "feat_exec_dashboard",
        "name": "Executive & Admin Dashboard",
        "module_code": "REPORTS",
        "page_key": "page_reports",
        "tier": "VIEW",
        "component_name": "Analytics Dashboard",
        "info": "Central analytics overview, pipeline health cards, conversion ratios and executive KPI metrics",
        "api_count": 1,
    },
    {
        "id": "feat_call_logs",
        "name": "Call Logs & Audio Dispositions",
        "module_code": "REPORTS",
        "page_key": "page_reports",
        "tier": "VIEW",
        "component_name": "Call History & Recordings",
        "info": "View telecalling call logs, disposition histories, connect/disconnect forms and recordings",
        "api_count": 8,
    },
    {
        "id": "feat_dcr_reports",
        "name": "Daily Calling Reports (DCR)",
        "module_code": "REPORTS",
        "page_key": "page_reports",
        "tier": "ACTION",
        "component_name": "Submit & View DCR Reports",
        "info": "Submit end-of-day calling report, view team daily submissions and export DCR logs",
        "api_count": 5,
    },
    {
        "id": "feat_team_performance",
        "name": "Telecaller & Team Performance",
        "module_code": "REPORTS",
        "page_key": "page_reports",
        "tier": "VIEW",
        "component_name": "Performance Overview Metrics",
        "info": "Performance overview metrics, telecaller comparison charts, drill-down analytics and export",
        "api_count": 4,
    },
    {
        "id": "feat_payments_view",
        "name": "View Pending Payments & Overdue",
        "module_code": "REPORTS",
        "page_key": "page_payments",
        "tier": "VIEW",
        "component_name": "Payments Overview & Overdue List",
        "info": "Track pending student fees, installment overdues, collection cards and payment histories",
        "api_count": 5,
    },
    {
        "id": "feat_payments_collect",
        "name": "Collect Payments & Receipts",
        "module_code": "REPORTS",
        "page_key": "page_payments",
        "tier": "ACTION",
        "component_name": "Collect Fee & Export PDF Receipts",
        "info": "Record payment collections, installment updates, export payment logs and generate PDF receipts",
        "api_count": 3,
    },

    # Module 4: Organization Settings (Pages: Settings Courses, Org Profile, Dropdowns)
    {
        "id": "feat_org_profile",
        "name": "Organization Profile & Details",
        "module_code": "ORGANIZATION_SETTINGS",
        "page_key": "settings_org_profile",
        "tier": "ADMIN",
        "component_name": "Manage Company Profile & Branding",
        "info": "View and manage company branding, contact details, branch registration and settings",
        "api_count": 3,
    },
    {
        "id": "feat_curriculum",
        "name": "Course & Curriculum Management",
        "module_code": "ORGANIZATION_SETTINGS",
        "page_key": "settings_courses",
        "tier": "ADMIN",
        "component_name": "Manage Courses & Fees",
        "info": "Configure course programs, plan pricing, curriculum categories and update fee structures",
        "api_count": 12,
    },
    {
        "id": "feat_dropdowns_master",
        "name": "Custom Dropdowns & Lead Categories",
        "module_code": "ORGANIZATION_SETTINGS",
        "page_key": "settings_dropdowns",
        "tier": "ADMIN",
        "component_name": "Lead Categories & Custom Dropdowns",
        "info": "Configure custom lead categories, sub-categories, and master dropdowns",
        "api_count": 2,
    },
    {
        "id": "feat_communication_templates",
        "name": "Communication & Note Templates",
        "module_code": "ORGANIZATION_SETTINGS",
        "page_key": "settings_dropdowns",
        "tier": "ADMIN",
        "component_name": "Communication & Note Templates",
        "info": "Configure standard telecalling notes, call remarks and message presets",
        "api_count": 2,
    },
    {
        "id": "feat_integrations_manage",
        "name": "3rd-Party App Integrations",
        "module_code": "ORGANIZATION_SETTINGS",
        "page_key": "settings_integrations",
        "tier": "ADMIN",
        "component_name": "Integrations Hub",
        "info": "Connect Facebook Lead Ads, Google Forms/Sheets sync, and WhatsApp webhooks",
        "api_count": 3,
    },

    # Module 5: Campaign Management (Page: Campaigns)
    {
        "id": "feat_campaign_cards",
        "name": "Campaign Cards & Enquiry Sheet",
        "module_code": "CAMPAIGN",
        "page_key": "page_campaigns",
        "tier": "VIEW",
        "component_name": "Campaign Cards & Enquiry Sheets",
        "info": "View marketing campaign performance cards, lead counts, enquiry sheets, assigned agents & managers",
        "api_count": 6,
    },
    {
        "id": "feat_campaign_manage",
        "name": "Create & Manage Campaigns",
        "module_code": "CAMPAIGN",
        "page_key": "page_campaigns",
        "tier": "ACTION",
        "component_name": "Create & Edit Campaigns",
        "info": "Create marketing campaigns, edit campaign budgets, and toggle active/paused status",
        "api_count": 3,
    },
    {
        "id": "feat_campaign_delete",
        "name": "Delete Marketing Campaigns",
        "module_code": "CAMPAIGN",
        "page_key": "page_campaigns",
        "tier": "ADMIN",
        "component_name": "Delete Campaigns",
        "info": "Privilege to permanently delete marketing campaigns from the CRM",
        "api_count": 1,
    },
    {
        "id": "feat_campaign_migration",
        "name": "Campaign Lead Migration",
        "module_code": "CAMPAIGN",
        "page_key": "page_campaigns",
        "tier": "ADMIN",
        "component_name": "Migrate Leads Across Campaigns",
        "info": "Move leads across campaigns, transfer single campaign leads or batch transfer all campaign leads",
        "api_count": 3,
    },

    # Module 6: Pipeline Management (Page: Sales Pipeline & Kanban)
    {
        "id": "feat_pipeline_kanban",
        "name": "Pipeline Kanban & Funnel Tracking",
        "module_code": "PIPELINE",
        "page_key": "page_pipeline",
        "tier": "VIEW",
        "component_name": "Kanban Board & Stage Movements",
        "info": "Kanban board stages, funnel conversion statistics and moving lead stages",
        "api_count": 5,
    },
    {
        "id": "feat_pipeline_categories",
        "name": "Pipeline Stages & Category Configuration",
        "module_code": "PIPELINE",
        "page_key": "page_pipeline",
        "tier": "ADMIN",
        "component_name": "Pipeline Stages & Categories",
        "info": "Configure pipeline categories and custom admission stages",
        "api_count": 1,
    },
]

def authorize_request(perm_name: str, user):
    """
    Enterprise Capability-Bundled Authorization Helper:
    1. Superuser / Developer / Org Admin gets 100% Super-Access instantly.
    2. Tier 1: Universal Base Utilities are auto-granted to all authenticated users (Zero 403 crashes).
    3. Granular endpoint permission checked in user's assigned permissions.
    """
    try:
        if not user or not user.is_authenticated:
            raise PermissionDenied("Authentication required. Please login.")

        # 💻 Admin & Developer Super-Access Check (Instant 100% Access)
        user_role_obj = user.user_roles.select_related('role').first() if hasattr(user, 'user_roles') else None
        role_obj = user_role_obj.role if user_role_obj else None
        if role_obj:
            r_code = str(role_obj.code or '').upper()
            r_name = str(role_obj.name or '').lower()
            if r_code in ['DEV', 'ADMIN', 'SUPERADMIN', 'ORG_ADMIN'] or r_name in ['developer', 'admin', 'superadmin', 'super admin', 'org admin', 'org_admin'] or getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False):
                return True
        elif getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False):
            return True

        # 🌐 Tier 1: Universal Base Utilities Auto-Grant (Zero 403 on base calls)
        if perm_name in UNIVERSAL_BASE_APIS:
            return True

        # 📞 User Permissions Check by Name or Code
        user_perms = user.get_perms() if hasattr(user, 'get_perms') else []
        if perm_name in user_perms:
            return True
        else:
            raise PermissionDenied(f"Not Authorized to use this API: '{perm_name}'")

    except PermissionDenied as pd:
        raise pd
    except Exception as e:
        raise APIException(str(e))


def create_permission(user_name, **data):

    try:
        new_perm = Perm.objects.create(
            name=data.get('name'),
            display_value=data.get('display_value'),
            code=data.get('code'),
            perm_group=data.get('perm_group', 'perm_apis'),
            created_by=user_name
        )

        # Auto-assign newly created permission to Developer (DEV) role
        dev_role = Role.objects.filter(code="DEV").first()
        if dev_role is not None:
            dev_role.perms.add(new_perm)

        return new_perm.name

    except Exception as e:
        raise APIException(str(e))


def assign_permission_to_role(**data):
   
    try:
        role_id = data.get('role_id')
        perm_id = data.get('perm_id')
        user_name = data.get('user_name', 'system')

        role_obj = Role.objects.get(id=role_id)
        perm_obj = Perm.objects.get(id=perm_id)

        role_obj.perms.add(perm_obj)
        return f"Assigned {perm_obj.code} to {role_obj.name}"

    except Exception as e:
        raise APIException(str(e))


def fetch_perms_list():
   
    try:
        perms = Perm.objects.filter(perm_group="perm_apis").values('id', 'name', 'display_value', 'code', 'perm_group', 'created_at')
        return list(perms)
    except Exception as e:
        raise APIException(str(e))


def fetch_roles_list():
  
    try:
        roles = Role.objects.all().values('id', 'name', 'display_value', 'code', 'description', 'created_at')
        return list(roles)
    except Exception as e:
        raise APIException(str(e))


def get_roles_and_permissions_service(user=None):
    try:
        # 1. Dynamically query all roles from adm_role DB table (excluding DEV developer role)
        db_roles = Role.objects.prefetch_related('perms').exclude(code__in=['DEV', 'DEVELOPER']).order_by('id')

        roles_list = []
        role_perms_map = {}

        for r in db_roles:
            role_code_upper = str(r.code or '').upper()
            role_name_lower = str(r.name or '').lower()
            role_slug = role_name_lower.replace(' ', '_')
            role_display_name = 'Org Admin' if role_code_upper in ['ADM', 'ADMIN', 'ORG_ADMIN'] or role_name_lower in ['admin', 'org_admin'] else (r.display_value or r.name)

            roles_list.append({
                "id": r.id,                    # Real integer database ID (1, 2, 3, 4, 14)
                "role_id": r.id,               # 4
                "slug": role_slug,             # 'executive'
                "code": role_code_upper,       # 'EXE'
                "name": role_display_name      # 'Executive'
            })

            perm_codes = set(r.perms.values_list('code', flat=True))
            role_perms_map[str(r.id)] = {
                "code": role_code_upper,
                "role_id_db": r.id,
                "slug": role_slug,
                "perm_codes": perm_codes
            }

        # 2. Query PermGroups from DB to preserve module display names
        db_groups = {g.code: g for g in PermGroup.objects.all()}
        all_perms_map = {p.code: p for p in Perm.objects.all()}
        
        # 3. Partition features into 6 PermGroup Modules (Existing Backward Compatibility)
        module_order = ["LEAD_MANAGEMENT", "USERS", "REPORTS", "ORGANIZATION_SETTINGS", "CAMPAIGN", "PIPELINE"]
        
        all_feature_objects = []
        categories_list = []

        for mod_code in module_order:
            db_group = db_groups.get(mod_code)
            group_name = db_group.display_value or db_group.name if db_group else mod_code.replace('_', ' ').title()
            group_id = db_group.id if db_group else (mod_code or '').lower()

            mod_features = [f for f in FEATURE_DEFINITIONS if f["module_code"] == mod_code]
            if not mod_features:
                continue

            feature_objects = []
            for feat in mod_features:
                feat_id = feat["id"]
                child_apis = FEATURE_BUNDLES.get(feat_id, [])

                # Detailed child API items with display names and individual role values
                child_api_details = []
                for api_code in child_apis:
                    perm_obj = all_perms_map.get(api_code)
                    api_name = (
                        USER_FRIENDLY_API_NAMES.get(api_code)
                        or (perm_obj.display_value if perm_obj and perm_obj.display_value and not perm_obj.display_value.startswith('api_') else None)
                        or api_code.replace('api_', '').replace('_', ' ').title()
                    )

                    api_role_values = {}
                    for r_key, r_info in role_perms_map.items():
                        r_id_str = str(r_info['role_id_db'])
                        r_slug = r_info['slug']
                        if r_info['code'] in ['ADM', 'DEV', 'ORG_ADMIN'] or r_slug in ['org_admin', 'admin']:
                            api_granted = True
                        else:
                            api_granted = api_code in r_info['perm_codes']

                        api_role_values[r_id_str] = api_granted
                        api_role_values[r_info['role_id_db']] = api_granted
                        api_role_values[r_slug] = api_granted

                    child_api_details.append({
                        "id": perm_obj.id if perm_obj else api_code,
                        "code": api_code,
                        "name": api_name,
                        "display_name": api_name,
                        "values": api_role_values
                    })

                values_dict = {}
                for r_key, r_info in role_perms_map.items():
                    r_id_str = str(r_info['role_id_db'])
                    r_slug = r_info['slug']

                    # Org Admin / Super Admin gets 100% full access
                    if r_info['code'] in ['ADM', 'DEV', 'ORG_ADMIN'] or r_slug in ['org_admin', 'admin']:
                        is_granted = True
                    else:
                        # Role has feature enabled if child APIs are assigned
                        assigned_count = sum(1 for code in child_apis if code in r_info['perm_codes'])
                        is_granted = assigned_count >= len(child_apis) * 0.5 if child_apis else False

                    # Support lookups by DB int ID, string ID, and slug for 100% compatibility!
                    values_dict[r_id_str] = is_granted
                    values_dict[r_info['role_id_db']] = is_granted
                    values_dict[r_slug] = is_granted

                f_obj = {
                    "id": feat_id,
                    "name": feat["name"],
                    "info": feat["info"],
                    "api_count": len(child_apis),
                    "child_apis": child_apis,
                    "apis": child_api_details,
                    "page_key": feat.get("page_key", "page_leads"),
                    "tier": feat.get("tier", "ACTION"),
                    "component_name": feat.get("component_name", feat["name"]),
                    "module_code": mod_code,
                    "values": values_dict
                }
                feature_objects.append(f_obj)
                all_feature_objects.append(f_obj)

            categories_list.append({
                "id": group_id,
                "name": group_name,
                "permissions": feature_objects
            })

        # 4. Construct Pages-wise Structure (Page -> Tiers [VIEW, ACTION, ADMIN] -> Roles)
        pages_list = []
        for page_def in PAGE_DEFINITIONS:
            p_key = page_def["key"]
            page_feats = [f for f in all_feature_objects if f.get("page_key") == p_key]
            if not page_feats:
                continue

            tiers_map = {"VIEW": [], "ACTION": [], "ADMIN": []}
            for pf in page_feats:
                t = pf.get("tier", "ACTION")
                if t not in tiers_map:
                    tiers_map[t] = []
                tiers_map[t].append(pf)

            # Compute page-level access summary per role
            page_role_values = {}
            for r in roles_list:
                r_id = str(r["id"])
                if r["code"] in ['ADM', 'DEV', 'ORG_ADMIN'] or r["slug"] in ['org_admin', 'admin']:
                    page_role_values[r_id] = True
                    page_role_values[r["id"]] = True
                    page_role_values[r["slug"]] = True
                else:
                    view_feats = tiers_map["VIEW"] or page_feats
                    can_v = any(vf["values"].get(r_id, False) for vf in view_feats)
                    page_role_values[r_id] = can_v
                    page_role_values[r["id"]] = can_v
                    page_role_values[r["slug"]] = can_v

            pages_list.append({
                "key": p_key,
                "name": page_def["name"],
                "description": page_def["description"],
                "is_settings": page_def["is_settings"],
                "module_code": page_def["module_code"],
                "values": page_role_values,
                "tiers": tiers_map,
                "permissions": page_feats,
                "features": page_feats
            })

        return {
            "roles": roles_list,
            "categories": categories_list,
            "pages": pages_list,
            "total_features": len(FEATURE_DEFINITIONS),
            "total_bundled_apis": sum(len(apis) for apis in FEATURE_BUNDLES.values())
        }

    except Exception as e:
        logger.error(f"Error in get_roles_and_permissions_service: {str(e)}", exc_info=True)
        raise APIException(str(e))


def create_role_matrix_service(admin_user, data):
    name = (data.get('name') or '').strip()
    duplicate_from = (data.get('duplicate_from') or '').strip()

    if not name:
        raise ValidationError("Role name is required.")

    if not duplicate_from:
        raise ValidationError("duplicate_from is required. Please select a base role to copy permissions from.")

    dup_key = duplicate_from.lower()
    source_role = Role.objects.filter(
        models.Q(name__iexact=dup_key) | 
        models.Q(code__iexact=dup_key) |
        models.Q(name__iexact=dup_key.replace('_', ' '))
    ).first()

    if not source_role:
        raise ValidationError(f"Selected base role '{duplicate_from}' does not exist.")

    role_id_key = name.lower().replace(' ', '_')
    role_code = role_id_key.upper()[:50]

    if Role.objects.filter(name__iexact=name).exists() or Role.objects.filter(code__iexact=role_code).exists():
        raise ValidationError(f"Role name '{name}' already exists.")

    user_name = admin_user.username if admin_user and admin_user.is_authenticated else 'system'

    new_role = Role.objects.create(
        name=role_id_key,
        display_value=name,
        code=role_code,
        description=f"Custom role created from {source_role.display_value or source_role.name}",
        created_by=user_name
    )

    source_perms = list(source_role.perms.all())
    new_role.perms.set(source_perms)

    created_at_iso = timezone.localtime(new_role.created_at).strftime('%d-%m-%Y %I:%M %p') if new_role.created_at else None

    return {
        "id": role_id_key,
        "name": new_role.display_value or new_role.name,
        "duplicate_from": duplicate_from,
        "created_at": created_at_iso,
        "message": "Role created successfully"
    }


def update_role_permission_service(admin_user, data):
    role_id = str(data.get('role_id') or '').strip()
    category_id = str(data.get('category_id') or '').strip()
    permission_id = str(data.get('permission_id') or data.get('feature_id') or data.get('page_key') or '').strip()
    tier_filter = str(data.get('tier') or '').strip().upper()
    has_permission = bool(data.get('has_permission'))

    if not role_id or not permission_id:
        raise ValidationError("Invalid role or permission ID.")

    # 1. Match Role in Database (by ID, code, or name)
    role_key = role_id.lower()
    if role_id.isdigit():
        role_obj = Role.objects.filter(id=int(role_id)).first()
    elif role_key in ['org_admin', 'admin', 'adm']:
        role_obj = Role.objects.filter(
            models.Q(code__iexact='ADM') | 
            models.Q(code__iexact='ORG_ADMIN') | 
            models.Q(name__iexact='admin') | 
            models.Q(name__iexact='org_admin')
        ).first()
    else:
        role_obj = Role.objects.filter(
            models.Q(name__iexact=role_key) | 
            models.Q(code__iexact=role_key) |
            models.Q(name__iexact=role_key.replace('_', ' ')) |
            models.Q(display_value__iexact=role_key.replace('_', ' '))
        ).first()

    if not role_obj:
        raise ValidationError(f"Role '{role_id}' not found.")

    role_code_upper = str(role_obj.code or '').upper()
    role_name_lower = str(role_obj.name or '').lower()
    if role_code_upper in ['ADM', 'ADMIN', 'ORG_ADMIN'] or role_name_lower in ['admin', 'org_admin'] or role_obj.id == 1:
        raise ValidationError("Org Admin permissions are fixed and cannot be modified.")

    user_name = admin_user.username if admin_user and admin_user.is_authenticated else 'system'

    # 2. Bulk Page / Tier Toggle: If permission_id is a Page Key (e.g., 'page_leads', 'settings_users')
    page_keys = {p["key"] for p in PAGE_DEFINITIONS}
    target_page_key = permission_id.split(':')[0]
    if target_page_key in page_keys:
        # Check if tier is specified in id (e.g. 'page_leads:VIEW')
        if ':' in permission_id:
            tier_filter = permission_id.split(':')[1].upper()

        matching_feats = [f for f in FEATURE_DEFINITIONS if f.get("page_key") == target_page_key]
        if tier_filter:
            matching_feats = [f for f in matching_feats if f.get("tier") == tier_filter]

        target_apis = set()
        for f in matching_feats:
            target_apis.update(FEATURE_BUNDLES.get(f["id"], []))

        perm_objs = list(Perm.objects.filter(code__in=target_apis))
        with transaction.atomic():
            if has_permission:
                role_obj.perms.add(*perm_objs)
            else:
                role_obj.perms.remove(*perm_objs)

            role_obj.updated_by = user_name
            role_obj.save()

        scope_desc = f"Tier '{tier_filter}'" if tier_filter else "Entire Page"
        return {
            "status": "success",
            "role_id": role_id,
            "page_key": target_page_key,
            "tier": tier_filter or "ALL",
            "has_permission": has_permission,
            "synced_apis": len(perm_objs),
            "synced_features": len(matching_feats),
            "message": f"{scope_desc} for '{target_page_key}' updated ({len(perm_objs)} APIs synced) for {role_obj.name}"
        }

    # 3. Capability Bundling: If permission_id is a Major Feature bundle
    if permission_id in FEATURE_BUNDLES or permission_id.startswith('feat_'):
        child_api_codes = FEATURE_BUNDLES.get(permission_id, [])
        if not child_api_codes:
            raise ValidationError(f"Feature bundle '{permission_id}' has no registered APIs.")

        perm_objs = list(Perm.objects.filter(code__in=child_api_codes))

        with transaction.atomic():
            if has_permission:
                role_obj.perms.add(*perm_objs)
            else:
                role_obj.perms.remove(*perm_objs)

            role_obj.updated_by = user_name
            role_obj.save()

        return {
            "status": "success",
            "role_id": role_id,
            "category_id": category_id,
            "permission_id": permission_id,
            "has_permission": has_permission,
            "synced_apis": len(perm_objs),
            "message": f"Feature '{permission_id}' ({len(perm_objs)} APIs) updated successfully for {role_obj.name}"
        }

    # 4. Fallback to individual Perm code/id if single API is targeted
    perm_key = permission_id.lower()
    if permission_id.isdigit():
        perm_obj = Perm.objects.filter(id=int(permission_id)).first()
    else:
        perm_obj = Perm.objects.filter(models.Q(code__iexact=perm_key) | models.Q(name__iexact=perm_key)).first()

    if not perm_obj:
        raise ValidationError(f"Permission or Feature '{permission_id}' not found.")

    with transaction.atomic():
        if has_permission:
            role_obj.perms.add(perm_obj)
        else:
            role_obj.perms.remove(perm_obj)

        role_obj.updated_by = user_name
        role_obj.save()

    return {
        "status": "success",
        "role_id": role_id,
        "category_id": category_id,
        "permission_id": permission_id,
        "has_permission": has_permission,
        "message": f"Permission '{perm_obj.code}' updated successfully for {role_obj.name}"
    }


def get_user_permission_summary(user):
    """
    Returns user permissions along with resolved capability feature bundles and computed page-level permissions.
    Zero-database model alterations. Computes access on-the-fly.
    """
    try:
        if not user or not user.is_authenticated:
            return {
                "permissions": [],
                "pages": {},
                "is_super": False
            }

        user_role_obj = user.user_roles.select_related('role').first() if hasattr(user, 'user_roles') else None
        role_obj = user_role_obj.role if user_role_obj else None
        role_code = str(role_obj.code or '').upper() if role_obj else ''
        role_name = str(role_obj.name or '').lower() if role_obj else ''
        
        is_super = (
            role_code in ['DEV', 'ADMIN', 'SUPERADMIN', 'ORG_ADMIN'] or 
            role_name in ['developer', 'admin', 'superadmin', 'super admin', 'org admin', 'org_admin'] or
            getattr(user, 'is_superuser', False) or 
            getattr(user, 'is_staff', False)
        )

        user_perms = set(user.get_perms() if hasattr(user, 'get_perms') else [])

        # If superuser / org admin, grant all features and all pages
        if is_super:
            all_features = set(FEATURE_BUNDLES.keys())
            all_apis = set()
            for apis in FEATURE_BUNDLES.values():
                all_apis.update(apis)
            combined_perms = list(user_perms | all_features | all_apis | UNIVERSAL_BASE_APIS)

            pages_map = {}
            for p in PAGE_DEFINITIONS:
                pages_map[p["key"]] = {
                    "can_view": True,
                    "can_edit": True,
                    "can_admin": True,
                    "can_manage": True
                }

            return {
                "permissions": combined_perms,
                "pages": pages_map,
                "is_super": True,
                "role_code": role_code,
                "role_name": role_obj.display_value or role_obj.name if role_obj else None
            }

        # For regular users (manager, asst_manager, executive, etc.)
        granted_features = set()
        for feat_id, child_apis in FEATURE_BUNDLES.items():
            if child_apis:
                match_count = sum(1 for api in child_apis if api in user_perms)
                if match_count >= len(child_apis) * 0.5:
                    granted_features.add(feat_id)

        # Base APIs are always permitted
        combined_perms = list(user_perms | granted_features | UNIVERSAL_BASE_APIS)

        # Compute page-level permissions
        pages_map = {}
        for p in PAGE_DEFINITIONS:
            p_key = p["key"]
            page_feats = [f for f in FEATURE_DEFINITIONS if f.get("page_key") == p_key]
            
            view_feats = [f["id"] for f in page_feats if f.get("tier") == "VIEW"]
            action_feats = [f["id"] for f in page_feats if f.get("tier") == "ACTION"]
            admin_feats = [f["id"] for f in page_feats if f.get("tier") == "ADMIN"]

            can_view = any(fid in granted_features for fid in (view_feats or [f["id"] for f in page_feats]))
            can_edit = any(fid in granted_features for fid in action_feats)
            can_admin = any(fid in granted_features for fid in admin_feats)
            can_manage = can_admin or can_edit

            pages_map[p_key] = {
                "can_view": can_view,
                "can_edit": can_edit,
                "can_admin": can_admin,
                "can_manage": can_manage
            }

        return {
            "permissions": combined_perms,
            "pages": pages_map,
            "is_super": False,
            "role_code": role_code,
            "role_name": role_obj.display_value or role_obj.name if role_obj else None
        }

    except Exception as e:
        logger.error(f"Error computing user permission summary: {str(e)}", exc_info=True)
        return {
            "permissions": list(user.get_perms()) if hasattr(user, 'get_perms') else [],
            "pages": {},
            "is_super": False
        }
