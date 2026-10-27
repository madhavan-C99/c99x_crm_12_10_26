import React from "react";
import { Box, Typography } from "@mui/material";
import { useAuth } from "@/shared/context/AuthContext";

// Settings Tabs List with associated permissions
export const SETTINGS_TABS = [
  {
    id: "users",
    label: "Users Management",
    permission: "api_fetch_all_users_admin",
  },
  {
    id: "organization",
    label: "Organization",
    permission: "api_get_organization_profile_admin",
  },
  {
    id: "pipeline",
    label: "Pipeline",
    permission: "api_fetch_loss_reasons_admin",
  },
  { id: "teams", label: "Teams", permission: "api_fetch_all_teams_admin" },
  {
    id: "roles",
    label: "Roles & Permissions",
    permission: "api_get_roles_and_permissions",
  },
  {
    id: "target",
    label: "Monthly Target",
    permission: "api_fetch_monthly_target_admin",
  },
  {
    id: "course_mgmt",
    label: "Course Management",
    permission: "api_add_course",
  },
  {
    id: "integrations",
    label: "Integrations",
  },
];

export default function SettingsTabs({ activeTab = "users", onTabChange }) {
  const { hasPermission } = useAuth();

  const visibleTabs = SETTINGS_TABS.filter(
    (tab) => !tab.permission || hasPermission(tab.permission),
  );

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
      {/* Tabs List */}
      {visibleTabs.map((tab) => {
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
