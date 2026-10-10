import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { LIME_SOFT } from "../../../pages/setting/theme";

export default function PanelHeader({ icon, title, subtitle, action }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: LIME_SOFT, color: "#4E8A00", display: "grid", placeItems: "center" }}>
          {icon}
        </Box>
        <Box>
          <Typography fontWeight={700} fontSize={16}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
        </Box>
      </Stack>
      {action}
    </Stack>
  );
}
