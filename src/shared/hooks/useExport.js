import { useCallback, useState } from "react";
import { exportData } from "@/shared/services/exportService";
import { API_BASE_URL } from "@/shared/config/env";
import {
  ENTITY_BY_PAGE,
  EXPORT_ENTITIES,
} from "@/shared/config/exportEntities";
import { getColumnsFromRows } from "@/shared/utils/exportColumns";
import { exportSheetsToExcel } from "@/shared/utils/excelExport";
import dayjs from "dayjs";

/** The API may return a relative media path - make it absolute. */
const toAbsoluteUrl = (url) =>
  /^https?:\/\//i.test(url)
    ? url
    : `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;

const openDownload = (url) => {
  const link = document.createElement("a");
  link.href = toAbsoluteUrl(url);
  link.target = "_blank";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

/**
 * Logic of every "Export" button (admin and telecalling use the same flow):
 *   1. click Export        -> column picker opens (all columns of that page, ticked)
 *   2. user picks columns  -> Export
 *   3. ONE call            -> POST /adm/export_data_api
 *        { entity, export_format: "excel", selected_columns: [...], columns: [...], filters: {...} }
 *   4. response.download_url is opened, the browser downloads the Excel
 *
 * @param {object}   options
 * @param {string}   [options.entity]            backend entity ("leads", "pending_payments", ...)
 * @param {string}   [options.pageName]          page key, used when `entity` is not given
 * @param {object[]} [options.columns]           [{ id, label }] - overrides the default list of the entity
 * @param {object[]} [options.rows]              table rows - only used when the entity has no fixed column list
 * @param {string[]} [options.excludeColumns]   row keys to hide from the picker (rows mode only)
 * @param {Function} [options.buildSheets]      CLIENT mode: (selectedKeys) => ({ sheets, warning }) - the Excel is built
 *                                              in the browser from data already on screen (no API call). Needs `columns`.
 * @param {string}   [options.fileName]          file name prefix for client mode
 * @param {Function} [options.getExportPayload]  () => the filters currently applied on the page
 * @param {string}   [options.exportFormat]      "excel" (default) | "csv" | "pdf"
 */
export default function useExport({
  entity,
  pageName,
  columns,
  rows,
  excludeColumns,
  buildSheets,
  fileName,
  getExportPayload,
  exportFormat = "excel",
}) {
  const resolvedEntity = entity || ENTITY_BY_PAGE[pageName] || pageName;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [columnList, setColumnList] = useState([]);
  const [notice, setNotice] = useState(null); // { severity, message }

  const notify = useCallback(
    (severity, message) => setNotice({ severity, message }),
    [],
  );
  const clearNotice = useCallback(() => setNotice(null), []);

  const openDialog = useCallback(() => {
    const list =
      columns ||
      EXPORT_ENTITIES[resolvedEntity]?.columns ||
      getColumnsFromRows(rows, { excludeKeys: excludeColumns });

    if (!list.length) {
      notify("error", "No data available to export.");
      return;
    }
    setColumnList(list);
    setDialogOpen(true);
  }, [columns, resolvedEntity, rows, excludeColumns, notify]);

  const closeDialog = useCallback(() => setDialogOpen(false), []);

  const runExport = useCallback(
    async (selectedKeys) => {
      if (!selectedKeys?.length) {
        notify("error", "Please select at least one column.");
        return;
      }
      // CLIENT mode: build the workbook here (used by the pipeline board: one sheet per stage)
      if (buildSheets) {
        try {
          setIsExporting(true);
          const { sheets, warning } = await buildSheets(selectedKeys);
          if (!sheets?.length) {
            notify("error", "No data to export.");
            return;
          }
          await exportSheetsToExcel(
            sheets,
            `${fileName || resolvedEntity || "export"}-${dayjs().format("YYYY-MM-DD")}.xlsx`,
          );
          notify(
            warning ? "warning" : "success",
            warning || "Your Excel file has been downloaded.",
          );
        } catch (err) {
          console.error("Export error:", err);
          notify("error", "Export failed. Please try again.");
        } finally {
          setIsExporting(false);
        }
        return;
      }

      if (!resolvedEntity) {
        notify("error", `Export is not configured for "${pageName}".`);
        return;
      }

      try {
        setIsExporting(true);
        notify("info", "Generating Excel file from server...");

        const response = await exportData({
          entity: resolvedEntity,
          file_format: exportFormat,
          // selected_columns: selectedKeys,
          // columns: selectedKeys,
          filters: getExportPayload ? getExportPayload() : {},
        });

        const body = response?.data || {};
        const result = body.data || body;
        const downloadUrl =
          result.download_url || body.download_url || result.file_url;

        if (!downloadUrl) {
          notify(
            "error",
            result.message ||
              body.message ||
              "Export failed. No download URL returned from server.",
          );
          return;
        }

        openDownload(downloadUrl);
        notify(
          "success",
          body.message ||
            result.message ||
            "Your file has been exported successfully.",
        );
      } catch (err) {
        console.error("Export error:", err?.response?.data || err);
        notify(
          "error",
          err?.response?.data?.message ||
            err?.response?.data?.detail ||
            "Export failed. Please try again.",
        );
      } finally {
        setIsExporting(false);
      }
    },
    [
      resolvedEntity,
      pageName,
      exportFormat,
      getExportPayload,
      buildSheets,
      fileName,
      notify,
    ],
  );

  return {
    dialogOpen,
    isExporting,
    columnList,
    notice,
    clearNotice,
    openDialog,
    closeDialog,
    runExport,
  };
}
