import { createExport, triggerDirectFileDownload } from "@/apps/admin/services/exportService";
import ExportModal from "@/apps/admin/components/common/ExportModal";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  IconButton,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlined";

import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";

import Table from "@/shared/components/table/Table";
import FilterButton from "@/apps/admin/components/common/filters/FilterButton";
import DateRangeSelect from "@/shared/components/filters/DateRangeSelect";
import CheckboxFilterPanel from "@/apps/admin/components/common/filters/CheckboxFilterPanel";
import FilterLeadsPanel from "@/apps/admin/components/common/filters/FilterLeadsPanel";

import {
  getCallLogFilterOptions,
  getCallLogReport,
} from "@/apps/admin/services/callLogService";
import { getSelectOptions, invalidateSelectOptions } from "@/apps/admin/services/dropdownService";

// Table columns definition with custom renderers for Call Status and Recordings
const columns = [
  { field: "no", headerName: "No", minWidth: 60, hideable: false },
  { field: "user_name", headerName: "User Name", minWidth: 140 },
  { field: "mobile_number", headerName: "Mobile Number", minWidth: 140 },
  { field: "mail_id", headerName: "Mail Id", minWidth: 190 },
  { field: "handled_by", headerName: "Handled By", minWidth: 130 },
  { field: "user_assigned", headerName: "User Assigned", minWidth: 140 },
  { field: "call_timestamp", headerName: "Call Timestamp", minWidth: 180 },
  { field: "call_duration", headerName: "Call Duration", minWidth: 130 },
  { field: "call_direction", headerName: "Call Direction", minWidth: 140 },
  {
    field: "call_status",
    headerName: "Call Status",
    minWidth: 140,
    renderCell: (row) => (
      <Chip
        size="small"
        label={row.call_status || "-"}
        sx={{
          bgcolor: row.call_status === "Connected" ? "#E6F4EA" : "#FCE8E6",
          color: row.call_status === "Connected" ? "#1E7E34" : "#C5221F",
          fontWeight: 500,
          fontSize: "12px",
        }}
      />
    ),
  },
  { field: "pipeline", headerName: "Pipeline", minWidth: 140 },
  { field: "campaign_name", headerName: "Campaign Name", minWidth: 160 },
  {
    field: "recording_url",
    headerName: "Recordings",
    minWidth: 150,
    renderCell: (row) => {
      const audioUrl = row.recording_url || row.upload_recording;
      if (audioUrl && audioUrl !== "" && audioUrl !== "-") {
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              color: "#1976D2",
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
            onClick={() => window.open(audioUrl, "_blank")}
          >
            <PlayCircleOutlineIcon fontSize="small" color="primary" />
            <Typography
              variant="body2"
              sx={{ fontSize: "13px", fontWeight: 600, color: "#1976D2" }}
            >
              Play Audio
            </Typography>
          </Box>
        );
      }
      return (
        <Typography variant="body2" sx={{ fontSize: "13px", color: "#9E9E9E" }}>
          -
        </Typography>
      );
    },
  },
];

export default function CallLogReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const campaignId = searchParams.get("campaign_id");
  const initialCampaignName = searchParams.get("campaign_name") || "";
  const pipelineIdParam = searchParams.get("pipeline_id");
  const savedPipelineId = sessionStorage.getItem("admin_pipeline_selected");
  const effectivePipelineId = pipelineIdParam || savedPipelineId;

  const [campaignName, setCampaignName] = useState(initialCampaignName);
  const [search, setSearch] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const callLogExportColumns = [
    { id: "user_name", backendKey: "user_name", label: "User Name" },
    { id: "mobile_number", backendKey: "mobile_number", label: "Mobile Number" },
    { id: "mail_id", backendKey: "mail_id", label: "Mail Id" },
    { id: "handled_by", backendKey: "handled_by", label: "Handled By" },
    { id: "user_assigned", backendKey: "user_assigned", label: "User Assigned" },
    { id: "call_timestamp", backendKey: "call_timestamp", label: "Call Timestamp" },
    { id: "call_duration", backendKey: "call_duration", label: "Call Duration" },
    { id: "call_direction", backendKey: "call_direction", label: "Call Direction" },
    { id: "call_status", backendKey: "call_status", label: "Call Status" },
    { id: "pipeline", backendKey: "pipeline", label: "Pipeline" },
    { id: "campaign_name", backendKey: "campaign_name", label: "Campaign Name" },
  ];

  const handleExportSubmit = async ({ fileFormat, selectedKeys }) => {
    try {
      setExportLoading(true);
      const payload = {
        entity: "call_logs",
        report_key: "call_log_report",
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
        await triggerDirectFileDownload(downloadUrl, `Call_Log_Report.${fileFormat}`);
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
  const [tableRows, setTableRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic filter states
  const [selectedDate, setSelectedDate] = useState("");
  const [dateFilterType, setDateFilterType] = useState("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedCallStatus, setSelectedCallStatus] = useState([]);
  const [selectedCallDirection, setSelectedCallDirection] = useState([]);
  const [panelFilters, setPanelFilters] = useState({});

  // Dynamic filter dropdown options loaded strictly from Backend API
  const [filterOptionsData, setFilterOptionsData] = useState({
    telecallers: [],
    callStatuses: [],
    callDirections: [],
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

  // 1. On-Demand: Fetch Telecallers only when "Assigned To" opens
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

  // 2. On-Demand: Fetch Call Statuses only when "Call Status" opens
  const loadCallStatuses = async () => {
    try {
      invalidateSelectOptions("L_CALL_STATUSES");
      const optFilter = getOptFilter();
      const res = await getSelectOptions("L_CALL_STATUSES", optFilter, true).catch(() => []);
      const raw = Array.isArray(res) ? res : res?.data?.data || res?.data || [];
      const names = extractNames(raw);
      setFilterOptionsData((prev) => ({
        ...prev,
        callStatuses: names,
      }));
    } catch (err) {
      console.error("Error loading call statuses:", err);
    }
  };

  // 3. On-Demand: Fetch Call Directions only when "Call Direction" opens
  const loadCallDirections = async () => {
    try {
      invalidateSelectOptions("L_CALL_DIRECTIONS");
      const optFilter = getOptFilter();
      const res = await getSelectOptions("L_CALL_DIRECTIONS", optFilter, true).catch(() => []);
      const raw = Array.isArray(res) ? res : res?.data?.data || res?.data || [];
      const names = extractNames(raw);
      setFilterOptionsData((prev) => ({
        ...prev,
        callDirections: names,
      }));
    } catch (err) {
      console.error("Error loading call directions:", err);
    }
  };

  // 4. On-Demand: Fetch Detailed Filter Panel options only when "Filter" opens
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

  // 2. Load Call Log Table Data
  useEffect(() => {
    async function loadCallLogData() {
      setLoading(true);
      try {
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
          return map[dateFilterType] || selectedDate || "";
        })();

        const queryParams = {
          pipeline_id: effectivePipelineId
            ? Number(effectivePipelineId)
            : undefined,
          campaign_id: campaignId ? Number(campaignId) : undefined,
          search: search || "",
          date_range: computedDateRange,
          from_date: fromDate || "",
          to_date: toDate || "",
          assigned_to: Array.isArray(selectedUsers)
            ? selectedUsers.join(",")
            : "",
          call_status: Array.isArray(selectedCallStatus)
            ? selectedCallStatus.join(",")
            : "",
          call_direction: Array.isArray(selectedCallDirection)
            ? selectedCallDirection.join(",")
            : "",
          filter_campaign:
            panelFilters?.campaignName && panelFilters.campaignName !== "All"
              ? panelFilters.campaignName
              : "",
          course_name:
            panelFilters?.courseName && panelFilters.courseName !== "All"
              ? panelFilters.courseName
              : "",
          course_plan:
            panelFilters?.coursePlan && panelFilters.coursePlan !== "All"
              ? panelFilters.coursePlan
              : "",
          lead_source:
            panelFilters?.leadSource && panelFilters.leadSource !== "All"
              ? panelFilters.leadSource
              : "",
          payment_status:
            panelFilters?.paymentStatus && panelFilters.paymentStatus !== "All"
              ? panelFilters.paymentStatus
              : panelFilters?.paymentStage && panelFilters.paymentStage !== "All"
                ? panelFilters.paymentStage
                : "",
          payment_stage:
            panelFilters?.paymentStage && panelFilters.paymentStage !== "All"
              ? panelFilters.paymentStage
              : panelFilters?.paymentStatus && panelFilters.paymentStatus !== "All"
                ? panelFilters.paymentStatus
                : "",
          tag:
            panelFilters?.tag && panelFilters.tag !== "All"
              ? panelFilters.tag
              : panelFilters?.priority && panelFilters.priority !== "All"
                ? panelFilters.priority
                : "",
          priority:
            panelFilters?.priority && panelFilters.priority !== "All"
              ? panelFilters.priority
              : panelFilters?.tag && panelFilters.tag !== "All"
                ? panelFilters.tag
                : "",
        };

        const response = await getCallLogReport(queryParams);

        if (response.data && response.data.data) {
          setCampaignName(
            initialCampaignName ||
              response.data.data.campaign_name ||
              "",
          );
          setTableRows(response.data.data.rows || []);
        } else {
          setTableRows([]);
        }
      } catch (error) {
        console.error("Failed to load call log data:", error);
        setTableRows([]);
      } finally {
        setLoading(false);
      }
    }

    loadCallLogData();
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
    selectedCallStatus,
    selectedCallDirection,
    panelFilters,
  ]);



  const handleDownload = () => {
    if (!tableRows || tableRows.length === 0) return;
    const headers = [
      "No",
      "User Name",
      "Mobile Number",
      "Mail Id",
      "Handled By",
      "User Assigned",
      "Call Timestamp",
      "Call Duration",
      "Call Direction",
      "Call Status",
      "Pipeline",
      "Campaign Name",
    ];
    const csvRows = [
      headers.join(","),
      ...tableRows.map((r, i) =>
        [
          i + 1,
          `"${r.user_name || ""}"`,
          `"${r.mobile_number || ""}"`,
          `"${r.mail_id || ""}"`,
          `"${r.handled_by || ""}"`,
          `"${r.user_assigned || ""}"`,
          `"${r.call_timestamp || ""}"`,
          `"${r.call_duration || ""}"`,
          `"${r.call_direction || ""}"`,
          `"${r.call_status || ""}"`,
          `"${r.pipeline || ""}"`,
          `"${r.campaign_name || ""}"`,
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const filename = campaignName ? `call_log_${campaignName}.csv` : "call_log.csv";
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", p: 2 }}>
      {/* 1. HEADER */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => navigate(-1)}
            sx={{
              p: 0.5,
              bgcolor: "transparent",
              color: "#000000",
              "&:hover": { bgcolor: "transparent", opacity: 0.7 },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 24, color: "#000000" }} />
          </IconButton>

          <Typography
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: { xs: "18px", sm: "20px", md: "22px" },
              color: "#111111",
            }}
          >
            {campaignName ? `Call Log - ${campaignName}` : "Call Log"}
          </Typography>
        </Box>
      </Box>

      {/* 2. TOOLBAR WITH FILTERS AND SEARCH */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.2,
          mb: 2,
        }}
      >
        {/* Filter Buttons */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
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

          {/* Assigned To Filter (Strictly Dynamic from Backend API) */}
          <FilterButton label="Assigned To" active={selectedUsers.length > 0} onOpen={loadTelecallers}>
            {({ close }) => (
              <CheckboxFilterPanel
                title="Choose Assigned To"
                options={filterOptionsData.telecallers}
                defaultSelected={selectedUsers}
                onApply={(vals) => {
                  setSelectedUsers(vals);
                  close();
                }}
              />
            )}
          </FilterButton>

          {/* Call Status Filter */}
          <FilterButton label="Call Status" active={selectedCallStatus.length > 0} onOpen={loadCallStatuses}>
            {({ close }) => (
              <CheckboxFilterPanel
                title="Choose Call Status"
                options={filterOptionsData.callStatuses}
                defaultSelected={selectedCallStatus}
                onApply={(vals) => {
                  setSelectedCallStatus(vals);
                  close();
                }}
              />
            )}
          </FilterButton>

          {/* Call Direction Filter */}
          <FilterButton label="Call Direction" active={selectedCallDirection.length > 0} onOpen={loadCallDirections}>
            {({ close }) => (
              <CheckboxFilterPanel
                title="Choose Call Direction"
                options={filterOptionsData.callDirections}
                defaultSelected={selectedCallDirection}
                onApply={(vals) => {
                  setSelectedCallDirection(vals);
                  close();
                }}
              />
            )}
          </FilterButton>

          {/* More Detailed Filters */}
          <FilterButton
            label="Filter"
            active={Object.keys(panelFilters).length > 0}
            width={380}
            onOpen={loadDetailedFilters}
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
                  setPanelFilters(filterData);
                  close();
                }}
                onReset={() => {
                  setPanelFilters({});
                }}
              />
            )}
          </FilterButton>
        </Box>

        {/* Right Search, Download & Sort */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 0.8 }}>
                  <SearchIcon sx={{ fontSize: 18, color: "#888" }} />
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
            <IconButton size="small" onClick={() => setIsExportModalOpen(true)} title="Export Report"
              sx={{
                width: 36,
                height: 36,
                border: "1px solid #D0D0D0",
                bgcolor: "#fff",
                borderRadius: "6px",
                "&:hover": { bgcolor: "#f5f5f5" },
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>


          </Box>
        </Box>
      </Box>

      {/* 3. TABLE */}
      <Table
        columns={columns}
        rows={tableRows}
        loading={loading}
        enableColumnSettings
      />
      <ExportModal
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="Call Log Report"
        columns={callLogExportColumns}
        availableFormats={["xlsx", "csv"]}
        isSubmitting={exportLoading}
        onDownload={handleExportSubmit}
      />
    </Box>
  );
}
