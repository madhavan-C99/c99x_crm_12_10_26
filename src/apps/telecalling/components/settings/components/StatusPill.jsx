import React from "react";
import { Chip } from "@mui/material";
import { LIME_SOFT } from "../../../pages/setting/theme";

export default function StatusPill({ label, color = "#2E7D00", bg = LIME_SOFT }) {
  return <Chip label={label} size="small" sx={{ bgcolor: bg, color, fontWeight: 600, height: 22 }} />;
}
