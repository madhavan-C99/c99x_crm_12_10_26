import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  MenuItem,
  Select,
  Paper,
  TableContainer,
  Table as MuiTable,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Collapse,
  IconButton,
} from "@mui/material";
import PhoneInTalkOutlinedIcon from "@mui/icons-material/PhoneInTalkOutlined";
import AddIcon from "@mui/icons-material/Add";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CloseIcon from "@mui/icons-material/Close";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SetTargetModal from "./SetTargetModal";
import CustomDateRangePicker from "@/shared/components/dialogs/CustomDateDialog";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  fetchMonthlyTargetAdmin,
  fetchTargetDropdownsAdmin,
  setMonthlyTargetAdmin,
} from "@/apps/admin/services/monthlyTargetService";

const ACCENT_GREEN = "#84CC16";
const ACCENT_PURPLE = "#6366F1";

export default function MonthlyTargetView() {
  const currentMonthName = dayjs().format("MMMM YYYY");
  const [targetMonth, setTargetMonth] = useState(currentMonthName);
  const [hasCustomRange, setHasCustomRange] = useState(false);
  const [selectedMonthLabel, setSelectedMonthLabel] = useState(currentMonthName);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [openCalendar, setOpenCalendar] = useState(false);
  const [progressTab, setProgressTab] = useState("Team");
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [isSetTargetOpen, setIsSetTargetOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState({
    total_target: 0,
    achieved: 0,
    remaining: 0,
    achievement_rate: "0%",
    team_summary: null,
    individual_summary: null,
  });
  const [barChartData, setBarChartData] = useState([]);
  const [doughnutData, setDoughnutData] = useState([]);
  const [teamList, setTeamList] = useState([]);
  const [individualList, setIndividualList] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({
    teams: [],
    employees: [],
  });

  // Dynamically compute active summary data for Team vs Individual view
  const activeSummaryData = React.useMemo(() => {
    if (progressTab === "Team") {
      if (summaryData.team_summary) return summaryData.team_summary;
      if (teamList.length > 0) {
        const total = teamList.reduce((acc, t) => acc + Number(t.target ?? t.lead_target ?? 0), 0);
        const ach = teamList.reduce((acc, t) => acc + Number(t.achieved ?? 0), 0);
        const rem = Math.max(0, total - ach);
        const rate = total > 0 ? `${Math.round((ach / total) * 100)}%` : "0%";
        return { total_target: total, achieved: ach, remaining: rem, achievement_rate: rate };
      }
      return summaryData;
    } else {
      if (summaryData.individual_summary) return summaryData.individual_summary;
      if (individualList.length > 0) {
        const total = individualList.reduce((acc, i) => acc + Number(i.target ?? i.lead_target ?? 0), 0);
        const ach = individualList.reduce((acc, i) => acc + Number(i.achieved ?? 0), 0);
        const rem = Math.max(0, total - ach);
        const rate = total > 0 ? `${Math.round((ach / total) * 100)}%` : "0%";
        return { total_target: total, achieved: ach, remaining: rem, achievement_rate: rate };
      }
      return summaryData;
    }
  }, [progressTab, summaryData, teamList, individualList]);

  const maxTargetVal = React.useMemo(() => {
    if (!barChartData || barChartData.length === 0) return 200;
    const maxVal = Math.max(
      ...barChartData.map((d) => Math.max(Number(d.Target || 0), Number(d.Achieved || 0)))
    );
    return Math.max(100, Math.ceil((maxVal * 1.15) / 50) * 50);
  }, [barChartData]);

  const loadMonthlyTargetData = useCallback(async () => {
    try {
      setLoading(true);
      const currentMonthFromDate = dayjs().startOf("month").format("YYYY-MM-DD");
      const currentMonthToDate = dayjs().endOf("month").format("YYYY-MM-DD");

      const params = {
        month: hasCustomRange ? undefined : selectedMonthLabel,
        from_date: hasCustomRange ? (fromDate || undefined) : (fromDate || currentMonthFromDate),
        to_date: hasCustomRange ? (toDate || undefined) : (toDate || currentMonthToDate),
      };
      const res = await fetchMonthlyTargetAdmin(params);
      console.log("[MonthlyTargetView] fetchMonthlyTargetAdmin response:", res);
      const rawData = res?.data;
      const data = rawData?.data || rawData || {};

      if (data.summary || data.team_summary || data.individual_summary) {
        setSummaryData({
          total_target: data.summary?.total_target ?? 0,
          achieved: data.summary?.achieved ?? 0,
          remaining: data.summary?.remaining ?? 0,
          achievement_rate: data.summary?.achievement_rate || "0%",
          team_summary: data.team_summary || null,
          individual_summary: data.individual_summary || null,
        });
      }

      const teams = Array.isArray(data.team_targets) ? data.team_targets : [];
      setTeamList(teams);

      if (Array.isArray(data.individual_targets)) {
        setIndividualList(data.individual_targets);
      } else {
        setIndividualList([]);
      }

      // Bar Chart handling with automatic fallback from team_targets
      if (Array.isArray(data.bar_chart) && data.bar_chart.length > 0) {
        setBarChartData(data.bar_chart);
      } else if (teams.length > 0) {
        setBarChartData(
          teams.map((t) => ({
            team: t.team || t.name || "Team",
            Target: Number(t.target || 0),
            Achieved: Number(t.achieved || 0),
            color: t.color || "#6366F1",
          }))
        );
      } else {
        setBarChartData([]);
      }

      // Donut Chart handling with automatic fallback from team_targets
      if (Array.isArray(data.donut_chart) && data.donut_chart.length > 0) {
        const formattedDonut = data.donut_chart.map((item, index) => ({
          ...item,
          color: item.color || item.colour || (index % 2 === 0 ? "#6366F1" : "#84CC16"),
        }));
        setDoughnutData(formattedDonut);
      } else if (teams.length > 0) {
        const totalAch = teams.reduce((sum, t) => sum + Number(t.achieved || 0), 0);
        setDoughnutData(
          teams.map((t, index) => {
            const val = Number(t.achieved || 0);
            const pct = totalAch > 0 ? `${Math.round((val / totalAch) * 100)}%` : "0%";
            return {
              name: t.team || t.name || `Team ${index + 1}`,
              value: val,
              percentage: pct,
              color: t.color || (index % 2 === 0 ? "#6366F1" : "#84CC16"),
            };
          })
        );
      } else {
        setDoughnutData([]);
      }
    } catch (err) {
      console.error("Error fetching monthly target data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonthLabel, fromDate, toDate, hasCustomRange]);

  const dropdownsFetchedRef = React.useRef(false);
  const loadDropdowns = useCallback(async () => {
    if (dropdownsFetchedRef.current) return;
    try {
      dropdownsFetchedRef.current = true;
      const res = await fetchTargetDropdownsAdmin();
      console.log("[MonthlyTargetView] fetchTargetDropdownsAdmin response:", res);
      const rawData = res?.data;
      const data = rawData?.data || rawData || {};
      setDropdownOptions({
        teams: Array.isArray(data.teams) ? data.teams : [],
        employees: Array.isArray(data.employees) ? data.employees : [],
      });
    } catch (err) {
      console.error("Error fetching target dropdowns:", err);
      dropdownsFetchedRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadMonthlyTargetData();
  }, [loadMonthlyTargetData]);

  useEffect(() => {
    if (isSetTargetOpen) {
      loadDropdowns();
    }
  }, [isSetTargetOpen, loadDropdowns]);

  useEffect(() => {
    if (teamList.length === 0 && progressTab === "Team") {
      setProgressTab("Individual");
    }
  }, [teamList, progressTab]);

  const handleApplyCustomRange = (from, to) => {
    if (from && to) {
      setFromDate(from);
      setToDate(to);
      setHasCustomRange(true);
      setSelectedMonthLabel(
        `${dayjs(from).format("DD MMM YYYY")} - ${dayjs(to).format("DD MMM YYYY")}`
      );
    } else {
      setFromDate("");
      setToDate("");
      setHasCustomRange(false);
      setSelectedMonthLabel(targetMonth);
    }
    setOpenCalendar(false);
  };

  const handleSaveTarget = async (newTargetData) => {
    try {
      const monthLabel = newTargetData.month || currentMonthName;
      setTargetMonth(monthLabel);
      if (!hasCustomRange) {
        setSelectedMonthLabel(monthLabel);
      }

      const res = await setMonthlyTargetAdmin(newTargetData);
      if (res?.data?.status !== false) {
        toast.success(res?.data?.message || "Monthly Target set successfully!");
        await loadMonthlyTargetData();
      } else {
        toast.error(res?.data?.message || "Failed to set target");
      }
    } catch (err) {
      console.error("Error saving target:", err);
      toast.error(err?.response?.data?.message || "Failed to set target");
    }
  };

  const currentDisplayList = progressTab === "Team" ? teamList : individualList;

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
        pb: 4,
      }}
    >
      {/* 1. Header Title & Controls Row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          width: "100%",
          mb: 0.5,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: "17px",
              fontWeight: 600,
              color: "#0F172A",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Monthly Target
          </Typography>
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 400,
              color: "#64748B",
              fontFamily: "Inter, sans-serif",
              mt: 0.3,
            }}
          >
            Manage and monitor team & individual targets
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {/* Team / Individual Segmented Toggle Button */}
          <Box
            sx={{
              backgroundColor: "#FFFFFF",
              border: "1.5px solid #E2E8F0",
              borderRadius: "8px",
              p: "3px",
              display: "flex",
              alignItems: "center",
              height: "38px",
              boxSizing: "border-box",
            }}
          >
            {teamList.length > 0 && (
              <Button
                onClick={() => setProgressTab("Team")}
                disableRipple
                sx={{
                  px: 2.2,
                  py: 0.5,
                  height: "30px",
                  fontSize: "14px",
                  fontWeight: progressTab === "Team" ? 600 : 500,
                  color: progressTab === "Team" ? "#FFFFFF" : "#475569",
                  backgroundColor:
                    progressTab === "Team" ? ACCENT_GREEN : "transparent",
                  borderRadius: "6px",
                  textTransform: "none",
                  minWidth: "auto",
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor:
                      progressTab === "Team" ? ACCENT_GREEN : "#F1F5F9",
                  },
                }}
              >
                Team
              </Button>
            )}
            <Button
              onClick={() => setProgressTab("Individual")}
              disableRipple
              sx={{
                px: 2.2,
                py: 0.5,
                height: "30px",
                fontSize: "14px",
                fontWeight: progressTab === "Individual" ? 600 : 500,
                color: progressTab === "Individual" ? "#FFFFFF" : "#475569",
                backgroundColor:
                  progressTab === "Individual" ? ACCENT_GREEN : "transparent",
                borderRadius: "6px",
                textTransform: "none",
                minWidth: "auto",
                boxShadow: "none",
                "&:hover": {
                  backgroundColor:
                    progressTab === "Individual" ? ACCENT_GREEN : "#F1F5F9",
                },
              }}
            >
              Individual
            </Button>
          </Box>

          {/* Calendar Range Selector Button matching Image 1 & Image 2 */}
          <Button
            variant="outlined"
            onClick={() => setOpenCalendar(true)}
            startIcon={
              <CalendarTodayOutlinedIcon
                sx={{ fontSize: 16, color: "#1D4ED8" }}
              />
            }
            sx={{
              height: "38px",
              backgroundColor: "#FFFFFF",
              borderRadius: "8px",
              border: "1.5px solid  #E0E0E0",
              color: "#1E293B",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: 500,
              textTransform: "none",
              px: 2,  
            }}
          >
            {selectedMonthLabel}
          </Button>

          {/* + Set Target Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsSetTargetOpen(true)}
            sx={{
              backgroundColor: "#0021CA",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "14px",
              textTransform: "none",
              borderRadius: "8px",
              height: "38px",
              px: 2.5,
              fontFamily: "Inter, sans-serif",
              boxShadow: "0 2px 6px rgba(0, 33, 202, 0.25)",
              "&:hover": { backgroundColor: "#041BB2" },
            }}
          >
            Set Target
          </Button>
        </Box>
      </Box>

      {/* 2. Top 4 Stat Cards Grid (Equal Width & Perfect Alignment) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
          width: "100%",
          height: "111px",
        }}
      >
        {/* Card 1: Total Monthly Target */}
        <Paper
          elevation={0}
          sx={{
            p: "17px 18px",
            borderRadius: "12px",
            border: "1px solid #F1F5F9",
            backgroundColor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            gap: 2,
            boxShadow: "0px 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: "7px",
              backgroundColor: "#F3E8FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <PhoneInTalkOutlinedIcon sx={{ color: "#9333EA", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              sx={{ fontSize: "16px", fontWeight: 400, color: "#64748B" }}
            >
              Total Monthly Target
            </Typography>
            <Typography
              sx={{
                fontSize: "33px",
                fontWeight: 600,
                color: "#581C87",
                lineHeight: 1.2,
              }}
            >
              {activeSummaryData.total_target}
            </Typography>
          </Box>
        </Paper>

        {/* Card 2: Achieved */}
        <Paper
          elevation={0}
          sx={{
            p: "17px 18px",
            borderRadius: "12px",
            border: "1px solid #F1F5F9",
            backgroundColor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            gap: 2,
            boxShadow: "0px 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: "7px",
              backgroundColor: "#DCFCE7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <PhoneInTalkOutlinedIcon sx={{ color: "#16A34A", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              sx={{ fontSize: "16px", fontWeight: 400, color: "#64748B" }}
            >
              Achieved
            </Typography>
            <Typography
              sx={{
                fontSize: "33px",
                fontWeight: 600,
                color: "#2563EB",
                lineHeight: 1.2,
              }}
            >
              {activeSummaryData.achieved}
            </Typography>
          </Box>
        </Paper>

        {/* Card 3: Remaining */}
        <Paper
          elevation={0}
          sx={{
            p: "17px 18px",
            borderRadius: "12px",
            border: "1px solid #F1F5F9",
            backgroundColor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            gap: 2,
            boxShadow: "0px 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: "7px",
              backgroundColor: "#FFEDD5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <PhoneInTalkOutlinedIcon sx={{ color: "#EA580C", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              sx={{ fontSize: "16px", fontWeight: 400, color: "#64748B" }}
            >
              Remaining
            </Typography>
            <Typography
              sx={{
                fontSize: "33px",
                fontWeight: 600,
                color: "#DC2626",
                lineHeight: 1.2,
              }}
            >
              {activeSummaryData.remaining}
            </Typography>
          </Box>
        </Paper>

        {/* Card 4: Achievement Rate */}
        <Paper
          elevation={0}
          sx={{
            p: "17px 18px",
            borderRadius: "12px",
            border: "1px solid #F1F5F9",
            backgroundColor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            gap: 2,
            boxShadow: "0px 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: "7px",
              backgroundColor: "#DBEAFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <PhoneInTalkOutlinedIcon sx={{ color: "#2563EB", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              sx={{ fontSize: "16px", fontWeight: 400, color: "#64748B" }}
            >
              Achievement Rate
            </Typography>
            <Typography
              sx={{
                fontSize: "33px",
                fontWeight: 600,
                color: "#EA580C",
                lineHeight: 1.2,
              }}
            >
              {activeSummaryData.achievement_rate}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* 3. Middle Section: 2 Charts Grid (50% / 50% split) - Visible ONLY in Team view */}
      {progressTab === "Team" &&
        (barChartData.length > 0 || doughnutData.length > 0) && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.3fr 1fr" },
              gap: 2.5,
              width: "100%",
              height: 367,
            }}
          >
            {/* Left Chart: Bar Chart */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "8px",
                border: "1px solid #F1F5F9",
                backgroundColor: "#FFFFFF",
                height: "367px",
                display: "flex",
                flexDirection: "column",
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
                  sx={{ fontSize: "17px", fontWeight: 600, color: "#0F172A" }}
                >
                  Target Vs Achievement Team Wise
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "2px",
                        backgroundColor: "#85D614",
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: "14px",
                        color: "#000000",
                        fontWeight: 500,
                      }}
                    >
                      Target
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "2px",
                        backgroundColor: "#6161FF",
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: "14px",
                        color: "#000000",
                        fontWeight: 500,
                      }}
                    >
                      Achieved
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ flex: 1, width: "100%", height: "100%", pt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
                    barGap={5}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid
                      strokeDasharray="2 2"
                      vertical={true}
                      horizontal={true}
                      stroke="#D1D5DB"
                    />
                    <XAxis
                      dataKey="team"
                      tick={{ fontSize: 12, fontWeight: 500, fill: "#000000" }}
                      axisLine={{ stroke: "#000000", strokeWidth: 1.5 }}
                      tickLine={{ stroke: "#000000", strokeWidth: 1.5 }}
                    />
                    <YAxis
                      domain={[0, maxTargetVal]}
                      tick={{ fontSize: 12, fontWeight: 500, fill: "#000000" }}
                      axisLine={{ stroke: "#000000", strokeWidth: 1.5 }}
                      tickLine={{ stroke: "#000000", strokeWidth: 1.5 }}
                    />
                    <Tooltip cursor={{ fill: "rgba(213, 30, 30, 0.04)" }} />
                    <Bar
                      dataKey="Achieved"
                      fill="#6161FF"
                      radius={[5, 5, 0, 0]}
                      barSize={48}
                    />
                    <Bar
                      dataKey="Target"
                      fill="#85D614"
                      radius={[5, 5, 0, 0]}
                      barSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            {/* Right Chart: Donut Chart */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid #F1F5F9",
                backgroundColor: "#FFFFFF",
                height: "367px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography
                sx={{
                  fontSize: "17px",
                  fontWeight: 600,
                  color: "#0F172A",
                  mb: 2,
                }}
              >
                Target Vs Achievement Team Wise
              </Typography>

              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                }}
              >
                {/* Doughnut Chart with Center Text */}
                <Box
                  sx={{ position: "relative", width: "220px", height: "220px" }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    {(() => {
                      const isAllDonutZero =
                        doughnutData.length > 0 &&
                        doughnutData.every(
                          (item) => Number(item.value || 0) === 0,
                        );

                      return (
                        <PieChart>
                          <Pie
                            data={doughnutData}
                            cx="50%"
                            cy="50%"
                            startAngle={90}
                            endAngle={-270}
                            innerRadius={68}
                            outerRadius={102}
                            paddingAngle={2}
                            dataKey={isAllDonutZero ? () => 1 : "value"}
                          >
                            {doughnutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      );
                    })()}
                  </ResponsiveContainer>
                  {/* Center Content inside Donut */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "32.5px",
                        fontWeight: 600,
                        color: "#000000",
                        lineHeight: 1,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {summaryData.total_target}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "20px",
                        fontWeight: 400,
                        color: "#000000",
                        mt: 0.5,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Total Leads
                    </Typography>
                  </Box>
                </Box>

                {/* Legend Side List matching Image 1 */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2.2,
                    minWidth: "210px",
                  }}
                >
                  {doughnutData.map((item) => (
                    <Box
                      key={item.name}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.2 }}
                      >
                        <Box
                          sx={{
                            width: 15,
                            height: 15,
                            borderRadius: "2px",
                            backgroundColor: item.color,
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: "16px",
                            color: "#000000",
                            fontWeight: 400,
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {item.name}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: 400,
                          color: "#000000",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        <Box
                          component="span"
                          sx={{ fontWeight: 700, fontSize: "12px", mr: 0.2 }}
                        >
                          {item.value}
                        </Box>
                        ({item.percentage})
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>
          </Box>
        )}

      {/* 4. Bottom Section: Target Progress Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid #F1F5F9",
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
          p: 3,
          width: "100%",
        }}
      >
        {/* Table Header Controls */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2.5,
          }}
        >
          <Typography
            sx={{ fontSize: "17px", fontWeight: 600, color: "#0F172A" }}
          >
            {progressTab === "Team"
              ? "Team Target Progress"
              : "Individual Target Progress"}
          </Typography>
        </Box>

        {/* Table Container */}
        <TableContainer
          sx={{ width: "100%", borderRadius: "8px", overflow: "hidden" }}
        >
          <MuiTable sx={{ minWidth: 700 }}>
            <TableHead sx={{ backgroundColor: "#E6E6E6" }}>
              <TableRow sx={{ height: "45px" }}>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: "16px",
                    color: "#1E293B",
                    py: 1,
                  }}
                >
                  {progressTab === "Team" ? "Team" : "Employee"}
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: "16px",
                    color: "#1E293B",
                    py: 1,
                  }}
                >
                  Target
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: "16px",
                    color: "#1E293B",
                    py: 1,
                  }}
                >
                  Achieved
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: "16px",
                    color: "#1E293B",
                    py: 1,
                  }}
                >
                  Balance
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 600,
                    fontSize: "16px",
                    color: "#1E293B",
                    py: 1,
                  }}
                >
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentDisplayList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{
                      py: 4,
                      color: "#64748B",
                      fontSize: "14px",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    No monthly target data found for the selected period. Click
                    "Set Target" to add.
                  </TableCell>
                </TableRow>
              ) : (
                currentDisplayList.map((row, rowIdx) => {
                  const rowKey = row.id || row.team || row.employee || rowIdx;
                  const isExpanded = progressTab === "Team" && expandedTeamId === rowKey;

                  // Find members for this team
                  let teamMembers = [];
                  if (Array.isArray(row.members) && row.members.length > 0) {
                    teamMembers = row.members;
                  } else if (Array.isArray(row.employees) && row.employees.length > 0) {
                    teamMembers = row.employees;
                  } else if (progressTab === "Team") {
                    teamMembers = individualList.filter(
                      (ind) =>
                        (ind.team && (ind.team || "").toLowerCase() === (row.team || "").toLowerCase()) ||
                        (ind.team_name && (ind.team_name || "").toLowerCase() === (row.team || "").toLowerCase())
                    );
                  }

                  const teamLeaderName =
                    row.team_leader ||
                    row.leader ||
                    row.leader_name ||
                    (teamMembers[0]?.employee || teamMembers[0]?.name || "N/A");

                  return (
                    <React.Fragment key={rowKey}>
                      <TableRow
                        onClick={() => {
                          if (progressTab === "Team") {
                            setExpandedTeamId(isExpanded ? null : rowKey);
                          }
                        }}
                        sx={{
                          height: "45px",
                          cursor: progressTab === "Team" ? "pointer" : "default",
                          backgroundColor: isExpanded ? "#F8FAFC" : "transparent",
                          "&:hover": { backgroundColor: "#F1F5F9" },
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        <TableCell
                          sx={{
                            fontSize: "14px",
                            color: "#334155",
                            fontWeight: 600,
                            py: 1,
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {progressTab === "Team" && (
                              <IconButton
                                size="small"
                                sx={{
                                  p: 0.2,
                                  color: isExpanded ? ACCENT_GREEN : "#64748B",
                                }}
                              >
                                {isExpanded ? (
                                  <KeyboardArrowUpIcon sx={{ fontSize: 20 }} />
                                ) : (
                                  <KeyboardArrowDownIcon sx={{ fontSize: 20 }} />
                                )}
                              </IconButton>
                            )}
                            <Typography
                              sx={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: isExpanded ? ACCENT_GREEN : "#0F172A",
                              }}
                            >
                              {progressTab === "Team" ? row.team : row.employee}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#334155",
                            py: 1,
                          }}
                        >
                          {row.target}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#334155",
                            py: 1,
                          }}
                        >
                          {row.achieved}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#334155",
                            py: 1,
                          }}
                        >
                          {row.balance}
                        </TableCell>
                        <TableCell align="center" sx={{ py: 1 }}>
                          <Box
                            sx={{
                              display: "inline-block",
                              px: 2,
                              py: "3px",
                              borderRadius: "3px",
                              fontSize: "14px",
                              fontWeight: 600,
                              backgroundColor:
                                row.status === "On Track" ? "#E6F4EA" : "#FCE8E6",
                              color:
                                row.status === "On Track" ? "#10B981" : "#EF4444",
                            }}
                          >
                            {row.status}
                          </Box>
                        </TableCell>
                      </TableRow>

                      {/* Expandable Details Drawer matching Image 2 style */}
                      {progressTab === "Team" && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            sx={{
                              p: 0,
                              borderBottom: isExpanded ? "1px solid #E2E8F0" : "none",
                            }}
                          >
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box
                                sx={{
                                  m: 2,
                                  p: 2.5,
                                  borderRadius: "12px",
                                  border: "1.5px solid #84CC16",
                                  backgroundColor: "#FFFFFF",
                                  boxShadow: "0 4px 12px rgba(132, 204, 22, 0.08)",
                                  position: "relative",
                                }}
                              >
                                {/* Header with Title, Team Leader & Close Button */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mb: 2,
                                    pb: 1.5,
                                    borderBottom: "1px solid #F1F5F9",
                                  }}
                                >
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <Typography
                                      sx={{ fontSize: "16px", fontWeight: 700, color: "#0F172A" }}
                                    >
                                      {row.team} - Team Details
                                    </Typography>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.8,
                                        backgroundColor: "#F7FEE7",
                                        border: "1px solid #BEF264",
                                        px: 1.5,
                                        py: "3px",
                                        borderRadius: "20px",
                                      }}
                                    >
                                      <Typography
                                        sx={{ fontSize: "12px", fontWeight: 600, color: "#3F6212" }}
                                      >
                                        Team Leader:
                                      </Typography>
                                      <Typography
                                        sx={{ fontSize: "13px", fontWeight: 700, color: "#15803D" }}
                                      >
                                        {teamLeaderName}
                                      </Typography>
                                    </Box>
                                  </Box>

                                  {/* Close (X) Button matching Image 2 */}
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedTeamId(null);
                                    }}
                                    sx={{
                                      color: "#64748B",
                                      border: "1px solid #E2E8F0",
                                      p: 0.5,
                                      "&:hover": { backgroundColor: "#F1F5F9", color: "#0F172A" },
                                    }}
                                  >
                                    <CloseIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Box>

                                {/* Sub-Table for Team Members Breakdown */}
                                <Typography
                                  sx={{ fontSize: "14px", fontWeight: 600, color: "#334155", mb: 1.5 }}
                                >
                                  Team Members Target Breakdown ({teamMembers.length})
                                </Typography>

                                <TableContainer
                                  sx={{
                                    borderRadius: "8px",
                                    border: "1px solid #E2E8F0",
                                    backgroundColor: "#FAFAFA",
                                  }}
                                >
                                  <MuiTable size="small">
                                    <TableHead sx={{ backgroundColor: "#F1F5F9" }}>
                                      <TableRow sx={{ height: "38px" }}>
                                        <TableCell sx={{ fontWeight: 600, fontSize: "13px", color: "#475569" }}>
                                          Member Name
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: "13px", color: "#475569" }}>
                                          Target
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: "13px", color: "#475569" }}>
                                          Achieved
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: "13px", color: "#475569" }}>
                                          Balance
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: "13px", color: "#475569" }}>
                                          Status
                                        </TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {teamMembers.length === 0 ? (
                                        <TableRow>
                                          <TableCell colSpan={5} align="center" sx={{ py: 2, color: "#94A3B8" }}>
                                            No individual members found for this team.
                                          </TableCell>
                                        </TableRow>
                                      ) : (
                                        teamMembers.map((member, index) => {
                                          const mName = member.employee || member.name || member.user_name || `Member ${index + 1}`;
                                          const mTarget = member.target ?? member.lead_target ?? 0;
                                          const mAchieved = member.achieved ?? 0;
                                          const mBalance = member.balance ?? Math.max(0, mTarget - mAchieved);
                                          const mStatus = member.status || (mAchieved >= mTarget ? "On Track" : "Low");

                                          return (
                                            <TableRow
                                              key={member.id || member.employee_id || index}
                                              sx={{ "&:hover": { backgroundColor: "#F8FAFC" } }}
                                            >
                                              <TableCell sx={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>
                                                {mName}
                                              </TableCell>
                                              <TableCell sx={{ fontSize: "13px", color: "#334155" }}>
                                                {mTarget}
                                              </TableCell>
                                              <TableCell sx={{ fontSize: "13px", color: "#334155" }}>
                                                {mAchieved}
                                              </TableCell>
                                              <TableCell sx={{ fontSize: "13px", color: "#334155" }}>
                                                {mBalance}
                                              </TableCell>
                                              <TableCell align="center">
                                                <Box
                                                  sx={{
                                                    display: "inline-block",
                                                    px: 1.5,
                                                    py: "2px",
                                                    borderRadius: "3px",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    backgroundColor: mStatus === "On Track" ? "#E6F4EA" : "#FCE8E6",
                                                    color: mStatus === "On Track" ? "#10B981" : "#EF4444",
                                                  }}
                                                >
                                                  {mStatus}
                                                </Box>
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })
                                      )}
                                    </TableBody>
                                  </MuiTable>
                                </TableContainer>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </MuiTable>
        </TableContainer>

        {/* Table Pagination Footer */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 3,
            mt: 2,
            pt: 1,
            color: "#64748B",
            fontSize: "13px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: "13px", color: "#64748B" }}>
              Items per page:
            </Typography>
            <Select
              defaultValue={50}
              size="small"
              sx={{
                height: "28px",
                fontSize: "12px",
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </Box>

          <Typography sx={{ fontSize: "13px", color: "#64748B" }}>
            {currentDisplayList.length > 0 ? `1-${currentDisplayList.length} of ${currentDisplayList.length}` : "0-0 of 0"}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <FirstPageIcon
              sx={{ fontSize: 18, cursor: "pointer", opacity: 0.5 }}
            />
            <ChevronLeftIcon
              sx={{ fontSize: 18, cursor: "pointer", opacity: 0.5 }}
            />
            <ChevronRightIcon
              sx={{ fontSize: 18, cursor: "pointer", opacity: 0.5 }}
            />
            <LastPageIcon
              sx={{ fontSize: 18, cursor: "pointer", opacity: 0.5 }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Set Target Interactive Modal */}
      <SetTargetModal
        open={isSetTargetOpen}
        onClose={() => setIsSetTargetOpen(false)}
        onSave={handleSaveTarget}
        teamsList={dropdownOptions.teams.length > 0 ? dropdownOptions.teams : teamList}
        employeesList={dropdownOptions.employees.length > 0 ? dropdownOptions.employees : individualList}
      />

      {/* Date Range Picker Dialog */}
      <CustomDateRangePicker
        open={openCalendar}
        onClose={() => setOpenCalendar(false)}
        onApply={handleApplyCustomRange}
        initialFrom={fromDate}
        initialTo={toDate}
      />
    </Box>
  );
}
