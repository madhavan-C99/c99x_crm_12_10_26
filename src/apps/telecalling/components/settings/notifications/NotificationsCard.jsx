// useRef add
import React, { useEffect, useRef, useState } from "react";
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

import {
  getAllSettings,
  updateNotificationSettings,

} from "@/apps/telecalling/services/settingService";
import {
  setSoundEnabled,
  playNotificationSound,
} from "@/shared/utils/notificationSound";

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

  "&.Mui-disabled.Mui-checked": {
    color: "#2563EB",
    opacity: 0.6,
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

const lockedSx = {
  pointerEvents: "none",
  opacity: 0.6,
};

const REMINDER_OPTIONS = ["0","5", "10", "15", "30"];

// Edhu shape vandhaalum (array / nested / interceptor), "reminder_time"
// irukkura first object-ah thedi edukkum
export const extractSettings = (input) => {
  if (!input || typeof input !== "object") return null;

  if (!Array.isArray(input) && "reminder_time" in input) return input;

  const children = Array.isArray(input) ? input : Object.values(input);
  for (const child of children) {
    const found = extractSettings(child);
    if (found) return found;
  }
  return null;
};

export const toBool = (v) =>
  v === true || v === 1 || ["true", "1", "yes", "on"].includes(String(v).trim().toLowerCase());

export const loadSoundSetting = async () => {
  try {
    const response = await getAllSettings();
    const settings = extractSettings(response);

    if (settings && settings.sound_alerts !== null && settings.sound_alerts !== undefined) {
      setSoundEnabled(toBool(settings.sound_alerts));
    }
  } catch {
    // setting kidaikala na default (ON)
  }
};


// API response message edukkum
const extractMessage = (response) =>
  response?.data?.message ||
  response?.data?.data?.message ||
  response?.message ||
  "";

export default function NotificationsCard() {
  // 🔒 Maatha mudiyaadhavai (always ON)
  const reminders = true;
  const notify = { newLead: true, missed: true, reassigned: true };

  // ✅ Maatha mudiyum
  const [time, setTime] = useState("");
  const [sound, setSound] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const messageTimerRef = useRef(null); 
  const applySettings = (settings) => {
    if (!settings) return;

    if (settings.reminder_time !== null && settings.reminder_time !== undefined) {
      const num = parseInt(settings.reminder_time, 10);
      if (!Number.isNaN(num)) setTime(String(num));
    }

    if (settings.sound_alerts !== null && settings.sound_alerts !== undefined) {
      setSound(toBool(settings.sound_alerts));
    }
  };

  // ✅ First API response -> page la show
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await getAllSettings();
        console.log("RAW response:", response);

        const settings = extractSettings(response);
        console.log("EXTRACTED:", settings);

        applySettings(settings);
      } catch (error) {
        console.log("LOAD ERROR:", error);
        setMessage({
          type: "error",
          text: error?.response?.data?.message || "Failed to load settings",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // ✅ Update API response -> message show + value refresh
  // const handleUpdate = async () => {
  //   setSaving(true);
  //   setMessage({ type: "", text: "" });

  //   try {
  //     const response = await updateNotificationSettings({
  //       reminder_time: Number(time),
  //       sound_alerts: sound,
  //     });
  //     console.log("UPDATE response:", response);

  //     // update response la settings irundha UI refresh
  //     const updated = extractSettings(response);
  //     if (updated) {
  //       applySettings(updated);
  //     }

  //     setMessage({
  //       type: "success",
  //       text: extractMessage(response) || "Settings updated successfully",
  //     });
  //   } catch (error) {
  //     setMessage({
  //       type: "error",
  //       text:
  //         error?.response?.data?.message ||
  //         error?.response?.data?.detail ||
  //         "Failed to update settings",
  //     });
  //   } finally {
  //     setSaving(false);
  //   }
  // };


  // Success / error message 2.5 sec la maraiyum
const showMessage = (type, text) => {
  clearTimeout(messageTimerRef.current);
  setMessage({ type, text });
  messageTimerRef.current = setTimeout(
    () => setMessage({ type: "", text: "" }),
    2500
  );
};

useEffect(() => () => clearTimeout(messageTimerRef.current), []);

// Value maathina udane save (Update button thevai illa)
const saveSettings = async (nextTime, nextSound, rollback) => {
  setSaving(true);

  try {
    const response = await updateNotificationSettings({
      reminder_time: Number(nextTime),
      sound_alerts: nextSound,
    });

    // Save aanadhum Navbar sound ku udane apply
    setSoundEnabled(nextSound);

    showMessage("success", extractMessage(response) || "Settings saved");
  } catch (error) {
    rollback(); // save aagala na pazhaya value ku thirumba

    showMessage(
      "error",
      error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to save settings"
    );
  } finally {
    setSaving(false);
  }
};

const handleTimeChange = (e) => {
  const next = e.target.value;
  const prev = time;

  if (saving || next === prev) return;

  setTime(next);
  saveSettings(next, sound, () => setTime(prev));
};

const handleSoundChange = (value) => {
  if (loading || saving || !time) return;

  const prev = sound;

  setSound(value);
  setSoundEnabled(value);   // udane apply (API-ku wait pannaadhu)

  // ON panna preview sound (click = user gesture)
  if (value) playNotificationSound("notification", { force: true });

  saveSettings(time, value, () => {
    setSound(prev);
    setSoundEnabled(prev);  // save fail aana pazhaya value
  });
};

  // API la 5/10/15/30 thavira vera value vandha, dropdown la add aagum
  const options =
    time && !REMINDER_OPTIONS.includes(time)
      ? [...REMINDER_OPTIONS, time].sort((a, b) => Number(a) - Number(b))
      : REMINDER_OPTIONS;

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

      {/* 🔒 Always ON */}
      <Box sx={lockedSx}>
        <SettingRow
          title="Follow-up reminders"
          desc="Get a nudge before every scheduled follow-up"
          checked={reminders}
          onChange={() => {}}
        />
      </Box>

      <Divider sx={{ ...dividerSx, my: 1.5 }} />

      {/* ✅ Editable */}
      <SettingRow
        title="Reminder time"
        desc="How early should we remind you?"
      >
        <Select
          size="small"
          value={time}
          onChange={handleTimeChange}
          disabled={loading || saving}
          sx={selectSx}
        >
          {options.map((min) => (
            <MenuItem key={min} value={min} sx={{ fontSize: 13 }}>
              {min} minutes before
            </MenuItem>
          ))}
        </Select>
      </SettingRow>

      <Divider sx={{ ...dividerSx, my: 1.5 }} />

      {/* ✅ Editable */}
      <SettingRow
        title="Sound alerts"
        desc="Play a sound when a new alert arrives"
        checked={sound}
        onChange={handleSoundChange}
      />

      <Divider sx={{ ...dividerSx, my: 2 }} />

      {/* 🔒 Always checked */}
      <Box sx={lockedSx}>
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
          These alerts are always enabled.
        </Typography>

        <Stack spacing={0.5}>
          <FormControlLabel
            sx={labelSx}
            control={<Checkbox checked={notify.newLead} disabled sx={checkboxSx} />}
            label="New lead assigned"
          />

          <FormControlLabel
            sx={labelSx}
            control={<Checkbox checked={notify.missed} disabled sx={checkboxSx} />}
            label="Missed follow-ups"
          />

          <FormControlLabel
            sx={labelSx}
            control={<Checkbox checked={notify.reassigned} disabled sx={checkboxSx} />}
            label="Reassigned leads"
          />
        </Stack>
      </Box>

      {/* Update button
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 2,
          mt: 3,
        }}
      >
        {message.text && (
          <Typography
            sx={{
              fontSize: 13,
              color: message.type === "success" ? "#16A34A" : "#DC2626",
            }}
          >
            {message.text}
          </Typography>
        )}

        <Button
          onClick={handleUpdate}
          disabled={saving || loading || !time}
          startIcon={
            saving ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <SaveOutlinedIcon />
            )
          }
          sx={{
            bgcolor: "#97D927",
            color: "#fff",
            textTransform: "none",
            borderRadius: "8px",
            px: 3,
            height: "40px",
            "&:hover": { bgcolor: "#85C220" },
            "&.Mui-disabled": { bgcolor: "#CFE8A3", color: "#fff" },
          }}
        >
          Update
        </Button>
      </Box> */}
    {/* Auto-save status */}
<Box
  sx={{
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    mt: 2,
    minHeight: 20,
  }}
>
  {saving ? (
    <Typography sx={{ fontSize: 13, color: "#64748B" }}>
      Saving...
    </Typography>
  ) : message.text ? (
    <Typography
      sx={{
        fontSize: 13,
        color: message.type === "success" ? "#16A34A" : "#DC2626",
      }}
    >
      {message.text}
    </Typography>
  ) : null}
</Box>
</Panel>
  );
}