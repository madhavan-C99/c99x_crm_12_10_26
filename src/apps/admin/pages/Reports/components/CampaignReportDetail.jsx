import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  Snackbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FilterListIcon from "@mui/icons-material/FilterList";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ErrorIcon from "@mui/icons-material/Error";
import DownloadReportModal from "./DownloadReportModal";
import DownloadStartedDialog from "@/apps/admin/components/dialogs/DownloadStartedDialog";
import useReportExport from "@/apps/admin/hooks/useReportExport";
import CustomDateDialog from "@/shared/components/dialogs/CustomDateDialog";
import Table from "@/shared/components/table/Table";

import {
  fetchPipelinesDropdownAdmin,
  fetchCampaignsDropdownAdmin,
  executeReportAdmin,
} from "@/apps/admin/services/reportService";

export default function CampaignReportDetail({ onBack }) {
  const [dateFilter, setDateFilter] = useState("Today");
  const [pipelineFilter, setPipelineFilter] = useState("All");
  const [campaignFilter, setCampaignFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [pipelinesList, setPipelinesList] = useState([]);
  const [campaignsList, setCampaignsList] = useState([]);

  // Table & API states
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0); // 0-indexed for MUI TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Custom date filter states
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [openCustomDateDialog, setOpenCustomDateDialog] = useState(false);
  const prevDateFilterRef = useRef("Today");
  const appliedRef = useRef(false);

  // Toast / notification state (only for errors)
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  // Race condition tracker & clean unmount check
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
        setToast({
          open: true,
          message: "Failed to load dropdown options. Please try again.",
          severity: "error",
        });
      }
    };
    loadPipelines();
    return () => {
      ignore = true;
    };
  }, []);

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
        setToast({
          open: true,
          message: "Failed to load campaigns. Please try again.",
          severity: "error",
        });
      }
    };

    loadCampaigns();

    return () => {
      ignore = true;
    };
  }, [pipelineFilter]);

  useEffect(() => {
    let ignore = false;
    const currentRequestId = ++requestIdRef.current;

    const fetchReport = async () => {
      if (dateFilter === "Custom Date" && (!customFrom || !customTo)) {
        setLoading(false);
        setRows([]);
        setTotalRecords(0);
        return;
      }

      setLoading(true);

      const payload = {
        report_key: "campaign_report",
        date_filter: dateFilter,
        pipeline_id: pipelineFilter,
        campaign_id: campaignFilter,
        campaign_status: statusFilter,
        page: page + 1,
        limit: rowsPerPage,
      };

      if (dateFilter === "Custom Date") {
        payload.from_date = customFrom;
        payload.to_date = customTo;
      }

      try {
        const response = await executeReportAdmin(payload);
        if (ignore || currentRequestId !== requestIdRef.current) return;

        if (response && response.success !== false) {
          const list = Array.isArray(response.data) ? response.data : [];
          setRows(list);
          setTotalRecords(
            typeof response.total_records === "number"
              ? response.total_records
              : list.length,
          );
        } else {
          const errMsg = response?.message || "Failed to fetch campaign report";
          setToast({
            open: true,
            message: errMsg,
            severity: "error",
          });
          setRows([]);
          setTotalRecords(0);
        }
      } catch (err) {
        if (ignore || currentRequestId !== requestIdRef.current) return;
        console.error("Error fetching campaign report:", err);
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch campaign report";
        setToast({
          open: true,
          message: errMsg,
          severity: "error",
        });
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
    statusFilter,
    page,
    rowsPerPage,
    customFrom,
    customTo,
  ]);

  const handleDateFilterChange = (val) => {
    if (val === "Custom Date") {
      appliedRef.current = false;
      prevDateFilterRef.current = dateFilter;
      setDateFilter("Custom Date");
      setOpenCustomDateDialog(true);
      return;
    }
    prevDateFilterRef.current = val;
    setDateFilter(val);
    setPage(0);
  };

  const handleApplyCustomDate = (from, to) => {
    appliedRef.current = true;
    setCustomFrom(from);
    setCustomTo(to);
    setPage(0);
    setOpenCustomDateDialog(false);
  };

  const handleCloseCustomDateDialog = () => {
    setOpenCustomDateDialog(false);
    if (appliedRef.current) {
      appliedRef.current = false;
      return;
    }
    if (!customFrom || !customTo) {
      setDateFilter(prevDateFilterRef.current || "Today");
    }
  };

  const handlePipelineFilterChange = (val) => {
    setPipelineFilter(val);
    setCampaignFilter("All");
    setPage(0);
  };

  const handleCampaignFilterChange = (val) => {
    setCampaignFilter(val);
    setPage(0);
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setPage(0);
  };

  const campaignReportColumns = [
    "Campaign Name",
    "Pipeline",
    "Total Lead Count",
    "Total Calls Connected",
    "Leads Marked as Converted",
    "Leads Marked as Lost",
  ];

  const exportProps = useReportExport({
    reportKey: "campaign_report",
    columns: campaignReportColumns,
    getFilters: () => ({
      date_filter: dateFilter,
      from_date: dateFilter === "Custom Date" ? customFrom : "",
      to_date: dateFilter === "Custom Date" ? customTo : "",
      pipeline_id: pipelineFilter,
      campaign_id: campaignFilter,
      campaign_status: statusFilter,
    }),
  });

  const tableColumns = [
    {
      field: "s_no",
      headerName: "No",
      minWidth: "60px",
      align: "center",
      renderCell: (row) => row.s_no,
    },
    {
      field: "campaign_name",
      headerName: "Campaign Name",
      minWidth: "220px",
      align: "center",
      renderCell: (row) => (
        <Typography
          sx={{
            color: "#4D4D4D",
            fontWeight: 600,
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {row.campaign_name}
        </Typography>
      ),
    },
    {
      field: "pipeline_name",
      headerName: "Pipeline",
      minWidth: "220px",
      align: "center",
    },
    {
      field: "total_lead_count",
      headerName: "Total Lead Count",
      minWidth: "160px",
      align: "center",
      renderCell: (row) => (
        <Typography
          sx={{
            color: "#4D4D4D",
            fontWeight: 600,
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {row.total_lead_count}
        </Typography>
      ),
    },
    {
      field: "total_calls_connected",
      headerName: "Total Calls Connected",
      minWidth: "180px",
      align: "center",
      renderCell: (row) => (
        <Typography
          sx={{
            color: "#16A34A",
            fontWeight: 600,
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {row.total_calls_connected}
        </Typography>
      ),
    },
    {
      field: "leads_marked_as_converted",
      headerName: "Leads Marked as Converted",
      minWidth: "220px",
      align: "center",
      renderCell: (row) => (
        <Typography
          sx={{
            color: "#16A34A",
            fontWeight: 600,
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {row.leads_marked_as_converted}
        </Typography>
      ),
    },
    {
      field: "leads_marked_as_lost",
      headerName: "Leads Marked as Lost",
      align: "center",
      renderCell: (row) => (
        <Typography
          sx={{
            color: "#DC2626",
            fontWeight: 600,
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {row.leads_marked_as_lost}
        </Typography>
      ),
    },
  ];

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
          Campaign Report
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
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={dateFilter}
              onChange={(e) => handleDateFilterChange(e.target.value)}
              startAdornment={
                <CalendarTodayIcon
                  sx={{ fontSize: "16px", mr: 1, color: "#84CC16" }}
                />
              }
              sx={{
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 600,
                color: "#475569",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#E2E8F0",
                },
              }}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Today">Today</MenuItem>
              <MenuItem value="Yesterday">Yesterday</MenuItem>
              <MenuItem value="Last 7 Days">Last 7 Days</MenuItem>
              <MenuItem value="Last 30 Days">Last 30 Days</MenuItem>
              <MenuItem value="This Month">This Month</MenuItem>
              <MenuItem
                value="Custom Date"
                onClick={() => {
                  if (dateFilter === "Custom Date") {
                    appliedRef.current = false;
                    setOpenCustomDateDialog(true);
                  }
                }}
              >
                Custom Date
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={pipelineFilter}
              onChange={(e) => handlePipelineFilterChange(e.target.value)}
              displayEmpty
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

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={campaignFilter}
              onChange={(e) => handleCampaignFilterChange(e.target.value)}
              displayEmpty
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
                  camp.label ?? camp.campaign_name ?? camp.name ?? String(val);
                return (
                  <MenuItem key={camp.id || val || idx} value={val}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 170 }}>
            <Select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              displayEmpty
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
              <MenuItem value="All">Campaign Status</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            sx={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              p: 1,
              color: "#475569",
              "&:hover": { backgroundColor: "#F8FAFC" },
            }}
          >
            <ShareOutlinedIcon sx={{ fontSize: "24px" }} />
          </IconButton>
          <IconButton
            onClick={exportProps.openDownloadModal}
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
        minWidth={1450}
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
      <DownloadReportModal
        open={exportProps.downloadModalOpen}
        onClose={exportProps.closeDownloadModal}
        reportName="Campaign Report"
        columns={campaignReportColumns}
        isSubmitting={exportProps.isSubmitting}
        onDownload={exportProps.handleDownloadSubmit}
      />

      {/* DOWNLOAD STARTED DIALOG */}
      <DownloadStartedDialog
        open={exportProps.downloadStartedOpen}
        onClose={exportProps.closeDownloadStarted}
        onView={exportProps.handleViewLogs}
      />

      {/* CUSTOM DATE DIALOG */}
      <CustomDateDialog
        allowSingleDate
        open={openCustomDateDialog}
        onClose={handleCloseCustomDateDialog}
        onApply={handleApplyCustomDate}
        initialFrom={customFrom}
        initialTo={customTo}
        accentColor="#84CC16"
      />

      {/* FLOATING TOP-CENTER PILL TOAST POPUP */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: 1 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            backgroundColor: "#FFFFFF",
            color: "#0F172A",
            px: 3,
            py: 1.2,
            borderRadius: "50px",
            border: "1.5px solid #EF4444",
            boxShadow: "0px 6px 24px rgba(0, 0, 0, 0.08)",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <ErrorIcon sx={{ color: "#EF4444", fontSize: 22 }} />
          <Typography
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
              fontWeight: 500,
              color: "#0F172A",
            }}
          >
            {toast.message}
          </Typography>
        </Box>
      </Snackbar>
    </Box>
  );
}
