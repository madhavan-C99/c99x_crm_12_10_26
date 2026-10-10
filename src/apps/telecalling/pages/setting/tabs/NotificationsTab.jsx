import React from "react";
import { Grid } from "@mui/material";
import NotificationsCard from "../../../components/settings/notifications/NotificationsCard";
import CallingCard from "../../../components/settings/notifications/CallingCard";

export default function NotificationsTab() {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}><NotificationsCard /></Grid>
      <Grid size={{ xs: 12, md: 6 }}><CallingCard /></Grid>
    </Grid>
  );
}
