import React, { useState, useMemo } from "react";
import { Box, Paper, Typography, Skeleton, Tooltip } from "@mui/material";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import NorthEastIcon from "@mui/icons-material/NorthEast";

const FONT = "Inter, sans-serif";

/**
 * Computes an SVG annular wedge (donut sector) path with smooth arcs.
 */
function getAnnularWedge(cx, cy, innerR, outerR, startAngle, endAngle) {
  const x1 = cx + outerR * Math.cos(startAngle);
  const y1 = cy + outerR * Math.sin(startAngle);
  const x2 = cx + outerR * Math.cos(endAngle);
  const y2 = cy + outerR * Math.sin(endAngle);

  const x3 = cx + innerR * Math.cos(endAngle);
  const y3 = cy + innerR * Math.sin(endAngle);
  const x4 = cx + innerR * Math.cos(startAngle);
  const y4 = cy + innerR * Math.sin(startAngle);

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}

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
  const [hoveredSource, setHoveredSource] = useState(null);

  const isSourcesLoading = loading || loadingSources;
  const isLossLoading = loading || loadingLoss;
  const isPerformerLoading = loading || loadingPerformer;

  // 1. Process Lead Sources with palette matching the Figma design
  const sourcesList = useMemo(() => {
    const palette = [
      "#A3E635", // Lime green (Top-right / largest)
      "#60A5FA", // Sky blue (Bottom-right)
      "#FBBF24", // Warm amber / orange (Bottom-left)
      "#8B5CF6", // Purple (Left)
      "#F87171", // Coral red (Top-left)
      "#2DD4BF", // Teal
      "#EC4899", // Pink
      "#6366F1", // Indigo
      "#F97316", // Orange
      "#EAB308", // Yellow
    ];

    if (Array.isArray(leadSources) && leadSources.length > 0) {
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

  // Pre-calculate Donut Slices and Callout Lines
  const donutGeometry = useMemo(() => {
    const active = sourcesList.filter((s) => s.value > 0);
    const sum = active.reduce((acc, s) => acc + s.value, 0);

    if (sum === 0 || active.length === 0) {
      return { slices: [], totalSum: 0 };
    }

    const cx = 170;
    const cy = 115;
    const outerR = 62;
    const innerR = 38;

    let currentAngle = -Math.PI / 2; // start at 12 o'clock

    const slices = active.map((item, idx) => {
      const sliceAngle = (item.value / sum) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      const midAngle = startAngle + sliceAngle / 2;
      currentAngle += sliceAngle;

      const pathData =
        active.length === 1
          ? null
          : getAnnularWedge(cx, cy, innerR, outerR, startAngle, endAngle);

      // Callout line points
      const isRight = Math.cos(midAngle) >= 0;
      const x1 = cx + (outerR + 2) * Math.cos(midAngle);
      const y1 = cy + (outerR + 2) * Math.sin(midAngle);

      const elbowDist = 18;
      const x2Raw = cx + (outerR + elbowDist) * Math.cos(midAngle);
      const y2 = cy + (outerR + elbowDist) * Math.sin(midAngle);
      const x2 = isRight ? Math.min(x2Raw, 280) : Math.max(x2Raw, 50);

      const tailLen = 14;
      const x3 = isRight ? Math.min(300, x2 + tailLen) : Math.max(35, x2 - tailLen);
      const y3 = y2;

      const textX = isRight ? x3 + 4 : x3 - 4;
      const textY = y3 + 3.5;
      const textAnchor = isRight ? "start" : "end";

      return {
        ...item,
        index: idx,
        pathData,
        startAngle,
        endAngle,
        midAngle,
        x1,
        y1,
        x2,
        y2,
        x3,
        y3,
        textX,
        textY,
        textAnchor,
      };
    });

    return { slices, totalSum: sum, cx, cy, innerR, outerR };
  }, [sourcesList]);

  // 2. Safe Loss Items Mapping & Palette matching Figma design
  const lossPalette = [
    "#F87171", // Coral Red
    "#FB923C", // Orange
    "#FACC15", // Yellow
    "#8B5CF6", // Purple
    "#60A5FA", // Light Blue
    "#A3E635", // Lime Green
    "#2DD4BF", // Teal
    "#EC4899", // Pink
  ];

  const safeLossItems = useMemo(() => {
    if (Array.isArray(lossItems) && lossItems.length > 0) {
      const maxCount = Math.max(...lossItems.map((i) => Number(i.count ?? i.value ?? 0)), 1);

      return lossItems.map((item, idx) => {
        const label =
          item.reason_name ||
          item.reason ||
          item.label ||
          item.name ||
          `Reason ${idx + 1}`;
        const count = Number(item.count ?? item.value ?? 0);
        const pctRaw = item.percentage ?? item.pct ?? 0;
        const pctNum =
          typeof pctRaw === "string" ? parseFloat(pctRaw) || 0 : Number(pctRaw) || 0;

        // Relative bar width percentage (clamped for aesthetic pill rendering)
        const barWidthPct =
          pctNum > 0
            ? pctNum
            : Math.max(Math.round((count / maxCount) * 100), 10);

        return {
          ...item,
          label,
          count,
          percentage:
            typeof pctRaw === "string" && pctRaw.includes("%")
              ? pctRaw
              : `${pctNum}%`,
          pctNum,
          barWidthPct: Math.min(Math.max(barWidthPct, 8), 98),
          color: item.color || lossPalette[idx % lossPalette.length],
        };
      });
    }
    return [];
  }, [lossItems]);

  // Dynamic Key Insight text & keyword highlighting
  const dynamicInsight = useMemo(() => {
    if (keyInsight && String(keyInsight).trim() !== "") {
      return String(keyInsight);
    }
    if (safeLossItems.length > 0) {
      const top = safeLossItems[0];
      const pct = top.percentage && top.percentage !== "0%" ? top.percentage : "44%";
      return `${pct} of leads are lost due to <span style="color: #EF4444; font-weight: 600;">${top.label.toLowerCase()}</span>. Consider addressing this in your sales approach.`;
    }
    return `44% of leads are lost due to <span style="color: #EF4444; font-weight: 600;">budget constraints</span>. Consider addressing this in your sales approach.`;
  }, [keyInsight, safeLossItems]);

  // 3. Best Performer dynamic data calculations
  const performer = useMemo(() => {
    if (!performerData) {
      return {
        name: "Prakash Raj",
        role: "Senior Telecaller",
        score: "89%",
        totalLeads: 255,
        contacted: 255,
        wonLeads: 75,
        targetDiff: "11% is more to reach the target",
        avatar: null,
      };
    }

    const name =
      performerData.name ||
      performerData.telecaller ||
      performerData.full_name ||
      "Prakash Raj";

    const role =
      performerData.role ||
      performerData.designation ||
      "Senior Telecaller";

    let rawScore =
      performerData.score ??
      performerData.performance_score ??
      performerData.rating ??
      89;

    let scoreNum = 89;
    let scoreDisplay = "89%";
    if (typeof rawScore === "number") {
      scoreNum = rawScore > 1 ? Math.round(rawScore) : Math.round(rawScore * 100);
      scoreDisplay = `${scoreNum}%`;
    } else if (typeof rawScore === "string") {
      scoreDisplay = rawScore.includes("%") ? rawScore : `${rawScore}%`;
      scoreNum = parseFloat(rawScore) || 89;
    }

    const totalLeads =
      performerData.total_leads ??
      performerData.totalLeads ??
      performerData.deals_closed ??
      255;

    const contacted =
      performerData.contacted ??
      performerData.calls_made ??
      performerData.connected ??
      255;

    const wonLeads =
      performerData.won_leads ??
      performerData.wonLeads ??
      performerData.deals_closed ??
      75;

    const targetDiff =
      performerData.target_diff ||
      performerData.targetDiff ||
      `${Math.max(100 - scoreNum, 0)}% is more to reach the target`;

    return {
      name,
      role,
      score: scoreDisplay,
      totalLeads,
      contacted,
      wonLeads,
      targetDiff,
      avatar: performerData.avatar || null,
    };
  }, [performerData]);

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
      {/* ============================================================== */}
      {/* CARD 1: Lead Source Donut Chart with Callout Labels             */}
      {/* ============================================================== */}
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
          gap: 1.5,
          minHeight: "360px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SchoolOutlinedIcon sx={{ fontSize: 20, color: "#84CC16" }} />
            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#1E293B",
                fontFamily: FONT,
              }}
            >
              Lead Source
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#64748B",
              fontFamily: FONT,
            }}
          >
            Total:{" "}
            <span style={{ color: "#0F172A", fontWeight: 700 }}>
              {leadSourceTotal || totalSourceValue}
            </span>
          </Typography>
        </Box>

        {/* Dynamic Donut Chart Body */}
        {isSourcesLoading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 4,
            }}
          >
            <Skeleton
              variant="circular"
              width={140}
              height={140}
              animation="wave"
            />
          </Box>
        ) : donutGeometry.slices.length > 0 ? (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              my: "auto",
            }}
          >
            <svg
              viewBox="0 0 340 230"
              style={{
                width: "100%",
                maxHeight: "250px",
                display: "block",
                overflow: "visible",
              }}
            >
              {/* Single 100% slice fallback */}
              {donutGeometry.slices.length === 1 && (
                <circle
                  cx={donutGeometry.cx}
                  cy={donutGeometry.cy}
                  r={(donutGeometry.innerR + donutGeometry.outerR) / 2}
                  fill="none"
                  stroke={donutGeometry.slices[0].color}
                  strokeWidth={donutGeometry.outerR - donutGeometry.innerR}
                  onMouseEnter={() => setHoveredSource(0)}
                  onMouseLeave={() => setHoveredSource(null)}
                  style={{ cursor: "pointer" }}
                />
              )}

              {/* Multi-slice Donut with smooth white separator borders */}
              {donutGeometry.slices.length > 1 &&
                donutGeometry.slices.map((slice, idx) => {
                  const isHovered = hoveredSource === idx;
                  return (
                    <path
                      key={slice.label || idx}
                      d={slice.pathData}
                      fill={slice.color}
                      stroke="#FFFFFF"
                      strokeWidth="4.5"
                      strokeLinejoin="round"
                      onMouseEnter={() => setHoveredSource(idx)}
                      onMouseLeave={() => setHoveredSource(null)}
                      style={{
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        transform: isHovered ? "scale(1.05)" : "none",
                        transformOrigin: `${donutGeometry.cx}px ${donutGeometry.cy}px`,
                        filter: isHovered ? "brightness(1.15)" : "none",
                      }}
                    />
                  );
                })}

              {/* Callout Lines & Labels pointing outward */}
              {donutGeometry.slices.map((slice, idx) => {
                const isHovered = hoveredSource === idx;
                return (
                  <g
                    key={`callout-${slice.label}-${idx}`}
                    onMouseEnter={() => setHoveredSource(idx)}
                    onMouseLeave={() => setHoveredSource(null)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Leader line polyline */}
                    <polyline
                      points={`${slice.x1},${slice.y1} ${slice.x2},${slice.y2} ${slice.x3},${slice.y3}`}
                      fill="none"
                      stroke={isHovered ? slice.color : "#64748B"}
                      strokeWidth={isHovered ? "1.6" : "0.9"}
                      style={{ transition: "stroke 0.2s ease, stroke-width 0.2s ease" }}
                    />
                    {/* Label Text */}
                    <text
                      x={slice.textX}
                      y={slice.textY}
                      textAnchor={slice.textAnchor}
                      fontSize="11"
                      fill={isHovered ? "#0F172A" : "#334155"}
                      fontWeight={isHovered ? "700" : "500"}
                      fontFamily={FONT}
                    >
                      {slice.label.length > 15
                        ? slice.label.slice(0, 14) + "…"
                        : slice.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Instant Floating Hover Tooltip for Donut Slice */}
            {hoveredSource !== null && donutGeometry.slices[hoveredSource] && (
              <Box
                sx={{
                  position: "absolute",
                  left: `${(donutGeometry.slices[hoveredSource].x1 / 340) * 100}%`,
                  top: `${(donutGeometry.slices[hoveredSource].y1 / 230) * 100}%`,
                  transform:
                    (donutGeometry.slices[hoveredSource].x1 / 340) * 100 > 65
                      ? "translate(-85%, -115%)"
                      : (donutGeometry.slices[hoveredSource].x1 / 340) * 100 < 35
                      ? "translate(-15%, -115%)"
                      : "translate(-50%, -125%)",
                  pointerEvents: "none",
                  backgroundColor: "#1E293B",
                  color: "#FFFFFF",
                  py: 0.8,
                  px: 1.4,
                  borderRadius: "8px",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  zIndex: 20,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  transition: "all 0.12s ease",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#FFFFFF",
                    fontFamily: FONT,
                  }}
                >
                  {donutGeometry.slices[hoveredSource].label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: donutGeometry.slices[hoveredSource].color,
                    fontFamily: FONT,
                    mt: 0.3,
                  }}
                >
                  {donutGeometry.slices[hoveredSource].value} leads (
                  {donutGeometry.slices[hoveredSource].percentage ||
                    `${Math.round(
                      (donutGeometry.slices[hoveredSource].value /
                        donutGeometry.totalSum) *
                        100
                    )}%`}
                  )
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              height: 220,
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

        {/* Card bottom spacing placeholder */}
        <Box sx={{ height: 4 }} />
      </Paper>

      {/* ============================================================== */}
      {/* CARD 2: Loss Analysis Horizontal Bars & Key Insight            */}
      {/* ============================================================== */}
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
          gap: 1.5,
          minHeight: "360px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SchoolOutlinedIcon sx={{ fontSize: 20, color: "#84CC16" }} />
            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#1E293B",
                fontFamily: FONT,
              }}
            >
              Loss Analysis
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#64748B",
              fontFamily: FONT,
            }}
          >
            Total Lost:{" "}
            <span style={{ color: "#DC2626", fontWeight: 700 }}>{totalLost}</span>
          </Typography>
        </Box>

        {/* Horizontal Progress Bars with Instant Tooltips */}
        {isLossLoading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, my: 1 }}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                <Skeleton variant="text" width={90} height={16} animation="wave" />
                <Skeleton
                  variant="rounded"
                  width="100%"
                  height={18}
                  animation="wave"
                  sx={{ borderRadius: "10px" }}
                />
              </Box>
            ))}
          </Box>
        ) : safeLossItems.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.1, my: "auto" }}>
            {safeLossItems.map((item, idx) => (
              <Box
                key={item.label || idx}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.2,
                }}
              >
                {/* Left Label: Right-aligned, wrapping cleanly */}
                <Typography
                  sx={{
                    width: 105,
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "#475569",
                    textAlign: "right",
                    fontFamily: FONT,
                    lineHeight: 1.2,
                    flexShrink: 0,
                    whiteSpace: "pre-line",
                  }}
                >
                  {item.label}
                </Typography>

                {/* Middle Bar: Colorful pill bar with instant MUI Tooltip */}
                <Tooltip
                  title={
                    <Box sx={{ py: 0.4, px: 0.8, textAlign: "center" }}>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#FFFFFF",
                          fontFamily: FONT,
                        }}
                      >
                        {item.label}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "11.5px",
                          fontWeight: 700,
                          color: item.color,
                          fontFamily: FONT,
                          mt: 0.2,
                        }}
                      >
                        {item.count} leads ({item.percentage})
                      </Typography>
                    </Box>
                  }
                  arrow
                  placement="top"
                  disableInteractive
                  slotProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: "#1E293B",
                        color: "#FFFFFF",
                        borderRadius: "8px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        "& .MuiTooltip-arrow": {
                          color: "#1E293B",
                        },
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      flex: 1,
                      height: 18,
                      position: "relative",
                      cursor: "pointer",
                    }}
                  >
                    <Box
                      sx={{
                        width: `${item.barWidthPct}%`,
                        height: "100%",
                        borderRadius: "10px",
                        backgroundColor: item.color,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          filter: "brightness(1.15)",
                          transform: "scaleY(1.08)",
                        },
                      }}
                    />
                  </Box>
                </Tooltip>
              </Box>
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              height: 160,
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

        {/* Key Insight Alert Callout Box matching Figma Design */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: "10px",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FEE2E2",
            mt: "auto",
          }}
        >
          <Typography
            sx={{
              fontSize: "11.5px",
              color: "#374151",
              fontFamily: FONT,
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontWeight: 700, color: "#1F2937" }}>
              Key Insight:
            </span>{" "}
            <span
              dangerouslySetInnerHTML={{
                __html: dynamicInsight.replace("Key Insight:", "").trim(),
              }}
            />
          </Typography>
        </Box>
      </Paper>

      {/* ============================================================== */}
      {/* CARD 3: Best Performer with Circular Ring & Stats Badges       */}
      {/* ============================================================== */}
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
          gap: 1.2,
          minHeight: "360px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SchoolOutlinedIcon sx={{ fontSize: 20, color: "#84CC16" }} />
            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#1E293B",
                fontFamily: FONT,
              }}
            >
              Best Performer
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#64748B",
              fontFamily: FONT,
            }}
          >
            This Month
          </Typography>
        </Box>

        {isPerformerLoading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.2,
              py: 1,
              width: "100%",
            }}
          >
            <Skeleton
              variant="circular"
              width={80}
              height={80}
              animation="wave"
            />
            <Skeleton variant="text" width={110} height={24} animation="wave" />
            <Skeleton variant="text" width={70} height={16} animation="wave" />
            <Skeleton variant="text" width={90} height={28} animation="wave" />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 1,
                width: "100%",
                mt: 1,
              }}
            >
              <Skeleton
                variant="rounded"
                height={42}
                animation="wave"
                sx={{ borderRadius: "8px" }}
              />
              <Skeleton
                variant="rounded"
                height={42}
                animation="wave"
                sx={{ borderRadius: "8px" }}
              />
              <Skeleton
                variant="rounded"
                height={42}
                animation="wave"
                sx={{ borderRadius: "8px" }}
              />
            </Box>
          </Box>
        ) : (
          <>
            {/* Avatar with Circular Lime Ring */}
            <Box sx={{ position: "relative", width: 84, height: 84, my: 0.3 }}>
              <svg
                viewBox="0 0 100 100"
                style={{
                  width: "100%",
                  height: "100%",
                  transform: "rotate(-90deg)",
                }}
              >
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#84CC16"
                  strokeWidth="5.5"
                  strokeDasharray="235 45"
                  strokeDashoffset="15"
                  strokeLinecap="round"
                />
              </svg>
              {performer.avatar ? (
                <Box
                  component="img"
                  src={performer.avatar}
                  alt={performer.name}
                  sx={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    width: 68,
                    height: 68,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    width: 68,
                    height: 68,
                    borderRadius: "50%",
                    backgroundColor: "#CBD5E1",
                  }}
                />
              )}
            </Box>

            {/* Performer Name & Designation */}
            <Box>
              <Typography
                sx={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#0F172A",
                  fontFamily: FONT,
                  lineHeight: 1.2,
                }}
              >
                {performer.name}
              </Typography>
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#94A3B8",
                  fontFamily: FONT,
                  mt: 0.3,
                  fontWeight: 400,
                }}
              >
                {performer.role}
              </Typography>
            </Box>

            {/* Performance Score */}
            <Box sx={{ my: 0.2 }}>
              <Typography
                sx={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#0F172A",
                  fontFamily: FONT,
                  lineHeight: 1,
                }}
              >
                {performer.score}
              </Typography>
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#64748B",
                  fontFamily: FONT,
                  mt: 0.4,
                  fontWeight: 500,
                }}
              >
                Performance Score
              </Typography>
            </Box>

            {/* 3 Stats Badges in a Horizontal Row */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 1,
                width: "100%",
                mt: 0.5,
              }}
            >
              {/* Badge 1: Total Leads */}
              <Box
                sx={{
                  p: 0.9,
                  borderRadius: "8px",
                  backgroundColor: "#FEF3C7",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#0F172A",
                    fontFamily: FONT,
                  }}
                >
                  {performer.totalLeads}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "10.5px",
                    color: "#475569",
                    fontFamily: FONT,
                    whiteSpace: "nowrap",
                    fontWeight: 500,
                  }}
                >
                  Total Leads
                </Typography>
              </Box>

              {/* Badge 2: Contacted */}
              <Box
                sx={{
                  p: 0.9,
                  borderRadius: "8px",
                  backgroundColor: "#E0F2FE",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#0F172A",
                    fontFamily: FONT,
                  }}
                >
                  {performer.contacted}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "10.5px",
                    color: "#475569",
                    fontFamily: FONT,
                    whiteSpace: "nowrap",
                    fontWeight: 500,
                  }}
                >
                  Contacted
                </Typography>
              </Box>

              {/* Badge 3: Won Leads */}
              <Box
                sx={{
                  p: 0.9,
                  borderRadius: "8px",
                  backgroundColor: "#DCFCE7",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#0F172A",
                    fontFamily: FONT,
                  }}
                >
                  {performer.wonLeads}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "10.5px",
                    color: "#475569",
                    fontFamily: FONT,
                    whiteSpace: "nowrap",
                    fontWeight: 500,
                  }}
                >
                  Won Leads
                </Typography>
              </Box>
            </Box>

            {/* Target Indicator with North East Arrow */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.6,
                mt: 0.8,
              }}
            >
              <NorthEastIcon sx={{ fontSize: 16, color: "#16A34A" }} />
              <Typography
                sx={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#16A34A",
                  fontFamily: FONT,
                }}
              >
                {performer.targetDiff}
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
