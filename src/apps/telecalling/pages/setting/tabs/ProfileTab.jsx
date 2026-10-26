// import React from "react";
// import { Avatar, Box, Chip, Grid, Stack, TextField, Typography } from "@mui/material";
// import WorkOutlinedIcon from "@mui/icons-material/WorkOutlined";
// import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
// import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
// import Panel from "../../../components/settings/components/Panel";
// import { LIME } from "../theme";

// const fields = [
//   ["Full Name*", "Priya Sharma"], ["Email Id*", "priyasharma@gmail.com"],
//   ["Mobile No*", "+91 9876543210"], ["Branch", "Phase 3"],
//   ["Role*", "Senior Telecaller"], ["Joined Date", "15/09/2024"],
//   ["Employee ID*", "C99-BAE-003"], ["Reporting To*", "Gunal Raj"],
// ];

// export default function ProfileTab() {
//   return (
//     <Stack spacing={3}>
//       <Panel>
//         <Stack direction="row" spacing={3} alignItems="center">
//           <Avatar sx={{ width: 96, height: 96, bgcolor: LIME, color: "#fff", fontSize: 34, fontWeight: 700 }}>PS</Avatar>
//           <Box>
//             <Typography variant="h6" fontWeight={700}>Priya Sharma</Typography>
//             <Typography color="text.secondary" mb={1.5}>Senior Telecaller</Typography>
//             <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
//               <Chip icon={<WorkOutlinedIcon />} label="Sales" size="small" />
//               <Chip icon={<PlaceOutlinedIcon />} label="Phase 2" size="small" />
//               <Chip icon={<CalendarTodayOutlinedIcon />} label="15 August, 2024" size="small" />
//             </Stack>
//           </Box>
//         </Stack>
//       </Panel>

//       <Panel>
//         <Typography fontWeight={700} fontSize={16}>Personal Information</Typography>
//         <Typography variant="body2" color="text.secondary" mb={3}>Your contact details and personal info</Typography>
//         <Grid container spacing={3}>
//           {fields.map(([label, value]) => (
//             <Grid size={{ xs: 12, md: 6 }} key={label}>
//               <Typography variant="body2" fontWeight={600} mb={0.75}>{label}</Typography>
//               <TextField fullWidth size="small" value={value} disabled
//                 sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#F3F4F6" }, "& fieldset": { border: "none" } }} />
//             </Grid>
//           ))}
//         </Grid>
//       </Panel>
//     </Stack>
//   );
// }


import React, { useEffect, useState } from "react";

import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import WorkOutlinedIcon from "@mui/icons-material/WorkOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";

import dayjs from "dayjs";

import Panel from "../../../components/settings/components/Panel";
import { LIME } from "../theme";
import { getTelecallingUserProfile } from "@/apps/telecalling/services/profileService";

const chipSx = {
  height: 30,
  borderRadius: "8px",
  bgcolor: "#F8FAFC",
  border: "1px solid #E8EDF3",
  color: "#475569",
  fontSize: 12,
  fontWeight: 500,

  "& .MuiChip-icon": {
    color: "#64748B",
    fontSize: 16,
    ml: 1,
  },

  "& .MuiChip-label": {
    px: 1,
  },
};

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    height: 42,
    borderRadius: "9px",
    bgcolor: "#F8FAFC",

    "& fieldset": {
      borderColor: "#E8EDF3",
    },

    "&:hover fieldset": {
      borderColor: "#CBD5E1",
    },

    "&.Mui-disabled": {
      bgcolor: "#F8FAFC",
    },
  },

  "& .MuiInputBase-input": {
    fontSize: 13,
    fontWeight: 500,
    color: "#334155",
    py: 1.25,
  },

  "& .MuiInputBase-input.Mui-disabled": {
    WebkitTextFillColor: "#475569",
    opacity: 1,
  },
};

// value illa na "-" kaattum
const show = (value) =>
  value === null || value === undefined || String(value).trim() === ""
    ? "-"
    : String(value).trim();

const formatDate = (value, format) =>
  value && dayjs(value).isValid() ? dayjs(value).format(format) : "-";

const capitalize = (value) =>
  value ? String(value).charAt(0).toUpperCase() + String(value).slice(1) : "";

const getInitials = (name) => {
  const text = String(name || "").trim();
  if (!text) return "-";
  const parts = text.split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

export default function ProfileTab() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getTelecallingUserProfile();

        // { data: { status, message, data: {...} } } - rendu shape-um handle
        const user =
          response?.data?.data?.data || response?.data?.data || null;

        setProfile(user);
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Typography sx={{ py: 6, textAlign: "center", color: "#DC2626" }}>
        {error || "Profile not found"}
      </Typography>
    );
  }

  const fullName = String(profile.full_name || "").trim();
  const role = capitalize(profile.role);
  const team = profile.team;

  const fields = [
    ["Full Name*", fullName],
    ["Email Id*", profile.email],
    ["Mobile No*", profile.mobile],
    ["Team", team],
    ["Role*", role],
    ["Joined Date", formatDate(profile.joining_date, "DD/MM/YYYY")],
    ["Employee ID*", profile.employee_id],
    ["Reporting To*", profile.reporting_to],
  ];

  return (
    <Stack spacing={2.5} sx={{ width: "100%", minWidth: 0 }}>
      {/* Profile Header */}
      <Panel
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          borderRadius: "14px",
          border: "1px solid #E8EDF3",
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.035)",
          bgcolor: "#FFFFFF",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 2, sm: 2.5, md: 3 }}
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Avatar
            src={profile.user_profile || undefined}
            sx={{
              width: { xs: 72, sm: 84, md: 92 },
              height: { xs: 72, sm: 84, md: 92 },
              flexShrink: 0,
              bgcolor: LIME,
              color: "#FFFFFF",
              fontSize: { xs: 25, sm: 29, md: 32 },
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            {getInitials(fullName)}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
            <Typography
              sx={{
                fontSize: { xs: 18, sm: 20 },
                fontWeight: 700,
                color: "#1E293B",
                lineHeight: 1.4,
              }}
            >
              {show(fullName)}
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                mb: 1.75,
                fontSize: 13,
                color: "#64748B",
                lineHeight: 1.5,
              }}
            >
              {show(role)}
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              alignItems="center"
            >
              {team && (
                <Chip
                  icon={<WorkOutlinedIcon />}
                  label={team}
                  size="small"
                  sx={chipSx}
                />
              )}

              {profile.joining_date && (
                <Chip
                  icon={<CalendarTodayOutlinedIcon />}
                  label={formatDate(profile.joining_date, "DD MMMM, YYYY")}
                  size="small"
                  sx={chipSx}
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Panel>

      {/* Personal Information */}
      <Panel
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          borderRadius: "14px",
          border: "1px solid #E8EDF3",
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.035)",
          bgcolor: "#FFFFFF",
        }}
      >
        <Box sx={{ mb: 2.5 }}>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              color: "#1E293B",
              lineHeight: 1.5,
            }}
          >
            Personal Information
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              fontSize: 12.5,
              color: "#64748B",
              lineHeight: 1.6,
            }}
          >
            Your contact details and personal info
          </Typography>
        </Box>

        <Grid container columnSpacing={2.5} rowSpacing={2.25}>
          {fields.map(([label, value]) => (
            <Grid size={{ xs: 12, sm: 6 }} key={label}>
              <Stack spacing={0.75}>
                <Typography
                  sx={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "#475569",
                    lineHeight: 1.5,
                  }}
                >
                  {label}
                </Typography>

                <TextField
                  fullWidth
                  size="small"
                  value={show(value)}
                  disabled
                  variant="outlined"
                  sx={textFieldSx}
                />
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Panel>
    </Stack>
  );
}