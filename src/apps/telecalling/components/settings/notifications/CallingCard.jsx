// import React, { useState } from "react";
// import { Box, Button, Divider, MenuItem, Select, Stack, Typography } from "@mui/material";
// import PhoneInTalkOutlinedIcon from "@mui/icons-material/PhoneInTalkOutlined";
// import Panel from "../components/Panel";
// import PanelHeader from "../components/PanelHeader";
// import SettingRow from "../components/SettingRow";
// import StatusPill from "../components/StatusPill";
// import { selectSx } from "./NotificationsCard";

// export default function CallingCard() {
//   const [clickToCall, setClickToCall] = useState(true);
//   const [mandatory, setMandatory] = useState(true);
//   const [outcome, setOutcome] = useState("interested");

//   return (
//     <Panel sx={{ height: "100%" }}>
//       <PanelHeader icon={<PhoneInTalkOutlinedIcon />} title="Calling" subtitle="Adjust your calling settings" />
//       <Divider />
//       <SettingRow title="Enable click to call" desc="Start a call with one tap from any lead"
//         checked={clickToCall} onChange={setClickToCall} />
//       <Divider />
//       <SettingRow title="Make call notes mandatory" desc="Ask for notes before you can close a call"
//         checked={mandatory} onChange={setMandatory} />
//       <Divider />
//       <SettingRow title="Default call outcome" desc="Pre-selected when a call ends">
//         <Select size="small" value={outcome} onChange={(e) => setOutcome(e.target.value)} sx={selectSx}>
//           <MenuItem value="interested">Interested</MenuItem>
//           <MenuItem value="not_interested">Not interested</MenuItem>
//           <MenuItem value="callback">Call back later</MenuItem>
//           <MenuItem value="no_answer">No answer</MenuItem>
//         </Select>
//       </SettingRow>
//       <Divider />
//       <Stack direction="row" alignItems="center" justifyContent="space-between" py={1.75}>
//         <Box>
//           <Typography fontWeight={600} fontSize={14} color="text.secondary">Auto call logging</Typography>
//           <Typography variant="caption" color="text.secondary">Calls will be logged automatically</Typography>
//         </Box>
//         <StatusPill label="Coming soon" color="#8A6D00" bg="#FFF5CC" />
//       </Stack>
//       <Box mt={2} display="flex" justifyContent="flex-end">
//         <Button variant="contained" disableElevation>Save changes</Button>
//       </Box>
//     </Panel>
//   );
// }



import React, { useState } from "react";

import {
  Box,
  Button,
  Divider,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import PhoneInTalkOutlinedIcon from "@mui/icons-material/PhoneInTalkOutlined";

import Panel from "../components/Panel";
import PanelHeader from "../components/PanelHeader";
import SettingRow from "../components/SettingRow";
import StatusPill from "../components/StatusPill";
import { selectSx } from "./NotificationsCard";

const dividerSx = {
  borderColor: "#EEF2F6",
};

const menuItemSx = {
  fontSize: 13,
  py: 1,
  color: "#334155",
};

export default function CallingCard() {
  const [clickToCall, setClickToCall] = useState(true);
  const [mandatory, setMandatory] = useState(true);
  const [outcome, setOutcome] = useState("interested");

  return (
    <Panel
      sx={{
        height: "100%",
        p: { xs: 2, sm: 2.5, md: 3 },
        borderRadius: "14px",
        border: "1px solid #E8EDF3",
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.035)",
        bgcolor: "#FFFFFF",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <PanelHeader
        icon={<PhoneInTalkOutlinedIcon />}
        title="Calling"
        subtitle="Adjust your calling settings"
      />

      <Divider sx={{ ...dividerSx, my: 2 }} />

      {/* Click to call */}
      <SettingRow
        title="Enable click to call"
        desc="Start a call with one tap from any lead"
        checked={clickToCall}
        onChange={setClickToCall}
      />

      <Divider sx={{ ...dividerSx, my: 1.5 }} />

      {/* Mandatory call notes */}
      <SettingRow
        title="Make call notes mandatory"
        desc="Ask for notes before you can close a call"
        checked={mandatory}
        onChange={setMandatory}
      />

      <Divider sx={{ ...dividerSx, my: 1.5 }} />

      {/* Default call outcome */}
      <SettingRow
        title="Default call outcome"
        desc="Pre-selected when a call ends"
      >
        <Select
          size="small"
          fullWidth={false}
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          sx={selectSx}
          MenuProps={{
            PaperProps: {
              sx: {
                mt: 0.5,
                borderRadius: "10px",
                border: "1px solid #E8EDF3",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
              },
            },
          }}
        >
          <MenuItem value="interested" sx={menuItemSx}>
            Interested
          </MenuItem>

          <MenuItem value="not_interested" sx={menuItemSx}>
            Not interested
          </MenuItem>

          <MenuItem value="callback" sx={menuItemSx}>
            Call back later
          </MenuItem>

          <MenuItem value="no_answer" sx={menuItemSx}>
            No answer
          </MenuItem>
        </Select>
      </SettingRow>

      <Divider sx={{ ...dividerSx, my: 1.5 }} />

      {/* Auto call logging */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{
          py: 1.25,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "#1E293B",
              lineHeight: 1.5,
            }}
          >
            Auto call logging
          </Typography>

          <Typography
            sx={{
              mt: 0.4,
              fontSize: 12,
              color: "#64748B",
              lineHeight: 1.6,
            }}
          >
            Calls will be logged automatically
          </Typography>
        </Box>

        <Box sx={{ flexShrink: 0 }}>
          <StatusPill
            label="Coming soon"
            color="#8A6D00"
            bg="#FFF5CC"
          />
        </Box>
      </Stack>

      {/* Save button */}
      <Box
        sx={{
          mt: 2.5,
          pt: 2,
          borderTop: "1px solid #EEF2F6",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 1,
        }}
      >
        {/* <Button
          variant="contained"
          disableElevation
          sx={{
            minWidth: 125,
            height: 38,
            px: 2.5,
            borderRadius: "8px",
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
            color: "#FFFFFF",
            bgcolor: "#30a40c",
            boxShadow: "none",

            "&:hover": {
              bgcolor: "#30a40c",
              boxShadow: "none",
            },

            "&:active": {
              bgcolor: "#1E40AF",
            },
          }}
        >
          Save changes
        </Button> */}
      </Box>
    </Panel>
  );
}
