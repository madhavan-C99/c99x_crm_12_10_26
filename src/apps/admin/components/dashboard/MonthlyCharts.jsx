import React, { useState, useMemo } from "react";
import { Box, Paper, Typography, CircularProgress } from "@mui/material";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

const FONT = "Inter, sans-serif";

/**
 * Computes nice, human-friendly integer ticks for the Y-axis.
 * Keeps grid lines neat and readable for any range (e.g. 8 leads, 280 leads, or 500 leads).
 */
function getNiceScale(maxValue, targetSteps = 4) {
  if (maxValue <= 0) {
    return { yMax: 280, ticks: [0, 70, 140, 210, 280] };
  }
  if (maxValue <= 4) {
    return { yMax: 4, ticks: [0, 1, 2, 3, 4] };
  }
  if (maxValue <= 8) {
    return { yMax: 8, ticks: [0, 2, 4, 6, 8] };
  }
  if (maxValue <= 12) {
    return { yMax: 12, ticks: [0, 3, 6, 9, 12] };
  }
  if (maxValue <= 16) {
    return { yMax: 16, ticks: [0, 4, 8, 12, 16] };
  }
  if (maxValue <= 20) {
    return { yMax: 20, ticks: [0, 5, 10, 15, 20] };
  }
  if (maxValue <= 40) {
    return { yMax: 40, ticks: [0, 10, 20, 30, 40] };
  }
  if (maxValue <= 60) {
    return { yMax: 60, ticks: [0, 15, 30, 45, 60] };
  }
  if (maxValue <= 100) {
    return { yMax: 100, ticks: [0, 25, 50, 75, 100] };
  }
  if (maxValue <= 280) {
    return { yMax: 280, ticks: [0, 70, 140, 210, 280] };
  }

  // General rounding for larger scales
  const roughStep = maxValue / targetSteps;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;

  let step;
  if (normalized <= 1) step = 1 * magnitude;
  else if (normalized <= 2) step = 2 * magnitude;
  else if (normalized <= 2.5) step = 2.5 * magnitude;
  else if (normalized <= 5) step = 5 * magnitude;
  else step = 10 * magnitude;

  const yMax = Math.ceil(maxValue / step) * step;
  const count = Math.round(yMax / step);
  const ticks = [];
  for (let i = 0; i <= count; i++) {
    ticks.push(Math.round(i * step));
  }
  return { yMax, ticks };
}

// Default months matching Figma design mockup
const DEFAULT_REVENUE_MONTHS = ["Dec", "Jan", "Feb", "March", "April", "May", "Jun", "July", "Aug"];

export default function MonthlyCharts({
  barData = [],
  revenueData = [],
  loading = false,
}) {
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredRevenue, setHoveredRevenue] = useState(null);

  // 1. Strictly dynamic data for Lead Status By Month (from WebSocket / REST)
  const safeBarData = useMemo(() => {
    if (!Array.isArray(barData) || barData.length === 0) {
      return [];
    }
    return barData.map((d) => ({
      month: d.month || d.name || "",
      total: Math.max(0, Number(d.total ?? d.total_leads ?? 0)),
      won: Math.max(0, Number(d.won ?? d.won_leads ?? d.converted ?? 0)),
      loss: Math.max(0, Number(d.loss ?? d.loss_leads ?? d.lost ?? 0)),
    }));
  }, [barData]);

  // 2. Strictly dynamic data for Revenue by Month
  const safeRevenueData = useMemo(() => {
    if (!Array.isArray(revenueData) || revenueData.length === 0) {
      return [];
    }
    return revenueData.map((d) => ({
      month: d.month || d.name || "",
      val: Math.max(0, Number(d.val ?? d.revenue ?? d.amount ?? d.value ?? 0)),
    }));
  }, [revenueData]);

  // Chart Dimensions & Grid Configuration for Lead Status By Month
  const barChartWidth = 520;
  const barChartHeight = 250;
  const barPadLeft = 45;
  const barPadRight = 20;
  const barPadTop = 25;
  const barPadBottom = 35;

  const barPlotW = barChartWidth - barPadLeft - barPadRight;
  const barPlotH = barChartHeight - barPadTop - barPadBottom;

  const maxBarValue = Math.max(
    ...safeBarData.map((d) => Math.max(d.total, d.won, d.loss, 0)),
    0
  );

  const { yMax, ticks: yTicks } = useMemo(
    () => getNiceScale(maxBarValue),
    [maxBarValue]
  );

  // Dynamic bar sizing depending on number of months
  const singleBarW =
    safeBarData.length === 1
      ? 18
      : safeBarData.length <= 3
      ? 15
      : safeBarData.length <= 6
      ? 11
      : 8;

  const barGap =
    safeBarData.length === 1
      ? 5
      : safeBarData.length <= 3
      ? 4
      : safeBarData.length <= 6
      ? 2.5
      : 2;

  // Pre-calculate bar positions
  const barGroups = useMemo(() => {
    if (safeBarData.length === 0) return [];

    const isSingle = safeBarData.length === 1;
    const barGroupWidth = isSingle ? barPlotW : barPlotW / safeBarData.length;

    return safeBarData.map((d, i) => {
      const groupCenterX = isSingle
        ? barPadLeft + barPlotW / 2
        : barPadLeft + i * barGroupWidth + barGroupWidth / 2;

      const totalH = yMax > 0 ? (d.total / yMax) * barPlotH : 0;
      const wonH = yMax > 0 ? (d.won / yMax) * barPlotH : 0;
      const lossH = yMax > 0 ? (d.loss / yMax) * barPlotH : 0;

      return {
        ...d,
        index: i,
        barGroupWidth,
        groupCenterX,
        totalH,
        wonH,
        lossH,
      };
    });
  }, [safeBarData, barPlotW, barPlotH, barPadLeft, yMax]);

  // Chart Dimensions & Coordinates for Revenue by Month
  const revChartWidth = 520;
  const revChartHeight = 250;
  const revPadLeft = 45;
  const revPadRight = 20;
  const revPadTop = 25;
  const revPadBottom = 35;

  const revPlotW = revChartWidth - revPadLeft - revPadRight;
  const revPlotH = revChartHeight - revPadTop - revPadBottom;

  const maxRevValue = Math.max(
    ...safeRevenueData.map((d) => d.val),
    0
  );

  const { yMax: revYMax, ticks: revYTicks } = useMemo(
    () => getNiceScale(maxRevValue, 4),
    [maxRevValue]
  );

  // Revenue points calculation (or default grid markers if empty)
  const revPoints = useMemo(() => {
    if (safeRevenueData.length === 0) {
      // Return default month markers along the X axis matching Figma design
      const denom = DEFAULT_REVENUE_MONTHS.length - 1;
      return DEFAULT_REVENUE_MONTHS.map((month, i) => {
        const x = revPadLeft + (i / denom) * revPlotW;
        const y = revPadTop + revPlotH;
        return { x, y, month, val: 0, index: i, isPlaceholder: true };
      });
    }

    if (safeRevenueData.length === 1) {
      const d = safeRevenueData[0];
      const x = revPadLeft + revPlotW / 2;
      const y = revYMax > 0 ? revPadTop + revPlotH - ((d.val || 0) / revYMax) * revPlotH : revPadTop + revPlotH;
      return [{ x, y, month: d.month, val: d.val, index: 0, isPlaceholder: false }];
    }

    const denom = safeRevenueData.length - 1;
    return safeRevenueData.map((d, i) => {
      const x = revPadLeft + (i / denom) * revPlotW;
      const y = revYMax > 0 ? revPadTop + revPlotH - ((d.val || 0) / revYMax) * revPlotH : revPadTop + revPlotH;
      return { x, y, month: d.month, val: d.val, index: i, isPlaceholder: false };
    });
  }, [safeRevenueData, revPadLeft, revPadTop, revPlotW, revPlotH, revYMax]);

  // Smooth cubic bezier spline for Revenue curve
  const getSmoothPath = (pts) => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 5;
      const cp1y = p1.y + (p2.y - p0.y) / 5;
      const cp2x = p2.x - (p3.x - p1.x) / 5;
      const cp2y = p2.y - (p3.y - p1.y) / 5;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const hasActualRevenue = safeRevenueData.length > 0;
  const linePath = hasActualRevenue && revPoints.length >= 2 ? getSmoothPath(revPoints) : "";
  const areaPath =
    hasActualRevenue && revPoints.length >= 2
      ? `${linePath} L ${revPoints[revPoints.length - 1].x} ${revPadTop + revPlotH} L ${revPoints[0].x} ${revPadTop + revPlotH} Z`
      : "";

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
        gap: 2.2,
        fontFamily: FONT,
      }}
    >
      {/* ============================================================== */}
      {/* CARD 1: Lead Status By Month                                   */}
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
          minHeight: "340px",
        }}
      >
        {/* Header matching Figma Design */}
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
            Lead Status By Month
          </Typography>
        </Box>

        {/* Content Body: Loading / Dynamic Chart */}
        {loading ? (
          <Box
            sx={{
              height: 250,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={30} sx={{ color: "#84CC16" }} />
          </Box>
        ) : safeBarData.length === 0 ? (
          <Box
            sx={{
              height: 250,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.2,
            }}
          >
            <Typography
              sx={{
                fontSize: "13px",
                color: "#94A3B8",
                fontFamily: FONT,
                fontWeight: 500,
              }}
            >
              No monthly lead records found
            </Typography>
          </Box>
        ) : (
          <Box sx={{ position: "relative", width: "100%" }}>
            <svg
              viewBox={`0 0 ${barChartWidth} ${barChartHeight}`}
              style={{ width: "100%", height: "auto", display: "block" }}
            >
              {/* Horizontal Dashed Grid Lines & Y-axis Ticks */}
              {yTicks.map((tick) => {
                const y =
                  barPadTop + barPlotH - (yMax > 0 ? (tick / yMax) * barPlotH : 0);
                return (
                  <g key={`bar-tick-${tick}`}>
                    <line
                      x1={barPadLeft}
                      y1={y}
                      x2={barChartWidth - barPadRight}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    {/* Tick mark on Y-axis */}
                    <line
                      x1={barPadLeft - 5}
                      y1={y}
                      x2={barPadLeft}
                      y2={y}
                      stroke="#1E293B"
                      strokeWidth="1.2"
                    />
                    <text
                      x={barPadLeft - 9}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="11"
                      fill="#475569"
                      fontWeight="500"
                      fontFamily={FONT}
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              {/* Vertical Dashed Grid Lines between months (when multi-month) */}
              {safeBarData.length > 1 &&
                barGroups.map((g, idx) => {
                  if (idx === barGroups.length - 1) return null;
                  const divX = barPadLeft + (idx + 1) * g.barGroupWidth;
                  return (
                    <line
                      key={`v-grid-${idx}`}
                      x1={divX}
                      y1={barPadTop}
                      x2={divX}
                      y2={barPadTop + barPlotH}
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                  );
                })}

              {/* Y-axis vertical line */}
              <line
                x1={barPadLeft}
                y1={barPadTop}
                x2={barPadLeft}
                y2={barPadTop + barPlotH}
                stroke="#1E293B"
                strokeWidth="1.2"
              />

              {/* X-axis horizontal baseline line */}
              <line
                x1={barPadLeft}
                y1={barPadTop + barPlotH}
                x2={barChartWidth - barPadRight}
                y2={barPadTop + barPlotH}
                stroke="#1E293B"
                strokeWidth="1.5"
              />

              {/* Render Bars per Month matching Figma Palette */}
              {barGroups.map((d, i) => {
                const isHovered = hoveredBar === i;

                // Total Leads: Purple #8B5CF6 / #7C3AED
                // Won Leads: Lime Green #A3E635 / #84CC16
                // Loss Leads: Coral Red #F87171 / #EF4444
                const totalX = d.groupCenterX - singleBarW * 1.5 - barGap;
                const wonX = d.groupCenterX - singleBarW * 0.5;
                const lossX = d.groupCenterX + singleBarW * 0.5 + barGap;

                const highlightW =
                  safeBarData.length === 1 ? 80 : Math.max(d.barGroupWidth - 4, 30);
                const highlightX = d.groupCenterX - highlightW / 2;

                return (
                  <g
                    key={d.month || i}
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Persistent Invisible Hitbox covering the entire column */}
                    <rect
                      x={safeBarData.length === 1 ? barPadLeft : d.groupCenterX - d.barGroupWidth / 2}
                      y={barPadTop}
                      width={safeBarData.length === 1 ? barPlotW : d.barGroupWidth}
                      height={barPlotH + 28}
                      fill="transparent"
                      style={{ pointerEvents: "all" }}
                    />

                    {/* Hover Backdrop Highlight */}
                    {isHovered && (
                      <rect
                        x={highlightX}
                        y={barPadTop}
                        width={highlightW}
                        height={barPlotH}
                        fill="#F8FAFC"
                        rx="6"
                        style={{ pointerEvents: "none" }}
                      />
                    )}

                    {/* Bar 1: Total Leads (Vibrant Purple #8B5CF6) */}
                    {d.total > 0 && (
                      <rect
                        x={totalX}
                        y={barPadTop + barPlotH - d.totalH}
                        width={singleBarW}
                        height={Math.max(d.totalH, 3)}
                        fill="#8B5CF6"
                        rx="3"
                        ry="3"
                        style={{
                          transition: "all 0.2s ease",
                          filter: isHovered ? "brightness(1.12)" : "none",
                        }}
                      />
                    )}

                    {/* Bar 2: Won Leads (Lime Green #A3E635) */}
                    {d.won > 0 && (
                      <rect
                        x={wonX}
                        y={barPadTop + barPlotH - d.wonH}
                        width={singleBarW}
                        height={Math.max(d.wonH, 3)}
                        fill="#A3E635"
                        rx="3"
                        ry="3"
                        style={{
                          transition: "all 0.2s ease",
                          filter: isHovered ? "brightness(1.12)" : "none",
                        }}
                      />
                    )}

                    {/* Bar 3: Loss Leads (Coral Red #F87171) */}
                    {d.loss > 0 && (
                      <rect
                        x={lossX}
                        y={barPadTop + barPlotH - d.lossH}
                        width={singleBarW}
                        height={Math.max(d.lossH, 3)}
                        fill="#F87171"
                        rx="3"
                        ry="3"
                        style={{
                          transition: "all 0.2s ease",
                          filter: isHovered ? "brightness(1.12)" : "none",
                        }}
                      />
                    )}

                    {/* Month Label on X-axis */}
                    <text
                      x={d.groupCenterX}
                      y={barPadTop + barPlotH + 18}
                      textAnchor="middle"
                      fontSize="11.5"
                      fill={isHovered ? "#0F172A" : "#334155"}
                      fontWeight={isHovered ? "700" : "500"}
                      fontFamily={FONT}
                    >
                      {d.month}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Floating Hover Tooltip matching Figma Design */}
            {hoveredBar !== null && barGroups[hoveredBar] && (
              <Box
                sx={{
                  position: "absolute",
                  left: `${(barGroups[hoveredBar].groupCenterX / barChartWidth) * 100}%`,
                  top: "10px",
                  transform:
                    (barGroups[hoveredBar].groupCenterX / barChartWidth) * 100 > 80
                      ? "translateX(-90%)"
                      : (barGroups[hoveredBar].groupCenterX / barChartWidth) * 100 < 20
                      ? "translateX(-10%)"
                      : "translateX(-50%)",
                  pointerEvents: "none",
                  backgroundColor: "#1E293B",
                  color: "#FFFFFF",
                  py: 1,
                  px: 1.5,
                  borderRadius: "10px",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  zIndex: 10,
                  minWidth: "145px",
                  transition: "all 0.15s ease",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#F8FAFC",
                    mb: 0.8,
                    fontFamily: FONT,
                  }}
                >
                  {barGroups[hoveredBar].month}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.5,
                    mb: 0.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#8B5CF6",
                      }}
                    />
                    <Typography
                      sx={{ fontSize: "11px", color: "#94A3B8", fontFamily: FONT }}
                    >
                      Total Leads
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#FFFFFF",
                      fontFamily: FONT,
                    }}
                  >
                    {barGroups[hoveredBar].total}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.5,
                    mb: 0.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#A3E635",
                      }}
                    />
                    <Typography
                      sx={{ fontSize: "11px", color: "#94A3B8", fontFamily: FONT }}
                    >
                      Won Leads
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#A3E635",
                      fontFamily: FONT,
                    }}
                  >
                    {barGroups[hoveredBar].won}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#F87171",
                      }}
                    />
                    <Typography
                      sx={{ fontSize: "11px", color: "#94A3B8", fontFamily: FONT }}
                    >
                      Loss Leads
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#F87171",
                      fontFamily: FONT,
                    }}
                  >
                    {barGroups[hoveredBar].loss}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Bottom Legend Centered matching Figma Design */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            mt: 0.5,
            pt: 0.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Box
              sx={{
                width: 11,
                height: 11,
                borderRadius: "2px",
                backgroundColor: "#8B5CF6",
              }}
            />
            <Typography
              sx={{
                fontSize: "12px",
                color: "#334155",
                fontWeight: 500,
                fontFamily: FONT,
              }}
            >
              Total Leads
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Box
              sx={{
                width: 11,
                height: 11,
                borderRadius: "2px",
                backgroundColor: "#A3E635",
              }}
            />
            <Typography
              sx={{
                fontSize: "12px",
                color: "#334155",
                fontWeight: 500,
                fontFamily: FONT,
              }}
            >
              Won Leads
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Box
              sx={{
                width: 11,
                height: 11,
                borderRadius: "2px",
                backgroundColor: "#F87171",
              }}
            />
            <Typography
              sx={{
                fontSize: "12px",
                color: "#334155",
                fontWeight: 500,
                fontFamily: FONT,
              }}
            >
              Loss Leads
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* ============================================================== */}
      {/* CARD 2: Revenue by Month                                       */}
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
          minHeight: "340px",
        }}
      >
        {/* Header matching Figma Design */}
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
            Revenue by Month
          </Typography>
        </Box>

        {/* Content Body: Loading / Chart */}
        {loading ? (
          <Box
            sx={{
              height: 250,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={30} sx={{ color: "#84CC16" }} />
          </Box>
        ) : (
          <Box sx={{ position: "relative", width: "100%" }}>
            <svg
              viewBox={`0 0 ${revChartWidth} ${revChartHeight}`}
              style={{ width: "100%", height: "auto", display: "block" }}
            >
              <defs>
                <linearGradient id="revenueLimeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A3E635" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#A3E635" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#A3E635" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Horizontal Dashed Grid Lines & Y-axis Ticks */}
              {revYTicks.map((tick) => {
                const y =
                  revPadTop +
                  revPlotH -
                  (revYMax > 0 ? (tick / revYMax) * revPlotH : 0);
                return (
                  <g key={`rev-tick-${tick}`}>
                    <line
                      x1={revPadLeft}
                      y1={y}
                      x2={revChartWidth - revPadRight}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    {/* Tick on Y-axis */}
                    <line
                      x1={revPadLeft - 5}
                      y1={y}
                      x2={revPadLeft}
                      y2={y}
                      stroke="#1E293B"
                      strokeWidth="1.2"
                    />
                    <text
                      x={revPadLeft - 9}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="11"
                      fill="#475569"
                      fontWeight="500"
                      fontFamily={FONT}
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              {/* Vertical Dashed Grid Lines at each Month */}
              {revPoints.map((pt) => (
                <line
                  key={`v-rev-${pt.month}`}
                  x1={pt.x}
                  y1={revPadTop}
                  x2={pt.x}
                  y2={revPadTop + revPlotH}
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              ))}

              {/* Y-axis vertical line */}
              <line
                x1={revPadLeft}
                y1={revPadTop}
                x2={revPadLeft}
                y2={revPadTop + revPlotH}
                stroke="#1E293B"
                strokeWidth="1.2"
              />

              {/* X-axis horizontal baseline line */}
              <line
                x1={revPadLeft}
                y1={revPadTop + revPlotH}
                x2={revChartWidth - revPadRight}
                y2={revPadTop + revPlotH}
                stroke="#1E293B"
                strokeWidth="1.5"
              />

              {/* Area Fill for Spline (when data present) */}
              {areaPath && <path d={areaPath} fill="url(#revenueLimeGradient)" />}

              {/* Smooth Top Line (when data present) */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#84CC16"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Points & Hitboxes / Month Labels */}
              {revPoints.map((pt, i) => {
                const isHovered = hoveredRevenue === i;
                const hitboxWidth =
                  revPoints.length > 1 ? revPlotW / revPoints.length : 80;

                return (
                  <g
                    key={pt.month || i}
                    onMouseEnter={() => !pt.isPlaceholder && setHoveredRevenue(i)}
                    onMouseLeave={() => setHoveredRevenue(null)}
                    style={{ cursor: pt.isPlaceholder ? "default" : "pointer" }}
                  >
                    {/* Hitbox */}
                    {!pt.isPlaceholder && (
                      <rect
                        x={pt.x - hitboxWidth / 2}
                        y={revPadTop}
                        width={hitboxWidth}
                        height={revPlotH}
                        fill="transparent"
                      />
                    )}

                    {/* Point Circle (only for actual data) */}
                    {!pt.isPlaceholder && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? "6" : "4"}
                        fill="#FFFFFF"
                        stroke="#84CC16"
                        strokeWidth={isHovered ? "3.5" : "2.5"}
                        style={{ transition: "all 0.15s ease" }}
                      />
                    )}

                    {/* Month Label on X-axis */}
                    <text
                      x={pt.x}
                      y={revPadTop + revPlotH + 18}
                      textAnchor="middle"
                      fontSize="11.5"
                      fill={isHovered ? "#0F172A" : "#334155"}
                      fontWeight={isHovered ? "700" : "500"}
                      fontFamily={FONT}
                    >
                      {pt.month}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Empty state subtle banner overlay when no revenue points */}
            {!hasActualRevenue && (
              <Box
                sx={{
                  position: "absolute",
                  top: "42%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                  textAlign: "center",
                  color: "#94A3B8",
                  fontSize: "12.5px",
                  fontWeight: 500,
                  fontFamily: FONT,
                  backgroundColor: "rgba(255,255,255,0.85)",
                  py: 0.6,
                  px: 1.8,
                  borderRadius: "20px",
                  border: "1px solid #E2E8F0",
                }}
              >
                No monthly revenue data recorded
              </Box>
            )}

            {/* Floating Hover Tooltip for Revenue */}
            {hoveredRevenue !== null && revPoints[hoveredRevenue] && !revPoints[hoveredRevenue].isPlaceholder && (
              <Box
                sx={{
                  position: "absolute",
                  left: `${(revPoints[hoveredRevenue].x / revChartWidth) * 100}%`,
                  top: `${(revPoints[hoveredRevenue].y / revChartHeight) * 100}%`,
                  transform: "translate(-50%, -120%)",
                  pointerEvents: "none",
                  backgroundColor: "#1E293B",
                  color: "#FFFFFF",
                  py: 0.8,
                  px: 1.4,
                  borderRadius: "8px",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  zIndex: 10,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  transition: "all 0.12s ease",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "11px",
                    color: "#94A3B8",
                    fontWeight: 500,
                    fontFamily: FONT,
                  }}
                >
                  {revPoints[hoveredRevenue].month}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 800,
                    color: "#A3E635",
                    fontFamily: FONT,
                    mt: 0.2,
                  }}
                >
                  ₹
                  {revPoints[hoveredRevenue].val >= 1000
                    ? `${(revPoints[hoveredRevenue].val / 1000).toFixed(0)}K`
                    : revPoints[hoveredRevenue].val.toLocaleString()}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Bottom space placeholder to match Card 1 legend */}
        <Box sx={{ height: 21 }} />
      </Paper>
    </Box>
  );
}
