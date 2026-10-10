import React, { useState } from "react";
import { Divider } from "@mui/material";
import GppMaybeOutlinedIcon from "@mui/icons-material/GppMaybeOutlined";
import Panel from "../components/Panel";
import PanelHeader from "../components/PanelHeader";
import SettingRow from "../components/SettingRow";

export default function SecurityAlertsCard() {
  const [a, setA] = useState({ device: true, failed: true, password: true });
  const set = (k) => (v) => setA({ ...a, [k]: v });

  return (
    <Panel sx={{ height: "100%" }}>
      <PanelHeader icon={<GppMaybeOutlinedIcon />} title="Security" subtitle="Choose which security alerts you receive" />
      <Divider />
      <SettingRow title="New device login alerts" desc="Get notified when your account is used from a new device"
        checked={a.device} onChange={set("device")} />
      <Divider />
      <SettingRow title="Failed login attempts" desc="Get notified when someone enters an incorrect password several times"
        checked={a.failed} onChange={set("failed")} />
      <Divider />
      <SettingRow title="Password change" desc="Get notified whenever your account password is changed"
        checked={a.password} onChange={set("password")} />
    </Panel>
  );
}
