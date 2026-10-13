import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { Snackbar } from "@mui/material";
import DownloadReportModal from "./DownloadReportModal";
import CustomDateDialog from "@/shared/components/dialogs/CustomDateDialog";
import Table from "@/shared/components/table/Table";
import {
  executeReportAdmin,
  fetchUsersDropdownAdmin,
  exportReportAdmin,
} from "@/apps/admin/services/reportService";

export default function UserReportDetail({ onBack }) {
  const [dateFilter, setDateFilter] = useState("Today");
  const [selectedUser, setSelectedUser] = useState("All");
  const [openDownloadModal, setOpenDownloadModal] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [userReportRows, setUserReportRows] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Custom date filter states
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [openCustomDateDialog, setOpenCustomDateDialog] = useState(false);
  const prevDateFilterRef = useRef("Today");
  const appliedRef = useRef(false);

  useEffect(() => {
    const loadUsersDropdown = async () => {
      try {
        const res = await fetchUsersDropdownAdmin();
        if (res?.success && Array.isArray(res?.data)) {
          setUsersList(res.data);
        } else if (Array.isArray(res)) {
          setUsersList(res);
        }
      } catch (error) {
        console.error("Error fetching users dropdown:", error);
      }
    };
    loadUsersDropdown();
  }, []);

  useEffect(() => {
    const loadUserReport = async () => {
      if (dateFilter === "Custom Date" && (!customFrom || !customTo)) {
        setLoading(false);
        setUserReportRows([]);
        setTotalCount(0);
        return;
      }

      setLoading(true);
      try {
        const payload = {
          report_key: "user_report",
          date_filter: dateFilter,
          from_date: "",
          to_date: "",
          search: "",
          user_id: selectedUser,
          page: page + 1,
          limit: rowsPerPage,
        };
        if (dateFilter === "Custom Date") {
          payload.from_date = customFrom;
          payload.to_date = customTo;
        }
        const res = await executeReportAdmin(payload);
        if (res?.success && Array.isArray(res?.data)) {
          setUserReportRows(res.data);
          if (res.total_records !== undefined) {
            setTotalCount(res.total_records);
          } else {
            setTotalCount(res.data.length);
          }
        } else if (Array.isArray(res)) {
          setUserReportRows(res);
          setTotalCount(res.length);
        }
      } catch (error) {
        console.error("Error fetching user report via execute_reports:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserReport();
  }, [dateFilter, selectedUser, page, rowsPerPage, customFrom, customTo]);

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

  const userReportColumns = [
    "User Name",
    "Date",
    "Mobile",
    "Total Calls",
    "Total Calls Connected",
    "Total Calls Unconnected",
    "Avg - Calling Time",
  ];

  const tableColumns = [
    { field: "id", headerName: "No", minWidth: "60px", align: "center" },
    {
      field: "userName",
      headerName: "User Name",
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
          {row.userName}
        </Typography>
      ),
    },
    { field: "date", headerName: "Date", minWidth: "140px", align: "center" },
    {
      field: "mobile",
      headerName: "Mobile",
      minWidth: "220px",
      align: "center",
    },
    {
      field: "totalCalls",
      headerName: "Total Calls",
      minWidth: "140px",
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
          {row.totalCalls}
        </Typography>
      ),
    },
    {
      field: "connectedCalls",
      headerName: "Total Calls Connected",
      minWidth: "200px",
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
          {row.connectedCalls}
        </Typography>
      ),
    },
    {
      field: "unconnectedCalls",
      headerName: "Total Calls Unconnected",
      minWidth: "220px",
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
          {row.unconnectedCalls}
        </Typography>
      ),
    },
    {
      field: "avgCallingTime",
      headerName: "Avg - Calling Time",
      align: "center",
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
          User Report
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

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
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
              <MenuItem value="All">All</MenuItem>
              {usersList.map((user, idx) => {
                const val = user.id ?? user.value ?? user.name ?? user.label;
                const label =
                  user.name ?? user.label ?? user.userName ?? user.value;
                return (
                  <MenuItem key={val || idx} value={val}>
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
        rows={userReportRows}
        loading={loading}
        serverSide={true}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          const newRowsPerPage = parseInt(e.target.value, 10);
          setRowsPerPage(newRowsPerPage);
          setPage(0);
        }}
        minWidth={1350}
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
        reportName="User Report"
        columns={userReportColumns}
        onDownload={async (config) => {
          try {
            await exportReportAdmin({
              report_key: "user_report",
              file_format: config.fileFormat,
              selected_columns: config.selectedColumns,
              filters: {
                date_filter: dateFilter,
                user_id: selectedUser,
              },
            });
            setToast({
              open: true,
              message: `User Report downloaded successfully (${config.fileFormat.toUpperCase()})!`,
              severity: "success",
            });
          } catch (error) {
            console.error("Export error:", error);
            setToast({
              open: true,
              message: "Failed to download report. Please try again.",
              severity: "error",
            });
          }
        }}
      />

      {/* CUSTOM DATE DIALOG */}
      <CustomDateDialog
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
