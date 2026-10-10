import React, { useState, useEffect } from "react";
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
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { Snackbar } from "@mui/material";
import DownloadReportModal from "./DownloadReportModal";
import Table from "@/shared/components/table/Table";
import {
  fetchUsersDropdownAdmin,
  fetchReportingManagersDropdownAdmin,
} from "@/apps/admin/services/reportService";

export default function LeadDispositionReportDetail({ onBack }) {
  const [dateFilter, setDateFilter] = useState("Today");
  const [reportingManager, setReportingManager] = useState("All");
  const [selectedUser, setSelectedUser] = useState("All");
  const [openDownloadModal, setOpenDownloadModal] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const [usersList, setUsersList] = useState([]);
  const [managersList, setManagersList] = useState([]);

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
      }
    };
    loadDropdowns();
  }, []);

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
    { field: "id", headerName: "No.", minWidth: "60px", align: "center" },
    {
      field: "userName",
      headerName: "User Name",
      minWidth: "150px",
      align: "center",
      renderCell: (row) => (
        <Typography sx={{ color: "#4D4D4D", fontWeight: 600, fontSize: "14px", fontFamily: "'Inter', sans-serif" }}>
          {row.userName}
        </Typography>
      ),
    },
    { field: "reportingManager", headerName: "Reporting Manager", minWidth: "170px", align: "center" },
    { field: "mobileNumber", headerName: "Mobile Number", minWidth: "150px", align: "center" },
    { field: "date", headerName: "Date", minWidth: "140px", align: "center" },
    {
      field: "totalDisposed",
      headerName: "Total Disposed Count",
      minWidth: "180px",
      align: "center",
      renderCell: (row) => (
        <Typography sx={{ color: "#4D4D4D", fontWeight: 600, fontSize: "14px", fontFamily: "'Inter', sans-serif" }}>
          {row.totalDisposed}
        </Typography>
      ),
    },
    {
      field: "disposedConnected",
      headerName: "Disposed Yes Connected Count",
      minWidth: "230px",
      align: "center",
      renderCell: (row) => (
        <Typography sx={{ color: "#16A34A", fontWeight: 600, fontSize: "14px", fontFamily: "'Inter', sans-serif" }}>
          {row.disposedConnected}
        </Typography>
      ),
    },
    {
      field: "disposedNotConnected",
      headerName: "Disposed Not Connected Count",
      minWidth: "230px",
      align: "center",
      renderCell: (row) => (
        <Typography sx={{ color: "#DC2626", fontWeight: 600, fontSize: "14px", fontFamily: "'Inter', sans-serif" }}>
          {row.disposedNotConnected}
        </Typography>
      ),
    },
    {
      field: "follow-upLeads",
      headerName: "Total Follow-Up Leads",
      minWidth: "190px",
      align: "center",
      renderCell: (row) => (
        <Typography sx={{ color: "#2563EB", fontWeight: 600, fontSize: "14px", fontFamily: "'Inter', sans-serif" }}>
          {row.inProgressLeads}
        </Typography>
      ),
    },
    {
      field: "convertedLeads",
      headerName: "Total Converted Leads",
      minWidth: "180px",
      align: "center",
      renderCell: (row) => (
        <Typography sx={{ color: "#16A34A", fontWeight: 600, fontSize: "14px", fontFamily: "'Inter', sans-serif" }}>
          {row.convertedLeads}
        </Typography>
      ),
    },
    {
      field: "lostLeads",
      headerName: "Total Lost Leads",
      align: "center",
      renderCell: (row) => (
        <Typography sx={{ color: "#DC2626", fontWeight: 600, fontSize: "14px", fontFamily: "'Inter', sans-serif" }}>
          {row.lostLeads}
        </Typography>
      ),
    },
  ];

  const dispositionRows = [
    {
      id: 1,
      userName: "Anandhi",
      reportingManager: "Gunalraj k",
      mobileNumber: "8111078282",
      date: "08 Oct 2026",
      totalDisposed: 35,
      disposedConnected: 35,
      disposedNotConnected: 0,
      inProgressLeads: 31,
      convertedLeads: 1,
      lostLeads: 3,
    },
    {
      id: 2,
      userName: "Vishalini",
      reportingManager: "Gunalraj k",
      mobileNumber: "8111079292",
      date: "08 Oct 2026",
      totalDisposed: 91,
      disposedConnected: 91,
      disposedNotConnected: 0,
      inProgressLeads: 71,
      convertedLeads: 0,
      lostLeads: 20,
    },
    {
      id: 3,
      userName: "Priya",
      reportingManager: "Gunalraj k",
      mobileNumber: "8110054327",
      date: "08 Oct 2026",
      totalDisposed: 60,
      disposedConnected: 60,
      disposedNotConnected: 0,
      inProgressLeads: 49,
      convertedLeads: 2,
      lostLeads: 9,
    },
    {
      id: 4,
      userName: "Babu",
      reportingManager: "Gunalraj k",
      mobileNumber: "7826813920",
      date: "08 Oct 2026",
      totalDisposed: 45,
      disposedConnected: 45,
      disposedNotConnected: 0,
      inProgressLeads: 41,
      convertedLeads: 3,
      lostLeads: 1,
    },
    {
      id: 5,
      userName: "Ajitha",
      reportingManager: "Gunalraj k",
      mobileNumber: "8111058383",
      date: "08 Oct 2026",
      totalDisposed: 63,
      disposedConnected: 63,
      disposedNotConnected: 0,
      inProgressLeads: 58,
      convertedLeads: 0,
      lostLeads: 5,
    },
    {
      id: 6,
      userName: "Gunalraj k",
      reportingManager: "-",
      mobileNumber: "6374092491",
      date: "08 Oct 2026",
      totalDisposed: 0,
      disposedConnected: 0,
      disposedNotConnected: 0,
      inProgressLeads: 0,
      convertedLeads: 0,
      lostLeads: 0,
    },
    {
      id: 7,
      userName: "Anushya",
      reportingManager: "Gunalraj k",
      mobileNumber: "6384976628",
      date: "08 Oct 2026",
      totalDisposed: 0,
      disposedConnected: 0,
      disposedNotConnected: 0,
      inProgressLeads: 0,
      convertedLeads: 0,
      lostLeads: 0,
    },
    {
      id: 8,
      userName: "Vinitha",
      reportingManager: "Gunalraj k",
      mobileNumber: "8111095454",
      date: "08 Oct 2026",
      totalDisposed: 0,
      disposedConnected: 0,
      disposedNotConnected: 0,
      inProgressLeads: 0,
      convertedLeads: 0,
      lostLeads: 0,
    },
    {
      id: 9,
      userName: "Tharun",
      reportingManager: "Gunalraj k",
      mobileNumber: "9087622780",
      date: "08 Oct 2026",
      totalDisposed: 0,
      disposedConnected: 0,
      disposedNotConnected: 0,
      inProgressLeads: 0,
      convertedLeads: 0,
      lostLeads: 0,
    },
    {
      id: 10,
      userName: "Dhivya",
      reportingManager: "Gunalraj k",
      mobileNumber: "6384976908",
      date: "08 Oct 2026",
      totalDisposed: 0,
      disposedConnected: 0,
      disposedNotConnected: 0,
      inProgressLeads: 0,
      convertedLeads: 0,
      lostLeads: 0,
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
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
              <MenuItem value="Custom Date">Custom Date</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={reportingManager}
              onChange={(e) => setReportingManager(e.target.value)}
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
                const label = mgr.label ?? mgr.name ?? mgr.user_name ?? String(val);
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
              <MenuItem value="All">All Users</MenuItem>
              {usersList.map((user, idx) => {
                const val = user.value ?? user.id ?? user.name ?? user;
                const label = user.label ?? user.name ?? user.user_name ?? String(val);
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
        rows={dispositionRows}
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
        onDownload={(config) => {
          setToast({
            open: true,
            message: `Lead Disposition Report downloaded successfully (${config.fileFormat.toUpperCase()})!`,
            severity: "success",
          });
        }}
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
