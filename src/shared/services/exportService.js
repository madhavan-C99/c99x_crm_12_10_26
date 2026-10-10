import api from "@/shared/services/axios";
import { API_BASE_URL } from "@/shared/config/env";

/**
 * The ONE export API (Django ExportDataApi).
 * payload: { entity, export_format, columns: [...], filters: {...} }
 * response: { data: {...}, status, total_exported, file_name, download_url }
 */
export const exportData = (payload) => api.post("/adm/export_data_api", payload);

/** Downloads the generated file (token header is sent, so protected media works too). */
export const downloadExportFile = async (downloadUrl, fileName) => {
  const url = /^https?:\/\//i.test(downloadUrl) ? downloadUrl : `${API_BASE_URL}${downloadUrl}`;
  const response = await api.get(url, { responseType: "blob" });

  const blobUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};
