import React from "react";
import { Card } from "@mui/material";
import { LINE } from "../../../pages/setting/theme";

export default function Panel({ children, sx }) {
  return (
    <Card elevation={0} sx={{ border: `1px solid ${LINE}`, borderRadius: 3, p: 3, ...sx }}>
      {children}
    </Card>
  );
}
