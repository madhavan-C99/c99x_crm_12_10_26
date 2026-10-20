import React from "react";
import { Box, Typography, Avatar } from "@mui/material";

// Ribbon Medal SVG component for Rank 2 & 3, and Rank 4 badge
const PerformerRankBadge = ({ rank = 2 }) => {
  if (rank === 4) {
    return (
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          backgroundColor: "#94A3B8",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        4
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: 28,
        height: 38,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width="28" height="38" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 28L6 44L18 38L20 44L14 28" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.2" />
        <path d="M24 28L30 44L18 38L16 44L22 28" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.2" />
        <circle cx="18" cy="18" r="14" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" />
        <text
          x="18"
          y="23.5"
          textAnchor="middle"
          fill="#475569"
          fontSize="14"
          fontWeight="800"
          fontFamily="sans-serif"
        >
          {rank}
        </text>
      </svg>
    </Box>
  );
};

const OtherTopPerformers = ({ performers }) => {
  if (!Array.isArray(performers) || performers.length === 0) return null;

  const dataList = performers;

  const getTeamBadgeStyle = (teamType) => {
    if (teamType === "premium") {
      return {
        backgroundColor: "#EDE9FE",
        color: "#6D28D9",
        border: "1px solid #DDD6FE",
      };
    }
    return {
      backgroundColor: "#E0F2FE",
      color: "#0284C7",
      border: "1px solid #BAE6FD",
    };
  };

  return (
    /* Outer Box Container enclosing Header, Cards, and Footer */
    <Box
      sx={{
        backgroundColor: "#FFFFFF",
        border: "1.5px solid #CBD5E1",
        borderRadius: "16px",
        p: { xs: 2.5, md: 3 },
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)",
        width: "100%",
        boxSizing: "border-box",
        mt: 3,
      }}
    >
      {/* 1. Section Header inside Box */}
      <Typography
        sx={{
          fontSize: "16px",
          fontWeight: 700,
          color: "#0F172A",
          mb: 2,
        }}
      >
        Other Top Performers
      </Typography>

      {/* 2. 3 Performer Cards Grid inside Box */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          },
          gap: 2,
        }}
      >
        {dataList.map((item) => {
          const teamStyle = getTeamBadgeStyle(item.teamType);

          return (
            <Box
              key={item.id || item.rank}
              sx={{
                backgroundColor: item.cardBg || "#FFFFFF",
                border: `1.5px solid ${item.borderColor || "#CBD5E1"}`,
                borderRadius: "12px",
                p: 2,
                boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.03)",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.06)",
                },
              }}
            >
              {/* Top Header Row: Rank Medal, Avatar, Name, Team Pill, Conversion Rate */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                {/* Left info */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <PerformerRankBadge rank={item.rank} />

                  <Avatar
                    src={item.avatar}
                    alt={item.name}
                    sx={{
                      width: 44,
                      height: 44,
                      backgroundColor: "#E2E8F0",
                      border: "1.5px solid #CBD5E1",
                    }}
                  />

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
                    <Typography
                      sx={{
                        fontSize: "14.5px",
                        fontWeight: 700,
                        color: "#0F172A",
                        lineHeight: 1.2,
                      }}
                    >
                      {item.name}
                    </Typography>

                    <Box
                      sx={{
                        alignSelf: "flex-start",
                        px: 1,
                        py: 0.15,
                        borderRadius: "8px",
                        fontSize: "10.5px",
                        fontWeight: 600,
                        ...teamStyle,
                      }}
                    >
                      {item.team}
                    </Box>
                  </Box>
                </Box>

                {/* Right: Conversion Rate */}
                <Box sx={{ textAlign: "right" }}>
                  <Typography
                    sx={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: item.conversionColor || "#16A34A",
                      lineHeight: 1.2,
                    }}
                  >
                    {item.conversionRate}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "11px",
                      color: "#64748B",
                      fontWeight: 500,
                      lineHeight: 1.2,
                    }}
                  >
                    Conversion Rate
                  </Typography>
                </Box>
              </Box>

              {/* Clear Horizontal Divider */}
              <Box
                sx={{
                  width: "100%",
                  height: "1.2px",
                  backgroundColor: item.dividerColor || "#CBD5E1",
                  my: 1.8,
                }}
              />

              {/* Bottom Row: 3 Metrics Columns */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr auto 1.3fr",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                {/* 1. Admissions */}
                <Box>
                  <Typography sx={{ fontSize: "11px", color: "#64748B", fontWeight: 500, mb: 0.2 }}>
                    Admissions
                  </Typography>
                  <Typography sx={{ fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
                    {item.admissions}
                  </Typography>
                </Box>

                {/* Clear Vertical Separator 1 */}
                <Box sx={{ width: "1.5px", height: "28px", backgroundColor: item.dividerColor || "#CBD5E1", borderRadius: "1px" }} />

                {/* 2. Performance Score */}
                <Box>
                  <Typography sx={{ fontSize: "11px", color: "#64748B", fontWeight: 500, mb: 0.2 }}>
                    Performance Score
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: item.scoreColor || "#16A34A",
                    }}
                  >
                    {item.performanceScore}
                  </Typography>
                </Box>

                {/* Clear Vertical Separator 2 */}
                <Box sx={{ width: "1.5px", height: "28px", backgroundColor: item.dividerColor || "#CBD5E1", borderRadius: "1px" }} />

                {/* 3. Highlight */}
                <Box>
                  <Typography sx={{ fontSize: "11px", color: "#64748B", fontWeight: 500, mb: 0.2 }}>
                    Highlight
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#2563EB",
                      lineHeight: 1.2,
                    }}
                  >
                    {item.highlight}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* 3. Footer Caption inside Box */}
      <Typography
        sx={{
          textAlign: "center",
          fontSize: "13px",
          color: "#0F172A",
          fontWeight: 500,
          lineHeight: 1.4,
          mt: 2.5,
        }}
      >
        Showing top 3 performers excluding top performer(Rank 1)
      </Typography>
    </Box>
  );
};

export default OtherTopPerformers;
