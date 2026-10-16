import api from "@/shared/services/axios";

/**
 * 1. Fetch Dashboard Pending Payments List
 * Method: POST
 * URL: /adm/dashboard_pending_payments
 * @param {Object} payload - { pipeline_id, campaign_id, date_filter }
 */
export const fetchDashboardPendingPayments = async (payload) => {
  const response = await api.post("/adm/dashboard_pending_payments", payload);
  return response.data;
};

/**
 * 2. Fetch Dashboard Performance Overview Table
 * Method: POST
 * URL: /adm/dashboard_performance_overview
 * @param {Object} payload - { pipeline_id, campaign_id, date_filter }
 */
export const fetchDashboardPerformanceOverview = async (payload) => {
  const response = await api.post("/adm/dashboard_performance_overview", payload);
  return response.data;
};

/**
 * 3. Fetch Dashboard Best Performer Card
 * Method: POST
 * URL: /adm/dashboard_best_performer
 * @param {Object} payload - { pipeline_id, campaign_id, date_filter }
 */
export const fetchDashboardBestPerformer = async (payload) => {
  const response = await api.post("/adm/dashboard_best_performer", payload);
  return response.data;
};

/**
 * 4. Export Dashboard Report (Excel / PDF)
 * Method: POST
 * URL: /adm/export_data_api
 * @param {Object} payload - { export_type: "admin_dashboard", pipeline_id, campaign_id, date_filter, format }
 */
export const exportDashboardReport = async (payload) => {
  const response = await api.post("/adm/export_data_api", {
    export_type: "admin_dashboard",
    ...payload,
  });
  return response.data;
};
