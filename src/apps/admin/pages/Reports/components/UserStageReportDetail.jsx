import { useState, useEffect, useRef, useMemo } from "react";
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
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ErrorIcon from "@mui/icons-material/Error";
import DownloadReportModal from "./DownloadReportModal";
import DownloadStartedDialog from "@/apps/admin/components/dialogs/DownloadStartedDialog";
import useReportExport from "@/apps/admin/hooks/useReportExport";
import CustomDateDialog from "@/shared/components/dialogs/CustomDateDialog";
import Table from "@/shared/components/table/Table";
import {
  fetchUsersDropdownAdmin,
  fetchPipelinesDropdownAdmin,
  executeReportAdmin,
} from "@/apps/admin/services/reportService";

export default function UserStageReportDetail({ onBack }) {
  const [dateFilter, setDateFilter] = useState("Today");
  const [pipelineFilter, setPipelineFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState("All");
  const [usersList, setUsersList] = useState([]);
  const [pipelinesList, setPipelinesList] = useState([]);

  // Table & API states
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0); // 0-indexed for MUI TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Custom date filter states
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [openCustomDateDialog, setOpenCustomDateDialog] = useState(false);
  const prevDateFilterRef = useRef("Today");
  const appliedRef = useRef(false);
  const isMountedRef = useRef(true);

  // Toast / notification state (only for errors)
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  // Request race condition tracker
  const requestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [usersRes, pipelinesRes] = await Promise.all([
          fetchUsersDropdownAdmin(),
          fetchPipelinesDropdownAdmin(),
        ]);
        if (usersRes?.success && Array.isArray(usersRes?.data)) {
          setUsersList(usersRes.data);
        } else if (Array.isArray(usersRes)) {
          setUsersList(usersRes);
        }

        if (pipelinesRes?.success && Array.isArray(pipelinesRes?.data)) {
          setPipelinesList(pipelinesRes.data);
        } else if (Array.isArray(pipelinesRes)) {
          setPipelinesList(pipelinesRes);
        }
      } catch (err) {
        console.error("Error fetching dropdown options:", err);
        setToast({
          open: true,
          message: "Failed to load dropdown options. Please try again.",
          severity: "error",
        });
      }
    };
    loadDropdowns();
  }, []);

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
        report_key: "user_stage_report",
        date_filter: dateFilter,
        pipeline_id: pipelineFilter,
        user_id: selectedUser,
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
          if (Array.isArray(response.columns)) {
            setColumns(response.columns);
          }
          setTotalRecords(
            typeof response.total_records === "number"
              ? response.total_records
              : list.length,
          );
        } else {
          const errMsg =
            response?.message || "Failed to fetch user stage report";
          setToast({
            open: true,
            message: errMsg,
            severity: "error",
          });
          setRows([]);
          setTotalRecords(0);
          setColumns([]);
        }
      } catch (err) {
        if (ignore || currentRequestId !== requestIdRef.current) return;
        console.error("Error fetching user stage report:", err);
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch user stage report";
        setToast({
          open: true,
          message: errMsg,
          severity: "error",
        });
        setRows([]);
        setTotalRecords(0);
        setColumns([]);
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
    selectedUser,
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
    setPage(0);
  };

  const handleSelectedUserChange = (val) => {
    setSelectedUser(val);
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

      if (col.field === "s_no" || col.headerName === "No") {
        colDef.renderCell = (row) => row.s_no ?? row.id;
      } else if (col.color) {
        colDef.renderCell = (row) => (
          <Typography
            sx={{
              color: col.color,
              fontWeight: 600,
              fontSize: "14px",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {row[col.field]}
          </Typography>
        );
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
    reportKey: "user_stage_report",
    columns: downloadReportColumns,
    getFilters: () => ({
      date_filter: dateFilter,
      from_date: dateFilter === "Custom Date" ? customFrom : "",
      to_date: dateFilter === "Custom Date" ? customTo : "",
      pipeline_id: pipelineFilter,
      user_id: selectedUser,
    }),
  });

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
          User Stage Report
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
                const val = pipe.id ?? pipe.value ?? pipe;
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

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              value={selectedUser}
              onChange={(e) => handleSelectedUserChange(e.target.value)}
              displayEmpty
              startAdornment={
                <GroupOutlinedIcon
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
              <MenuItem value="All">All Users</MenuItem>
              {usersList.map((user, idx) => {
                const val = user.id ?? user.value ?? user;
                const label =
                  user.label ?? user.user_name ?? user.name ?? String(val);
                return (
                  <MenuItem key={user.id || val || idx} value={val}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>

        <IconButton
          onClick={exportProps.openDownloadModal}
          sx={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            p: 1,
            color: "#475569",
            "&:hover": { backgroundColor: "#F8FAFC" },
          }}
        >
          <FileDownloadOutlinedIcon sx={{ fontSize: "20px" }} />
        </IconButton>
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
      <DownloadReportModal
        open={exportProps.downloadModalOpen}
        onClose={exportProps.closeDownloadModal}
        reportName="User Stage Report"
        columns={downloadReportColumns}
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
