# -*- coding: utf-8 -*-
"""
CRM Master Data ORM Seeder
Generated single function containing embedded datasets for all 15 core CRM models.
Uses pure Django ORM update_or_create to safely populate/update database records.
"""
import os
import sys
from django.db import transaction


# =========================================================================
# adm_perm_group (6 Records)
# =========================================================================
PERM_GROUPS_DATA = [   {   'code': 'USERS',
        'display_value': 'User & Team Management',
        'id': 1,
        'name': 'User Management',
        'organization_id': None,
        'pipeline_id': None},
    {   'code': 'PIPELINE',
        'display_value': 'Pipeline & Stage Management',
        'id': 2,
        'name': 'Pipeline Management',
        'organization_id': None,
        'pipeline_id': None},
    {   'code': 'CAMPAIGN',
        'display_value': 'Campaign Management',
        'id': 3,
        'name': 'Campaign Management',
        'organization_id': None,
        'pipeline_id': None},
    {   'code': 'LEAD_MANAGEMENT',
        'display_value': 'Lead Operations & Approvals',
        'id': 4,
        'name': 'Lead Management',
        'organization_id': None,
        'pipeline_id': None},
    {   'code': 'REPORTS',
        'display_value': 'Reports, Performance & Payments',
        'id': 5,
        'name': 'Reports & Analytics',
        'organization_id': None,
        'pipeline_id': None},
    {   'code': 'ORGANIZATION_SETTINGS',
        'display_value': 'Organization Profile & Config',
        'id': 6,
        'name': 'Organization Settings',
        'organization_id': None,
        'pipeline_id': None}]

# =========================================================================
# adm_perm (141 Records)
# =========================================================================
PERMS_DATA = [   {   'code': 'api_lead_mgmt_add_dropdowns_admin',
        'display_value': 'Lead Mgmt Add Dropdowns',
        'id': 1,
        'name': 'api_lead_mgmt_add_dropdowns_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_lead_mgmt_add_new_lead_admin',
        'display_value': 'Lead Mgmt Add New Lead',
        'id': 2,
        'name': 'api_lead_mgmt_add_new_lead_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_pipeline_categories_admin',
        'display_value': 'View Pipeline Categories',
        'id': 3,
        'name': 'api_pipeline_categories_admin',
        'organization_id': None,
        'perm_group_id': 2,
        'pipeline_id': None},
    {   'code': 'api_campaign_managers_admin',
        'display_value': 'View Campaign Managers',
        'id': 4,
        'name': 'api_campaign_managers_admin',
        'organization_id': None,
        'perm_group_id': 3,
        'pipeline_id': None},
    {   'code': 'api_campaign_agents_admin',
        'display_value': 'Assign Campaign Agents',
        'id': 5,
        'name': 'api_campaign_agents_admin',
        'organization_id': None,
        'perm_group_id': 3,
        'pipeline_id': None},
    {   'code': 'api_create_campaign_admin',
        'display_value': 'Create New Campaign',
        'id': 6,
        'name': 'api_create_campaign_admin',
        'organization_id': None,
        'perm_group_id': 3,
        'pipeline_id': None},
    {   'code': 'api_toggle_campaign_status_admin',
        'display_value': 'Enable / Pause Campaign',
        'id': 7,
        'name': 'api_toggle_campaign_status_admin',
        'organization_id': None,
        'perm_group_id': 2,
        'pipeline_id': None},
    {   'code': 'api_fetch_campaign_detail_admin',
        'display_value': 'View Campaign Details',
        'id': 8,
        'name': 'api_fetch_campaign_detail_admin',
        'organization_id': None,
        'perm_group_id': 3,
        'pipeline_id': None},
    {   'code': 'api_update_campaign_detail_admin',
        'display_value': 'Update Campaign Details',
        'id': 9,
        'name': 'api_update_campaign_detail_admin',
        'organization_id': None,
        'perm_group_id': 3,
        'pipeline_id': None},
    {   'code': 'api_education_pipeline_stats_admin',
        'display_value': 'View Pipeline Stats Overview',
        'id': 10,
        'name': 'api_education_pipeline_stats_admin',
        'organization_id': None,
        'perm_group_id': 2,
        'pipeline_id': None},
    {   'code': 'api_campaign_cards_list_admin',
        'display_value': 'View Campaign Cards List',
        'id': 11,
        'name': 'api_campaign_cards_list_admin',
        'organization_id': None,
        'perm_group_id': 3,
        'pipeline_id': None},
    {   'code': 'api_filter_options_view_admin',
        'display_value': 'Filter Options',
        'id': 12,
        'name': 'api_filter_options_view_admin',
        'organization_id': None,
        'perm_group_id': 6,
        'pipeline_id': None},
    {   'code': 'api_campaign_enquiry_sheet_admin',
        'display_value': 'Campaign Enquiry Sheet',
        'id': 13,
        'name': 'api_campaign_enquiry_sheet_admin',
        'organization_id': None,
        'perm_group_id': 3,
        'pipeline_id': None},
    {   'code': 'api_lead_summary_report_admin',
        'display_value': 'Lead Summary Report',
        'id': 14,
        'name': 'api_lead_summary_report_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_update_lead_summary_admin',
        'display_value': 'Update Lead Summary',
        'id': 15,
        'name': 'api_update_lead_summary_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_delete_lead_summary_admin',
        'display_value': 'Delete Lead Summary',
        'id': 16,
        'name': 'api_delete_lead_summary_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_move_lead_campaign_admin',
        'display_value': 'Move Lead Campaign',
        'id': 17,
        'name': 'api_move_lead_campaign_admin',
        'organization_id': None,
        'perm_group_id': 3,
        'pipeline_id': None},
    {   'code': 'api_assign_lead_telecaller_admin',
        'display_value': 'Assign Lead Telecaller',
        'id': 18,
        'name': 'api_assign_lead_telecaller_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_change_lead_status_admin',
        'display_value': 'Change Lead Status',
        'id': 19,
        'name': 'api_change_lead_status_admin',
        'organization_id': None,
        'perm_group_id': 2,
        'pipeline_id': None},
    {   'code': 'api_call_log_report_admin',
        'display_value': 'View Call Logs Report',
        'id': 20,
        'name': 'api_call_log_report_admin',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_disposition_log_admin',
        'display_value': 'View Call Dispositions Log',
        'id': 21,
        'name': 'api_disposition_log_admin',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_fetch_all_leads_admin',
        'display_value': 'View All Leads',
        'id': 22,
        'name': 'api_fetch_all_leads_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_add_new_lead_admin',
        'display_value': 'Add New Lead',
        'id': 23,
        'name': 'api_add_new_lead_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_upload_lead_excel_admin',
        'display_value': 'Import Leads Excel',
        'id': 24,
        'name': 'api_upload_lead_excel_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_export_all_leads_admin',
        'display_value': 'Export Leads Excel',
        'id': 25,
        'name': 'api_export_all_leads_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_get_filter_dropdowns_admin',
        'display_value': 'Filter Dropdowns',
        'id': 26,
        'name': 'api_get_filter_dropdowns_admin',
        'organization_id': None,
        'perm_group_id': 6,
        'pipeline_id': None},
    {   'code': 'api_fetch_pipeline_leads_admin',
        'display_value': 'View Pipeline Leads',
        'id': 27,
        'name': 'api_fetch_pipeline_leads_admin',
        'organization_id': None,
        'perm_group_id': 2,
        'pipeline_id': None},
    {   'code': 'api_fetch_lead_details_admin',
        'display_value': 'View Lead Full Profile',
        'id': 28,
        'name': 'api_fetch_lead_details_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_get_mark_as_won_info_admin',
        'display_value': 'Mark As Won Info',
        'id': 29,
        'name': 'api_get_mark_as_won_info_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_mark_as_won_admin',
        'display_value': 'Mark Lead as Won',
        'id': 30,
        'name': 'api_mark_as_won_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_get_mark_as_lost_info_admin',
        'display_value': 'Mark As Lost Info',
        'id': 31,
        'name': 'api_get_mark_as_lost_info_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_mark_as_lost_admin',
        'display_value': 'Mark Lead as Lost',
        'id': 32,
        'name': 'api_mark_as_lost_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_edit_lead_admin',
        'display_value': 'Edit Lead Details',
        'id': 33,
        'name': 'api_edit_lead_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_delete_lead_admin',
        'display_value': 'Delete Lead',
        'id': 34,
        'name': 'api_delete_lead_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_reassign_lead_admin',
        'display_value': 'Reassign Lead Owner',
        'id': 35,
        'name': 'api_reassign_lead_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_fetch_loss_lead_approval_requests_admin',
        'display_value': 'View Loss Lead Approvals',
        'id': 36,
        'name': 'api_fetch_loss_lead_approval_requests_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_get_loss_lead_approval_filter_dropdowns_admin',
        'display_value': 'Loss Lead Approval Filter Dropdowns',
        'id': 37,
        'name': 'api_get_loss_lead_approval_filter_dropdowns_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_export_loss_lead_approval_requests_admin',
        'display_value': 'Export Loss Lead Approval Requests',
        'id': 38,
        'name': 'api_export_loss_lead_approval_requests_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_action_loss_lead_approval_admin',
        'display_value': 'Action Loss Lead Approval',
        'id': 39,
        'name': 'api_action_loss_lead_approval_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_get_pending_payment_filter_dropdowns_admin',
        'display_value': 'Pending Payment Filter Dropdowns',
        'id': 40,
        'name': 'api_get_pending_payment_filter_dropdowns_admin',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_fetch_all_pending_payments_admin',
        'display_value': 'View Pending Payments List',
        'id': 41,
        'name': 'api_fetch_all_pending_payments_admin',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_export_pending_payments_admin',
        'display_value': 'Export Pending Payments Excel',
        'id': 42,
        'name': 'api_export_pending_payments_admin',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_fetch_performance_overview_admin',
        'display_value': 'View Performance Overview',
        'id': 43,
        'name': 'api_fetch_performance_overview_admin',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_assign_users_to_team_admin',
        'display_value': 'Assign Users to Team',
        'id': 44,
        'name': 'api_assign_users_to_team_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_update_telecaller_target_admin',
        'display_value': 'Update Telecaller Targets',
        'id': 45,
        'name': 'api_update_telecaller_target_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_get_performance_filter_dropdowns_admin',
        'display_value': 'Performance Filter Dropdowns',
        'id': 46,
        'name': 'api_get_performance_filter_dropdowns_admin',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_export_performance_overview_admin',
        'display_value': 'Export Performance Overview',
        'id': 47,
        'name': 'api_export_performance_overview_admin',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_add_perm',
        'display_value': 'Add Perm',
        'id': 48,
        'name': 'api_add_perm',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_fetch_perms_list',
        'display_value': 'Perms List',
        'id': 49,
        'name': 'api_fetch_perms_list',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_fetch_roles_list',
        'display_value': 'Roles List',
        'id': 50,
        'name': 'api_fetch_roles_list',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_assign_role_perm',
        'display_value': 'Assign Role Perm',
        'id': 51,
        'name': 'api_assign_role_perm',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_fetch_all_leads',
        'display_value': 'All Leads',
        'id': 52,
        'name': 'api_fetch_all_leads',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_add_new_lead',
        'display_value': 'Add New Lead',
        'id': 53,
        'name': 'api_add_new_lead',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_fetch_pipeline_lead',
        'display_value': 'Pipeline Lead',
        'id': 54,
        'name': 'api_fetch_pipeline_lead',
        'organization_id': None,
        'perm_group_id': 2,
        'pipeline_id': None},
    {   'code': 'api_fetch_one_lead',
        'display_value': 'View Lead Details',
        'id': 55,
        'name': 'api_fetch_one_lead',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_fetch_call_history_api',
        'display_value': 'Call History',
        'id': 56,
        'name': 'api_fetch_call_history_api',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_lead_form_detail',
        'display_value': 'Lead Form Detail',
        'id': 57,
        'name': 'api_lead_form_detail',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_call_connect_form',
        'display_value': 'Call Connect Form',
        'id': 58,
        'name': 'api_call_connect_form',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_call_disconnect_form',
        'display_value': 'Call Disconnect Form',
        'id': 59,
        'name': 'api_call_disconnect_form',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_call_disconnect_select_tag',
        'display_value': 'Call Disconnect Select Tag',
        'id': 60,
        'name': 'api_call_disconnect_select_tag',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_fetch_one_loss_lead_detail',
        'display_value': 'One Loss Lead Detail',
        'id': 61,
        'name': 'api_fetch_one_loss_lead_detail',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_loss_lead_update_api',
        'display_value': 'Loss Lead Update',
        'id': 62,
        'name': 'api_loss_lead_update_api',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_fetch_one_won_lead_detail',
        'display_value': 'One Won Lead Detail',
        'id': 63,
        'name': 'api_fetch_one_won_lead_detail',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_won_lead_update_api',
        'display_value': 'Won Lead Update',
        'id': 64,
        'name': 'api_won_lead_update_api',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_get_selected_option',
        'display_value': 'Selected Option',
        'id': 65,
        'name': 'api_get_selected_option',
        'organization_id': None,
        'perm_group_id': 6,
        'pipeline_id': None},
    {   'code': 'api_update_course',
        'display_value': 'Update Course',
        'id': 66,
        'name': 'api_update_course',
        'organization_id': None,
        'perm_group_id': 6,
        'pipeline_id': None},
    {   'code': 'api_fetch_all_payment',
        'display_value': 'All Payment',
        'id': 67,
        'name': 'api_fetch_all_payment',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_pending_payment_tiles',
        'display_value': 'Pending Payment Tiles',
        'id': 68,
        'name': 'api_pending_payment_tiles',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_payment_details',
        'display_value': 'Payment Details',
        'id': 69,
        'name': 'api_payment_details',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_payment_history_api',
        'display_value': 'Payment History',
        'id': 70,
        'name': 'api_payment_history_api',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_dashboard_top_tile',
        'display_value': 'Dashboard Top Tile',
        'id': 71,
        'name': 'api_dashboard_top_tile',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_fetch_pipeline_funnel',
        'display_value': 'Pipeline Funnel',
        'id': 72,
        'name': 'api_fetch_pipeline_funnel',
        'organization_id': None,
        'perm_group_id': 2,
        'pipeline_id': None},
    {   'code': 'api_fetch_tele_performance',
        'display_value': 'Tele Performance',
        'id': 73,
        'name': 'api_fetch_tele_performance',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_get_dashboard_p_d_f_data',
        'display_value': 'Download Dashboard PDF',
        'id': 74,
        'name': 'api_get_dashboard_p_d_f_data',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_add_course',
        'display_value': 'Add Course',
        'id': 75,
        'name': 'api_add_course',
        'organization_id': None,
        'perm_group_id': 6,
        'pipeline_id': None},
    {   'code': 'api_coursename',
        'display_value': 'Coursename',
        'id': 76,
        'name': 'api_coursename',
        'organization_id': None,
        'perm_group_id': 6,
        'pipeline_id': None},
    {   'code': 'api_mark_notification_read',
        'display_value': 'Mark Notification Read',
        'id': 77,
        'name': 'api_mark_notification_read',
        'organization_id': None,
        'perm_group_id': 6,
        'pipeline_id': None},
    {   'code': 'api_daily_report_api',
        'display_value': 'Daily Report',
        'id': 78,
        'name': 'api_daily_report_api',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_submit_daily_report_view',
        'display_value': 'Submit Daily Report',
        'id': 79,
        'name': 'api_submit_daily_report_view',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_download_daily_report_view',
        'display_value': 'Download Daily Report',
        'id': 80,
        'name': 'api_download_daily_report_view',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_get_all_settings_api',
        'display_value': 'All Settings',
        'id': 81,
        'name': 'api_get_all_settings_api',
        'organization_id': None,
        'perm_group_id': 6,
        'pipeline_id': None},
    {   'code': 'api_notification_api',
        'display_value': 'Notification',
        'id': 82,
        'name': 'api_notification_api',
        'organization_id': None,
        'perm_group_id': 6,
        'pipeline_id': None},
    {   'code': 'api_followup_update_api',
        'display_value': 'Followup Update',
        'id': 83,
        'name': 'api_followup_update_api',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_caller_setting_api',
        'display_value': 'Caller Setting',
        'id': 84,
        'name': 'api_caller_setting_api',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_message_Setting_api',
        'display_value': 'Message Setting',
        'id': 85,
        'name': 'api_message_Setting_api',
        'organization_id': None,
        'perm_group_id': 6,
        'pipeline_id': None},
    {   'code': 'api_notes_setting_api',
        'display_value': 'Notes Setting',
        'id': 86,
        'name': 'api_notes_setting_api',
        'organization_id': None,
        'perm_group_id': 6,
        'pipeline_id': None},
    {   'code': 'api_lead_preference_api',
        'display_value': 'Lead Preference',
        'id': 87,
        'name': 'api_lead_preference_api',
        'organization_id': None,
        'perm_group_id': 2,
        'pipeline_id': None},
    {   'code': 'api_tw_fa_api',
        'display_value': 'Two-Factor Authentication (2FA)',
        'id': 88,
        'name': 'api_tw_fa_api',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_testing_notifiy',
        'display_value': 'Testing Notifiy',
        'id': 89,
        'name': 'api_testing_notifiy',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_collection_query',
        'display_value': 'Collection Query',
        'id': 90,
        'name': 'api_collection_query',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_get_select_option',
        'display_value': 'Select Option',
        'id': 91,
        'name': 'api_get_select_option',
        'organization_id': None,
        'perm_group_id': 6,
        'pipeline_id': None},
    {   'code': 'api_create_dropdown_sub',
        'display_value': 'Create Lead Dropdown Options',
        'id': 92,
        'name': 'api_create_dropdown_sub',
        'organization_id': None,
        'perm_group_id': 6,
        'pipeline_id': None},
    {   'code': 'api_dropdown_cate_create',
        'display_value': 'Dropdown Cate Create',
        'id': 93,
        'name': 'api_dropdown_cate_create',
        'organization_id': None,
        'perm_group_id': 6,
        'pipeline_id': None},
    {   'code': 'api_create_role',
        'display_value': 'Create Role',
        'id': 94,
        'name': 'api_create_role',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_excel_upload',
        'display_value': 'Excel Upload',
        'id': 95,
        'name': 'api_excel_upload',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_preview_lead_excel',
        'display_value': 'Preview Lead Excel',
        'id': 96,
        'name': 'api_preview_lead_excel',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_export_column',
        'display_value': 'Export Column',
        'id': 97,
        'name': 'api_export_column',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_export_json_data',
        'display_value': 'Export Json Data',
        'id': 98,
        'name': 'api_export_json_data',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_dynamic_export_excel',
        'display_value': 'Dynamic Export Excel',
        'id': 99,
        'name': 'api_dynamic_export_excel',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_dynamic_pdf_genrate',
        'display_value': 'Dynamic Pdf Genrate',
        'id': 100,
        'name': 'api_dynamic_pdf_genrate',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_whatsapp_webhook',
        'display_value': 'Whatsapp Webhook',
        'id': 101,
        'name': 'api_whatsapp_webhook',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_edit_user_admin',
        'display_value': 'Edit User Information',
        'id': 102,
        'name': 'api_edit_user_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_toggle_user_status_admin',
        'display_value': 'Enable / Disable User',
        'id': 103,
        'name': 'api_toggle_user_status_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_change_user_password_admin',
        'display_value': 'Reset User Password',
        'id': 104,
        'name': 'api_change_user_password_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_fetch_all_users_admin',
        'display_value': 'View Users List',
        'id': 105,
        'name': 'api_fetch_all_users_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_create_user_admin',
        'display_value': 'Create New User',
        'id': 106,
        'name': 'api_create_user_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_toggle_lead_assignment_admin',
        'display_value': 'Toggle Lead Assignment',
        'id': 107,
        'name': 'api_toggle_lead_assignment_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_transfer_leads_admin',
        'display_value': 'Transfer User Leads',
        'id': 108,
        'name': 'api_transfer_leads_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_delete_user_admin',
        'display_value': 'Delete User',
        'id': 109,
        'name': 'api_delete_user_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_enable_disable_lead_assignment_admin',
        'display_value': 'Enable / Disable Lead Auto-Assignment',
        'id': 110,
        'name': 'api_enable_disable_lead_assignment_admin',
        'organization_id': None,
        'perm_group_id': 4,
        'pipeline_id': None},
    {   'code': 'api_get_organization_profile_admin',
        'display_value': 'View Organization Profile',
        'id': 111,
        'name': 'api_get_organization_profile_admin',
        'organization_id': None,
        'perm_group_id': 6,
        'pipeline_id': None},
    {   'code': 'api_fetch_all_teams_admin',
        'display_value': 'View Teams List',
        'id': 112,
        'name': 'api_fetch_all_teams_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_set_monthly_target_admin',
        'display_value': 'Set Monthly Performance Target',
        'id': 113,
        'name': 'api_set_monthly_target_admin',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_transfer_single_campaign_leads_admin',
        'display_value': 'Transfer Single Campaign Leads',
        'id': 114,
        'name': 'api_transfer_single_campaign_leads_admin',
        'organization_id': None,
        'perm_group_id': 3,
        'pipeline_id': None},
    {   'code': 'api_fetch_user_campaigns_admin',
        'display_value': 'User Campaigns',
        'id': 115,
        'name': 'api_fetch_user_campaigns_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_create_organization_profile_admin',
        'display_value': 'Create Organization Profile',
        'id': 116,
        'name': 'api_create_organization_profile_admin',
        'organization_id': None,
        'perm_group_id': 6,
        'pipeline_id': None},
    {   'code': 'api_fetch_team_dropdowns_admin',
        'display_value': 'Team Dropdowns',
        'id': 117,
        'name': 'api_fetch_team_dropdowns_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_fetch_user_transfer_campaigns_admin',
        'display_value': 'User Transfer Campaigns',
        'id': 118,
        'name': 'api_fetch_user_transfer_campaigns_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_edit_team_admin',
        'display_value': 'Edit Team Details',
        'id': 119,
        'name': 'api_edit_team_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_delete_team_admin',
        'display_value': 'Delete Team',
        'id': 120,
        'name': 'api_delete_team_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_edit_organization_profile_admin',
        'display_value': 'Edit Organization Settings',
        'id': 121,
        'name': 'api_edit_organization_profile_admin',
        'organization_id': None,
        'perm_group_id': 6,
        'pipeline_id': None},
    {   'code': 'api_create_user',
        'display_value': 'Create User',
        'id': 122,
        'name': 'api_create_user',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_fetch_user_dropdowns_admin',
        'display_value': 'View User Dropdown Options',
        'id': 123,
        'name': 'api_fetch_user_dropdowns_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_create_team_admin',
        'display_value': 'Create New Team',
        'id': 124,
        'name': 'api_create_team_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_fetch_user_delete_summary_admin',
        'display_value': 'User Delete Summary',
        'id': 125,
        'name': 'api_fetch_user_delete_summary_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_fetch_transfer_telecallers_admin',
        'display_value': 'Transfer Telecallers',
        'id': 126,
        'name': 'api_fetch_transfer_telecallers_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_transfer_all_campaigns_leads_admin',
        'display_value': 'Transfer All Campaigns Leads',
        'id': 127,
        'name': 'api_transfer_all_campaigns_leads_admin',
        'organization_id': None,
        'perm_group_id': 3,
        'pipeline_id': None},
    {   'code': 'api_fetch_monthly_target_admin',
        'display_value': 'View Monthly Targets',
        'id': 128,
        'name': 'api_fetch_monthly_target_admin',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_fetch_target_dropdowns_admin',
        'display_value': 'Target Dropdowns',
        'id': 129,
        'name': 'api_fetch_target_dropdowns_admin',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None},
    {   'code': 'api_get_roles_and_permissions',
        'display_value': 'View Roles & Permissions',
        'id': 130,
        'name': 'api_get_roles_and_permissions',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_update_role_permission',
        'display_value': 'Update Role Permission',
        'id': 131,
        'name': 'api_update_role_permission',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_delete_campaign_admin',
        'display_value': 'Delete Campaign Admin',
        'id': 219,
        'name': 'api_delete_campaign_admin',
        'organization_id': None,
        'perm_group_id': 3,
        'pipeline_id': None},
    {   'code': 'api_verify_lead_import',
        'display_value': 'api_verify_lead_import',
        'id': 220,
        'name': 'Verify Lead Import Rows',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_submit_lead_import',
        'display_value': 'api_submit_lead_import',
        'id': 221,
        'name': 'Submit Lead Import Rows',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_fetch_loss_reasons_admin',
        'display_value': 'Fetch Loss Reasons Admin',
        'id': 222,
        'name': 'api_fetch_loss_reasons_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_create_loss_reason_admin',
        'display_value': 'Create Loss Reason Admin',
        'id': 223,
        'name': 'api_create_loss_reason_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_update_loss_reason_admin',
        'display_value': 'Update Loss Reason Admin',
        'id': 224,
        'name': 'api_update_loss_reason_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_get_loss_reasons_admin',
        'display_value': 'Get Loss Reasons By Pipeline Admin',
        'id': 225,
        'name': 'api_get_loss_reasons_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_add_loss_reason_admin',
        'display_value': 'Add Loss Reason By Pipeline Admin',
        'id': 226,
        'name': 'api_add_loss_reason_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_delete_loss_reason_admin',
        'display_value': 'Delete Loss Reason By Pipeline Admin',
        'id': 227,
        'name': 'api_delete_loss_reason_admin',
        'organization_id': None,
        'perm_group_id': 1,
        'pipeline_id': None},
    {   'code': 'api_admin_dashboard',
        'display_value': 'Admin Dashboard Overview',
        'id': 228,
        'name': 'api_admin_dashboard',
        'organization_id': None,
        'perm_group_id': 5,
        'pipeline_id': None}]

# =========================================================================
# adm_role (6 Records)
# =========================================================================
ROLES_DATA = [   {   'code': 'ADM',
        'description': 'Administrator Role',
        'display_value': 'Admin',
        'id': 1,
        'name': 'admin',
        'organization_id': None,
        'perms': [   'api_delete_campaign_admin',
                     'api_pipeline_categories_admin',
                     'api_campaign_managers_admin',
                     'api_campaign_agents_admin',
                     'api_create_campaign_admin',
                     'api_toggle_campaign_status_admin',
                     'api_fetch_campaign_detail_admin',
                     'api_update_campaign_detail_admin',
                     'api_education_pipeline_stats_admin',
                     'api_campaign_cards_list_admin',
                     'api_campaign_enquiry_sheet_admin',
                     'api_lead_summary_report_admin',
                     'api_update_lead_summary_admin',
                     'api_delete_lead_summary_admin',
                     'api_move_lead_campaign_admin',
                     'api_assign_lead_telecaller_admin',
                     'api_change_lead_status_admin',
                     'api_call_log_report_admin',
                     'api_disposition_log_admin',
                     'api_fetch_all_leads_admin',
                     'api_upload_lead_excel_admin',
                     'api_export_all_leads_admin',
                     'api_fetch_pipeline_leads_admin',
                     'api_fetch_lead_details_admin',
                     'api_get_mark_as_won_info_admin',
                     'api_mark_as_won_admin',
                     'api_get_mark_as_lost_info_admin',
                     'api_mark_as_lost_admin',
                     'api_edit_lead_admin',
                     'api_delete_lead_admin',
                     'api_reassign_lead_admin',
                     'api_get_loss_lead_approval_filter_dropdowns_admin',
                     'api_export_loss_lead_approval_requests_admin',
                     'api_action_loss_lead_approval_admin',
                     'api_get_pending_payment_filter_dropdowns_admin',
                     'api_fetch_all_pending_payments_admin',
                     'api_export_pending_payments_admin',
                     'api_fetch_performance_overview_admin',
                     'api_assign_users_to_team_admin',
                     'api_update_telecaller_target_admin',
                     'api_get_performance_filter_dropdowns_admin',
                     'api_export_performance_overview_admin',
                     'api_update_role_permission',
                     'api_update_loss_reason_admin',
                     'api_fetch_all_leads',
                     'api_fetch_pipeline_lead',
                     'api_get_dashboard_p_d_f_data',
                     'api_fetch_call_history_api',
                     'api_fetch_one_loss_lead_detail',
                     'api_loss_lead_update_api',
                     'api_fetch_one_won_lead_detail',
                     'api_won_lead_update_api',
                     'api_fetch_all_payment',
                     'api_payment_history_api',
                     'api_fetch_tele_performance',
                     'api_daily_report_api',
                     'api_submit_daily_report_view',
                     'api_download_daily_report_view',
                     'api_followup_update_api',
                     'api_message_Setting_api',
                     'api_notes_setting_api',
                     'api_create_dropdown_sub',
                     'api_edit_user_admin',
                     'api_toggle_user_status_admin',
                     'api_change_user_password_admin',
                     'api_fetch_all_users_admin',
                     'api_create_user_admin',
                     'api_toggle_lead_assignment_admin',
                     'api_transfer_leads_admin',
                     'api_fetch_one_lead',
                     'api_verify_lead_import',
                     'api_submit_lead_import',
                     'api_lead_form_detail',
                     'api_call_connect_form',
                     'api_call_disconnect_form',
                     'api_call_disconnect_select_tag',
                     'api_update_course',
                     'api_pending_payment_tiles',
                     'api_payment_details',
                     'api_dashboard_top_tile',
                     'api_add_course',
                     'api_dropdown_cate_create',
                     'api_create_role',
                     'api_excel_upload',
                     'api_preview_lead_excel',
                     'api_dynamic_export_excel',
                     'api_dynamic_pdf_genrate',
                     'api_fetch_loss_lead_approval_requests_admin',
                     'api_fetch_pipeline_funnel',
                     'api_delete_user_admin',
                     'api_enable_disable_lead_assignment_admin',
                     'api_get_organization_profile_admin',
                     'api_fetch_all_teams_admin',
                     'api_set_monthly_target_admin',
                     'api_transfer_single_campaign_leads_admin',
                     'api_fetch_user_campaigns_admin',
                     'api_create_organization_profile_admin',
                     'api_fetch_team_dropdowns_admin',
                     'api_fetch_user_transfer_campaigns_admin',
                     'api_edit_team_admin',
                     'api_delete_team_admin',
                     'api_edit_organization_profile_admin',
                     'api_fetch_user_dropdowns_admin',
                     'api_create_team_admin',
                     'api_fetch_user_delete_summary_admin',
                     'api_fetch_transfer_telecallers_admin',
                     'api_create_user',
                     'api_transfer_all_campaigns_leads_admin',
                     'api_fetch_monthly_target_admin',
                     'api_fetch_target_dropdowns_admin',
                     'api_get_roles_and_permissions',
                     'api_fetch_loss_reasons_admin',
                     'api_create_loss_reason_admin',
                     'api_get_loss_reasons_admin',
                     'api_add_loss_reason_admin',
                     'api_delete_loss_reason_admin',
                     'api_admin_dashboard']},
    {   'code': 'MGR',
        'description': 'Manager Role',
        'display_value': 'Manager',
        'id': 2,
        'name': 'manager',
        'organization_id': None,
        'perms': [   'api_lead_mgmt_add_new_lead_admin',
                     'api_pipeline_categories_admin',
                     'api_campaign_managers_admin',
                     'api_campaign_agents_admin',
                     'api_create_campaign_admin',
                     'api_toggle_campaign_status_admin',
                     'api_fetch_campaign_detail_admin',
                     'api_update_campaign_detail_admin',
                     'api_education_pipeline_stats_admin',
                     'api_campaign_cards_list_admin',
                     'api_campaign_enquiry_sheet_admin',
                     'api_lead_summary_report_admin',
                     'api_update_lead_summary_admin',
                     'api_move_lead_campaign_admin',
                     'api_assign_lead_telecaller_admin',
                     'api_change_lead_status_admin',
                     'api_call_log_report_admin',
                     'api_disposition_log_admin',
                     'api_fetch_all_leads_admin',
                     'api_add_new_lead_admin',
                     'api_upload_lead_excel_admin',
                     'api_export_all_leads_admin',
                     'api_fetch_pipeline_leads_admin',
                     'api_fetch_lead_details_admin',
                     'api_get_mark_as_won_info_admin',
                     'api_mark_as_won_admin',
                     'api_get_mark_as_lost_info_admin',
                     'api_mark_as_lost_admin',
                     'api_edit_lead_admin',
                     'api_reassign_lead_admin',
                     'api_get_loss_lead_approval_filter_dropdowns_admin',
                     'api_export_loss_lead_approval_requests_admin',
                     'api_action_loss_lead_approval_admin',
                     'api_get_pending_payment_filter_dropdowns_admin',
                     'api_fetch_all_pending_payments_admin',
                     'api_export_pending_payments_admin',
                     'api_fetch_performance_overview_admin',
                     'api_assign_users_to_team_admin',
                     'api_update_telecaller_target_admin',
                     'api_get_performance_filter_dropdowns_admin',
                     'api_export_performance_overview_admin',
                     'api_update_loss_reason_admin',
                     'api_fetch_all_leads',
                     'api_fetch_pipeline_lead',
                     'api_get_dashboard_p_d_f_data',
                     'api_fetch_call_history_api',
                     'api_fetch_one_loss_lead_detail',
                     'api_loss_lead_update_api',
                     'api_fetch_one_won_lead_detail',
                     'api_won_lead_update_api',
                     'api_fetch_all_payment',
                     'api_payment_history_api',
                     'api_fetch_tele_performance',
                     'api_daily_report_api',
                     'api_submit_daily_report_view',
                     'api_download_daily_report_view',
                     'api_followup_update_api',
                     'api_message_Setting_api',
                     'api_notes_setting_api',
                     'api_create_dropdown_sub',
                     'api_edit_user_admin',
                     'api_toggle_user_status_admin',
                     'api_change_user_password_admin',
                     'api_fetch_all_users_admin',
                     'api_create_user_admin',
                     'api_toggle_lead_assignment_admin',
                     'api_transfer_leads_admin',
                     'api_fetch_one_lead',
                     'api_verify_lead_import',
                     'api_submit_lead_import',
                     'api_add_new_lead',
                     'api_lead_form_detail',
                     'api_call_connect_form',
                     'api_call_disconnect_form',
                     'api_call_disconnect_select_tag',
                     'api_update_course',
                     'api_pending_payment_tiles',
                     'api_payment_details',
                     'api_dashboard_top_tile',
                     'api_add_course',
                     'api_dropdown_cate_create',
                     'api_excel_upload',
                     'api_preview_lead_excel',
                     'api_dynamic_export_excel',
                     'api_dynamic_pdf_genrate',
                     'api_lead_mgmt_add_dropdowns_admin',
                     'api_fetch_loss_lead_approval_requests_admin',
                     'api_fetch_pipeline_funnel',
                     'api_delete_user_admin',
                     'api_enable_disable_lead_assignment_admin',
                     'api_fetch_all_teams_admin',
                     'api_set_monthly_target_admin',
                     'api_transfer_single_campaign_leads_admin',
                     'api_fetch_user_campaigns_admin',
                     'api_fetch_team_dropdowns_admin',
                     'api_fetch_user_transfer_campaigns_admin',
                     'api_edit_team_admin',
                     'api_delete_team_admin',
                     'api_fetch_user_dropdowns_admin',
                     'api_create_team_admin',
                     'api_fetch_user_delete_summary_admin',
                     'api_fetch_transfer_telecallers_admin',
                     'api_create_user',
                     'api_transfer_all_campaigns_leads_admin',
                     'api_fetch_monthly_target_admin',
                     'api_fetch_target_dropdowns_admin',
                     'api_fetch_loss_reasons_admin',
                     'api_create_loss_reason_admin',
                     'api_get_loss_reasons_admin',
                     'api_add_loss_reason_admin',
                     'api_delete_loss_reason_admin',
                     'api_admin_dashboard']},
    {   'code': 'AMGR',
        'description': 'Assistant Manager Role',
        'display_value': 'Asst Manager',
        'id': 3,
        'name': 'asst_manager',
        'organization_id': None,
        'perms': [   'api_lead_mgmt_add_new_lead_admin',
                     'api_pipeline_categories_admin',
                     'api_campaign_managers_admin',
                     'api_campaign_agents_admin',
                     'api_fetch_campaign_detail_admin',
                     'api_education_pipeline_stats_admin',
                     'api_campaign_cards_list_admin',
                     'api_campaign_enquiry_sheet_admin',
                     'api_lead_summary_report_admin',
                     'api_update_lead_summary_admin',
                     'api_move_lead_campaign_admin',
                     'api_assign_lead_telecaller_admin',
                     'api_change_lead_status_admin',
                     'api_fetch_all_leads_admin',
                     'api_add_new_lead_admin',
                     'api_upload_lead_excel_admin',
                     'api_export_all_leads_admin',
                     'api_fetch_pipeline_leads_admin',
                     'api_fetch_lead_details_admin',
                     'api_get_mark_as_won_info_admin',
                     'api_mark_as_won_admin',
                     'api_get_mark_as_lost_info_admin',
                     'api_mark_as_lost_admin',
                     'api_edit_lead_admin',
                     'api_reassign_lead_admin',
                     'api_get_loss_lead_approval_filter_dropdowns_admin',
                     'api_export_loss_lead_approval_requests_admin',
                     'api_action_loss_lead_approval_admin',
                     'api_get_pending_payment_filter_dropdowns_admin',
                     'api_fetch_all_pending_payments_admin',
                     'api_export_pending_payments_admin',
                     'api_fetch_performance_overview_admin',
                     'api_assign_users_to_team_admin',
                     'api_update_telecaller_target_admin',
                     'api_get_performance_filter_dropdowns_admin',
                     'api_export_performance_overview_admin',
                     'api_update_loss_reason_admin',
                     'api_fetch_all_leads',
                     'api_fetch_pipeline_lead',
                     'api_get_dashboard_p_d_f_data',
                     'api_fetch_one_loss_lead_detail',
                     'api_loss_lead_update_api',
                     'api_fetch_one_won_lead_detail',
                     'api_won_lead_update_api',
                     'api_fetch_all_payment',
                     'api_payment_history_api',
                     'api_fetch_tele_performance',
                     'api_daily_report_api',
                     'api_submit_daily_report_view',
                     'api_download_daily_report_view',
                     'api_followup_update_api',
                     'api_message_Setting_api',
                     'api_notes_setting_api',
                     'api_create_dropdown_sub',
                     'api_fetch_all_users_admin',
                     'api_toggle_lead_assignment_admin',
                     'api_transfer_leads_admin',
                     'api_fetch_one_lead',
                     'api_verify_lead_import',
                     'api_submit_lead_import',
                     'api_add_new_lead',
                     'api_lead_form_detail',
                     'api_update_course',
                     'api_pending_payment_tiles',
                     'api_payment_details',
                     'api_dashboard_top_tile',
                     'api_add_course',
                     'api_dropdown_cate_create',
                     'api_excel_upload',
                     'api_preview_lead_excel',
                     'api_dynamic_export_excel',
                     'api_dynamic_pdf_genrate',
                     'api_lead_mgmt_add_dropdowns_admin',
                     'api_fetch_loss_lead_approval_requests_admin',
                     'api_fetch_pipeline_funnel',
                     'api_enable_disable_lead_assignment_admin',
                     'api_fetch_all_teams_admin',
                     'api_set_monthly_target_admin',
                     'api_transfer_single_campaign_leads_admin',
                     'api_fetch_user_campaigns_admin',
                     'api_fetch_team_dropdowns_admin',
                     'api_fetch_user_transfer_campaigns_admin',
                     'api_edit_team_admin',
                     'api_delete_team_admin',
                     'api_fetch_user_dropdowns_admin',
                     'api_create_team_admin',
                     'api_fetch_transfer_telecallers_admin',
                     'api_transfer_all_campaigns_leads_admin',
                     'api_fetch_monthly_target_admin',
                     'api_fetch_target_dropdowns_admin',
                     'api_fetch_loss_reasons_admin',
                     'api_create_loss_reason_admin',
                     'api_get_loss_reasons_admin',
                     'api_add_loss_reason_admin',
                     'api_delete_loss_reason_admin',
                     'api_admin_dashboard']},
    {   'code': 'EXE',
        'description': 'Executive Role',
        'display_value': 'Executive',
        'id': 4,
        'name': 'executive',
        'organization_id': None,
        'perms': [   'api_lead_mgmt_add_new_lead_admin',
                     'api_pipeline_categories_admin',
                     'api_education_pipeline_stats_admin',
                     'api_lead_summary_report_admin',
                     'api_update_lead_summary_admin',
                     'api_change_lead_status_admin',
                     'api_call_log_report_admin',
                     'api_disposition_log_admin',
                     'api_fetch_all_leads_admin',
                     'api_add_new_lead_admin',
                     'api_export_all_leads_admin',
                     'api_fetch_pipeline_leads_admin',
                     'api_fetch_lead_details_admin',
                     'api_get_mark_as_won_info_admin',
                     'api_mark_as_won_admin',
                     'api_get_mark_as_lost_info_admin',
                     'api_mark_as_lost_admin',
                     'api_edit_lead_admin',
                     'api_get_loss_lead_approval_filter_dropdowns_admin',
                     'api_export_loss_lead_approval_requests_admin',
                     'api_action_loss_lead_approval_admin',
                     'api_get_pending_payment_filter_dropdowns_admin',
                     'api_fetch_all_pending_payments_admin',
                     'api_export_pending_payments_admin',
                     'api_fetch_performance_overview_admin',
                     'api_update_telecaller_target_admin',
                     'api_get_performance_filter_dropdowns_admin',
                     'api_export_performance_overview_admin',
                     'api_fetch_all_leads',
                     'api_fetch_pipeline_lead',
                     'api_get_dashboard_p_d_f_data',
                     'api_fetch_call_history_api',
                     'api_fetch_one_loss_lead_detail',
                     'api_loss_lead_update_api',
                     'api_fetch_one_won_lead_detail',
                     'api_won_lead_update_api',
                     'api_fetch_all_payment',
                     'api_payment_history_api',
                     'api_fetch_tele_performance',
                     'api_daily_report_api',
                     'api_submit_daily_report_view',
                     'api_download_daily_report_view',
                     'api_followup_update_api',
                     'api_fetch_all_users_admin',
                     'api_fetch_one_lead',
                     'api_add_new_lead',
                     'api_lead_form_detail',
                     'api_call_connect_form',
                     'api_call_disconnect_form',
                     'api_call_disconnect_select_tag',
                     'api_pending_payment_tiles',
                     'api_payment_details',
                     'api_dashboard_top_tile',
                     'api_dynamic_export_excel',
                     'api_dynamic_pdf_genrate',
                     'api_lead_mgmt_add_dropdowns_admin',
                     'api_fetch_loss_lead_approval_requests_admin',
                     'api_fetch_pipeline_funnel',
                     'api_set_monthly_target_admin',
                     'api_fetch_user_campaigns_admin',
                     'api_fetch_user_transfer_campaigns_admin',
                     'api_fetch_user_dropdowns_admin',
                     'api_fetch_monthly_target_admin',
                     'api_fetch_target_dropdowns_admin',
                     'api_admin_dashboard']},
    {   'code': 'DEV',
        'description': 'Developer System Role',
        'display_value': 'Developer',
        'id': 6,
        'name': 'developer',
        'organization_id': None,
        'perms': [   'api_lead_mgmt_add_dropdowns_admin',
                     'api_lead_mgmt_add_new_lead_admin',
                     'api_pipeline_categories_admin',
                     'api_campaign_managers_admin',
                     'api_campaign_agents_admin',
                     'api_create_campaign_admin',
                     'api_toggle_campaign_status_admin',
                     'api_fetch_campaign_detail_admin',
                     'api_update_campaign_detail_admin',
                     'api_education_pipeline_stats_admin',
                     'api_campaign_cards_list_admin',
                     'api_filter_options_view_admin',
                     'api_campaign_enquiry_sheet_admin',
                     'api_lead_summary_report_admin',
                     'api_update_lead_summary_admin',
                     'api_delete_lead_summary_admin',
                     'api_move_lead_campaign_admin',
                     'api_assign_lead_telecaller_admin',
                     'api_change_lead_status_admin',
                     'api_call_log_report_admin',
                     'api_disposition_log_admin',
                     'api_fetch_all_leads_admin',
                     'api_add_new_lead_admin',
                     'api_upload_lead_excel_admin',
                     'api_export_all_leads_admin',
                     'api_get_filter_dropdowns_admin',
                     'api_fetch_pipeline_leads_admin',
                     'api_fetch_lead_details_admin',
                     'api_get_mark_as_won_info_admin',
                     'api_mark_as_won_admin',
                     'api_get_mark_as_lost_info_admin',
                     'api_mark_as_lost_admin',
                     'api_edit_lead_admin',
                     'api_delete_lead_admin',
                     'api_reassign_lead_admin',
                     'api_fetch_loss_lead_approval_requests_admin',
                     'api_get_loss_lead_approval_filter_dropdowns_admin',
                     'api_export_loss_lead_approval_requests_admin',
                     'api_action_loss_lead_approval_admin',
                     'api_get_pending_payment_filter_dropdowns_admin',
                     'api_fetch_all_pending_payments_admin',
                     'api_export_pending_payments_admin',
                     'api_fetch_performance_overview_admin',
                     'api_assign_users_to_team_admin',
                     'api_update_telecaller_target_admin',
                     'api_get_performance_filter_dropdowns_admin',
                     'api_export_performance_overview_admin',
                     'api_add_perm',
                     'api_fetch_perms_list',
                     'api_fetch_roles_list',
                     'api_assign_role_perm',
                     'api_fetch_all_leads',
                     'api_add_new_lead',
                     'api_fetch_pipeline_lead',
                     'api_fetch_one_lead',
                     'api_fetch_call_history_api',
                     'api_lead_form_detail',
                     'api_call_connect_form',
                     'api_call_disconnect_form',
                     'api_call_disconnect_select_tag',
                     'api_fetch_one_loss_lead_detail',
                     'api_loss_lead_update_api',
                     'api_fetch_one_won_lead_detail',
                     'api_won_lead_update_api',
                     'api_get_selected_option',
                     'api_update_course',
                     'api_fetch_all_payment',
                     'api_pending_payment_tiles',
                     'api_payment_details',
                     'api_payment_history_api',
                     'api_dashboard_top_tile',
                     'api_fetch_pipeline_funnel',
                     'api_fetch_tele_performance',
                     'api_get_dashboard_p_d_f_data',
                     'api_add_course',
                     'api_coursename',
                     'api_mark_notification_read',
                     'api_daily_report_api',
                     'api_submit_daily_report_view',
                     'api_download_daily_report_view',
                     'api_get_all_settings_api',
                     'api_notification_api',
                     'api_followup_update_api',
                     'api_caller_setting_api',
                     'api_message_Setting_api',
                     'api_notes_setting_api',
                     'api_lead_preference_api',
                     'api_tw_fa_api',
                     'api_testing_notifiy',
                     'api_collection_query',
                     'api_get_select_option',
                     'api_create_dropdown_sub',
                     'api_dropdown_cate_create',
                     'api_create_role',
                     'api_excel_upload',
                     'api_preview_lead_excel',
                     'api_export_column',
                     'api_export_json_data',
                     'api_dynamic_export_excel',
                     'api_dynamic_pdf_genrate',
                     'api_whatsapp_webhook',
                     'api_edit_user_admin',
                     'api_toggle_user_status_admin',
                     'api_change_user_password_admin',
                     'api_fetch_all_users_admin',
                     'api_create_user_admin',
                     'api_toggle_lead_assignment_admin',
                     'api_transfer_leads_admin',
                     'api_delete_user_admin',
                     'api_enable_disable_lead_assignment_admin',
                     'api_get_organization_profile_admin',
                     'api_fetch_all_teams_admin',
                     'api_set_monthly_target_admin',
                     'api_transfer_single_campaign_leads_admin',
                     'api_fetch_user_campaigns_admin',
                     'api_create_organization_profile_admin',
                     'api_fetch_team_dropdowns_admin',
                     'api_fetch_user_transfer_campaigns_admin',
                     'api_edit_team_admin',
                     'api_delete_team_admin',
                     'api_edit_organization_profile_admin',
                     'api_create_user',
                     'api_fetch_user_dropdowns_admin',
                     'api_create_team_admin',
                     'api_fetch_user_delete_summary_admin',
                     'api_fetch_transfer_telecallers_admin',
                     'api_transfer_all_campaigns_leads_admin',
                     'api_fetch_monthly_target_admin',
                     'api_fetch_target_dropdowns_admin',
                     'api_get_roles_and_permissions',
                     'api_update_role_permission',
                     'api_delete_campaign_admin',
                     'api_verify_lead_import',
                     'api_submit_lead_import',
                     'api_fetch_loss_reasons_admin',
                     'api_create_loss_reason_admin',
                     'api_update_loss_reason_admin',
                     'api_get_loss_reasons_admin',
                     'api_add_loss_reason_admin',
                     'api_delete_loss_reason_admin',
                     'api_admin_dashboard']},
    {   'code': 'TEAM_LEAD',
        'description': 'Custom role created from Executive',
        'display_value': 'Team Lead',
        'id': 14,
        'name': 'team_lead',
        'organization_id': None,
        'perms': [   'api_lead_mgmt_add_new_lead_admin',
                     'api_pipeline_categories_admin',
                     'api_education_pipeline_stats_admin',
                     'api_lead_summary_report_admin',
                     'api_update_lead_summary_admin',
                     'api_assign_lead_telecaller_admin',
                     'api_change_lead_status_admin',
                     'api_call_log_report_admin',
                     'api_disposition_log_admin',
                     'api_fetch_all_leads_admin',
                     'api_add_new_lead_admin',
                     'api_upload_lead_excel_admin',
                     'api_export_all_leads_admin',
                     'api_fetch_pipeline_leads_admin',
                     'api_fetch_lead_details_admin',
                     'api_get_mark_as_won_info_admin',
                     'api_mark_as_won_admin',
                     'api_get_mark_as_lost_info_admin',
                     'api_mark_as_lost_admin',
                     'api_edit_lead_admin',
                     'api_reassign_lead_admin',
                     'api_get_pending_payment_filter_dropdowns_admin',
                     'api_fetch_all_pending_payments_admin',
                     'api_export_pending_payments_admin',
                     'api_fetch_performance_overview_admin',
                     'api_update_telecaller_target_admin',
                     'api_get_performance_filter_dropdowns_admin',
                     'api_export_performance_overview_admin',
                     'api_update_loss_reason_admin',
                     'api_fetch_all_leads',
                     'api_fetch_pipeline_lead',
                     'api_get_dashboard_p_d_f_data',
                     'api_fetch_call_history_api',
                     'api_fetch_one_loss_lead_detail',
                     'api_loss_lead_update_api',
                     'api_fetch_one_won_lead_detail',
                     'api_won_lead_update_api',
                     'api_fetch_all_payment',
                     'api_payment_history_api',
                     'api_fetch_tele_performance',
                     'api_daily_report_api',
                     'api_submit_daily_report_view',
                     'api_download_daily_report_view',
                     'api_followup_update_api',
                     'api_message_Setting_api',
                     'api_notes_setting_api',
                     'api_create_dropdown_sub',
                     'api_fetch_all_users_admin',
                     'api_toggle_lead_assignment_admin',
                     'api_transfer_leads_admin',
                     'api_fetch_one_lead',
                     'api_verify_lead_import',
                     'api_submit_lead_import',
                     'api_add_new_lead',
                     'api_lead_form_detail',
                     'api_call_connect_form',
                     'api_call_disconnect_form',
                     'api_call_disconnect_select_tag',
                     'api_update_course',
                     'api_pending_payment_tiles',
                     'api_payment_details',
                     'api_dashboard_top_tile',
                     'api_add_course',
                     'api_dropdown_cate_create',
                     'api_excel_upload',
                     'api_preview_lead_excel',
                     'api_dynamic_export_excel',
                     'api_dynamic_pdf_genrate',
                     'api_lead_mgmt_add_dropdowns_admin',
                     'api_fetch_pipeline_funnel',
                     'api_enable_disable_lead_assignment_admin',
                     'api_set_monthly_target_admin',
                     'api_fetch_user_campaigns_admin',
                     'api_fetch_user_transfer_campaigns_admin',
                     'api_fetch_user_dropdowns_admin',
                     'api_fetch_transfer_telecallers_admin',
                     'api_fetch_monthly_target_admin',
                     'api_fetch_target_dropdowns_admin',
                     'api_fetch_loss_reasons_admin',
                     'api_create_loss_reason_admin',
                     'api_get_loss_reasons_admin',
                     'api_add_loss_reason_admin',
                     'api_delete_loss_reason_admin',
                     'api_admin_dashboard']}]

# =========================================================================
# adm_payment_mode (2 Records)
# =========================================================================
PAYMENT_MODES_DATA = [   {'category': 'Offline', 'code': 'cash', 'id': 1, 'is_active': True, 'name': 'Cash', 'organization_id': None},
    {   'category': 'Online',
        'code': 'upi',
        'id': 2,
        'is_active': True,
        'name': 'UPI (GPay / PhonePe / Paytm)',
        'organization_id': None}]

# =========================================================================
# adm_report_catalog (11 Records)
# =========================================================================
REPORT_CATALOG_DATA = [   {   'category': 'User Reports',
        'description': 'All in one user report',
        'id': 1,
        'is_active': True,
        'organization_id': None,
        'report_key': 'USER_REPORT',
        'report_name': 'User Report'},
    {   'category': 'User Reports',
        'description': 'Analysis of calls connected, not connected along with status wise count of leads',
        'id': 2,
        'is_active': True,
        'organization_id': None,
        'report_key': 'lead_disposition_report',
        'report_name': 'Lead Disposition Report'},
    {   'category': 'User Reports',
        'description': 'Shows lead stage distribution by user across campaigns.',
        'id': 3,
        'is_active': True,
        'organization_id': None,
        'report_key': 'user_stage_report',
        'report_name': 'User Stage Report'},
    {   'category': 'User Reports',
        'description': 'Details like missed and due follow ups by the user are present',
        'id': 4,
        'is_active': True,
        'organization_id': None,
        'report_key': 'user_followup_report',
        'report_name': 'User Follow-Up Report'},
    {   'category': 'User Reports',
        'description': 'Hourly report and other login activities of the users are present',
        'id': 5,
        'is_active': True,
        'organization_id': None,
        'report_key': 'LOGIN_REPORT',
        'report_name': 'Login Report'},
    {   'category': 'Campaign Report',
        'description': 'Calls related data along with lost and converted count of leads',
        'id': 6,
        'is_active': True,
        'organization_id': None,
        'report_key': 'CAMPAIGN_REPORT',
        'report_name': 'Campaign Report'},
    {   'category': 'Campaign Report',
        'description': 'Tracks campaign lead progress through statuses',
        'id': 7,
        'is_active': True,
        'organization_id': None,
        'report_key': 'campaign_lead_report',
        'report_name': 'Campaign Lead Report'},
    {   'category': 'Campaign Report',
        'description': 'Shows lead stage distribution by user across campaigns.',
        'id': 8,
        'is_active': True,
        'organization_id': None,
        'report_key': 'campaign_stage_report',
        'report_name': 'Campaign Stage Report'},
    {   'category': 'User Reports',
        'description': 'Insights into call related activities of the users',
        'id': 9,
        'is_active': True,
        'organization_id': None,
        'report_key': 'user_deal_report',
        'report_name': 'User Deal Report'},
    {   'category': 'Campaign Report',
        'description': 'Shows lead count by campaign and their respective sources',
        'id': 10,
        'is_active': True,
        'organization_id': None,
        'report_key': 'campaign_source_report',
        'report_name': 'Campaign Source Report'},
    {   'category': 'User Reports',
        'description': 'All in one user report',
        'id': 11,
        'is_active': True,
        'organization_id': None,
        'report_key': 'user_report',
        'report_name': 'User Report'}]

# =========================================================================
# telecalling_amount_stage (3 Records)
# =========================================================================
AMOUNT_STAGES_DATA = [   {'id': 1, 'is_active': True, 'name': 'above_5k', 'organization_id': None},
    {'id': 2, 'is_active': True, 'name': 'below_5k', 'organization_id': None},
    {'id': 3, 'is_active': True, 'name': 'below_2k', 'organization_id': None}]

# =========================================================================
# telecalling_disconnect_stage (7 Records)
# =========================================================================
DISCONNECT_STAGES_DATA = [   {'display_value': 'Did not pick', 'id': 1, 'is_active': True, 'name': 'did not pick', 'organization_id': None},
    {   'display_value': 'Busy in another call',
        'id': 2,
        'is_active': True,
        'name': 'busy in another call',
        'organization_id': None},
    {   'display_value': 'User disconnected the call',
        'id': 3,
        'is_active': True,
        'name': 'user disconnected the call',
        'organization_id': None},
    {'display_value': 'Switch off', 'id': 4, 'is_active': True, 'name': 'switch off', 'organization_id': None},
    {   'display_value': 'Out of Coverage area / Network issue',
        'id': 5,
        'is_active': True,
        'name': 'out of coverage area / network issue',
        'organization_id': None},
    {'display_value': 'Other reason', 'id': 6, 'is_active': True, 'name': 'other reason', 'organization_id': None},
    {   'display_value': 'Incoming calls not available',
        'id': 7,
        'is_active': True,
        'name': 'incoming calls not available',
        'organization_id': None}]

# =========================================================================
# telecalling_filter_leads (7 Records)
# =========================================================================
FILTER_LEADS_DATA = [   {'id': 1, 'is_active': True, 'name': 'pipeline_stage', 'organization_id': None},
    {'id': 2, 'is_active': True, 'name': 'lead_source', 'organization_id': None},
    {'id': 3, 'is_active': True, 'name': 'campaign_name', 'organization_id': None},
    {'id': 4, 'is_active': True, 'name': 'priority', 'organization_id': None},
    {'id': 5, 'is_active': True, 'name': 'course_plan', 'organization_id': None},
    {'id': 6, 'is_active': True, 'name': 'course_name', 'organization_id': None},
    {'id': 7, 'is_active': True, 'name': 'payment_status', 'organization_id': None}]

# =========================================================================
# telecalling_filter_payment (5 Records)
# =========================================================================
FILTER_PAYMENT_DATA = [   {'id': 1, 'is_active': True, 'name': 'payment_stage', 'organization_id': None},
    {'id': 2, 'is_active': True, 'name': 'course_plan', 'organization_id': None},
    {'id': 3, 'is_active': True, 'name': 'course_name', 'organization_id': None},
    {'id': 4, 'is_active': True, 'name': 'course_time', 'organization_id': None},
    {'id': 5, 'is_active': True, 'name': 'pending_amount', 'organization_id': None}]

# =========================================================================
# telecalling_filter_pipeline (7 Records)
# =========================================================================
FILTER_PIPELINE_DATA = [   {'id': 1, 'is_active': True, 'name': 'pipeline_stage', 'organization_id': None},
    {'id': 2, 'is_active': True, 'name': 'lead_source', 'organization_id': None},
    {'id': 3, 'is_active': True, 'name': 'course_name', 'organization_id': None},
    {'id': 4, 'is_active': True, 'name': 'course_plan', 'organization_id': None},
    {'id': 5, 'is_active': True, 'name': 'priority', 'organization_id': None},
    {'id': 6, 'is_active': True, 'name': 'payment_status', 'organization_id': None},
    {'id': 7, 'is_active': False, 'name': 'Campaign', 'organization_id': None}]

# =========================================================================
# telecalling_lead_source (24 Records)
# =========================================================================
LEAD_SOURCES_DATA = [   {'id': 1, 'is_active': True, 'name': 'instagram', 'organization_id': 1},
    {'id': 2, 'is_active': True, 'name': 'facebook', 'organization_id': 1},
    {'id': 3, 'is_active': True, 'name': 'whatsapp', 'organization_id': 1},
    {'id': 4, 'is_active': True, 'name': 'direct walk in', 'organization_id': 1},
    {'id': 5, 'is_active': True, 'name': 'direct live call', 'organization_id': None},
    {'id': 6, 'is_active': True, 'name': 'reference', 'organization_id': None},
    {'id': 7, 'is_active': True, 'name': 'WhatsApp Extension', 'organization_id': None},
    {'id': 8, 'is_active': False, 'name': 'Google Ads Web', 'organization_id': None},
    {'id': 9, 'is_active': True, 'name': 'Instagram Ads', 'organization_id': 1},
    {'id': 10, 'is_active': True, 'name': 'Google Search', 'organization_id': 1},
    {'id': 11, 'is_active': True, 'name': 'Facebook Form', 'organization_id': 1},
    {'id': 12, 'is_active': True, 'name': 'LinkedIn', 'organization_id': 1},
    {'id': 13, 'is_active': True, 'name': 'Website Chatbot', 'organization_id': 1},
    {'id': 14, 'is_active': True, 'name': 'Direct Call', 'organization_id': 1},
    {'id': 15, 'is_active': True, 'name': 'Referral', 'organization_id': 1},
    {'id': 16, 'is_active': True, 'name': 'Walk-in', 'organization_id': 1},
    {'id': 17, 'is_active': True, 'name': 'YouTube', 'organization_id': 1},
    {'id': 18, 'is_active': True, 'name': 'Email Campaign', 'organization_id': 1},
    {'id': 19, 'is_active': True, 'name': 'Google Sheet / Website Form', 'organization_id': None},
    {'id': 20, 'is_active': True, 'name': 'Google Form', 'organization_id': None},
    {'id': 21, 'is_active': True, 'name': 'Google Forms Ingestion Test', 'organization_id': None},
    {'id': 22, 'is_active': True, 'name': 'Google Sheets / Google Forms', 'organization_id': None},
    {'id': 23, 'is_active': True, 'name': 'Facebook/Instagram Lead Ads', 'organization_id': None},
    {'id': 24, 'is_active': True, 'name': 'Google Forms', 'organization_id': None}]

# =========================================================================
# telecalling_loss_reason (10 Records)
# =========================================================================
LOSS_REASONS_DATA = [   {'id': 1, 'is_active': True, 'name': 'Price Too High / Budget Issue', 'organization_id': None, 'pipeline_id': None},
    {   'id': 2,
        'is_active': True,
        'name': 'Joined Competitor / Another Institute',
        'organization_id': None,
        'pipeline_id': None},
    {   'id': 3,
        'is_active': True,
        'name': 'Required Course / Timing Not Available',
        'organization_id': None,
        'pipeline_id': None},
    {   'id': 4,
        'is_active': True,
        'name': 'Not Reachable / Invalid Contact',
        'organization_id': None,
        'pipeline_id': None},
    {   'id': 5,
        'is_active': True,
        'name': 'Plan Postponed / Not Interested Now',
        'organization_id': None,
        'pipeline_id': None},
    {'id': 6, 'is_active': True, 'name': 'Location / Distance Issue', 'organization_id': None, 'pipeline_id': None},
    {'id': 7, 'is_active': True, 'name': 'Not Eligible / Wrong Enquiry', 'organization_id': None, 'pipeline_id': None},
    {'id': 8, 'is_active': True, 'name': 'Other Reasons', 'organization_id': None, 'pipeline_id': None},
    {'id': 9, 'is_active': True, 'name': 'Fee Negotiation Failed', 'organization_id': None, 'pipeline_id': None},
    {'id': 11, 'is_active': True, 'name': 'fees', 'organization_id': 1, 'pipeline_id': 1}]

# =========================================================================
# telecalling_payment_stage (3 Records)
# =========================================================================
PAYMENT_STAGES_DATA = [   {'id': 1, 'is_active': True, 'name': 'active due', 'organization_id': None},
    {'id': 2, 'is_active': True, 'name': 'over due', 'organization_id': None},
    {'id': 3, 'is_active': True, 'name': 'today due', 'organization_id': None}]

# =========================================================================
# telecalling_payment_status (2 Records)
# =========================================================================
PAYMENT_STATUSES_DATA = [   {'id': 1, 'is_active': True, 'name': 'Full Paid', 'organization_id': None},
    {'id': 2, 'is_active': True, 'name': 'Pending', 'organization_id': None}]

# =========================================================================
# adm_collection_query (85 Records)
# =========================================================================
COLLECTION_QUERIES_DATA = [   {   'id': 1,
        'key': 'D_FETCH_LEAD_SUMMARY_REPORT',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    l.id AS id,\n'
                 '    l.full_name AS lead_name,\n'
                 "    COALESCE(l.mobile_no, '-') AS lead_number,\n"
                 "    COALESCE(l.email, '-') AS email,\n"
                 "    COALESCE(l.email, '-') AS email_id,\n"
                 '    l.campaign_id AS campaign_id,\n'
                 "    COALESCE(c.name, 'All Leads') AS campaign_name,\n"
                 "    COALESCE(ls.name, '-') AS lead_source,\n"
                 "    COALESCE(TO_CHAR(l.created_at, 'YYYY-MM-DD'), '-') AS creation_date,\n"
                 "    COALESCE(TO_CHAR(l.updated_at, 'YYYY-MM-DD HH24:MI'), '-') AS updated_at,\n"
                 "    COALESCE(ps.name, 'New Lead') AS lead_stage,\n"
                 "    COALESCE(ps.name, 'New Lead') AS lead_status,\n"
                 "    COALESCE(pr.name, '-') AS tag,\n"
                 '    CASE \n'
                 "        WHEN u.first_name IS NOT NULL AND TRIM(u.first_name) != '' THEN CONCAT(TRIM(u.first_name), ' "
                 "', COALESCE(TRIM(u.last_name), ''))\n"
                 "        ELSE COALESCE(u.username, '-')\n"
                 '    END AS assigned_to,\n'
                 "    COALESCE(cn.course_name, '-') AS course_name,\n"
                 "    COALESCE(cp.course_plan, '-') AS course_plan,\n"
                 '    COALESCE(crs.course_fees, 0) AS course_fees,\n'
                 '    COALESCE(crs.course_fees, 0) AS deal_amount,\n'
                 '    (SELECT COUNT(*) FROM telecalling_call_details WHERE lead_id = l.id) AS call_attempt_count,\n'
                 "    COALESCE((SELECT TO_CHAR(MAX(called_at), 'YYYY-MM-DD HH24:MI') FROM telecalling_call_details "
                 "WHERE lead_id = l.id), '-') AS last_call_date,\n"
                 "    COALESCE((SELECT TO_CHAR(MAX(called_at), 'YYYY-MM-DD HH24:MI') FROM telecalling_call_details "
                 "WHERE lead_id = l.id), '-') AS last_contacted,\n"
                 '    (SELECT conversation_summary FROM telecalling_call_details WHERE lead_id = l.id ORDER BY '
                 'called_at DESC LIMIT 1) AS last_call_summary,\n'
                 "    COALESCE((SELECT TO_CHAR(MAX(created_at), 'YYYY-MM-DD HH24:MI') FROM telecalling_follow_up WHERE "
                 "lead_id = l.id), '-') AS next_followup_date,\n"
                 "    COALESCE((SELECT TO_CHAR(MAX(created_at), 'YYYY-MM-DD HH24:MI') FROM telecalling_follow_up WHERE "
                 "lead_id = l.id), '-') AS followup_time,\n"
                 '    (SELECT notes FROM telecalling_follow_up WHERE lead_id = l.id ORDER BY created_at DESC LIMIT 1) '
                 'AS followup_note\n'
                 'FROM telecalling_lead l\n'
                 'LEFT JOIN telecalling_campaign_name c ON c.id = l.campaign_id\n'
                 'LEFT JOIN telecalling_lead_source ls ON ls.id = l.lead_source_id\n'
                 'LEFT JOIN telecalling_pipeline_stage ps ON ps.id = l.pipeline_stage_id\n'
                 'LEFT JOIN telecalling_priority pr ON pr.id = l.priority_id\n'
                 'LEFT JOIN adm_user u ON u.id = l.assigned_to_id\n'
                 'LEFT JOIN telecalling_course crs ON crs.id = l.course_id\n'
                 'LEFT JOIN telecalling_course_name cn ON cn.id = crs.course_name_id\n'
                 'LEFT JOIN telecalling_course_plan cp ON cp.id = crs.course_plan_id\n'
                 "WHERE ('@_campaign_name' = '' OR '@_campaign_name' = 'null' OR '@_campaign_name' = 'All Leads' OR "
                 "'@_campaign_name' = 'Enquiry Sheet' OR '@_campaign_name' = 'Education' OR '@_campaign_name' = "
                 "'Education pipeline' OR '@_campaign_name' = 'Education Pipeline' OR '@_campaign_name' = '500 inquiry "
                 "Sheet' OR '@_campaign_name' = '500 Enquiry Sheet' OR '@_campaign_name' = '500 enquiry Sheet'\n"
                 "       OR LOWER(c.name) = LOWER('@_campaign_name')\n"
                 "       OR LOWER(c.name) LIKE LOWER('%@_campaign_name%')\n"
                 "       OR LOWER('@_campaign_name') LIKE LOWER('%' || c.name || '%')\n"
                 "       OR (LOWER('@_campaign_name') LIKE '%just%d%l%' AND LOWER(c.name) LIKE '%just%d%l%'))\n"
                 "  AND ('@_filter_campaign' = '' OR '@_filter_campaign' = 'null' OR '@_filter_campaign' = 'All' OR "
                 "LOWER(c.name) = LOWER('@_filter_campaign'))\n"
                 "  AND (NULLIF('@_from_date', '') IS NULL OR l.created_at::date >= NULLIF('@_from_date', '')::date)\n"
                 "  AND (NULLIF('@_to_date', '') IS NULL OR l.created_at::date <= NULLIF('@_to_date', '')::date)\n"
                 "  AND ('@_assigned_to' = '' OR '@_assigned_to' = 'null' OR '@_assigned_to' = 'All' OR "
                 'LOWER(COALESCE(u.first_name, u.username)) = ANY(SELECT LOWER(TRIM(x)) FROM '
                 "unnest(string_to_array('@_assigned_to', ',')) AS x))\n"
                 "  AND ('@_stages' = '' OR '@_stages' = 'null' OR '@_stages' = 'All' OR LOWER(ps.name) = ANY(SELECT "
                 "LOWER(TRIM(x)) FROM unnest(string_to_array('@_stages', ',')) AS x))\n"
                 "  AND ('@_course_name' = '' OR '@_course_name' = 'null' OR '@_course_name' = 'All' OR "
                 "LOWER(cn.course_name) LIKE LOWER('%@_course_name%'))\n"
                 "  AND ('@_course_plan' = '' OR '@_course_plan' = 'null' OR '@_course_plan' = 'All' OR "
                 "LOWER(cp.course_plan) LIKE LOWER('%@_course_plan%'))\n"
                 "  AND ('@_lead_source' = '' OR '@_lead_source' = 'null' OR '@_lead_source' = 'All' OR LOWER(ls.name) "
                 "= LOWER('@_lead_source'))\n"
                 "  AND ('@_priority' = '' OR '@_priority' = 'null' OR '@_priority' = 'All' OR LOWER(pr.name) LIKE "
                 "LOWER('%@_priority%'))\n"
                 "  AND ('@_search' = '' OR '@_search' = 'null' OR LOWER(l.full_name) LIKE LOWER('%@_search%') OR "
                 "LOWER(l.mobile_no) LIKE LOWER('%@_search%') OR LOWER(l.email) LIKE LOWER('%@_search%'))\n"
                 '  AND (0 = @_organization_id OR l.organization_id = @_organization_id)\n'
                 '  AND (0 = @_pipeline_id OR COALESCE(c.pipeline_category_id, l.pipeline_id, ps.pipeline_category_id) '
                 '= @_pipeline_id)\n'
                 '  AND (0 = @_campaign_id OR l.campaign_id = @_campaign_id)\n'
                 'ORDER BY l.id DESC;'},
    {   'id': 2,
        'key': 'D_FETCH_PIPELINE_STATS',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    (SELECT COUNT(*) FROM telecalling_campaign_name WHERE (0 = @_organization_id OR organization_id '
                 'IS NULL OR organization_id = @_organization_id) AND (0 = @_pipeline_id OR pipeline_category_id = '
                 '@_pipeline_id)) AS total_campaign,\n'
                 '    (SELECT COUNT(*) FROM telecalling_lead l JOIN telecalling_campaign_name c ON c.id = '
                 'l.campaign_id WHERE (0 = @_organization_id OR l.organization_id IS NULL OR l.organization_id = '
                 '@_organization_id) AND (0 = @_pipeline_id OR c.pipeline_category_id = @_pipeline_id)) AS '
                 'total_leads_collected,\n'
                 '    ROUND((COUNT(CASE WHEN l.pipeline_stage_id = 3 THEN 1 END)::numeric / NULLIF(COUNT(*), '
                 '0)::numeric) * 100, 1) AS avg_conversion_rate,\n'
                 '    COALESCE((SELECT ls.name FROM telecalling_lead l2 JOIN telecalling_campaign_name c2 ON c2.id = '
                 'l2.campaign_id JOIN telecalling_lead_source ls ON ls.id = l2.lead_source_id WHERE (0 = '
                 '@_organization_id OR l2.organization_id IS NULL OR l2.organization_id = @_organization_id) AND (0 = '
                 '@_pipeline_id OR c2.pipeline_category_id = @_pipeline_id) GROUP BY ls.name ORDER BY COUNT(l2.id) '
                 "DESC LIMIT 1), 'N/A') AS top_lead_source,\n"
                 '    COALESCE((SELECT CONCAT(ROUND((COUNT(l3.id)::numeric / NULLIF((SELECT COUNT(*) FROM '
                 'telecalling_lead l4 JOIN telecalling_campaign_name c4 ON c4.id = l4.campaign_id WHERE (0 = '
                 '@_organization_id OR l4.organization_id IS NULL OR l4.organization_id = @_organization_id) AND (0 = '
                 "@_pipeline_id OR c4.pipeline_category_id = @_pipeline_id)), 0)::numeric) * 100, 1), '% of all "
                 "leads') FROM telecalling_lead l3 JOIN telecalling_campaign_name c3 ON c3.id = l3.campaign_id JOIN "
                 'telecalling_lead_source ls ON ls.id = l3.lead_source_id WHERE (0 = @_organization_id OR '
                 'l3.organization_id IS NULL OR l3.organization_id = @_organization_id) AND (0 = @_pipeline_id OR '
                 "c3.pipeline_category_id = @_pipeline_id) GROUP BY ls.name ORDER BY COUNT(l3.id) DESC LIMIT 1), '0% "
                 "of all leads') AS source_note\n"
                 'FROM telecalling_lead l\n'
                 'JOIN telecalling_campaign_name c ON c.id = l.campaign_id\n'
                 'WHERE (0 = @_organization_id OR l.organization_id IS NULL OR l.organization_id = @_organization_id)\n'
                 '  AND (0 = @_pipeline_id OR c.pipeline_category_id = @_pipeline_id);'},
    {   'id': 3,
        'key': 'D_FETCH_CAMPAIGN_CARDS',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    c.id,\n'
                 '    c.name,\n'
                 '    c.is_active AS "isActive",\n'
                 '    COUNT(l.id) AS "totalLeads",\n'
                 '    COUNT(l.id) - COUNT(CASE WHEN l.pipeline_stage_id = 3 THEN 1 END) AS "conversion",\n'
                 '    COUNT(CASE WHEN l.pipeline_stage_id = 3 THEN 1 END) AS "closed",\n'
                 '    COUNT(CASE WHEN l.pipeline_stage_id = 3 THEN 1 END) AS "leadProgress",\n'
                 '    COUNT(l.id) AS "leadProgressTotal",\n'
                 '    False AS "isFavorite"\n'
                 'FROM telecalling_campaign_name c\n'
                 'LEFT JOIN telecalling_lead l ON l.campaign_id = c.id\n'
                 'WHERE (0 = @_organization_id OR c.organization_id IS NULL OR c.organization_id = @_organization_id)\n'
                 '  AND (0 = @_pipeline_id OR c.pipeline_category_id = @_pipeline_id)\n'
                 'GROUP BY c.id, c.name, c.is_active\n'
                 'ORDER BY c.is_active DESC, c.name ASC;'},
    {   'id': 4,
        'key': 'D_FETCH_ENQUIRY_SHEET_CARDS',
        'organization_id': None,
        'query': "SELECT \n    json_build_array(\n        json_build_object('label', 'Total Leads', 'value', COUNT(*)),\n        json_build_object('label', 'New Lead', 'value', COUNT(CASE WHEN ps.order_no = 1 OR (ps.stage_type = 'open' AND ps.name ILIKE '%new%') THEN 1 END)),\n        json_build_object('label', '1st Time Not picked', 'value', COUNT(CASE WHEN ps.name ILIKE '%not picked%' OR ps.name ILIKE '%not_picked%' THEN 1 END)),\n        json_build_object('label', 'Follow Up', 'value', COUNT(CASE WHEN ps.name ILIKE '%follow%' THEN 1 END)),\n        json_build_object('label', 'Missed Follow Up', 'value', COUNT(CASE WHEN ps.name ILIKE '%missed%' THEN 1 END)),\n        json_build_object('label', 'Not Connected', 'value', COUNT(CASE WHEN ps.name ILIKE '%not connect%' THEN 1 END)),\n        json_build_object('label', 'Won', 'value', COUNT(CASE WHEN ps.stage_type = 'closed_won' OR ps.name ILIKE '%won%' THEN 1 END)),\n        json_build_object('label', 'Lost', 'value', COUNT(CASE WHEN ps.stage_type = 'closed_lost' OR ps.name ILIKE '%loss%' OR ps.name ILIKE '%lost%' THEN 1 END))\n    ) AS summary_stats\nFROM telecalling_lead l\nLEFT JOIN telecalling_campaign_name c ON c.id = l.campaign_id\nLEFT JOIN telecalling_pipeline_stage ps ON ps.id = l.pipeline_stage_id\nWHERE (@_campaign_id = 0 OR l.campaign_id = @_campaign_id)\n  AND ('@_campaign_name' = '' OR '@_campaign_name' = 'All Leads' OR '@_campaign_name' = 'Enquiry Sheet' OR LOWER(c.name) = LOWER('@_campaign_name'));"},
    {   'id': 5,
        'key': 'D_FETCH_ENQUIRY_SHEET_DISTRIBUTION',
        'organization_id': None,
        'query': '\n'
                 'SELECT\n'
                 '    COALESCE(\n'
                 "        NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''),\n"
                 '        u.username\n'
                 '    ) AS agent,\n'
                 '\n'
                 '    json_build_array(\n'
                 '        COUNT(CASE WHEN l.pipeline_stage_id = 1 THEN 1 END),\n'
                 '        COUNT(CASE WHEN l.pipeline_stage_id = 5 THEN 1 END),\n'
                 '        COUNT(CASE WHEN l.pipeline_stage_id = 2 THEN 1 END),\n'
                 '        COUNT(CASE WHEN l.pipeline_stage_id = 6 THEN 1 END),\n'
                 '        COUNT(CASE WHEN l.pipeline_stage_id = 7 THEN 1 END),\n'
                 '        COUNT(CASE WHEN l.pipeline_stage_id = 3 THEN 1 END),\n'
                 '        COUNT(CASE WHEN l.pipeline_stage_id = 4 THEN 1 END)\n'
                 '    ) AS values\n'
                 '\n'
                 'FROM adm_user u\n'
                 '\n'
                 'INNER JOIN telecalling_lead l\n'
                 '    ON l.assigned_to_id = u.id\n'
                 '   AND (\n'
                 '        COALESCE(CAST(@_campaign_id AS INTEGER), 0) = 0\n'
                 '        OR l.campaign_id = CAST(@_campaign_id AS INTEGER)\n'
                 '   )\n'
                 '\n'
                 'LEFT JOIN telecalling_campaign_name c\n'
                 '    ON c.id = l.campaign_id\n'
                 '\n'
                 'WHERE u.is_active = TRUE\n'
                 '\n'
                 '  AND (\n'
                 '      COALESCE(CAST(@_organization_id AS INTEGER), 0) = 0\n'
                 '      OR u.organization_id = CAST(@_organization_id AS INTEGER)\n'
                 '  )\n'
                 '\n'
                 '  AND (\n'
                 '      COALESCE(CAST(@_campaign_id AS INTEGER), 0) = 0\n'
                 "      OR LOWER(c.name) = LOWER('@_campaign_name')\n"
                 '  )\n'
                 '\n'
                 'GROUP BY\n'
                 '    u.id,\n'
                 '    u.first_name,\n'
                 '    u.last_name,\n'
                 '    u.username\n'
                 '\n'
                 'ORDER BY u.id;\n'},
    {   'id': 6,
        'key': 'D_FETCH_CALL_LOG_REPORT',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    cd.id AS id,\n'
                 "    COALESCE(l.full_name, '-') AS user_name,\n"
                 "    COALESCE(l.mobile_no, '-') AS mobile_number,\n"
                 "    COALESCE(l.email, '-') AS mail_id,\n"
                 '    CASE \n'
                 "        WHEN u_called.first_name IS NOT NULL AND TRIM(u_called.first_name) != '' THEN "
                 "CONCAT(TRIM(u_called.first_name), ' ', COALESCE(TRIM(u_called.last_name), ''))\n"
                 "        ELSE COALESCE(u_called.username, '-')\n"
                 '    END AS handled_by,\n'
                 '    CASE \n'
                 "        WHEN u_assigned.first_name IS NOT NULL AND TRIM(u_assigned.first_name) != '' THEN "
                 "CONCAT(TRIM(u_assigned.first_name), ' ', COALESCE(TRIM(u_assigned.last_name), ''))\n"
                 "        ELSE COALESCE(u_assigned.username, '-')\n"
                 '    END AS user_assigned,\n'
                 "    COALESCE(TO_CHAR(cd.called_at, 'YYYY-MM-DD HH24:MI'), '-') AS call_timestamp,\n"
                 '    CASE \n'
                 "        WHEN cd.duration_seconds > 0 THEN CONCAT(ROUND(cd.duration_seconds / 60), ' min ', "
                 "MOD(cd.duration_seconds, 60), ' sec')\n"
                 "        ELSE '0 sec'\n"
                 '    END AS call_duration,\n'
                 "    COALESCE(cd.call_direction, 'Outgoing') AS call_direction,\n"
                 "    COALESCE(cd.connection_status, 'Connected') AS call_status,\n"
                 "    COALESCE(ps.name, 'Education') AS pipeline,\n"
                 "    COALESCE(c.name, '-') AS campaign_name,\n"
                 "    COALESCE(cd.upload_recording, '') AS recording_url\n"
                 'FROM telecalling_call_details cd\n'
                 'LEFT JOIN telecalling_lead l ON l.id = cd.lead_id\n'
                 'LEFT JOIN telecalling_campaign_name c ON c.id = l.campaign_id\n'
                 'LEFT JOIN telecalling_pipeline_stage ps ON ps.id = COALESCE(cd.stage_id, l.pipeline_stage_id)\n'
                 'LEFT JOIN adm_user u_called ON u_called.id = cd.telecaller_id\n'
                 'LEFT JOIN adm_user u_assigned ON u_assigned.id = l.assigned_to_id\n'
                 'LEFT JOIN telecalling_lead_source ls ON ls.id = l.lead_source_id\n'
                 'LEFT JOIN telecalling_course crs ON crs.id = l.course_id\n'
                 'LEFT JOIN telecalling_course_name cn ON cn.id = crs.course_name_id\n'
                 'LEFT JOIN telecalling_course_plan cp ON cp.id = crs.course_plan_id\n'
                 'LEFT JOIN telecalling_priority pr ON pr.id = l.priority_id\n'
                 "WHERE ('@_campaign_name' = '' OR '@_campaign_name' = 'null' OR '@_campaign_name' = 'All Leads' OR "
                 "'@_campaign_name' = 'Enquiry Sheet' OR '@_campaign_name' = 'Education' OR '@_campaign_name' = "
                 "'Education pipeline' OR '@_campaign_name' = 'Education Pipeline' OR '@_campaign_name' = '500 inquiry "
                 "Sheet' OR '@_campaign_name' = '500 Enquiry Sheet' OR '@_campaign_name' = '500 enquiry Sheet'\n"
                 "       OR LOWER(c.name) = LOWER('@_campaign_name')\n"
                 "       OR LOWER(c.name) LIKE LOWER('%@_campaign_name%')\n"
                 "       OR LOWER('@_campaign_name') LIKE LOWER('%' || c.name || '%')\n"
                 "       OR (LOWER('@_campaign_name') LIKE '%just%d%l%' AND LOWER(c.name) LIKE '%just%d%l%'))\n"
                 "  AND ('@_filter_campaign' = '' OR '@_filter_campaign' = 'null' OR '@_filter_campaign' = 'All' OR "
                 "LOWER(c.name) = LOWER('@_filter_campaign'))\n"
                 "  AND (NULLIF('@_from_date', '') IS NULL OR cd.called_at::date >= NULLIF('@_from_date', '')::date)\n"
                 "  AND (NULLIF('@_to_date', '') IS NULL OR cd.called_at::date <= NULLIF('@_to_date', '')::date)\n"
                 "  AND ('@_assigned_to' = '' OR '@_assigned_to' = 'null' OR '@_assigned_to' = 'All' OR "
                 'LOWER(COALESCE(u_called.first_name, u_called.username)) = ANY(SELECT LOWER(TRIM(x)) FROM '
                 "unnest(string_to_array('@_assigned_to', ',')) AS x) OR LOWER(COALESCE(u_assigned.first_name, "
                 "u_assigned.username)) = ANY(SELECT LOWER(TRIM(x)) FROM unnest(string_to_array('@_assigned_to', ',')) "
                 'AS x))\n'
                 "  AND ('@_call_status' = '' OR '@_call_status' = 'null' OR '@_call_status' = 'All' OR "
                 "LOWER(cd.connection_status) = ANY(SELECT LOWER(TRIM(x)) FROM unnest(string_to_array('@_call_status', "
                 "',')) AS x))\n"
                 "  AND ('@_call_direction' = '' OR '@_call_direction' = 'null' OR '@_call_direction' = 'All' OR "
                 "LOWER(COALESCE(cd.call_direction, 'Outgoing')) = ANY(SELECT LOWER(TRIM(x)) FROM "
                 "unnest(string_to_array('@_call_direction', ',')) AS x))\n"
                 "  AND ('@_course_name' = '' OR '@_course_name' = 'null' OR '@_course_name' = 'All' OR "
                 "LOWER(cn.course_name) LIKE LOWER('%@_course_name%'))\n"
                 "  AND ('@_course_plan' = '' OR '@_course_plan' = 'null' OR '@_course_plan' = 'All' OR "
                 "LOWER(cp.course_plan) LIKE LOWER('%@_course_plan%'))\n"
                 "  AND ('@_lead_source' = '' OR '@_lead_source' = 'null' OR '@_lead_source' = 'All' OR LOWER(ls.name) "
                 "= LOWER('@_lead_source'))\n"
                 "  AND ('@_priority' = '' OR '@_priority' = 'null' OR '@_priority' = 'All' OR LOWER(pr.name) LIKE "
                 "LOWER('%@_priority%'))\n"
                 "  AND ('@_search' = '' OR '@_search' = 'null' OR LOWER(l.full_name) LIKE LOWER('%@_search%') OR "
                 "LOWER(l.mobile_no) LIKE LOWER('%@_search%') OR LOWER(l.email) LIKE LOWER('%@_search%'))\n"
                 'ORDER BY cd.called_at DESC;'},
    {   'id': 7,
        'key': 'D_FETCH_DISPOSITION_LOG',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    cd.id AS id,\n'
                 "    COALESCE(l.full_name, '-') AS user_name,\n"
                 "    COALESCE(l.mobile_no, '-') AS mobile_number,\n"
                 "    COALESCE(l.email, '-') AS mail_id,\n"
                 '    CASE \n'
                 "        WHEN u_called.first_name IS NOT NULL AND TRIM(u_called.first_name) != '' THEN "
                 "CONCAT(TRIM(u_called.first_name), ' ', COALESCE(TRIM(u_called.last_name), ''))\n"
                 "        ELSE COALESCE(u_called.username, 'Executive')\n"
                 '    END AS disposed_by,\n'
                 '    CASE \n'
                 "        WHEN u_assigned.first_name IS NOT NULL AND TRIM(u_assigned.first_name) != '' THEN "
                 "CONCAT(TRIM(u_assigned.first_name), ' ', COALESCE(TRIM(u_assigned.last_name), ''))\n"
                 "        ELSE COALESCE(u_assigned.username, '-')\n"
                 '    END AS user_assigned,\n'
                 "    COALESCE(ps.name, 'New Lead') AS stage,\n"
                 "    COALESCE(pr.name, 'Warm') AS tag,\n"
                 "    COALESCE(cd.connection_status, 'Connected') AS status,\n"
                 "    COALESCE(TO_CHAR(cd.called_at, 'YYYY-MM-DD HH24:MI'), '-') AS disposition_time_stamp,\n"
                 "    COALESCE(cd.connection_status, 'Connected') AS disposition_as,\n"
                 '    CASE \n'
                 "        WHEN LOWER(cd.connection_status) != 'connected' THEN COALESCE(cd.conversation_summary, 'No "
                 "Answer / Busy')\n"
                 "        ELSE '-'\n"
                 '    END AS not_connected_reason,\n'
                 "    COALESCE(cd.conversation_summary, '-') AS remarks,\n"
                 '    COALESCE(crs.course_fees, 0) AS deal_amount,\n'
                 "    COALESCE(pc.display_name, pc.category_name, 'Education') AS pipeline,\n"
                 "    COALESCE(c.name, 'Education') AS campaign\n"
                 'FROM telecalling_call_details cd\n'
                 'LEFT JOIN telecalling_lead l ON l.id = cd.lead_id\n'
                 'LEFT JOIN telecalling_campaign_name c ON c.id = l.campaign_id\n'
                 'LEFT JOIN telecalling_pipeline_stage ps ON ps.id = COALESCE(cd.stage_id, l.pipeline_stage_id)\n'
                 'LEFT JOIN adm_pipeline_category pc ON pc.id = COALESCE(c.pipeline_category_id, l.pipeline_id, '
                 'ps.pipeline_category_id)\n'
                 'LEFT JOIN adm_user u_called ON u_called.id = cd.telecaller_id\n'
                 'LEFT JOIN adm_user u_assigned ON u_assigned.id = l.assigned_to_id\n'
                 'LEFT JOIN telecalling_priority pr ON pr.id = l.priority_id\n'
                 'LEFT JOIN telecalling_course crs ON crs.id = l.course_id\n'
                 'LEFT JOIN telecalling_course_name cn ON cn.id = crs.course_name_id\n'
                 'LEFT JOIN telecalling_course_plan cp ON cp.id = crs.course_plan_id\n'
                 'LEFT JOIN telecalling_lead_source ls ON ls.id = l.lead_source_id\n'
                 "WHERE ('@_campaign_name' = '' OR '@_campaign_name' = 'null' OR '@_campaign_name' = 'All Leads' OR "
                 "'@_campaign_name' = 'Enquiry Sheet' OR '@_campaign_name' = 'Education' OR '@_campaign_name' = "
                 "'Education pipeline' OR '@_campaign_name' = 'Education Pipeline' OR '@_campaign_name' = '500 inquiry "
                 "Sheet' OR '@_campaign_name' = '500 Enquiry Sheet' OR '@_campaign_name' = '500 enquiry Sheet'\n"
                 "       OR LOWER(c.name) = LOWER('@_campaign_name')\n"
                 "       OR LOWER(c.name) LIKE LOWER('%@_campaign_name%')\n"
                 "       OR LOWER('@_campaign_name') LIKE LOWER('%' || c.name || '%')\n"
                 "       OR (LOWER('@_campaign_name') LIKE '%just%d%l%' AND LOWER(c.name) LIKE '%just%d%l%'))\n"
                 "  AND ('@_filter_campaign' = '' OR '@_filter_campaign' = 'null' OR '@_filter_campaign' = 'All' OR "
                 "LOWER(c.name) = LOWER('@_filter_campaign'))\n"
                 "  AND (NULLIF('@_from_date', '') IS NULL OR cd.called_at::date >= NULLIF('@_from_date', '')::date)\n"
                 "  AND (NULLIF('@_to_date', '') IS NULL OR cd.called_at::date <= NULLIF('@_to_date', '')::date)\n"
                 "  AND ('@_assigned_to' = '' OR '@_assigned_to' = 'null' OR '@_assigned_to' = 'All' OR "
                 'LOWER(COALESCE(u_called.first_name, u_called.username)) = ANY(SELECT LOWER(TRIM(x)) FROM '
                 "unnest(string_to_array('@_assigned_to', ',')) AS x) OR LOWER(COALESCE(u_assigned.first_name, "
                 "u_assigned.username)) = ANY(SELECT LOWER(TRIM(x)) FROM unnest(string_to_array('@_assigned_to', ',')) "
                 'AS x))\n'
                 "  AND ('@_stages' = '' OR '@_stages' = 'null' OR '@_stages' = 'All' OR LOWER(ps.name) = ANY(SELECT "
                 "LOWER(TRIM(x)) FROM unnest(string_to_array('@_stages', ',')) AS x))\n"
                 "  AND ('@_search' = '' OR '@_search' = 'null' OR LOWER(l.full_name) LIKE LOWER('%@_search%') OR "
                 "LOWER(l.mobile_no) LIKE LOWER('%@_search%') OR LOWER(l.email) LIKE LOWER('%@_search%'))\n"
                 "  AND (COALESCE(NULLIF('@_organization_id', ''), '0') = '0' OR cd.organization_id::text = "
                 "'@_organization_id' OR l.organization_id::text = '@_organization_id')\n"
                 "  AND (0 = COALESCE(NULLIF('@_pipeline_id', '')::integer, 0) OR COALESCE(c.pipeline_category_id, "
                 "l.pipeline_id, ps.pipeline_category_id) = COALESCE(NULLIF('@_pipeline_id', '')::integer, 0))\n"
                 "  AND (0 = COALESCE(NULLIF('@_campaign_id', '')::integer, 0) OR l.campaign_id = "
                 "COALESCE(NULLIF('@_campaign_id', '')::integer, 0))\n"
                 'ORDER BY cd.called_at DESC;'},
    {   'id': 8,
        'key': 'L_ROLES',
        'organization_id': None,
        'query': 'SELECT id as value, display_value as label FROM adm_role ORDER BY id ASC'},
    {   'id': 9,
        'key': 'L_TEAMS',
        'organization_id': None,
        'query': 'SELECT id as value, name as label FROM adm_team WHERE is_active = true AND (organization_id = '
                 '@_organization_id OR @_organization_id = 0) ORDER BY id ASC'},
    {   'id': 10,
        'key': 'L_CATEGORIES',
        'organization_id': None,
        'query': 'SELECT id as value, category_name as label, id as pipeline_id FROM adm_pipeline_category ORDER BY id '
                 'ASC'},
    {   'id': 11,
        'key': 'L_PIPELINES',
        'organization_id': None,
        'query': 'SELECT id as value, name as label FROM telecalling_filter_pipeline ORDER BY id ASC'},
    {   'id': 12,
        'key': 'L_STAGES',
        'organization_id': None,
        'query': 'SELECT id as value, COALESCE(display_value, name) as label, stage_type, order_no, stage_color, '
                 'stage_color as color FROM telecalling_pipeline_stage WHERE is_active = TRUE AND '
                 "(COALESCE(NULLIF('@_pipeline_id', ''), NULLIF('@_pipeline_category_id', ''), '0') = '0' OR "
                 "pipeline_category_id::text = '@_pipeline_id' OR pipeline_category_id::text = "
                 "'@_pipeline_category_id') AND (COALESCE(NULLIF('@_organization_id', ''), '0') = '0' OR "
                 "organization_id::text = '@_organization_id' OR organization_id IS NULL) ORDER BY order_no ASC, id "
                 'ASC;'},
    {   'id': 13,
        'key': 'L_LEAD_SOURCES',
        'organization_id': None,
        'query': 'SELECT id as value, name as label FROM telecalling_lead_source ORDER BY id ASC'},
    {   'id': 15,
        'key': 'L_TELECALLERS',
        'organization_id': None,
        'query': 'SELECT DISTINCT\n'
                 '    u.id AS value,\n'
                 '    COALESCE(\n'
                 "        NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''),\n"
                 '        u.username\n'
                 '    ) AS label\n'
                 'FROM adm_user u\n'
                 'WHERE u.is_active = TRUE\n'
                 "  AND (COALESCE(NULLIF('@_organization_id', ''), '0')::integer = 0 OR u.organization_id = "
                 "COALESCE(NULLIF('@_organization_id', ''), '0')::integer)\n"
                 '  AND (\n'
                 "      COALESCE(NULLIF('@_campaign_id', ''), '0')::integer = 0\n"
                 '      OR EXISTS (\n'
                 '          SELECT 1\n'
                 '          FROM adm_campaign_assigned_agents ca\n'
                 '          WHERE ca.agent_user_id = u.id\n'
                 "            AND ca.campaign_id = COALESCE(NULLIF('@_campaign_id', ''), '0')::integer\n"
                 '            AND ca.is_active = TRUE\n'
                 '      )\n'
                 '      OR NOT EXISTS (\n'
                 '          SELECT 1\n'
                 '          FROM adm_campaign_assigned_agents ca2\n'
                 "          WHERE ca2.campaign_id = COALESCE(NULLIF('@_campaign_id', ''), '0')::integer\n"
                 '            AND ca2.is_active = TRUE\n'
                 '      )\n'
                 '  )\n'
                 'ORDER BY label;'},
    {   'id': 16,
        'key': 'L_CAMPAIGN_NAMES',
        'organization_id': None,
        'query': 'SELECT id as value, name as label FROM telecalling_campaign_name WHERE is_active = true AND '
                 "(COALESCE(NULLIF('@_organization_id', ''), '0') = '0' OR organization_id::text = "
                 "'@_organization_id') AND (COALESCE(NULLIF('@_pipeline_id', ''), '0') = '0' OR "
                 "COALESCE(pipeline_category_id, 1)::text = '@_pipeline_id') ORDER BY name"},
    {   'id': 17,
        'key': 'L_DISCONNECT_TAGS',
        'organization_id': None,
        'query': 'SELECT id as value, name as label FROM telecalling_priority ORDER BY id ASC'},
    {   'id': 18,
        'key': 'L_LOSS_REASONS',
        'organization_id': None,
        'query': 'SELECT id AS value, name AS label FROM telecalling_loss_reason WHERE is_active = TRUE AND '
                 "(organization_id IS NULL OR organization_id = 0 OR organization_id = NULLIF('@_organization_id', "
                 "'')::integer) ORDER BY id ASC;"},
    {   'id': 19,
        'key': 'L_WON_REASONS',
        'organization_id': None,
        'query': 'SELECT id as value,name as label\n'
                 'FROM telecalling_pipeline_stage\n'
                 'WHERE is_active = TRUE\n'
                 'and (  @_pipeline_id = 0\n'
                 '        OR pipeline_category_id = @_pipeline_id)\n'
                 '  AND (\n'
                 '        @_organization_id = 0\n'
                 '        OR organization_id = @_organization_id\n'
                 '      );'},
    {   'id': 20,
        'key': 'L_TAGS',
        'organization_id': None,
        'query': 'SELECT\n'
                 '    p.id AS value,\n'
                 "    COALESCE(NULLIF(p.display_value, ''), p.name) AS label\n"
                 'FROM telecalling_priority p\n'
                 'JOIN telecalling_pipeline_stage s\n'
                 '    ON s.id = p.pipeline_stage_id\n'
                 "WHERE (COALESCE(NULLIF('@_pipeline_stage_id', ''), '0') = '0'\n"
                 "       OR p.pipeline_stage_id::text = '@_pipeline_stage_id')\n"
                 "  AND (COALESCE(NULLIF('@_pipeline_id', ''), '0') = '0'\n"
                 "       OR s.pipeline_category_id::text = '@_pipeline_id')\n"
                 '  AND p.is_active = TRUE\n'
                 '  AND s.is_active = TRUE\n'
                 "  AND (COALESCE(NULLIF('@_organization_id', ''), '0') = '0'\n"
                 "       OR s.organization_id::text = '@_organization_id'\n"
                 '       OR s.organization_id IS NULL)\n'
                 'ORDER BY p.id ASC;'},
    {   'id': 21,
        'key': 'L_PAYMENT_STAGES',
        'organization_id': None,
        'query': 'SELECT id as value, name as label FROM telecalling_payment_stage ORDER BY id ASC'},
    {   'id': 22,
        'key': 'L_AMOUNT_STAGES',
        'organization_id': None,
        'query': 'SELECT id as value, name as label FROM telecalling_amount_stage ORDER BY id ASC'},
    {   'id': 23,
        'key': 'L_PERMISSIONS',
        'organization_id': None,
        'query': 'SELECT id as value, name as label FROM adm_perm ORDER BY id ASC'},
    {   'id': 24,
        'key': 'L_COURSE_NAMES',
        'organization_id': None,
        'query': 'SELECT DISTINCT id AS value, course_name AS label FROM telecalling_course_name WHERE is_active = '
                 'TRUE ORDER BY label ASC;'},
    {   'id': 25,
        'key': 'L_COURSE_PLANS',
        'organization_id': None,
        'query': 'SELECT DISTINCT\n'
                 '    cp.id AS value,\n'
                 '    cp.course_plan AS label\n'
                 'FROM telecalling_course_plan cp\n'
                 'LEFT JOIN telecalling_course c\n'
                 '    ON c.course_plan_id = cp.id\n'
                 'WHERE cp.is_active = TRUE\n'
                 '  AND (\n'
                 '        COALESCE(\n'
                 "            NULLIF('@_course_name_id', '')::INTEGER,\n"
                 '            0\n'
                 '        ) = 0\n'
                 "        OR c.course_name_id = NULLIF('@_course_name_id', '')::INTEGER\n"
                 '      )\n'
                 'ORDER BY label ASC;'},
    {   'id': 26,
        'key': 'L_COURSE_TIMES',
        'organization_id': None,
        'query': '\n'
                 'SELECT DISTINCT\n'
                 '    ct.id AS value,\n'
                 '    ct.course_time AS label\n'
                 'FROM telecalling_course_time ct\n'
                 'LEFT JOIN telecalling_course c\n'
                 '    ON c.course_time_id = ct.id\n'
                 'WHERE ct.is_active = TRUE\n'
                 '  AND (\n'
                 '        COALESCE(\n'
                 "            NULLIF('@_course_name_id', '')::INTEGER,\n"
                 '            0\n'
                 '        ) = 0\n'
                 '\n'
                 '        OR COALESCE(\n'
                 "            NULLIF('@_course_plan_id', '')::INTEGER,\n"
                 '            0\n'
                 '        ) = 0\n'
                 '\n'
                 '        OR (\n'
                 '            c.course_name_id =\n'
                 "                NULLIF('@_course_name_id', '')::INTEGER\n"
                 '\n'
                 '            AND c.course_plan_id =\n'
                 "                NULLIF('@_course_plan_id', '')::INTEGER\n"
                 '        )\n'
                 '      )\n'
                 'ORDER BY ct.id ASC;\n'
                 '\n'},
    {   'id': 35,
        'key': 'L_TEAM_LEADS',
        'organization_id': None,
        'query': "SELECT DISTINCT u.id AS value, COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), "
                 'u.username) AS label FROM adm_user u INNER JOIN adm_user_role ur ON u.id = ur.user_id INNER JOIN '
                 "adm_role r ON ur.role_id = r.id WHERE u.is_active = TRUE AND LOWER(r.code) = 'team_lead' AND "
                 "(NULLIF('@_organization_id', '')::integer IS NULL OR NULLIF('@_organization_id', '')::integer = 0 OR "
                 "u.organization_id = NULLIF('@_organization_id', '')::integer) ORDER BY u.id ASC;"},
    {   'id': 36,
        'key': 'L_UNASSIGNED_TEAM_LEADS',
        'organization_id': None,
        'query': "SELECT DISTINCT u.id AS value, COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), "
                 'u.username) AS label FROM adm_user u LEFT JOIN adm_user_role ur ON u.id = ur.user_id LEFT JOIN '
                 "adm_role r ON ur.role_id = r.id WHERE u.is_active = TRUE AND (LOWER(COALESCE(r.code, '')) IN "
                 "('team_lead', 'tl') OR LOWER(COALESCE(r.name, '')) ILIKE '%team_lead%' OR LOWER(COALESCE(r.name, "
                 "'')) ILIKE '%team lead%' OR LOWER(COALESCE(u.user_type, '')) ILIKE '%team lead%') AND u.id NOT IN "
                 '(SELECT t.leader_id FROM adm_team t WHERE t.is_active = TRUE AND t.leader_id IS NOT NULL AND '
                 "(NULLIF('@_team_id', '')::integer IS NULL OR NULLIF('@_team_id', '')::integer = 0 OR t.id <> "
                 "NULLIF('@_team_id', '')::integer)) AND (NULLIF('@_organization_id', '')::integer IS NULL OR "
                 "NULLIF('@_organization_id', '')::integer = 0 OR u.organization_id = NULLIF('@_organization_id', "
                 "'')::integer) ORDER BY label ASC;"},
    {   'id': 37,
        'key': 'L_UNASSIGNED_TELECALLERS',
        'organization_id': None,
        'query': "SELECT u.id AS value, COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.username) "
                 'AS label, u.team_id FROM adm_user u WHERE u.is_active = TRUE AND u.is_superuser = FALSE AND '
                 "LOWER(u.user_type) NOT LIKE '%admin%' AND LOWER(u.user_type) NOT LIKE '%developer%' AND (u.team_id "
                 "IS NULL OR (NULLIF('@_team_id', '')::integer IS NOT NULL AND NULLIF('@_team_id', '')::integer <> 0 "
                 "AND u.team_id = NULLIF('@_team_id', '')::integer)) AND u.id NOT IN (SELECT t.leader_id FROM adm_team "
                 "t WHERE t.is_active = TRUE AND t.leader_id IS NOT NULL AND (NULLIF('@_team_id', '')::integer IS NULL "
                 "OR NULLIF('@_team_id', '')::integer = 0 OR t.id <> NULLIF('@_team_id', '')::integer)) AND "
                 "(NULLIF('@_organization_id', '')::integer IS NULL OR NULLIF('@_organization_id', '')::integer = 0 OR "
                 "u.organization_id = NULLIF('@_organization_id', '')::integer) ORDER BY label ASC;"},
    {   'id': 38,
        'key': 'L_CAMPAIGN_MANAGERS',
        'organization_id': None,
        'query': '\n'
                 '    SELECT DISTINCT\n'
                 '        u.id AS value,\n'
                 '        COALESCE(\n'
                 "            NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''),\n"
                 '            u.username\n'
                 '        ) AS label\n'
                 '    FROM adm_user u\n'
                 '    JOIN adm_user_role ur ON ur.user_id = u.id\n'
                 '    JOIN adm_role r ON r.id = ur.role_id\n'
                 '    WHERE u.is_active = TRUE\n'
                 '      AND u.organization_id = @_organization_id\n'
                 "      AND UPPER(TRIM(r.code)) IN ('MGR', 'AMGR')\n"
                 '    ORDER BY label\n'},
    {   'id': 39,
        'key': 'L_PAYMENT_MODES',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    id AS value, \n'
                 '    name AS label \n'
                 'FROM adm_payment_mode \n'
                 'WHERE is_active = TRUE \n'
                 'ORDER BY id ASC;'},
    {   'id': 40,
        'key': 'D_FETCH_CAMPAIGN_DETAIL',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    c.id AS campaign_id, \n'
                 '    c.name, \n'
                 '    c.pipeline_category_id AS pipeline_id, \n'
                 '    c.pipeline_category_id, \n'
                 "    COALESCE(pc.display_name, pc.category_name, 'Education') AS pipeline_category_name, \n"
                 '    c.manager_id, \n'
                 "    COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.username) AS "
                 'manager_name, \n'
                 "    COALESCE(c.lead_distribution_type, 'on_demand') AS lead_distribution_type, \n"
                 '    c.is_active \n'
                 'FROM telecalling_campaign_name c \n'
                 'LEFT JOIN adm_pipeline_category pc ON pc.id = c.pipeline_category_id \n'
                 'LEFT JOIN adm_user u ON u.id = c.manager_id \n'
                 "WHERE (c.id = COALESCE(NULLIF('@_campaign_id', ''), '0')::integer OR (c.name ILIKE '@_campaign_name' "
                 "AND '@_campaign_name' <> '')) \n"
                 "  AND (COALESCE(NULLIF('@_organization_id', ''), '0') = '0' OR c.organization_id::text = "
                 "'@_organization_id')"},
    {   'id': 41,
        'key': 'D_FETCH_CAMPAIGN_AGENTS',
        'organization_id': None,
        'query': "SELECT ROW_NUMBER() OVER (ORDER BY u.id) AS s_no, u.id AS agent_id, COALESCE(NULLIF(TRIM(CONCAT_WS(' "
                 "', u.first_name, u.last_name)), ''), u.username) AS user_name, COALESCE(u.email, '') AS email, CASE "
                 'WHEN ca.id IS NOT NULL THEN TRUE ELSE FALSE END AS is_assigned, COALESCE(ca.is_active, FALSE) AS '
                 'is_active FROM adm_user u LEFT JOIN adm_campaign_assigned_agents ca ON ca.agent_user_id = u.id AND '
                 'ca.campaign_id = @_campaign_id WHERE u.is_active = TRUE AND (u.organization_id = @_organization_id '
                 'OR @_organization_id IS NULL OR @_organization_id = 0) ORDER BY u.id'},
    {   'id': 42,
        'key': 'D_FETCH_ALL_LEADS_ADMIN',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    l.id AS id,\n'
                 '    l.full_name AS full_name,\n'
                 "    COALESCE(l.mobile_no, '-') AS mobile_no,\n"
                 "    COALESCE(l.email, '-') AS email,\n"
                 '    l.assigned_to_id,\n'
                 '    CASE \n'
                 "        WHEN u.first_name IS NOT NULL AND TRIM(u.first_name) != '' THEN CONCAT(TRIM(u.first_name), ' "
                 "', COALESCE(TRIM(u.last_name), ''))\n"
                 "        ELSE COALESCE(u.username, '-')\n"
                 '    END AS assigned_to,\n'
                 '    l.pipeline_stage_id AS stage_id,\n'
                 "    COALESCE(ps.name, 'New Lead') AS stage,\n"
                 "    COALESCE(pr.name, '-') AS tag,\n"
                 '    l.priority_id AS tag_id,\n'
                 '    l.priority_id AS priority_id,\n'
                 '    c.name AS campaign,\n'
                 '    ls.name AS source,\n'
                 '    cp.course_plan AS course_plan,\n'
                 '    cn.course_name AS course,\n'
                 '    COALESCE(crs.course_fees, 0) AS amount,\n'
                 '    COALESCE((SELECT pending_amount FROM telecalling_payment_info WHERE lead_id = l.id LIMIT 1), 0) '
                 'AS pending_amount,\n'
                 '    (SELECT called_at FROM telecalling_call_details WHERE lead_id = l.id ORDER BY called_at DESC '
                 'LIMIT 1) AS last_contacted,\n'
                 '    (SELECT conversation_summary FROM telecalling_call_details WHERE lead_id = l.id ORDER BY '
                 'called_at DESC LIMIT 1) AS last_conversation_outcome,\n'
                 '    (SELECT scheduled_at FROM telecalling_follow_up WHERE lead_id = l.id AND is_attended = FALSE '
                 'ORDER BY scheduled_at ASC LIMIT 1) AS next_followup\n'
                 'FROM telecalling_lead l\n'
                 'LEFT JOIN telecalling_campaign_name c ON c.id = l.campaign_id\n'
                 'LEFT JOIN telecalling_lead_source ls ON ls.id = l.lead_source_id\n'
                 'LEFT JOIN telecalling_pipeline_stage ps ON ps.id = l.pipeline_stage_id\n'
                 'LEFT JOIN telecalling_priority pr ON pr.id = l.priority_id\n'
                 'LEFT JOIN adm_user u ON u.id = l.assigned_to_id\n'
                 'LEFT JOIN telecalling_course crs ON crs.id = l.course_id\n'
                 'LEFT JOIN telecalling_course_name cn ON cn.id = crs.course_name_id\n'
                 'LEFT JOIN telecalling_course_plan cp ON cp.id = crs.course_plan_id\n'
                 'WHERE (l.organization_id = @_organization_id OR @_organization_id IS NULL OR @_organization_id = 0)\n'
                 'ORDER BY l.id DESC;'},
    {   'id': 43,
        'key': 'D_FETCH_LEAD_STATS',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    COUNT(l.id) AS total_count,\n'
                 '    JSON_BUILD_OBJECT(\n'
                 "        'all', COUNT(l.id),\n"
                 "        'new_lead', COUNT(CASE WHEN ps.name ILIKE '%new%' OR l.pipeline_stage_id = 1 THEN 1 END),\n"
                 "        'follow_up', COUNT(CASE WHEN ps.name ILIKE '%follow%' OR l.pipeline_stage_id = 2 THEN 1 "
                 'END),\n'
                 "        'missed_follow_up', COUNT(CASE WHEN ps.name ILIKE '%missed%' OR l.pipeline_stage_id = 3 THEN "
                 '1 END),\n'
                 "        'won', COUNT(CASE WHEN ps.name ILIKE '%won%' OR l.pipeline_stage_id = 4 THEN 1 END),\n"
                 "        'lost', COUNT(CASE WHEN ps.name ILIKE '%loss%' OR ps.name ILIKE '%lost%' OR "
                 'l.pipeline_stage_id = 5 THEN 1 END)\n'
                 '    ) AS tab_counts,\n'
                 '    JSON_BUILD_OBJECT(\n'
                 "        'total_count', COUNT(l.id),\n"
                 "        'new_count', COUNT(CASE WHEN ps.name ILIKE '%new%' OR l.pipeline_stage_id = 1 THEN 1 END),\n"
                 "        'follow_up_count', COUNT(CASE WHEN ps.name ILIKE '%follow%' OR l.pipeline_stage_id = 2 THEN "
                 '1 END),\n'
                 "        'pending_follow_up_count', COUNT(CASE WHEN ps.name ILIKE '%missed%' OR l.pipeline_stage_id = "
                 '3 THEN 1 END),\n'
                 "        'won_count', COUNT(CASE WHEN ps.name ILIKE '%won%' OR l.pipeline_stage_id = 4 THEN 1 END),\n"
                 "        'loss_count', COUNT(CASE WHEN ps.name ILIKE '%loss%' OR ps.name ILIKE '%lost%' OR "
                 'l.pipeline_stage_id = 5 THEN 1 END)\n'
                 '    ) AS stats\n'
                 'FROM telecalling_lead l\n'
                 'LEFT JOIN telecalling_pipeline_stage ps ON ps.id = l.pipeline_stage_id\n'
                 'WHERE (l.organization_id = @_organization_id OR @_organization_id IS NULL OR @_organization_id = '
                 '0);'},
    {   'id': 44,
        'key': 'D_FETCH_ALL_TEAMS_ADMIN',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    t.id,\n'
                 '    t.name,\n'
                 "    COALESCE(o.state, 'North Region') AS region,\n"
                 "    TRIM(CONCAT(l.first_name, ' ', l.last_name)) AS lead,\n"
                 "    TRIM(CONCAT(l.first_name, ' ', l.last_name)) AS lead_name,\n"
                 '    l.id AS lead_id,\n'
                 '    CASE \n'
                 "        WHEN l.id IS NOT NULL THEN JSON_BUILD_OBJECT('id', l.id, 'name', TRIM(CONCAT(l.first_name, ' "
                 "', l.last_name)))\n"
                 '        ELSE NULL \n'
                 '    END AS lead_obj,\n'
                 "    COALESCE(t.badge_color, '#6366F1') AS color,\n"
                 '    COUNT(m.id) AS "membersCount",\n'
                 '    COALESCE(\n'
                 '        JSON_AGG(\n'
                 '            JSON_BUILD_OBJECT(\n'
                 "                'id', m.id,\n"
                 "                'name', TRIM(CONCAT(m.first_name, ' ', m.last_name))\n"
                 '            )\n'
                 "        ) FILTER (WHERE m.id IS NOT NULL), '[]'::json\n"
                 '    ) AS members\n'
                 'FROM adm_team t\n'
                 'LEFT JOIN adm_user l ON t.leader_id = l.id\n'
                 'LEFT JOIN adm_organization o ON t.organization_id = o.id\n'
                 'LEFT JOIN adm_user m ON m.team_id = t.id AND m.is_active = TRUE\n'
                 'WHERE t.is_active = TRUE \n'
                 '  AND (t.organization_id = @_organization_id OR @_organization_id IS NULL OR @_organization_id = 0)\n'
                 'GROUP BY t.id, t.name, o.state, l.first_name, l.last_name, l.id, t.badge_color\n'
                 'ORDER BY t.id'},
    {   'id': 45,
        'key': 'L_COURSE_TIMINGS',
        'organization_id': None,
        'query': 'SELECT DISTINCT id AS value, course_time AS label FROM telecalling_course_time WHERE is_active = '
                 'TRUE ORDER BY label ASC;'},
    {   'id': 46,
        'key': 'D_FETCH_ALL_USERS_ADMIN',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    ROW_NUMBER() OVER (ORDER BY u.created_at DESC, u.id DESC) AS s_no,\n'
                 '    u.id,\n'
                 "    COALESCE(u.employee_id, CONCAT('EMP-', LPAD(u.id::text, 4, '0'))) AS emp_id,\n"
                 "    TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS name,\n"
                 '    u.first_name,\n'
                 "    COALESCE(u.last_name, '') AS last_name,\n"
                 "    COALESCE(u.mobile, '') AS mobile_no,\n"
                 "    COALESCE(u.address, '') AS location,\n"
                 '    u.email,\n'
                 '    COALESCE(\n'
                 '        NULLIF(\n'
                 '            CASE \n'
                 "                WHEN r.display_value ILIKE '%tele%' OR r.name ILIKE '%tele%' THEN 'Executive'\n"
                 '                ELSE COALESCE(r.display_value, r.name)\n'
                 "            END, ''\n"
                 '        ),\n'
                 "        'Executive'\n"
                 '    ) AS role,\n'
                 "    TRIM(CONCAT(rep.first_name, ' ', rep.last_name)) AS reporting_to,\n"
                 '    rep.id AS reporting_to_id,\n'
                 "    CASE WHEN u.is_active = TRUE THEN 'Active' ELSE 'Inactive' END AS status,\n"
                 '    u.is_active,\n'
                 "    TO_CHAR(u.created_at, 'YYYY-MM-DD') AS joined_date,\n"
                 "    COALESCE(t.name, '') AS team,\n"
                 '    u.team_id,\n'
                 '    COALESCE(u.disable_lead_assignment, FALSE) AS disable_lead_assignment\n'
                 'FROM adm_user u\n'
                 'LEFT JOIN adm_team t ON u.team_id = t.id\n'
                 'LEFT JOIN adm_user rep ON u.reporting_to_id = rep.id\n'
                 'LEFT JOIN adm_user_role ur ON ur.user_id = u.id\n'
                 'LEFT JOIN adm_role r ON ur.role_id = r.id\n'
                 'WHERE (u.organization_id = @_organization_id OR @_organization_id IS NULL OR @_organization_id = 0)\n'
                 "  AND (r.name NOT ILIKE '%developer%' OR r.name IS NULL)\n"
                 '  AND (\n'
                 "    '@_search' = '' OR '@_search' = '0' OR\n"
                 "    u.first_name ILIKE '%@_search%' OR\n"
                 "    u.last_name ILIKE '%@_search%' OR\n"
                 "    u.email ILIKE '%@_search%' OR\n"
                 "    u.mobile ILIKE '%@_search%' OR\n"
                 "    u.employee_id ILIKE '%@_search%'\n"
                 '  )\n'
                 'ORDER BY u.created_at DESC, u.id DESC'},
    {   'id': 47,
        'key': 'L_REPORTING_MANAGERS',
        'organization_id': None,
        'query': "SELECT DISTINCT u.id AS value, COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), "
                 'u.username) AS label FROM adm_user u LEFT JOIN adm_user_role ur ON u.id = ur.user_id LEFT JOIN '
                 "adm_role r ON ur.role_id = r.id WHERE u.is_active = TRUE AND NOT (LOWER(COALESCE(r.code, '')) IN "
                 "('telecaller', 'executive', 'agent', 'caller') OR LOWER(COALESCE(r.name, '')) ILIKE '%telecaller%' "
                 "OR LOWER(COALESCE(r.name, '')) ILIKE '%executive%' OR LOWER(COALESCE(r.name, '')) ILIKE '%agent%' OR "
                 "LOWER(COALESCE(u.user_type, '')) ILIKE '%telecaller%' OR LOWER(COALESCE(u.user_type, '')) ILIKE "
                 "'%executive%' OR LOWER(COALESCE(u.user_type, '')) ILIKE '%agent%') AND (NULLIF('@_organization_id', "
                 "'')::integer IS NULL OR NULLIF('@_organization_id', '')::integer = 0 OR u.organization_id = "
                 "NULLIF('@_organization_id', '')::integer) ORDER BY label ASC;"},
    {   'id': 48,
        'key': 'L_CAMPAIGN_ELIGIBLE_AGENTS',
        'organization_id': None,
        'query': 'SELECT ca.agent_user_id AS id\n'
                 'FROM adm_campaign_assigned_agents ca\n'
                 'JOIN adm_user u ON ca.agent_user_id = u.id\n'
                 'WHERE ca.campaign_id = %(campaign_id)s \n'
                 '  AND ca.is_active = TRUE \n'
                 '  AND u.is_active = TRUE \n'
                 '  AND u.disable_lead_assignment = FALSE\n'
                 'ORDER BY ca.agent_user_id;'},
    {   'id': 49,
        'key': 'D_FETCH_DASHBOARD_TOP_TILES',
        'organization_id': None,
        'query': '   \n'
                 '    \n'
                 '    WITH date_range AS (\n'
                 '    SELECT\n'
                 "        '@_from_date'::date AS current_from,\n"
                 "        '@_to_date'::date AS current_to,\n"
                 '        (\n'
                 "            '@_to_date'::date\n"
                 "            - '@_from_date'::date + 1\n"
                 '        ) AS total_days\n'
                 '),\n'
                 '\n'
                 'previous_date_range AS (\n'
                 '    SELECT\n'
                 '        current_from - total_days AS previous_from,\n'
                 '        current_from - 1 AS previous_to\n'
                 '    FROM date_range\n'
                 '),\n'
                 '\n'
                 '/* Latest payment per lead */\n'
                 'payment_stats AS (\n'
                 '    SELECT DISTINCT ON (lead_id)\n'
                 '        lead_id,\n'
                 '        COALESCE(pending_amount, 0) AS total_pending\n'
                 '    FROM telecalling_payment_info\n'
                 '    ORDER BY lead_id, created_at DESC, id DESC\n'
                 '),\n'
                 '\n'
                 '/* Current period leads */\n'
                 'current_leads AS (\n'
                 '    SELECT\n'
                 '        al.id,\n'
                 '        al.pipeline_stage_id,\n'
                 "        COALESCE(ps.name, 'Unknown Stage') AS stage_name,\n"
                 '        ps.pipeline_category_id\n'
                 '    FROM telecalling_lead al\n'
                 '\n'
                 '    LEFT JOIN telecalling_pipeline_stage ps\n'
                 '        ON ps.id = al.pipeline_stage_id\n'
                 '\n'
                 '    CROSS JOIN date_range d\n'
                 '\n'
                 '    WHERE\n'
                 '        al.assigned_to_id = @_id\n'
                 '        AND al.organization_id = @_organization_id\n'
                 '\n'
                 '        AND (\n'
                 "            al.created_at AT TIME ZONE 'Asia/Kolkata'\n"
                 '        ) BETWEEN\n'
                 '            d.current_from::timestamp\n'
                 '        AND\n'
                 '            (d.current_to + 1)::timestamp\n'
                 "            - INTERVAL '1 second'\n"
                 '\n'
                 '        AND (\n'
                 '            @_pipeline_id = 0\n'
                 '            OR ps.pipeline_category_id = @_pipeline_id\n'
                 '        )\n'
                 '),\n'
                 '\n'
                 '/* Previous period leads */\n'
                 'previous_leads AS (\n'
                 '    SELECT\n'
                 '        al.id,\n'
                 '        al.pipeline_stage_id,\n'
                 "        COALESCE(ps.name, 'Unknown Stage') AS stage_name,\n"
                 '        ps.pipeline_category_id\n'
                 '    FROM telecalling_lead al\n'
                 '\n'
                 '    LEFT JOIN telecalling_pipeline_stage ps\n'
                 '        ON ps.id = al.pipeline_stage_id\n'
                 '\n'
                 '    CROSS JOIN previous_date_range d\n'
                 '\n'
                 '    WHERE\n'
                 '        al.assigned_to_id = @_id\n'
                 '        AND al.organization_id = @_organization_id\n'
                 '\n'
                 '        AND (\n'
                 '            (\n'
                 "                al.created_at AT TIME ZONE 'Asia/Kolkata'\n"
                 '            ) BETWEEN\n'
                 '                d.previous_from::timestamp\n'
                 '            AND\n'
                 '                (d.previous_to + 1)::timestamp\n'
                 "                - INTERVAL '1 second'\n"
                 '\n'
                 '            OR\n'
                 '\n'
                 '            (\n'
                 "                al.updated_at AT TIME ZONE 'Asia/Kolkata'\n"
                 '            ) BETWEEN\n'
                 '                d.previous_from::timestamp\n'
                 '            AND\n'
                 '                (d.previous_to + 1)::timestamp\n'
                 "                - INTERVAL '1 second'\n"
                 '        )\n'
                 '\n'
                 '        AND (\n'
                 '            @_pipeline_id = 0\n'
                 '            OR ps.pipeline_category_id = @_pipeline_id\n'
                 '        )\n'
                 '),\n'
                 '\n'
                 '/* Stage counts for current period */\n'
                 'current_stage_stats AS (\n'
                 '    SELECT\n'
                 '        pipeline_category_id,\n'
                 '        pipeline_stage_id,\n'
                 '        stage_name,\n'
                 '        COUNT(DISTINCT id) AS total\n'
                 '    FROM current_leads\n'
                 '    GROUP BY\n'
                 '        pipeline_category_id,\n'
                 '        pipeline_stage_id,\n'
                 '        stage_name\n'
                 '),\n'
                 '\n'
                 '/* Stage counts for previous period */\n'
                 'previous_stage_stats AS (\n'
                 '    SELECT\n'
                 '        pipeline_category_id,\n'
                 '        pipeline_stage_id,\n'
                 '        stage_name,\n'
                 '        COUNT(DISTINCT id) AS total\n'
                 '    FROM previous_leads\n'
                 '    GROUP BY\n'
                 '        pipeline_category_id,\n'
                 '        pipeline_stage_id,\n'
                 '        stage_name\n'
                 '),\n'
                 '\n'
                 '/* Fixed summary cards */\n'
                 'current_summary AS (\n'
                 '    SELECT\n'
                 '        COUNT(DISTINCT cl.id) AS total_leads,\n'
                 '        COALESCE(SUM(pay.total_pending), 0) AS pending_payments\n'
                 '    FROM current_leads cl\n'
                 '\n'
                 '    LEFT JOIN payment_stats pay\n'
                 '        ON pay.lead_id = cl.id\n'
                 '),\n'
                 '\n'
                 'previous_summary AS (\n'
                 '    SELECT\n'
                 '        COUNT(DISTINCT pl.id) AS total_leads,\n'
                 '        COALESCE(SUM(pay.total_pending), 0) AS pending_payments\n'
                 '    FROM previous_leads pl\n'
                 '\n'
                 '    LEFT JOIN payment_stats pay\n'
                 '        ON pay.lead_id = pl.id\n'
                 '),\n'
                 '\n'
                 'selected_stages AS (\n'
                 '    SELECT\n'
                 '        id AS stage_id,\n'
                 '        name AS stage_name,\n'
                 '        pipeline_category_id\n'
                 '    FROM telecalling_pipeline_stage\n'
                 '    WHERE\n'
                 '        @_pipeline_id = 0\n'
                 '        OR pipeline_category_id = @_pipeline_id\n'
                 '),\n'
                 '\n'
                 '/* Build fixed cards + dynamic stage cards */\n'
                 'all_metrics AS (\n'
                 '\n'
                 '    SELECT\n'
                 "        'Total Leads'::text AS label,\n"
                 '        c.total_leads::numeric AS current_value,\n'
                 '        p.total_leads::numeric AS previous_value,\n'
                 '        0 AS sort_order\n'
                 '    FROM current_summary c\n'
                 '    CROSS JOIN previous_summary p\n'
                 '\n'
                 '    UNION ALL\n'
                 '\n'
                 '    SELECT\n'
                 "        'Pending Payments',\n"
                 '        c.pending_payments::numeric,\n'
                 '        p.pending_payments::numeric,\n'
                 '        999\n'
                 '    FROM current_summary c\n'
                 '    CROSS JOIN previous_summary p\n'
                 '\n'
                 'UNION ALL\n'
                 '\n'
                 'SELECT\n'
                 '    ss.stage_name,\n'
                 '    COALESCE(cs.total, 0)::numeric,\n'
                 '    COALESCE(ps.total, 0)::numeric,\n'
                 '    (\n'
                 '        ROW_NUMBER() OVER (\n'
                 '            ORDER BY\n'
                 '                ss.pipeline_category_id,\n'
                 '                ss.stage_id\n'
                 '        ) + 1\n'
                 '    )::integer\n'
                 '\n'
                 'FROM selected_stages ss\n'
                 '\n'
                 'LEFT JOIN current_stage_stats cs\n'
                 '    ON cs.pipeline_category_id\n'
                 '        IS NOT DISTINCT FROM ss.pipeline_category_id\n'
                 '    AND cs.pipeline_stage_id = ss.stage_id\n'
                 '\n'
                 'LEFT JOIN previous_stage_stats ps\n'
                 '    ON ps.pipeline_category_id\n'
                 '        IS NOT DISTINCT FROM ss.pipeline_category_id\n'
                 '    AND ps.pipeline_stage_id = ss.stage_id\n'
                 ')\n'
                 '\n'
                 '/* Final dashboard response */\n'
                 'SELECT\n'
                 '    label,\n'
                 '    current_value::text AS value,\n'
                 '\n'
                 '    CASE\n'
                 '        WHEN previous_value = 0 THEN\n'
                 '            CASE\n'
                 "                WHEN current_value = 0 THEN '0.00'\n"
                 "                ELSE '100.00'\n"
                 '            END\n'
                 '\n'
                 '        ELSE\n'
                 '            ROUND(\n'
                 '                GREATEST(\n'
                 '                    -100::numeric,\n'
                 '                    LEAST(\n'
                 '                        100::numeric,\n'
                 '                        (\n'
                 '                            (current_value - previous_value)\n'
                 '                            / previous_value\n'
                 '                        ) * 100\n'
                 '                    )\n'
                 '                ),\n'
                 '                2\n'
                 '            )::text\n'
                 '    END AS percentage\n'
                 '\n'
                 'FROM all_metrics\n'
                 '\n'
                 'ORDER BY sort_order;'},
    {   'id': 50,
        'key': 'D_FETCH_TELECALLER_PERFORMANCE',
        'organization_id': None,
        'query': '\n'
                 '    SELECT\n'
                 '    au.id,\n'
                 '    au.first_name,\n'
                 '    au.last_name,\n'
                 '    ar.name AS role_name,\n'
                 '\n'
                 '    COUNT(DISTINCT al.id) AS total_leads,\n'
                 '\n'
                 '    COUNT(\n'
                 '        DISTINCT CASE\n'
                 '            WHEN EXISTS (\n'
                 '                SELECT 1\n'
                 '                FROM telecalling_call_details acd\n'
                 '                WHERE acd.lead_id = al.id\n'
                 '            )\n'
                 '            THEN al.id\n'
                 '        END\n'
                 '    ) AS contacted,\n'
                 '\n'
                 '    COUNT(\n'
                 '        DISTINCT CASE\n'
                 "            WHEN ps.stage_type = 'closed_won' OR LOWER(ps.name) LIKE '%won%'\n"
                 '            THEN al.id\n'
                 '        END\n'
                 '    ) AS won_leads,\n'
                 '\n'
                 '    COUNT(\n'
                 '        DISTINCT CASE\n'
                 "            WHEN ps.stage_type = 'closed_lost' OR LOWER(ps.name) LIKE '%loss%' OR LOWER(ps.name) LIKE '%lost%'\n"
                 '            THEN al.id\n'
                 '        END\n'
                 '    ) AS lost_leads,\n'
                 '\n'
                 '    COALESCE(\n'
                 '        ROUND(\n'
                 '            COUNT(\n'
                 '                DISTINCT CASE\n'
                 "                    WHEN ps.stage_type = 'closed_won' OR LOWER(ps.name) LIKE '%won%'\n"
                 '                    THEN al.id\n'
                 '                END\n'
                 '            ) * 100.0 /\n'
                 '            NULLIF(COUNT(DISTINCT al.id), 0),\n'
                 '            1\n'
                 '        ),\n'
                 '        0\n'
                 '    ) AS performance_score,\n'
                 '\n'
                 '    COALESCE(\n'
                 '        ROUND(\n'
                 '            COUNT(\n'
                 '                DISTINCT CASE\n'
                 '                    WHEN EXISTS (\n'
                 '                        SELECT 1\n'
                 '                        FROM telecalling_call_details acd\n'
                 '                        WHERE acd.lead_id = al.id\n'
                 '                    )\n'
                 '                    THEN al.id\n'
                 '                END\n'
                 '            ) * 100.0 /\n'
                 '            NULLIF(COUNT(DISTINCT al.id), 0),\n'
                 '            1\n'
                 '        ),\n'
                 '        0\n'
                 '    ) AS contact_rate\n'
                 '\n'
                 'FROM adm_user au\n'
                 '\n'
                 'LEFT JOIN adm_user_role aur\n'
                 '    ON aur.user_id = au.id\n'
                 '\n'
                 'LEFT JOIN adm_role ar\n'
                 '    ON ar.id = aur.role_id\n'
                 '\n'
                 'LEFT JOIN telecalling_lead al\n'
                 '    ON al.assigned_to_id = au.id\n'
                 '\n'
                 '    AND (\n'
                 '        @_organization_id = 0\n'
                 '        OR al.organization_id = @_organization_id\n'
                 '    )\n'
                 '\n'
                 '    AND (\n'
                 '        @_pipeline_id = 0\n'
                 '        OR al.pipeline_stage_id IN (\n'
                 '            SELECT id\n'
                 '            FROM telecalling_pipeline_stage\n'
                 '            WHERE pipeline_category_id = @_pipeline_id\n'
                 '        )\n'
                 '    )\n'
                 '\n'
                 '    AND (\n'
                 "        '@_from_date' IS NULL\n"
                 "        OR al.created_at::date >= '@_from_date'::date\n"
                 '    )\n'
                 '\n'
                 '    AND (\n'
                 "        '@_to_date'IS NULL\n"
                 "        OR al.created_at::date <= '@_to_date'::date\n"
                 '    )\n'
                 '\n'
                 'LEFT JOIN telecalling_pipeline_stage ps\n'
                 '    ON ps.id = al.pipeline_stage_id\n'
                 '\n'
                 'WHERE au.id = @_id\n'
                 '\n'
                 'GROUP BY\n'
                 '    au.id,\n'
                 '    au.first_name,\n'
                 '    au.last_name,\n'
                 '    ar.name\n'
                 '\n'
                 'ORDER BY performance_score DESC;'},
    {   'id': 51,
        'key': 'D_FETCH_ALL_COURSE_DATA',
        'organization_id': None,
        'query': 'SELECT\n'
                 '    ac.id,\n'
                 '    cn.course_name AS course_name,\n'
                 '    cp.course_plan AS course_plan,\n'
                 '    ct.course_time AS course_time,\n'
                 '    ac.starting_date,\n'
                 '    ac.closing_date,\n'
                 '    ac.total_seats,\n'
                 '    ac.admission_count,\n'
                 '    ac.seats_left,\n'
                 '    ac.status,\n'
                 '    ac.batch,\n'
                 '    ac.course_fees\n'
                 'FROM telecalling_course ac\n'
                 '\n'
                 '-- Join for Course Name (Direct ForeignKey)\n'
                 'LEFT JOIN telecalling_course_name cn\n'
                 '    ON cn.id = ac.course_name_id\n'
                 '\n'
                 '-- Join for Course Plan (Direct ForeignKey)\n'
                 'LEFT JOIN telecalling_course_plan cp\n'
                 '    ON cp.id = ac.course_plan_id\n'
                 '\n'
                 '-- Join for Course Timing (Direct ForeignKey)\n'
                 'LEFT JOIN telecalling_course_time ct\n'
                 '    ON ct.id = ac.course_time_id\n'
                 '\n'
                 'WHERE ac.is_active = True\n'
                 'ORDER BY ac.id DESC;'},
    {   'id': 52,
        'key': 'D_FETCH_ONE_LEAD_CALL_HISTORY',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    acd.id,\n'
                 '    acd.called_at,\n'
                 '    acd.connection_status,\n'
                 '    ps.name as name,\n'
                 '    st.name as select_tag,\n'
                 '    acd.conversation_summary AS call_notes,\n'
                 '    acd.upload_recording,\n'
                 '    acd.duration_seconds,\n'
                 '    COALESCE(afu.scheduled_at, apf.followup_date) AS next_follow_up,\n'
                 '    st.name AS disconnected_reason,\n'
                 '    add2.retry_notes\n'
                 '\n'
                 'FROM telecalling_call_details acd\n'
                 'LEFT JOIN telecalling_follow_up afu \n'
                 '    ON afu.created_from_call_id = acd.id\n'
                 'LEFT JOIN telecalling_disconnect_details add2 \n'
                 '    ON add2.call_id = acd.id\n'
                 'LEFT JOIN telecalling_payment_followup apf \n'
                 '    ON apf.created_from_call_id = acd.id\n'
                 'LEFT JOIN telecalling_priority st \n'
                 '    ON st.id = acd.select_tag_id\n'
                 'LEFT JOIN telecalling_pipeline_stage ps \n'
                 '    ON ps.id = acd.stage_id\n'
                 'WHERE acd.lead_id = @_id\n'
                 'ORDER BY acd.called_at DESC;'},
    {   'id': 53,
        'key': 'D_FETCH_LOSS_ANALYSIS_TELE',
        'organization_id': None,
        'query': '\n'
                 'WITH last_stage AS (\n'
                 '    SELECT\n'
                 '        id,\n'
                 '        pipeline_category_id\n'
                 '    FROM telecalling_pipeline_stage\n'
                 '    WHERE (\n'
                 '        @_pipeline_id = 0\n'
                 '        OR pipeline_category_id = @_pipeline_id\n'
                 '    )\n'
                 '    ORDER BY order_no DESC, id DESC\n'
                 '    LIMIT 1\n'
                 ')\n'
                 '\n'
                 'SELECT\n'
                 '    llead.main_reason_id AS reason_id,\n'
                 '    ast.name AS reason,\n'
                 '    COUNT(DISTINCT al.id) AS total_lost,\n'
                 '\n'
                 '    COALESCE(\n'
                 '        ROUND(\n'
                 '            COUNT(DISTINCT al.id) * 100.0 /\n'
                 '            NULLIF(\n'
                 '                (\n'
                 '                    SELECT COUNT(DISTINCT al2.id)\n'
                 '                    FROM telecalling_lead al2\n'
                 '                    JOIN last_stage ls2\n'
                 '                        ON ls2.id = al2.pipeline_stage_id\n'
                 '                    WHERE al2.assigned_to_id = @_id\n'
                 '                      AND (\n'
                 '                          @_organization_id = 0\n'
                 '                          OR al2.organization_id = @_organization_id\n'
                 '                      )\n'
                 '                      AND (\n'
                 "                          '@_from_date' IS NULL\n"
                 "                          OR al2.created_at::date >= '@_from_date'::date\n"
                 '                      )\n'
                 '                      AND (\n'
                 "                          '@_to_date' IS NULL\n"
                 "                          OR al2.created_at::date <= '@_to_date'::date\n"
                 '                      )\n'
                 '                ),\n'
                 '                0\n'
                 '            ),\n'
                 '            1\n'
                 '        ),\n'
                 '        0\n'
                 '    ) AS percentage\n'
                 '\n'
                 'FROM telecalling_lead al\n'
                 '\n'
                 'JOIN last_stage ls\n'
                 '    ON ls.id = al.pipeline_stage_id\n'
                 '\n'
                 'LEFT JOIN telecalling_loss_lead_detail llead\n'
                 '    ON llead.lead_id = al.id\n'
                 '\n'
                 'LEFT JOIN telecalling_loss_reason ast\n'
                 '    ON ast.id = llead.main_reason_id\n'
                 '\n'
                 'WHERE al.assigned_to_id = @_id\n'
                 '  AND (\n'
                 '      @_organization_id = 0\n'
                 '      OR al.organization_id = @_organization_id\n'
                 '  )\n'
                 '  AND (\n'
                 "      '@_from_date' IS NULL\n"
                 "      OR al.created_at::date >= '@_from_date'::date\n"
                 '  )\n'
                 '  AND (\n'
                 "      '@_to_date' IS NULL\n"
                 "      OR al.created_at::date <= '@_to_date'::date\n"
                 '  )\n'
                 '  AND llead.id IS NOT NULL\n'
                 '\n'
                 'GROUP BY\n'
                 '    llead.main_reason_id,\n'
                 '    ast.name\n'
                 '\n'
                 'ORDER BY total_lost DESC;\n'
                 '\n'},
    {   'id': 54,
        'key': 'D_FETCH_ONE_LOSS_LEAD_DATA',
        'organization_id': None,
        'query': '\n'
                 'WITH all_follow_ups AS (\n'
                 '    SELECT f.id, f.lead_id\n'
                 '    FROM telecalling_follow_up f\n'
                 '    WHERE f.lead_id = @_id\n'
                 '\n'
                 '    UNION ALL\n'
                 '\n'
                 '    SELECT pf.id, pi.lead_id\n'
                 '    FROM telecalling_payment_followup pf\n'
                 '    JOIN telecalling_payment_info pi ON pi.id = pf.payment_info_id\n'
                 '    WHERE pi.lead_id =@_id\n'
                 ')\n'
                 'SELECT\n'
                 '    COUNT(f.id) AS follow_up_days,\n'
                 '    l.created_at AS enquiry_date,\n'
                 '    pr.name AS priority,\n'
                 '    ps.name AS pipeline_stage\n'
                 'FROM telecalling_lead l\n'
                 'LEFT JOIN all_follow_ups f ON f.lead_id = l.id\n'
                 'LEFT JOIN telecalling_priority pr ON pr.id = l.priority_id\n'
                 'LEFT JOIN telecalling_pipeline_stage ps ON ps.id = l.pipeline_stage_id\n'
                 'WHERE l.id = @_id\n'
                 'GROUP BY l.created_at, pr.name, ps.name;'},
    {   'id': 55,
        'key': 'D_FETCH_ONE_LEAD',
        'organization_id': None,
        'query': '\n'
                 'SELECT \n'
                 '    al.id,\n'
                 '    al.full_name,\n'
                 '    al.mobile_no,\n'
                 '    al.alternative_mobile,\n'
                 '    al.email,\n'
                 '    al.location,\n'
                 '    al.education_id,\n'
                 '    e.name AS education,\n'
                 '    al.passed_out_year,\n'
                 '    al.experience,\n'
                 '    al.current_status,\n'
                 '    al.created_at AS enquiry_date,\n'
                 '    al.lead_source_id,\n'
                 '    ls.name AS lead_source,\n'
                 '    al.campaign_id AS campaign_course_name_id,\n'
                 '    cmp.name AS campaign_name,\n'
                 '    al.course_plan_id,\n'
                 '    cp.course_plan AS course_plan,\n'
                 '    al.course_name_id,\n'
                 '    cn.course_name AS course_name,\n'
                 '    al.course_timing_id,\n'
                 '    ct.course_time AS course_timing,\n'
                 '    al.preferred_timing_id,\n'
                 '    pt.name AS preferred_timing,\n'
                 '    al.pipeline_stage_id,\n'
                 '    COALESCE(ps.display_value, ps.name) AS pipeline_stage,\n'
                 '    ps.pipeline_category_id AS pipeline_id,\n'
                 '    ps.pipeline_category_id,\n'
                 '    pcat.category_name AS pipeline_name,\n'
                 '    al.priority_id,\n'
                 '    COALESCE(pr.display_value, pr.name) AS priority,\n'
                 '    ac.course_fees,\n'
                 '    api.amount_paid,\n'
                 '    api.pending_amount,\n'
                 '    aph.due_date,\n'
                 '    afp.scheduled_at,\n'
                 '    CASE \n'
                 '        WHEN api.pending_amount = 0 OR (ac.course_fees > 0 AND api.amount_paid >= ac.course_fees) '
                 "THEN 'Paid'\n"
                 "        WHEN aph.due_date < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date THEN 'Over due'\n"
                 "        WHEN aph.due_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date THEN 'Today Due'\n"
                 "        WHEN aph.due_date > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date THEN 'Active Due'\n"
                 "        WHEN api.pending_amount > 0 AND aph.due_date IS NULL THEN 'Pending'\n"
                 "        ELSE 'Pending'\n"
                 '    END AS payment_status\n'
                 'FROM telecalling_lead al\n'
                 'LEFT JOIN telecalling_education e ON e.id = al.education_id\n'
                 'LEFT JOIN telecalling_lead_source ls ON ls.id = al.lead_source_id\n'
                 'LEFT JOIN telecalling_campaign_name cmp ON cmp.id = al.campaign_id\n'
                 'LEFT JOIN telecalling_course_plan cp ON cp.id = al.course_plan_id\n'
                 'LEFT JOIN telecalling_course_name cn ON cn.id = al.course_name_id\n'
                 'LEFT JOIN telecalling_course_time ct ON ct.id = al.course_timing_id\n'
                 'LEFT JOIN telecalling_preferred_time pt ON pt.id = al.preferred_timing_id\n'
                 'LEFT JOIN telecalling_pipeline_stage ps ON ps.id = al.pipeline_stage_id\n'
                 'LEFT JOIN adm_pipeline_category pcat ON pcat.id = ps.pipeline_category_id\n'
                 'LEFT JOIN telecalling_priority pr ON pr.id = al.priority_id\n'
                 'LEFT JOIN telecalling_course ac ON ac.id = al.course_id\n'
                 'LEFT JOIN (\n'
                 '    SELECT DISTINCT ON (lead_id) *\n'
                 '    FROM telecalling_payment_info\n'
                 '    ORDER BY lead_id, created_at DESC\n'
                 ') api ON api.lead_id = al.id\n'
                 'LEFT JOIN (\n'
                 '    SELECT DISTINCT ON (payment_info_id) *\n'
                 '    FROM telecalling_payment_history\n'
                 '    ORDER BY payment_info_id, created_at DESC\n'
                 ') aph ON aph.payment_info_id = api.id\n'
                 'LEFT JOIN (\n'
                 '    SELECT DISTINCT ON (lead_id) *\n'
                 '    FROM telecalling_follow_up\n'
                 '    ORDER BY lead_id, created_at DESC\n'
                 ') afp ON afp.lead_id = al.id\n'
                 'WHERE al.id = @_id;'},
    {   'id': 56,
        'key': 'D_FETCH_PIPELINE_STATGE_LEADS',
        'organization_id': None,
        'query': 'WITH\n'
                 'pl AS (\n'
                 '  SELECT pc.id, COALESCE(pc.display_name, pc.category_name) AS name\n'
                 '  FROM adm_pipeline_category pc\n'
                 '  WHERE pc.is_active = TRUE\n'
                 '    AND (@_pipeline_id = 0 OR pc.id = @_pipeline_id)\n'
                 '  ORDER BY pc.is_default DESC, pc.id\n'
                 '  LIMIT 1\n'
                 '),\n'
                 'stg AS (\n'
                 '  SELECT s.*,\n'
                 '         ROW_NUMBER() OVER (ORDER BY s.order_no, s.id) AS rn\n'
                 '  FROM telecalling_pipeline_stage s\n'
                 '  JOIN pl ON pl.id = s.pipeline_category_id\n'
                 '  WHERE s.is_active = TRUE\n'
                 '),\n'
                 'base AS (\n'
                 '  SELECT l.*\n'
                 '  FROM telecalling_lead l\n'
                 '  JOIN stg ON stg.id = l.pipeline_stage_id\n'
                 '  WHERE l.assigned_to_id = @_id\n'
                 '    AND (\n'
                 "         (l.created_at AT TIME ZONE 'Asia/Kolkata') BETWEEN ('@_from_date' || ' "
                 "00:00:00')::timestamp AND ('@_to_date' || ' 23:59:59')::timestamp\n"
                 "      OR (l.updated_at AT TIME ZONE 'Asia/Kolkata') BETWEEN ('@_from_date' || ' "
                 "00:00:00')::timestamp AND ('@_to_date' || ' 23:59:59')::timestamp\n"
                 '      OR EXISTS (\n'
                 '           SELECT 1 FROM telecalling_follow_up fx\n'
                 '           WHERE fx.lead_id = l.id\n'
                 "             AND (fx.scheduled_at AT TIME ZONE 'Asia/Kolkata') BETWEEN ('@_from_date' || ' "
                 "00:00:00')::timestamp AND ('@_to_date' || ' 23:59:59')::timestamp\n"
                 '         )\n'
                 '    )\n'
                 '    AND (COALESCE(CAST(@_pipeline_stage_id AS INTEGER), 0) = 0 OR l.pipeline_stage_id = '
                 'CAST(@_pipeline_stage_id AS INTEGER))\n'
                 '    AND (COALESCE(CAST(@_lead_source_id   AS INTEGER), 0) = 0 OR l.lead_source_id   = '
                 'CAST(@_lead_source_id   AS INTEGER))\n'
                 '    AND (COALESCE(CAST(@_course_name_id   AS INTEGER), 0) = 0 OR l.course_name_id   = '
                 'CAST(@_course_name_id   AS INTEGER))\n'
                 '    AND (COALESCE(CAST(@_priority_id      AS INTEGER), 0) = 0 OR l.priority_id      = '
                 'CAST(@_priority_id      AS INTEGER))\n'
                 '    AND (COALESCE(CAST(@_course_plan_id   AS INTEGER), 0) = 0 OR l.course_plan_id   = '
                 'CAST(@_course_plan_id   AS INTEGER))\n'
                 '),\n'
                 'lead_dates AS (\n'
                 '  SELECT\n'
                 '    b.*,\n'
                 '    stg.name AS stage_name,\n'
                 '    stg.stage_type,\n'
                 '    stg.rn AS stage_rn,\n'
                 '    fu.scheduled_at AS fu_scheduled_at,\n'
                 '    pi.pending_amount AS pi_pending_amount,\n'
                 '    pi.amount_paid AS pi_amount_paid,\n'
                 '    pi.is_full_payment AS pi_is_full_payment,\n'
                 '    ph.due_date AS ph_due_date,\n'
                 '    pfu.followup_date AS pfu_followup_date,\n'
                 '    lsd.requested_at AS lsd_requested_at,\n'
                 '    lsd.reason_name AS lsd_reason_name,\n'
                 '    lsd.detailed_reason AS lsd_detailed_reason,\n'
                 '    apl.approved_at AS apl_approved_at,\n'
                 '    apl.reason_name AS apl_reason_name,\n'
                 '    apl.final_remarks AS apl_final_remarks,\n'
                 '    cc.cnt AS total_call_count,\n'
                 '    cs.summary AS call_summary,\n'
                 '    cl.last_call_at,\n'
                 '    CASE\n'
                 "      WHEN stg.stage_type = 'closed_won' AND COALESCE(pi.pending_amount, 0) > 0 THEN\n"
                 '        COALESCE(ph.due_date::timestamp with time zone, pfu.followup_date, b.updated_at)\n'
                 "      WHEN stg.stage_type = 'closed_won' THEN\n"
                 '        COALESCE(pi.created_at, b.updated_at)\n'
                 "      WHEN stg.stage_type = 'closed_lost' THEN\n"
                 '        COALESCE(apl.approved_at, lsd.requested_at, b.updated_at)\n'
                 "      WHEN LOWER(stg.name) LIKE '%loss%request%' THEN\n"
                 '        COALESCE(lsd.requested_at, b.updated_at)\n'
                 "      WHEN stg.rn = 1 OR LOWER(stg.name) LIKE '%new%' THEN\n"
                 '        b.created_at\n'
                 '      ELSE\n'
                 '        COALESCE(fu.scheduled_at, b.updated_at, b.created_at)\n'
                 '    END AS target_date,\n'
                 '    CASE\n'
                 "      WHEN stg.stage_type = 'closed_won' AND COALESCE(pi.pending_amount, 0) > 0 THEN "
                 'pfu.followup_date\n'
                 "      WHEN stg.stage_type IN ('closed_won', 'closed_lost') THEN NULL\n"
                 '      ELSE fu.scheduled_at\n'
                 '    END AS display_call_back\n'
                 '  FROM base b\n'
                 '  JOIN stg ON stg.id = b.pipeline_stage_id\n'
                 '  LEFT JOIN LATERAL (\n'
                 '    SELECT scheduled_at FROM telecalling_follow_up\n'
                 '    WHERE lead_id = b.id AND is_attended = FALSE\n'
                 '    ORDER BY scheduled_at ASC LIMIT 1\n'
                 '  ) fu ON TRUE\n'
                 '  LEFT JOIN LATERAL (\n'
                 '    SELECT COUNT(*) AS cnt FROM telecalling_call_details WHERE lead_id = b.id\n'
                 '  ) cc ON TRUE\n'
                 '  LEFT JOIN LATERAL (\n'
                 '    SELECT conversation_summary AS summary FROM telecalling_call_details\n'
                 "    WHERE lead_id = b.id AND TRIM(COALESCE(conversation_summary, '')) <> ''\n"
                 '    ORDER BY created_at DESC LIMIT 1\n'
                 '  ) cs ON TRUE\n'
                 '  LEFT JOIN LATERAL (\n'
                 '    SELECT created_at AS last_call_at FROM telecalling_call_details\n'
                 '    WHERE lead_id = b.id\n'
                 '    ORDER BY created_at DESC LIMIT 1\n'
                 '  ) cl ON TRUE\n'
                 '  LEFT JOIN LATERAL (\n'
                 '    SELECT * FROM telecalling_payment_info WHERE lead_id = b.id ORDER BY id DESC LIMIT 1\n'
                 '  ) pi ON TRUE\n'
                 '  LEFT JOIN LATERAL (\n'
                 '    SELECT due_date FROM telecalling_payment_history WHERE payment_info_id = pi.id AND due_date IS '
                 'NOT NULL ORDER BY id DESC LIMIT 1\n'
                 '  ) ph ON TRUE\n'
                 '  LEFT JOIN LATERAL (\n'
                 '    SELECT followup_date FROM telecalling_payment_followup WHERE payment_info_id = pi.id AND '
                 'is_attended = FALSE ORDER BY followup_date ASC LIMIT 1\n'
                 '  ) pfu ON TRUE\n'
                 '  LEFT JOIN LATERAL (\n'
                 '    SELECT ld.detailed_reason,\n'
                 '           ld.created_at AS requested_at,\n'
                 "           COALESCE(lr.name, '') AS reason_name\n"
                 '    FROM telecalling_loss_lead_detail ld\n'
                 '    LEFT JOIN telecalling_loss_reason lr\n'
                 '           ON lr.id = COALESCE(ld.loss_reason_id, ld.main_reason_id)\n'
                 '    WHERE ld.lead_id = b.id\n'
                 '    ORDER BY ld.id DESC LIMIT 1\n'
                 '  ) lsd ON TRUE\n'
                 '  LEFT JOIN LATERAL (\n'
                 '    SELECT al.final_remarks,\n'
                 '           al.created_at AS approved_at,\n'
                 "           COALESCE(lr2.name, '') AS reason_name\n"
                 '    FROM adm_approved_loss_lead al\n'
                 '    LEFT JOIN telecalling_loss_reason lr2 ON lr2.id = al.main_reason_id\n'
                 '    WHERE al.lead_id = b.id\n'
                 '    ORDER BY al.id DESC LIMIT 1\n'
                 '  ) apl ON TRUE\n'
                 '  WHERE (COALESCE(CAST(@_payment_status AS INTEGER), 0) = 0\n'
                 '         OR CAST(pi.payment_status AS INTEGER) = CAST(@_payment_status AS INTEGER))\n'
                 '),\n'
                 'cards AS (\n'
                 '  SELECT\n'
                 '    ld.id, ld.updated_at,\n'
                 '    ld.pipeline_stage_id AS stage_id,\n'
                 '    ld.priority_id,\n'
                 '    CASE\n'
                 "      WHEN (ld.target_date AT TIME ZONE 'Asia/Kolkata')::date < (NOW() AT TIME ZONE "
                 "'Asia/Kolkata')::date THEN 'past'\n"
                 "      WHEN (ld.target_date AT TIME ZONE 'Asia/Kolkata')::date > (NOW() AT TIME ZONE "
                 "'Asia/Kolkata')::date THEN 'future'\n"
                 "      ELSE 'current'\n"
                 '    END AS bucket,\n'
                 '    json_build_object(\n'
                 "      'id',             ld.id,\n"
                 "      'name',           COALESCE(ld.full_name, ''),\n"
                 "      'mobile',         COALESCE(ld.mobile_no, ''),\n"
                 "      'source',         COALESCE(ls.name, ''),\n"
                 "      'priority',       COALESCE(p.name, ''),\n"
                 "      'priority_color', COALESCE(p.color, ''),\n"
                 "      'course_name',    COALESCE(cn.course_name, ''),\n"
                 "      'course_plan',    COALESCE(cp.course_plan, ''),\n"
                 "      'timing',         COALESCE(ct.course_time, ''),\n"
                 "      'preferred_time', COALESCE(pt.name, ''),\n"
                 "      'call_summary',   COALESCE(ld.call_summary, ''),\n"
                 "      'date',           ld.target_date,\n"
                 "      'call_back',      ld.display_call_back,\n"
                 "      'total_calls',    COALESCE(ld.total_call_count, 0),\n"
                 "      'attempts',       COALESCE(ld.total_call_count, 0),\n"
                 "      'last_tried',     ld.last_call_at,\n"
                 "      'pending_amount', COALESCE(ld.pi_pending_amount, 0)::float,\n"
                 "      'amount_paid',    COALESCE(ld.pi_amount_paid, 0)::float,\n"
                 "      'total_fees',     (COALESCE(ld.pi_amount_paid, 0) + COALESCE(ld.pi_pending_amount, "
                 '0))::float,\n'
                 "      'due_date',       ld.ph_due_date,\n"
                 "      'is_full_payment',COALESCE(ld.pi_is_full_payment, FALSE),\n"
                 "      'loss_reason',       COALESCE(NULLIF(ld.apl_reason_name, ''), ld.lsd_reason_name, ''),\n"
                 "      'loss_notes',        COALESCE(NULLIF(ld.apl_final_remarks, ''), ld.lsd_detailed_reason, ''),\n"
                 "      'loss_requested_at', ld.lsd_requested_at,\n"
                 "      'loss_approved_at',  ld.apl_approved_at,\n"
                 "      'is_loss_approved',  (ld.apl_approved_at IS NOT NULL)\n"
                 '    ) AS card\n'
                 '  FROM lead_dates ld\n'
                 '  LEFT JOIN telecalling_lead_source    ls ON ls.id = ld.lead_source_id\n'
                 '  LEFT JOIN telecalling_priority       p  ON p.id  = ld.priority_id\n'
                 '  LEFT JOIN telecalling_course_name    cn ON cn.id = ld.course_name_id\n'
                 '  LEFT JOIN telecalling_course_plan    cp ON cp.id = ld.course_plan_id\n'
                 '  LEFT JOIN telecalling_course_time    ct ON ct.id = ld.course_timing_id\n'
                 '  LEFT JOIN telecalling_preferred_time pt ON pt.id = ld.preferred_timing_id\n'
                 '),\n'
                 'agg_stage AS (\n'
                 '  SELECT stage_id,\n'
                 '    COUNT(*) AS total,\n'
                 "    COALESCE(json_agg(card ORDER BY updated_at DESC, id DESC), '[]'::json) AS data,\n"
                 "    COUNT(*) FILTER (WHERE bucket='past') AS past_c,\n"
                 "    COALESCE(json_agg(card ORDER BY updated_at DESC, id DESC) FILTER (WHERE bucket='past'),   "
                 "'[]'::json) AS past_d,\n"
                 "    COUNT(*) FILTER (WHERE bucket='current') AS cur_c,\n"
                 '    COALESCE(json_agg(card ORDER BY updated_at DESC, id DESC) FILTER (WHERE '
                 "bucket='current'),'[]'::json) AS cur_d,\n"
                 "    COUNT(*) FILTER (WHERE bucket='future') AS fut_c,\n"
                 "    COALESCE(json_agg(card ORDER BY updated_at DESC, id DESC) FILTER (WHERE bucket='future'), "
                 "'[]'::json) AS fut_d\n"
                 '  FROM cards GROUP BY stage_id\n'
                 '),\n'
                 'agg_tag AS (\n'
                 '  SELECT stage_id, priority_id,\n'
                 '    COUNT(*) AS total,\n'
                 "    COALESCE(json_agg(card ORDER BY updated_at DESC, id DESC), '[]'::json) AS data,\n"
                 "    COUNT(*) FILTER (WHERE bucket='past') AS past_c,\n"
                 "    COALESCE(json_agg(card ORDER BY updated_at DESC, id DESC) FILTER (WHERE bucket='past'),   "
                 "'[]'::json) AS past_d,\n"
                 "    COUNT(*) FILTER (WHERE bucket='current') AS cur_c,\n"
                 '    COALESCE(json_agg(card ORDER BY updated_at DESC, id DESC) FILTER (WHERE '
                 "bucket='current'),'[]'::json) AS cur_d,\n"
                 "    COUNT(*) FILTER (WHERE bucket='future') AS fut_c,\n"
                 "    COALESCE(json_agg(card ORDER BY updated_at DESC, id DESC) FILTER (WHERE bucket='future'), "
                 "'[]'::json) AS fut_d\n"
                 '  FROM cards GROUP BY stage_id, priority_id\n'
                 '),\n'
                 'tag_j AS (\n'
                 '  SELECT pr.pipeline_stage_id AS stage_id, pr.id, pr.name,\n'
                 '    json_build_object(\n'
                 "      'id',          pr.id,\n"
                 "      'name',        COALESCE(pr.display_value, pr.name),\n"
                 "      'color',       COALESCE(NULLIF(pr.color, ''), '#3B82F6'),\n"
                 "      'total_count', COALESCE(a.total, 0),\n"
                 "      'data',        COALESCE(a.data, '[]'::json),\n"
                 "      'past',    json_build_object('count', COALESCE(a.past_c,0), 'data', "
                 "COALESCE(a.past_d,'[]'::json)),\n"
                 "      'current', json_build_object('count', COALESCE(a.cur_c, 0), 'data', COALESCE(a.cur_d, "
                 "'[]'::json)),\n"
                 "      'future',  json_build_object('count', COALESCE(a.fut_c, 0), 'data', COALESCE(a.fut_d, "
                 "'[]'::json))\n"
                 '    ) AS j\n'
                 '  FROM telecalling_priority pr\n'
                 '  JOIN stg ON stg.id = pr.pipeline_stage_id\n'
                 '  LEFT JOIN agg_tag a ON a.stage_id = pr.pipeline_stage_id AND a.priority_id = pr.id\n'
                 '  WHERE pr.is_active = TRUE\n'
                 '),\n'
                 'stage_j AS (\n'
                 '  SELECT s.id, s.name, s.order_no,\n'
                 '    json_build_object(\n'
                 "      'id',          s.id,\n"
                 "      'name',        COALESCE(s.display_value, s.name),\n"
                 "      'order_no',    s.order_no,\n"
                 "      'stage_type',  s.stage_type,\n"
                 "      'is_first',    (s.rn = 1 OR s.order_no = 1\n"
                 "                      OR LOWER(COALESCE(s.stage_type::text, '')) = 'initial'\n"
                 "                      OR LOWER(s.name) LIKE '%new%'),\n"
                 "      'total_count', COALESCE(a.total, 0),\n"
                 "      'data',        COALESCE(a.data, '[]'::json),\n"
                 "      'past',    json_build_object('count', COALESCE(a.past_c,0), 'data', "
                 "COALESCE(a.past_d,'[]'::json)),\n"
                 "      'current', json_build_object('count', COALESCE(a.cur_c, 0), 'data', COALESCE(a.cur_d, "
                 "'[]'::json)),\n"
                 "      'future',  json_build_object('count', COALESCE(a.fut_c, 0), 'data', COALESCE(a.fut_d, "
                 "'[]'::json)),\n"
                 "      'tags',    COALESCE((SELECT json_agg(t.j ORDER BY t.id) FROM tag_j t WHERE t.stage_id = s.id), "
                 "'[]'::json)\n"
                 '    ) AS j\n'
                 '  FROM stg s\n'
                 '  LEFT JOIN agg_stage a ON a.stage_id = s.id\n'
                 ')\n'
                 'SELECT COALESCE(\n'
                 '  (SELECT json_build_array(json_build_object(\n'
                 "      'pipeline_id',   pl.id,\n"
                 "      'pipeline_name', pl.name,\n"
                 "      'stages',        COALESCE((SELECT json_agg(sj.j ORDER BY sj.order_no, sj.id) FROM stage_j sj), "
                 "'[]'::json),\n"
                 "      'pipeline_data', (\n"
                 "          SELECT COALESCE(jsonb_object_agg(k.key, k.j ORDER BY k.ord)::json, '{}'::json)\n"
                 '          FROM (\n'
                 '            SELECT name AS key, j, 1 AS ord FROM tag_j\n'
                 '            UNION ALL\n'
                 '            SELECT name AS key, j, 2 AS ord FROM stage_j\n'
                 '          ) k\n'
                 '      )\n'
                 '  )) FROM pl),\n'
                 "  json_build_array(json_build_object('stages', '[]'::json, 'pipeline_data', '{}'::json))\n"
                 ') AS pipeline_data;'},
    {   'id': 57,
        'key': 'D_FETCH_ONE_LEAD_PAYMENT_HISTORY',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    aph.payment_date AS date,\n'
                 '    aph.paid_amount AS amount_paid,\n'
                 '    aph.pending_amount AS pending_amount,\n'
                 '    aph.due_date AS due_date,\n'
                 '    aps.name AS status,\n'
                 '    aph.notes AS description\n'
                 'FROM telecalling_payment_history aph\n'
                 'JOIN telecalling_payment_info api ON aph.payment_info_id = api.id\n'
                 'JOIN telecalling_lead al ON api.lead_id = al.id\n'
                 'Left join telecalling_payment_status aps on \n'
                 'aps.id=api.payment_status\n'
                 'WHERE al.id = @_id\n'
                 'ORDER BY aph.payment_date ASC;'},
    {   'id': 58,
        'key': 'D_FETCH_DISCONNECT_SELECT',
        'organization_id': None,
        'query': 'WITH lead_retry_status AS (\n'
                 '    SELECT \n'
                 '        COALESCE(COUNT(dd.id), 0) AS total_used,\n'
                 '        5 - COALESCE(COUNT(dd.id), 0) AS retries_left,\n'
                 '        CASE \n'
                 '            WHEN COALESCE(COUNT(dd.id), 0) < 5 THEN true\n'
                 '            ELSE false\n'
                 '        END AS can_retry\n'
                 '    FROM telecalling_disconnect_details dd\n'
                 '    JOIN telecalling_call_details acd ON acd.id = dd.call_id\n'
                 '    WHERE acd.lead_id =@_id\n'
                 ')\n'
                 'SELECT \n'
                 '    ds.id AS value,\n'
                 "    CONCAT(ds.name, ' (Retries left: ', lrs.retries_left, ')') AS label,\n"
                 '    lrs.retries_left,\n'
                 '    lrs.can_retry\n'
                 'FROM telecalling_disconnect_stage ds\n'
                 'CROSS JOIN lead_retry_status lrs\n'
                 'WHERE ds.is_active = true\n'
                 'ORDER BY ds.id;'},
    {   'id': 59,
        'key': 'D_FETCH_DAILY_REPORT_PDF',
        'organization_id': None,
        'query': 'WITH\n'
                 '-- 0. First stage of each pipeline category (no hardcoded names)\n'
                 'first_stages AS (\n'
                 '    SELECT ps.id\n'
                 '    FROM telecalling_pipeline_stage ps\n'
                 "    WHERE ps.stage_type = 'open'\n"
                 '      AND ps.order_no = (\n'
                 '          SELECT MIN(p2.order_no)\n'
                 '          FROM telecalling_pipeline_stage p2\n'
                 '          WHERE p2.pipeline_category_id = ps.pipeline_category_id\n'
                 "            AND p2.stage_type = 'open'\n"
                 '      )\n'
                 '),\n'
                 '\n'
                 '-- 1. Today Assigned Leads (IST Timezone)\n'
                 'user_leads_today AS (\n'
                 '    SELECT id, created_at, pipeline_stage_id\n'
                 '    FROM telecalling_lead\n'
                 '    WHERE assigned_to_id = @_id\n'
                 "      AND (created_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE "
                 "'Asia/Kolkata')::date\n"
                 '),\n'
                 '\n'
                 'user_leads_all AS (\n'
                 '    SELECT id, pipeline_stage_id\n'
                 '    FROM telecalling_lead\n'
                 '    WHERE assigned_to_id = @_id\n'
                 '),\n'
                 '\n'
                 '-- 2. Today Calls (one row per lead, flag based on stage position)\n'
                 'today_calls AS (\n'
                 '    SELECT DISTINCT ON (acd.lead_id)\n'
                 '        acd.lead_id,\n'
                 '        (ul.pipeline_stage_id IN (SELECT id FROM first_stages)) AS in_first_stage\n'
                 '    FROM telecalling_call_details acd\n'
                 '    INNER JOIN user_leads_all ul ON ul.id = acd.lead_id\n'
                 "    WHERE (COALESCE(acd.called_at, acd.created_at) AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME "
                 "ZONE 'Asia/Kolkata')::date\n"
                 '    ORDER BY acd.lead_id, acd.created_at DESC, acd.id DESC\n'
                 '),\n'
                 '\n'
                 '-- 3. Today Follow-ups Attended\n'
                 'today_followups AS (\n'
                 '    SELECT DISTINCT af.lead_id\n'
                 '    FROM telecalling_follow_up af\n'
                 '    INNER JOIN user_leads_all ul ON ul.id = af.lead_id\n'
                 '    WHERE af.is_attended = TRUE\n'
                 "      AND (af.attended_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME "
                 "ZONE 'Asia/Kolkata')::date\n"
                 '),\n'
                 '\n'
                 '-- 4. Today Pending Follow-ups (Only Scheduled for Today)\n'
                 'pending_followups_today AS (\n'
                 '    SELECT DISTINCT af.lead_id\n'
                 '    FROM telecalling_follow_up af\n'
                 '    INNER JOIN user_leads_all ul ON ul.id = af.lead_id\n'
                 '    WHERE af.is_attended = FALSE\n'
                 "      AND (af.scheduled_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME "
                 "ZONE 'Asia/Kolkata')::date\n"
                 '),\n'
                 '\n'
                 '-- 5. Today Payments Received\n'
                 'today_payments AS (\n'
                 '    SELECT DISTINCT ON (api.lead_id)\n'
                 '        api.lead_id,\n'
                 '        api.pending_amount\n'
                 '    FROM telecalling_payment_history aph\n'
                 '    INNER JOIN telecalling_payment_info api ON api.id = aph.payment_info_id\n'
                 '    INNER JOIN user_leads_all ul ON ul.id = api.lead_id\n'
                 "    WHERE (aph.created_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME "
                 "ZONE 'Asia/Kolkata')::date\n"
                 '    ORDER BY api.lead_id, aph.created_at DESC, aph.id DESC\n'
                 ')\n'
                 '\n'
                 '-- 6. Dashboard Today Only JSON Output\n'
                 'SELECT json_agg(\n'
                 '    json_build_object(\n'
                 "        'label', label,\n"
                 "        'value', value\n"
                 '    )\n'
                 ') AS dashboard_data\n'
                 'FROM (\n'
                 '\n'
                 "    SELECT 'Total Leads' AS label, (SELECT COUNT(*) FROM user_leads_today)::INTEGER AS value\n"
                 '\n'
                 '    UNION ALL\n'
                 '\n'
                 "    SELECT 'New Leads', (SELECT COUNT(*) FROM user_leads_today)::INTEGER\n"
                 '\n'
                 '    UNION ALL\n'
                 '\n'
                 "    SELECT 'Call Spoked', (SELECT COUNT(*) FROM today_calls WHERE in_first_stage = FALSE)::INTEGER\n"
                 '\n'
                 '    UNION ALL\n'
                 '\n'
                 "    SELECT 'Not Respond', (SELECT COUNT(*) FROM today_calls WHERE in_first_stage = TRUE)::INTEGER\n"
                 '\n'
                 '    UNION ALL\n'
                 '\n'
                 "    SELECT 'Follow Up', (SELECT COUNT(*) FROM today_followups)::INTEGER\n"
                 '\n'
                 '    UNION ALL\n'
                 '\n'
                 "    SELECT 'Pending Follow Up', (SELECT COUNT(*) FROM pending_followups_today)::INTEGER\n"
                 '\n'
                 '    UNION ALL\n'
                 '\n'
                 "    SELECT 'Partial Payment', (SELECT COUNT(*) FROM today_payments WHERE pending_amount > "
                 '0)::INTEGER\n'
                 '\n'
                 '    UNION ALL\n'
                 '\n'
                 "    SELECT 'Full Payment', (SELECT COUNT(*) FROM today_payments WHERE pending_amount = 0)::INTEGER\n"
                 '\n'
                 ') dashboard;'},
    {   'id': 61,
        'key': 'L_FETCH_COURSE_NAME_AND_COURSE_PLAN',
        'organization_id': None,
        'query': 'select  \n'
                 ' id as value,\n'
                 ' course_name as course_name_label,\n'
                 ' course_plan as course_plan_label,\n'
                 ' course_fees as fees\n'
                 'from telecalling_course group by course_name,course_fees,id,course_plan'},
    {   'id': 62,
        'key': 'D_FETCH_ONE_WON_LEAD_DATA',
        'organization_id': None,
        'query': '\n'
                 'SELECT \n'
                 '    l.id,\n'
                 '    pr.name AS priority,\n'
                 '    ps.name AS pipeline_stage,\n'
                 '    COALESCE(api.pending_amount, c.course_fees, 0) AS pending_amount,\n'
                 '    COALESCE(api.amount_paid, 0) AS paid_amount,\n'
                 '    aph.due_date,\n'
                 '    CASE\n'
                 "        WHEN aph.due_date::date = CURRENT_DATE THEN 'Today Due'\n"
                 "        WHEN aph.due_date::date < CURRENT_DATE THEN 'Over Due'\n"
                 "        ELSE 'Active Due'\n"
                 '    END AS payment_status,\n'
                 '    COUNT(DISTINCT f.id) AS follow_up_count,\n'
                 '    MAX(f.scheduled_at) AS last_follow_up\n'
                 'FROM telecalling_lead l\n'
                 'LEFT JOIN telecalling_course c ON c.id = l.course_id\n'
                 'LEFT JOIN telecalling_priority pr ON pr.id = l.priority_id\n'
                 'LEFT JOIN telecalling_pipeline_stage ps ON ps.id = l.pipeline_stage_id\n'
                 'LEFT JOIN telecalling_payment_info api ON api.lead_id = l.id\n'
                 'LEFT JOIN telecalling_payment_history aph ON aph.id = (\n'
                 '    SELECT aph2.id\n'
                 '    FROM telecalling_payment_history aph2\n'
                 '    WHERE aph2.payment_info_id = api.id\n'
                 '    ORDER BY aph2.id DESC\n'
                 '    LIMIT 1\n'
                 ')\n'
                 'LEFT JOIN telecalling_follow_up f ON f.lead_id = l.id\n'
                 'WHERE l.id = @_id\n'
                 'GROUP BY\n'
                 '    l.id,\n'
                 '    pr.name,\n'
                 '    ps.name,\n'
                 '    c.course_fees,\n'
                 '    api.pending_amount,\n'
                 '    api.amount_paid,\n'
                 '    aph.due_date;'},
    {   'id': 63,
        'key': 'D_FETCH_GET_USER_SETTINGS',
        'organization_id': None,
        'query': 'select \n'
                 ' follow_up_reminders,\n'
                 ' reminder_time,\n'
                 ' sound_alerts,\n'
                 ' notify_new_lead,\n'
                 ' notify_missed_followups,\n'
                 ' notify_reassigned_leads,\n'
                 ' auto_suggest_followup_date,\n'
                 ' auto_manual_followup_edit,\n'
                 ' mandatory_followup_before_close,\n'
                 ' mark_followup_completed,\n'
                 ' enable_click_to_call,\n'
                 ' make_call_notes_mandatory,\n'
                 ' default_call_outcome,\n'
                 ' make_notes_mandatory,\n'
                 ' enable_quick_note_templates,\n'
                 ' enable_message_templates,\n'
                 ' allow_custom_templates,\n'
                 ' auto_send_messages,\n'
                 ' default_lead_view,\n'
                 ' sort_leads_by,\n'
                 ' two_factor_auth_enabled\n'
                 'from telecalling_user_settings where user_id=@_id'},
    {   'id': 64,
        'key': 'D_FETCH_ENROLLMENT_BY_COURSE_TELE',
        'organization_id': None,
        'query': '\n'
                 'WITH all_courses AS (\n'
                 '    -- Get all distinct course names\n'
                 '    SELECT DISTINCT \n'
                 '        cn.id AS course_id,\n'
                 '        cn.course_name AS course_name\n'
                 '    FROM telecalling_course_name cn\n'
                 '    WHERE cn.course_name IS NOT NULL \n'
                 '),\n'
                 'won_counts AS (\n'
                 '    -- Get count of won leads per course\n'
                 '    SELECT \n'
                 '        al.course_name_id,\n'
                 '        COUNT(DISTINCT al.id) AS won_count\n'
                 '    FROM telecalling_lead al\n'
                 '    LEFT JOIN adm_user au ON au.id = al.assigned_to_id\n'
                 '    LEFT JOIN telecalling_pipeline_stage ps ON ps.id = al.pipeline_stage_id\n'
                 "WHERE au.id = '@_id'\n"
                 "  AND LOWER(ps.name) = 'won'\n"
                 '\n'
                 '  AND (\n'
                 "      '@_organization_id' = '0'\n"
                 "      OR al.organization_id = '@_organization_id'\n"
                 '  )\n'
                 '\n'
                 '  AND (\n'
                 "      '@_pipeline_id' = '0'\n"
                 "      OR ps.pipeline_category_id = '@_pipeline_id'\n"
                 '  )\n'
                 '\n'
                 '  AND (\n'
                 "      '@_from_date' IS NULL\n"
                 "      OR al.created_at::date >= '@_from_date'::date\n"
                 '  )\n'
                 '\n'
                 '  AND (\n'
                 "      '@_to_date' IS NULL\n"
                 "      OR al.created_at::date <= '@_to_date'::date\n"
                 '  )\n'
                 '\n'
                 '  AND al.course_name_id IS NOT NULL\n'
                 '    GROUP BY al.course_name_id\n'
                 '),\n'
                 'total_won AS (\n'
                 '    -- Get total won leads across all courses\n'
                 '    SELECT COUNT(DISTINCT al.id) AS total_count\n'
                 '    FROM telecalling_lead al\n'
                 '    LEFT JOIN adm_user au ON au.id = al.assigned_to_id\n'
                 '    LEFT JOIN telecalling_pipeline_stage ps ON ps.id = al.pipeline_stage_id\n'
                 'WHERE au.id = @_id\n'
                 "  AND LOWER(ps.name) = 'won'\n"
                 '\n'
                 '  AND (\n'
                 '      @_organization_id = 0\n'
                 '      OR al.organization_id = @_organization_id\n'
                 '  )\n'
                 '\n'
                 '  AND (\n'
                 '      @_pipeline_id = 0\n'
                 '      OR ps.pipeline_category_id = @_pipeline_id\n'
                 '  )\n'
                 '\n'
                 '  AND (\n'
                 "      '@_from_date' IS NULL\n"
                 "      OR al.created_at::date >= '@_from_date'::date\n"
                 '  )\n'
                 '\n'
                 '  AND (\n'
                 "      '@_to_date' IS NULL\n"
                 "      OR al.created_at::date <= '@_to_date'::date\n"
                 '  )\n'
                 '\n'
                 '  AND al.course_name_id IS NOT NULL\n'
                 ')\n'
                 '-- ==========================================\n'
                 '-- Final Output: All courses with won count (0 if none)\n'
                 '-- ==========================================\n'
                 'SELECT \n'
                 '    ac.course_name AS label,\n'
                 '    COALESCE(wc.won_count, 0)::text AS value,\n'
                 '    ROUND(\n'
                 '        CASE \n'
                 '            WHEN tw.total_count > 0 THEN (COALESCE(wc.won_count, 0) * 100.0 / tw.total_count)\n'
                 '            ELSE 0\n'
                 '        END, \n'
                 '        2\n'
                 '    )::text AS percentage\n'
                 'FROM all_courses ac\n'
                 'LEFT JOIN won_counts wc ON wc.course_name_id = ac.course_id\n'
                 'CROSS JOIN total_won tw\n'
                 'ORDER BY COALESCE(wc.won_count, 0) DESC ,ac.course_name\n'},
    {   'id': 65,
        'key': 'D_FETCH_PIPELINE_FUNNEL',
        'organization_id': None,
        'query': 'WITH stage_stats AS (\n'
                 '\n'
                 '    SELECT\n'
                 '        ps.id AS stage_id,\n'
                 '        ps.name AS stage_name,\n'
                 '        ps.pipeline_category_id AS pipeline_id,\n'
                 '\n'
                 '        COUNT(DISTINCT al.id) AS lead_count\n'
                 '\n'
                 '    FROM telecalling_pipeline_stage ps\n'
                 '\n'
                 '    LEFT JOIN telecalling_lead al\n'
                 '        ON al.pipeline_stage_id = ps.id\n'
                 '\n'
                 '        /* =========================\n'
                 '           TELECALLER FILTER\n'
                 '        ========================= */\n'
                 '        AND al.assigned_to_id = @_id\n'
                 '\n'
                 '        /* =========================\n'
                 '           ORGANIZATION FILTER\n'
                 '        ========================= */\n'
                 '        AND (\n'
                 '            @_organization_id = 0\n'
                 '            OR al.organization_id = @_organization_id\n'
                 '        )\n'
                 '\n'
                 '        /* =========================\n'
                 '           DATE FILTER\n'
                 '        ========================= */\n'
                 '        AND al.created_at BETWEEN\n'
                 "            '@_from_date 00:00:00'\n"
                 '            AND\n'
                 "            '@_to_date 23:59:59'\n"
                 '\n'
                 '    /* =========================\n'
                 '       SELECTED PIPELINE\n'
                 '       ALL STAGES MUST COME\n'
                 '       ========================= */\n'
                 '    WHERE\n'
                 '        ps.pipeline_category_id = @_pipeline_id\n'
                 '\n'
                 '    GROUP BY\n'
                 '        ps.id,\n'
                 '        ps.name,\n'
                 '        ps.pipeline_category_id\n'
                 '),\n'
                 '\n'
                 'total_stats AS (\n'
                 '    SELECT\n'
                 '        COALESCE(\n'
                 '            SUM(lead_count),\n'
                 '            0\n'
                 '        ) AS total_leads\n'
                 '\n'
                 '    FROM stage_stats\n'
                 ')\n'
                 '\n'
                 'SELECT\n'
                 '    s.stage_id,\n'
                 '    s.stage_name,\n'
                 '    s.pipeline_id,\n'
                 '\n'
                 '    s.lead_count AS value,\n'
                 '\n'
                 '    COALESCE(\n'
                 '        ROUND(\n'
                 '            s.lead_count * 100.0\n'
                 '            / NULLIF(t.total_leads, 0),\n'
                 '            1\n'
                 '        ),\n'
                 '        0\n'
                 '    ) AS percentage\n'
                 '\n'
                 'FROM stage_stats s\n'
                 '\n'
                 'CROSS JOIN total_stats t\n'
                 '\n'
                 'ORDER BY\n'
                 '    s.stage_id;'},
    {   'id': 66,
        'key': 'D_FETCH_ALL_LEADS_DATA',
        'organization_id': None,
        'query': 'WITH date_filtered_leads AS (\n'
                 '    SELECT DISTINCT al.id\n'
                 '    FROM telecalling_lead al\n'
                 '\n'
                 '    LEFT JOIN telecalling_pipeline_stage ps\n'
                 '        ON ps.id = al.pipeline_stage_id\n'
                 '\n'
                 '    LEFT JOIN telecalling_campaign_name cmp\n'
                 '        ON cmp.id = al.campaign_id\n'
                 '\n'
                 '    WHERE al.assigned_to_id = @_id\n'
                 '\n'
                 '        -- ORGANIZATION FILTER\n'
                 '        AND (\n'
                 '            @_organization_id = 0\n'
                 '            OR al.organization_id = @_organization_id\n'
                 '        )\n'
                 '\n'
                 '        -- PIPELINE FILTER\n'
                 '        AND (\n'
                 '            @_pipeline_id = 0\n'
                 '            OR ps.pipeline_category_id = @_pipeline_id\n'
                 '        )\n'
                 '\n'
                 '        AND (\n'
                 '            cmp.is_active IS NULL\n'
                 '            OR cmp.is_active = TRUE\n'
                 '        )\n'
                 '\n'
                 '        -- PIPELINE STAGE\n'
                 '        AND (\n'
                 '            COALESCE(\n'
                 "                CAST(NULLIF('@_pipeline_stage_id', '') AS INTEGER),\n"
                 '                0\n'
                 '            ) = 0\n'
                 '            OR al.pipeline_stage_id =\n'
                 "                CAST(NULLIF('@_pipeline_stage_id', '') AS INTEGER)\n"
                 '        )\n'
                 '\n'
                 '        -- LEAD SOURCE\n'
                 '        AND (\n'
                 '            COALESCE(\n'
                 "                CAST(NULLIF('@_lead_source_id', '') AS INTEGER),\n"
                 '                0\n'
                 '            ) = 0\n'
                 '            OR al.lead_source_id =\n'
                 "                CAST(NULLIF('@_lead_source_id', '') AS INTEGER)\n"
                 '        )\n'
                 '\n'
                 '        -- COURSE\n'
                 '        AND (\n'
                 '            COALESCE(\n'
                 "                CAST(NULLIF('@_course_name_id', '') AS INTEGER),\n"
                 '                0\n'
                 '            ) = 0\n'
                 '            OR al.course_name_id =\n'
                 "                CAST(NULLIF('@_course_name_id', '') AS INTEGER)\n"
                 '        )\n'
                 '\n'
                 '        -- PRIORITY\n'
                 '        AND (\n'
                 '            COALESCE(\n'
                 "                CAST(NULLIF('@_priority_id', '') AS INTEGER),\n"
                 '                0\n'
                 '            ) = 0\n'
                 '            OR al.priority_id =\n'
                 "                CAST(NULLIF('@_priority_id', '') AS INTEGER)\n"
                 '        )\n'
                 '\n'
                 '        -- COURSE PLAN\n'
                 '        AND (\n'
                 '            COALESCE(\n'
                 "                CAST(NULLIF('@_course_plan_id', '') AS INTEGER),\n"
                 '                0\n'
                 '            ) = 0\n'
                 '            OR al.course_plan_id =\n'
                 "                CAST(NULLIF('@_course_plan_id', '') AS INTEGER)\n"
                 '        )\n'
                 '\n'
                 '        -- CAMPAIGN\n'
                 '        AND (\n'
                 '            COALESCE(\n'
                 "                CAST(NULLIF('@_campaign_course_name_id', '') AS INTEGER),\n"
                 '                0\n'
                 '            ) = 0\n'
                 '            OR al.campaign_id =\n'
                 "                CAST(NULLIF('@_campaign_course_name_id', '') AS INTEGER)\n"
                 '        )\n'
                 '\n'
                 '        AND (\n'
                 '            -- ALL LEADS\n'
                 '            (\n'
                 '                (\n'
                 "                    '@_lead_filter_type' IS NULL\n"
                 "                    OR '@_lead_filter_type' = 'NULL'\n"
                 "                    OR '@_lead_filter_type' = ''\n"
                 "                    OR '@_lead_filter_type' = 'total_leads'\n"
                 "                    OR '@_lead_filter_type' = 'all'\n"
                 '                )\n'
                 '\n'
                 '                AND ps.id IS NOT NULL\n'
                 '\n'
                 '                AND (\n'
                 '                    CASE\n'
                 "                        WHEN NULLIF('@_from_date', '') IS NOT NULL\n"
                 "                             AND '@_from_date' <> '0'\n"
                 '                        THEN\n'
                 "                            (al.created_at AT TIME ZONE 'Asia/Kolkata')\n"
                 "                            >= ('@_from_date' || ' 00:00:00')::timestamp\n"
                 '                        ELSE TRUE\n'
                 '                    END\n'
                 '                )\n'
                 '\n'
                 '                AND (\n'
                 '                    CASE\n'
                 "                        WHEN NULLIF('@_to_date', '') IS NOT NULL\n"
                 "                             AND '@_to_date' <> '0'\n"
                 '                        THEN\n'
                 "                            (al.created_at AT TIME ZONE 'Asia/Kolkata')\n"
                 "                            <= ('@_to_date' || ' 23:59:59')::timestamp\n"
                 '                        ELSE TRUE\n'
                 '                    END\n'
                 '                )\n'
                 '            )\n'
                 '\n'
                 '            -- NEW LEAD\n'
                 '            OR (\n'
                 "                '@_lead_filter_type' IN ('new', 'new_lead')\n"
                 '\n'
                 '                AND (\n'
                 '                    ps.id = 1\n'
                 "                    OR LOWER(TRIM(ps.name)) = 'new lead'\n"
                 '                )\n'
                 '\n'
                 '                AND (\n'
                 '                    CASE\n'
                 "                        WHEN NULLIF('@_from_date', '') IS NOT NULL\n"
                 "                             AND '@_from_date' <> '0'\n"
                 '                        THEN\n'
                 "                            (al.created_at AT TIME ZONE 'Asia/Kolkata')\n"
                 "                            >= ('@_from_date' || ' 00:00:00')::timestamp\n"
                 '                        ELSE TRUE\n'
                 '                    END\n'
                 '                )\n'
                 '\n'
                 '                AND (\n'
                 '                    CASE\n'
                 "                        WHEN NULLIF('@_to_date', '') IS NOT NULL\n"
                 "                             AND '@_to_date' <> '0'\n"
                 '                        THEN\n'
                 "                            (al.created_at AT TIME ZONE 'Asia/Kolkata')\n"
                 "                            <= ('@_to_date' || ' 23:59:59')::timestamp\n"
                 '                        ELSE TRUE\n'
                 '                    END\n'
                 '                )\n'
                 '            )\n'
                 '\n'
                 '            -- FOLLOW UP\n'
                 '            OR (\n'
                 "                '@_lead_filter_type' = 'follow_up'\n"
                 '\n'
                 '                AND (\n'
                 '                    ps.id = 2\n'
                 "                    OR LOWER(TRIM(ps.name)) = 'follow up'\n"
                 '                )\n'
                 '\n'
                 '                AND (\n'
                 '                    CASE\n'
                 "                        WHEN NULLIF('@_from_date', '') IS NOT NULL\n"
                 "                             AND '@_from_date' <> '0'\n"
                 '                        THEN\n'
                 "                            (al.created_at AT TIME ZONE 'Asia/Kolkata')\n"
                 "                            >= ('@_from_date' || ' 00:00:00')::timestamp\n"
                 '                        ELSE TRUE\n'
                 '                    END\n'
                 '                )\n'
                 '\n'
                 '                AND (\n'
                 '                    CASE\n'
                 "                        WHEN NULLIF('@_to_date', '') IS NOT NULL\n"
                 "                             AND '@_to_date' <> '0'\n"
                 '                        THEN\n'
                 "                            (al.created_at AT TIME ZONE 'Asia/Kolkata')\n"
                 "                            <= ('@_to_date' || ' 23:59:59')::timestamp\n"
                 '                        ELSE TRUE\n'
                 '                    END\n'
                 '                )\n'
                 '            )\n'
                 '\n'
                 '            -- WON\n'
                 '            OR (\n'
                 "                '@_lead_filter_type' = 'won'\n"
                 '\n'
                 '                AND (\n'
                 '                    ps.id = 3\n'
                 "                    OR LOWER(TRIM(ps.name)) = 'won'\n"
                 '                )\n'
                 '\n'
                 '                AND (\n'
                 '                    CASE\n'
                 "                        WHEN NULLIF('@_from_date', '') IS NOT NULL\n"
                 "                             AND '@_from_date' <> '0'\n"
                 '                        THEN\n'
                 "                            (al.created_at AT TIME ZONE 'Asia/Kolkata')\n"
                 "                            >= ('@_from_date' || ' 00:00:00')::timestamp\n"
                 '                        ELSE TRUE\n'
                 '                    END\n'
                 '                )\n'
                 '\n'
                 '                AND (\n'
                 '                    CASE\n'
                 "                        WHEN NULLIF('@_to_date', '') IS NOT NULL\n"
                 "                             AND '@_to_date' <> '0'\n"
                 '                        THEN\n'
                 "                            (al.created_at AT TIME ZONE 'Asia/Kolkata')\n"
                 "                            <= ('@_to_date' || ' 23:59:59')::timestamp\n"
                 '                        ELSE TRUE\n'
                 '                    END\n'
                 '                )\n'
                 '            )\n'
                 '\n'
                 '            -- LOSS\n'
                 '            OR (\n'
                 "                '@_lead_filter_type' = 'loss'\n"
                 '\n'
                 '                AND (\n'
                 '                    ps.id = 4\n'
                 "                    OR LOWER(TRIM(ps.name)) = 'loss'\n"
                 '                )\n'
                 '\n'
                 '                AND (\n'
                 '                    CASE\n'
                 "                        WHEN NULLIF('@_from_date', '') IS NOT NULL\n"
                 "                             AND '@_from_date' <> '0'\n"
                 '                        THEN\n'
                 "                            (al.created_at AT TIME ZONE 'Asia/Kolkata')\n"
                 "                            >= ('@_from_date' || ' 00:00:00')::timestamp\n"
                 '                        ELSE TRUE\n'
                 '                    END\n'
                 '                )\n'
                 '\n'
                 '                AND (\n'
                 '                    CASE\n'
                 "                        WHEN NULLIF('@_to_date', '') IS NOT NULL\n"
                 "                             AND '@_to_date' <> '0'\n"
                 '                        THEN\n'
                 "                            (al.created_at AT TIME ZONE 'Asia/Kolkata')\n"
                 "                            <= ('@_to_date' || ' 23:59:59')::timestamp\n"
                 '                        ELSE TRUE\n'
                 '                    END\n'
                 '                )\n'
                 '            )\n'
                 '        )\n'
                 ')\n'
                 '\n'
                 'SELECT\n'
                 '    l.id,\n'
                 '\n'
                 '    l.full_name AS full_name,\n'
                 '    l.full_name AS name,\n'
                 '\n'
                 '    l.mobile_no AS mobile_no,\n'
                 '    l.mobile_no AS mobile,\n'
                 '\n'
                 '    l.email AS email,\n'
                 '\n'
                 '    c.course_name AS course_name,\n'
                 '    cp.course_plan AS course_plan,\n'
                 '\n'
                 '    COALESCE(ps.display_value, ps.name) AS stage,\n'
                 '    COALESCE(ps.display_value, ps.name) AS stage_name,\n'
                 '\n'
                 '    ls.name AS lead_source,\n'
                 '    ls.name AS source,\n'
                 '\n'
                 "    COALESCE(cmp.name, '') AS campaign,\n"
                 "    COALESCE(cmp.name, '') AS campaign_name,\n"
                 '\n'
                 '    pi.pending_amount AS pending_amount,\n'
                 '    pi.amount_paid AS amount_paid,\n'
                 '    pi.is_full_payment AS is_full_payment,\n'
                 '\n'
                 '    cr.course_fees AS total_amount,\n'
                 '\n'
                 '    COALESCE(pr.display_value, pr.name) AS priority,\n'
                 '    COALESCE(pr.display_value, pr.name) AS tag,\n'
                 '\n'
                 '    l.created_at AS enquiry_date,\n'
                 '    l.created_at,\n'
                 '\n'
                 '    l.updated_at AS called_at,\n'
                 '    l.updated_at\n'
                 '\n'
                 'FROM telecalling_lead l\n'
                 '\n'
                 'JOIN date_filtered_leads dfl\n'
                 '    ON dfl.id = l.id\n'
                 '\n'
                 'LEFT JOIN telecalling_course_name c\n'
                 '    ON c.id = l.course_name_id\n'
                 '\n'
                 'LEFT JOIN telecalling_course_plan cp\n'
                 '    ON cp.id = l.course_plan_id\n'
                 '\n'
                 'LEFT JOIN telecalling_pipeline_stage ps\n'
                 '    ON ps.id = l.pipeline_stage_id\n'
                 '\n'
                 'LEFT JOIN telecalling_lead_source ls\n'
                 '    ON ls.id = l.lead_source_id\n'
                 '\n'
                 'LEFT JOIN telecalling_priority pr\n'
                 '    ON pr.id = l.priority_id\n'
                 '\n'
                 'LEFT JOIN telecalling_campaign_name cmp\n'
                 '    ON cmp.id = l.campaign_id\n'
                 '\n'
                 'LEFT JOIN telecalling_payment_info pi\n'
                 '    ON pi.lead_id = l.id\n'
                 '\n'
                 'LEFT JOIN telecalling_course cr\n'
                 '    ON cr.id = l.course_id\n'
                 '\n'
                 'ORDER BY l.updated_at DESC;'},
    {   'id': 67,
        'key': 'D_FETCH_PAYMENT_TILES',
        'organization_id': None,
        'query': 'WITH latest_history AS (\n'
                 '    SELECT DISTINCT ON (payment_info_id)\n'
                 '        id,\n'
                 '        payment_info_id,\n'
                 '        due_date\n'
                 '    FROM telecalling_payment_history\n'
                 '    ORDER BY payment_info_id, created_at DESC\n'
                 ')\n'
                 '\n'
                 'SELECT\n'
                 '    COALESCE(SUM(api.pending_amount), 0) AS total_pending_amount,\n'
                 '\n'
                 '    COALESCE(SUM(\n'
                 '        CASE\n'
                 "            WHEN DATE(lh.due_date) = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date\n"
                 '            THEN api.pending_amount\n'
                 '            ELSE 0\n'
                 '        END\n'
                 '    ), 0) AS today_due_amount,\n'
                 '\n'
                 '    COALESCE(SUM(\n'
                 '        CASE\n'
                 "            WHEN DATE(lh.due_date) < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date\n"
                 '            THEN api.pending_amount\n'
                 '            ELSE 0\n'
                 '        END\n'
                 '    ), 0) AS overdue_amount,\n'
                 '\n'
                 '    COUNT(DISTINCT api.id) AS total_leads,\n'
                 '\n'
                 '    COUNT(DISTINCT CASE\n'
                 "        WHEN DATE(lh.due_date) = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date\n"
                 '        THEN api.id\n'
                 '    END) AS today_due_leads,\n'
                 '\n'
                 '    COUNT(DISTINCT CASE\n'
                 "        WHEN DATE(lh.due_date) < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date\n"
                 '        THEN api.id\n'
                 '    END) AS overdue_leads\n'
                 '\n'
                 'FROM telecalling_payment_info api\n'
                 'JOIN telecalling_lead al\n'
                 '    ON al.id = api.lead_id\n'
                 'JOIN adm_user au\n'
                 '    ON au.id = al.assigned_to_id\n'
                 'LEFT JOIN telecalling_pipeline_stage pst\n'
                 '    ON pst.id = al.pipeline_stage_id\n'
                 'JOIN latest_history lh\n'
                 '    ON lh.payment_info_id = api.id\n'
                 '\n'
                 'WHERE au.id = @_id\n'
                 'AND (@_pipeline_id = 0 OR pst.pipeline_category_id = @_pipeline_id)\n'
                 'AND api.pending_amount > 0;'},
    {   'id': 68,
        'key': 'D_FETCH_ALL_PENDING_PAYMENTS',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    ROW_NUMBER() OVER (ORDER BY al.created_at DESC) AS s_no,\n'
                 '    al.id,\n'
                 '    al.full_name,\n'
                 '    al.mobile_no,\n'
                 '    cp.course_plan AS course_plan,\n'
                 '    cn.course_name AS course_name,\n'
                 '    ct.course_time AS course_timing,\n'
                 '    ac.batch AS batch_name,\n'
                 '    al.created_at AS enquiry_date,\n'
                 '    COALESCE(aph.due_date, afu.scheduled_at, apf.followup_date) AS next_follow_up,\n'
                 '    COALESCE(api.amount_paid, 0) AS amount_paid,\n'
                 '    COALESCE(api.pending_amount, 0) AS pending_amount,\n'
                 '    -- FIX: computed live from due_date, not from the stored due_stage_id\n'
                 '    CASE\n'
                 "        WHEN aph.due_date IS NULL THEN 'active due'\n"
                 "        WHEN aph.due_date < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date THEN 'over due'\n"
                 "        WHEN aph.due_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date THEN 'today due'\n"
                 "        ELSE 'active due'\n"
                 '    END AS due_status,\n'
                 '    CASE \n'
                 "        WHEN api.payment_status = 1 THEN 'Paid'\n"
                 "        WHEN api.payment_status = 2 THEN 'Partial'\n"
                 "        WHEN api.payment_status = 3 THEN 'Unpaid'\n"
                 "        ELSE 'Unknown'\n"
                 '    END AS payment_status_text,\n'
                 '    aph.notes AS last_conversation,\n'
                 '    aph.due_date,\n'
                 '    aph.pending_amount AS history_pending_amount\n'
                 'FROM telecalling_lead al\n'
                 'LEFT JOIN telecalling_pipeline_stage pst ON pst.id = al.pipeline_stage_id\n'
                 'LEFT JOIN telecalling_course_plan cp ON cp.id = al.course_plan_id\n'
                 'LEFT JOIN telecalling_course_name cn ON cn.id = al.course_name_id\n'
                 'LEFT JOIN telecalling_course_time ct ON ct.id = al.course_timing_id\n'
                 'LEFT JOIN telecalling_course ac ON ac.id = al.course_id\n'
                 '-- Get latest payment info per lead\n'
                 'LEFT JOIN (\n'
                 '    SELECT DISTINCT ON (lead_id) *\n'
                 '    FROM telecalling_payment_info\n'
                 '    ORDER BY lead_id, created_at DESC\n'
                 ') api ON api.lead_id = al.id\n'
                 '-- Get latest payment history per payment\n'
                 'LEFT JOIN (\n'
                 '    SELECT DISTINCT ON (payment_info_id) *\n'
                 '    FROM telecalling_payment_history\n'
                 '    ORDER BY payment_info_id, created_at DESC\n'
                 ') aph ON aph.payment_info_id = api.id\n'
                 '-- Get latest followup per lead (FIX for duplicates)\n'
                 'LEFT JOIN (\n'
                 '    SELECT DISTINCT ON (lead_id) \n'
                 '        lead_id, \n'
                 '        scheduled_at\n'
                 '    FROM telecalling_follow_up  -- Replace with your actual followup table name\n'
                 '    ORDER BY lead_id, created_at DESC\n'
                 ') afu ON afu.lead_id = al.id\n'
                 '-- Get latest payment followup per payment\n'
                 'LEFT JOIN (\n'
                 '    SELECT DISTINCT ON (payment_info_id) \n'
                 '        payment_info_id,\n'
                 '        followup_date\n'
                 '    FROM telecalling_payment_followup  -- Replace with your actual table name\n'
                 '    ORDER BY payment_info_id, created_at DESC\n'
                 ') apf ON apf.payment_info_id = api.id\n'
                 'WHERE al.assigned_to_id = @_id\n'
                 'AND (@_pipeline_id = 0 OR pst.pipeline_category_id = @_pipeline_id)\n'
                 'AND COALESCE(api.pending_amount, 0) > 0\n'
                 "AND al.created_at >= '@_from_date 00:00:00'\n"
                 "AND al.created_at <= '@_to_date 23:59:59'\n"
                 '-- Course Filters\n'
                 'AND (COALESCE(CAST(@_course_name_id AS INTEGER), 0) = 0 \n'
                 '     OR al.course_name_id = CAST(@_course_name_id AS INTEGER))\n'
                 'AND (COALESCE(CAST(@_course_time_id AS INTEGER), 0) = 0 \n'
                 '     OR al.course_timing_id = CAST(@_course_time_id AS INTEGER))\n'
                 'AND (COALESCE(CAST(@_course_plan_id AS INTEGER), 0) = 0 \n'
                 '     OR al.course_plan_id = CAST(@_course_plan_id AS INTEGER))\n'
                 '-- Payment Stage Filter\n'
                 '-- FIX: filters against the LIVE-computed stage (from due_date vs\n'
                 "-- (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date) instead of the stale stored "
                 'aph.due_stage_id column.\n'
                 '-- ids match telecalling_payment_stage: 1=active, 2=overdue, 3=todaydue\n'
                 'AND (COALESCE(CAST(@_payment_stage AS INTEGER), 0) = 0 \n'
                 '     OR CAST(@_payment_stage AS INTEGER) = CASE\n'
                 '            WHEN aph.due_date IS NULL THEN 1\n'
                 "            WHEN aph.due_date < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date THEN 2\n"
                 "            WHEN aph.due_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date THEN 3\n"
                 '            ELSE 1\n'
                 '        END)\n'
                 '-- Amount Stage Filter\n'
                 '-- CONFIRMED via telecalling_amount_stage table: 1=above_5k, 2=below_5k, 3=below_2k\n'
                 '-- (this matches the ORIGINAL query -- my earlier "fix" swapping 2/3 based\n'
                 '-- on UI dropdown order alone was WRONG and has been reverted here)\n'
                 'AND (COALESCE(CAST(@_amount_stage_id AS INTEGER), 0) = 0 OR\n'
                 '     CASE\n'
                 '         WHEN CAST(@_amount_stage_id AS INTEGER) = 1\n'
                 '             THEN COALESCE(api.pending_amount, 0) > 5000\n'
                 '         WHEN CAST(@_amount_stage_id AS INTEGER) = 2\n'
                 '             THEN COALESCE(api.pending_amount, 0) <= 5000 \n'
                 '                 AND COALESCE(api.pending_amount, 0) > 0\n'
                 '         WHEN CAST(@_amount_stage_id AS INTEGER) = 3\n'
                 '             THEN COALESCE(api.pending_amount, 0) <= 2000 \n'
                 '                 AND COALESCE(api.pending_amount, 0) > 0\n'
                 '         ELSE FALSE  -- unknown id: exclude rather than silently show-all\n'
                 '     END)\n'
                 'ORDER BY al.created_at DESC;'},
    {   'id': 69,
        'key': 'D_FETCH_ALL_LEAD_LABEL_COUNT',
        'organization_id': None,
        'query': 'WITH filtered_leads AS (\n'
                 '    SELECT DISTINCT\n'
                 '        al.id,\n'
                 '        al.pipeline_stage_id\n'
                 '    FROM telecalling_lead al\n'
                 '\n'
                 '    INNER JOIN telecalling_pipeline_stage ps\n'
                 '        ON ps.id = al.pipeline_stage_id\n'
                 '\n'
                 '    LEFT JOIN telecalling_campaign_name cmp\n'
                 '        ON cmp.id = al.campaign_id\n'
                 '\n'
                 '    WHERE\n'
                 '        -- ORGANIZATION\n'
                 '        (\n'
                 '            @_organization_id = 0\n'
                 '            OR al.organization_id = @_organization_id\n'
                 '        )\n'
                 '\n'
                 '        -- TELECALLER\n'
                 '        AND al.assigned_to_id = @_id\n'
                 '\n'
                 '        -- PIPELINE\n'
                 '        AND (\n'
                 '            @_pipeline_id = 0\n'
                 '            OR ps.pipeline_category_id = @_pipeline_id\n'
                 '        )\n'
                 '\n'
                 '        -- ACTIVE CAMPAIGN\n'
                 '        AND (\n'
                 '            cmp.is_active IS NULL\n'
                 '            OR cmp.is_active = TRUE\n'
                 '        )\n'
                 '\n'
                 '        -- PIPELINE STAGE\n'
                 '        AND (\n'
                 '            COALESCE(\n'
                 "                CAST(NULLIF('@_pipeline_stage_id', '') AS INTEGER),\n"
                 '                0\n'
                 '            ) = 0\n'
                 '\n'
                 '            OR al.pipeline_stage_id =\n'
                 "                CAST(NULLIF('@_pipeline_stage_id', '') AS INTEGER)\n"
                 '        )\n'
                 '\n'
                 '        -- LEAD SOURCE\n'
                 '        AND (\n'
                 '            COALESCE(\n'
                 "                CAST(NULLIF('@_lead_source_id', '') AS INTEGER),\n"
                 '                0\n'
                 '            ) = 0\n'
                 '\n'
                 '            OR al.lead_source_id =\n'
                 "                CAST(NULLIF('@_lead_source_id', '') AS INTEGER)\n"
                 '        )\n'
                 '\n'
                 '        -- COURSE\n'
                 '        AND (\n'
                 '            COALESCE(\n'
                 "                CAST(NULLIF('@_course_name_id', '') AS INTEGER),\n"
                 '                0\n'
                 '            ) = 0\n'
                 '\n'
                 '            OR al.course_name_id =\n'
                 "                CAST(NULLIF('@_course_name_id', '') AS INTEGER)\n"
                 '        )\n'
                 '\n'
                 '        -- PRIORITY\n'
                 '        AND (\n'
                 '            COALESCE(\n'
                 "                CAST(NULLIF('@_priority_id', '') AS INTEGER),\n"
                 '                0\n'
                 '            ) = 0\n'
                 '\n'
                 '            OR al.priority_id =\n'
                 "                CAST(NULLIF('@_priority_id', '') AS INTEGER)\n"
                 '        )\n'
                 '\n'
                 '        -- COURSE PLAN\n'
                 '        AND (\n'
                 '            COALESCE(\n'
                 "                CAST(NULLIF('@_course_plan_id', '') AS INTEGER),\n"
                 '                0\n'
                 '            ) = 0\n'
                 '\n'
                 '            OR al.course_plan_id =\n'
                 "                CAST(NULLIF('@_course_plan_id', '') AS INTEGER)\n"
                 '        )\n'
                 '\n'
                 '        -- CAMPAIGN\n'
                 '        AND (\n'
                 '            COALESCE(\n'
                 "                CAST(NULLIF('@_campaign_course_name_id', '') AS INTEGER),\n"
                 '                0\n'
                 '            ) = 0\n'
                 '\n'
                 '            OR al.campaign_id =\n'
                 "                CAST(NULLIF('@_campaign_course_name_id', '') AS INTEGER)\n"
                 '        )\n'
                 '\n'
                 '        -- FROM DATE\n'
                 '        AND (\n'
                 "            NULLIF('@_from_date', '') IS NULL\n"
                 "            OR '@_from_date' = '0'\n"
                 '\n'
                 '            OR (\n'
                 "                al.created_at AT TIME ZONE 'Asia/Kolkata'\n"
                 '            ) >= (\n'
                 "                '@_from_date' || ' 00:00:00'\n"
                 '            )::timestamp\n'
                 '        )\n'
                 '\n'
                 '        -- TO DATE\n'
                 '        AND (\n'
                 "            NULLIF('@_to_date', '') IS NULL\n"
                 "            OR '@_to_date' = '0'\n"
                 '\n'
                 '            OR (\n'
                 "                al.created_at AT TIME ZONE 'Asia/Kolkata'\n"
                 '            ) <= (\n'
                 "                '@_to_date' || ' 23:59:59'\n"
                 '            )::timestamp\n'
                 '        )\n'
                 '),\n'
                 '\n'
                 'stage_counts AS (\n'
                 '    SELECT\n'
                 '        ps.id AS pipeline_stage_id,\n'
                 '\n'
                 '        ps.pipeline_category_id AS pipeline_id,\n'
                 '\n'
                 '        COALESCE(\n'
                 '            ps.display_value,\n'
                 '            ps.name\n'
                 '        ) AS label,\n'
                 '\n'
                 '        COUNT(DISTINCT fl.id) AS count\n'
                 '\n'
                 '    FROM telecalling_pipeline_stage ps\n'
                 '\n'
                 '    LEFT JOIN filtered_leads fl\n'
                 '        ON fl.pipeline_stage_id = ps.id\n'
                 '\n'
                 '    WHERE\n'
                 '        -- ONLY SELECTED PIPELINE\n'
                 '        (\n'
                 '            @_pipeline_id = 0\n'
                 '            OR ps.pipeline_category_id = @_pipeline_id\n'
                 '        )\n'
                 '\n'
                 '    GROUP BY\n'
                 '        ps.id,\n'
                 '        ps.pipeline_category_id,\n'
                 '        ps.display_value,\n'
                 '        ps.name\n'
                 ')\n'
                 '\n'
                 'SELECT\n'
                 "    'Total Leads' AS total_label,\n"
                 '\n'
                 '    (\n'
                 '        SELECT COUNT(DISTINCT id)\n'
                 '        FROM filtered_leads\n'
                 '    ) AS total_count,\n'
                 '\n'
                 '    COALESCE(\n'
                 '        JSON_AGG(\n'
                 '            JSON_BUILD_OBJECT(\n'
                 "                'pipeline_stage_id',\n"
                 '                pipeline_stage_id,\n'
                 '\n'
                 "                'pipeline_id',\n"
                 '                pipeline_id,\n'
                 '\n'
                 "                'label',\n"
                 '                label,\n'
                 '\n'
                 "                'count',\n"
                 '                count\n'
                 '            )\n'
                 '            ORDER BY pipeline_stage_id\n'
                 '        )\n'
                 '        FILTER (\n'
                 '            WHERE pipeline_stage_id IS NOT NULL\n'
                 '        ),\n'
                 "        '[]'::json\n"
                 '    ) AS stage_wise_count\n'
                 '\n'
                 'FROM stage_counts;'},
    {   'id': 70,
        'key': 'L_FETCH_FILTER_PIPELINE_TYPE',
        'organization_id': None,
        'query': 'SELECT id as value,name as label\n'
                 'FROM telecalling_filter_pipeline\n'
                 'WHERE is_active = TRUE\n'
                 '  -- AND (\n'
                 '  --       @_organization_id = 0\n'
                 '  --       OR organization_id = @_organization_id\n'
                 '  --     );\n'},
    {   'id': 71,
        'key': 'L_FETCH_FILTER_LEAD',
        'organization_id': None,
        'query': 'SELECT id as value,name as label\n'
                 'FROM telecalling_filter_leads\n'
                 'WHERE is_active = TRUE\n'
                 '  -- AND (\n'
                 '  --       @_organization_id = 0\n'
                 '  --       OR organization_id = @_organization_id)'},
    {   'id': 72,
        'key': 'L_FETCH_FILTER_PAYMENT',
        'organization_id': None,
        'query': 'SELECT id as value,name as label\n'
                 'FROM telecalling_filter_payment\n'
                 'WHERE is_active = TRUE\n'
                 '  -- AND (\n'
                 '  --       @_organization_id = 0\n'
                 '  --       OR organization_id = @_organization_id)'},
    {   'id': 73,
        'key': 'D_COURSE_STATS',
        'organization_id': None,
        'query': 'SELECT COUNT(DISTINCT c.course_plan_id)::INTEGER AS plans, COUNT(CASE WHEN c.batch IS NOT NULL OR '
                 'c.course_time_id IS NOT NULL THEN c.id END)::INTEGER AS batches, COALESCE(SUM(c.admission_count), '
                 '0)::INTEGER AS enrolled, GREATEST(0, (COALESCE(SUM(c.total_seats), 0) - '
                 'COALESCE(SUM(c.admission_count), 0)))::INTEGER AS seats_left FROM telecalling_course c WHERE '
                 'c.course_name_id = @_course_id;'},
    {   'id': 74,
        'key': 'L_COURSE_PLANS_BY_COURSE',
        'organization_id': None,
        'query': "SELECT cp.id, INITCAP(cp.course_plan) AS name, CONCAT('₹', TO_CHAR(COALESCE(NULLIF(cp.fee_amount, "
                 "0), MIN(c.course_fees), 0)::INTEGER, 'FM99,99,999')) AS price, cp.duration AS duration, "
                 'cp.hours_per_day AS hours_per_day FROM telecalling_course_plan cp LEFT JOIN telecalling_course c ON '
                 'c.course_plan_id = cp.id WHERE (cp.course_name_id = @_course_id OR c.course_name_id = @_course_id) '
                 'GROUP BY cp.id, cp.course_plan, cp.fee_amount, cp.duration, cp.hours_per_day;'},
    {   'id': 75,
        'key': 'D_COURSE_BATCHES_BY_COURSE',
        'organization_id': None,
        'query': 'SELECT c.id, COALESCE(c.batch, ct.course_time) AS name, c.course_plan_id AS plan, cp.course_plan AS '
                 'plan_name, c.days AS days, ct.course_time AS time, c.trainer AS trainer, COALESCE(c.admission_count, '
                 '0) AS filled_seats, COALESCE(c.total_seats, 0) AS total_seats, TO_CHAR(c.starting_date, '
                 "'YYYY-MM-DD') AS start_date, TO_CHAR(c.closing_date, 'YYYY-MM-DD') AS closing_date, CASE WHEN "
                 "c.total_seats > 0 AND c.admission_count >= (c.total_seats - 2) THEN 'almost full' ELSE NULL END AS "
                 'note FROM telecalling_course c LEFT JOIN telecalling_course_plan cp ON cp.id = c.course_plan_id LEFT '
                 'JOIN telecalling_course_time ct ON ct.id = c.course_time_id WHERE c.course_name_id = @_course_id AND '
                 '(c.batch IS NOT NULL OR c.course_time_id IS NOT NULL) ORDER BY c.id ASC;'},
    {   'id': 76,
        'key': 'L_FETCH_PREFERRED_TIMINGS',
        'organization_id': None,
        'query': 'select id as value,name as label from telecalling_preferred_time '},
    {   'id': 77,
        'key': 'L_LOSS_REASON',
        'organization_id': None,
        'query': 'select id as value,name as label from telecalling_loss_reason \n'},
    {   'id': 78,
        'key': 'D_FETCH_ALL_REPORTS_CATALOG',
        'organization_id': None,
        'query': "SELECT id, report_name AS name, COALESCE(description, '') AS description, category, "
                 'LOWER(COALESCE(report_key, \'\')) AS "reportKey"\n'
                 'FROM adm_report_catalog\n'
                 'WHERE is_active = TRUE\n'
                 "  AND ('@_search' = '' OR report_name ILIKE '%' || '@_search' || '%' OR description ILIKE '%' || "
                 "'@_search' || '%' OR category ILIKE '%' || '@_search' || '%')\n"
                 'ORDER BY id ASC;'},
    {   'id': 79,
        'key': 'R_USER_REPORT',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    TO_CHAR(cd.called_at::date, \'YYYY-MM-DD\') AS "date",\n'
                 '    u.id AS "id",\n'
                 '    COALESCE(NULLIF(TRIM(u.first_name), \'\'), u.username) AS "userName",\n'
                 '    COALESCE(u.mobile, \'-\') AS "mobile",\n'
                 '    COUNT(cd.id)::integer AS "totalCalls",\n'
                 "    COUNT(CASE WHEN cd.connection_status ILIKE 'Connected' THEN 1 END)::integer AS "
                 '"connectedCalls",\n'
                 "    COUNT(CASE WHEN cd.connection_status NOT ILIKE 'Connected' THEN 1 END)::integer AS "
                 '"unconnectedCalls",\n'
                 "    COALESCE(AVG(CASE WHEN cd.connection_status ILIKE 'Connected' THEN cd.duration_seconds END), "
                 '0)::integer AS "avg_seconds",\n'
                 '    COUNT(*) OVER()::integer AS "full_count"\n'
                 'FROM telecalling_call_details cd\n'
                 'JOIN adm_user u ON cd.telecaller_id = u.id\n'
                 'WHERE 1=1\n'
                 "  AND ('@_date_filter' = 'All' OR \n"
                 "      ('@_date_filter' = 'Today' AND cd.called_at::date = CURRENT_DATE) OR\n"
                 "      ('@_date_filter' = 'Yesterday' AND cd.called_at::date = CURRENT_DATE - INTERVAL '1 day') OR\n"
                 "      ('@_date_filter' = 'Last 7 Days' AND cd.called_at::date >= CURRENT_DATE - INTERVAL '7 days') "
                 'OR\n'
                 "      ('@_date_filter' = 'Last 30 Days' AND cd.called_at::date >= CURRENT_DATE - INTERVAL '30 days') "
                 'OR\n'
                 "      ('@_date_filter' = 'This Month' AND DATE_TRUNC('month', cd.called_at) = DATE_TRUNC('month', "
                 'CURRENT_DATE)) OR\n'
                 "      ('@_date_filter' = 'Custom Date' AND cd.called_at::date >= NULLIF('@_start_date', '')::date "
                 "AND cd.called_at::date <= NULLIF('@_end_date', '')::date) OR\n"
                 "      ('@_from_date' <> '' AND cd.called_at::date >= NULLIF('@_from_date', '')::date) OR\n"
                 "      ('@_to_date' <> '' AND cd.called_at::date <= NULLIF('@_to_date', '')::date)\n"
                 '  )\n'
                 "  AND ('@_user_id' = 'All' OR '@_user_id' = '' OR u.id = NULLIF('@_user_id', '')::bigint)\n"
                 "  AND ('@_search' = '' OR u.username ILIKE '%' || '@_search' || '%' OR u.first_name ILIKE '%' || "
                 "'@_search' || '%' OR u.mobile ILIKE '%' || '@_search' || '%')\n"
                 'GROUP BY cd.called_at::date, u.id, u.first_name, u.username, u.mobile\n'
                 'ORDER BY cd.called_at::date DESC, COUNT(cd.id) DESC, u.id ASC\n'
                 'LIMIT @_limit OFFSET (@_page - 1) * @_limit;'},
    {   'id': 81,
        'key': 'R_LEAD_DISPOSITION_REPORT',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    ROW_NUMBER() OVER(ORDER BY COUNT(cd.id) DESC, u.first_name ASC)::integer AS "id",\n'
                 '    TRIM(CONCAT(u.first_name, \' \', COALESCE(u.last_name, \'\'))) AS "user_name",\n'
                 '    COALESCE(\n'
                 "        NULLIF(TRIM(CONCAT(rm.first_name, ' ', COALESCE(rm.last_name, ''))), ''),\n"
                 '        rm.username,\n'
                 "        NULLIF(TRIM(CONCAT(tl.first_name, ' ', COALESCE(tl.last_name, ''))), ''),\n"
                 '        tl.username,\n'
                 "        '-'\n"
                 '    ) AS "reporting_manager",\n'
                 '    COALESCE(u.mobile, \'-\') AS "mobile_number",\n'
                 "    COALESCE(TO_CHAR(cd.called_at::date, 'DD Mon YYYY'), TO_CHAR(CURRENT_DATE, 'DD Mon YYYY')) AS "
                 '"date",\n'
                 '    COUNT(cd.id)::integer AS "total_disposed_count",\n'
                 "    COUNT(CASE WHEN LOWER(cd.connection_status) = 'connected' THEN 1 END)::integer AS "
                 '"disposed_yes_connected_count",\n'
                 "    COUNT(CASE WHEN LOWER(cd.connection_status) != 'connected' THEN 1 END)::integer AS "
                 '"disposed_not_connected_count",\n'
                 "    COUNT(CASE WHEN ps.stage_type = 'open' AND (ps.name ILIKE '%follow%' OR ps.order_no > 1) THEN 1 "
                 'END)::integer AS "total_followup_leads",\n'
                 "    COUNT(CASE WHEN ps.stage_type IN ('closed_won', 'terminal_joined') OR ps.name ILIKE '%won%' OR "
                 'ps.name ILIKE \'%converted%\' THEN 1 END)::integer AS "total_converted_leads",\n'
                 "    COUNT(CASE WHEN ps.stage_type IN ('closed_lost', 'terminal_closed') OR ps.name ILIKE '%loss%' OR "
                 'ps.name ILIKE \'%lost%\' THEN 1 END)::integer AS "total_lost_leads",\n'
                 '    COUNT(*) OVER()::integer AS "full_count"\n'
                 'FROM adm_user u\n'
                 'LEFT JOIN adm_team t ON u.team_id = t.id\n'
                 'LEFT JOIN adm_user tl ON t.leader_id = tl.id\n'
                 'LEFT JOIN adm_user rm ON u.reporting_to_id = rm.id\n'
                 'LEFT JOIN telecalling_call_details cd ON cd.telecaller_id = u.id\n'
                 "    AND ('@_date_filter' = 'All' OR \n"
                 "        ('@_date_filter' = 'Today' AND cd.called_at::date = CURRENT_DATE) OR\n"
                 "        ('@_date_filter' = 'Yesterday' AND cd.called_at::date = CURRENT_DATE - INTERVAL '1 day') OR\n"
                 "        ('@_date_filter' = 'Last 7 Days' AND cd.called_at::date >= CURRENT_DATE - INTERVAL '7 days') "
                 'OR\n'
                 "        ('@_date_filter' = 'Last 30 Days' AND cd.called_at::date >= CURRENT_DATE - INTERVAL '30 "
                 "days') OR\n"
                 "        ('@_date_filter' = 'This Month' AND DATE_TRUNC('month', cd.called_at) = DATE_TRUNC('month', "
                 'CURRENT_DATE)) OR\n'
                 "        ('@_date_filter' = 'Custom Date' AND cd.called_at::date >= NULLIF('@_start_date', '')::date "
                 "AND cd.called_at::date <= NULLIF('@_end_date', '')::date) OR\n"
                 "        ('@_from_date' <> '' AND cd.called_at::date >= NULLIF('@_from_date', '')::date) OR\n"
                 "        ('@_to_date' <> '' AND cd.called_at::date <= NULLIF('@_to_date', '')::date)\n"
                 '    )\n'
                 'LEFT JOIN telecalling_pipeline_stage ps ON cd.stage_id = ps.id\n'
                 'WHERE u.is_active = TRUE\n'
                 "  AND ('@_user_id' = 'All' OR '@_user_id' = '' OR u.id = NULLIF('@_user_id', '')::bigint)\n"
                 "  AND ('@_reporting_manager' = 'All' OR '@_reporting_manager' = '' OR \n"
                 "       rm.id = NULLIF('@_reporting_manager', '')::bigint OR \n"
                 "       tl.id = NULLIF('@_reporting_manager', '')::bigint OR\n"
                 "       rm.username ILIKE '@_reporting_manager' OR\n"
                 "       tl.username ILIKE '@_reporting_manager' OR\n"
                 "       CONCAT(rm.first_name, ' ', COALESCE(rm.last_name, '')) ILIKE '%' || '@_reporting_manager' || "
                 "'%' OR\n"
                 "       CONCAT(tl.first_name, ' ', COALESCE(tl.last_name, '')) ILIKE '%' || '@_reporting_manager' || "
                 "'%')\n"
                 "  AND ('@_search' = '' OR u.username ILIKE '%' || '@_search' || '%' OR u.first_name ILIKE '%' || "
                 "'@_search' || '%' OR u.mobile ILIKE '%' || '@_search' || '%')\n"
                 'GROUP BY u.id, u.first_name, u.last_name, u.username, u.mobile, rm.id, rm.first_name, rm.last_name, '
                 'rm.username, tl.id, tl.first_name, tl.last_name, tl.username, cd.called_at::date\n'
                 'ORDER BY cd.called_at::date DESC NULLS LAST, COUNT(cd.id) DESC, u.first_name ASC\n'
                 'LIMIT @_limit OFFSET (@_page - 1) * @_limit;'},
    {   'id': 83,
        'key': 'R_USER_STAGE_REPORT',
        'organization_id': None,
        'query': 'WITH user_stage_counts AS (\n'
                 '    SELECT \n'
                 '        l.assigned_to_id AS user_id,\n'
                 '        ps.id AS stage_id,\n'
                 "        LOWER(REGEXP_REPLACE(REPLACE(ps.name, ' ', '_'), '[^a-zA-Z0-9_]', '', 'g')) AS stage_key,\n"
                 '        COUNT(l.id) AS cnt\n'
                 '    FROM telecalling_lead l\n'
                 '    JOIN telecalling_pipeline_stage ps ON l.pipeline_stage_id = ps.id\n'
                 "    WHERE ('@_pipeline_id' = 'All' OR '@_pipeline_id' = '' OR ps.pipeline_category_id = "
                 "NULLIF('@_pipeline_id', '')::bigint)\n"
                 "      AND ('@_date_filter' = 'All' OR \n"
                 "          ('@_date_filter' = 'Today' AND l.created_at::date = CURRENT_DATE) OR\n"
                 "          ('@_date_filter' = 'Yesterday' AND l.created_at::date = CURRENT_DATE - INTERVAL '1 day') "
                 'OR\n'
                 "          ('@_date_filter' = 'Last 7 Days' AND l.created_at::date >= CURRENT_DATE - INTERVAL '7 "
                 "days') OR\n"
                 "          ('@_date_filter' = 'Last 30 Days' AND l.created_at::date >= CURRENT_DATE - INTERVAL '30 "
                 "days') OR\n"
                 "          ('@_date_filter' = 'This Month' AND DATE_TRUNC('month', l.created_at) = "
                 "DATE_TRUNC('month', CURRENT_DATE)) OR\n"
                 "          ('@_date_filter' = 'Custom Date' AND l.created_at::date >= NULLIF('@_start_date', "
                 "'')::date AND l.created_at::date <= NULLIF('@_end_date', '')::date) OR\n"
                 "          ('@_from_date' <> '' AND l.created_at::date >= NULLIF('@_from_date', '')::date) OR\n"
                 "          ('@_to_date' <> '' AND l.created_at::date <= NULLIF('@_to_date', '')::date)\n"
                 '      )\n'
                 '    GROUP BY l.assigned_to_id, ps.id, ps.name\n'
                 ')\n'
                 'SELECT \n'
                 '    u.id AS "id",\n'
                 '    ROW_NUMBER() OVER(ORDER BY COALESCE(lead_totals.total, 0) DESC, u.first_name ASC)::integer AS '
                 '"s_no",\n'
                 '    TRIM(CONCAT(u.first_name, \' \', COALESCE(u.last_name, \'\'))) AS "user_name",\n'
                 '    COALESCE(\n'
                 "        NULLIF(TRIM(CONCAT(rm.first_name, ' ', COALESCE(rm.last_name, ''))), ''),\n"
                 '        rm.username,\n'
                 "        NULLIF(TRIM(CONCAT(tl.first_name, ' ', COALESCE(tl.last_name, ''))), ''),\n"
                 '        tl.username,\n'
                 "        '-'\n"
                 '    ) AS "reporting_manager",\n'
                 '    COALESCE(u.mobile, \'-\') AS "mobile_number",\n'
                 '    COALESCE(lead_totals.total, 0)::integer AS "total_assigned_leads",\n'
                 '    CASE \n'
                 '        WHEN COALESCE(lead_totals.total, 0) > 0 THEN \n'
                 '            CONCAT(ROUND((COALESCE(lead_totals.won, 0)::numeric / lead_totals.total::numeric) * 100, '
                 "2)::text, '%')\n"
                 "        ELSE '0.00%'\n"
                 '    END AS "conversion_percentage",\n'
                 '    COALESCE(\n'
                 '        (SELECT jsonb_object_agg(usc.stage_key, usc.cnt) FROM user_stage_counts usc WHERE '
                 'usc.user_id = u.id),\n'
                 "        '{}'::jsonb\n"
                 '    ) AS "stage_counts",\n'
                 '    COUNT(*) OVER()::integer AS "full_count"\n'
                 'FROM adm_user u\n'
                 'LEFT JOIN adm_team t ON u.team_id = t.id\n'
                 'LEFT JOIN adm_user tl ON t.leader_id = tl.id\n'
                 'LEFT JOIN adm_user rm ON u.reporting_to_id = rm.id\n'
                 'LEFT JOIN (\n'
                 '    SELECT \n'
                 '        l.assigned_to_id,\n'
                 '        COUNT(l.id) AS total,\n'
                 "        COUNT(CASE WHEN ps.stage_type IN ('closed_won', 'terminal_joined') OR ps.name ILIKE '%won%' "
                 'THEN 1 END) AS won\n'
                 '    FROM telecalling_lead l\n'
                 '    JOIN telecalling_pipeline_stage ps ON l.pipeline_stage_id = ps.id\n'
                 "    WHERE ('@_pipeline_id' = 'All' OR '@_pipeline_id' = '' OR ps.pipeline_category_id = "
                 "NULLIF('@_pipeline_id', '')::bigint)\n"
                 "      AND ('@_date_filter' = 'All' OR \n"
                 "          ('@_date_filter' = 'Today' AND l.created_at::date = CURRENT_DATE) OR\n"
                 "          ('@_date_filter' = 'Yesterday' AND l.created_at::date = CURRENT_DATE - INTERVAL '1 day') "
                 'OR\n'
                 "          ('@_date_filter' = 'Last 7 Days' AND l.created_at::date >= CURRENT_DATE - INTERVAL '7 "
                 "days') OR\n"
                 "          ('@_date_filter' = 'Last 30 Days' AND l.created_at::date >= CURRENT_DATE - INTERVAL '30 "
                 "days') OR\n"
                 "          ('@_date_filter' = 'This Month' AND DATE_TRUNC('month', l.created_at) = "
                 "DATE_TRUNC('month', CURRENT_DATE)) OR\n"
                 "          ('@_date_filter' = 'Custom Date' AND l.created_at::date >= NULLIF('@_start_date', "
                 "'')::date AND l.created_at::date <= NULLIF('@_end_date', '')::date) OR\n"
                 "          ('@_from_date' <> '' AND l.created_at::date >= NULLIF('@_from_date', '')::date) OR\n"
                 "          ('@_to_date' <> '' AND l.created_at::date <= NULLIF('@_to_date', '')::date)\n"
                 '      )\n'
                 '    GROUP BY l.assigned_to_id\n'
                 ') lead_totals ON lead_totals.assigned_to_id = u.id\n'
                 'WHERE u.is_active = TRUE\n'
                 "  AND ('@_user_id' = 'All' OR '@_user_id' = '' OR u.id = NULLIF('@_user_id', '')::bigint)\n"
                 "  AND ('@_search' = '' OR u.username ILIKE '%' || '@_search' || '%' OR u.first_name ILIKE '%' || "
                 "'@_search' || '%' OR u.mobile ILIKE '%' || '@_search' || '%')\n"
                 'ORDER BY COALESCE(lead_totals.total, 0) DESC, u.first_name ASC\n'
                 'LIMIT @_limit OFFSET (@_page - 1) * @_limit;'},
    {   'id': 85,
        'key': 'R_USER_FOLLOWUP_REPORT',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    u.id AS "id",\n'
                 '    ROW_NUMBER() OVER(ORDER BY COALESCE(followup_stats.due_today, 0) DESC, u.first_name '
                 'ASC)::integer AS "s_no",\n'
                 '    TRIM(CONCAT(u.first_name, \' \', COALESCE(u.last_name, \'\'))) AS "user_name",\n'
                 '    COALESCE(\n'
                 "        NULLIF(TRIM(CONCAT(rm.first_name, ' ', COALESCE(rm.last_name, ''))), ''),\n"
                 '        rm.username,\n'
                 "        NULLIF(TRIM(CONCAT(tl.first_name, ' ', COALESCE(tl.last_name, ''))), ''),\n"
                 '        tl.username,\n'
                 "        '-'\n"
                 '    ) AS "reporting_manager",\n'
                 '    COALESCE(followup_stats.due_today, 0)::integer AS "followups_due_today",\n'
                 '    CASE \n'
                 '        WHEN COALESCE(lead_stats.total, 0) > 0 THEN \n'
                 '            CONCAT(ROUND((COALESCE(lead_stats.won, 0)::numeric / lead_stats.total::numeric) * 100, '
                 "2)::text, '%')\n"
                 "        ELSE '0.00%'\n"
                 '    END AS "conversion_percentage",\n'
                 '    COALESCE(followup_stats.avg_tat, \'00:00:00\') AS "average_tat",\n'
                 '    COUNT(*) OVER()::integer AS "full_count"\n'
                 'FROM adm_user u\n'
                 'LEFT JOIN adm_team t ON u.team_id = t.id\n'
                 'LEFT JOIN adm_user tl ON t.leader_id = tl.id\n'
                 'LEFT JOIN adm_user rm ON u.reporting_to_id = rm.id\n'
                 'LEFT JOIN (\n'
                 '    SELECT \n'
                 '        f.telecaller_id,\n'
                 '        COUNT(CASE WHEN f.scheduled_at::date = CURRENT_DATE AND f.is_attended = FALSE THEN 1 END) AS '
                 'due_today,\n'
                 '        TO_CHAR(\n'
                 "            INTERVAL '1 second' * COALESCE(\n"
                 '                AVG(CASE WHEN f.is_attended = TRUE AND f.attended_at IS NOT NULL AND f.scheduled_at '
                 'IS NOT NULL \n'
                 '                         THEN ABS(EXTRACT(EPOCH FROM (f.attended_at - f.scheduled_at))) \n'
                 '                    END), 0\n'
                 "            ), 'HH24:MI:SS'\n"
                 '        ) AS avg_tat\n'
                 '    FROM telecalling_follow_up f\n'
                 '    GROUP BY f.telecaller_id\n'
                 ') followup_stats ON followup_stats.telecaller_id = u.id\n'
                 'LEFT JOIN (\n'
                 '    SELECT \n'
                 '        l.assigned_to_id,\n'
                 '        COUNT(l.id) AS total,\n'
                 "        COUNT(CASE WHEN ps.stage_type IN ('closed_won', 'terminal_joined') OR ps.name ILIKE '%won%' "
                 'THEN 1 END) AS won\n'
                 '    FROM telecalling_lead l\n'
                 '    JOIN telecalling_pipeline_stage ps ON l.pipeline_stage_id = ps.id\n'
                 '    GROUP BY l.assigned_to_id\n'
                 ') lead_stats ON lead_stats.assigned_to_id = u.id\n'
                 'WHERE u.is_active = TRUE\n'
                 "  AND ('@_user_id' = 'All' OR '@_user_id' = '' OR u.id::text = '@_user_id')\n"
                 "  AND ('@_reporting_manager_id' = 'All' OR '@_reporting_manager_id' = '' \n"
                 "       OR u.reporting_to_id::text = '@_reporting_manager_id' \n"
                 "       OR t.leader_id::text = '@_reporting_manager_id'\n"
                 "       OR rm.username ILIKE '@_reporting_manager_id'\n"
                 "       OR tl.username ILIKE '@_reporting_manager_id'\n"
                 "       OR CONCAT(rm.first_name, ' ', COALESCE(rm.last_name, '')) ILIKE '%' || "
                 "'@_reporting_manager_id' || '%'\n"
                 "       OR CONCAT(tl.first_name, ' ', COALESCE(tl.last_name, '')) ILIKE '%' || "
                 "'@_reporting_manager_id' || '%')\n"
                 'ORDER BY COALESCE(followup_stats.due_today, 0) DESC, u.first_name ASC\n'
                 'LIMIT @_limit OFFSET (@_page - 1) * @_limit;'},
    {   'id': 87,
        'key': 'R_CAMPAIGN_REPORT',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    c.id AS "id",\n'
                 '    ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT l.id) DESC, c.name ASC)::integer AS "s_no",\n'
                 '    c.name AS "campaign_name",\n'
                 '    COALESCE(pc.category_name, l_pc.category_name, \'General Pipeline\') AS "pipeline_name",\n'
                 '    COUNT(DISTINCT l.id)::integer AS "total_lead_count",\n'
                 "    COUNT(DISTINCT CASE WHEN LOWER(cd.connection_status) = 'connected' THEN cd.id END)::integer AS "
                 '"total_calls_connected",\n'
                 "    COUNT(DISTINCT CASE WHEN ps.stage_type IN ('closed_won', 'terminal_joined') OR ps.name ILIKE "
                 '\'%won%\' OR ps.name ILIKE \'%converted%\' THEN l.id END)::integer AS "leads_marked_as_converted",\n'
                 "    COUNT(DISTINCT CASE WHEN ps.stage_type IN ('closed_lost', 'terminal_closed') OR ps.name ILIKE "
                 '\'%loss%\' OR ps.name ILIKE \'%lost%\' THEN l.id END)::integer AS "leads_marked_as_lost",\n'
                 '    COUNT(*) OVER()::integer AS "full_count"\n'
                 'FROM telecalling_campaign_name c\n'
                 'LEFT JOIN adm_pipeline_category pc ON c.pipeline_category_id = pc.id\n'
                 'LEFT JOIN telecalling_lead l ON l.campaign_id = c.id\n'
                 "    AND ('@_date_filter' = 'All' OR \n"
                 "        ('@_date_filter' = 'Today' AND l.created_at::date = CURRENT_DATE) OR\n"
                 "        ('@_date_filter' = 'Yesterday' AND l.created_at::date = CURRENT_DATE - INTERVAL '1 day') OR\n"
                 "        ('@_date_filter' = 'Last 7 Days' AND l.created_at::date >= CURRENT_DATE - INTERVAL '7 days') "
                 'OR\n'
                 "        ('@_date_filter' = 'Last 30 Days' AND l.created_at::date >= CURRENT_DATE - INTERVAL '30 "
                 "days') OR\n"
                 "        ('@_date_filter' = 'This Month' AND DATE_TRUNC('month', l.created_at) = DATE_TRUNC('month', "
                 'CURRENT_DATE)) OR\n'
                 "        ('@_date_filter' = 'Custom Date' AND l.created_at::date >= NULLIF('@_start_date', '')::date "
                 "AND l.created_at::date <= NULLIF('@_end_date', '')::date) OR\n"
                 "        ('@_from_date' <> '' AND l.created_at::date >= NULLIF('@_from_date', '')::date) OR\n"
                 "        ('@_to_date' <> '' AND l.created_at::date <= NULLIF('@_to_date', '')::date)\n"
                 '    )\n'
                 'LEFT JOIN telecalling_pipeline_stage ps ON l.pipeline_stage_id = ps.id\n'
                 'LEFT JOIN adm_pipeline_category l_pc ON ps.pipeline_category_id = l_pc.id\n'
                 'LEFT JOIN telecalling_call_details cd ON cd.lead_id = l.id\n'
                 'WHERE 1=1\n'
                 "  AND ('@_campaign_id' = 'All' OR '@_campaign_id' = '' OR c.id = NULLIF('@_campaign_id', "
                 "'')::bigint)\n"
                 "  AND ('@_pipeline_id' = 'All' OR '@_pipeline_id' = '' OR c.pipeline_category_id = "
                 "NULLIF('@_pipeline_id', '')::bigint OR ps.pipeline_category_id = NULLIF('@_pipeline_id', "
                 "'')::bigint)\n"
                 "  AND ('@_campaign_status' = 'All' OR '@_campaign_status' = '' OR \n"
                 "       ('@_campaign_status' = 'Active' AND c.is_active = TRUE) OR \n"
                 "       ('@_campaign_status' = 'Inactive' AND c.is_active = FALSE))\n"
                 "  AND ('@_search' = '' OR c.name ILIKE '%' || '@_search' || '%')\n"
                 'GROUP BY c.id, c.name, pc.category_name, l_pc.category_name\n'
                 'ORDER BY COUNT(DISTINCT l.id) DESC, c.name ASC\n'
                 'LIMIT @_limit OFFSET (@_page - 1) * @_limit;'},
    {   'id': 89,
        'key': 'R_CAMPAIGN_STAGE_REPORT',
        'organization_id': None,
        'query': 'WITH campaign_stage_counts AS (\n'
                 '    SELECT \n'
                 '        l.campaign_id,\n'
                 '        ps.id AS stage_id,\n'
                 "        LOWER(REGEXP_REPLACE(REPLACE(ps.name, ' ', '_'), '[^a-zA-Z0-9_]', '', 'g')) AS stage_key,\n"
                 '        COUNT(l.id) AS cnt\n'
                 '    FROM telecalling_lead l\n'
                 '    JOIN telecalling_pipeline_stage ps ON l.pipeline_stage_id = ps.id\n'
                 '    WHERE l.campaign_id IS NOT NULL\n'
                 "      AND ('@_pipeline_id' = 'All' OR '@_pipeline_id' = '' OR ps.pipeline_category_id = "
                 "NULLIF('@_pipeline_id', '')::bigint)\n"
                 '    GROUP BY l.campaign_id, ps.id, ps.name\n'
                 '),\n'
                 'campaign_lead_totals AS (\n'
                 '    SELECT \n'
                 '        l.campaign_id,\n'
                 '        COUNT(l.id) AS total_leads,\n'
                 '        COUNT(CASE WHEN l.assigned_to_id IS NOT NULL THEN 1 END) AS total_assigned_leads,\n'
                 '        COUNT(CASE WHEN l.assigned_to_id IS NULL THEN 1 END) AS total_unassigned_leads\n'
                 '    FROM telecalling_lead l\n'
                 '    WHERE l.campaign_id IS NOT NULL\n'
                 '    GROUP BY l.campaign_id\n'
                 ')\n'
                 'SELECT \n'
                 '    c.id AS "id",\n'
                 '    ROW_NUMBER() OVER(ORDER BY COALESCE(clt.total_leads, 0) DESC, c.name ASC)::integer AS "s_no",\n'
                 '    c.name AS "campaign_name",\n'
                 '    COALESCE(clt.total_leads, 0)::integer AS "total_leads",\n'
                 '    COALESCE(clt.total_assigned_leads, 0)::integer AS "total_assigned_leads",\n'
                 '    COALESCE(clt.total_unassigned_leads, 0)::integer AS "total_unassigned_leads",\n'
                 '    COALESCE(\n'
                 '        (SELECT jsonb_object_agg(csc.stage_key, csc.cnt) FROM campaign_stage_counts csc WHERE '
                 'csc.campaign_id = c.id),\n'
                 "        '{}'::jsonb\n"
                 '    ) AS "stage_counts",\n'
                 '    COUNT(*) OVER()::integer AS "full_count"\n'
                 'FROM telecalling_campaign_name c\n'
                 'LEFT JOIN campaign_lead_totals clt ON clt.campaign_id = c.id\n'
                 "WHERE ('@_pipeline_id' = 'All' OR '@_pipeline_id' = '' OR c.pipeline_category_id = "
                 "NULLIF('@_pipeline_id', '')::bigint)\n"
                 "  AND ('@_campaign_id' = 'All' OR '@_campaign_id' = '' OR c.id = NULLIF('@_campaign_id', "
                 "'')::bigint)\n"
                 'ORDER BY COALESCE(clt.total_leads, 0) DESC, c.name ASC\n'
                 'LIMIT @_limit OFFSET (@_page - 1) * @_limit;'},
    {   'id': 91,
        'key': 'R_CAMPAIGN_LEAD_REPORT',
        'organization_id': None,
        'query': 'WITH latest_lead_calls AS (\n'
                 '    SELECT DISTINCT ON (cd.lead_id)\n'
                 '        cd.lead_id,\n'
                 "        LOWER(COALESCE(cd.connection_status, '')) AS conn_status,\n"
                 '        cd.stage_id,\n'
                 '        cd.called_at\n'
                 '    FROM telecalling_call_details cd\n'
                 '    ORDER BY cd.lead_id, cd.called_at DESC, cd.id DESC\n'
                 '),\n'
                 'campaign_metrics AS (\n'
                 '    SELECT \n'
                 '        l.campaign_id,\n'
                 '        COUNT(CASE \n'
                 "            WHEN (ps.stage_type = 'open' OR ps.stage_type IS NULL) \n"
                 "                 AND (ps.order_no <= 1 OR ps.name ILIKE '%new%') \n"
                 '            THEN 1 \n'
                 '        END) AS total_open_leads,\n'
                 '\n'
                 '        COUNT(CASE \n'
                 "            WHEN (ps.stage_type = 'open' AND (ps.order_no > 1 OR ps.name ILIKE '%follow%'))\n"
                 "                 OR (LOWER(l.current_status) = 'working' AND ps.stage_type NOT IN ('closed_won', "
                 "'closed_lost', 'terminal_joined', 'terminal_closed'))\n"
                 '            THEN 1 \n'
                 '        END) AS total_in_progress_leads,\n'
                 '\n'
                 '        COUNT(CASE \n'
                 "            WHEN ps.stage_type IN ('closed_won', 'closed_lost', 'terminal_joined', "
                 "'terminal_closed')\n"
                 "                 OR LOWER(l.current_status) IN ('won', 'lost', 'loss')\n"
                 '            THEN 1 \n'
                 '        END) AS total_closed_leads,\n'
                 '\n'
                 '        COUNT(CASE \n'
                 "            WHEN lc.conn_status = 'disconnected' \n"
                 "                 AND (ps.stage_type IN ('closed_lost', 'terminal_closed') OR LOWER(l.current_status) "
                 "IN ('lost', 'loss') OR ps.name ILIKE '%loss%' OR ps.name ILIKE '%lost%')\n"
                 '            THEN 1 \n'
                 '        END) AS total_disconnected_lost_leads,\n'
                 '\n'
                 '        COUNT(CASE \n'
                 "            WHEN lc.conn_status = 'disconnected' \n"
                 "                 AND (ps.stage_type = 'open' OR LOWER(l.current_status) = 'working')\n"
                 "                 AND NOT (ps.stage_type IN ('closed_lost', 'terminal_closed') OR "
                 "LOWER(l.current_status) IN ('lost', 'loss'))\n"
                 '            THEN 1 \n'
                 '        END) AS total_disconnected_pending_leads,\n'
                 '\n'
                 '        COUNT(CASE \n'
                 "            WHEN lc.conn_status IN ('connected', 'incoming')\n"
                 "                 AND (ps.stage_type IN ('closed_won', 'terminal_joined') OR LOWER(l.current_status) "
                 "= 'won' OR ps.name ILIKE '%won%' OR ps.name ILIKE '%converted%' OR ps.name ILIKE '%joined%')\n"
                 '            THEN 1 \n'
                 '        END) AS total_connected_converted_leads,\n'
                 '\n'
                 '        COUNT(CASE \n'
                 "            WHEN lc.conn_status IN ('connected', 'incoming')\n"
                 "                 AND (ps.stage_type IN ('closed_lost', 'terminal_closed') OR LOWER(l.current_status) "
                 "IN ('lost', 'loss') OR ps.name ILIKE '%lost%' OR ps.name ILIKE '%loss%')\n"
                 '            THEN 1 \n'
                 '        END) AS total_connected_lost_leads\n'
                 '\n'
                 '    FROM telecalling_lead l\n'
                 '    LEFT JOIN telecalling_pipeline_stage ps ON l.pipeline_stage_id = ps.id\n'
                 '    LEFT JOIN latest_lead_calls lc ON lc.lead_id = l.id\n'
                 '    WHERE l.campaign_id IS NOT NULL\n'
                 "      AND ('@_pipeline_id' = 'All' OR '@_pipeline_id' = '' OR ps.pipeline_category_id = "
                 "NULLIF('@_pipeline_id', '')::bigint)\n"
                 "      AND ('@_date_filter' = 'All' OR \n"
                 "          ('@_date_filter' = 'Today' AND l.created_at::date = CURRENT_DATE) OR\n"
                 "          ('@_date_filter' = 'Yesterday' AND l.created_at::date = CURRENT_DATE - INTERVAL '1 day') "
                 'OR\n'
                 "          ('@_date_filter' = 'Last 7 Days' AND l.created_at::date >= CURRENT_DATE - INTERVAL '7 "
                 "days') OR\n"
                 "          ('@_date_filter' = 'Last 30 Days' AND l.created_at::date >= CURRENT_DATE - INTERVAL '30 "
                 "days') OR\n"
                 "          ('@_date_filter' = 'This Month' AND DATE_TRUNC('month', l.created_at) = "
                 "DATE_TRUNC('month', CURRENT_DATE)) OR\n"
                 "          ('@_date_filter' = 'Custom Date' AND l.created_at::date >= NULLIF('@_start_date', "
                 "'')::date AND l.created_at::date <= NULLIF('@_end_date', '')::date) OR\n"
                 "          ('@_from_date' <> '' AND l.created_at::date >= NULLIF('@_from_date', '')::date) OR\n"
                 "          ('@_to_date' <> '' AND l.created_at::date <= NULLIF('@_to_date', '')::date)\n"
                 '      )\n'
                 '    GROUP BY l.campaign_id\n'
                 ')\n'
                 'SELECT \n'
                 '    c.id AS "id",\n'
                 '    ROW_NUMBER() OVER(ORDER BY COALESCE(cm.total_closed_leads, 0) + '
                 'COALESCE(cm.total_in_progress_leads, 0) DESC, c.name ASC)::integer AS "s_no",\n'
                 '    c.name AS "campaign_name",\n'
                 '    COALESCE(cm.total_open_leads, 0)::integer AS "total_open_leads",\n'
                 '    COALESCE(cm.total_in_progress_leads, 0)::integer AS "total_in_progress_leads",\n'
                 '    COALESCE(cm.total_closed_leads, 0)::integer AS "total_closed_leads",\n'
                 '    COALESCE(cm.total_disconnected_lost_leads, 0)::integer AS "total_disconnected_lost_leads",\n'
                 '    COALESCE(cm.total_disconnected_pending_leads, 0)::integer AS '
                 '"total_disconnected_pending_leads",\n'
                 '    COALESCE(cm.total_connected_converted_leads, 0)::integer AS "total_connected_converted_leads",\n'
                 '    COALESCE(cm.total_connected_lost_leads, 0)::integer AS "total_connected_lost_leads",\n'
                 '    COUNT(*) OVER()::integer AS "full_count"\n'
                 'FROM telecalling_campaign_name c\n'
                 'LEFT JOIN campaign_metrics cm ON cm.campaign_id = c.id\n'
                 "WHERE ('@_pipeline_id' = 'All' OR '@_pipeline_id' = '' OR c.pipeline_category_id = "
                 "NULLIF('@_pipeline_id', '')::bigint)\n"
                 "  AND ('@_campaign_id' = 'All' OR '@_campaign_id' = '' OR c.id = NULLIF('@_campaign_id', "
                 "'')::bigint)\n"
                 'ORDER BY COALESCE(cm.total_closed_leads, 0) + COALESCE(cm.total_in_progress_leads, 0) DESC, c.name '
                 'ASC\n'
                 'LIMIT @_limit OFFSET (@_page - 1) * @_limit;'},
    {   'id': 93,
        'key': 'R_USER_DEAL_REPORT',
        'organization_id': None,
        'query': 'WITH user_deals AS (\n'
                 '    SELECT \n'
                 '        l.assigned_to_id AS user_id,\n'
                 '        COUNT(CASE \n'
                 "            WHEN ps.stage_type IN ('closed_won', 'terminal_joined') \n"
                 "                 OR LOWER(l.current_status) = 'won' \n"
                 "                 OR ps.name ILIKE '%won%' \n"
                 "                 OR ps.name ILIKE '%joined%' \n"
                 "                 OR ps.name ILIKE '%converted%'\n"
                 '            THEN 1 \n'
                 '        END) AS total_joined_converted,\n'
                 '\n'
                 '        COALESCE(SUM(CASE \n'
                 "            WHEN ps.stage_type IN ('closed_won', 'terminal_joined') \n"
                 "                 OR LOWER(l.current_status) = 'won' \n"
                 "                 OR ps.name ILIKE '%won%' \n"
                 "                 OR ps.name ILIKE '%joined%' \n"
                 "                 OR ps.name ILIKE '%converted%'\n"
                 '            THEN COALESCE(pi.amount_paid, cp.fee_amount, c.course_fees, 0)\n'
                 '        END), 0) AS won_value,\n'
                 '\n'
                 '        COUNT(CASE \n'
                 "            WHEN ps.stage_type IN ('closed_lost', 'terminal_closed') \n"
                 "                 OR LOWER(l.current_status) IN ('lost', 'loss') \n"
                 "                 OR ps.name ILIKE '%lost%' \n"
                 "                 OR ps.name ILIKE '%loss%'\n"
                 '            THEN 1 \n'
                 '        END) AS total_lost_leads,\n'
                 '\n'
                 '        COALESCE(SUM(CASE \n'
                 "            WHEN ps.stage_type IN ('closed_lost', 'terminal_closed') \n"
                 "                 OR LOWER(l.current_status) IN ('lost', 'loss') \n"
                 "                 OR ps.name ILIKE '%lost%' \n"
                 "                 OR ps.name ILIKE '%loss%'\n"
                 '            THEN COALESCE(pi.pending_amount, cp.fee_amount, c.course_fees, 0)\n'
                 '        END), 0) AS total_lost_value\n'
                 '\n'
                 '    FROM telecalling_lead l\n'
                 '    LEFT JOIN telecalling_pipeline_stage ps ON l.pipeline_stage_id = ps.id\n'
                 '    LEFT JOIN telecalling_course c ON c.id = l.course_id\n'
                 '    LEFT JOIN telecalling_course_plan cp ON cp.id = l.course_plan_id\n'
                 '    LEFT JOIN (\n'
                 '        SELECT DISTINCT ON (lead_id) lead_id, amount_paid, pending_amount\n'
                 '        FROM telecalling_payment_info\n'
                 '        ORDER BY lead_id, id DESC\n'
                 '    ) pi ON pi.lead_id = l.id\n'
                 '    WHERE l.assigned_to_id IS NOT NULL\n'
                 "      AND ('@_pipeline_id' = 'All' OR '@_pipeline_id' = '' OR ps.pipeline_category_id = "
                 "NULLIF('@_pipeline_id', '')::bigint)\n"
                 "      AND ('@_campaign_id' = 'All' OR '@_campaign_id' = '' OR l.campaign_id = "
                 "NULLIF('@_campaign_id', '')::bigint)\n"
                 "      AND ('@_date_filter' = 'All' OR \n"
                 "          ('@_date_filter' = 'Today' AND l.created_at::date = CURRENT_DATE) OR\n"
                 "          ('@_date_filter' = 'Yesterday' AND l.created_at::date = CURRENT_DATE - INTERVAL '1 day') "
                 'OR\n'
                 "          ('@_date_filter' = 'Last 7 Days' AND l.created_at::date >= CURRENT_DATE - INTERVAL '7 "
                 "days') OR\n"
                 "          ('@_date_filter' = 'Last 30 Days' AND l.created_at::date >= CURRENT_DATE - INTERVAL '30 "
                 "days') OR\n"
                 "          ('@_date_filter' = 'This Month' AND DATE_TRUNC('month', l.created_at) = "
                 "DATE_TRUNC('month', CURRENT_DATE)) OR\n"
                 "          ('@_date_filter' = 'Custom Date' AND l.created_at::date >= NULLIF('@_start_date', "
                 "'')::date AND l.created_at::date <= NULLIF('@_end_date', '')::date) OR\n"
                 "          ('@_from_date' <> '' AND l.created_at::date >= NULLIF('@_from_date', '')::date) OR\n"
                 "          ('@_to_date' <> '' AND l.created_at::date <= NULLIF('@_to_date', '')::date)\n"
                 '      )\n'
                 '    GROUP BY l.assigned_to_id\n'
                 ')\n'
                 'SELECT \n'
                 '    u.id AS "id",\n'
                 '    ROW_NUMBER() OVER(ORDER BY COALESCE(ud.total_joined_converted, 0) DESC, u.first_name '
                 'ASC)::integer AS "s_no",\n'
                 '    TRIM(CONCAT(u.first_name, \' \', COALESCE(u.last_name, \'\'))) AS "user_name",\n'
                 '    COALESCE(\n'
                 "        NULLIF(TRIM(CONCAT(rm.first_name, ' ', COALESCE(rm.last_name, ''))), ''),\n"
                 '        rm.username,\n'
                 "        NULLIF(TRIM(CONCAT(tl.first_name, ' ', COALESCE(tl.last_name, ''))), ''),\n"
                 '        tl.username,\n'
                 "        '-'\n"
                 '    ) AS "reporting_manager",\n'
                 '    CASE \n'
                 "        WHEN NULLIF('@_from_date', '') IS NOT NULL AND NULLIF('@_to_date', '') IS NOT NULL THEN\n"
                 "            CONCAT(TO_CHAR(NULLIF('@_from_date', '')::date, 'DD Mon YYYY'), ' - ', "
                 "TO_CHAR(NULLIF('@_to_date', '')::date, 'DD Mon YYYY'))\n"
                 "        WHEN NULLIF('@_start_date', '') IS NOT NULL AND NULLIF('@_end_date', '') IS NOT NULL THEN\n"
                 "            CONCAT(TO_CHAR(NULLIF('@_start_date', '')::date, 'DD Mon YYYY'), ' - ', "
                 "TO_CHAR(NULLIF('@_end_date', '')::date, 'DD Mon YYYY'))\n"
                 "        WHEN '@_date_filter' = 'Today' THEN \n"
                 "            CONCAT(TO_CHAR(CURRENT_DATE, 'DD Mon YYYY'), ' - ', TO_CHAR(CURRENT_DATE, 'DD Mon "
                 "YYYY'))\n"
                 "        WHEN '@_date_filter' = 'Yesterday' THEN \n"
                 "            CONCAT(TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'DD Mon YYYY'), ' - ', "
                 "TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'DD Mon YYYY'))\n"
                 "        WHEN '@_date_filter' = 'Last 7 Days' THEN \n"
                 "            CONCAT(TO_CHAR(CURRENT_DATE - INTERVAL '7 days', 'DD Mon YYYY'), ' - ', "
                 "TO_CHAR(CURRENT_DATE, 'DD Mon YYYY'))\n"
                 "        WHEN '@_date_filter' = 'Last 30 Days' THEN \n"
                 "            CONCAT(TO_CHAR(CURRENT_DATE - INTERVAL '30 days', 'DD Mon YYYY'), ' - ', "
                 "TO_CHAR(CURRENT_DATE, 'DD Mon YYYY'))\n"
                 '        ELSE \n'
                 "            CONCAT(TO_CHAR(CURRENT_DATE, 'DD Mon YYYY'), ' - ', TO_CHAR(CURRENT_DATE, 'DD Mon "
                 "YYYY'))\n"
                 '    END AS "date_range",\n'
                 '    COALESCE(ud.total_joined_converted, 0)::integer AS "total_joined_converted",\n'
                 '    COALESCE(ud.won_value, 0)::numeric AS "won_value",\n'
                 '    COALESCE(ud.total_lost_leads, 0)::integer AS "total_lost_leads",\n'
                 '    COALESCE(ud.total_lost_value, 0)::numeric AS "total_lost_value",\n'
                 '    COUNT(*) OVER()::integer AS "full_count"\n'
                 'FROM adm_user u\n'
                 'LEFT JOIN adm_team t ON u.team_id = t.id\n'
                 'LEFT JOIN adm_user tl ON t.leader_id = tl.id\n'
                 'LEFT JOIN adm_user rm ON u.reporting_to_id = rm.id\n'
                 'LEFT JOIN user_deals ud ON ud.user_id = u.id\n'
                 'WHERE u.is_active = TRUE\n'
                 "  AND ('@_user_id' = 'All' OR '@_user_id' = '' OR u.id = NULLIF('@_user_id', '')::bigint)\n"
                 "  AND ('@_reporting_manager' = 'All' OR '@_reporting_manager' = '' OR \n"
                 "       rm.id = NULLIF('@_reporting_manager', '')::bigint OR \n"
                 "       tl.id = NULLIF('@_reporting_manager', '')::bigint OR\n"
                 "       rm.username ILIKE '@_reporting_manager' OR\n"
                 "       tl.username ILIKE '@_reporting_manager' OR\n"
                 "       CONCAT(rm.first_name, ' ', COALESCE(rm.last_name, '')) ILIKE '%' || '@_reporting_manager' || "
                 "'%' OR\n"
                 "       CONCAT(tl.first_name, ' ', COALESCE(tl.last_name, '')) ILIKE '%' || '@_reporting_manager' || "
                 "'%')\n"
                 "  AND ('@_search' = '' OR u.username ILIKE '%' || '@_search' || '%' OR u.first_name ILIKE '%' || "
                 "'@_search' || '%' OR u.mobile ILIKE '%' || '@_search' || '%')\n"
                 'ORDER BY COALESCE(ud.total_joined_converted, 0) DESC, u.first_name ASC\n'
                 'LIMIT @_limit OFFSET (@_page - 1) * @_limit;'},
    {   'id': 95,
        'key': 'R_LOGIN_REPORT',
        'organization_id': None,
        'query': 'WITH filtered_calls AS (\n'
                 '    SELECT \n'
                 '        cd.id,\n'
                 '        cd.telecaller_id,\n'
                 '        cd.connection_status,\n'
                 "        (cd.called_at AT TIME ZONE 'Asia/Kolkata') AS local_called_at,\n"
                 '        CASE \n'
                 "            WHEN LOWER(COALESCE(cd.connection_status, '')) = 'connected' THEN TRUE\n"
                 '            ELSE FALSE\n'
                 '        END AS is_connected,\n'
                 '        CASE \n'
                 "            WHEN LOWER(COALESCE(cd.connection_status, '')) = 'connected' THEN\n"
                 '                COALESCE(\n'
                 "                    NULLIF(TRIM(ps.name), ''),\n"
                 "                    NULLIF(TRIM(pr.name), ''),\n"
                 "                    NULLIF(TRIM(cd.conversation_summary), ''),\n"
                 "                    'Connected'\n"
                 '                )\n'
                 '            ELSE\n'
                 '                COALESCE(\n'
                 "                    NULLIF(TRIM(pr.name), ''),\n"
                 "                    NULLIF(TRIM(cd.conversation_summary), ''),\n"
                 "                    NULLIF(TRIM(ps.name), ''),\n"
                 "                    'Ringing no response'\n"
                 '                )\n'
                 '        END AS description\n'
                 '    FROM telecalling_call_details cd\n'
                 '    LEFT JOIN telecalling_pipeline_stage ps ON cd.stage_id = ps.id\n'
                 '    LEFT JOIN telecalling_priority pr ON cd.select_tag_id = pr.id\n'
                 "    WHERE ('@_user_id' = 'All' OR '@_user_id' = '' OR cd.telecaller_id = NULLIF('@_user_id', "
                 "'')::bigint)\n"
                 '      AND (\n'
                 "          (NULLIF('@_from_date', '') IS NOT NULL AND NULLIF('@_to_date', '') IS NOT NULL \n"
                 "           AND (cd.called_at AT TIME ZONE 'Asia/Kolkata')::date >= NULLIF('@_from_date', '')::date \n"
                 "           AND (cd.called_at AT TIME ZONE 'Asia/Kolkata')::date <= NULLIF('@_to_date', '')::date)\n"
                 "          OR (NULLIF('@_from_date', '') IS NULL AND NULLIF('@_to_date', '') IS NULL \n"
                 '              AND (\n'
                 "                  ('@_date_filter' = 'Today' AND (cd.called_at AT TIME ZONE 'Asia/Kolkata')::date = "
                 "(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date) OR\n"
                 "                  ('@_date_filter' = 'Yesterday' AND (cd.called_at AT TIME ZONE "
                 "'Asia/Kolkata')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date - INTERVAL '1 day') "
                 'OR\n'
                 "                  ('@_date_filter' NOT IN ('Today', 'Yesterday') AND (cd.called_at AT TIME ZONE "
                 "'Asia/Kolkata')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date)\n"
                 '              ))\n'
                 '      )\n'
                 '),\n'
                 'summary_cte AS (\n'
                 '    SELECT \n'
                 '        COUNT(*)::int AS total_calls,\n'
                 '        COUNT(*) FILTER (WHERE is_connected)::int AS connected_calls,\n'
                 '        COUNT(*) FILTER (WHERE NOT is_connected)::int AS unconnected_calls,\n'
                 '        CASE \n'
                 '            WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE is_connected) * 100.0) / COUNT(*), '
                 "1)::text || '%'\n"
                 "            ELSE '0.0%'\n"
                 '        END AS connected_percent,\n'
                 '        CASE \n'
                 '            WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE NOT is_connected) * 100.0) / '
                 "COUNT(*), 1)::text || '%'\n"
                 "            ELSE '0.0%'\n"
                 '        END AS unconnected_percent\n'
                 '    FROM filtered_calls\n'
                 '),\n'
                 'hours_series AS (\n'
                 '    SELECT generate_series(6, 21) AS hr\n'
                 '),\n'
                 'hourly_cte AS (\n'
                 '    SELECT \n'
                 '        hs.hr,\n'
                 '        CONCAT(\n'
                 '            CASE WHEN hs.hr = 0 THEN 12 WHEN hs.hr > 12 THEN hs.hr - 12 ELSE hs.hr END,\n'
                 "            CASE WHEN hs.hr < 12 THEN ' AM' ELSE ' PM' END,\n"
                 "            ' - ',\n"
                 '            CASE WHEN (hs.hr + 1) % 24 = 0 THEN 12 WHEN (hs.hr + 1) > 12 THEN (hs.hr + 1) - 12 ELSE '
                 '(hs.hr + 1) END,\n'
                 "            CASE WHEN (hs.hr + 1) % 24 < 12 THEN ' AM' ELSE ' PM' END\n"
                 '        ) AS hour_label,\n'
                 '        COUNT(fc.id) FILTER (WHERE fc.is_connected)::int AS connected,\n'
                 '        COUNT(fc.id) FILTER (WHERE NOT fc.is_connected)::int AS unconnected,\n'
                 '        COUNT(fc.id)::int AS total\n'
                 '    FROM hours_series hs\n'
                 '    LEFT JOIN filtered_calls fc ON EXTRACT(HOUR FROM fc.local_called_at)::int = hs.hr\n'
                 '    GROUP BY hs.hr\n'
                 '    ORDER BY hs.hr ASC\n'
                 '),\n'
                 'login_events AS (\n'
                 "    SELECT DISTINCT ON (user_id, TO_CHAR(local_login_at, 'YYYY-MM-DD HH24:MI'))\n"
                 '        local_login_at AS event_time,\n'
                 "        TO_CHAR(local_login_at, 'HH24:MI') AS time_str,\n"
                 "        'Login' AS activity,\n"
                 "        '---------' AS description\n"
                 '    FROM (\n'
                 '        SELECT \n'
                 '            COALESCE(\n'
                 '                al.user_id,\n'
                 '                CASE \n'
                 "                    WHEN (al.response_payload->'data'->'user'->>'user_id') ~ '^[0-9]+$' \n"
                 "                    THEN (al.response_payload->'data'->'user'->>'user_id')::bigint \n"
                 '                    ELSE NULL \n'
                 '                END\n'
                 '            ) AS user_id,\n'
                 "            (al.created_at AT TIME ZONE 'Asia/Kolkata') AS local_login_at\n"
                 '        FROM api_log al\n'
                 "        WHERE al.api_name ILIKE '%create_token%'\n"
                 "          AND al.status = '200'\n"
                 '        UNION ALL\n'
                 '        SELECT \n'
                 '            u.id AS user_id,\n'
                 "            (u.last_login AT TIME ZONE 'Asia/Kolkata') AS local_login_at\n"
                 '        FROM adm_user u\n'
                 '        WHERE u.last_login IS NOT NULL\n'
                 '    ) raw_logins\n'
                 '    WHERE user_id IS NOT NULL\n'
                 "      AND ('@_user_id' = 'All' OR '@_user_id' = '' OR user_id = NULLIF('@_user_id', '')::bigint)\n"
                 '      AND (\n'
                 "          (NULLIF('@_from_date', '') IS NOT NULL AND NULLIF('@_to_date', '') IS NOT NULL \n"
                 "           AND local_login_at::date >= NULLIF('@_from_date', '')::date \n"
                 "           AND local_login_at::date <= NULLIF('@_to_date', '')::date)\n"
                 "          OR (NULLIF('@_from_date', '') IS NULL AND NULLIF('@_to_date', '') IS NULL \n"
                 '              AND (\n'
                 "                  ('@_date_filter' = 'Today' AND local_login_at::date = (CURRENT_TIMESTAMP AT TIME "
                 "ZONE 'Asia/Kolkata')::date) OR\n"
                 "                  ('@_date_filter' = 'Yesterday' AND local_login_at::date = (CURRENT_TIMESTAMP AT "
                 "TIME ZONE 'Asia/Kolkata')::date - INTERVAL '1 day') OR\n"
                 "                  ('@_date_filter' NOT IN ('Today', 'Yesterday') AND local_login_at::date = "
                 "(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date)\n"
                 '              ))\n'
                 '      )\n'
                 '),\n'
                 'combined_activities AS (\n'
                 '    SELECT event_time, time_str, activity, description FROM login_events\n'
                 '    UNION ALL\n'
                 '    SELECT \n'
                 '        fc.local_called_at AS event_time,\n'
                 "        TO_CHAR(fc.local_called_at, 'HH24:MI') AS time_str,\n"
                 "        CASE WHEN fc.is_connected THEN 'Connected Call' ELSE 'Unconnected Call' END AS activity,\n"
                 '        fc.description\n'
                 '    FROM filtered_calls fc\n'
                 '),\n'
                 'numbered_activities AS (\n'
                 '    SELECT \n'
                 '        ROW_NUMBER() OVER (ORDER BY event_time ASC)::int AS id,\n'
                 '        time_str AS "time",\n'
                 '        activity,\n'
                 '        description\n'
                 '    FROM combined_activities\n'
                 '    ORDER BY event_time ASC\n'
                 ')\n'
                 'SELECT \n'
                 '    (SELECT row_to_json(s) FROM summary_cte s) AS summary,\n'
                 '    COALESCE(\n'
                 '        (SELECT json_agg(json_build_object(\n'
                 "            'hour', h.hour_label,\n"
                 "            'connected', h.connected,\n"
                 "            'unconnected', h.unconnected,\n"
                 "            'total', h.total\n"
                 '        ) ORDER BY h.hr ASC) FROM hourly_cte h),\n'
                 "        '[]'::json\n"
                 '    ) AS hourly_data,\n'
                 '    COALESCE(\n'
                 '        (SELECT json_agg(json_build_object(\n'
                 "            'id', a.id,\n"
                 '            \'time\', a."time",\n'
                 "            'activity', a.activity,\n"
                 "            'description', a.description\n"
                 '        ) ORDER BY a.id ASC) FROM numbered_activities a),\n'
                 "        '[]'::json\n"
                 '    ) AS activity_logs;'},
    {   'id': 96,
        'key': 'D_FETCH_ONE_TELECALLING_USER',
        'organization_id': None,
        'query': '-- D_FETCH_ONE_TELECALLING_USER\n'
                 'select\n'
                 '    u.id,\n'
                 "    concat_ws(' ', u.first_name, u.last_name)  as full_name,\n"
                 '    u.first_name,\n'
                 '    u.last_name,\n'
                 '    u.email,\n'
                 '    u.mobile,\n'
                 '    u.employee_id,\n'
                 '    u.joining_date,\n'
                 '    u.starting_date,\n'
                 '    u.user_profile,\n'
                 '    r.name                                     as role,\n'
                 '    t.name                                     as team,\n'
                 "    concat_ws(' ', m.first_name, m.last_name)  as reporting_to,\n"
                 '    m.id                                       as reporting_to_id\n'
                 'from adm_user u\n'
                 'left join adm_user_role ur   on ur.user_id = u.id\n'
                 'left join adm_role r         on r.id = ur.role_id\n'
                 'left join adm_team t         on t.id = u.team_id\n'
                 'left join adm_user m         on m.id = u.reporting_to_id\n'
                 '                            and m.organization_id = u.organization_id\n'
                 'where u.id = @_id\n'
                 '  and u.organization_id = @_organization_id\n'
                 'limit 1'},
    {   'id': 97,
        'key': 'D_ADMIN_DASHBOARD_PENDING_PAYMENTS',
        'organization_id': None,
        'query': 'SELECT \n'
                 '    p.id AS id,\n'
                 '    p.id AS payment_id,\n'
                 '    l.id AS lead_id,\n'
                 "    COALESCE(l.full_name, '-') AS student_name,\n"
                 '    COALESCE(\n'
                 "        NULLIF(TRIM(CONCAT(COALESCE(cn.course_name, crs_cn.course_name, ''), ' ', "
                 "COALESCE(crs.batch, ''))), ''),\n"
                 '        cp.course_plan,\n'
                 "        '-'\n"
                 '    ) AS course,\n'
                 "    TO_CHAR(ROUND(p.pending_amount), 'FM999,999,999') AS amount,\n"
                 "    COALESCE(TO_CHAR(ph.due_date, 'YYYY-MM-DD'), TO_CHAR(p.created_at, 'YYYY-MM-DD')) AS due_date,\n"
                 '    CASE \n'
                 "        WHEN COALESCE(ph.due_date, p.created_at::date) < CURRENT_DATE THEN 'Overdue'\n"
                 "        ELSE 'Pending'\n"
                 '    END AS status,\n'
                 '    CASE \n'
                 "        WHEN u.first_name IS NOT NULL AND TRIM(u.first_name) != '' \n"
                 "            THEN TRIM(CONCAT(TRIM(u.first_name), ' ', COALESCE(TRIM(u.last_name), '')))\n"
                 "        ELSE COALESCE(u.username, '-')\n"
                 '    END AS telecaller\n'
                 'FROM telecalling_payment_info p\n'
                 'JOIN telecalling_lead l ON l.id = p.lead_id\n'
                 'LEFT JOIN telecalling_course_name cn ON cn.id = l.course_name_id\n'
                 'LEFT JOIN telecalling_course crs ON crs.id = l.course_id\n'
                 'LEFT JOIN telecalling_course_name crs_cn ON crs_cn.id = crs.course_name_id\n'
                 'LEFT JOIN telecalling_course_plan cp ON cp.id = l.course_plan_id\n'
                 'LEFT JOIN telecalling_campaign_name c ON c.id = l.campaign_id\n'
                 'LEFT JOIN telecalling_pipeline_stage ps ON ps.id = l.pipeline_stage_id\n'
                 'LEFT JOIN adm_user u ON u.id = l.assigned_to_id\n'
                 'LEFT JOIN LATERAL (\n'
                 '    SELECT due_date \n'
                 '    FROM telecalling_payment_history \n'
                 '    WHERE payment_info_id = p.id AND due_date IS NOT NULL \n'
                 '    ORDER BY id DESC \n'
                 '    LIMIT 1\n'
                 ') ph ON TRUE\n'
                 'WHERE p.pending_amount > 0\n'
                 "  AND (NULLIF('@_organization_id', '') IS NULL OR '@_organization_id' = '0' OR '@_organization_id' = "
                 "'null' OR COALESCE(p.organization_id, l.organization_id) = NULLIF('@_organization_id', "
                 "'')::integer)\n"
                 "  AND ('@_pipeline_id' = '' OR '@_pipeline_id' = '0' OR '@_pipeline_id' = 'null' OR "
                 "c.pipeline_category_id = NULLIF('@_pipeline_id', '')::integer OR ps.pipeline_category_id = "
                 "NULLIF('@_pipeline_id', '')::integer)\n"
                 "  AND ('@_campaign_id' = '' OR '@_campaign_id' = '0' OR '@_campaign_id' = 'null' OR l.campaign_id = "
                 "NULLIF('@_campaign_id', '')::integer)\n"
                 "  AND (NULLIF('@_from_date', '') IS NULL OR COALESCE(ph.due_date, p.created_at::date) >= "
                 "NULLIF('@_from_date', '')::date)\n"
                 "  AND (NULLIF('@_to_date', '') IS NULL OR COALESCE(ph.due_date, p.created_at::date) <= "
                 "NULLIF('@_to_date', '')::date)\n"
                 'ORDER BY COALESCE(ph.due_date, p.created_at::date) ASC, p.id DESC;'},
    {   'id': 98,
        'key': 'D_ADMIN_DASHBOARD_PERFORMANCE_OVERVIEW',
        'organization_id': None,
        'query': 'WITH telecaller_stats AS (\n'
                 '    SELECT \n'
                 '        u.id,\n'
                 '        CASE \n'
                 "            WHEN u.first_name IS NOT NULL AND TRIM(u.first_name) != '' \n"
                 "                THEN TRIM(CONCAT(TRIM(u.first_name), ' ', COALESCE(TRIM(u.last_name), '')))\n"
                 "            ELSE COALESCE(u.username, '-')\n"
                 '        END AS telecaller,\n'
                 '        (\n'
                 '            SELECT COUNT(l.id)\n'
                 '            FROM telecalling_lead l\n'
                 '            LEFT JOIN telecalling_campaign_name c ON c.id = l.campaign_id\n'
                 '            LEFT JOIN telecalling_pipeline_stage ps ON ps.id = l.pipeline_stage_id\n'
                 '            WHERE l.assigned_to_id = u.id\n'
                 "              AND (NULLIF('@_organization_id', '') IS NULL OR l.organization_id = "
                 "NULLIF('@_organization_id', '')::integer)\n"
                 "              AND ('@_pipeline_id' = '' OR '@_pipeline_id' = '0' OR '@_pipeline_id' = 'null' OR "
                 "c.pipeline_category_id = NULLIF('@_pipeline_id', '')::integer OR ps.pipeline_category_id = "
                 "NULLIF('@_pipeline_id', '')::integer)\n"
                 "              AND ('@_campaign_id' = '' OR '@_campaign_id' = '0' OR '@_campaign_id' = 'null' OR "
                 "l.campaign_id = NULLIF('@_campaign_id', '')::integer)\n"
                 "              AND (NULLIF('@_from_date', '') IS NULL OR l.created_at::date >= NULLIF('@_from_date', "
                 "'')::date)\n"
                 "              AND (NULLIF('@_to_date', '') IS NULL OR l.created_at::date <= NULLIF('@_to_date', "
                 "'')::date)\n"
                 '        ) AS total_leads,\n'
                 '        (\n'
                 '            SELECT COUNT(cd.id)\n'
                 '            FROM telecalling_call_details cd\n'
                 '            JOIN telecalling_lead l ON l.id = cd.lead_id\n'
                 '            LEFT JOIN telecalling_campaign_name c ON c.id = l.campaign_id\n'
                 '            LEFT JOIN telecalling_pipeline_stage ps ON ps.id = l.pipeline_stage_id\n'
                 '            WHERE cd.telecaller_id = u.id\n'
                 "              AND (NULLIF('@_organization_id', '') IS NULL OR cd.organization_id = "
                 "NULLIF('@_organization_id', '')::integer)\n"
                 "              AND ('@_pipeline_id' = '' OR '@_pipeline_id' = '0' OR '@_pipeline_id' = 'null' OR "
                 "c.pipeline_category_id = NULLIF('@_pipeline_id', '')::integer OR ps.pipeline_category_id = "
                 "NULLIF('@_pipeline_id', '')::integer)\n"
                 "              AND ('@_campaign_id' = '' OR '@_campaign_id' = '0' OR '@_campaign_id' = 'null' OR "
                 "l.campaign_id = NULLIF('@_campaign_id', '')::integer)\n"
                 "              AND (NULLIF('@_from_date', '') IS NULL OR cd.called_at::date >= NULLIF('@_from_date', "
                 "'')::date)\n"
                 "              AND (NULLIF('@_to_date', '') IS NULL OR cd.called_at::date <= NULLIF('@_to_date', "
                 "'')::date)\n"
                 '        ) AS calls_made,\n'
                 '        (\n'
                 '            SELECT COUNT(cd.id)\n'
                 '            FROM telecalling_call_details cd\n'
                 '            JOIN telecalling_lead l ON l.id = cd.lead_id\n'
                 '            LEFT JOIN telecalling_campaign_name c ON c.id = l.campaign_id\n'
                 '            LEFT JOIN telecalling_pipeline_stage ps ON ps.id = l.pipeline_stage_id\n'
                 '            WHERE cd.telecaller_id = u.id\n'
                 "              AND (cd.duration_seconds > 0 OR cd.connection_status = '1' OR cd.connection_status "
                 "ILIKE '%connect%')\n"
                 "              AND (NULLIF('@_organization_id', '') IS NULL OR cd.organization_id = "
                 "NULLIF('@_organization_id', '')::integer)\n"
                 "              AND ('@_pipeline_id' = '' OR '@_pipeline_id' = '0' OR '@_pipeline_id' = 'null' OR "
                 "c.pipeline_category_id = NULLIF('@_pipeline_id', '')::integer OR ps.pipeline_category_id = "
                 "NULLIF('@_pipeline_id', '')::integer)\n"
                 "              AND ('@_campaign_id' = '' OR '@_campaign_id' = '0' OR '@_campaign_id' = 'null' OR "
                 "l.campaign_id = NULLIF('@_campaign_id', '')::integer)\n"
                 "              AND (NULLIF('@_from_date', '') IS NULL OR cd.called_at::date >= NULLIF('@_from_date', "
                 "'')::date)\n"
                 "              AND (NULLIF('@_to_date', '') IS NULL OR cd.called_at::date <= NULLIF('@_to_date', "
                 "'')::date)\n"
                 '        ) AS connected,\n'
                 '        (\n'
                 '            SELECT COUNT(f.id)\n'
                 '            FROM telecalling_follow_up f\n'
                 '            JOIN telecalling_lead l ON l.id = f.lead_id\n'
                 '            LEFT JOIN telecalling_campaign_name c ON c.id = l.campaign_id\n'
                 '            LEFT JOIN telecalling_pipeline_stage ps ON ps.id = l.pipeline_stage_id\n'
                 '            WHERE f.telecaller_id = u.id\n'
                 '              AND f.is_attended = FALSE\n'
                 '              AND f.scheduled_at < NOW()\n'
                 "              AND (NULLIF('@_organization_id', '') IS NULL OR f.organization_id = "
                 "NULLIF('@_organization_id', '')::integer)\n"
                 "              AND ('@_pipeline_id' = '' OR '@_pipeline_id' = '0' OR '@_pipeline_id' = 'null' OR "
                 "c.pipeline_category_id = NULLIF('@_pipeline_id', '')::integer OR ps.pipeline_category_id = "
                 "NULLIF('@_pipeline_id', '')::integer)\n"
                 "              AND ('@_campaign_id' = '' OR '@_campaign_id' = '0' OR '@_campaign_id' = 'null' OR "
                 "l.campaign_id = NULLIF('@_campaign_id', '')::integer)\n"
                 '        ) AS missed_followup,\n'
                 '        (\n'
                 '            SELECT COUNT(l.id)\n'
                 '            FROM telecalling_lead l\n'
                 '            JOIN telecalling_pipeline_stage ps ON ps.id = l.pipeline_stage_id\n'
                 '            LEFT JOIN telecalling_campaign_name c ON c.id = l.campaign_id\n'
                 '            WHERE l.assigned_to_id = u.id\n'
                 "              AND (ps.id = 3 OR ps.stage_type = 'won' OR ps.name ILIKE '%won%' OR ps.name ILIKE "
                 "'%convert%' OR ps.name ILIKE '%close%' OR ps.name ILIKE '%complete%')\n"
                 "              AND (NULLIF('@_organization_id', '') IS NULL OR l.organization_id = "
                 "NULLIF('@_organization_id', '')::integer)\n"
                 "              AND ('@_pipeline_id' = '' OR '@_pipeline_id' = '0' OR '@_pipeline_id' = 'null' OR "
                 "c.pipeline_category_id = NULLIF('@_pipeline_id', '')::integer OR ps.pipeline_category_id = "
                 "NULLIF('@_pipeline_id', '')::integer)\n"
                 "              AND ('@_campaign_id' = '' OR '@_campaign_id' = '0' OR '@_campaign_id' = 'null' OR "
                 "l.campaign_id = NULLIF('@_campaign_id', '')::integer)\n"
                 "              AND (NULLIF('@_from_date', '') IS NULL OR l.updated_at::date >= NULLIF('@_from_date', "
                 "'')::date)\n"
                 "              AND (NULLIF('@_to_date', '') IS NULL OR l.updated_at::date <= NULLIF('@_to_date', "
                 "'')::date)\n"
                 '        ) AS conversion\n'
                 '    FROM adm_user u\n'
                 '    WHERE u.is_active = TRUE\n'
                 "      AND (NULLIF('@_organization_id', '') IS NULL OR u.organization_id = "
                 "NULLIF('@_organization_id', '')::integer)\n"
                 '      AND (\n'
                 "          u.user_type ILIKE '%telecaller%' \n"
                 "          OR u.user_type ILIKE '%executive%' \n"
                 "          OR u.user_type ILIKE '%counselor%'\n"
                 '          OR EXISTS (SELECT 1 FROM telecalling_lead WHERE assigned_to_id = u.id)\n'
                 '      )\n'
                 ')\n'
                 'SELECT \n'
                 '    id,\n'
                 '    telecaller,\n'
                 '    total_leads,\n'
                 '    calls_made,\n'
                 '    connected,\n'
                 '    missed_followup,\n'
                 '    conversion,\n'
                 '    CASE \n'
                 '        WHEN calls_made > 0 THEN ROUND((connected::numeric / calls_made::numeric) * 100)::text || '
                 "'%'\n"
                 "        ELSE '0%'\n"
                 '    END AS rating\n'
                 'FROM telecaller_stats\n'
                 'ORDER BY conversion DESC, connected DESC, total_leads DESC;'},
    {   'id': 99,
        'key': 'D_ADMIN_DASHBOARD_BEST_PERFORMER',
        'organization_id': None,
        'query': 'WITH telecaller_metrics AS (\n'
                 '    SELECT \n'
                 '        u.id,\n'
                 '        CASE \n'
                 "            WHEN u.first_name IS NOT NULL AND TRIM(u.first_name) != '' \n"
                 "                THEN TRIM(CONCAT(TRIM(u.first_name), ' ', COALESCE(TRIM(u.last_name), '')))\n"
                 "            ELSE COALESCE(u.username, '-')\n"
                 '        END AS name,\n'
                 '        CASE \n'
                 "            WHEN u.user_profile IS NOT NULL AND TRIM(u.user_profile) != '' THEN u.user_profile\n"
                 "            ELSE CONCAT('https://api.dicebear.com/7.x/avataaars/svg?seed=', "
                 "REPLACE(COALESCE(u.first_name, u.username), ' ', '+'))\n"
                 '        END AS avatar,\n'
                 '        (\n'
                 '            SELECT COUNT(l.id)\n'
                 '            FROM telecalling_lead l\n'
                 '            JOIN telecalling_pipeline_stage ps ON ps.id = l.pipeline_stage_id\n'
                 '            LEFT JOIN telecalling_campaign_name c ON c.id = l.campaign_id\n'
                 '            WHERE l.assigned_to_id = u.id\n'
                 "              AND (ps.id = 3 OR ps.stage_type = 'won' OR ps.name ILIKE '%won%' OR ps.name ILIKE "
                 "'%convert%' OR ps.name ILIKE '%close%' OR ps.name ILIKE '%complete%')\n"
                 "              AND (NULLIF('@_organization_id', '') IS NULL OR l.organization_id = "
                 "NULLIF('@_organization_id', '')::integer)\n"
                 "              AND ('@_pipeline_id' = '' OR '@_pipeline_id' = '0' OR '@_pipeline_id' = 'null' OR "
                 "c.pipeline_category_id = NULLIF('@_pipeline_id', '')::integer OR ps.pipeline_category_id = "
                 "NULLIF('@_pipeline_id', '')::integer)\n"
                 "              AND ('@_campaign_id' = '' OR '@_campaign_id' = '0' OR '@_campaign_id' = 'null' OR "
                 "l.campaign_id = NULLIF('@_campaign_id', '')::integer)\n"
                 "              AND (NULLIF('@_from_date', '') IS NULL OR l.updated_at::date >= NULLIF('@_from_date', "
                 "'')::date)\n"
                 "              AND (NULLIF('@_to_date', '') IS NULL OR l.updated_at::date <= NULLIF('@_to_date', "
                 "'')::date)\n"
                 '        ) AS deals_closed,\n'
                 '        (\n'
                 '            SELECT COUNT(cd.id)\n'
                 '            FROM telecalling_call_details cd\n'
                 '            JOIN telecalling_lead l ON l.id = cd.lead_id\n'
                 '            LEFT JOIN telecalling_campaign_name c ON c.id = l.campaign_id\n'
                 '            LEFT JOIN telecalling_pipeline_stage ps ON ps.id = l.pipeline_stage_id\n'
                 '            WHERE cd.telecaller_id = u.id\n'
                 "              AND (NULLIF('@_organization_id', '') IS NULL OR cd.organization_id = "
                 "NULLIF('@_organization_id', '')::integer)\n"
                 "              AND ('@_pipeline_id' = '' OR '@_pipeline_id' = '0' OR '@_pipeline_id' = 'null' OR "
                 "c.pipeline_category_id = NULLIF('@_pipeline_id', '')::integer OR ps.pipeline_category_id = "
                 "NULLIF('@_pipeline_id', '')::integer)\n"
                 "              AND ('@_campaign_id' = '' OR '@_campaign_id' = '0' OR '@_campaign_id' = 'null' OR "
                 "l.campaign_id = NULLIF('@_campaign_id', '')::integer)\n"
                 "              AND (NULLIF('@_from_date', '') IS NULL OR cd.called_at::date >= NULLIF('@_from_date', "
                 "'')::date)\n"
                 "              AND (NULLIF('@_to_date', '') IS NULL OR cd.called_at::date <= NULLIF('@_to_date', "
                 "'')::date)\n"
                 '        ) AS calls_made,\n'
                 '        (\n'
                 '            SELECT COALESCE(SUM(p.amount_paid), 0)\n'
                 '            FROM telecalling_payment_info p\n'
                 '            JOIN telecalling_lead l ON l.id = p.lead_id\n'
                 '            JOIN telecalling_pipeline_stage ps ON ps.id = l.pipeline_stage_id\n'
                 '            LEFT JOIN telecalling_campaign_name c ON c.id = l.campaign_id\n'
                 '            WHERE l.assigned_to_id = u.id\n'
                 "              AND (ps.id = 3 OR ps.stage_type = 'won' OR ps.name ILIKE '%won%' OR ps.name ILIKE "
                 "'%convert%' OR ps.name ILIKE '%close%' OR ps.name ILIKE '%complete%')\n"
                 "              AND (NULLIF('@_organization_id', '') IS NULL OR p.organization_id = "
                 "NULLIF('@_organization_id', '')::integer)\n"
                 "              AND ('@_pipeline_id' = '' OR '@_pipeline_id' = '0' OR '@_pipeline_id' = 'null' OR "
                 "c.pipeline_category_id = NULLIF('@_pipeline_id', '')::integer OR ps.pipeline_category_id = "
                 "NULLIF('@_pipeline_id', '')::integer)\n"
                 "              AND ('@_campaign_id' = '' OR '@_campaign_id' = '0' OR '@_campaign_id' = 'null' OR "
                 "l.campaign_id = NULLIF('@_campaign_id', '')::integer)\n"
                 "              AND (NULLIF('@_from_date', '') IS NULL OR p.created_at::date >= NULLIF('@_from_date', "
                 "'')::date)\n"
                 "              AND (NULLIF('@_to_date', '') IS NULL OR p.created_at::date <= NULLIF('@_to_date', "
                 "'')::date)\n"
                 '        ) AS raw_revenue\n'
                 '    FROM adm_user u\n'
                 '    WHERE u.is_active = TRUE\n'
                 "      AND (NULLIF('@_organization_id', '') IS NULL OR u.organization_id = "
                 "NULLIF('@_organization_id', '')::integer)\n"
                 '      AND (\n'
                 "          u.user_type ILIKE '%telecaller%' \n"
                 "          OR u.user_type ILIKE '%executive%' \n"
                 "          OR u.user_type ILIKE '%counselor%'\n"
                 '          OR EXISTS (SELECT 1 FROM telecalling_lead WHERE assigned_to_id = u.id)\n'
                 '      )\n'
                 ')\n'
                 'SELECT \n'
                 '    name,\n'
                 '    avatar,\n'
                 '    deals_closed,\n'
                 '    calls_made,\n'
                 "    CONCAT('₹', TO_CHAR(raw_revenue, 'FM99,99,999')) AS revenue\n"
                 'FROM telecaller_metrics\n'
                 'ORDER BY deals_closed DESC, raw_revenue DESC, calls_made DESC\n'
                 'LIMIT 1;'},
    {   'id': 101,
        'key': 'L_DATE_FILTERS',
        'organization_id': None,
        'query': 'SELECT value, label FROM (\n'
                 '    VALUES \n'
                 "        ('all', 'All', 1),\n"
                 "        ('today', 'Today', 2),\n"
                 "        ('yesterday', 'Yesterday', 3),\n"
                 "        ('last_7_days', 'Last 7 days', 4),\n"
                 "        ('last_30_days', 'Last 30 days', 5),\n"
                 "        ('this_month', 'This Month', 6),\n"
                 "        ('custom', 'Custom Range', 7)\n"
                 ') AS t(value, label, order_no)\n'
                 'ORDER BY order_no ASC;'},
    {   'id': 102,
        'key': 'L_PAYMENT_STATUS',
        'organization_id': None,
        'query': 'select id as value,name as label from telecalling_payment_status'},
    {   'id': 103,
        'key': 'L_CALL_STATUSES',
        'organization_id': None,
        'query': "SELECT id, value, label FROM (VALUES (1, 'connected', 'Connected'), (2, 'disconnected', "
                 "'Disconnected')) AS t(id, value, label) ORDER BY id ASC;"},
    {   'id': 104,
        'key': 'L_CALL_DIRECTIONS',
        'organization_id': None,
        'query': "SELECT id, value, label FROM (VALUES (1, 'incoming', 'Incoming'), (2, 'outgoing', 'Outgoing')) AS "
                 't(id, value, label) ORDER BY id ASC;'}]


def insert_all_crm_master_data():
    """
    Single master function to insert/update data for all 15 models using Django ORM.
    """
    from adm.models import (
        PermGroup, Perm, Role, PaymentMode, ReportCatalog, CollectionQuery
    )
    from telecalling.models import (
        AmountStage, DisconnectStage, FilterLeads, FilterPayment, FilterPipeline,
        LeadSource, LossReason, PaymentStage, PaymentStatus
    )

    stats = {}
    with transaction.atomic():
        # 1. adm_perm_group
        pg_cnt = 0
        for item in PERM_GROUPS_DATA:
            PermGroup.objects.update_or_create(id=item['id'], defaults=item)
            pg_cnt += 1
        stats['adm_perm_group'] = pg_cnt

        # 2. adm_perm
        p_cnt = 0
        for item in PERMS_DATA:
            Perm.objects.update_or_create(id=item['id'], defaults=item)
            p_cnt += 1
        stats['adm_perm'] = p_cnt

        # 3. adm_role and role perms mapping
        r_cnt = 0
        for r_item in ROLES_DATA:
            item_copy = dict(r_item)
            perm_codes = item_copy.pop('perms', [])
            role_obj, _ = Role.objects.update_or_create(id=item_copy['id'], defaults=item_copy)
            if perm_codes:
                perm_objs = Perm.objects.filter(code__in=perm_codes)
                role_obj.perms.set(perm_objs)
            r_cnt += 1
        stats['adm_role'] = r_cnt

        # 4. adm_payment_mode
        pm_cnt = 0
        for item in PAYMENT_MODES_DATA:
            PaymentMode.objects.update_or_create(id=item['id'], defaults=item)
            pm_cnt += 1
        stats['adm_payment_mode'] = pm_cnt

        # 5. adm_report_catalog
        rc_cnt = 0
        for item in REPORT_CATALOG_DATA:
            ReportCatalog.objects.update_or_create(id=item['id'], defaults=item)
            rc_cnt += 1
        stats['adm_report_catalog'] = rc_cnt

        # 6. telecalling_amount_stage
        as_cnt = 0
        for item in AMOUNT_STAGES_DATA:
            AmountStage.objects.update_or_create(id=item['id'], defaults=item)
            as_cnt += 1
        stats['telecalling_amount_stage'] = as_cnt

        # 7. telecalling_disconnect_stage
        ds_cnt = 0
        for item in DISCONNECT_STAGES_DATA:
            DisconnectStage.objects.update_or_create(id=item['id'], defaults=item)
            ds_cnt += 1
        stats['telecalling_disconnect_stage'] = ds_cnt

        # 8. telecalling_filter_leads
        fl_cnt = 0
        for item in FILTER_LEADS_DATA:
            FilterLeads.objects.update_or_create(id=item['id'], defaults=item)
            fl_cnt += 1
        stats['telecalling_filter_leads'] = fl_cnt

        # 9. telecalling_filter_payment
        fp_cnt = 0
        for item in FILTER_PAYMENT_DATA:
            FilterPayment.objects.update_or_create(id=item['id'], defaults=item)
            fp_cnt += 1
        stats['telecalling_filter_payment'] = fp_cnt

        # 10. telecalling_filter_pipeline
        fpipe_cnt = 0
        for item in FILTER_PIPELINE_DATA:
            FilterPipeline.objects.update_or_create(id=item['id'], defaults=item)
            fpipe_cnt += 1
        stats['telecalling_filter_pipeline'] = fpipe_cnt

        # 11. telecalling_lead_source
        ls_cnt = 0
        for item in LEAD_SOURCES_DATA:
            LeadSource.objects.update_or_create(id=item['id'], defaults=item)
            ls_cnt += 1
        stats['telecalling_lead_source'] = ls_cnt

        # 12. telecalling_loss_reason
        lr_cnt = 0
        for item in LOSS_REASONS_DATA:
            LossReason.objects.update_or_create(id=item['id'], defaults=item)
            lr_cnt += 1
        stats['telecalling_loss_reason'] = lr_cnt

        # 13. telecalling_payment_stage
        pstage_cnt = 0
        for item in PAYMENT_STAGES_DATA:
            PaymentStage.objects.update_or_create(id=item['id'], defaults=item)
            pstage_cnt += 1
        stats['telecalling_payment_stage'] = pstage_cnt

        # 14. telecalling_payment_status
        pstat_cnt = 0
        for item in PAYMENT_STATUSES_DATA:
            PaymentStatus.objects.update_or_create(id=item['id'], defaults=item)
            pstat_cnt += 1
        stats['telecalling_payment_status'] = pstat_cnt

        # 15. adm_collection_query
        cq_cnt = 0
        for item in COLLECTION_QUERIES_DATA:
            CollectionQuery.objects.update_or_create(id=item['id'], defaults=item)
            cq_cnt += 1
        stats['adm_collection_query'] = cq_cnt

    print('\n=======================================================')
    print('   CRM MASTER DATA INSERTION COMPLETED SUCCESSFULLY    ')
    print('=======================================================')
    for model_name, count in stats.items():
        print(f'  [OK] {model_name:32}: {count} records synced.')
    total_synced = sum(stats.values())
    print('-------------------------------------------------------')
    print(f'SUCCESS: Total {len(stats)} models, {total_synced} records inserted/updated.')
    print('=======================================================\n')
    return stats


if __name__ == '__main__':
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_api.settings')
    import django
    django.setup()
    insert_all_crm_master_data()
