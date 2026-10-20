import React from "react";
import { Box, Typography } from "@mui/material";
import Table from "@/shared/components/table/Table";

const PerformanceTable = ({
  tableData = [],
  loading = false,
}) => {
  const getTeamStyle = (teamName = "", badgeColor = "") => {
    if (badgeColor) {
      return {
        backgroundColor: badgeColor,
        color: "#334155",
        border: "1px solid #E2E8F0",
      };
    }
    const t = String(teamName).toLowerCase();
    if (t.includes("alpha")) {
      return { backgroundColor: "#E0F2FE", color: "#0284C7", border: "1px solid #BAE6FD" };
    }
    if (t.includes("beta")) {
      return { backgroundColor: "#FFEDD5", color: "#EA580C", border: "1px solid #FED7AA" };
    }
    if (t.includes("gamma")) {
      return { backgroundColor: "#FCE7F3", color: "#DB2777", border: "1px solid #FBCFE8" };
    }
    return { backgroundColor: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" };
  };

  const getPerformanceBadgeStyle = (scoreValue) => {
    const score = Number(scoreValue) || 0;
    if (score >= 70) {
      return {
        border: "1px solid #86EFAC",
        backgroundColor: "#DCFCE7",
        color: "#166534",
      };
    }
    if (score >= 50) {
      return {
        border: "1px solid #FED7AA",
        backgroundColor: "#FFEDD5",
        color: "#C2410C",
      };
    }
    // Below 50 -> Red Color
    return {
      border: "1px solid #FECACA",
      backgroundColor: "#FEE2E2",
      color: "#DC2626",
    };
  };

  const columns = [
    {
      field: "rank",
      headerName: "Rank",
      minWidth: 70,
      renderCell: (row, index) => (
        <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#334155" }}>
          {row?.rank ?? index + 1}
        </Typography>
      ),
    },
    {
      field: "telecaller",
      headerName: "Telecaller",
      minWidth: 140,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", fontWeight: 500, color: "#334155" }}>
          {row?.telecaller || row?.telecaller_name || row?.name || "-"}
        </Typography>
      ),
    },
    {
      field: "team",
      headerName: "Team",
      minWidth: 150,
      renderCell: (row) => {
        const teamName = row?.team || row?.team_name || "-";
        const style = getTeamStyle(teamName, row?.team_badge_color);
        return (
          <Box
            sx={{
              px: 1.5,
              py: 0.3,
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              ...style,
            }}
          >
            {teamName}
          </Box>
        );
      },
    },
    {
      field: "leads_assigned",
      headerName: "Leads Assigned",
      minWidth: 140,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", fontWeight: 500, color: "#334155" }}>
          {row?.leads_assigned ?? 0}
        </Typography>
      ),
    },
    {
      field: "calls_made",
      headerName: "Calls Made",
      minWidth: 130,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", fontWeight: 500, color: "#334155" }}>
          {row?.calls_made ?? 0}
        </Typography>
      ),
    },
    {
      field: "followups_done",
      headerName: "Follow-Ups Done",
      minWidth: 150,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", fontWeight: 500, color: "#334155" }}>
          {row?.followups_done ?? 0}
        </Typography>
      ),
    },
    {
      field: "admissions",
      headerName: "Admissions",
      minWidth: 120,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", fontWeight: 500, color: "#334155" }}>
          {row?.admissions ?? 0}
        </Typography>
      ),
    },
    {
      field: "pending_followups",
      headerName: "Pending Follow- Ups",
      minWidth: 160,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#DC2626" }}>
          {row?.pending_followups ?? 0}
        </Typography>
      ),
    },
    {
      field: "performance_score",
      headerName: "Performance Score",
      minWidth: 180,
      renderCell: (row) => {
        const score = row?.score ?? row?.performance_score ?? 0;
        const rating = row?.rating || row?.rating_label || (Number(score) >= 70 ? "Good" : Number(score) >= 50 ? "Average" : "Needs Improvement");
        const badgeStyle = getPerformanceBadgeStyle(score);
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                px: 1,
                py: 0.2,
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 700,
                ...badgeStyle,
              }}
            >
              {score}
            </Box>
            <Typography sx={{ fontSize: "14px", fontWeight: 600, color: badgeStyle.color }}>
              {rating}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "avg_calling_time",
      headerName: "Avg Calling Time",
      minWidth: 160,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", fontWeight: 500, color: "#475569" }}>
          {row?.avg_calling_time || row?.avg_calling_duration || "00:00:00"}
        </Typography>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      rows={Array.isArray(tableData) ? tableData : []}
      loading={loading}
      minWidth={1400}
      maxHeight={600}
      sx={{ mt: 2 }}
      getRowId={(row, index) => row?.id || row?.telecaller_id || index}
    />
  );
};

export default PerformanceTable;
