import React from "react";
import { Box, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

// Settings Tabs List
export const SETTINGS_TABS = [
  { id: "users", label: "Users Management" },
  { id: "organization", label: "Organization" },
  { id: "pipeline", label: "Pipeline" },
  { id: "teams", label: "Teams" },
  { id: "roles", label: "Roles & Permissions" },
  { id: "target", label: "Monthly Target" },
  { id: "course_mgmt", label: "Course Management" },
];

export default function SettingsTabs({ activeTab = "users", onTabChange }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2.5,
        borderBottom: "1px solid #E2E8F0",
        pb: 1,
        mb: 3,
        overflowX: "auto",
        whiteSpace: "nowrap",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {/* Left Chevron Arrow Icon */}
      {/* <ChevronLeftIcon
        sx={{ color: "#94A3B8", fontSize: 20, cursor: "pointer" ,mb:0.9, }}
      /> */}

      {/* Tabs List */}
      {SETTINGS_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Box
            key={tab.id}
            onClick={() => onTabChange && onTabChange(tab.id)}
            sx={{
              position: "relative",
              cursor: "pointer",
              pb: 0.8,
              transition: "all 0.2s ease",
            }}
          >
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#84CC16" : "#64748B",
                transition: "color 0.2s ease",
                "&:hover": {
                  color: "#84CC16",
                },
              }}
            >
              {tab.label}
            </Typography>

            {/* Active Tab Green Bottom Line */}
            {isActive && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: -8,
                  left: 0,
                  right: 0,
                  height: "2.5px",
                  backgroundColor: "#84CC16",
                  borderRadius: "2px",
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
