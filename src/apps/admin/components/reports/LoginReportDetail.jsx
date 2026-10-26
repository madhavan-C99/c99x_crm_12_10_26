import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  Button,
  Snackbar,
  CircularProgress,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import PhoneCallbackIcon from "@mui/icons-material/PhoneCallback";
import PhoneDisabledIcon from "@mui/icons-material/PhoneDisabled";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import dayjs from "dayjs";
import ExportModal from "@/apps/admin/components/common/ExportModal";
import useReportExport from "@/apps/admin/hooks/useReportExport";
import DateRangeSelect from "@/shared/components/filters/DateRangeSelect";
import Table from "@/shared/components/table/Table";
import {
  fetchUsersDropdownAdmin,
  executeReportAdmin,
} from "@/apps/admin/services/reportService";

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
  const [selectedUser, setSelectedUser] = useState("All");
  const [dateFilter, setDateFilter] = useState("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [summary, setSummary] = useState({
    total_calls: 0,
    connected_calls: 0,
    unconnected_calls: 0,
    connected_percent: "0%",
    unconnected_percent: "0%",
  });
  const [hourlyData, setHourlyData] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  const getDates = () => {
    if (dateFilter === "custom" && fromDate && toDate) {
      return { from: fromDate, to: toDate };
    }
    const today = dayjs().format("YYYY-MM-DD");
    if (dateFilter === "yesterday") {
      const y = dayjs().subtract(1, "day").format("YYYY-MM-DD");
      return { from: y, to: y };
    }
    if (dateFilter === "weekly") {
      return {
        from: dayjs().subtract(6, "day").format("YYYY-MM-DD"),
        to: today,
      };
    }
    if (dateFilter === "monthly") {
      return {
        from: dayjs().startOf("month").format("YYYY-MM-DD"),
        to: today,
      };
    }
    if (dateFilter === "year") {
      return {
        from: dayjs().subtract(29, "day").format("YYYY-MM-DD"),
        to: today,
      };
    }
    return { from: today, to: today };
  };

  const loginReportColumns = [
    "User Name",
    "Time",
    "Activity",
    "Description",
    "Total Calls",
    "Connected Calls",
    "Unconnected Calls",
  ];

  const exportProps = useReportExport({
    reportKey: "login_report",
    columns: loginReportColumns,
    getFilters: () => {
      const { from, to } = getDates();
      const filters = { user_id: selectedUser };
      if (from === to) {
        filters.date = from;
        filters.from_date = from;
        filters.to_date = to;
      } else {
        filters.from_date = from;
        filters.to_date = to;
      }
      return filters;
    },
  });

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const requestIdRef = useRef(0);

  // Load telecallers dropdown on mount
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

  // Fetch report data on mount and whenever user or date changes
  useEffect(() => {
    let ignore = false;
    const currentRequestId = ++requestIdRef.current;

    const fetchReport = async () => {
      if (dateFilter === "custom" && (!fromDate || !toDate)) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { from, to } = getDates();
      const payload = {
        report_key: "login_report",
        user_id: selectedUser,
      };
      if (from === to) {
        payload.date = from;
      } else {
        payload.from_date = from;
        payload.to_date = to;
      }

      try {
        const response = await executeReportAdmin(payload);
        if (ignore || currentRequestId !== requestIdRef.current) return;

        if (response && response.success !== false) {
          const data = response.data || {};
          setSummary(
            data.summary || {
              total_calls: 0,
              connected_calls: 0,
              unconnected_calls: 0,
              connected_percent: "0%",
              unconnected_percent: "0%",
            },
          );
          setHourlyData(
            Array.isArray(data.hourly_data) ? data.hourly_data : [],
          );
          setActivityLogs(
            Array.isArray(data.activity_logs) ? data.activity_logs : [],
          );
        } else {
          const errMsg = response?.message || "Failed to fetch login report";
          setError(errMsg);
        }
      } catch (err) {
        if (ignore || currentRequestId !== requestIdRef.current) return;
        console.error("Error fetching login report:", err);
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch login report";
        setError(errMsg);
      } finally {
        if (!ignore && currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    fetchReport();

    return () => {
      ignore = true;
    };
  }, [selectedUser, dateFilter, fromDate, toDate, refreshKey]);

  const handleRetry = () => {
    setRefreshKey((k) => k + 1);
  };

  const totalCallsCount = summary?.total_calls ?? 0;
  const connectedCallsCount = summary?.connected_calls ?? 0;
  const unconnectedCallsCount = summary?.unconnected_calls ?? 0;

  // Day Report Donut Data derived from summary
  const pieData = [
    {
      name: "Connected Calls",
      value: connectedCallsCount,
      color: "#1D4ED8",
    },
    {
      name: "Unconnected Calls",
      value: unconnectedCallsCount,
      color: "#93C5FD",
    },
  ];

  const { from: effectiveFrom, to: effectiveTo } = getDates();
  const dateLabel =
    effectiveFrom === effectiveTo
      ? dayjs(effectiveFrom).format("DD MMM YYYY")
      : `${dayjs(effectiveFrom).format("DD MMM YYYY")} - ${dayjs(effectiveTo).format("DD MMM YYYY")}`;

  const hasDateInLogs =
    effectiveFrom !== effectiveTo &&
    activityLogs.some((log) =>
      Boolean(
        log.date ||
          log.activity_date ||
          log.created_at ||
          log.log_date ||
          log.timestamp,
      ),
    );

  // Activity Log Columns
  const activityColumns = [
    { field: "display_id", headerName: "No", minWidth: "60px", align: "center" },
    ...(hasDateInLogs
      ? [{ field: "date", headerName: "Date", minWidth: "110px", align: "center" }]
      : []),
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

  // Activity Log Rows
  const activityRows = activityLogs.map((log, index) => ({
    id: log.id ?? `log-${index}`,
    display_id: index + 1,
    ...(hasDateInLogs
      ? {
          date:
            log.date ||
            log.activity_date ||
            log.created_at ||
            log.log_date ||
            log.timestamp ||
            "-",
        }
      : {}),
    time: log.time || "-",
    activity: log.activity || "-",
    description: log.description || "-",
  }));

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
              <MenuItem value="All">All Users</MenuItem>
              {usersList.map((u) => {
                const val = u.id ?? u.value;
                const label = u.name || u.label || String(val);
                return (
                  <MenuItem key={val} value={val}>
                    {label}
                  </MenuItem>
                );
              })}
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
          <DateRangeSelect
            filterType={dateFilter}
            setFilterType={setDateFilter}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
            defaultType="today"
          />
        </Box>
      </Box>

      {/* ERROR BANNER */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: "8px" }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRetry}
              sx={{ fontWeight: 600, textTransform: "none" }}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

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
                {loading ? "..." : totalCallsCount}
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#94A3B8" }}>
                {totalCallsCount > 0 ? "100%" : "0%"}
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
                {loading ? "..." : connectedCallsCount}
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#94A3B8" }}>
                {summary?.connected_percent || "0%"}
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
                {loading ? "..." : unconnectedCallsCount}
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#94A3B8" }}>
                {summary?.unconnected_percent || "0%"}
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
              {dateLabel}
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
              onClick={exportProps.openDownloadModal}
              startIcon={
                <FileDownloadOutlinedIcon
                  sx={{ fontSize: "16px !important" }}
                />
              }
              sx={{
                borderColor: "#CBD5E1",
                color: "#475569",
                borderRadius: "6px",
                textTransform: "none",
                fontSize: "12.5px",
                fontWeight: 600,
                px: 1.5,
                "&:hover": { borderColor: "#84CC16", backgroundColor: "#F7FEE7" },
              }}
            >
              Download Report
            </Button>
          </Box>
        </Box>

        {/* RECHARTS STACKED BAR CHART */}
        <Box sx={{ width: "100%", height: 260, mt: 2, position: "relative" }}>
          {loading && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                zIndex: 2,
              }}
            >
              <CircularProgress size={32} sx={{ color: "#84CC16" }} />
            </Box>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={hourlyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="hour"
                interval={0}
                tick={{ fontSize: 10, fill: "#64748B" }}
                tickFormatter={(v) =>
                  typeof v === "string" ? v.split(" - ")[0] : v
                }
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
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
        {/* CARD 1: LOGIN ACTIVITY TABLE */}
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
            <Box>
              <Typography
                sx={{ fontSize: "18px", fontWeight: 700, color: "#0F172A" }}
              >
                Login Activity
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#94A3B8" }}>
                {dateLabel}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              onClick={exportProps.openDownloadModal}
              startIcon={
                <FileDownloadOutlinedIcon
                  sx={{ fontSize: "16px !important" }}
                />
              }
              sx={{
                borderColor: "#CBD5E1",
                color: "#475569",
                borderRadius: "6px",
                textTransform: "none",
                fontSize: "12.5px",
                fontWeight: 600,
                px: 1.5,
                "&:hover": { borderColor: "#84CC16", backgroundColor: "#F7FEE7" },
              }}
            >
              Export Login Report
            </Button>
          </Box>

          <Box sx={{ mt: 2, position: "relative", minHeight: 180 }}>
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 6,
                }}
              >
                <CircularProgress size={32} sx={{ color: "#84CC16" }} />
              </Box>
            ) : activityRows.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 6,
                  color: "#94A3B8",
                  fontSize: "14px",
                }}
              >
                No activity logs found for this date.
              </Box>
            ) : (
              <Table
                columns={activityColumns}
                rows={activityRows}
                minWidth={400}
              />
            )}
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
              {dateLabel}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              mt: 3,
              minHeight: 180,
            }}
          >
            {/* DONUT CHART */}
            <Box sx={{ position: "relative", width: 180, height: 180 }}>
              {totalCallsCount === 0 ? (
                <Box
                  sx={{
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    border: "8px solid #E2E8F0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    m: "auto",
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
                    0
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
              ) : (
                <>
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
                      {totalCallsCount}
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
                </>
              )}
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
                  {connectedCallsCount}
                </Typography>
                <Typography sx={{ fontSize: "11px", color: "#94A3B8" }}>
                  {summary?.connected_percent || "0%"}
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
                  {unconnectedCallsCount}
                </Typography>
                <Typography sx={{ fontSize: "11px", color: "#94A3B8" }}>
                  {summary?.unconnected_percent || "0%"}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* DOWNLOAD REPORT MODAL */}
      <ExportModal
        open={exportProps.downloadModalOpen}
        onClose={exportProps.closeDownloadModal}
        reportName="Hourly & Login Report"
        columns={loginReportColumns}
        isSubmitting={exportProps.isSubmitting}
        onDownload={exportProps.handleDownloadSubmit}
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
