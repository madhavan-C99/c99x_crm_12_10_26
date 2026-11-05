import React, { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "react-toastify";
import {
  Box,
  Typography,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  TextField,
  InputAdornment,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ExportModal from "@/apps/admin/components/common/ExportModal";
import useReportExport from "@/apps/admin/hooks/useReportExport";
import DateRangeSelect from "@/shared/components/filters/DateRangeSelect";
import {
  reportDateFilterSx,
  reportMenuProps,
} from "@/shared/components/filters/filterStyles";
import Table from "@/shared/components/table/Table";

import {
  fetchPipelinesDropdownAdmin,
  fetchCampaignsDropdownAdmin,
  executeReportAdmin,
} from "@/apps/admin/services/reportService";

export default function CampaignSourceReportDetail({ onBack }) {
  const [dateFilter, setDateFilter] = useState("last_30_days");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pipelineFilter, setPipelineFilter] = useState("All");
  const [campaignFilter, setCampaignFilter] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [pipelinesList, setPipelinesList] = useState([]);
  const [campaignsList, setCampaignsList] = useState([]);

  // Table & API states - columns are 100% dynamic from backend
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0); // 0-indexed for MUI TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(50); // Backend default: 50
  const [totalRecords, setTotalRecords] = useState(0);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const getBackendDateFilter = (filter) => {
    const map = {
      all: "All",
      today: "Today",
      yesterday: "Yesterday",
      last_7_days: "Last 7 Days",
      last_30_days: "Last 30 Days",
      this_month: "This Month",
      this_year: "This Year",
      custom: "Custom",
    };
    return map[filter] || filter || "Last 30 Days";
  };

  const prevDateRef = useRef({ dateFilter, fromDate, toDate });
  useEffect(() => {
    if (
      prevDateRef.current.dateFilter !== dateFilter ||
      prevDateRef.current.fromDate !== fromDate ||
      prevDateRef.current.toDate !== toDate
    ) {
      prevDateRef.current = { dateFilter, fromDate, toDate };
      setPage(0);
    }
  }, [dateFilter, fromDate, toDate]);

  // Race condition tracker & clean unmount check
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch Pipelines Dropdown
  useEffect(() => {
    let ignore = false;
    const loadPipelines = async () => {
      try {
        const pipelinesRes = await fetchPipelinesDropdownAdmin();
        if (ignore) return;
        if (pipelinesRes?.success && Array.isArray(pipelinesRes?.data)) {
          setPipelinesList(pipelinesRes.data);
        } else if (Array.isArray(pipelinesRes)) {
          setPipelinesList(pipelinesRes);
        }
      } catch (error) {
        if (ignore) return;
        console.error("Error fetching pipeline options:", error);
        toast.error("Failed to load dropdown options. Please try again.");
      }
    };
    loadPipelines();
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch Campaigns Dropdown (filtered by selected pipeline)
  useEffect(() => {
    let ignore = false;
    const loadCampaigns = async () => {
      try {
        const filterParam =
          pipelineFilter === "All" ? undefined : pipelineFilter;
        const campaignsRes = await fetchCampaignsDropdownAdmin(filterParam);
        if (ignore) return;
        if (campaignsRes?.success && Array.isArray(campaignsRes?.data)) {
          setCampaignsList(campaignsRes.data);
        } else if (Array.isArray(campaignsRes)) {
          setCampaignsList(campaignsRes);
        } else {
          setCampaignsList([]);
        }
      } catch (error) {
        if (ignore) return;
        console.error("Error fetching campaign options:", error);
        setCampaignsList([]);
        toast.error("Failed to load campaigns. Please try again.");
      }
    };

    loadCampaigns();

    return () => {
      ignore = true;
    };
  }, [pipelineFilter]);

  // Fetch Campaign Source Report from Backend
  useEffect(() => {
    let ignore = false;
    const currentRequestId = ++requestIdRef.current;

    const fetchReport = async () => {
      if (dateFilter === "custom" && (!fromDate || !toDate)) {
        setLoading(false);
        setRows([]);
        setTotalRecords(0);
        return;
      }

      setLoading(true);

      const payload = {
        report_key: "campaign_source_report",
        date_filter: getBackendDateFilter(dateFilter),
        campaign_id: campaignFilter,
        pipeline_id: pipelineFilter,
        search: searchTerm,
        page: page + 1,
        limit: rowsPerPage,
      };

      if (dateFilter === "custom") {
        payload.start_date = fromDate;
        payload.end_date = toDate;
        payload.from_date = fromDate;
        payload.to_date = toDate;
      }

      try {
        const response = await executeReportAdmin(payload);
        if (ignore || currentRequestId !== requestIdRef.current) return;

        const root =
          response?.data &&
          typeof response.data === "object" &&
          !Array.isArray(response.data)
            ? response.data
            : response;

        const isSuccess =
          root?.success !== false && response?.success !== false;

        if (isSuccess && root) {
          const list = Array.isArray(root?.data)
            ? root.data
            : Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response)
                ? response
                : [];
          setRows(list);

          const cols = Array.isArray(root?.columns)
            ? root.columns
            : Array.isArray(response?.columns)
              ? response.columns
              : [];
          if (cols.length > 0) {
            setColumns(cols);
          }

          const total =
            typeof root?.total_records === "number"
              ? root.total_records
              : typeof response?.total_records === "number"
                ? response.total_records
                : list.length;
          setTotalRecords(total);
        } else {
          const errMsg =
            root?.message ||
            response?.message ||
            "Failed to fetch campaign source report";
          toast.error(errMsg);
          setRows([]);
          setTotalRecords(0);
        }
      } catch (err) {
        if (ignore || currentRequestId !== requestIdRef.current) return;
        console.error("Error fetching campaign source report:", err);
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch campaign source report";
        toast.error(errMsg);
        setRows([]);
        setTotalRecords(0);
      } finally {
        if (isMountedRef.current && currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    fetchReport();

    return () => {
      ignore = true;
    };
  }, [
    dateFilter,
    pipelineFilter,
    campaignFilter,
    searchTerm,
    page,
    rowsPerPage,
    fromDate,
    toDate,
  ]);

  const handlePipelineFilterChange = (val) => {
    setPipelineFilter(val);
    setCampaignFilter("All");
    setPage(0);
  };

  const handleCampaignFilterChange = (val) => {
    setCampaignFilter(val);
    setPage(0);
  };

  // Dynamically build Table columns from API response columns
  const tableColumns = useMemo(() => {
    if (!Array.isArray(columns) || columns.length === 0) return [];

    return columns.map((col) => {
      const headerText = col.headerName || col.field || "";
      const headerLen = headerText.length;
      const minWidth = Math.max(70, headerLen * 11 + 35);

      const colDef = {
        field: col.field,
        headerName: headerText,
        align: col.align || "center",
        minWidth: `${minWidth}px`,
      };

      if (
        col.field === "s_no" ||
        col.headerName === "S.No" ||
        col.headerName === "No"
      ) {
        colDef.renderCell = (row, rowIndex) => row.s_no ?? (row.id ?? rowIndex + 1);
      } else if (col.color) {
        colDef.renderCell = (row) => (
          <Typography
            sx={{
              color: col.color,
              fontWeight: 600,
              fontSize: "14px",
              fontFamily: "'Inter', sans-serif",
              textAlign: col.align || "center",
            }}
          >
            {row[col.field] ?? 0}
          </Typography>
        );
      } else if (col.align === "left") {
        colDef.renderCell = (row) => (
          <Typography
            sx={{
              fontWeight: 600,
              color: "#1E293B",
              fontSize: "14px",
              fontFamily: "'Inter', sans-serif",
              textAlign: "left",
            }}
          >
            {row[col.field] ?? "-"}
          </Typography>
        );
      } else {
        colDef.renderCell = (row) => {
          const val = row[col.field];
          const num = typeof val === "number" ? val : Number(val);
          const hasVal = !isNaN(num) && num > 0;
          return (
            <Typography
              sx={{
                fontWeight: hasVal ? 600 : 500,
                color: hasVal ? "#0F172A" : "#94A3B8",
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {val !== undefined && val !== null ? val : 0}
            </Typography>
          );
        };
      }

      return colDef;
    });
  }, [columns]);

  const tableMinWidth = useMemo(() => {
    if (!tableColumns || tableColumns.length === 0) return 1200;
    const totalWidth = tableColumns.reduce(
      (sum, col) => sum + parseInt(col.minWidth, 10),
      0,
    );
    return Math.max(1200, totalWidth);
  }, [tableColumns]);

  const downloadReportColumns = useMemo(
    () => columns.map((c) => c.headerName || c.field),
    [columns],
  );

  const exportProps = useReportExport({
    reportKey: "campaign_source_report",
    columns: downloadReportColumns,
    getFilters: () => ({
      date_filter: getBackendDateFilter(dateFilter),
      start_date: dateFilter === "custom" ? fromDate : undefined,
      end_date: dateFilter === "custom" ? toDate : undefined,
      from_date: dateFilter === "custom" ? fromDate : undefined,
      to_date: dateFilter === "custom" ? toDate : undefined,
      pipeline_id: pipelineFilter,
      campaign_id: campaignFilter,
      search: searchTerm || undefined,
    }),
  });

  const handleShare = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Report link copied to clipboard!");
    } else {
      toast.info("Report link copied");
    }
  };

  return (
    <Box
      sx={{
        pr: 3,
        pb: 4,
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Detail View Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <IconButton
          onClick={onBack}
          sx={{
            p: 0.5,
            color: "#0F172A",
            "&:hover": { backgroundColor: "#E2E8F0" },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: "22px" }} />
        </IconButton>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "#0F172A",
            fontSize: "22px",
            letterSpacing: "-0.01em",
          }}
        >
          Campaign Source Report
        </Typography>
      </Box>

      {/* Filter Controls Row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          {/* Date Filter */}
          <DateRangeSelect
            filterType={dateFilter}
            setFilterType={setDateFilter}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
            defaultType="last_30_days"
            sx={reportDateFilterSx}
          />

          {/* Pipeline Filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={pipelineFilter}
              onChange={(e) => handlePipelineFilterChange(e.target.value)}
              displayEmpty
              MenuProps={reportMenuProps}
              startAdornment={
                <FilterListIcon
                  sx={{ fontSize: "16px", mr: 1, color: "#64748B" }}
                />
              }
              sx={{
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 500,
                color: "#475569",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#E2E8F0",
                },
              }}
            >
              <MenuItem value="All">All Pipelines</MenuItem>
              {pipelinesList.map((pipe, idx) => {
                const val = pipe.id ?? pipe.value ?? pipe.name ?? pipe;
                const label =
                  pipe.label ?? pipe.category_name ?? pipe.name ?? String(val);
                return (
                  <MenuItem key={pipe.id || val || idx} value={val}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Campaign Filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={campaignFilter}
              onChange={(e) => handleCampaignFilterChange(e.target.value)}
              displayEmpty
              MenuProps={reportMenuProps}
              startAdornment={
                <FilterListIcon
                  sx={{ fontSize: "16px", mr: 1, color: "#64748B" }}
                />
              }
              sx={{
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 500,
                color: "#475569",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#E2E8F0",
                },
              }}
            >
              <MenuItem value="All">All Campaigns</MenuItem>
              {campaignsList.map((camp, idx) => {
                const val = camp.id ?? camp.value ?? camp.name ?? camp;
                const label =
                  camp.label ?? camp.name ?? camp.campaign_name ?? String(val);
                return (
                  <MenuItem key={camp.id || val || idx} value={val}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Search Campaign Keyword */}
          <TextField
            size="small"
            placeholder="Search campaign..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "#94A3B8" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 200,
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                fontSize: "13px",
                fontFamily: "'Inter', sans-serif",
                "& fieldset": { borderColor: "#E2E8F0" },
                "&:hover fieldset": { borderColor: "#CBD5E1" },
                "&.Mui-focused fieldset": { borderColor: "#84CC16" },
              },
            }}
          />
        </Box>

        {/* Action Buttons: Share & Export */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            onClick={handleShare}
            title="Share Report"
            sx={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              p: 1,
              color: "#475569",
              "&:hover": { backgroundColor: "#F8FAFC", color: "#84CC16" },
            }}
          >
            <ShareOutlinedIcon sx={{ fontSize: "20px" }} />
          </IconButton>
          <IconButton
            onClick={exportProps.openDownloadModal}
            title="Export Report"
            sx={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              p: 1,
              color: "#475569",
              "&:hover": { backgroundColor: "#F8FAFC", color: "#84CC16" },
            }}
          >
            <FileDownloadOutlinedIcon sx={{ fontSize: "20px" }} />
          </IconButton>
        </Box>
      </Box>

      {/* Dynamic Data Table */}
      <Table
        columns={tableColumns}
        rows={rows}
        loading={loading}
        serverSide={true}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalRecords}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          const newLimit = parseInt(e.target.value, 10);
          setRowsPerPage(newLimit);
          setPage(0);
        }}
        getRowId={(row) => row.id}
        minWidth={tableMinWidth}
        sx={{
          "& th:not(:last-child)": {
            borderRight: "1px solid #D0CCCC !important",
          },
          "& td:not(:last-child)": {
            borderRight: "1px solid #D0CCCC !important",
          },
        }}
      />

      {/* DOWNLOAD REPORT MODAL */}
      <ExportModal
        open={exportProps.downloadModalOpen}
        onClose={exportProps.closeDownloadModal}
        reportName="Campaign Source Report"
        columns={downloadReportColumns}
        isSubmitting={exportProps.isSubmitting}
        onDownload={exportProps.handleDownloadSubmit}
      />
    </Box>
  );
}
