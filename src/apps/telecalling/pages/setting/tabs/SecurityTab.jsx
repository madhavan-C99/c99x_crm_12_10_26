import React from "react";
import { Grid, Stack } from "@mui/material";
import PasswordCard from "../../../components/settings/security/PasswordCard";
import SecurityAlertsCard from "../../../components/settings/security/SecurityAlertsCard";
import ActiveSessions from "../../../components/settings/security/ActiveSessions";

export default function SecurityTab() {
  return (
    <Stack spacing={3}>
      {/* <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}><PasswordCard /></Grid>
        <Grid size={{ xs: 12, md: 6 }}><SecurityAlertsCard /></Grid>
      </Grid> */}
      <ActiveSessions />
    </Stack>
  );
}
