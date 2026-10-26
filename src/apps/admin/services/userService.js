import api from "@/shared/services/axios";
import { invalidateSelectOptions } from "./dropdownService";

/**
 * Fetch all users from admin backend
 * Backend Service: fetch_all_users_admin_service
 * Endpoint: POST /adm/fetch_users_admin
 */
export const fetchUsersAdmin = async (params = {}) => {
  const payload = {
    search: params.search || undefined,
    sort_by: params.sort === "oldest" ? "oldest" : params.sort === "name_asc" ? "name_asc" : params.sort === "name_desc" ? "name_desc" : undefined,
    page: params.page || 1,
    page_size: params.limit || params.page_size || 50,
  };
  return await api.post("/adm/fetch_users_admin", payload);
};

/**
 * Create a new user
 * Backend Service: create_user_admin_service
 * Endpoint: POST /adm/create_user_admin
 */
export const createUserAdmin = async (userData) => {
  const payload = {
    full_name: userData.fullName || userData.full_name || userData.name || "",
    contact_no: userData.contactNo || userData.contact_no || userData.mobile_no || "",
    email: userData.email || "",
    location: userData.location || "",
    role: userData.role || "",
    reporting_to: userData.reportingToId || userData.reporting_to_id || userData.reportingTo || userData.reporting_to || "",
    status: userData.status || "",
    joined_date: userData.joinedDate || userData.joined_date || "",
    emp_id: userData.employeeId || userData.emp_id || "",
    team: userData.team || "",
  };
  const res = await api.post("/adm/create_user_admin", payload);
  invalidateSelectOptions("L_TELECALLERS");
  return res;
};

/**
 * Edit existing user details
 * Backend Service: edit_user_admin_service
 * Endpoint: PUT / POST /adm/edit_user_admin
 */
export const editUserAdmin = async (userData) => {
  const payload = {
    id: userData.id || userData.user_id,
    full_name: userData.fullName || userData.full_name || userData.name || "",
    contact_no: userData.contactNo || userData.contact_no || userData.mobile_no || "",
    email: userData.email || "",
    location: userData.location || "",
    role: userData.role || "",
    reporting_to: userData.reportingToId || userData.reporting_to_id || userData.reportingTo || userData.reporting_to || "",
    status: userData.status || "",
    joined_date: userData.joinedDate || userData.joined_date || "",
    emp_id: userData.employeeId || userData.emp_id || "",
    team: userData.team || "",
  };
  const res = await api.post("/adm/edit_user_admin", payload);
  invalidateSelectOptions("L_TELECALLERS");
  return res;
};

/**
 * Change user password
 * Endpoint: POST /adm/change_user_password_admin
 */
export const changeUserPasswordAdmin = async (payload = {}) => {
  const data = {
    id: Number(payload.id || payload.user_id),
    emp_id: String(payload.emp_id || payload.employee_id || payload.emp_code || ""),
    newPassword: String(payload.newPassword || payload.new_password || ""),
    confirmPassword: String(payload.confirmPassword || payload.confirm_password || payload.newPassword || payload.new_password || ""),
  };
  return await api.post("/adm/change_user_password_admin", data);
};

/**
 * Enable / Disable Lead Assignment
 * Endpoint: POST /adm/enable_disable_lead_assignment_admin
 */
export const toggleLeadAssignmentAdmin = async (payload) => {
  const data = {
    id: payload.id,
    emp_id: payload.emp_id,
    disable_lead_assignment: payload.disable_lead_assignment,
    is_lead_enabled: payload.is_lead_enabled,
  };
  return await api.post("/adm/enable_disable_lead_assignment_admin", data);
};

import dropdownService from "./dropdownService";

/**
 * Fetch dropdown options for user creation/editing (Roles, Reporting To, Teams)
 * Endpoint: GET / POST /adm/fetch_user_dropdowns_admin
 */
export const fetchUserDropdownsAdmin = async () => {
  const [roles, reporting_users, teams] = await Promise.all([
    dropdownService.getSelectOptions("L_ROLES"),
    dropdownService.getSelectOptions("L_REPORTING_MANAGERS"),
    dropdownService.getSelectOptions("L_TEAMS"),
  ]);

  return {
    data: {
      roles,
      roles_list: roles,
      role_list: roles,
      reporting_users,
      managers: reporting_users,
      managers_list: reporting_users,
      reporting_to_list: reporting_users,
      teams,
      teams_list: teams,
      team_list: teams,
    },
  };
};

/**
 * Fetch assigned campaigns for a specific user
 * Backend Endpoint: POST /adm/fetch_user_campaigns_admin
 */
export const getUserCampaignsAdmin = async (payload = {}) => {
  const data = {
    user_id: Number(payload.user_id || payload.id),
    emp_id: String(payload.emp_id || payload.employee_id || payload.emp_code || ""),
  };
  return await api.post("/adm/fetch_user_campaigns_admin", data);
};

/**
 * Toggle User Active/Inactive Status
 * Backend Endpoint: POST /adm/toggle_user_status_admin
 */
export const toggleUserStatusAdmin = async (payload = {}) => {
  const data = {
    id: Number(payload.id || payload.user_id),
    emp_id: String(payload.emp_id || payload.employee_id || payload.emp_code || ""),
    status: payload.status,
  };
  const res = await api.post("/adm/toggle_user_status_admin", data);
  invalidateSelectOptions("L_TELECALLERS");
  return res;
};

/**
 * 1. Fetch User Campaigns List API
 * Backend Endpoint: POST /adm/fetch_user_campaigns_admin
 */
export const fetchUserCampaignsAdmin = async (payload = {}) => {
  const data = {
    user_id: Number(payload.user_id || payload.id || 0),
    id: payload.id !== undefined ? Number(payload.id) : undefined,
    emp_id: payload.emp_id ? String(payload.emp_id) : undefined,
  };
  return await api.post("/adm/fetch_user_campaigns_admin", data);
};

/**
 * 2. Fetch Available Telecallers List API for Lead Transfer
 * Backend Endpoint: POST /adm/fetch_transfer_telecallers_admin
 */
export const fetchTransferTelecallersAdmin = async (payload = {}) => {
  const data = {
    from_user_id: Number(payload.from_user_id || payload.user_id || payload.id || 0),
  };
  if (payload.campaign_id !== undefined && payload.campaign_id !== null) {
    data.campaign_id = Number(payload.campaign_id);
  }
  return await api.post("/adm/fetch_transfer_telecallers_admin", data);
};

/**
 * 3. Transfer Single Campaign Leads API
 * Backend Endpoint: POST /adm/transfer_single_campaign_leads_admin
 */
export const transferSingleCampaignLeadsAdmin = async (payload = {}) => {
  const data = {
    from_user_id: Number(payload.from_user_id),
    campaign_id: Number(payload.campaign_id),
    total_leads: Number(payload.total_leads || 0),
    distributions: Array.isArray(payload.distributions) ? payload.distributions : [],
  };
  return await api.post("/adm/transfer_single_campaign_leads_admin", data);
};

/**
 * 4. Transfer ALL Campaigns Leads API
 * Backend Endpoint: POST /adm/transfer_all_campaigns_leads_admin
 */
export const transferAllCampaignsLeadsAdmin = async (payload = {}) => {
  const data = {
    from_user_id: Number(payload.from_user_id),
    to_telecaller_id: Number(payload.to_telecaller_id),
    total_campaigns: Number(payload.total_campaigns || 0),
    total_leads: Number(payload.total_leads || 0),
  };
  return await api.post("/adm/transfer_all_campaigns_leads_admin", data);
};

/**
 * Fetch User Assigned Leads & Stats API (Pre-Delete Review Modal)
 * Backend Endpoint: POST /adm/fetch_user_delete_summary_admin
 */
export const fetchUserDeleteSummaryAdmin = async (payload = {}) => {
  const data = {
    user_id: Number(payload.user_id || payload.id || 0),
    id: payload.id !== undefined ? Number(payload.id) : undefined,
    emp_id: payload.emp_id ? String(payload.emp_id) : undefined,
  };
  return await api.post("/adm/fetch_user_delete_summary_admin", data);
};

/**
 * Delete User API
 * Backend Endpoint: POST /adm/delete_user_admin
 */
export const deleteUserAdmin = async (payload = {}) => {
  const data = {
    id: Number(payload.id || payload.user_id || 0),
    emp_id: String(payload.emp_id || payload.employee_id || payload.emp_code || ""),
  };
  const res = await api.post("/adm/delete_user_admin", data);
  invalidateSelectOptions("L_TELECALLERS");
  return res;
};


