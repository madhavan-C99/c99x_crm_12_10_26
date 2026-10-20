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
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ErrorIcon from "@mui/icons-material/Error";
import ExportModal from "@/apps/admin/components/common/ExportModal";
import useReportExport from "@/apps/admin/hooks/useReportExport";
import Table from "@/shared/components/table/Table";
import {
  fetchUsersDropdownAdmin,
  fetchReportingManagersDropdownAdmin,
  executeReportAdmin,
} from "@/apps/admin/services/reportService";

export default function UserFollowUpReportDetail({ onBack }) {
  const [selectedUser, setSelectedUser] = useState("All");
  const [selectedManager, setSelectedManager] = useState("All");
  const [usersList, setUsersList] = useState([]);
  const [managersList, setManagersList] = useState([]);

  // Table & API states
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0); // 0-indexed for MUI TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Toast / notification state (only for errors)
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  // Race condition tracker
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

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
      } catch (error) {
        console.error("Error fetching dropdown options:", error);
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
      setLoading(true);

      const payload = {
        report_key: "user_followup_report",
        user_id: selectedUser,
        reporting_manager_id: selectedManager,
        page: page + 1,
        limit: rowsPerPage,
      };

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
            response?.message || "Failed to fetch user follow up report";
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
        console.error("Error fetching user follow up report:", err);
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch user follow up report";
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
  }, [selectedUser, selectedManager, page, rowsPerPage]);

  const handleUserChange = (val) => {
    setSelectedUser(val);
    setPage(0);
  };

  const handleManagerChange = (val) => {
    setSelectedManager(val);
    setPage(0);
  };

  const userFollowUpColumns = [
    "User Name",
    "Reporting Manager",
    "Follow-Ups Due Today",
    "Conversion %",
    "Average TAT",
  ];

  const exportProps = useReportExport({
    reportKey: "user_followup_report",
    columns: userFollowUpColumns,
    getFilters: () => ({
      user_id: selectedUser,
      reporting_manager: selectedManager,
      reporting_manager_id: selectedManager,
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
      field: "user_name",
      headerName: "User Name",
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
          {row.user_name}
        </Typography>
      ),
    },
    {
      field: "reporting_manager",
      headerName: "Reporting Manager",
      minWidth: "200px",
      align: "center",
    },
    {
      field: "followups_due_today",
      headerName: "Follow-Ups Due Today",
      minWidth: "200px",
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
          {row.followups_due_today}
        </Typography>
      ),
    },
    {
      field: "conversion_percentage",
      headerName: "Conversion %",
      minWidth: "160px",
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
          {row.conversion_percentage}
        </Typography>
      ),
    },
    { field: "average_tat", headerName: "Average TAT", align: "center" },
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
          User Follow Up Report
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
              value={selectedUser}
              onChange={(e) => handleUserChange(e.target.value)}
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

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={selectedManager}
              onChange={(e) => handleManagerChange(e.target.value)}
              displayEmpty
              startAdornment={
                <PersonOutlinedIcon
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
              <MenuItem value="All">All Managers</MenuItem>
              {managersList.map((mgr, idx) => {
                const val = mgr.id ?? mgr.value ?? mgr;
                const label =
                  mgr.label ?? mgr.user_name ?? mgr.name ?? String(val);
                return (
                  <MenuItem key={mgr.id || val || idx} value={val}>
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
        minWidth={1150}
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
        reportName="User Follow Up Report"
        columns={userFollowUpColumns}
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
