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
  Tooltip,
} from "@mui/material";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

const FONT = "Inter, sans-serif";

const STAGE_COLORS = [
  "#60A5FA", // Blue
  "#FB923C", // Orange
  "#818CF8", // Indigo
  "#FDE047", // Yellow
  "#A3E635", // Lime
  "#F87171", // Coral Red
  "#38BDF8", // Sky Blue
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

const PERFORMANCE_DATA = [];

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
        const color = s.color || STAGE_COLORS[idx % STAGE_COLORS.length];
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
            {/* Left Stage Pills */}
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
                    p: 0.9,
                    px: 1.4,
                    borderRadius: "10px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: activeFunnelIndex === idx ? "#F8FAFC" : "#FFFFFF",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    "&:hover": {
                      borderColor: stage.color,
                      backgroundColor: "#F8FAFC",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.9 }}>
                    <Box
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        backgroundColor: stage.color || "#84CC16",
                      }}
                    />
                    <Typography sx={{ fontSize: "12.5px", fontWeight: 500, color: "#1E293B", fontFamily: FONT }}>
                      {stage.name}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 0.8,
                      py: 0.1,
                      borderRadius: "6px",
                      backgroundColor: "#F0FDF4",
                      border: "1px solid #DCFCE7",
                      color: "#16A34A",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      fontFamily: FONT,
                    }}
                  >
                    {stage.count}
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Right Funnel Geometry with Stage-Colored Tooltip */}
            <Box
              sx={{
                flex: 1,
                width: "100%",
                maxWidth: 360,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                py: 1,
              }}
            >
              {stages.map((stage, index) => {
                const numStages = stages.length || 1;
                const maxInset = 42;
                const step = maxInset / numStages;
                const topInset = Math.round(index * step);
                const bottomInset = Math.round((index + 1) * step);
                const isActive = activeFunnelIndex === index;
                const tooltipTextColor = getContrastTextColor(stage.color);

                return (
                  <Tooltip
                    key={stage.id || stage.name || index}
                    open={activeFunnelIndex === index}
                    disableInteractive
                    title={
                      <Box sx={{ py: 0.4, px: 0.9, textAlign: "center" }}>
                        <Typography
                          sx={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: tooltipTextColor,
                            fontFamily: FONT,
                            letterSpacing: "0.2px",
                          }}
                        >
                          {stage.name}:{" "}
                          <span style={{ fontWeight: 800 }}>
                            {stage.count}
                          </span>
                        </Typography>
                      </Box>
                    }
                    arrow
                    placement="right"
                    slotProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: stage.color,
                          color: tooltipTextColor,
                          borderRadius: "8px",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.22)",
                          border: "1px solid rgba(255,255,255,0.25)",
                          "& .MuiTooltip-arrow": {
                            color: stage.color,
                          },
                        },
                      },
                    }}
                  >
                    <Box
                      onMouseEnter={() => setActiveFunnelIndex(index)}
                      onMouseLeave={() => setActiveFunnelIndex(null)}
                      sx={{
                        width: "100%",
                        height: 38,
                        background: stage.color,
                        clipPath: `polygon(${topInset}% 0%, ${100 - topInset}% 0%, ${100 - bottomInset}% 100%, ${bottomInset}% 100%)`,
                        cursor: "pointer",
                        transition: "all 0.25s ease",
                        transform: isActive ? "scaleY(1.08)" : "none",
                        filter: isActive ? "brightness(1.1)" : "none",
                        opacity: activeFunnelIndex !== null && !isActive ? 0.65 : 1,
                        zIndex: isActive ? 2 : 1,
                      }}
                    />
                  </Tooltip>
                );
              })}
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
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={tableBodyCellSx}><Skeleton variant="text" width={85} height={20} animation="wave" /></TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}><Skeleton variant="text" width={35} height={20} animation="wave" sx={{ mx: "auto" }} /></TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}><Skeleton variant="text" width={35} height={20} animation="wave" sx={{ mx: "auto" }} /></TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}><Skeleton variant="text" width={30} height={20} animation="wave" sx={{ mx: "auto" }} /></TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}><Skeleton variant="text" width={25} height={20} animation="wave" sx={{ mx: "auto" }} /></TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}><Skeleton variant="text" width={25} height={20} animation="wave" sx={{ mx: "auto" }} /></TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}><Skeleton variant="text" width={35} height={20} animation="wave" sx={{ mx: "auto" }} /></TableCell>
                  </TableRow>
                ))
              ) : Array.isArray(performanceList) && performanceList.length > 0 ? (
                performanceList.map((row, idx) => (
                  <TableRow
                    key={row.id || idx}
                    sx={{
                      "&:hover": { backgroundColor: "#F8FAFC" },
                      "&:last-child td": { borderBottom: 0 },
                    }}
                  >
                    <TableCell sx={tableBodyCellSx}>{row.telecaller || row.telecaller_name || row.name || "-"}</TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>{row.totalLeads ?? row.total_leads ?? 0}</TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>{row.callsMade ?? row.calls_made ?? 0}</TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>{row.connected ?? row.connected_calls ?? 0}</TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>{row.missedFollowup ?? row.missed_followup ?? 0}</TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>{row.conversion ?? row.converted ?? 0}</TableCell>
                    <TableCell align="center" sx={{ ...tableBodyCellSx, fontWeight: 600 }}>{row.rating || "0%"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "#94A3B8", fontSize: "13px", fontFamily: FONT }}>
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
