import React, { useState, useMemo } from "react";
import { Box, Paper, Typography, Skeleton } from "@mui/material";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

const FONT = "Inter, sans-serif";

export default function MonthlyCharts({
  barData = [],
  revenueData = [],
  loading = false,
}) {
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredRevenue, setHoveredRevenue] = useState(null);

  // Normalize bar data with fallbacks for key aliases
  const safeBarData = useMemo(() => {
    if (Array.isArray(barData) && barData.length > 0) {
      return barData.map((d) => ({
        month: d.month || d.name || "",
        total: Number(d.total ?? d.total_leads ?? 0),
        won: Number(d.won ?? d.won_leads ?? d.converted ?? 0),
        loss: Number(d.loss ?? d.lost ?? d.lost_leads ?? 0),
      }));
    }
    return [];
  }, [barData]);

  // Normalize revenue data with fallbacks for key aliases
  const safeRevenueData = useMemo(() => {
    if (Array.isArray(revenueData) && revenueData.length > 0) {
      return revenueData.map((d) => ({
        month: d.month || d.name || "",
        val: Number(d.val ?? d.revenue ?? d.amount ?? d.value ?? 0),
      }));
    }
    return [];
  }, [revenueData]);

  // SVG Chart Dimensions for Lead Status Bar Chart
  const barChartWidth = 460;
  const barChartHeight = 220;
  const barPaddingLeft = 45;
  const barPaddingBottom = 30;
  const barPaddingTop = 15;
  const barPaddingRight = 15;

  const maxBarValue = Math.max(
    ...safeBarData.map((d) => Math.max(d.total, d.won, d.loss, 1)),
    1
  );
  // Dynamic scale: adapts cleanly for small counts (e.g. 3) and large counts
  const yMax =
    maxBarValue <= 5
      ? 5
      : maxBarValue <= 10
      ? 10
      : maxBarValue <= 20
      ? 20
      : Math.ceil((maxBarValue * 1.25) / 10) * 10;
  const yTicks = [
    0,
    Math.round(yMax * 0.25),
    Math.round(yMax * 0.5),
    Math.round(yMax * 0.75),
    yMax,
  ];

  const barPlotWidth = barChartWidth - barPaddingLeft - barPaddingRight;
  const barPlotHeight = barChartHeight - barPaddingTop - barPaddingBottom;

  const barGroupWidth = safeBarData.length > 0 ? barPlotWidth / safeBarData.length : barPlotWidth;
  const singleBarWidth = 11;

  // SVG Dimensions for Revenue Area Chart
  const revChartWidth = 460;
  const revChartHeight = 220;
  const revPaddingLeft = 45;
  const revPaddingBottom = 30;
  const revPaddingTop = 15;
  const revPaddingRight = 15;

  const revPlotWidth = revChartWidth - revPaddingLeft - revPaddingRight;
  const revPlotHeight = revChartHeight - revPaddingTop - revPaddingBottom;

  const maxRevValue = Math.max(...safeRevenueData.map((d) => d.val), 1);
  const revYMax =
    maxRevValue <= 5
      ? 5
      : maxRevValue <= 10
      ? 10
      : Math.ceil((maxRevValue * 1.25) / 10) * 10;
  const revYTicks = [
    0,
    Math.round(revYMax * 0.25),
    Math.round(revYMax * 0.5),
    Math.round(revYMax * 0.75),
    revYMax,
  ];

  // Generate smooth cubic bezier path for Revenue
  const revPoints = safeRevenueData.map((d, i) => {
    const denom = safeRevenueData.length > 1 ? safeRevenueData.length - 1 : 1;
    const x = revPaddingLeft + (i / denom) * revPlotWidth;
    const y = revPaddingTop + revPlotHeight - ((d.val || 0) / revYMax) * revPlotHeight;
    return { x, y, month: d.month, val: d.val };
  });

  // Smooth SVG curve generation using Catmull-Rom or cubic Bezier
  const getSmoothPath = (pts) => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const linePath = getSmoothPath(revPoints);
  const areaPath =
    revPoints.length > 0
      ? `${linePath} L ${revPoints[revPoints.length - 1].x} ${revPaddingTop + revPlotHeight} L ${revPoints[0].x} ${revPaddingTop + revPlotHeight} Z`
      : "";

  const totalLeadsSum = safeBarData.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  const totalWonSum = safeBarData.reduce((acc, curr) => acc + (Number(curr.won) || 0), 0);
  const totalLossSum = safeBarData.reduce((acc, curr) => acc + (Number(curr.loss) || 0), 0);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
        gap: 2.2,
        fontFamily: FONT,
      }}
    >
      {/* CARD 1: Lead Status By Month */}
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
        }}
      >
        {/* Header with Hover Counts Inspection Badge */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SchoolOutlinedIcon sx={{ fontSize: 20, color: "#84CC16" }} />
            <Typography sx={{ fontSize: "15px", fontWeight: 600, color: "#1E293B", fontFamily: FONT }}>
              Lead Status by Month
            </Typography>
          </Box>

          {/* Dynamic Interactive Legend with Totals or Hover inspection */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#3B82F6" }} />
              <Typography sx={{ fontSize: "11px", color: "#64748B", fontFamily: FONT }}>
                Total:{" "}
                <strong style={{ color: "#0F172A" }}>
                  {hoveredBar !== null ? safeBarData[hoveredBar]?.total ?? 0 : totalLeadsSum}
                </strong>
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#84CC16" }} />
              <Typography sx={{ fontSize: "11px", color: "#64748B", fontFamily: FONT }}>
                Won:{" "}
                <strong style={{ color: "#0F172A" }}>
                  {hoveredBar !== null ? safeBarData[hoveredBar]?.won ?? 0 : totalWonSum}
                </strong>
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#EF4444" }} />
              <Typography sx={{ fontSize: "11px", color: "#64748B", fontFamily: FONT }}>
                Loss:{" "}
                <strong style={{ color: "#0F172A" }}>
                  {hoveredBar !== null ? safeBarData[hoveredBar]?.loss ?? 0 : totalLossSum}
                </strong>
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Bar Chart SVG */}
        {loading ? (
          <Box sx={{ height: barChartHeight, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 1.5, p: 2 }}>
            <Skeleton variant="rounded" width="100%" height={160} animation="wave" sx={{ borderRadius: "10px" }} />
            <Skeleton variant="text" width="60%" height={24} animation="wave" sx={{ mx: "auto" }} />
          </Box>
        ) : safeBarData.length > 0 ? (
          <Box sx={{ position: "relative", width: "100%", overflowX: "auto" }}>
            <svg
              viewBox={`0 0 ${barChartWidth} ${barChartHeight}`}
              style={{ width: "100%", height: "auto", display: "block" }}
            >
              {/* Horizontal Grid lines */}
              {yTicks.map((tick) => {
                const y = barPaddingTop + barPlotHeight - (tick / yMax) * barPlotHeight;
                return (
                  <g key={tick}>
                    <line
                      x1={barPaddingLeft}
                      y1={y}
                      x2={barChartWidth - barPaddingRight}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <text
                      x={barPaddingLeft - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="11"
                      fill="#64748B"
                      fontFamily={FONT}
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              {/* X-axis baseline */}
              <line
                x1={barPaddingLeft}
                y1={barPaddingTop + barPlotHeight}
                x2={barChartWidth - barPaddingRight}
                y2={barPaddingTop + barPlotHeight}
                stroke="#0F172A"
                strokeWidth="1"
              />

              {/* Render Bars per Month */}
              {safeBarData.map((d, i) => {
                const groupCenterX = barPaddingLeft + i * barGroupWidth + barGroupWidth / 2;
                const totalH = (d.total / yMax) * barPlotHeight;
                const wonH = (d.won / yMax) * barPlotHeight;
                const lossH = (d.loss / yMax) * barPlotHeight;

                const isHovered = hoveredBar === i;

                return (
                  <g
                    key={d.month || i}
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Hover Backdrop Highlight */}
                    {isHovered && (
                      <rect
                        x={groupCenterX - barGroupWidth / 2 + 2}
                        y={barPaddingTop}
                        width={barGroupWidth - 4}
                        height={barPlotHeight}
                        fill="#F8FAFC"
                        rx="6"
                      />
                    )}

                    {/* Bar 1: Total Leads (Blue) */}
                    <rect
                      x={groupCenterX - singleBarWidth * 1.5 - 2}
                      y={barPaddingTop + barPlotHeight - totalH}
                      width={singleBarWidth}
                      height={Math.max(totalH, d.total > 0 ? 3 : 0)}
                      fill="#3B82F6"
                      rx="3"
                    />

                    {/* Bar 2: Won Leads (Lime Green) */}
                    <rect
                      x={groupCenterX - singleBarWidth * 0.5}
                      y={barPaddingTop + barPlotHeight - wonH}
                      width={singleBarWidth}
                      height={Math.max(wonH, d.won > 0 ? 3 : 0)}
                      fill="#84CC16"
                      rx="3"
                    />

                    {/* Bar 3: Loss Leads (Red) */}
                    <rect
                      x={groupCenterX + singleBarWidth * 0.5 + 2}
                      y={barPaddingTop + barPlotHeight - lossH}
                      width={singleBarWidth}
                      height={Math.max(lossH, d.loss > 0 ? 3 : 0)}
                      fill="#EF4444"
                      rx="3"
                    />

                    {/* Month Label */}
                    <text
                      x={groupCenterX}
                      y={barPaddingTop + barPlotHeight + 16}
                      textAnchor="middle"
                      fontSize="11"
                      fill={isHovered ? "#0F172A" : "#64748B"}
                      fontWeight={isHovered ? "700" : "500"}
                      fontFamily={FONT}
                    >
                      {d.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </Box>
        ) : (
          <Box
            sx={{
              height: barChartHeight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94A3B8",
              fontSize: "13px",
              fontFamily: FONT,
            }}
          >
            No monthly lead records found
          </Box>
        )}

        {/* Bottom space placeholder to match Card 2 */}
        <Box sx={{ height: 20 }} />
      </Paper>

      {/* CARD 2: Monthly Revenue Area Chart */}
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
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SchoolOutlinedIcon sx={{ fontSize: 20, color: "#84CC16" }} />
            <Typography sx={{ fontSize: "15px", fontWeight: 600, color: "#1E293B", fontFamily: FONT }}>
              Monthly Revenue
            </Typography>
          </Box>
        </Box>

        {/* Revenue Area Chart SVG */}
        {loading ? (
          <Box sx={{ height: revChartHeight, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 1.5, p: 2 }}>
            <Skeleton variant="rounded" width="100%" height={160} animation="wave" sx={{ borderRadius: "10px" }} />
            <Skeleton variant="text" width="60%" height={24} animation="wave" sx={{ mx: "auto" }} />
          </Box>
        ) : safeRevenueData.length > 0 ? (
          <Box sx={{ position: "relative", width: "100%", overflowX: "auto" }}>
            <svg
              viewBox={`0 0 ${revChartWidth} ${revChartHeight}`}
              style={{ width: "100%", height: "auto", display: "block" }}
            >
              <defs>
                <linearGradient id="revenueGreenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#84CC16" stopOpacity="0.32" />
                  <stop offset="90%" stopColor="#84CC16" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#84CC16" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {revYTicks.map((tick) => {
                const y = revPaddingTop + revPlotHeight - (tick / revYMax) * revPlotHeight;
                return (
                  <g key={tick}>
                    <line
                      x1={revPaddingLeft}
                      y1={y}
                      x2={revChartWidth - revPaddingRight}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <text
                      x={revPaddingLeft - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="11"
                      fill="#64748B"
                      fontFamily={FONT}
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              {/* X-axis baseline */}
              <line
                x1={revPaddingLeft}
                y1={revPaddingTop + revPlotHeight}
                x2={revChartWidth - revPaddingRight}
                y2={revPaddingTop + revPlotHeight}
                stroke="#0F172A"
                strokeWidth="1"
              />

              {/* Gradient Area Fill */}
              <path d={areaPath} fill="url(#revenueGreenGradient)" />

              {/* Smooth Top Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#84CC16"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Data Points & Month Labels */}
              {revPoints.map((pt, i) => (
                <g
                  key={pt.month || i}
                  onMouseEnter={() => setHoveredRevenue(i)}
                  onMouseLeave={() => setHoveredRevenue(null)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Transparent Hitbox for point */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="15"
                    fill="transparent"
                  />

                  {hoveredRevenue === i && (
                    <g>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="6"
                        fill="#FFFFFF"
                        stroke="#84CC16"
                        strokeWidth="3.5"
                      />
                      <rect
                        x={pt.x - 24}
                        y={pt.y - 26}
                        width="48"
                        height="19"
                        rx="5"
                        fill="#0F172A"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 13}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        fill="#BEF264"
                        fontFamily={FONT}
                      >
                        ₹{pt.val}K
                      </text>
                    </g>
                  )}
                  <text
                    x={pt.x}
                    y={revPaddingTop + revPlotHeight + 16}
                    textAnchor="middle"
                    fontSize="11"
                    fill={hoveredRevenue === i ? "#0F172A" : "#64748B"}
                    fontWeight={hoveredRevenue === i ? "700" : "500"}
                    fontFamily={FONT}
                  >
                    {pt.month}
                  </text>
                </g>
              ))}
            </svg>
          </Box>
        ) : (
          <Box
            sx={{
              height: revChartHeight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94A3B8",
              fontSize: "13px",
              fontFamily: FONT,
            }}
          >
            No monthly revenue data recorded
          </Box>
        )}

        {/* Bottom space placeholder to match Card 1 height */}
        <Box sx={{ height: 20 }} />
      </Paper>
    </Box>
  );
}
