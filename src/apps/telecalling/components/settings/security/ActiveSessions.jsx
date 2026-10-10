import React, { useState } from "react";
import {
  Box, Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import DesktopWindowsOutlinedIcon from "@mui/icons-material/DesktopWindowsOutlined";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import Panel from "../components/Panel";
import PanelHeader from "../components/PanelHeader";
import StatusPill from "../components/StatusPill";
import { LIME, MUTED } from "../../../pages/setting/theme";

const initialSessions = [
  { id: 1, device: "Windows, Chrome", type: "Desktop Chrome", kind: "desktop", location: "Chennai, India", time: "10 May 2024, 07:30 PM", current: true },
  { id: 2, device: "iPhone 15", type: "Mobile Chrome", kind: "mobile", location: "Chennai, India", time: "10 May 2024, 07:30 PM", current: false },
];

const DeviceIcon = ({ kind }) =>
  kind === "mobile" ? <PhoneIphoneOutlinedIcon fontSize="small" /> : <DesktopWindowsOutlinedIcon fontSize="small" />;

export default function ActiveSessions({ sessions = initialSessions }) {
  const [list, setList] = useState(sessions);
  const logOut = (id) => setList((l) => l.filter((s) => s.id !== id));
  const logOutOthers = () => setList((l) => l.filter((s) => s.current));

  return (
    <Panel sx={{ p: 0, overflow: "hidden" }}>
      <Box sx={{ p: 3 }}>
        <PanelHeader
          icon={<DevicesOutlinedIcon />}
          title="Active Sessions"
          subtitle={`${list.length} device${list.length === 1 ? "" : "s"} currently logged into your account`}
          action={
            <Button variant="outlined" color="error" startIcon={<LogoutIcon />}
              disabled={list.length <= 1} onClick={logOutOthers}>
              Log out all other sessions
            </Button>
          }
        />
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#F7F8FA" }}>
              {["Device", "Location", "Login time", "Status", ""].map((h, i) => (
                <TableCell key={i} align={h ? "left" : "right"} sx={{ fontWeight: 700, color: MUTED, fontSize: 13 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#F3F4F6", display: "grid", placeItems: "center" }}>
                      <DeviceIcon kind={s.kind} />
                    </Box>
                    <Box>
                      <Typography fontWeight={600} fontSize={14}>{s.device}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.type}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>{s.location}</TableCell>
                <TableCell>{s.time}</TableCell>
                <TableCell><StatusPill label="Active" /></TableCell>
                <TableCell align="right">
                  {s.current ? (
                    <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="flex-end">
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: LIME }} />
                      <Typography variant="body2" fontWeight={600}>This device</Typography>
                    </Stack>
                  ) : (
                    <Button size="small" variant="outlined" color="error" onClick={() => logOut(s.id)}>Log out</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {list.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center">No active sessions</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Panel>
  );
}
