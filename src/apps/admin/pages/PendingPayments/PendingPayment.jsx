import ExportModal from "@/apps/admin/components/common/ExportModal";
import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Box, Typography, Snackbar } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import useDebounce from "@/shared/hooks/useDebounce";
import PendingPaymentHeader from "@/apps/admin/components/pendingPayments/PendingPaymentHeader";
import PendingPaymentStats from "@/apps/admin/components/pendingPayments/PendingPaymentStats";
import PendingPaymentFilters from "@/apps/admin/components/pendingPayments/PendingPaymentFilters";
import PendingPaymentTable from "@/apps/admin/components/pendingPayments/PendingPaymentTable";
import {
  fetchAdminPendingPayments,
  exportAdminPendingPaymentsFile,
} from "@/apps/admin/services/pendingPaymentAdminService";

import { getSelectOptions } from "@/apps/admin/services/dropdownService";

export default function PendingPayment() {
  const location = useLocation();
  const routeState = location.state || {};

  const [pipelinesList, setPipelinesList] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(
    routeState.pipeline_id || null,
  );

  useEffect(() => {
    getSelectOptions("L_CATEGORIES")
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setPipelinesList(cats);
          const targetId = routeState.pipeline_id
            ? (cats.find((c) => (c.id ?? c.value) === routeState.pipeline_id)
                ?.id ?? routeState.pipeline_id)
            : (cats[0].id ?? cats[0].value);
          setSelectedPipeline(targetId);
        }
      })
      .catch(() => null);
  }, [routeState.pipeline_id]);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const initialFilterType = (() => {
    if (!routeState.date_filter) return "this_month";
    const df = String(routeState.date_filter).toLowerCase();
    if (df.includes("yesterday")) return "yesterday";
    if (df.includes("week") || df.includes("7")) return "last_7_days";
    if (df.includes("30")) return "last_30_days";
    if (df.includes("month")) return "this_month";
    if (df.includes("last_year")) return "last_year";
    if (df.includes("this_year") || df.includes("year")) return "this_year";
    if (df.includes("today")) return "today";
    return "this_month";
  })();
  const [filterType, setFilterType] = useState(initialFilterType);

  // Multi-field Popover Filters matching screenshot
  const [selectedFilters, setSelectedFilters] = useState({
    course_name: "All",
    course_plan: "All",
    course_time: "All",
    payment_stage: "All",
    pending_amount: "All",
  });

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortType, setSortType] = useState("newest");

  // Server-Side Pagination States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [tableData, setTableData] = useState([]);
  const [summaryCards, setSummaryCards] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const abortControllerRef = useRef(null);

  // Toast Popup state
  const [toastState, setToastState] = useState({
    open: false,
    message: "",
  });

  const handleCloseToast = () => {
    setToastState((prev) => ({ ...prev, open: false }));
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
    } else if (type === "yearly" || type === "year") {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return { from: formatDate(startOfYear), to: formatDate(today) };
    } else if (type === "custom" || type === "custom_date") {
      return { from: customFrom || "", to: customTo || "" };
    }
    return { from: "", to: "" };
  };

  const fetchTableData = async (
    targetPage = page,
    targetPageSize = pageSize,
  ) => {
    if (!selectedPipeline) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      const stageNormalized = String(selectedFilters?.payment_stage || "")
        .toLowerCase()
        .replace(/\s+/g, "");
      const isOverdueSelected = stageNormalized.includes("overdue");
      const isTodayStageSelected = stageNormalized.includes("today");

      const currentFilterType = filterType || "today";
      const dates = getComputedDates(currentFilterType, fromDate, toDate);

      const payloadDateFilter =
        currentFilterType === "All" || currentFilterType === "all"
          ? "all"
          : currentFilterType;

      const payload = {
        pipeline_id: selectedPipeline,
        pipeline: selectedPipeline,
        campaign_id:
          routeState.campaign_id && routeState.campaign_id !== "all"
            ? routeState.campaign_id
            : undefined,
        search: debouncedSearchTerm || "",
        date_filter_type: payloadDateFilter,
        sort_type: sortType,
        from_date: dates.from || "",
        to_date: dates.to || "",
        course_name:
          selectedFilters.course_name !== "All"
            ? selectedFilters.course_name
            : "",
        course_plan:
          selectedFilters.course_plan !== "All"
            ? selectedFilters.course_plan
            : "",
        course_time:
          selectedFilters.course_time !== "All"
            ? selectedFilters.course_time
            : "",
        payment_stage:
          selectedFilters.payment_stage !== "All"
            ? isOverdueSelected
              ? "overdue"
              : isTodayStageSelected
                ? "today"
                : selectedFilters.payment_stage.toLowerCase()
            : "",
        pending_amount:
          selectedFilters.pending_amount !== "All"
            ? selectedFilters.pending_amount
            : "",
        page: targetPage,
        page_size: targetPageSize,
      };

      const response = await fetchAdminPendingPayments(payload, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      const resData = response?.data?.data || response?.data;

      const leadsList = Array.isArray(resData?.leads)
        ? resData.leads
        : Array.isArray(resData?.data)
          ? resData.data
          : Array.isArray(resData)
            ? resData
            : [];

      const totalRec =
        resData?.total_records ??
        resData?.total_count ??
        response?.data?.total_records ??
        response?.data?.total_count ??
        (Array.isArray(leadsList) ? leadsList.length : 0);

      const totalPg =
        resData?.total_pages ??
        resData?.total_page ??
        (Math.ceil(totalRec / targetPageSize) || 1);

      if (controller.signal.aborted) return;

      setTableData(leadsList);
      setTotalRecords(totalRec);
      setTotalPages(totalPg);

      const rawData = response?.data?.data || response?.data || {};
      const summaryCardsFromApi =
        rawData?.summary_cards || rawData?.summary || null;

      const summaryData = {
        total_pending: {
          amount:
            summaryCardsFromApi?.total_pending?.amount ??
            rawData?.total_pending_amount ??
            rawData?.total_pending ??
            0,
          count:
            summaryCardsFromApi?.total_pending?.count ??
            rawData?.total_leads ??
            rawData?.total_count ??
            totalRec,
        },
        due_today: {
          amount:
            summaryCardsFromApi?.due_today?.amount ??
            rawData?.today_due_amount ??
            rawData?.due_today_amount ??
            0,
          count:
            summaryCardsFromApi?.due_today?.count ??
            rawData?.today_due_leads ??
            rawData?.due_today_leads ??
            0,
        },
        overdue: {
          amount:
            summaryCardsFromApi?.overdue?.amount ??
            rawData?.overdue_amount ??
            0,
          count:
            summaryCardsFromApi?.overdue?.count ?? rawData?.overdue_leads ?? 0,
        },
      };
      setSummaryCards(summaryData);
    } catch (error) {
      if (
        error?.name === "CanceledError" ||
        error?.name === "AbortError" ||
        error?.code === "ERR_CANCELED"
      ) {
        return;
      }
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

    fetchTableData(page, pageSize);
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

  const pendingPaymentExportColumns = [
    { id: "s_no", backendKey: "s_no", label: "S.No" },
    { id: "name", backendKey: "name", label: "Student Name" },
    { id: "contact", backendKey: "contact", label: "Contact Number" },
    {
      id: "assigned_to",
      backendKey: "assigned_to",
      label: "Assigned Telecaller",
    },
    { id: "campaign", backendKey: "campaign", label: "Campaign Name" },
    { id: "course_plan", backendKey: "course_plan", label: "Course Plan" },
    { id: "course", backendKey: "course", label: "Course Name" },
    { id: "joining_date", backendKey: "joining_date", label: "Joining Date" },
    { id: "batch_timing", backendKey: "batch_timing", label: "Batch & Timing" },
    { id: "amount_paid", backendKey: "amount_paid", label: "Amount Paid" },
    {
      id: "pending_amount",
      backendKey: "pending_amount",
      label: "Pending Amount",
    },
    { id: "status", backendKey: "status", label: "Payment Status" },
    {
      id: "next_followup",
      backendKey: "next_followup",
      label: "Next Follow-Up Date",
    },
    {
      id: "last_conversation",
      backendKey: "last_conversation",
      label: "Last Conversation",
    },
  ];

  // EXPORT HANDLER (BACKEND EXPORT ONLY)
  const handleExport = async (selectedKeys, format = "excel") => {
    try {
      setExportLoading(true);
      const dates = getComputedDates(filterType, fromDate, toDate);

      const filtersPayload = {
        pipeline_id: selectedPipeline,
        pipeline: selectedPipeline,
        search: debouncedSearchTerm || "",
        date_filter_type: filterType,
        sort_type: sortType,
        from_date: dates.from,
        to_date: dates.to,
        course_name:
          selectedFilters.course_name !== "All"
            ? selectedFilters.course_name
            : "",
        course_plan:
          selectedFilters.course_plan !== "All"
            ? selectedFilters.course_plan
            : "",
        course_time:
          selectedFilters.course_time !== "All"
            ? selectedFilters.course_time
            : "",
        payment_stage:
          selectedFilters.payment_stage !== "All"
            ? selectedFilters.payment_stage
            : "",
        pending_amount:
          selectedFilters.pending_amount !== "All"
            ? selectedFilters.pending_amount
            : "",
      };

      const payload = {
        entity: "pending_payments",
        export_format: format || "excel",
        selected_columns:
          selectedKeys && Array.isArray(selectedKeys) && selectedKeys.length > 0
            ? selectedKeys
            : pendingPaymentExportColumns.map((c) => c.backendKey),
        filters: filtersPayload,
      };

      const response = await exportAdminPendingPaymentsFile(payload);
      const resData = response?.data || response;
      const resultObj = resData?.data || resData;

      let downloadUrl =
        resultObj?.download_url || resData?.download_url || resultObj?.file_url;

      if (downloadUrl) {
        if (
          !downloadUrl.startsWith("http://") &&
          !downloadUrl.startsWith("https://")
        ) {
          const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(
            /\/+$/,
            "",
          );
          downloadUrl = `${baseUrl}${downloadUrl.startsWith("/") ? "" : "/"}${downloadUrl}`;
        }

        window.open(downloadUrl, "_blank");
        setToastState({
          open: true,
          message:
            resData?.message ||
            resultObj?.message ||
            "Pending payment leads exported successfully",
        });
      } else {
        setToastState({
          open: true,
          message: "Failed to export pending payments file: No download URL",
        });
      }
    } catch (error) {
      console.error("Backend export error:", error);
      setToastState({
        open: true,
        message: "Failed to export pending payments file",
      });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <Box sx={{ pr: 3 }}>
      <PendingPaymentHeader
        pipelinesList={pipelinesList}
        selectedPipeline={selectedPipeline}
        onPipelineChange={(val) => setSelectedPipeline(val)}
        onExport={() => setIsExportModalOpen(true)}
        exportLoading={exportLoading}
      />

      {(() => {
        const currentPipelineObj = (
          Array.isArray(pipelinesList) ? pipelinesList : []
        ).find(
          (p) =>
            (p.id ?? p.value) === selectedPipeline || p === selectedPipeline,
        );
        const pName = String(
          currentPipelineObj?.name ||
            currentPipelineObj?.label ||
            selectedPipeline ||
            "",
        ).toLowerCase();
        const isProduct = pName.includes("product") || pName === "2";

        return !isProduct ? (
          <>
            <PendingPaymentStats
              summaryCards={summaryCards}
              loading={loading}
            />
            <PendingPaymentFilters
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
            <PendingPaymentTable
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
            />
          </>
        ) : (
          <Box
            sx={{
              p: 6,
              mt: 4,
              textAlign: "center",
              background: "#fff",
              borderRadius: "10px",
              border: "1px solid #E5E5E5",
            }}
          >
            <Typography
              sx={{ fontSize: "16px", color: "#666", fontWeight: 500 }}
            >
              No pending payment data available for Product. Select Education to
              view pending payments.
            </Typography>
          </Box>
        );
      })()}

      {/* Toast Notification Pop-Up matching UI/UX Screenshot */}
      <Snackbar
        open={toastState.open}
        autoHideDuration={3000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ top: "30px !important" }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            backgroundColor: "#FFFFFF",
            color: "#111827",
            px: 3,
            py: 1.5,
            borderRadius: "14px",
            boxShadow: "0px 8px 30px rgba(0, 0, 0, 0.12)",
            border: "1px solid #E5E7EB",
            borderBottom: "3px solid #84CC16",
          }}
        >
          <CheckCircleIcon sx={{ color: "#84CC16", fontSize: 26 }} />
          <Typography
            sx={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}
          >
            {toastState.message}
          </Typography>
        </Box>

        <ExportModal
          open={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reportName="Pending Payments"
          columns={pendingPaymentExportColumns}
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
      </Snackbar>
    </Box>
  );
}
