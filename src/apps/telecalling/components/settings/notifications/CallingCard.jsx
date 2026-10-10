import React, { useState } from "react";
import { Box, Button, Divider, MenuItem, Select, Stack, Typography } from "@mui/material";
import PhoneInTalkOutlinedIcon from "@mui/icons-material/PhoneInTalkOutlined";
import Panel from "../components/Panel";
import PanelHeader from "../components/PanelHeader";
import SettingRow from "../components/SettingRow";
import StatusPill from "../components/StatusPill";
import { selectSx } from "./NotificationsCard";

export default function CallingCard() {
  const [clickToCall, setClickToCall] = useState(true);
  const [mandatory, setMandatory] = useState(true);
  const [outcome, setOutcome] = useState("interested");

  return (
    <Panel sx={{ height: "100%" }}>
      <PanelHeader icon={<PhoneInTalkOutlinedIcon />} title="Calling" subtitle="Adjust your calling settings" />
      <Divider />
      <SettingRow title="Enable click to call" desc="Start a call with one tap from any lead"
        checked={clickToCall} onChange={setClickToCall} />
      <Divider />
      <SettingRow title="Make call notes mandatory" desc="Ask for notes before you can close a call"
        checked={mandatory} onChange={setMandatory} />
      <Divider />
      <SettingRow title="Default call outcome" desc="Pre-selected when a call ends">
        <Select size="small" value={outcome} onChange={(e) => setOutcome(e.target.value)} sx={selectSx}>
          <MenuItem value="interested">Interested</MenuItem>
          <MenuItem value="not_interested">Not interested</MenuItem>
          <MenuItem value="callback">Call back later</MenuItem>
          <MenuItem value="no_answer">No answer</MenuItem>
        </Select>
      </SettingRow>
      <Divider />
      <Stack direction="row" alignItems="center" justifyContent="space-between" py={1.75}>
        <Box>
          <Typography fontWeight={600} fontSize={14} color="text.secondary">Auto call logging</Typography>
          <Typography variant="caption" color="text.secondary">Calls will be logged automatically</Typography>
        </Box>
        <StatusPill label="Coming soon" color="#8A6D00" bg="#FFF5CC" />
      </Stack>
      <Box mt={2} display="flex" justifyContent="flex-end">
        <Button variant="contained" disableElevation>Save changes</Button>
      </Box>
    </Panel>
  );
}
