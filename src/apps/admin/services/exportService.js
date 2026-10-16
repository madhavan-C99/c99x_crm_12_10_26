import api from "@/shared/services/axios";

const EXPORT_ENDPOINTS = {
  CREATE_EXPORT: "/adm/export_data_api",
  FETCH_LOGS: "/adm/export_logs",
  FETCH_DOWNLOAD_URL: "/adm/export_download",
};

/**
 * 1. Export Request Create (Non-blocking)
 * POST /adm/export_data_api
 * @param {Object} payload - { report_key, view_type, file_format, columns, filters }
 */
export const createExport = async (payload = {}) => {
  const response = await api.post(EXPORT_ENDPOINTS.CREATE_EXPORT, payload);
  return response.data;
};

/**
 * 2. Download Logs List (Export History Table)
 * POST /adm/export_logs
 * @param {Object} params - { page: 1, limit: 25 }
 */
export const getExportLogs = async ({ page = 1, limit = 25 } = {}) => {
  const response = await api.post(EXPORT_ENDPOINTS.FETCH_LOGS, { page, limit });
  return response.data;
};

/**
 * 3. File Download API (Secure Download via Input Body)
 * POST /adm/export_download
 * @param {number|string} exportId
 */
export const fetchExportDownloadUrl = async (exportId) => {
  const response = await api.post(EXPORT_ENDPOINTS.FETCH_DOWNLOAD_URL, {
    export_id: exportId,
  });
  return response.data;
};

/**
 * Downloads the export file securely as a blob using the Axios instance (sending auth headers).
 * Extracts filename and triggers client download, revoking ObjectURL after completion.
 * @param {number|string} exportId
 * @param {string} [fallbackFileName]
 */
export const downloadExport = async (exportId, fallbackFileName = "report.xlsx") => {
  const urlRes = await fetchExportDownloadUrl(exportId);
  const payload = urlRes?.data?.data || urlRes?.data || urlRes || {};
  const downloadUrl = payload?.download_url || urlRes?.download_url;
  const fileName = payload?.file_name || urlRes?.file_name || fallbackFileName;

  if (!downloadUrl) {
    throw new Error(urlRes?.message || payload?.message || "Download URL not available");
  }

  // Request the binary file through the authenticated axios instance
  const fileRes = await api.get(downloadUrl, {
    responseType: "blob",
  });

  // Extract filename from Content-Disposition header if available
  let resolvedFileName = fileName;
  const disposition = fileRes.headers?.["content-disposition"];
  if (disposition && disposition.includes("filename=")) {
    const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      resolvedFileName = filenameMatch[1].replace(/['"]/g, "");
    }
  }

  const blob = new Blob([fileRes.data], {
    type: fileRes.headers?.["content-type"] || "application/octet-stream",
  });
  const objectUrl = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.setAttribute("download", resolvedFileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(objectUrl);
  return { success: true, fileName: resolvedFileName };
};
