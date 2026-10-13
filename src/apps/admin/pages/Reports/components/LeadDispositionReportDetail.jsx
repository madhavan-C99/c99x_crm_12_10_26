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
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import DownloadReportModal from "./DownloadReportModal";
import CustomDateDialog from "@/shared/components/dialogs/CustomDateDialog";
import Table from "@/shared/components/table/Table";
import {
  fetchUsersDropdownAdmin,
  fetchReportingManagersDropdownAdmin,
  executeReportAdmin,
} from "@/apps/admin/services/reportService";

export default function LeadDispositionReportDetail({ onBack }) {
  const [dateFilter, setDateFilter] = useState("Today");
  const [reportingManager, setReportingManager] = useState("All");
  const [selectedUser, setSelectedUser] = useState("All");
  const [openDownloadModal, setOpenDownloadModal] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [managersList, setManagersList] = useState([]);

  // Table & API states
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  void error;
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

  // Toast / notification state
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
        const [usersRes, managersRes] = await Promise.all([
          fetchUsersDropdownAdmin(),
          fetchReportingManagersDropdownAdmin(),
        ]);
        if (usersRes?.success && Array.isArray(usersRes?.data)) {
          setUsersList(usersRes.data);
        } else if (Array.isArray(usersRes)) {
          setUsersList(usersRes);
        }

        if (managersRes?.success && Array.isArray(managersRes?.data)) {
          setManagersList(managersRes.data);
        } else if (Array.isArray(managersRes)) {
          setManagersList(managersRes);
        }
      } catch (err) {
        console.error("Error fetching dropdown options:", err);
        setError("Failed to load dropdown options");
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
      setError(null);

      const payload = {
        report_key: "lead_disposition_report",
        date_filter: dateFilter,
        reporting_manager: reportingManager,
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
          setTotalRecords(
            typeof response.total_records === "number"
              ? response.total_records
              : list.length,
          );
        } else {
          const errMsg =
            response?.message || "Failed to fetch lead disposition report";
          setError(errMsg);
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
        console.error("Error fetching lead disposition report:", err);
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch lead disposition report";
        setError(errMsg);
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
    reportingManager,
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

  const handleReportingManagerChange = (val) => {
    setReportingManager(val);
    setPage(0);
  };

  const handleSelectedUserChange = (val) => {
    setSelectedUser(val);
    setPage(0);
  };

  const leadDispositionColumns = [
    "User Name",
    "Reporting Manager",
    "Mobile Number",
    "Date",
    "Total Disposed Count",
    "Disposed Yes Connected Count",
    "Disposed Not Connected Count",
    "Total Follow-Up Leads",
    "Total Converted Leads",
    "Total Lost Leads",
  ];

  const tableColumns = [
    {
      field: "id",
      headerName: "No.",
      minWidth: "60px",
      align: "center",
      renderCell: (_row, index) => (
        <Typography
          sx={{
            color: "#4D4D4D",
            fontWeight: 500,
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {page * rowsPerPage + index + 1}
        </Typography>
      ),
    },
    {
      field: "user_name",
      headerName: "User Name",
      minWidth: "150px",
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
          {row.user_name}
        </Typography>
      ),
    },
    {
      field: "reporting_manager",
      headerName: "Reporting Manager",
      minWidth: "170px",
      align: "center",
    },
    {
      field: "mobile_number",
      headerName: "Mobile Number",
      minWidth: "150px",
      align: "center",
    },
    { field: "date", headerName: "Date", minWidth: "140px", align: "center" },
    {
      field: "total_disposed_count",
      headerName: "Total Disposed Count",
      minWidth: "180px",
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
          {row.total_disposed_count}
        </Typography>
      ),
    },
    {
      field: "disposed_yes_connected_count",
      headerName: "Disposed Yes Connected Count",
      minWidth: "230px",
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
          {row.disposed_yes_connected_count}
        </Typography>
      ),
    },
    {
      field: "disposed_not_connected_count",
      headerName: "Disposed Not Connected Count",
      minWidth: "230px",
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
          {row.disposed_not_connected_count}
        </Typography>
      ),
    },
    {
      field: "total_followup_leads",
      headerName: "Total Follow-Up Leads",
      minWidth: "190px",
      align: "center",
      renderCell: (row) => (
        <Typography
          sx={{
            color: "#2563EB",
            fontWeight: 600,
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {row.total_followup_leads}
        </Typography>
      ),
    },
    {
      field: "total_converted_leads",
      headerName: "Total Converted Leads",
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
          {row.total_converted_leads}
        </Typography>
      ),
    },
    {
      field: "total_lost_leads",
      headerName: "Total Lost Leads",
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
          {row.total_lost_leads}
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
          Lead Disposition Report
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
          <FormControl size="small" sx={{ minWidth: 130 }}>
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

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={reportingManager}
              onChange={(e) => handleReportingManagerChange(e.target.value)}
              displayEmpty
              startAdornment={
                <PersonOutlinedIcon
                  sx={{ fontSize: "18px", mr: 1, color: "#64748B" }}
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
              <MenuItem value="All">All Reporting Managers</MenuItem>
              {managersList.map((mgr, idx) => {
                const val = mgr.value ?? mgr.id ?? mgr.name ?? mgr;
                const label =
                  mgr.label ?? mgr.name ?? mgr.user_name ?? String(val);
                return (
                  <MenuItem key={mgr.id || val || idx} value={val}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={selectedUser}
              onChange={(e) => handleSelectedUserChange(e.target.value)}
              displayEmpty
              startAdornment={
                <GroupOutlinedIcon
                  sx={{ fontSize: "18px", mr: 1, color: "#64748B" }}
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
                const val = user.value ?? user.id ?? user.name ?? user;
                const label =
                  user.label ?? user.name ?? user.user_name ?? String(val);
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
          onClick={() => setOpenDownloadModal(true)}
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
        minWidth={1850}
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
        open={openDownloadModal}
        onClose={() => setOpenDownloadModal(false)}
        reportName="Lead Disposition Report"
        columns={leadDispositionColumns}
        onDownload={() => {}}
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
            border:
              toast.severity === "error"
                ? "1.5px solid #EF4444"
                : "1.5px solid #84CC16",
            boxShadow: "0px 6px 24px rgba(0, 0, 0, 0.08)",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {toast.severity === "error" ? (
            <ErrorIcon sx={{ color: "#EF4444", fontSize: 22 }} />
          ) : (
            <CheckCircleIcon sx={{ color: "#84CC16", fontSize: 22 }} />
          )}
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
