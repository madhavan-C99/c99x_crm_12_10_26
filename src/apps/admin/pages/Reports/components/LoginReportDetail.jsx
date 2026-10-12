import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Menu,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import PhoneCallbackIcon from "@mui/icons-material/PhoneCallback";
import PhoneDisabledIcon from "@mui/icons-material/PhoneDisabled";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { Snackbar } from "@mui/material";
import dayjs from "dayjs";
import DownloadReportModal from "./DownloadReportModal";
import CustomDateDialog from "@/shared/components/table/CustomDateDialog";
import Table from "@/shared/components/table/Table";
import { fetchUsersDropdownAdmin } from "@/apps/admin/services/reportService";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const FONT = "'Inter', sans-serif";

// Custom Bar Chart Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const connectedVal =
      payload.find((p) => p.dataKey === "connected")?.value || 0;
    const unconnectedVal =
      payload.find((p) => p.dataKey === "unconnected")?.value || 0;
    const totalVal = connectedVal + unconnectedVal;

    return (
      <Box
        sx={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "8px",
          p: 1.5,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          fontFamily: FONT,
          minWidth: 150,
        }}
      >
        <Typography
          sx={{ fontWeight: 700, fontSize: "12px", color: "#0F172A", mb: 0.5 }}
        >
          {label}
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 0.3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#2563EB",
              }}
            />
            <Typography sx={{ fontSize: "12px", color: "#475569" }}>
              Connected Calls
            </Typography>
          </Box>
          <Typography
            sx={{ fontSize: "12px", fontWeight: 600, color: "#0F172A" }}
          >
            {connectedVal}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 0.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#CBD5E1",
              }}
            />
            <Typography sx={{ fontSize: "12px", color: "#475569" }}>
              Unconnected Calls
            </Typography>
          </Box>
          <Typography
            sx={{ fontSize: "12px", fontWeight: 600, color: "#0F172A" }}
          >
            {unconnectedVal}
          </Typography>
        </Box>
        <Box
          sx={{
            borderTop: "1px solid #F1F5F9",
            pt: 0.5,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Typography
            sx={{ fontSize: "12px", fontWeight: 700, color: "#0F172A" }}
          >
            Total Calls
          </Typography>
          <Typography
            sx={{ fontSize: "12px", fontWeight: 700, color: "#0F172A" }}
          >
            {totalVal}
          </Typography>
        </Box>
      </Box>
    );
  }
  return null;
};

export default function LoginReportDetail({ onBack }) {
  const [selectedUser, setSelectedUser] = useState("Priya");
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [openDateDialog, setOpenDateDialog] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [openDownloadModal, setOpenDownloadModal] = useState(false);
  const [downloadAnchor, setDownloadAnchor] = useState(null);
  const [loginExportAnchor, setLoginExportAnchor] = useState(null);
  const [expandedDate, setExpandedDate] = useState("22-08-2026");
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetchUsersDropdownAdmin();
        if (res?.success && Array.isArray(res?.data)) {
          setUsersList(res.data);
        } else if (Array.isArray(res)) {
          setUsersList(res);
        }
      } catch (err) {
        console.error("Error loading users dropdown:", err);
      }
    };
    loadUsers();
  }, []);

  // Summary Metrics
  const summaryMetrics = {
    totalCalls: 107,
    connectedCalls: 82,
    connectedPercent: "76.6%",
    unconnectedCalls: 25,
    unconnectedPercent: "23.4%",
  };

  // Hourly Chart Data
  const hourlyData = [
    { hour: "6 AM - 7 AM", connected: 10, unconnected: 5, total: 15 },
    { hour: "7 AM - 8 AM", connected: 10, unconnected: 5, total: 15 },
    { hour: "9 AM - 10 AM", connected: 10, unconnected: 5, total: 15 },
    { hour: "8 AM - 9 AM", connected: 10, unconnected: 5, total: 15 },
    { hour: "10 AM - 11 AM", connected: 10, unconnected: 5, total: 15 },
    { hour: "11 AM - 12 PM", connected: 10, unconnected: 5, total: 15 },
    { hour: "12 PM - 01 PM", connected: 10, unconnected: 5, total: 15 },
    { hour: "01 PM - 02 PM", connected: 10, unconnected: 5, total: 15 },
    { hour: "02 PM - 03 PM", connected: 10, unconnected: 5, total: 15 },
    { hour: "03 PM - 04 PM", connected: 10, unconnected: 5, total: 15 },
    { hour: "04 PM - 05 PM", connected: 10, unconnected: 5, total: 15 },
  ];

  // Day Report Donut Data
  const pieData = [
    { name: "Connected Calls", value: 82, color: "#1D4ED8" },
    { name: "Unconnected Calls", value: 25, color: "#93C5FD" },
  ];

  // Activity Log Rows for Accordion
  const activityColumns = [
    { field: "id", headerName: "No", minWidth: "50px", align: "center" },
    { field: "time", headerName: "Time", minWidth: "120px", align: "center" },
    {
      field: "activity",
      headerName: "Activity",
      minWidth: "180px",
      align: "center",
    },
    {
      field: "description",
      headerName: "Description",
      minWidth: "220px",
      align: "center",
    },
  ];

  const activityRows = [
    { id: 1, time: "07:52", activity: "Login", description: "---------" },
    {
      id: 2,
      time: "07:52",
      activity: "Connected Call",
      description: "He is intrested",
    },
    {
      id: 3,
      time: "07:52",
      activity: "Unconnected Call",
      description: "---------",
    },
  ];

  const handleExportClick = (format) => {
    setToast({
      open: true,
      message: `Hourly & Login Report exported successfully as ${format.toUpperCase()}!`,
      severity: "success",
    });
    setDownloadAnchor(null);
    setLoginExportAnchor(null);
  };

  return (
    <Box
      sx={{
        pr: 3,
        pb: 5,
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        fontFamily: FONT,
      }}
    >
      {/* HEADER ROW */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
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
          Hourly & Login Report
        </Typography>
      </Box>

      {/* FILTER BAR CONTAINER CARD */}
      <Box
        sx={{
          background: "#FFFFFF",
          borderRadius: "12px",
          p: 2.5,
          mb: 3,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          display: "flex",
          gap: 3,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#475569",
              mb: 0.7,
            }}
          >
            User
          </Typography>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <Select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              sx={{
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 500,
                color: "#1E293B",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#CBD5E1",
                },
              }}
            >
              <MenuItem value="Priya">Priya</MenuItem>
              <MenuItem value="Sunitha">Sunitha</MenuItem>
              <MenuItem value="Anandhi">Anandhi</MenuItem>
              <MenuItem value="All">All Users</MenuItem>
              {usersList.map((u, idx) => (
                <MenuItem key={idx} value={u.name || u.label || u}>
                  {u.name || u.label || u}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#475569",
              mb: 0.7,
            }}
          >
            Date
          </Typography>
          <Box
            onClick={() => setOpenDateDialog(true)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              border: "1px solid #CBD5E1",
              borderRadius: "8px",
              px: 2,
              py: 0.8,
              background: "#FFFFFF",
              cursor: "pointer",
              "&:hover": { borderColor: "#84CC16" },
            }}
          >
            <Typography
              sx={{ fontSize: "14px", fontWeight: 500, color: "#334155" }}
            >
              {dayjs(selectedDate).format("DD-MM-YYYY")}
            </Typography>
            <CalendarTodayIcon sx={{ fontSize: "18px", color: "#64748B" }} />
          </Box>
        </Box>
      </Box>

      {/* TOP 3 KPI CARDS GRID */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "repeat(3, 1fr)",
          },
          gap: 2.5,
          mb: 3,
        }}
      >
        {/* CARD 1: Total Calls */}
        <Box
          sx={{
            background: "#FFFFFF",
            borderRadius: "12px",
            p: 2.5,
            display: "flex",
            alignItems: "center",
            gap: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "12px",
              background: "#F3E8FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PhoneInTalkIcon sx={{ color: "#7E22CE", fontSize: 26 }} />
          </Box>
          <Box>
            <Typography
              sx={{ fontSize: "13px", color: "#64748B", fontWeight: 500 }}
            >
              Total Calls
            </Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
              <Typography
                sx={{ fontSize: "24px", fontWeight: 800, color: "#6B21A8" }}
              >
                {summaryMetrics.totalCalls}
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#94A3B8" }}>
                100%
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* CARD 2: Connected Calls */}
        <Box
          sx={{
            background: "#FFFFFF",
            borderRadius: "12px",
            p: 2.5,
            display: "flex",
            alignItems: "center",
            gap: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "12px",
              background: "#E0F2FE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PhoneCallbackIcon sx={{ color: "#0284C7", fontSize: 26 }} />
          </Box>
          <Box>
            <Typography
              sx={{ fontSize: "13px", color: "#64748B", fontWeight: 500 }}
            >
              Connected Calls
            </Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
              <Typography
                sx={{ fontSize: "24px", fontWeight: 800, color: "#0284C7" }}
              >
                {summaryMetrics.connectedCalls}
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#94A3B8" }}>
                {summaryMetrics.connectedPercent}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* CARD 3: Unconnected Calls */}
        <Box
          sx={{
            background: "#FFFFFF",
            borderRadius: "12px",
            p: 2.5,
            display: "flex",
            alignItems: "center",
            gap: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "12px",
              background: "#FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PhoneDisabledIcon sx={{ color: "#DC2626", fontSize: 26 }} />
          </Box>
          <Box>
            <Typography
              sx={{ fontSize: "13px", color: "#64748B", fontWeight: 500 }}
            >
              Unconnected Calls
            </Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
              <Typography
                sx={{ fontSize: "24px", fontWeight: 800, color: "#DC2626" }}
              >
                {summaryMetrics.unconnectedCalls}
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#94A3B8" }}>
                {summaryMetrics.unconnectedPercent}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* HOURLY REPORT CHART CARD */}
      <Box
        sx={{
          background: "#FFFFFF",
          borderRadius: "12px",
          p: 3,
          mb: 3,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box>
            <Typography
              sx={{ fontSize: "18px", fontWeight: 700, color: "#0F172A" }}
            >
              Hourly Report
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#94A3B8" }}>
              31 Aug 2026
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            {/* Legend */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#2563EB",
                  }}
                />
                <Typography
                  sx={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}
                >
                  Connected Calls
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#CBD5E1",
                  }}
                />
                <Typography
                  sx={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}
                >
                  Unconnected Calls
                </Typography>
              </Box>
            </Box>

            <Button
              size="small"
              variant="outlined"
              startIcon={
                <FileDownloadOutlinedIcon
                  sx={{ fontSize: "16px !important" }}
                />
              }
              onClick={(e) => setDownloadAnchor(e.currentTarget)}
              sx={{
                borderColor: "#84CC16",
                color: "#65A30D",
                borderRadius: "6px",
                textTransform: "none",
                fontSize: "12.5px",
                fontWeight: 600,
                px: 1.5,
              }}
            >
              Download Report
            </Button>
            <Menu
              anchorEl={downloadAnchor}
              open={Boolean(downloadAnchor)}
              onClose={() => setDownloadAnchor(null)}
            >
              <MenuItem onClick={() => handleExportClick("xlsx")}>
                Export Excel (.xlsx)
              </MenuItem>
              <MenuItem onClick={() => handleExportClick("csv")}>
                Export CSV (.csv)
              </MenuItem>
              <MenuItem onClick={() => handleExportClick("pdf")}>
                Export PDF (.pdf)
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* RECHARTS STACKED BAR CHART */}
        <Box sx={{ width: "100%", height: 260, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={hourlyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 50]}
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar
                dataKey="connected"
                stackId="a"
                fill="#2563EB"
                radius={[0, 0, 0, 0]}
                barSize={40}
              />
              <Bar
                dataKey="unconnected"
                stackId="a"
                fill="#CBD5E1"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* BOTTOM SECTION: 2 CARDS GRID */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
        }}
      >
        {/* CARD 1: LOGIN REPORT (ACCORDION & ACTIVITY TABLE) */}
        <Box
          sx={{
            background: "#FFFFFF",
            borderRadius: "12px",
            p: 3,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              sx={{ fontSize: "18px", fontWeight: 700, color: "#0F172A" }}
            >
              Login Report
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={
                <FileDownloadOutlinedIcon
                  sx={{ fontSize: "16px !important" }}
                />
              }
              onClick={(e) => setLoginExportAnchor(e.currentTarget)}
              sx={{
                borderColor: "#84CC16",
                color: "#65A30D",
                borderRadius: "6px",
                textTransform: "none",
                fontSize: "12.5px",
                fontWeight: 600,
                px: 1.5,
              }}
            >
              Export Login Report
            </Button>
            <Menu
              anchorEl={loginExportAnchor}
              open={Boolean(loginExportAnchor)}
              onClose={() => setLoginExportAnchor(null)}
            >
              <MenuItem onClick={() => handleExportClick("xlsx")}>
                Export Excel (.xlsx)
              </MenuItem>
              <MenuItem onClick={() => handleExportClick("csv")}>
                Export CSV (.csv)
              </MenuItem>
            </Menu>
          </Box>

          {/* ACCORDIONS */}
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}
          >
            {/* Accordion 1: 21-08-2026 */}
            <Accordion
              expanded={expandedDate === "21-08-2026"}
              onChange={() =>
                setExpandedDate(
                  expandedDate === "21-08-2026" ? null : "21-08-2026",
                )
              }
              sx={{
                boxShadow: "none",
                border: "1px solid #E2E8F0",
                borderRadius: "8px !important",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    pr: 2,
                    alignItems: "center",
                  }}
                >
                  <Typography
                    sx={{ fontSize: "14px", fontWeight: 600, color: "#16A34A" }}
                  >
                    21-08-2026
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Typography sx={{ fontSize: "12.5px", color: "#64748B" }}>
                      Total Calls:{" "}
                      <span style={{ fontWeight: 700, color: "#16A34A" }}>
                        107
                      </span>
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Table
                  columns={activityColumns}
                  rows={activityRows}
                  minWidth={400}
                />
              </AccordionDetails>
            </Accordion>

            {/* Accordion 2: 22-08-2026 (EXPANDED) */}
            <Accordion
              expanded={expandedDate === "22-08-2026"}
              onChange={() =>
                setExpandedDate(
                  expandedDate === "22-08-2026" ? null : "22-08-2026",
                )
              }
              sx={{
                boxShadow: "none",
                border: "1px solid #BBF7D0",
                borderRadius: "8px !important",
                overflow: "hidden",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ background: "#F0FDF4" }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    pr: 2,
                    alignItems: "center",
                  }}
                >
                  <Typography
                    sx={{ fontSize: "14px", fontWeight: 600, color: "#16A34A" }}
                  >
                    22-08-2026
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Typography sx={{ fontSize: "12.5px", color: "#64748B" }}>
                      Total Calls:{" "}
                      <span style={{ fontWeight: 700, color: "#16A34A" }}>
                        107
                      </span>
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 1, px: 1, pb: 1 }}>
                <Table
                  columns={activityColumns}
                  rows={activityRows}
                  minWidth={400}
                />
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>

        {/* CARD 2: DAY REPORT (DONUT CHART & LEGEND) */}
        <Box
          sx={{
            background: "#FFFFFF",
            borderRadius: "12px",
            p: 3,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{ fontSize: "18px", fontWeight: 700, color: "#0F172A" }}
            >
              Day Report
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#94A3B8" }}>
              22 Aug 2026
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              mt: 3,
            }}
          >
            {/* DONUT CHART */}
            <Box sx={{ position: "relative", width: 180, height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "#0F172A",
                    lineHeight: 1,
                  }}
                >
                  107
                </Typography>
                <Typography
                  sx={{
                    fontSize: "11px",
                    color: "#64748B",
                    fontWeight: 500,
                    mt: 0.3,
                  }}
                >
                  Total Calls
                </Typography>
              </Box>
            </Box>

            {/* DONUT LEGEND */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#1D4ED8",
                  }}
                />
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#334155",
                    minWidth: 120,
                  }}
                >
                  Connected Calls
                </Typography>
                <Typography
                  sx={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}
                >
                  82
                </Typography>
                <Typography sx={{ fontSize: "11px", color: "#94A3B8" }}>
                  76.6%
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#93C5FD",
                  }}
                />
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#334155",
                    minWidth: 120,
                  }}
                >
                  Unconnected Calls
                </Typography>
                <Typography
                  sx={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}
                >
                  25
                </Typography>
                <Typography sx={{ fontSize: "11px", color: "#94A3B8" }}>
                  23.4%
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* DOWNLOAD REPORT MODAL */}
      <DownloadReportModal
        open={openDownloadModal}
        onClose={() => setOpenDownloadModal(false)}
        reportName="Hourly & Login Report"
        columns={[
          "User Name",
          "Time",
          "Activity",
          "Description",
          "Total Calls",
          "Connected Calls",
          "Unconnected Calls",
        ]}
        onDownload={() => {
          setToast({
            open: true,
            message: "Hourly & Login Report downloaded successfully!",
            severity: "success",
          });
        }}
      />

      {/* CUSTOM DATE DIALOG */}
      <CustomDateDialog
        mode="single"
        open={openDateDialog}
        onClose={() => setOpenDateDialog(false)}
        onApply={(date) => {
          setSelectedDate(date);
          setOpenDateDialog(false);
        }}
        initialFrom={selectedDate}
        accentColor="#84CC16"
      />

      {/* TOAST SNACKBAR */}
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
            fontFamily: FONT,
          }}
        >
          {toast.severity === "error" ? (
            <ErrorIcon sx={{ color: "#EF4444", fontSize: 22 }} />
          ) : (
            <CheckCircleIcon sx={{ color: "#84CC16", fontSize: 22 }} />
          )}
          <Typography
            sx={{ fontSize: "14px", fontWeight: 500, color: "#0F172A" }}
          >
            {toast.message}
          </Typography>
        </Box>
      </Snackbar>
    </Box>
  );
}
