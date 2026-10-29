import api from "@/shared/services/axios";
import { getSelectOptions } from "@/apps/admin/services/dropdownService";

/**
 * Fetch Main Reports List from Backend
 * Endpoint: POST /adm/fetch_reports
 * Body: {} or { search: "query" }
 */
export const fetchReportsAdmin = async (search = "") => {
  const query =
    typeof search === "string" &&
    search.trim() !== "" &&
    search !== "all" &&
    search !== "recentlyViewed"
      ? search.trim()
      : "";

  const payload = query ? { search: query } : {};
  const response = await api.post("/adm/fetch_reports", payload);
  return response.data;
};

/**
 * Fetch Download Logs History
 * Endpoint: GET /adm/reports/download-logs
 */
export const fetchDownloadLogsAdmin = async () => {
  const response = await api.get("/adm/reports/download-logs");
  return response.data;
};

/**
 * Fetch User Report Data Table
 * Endpoint: POST /adm/fetch_user_report
 */
export const fetchUserReportAdmin = async (filters = {}) => {
  const response = await api.post("/adm/fetch_user_report", filters);
  return response.data;
};

/**
 * Execute & Fetch Dynamic Report Data
 * Endpoint: POST /adm/execute_reports
 * Body: { report_key, date_filter, from_date, to_date, search, user_id, page, limit }
 */
export const executeReportAdmin = async (payload = {}) => {
  const response = await api.post("/adm/execute_reports", payload);
  return response.data;
};

/**
 * Fetch Telecallers Dropdown List
 * Endpoint: POST /adm/get_select_options
 * Body: { field: "L_TELECALLERS" }
 */
export const fetchUsersDropdownAdmin = async () => {
  return await getSelectOptions("L_TELECALLERS");
};

/**
 * Fetch Reporting Managers Dropdown List
 * Endpoint: POST /adm/get_select_options
 * Body: { field: "L_REPORTING_MANAGERS" }
 */
export const fetchReportingManagersDropdownAdmin = async () => {
  return await getSelectOptions("L_REPORTING_MANAGERS");
};

/**
 * Fetch Pipelines / Categories Dropdown List
 * Endpoint: POST /adm/get_select_options
 * Body: { field: "L_CATEGORIES" }
 */
export const fetchPipelinesDropdownAdmin = async () => {
  return await getSelectOptions("L_CATEGORIES");
};

/**
 * Fetch Campaign Names Dropdown List
 * Endpoint: POST /adm/get_select_options
 * Body: { field: "L_CAMPAIGN_NAMES" } or { field: "L_CAMPAIGN_NAMES", opt_filter: { pipeline_id: <pipelineId>, category_id: <pipelineId> } }
 */
export const fetchCampaignsDropdownAdmin = async (pipelineId) => {
  const hasFilter =
    pipelineId !== undefined &&
    pipelineId !== null &&
    pipelineId !== "" &&
    pipelineId !== "All";

  if (!hasFilter) {
    return await getSelectOptions("L_CAMPAIGN_NAMES");
  }

  const id =
    typeof pipelineId === "number"
      ? pipelineId
      : !isNaN(Number(pipelineId)) && String(pipelineId).trim() !== ""
        ? Number(pipelineId)
        : pipelineId;

  const optFilter = {
    pipeline_id: id,
  };

  return await getSelectOptions("L_CAMPAIGN_NAMES", optFilter);
};

/**
 * Export Report Data to File (Excel / CSV / PDF)
 * Endpoint: POST /adm/export_data_api
 */
export const exportReportAdmin = async (payload = {}) => {
  const response = await api.post("/adm/export_data_api", payload);
  return response.data;
};

/**
 * Track Report View
 * Endpoint: POST /adm/reports_track_view
 * Body: { report_key: "user_report" }
 */
export const trackReportViewAdmin = async (reportKey) => {
  try {
    const response = await api.post("/adm/reports_track_view", {
      report_key: reportKey,
    });
    return response.data;
  } catch (error) {
    console.error("Error tracking report view:", error);
  }
};

/**
 * Fetch Recently Viewed Reports List
 * Endpoint: POST /adm/reports_recently_viewed
 * Body: {} or { limit: 5 }
 */
export const fetchRecentlyViewedReportsAdmin = async (limit = 5) => {
  try {
    const payload = limit ? { limit } : {};
    const response = await api.post("/adm/reports_recently_viewed", payload);
    return response.data;
  } catch (error) {
    console.error("Error fetching recently viewed reports:", error);
    throw error;
  }
};
