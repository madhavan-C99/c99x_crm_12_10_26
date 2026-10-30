import React, { useMemo } from "react";
import { Box, Paper, Typography, Skeleton } from "@mui/material";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import PhoneMissedOutlinedIcon from "@mui/icons-material/PhoneMissedOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import CurrencyRupeeOutlinedIcon from "@mui/icons-material/CurrencyRupeeOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

const FONT = "Inter, sans-serif";

const getTrendColor = (trendStr, defaultColor) => {
  if (!trendStr) return defaultColor;
  const str = String(trendStr).trim();
  if (str.startsWith("+")) return "#16A34A";
  if (str.startsWith("-")) return "#DC2626";
  if (str.startsWith("0")) return "#64748B";
  return defaultColor;
};

const DEFAULT_METRICS = [
  {
    id: "total_leads",
    title: "Total Leads",
    value: "0",
    trend: "",
    trendColor: "#16A34A",
    valueColor: "#0284C7",
    bg: "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)",
    borderColor: "#BAE6FD",
    iconBg: "#E0F2FE",
    iconColor: "#0284C7",
    icon: <GroupsOutlinedIcon sx={{ fontSize: 22, color: "#0284C7" }} />,
  },
  {
    id: "calls_made",
    title: "Calls Made",
    value: "0",
    trend: "",
    trendColor: "#EA580C",
    valueColor: "#D97706",
    bg: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
    borderColor: "#FDE68A",
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
    icon: <PhoneOutlinedIcon sx={{ fontSize: 22, color: "#D97706" }} />,
  },
  {
    id: "follow_up",
    title: "Follow - Up",
    value: "0",
    trend: "",
    trendColor: "#16A34A",
    valueColor: "#0891B2",
    bg: "linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%)",
    borderColor: "#A5F3FC",
    iconBg: "#CFFAFE",
    iconColor: "#0891B2",
    icon: <CalendarTodayOutlinedIcon sx={{ fontSize: 21, color: "#0891B2" }} />,
  },
  {
    id: "missed_follow_up",
    title: "Missed Follow Up",
    value: "0",
    trend: "",
    trendColor: "#DC2626",
    valueColor: "#DC2626",
    bg: "linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)",
    borderColor: "#FECDD3",
    iconBg: "#FFE4E6",
    iconColor: "#E11D48",
    icon: <PhoneMissedOutlinedIcon sx={{ fontSize: 22, color: "#E11D48" }} />,
  },
  {
    id: "converted_leads",
    title: "Converted Leads",
    value: "0",
    trend: "",
    trendColor: "#16A34A",
    valueColor: "#2563EB",
    bg: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
    borderColor: "#BFDBFE",
    iconBg: "#DBEAFE",
    iconColor: "#2563EB",
    icon: <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 22, color: "#2563EB" }} />,
  },
  {
    id: "loss_leads",
    title: "Loss Leads",
    value: "0",
    trend: "",
    trendColor: "#DC2626",
    valueColor: "#DC2626",
    bg: "linear-gradient(135deg, #FFF1F2 0%, #FEE2E2 100%)",
    borderColor: "#FECACA",
    iconBg: "#FEE2E2",
    iconColor: "#DC2626",
    icon: <CancelOutlinedIcon sx={{ fontSize: 22, color: "#DC2626" }} />,
  },
  {
    id: "conversion_rate",
    title: "Conversion Rate",
    value: "0%",
    trend: "",
    trendColor: "#16A34A",
    valueColor: "#059669",
    bg: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
    borderColor: "#A7F3D0",
    iconBg: "#D1FAE5",
    iconColor: "#059669",
    icon: <PercentOutlinedIcon sx={{ fontSize: 22, color: "#059669" }} />,
  },
  {
    id: "pending_payment",
    title: "Pending Payment",
    value: "0",
    trend: "",
    trendColor: "#EA580C",
    valueColor: "#D97706",
    bg: "linear-gradient(135deg, #FFFBEB 0%, #FEF9C3 100%)",
    borderColor: "#FDE68A",
    iconBg: "#FEF9C3",
    iconColor: "#D97706",
    icon: <CurrencyRupeeOutlinedIcon sx={{ fontSize: 22, color: "#D97706" }} />,
  },
];

export default function MetricCardsGrid({ metrics = DEFAULT_METRICS, loading = false }) {
  const data = useMemo(() => {
    // 1. If metrics is an array of fully-formed card objects with 'bg' and 'icon'
    if (Array.isArray(metrics) && metrics.length > 0) {
      if (metrics[0]?.bg && metrics[0]?.icon) {
        return metrics;
      }
      // If it's an array of { id, value } or { title, value }
      return DEFAULT_METRICS.map((defaultCard) => {
        const match = metrics.find(
          (m) =>
            m.id === defaultCard.id ||
            m.key === defaultCard.id ||
            m.title?.toLowerCase() === defaultCard.title.toLowerCase()
        );
        if (match) {
          const rawVal = match.value ?? match.count ?? defaultCard.value;
          const displayVal =
            defaultCard.id === "conversion_rate" && !String(rawVal).includes("%")
              ? `${rawVal}%`
              : rawVal;
          const cardTrend = match.trend ?? defaultCard.trend;
          return {
            ...defaultCard,
            value: displayVal,
            trend: cardTrend,
            trendColor: getTrendColor(cardTrend, defaultCard.trendColor),
          };
        }
        return defaultCard;
      });
    }

    // 2. If metrics is an Object (e.g. { total_leads: { value: "3", trend: "+100% vs yesterday" }, ... })
    if (metrics && typeof metrics === "object" && !Array.isArray(metrics)) {
      return DEFAULT_METRICS.map((card) => {
        let val;
        let trend;

        switch (card.id) {
          case "total_leads":
            val = metrics.total_leads ?? metrics.totalLeads ?? metrics.total;
            trend = metrics.total_leads_trend;
            break;
          case "calls_made":
            val = metrics.calls_made ?? metrics.callsMade ?? metrics.calls;
            trend = metrics.calls_made_trend;
            break;
          case "follow_up":
            val = metrics.follow_up ?? metrics.followUp ?? metrics.followup ?? metrics.follow_ups;
            trend = metrics.follow_up_trend;
            break;
          case "missed_follow_up":
            val = metrics.missed_follow_up ?? metrics.missedFollowUp ?? metrics.missed_followups ?? metrics.missed;
            trend = metrics.missed_follow_up_trend;
            break;
          case "converted_leads":
            val = metrics.converted_leads ?? metrics.convertedLeads ?? metrics.converted ?? metrics.won ?? metrics.won_leads;
            trend = metrics.converted_leads_trend;
            break;
          case "loss_leads":
          case "lost_leads":
            val = metrics.loss_leads ?? metrics.lost_leads ?? metrics.lostLeads ?? metrics.lost ?? metrics.total_lost;
            trend = metrics.loss_leads_trend ?? metrics.lost_leads_trend;
            break;
          case "conversion_rate":
            val = metrics.conversion_rate ?? metrics.conversionRate ?? metrics.conversion ?? metrics.rate;
            trend = metrics.conversion_rate_trend;
            break;
          case "pending_payment":
            val = metrics.pending_payment ?? metrics.pendingPayment ?? metrics.pending_amount ?? metrics.pendingPayments;
            trend = metrics.pending_payment_trend;
            break;
          default:
            val = metrics[card.id];
            break;
        }

        if (val !== undefined && val !== null) {
          if (typeof val === "object") {
            const rawVal = val.value ?? val.count ?? card.value;
            const displayVal =
              card.id === "conversion_rate" && !String(rawVal).includes("%")
                ? `${rawVal}%`
                : rawVal;
            const cardTrend = val.trend ?? trend ?? card.trend;
            return {
              ...card,
              value: displayVal,
              trend: cardTrend,
              trendColor: getTrendColor(cardTrend, card.trendColor),
            };
          }
          const rawVal = typeof val === "number" ? val.toLocaleString() : String(val);
          const displayVal =
            card.id === "conversion_rate" && !String(rawVal).includes("%")
              ? `${rawVal}%`
              : rawVal;
          return {
            ...card,
            value: displayVal,
            trend: trend ?? card.trend,
            trendColor: getTrendColor(trend, card.trendColor),
          };
        }

        return card;
      });
    }

    return DEFAULT_METRICS;
  }, [metrics]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
          fontFamily: FONT,
        }}
      >
        {Array.from({ length: 8 }).map((_, idx) => (
          <Paper
            key={idx}
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: "16px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 1.5,
              minHeight: 125,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <Skeleton variant="text" width={90} height={20} animation="wave" sx={{ borderRadius: "4px" }} />
              <Skeleton variant="rounded" width={38} height={38} animation="wave" sx={{ borderRadius: "10px" }} />
            </Box>
            <Skeleton variant="text" width={110} height={36} animation="wave" sx={{ borderRadius: "6px", my: 0.5 }} />
            <Skeleton variant="text" width={65} height={18} animation="wave" sx={{ borderRadius: "4px" }} />
          </Paper>
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(4, 1fr)",
        },
        gap: 2,
        fontFamily: FONT,
      }}
    >
      {data.map((card) => (
        <Paper
          key={card.id || card.title}
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: "16px",
            background: card.bg,
            border: `1px solid ${card.borderColor || "#E2E8F0"}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 1.5,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
            },
          }}
        >
          {/* Top Row: Title + Icon Badge */}
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <Typography
              sx={{
                fontSize: "13.5px",
                fontWeight: 500,
                color: "#64748B",
                fontFamily: FONT,
              }}
            >
              {card.title}
            </Typography>

            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                backgroundColor: card.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {card.icon}
            </Box>
          </Box>

          {/* Big Number */}
          <Typography
            sx={{
              fontSize: "26px",
              fontWeight: 700,
              color: card.valueColor || "#0F172A",
              fontFamily: FONT,
              lineHeight: 1,
              letterSpacing: "-0.01em",
            }}
          >
            {card.value}
          </Typography>

          {/* Trend Row */}
          {Boolean(card.trend) && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: -0.3 }}>
              {String(card.trend).trim().startsWith("-") ? (
                <TrendingDownIcon
                  sx={{
                    fontSize: 16,
                    color: card.trendColor || "#DC2626",
                  }}
                />
              ) : (
                <TrendingUpIcon
                  sx={{
                    fontSize: 16,
                    color: card.trendColor || "#16A34A",
                  }}
                />
              )}
              <Typography
                sx={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: card.trendColor || "#16A34A",
                  fontFamily: FONT,
                }}
              >
                {card.trend}
              </Typography>
            </Box>
          )}
        </Paper>
      ))}
    </Box>
  );
}
