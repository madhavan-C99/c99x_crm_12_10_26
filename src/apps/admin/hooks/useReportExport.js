import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createExport } from "@/apps/admin/services/exportService";

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
 * Custom hook to handle generic async export across all admin reports pages
 * @param {Object} options
 * @param {string} options.reportKey - Backend report identifier
 * @param {Function|Object} options.getFilters - Returns active filter parameters
 * @param {Array} options.columns - Available / visible columns
 */
export default function useReportExport({ reportKey, getFilters, columns = [] }) {
  const navigate = useNavigate();
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadStartedOpen, setDownloadStartedOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openDownloadModal = useCallback(() => {
    setDownloadModalOpen(true);
  }, []);

  const closeDownloadModal = useCallback(() => {
    if (!isSubmitting) {
      setDownloadModalOpen(false);
    }
  }, [isSubmitting]);

  const closeDownloadStarted = useCallback(() => {
    setDownloadStartedOpen(false);
  }, []);

  const handleViewLogs = useCallback(() => {
    setDownloadStartedOpen(false);
    navigate("/admin/download-logs");
  }, [navigate]);

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
        
        // Clean filters: remove undefined, null or empty strings if appropriate, or keep as is
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

        await createExport(payload);

        // Close report download modal
        setDownloadModalOpen(false);

        // Open Download Started notification dialog
        setDownloadStartedOpen(true);

        toast.success("Export started! Check Download Logs for status.");
      } catch (error) {
        console.error("Export error:", error);
        const errMsg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to start export. Please try again.";
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
    downloadStartedOpen,
    closeDownloadStarted,
    handleViewLogs,
    isSubmitting,
    handleDownloadSubmit,
  };
}
