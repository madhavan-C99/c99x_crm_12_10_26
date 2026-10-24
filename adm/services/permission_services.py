from django.db import models
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
        "api_call_connect_form", "api_call_disconnect_form", "api_call_disconnect_select_tag"
    ],
    "feat_dcr_reports": [
        "api_daily_report_api", "api_submit_daily_report_view", "api_download_daily_report_view"
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
        "api_add_course", "api_update_course"
    ],
    "feat_dropdowns_master": [
        "api_create_dropdown_sub", "api_dropdown_cate_create"
    ],
    "feat_communication_templates": [
        "api_message_Setting_api", "api_notes_setting_api"
    ],

    # Module 5: Campaign Management (4 Features, 12 APIs)
    "feat_campaign_cards": [
        "api_campaign_cards_list_admin", "api_campaign_enquiry_sheet_admin",
        "api_fetch_campaign_detail_admin", "api_campaign_managers_admin", "api_campaign_agents_admin"
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

FEATURE_DEFINITIONS = [
    # Module 1: Lead Management
    {
        "id": "feat_lead_view",
        "name": "View & Search Leads",
        "module_code": "LEAD_MANAGEMENT",
        "info": "Access lead directory, search leads, view lead details and summary tiles",
        "api_count": 8,
    },
    {
        "id": "feat_lead_add",
        "name": "Add New Lead (Manual / Walk-in)",
        "module_code": "LEAD_MANAGEMENT",
        "info": "Create single leads manually, fetch required dropdowns and form presets",
        "api_count": 4,
    },
    {
        "id": "feat_lead_edit",
        "name": "Edit Lead Details & Notes",
        "module_code": "LEAD_MANAGEMENT",
        "info": "Update contact details, record follow-up notes, and edit lead summaries",
        "api_count": 3,
    },
    {
        "id": "feat_lead_mark_won",
        "name": "Mark Lead as Won (Conversion)",
        "module_code": "LEAD_MANAGEMENT",
        "info": "Enroll student, mark lead as Won, and record initial fee breakdown",
        "api_count": 4,
    },
    {
        "id": "feat_lead_mark_lost",
        "name": "Mark Lead as Lost (Drop Request)",
        "module_code": "LEAD_MANAGEMENT",
        "info": "Submit lead drop request with loss reason for manager approval",
        "api_count": 4,
    },
    {
        "id": "feat_lead_delete",
        "name": "Delete Leads",
        "module_code": "LEAD_MANAGEMENT",
        "info": "Permanently delete lead records or lead summaries from CRM",
        "api_count": 2,
    },
    {
        "id": "feat_lead_reassign",
        "name": "Reassign & Transfer Leads",
        "module_code": "LEAD_MANAGEMENT",
        "info": "Reassign leads between telecallers and transfer lead ownership",
        "api_count": 4,
    },
    {
        "id": "feat_lead_auto_allocation",
        "name": "Lead Auto-Allocation (Round-Robin)",
        "module_code": "LEAD_MANAGEMENT",
        "info": "Toggle automated lead assignment and round-robin distribution",
        "api_count": 2,
    },
    {
        "id": "feat_lead_import",
        "name": "Bulk Upload (Excel / CSV Import)",
        "module_code": "LEAD_MANAGEMENT",
        "info": "Upload external lead sheets via Excel, preview data, verify fields and submit import",
        "api_count": 5,
    },
    {
        "id": "feat_lead_export",
        "name": "Export Leads & Data Sheets",
        "module_code": "LEAD_MANAGEMENT",
        "info": "Download leads to Excel/CSV with dynamic field column selection",
        "api_count": 2,
    },
    {
        "id": "feat_lead_loss_approvals",
        "name": "Loss Lead Approvals",
        "module_code": "LEAD_MANAGEMENT",
        "info": "Review telecaller drop requests, inspect reasons, approve closure or return to call",
        "api_count": 4,
    },

    # Module 2: User & Team Management
    {
        "id": "feat_staff_roster",
        "name": "Staff Directory & User Profiles",
        "module_code": "USERS",
        "info": "View active users, branch staff lists, team assignments and staff dropdowns",
        "api_count": 5,
    },
    {
        "id": "feat_staff_create_edit",
        "name": "Create & Edit Staff Profiles",
        "module_code": "USERS",
        "info": "Add new staff members, edit profile details and assign designations",
        "api_count": 3,
    },
    {
        "id": "feat_staff_password",
        "name": "Reset / Change Staff Password",
        "module_code": "USERS",
        "info": "Security privilege to reset staff passwords and update credentials",
        "api_count": 1,
    },
    {
        "id": "feat_staff_deactivate_delete",
        "name": "Deactivate & Delete Staff",
        "module_code": "USERS",
        "info": "Toggle active/inactive status and permanently remove staff accounts",
        "api_count": 3,
    },
    {
        "id": "feat_team_organization",
        "name": "Teams & Branch Hierarchy",
        "module_code": "USERS",
        "info": "Create teams, edit team hierarchy, delete teams and fetch team dropdowns",
        "api_count": 5,
    },
    {
        "id": "feat_team_assignment",
        "name": "Assign Staff to Teams",
        "module_code": "USERS",
        "info": "Assign, reallocate and transfer telecallers across operational teams",
        "api_count": 1,
    },
    {
        "id": "feat_target_allocation",
        "name": "Target & Quota Allocation",
        "module_code": "USERS",
        "info": "Set monthly targets for telecallers, view target achievement dropdowns and track quotas",
        "api_count": 4,
    },
    {
        "id": "feat_loss_reasons",
        "name": "Loss Reasons Configuration",
        "module_code": "USERS",
        "info": "Configure pipeline-specific lead rejection and drop reasons",
        "api_count": 6,
    },
    {
        "id": "feat_roles_matrix",
        "name": "Roles & Permission Matrix",
        "module_code": "USERS",
        "info": "Create custom roles, configure role permissions matrix and access control",
        "api_count": 3,
    },

    # Module 3: Reports & Analytics
    {
        "id": "feat_exec_dashboard",
        "name": "Executive & Admin Dashboard",
        "module_code": "REPORTS",
        "info": "Central analytics overview, pipeline health cards, conversion ratios and executive KPI metrics",
        "api_count": 1,
    },
    {
        "id": "feat_call_logs",
        "name": "Call Logs & Audio Dispositions",
        "module_code": "REPORTS",
        "info": "View telecalling call logs, disposition histories, connect/disconnect forms and recordings",
        "api_count": 6,
    },
    {
        "id": "feat_dcr_reports",
        "name": "Daily Calling Reports (DCR)",
        "module_code": "REPORTS",
        "info": "Submit end-of-day calling report, view team daily submissions and export DCR logs",
        "api_count": 3,
    },
    {
        "id": "feat_team_performance",
        "name": "Telecaller & Team Performance",
        "module_code": "REPORTS",
        "info": "Performance overview metrics, telecaller comparison charts, drill-down analytics and export",
        "api_count": 4,
    },
    {
        "id": "feat_payments_view",
        "name": "View Pending Payments & Overdue",
        "module_code": "REPORTS",
        "info": "Track pending student fees, installment overdues, collection cards and payment histories",
        "api_count": 5,
    },
    {
        "id": "feat_payments_collect",
        "name": "Collect Payments & Receipts",
        "module_code": "REPORTS",
        "info": "Record payment collections, installment updates, export payment logs and generate PDF receipts",
        "api_count": 3,
    },

    # Module 4: Organization Settings
    {
        "id": "feat_org_profile",
        "name": "Organization Profile & Details",
        "module_code": "ORGANIZATION_SETTINGS",
        "info": "View and manage company branding, contact details, branch registration and settings",
        "api_count": 3,
    },
    {
        "id": "feat_curriculum",
        "name": "Course & Curriculum Management",
        "module_code": "ORGANIZATION_SETTINGS",
        "info": "Configure course programs, plan pricing, curriculum categories and update fee structures",
        "api_count": 2,
    },
    {
        "id": "feat_dropdowns_master",
        "name": "Custom Dropdowns & Lead Categories",
        "module_code": "ORGANIZATION_SETTINGS",
        "info": "Configure custom lead categories, sub-categories, and master dropdowns",
        "api_count": 2,
    },
    {
        "id": "feat_communication_templates",
        "name": "Communication & Note Templates",
        "module_code": "ORGANIZATION_SETTINGS",
        "info": "Configure standard telecalling notes, call remarks and message presets",
        "api_count": 2,
    },

    # Module 5: Campaign Management
    {
        "id": "feat_campaign_cards",
        "name": "Campaign Cards & Enquiry Sheet",
        "module_code": "CAMPAIGN",
        "info": "View marketing campaign performance cards, lead counts, enquiry sheets, assigned agents & managers",
        "api_count": 5,
    },
    {
        "id": "feat_campaign_manage",
        "name": "Create & Manage Campaigns",
        "module_code": "CAMPAIGN",
        "info": "Create marketing campaigns, edit campaign budgets, and toggle active/paused status",
        "api_count": 3,
    },
    {
        "id": "feat_campaign_delete",
        "name": "Delete Marketing Campaigns",
        "module_code": "CAMPAIGN",
        "info": "Privilege to permanently delete marketing campaigns from the CRM",
        "api_count": 1,
    },
    {
        "id": "feat_campaign_migration",
        "name": "Campaign Lead Migration",
        "module_code": "CAMPAIGN",
        "info": "Move leads across campaigns, transfer single campaign leads or batch transfer all campaign leads",
        "api_count": 3,
    },

    # Module 6: Pipeline Management
    {
        "id": "feat_pipeline_kanban",
        "name": "Pipeline Kanban & Funnel Tracking",
        "module_code": "PIPELINE",
        "info": "Kanban board stages, funnel conversion statistics and moving lead stages",
        "api_count": 5,
    },
    {
        "id": "feat_pipeline_categories",
        "name": "Pipeline Stages & Category Configuration",
        "module_code": "PIPELINE",
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
        
        # 3. Partition 26 Major Features into 6 PermGroup Modules
        module_order = ["LEAD_MANAGEMENT", "USERS", "REPORTS", "ORGANIZATION_SETTINGS", "CAMPAIGN", "PIPELINE"]
        
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

                feature_objects.append({
                    "id": feat_id,
                    "name": feat["name"],
                    "info": feat["info"],
                    "api_count": feat["api_count"],
                    "child_apis": child_apis,
                    "values": values_dict
                })

            categories_list.append({
                "id": group_id,
                "name": group_name,
                "permissions": feature_objects
            })

        return {
            "roles": roles_list,
            "categories": categories_list,
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

    created_at_iso = new_role.created_at.strftime('%Y-%m-%dT%H:%M:%SZ') if new_role.created_at else None

    return {
        "id": role_id_key,
        "name": new_role.display_value or new_role.name,
        "duplicate_from": duplicate_from,
        "created_at": created_at_iso,
        "message": "Role created successfully"
    }


def update_role_permission_service(admin_user, data):
    from django.db import transaction

    role_id = str(data.get('role_id') or '').strip()
    category_id = str(data.get('category_id') or '').strip()
    permission_id = str(data.get('permission_id') or data.get('feature_id') or '').strip()
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

    user_name = admin_user.username if admin_user and admin_user.is_authenticated else 'system'

    # 2. Capability Bundling: If permission_id is a Major Feature bundle
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

    # 3. Fallback to individual Perm code/id if single API is targeted
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


