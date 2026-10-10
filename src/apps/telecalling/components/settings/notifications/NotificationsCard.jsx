// import React, { useState } from "react";
// import { Box, Checkbox, Divider, FormControlLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
// import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
// import Panel from "../components/Panel";
// import PanelHeader from "../components/PanelHeader";
// import SettingRow from "../components/SettingRow";

// export const selectSx = { minWidth: 170, bgcolor: "#F3F4F6", "& fieldset": { border: "none" } };

// export default function NotificationsCard() {
//   const [reminders, setReminders] = useState(true);
//   const [sound, setSound] = useState(true);
//   const [time, setTime] = useState("10");
//   const [notify, setNotify] = useState({ newLead: true, missed: true, reassigned: true });
//   const toggle = (k) => (e) => setNotify({ ...notify, [k]: e.target.checked });

//   return (
//     <Panel sx={{ height: "100%" }}>
//       <PanelHeader icon={<NotificationsActiveOutlinedIcon />} title="Notifications" subtitle="Control how you receive alerts" />
//       <Divider />
//       <SettingRow title="Follow-up reminders" desc="Get a nudge before every scheduled follow-up"
//         checked={reminders} onChange={setReminders} />
//       <Divider />
//       <SettingRow title="Reminder time" desc="How early should we remind you?">
//         <Select size="small" value={time} onChange={(e) => setTime(e.target.value)} sx={selectSx} disabled={!reminders}>
//           <MenuItem value="5">5 minutes before</MenuItem>
//           <MenuItem value="10">10 minutes before</MenuItem>
//           <MenuItem value="15">15 minutes before</MenuItem>
//           <MenuItem value="30">30 minutes before</MenuItem>
//         </Select>
//       </SettingRow>
//       <Divider />
//       <SettingRow title="Sound alerts" desc="Play a sound when a new alert arrives" checked={sound} onChange={setSound} />
//       <Divider />
//       <Box pt={2}>
//         <Typography fontWeight={600} fontSize={14} mb={0.5}>Notify me about</Typography>
//         <Stack>
//           <FormControlLabel control={<Checkbox checked={notify.newLead} onChange={toggle("newLead")} />} label="New lead assigned" />
//           <FormControlLabel control={<Checkbox checked={notify.missed} onChange={toggle("missed")} />} label="Missed follow-ups" />
//           <FormControlLabel control={<Checkbox checked={notify.reassigned} onChange={toggle("reassigned")} />} label="Reassigned leads" />
//         </Stack>
//       </Box>
//     </Panel>
//   );
// }




import React, { useState } from "react";

import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";

import Panel from "../components/Panel";
import PanelHeader from "../components/PanelHeader";
import SettingRow from "../components/SettingRow";

export const selectSx = {
  minWidth: { xs: 145, sm: 175 },
  height: 38,
  borderRadius: "9px",
  bgcolor: "#F8FAFC",
  fontSize: "13px",
  color: "#334155",

  "& .MuiSelect-select": {
    py: 1,
    px: 1.5,
  },

  "& fieldset": {
    border: "1px solid #E2E8F0",
  },

  "&:hover fieldset": {
    borderColor: "#CBD5E1",
  },

  "&.Mui-focused fieldset": {
    borderColor: "#64748B",
  },
};

const checkboxSx = {
  color: "#94A3B8",
  p: 0.75,
  mr: 0.5,

  "&.Mui-checked": {
    color: "#2563EB",
  },

  "& .MuiSvgIcon-root": {
    fontSize: 20,
  },
};

const labelSx = {
  m: 0,
  minHeight: 34,
  alignItems: "center",

  "& .MuiFormControlLabel-label": {
    fontSize: "13px",
    fontWeight: 400,
    color: "#475569",
    lineHeight: 1.5,
  },
};

const dividerSx = {
  borderColor: "#EEF2F6",
};

export default function NotificationsCard() {
  const [reminders, setReminders] = useState(true);
  const [sound, setSound] = useState(true);
  const [time, setTime] = useState("10");

  const [notify, setNotify] = useState({
    newLead: true,
    missed: true,
    reassigned: true,
  });

  const toggle = (key) => (event) => {
    setNotify((prev) => ({
      ...prev,
      [key]: event.target.checked,
    }));
  };

  return (
    <Panel
      sx={{
        height: "100%",
        p: { xs: 2, sm: 2.5, md: 3 },
        borderRadius: "14px",
        border: "1px solid #E8EDF3",
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.035)",
        bgcolor: "#FFFFFF",
      }}
    >
      <PanelHeader
        icon={<NotificationsActiveOutlinedIcon />}
        title="Notifications"
        subtitle="Control how you receive alerts"
      />

      <Divider sx={{ ...dividerSx, my: 2 }} />

      <SettingRow
        title="Follow-up reminders"
        desc="Get a nudge before every scheduled follow-up"
        checked={reminders}
        onChange={setReminders}
      />

      <Divider sx={{ ...dividerSx, my: 1.5 }} />

      <SettingRow
        title="Reminder time"
        desc="How early should we remind you?"
      >
        <Select
          size="small"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          sx={selectSx}
          disabled={!reminders}
        >
          <MenuItem value="5" sx={{ fontSize: 13 }}>
            5 minutes before
          </MenuItem>
          <MenuItem value="10" sx={{ fontSize: 13 }}>
            10 minutes before
          </MenuItem>
          <MenuItem value="15" sx={{ fontSize: 13 }}>
            15 minutes before
          </MenuItem>
          <MenuItem value="30" sx={{ fontSize: 13 }}>
            30 minutes before
          </MenuItem>
        </Select>
      </SettingRow>

      <Divider sx={{ ...dividerSx, my: 1.5 }} />

      <SettingRow
        title="Sound alerts"
        desc="Play a sound when a new alert arrives"
        checked={sound}
        onChange={setSound}
      />

      <Divider sx={{ ...dividerSx, my: 2 }} />

      <Box>
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: "#1E293B",
            mb: 0.5,
            lineHeight: 1.5,
          }}
        >
          Notify me about
        </Typography>

        <Typography
          sx={{
            fontSize: 12,
            color: "#94A3B8",
            mb: 1.25,
            lineHeight: 1.5,
          }}
        >
          Choose which events you want to be notified about.
        </Typography>

        <Stack spacing={0.5}>
          <FormControlLabel
            sx={labelSx}
            control={
              <Checkbox
                checked={notify.newLead}
                onChange={toggle("newLead")}
                sx={checkboxSx}
              />
            }
            label="New lead assigned"
          />

          <FormControlLabel
            sx={labelSx}
            control={
              <Checkbox
                checked={notify.missed}
                onChange={toggle("missed")}
                sx={checkboxSx}
              />
            }
            label="Missed follow-ups"
          />

          <FormControlLabel
            sx={labelSx}
            control={
              <Checkbox
                checked={notify.reassigned}
                onChange={toggle("reassigned")}
                sx={checkboxSx}
              />
            }
            label="Reassigned leads"
          />
        </Stack>
      </Box>
    </Panel>
  );
}
