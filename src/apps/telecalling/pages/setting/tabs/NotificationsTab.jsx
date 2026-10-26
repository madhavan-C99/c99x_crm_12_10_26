import React, { useEffect, useState } from "react";
import { Grid, CircularProgress, Alert } from "@mui/material";
import NotificationsCard from "../../../components/settings/notifications/NotificationsCard";
import CallingCard from "../../../components/settings/notifications/CallingCard";
import {
  getAllSettings,
  updateNotificationSettings,
} from '@/apps/telecalling/services/settingService';

export default function NotificationsTab() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getAllSettings();
        setSettings(data);
      } catch (err) {
        setError("Settings load aagala");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (payload) => {
    try {
      const updated = await updateNotificationSettings(payload);
      // backend updated data return pannina adhai use pannunga, illana local merge pannunga
      setSettings((prev) => ({ ...prev, ...(updated || payload) }));
      return true;
    } catch (err) {
      return false;
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <NotificationsCard
          data={settings?.notifications}
          onSave={handleSave}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <CallingCard
          data={settings?.calling}
          onSave={handleSave}
        />
      </Grid>
    </Grid>
  );
}