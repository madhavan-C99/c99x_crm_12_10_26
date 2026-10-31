import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Skeleton,
} from "@mui/material";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

const FONT = "Inter, sans-serif";

// Vibrant Figma-accurate palette matching reference image
const STAGE_COLORS = [
  "#60A5FA", // Sky Blue (Top slice)
  "#FB923C", // Orange (2nd slice)
  "#818CF8", // Violet / Indigo (3rd slice)
  "#FDE047", // Yellow (4th slice)
  "#A3E635", // Lime Green (5th slice)
  "#F87171", // Coral Red (Bottom slice)
  "#38BDF8", // Cyan / Sky
  "#C084FC", // Purple
  "#34D399", // Emerald
];

const getContrastTextColor = (hexColor) => {
  if (!hexColor) return "#FFFFFF";
  const hex = hexColor.replace("#", "");
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 180 ? "#0F172A" : "#FFFFFF";
  }
  return "#FFFFFF";
};

export default function PipelineAndPerformance({
  pipelineStages = [],
  performanceList = [],
  totalLost = 0,
  onViewAllPerformance,
  loading = false,
  loadingStages = false,
  loadingPerformance = false,
}) {
  const isStagesLoading = loading || loadingStages;
  const isPerformanceLoading = loading || loadingPerformance;
  const [activeFunnelIndex, setActiveFunnelIndex] = useState(null);

  // Normalize stages with fallback colors, names, and formatted numbers
  const stages = useMemo(() => {
    if (Array.isArray(pipelineStages) && pipelineStages.length > 0) {
      return pipelineStages.map((s, idx) => {
        const name = s.name || s.stage_name || s.label || s.title || `Stage ${idx + 1}`;
        const count = s.count ?? s.leads_count ?? s.total ?? s.value ?? 0;
        const color = s.color || s.stage_color || STAGE_COLORS[idx % STAGE_COLORS.length];
        return {
          ...s,
          name,
          count: typeof count === "number" ? count.toLocaleString() : count,
          color,
        };
      });
    }
    return [];
  }, [pipelineStages]);

  // Funnel SVG Geometry Calculations
  const funnelConfig = useMemo(() => {
    const N = stages.length;
    if (N === 0) return { slices: [], totalH: 240, vbWidth: 340, vbHeight: 240 };

    const vbWidth = 340;
    const vbHeight = 240;
    const gap = N > 5 ? 3 : 4;
    const sliceH = (vbHeight - (N - 1) * gap) / N;
    const wTopMax = 320;
    const wBotMin = 100;

    const slices = stages.map((stage, i) => {
      const yTop = i * (sliceH + gap);
      const yBot = yTop + sliceH;
      const w1 = wTopMax - (wTopMax - wBotMin) * (i / N);
      const w2 = wTopMax - (wTopMax - wBotMin) * ((i + 1) / N);
      const x1 = (vbWidth - w1) / 2;
      const x2 = (vbWidth + w1) / 2;
      const x3 = (vbWidth + w2) / 2;
      const x4 = (vbWidth - w2) / 2;
      const midY = (yTop + yBot) / 2;
      const rightEdge = (x2 + x3) / 2;

      return {
        ...stage,
        index: i,
        points: `${x1.toFixed(1)},${yTop.toFixed(1)} ${x2.toFixed(1)},${yTop.toFixed(1)} ${x3.toFixed(1)},${yBot.toFixed(1)} ${x4.toFixed(1)},${yBot.toFixed(1)}`,
        yTop,
        yBot,
        midY,
        rightEdge,
        topPct: (midY / vbHeight) * 100,
        rightPct: (rightEdge / vbWidth) * 100,
      };
    });

    return { slices, totalH: vbHeight, vbWidth, vbHeight };
  }, [stages]);

  const tableHeadSx = {
    backgroundColor: "#F1F5F9",
    "& .MuiTableCell-root": {
      fontSize: "12px",
      fontWeight: 600,
      color: "#475569",
      fontFamily: FONT,
      py: 1.2,
      px: 1.2,
      borderBottom: "1px solid #E2E8F0",
      whiteSpace: "nowrap",
    },
  };

  const tableBodyCellSx = {
    fontSize: "13px",
    fontWeight: 500,
    color: "#1E293B",
    fontFamily: FONT,
    py: 1.1,
    px: 1.2,
    borderBottom: "1px solid #F1F5F9",
    whiteSpace: "nowrap",
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
        gap: 2.2,
        fontFamily: FONT,
      }}
    >
      {/* CARD 1: Pipeline Funnel Card */}
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
          gap: 2,
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SchoolOutlinedIcon sx={{ fontSize: 20, color: "#84CC16" }} />
            <Typography sx={{ fontSize: "15px", fontWeight: 600, color: "#1E293B", fontFamily: FONT }}>
              Pipeline
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#64748B", fontFamily: FONT }}>
            Total Lost: <span style={{ color: "#DC2626", fontWeight: 700 }}>{totalLost}</span>
          </Typography>
        </Box>

        {/* Content: Left Stage Badges + Right Tapered Funnel */}
        {isStagesLoading ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: { xs: "column", sm: "row" },
              gap: 3,
              minHeight: 280,
            }}
          >
            {/* Left Stage Pills Skeleton */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, width: { xs: "100%", sm: "210px" }, flexShrink: 0 }}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={idx} variant="rounded" width="100%" height={38} animation="wave" sx={{ borderRadius: "10px" }} />
              ))}
            </Box>

            {/* Right Funnel Geometry Skeleton */}
            <Box sx={{ flex: 1, width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Skeleton variant="rounded" width="90%" height={36} animation="wave" sx={{ borderRadius: "6px" }} />
              <Skeleton variant="rounded" width="75%" height={36} animation="wave" sx={{ borderRadius: "6px" }} />
              <Skeleton variant="rounded" width="60%" height={36} animation="wave" sx={{ borderRadius: "6px" }} />
              <Skeleton variant="rounded" width="45%" height={36} animation="wave" sx={{ borderRadius: "6px" }} />
              <Skeleton variant="rounded" width="30%" height={36} animation="wave" sx={{ borderRadius: "6px" }} />
            </Box>
          </Box>
        ) : stages.length > 0 ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: { xs: "column", sm: "row" },
              gap: 3,
              minHeight: 280,
            }}
          >
            {/* Left Stage Pills matching Figma Design */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.2,
                width: { xs: "100%", sm: "210px" },
                flexShrink: 0,
              }}
            >
              {stages.map((stage, idx) => (
                <Box
                  key={stage.id || stage.name || idx}
                  onMouseEnter={() => setActiveFunnelIndex(idx)}
                  onMouseLeave={() => setActiveFunnelIndex(null)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 1,
                    px: 1.6,
                    borderRadius: "10px",
                    border: "1px solid",
                    borderColor: activeFunnelIndex === idx ? stage.color : "#E2E8F0",
                    backgroundColor: activeFunnelIndex === idx ? "#F8FAFC" : "#FFFFFF",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    boxShadow: activeFunnelIndex === idx ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                    "&:hover": {
                      borderColor: stage.color,
                      backgroundColor: "#F8FAFC",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#84CC16",
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#1E293B",
                        fontFamily: FONT,
                      }}
                    >
                      {stage.name}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#84CC16",
                      fontFamily: FONT,
                    }}
                  >
                    {stage.count}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Right Funnel Geometry: SVG Trapezoids + Instant Stage-Colored Tooltip */}
            <Box
              sx={{
                flex: 1,
                width: "100%",
                maxWidth: 360,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                py: 1,
              }}
            >
              <svg
                viewBox={`0 0 ${funnelConfig.vbWidth} ${funnelConfig.vbHeight}`}
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: 260,
                  display: "block",
                  overflow: "visible",
                }}
              >
                {funnelConfig.slices.map((slice, index) => {
                  const isActive = activeFunnelIndex === index;
                  return (
                    <polygon
                      key={slice.id || slice.name || index}
                      points={slice.points}
                      fill={slice.color}
                      onMouseEnter={() => setActiveFunnelIndex(index)}
                      onMouseLeave={() => setActiveFunnelIndex(null)}
                      style={{
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        filter: isActive ? "brightness(1.15)" : activeFunnelIndex !== null ? "opacity(0.65)" : "none",
                        transform: isActive ? "scale(1.02)" : "none",
                        transformOrigin: `170px ${slice.midY}px`,
                      }}
                    />
                  );
                })}
              </svg>

              {/* Instant Floating Hover Tooltip: Background is 100% slice.color with Matching Arrow */}
              {activeFunnelIndex !== null && funnelConfig.slices[activeFunnelIndex] && (
                <Box
                  sx={{
                    position: "absolute",
                    top: `${funnelConfig.slices[activeFunnelIndex].topPct}%`,
                    left: `${Math.min(funnelConfig.slices[activeFunnelIndex].rightPct + 4, 82)}%`,
                    transform: "translate(0, -50%)",
                    backgroundColor: funnelConfig.slices[activeFunnelIndex].color,
                    color: getContrastTextColor(funnelConfig.slices[activeFunnelIndex].color),
                    py: 0.6,
                    px: 1.3,
                    borderRadius: "8px",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    fontFamily: FONT,
                    pointerEvents: "none",
                    zIndex: 40,
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    transition: "top 0.12s ease",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: -6,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 0,
                      height: 0,
                      borderTop: "6px solid transparent",
                      borderBottom: "6px solid transparent",
                      borderRight: `6px solid ${funnelConfig.slices[activeFunnelIndex].color}`,
                    },
                  }}
                >
                  {funnelConfig.slices[activeFunnelIndex].name}: {funnelConfig.slices[activeFunnelIndex].count}
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              minHeight: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94A3B8",
              fontSize: "13px",
              fontFamily: FONT,
            }}
          >
            No pipeline stages recorded
          </Box>
        )}
      </Paper>

      {/* CARD 2: Performance Overview Table Card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            px: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SchoolOutlinedIcon sx={{ fontSize: 20, color: "#84CC16" }} />
            <Typography sx={{ fontSize: "15px", fontWeight: 600, color: "#1E293B", fontFamily: FONT }}>
              Performance Overview
            </Typography>
          </Box>
          <Typography
            onClick={onViewAllPerformance}
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#84CC16",
              cursor: "pointer",
              fontFamily: FONT,
              "&:hover": { color: "#65A30D", textDecoration: "underline" },
            }}
          >
            View All
          </Typography>
        </Box>

        {/* Table Container */}
        <TableContainer sx={{ maxHeight: 330 }}>
          <Table stickyHeader size="small">
            <TableHead sx={tableHeadSx}>
              <TableRow>
                <TableCell>Telecaller</TableCell>
                <TableCell align="center">Total Leads</TableCell>
                <TableCell align="center">Calls Made</TableCell>
                <TableCell align="center">Connected</TableCell>
                <TableCell align="center">Missed Followup</TableCell>
                <TableCell align="center">Conversion</TableCell>
                <TableCell align="center">Rating</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isPerformanceLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                    <TableCell align="center"><Skeleton variant="text" width={30} sx={{ mx: "auto" }} /></TableCell>
                    <TableCell align="center"><Skeleton variant="text" width={30} sx={{ mx: "auto" }} /></TableCell>
                    <TableCell align="center"><Skeleton variant="text" width={30} sx={{ mx: "auto" }} /></TableCell>
                    <TableCell align="center"><Skeleton variant="text" width={30} sx={{ mx: "auto" }} /></TableCell>
                    <TableCell align="center"><Skeleton variant="text" width={30} sx={{ mx: "auto" }} /></TableCell>
                    <TableCell align="center"><Skeleton variant="text" width={40} sx={{ mx: "auto" }} /></TableCell>
                  </TableRow>
                ))
              ) : performanceList.length > 0 ? (
                performanceList.map((row, idx) => (
                  <TableRow
                    key={row.id || row.telecaller || idx}
                    hover
                    sx={{
                      "&:hover": { backgroundColor: "#F8FAFC" },
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <TableCell sx={{ ...tableBodyCellSx, fontWeight: 600, color: "#0F172A" }}>
                      {row.name || row.telecaller || row.username || `User ${idx + 1}`}
                    </TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>
                      {row.total_leads ?? row.totalLeads ?? 0}
                    </TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>
                      {row.calls_made ?? row.callsMade ?? 0}
                    </TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>
                      {row.connected ?? 0}
                    </TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>
                      {row.missed_followup ?? row.missedFollowups ?? 0}
                    </TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>
                      {row.conversion ?? row.deals_closed ?? 0}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        ...tableBodyCellSx,
                        color: "#64748B",
                        fontWeight: 600,
                      }}
                    >
                      {row.rating ?? (row.conversion_rate ? `${row.conversion_rate}%` : "0%")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{
                      py: 6,
                      color: "#94A3B8",
                      fontSize: "13px",
                      fontFamily: FONT,
                    }}
                  >
                    No performance records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
