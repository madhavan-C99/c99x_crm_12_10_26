import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import {
  createExport,
  triggerDirectFileDownload,
} from "@/apps/admin/services/exportService";

/**
 * Normalizes columns array for backend export API
 * Supports array of strings ["User Name"] or array of objects [{ field, headerName }]
 */
const formatColumnsForExport = (cols = []) => {
  if (!Array.isArray(cols)) return [];
  return cols.map((col) => {
    if (typeof col === "string") {
      return {
        field: col.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_"),
        headerName: col,
      };
    }
    if (col && typeof col === "object") {
      return {
        field: col.field || col.headerName?.toLowerCase().replace(/[^a-z0-9]+/g, "_") || "",
        headerName: col.headerName || col.field || "",
      };
    }
    return { field: String(col), headerName: String(col) };
  });
};

/**
 * Custom hook to handle synchronous instant export across all admin reports pages
 * @param {Object} options
 * @param {string} options.reportKey - Backend report identifier
 * @param {Function|Object} options.getFilters - Returns active filter parameters
 * @param {Array} options.columns - Available / visible columns
 */
export default function useReportExport({ reportKey, getFilters, columns = [] }) {
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openDownloadModal = useCallback(() => {
    setDownloadModalOpen(true);
  }, []);

  const closeDownloadModal = useCallback(() => {
    if (!isSubmitting) {
      setDownloadModalOpen(false);
    }
  }, [isSubmitting]);

  const handleDownloadSubmit = useCallback(
    async (config) => {
      if (isSubmitting) return;

      const viewType = config?.viewType || "current";
      const fileFormat = config?.fileFormat;

      if (!fileFormat) {
        toast.error("Please select a file format");
        return;
      }

      setIsSubmitting(true);
      try {
        const rawFilters = typeof getFilters === "function" ? getFilters() : getFilters || {};
        const filters = { ...rawFilters };

        const exportColumns =
          viewType === "detailed" && config?.selectedColumns?.length
            ? formatColumnsForExport(config.selectedColumns)
            : formatColumnsForExport(columns);

        const payload = {
          report_key: reportKey,
          view_type: viewType,
          file_format: fileFormat,
          columns: viewType === "current" ? exportColumns : undefined,
          filters,
        };

        // Remove undefined keys from payload
        Object.keys(payload).forEach((key) => {
          if (payload[key] === undefined) delete payload[key];
        });

        const res = await createExport(payload);
        const resData = res?.data?.data || res?.data || res || {};
        const downloadUrl = resData?.download_url || res?.download_url;
        const fileName =
          resData?.file_name ||
          res?.file_name ||
          `${reportKey || "report"}_${new Date().toISOString().slice(0, 10)}.${fileFormat}`;

        // Close report download modal immediately
        setDownloadModalOpen(false);

        if (downloadUrl) {
          // 🌟 TRIGGER IMMEDIATE DOWNLOAD IN BROWSER
          await triggerDirectFileDownload(downloadUrl, fileName);
          toast.success("Report downloaded successfully!");
        } else {
          // Fallback if backend returned success message without URL
          toast.success(res?.message || resData?.message || "Export generated successfully!");
        }
      } catch (error) {
        console.error("Export error:", error);
        const errMsg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to export report. Please try again.";
        toast.error(errMsg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, reportKey, getFilters, columns]
  );

  return {
    downloadModalOpen,
    setDownloadModalOpen,
    openDownloadModal,
    closeDownloadModal,
    isSubmitting,
    handleDownloadSubmit,
  };
}
