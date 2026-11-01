import api from "@/shared/services/axios";
import { API_BASE_URL } from "@/shared/config/env";

export const EXPORT_ENDPOINTS = {
  CREATE_EXPORT: "/adm/export_data_api",
  FETCH_LOGS: "/adm/export_logs",
  FETCH_DOWNLOAD_URL: "/adm/export_download",
};

/**
 * 1. Export Request Create (Synchronous or Queue)
 * POST /adm/export_data_api
 * @param {Object} payload - { report_key, view_type, file_format, columns, filters }
 */
export const createExport = async (payload = {}) => {
  const response = await api.post(EXPORT_ENDPOINTS.CREATE_EXPORT, payload, {
    timeout: 180_000,
  });
  return response.data;
};

// Alias used across legacy and shared hooks
export const exportData = createExport;

/**
 * 2. Download Logs List (Export History Table)
 * POST /adm/export_logs
 * @param {Object} params - { page: 1, limit: 25 }
 */
export const getExportLogs = async ({ page = 1, limit = 25 } = {}) => {
  const response = await api.post(EXPORT_ENDPOINTS.FETCH_LOGS, { page, limit }, {
    timeout: 180_000,
  });
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
  }, {
    timeout: 180_000,
  });
  return response.data;
};

/**
 * 4. Downloads the export file securely as a blob using the Axios instance (sending auth headers).
 * Extracts filename and triggers client download, revoking ObjectURL after completion.
 * @param {number|string} exportId
 * @param {string} [fallbackFileName]
 */
export const downloadExport = async (
  exportId,
  fallbackFileName = "report.xlsx",
) => {
  const urlRes = await fetchExportDownloadUrl(exportId);
  const payload = urlRes?.data?.data || urlRes?.data || urlRes || {};
  const downloadUrl = payload?.download_url || urlRes?.download_url;
  const fileName = payload?.file_name || urlRes?.file_name || fallbackFileName;

  if (!downloadUrl) {
    throw new Error(
      urlRes?.message || payload?.message || "Download URL not available",
    );
  }

  return triggerDirectFileDownload(downloadUrl, fileName);
};

/**
 * 5. Direct Browser Download for a given URL (Instant Download)
 * Authenticated blob fetch with fallback to direct anchor click
 * @param {string} downloadUrl
 * @param {string} [fallbackFileName]
 * @param {Function} [onProgress]
 */
export const triggerDirectFileDownload = async (
  downloadUrl,
  fallbackFileName = "report.xlsx",
  onProgress = null,
) => {
  if (!downloadUrl) throw new Error("No download URL provided");

  let fullUrl = /^https?:\/\//i.test(downloadUrl)
    ? downloadUrl
    : `${API_BASE_URL}${downloadUrl.startsWith("/") ? "" : "/"}${downloadUrl}`;

  // If API_BASE_URL is HTTPS (e.g. ngrok), enforce HTTPS on fullUrl.
  // This prevents ngrok from returning a 301 redirect on HTTP, which browser CORS preflight rejects.
  if (API_BASE_URL.startsWith("https://") && fullUrl.startsWith("http://")) {
    fullUrl = fullUrl.replace(/^http:\/\//i, "https://");
  }

  try {
    const fileRes = await api.get(fullUrl, {
      responseType: "blob",
      timeout: 180_000,
      onDownloadProgress: (progressEvent) => {
        if (typeof onProgress === "function") {
          const total = progressEvent.total || 0;
          const loaded = progressEvent.loaded || 0;
          const percent =
            total > 0 ? Math.min(100, Math.round((loaded * 100) / total)) : 100;
          onProgress({ loaded, total, percent });
        }
      },
    });

    let resolvedFileName = fallbackFileName;
    const disposition = fileRes.headers?.["content-disposition"];
    if (disposition && disposition.includes("filename=")) {
      const filenameMatch = disposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
      );
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
    link.remove();

    setTimeout(() => window.URL.revokeObjectURL(objectUrl), 10_000);
    return { success: true, fileName: resolvedFileName };
  } catch (err) {
    console.warn(
      "Axios blob download failed, trying plain fetch fallback:",
      err,
    );

    try {
      // Fallback: standard fetch without Axios preflight headers
      const res = await fetch(fullUrl);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`, { cause: err });
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.setAttribute("download", fallbackFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 10_000);
      return { success: true, fileName: fallbackFileName };
    } catch (fallbackErr) {
      console.error("All download attempts failed:", fallbackErr);
      // Do NOT report success when the file could not be downloaded.
      const errMsg = fallbackErr?.message || err?.message || "Failed to download file. Please check connection and try again.";
      throw new Error(`Download failed: ${errMsg}`, { cause: fallbackErr });
    }
  }
};

export default {
  createExport,
  exportData,
  getExportLogs,
  fetchExportDownloadUrl,
  downloadExport,
  triggerDirectFileDownload,
};
