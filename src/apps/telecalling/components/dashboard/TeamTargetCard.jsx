import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Skeleton,
  Stack,
} from "@mui/material";

import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CurrencyRupeeOutlinedIcon from "@mui/icons-material/CurrencyRupeeOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";

import dayjs from "dayjs";
import {
  fetchDashboardTargets,
  getPerformanceData,
} from "@/apps/telecalling/services/performanceService";
import { useAuth } from "@/shared/context/AuthContext";

const BRAND_GREEN = "#90D916";
const BRAND_GREEN_DARK = "#74B010";
const BRAND_GREEN_LIGHT = "#F4FFD9";
const BRAND_AMBER = "#F59E0B";
const BRAND_AMBER_DARK = "#D97706";
const BRAND_AMBER_LIGHT = "#FEF3C7";

const fmtDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getMonthRange = () => {
  const now = new Date();
  return {
    from: fmtDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: fmtDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

const formatCurrencyINR = (amount) => {
  const num = Number(amount) || 0;
  return "₹" + num.toLocaleString("en-IN");
};

const TeamTargetCard = ({ selectedPipelineId = 0 }) => {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);

  const currentMonthLabel = useMemo(() => dayjs().format("MMMM YYYY"), []);

  // Determine user role:
  // Executive (Telecaller): sees ONLY their own two targets (Target Lead Count & Amount Target)
  // Team Lead (TL) / Admin: sees Team Target, Members Progress, and Individual Target
  const userRole = (role || localStorage.getItem("role") || "").toLowerCase().trim();
  const isTLRole =
    userRole.includes("team_lead") ||
    userRole.includes("teamlead") ||
    userRole.includes("tl") ||
    userRole.includes("lead");
  const isAdminRole =
    userRole.includes("admin") ||
    userRole.includes("manager") ||
    userRole.includes("superadmin");

  const isExecutiveRole = !isTLRole && !isAdminRole;

  // Use backend role flag if available, else fallback to frontend role check
  const isExecutive =
    performanceData?.is_executive !== undefined
      ? performanceData.is_executive
      : isExecutiveRole;

  const [activeTab, setActiveTab] = useState(() => (isExecutive ? "my_target" : "team"));

  useEffect(() => {
    let isCancelled = false;

    const fetchTargets = async () => {
      setLoading(true);
      try {
        const currentMonth = dayjs().format("YYYY-MM");
        let resultData = null;

        // 1. Try dedicated dashboard targets backend API (/telecalling/fetch_dashboard_targets)
        try {
          const res = await fetchDashboardTargets({
            month: currentMonth,
            pipeline_id: Number(selectedPipelineId) || 0,
          });
          if (res?.data?.data) {
            resultData = res.data.data;
          }
        } catch (apiErr) {
          console.warn("fetchDashboardTargets fallback triggered:", apiErr);
        }

        // 2. Fallback to performance overview API if target API didn't return
        if (!resultData) {
          const range = getMonthRange();
          const loggedUserId = Number(localStorage.getItem("user_id")) || 0;
          const payload = {
            telecaller_id: isExecutive ? loggedUserId : 0,
            date_filter_type: "monthly",
            from_date: range.from,
            to_date: range.to,
            team_id: 0,
            page: 1,
            page_size: 50,
            pipeline_id: Number(selectedPipelineId) || 0,
          };
          const fallbackRes = await getPerformanceData(payload);
          resultData = fallbackRes?.data?.data || null;
        }

        if (!isCancelled) {
          setPerformanceData(resultData);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn("Error loading performance target data:", err);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchTargets();

    return () => {
      isCancelled = true;
    };
  }, [selectedPipelineId, isExecutive]);

  // Normalize members list focusing on the 2 admin-configured targets:
  // 1. Target Lead Count (target_admissions / target won leads)
  // 2. Amount Target (target_amount in ₹)
  const membersList = useMemo(() => {
    // If backend dedicated API already returned structured members array
    if (
      performanceData?.members &&
      Array.isArray(performanceData.members) &&
      performanceData.members.length > 0
    ) {
      return performanceData.members.map((m, idx) => {
        const targetLeads = Number(m.target_leads ?? m.targetLeads ?? 20);
        const achievedLeads = Number(m.achieved_leads ?? m.achievedLeads ?? 0);
        const balanceLeads = Number(m.balance_leads ?? m.balanceLeads ?? Math.max(0, targetLeads - achievedLeads));
        const leadRate = Number(m.lead_rate ?? m.leadRate ?? (targetLeads > 0 ? Math.round((achievedLeads / targetLeads) * 100) : 0));

        const targetAmount = Number(m.target_amount ?? m.targetAmount ?? targetLeads * 25000);
        const achievedAmount = Number(m.achieved_amount ?? m.achievedAmount ?? achievedLeads * 25000);
        const balanceAmount = Number(m.balance_amount ?? m.balanceAmount ?? Math.max(0, targetAmount - achievedAmount));
        const amountRate = Number(m.amount_rate ?? m.amountRate ?? (targetAmount > 0 ? Math.round((achievedAmount / targetAmount) * 100) : 0));

        const overallRate = Number(m.overall_rate ?? m.overallRate ?? Math.round((leadRate + amountRate) / 2));

        return {
          id: m.id || idx + 1,
          name: m.name || `Telecaller ${idx + 1}`,
          role: m.role || "Executive",
          rank: m.rank || idx + 1,
          targetLeads,
          achievedLeads,
          balanceLeads,
          leadRate,
          targetAmount,
          achievedAmount,
          balanceAmount,
          amountRate,
          overallRate,
          status: m.status || (overallRate >= 100 ? "Achieved" : overallRate >= 70 ? "On Track" : "Needs Push"),
        };
      });
    }

    const list = performanceData?.performance_list || [];
    if (list.length > 0) {
      return list.map((item, idx) => {
        const targetLeads =
          Number(item.target_admissions) > 0 ? Number(item.target_admissions) : 20;
        const achievedLeads = Number(item.admissions || item.won_leads || 0);
        const balanceLeads = Math.max(0, targetLeads - achievedLeads);
        const leadRate =
          targetLeads > 0 ? Math.round((achievedLeads / targetLeads) * 100) : 0;

        const targetAmount =
          Number(item.target_amount) > 0
            ? Number(item.target_amount)
            : targetLeads * 25000;
        const achievedAmount =
          Number(item.achieved_amount) > 0
            ? Number(item.achieved_amount)
            : achievedLeads * 25000;
        const balanceAmount = Math.max(0, targetAmount - achievedAmount);
        const amountRate =
          targetAmount > 0 ? Math.round((achievedAmount / targetAmount) * 100) : 0;

        const overallRate = Math.round((leadRate + amountRate) / 2);

        return {
          id: item.telecaller_id || idx + 1,
          name: item.telecaller_name || item.first_name || `Telecaller ${idx + 1}`,
          role:
            item.team_name && item.team_name !== "No Team"
              ? item.team_name
              : "Executive",
          targetLeads,
          achievedLeads,
          balanceLeads,
          leadRate,
          targetAmount,
          achievedAmount,
          balanceAmount,
          amountRate,
          overallRate,
          status:
            overallRate >= 100
              ? "Achieved"
              : overallRate >= 70
              ? "On Track"
              : "Needs Push",
          rank: item.rank || idx + 1,
        };
      });
    }

    // No dummy data: returns empty array if no API data available
    return [];
  }, [performanceData]);

  // Find target data for the logged-in user
  const loggedUserId = Number(localStorage.getItem("user_id")) || 0;
  const myData = useMemo(() => {
    if (performanceData?.my_target) {
      const mt = performanceData.my_target;
      const targetLeads = Number(mt.target_leads ?? mt.targetLeads ?? 20);
      const achievedLeads = Number(mt.achieved_leads ?? mt.achievedLeads ?? 0);
      const balanceLeads = Number(mt.balance_leads ?? mt.balanceLeads ?? Math.max(0, targetLeads - achievedLeads));
      const leadRate = Number(mt.lead_rate ?? mt.leadRate ?? (targetLeads > 0 ? Math.round((achievedLeads / targetLeads) * 100) : 0));

      const targetAmount = Number(mt.target_amount ?? mt.targetAmount ?? targetLeads * 25000);
      const achievedAmount = Number(mt.achieved_amount ?? mt.achievedAmount ?? achievedLeads * 25000);
      const balanceAmount = Number(mt.balance_amount ?? mt.balanceAmount ?? Math.max(0, targetAmount - achievedAmount));
      const amountRate = Number(mt.amount_rate ?? mt.amountRate ?? (targetAmount > 0 ? Math.round((achievedAmount / targetAmount) * 100) : 0));

      const overallRate = Number(mt.overall_rate ?? mt.overallRate ?? Math.round((leadRate + amountRate) / 2));

      return {
        id: mt.id || loggedUserId,
        name: mt.name || "Telecaller",
        role: mt.role || "Executive",
        rank: mt.rank || 1,
        targetLeads,
        achievedLeads,
        balanceLeads,
        leadRate,
        targetAmount,
        achievedAmount,
        balanceAmount,
        amountRate,
        overallRate,
        status: mt.status || (overallRate >= 100 ? "Achieved" : overallRate >= 70 ? "On Track" : "Needs Push"),
      };
    }
    const found = membersList.find((m) => m.id === loggedUserId);
    return (
      found ||
      membersList[0] || {
        id: loggedUserId,
        name: "My Target",
        role: isTLRole ? "Team Lead" : "Executive",
        rank: 1,
        targetLeads: 0,
        achievedLeads: 0,
        balanceLeads: 0,
        leadRate: 0,
        targetAmount: 0,
        achievedAmount: 0,
        balanceAmount: 0,
        amountRate: 0,
        overallRate: 0,
        status: "No Target Set",
      }
    );
  }, [performanceData, membersList, loggedUserId, isTLRole]);

  // Team Aggregates for the 2 targets
  const teamTargetLeads = useMemo(
    () =>
      Number(
        performanceData?.team_target?.target_leads ??
        performanceData?.team_target?.targetLeads ??
        membersList.reduce((acc, curr) => acc + (curr.targetLeads || 0), 0)
      ),
    [performanceData, membersList]
  );
  const teamAchievedLeads = useMemo(
    () =>
      Number(
        performanceData?.team_target?.achieved_leads ??
        performanceData?.team_target?.achievedLeads ??
        membersList.reduce((acc, curr) => acc + (curr.achievedLeads || 0), 0)
      ),
    [performanceData, membersList]
  );
  const teamBalanceLeads = Math.max(0, teamTargetLeads - teamAchievedLeads);
  const teamLeadRate =
    Number(
      performanceData?.team_target?.lead_rate ??
      performanceData?.team_target?.leadRate ??
      (teamTargetLeads > 0 ? Math.round((teamAchievedLeads / teamTargetLeads) * 100) : 0)
    );

  const teamTargetAmount = useMemo(
    () =>
      Number(
        performanceData?.team_target?.target_amount ??
        performanceData?.team_target?.targetAmount ??
        membersList.reduce((acc, curr) => acc + (curr.targetAmount || 0), 0)
      ),
    [performanceData, membersList]
  );
  const teamAchievedAmount = useMemo(
    () =>
      Number(
        performanceData?.team_target?.achieved_amount ??
        performanceData?.team_target?.achievedAmount ??
        membersList.reduce((acc, curr) => acc + (curr.achievedAmount || 0), 0)
      ),
    [performanceData, membersList]
  );
  const teamBalanceAmount = Math.max(0, teamTargetAmount - teamAchievedAmount);
  const teamAmountRate =
    Number(
      performanceData?.team_target?.amount_rate ??
      performanceData?.team_target?.amountRate ??
      (teamTargetAmount > 0 ? Math.round((teamAchievedAmount / teamTargetAmount) * 100) : 0)
    );

  const teamOverallRate = Math.round((teamLeadRate + teamAmountRate) / 2);

  // Sub-component: Renders the 2 core target cards (used for Executive view and TL's My Target tab)
  const renderTwoTargetsView = (targetItem, isOwner = true) => {
    const {
      targetLeads = 0,
      achievedLeads = 0,
      balanceLeads = 0,
      leadRate = 0,
      targetAmount = 0,
      achievedAmount = 0,
      balanceAmount = 0,
      amountRate = 0,
      name = "Telecaller",
    } = targetItem || {};

    return (
      <Box sx={{ mt: 2.5 }}>
        {/* Top Status Strip */}
        <Box
          sx={{
            p: 1.8,
            mb: 2.5,
            borderRadius: "12px",
            background:
              leadRate >= 100 && amountRate >= 100
                ? "linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%)"
                : leadRate >= 70 || amountRate >= 70
                ? `linear-gradient(135deg, ${BRAND_GREEN_LIGHT} 0%, #FFFFFF 100%)`
                : "linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%)",
            border: `1px solid ${
              leadRate >= 70 || amountRate >= 70 ? BRAND_GREEN + "50" : "#FDE68A"
            }`,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor:
                  leadRate >= 70 || amountRate >= 70 ? BRAND_GREEN : BRAND_AMBER,
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "18px",
              }}
            >
              {leadRate >= 100 && amountRate >= 100 ? "🏆" : leadRate >= 70 ? "🔥" : "🎯"}
            </Box>
            <Box>
              <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>
                {isOwner
                  ? `Monthly Target Status: ${
                      leadRate >= 100 && amountRate >= 100
                        ? "100% Targets Completed!"
                        : leadRate >= 70
                        ? "On Track to Goal!"
                        : "Focus & Push to Hit Target"
                    }`
                  : `${name}'s Target Status`}
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#64748B" }}>
                {balanceLeads > 0 || balanceAmount > 0
                  ? `${balanceLeads} more won leads (${formatCurrencyINR(
                      balanceAmount
                    )}) remaining to reach monthly target.`
                  : "Congratulations! You have achieved all targets for this month."}
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1}>
            <Chip
              label={`Leads: ${leadRate}%`}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: "11px",
                bgcolor: leadRate >= 70 ? BRAND_GREEN_LIGHT : BRAND_AMBER_LIGHT,
                color: leadRate >= 70 ? BRAND_GREEN_DARK : BRAND_AMBER_DARK,
                border: `1px solid ${
                  leadRate >= 70 ? BRAND_GREEN + "60" : BRAND_AMBER + "60"
                }`,
              }}
            />
            <Chip
              label={`Amount: ${amountRate}%`}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: "11px",
                bgcolor: amountRate >= 70 ? BRAND_GREEN_LIGHT : BRAND_AMBER_LIGHT,
                color: amountRate >= 70 ? BRAND_GREEN_DARK : BRAND_AMBER_DARK,
                border: `1px solid ${
                  amountRate >= 70 ? BRAND_GREEN + "60" : BRAND_AMBER + "60"
                }`,
              }}
            />
          </Stack>
        </Box>

        {/* 2 Focused Target Cards: Lead Count & Amount Target */}
        <Grid container spacing={2.5}>
          {/* TARGET 1: TARGET LEAD COUNT CARD */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: "14px",
                border: "1px solid #E2E8F0",
                bgcolor: "#FFFFFF",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  bgcolor: BRAND_GREEN,
                },
              }}
            >
              {/* Card Header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      bgcolor: BRAND_GREEN_LIGHT,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircleOutlineOutlinedIcon
                      sx={{ fontSize: 20, color: BRAND_GREEN_DARK }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#1E293B",
                        lineHeight: 1.2,
                      }}
                    >
                      Target Lead Count
                    </Typography>
                    <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                      Won Admissions / Converted Leads
                    </Typography>
                  </Box>
                </Box>

                <Chip
                  label={`${leadRate}% Achieved`}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "12px",
                    bgcolor: leadRate >= 70 ? BRAND_GREEN_LIGHT : BRAND_AMBER_LIGHT,
                    color: leadRate >= 70 ? BRAND_GREEN_DARK : BRAND_AMBER_DARK,
                    border: `1px solid ${
                      leadRate >= 70 ? BRAND_GREEN + "70" : BRAND_AMBER + "70"
                    }`,
                  }}
                />
              </Box>

              {/* Big Metrics Display */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "32px",
                      fontWeight: 800,
                      color: "#0F172A",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    {achievedLeads}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#64748B",
                    }}
                  >
                    / {targetLeads} Won Leads
                  </Typography>
                </Box>

                {/* Progress Bar */}
                <Box sx={{ mt: 1.5, mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, leadRate)}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: "#F1F5F9",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: BRAND_GREEN,
                        borderRadius: 5,
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* 3 Metrics Footer Breakdown */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 1.2,
                  p: 1.5,
                  borderRadius: "10px",
                  bgcolor: "#F8FAFC",
                  border: "1px solid #F1F5F9",
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: "10px", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                    Target
                  </Typography>
                  <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#1E293B", mt: 0.2 }}>
                    {targetLeads}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "center", borderLeft: "1px solid #E2E8F0", borderRight: "1px solid #E2E8F0" }}>
                  <Typography sx={{ fontSize: "10px", fontWeight: 600, color: BRAND_GREEN_DARK, textTransform: "uppercase" }}>
                    Achieved
                  </Typography>
                  <Typography sx={{ fontSize: "14px", fontWeight: 800, color: BRAND_GREEN_DARK, mt: 0.2 }}>
                    {achievedLeads}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: "10px", fontWeight: 600, color: balanceLeads > 0 ? "#DC2626" : BRAND_GREEN_DARK, textTransform: "uppercase" }}>
                    Balance
                  </Typography>
                  <Typography sx={{ fontSize: "14px", fontWeight: 700, color: balanceLeads > 0 ? "#DC2626" : BRAND_GREEN_DARK, mt: 0.2 }}>
                    {balanceLeads > 0 ? `${balanceLeads} left` : "0 (Done)"}
                  </Typography>
                </Box>
              </Box>

              <Typography sx={{ fontSize: "11px", color: "#64748B", mt: 1.5, textAlign: "center" }}>
                {balanceLeads > 0
                  ? `Need ${balanceLeads} more won leads to achieve 100% target`
                  : "🎉 Target Achieved! Great job!"}
              </Typography>
            </Box>
          </Grid>

          {/* TARGET 2: AMOUNT TARGET CARD */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: "14px",
                border: "1px solid #E2E8F0",
                bgcolor: "#FFFFFF",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  bgcolor: BRAND_AMBER,
                },
              }}
            >
              {/* Card Header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      bgcolor: BRAND_AMBER_LIGHT,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CurrencyRupeeOutlinedIcon
                      sx={{ fontSize: 20, color: BRAND_AMBER_DARK }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#1E293B",
                        lineHeight: 1.2,
                      }}
                    >
                      Amount Target
                    </Typography>
                    <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                      Monthly Revenue & Value Target
                    </Typography>
                  </Box>
                </Box>

                <Chip
                  label={`${amountRate}% Achieved`}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "12px",
                    bgcolor: amountRate >= 70 ? BRAND_GREEN_LIGHT : BRAND_AMBER_LIGHT,
                    color: amountRate >= 70 ? BRAND_GREEN_DARK : BRAND_AMBER_DARK,
                    border: `1px solid ${
                      amountRate >= 70 ? BRAND_GREEN + "70" : BRAND_AMBER + "70"
                    }`,
                  }}
                />
              </Box>

              {/* Big Metrics Display */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "30px",
                      fontWeight: 800,
                      color: "#0F172A",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    {formatCurrencyINR(achievedAmount)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#64748B",
                    }}
                  >
                    / {formatCurrencyINR(targetAmount)}
                  </Typography>
                </Box>

                {/* Progress Bar */}
                <Box sx={{ mt: 1.5, mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, amountRate)}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: "#F1F5F9",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: BRAND_AMBER,
                        borderRadius: 5,
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* 3 Metrics Footer Breakdown */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 1.2,
                  p: 1.5,
                  borderRadius: "10px",
                  bgcolor: "#F8FAFC",
                  border: "1px solid #F1F5F9",
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: "10px", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                    Target
                  </Typography>
                  <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1E293B", mt: 0.2 }}>
                    {formatCurrencyINR(targetAmount)}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "center", borderLeft: "1px solid #E2E8F0", borderRight: "1px solid #E2E8F0" }}>
                  <Typography sx={{ fontSize: "10px", fontWeight: 600, color: BRAND_AMBER_DARK, textTransform: "uppercase" }}>
                    Achieved
                  </Typography>
                  <Typography sx={{ fontSize: "13px", fontWeight: 800, color: BRAND_AMBER_DARK, mt: 0.2 }}>
                    {formatCurrencyINR(achievedAmount)}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: "10px", fontWeight: 600, color: balanceAmount > 0 ? "#DC2626" : BRAND_GREEN_DARK, textTransform: "uppercase" }}>
                    Balance
                  </Typography>
                  <Typography sx={{ fontSize: "13px", fontWeight: 700, color: balanceAmount > 0 ? "#DC2626" : BRAND_GREEN_DARK, mt: 0.2 }}>
                    {balanceAmount > 0 ? formatCurrencyINR(balanceAmount) : "₹0 (Done)"}
                  </Typography>
                </Box>
              </Box>

              <Typography sx={{ fontSize: "11px", color: "#64748B", mt: 1.5, textAlign: "center" }}>
                {balanceAmount > 0
                  ? `Need ${formatCurrencyINR(balanceAmount)} more to reach revenue target`
                  : "🎉 Revenue Target Achieved!"}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Card
      elevation={0}
      sx={{
        width: "100%",
        border: "0.5px solid #D0CCCC",
        borderRadius: "17px",
        mt: 3,
        mb: 3,
        background: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        {/* Top Header */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 2,
            pb: 2.2,
            borderBottom: "1px solid #ECECEC",
          }}
        >
          {/* Title & Context */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                backgroundColor: BRAND_GREEN_LIGHT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isExecutive ? (
                <TrackChangesOutlinedIcon sx={{ fontSize: 24, color: BRAND_GREEN_DARK }} />
              ) : (
                <GroupsOutlinedIcon sx={{ fontSize: 24, color: BRAND_GREEN_DARK }} />
              )}
            </Box>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontSize: "17px", fontWeight: 700, color: "#1E293B" }}>
                  {isExecutive ? "My Monthly Targets" : "Team Target Management"}
                </Typography>
                <Chip
                  label={currentMonthLabel}
                  size="small"
                  sx={{
                    backgroundColor: "#F1F5F9",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: "11px",
                    height: "22px",
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: "12px", color: "#64748B", mt: 0.2 }}>
                {isExecutive
                  ? `Live target progress for ${myData.name} (Lead Count & Amount Target)`
                  : "Track team targets, lead count progress, revenue targets, and telecaller contributions"}
              </Typography>
            </Box>
          </Box>

          {/* Role-based Tab Switcher: Shown ONLY to Team Lead / Admin */}
          {!isExecutive && (
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                backgroundColor: "#F1F5F9",
                p: "4px",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
              }}
            >
              <Button
                size="small"
                onClick={() => setActiveTab("team")}
                sx={{
                  textTransform: "none",
                  fontWeight: activeTab === "team" ? 700 : 500,
                  fontSize: "12px",
                  borderRadius: "7px",
                  px: 1.8,
                  py: 0.6,
                  backgroundColor: activeTab === "team" ? "#FFFFFF" : "transparent",
                  color: activeTab === "team" ? BRAND_GREEN_DARK : "#475569",
                  boxShadow: activeTab === "team" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  "&:hover": {
                    backgroundColor: activeTab === "team" ? "#FFFFFF" : "#E2E8F0",
                  },
                }}
              >
                🎯 Team Target
              </Button>

              <Button
                size="small"
                onClick={() => setActiveTab("members")}
                sx={{
                  textTransform: "none",
                  fontWeight: activeTab === "members" ? 700 : 500,
                  fontSize: "12px",
                  borderRadius: "7px",
                  px: 1.8,
                  py: 0.6,
                  backgroundColor: activeTab === "members" ? "#FFFFFF" : "transparent",
                  color: activeTab === "members" ? BRAND_GREEN_DARK : "#475569",
                  boxShadow: activeTab === "members" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  "&:hover": {
                    backgroundColor: activeTab === "members" ? "#FFFFFF" : "#E2E8F0",
                  },
                }}
              >
                👥 Members Progress ({membersList.length})
              </Button>

              <Button
                size="small"
                onClick={() => setActiveTab("my_target")}
                sx={{
                  textTransform: "none",
                  fontWeight: activeTab === "my_target" ? 700 : 500,
                  fontSize: "12px",
                  borderRadius: "7px",
                  px: 1.8,
                  py: 0.6,
                  backgroundColor: activeTab === "my_target" ? "#FFFFFF" : "transparent",
                  color: activeTab === "my_target" ? BRAND_GREEN_DARK : "#475569",
                  boxShadow: activeTab === "my_target" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  "&:hover": {
                    backgroundColor: activeTab === "my_target" ? "#FFFFFF" : "#E2E8F0",
                  },
                }}
              >
                👤 My Target
              </Button>
            </Stack>
          )}
        </Box>

        {loading ? (
          <Box sx={{ py: 3 }}>
            <Skeleton variant="rounded" height={70} sx={{ borderRadius: "12px", mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Skeleton variant="rounded" height={220} sx={{ borderRadius: "14px" }} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Skeleton variant="rounded" height={220} sx={{ borderRadius: "14px" }} />
              </Grid>
            </Grid>
          </Box>
        ) : (
          <>
            {/* ========================================================= */}
            {/* 1. EXECUTIVE / MY TARGET VIEW                             */}
            {/* (Shown directly to Telecallers, and on Tab 3 for TL)       */}
            {/* Displays ONLY the 2 admin targets: Lead Count & Amount    */}
            {/* ========================================================= */}
            {(isExecutive || activeTab === "my_target") && renderTwoTargetsView(myData, true)}

            {/* ========================================================= */}
            {/* 2. TEAM TARGET OVERVIEW (Shown ONLY for TL / Admin)       */}
            {/* ========================================================= */}
            {!isExecutive && activeTab === "team" && (
              <Box sx={{ mt: 2.5 }}>
                {/* Team Status Motivation Strip */}
                <Box
                  sx={{
                    p: 1.8,
                    mb: 2.5,
                    borderRadius: "12px",
                    background: `linear-gradient(135deg, ${BRAND_GREEN_LIGHT} 0%, #FFFFFF 100%)`,
                    border: `1px solid ${BRAND_GREEN}40`,
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between",
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: BRAND_GREEN,
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "18px",
                      }}
                    >
                      🔥
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>
                        {teamTargetLeads > 0
                          ? `Team Progress: ${teamLeadRate}% Lead Target & ${teamAmountRate}% Amount Target`
                          : "Team Target Not Configured"}
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "#64748B" }}>
                        {teamTargetLeads > 0
                          ? teamBalanceLeads > 0
                            ? `${teamBalanceLeads} more won leads (${formatCurrencyINR(
                                teamBalanceAmount
                              )}) needed across all telecallers.`
                            : "🎉 Outstanding! All team targets completed for this month!"
                          : "No monthly target configured for this team yet."}
                      </Typography>
                    </Box>
                  </Box>

                  <Chip
                    icon={<EmojiEventsOutlinedIcon sx={{ fontSize: 16, color: BRAND_GREEN_DARK }} />}
                    label={`Overall Team: ${teamOverallRate}%`}
                    size="small"
                    sx={{
                      backgroundColor: BRAND_GREEN_LIGHT,
                      color: BRAND_GREEN_DARK,
                      fontWeight: 700,
                      fontSize: "11px",
                      border: `1px solid ${BRAND_GREEN}60`,
                    }}
                  />
                </Box>

                {/* 4 Team Metric Tiles */}
                <Grid container spacing={2.5}>
                  {/* Tile 1: Team Target Lead Count */}
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Box
                      sx={{
                        p: 2.2,
                        borderRadius: "14px",
                        border: "1px solid #E2E8F0",
                        background: "#F8FAFC",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                          Team Lead Target
                        </Typography>
                        <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 18, color: BRAND_GREEN_DARK }} />
                      </Box>

                      <Box sx={{ my: 1.5 }}>
                        <Typography sx={{ fontSize: "24px", fontWeight: 800, color: "#0F172A" }}>
                          {teamAchievedLeads}{" "}
                          <span style={{ fontSize: "13px", fontWeight: 500, color: "#94A3B8" }}>
                            / {teamTargetLeads}
                          </span>
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={teamLeadRate}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: "#E2E8F0",
                                "& .MuiLinearProgress-bar": {
                                  backgroundColor: BRAND_GREEN,
                                  borderRadius: 4,
                                },
                              }}
                            />
                          </Box>
                          <Typography sx={{ fontSize: "12px", fontWeight: 700, color: BRAND_GREEN_DARK }}>
                            {teamLeadRate}%
                          </Typography>
                        </Box>
                      </Box>

                      <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                        {teamBalanceLeads} won leads remaining
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Tile 2: Team Target Amount */}
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Box
                      sx={{
                        p: 2.2,
                        borderRadius: "14px",
                        border: "1px solid #E2E8F0",
                        background: "#F8FAFC",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                          Team Amount Target
                        </Typography>
                        <CurrencyRupeeOutlinedIcon sx={{ fontSize: 18, color: BRAND_AMBER }} />
                      </Box>

                      <Box sx={{ my: 1.5 }}>
                        <Typography sx={{ fontSize: "22px", fontWeight: 800, color: "#0F172A" }}>
                          {formatCurrencyINR(teamAchievedAmount)}
                        </Typography>
                        <Typography sx={{ fontSize: "12px", fontWeight: 500, color: "#64748B" }}>
                          Target: {formatCurrencyINR(teamTargetAmount)}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={teamAmountRate}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: "#E2E8F0",
                                "& .MuiLinearProgress-bar": {
                                  backgroundColor: BRAND_AMBER,
                                  borderRadius: 4,
                                },
                              }}
                            />
                          </Box>
                          <Typography sx={{ fontSize: "12px", fontWeight: 700, color: BRAND_AMBER_DARK }}>
                            {teamAmountRate}%
                          </Typography>
                        </Box>
                      </Box>

                      <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                        {formatCurrencyINR(teamBalanceAmount)} remaining
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Tile 3: Average Achievement Rate */}
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Box
                      sx={{
                        p: 2.2,
                        borderRadius: "14px",
                        border: "1px solid #E2E8F0",
                        background: "#F8FAFC",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                          Average Target Pace
                        </Typography>
                        <TrendingUpOutlinedIcon sx={{ fontSize: 18, color: "#3B82F6" }} />
                      </Box>

                      <Box sx={{ my: 1.5 }}>
                        <Typography sx={{ fontSize: "24px", fontWeight: 800, color: "#0F172A" }}>
                          {teamOverallRate}%
                        </Typography>
                        <Typography sx={{ fontSize: "12px", color: "#64748B", mt: 0.5 }}>
                          Combined Lead & Revenue Target pace
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={teamOverallRate}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: "#E2E8F0",
                                "& .MuiLinearProgress-bar": {
                                  backgroundColor: "#3B82F6",
                                  borderRadius: 4,
                                },
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>

                      <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                        Monthly benchmark progress
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Tile 4: Active Executives Strength */}
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Box
                      sx={{
                        p: 2.2,
                        borderRadius: "14px",
                        border: "1px solid #E2E8F0",
                        background: "#F8FAFC",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                          Executives Breakdown
                        </Typography>
                        <PersonOutlineOutlinedIcon sx={{ fontSize: 18, color: "#8B5CF6" }} />
                      </Box>

                      <Box sx={{ my: 1.5 }}>
                        <Typography sx={{ fontSize: "24px", fontWeight: 800, color: "#0F172A" }}>
                          {membersList.length}{" "}
                          <span style={{ fontSize: "13px", fontWeight: 500, color: "#94A3B8" }}>
                            Telecallers
                          </span>
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.8, mt: 1, flexWrap: "wrap" }}>
                          <Chip
                            label={`${membersList.filter((m) => m.leadRate >= 70).length} On Track`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "10px",
                              fontWeight: 700,
                              bgcolor: BRAND_GREEN_LIGHT,
                              color: BRAND_GREEN_DARK,
                            }}
                          />
                          <Chip
                            label={`${membersList.filter((m) => m.leadRate < 70).length} Need Push`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "10px",
                              fontWeight: 700,
                              bgcolor: BRAND_AMBER_LIGHT,
                              color: BRAND_AMBER_DARK,
                            }}
                          />
                        </Box>
                      </Box>

                      <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                        Active executives with set targets
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* ========================================================= */}
            {/* 3. MEMBERS PROGRESS VIEW (Shown ONLY for TL / Admin)      */}
            {/* Shows both Target Lead Count & Amount Target for each     */}
            {/* ========================================================= */}
            {!isExecutive && activeTab === "members" && (
              <Box sx={{ mt: 2.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.5,
                  }}
                >
                  <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>
                    Team Members Target Breakdown
                  </Typography>
                  <Typography sx={{ fontSize: "12px", color: "#64748B" }}>
                    Lead Count & Amount Target progress per executive
                  </Typography>
                </Box>

                <TableContainer
                  sx={{
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
                      <TableRow>
                        <TableCell sx={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                          Telecaller
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                          Target Lead Count
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                          Amount Target (₹)
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                          Balance Remaining
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                          Status
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {membersList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                              <GroupsOutlinedIcon sx={{ fontSize: 38, color: "#94A3B8" }} />
                              <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#64748B" }}>
                                No team members target data found for this month
                              </Typography>
                              <Typography sx={{ fontSize: "12px", color: "#94A3B8" }}>
                                Target allocations configured by Admin will automatically appear here.
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        membersList.map((member) => {
                        const isTop = member.leadRate >= 80;
                        const isLagging = member.leadRate < 60;

                        return (
                          <TableRow key={member.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                            {/* Member Name */}
                            <TableCell sx={{ py: 1.8 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    bgcolor: isTop ? BRAND_GREEN : isLagging ? BRAND_AMBER : "#3B82F6",
                                    color: "#FFFFFF",
                                  }}
                                >
                                  {(member.name || "T").charAt(0).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>
                                    {member.name}
                                  </Typography>
                                  <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                                    {member.role} • Rank #{member.rank}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>

                            {/* Target 1: Lead Count */}
                            <TableCell sx={{ minWidth: 150 }}>
                              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                                <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#0F172A" }}>
                                  {member.achievedLeads} / {member.targetLeads} Won
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: isTop ? BRAND_GREEN_DARK : isLagging ? BRAND_AMBER_DARK : "#2563EB",
                                  }}
                                >
                                  {member.leadRate}%
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(100, member.leadRate)}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: "#E2E8F0",
                                  "& .MuiLinearProgress-bar": {
                                    bgcolor: isTop ? BRAND_GREEN : isLagging ? BRAND_AMBER : "#3B82F6",
                                    borderRadius: 3,
                                  },
                                }}
                              />
                            </TableCell>

                            {/* Target 2: Amount Target */}
                            <TableCell sx={{ minWidth: 170 }}>
                              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                                <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#0F172A" }}>
                                  {formatCurrencyINR(member.achievedAmount)} / {formatCurrencyINR(member.targetAmount)}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: isTop ? BRAND_GREEN_DARK : isLagging ? BRAND_AMBER_DARK : "#2563EB",
                                  }}
                                >
                                  {member.amountRate}%
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(100, member.amountRate)}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: "#E2E8F0",
                                  "& .MuiLinearProgress-bar": {
                                    bgcolor: isTop ? BRAND_GREEN : isLagging ? BRAND_AMBER : "#F59E0B",
                                    borderRadius: 3,
                                  },
                                }}
                              />
                            </TableCell>

                            {/* Balance Remaining */}
                            <TableCell sx={{ fontSize: "12px" }}>
                              <Typography sx={{ fontSize: "12px", fontWeight: 600, color: member.balanceLeads > 0 ? "#DC2626" : BRAND_GREEN_DARK }}>
                                {member.balanceLeads > 0 ? `${member.balanceLeads} Leads left` : "Leads Met ✓"}
                              </Typography>
                              <Typography sx={{ fontSize: "10px", color: "#64748B" }}>
                                {member.balanceAmount > 0 ? `${formatCurrencyINR(member.balanceAmount)} left` : "Amount Met ✓"}
                              </Typography>
                            </TableCell>

                            {/* Status */}
                            <TableCell align="right">
                              <Chip
                                label={member.status}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  bgcolor:
                                    member.status === "Achieved" || member.status === "On Track"
                                      ? BRAND_GREEN_LIGHT
                                      : BRAND_AMBER_LIGHT,
                                  color:
                                    member.status === "Achieved" || member.status === "On Track"
                                      ? BRAND_GREEN_DARK
                                      : BRAND_AMBER_DARK,
                                  border: `1px solid ${
                                    member.status === "Achieved" || member.status === "On Track"
                                      ? BRAND_GREEN + "60"
                                      : BRAND_AMBER + "60"
                                  }`,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      }))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamTargetCard;
