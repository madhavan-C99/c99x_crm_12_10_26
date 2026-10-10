import React, { useState } from "react";
import { Box, Tab, Tabs, ThemeProvider, Typography } from "@mui/material";
import { theme, LIME, LINE, LIME_DARK } from "./theme";
import ProfileTab from "./tabs/ProfileTab";
import HelpTab from "./tabs/HelpTab";
import SecurityTab from "./tabs/SecurityTab";
import NotificationsTab from "./tabs/NotificationsTab";

const TABS = [
  { label: "My Profile", Component: ProfileTab },
  { label: "Help & Support", Component: HelpTab },
  { label: "Account & Security", Component: SecurityTab },
  { label: "Notifications & Calling", Component: NotificationsTab },
];

export default function SettingsPage() {
  const [tab, setTab] = useState(0);
  const { Component } = TABS[tab];

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh", p: { xs: 2, md: 4 } }}>
        <Typography variant="h5" fontWeight={800}>Settings</Typography>
        <Typography color="text.secondary" mb={2}>Manage your personal information and preferences</Typography>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          TabIndicatorProps={{ style: { backgroundColor: LIME, height: 3 } }}
          sx={{ mb: 3, borderBottom: `1px solid ${LINE}`, "& .Mui-selected": { color: `${LIME_DARK} !important` } }}>
          {TABS.map((t) => <Tab key={t.label} label={t.label} sx={{ fontWeight: 600 }} />)}
        </Tabs>

        <Component />
      </Box>
    </ThemeProvider>
  );
}
