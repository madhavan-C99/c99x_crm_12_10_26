import React, { useMemo } from "react";
import { Box, Paper, Typography, Skeleton } from "@mui/material";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const FONT = "Inter, sans-serif";

export default function BottomAnalyticsCards({
  leadSourceTotal = 0,
  leadSources = [],
  totalLost = 0,
  lossItems = [],
  keyInsight = "",
  performerData = null,
  loading = false,
  loadingSources = false,
  loadingLoss = false,
  loadingPerformer = false,
}) {
  const isSourcesLoading = loading || loadingSources;
  const isLossLoading = loading || loadingLoss;
  const isPerformerLoading = loading || loadingPerformer;

  // Map ALL incoming lead sources without filtering
  const sourcesList = useMemo(() => {
    if (Array.isArray(leadSources) && leadSources.length > 0) {
      const palette = [
        "#84CC16", // Lime
        "#0284C7", // Sky Blue
        "#F59E0B", // Amber
        "#8B5CF6", // Purple
        "#EF4444", // Red
        "#06B6D4", // Cyan
        "#EC4899", // Pink
        "#10B981", // Emerald
        "#6366F1", // Indigo
        "#F97316", // Orange
        "#14B8A6", // Teal
        "#A855F7", // Violet
        "#EAB308", // Yellow
      ];
      return leadSources.map((item, idx) => ({
        label:
          item.source_name ||
          item.source ||
          item.label ||
          item.name ||
          item.lead_source ||
          `Source ${idx + 1}`,
        value: Number(item.count ?? item.value ?? item.total ?? 0),
        percentage: item.percentage || "",
        color: item.color || palette[idx % palette.length],
      }));
    }
    return [];
  }, [leadSources]);

  const totalSourceValue = useMemo(() => {
    return sourcesList.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  }, [sourcesList]);

  // Donut chart math: radius 53.5, circumference ~ 336.15
  const donutC = 2 * Math.PI * 53.5;
  let accumulatedOffset = 0;

  // Safe loss items mapping
  const safeLossItems = useMemo(() => {
    if (Array.isArray(lossItems) && lossItems.length > 0) {
      return lossItems.map((item, idx) => {
        const label =
          item.reason_name ||
          item.reason ||
          item.label ||
          item.name ||
          `Reason ${idx + 1}`;
        const count = item.count ?? item.value ?? 0;
        const pctRaw = item.percentage ?? item.pct ?? 0;
        const pctNum = typeof pctRaw === "string" ? parseFloat(pctRaw) || 0 : Number(pctRaw) || 0;
        return {
          ...item,
          label,
          count,
          percentage: typeof pctRaw === "string" && pctRaw.includes("%") ? pctRaw : `${pctNum}%`,
          pctNum,
        };
      });
    }
    return [];
  }, [lossItems]);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
        gap: 2.2,
        fontFamily: FONT,
        alignItems: "stretch",
      }}
    >
      {/* CARD 1: Lead Source Donut Chart & All Sources List */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
          p: 2.5,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 2,
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SchoolOutlinedIcon sx={{ fontSize: 20, color: "#84CC16" }} />
            <Typography sx={{ fontSize: "15px", fontWeight: 600, color: "#1E293B", fontFamily: FONT }}>
              Lead Source
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#64748B", fontFamily: FONT }}>
            Total: <span style={{ color: "#0F172A", fontWeight: 700 }}>{leadSourceTotal || totalSourceValue}</span>
          </Typography>
        </Box>

        {/* Dynamic Donut Chart */}
        {isSourcesLoading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 1 }}>
            <Box sx={{ width: 170, height: 170, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Skeleton variant="circular" width={140} height={140} animation="wave" />
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1.5, mt: 1.5 }}>
              <Skeleton variant="text" width={70} height={18} animation="wave" />
              <Skeleton variant="text" width={70} height={18} animation="wave" />
              <Skeleton variant="text" width={70} height={18} animation="wave" />
            </Box>
          </Box>
        ) : sourcesList.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 1, width: "100%" }}>
            {/* Donut SVG Ring */}
            <Box sx={{ width: 170, height: 170, position: "relative", flexShrink: 0 }}>
              <svg viewBox="0 0 140 140" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                {/* Background placeholder ring if 0 leads */}
                {totalSourceValue === 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r="53.5"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="22"
                  />
                )}
                {/* Active Slices */}
                {sourcesList
                  .filter((item) => Number(item.value) > 0)
                  .map((item, idx) => {
                    const val = Number(item.value) || 0;
                    const ratio = totalSourceValue > 0 ? val / totalSourceValue : 0;
                    const strokeLen = Math.max(0, ratio * donutC - 2);
                    const currentStrokeOffset = accumulatedOffset;
                    accumulatedOffset += ratio * donutC;

                    return (
                      <circle
                        key={item.label || idx}
                        cx="70"
                        cy="70"
                        r="53.5"
                        fill="none"
                        stroke={item.color}
                        strokeWidth="22"
                        strokeDasharray={`${strokeLen} ${donutC - strokeLen}`}
                        strokeDashoffset={-currentStrokeOffset}
                        strokeLinecap="round"
                      />
                    );
                  })}
              </svg>
              {/* Center Donut Label */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <Typography sx={{ fontSize: "18px", fontWeight: 700, color: "#0F172A", fontFamily: FONT, lineHeight: 1.1 }}>
                  {leadSourceTotal || totalSourceValue}
                </Typography>
                <Typography sx={{ fontSize: "10px", fontWeight: 500, color: "#64748B", fontFamily: FONT }}>
                  Total Leads
                </Typography>
              </Box>
            </Box>

            {/* Source Badges / Legend showing ALL sources with their count */}
            <Box
              sx={{
                width: "100%",
                maxHeight: 150,
                overflowY: "auto",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 1,
                mt: 2,
                px: 0.5,
                "&::-webkit-scrollbar": { width: "4px" },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#CBD5E1",
                  borderRadius: "4px",
                },
              }}
            >
              {sourcesList.map((item, idx) => (
                <Box
                  key={item.label || idx}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.7,
                    px: 1,
                    py: 0.4,
                    borderRadius: "6px",
                    backgroundColor: item.value > 0 ? "#F0FDF4" : "#F8FAFC",
                    border: `1px solid ${item.value > 0 ? "#BBF7D0" : "#E2E8F0"}`,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: "11px",
                      color: item.value > 0 ? "#15803D" : "#475569",
                      fontWeight: item.value > 0 ? 600 : 500,
                      fontFamily: FONT,
                      textTransform: "capitalize",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}:{" "}
                    <strong style={{ color: item.value > 0 ? "#14532D" : "#0F172A" }}>
                      {item.value}
                    </strong>
                    {item.percentage && item.value > 0 ? ` (${item.percentage})` : ""}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94A3B8",
              fontSize: "13px",
              fontFamily: FONT,
            }}
          >
            No lead sources recorded
          </Box>
        )}
      </Paper>

      {/* CARD 2: Loss Analysis */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
          p: 2.5,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 2,
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SchoolOutlinedIcon sx={{ fontSize: 20, color: "#84CC16" }} />
            <Typography sx={{ fontSize: "15px", fontWeight: 600, color: "#1E293B", fontFamily: FONT }}>
              Loss Analysis
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#64748B", fontFamily: FONT }}>
            Total Lost: <span style={{ color: "#DC2626", fontWeight: 700 }}>{totalLost}</span>
          </Typography>
        </Box>

        {/* Horizontal Progress Bars */}
        {isLossLoading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Skeleton variant="text" width={105} height={16} animation="wave" />
                <Skeleton variant="rounded" width="100%" height={18} animation="wave" sx={{ borderRadius: "6px" }} />
              </Box>
            ))}
            <Skeleton variant="rounded" width="100%" height={45} animation="wave" sx={{ borderRadius: "10px", mt: 1 }} />
          </Box>
        ) : safeLossItems.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            {safeLossItems.map((item, idx) => (
              <Box key={item.label || idx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  sx={{
                    width: 105,
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "#64748B",
                    textAlign: "right",
                    fontFamily: FONT,
                    lineHeight: 1.2,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={item.label}
                >
                  {item.label}
                </Typography>
                <Box sx={{ flex: 1, height: 18, position: "relative" }}>
                  <Box
                    sx={{
                      width: `${item.pctNum}%`,
                      height: "100%",
                      borderRadius: "6px",
                      backgroundColor: item.color || "#EF4444",
                      transition: "width 0.4s ease",
                    }}
                  />
                </Box>
                <Typography sx={{ width: 35, fontSize: "11px", fontWeight: 600, color: "#0F172A", fontFamily: FONT }}>
                  {item.percentage}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              height: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94A3B8",
              fontSize: "13px",
              fontFamily: FONT,
            }}
          >
            No loss analysis recorded
          </Box>
        )}

        {/* Key Insight Alert Callout Box */}
        {keyInsight && String(keyInsight).trim() !== "" && (
          <Box
            sx={{
              p: 1.4,
              borderRadius: "10px",
              backgroundColor: "#FEF2F2",
              border: "1px solid #FEE2E2",
            }}
          >
            <Typography sx={{ fontSize: "11.5px", color: "#374151", fontFamily: FONT, lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700, color: "#1F2937" }}>Key Insight:</span>{" "}
              {keyInsight}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* CARD 3: Best Performer */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
          p: 2.5,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          textAlign: "center",
          gap: 1.5,
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SchoolOutlinedIcon sx={{ fontSize: 20, color: "#84CC16" }} />
            <Typography sx={{ fontSize: "15px", fontWeight: 600, color: "#1E293B", fontFamily: FONT }}>
              Best Performer
            </Typography>
          </Box>
        </Box>

        {isPerformerLoading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, py: 1, width: "100%" }}>
            <Skeleton variant="circular" width={80} height={80} animation="wave" />
            <Skeleton variant="text" width={110} height={24} animation="wave" />
            <Skeleton variant="text" width={70} height={16} animation="wave" />
            <Skeleton variant="text" width={90} height={28} animation="wave" />
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, width: "100%", mt: 1 }}>
              <Skeleton variant="rounded" height={40} animation="wave" sx={{ borderRadius: "8px" }} />
              <Skeleton variant="rounded" height={40} animation="wave" sx={{ borderRadius: "8px" }} />
              <Skeleton variant="rounded" height={40} animation="wave" sx={{ borderRadius: "8px" }} />
            </Box>
          </Box>
        ) : performerData ? (
          <>
            {/* Avatar with Circular Ring */}
            <Box sx={{ position: "relative", width: 90, height: 90, my: 0.5 }}>
              <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="5"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#84CC16"
                  strokeWidth="5"
                  strokeDasharray="276"
                  strokeDashoffset="30"
                  strokeLinecap="round"
                />
              </svg>
              {performerData.avatar ? (
                <Box
                  component="img"
                  src={performerData.avatar}
                  alt={performerData.name || "Performer"}
                  sx={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    backgroundColor: "#CBD5E1",
                  }}
                />
              )}
            </Box>

            {/* Performer Info */}
            <Box>
              <Typography sx={{ fontSize: "17px", fontWeight: 700, color: "#0F172A", fontFamily: FONT, lineHeight: 1.2 }}>
                {performerData.name || performerData.telecaller}
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#64748B", fontFamily: FONT, mt: 0.3 }}>
                {performerData.role || performerData.designation || "Telecaller"}
              </Typography>
              <Typography sx={{ fontSize: "24px", fontWeight: 700, color: "#1E293B", fontFamily: FONT, mt: 0.8, lineHeight: 1 }}>
                {performerData.revenue || performerData.score || performerData.performance_score || "0"}
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#64748B", fontFamily: FONT }}>
                {performerData.revenue ? "Total Revenue" : "Performance Score"}
              </Typography>
            </Box>

            {/* 3 Stats Badges in a Row */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, width: "100%", mt: 0.5 }}>
              <Box sx={{ p: 0.8, borderRadius: "8px", backgroundColor: "#FEF3C7" }}>
                <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#D97706", fontFamily: FONT }}>
                  {performerData.deals_closed ?? performerData.totalLeads ?? performerData.total_leads ?? 0}
                </Typography>
                <Typography sx={{ fontSize: "10px", color: "#64748B", fontFamily: FONT, whiteSpace: "nowrap" }}>
                  {performerData.deals_closed !== undefined ? "Deals Closed" : "Total Leads"}
                </Typography>
              </Box>

              <Box sx={{ p: 0.8, borderRadius: "8px", backgroundColor: "#EFF6FF" }}>
                <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#2563EB", fontFamily: FONT }}>
                  {performerData.calls_made ?? performerData.contacted ?? 0}
                </Typography>
                <Typography sx={{ fontSize: "10px", color: "#64748B", fontFamily: FONT, whiteSpace: "nowrap" }}>
                  Calls Made
                </Typography>
              </Box>

              <Box sx={{ p: 0.8, borderRadius: "8px", backgroundColor: "#ECFCCB" }}>
                <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#3F6212", fontFamily: FONT }}>
                  {performerData.wonLeads ?? performerData.won_leads ?? performerData.deals_closed ?? 0}
                </Typography>
                <Typography sx={{ fontSize: "10px", color: "#64748B", fontFamily: FONT, whiteSpace: "nowrap" }}>
                  Won Leads
                </Typography>
              </Box>
            </Box>

            {/* Target Indicator */}
            {(performerData.targetDiff || performerData.target_diff) && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: 0.5 }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: "#16A34A" }} />
                <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#16A34A", fontFamily: FONT }}>
                  {performerData.targetDiff || performerData.target_diff}
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <Box
            sx={{
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94A3B8",
              fontSize: "13px",
              fontFamily: FONT,
            }}
          >
            No performer data recorded
          </Box>
        )}
      </Paper>
    </Box>
  );
}
