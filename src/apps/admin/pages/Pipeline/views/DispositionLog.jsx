import { createExport, triggerDirectFileDownload } from "@/apps/admin/services/exportService";
import ExportModal from "@/apps/admin/components/common/ExportModal";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";

import Table from "@/shared/components/table/Table";
import FilterButton from "@/apps/admin/components/common/filters/FilterButton";
import DateRangeSelect from "@/shared/components/filters/DateRangeSelect";
import CheckboxFilterPanel from "@/apps/admin/components/common/filters/CheckboxFilterPanel";
import FilterLeadsPanel from "@/apps/admin/components/common/filters/FilterLeadsPanel";

import { getDispositionLogReport } from "@/apps/admin/services/dispositionService";
import { getFilterOptions } from "@/apps/admin/services/leadSummaryService";
import { getSelectOptions, invalidateSelectOptions } from "@/apps/admin/services/dropdownService";

// Table columns definition
const columns = [
  { field: "no", headerName: "No", minWidth: 60, hideable: false },
  {
    field: "user_name",
    headerName: "User Name",
    minWidth: 140,
    renderCell: (row) => (
      <Typography
        variant="body2"
        sx={{ color: "#1976D2", fontWeight: 600, cursor: "pointer" }}
      >
        {row.user_name || "-"}
      </Typography>
    ),
  },
  { field: "mobile_number", headerName: "Mobile Number", minWidth: 140 },
  { field: "mail_id", headerName: "Mail Id", minWidth: 190 },
  { field: "disposed_by", headerName: "Disposed By", minWidth: 130 },
  { field: "user_assigned", headerName: "User Assigned", minWidth: 140 },
  { field: "stage", headerName: "Stage", minWidth: 130 },
  { field: "tag", headerName: "Tag", minWidth: 100 },
  { field: "status", headerName: "Status", minWidth: 130 },
  {
    field: "disposition_time_stamp",
    headerName: "Disposition Time Stamp",
    minWidth: 180,
  },
  { field: "disposition_as", headerName: "Disposition As", minWidth: 140 },
  {
    field: "not_connected_reason",
    headerName: "Not Connected Reason",
    minWidth: 180,
  },
  { field: "remarks", headerName: "Remarks", minWidth: 160 },
  {
    field: "deal_amount",
    headerName: "Deal Amount",
    minWidth: 130,
    renderCell: (row) => (row.deal_amount ? `₹${row.deal_amount}` : "-"),
  },
  { field: "pipeline", headerName: "Pipeline", minWidth: 130 },
  { field: "campaign", headerName: "Campaign", minWidth: 160 },
];

export default function DispositionLog() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const campaignId = searchParams.get("campaign_id");
  const initialCampaignName = searchParams.get("campaign_name") || "";
  const pipelineIdParam = searchParams.get("pipeline_id");
  const savedPipelineId = sessionStorage.getItem("admin_pipeline_selected");
  const effectivePipelineId = pipelineIdParam || savedPipelineId;

  const [campaignName, setCampaignName] = useState(initialCampaignName);
  const [tableRows, setTableRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const dispositionExportColumns = [
    { id: "user_name", backendKey: "user_name", label: "User Name" },
    { id: "mobile_number", backendKey: "mobile_number", label: "Mobile Number" },
    { id: "handled_by", backendKey: "handled_by", label: "Handled By" },
    { id: "disposition_name", backendKey: "disposition_name", label: "Disposition Name" },
    { id: "sub_disposition", backendKey: "sub_disposition", label: "Sub-disposition" },
    { id: "call_timestamp", backendKey: "call_timestamp", label: "Call Timestamp" },
    { id: "call_duration", backendKey: "call_duration", label: "Call Duration" },
    { id: "pipeline", backendKey: "pipeline", label: "Pipeline" },
    { id: "campaign_name", backendKey: "campaign_name", label: "Campaign Name" },
  ];

  const handleExportSubmit = async ({ fileFormat, selectedKeys }) => {
    try {
      setExportLoading(true);
      const payload = {
        entity: "disposition_logs",
        report_key: "disposition_log_report",
        export_format: fileFormat === "xlsx" ? "excel" : fileFormat,
        selected_columns: selectedKeys,
        filters: {
          campaign_id: campaignId || null,
          search: search || "",
          pipeline_id: effectivePipelineId || null,
        },
      };
      const res = await createExport(payload);
      const resData = res?.data || res;
      const downloadUrl = resData?.download_url || res?.download_url || resData?.file_url;
      if (downloadUrl) {
        await triggerDirectFileDownload(downloadUrl, `Disposition_Log_Report.${fileFormat}`);
      } else {
        handleDownload();
      }
    } catch (err) {
      console.warn("API export failed, falling back to local download:", err);
      handleDownload();
    } finally {
      setExportLoading(false);
      setIsExportModalOpen(false);
    }
  };
  const [selectedDate, setSelectedDate] = useState("");
  const [dateFilterType, setDateFilterType] = useState("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedStages, setSelectedStages] = useState([]);
  const [panelFilters, setPanelFilters] = useState({});

  // Active filter indicators
  const [dateActive, setDateActive] = useState(false);
  const [userActive, setUserActive] = useState(false);
  const [stageActive, setStageActive] = useState(false);
  const [filterActive, setFilterActive] = useState(false);

  // Filter dropdown data
  const [filterOptionsData, setFilterOptionsData] = useState({
    telecallers: [],
    stagesOptions: [],
    campaigns: [],
    courses: [],
    coursePlans: [],
    sources: [],
    paymentStatuses: [],
    priorities: [],
  });

  const extractNames = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((item) => {
        if (typeof item === "string") return item;
        return (
          item?.name ||
          item?.label ||
          item?.campaign_name ||
          item?.stage_name ||
          item?.user_name ||
          item?.source_name ||
          item?.title ||
          String(item?.id || "")
        );
      })
      .filter(Boolean);
  };

  const getOptFilter = () => {
    const pipelineIdToUse =
      searchParams.get("pipeline_id") ||
      sessionStorage.getItem("admin_pipeline_selected");
    return pipelineIdToUse
      ? { pipeline_id: Number(pipelineIdToUse) }
      : null;
  };

  // 1. On-Demand: Fetch Telecallers only when "Assigned to" opens
  const loadTelecallers = async () => {
    try {
      invalidateSelectOptions("L_TELECALLERS");
      const optFilter = getOptFilter();
      const res = await getSelectOptions("L_TELECALLERS", null, true).catch(() => []);
      const raw = Array.isArray(res) ? res : res?.data?.data || res?.data || [];
      const names = extractNames(raw);
      setFilterOptionsData((prev) => ({
        ...prev,
        telecallers: names,
      }));
    } catch (err) {
      console.error("Error loading telecallers:", err);
    }
  };

  // 2. On-Demand: Fetch Stages only when "Stage" opens
  const loadStages = async () => {
    try {
      invalidateSelectOptions("L_STAGES");
      const optFilter = getOptFilter();
      const res = await getSelectOptions("L_STAGES", optFilter, true).catch(() => []);
      const raw = Array.isArray(res) ? res : res?.data?.data || res?.data || [];
      const names = extractNames(raw);
      setFilterOptionsData((prev) => ({
        ...prev,
        stagesOptions: names,
      }));
    } catch (err) {
      console.error("Error loading stages:", err);
    }
  };

  // 3. On-Demand: Fetch Detailed Filter Panel options only when "Filter" opens
  const loadDetailedFilters = async () => {
    try {
      invalidateSelectOptions();
      const optFilter = getOptFilter();
      const [
        campaigns,
        courseNames,
        coursePlans,
        sources,
        paymentStages,
        tags,
      ] = await Promise.all([
        !campaignId ? getSelectOptions("L_CAMPAIGN_NAMES", optFilter, true).catch(() => []) : Promise.resolve([]),
        getSelectOptions("L_COURSE_NAMES", optFilter, true).catch(() => []),
        getSelectOptions("L_COURSE_PLANS", optFilter, true).catch(() => []),
        getSelectOptions("L_LEAD_SOURCES", optFilter, true).catch(() => []),
        getSelectOptions("L_PAYMENT_STAGES", optFilter, true).catch(() => []),
        getSelectOptions("L_TAGS", optFilter, true).catch(() => []),
      ]);

      let courses =
        courseNames.length > 0
          ? courseNames
          : await getSelectOptions("L_COURSES", optFilter, true).catch(() => []);

      setFilterOptionsData((prev) => ({
        ...prev,
        campaigns: extractNames(campaigns),
        courses: extractNames(courses),
        coursePlans: extractNames(coursePlans),
        sources: extractNames(sources),
        paymentStages: extractNames(paymentStages),
        paymentStatuses: extractNames(paymentStages),
        tags: extractNames(tags),
        priorities: extractNames(tags),
      }));
    } catch (err) {
      console.error("Error loading detailed filters:", err);
    }
  };

  // Load disposition log table data
  useEffect(() => {
    async function loadDispositionData() {
      try {
        setLoading(true);
        const computedDateRange = (() => {
          if (dateFilterType === "custom" && fromDate && toDate) {
            return `${fromDate} to ${toDate}`;
          }
          const map = {
            today: "Today",
            yesterday: "Yesterday",
            weekly: "Last 7 days",
            monthly: "This Month",
            year: "Last 30 days",
          };
          return map[dateFilterType] || selectedDate || null;
        })();

        const payload = {
          pipeline_id: effectivePipelineId
            ? Number(effectivePipelineId)
            : null,
          campaign_id: campaignId ? Number(campaignId) : null,
          search: search || null,
          date_range: computedDateRange,
          from_date: fromDate || null,
          to_date: toDate || null,
          assigned_to:
            selectedUsers.length > 0 ? selectedUsers.join(",") : null,
          stages: selectedStages.length > 0 ? selectedStages.join(",") : null,
          filter_campaign:
            panelFilters?.campaignName && panelFilters.campaignName !== "All"
              ? panelFilters.campaignName
              : null,
          course_name:
            panelFilters?.courseName && panelFilters.courseName !== "All"
              ? panelFilters.courseName
              : null,
          course_plan:
            panelFilters?.coursePlan && panelFilters.coursePlan !== "All"
              ? panelFilters.coursePlan
              : null,
          lead_source:
            panelFilters?.leadSource && panelFilters.leadSource !== "All"
              ? panelFilters.leadSource
              : null,
          payment_status:
            panelFilters?.paymentStatus && panelFilters.paymentStatus !== "All"
              ? panelFilters.paymentStatus
              : panelFilters?.paymentStage && panelFilters.paymentStage !== "All"
                ? panelFilters.paymentStage
                : null,
          payment_stage:
            panelFilters?.paymentStage && panelFilters.paymentStage !== "All"
              ? panelFilters.paymentStage
              : panelFilters?.paymentStatus && panelFilters.paymentStatus !== "All"
                ? panelFilters.paymentStatus
                : null,
          tag:
            panelFilters?.tag && panelFilters.tag !== "All"
              ? panelFilters.tag
              : panelFilters?.priority && panelFilters.priority !== "All"
                ? panelFilters.priority
                : null,
          priority:
            panelFilters?.priority && panelFilters.priority !== "All"
              ? panelFilters.priority
              : panelFilters?.tag && panelFilters.tag !== "All"
                ? panelFilters.tag
                : null,
        };

        const response = await getDispositionLogReport(payload);
        if (response.data && response.data.data) {
          setCampaignName(
            response.data.data.campaign_name || initialCampaignName || "",
          );
          setTableRows(response.data.data.rows || []);
        } else {
          setTableRows([]);
        }
      } catch (error) {
        console.error("Failed to load disposition log data:", error);
        setTableRows([]);
      } finally {
        setLoading(false);
      }
    }

    loadDispositionData();
  }, [
    pipelineIdParam,
    effectivePipelineId,
    campaignId,
    initialCampaignName,
    search,
    selectedDate,
    dateFilterType,
    fromDate,
    toDate,
    selectedUsers,
    selectedStages,
    panelFilters,
  ]);



  const handleDownload = () => {
    if (!tableRows || tableRows.length === 0) return;
    const headers = [
      "No",
      "User Name",
      "Mobile Number",
      "Mail Id",
      "Disposed By",
      "User Assigned",
      "Stage",
      "Tag",
      "Status",
      "Disposition Time Stamp",
      "Disposition As",
      "Not Connected Reason",
      "Remarks",
      "Deal Amount",
      "Pipeline",
      "Campaign",
    ];
    const csvRows = [
      headers.join(","),
      ...tableRows.map((r, i) =>
        [
          r.no || i + 1,
          `"${r.user_name || ""}"`,
          `"${r.mobile_number || ""}"`,
          `"${r.mail_id || ""}"`,
          `"${r.disposed_by || ""}"`,
          `"${r.user_assigned || ""}"`,
          `"${r.stage || ""}"`,
          `"${r.tag || ""}"`,
          `"${r.status || ""}"`,
          `"${r.disposition_time_stamp || ""}"`,
          `"${r.disposition_as || ""}"`,
          `"${r.not_connected_reason || ""}"`,
          `"${r.remarks || ""}"`,
          `"${r.deal_amount || ""}"`,
          `"${r.pipeline || ""}"`,
          `"${r.campaign || ""}"`,
        ].join(","),
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const filename = campaignName
      ? `disposition_log_${campaignName}.csv`
      : "disposition_log.csv";
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeTelecallersList =
    filterOptionsData.telecallers && filterOptionsData.telecallers.length > 0
      ? filterOptionsData.telecallers.map((t) =>
          typeof t === "object" ? t.username || t.name : t,
        )
      : [];

  const activeStagesList =
    filterOptionsData.stagesOptions && filterOptionsData.stagesOptions.length > 0
      ? filterOptionsData.stagesOptions.map((s) =>
          typeof s === "object" ? s.name || s.stage_name : s,
        )
      : [];

  const displayTitle = campaignName
    ? `Disposition Log - ${campaignName}`
    : "Disposition Log";

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", p: 2 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => navigate(-1)}
            sx={{
              p: 0.5,
              bgcolor: "transparent",
              border: "none",
              color: "#000000",
              "&:hover": {
                bgcolor: "transparent",
                opacity: 0.7,
              },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 24, color: "#000000" }} />
          </IconButton>

          <Typography
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: { xs: "18px", sm: "20px", md: "22px" },
              lineHeight: "100%",
              color: "#111111",
            }}
          >
            {displayTitle}
          </Typography>
        </Box>
      </Box>

      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.2,
          mb: 1.5,
        }}
      >
        {/* Left Filters Cluster */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            width: { xs: "100%", md: "auto" },
          }}
        >
          {/* Date Filter Dropdown with Custom Date Range Dialog */}
          <DateRangeSelect
            filterType={dateFilterType}
            setFilterType={setDateFilterType}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
            defaultType="today"
            sx={{
              minWidth: "115px",
              "& .MuiOutlinedInput-root": {
                height: "36px !important",
                borderRadius: "6px !important",
                backgroundColor: "#ffffff !important",
                border: "1px solid #D0D0D0 !important",
                color: "#333333 !important",
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: "#F9F9F9 !important",
                  borderColor: "#C0C0C0 !important",
                },
                "& fieldset": {
                  border: "none !important",
                },
              },
              "& .MuiSelect-select": {
                padding: "7px 14px !important",
                display: "flex",
                alignItems: "center",
                color: "#333333",
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
              },
              "& .MuiSelect-icon": {
                color: "#333333",
              },
            }}
          />

          <FilterButton
            label="Assigned to"
            active={userActive || selectedUsers.length > 0}
            onOpen={loadTelecallers}
          >
            {({ close }) => (
              <CheckboxFilterPanel
                title="Choose Assigned To"
                options={activeTelecallersList}
                defaultSelected={selectedUsers}
                onApply={(vals) => {
                  setUserActive(vals.length > 0);
                  setSelectedUsers(vals);
                  close();
                }}
              />
            )}
          </FilterButton>

          <FilterButton
            label="Stage"
            active={stageActive || selectedStages.length > 0}
            onOpen={loadStages}
          >
            {({ close }) => (
              <CheckboxFilterPanel
                title="Choose Lead Stage"
                options={activeStagesList}
                defaultSelected={selectedStages}
                onApply={(vals) => {
                  setStageActive(vals.length > 0);
                  setSelectedStages(vals);
                  close();
                }}
              />
            )}
          </FilterButton>

          <FilterButton
            label="Filter"
            active={filterActive || Object.keys(panelFilters).length > 0}
            onOpen={loadDetailedFilters}
            width={380}
          >
            {({ close }) => (
              <FilterLeadsPanel
                closePanel={close}
                hideCampaign={Boolean(campaignId)}
                initialFilters={panelFilters}
                campaignOptions={filterOptionsData.campaigns}
                courseOptions={filterOptionsData.courses}
                coursePlanOptions={filterOptionsData.coursePlans}
                sourceOptions={filterOptionsData.sources}
                paymentStatusOptions={
                  filterOptionsData.paymentStages ||
                  filterOptionsData.paymentStatuses
                }
                paymentStageOptions={
                  filterOptionsData.paymentStages ||
                  filterOptionsData.paymentStatuses
                }
                priorityOptions={
                  filterOptionsData.tags || filterOptionsData.priorities
                }
                tagOptions={
                  filterOptionsData.tags || filterOptionsData.priorities
                }
                onApply={(filterData) => {
                  setFilterActive(true);
                  setPanelFilters(filterData);
                  close();
                }}
                onReset={() => {
                  setFilterActive(false);
                  setPanelFilters({});
                }}
              />
            )}
          </FilterButton>
        </Box>

        {/* Right Search and Actions Cluster */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <TextField
            size="small"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 0.8 }}>
                  <SearchIcon sx={{ color: "#888888", fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: "100%", sm: 220 },
              "& .MuiOutlinedInput-root": {
                height: 36,
                backgroundColor: "#F4F4F4",
                borderRadius: "6px",
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
              },
            }}
          />

          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton size="small" onClick={() => setIsExportModalOpen(true)}
              sx={{
                width: 36,
                height: 36,
                border: "1px solid #D0D0D0",
                bgcolor: "#fff",
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>

          </Box>
        </Box>
      </Box>

      {/* Table */}
      <Table
        columns={columns}
        rows={tableRows}
        loading={loading}
        enableColumnSettings
      />
      <ExportModal
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="Disposition Log Report"
        columns={dispositionExportColumns}
        availableFormats={["xlsx", "csv"]}
        isSubmitting={exportLoading}
        onDownload={handleExportSubmit}
      />
    </Box>
  );
}
