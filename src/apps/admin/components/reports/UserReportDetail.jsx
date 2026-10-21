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
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { Snackbar } from "@mui/material";
import ExportModal from "@/apps/admin/components/common/ExportModal";
import useReportExport from "@/apps/admin/hooks/useReportExport";
import DateRangeSelect from "@/shared/components/filters/DateRangeSelect";
import Table from "@/shared/components/table/Table";
import {
  executeReportAdmin,
  fetchUsersDropdownAdmin,
} from "@/apps/admin/services/reportService";

export default function UserReportDetail({ onBack }) {
  const [dateFilter, setDateFilter] = useState("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedUser, setSelectedUser] = useState("All");
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

  const getBackendDateFilter = (filter) => {
    const map = {
      all: "All",
      today: "Today",
      yesterday: "Yesterday",
      weekly: "Last 7 Days",
      monthly: "This Month",
      year: "Last 30 Days",
      custom: "Custom Date",
    };
    return map[filter] || filter || "Today";
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
      if (dateFilter === "custom" && (!fromDate || !toDate)) {
        setLoading(false);
        setUserReportRows([]);
        setTotalCount(0);
        return;
      }

      setLoading(true);
      try {
        const payload = {
          report_key: "user_report",
          date_filter: getBackendDateFilter(dateFilter),
          from_date: dateFilter === "custom" ? fromDate : "",
          to_date: dateFilter === "custom" ? toDate : "",
          search: "",
          user_id: selectedUser,
          page: page + 1,
          limit: rowsPerPage,
        };
        const res = await executeReportAdmin(payload);
        if (res && res.success !== false) {
          const list = Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
            ? res
            : [];
          setUserReportRows(list);
          const total =
            typeof res?.total_records === "number"
              ? res.total_records
              : typeof res?.data?.total_records === "number"
              ? res.data.total_records
              : list.length;
          setTotalCount(total);
        }
      } catch (error) {
        console.error("Error fetching user report via execute_reports:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserReport();
  }, [dateFilter, selectedUser, page, rowsPerPage, fromDate, toDate]);

  const userReportColumns = [
    "User Name",
    "Date",
    "Mobile",
    "Total Calls",
    "Total Calls Connected",
    "Total Calls Unconnected",
    "Avg - Calling Time",
  ];

  const exportProps = useReportExport({
    reportKey: "user_report",
    columns: userReportColumns,
    getFilters: () => ({
      date_filter: getBackendDateFilter(dateFilter),
      from_date: dateFilter === "custom" ? fromDate : "",
      to_date: dateFilter === "custom" ? toDate : "",
      user_id: selectedUser,
    }),
  });

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
          <DateRangeSelect
            filterType={dateFilter}
            setFilterType={setDateFilter}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
            defaultType="today"
          />

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
      <ExportModal
        open={exportProps.downloadModalOpen}
        onClose={exportProps.closeDownloadModal}
        reportName="User Report"
        columns={userReportColumns}
        isSubmitting={exportProps.isSubmitting}
        onDownload={exportProps.handleDownloadSubmit}
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
