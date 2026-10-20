import React, { useState, useMemo } from "react";
import { Box, Paper, Typography, Skeleton } from "@mui/material";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

const FONT = "Inter, sans-serif";

const DEFAULT_BAR_DATA = [];
const DEFAULT_REVENUE_DATA = [];

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
    100
  );
  const yMax = Math.ceil((maxBarValue * 1.15) / 50) * 50 || 280;
  const yTicks = [0, Math.round(yMax * 0.25), Math.round(yMax * 0.5), Math.round(yMax * 0.75), yMax];

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

  // Generate smooth cubic bezier path for Revenue
  const revPoints = safeRevenueData.map((d, i) => {
    const denom = safeRevenueData.length > 1 ? safeRevenueData.length - 1 : 1;
    const x = revPaddingLeft + (i / denom) * revPlotWidth;
    const y = revPaddingTop + revPlotHeight - ((d.val || 0) / yMax) * revPlotHeight;
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
  const areaPath = revPoints.length > 0
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
              Lead Status By Month
            </Typography>
          </Box>

          {/* Active Hover Badge */}
          {hoveredBar !== null && safeBarData[hoveredBar] ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 1, sm: 1.4 },
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                px: 1.2,
                py: 0.35,
              }}
            >
              <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#0F172A", fontFamily: FONT }}>
                {safeBarData[hoveredBar]?.month}:
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#7C3AED" }} />
                <Typography sx={{ fontSize: "11.5px", fontWeight: 600, color: "#7C3AED", fontFamily: FONT }}>
                  Total: {safeBarData[hoveredBar]?.total}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#84CC16" }} />
                <Typography sx={{ fontSize: "11.5px", fontWeight: 600, color: "#4D7C0F", fontFamily: FONT }}>
                  Won: {safeBarData[hoveredBar]?.won}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#EF4444" }} />
                <Typography sx={{ fontSize: "11.5px", fontWeight: 600, color: "#DC2626", fontFamily: FONT }}>
                  Loss: {safeBarData[hoveredBar]?.loss}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography sx={{ fontSize: "11.5px", color: "#94A3B8", fontFamily: FONT, fontStyle: "italic" }}>
              Hover on chart for counts
            </Typography>
          )}
        </Box>

        {/* SVG Grouped Bar Chart */}
        {loading ? (
          <Box sx={{ width: "100%", height: barChartHeight, display: "flex", flexDirection: "column", justifyContent: "center", gap: 1.5 }}>
            <Skeleton variant="rounded" width="100%" height={170} animation="wave" sx={{ borderRadius: "10px" }} />
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

            {/* Bar Groups */}
            {safeBarData.map((d, i) => {
              const groupCenterX = barPaddingLeft + i * barGroupWidth + barGroupWidth / 2;

              const totalH = (d.total / yMax) * barPlotHeight;
              const wonH = (d.won / yMax) * barPlotHeight;
              const lossH = (d.loss / yMax) * barPlotHeight;

              const bar1X = groupCenterX - singleBarWidth * 1.5 - 2;
              const bar2X = groupCenterX - singleBarWidth / 2;
              const bar3X = groupCenterX + singleBarWidth / 2 + 2;

              const isHov = hoveredBar === i;

              return (
                <g
                  key={d.month}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Background column highlight on hover */}
                  {isHov && (
                    <rect
                      x={groupCenterX - barGroupWidth / 2 + 2}
                      y={barPaddingTop}
                      width={barGroupWidth - 4}
                      height={barPlotHeight}
                      fill="rgba(241, 245, 249, 0.7)"
                      rx="6"
                    />
                  )}

                  {/* Purple Bar - Total */}
                  <rect
                    x={bar1X}
                    y={barPaddingTop + barPlotHeight - totalH}
                    width={singleBarWidth}
                    height={totalH}
                    fill={isHov ? "#6D28D9" : "#7C3AED"}
                    rx="2"
                    style={{ transition: "all 0.2s" }}
                  />
                  {isHov && (
                    <text
                      x={bar1X + singleBarWidth / 2}
                      y={Math.max(barPaddingTop + 8, barPaddingTop + barPlotHeight - totalH - 4)}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="700"
                      fill="#7C3AED"
                      fontFamily={FONT}
                    >
                      {d.total}
                    </text>
                  )}

                  {/* Lime Bar - Won */}
                  <rect
                    x={bar2X}
                    y={barPaddingTop + barPlotHeight - wonH}
                    width={singleBarWidth}
                    height={wonH}
                    fill={isHov ? "#84CC16" : "#A3E635"}
                    rx="2"
                    style={{ transition: "all 0.2s" }}
                  />
                  {isHov && (
                    <text
                      x={bar2X + singleBarWidth / 2}
                      y={Math.max(barPaddingTop + 8, barPaddingTop + barPlotHeight - wonH - 4)}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="700"
                      fill="#4D7C0F"
                      fontFamily={FONT}
                    >
                      {d.won}
                    </text>
                  )}

                  {/* Red Bar - Loss */}
                  <rect
                    x={bar3X}
                    y={barPaddingTop + barPlotHeight - lossH}
                    width={singleBarWidth}
                    height={lossH}
                    fill={isHov ? "#DC2626" : "#EF4444"}
                    rx="2"
                    style={{ transition: "all 0.2s" }}
                  />
                  {isHov && (
                    <text
                      x={bar3X + singleBarWidth / 2}
                      y={Math.max(barPaddingTop + 8, barPaddingTop + barPlotHeight - lossH - 4)}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="700"
                      fill="#DC2626"
                      fontFamily={FONT}
                    >
                      {d.loss}
                    </text>
                  )}

                  {/* Transparent Hitbox for effortless hover detection */}
                  <rect
                    x={groupCenterX - barGroupWidth / 2}
                    y={barPaddingTop}
                    width={barGroupWidth}
                    height={barPlotHeight + 25}
                    fill="transparent"
                  />

                  {/* X label */}
                  <text
                    x={groupCenterX}
                    y={barPaddingTop + barPlotHeight + 16}
                    textAnchor="middle"
                    fontSize="11.5"
                    fill={isHov ? "#0F172A" : "#64748B"}
                    fontWeight={isHov ? "700" : "500"}
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
            No monthly lead data recorded
          </Box>
        )}

        {/* Legend */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", gap: 3, pt: 0.5 }}>
            <Skeleton variant="text" width={110} height={20} animation="wave" />
            <Skeleton variant="text" width={110} height={20} animation="wave" />
            <Skeleton variant="text" width={110} height={20} animation="wave" />
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              flexWrap: "wrap",
              pt: 0.5,
            }}
          >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "2px", backgroundColor: "#7C3AED" }} />
            <Typography sx={{ fontSize: "12px", color: "#475569", fontFamily: FONT }}>
              Total Leads <strong style={{ color: "#7C3AED", marginLeft: "3px" }}>({totalLeadsSum})</strong>
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "2px", backgroundColor: "#A3E635" }} />
            <Typography sx={{ fontSize: "12px", color: "#475569", fontFamily: FONT }}>
              Won Leads <strong style={{ color: "#4D7C0F", marginLeft: "3px" }}>({totalWonSum})</strong>
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "2px", backgroundColor: "#EF4444" }} />
            <Typography sx={{ fontSize: "12px", color: "#475569", fontFamily: FONT }}>
              Loss Leads <strong style={{ color: "#DC2626", marginLeft: "3px" }}>({totalLossSum})</strong>
            </Typography>
          </Box>
        </Box>
        )}
      </Paper>

      {/* CARD 2: Revenue by Month */}
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
        {/* Header with Hover Revenue Inspection Badge */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SchoolOutlinedIcon sx={{ fontSize: 20, color: "#84CC16" }} />
            <Typography sx={{ fontSize: "15px", fontWeight: 600, color: "#1E293B", fontFamily: FONT }}>
              Revenue by Month
            </Typography>
          </Box>
          {hoveredRevenue !== null && safeRevenueData[hoveredRevenue] ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                backgroundColor: "#F7FEE7",
                border: "1px solid #D9F99D",
                borderRadius: "8px",
                px: 1.2,
                py: 0.35,
              }}
            >
              <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#365314", fontFamily: FONT }}>
                {safeRevenueData[hoveredRevenue].month}:
              </Typography>
              <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#4D7C0F", fontFamily: FONT }}>
                ₹{safeRevenueData[hoveredRevenue].val}K
              </Typography>
            </Box>
          ) : (
            <Typography sx={{ fontSize: "11.5px", color: "#94A3B8", fontFamily: FONT, fontStyle: "italic" }}>
              Hover point for revenue
            </Typography>
          )}
        </Box>

        {/* SVG Smooth Area Chart */}
        {loading ? (
          <Box sx={{ width: "100%", height: revChartHeight, display: "flex", flexDirection: "column", justifyContent: "center", gap: 1.5 }}>
            <Skeleton variant="rounded" width="100%" height={170} animation="wave" sx={{ borderRadius: "10px" }} />
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
            {yTicks.map((tick) => {
              const y = revPaddingTop + revPlotHeight - (tick / yMax) * revPlotHeight;
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
                key={pt.month}
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
