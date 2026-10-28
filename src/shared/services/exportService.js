import api from "@/shared/services/axios";
export { triggerDirectFileDownload } from "@/apps/admin/services/exportService";

/**
 * The ONE export API (Django ExportDataApi) used by every page.
 *
 * payload  : { entity, export_format, selected_columns, columns, filters }
 * response : { data: { download_url, file_name, ... }, message }
 */
export const exportData = (payload) =>
  api.post("/adm/export_data_api", payload);
