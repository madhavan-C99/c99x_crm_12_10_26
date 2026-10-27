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
 * @param {Object} payload - { entity: "admin_dashboard", file_format, filters: { date_filter, from_date, to_date, pipeline_id, campaign_id } }
 */
export const exportDashboardReport = async (payload = {}) => {
  const fileFormat = payload.file_format || payload.format || "excel";
  const requestBody = {
    entity: "admin_dashboard",
    export_type: "admin_dashboard",
    file_format: fileFormat,
    format: fileFormat,
    filters: {
      date_filter: payload.filters?.date_filter || payload.date_filter || "Today",
      from_date: payload.filters?.from_date ?? payload.from_date ?? null,
      to_date: payload.filters?.to_date ?? payload.to_date ?? null,
      pipeline_id: payload.filters?.pipeline_id ?? payload.pipeline_id ?? null,
      campaign_id: payload.filters?.campaign_id ?? payload.campaign_id ?? null,
      ...(payload.filters || {}),
    },
    pipeline_id: payload.pipeline_id ?? payload.filters?.pipeline_id ?? null,
    campaign_id: payload.campaign_id ?? payload.filters?.campaign_id ?? null,
    date_filter: payload.date_filter || payload.filters?.date_filter || "Today",
    from_date: payload.from_date ?? payload.filters?.from_date ?? null,
    to_date: payload.to_date ?? payload.filters?.to_date ?? null,
    ...payload,
  };
  const response = await api.post("/adm/export_data_api", requestBody);
  return response.data;
};
