import React from "react";
import { Box, Stack, Switch, Typography } from "@mui/material";

// Pass `children` for custom control (select etc). Otherwise renders a Switch.
export default function SettingRow({ title, desc, checked, onChange, children }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" py={1.75}>
      <Box pr={2}>
        <Typography fontWeight={600} fontSize={14}>{title}</Typography>
        {desc && <Typography variant="caption" color="text.secondary">{desc}</Typography>}
      </Box>
      {children ?? <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />}
    </Stack>
  );
}
