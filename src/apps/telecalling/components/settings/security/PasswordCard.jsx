import React from "react";
import { Button, Divider, Stack, Typography } from "@mui/material";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import Panel from "../components/Panel";
import PanelHeader from "../components/PanelHeader";
import { LIME, LIME_DARK } from "../../../pages/setting/theme";

const rules = [
  "Minimum 8 characters", "At least one upper case letter", "At least one number",
  "At least one special character", "Cannot be last 3 passwords",
];

export default function PasswordCard({ lastChanged = "24 days ago", onChange }) {
  return (
    <Panel sx={{ height: "100%" }}>
      <PanelHeader icon={<LockResetOutlinedIcon />} title="Password" subtitle={`Last changed ${lastChanged}`}
        action={<Button variant="outlined" onClick={onChange} sx={{ borderColor: LIME, color: LIME_DARK }}>Change Password</Button>} />
      <Divider sx={{ mb: 2 }} />
      <Typography variant="body2" fontWeight={600} mb={1}>Password requirements</Typography>
      <Stack spacing={0.75}>
        {rules.map((r) => (
          <Stack key={r} direction="row" spacing={1} alignItems="center">
            <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: LIME }} />
            <Typography variant="body2" color="text.secondary">{r}</Typography>
          </Stack>
        ))}
      </Stack>
    </Panel>
  );
}
