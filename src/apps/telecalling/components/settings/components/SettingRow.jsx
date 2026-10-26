// import React from "react";
// import { Box, Stack, Switch, Typography } from "@mui/material";

// // Pass `children` for custom control (select etc). Otherwise renders a Switch.
// export default function SettingRow({ title, desc, checked, onChange, children }) {
//   return (
//     <Stack direction="row" alignItems="center" justifyContent="space-between" py={1.75}>
//       <Box pr={2}>
//         <Typography fontWeight={600} fontSize={14}>{title}</Typography>
//         {desc && <Typography variant="caption" color="text.secondary">{desc}</Typography>}
//       </Box>
//       {children ?? <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />}
//     </Stack>
//   );
// }



import React from "react";

import {
  Box,
  Stack,
  Switch,
  Typography,
} from "@mui/material";

export default function SettingRow({
  title,
  desc,
  checked,
  onChange,
  children,
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
      sx={{
        width: "100%",
        minWidth: 0,
        py: 1.5,
        boxSizing: "border-box",

        "@media (max-width: 480px)": {
          spacing: 1,
        },
      }}
    >
      {/* Left: Title and description */}
      <Box
        sx={{
          flex: "1 1 auto",
          minWidth: 0,
          pr: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "#1E293B",
            lineHeight: 1.5,
          }}
        >
          {title}
        </Typography>

        {desc && (
          <Typography
            sx={{
              display: "block",
              mt: 0.4,
              fontSize: 12,
              fontWeight: 400,
              color: "#64748B",
              lineHeight: 1.6,
            }}
          >
            {desc}
          </Typography>
        )}
      </Box>

      {/* Right: Toggle or custom control */}
      <Box
        sx={{
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          minWidth: 0,
        }}
      >
        {children ?? (
          <Switch
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            size="small"
            sx={{
              m: 0,
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "#2E7D00",
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                bgcolor: "#2E7D00",
                opacity: 1,
              },
              "& .MuiSwitch-track": {
                borderRadius: 20,
              },
            }}
          />
        )}
      </Box>
    </Stack>
  );
}
