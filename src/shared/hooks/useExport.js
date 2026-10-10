import { useCallback, useState } from "react";
import { exportData, downloadExportFile } from "@/shared/services/exportService";
import { getColumnsFromRows } from "@/shared/utils/exportColumns";

// frontend page name -> entity the backend (ExportDataApi) understands
const ENTITY_BY_PAGE = {
  lead: "leads",
  leads: "leads",
  "pending-payments": "pending_payments",
  pending_payments: "pending_payments",
  "loss-approvals": "loss_approvals",
  loss_approvals: "loss_approvals",
  performance: "performance",
};

/**
 * All the logic behind an "Export" button (single API):
 *   1. columns  = field names of the rows the table already got from its list API
 *   2. user picks columns
 *   3. ONE call: POST /adm/export_data_api { entity, columns, filters }
 *   4. download the file from response.download_url
 *
 * @param {object}   options
 * @param {string}   options.pageName           page key (mapped to a backend entity)
 * @param {object[]} options.rows               table rows from the list API response
 * @param {string[]} [options.excludeColumns]   response keys to hide from the picker
 * @param {Function} [options.getExportPayload] () => current filters (same payload the list API uses)
 * @param {string}   [options.entity]           override the page -> entity mapping
 * @param {string}   [options.exportFormat]     "excel" (default) | "csv" | "pdf"
 */
export default function useExport({
  pageName,
  rows,
  excludeColumns,
  getExportPayload,
  entity,
  exportFormat = "excel",
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [columnList, setColumnList] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [notice, setNotice] = useState(null); // { severity, message }

  const notify = useCallback((severity, message) => setNotice({ severity, message }), []);
  const clearNotice = useCallback(() => setNotice(null), []);

  const openDialog = useCallback(() => {
    const columns = getColumnsFromRows(rows, { excludeKeys: excludeColumns });
    if (!columns.length) {
      notify("error", "No data available to export.");
      return;
    }
    setColumnList(columns);
    setSelectedColumns(columns.map((c) => c.key));
    setDialogOpen(true);
  }, [rows, excludeColumns, notify]);

  const closeDialog = useCallback(() => setDialogOpen(false), []);

  const toggleColumn = useCallback((key) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  const selectAll = useCallback(
    () => setSelectedColumns(columnList.map((c) => c.key)),
    [columnList],
  );
  const clearAll = useCallback(() => setSelectedColumns([]), []);

  const runExport = useCallback(async () => {
    if (!selectedColumns.length) {
      notify("error", "Please select at least one column.");
      return;
    }

    const resolvedEntity = entity || ENTITY_BY_PAGE[pageName];
    if (!resolvedEntity) {
      notify("error", `Export is not configured for "${pageName}".`);
      return;
    }

    try {
      setIsExporting(true);

      const response = await exportData({
        entity: resolvedEntity,
        export_format: exportFormat,
        selected_columns: selectedColumns,
        filters: getExportPayload ? getExportPayload() : {},
      });

      const result = response?.data?.data || response?.data || {};
      if (!result.download_url) {
        notify("error", result.message || "No data to export");
        return;
      }

      await downloadExportFile(result.download_url, result.file_name || `${resolvedEntity}-export`);
      notify("success", "Your file has been downloaded successfully.");
    } catch (err) {
      console.error("Export error:", err?.response?.data || err);
      notify("error", err?.response?.data?.detail || "Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [selectedColumns, entity, pageName, exportFormat, getExportPayload, notify]);

  return {
    dialogOpen,
    isExporting,
    columnList,
    selectedColumns,
    notice,
    clearNotice,
    openDialog,
    closeDialog,
    toggleColumn,
    selectAll,
    clearAll,
    runExport,
  };
}
