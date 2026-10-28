import ExportModal from "@/apps/admin/components/common/ExportModal";
import { triggerDirectFileDownload } from "@/apps/admin/services/exportService";
import React, { useState, useEffect, useRef } from "react";
import { Dialog, Box, Typography, Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import useDebounce from "@/shared/hooks/useDebounce";
import LossLeadApprovalHeader from "@/apps/admin/components/lossLeadApproval/LossLeadApprovalHeader";
import LossLeadApprovalFilter from "@/apps/admin/components/lossLeadApproval/LossLeadApprovalFilter";
import LossLeadApprovalTable from "@/apps/admin/components/lossLeadApproval/LossLeadApprovalTable";
import RejectLossRequestModal from "@/apps/admin/components/lossLeadApproval/RejectLossRequestModal";
import ApproveLossRequestModal from "@/apps/admin/components/lossLeadApproval/ApproveLossRequestModal";
import ReassignLeadModal from "@/apps/admin/components/common/ReassignLeadModal";
import {
  fetchLossLeadApprovalRequests,
  exportLossLeadApprovalRequests,
} from "@/apps/admin/services/leadService";

import { getSelectOptions } from "@/apps/admin/services/dropdownService";

export default function LossLeadApproval() {
  const [pipelinesList, setPipelinesList] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);

  useEffect(() => {
    getSelectOptions("L_CATEGORIES")
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setPipelinesList(cats);
          const initialId = cats[0].id ?? cats[0].value;
          setSelectedPipeline(initialId);
        }
      })
      .catch(() => null);
  }, []);

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [filterType, setFilterType] = useState("this_month");
  const [sortType, setSortType] = useState("newest");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    loss_reason: "All",
    telecaller: "All",
    course: "All",
    lead_source: "All",
  });

  // Server-Side Pagination States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const abortControllerRef = useRef(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRejectLead, setSelectedRejectLead] = useState(null);

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedApproveLead, setSelectedApproveLead] = useState(null);

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedReassignLead, setSelectedReassignLead] = useState(null);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastOpen(true);
    setTimeout(() => {
      setToastOpen(false);
    }, 3000);
  };

  const getComputedDates = (type, customFrom, customTo) => {
    const today = new Date();
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (type === "today") {
      const tStr = formatDate(today);
      return { from: tStr, to: tStr };
    } else if (type === "yesterday") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = formatDate(y);
      return { from: yStr, to: yStr };
    } else if (type === "last_7_days" || type === "weekly" || type === "week") {
      const past7 = new Date(today);
      past7.setDate(past7.getDate() - 7);
      return { from: formatDate(past7), to: formatDate(today) };
    } else if (type === "last_30_days") {
      const past30 = new Date(today);
      past30.setDate(past30.getDate() - 30);
      return { from: formatDate(past30), to: formatDate(today) };
    } else if (
      type === "this_month" ||
      type === "monthly" ||
      type === "month"
    ) {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: formatDate(startOfMonth), to: formatDate(today) };
    } else if (type === "this_year" || type === "yearly" || type === "year") {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return { from: formatDate(startOfYear), to: formatDate(today) };
    } else if (type === "last_year" || type === "last year") {
      const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
      const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31);
      return {
        from: formatDate(startOfLastYear),
        to: formatDate(endOfLastYear),
      };
    } else if (type === "custom" || type === "custom_date") {
      return { from: customFrom || "", to: customTo || "" };
    }
    return { from: "", to: "" };
  };

  const loadData = async (targetPage = page, targetPageSize = pageSize) => {
    if (!selectedPipeline) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      const dates = getComputedDates(filterType, fromDate, toDate);
      const payload = {
        pipeline_id: Number(selectedPipeline),
        date_filter_type: filterType,
        from_date: dates.from || "",
        to_date: dates.to || "",
        search: debouncedSearchTerm || "",
        search_key: debouncedSearchTerm || "",
        sort_type: sortType || "newest",
        sort_order: sortType || "newest",
        loss_reason:
          selectedFilters.loss_reason !== "All"
            ? selectedFilters.loss_reason
            : "",
        telecaller:
          selectedFilters.telecaller !== "All"
            ? selectedFilters.telecaller
            : "",
        course: selectedFilters.course !== "All" ? selectedFilters.course : "",
        lead_source:
          selectedFilters.lead_source !== "All"
            ? selectedFilters.lead_source
            : "",
        page: targetPage,
        page_size: targetPageSize,
      };

      const res = await fetchLossLeadApprovalRequests(payload, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      const resData = res?.data?.data || res?.data?.result || res?.data;
      const requests =
        resData?.requests ||
        resData?.leads ||
        resData?.data ||
        (Array.isArray(resData) ? resData : []);

      const totalRec =
        resData?.total_records ??
        resData?.total_count ??
        res?.data?.total_records ??
        res?.data?.total_count ??
        (Array.isArray(requests) ? requests.length : 0);

      const totalPg =
        resData?.total_pages ??
        resData?.total_page ??
        (Math.ceil(totalRec / targetPageSize) || 1);

      if (controller.signal.aborted) return;

      setTableData(requests);
      setTotalRecords(totalRec);
      setTotalPages(totalPg);
    } catch (err) {
      if (
        err?.name === "CanceledError" ||
        err?.name === "AbortError" ||
        err?.code === "ERR_CANCELED"
      ) {
        return;
      }
      console.warn("fetchLossLeadApprovalRequests error:", err);
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  };

  const selectedFiltersStr = JSON.stringify(selectedFilters);

  const prevFiltersRef = useRef({
    selectedPipeline,
    filterType,
    sortType,
    fromDate,
    toDate,
    debouncedSearchTerm,
    selectedFiltersStr,
  });

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const filtersChanged =
      prev.selectedPipeline !== selectedPipeline ||
      prev.filterType !== filterType ||
      prev.sortType !== sortType ||
      prev.fromDate !== fromDate ||
      prev.toDate !== toDate ||
      prev.debouncedSearchTerm !== debouncedSearchTerm ||
      prev.selectedFiltersStr !== selectedFiltersStr;

    prevFiltersRef.current = {
      selectedPipeline,
      filterType,
      sortType,
      fromDate,
      toDate,
      debouncedSearchTerm,
      selectedFiltersStr,
    };

    if (filtersChanged && page !== 1) {
      setPage(1);
      return;
    }

    loadData(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedPipeline,
    filterType,
    sortType,
    fromDate,
    toDate,
    debouncedSearchTerm,
    selectedFiltersStr,
    page,
    pageSize,
  ]);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const lossLeadExportColumns = [
    { id: "s_no", backendKey: "s_no", label: "S.No" },
    { id: "name", backendKey: "name", label: "Student Name" },
    { id: "contact", backendKey: "contact", label: "Contact Number" },
    {
      id: "assigned_to",
      backendKey: "assigned_to",
      label: "Assigned Telecaller",
    },
    {
      id: "effort_summary",
      backendKey: "effort_summary",
      label: "Effort Summary",
    },
    { id: "loss_reason", backendKey: "loss_reason", label: "Loss Reason" },
    {
      id: "last_conversation_outcome",
      backendKey: "last_conversation_outcome",
      label: "Last Conversation Outcome",
    },
    {
      id: "last_contacted",
      backendKey: "last_contacted",
      label: "Last Contacted Date",
    },
    { id: "inquiry_date", backendKey: "inquiry_date", label: "Inquiry Date" },
    { id: "lead_age", backendKey: "lead_age", label: "Lead Age" },
  ];

  const handleExport = async (selectedKeys, format = "excel") => {
    setExportLoading(true);
    try {
      const dates = getComputedDates(filterType, fromDate, toDate);
      const filtersPayload = {
        pipeline_id: selectedPipeline ? Number(selectedPipeline) : undefined,
        date_filter_type: filterType,
        from_date: dates.from || "",
        to_date: dates.to || "",
        search: debouncedSearchTerm || "",
        search_key: debouncedSearchTerm || "",
        sort_type: sortType || "newest",
        sort_order: sortType || "newest",
        loss_reason:
          selectedFilters.loss_reason !== "All"
            ? selectedFilters.loss_reason
            : "",
        telecaller:
          selectedFilters.telecaller !== "All"
            ? selectedFilters.telecaller
            : "",
        course: selectedFilters.course !== "All" ? selectedFilters.course : "",
        lead_source:
          selectedFilters.lead_source !== "All"
            ? selectedFilters.lead_source
            : "",
      };

      const payload = {
        entity: "loss_lead_approval",
        export_format: format || "excel",
        selected_columns:
          selectedKeys && Array.isArray(selectedKeys) && selectedKeys.length > 0
            ? selectedKeys
            : lossLeadExportColumns.map((c) => c.backendKey),
        filters: filtersPayload,
      };

      const res = await exportLossLeadApprovalRequests(payload);
      const resData = res?.data || res;
      const resultObj = resData?.data || resData;

      let downloadUrl =
        resultObj?.download_url || resData?.download_url || resultObj?.file_url;
      const fileName =
        resultObj?.file_name ||
        resData?.file_name ||
        `Loss_Lead_Approval_${Date.now()}.${format === "excel" ? "xlsx" : format}`;

      if (downloadUrl) {
        await triggerDirectFileDownload(downloadUrl, fileName);
        showToast(
          resData?.message ||
            resultObj?.message ||
            "The loss lead approval data is successfully exported",
        );
      } else {
        showToast(
          "Failed to export loss lead approval requests: No download URL",
        );
      }
    } catch (err) {
      console.error("Export error:", err);
      showToast("Failed to export loss lead approval requests");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <Box sx={{ pr: 3 }}>
      <LossLeadApprovalHeader
        pipelines={pipelinesList}
        selectedPipeline={selectedPipeline}
        onPipelineChange={setSelectedPipeline}
        onExport={() => setIsExportModalOpen(true)}
      />
      <LossLeadApprovalFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        sortType={sortType}
        setSortType={setSortType}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        selectedFilters={selectedFilters}
        setSelectedFilters={setSelectedFilters}
        tableData={tableData}
      />
      <LossLeadApprovalTable
        tableData={tableData}
        loading={loading}
        page={page}
        pageSize={pageSize}
        totalRecords={totalRecords}
        onPageChange={(event, newPage) => {
          setPage(newPage + 1);
        }}
        onRowsPerPageChange={(event) => {
          const newSize = parseInt(event.target.value, 10);
          setPageSize(newSize);
          setPage(1);
        }}
        onApprove={(row) => {
          setSelectedApproveLead(row);
          setApproveModalOpen(true);
        }}
        onReject={(row) => {
          setSelectedRejectLead(row);
          setRejectModalOpen(true);
        }}
        onReassign={(row) => {
          setSelectedReassignLead(row);
          setReassignModalOpen(true);
        }}
      />

      <RejectLossRequestModal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        lead={selectedRejectLead}
        onSubmitSuccess={async (payload) => {
          showToast(
            payload?.message ||
              "The loss lead request is successfully rejected!",
          );
          loadData();
        }}
      />

      <ApproveLossRequestModal
        open={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        lead={selectedApproveLead}
        onSubmitSuccess={async (payload) => {
          showToast(
            payload?.message || "The lead is successfully marked as lost!",
          );
          loadData();
        }}
      />

      <ReassignLeadModal
        open={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        lead={selectedReassignLead}
        onSubmitSuccess={async (payload) => {
          showToast(payload?.message || "The lead is successfully reassigned!");
          loadData();
        }}
      />

      {/* Top-Centered Pill Toast Notification (Matching Figma Screenshot) */}
      {toastOpen && (
        <Box
          sx={{
            position: "fixed",
            top: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 99999,
            backgroundColor: "#FFFFFF",
            border: "1.5px solid #84CC16",
            borderRadius: "50px",
            px: 3,
            py: 1.2,
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            boxShadow:
              "0px 8px 24px rgba(132, 204, 22, 0.25), 0px 2px 8px rgba(0, 0, 0, 0.08)",
            animation: "fadeInDown 0.3s ease-in-out",
            "@keyframes fadeInDown": {
              "0%": { opacity: 0, transform: "translate(-50%, -20px)" },
              "100%": { opacity: 1, transform: "translate(-50%, 0)" },
            },
          }}
        >
          <CheckCircleIcon sx={{ color: "#84CC16", fontSize: 22 }} />
          <Typography
            sx={{
              fontSize: "14.5px",
              fontWeight: 600,
              color: "#0F172A",
              letterSpacing: "0.1px",
            }}
          >
            {toastMsg}
          </Typography>
        </Box>
      )}
      <ExportModal
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="Loss Lead Approval"
        columns={lossLeadExportColumns}
        availableFormats={["xlsx", "csv", "pdf"]}
        isSubmitting={exportLoading}
        onDownload={async ({ fileFormat, selectedKeys }) => {
          await handleExport(
            selectedKeys,
            fileFormat === "xlsx" ? "excel" : fileFormat,
          );
          setIsExportModalOpen(false);
        }}
      />
    </Box>
  );
}
