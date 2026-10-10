import React from "react";
import { Avatar, Box, Chip, Grid, Stack, TextField, Typography } from "@mui/material";
import WorkOutlinedIcon from "@mui/icons-material/WorkOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import Panel from "../../../components/settings/components/Panel";
import { LIME } from "../theme";

const fields = [
  ["Full Name*", "Priya Sharma"], ["Email Id*", "priyasharma@gmail.com"],
  ["Mobile No*", "+91 9876543210"], ["Branch", "Phase 3"],
  ["Role*", "Senior Telecaller"], ["Joined Date", "15/09/2024"],
  ["Employee ID*", "C99-BAE-003"], ["Reporting To*", "Gunal Raj"],
];

export default function ProfileTab() {
  return (
    <Stack spacing={3}>
      <Panel>
        <Stack direction="row" spacing={3} alignItems="center">
          <Avatar sx={{ width: 96, height: 96, bgcolor: LIME, color: "#fff", fontSize: 34, fontWeight: 700 }}>PS</Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>Priya Sharma</Typography>
            <Typography color="text.secondary" mb={1.5}>Senior Telecaller</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip icon={<WorkOutlinedIcon />} label="Sales" size="small" />
              <Chip icon={<PlaceOutlinedIcon />} label="Phase 2" size="small" />
              <Chip icon={<CalendarTodayOutlinedIcon />} label="15 August, 2024" size="small" />
            </Stack>
          </Box>
        </Stack>
      </Panel>

      <Panel>
        <Typography fontWeight={700} fontSize={16}>Personal Information</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Your contact details and personal info</Typography>
        <Grid container spacing={3}>
          {fields.map(([label, value]) => (
            <Grid size={{ xs: 12, md: 6 }} key={label}>
              <Typography variant="body2" fontWeight={600} mb={0.75}>{label}</Typography>
              <TextField fullWidth size="small" value={value} disabled
                sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#F3F4F6" }, "& fieldset": { border: "none" } }} />
            </Grid>
          ))}
        </Grid>
      </Panel>
    </Stack>
  );
}
