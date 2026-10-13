import React from "react";
import { Box, Typography, Avatar } from "@mui/material";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";

// Premium Ribbon Medal SVG with perfectly centered Rank 1 (Matching Figma)
const RibbonMedal = ({ rank = 1 }) => (
  <Box
    sx={{
      position: "relative",
      width: 44,
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <svg width="44" height="56" viewBox="0 0 44 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ribbon Left Tail */}
      <path
        d="M14 28L6 50L18 43L21 50L17 28"
        fill="#CBD5E1"
        stroke="#94A3B8"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Ribbon Right Tail */}
      <path
        d="M30 28L38 50L26 43L23 50L27 28"
        fill="#CBD5E1"
        stroke="#94A3B8"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Ribbon center knot fold */}
      <path
        d="M17 26L22 34L27 26"
        fill="#94A3B8"
      />
      {/* Medal Disc */}
      <circle
        cx="22"
        cy="20"
        r="18"
        fill="#F1F5F9"
        stroke="#94A3B8"
        strokeWidth="2.5"
      />
      {/* Center Rank Number */}
      <text
        x="22"
        y="27"
        textAnchor="middle"
        fill="#475569"
        fontSize="19"
        fontWeight="800"
        fontFamily="sans-serif"
      >
        {rank}
      </text>
    </svg>
  </Box>
);

const TopPerformersCard = ({ data }) => {
  if (!data) return null;

  const performer = data;
  const snapshot = performer.snapshot || {};
  const highlights = performer.highlights || [];

  const scoreNum = Number(performer.score) || 0;
  const isGoodScore = scoreNum >= 70;

  const renderHighlightIcon = (type, color) => {
    switch (type) {
      case "trophy":
        return <EmojiEventsOutlinedIcon sx={{ fontSize: 20, color }} />;
      case "admissions":
        return <WorkspacePremiumOutlinedIcon sx={{ fontSize: 20, color }} />;
      case "discipline":
        return <CheckCircleOutlinedIcon sx={{ fontSize: 20, color }} />;
      case "response":
        return <AccessTimeOutlinedIcon sx={{ fontSize: 20, color }} />;
      default:
        return <EmojiEventsOutlinedIcon sx={{ fontSize: 20, color }} />;
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        boxSizing: "border-box",
        backgroundColor: "#FFFFFF",
        border: "2px solid #84CC16",
        borderRadius: "18px",
        position: "relative",
        pt: { xs: 5, md: 4.2 },
        pb: { xs: 2.5, md: 3 },
        px: { xs: 2, md: 3.2 },
        mt: 3,
        boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
      }}
    >
      {/* Top Performers Green Badge - Seamlessly aligned to top-left border */}
      <Box
        sx={{
          position: "absolute",
          top: -2,
          left: -2,
          backgroundColor: "#84CC16",
          color: "#FFFFFF",
          px: 3.2,
          py: 0.85,
          borderTopLeftRadius: "18px",
          borderBottomRightRadius: "16px",
          fontSize: "13.5px",
          fontWeight: 700,
          letterSpacing: "0.2px",
          display: "flex",
          alignItems: "center",
          lineHeight: 1.2,
          zIndex: 1,
        }}
      >
        Top Performers
      </Box>

      {/* Main 3-Section Layout */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          gap: { xs: 2, md: 2.5 },
          width: "100%",
        }}
      >
        {/* ================= 1. Left Section: Rank 1 Performer Profile ================= */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.6,
            minWidth: { md: "275px" },
            flexShrink: 0,
          }}
        >
          {/* Medal Ribbon */}
          <RibbonMedal rank={performer.rank || 1} />

          {/* Large Round Avatar */}
          <Avatar
            src={performer.avatar}
            alt={performer.name}
            sx={{
              width: 60,
              height: 60,
              backgroundColor: "#E2E8F0",
              border: "1.5px solid #CBD5E1",
              flexShrink: 0,
            }}
          />

          {/* Details */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35, minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1.25,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {performer.name || "-"}
            </Typography>

            {/* Team Pill */}
            {performer.team ? (
              <Box
                sx={{
                  alignSelf: "flex-start",
                  backgroundColor: "#EDE9FE",
                  color: "#6D28D9",
                  border: "1px solid #DDD6FE",
                  px: 1.2,
                  py: 0.25,
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                {performer.team}
              </Box>
            ) : null}

            {/* Score & Rating */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mt: 0.3 }}>
              <Box
                sx={{
                  border: isGoodScore ? "1.5px solid #86EFAC" : "1.5px solid #FCA5A5",
                  backgroundColor: isGoodScore ? "#F0FDF4" : "#FEF2F2",
                  color: isGoodScore ? "#166534" : "#DC2626",
                  px: 0.9,
                  py: 0.2,
                  borderRadius: "5px",
                  fontSize: "14px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1.2,
                  flexShrink: 0,
                }}
              >
                {performer.score}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: isGoodScore ? "#16A34A" : "#DC2626",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                  }}
                >
                  {performer.rating}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "10.5px",
                    color: "#94A3B8",
                    fontWeight: 500,
                    lineHeight: 1.15,
                    whiteSpace: "nowrap",
                  }}
                >
                  Performance Score
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Clear Vertical Divider 1 */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            width: "1.5px",
            height: "112px",
            backgroundColor: "#CBD5E1",
            flexShrink: 0,
          }}
        />

        {/* ================= 2. Center Section: Performance Snapshot (This Month) ================= */}
        <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
          <Typography
            sx={{
              fontSize: "14.5px",
              fontWeight: 700,
              color: "#0F172A",
              mb: 1.2,
              lineHeight: 1.2,
            }}
          >
            Performance Snapshot(This Month)
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(5, 1fr)",
              },
              gap: 1.1,
            }}
          >
            {/* Card 1: Admissions */}
            <Box
              sx={{
                backgroundColor: "#FFFFFF",
                border: "1.2px solid #CBD5E1",
                borderRadius: "12px",
                p: 1.3,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "94px",
                minWidth: 0,
                boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.02)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.6 }}>
                <PersonOutlineOutlinedIcon sx={{ fontSize: 18, color: "#84CC16", flexShrink: 0, mt: "1px" }} />
                <Typography
                  sx={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#1E293B",
                    lineHeight: 1.2,
                  }}
                >
                  Admissions
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", mt: 0.4, lineHeight: 1.1 }}>
                {snapshot.admissions ?? "-"}
              </Typography>
            </Box>

            {/* Card 2: Conversion Rate */}
            <Box
              sx={{
                backgroundColor: "#FFFFFF",
                border: "1.2px solid #CBD5E1",
                borderRadius: "12px",
                p: 1.3,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "94px",
                minWidth: 0,
                boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.02)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.6 }}>
                 <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: "#22C55E", flexShrink: 0, mt: "1px" }} />
                <Typography
                  sx={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    color: "#1E293B",
                    lineHeight: 1.2,
                  }}
                >
                  Conversion Rate
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "21px", fontWeight: 700, color: "#16A34A", mt: 0.4, lineHeight: 1.1 }}>
                {snapshot.conversionRate ?? "-"}
              </Typography>
            </Box>

            {/* Card 3: Follow-Up Completion */}
            <Box
              sx={{
                backgroundColor: "#FFFFFF",
                border: "1.2px solid #CBD5E1",
                borderRadius: "12px",
                p: 1.3,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "94px",
                minWidth: 0,
                boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.02)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.6 }}>
                <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: "#2563EB", flexShrink: 0, mt: "1px" }} />
                <Typography
                  sx={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    color: "#1E293B",
                    lineHeight: 1.2,
                  }}
                >
                  Follow-Up Completion
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "21px", fontWeight: 700, color: "#2563EB", mt: 0.4, lineHeight: 1.1 }}>
                {snapshot.followUpCompletion ?? "-"}
              </Typography>
            </Box>

            {/* Card 4: Pending Follow-Ups */}
            <Box
              sx={{
                backgroundColor: "#FFFFFF",
                border: "1.2px solid #CBD5E1",
                borderRadius: "12px",
                p: 1.3,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "94px",
                minWidth: 0,
                boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.02)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.6 }}>
                <TimerOutlinedIcon sx={{ fontSize: 16, color: "#EF4444", flexShrink: 0, mt: "1px" }} />
                <Typography
                  sx={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    color: "#1E293B",
                    lineHeight: 1.2,
                  }}
                >
                  Pending Follow-Ups
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "24px", fontWeight: 700, color: "#DC2626", mt: 0.4, lineHeight: 1.1 }}>
                {snapshot.pendingFollowUps ?? "-"}
              </Typography>
            </Box>

            {/* Card 5: Average Response Time */}
            <Box
              sx={{
                backgroundColor: "#FFFFFF",
                border: "1.2px solid #CBD5E1",
                borderRadius: "12px",
                p: 1.3,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "94px",
                minWidth: 0,
                boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.02)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.6 }}>
                <AccessTimeOutlinedIcon sx={{ fontSize: 16, color: "#9333EA", flexShrink: 0, mt: "1px" }} />
                <Typography
                  sx={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    color: "#1E293B",
                    lineHeight: 1.2,
                  }}
                >
                  Average Response Time
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#7E22CE", mt: 0.4, lineHeight: 1.1 }}>
                {snapshot.avgResponseTime ?? "-"}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Clear Vertical Divider 2 */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            width: "1.5px",
            height: "112px",
            backgroundColor: "#CBD5E1",
            flexShrink: 0,
          }}
        />

        {/* ================= 3. Right Section: Key Highlights ================= */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.3,
            width: { xs: "100%", md: "220px" },
            flexShrink: 0,
          }}
        >
          {highlights.map((item) => (
            <Box key={item.id} sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  backgroundColor: item.bg,
                  border: `1px solid ${item.color}25`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {renderHighlightIcon(item.iconType, item.color)}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#1E293B",
                    lineHeight: 1.25,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "10.5px",
                    color: "#64748B",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.subtitle}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default TopPerformersCard;
