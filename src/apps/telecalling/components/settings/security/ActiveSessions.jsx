// import React, { useState } from "react";
// import {
//   Box, Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
// } from "@mui/material";
// import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
// import DesktopWindowsOutlinedIcon from "@mui/icons-material/DesktopWindowsOutlined";
// import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
// import LogoutIcon from "@mui/icons-material/Logout";
// import Panel from "../components/Panel";
// import PanelHeader from "../components/PanelHeader";
// import StatusPill from "../components/StatusPill";
// import { LIME, MUTED } from "../../../pages/setting/theme";

// const initialSessions = [
//   { id: 1, device: "Windows, Chrome", type: "Desktop Chrome", kind: "desktop", location: "Chennai, India", time: "10 May 2024, 07:30 PM", current: true },
//   { id: 2, device: "iPhone 15", type: "Mobile Chrome", kind: "mobile", location: "Chennai, India", time: "10 May 2024, 07:30 PM", current: false },
// ];

// const DeviceIcon = ({ kind }) =>
//   kind === "mobile" ? <PhoneIphoneOutlinedIcon fontSize="small" /> : <DesktopWindowsOutlinedIcon fontSize="small" />;

// export default function ActiveSessions({ sessions = initialSessions }) {
//   const [list, setList] = useState(sessions);
//   const logOut = (id) => setList((l) => l.filter((s) => s.id !== id));
//   const logOutOthers = () => setList((l) => l.filter((s) => s.current));

//   return (
//     <Panel sx={{ p: 0, overflow: "hidden" }}>
//       <Box sx={{ p: 3 }}>
//         <PanelHeader
//           icon={<DevicesOutlinedIcon />}
//           title="Active Sessions"
//           subtitle={`${list.length} device${list.length === 1 ? "" : "s"} currently logged into your account`}
//           action={
//             <Button variant="outlined" color="error" startIcon={<LogoutIcon />}
//               disabled={list.length <= 1} onClick={logOutOthers}>
//               Log out all other sessions
//             </Button>
//           }
//         />
//       </Box>

//       <TableContainer>
//         <Table>
//           <TableHead>
//             <TableRow sx={{ bgcolor: "#F7F8FA" }}>
//               {["Device", "Location", "Login time", "Status", ""].map((h, i) => (
//                 <TableCell key={i} align={h ? "left" : "right"} sx={{ fontWeight: 700, color: MUTED, fontSize: 13 }}>{h}</TableCell>
//               ))}
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {list.map((s) => (
//               <TableRow key={s.id} hover>
//                 <TableCell>
//                   <Stack direction="row" spacing={1.5} alignItems="center">
//                     <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#F3F4F6", display: "grid", placeItems: "center" }}>
//                       <DeviceIcon kind={s.kind} />
//                     </Box>
//                     <Box>
//                       <Typography fontWeight={600} fontSize={14}>{s.device}</Typography>
//                       <Typography variant="caption" color="text.secondary">{s.type}</Typography>
//                     </Box>
//                   </Stack>
//                 </TableCell>
//                 <TableCell>{s.location}</TableCell>
//                 <TableCell>{s.time}</TableCell>
//                 <TableCell><StatusPill label="Active" /></TableCell>
//                 <TableCell align="right">
//                   {s.current ? (
//                     <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="flex-end">
//                       <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: LIME }} />
//                       <Typography variant="body2" fontWeight={600}>This device</Typography>
//                     </Stack>
//                   ) : (
//                     <Button size="small" variant="outlined" color="error" onClick={() => logOut(s.id)}>Log out</Button>
//                   )}
//                 </TableCell>
//               </TableRow>
//             ))}
//             {list.length === 0 && (
//               <TableRow><TableCell colSpan={5} align="center">No active sessions</TableCell></TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </TableContainer>
//     </Panel>
//   );
// }




import React, { useCallback, useEffect, useState } from "react";

import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import DesktopWindowsOutlinedIcon from "@mui/icons-material/DesktopWindowsOutlined";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import LogoutIcon from "@mui/icons-material/Logout";

import dayjs from "dayjs";

import Panel from "../components/Panel";
import PanelHeader from "../components/PanelHeader";
import StatusPill from "../components/StatusPill";

import { LIME, MUTED } from "../../../pages/setting/theme";
import {
  getSessions,
  logoutSession,
  logoutOtherSessions,
} from "@/apps/telecalling/services/sessionService";

const DeviceIcon = ({ kind }) =>
  kind === "mobile" ? (
    <PhoneIphoneOutlinedIcon sx={{ fontSize: 20 }} />
  ) : (
    <DesktopWindowsOutlinedIcon sx={{ fontSize: 20 }} />
  );

const headCellSx = {
  py: 1.5,
  px: 2.5,
  bgcolor: "#F8FAFC",
  color: MUTED,
  fontSize: 12.5,
  fontWeight: 800,
  letterSpacing: "0.35px",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  textAlign: "center",
  borderBottom: "1px solid #E8EDF3",
};

const bodyCellSx = {
  py: 2,
  px: 2.5,
  fontSize: 13.5,
  color: "#475569",
  borderBottom: "1px solid #F1F5F9",
  whiteSpace: "nowrap",
  textAlign: "center",
};

const logoutButtonSx = {
  borderRadius: "8px",
  px: 1.5,
  py: 0.65,
  fontSize: 12,
  fontWeight: 600,
  textTransform: "none",
  whiteSpace: "nowrap",
  mr: 1.5,
};

// API response shape edhu vandhaalum "sessions" array-ah edukkum
const extractSessions = (input) => {
  if (!input || typeof input !== "object") return [];
  if (Array.isArray(input.sessions)) return input.sessions;
  for (const child of Object.values(input)) {
    const found = extractSessions(child);
    if (found.length) return found;
  }
  return [];
};

// API session -> UI row
const mapSession = (s) => ({
  id: s.id,
  device: s.device_name || "Unknown device",
  type: [s.device_type, s.browser].filter(Boolean).join(" "),
  kind: s.device_type === "Desktop" ? "desktop" : "mobile",
  location: s.location || "-",
  time: s.login_time
    ? dayjs(s.login_time).format("DD MMM YYYY, hh:mm A")
    : "-",
  current: !!s.is_current,
});

export default function ActiveSessions() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadSessions = useCallback(async () => {
    try {
      const response = await getSessions();
      setList(extractSessions(response?.data).map(mapSession));
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const logOut = async (id) => {
    setBusy(true);
    try {
      await logoutSession(id);
      await loadSessions();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to log out session");
    } finally {
      setBusy(false);
    }
  };

  const logOutOthers = async () => {
    setBusy(true);
    try {
      await logoutOtherSessions();
      await loadSessions();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to log out sessions");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      sx={{
        p: 0,
        overflow: "hidden",
        borderRadius: "14px",
        border: "1px solid #E8EDF3",
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.035)",
        bgcolor: "#FFFFFF",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <PanelHeader
          icon={<DevicesOutlinedIcon />}
          title="Active Sessions"
          subtitle={`${list.length} device${list.length === 1 ? "" : "s"} currently logged into your account`}
        />

        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
          disabled={busy || list.filter((session) => !session.current).length === 0}
          onClick={logOutOthers}
          sx={{
            ...logoutButtonSx,
            minHeight: 36,
            px: 1.5,
            width: { xs: "100%", sm: "auto" },
            whiteSpace: "nowrap",
          }}
        >
          Log out all other sessions
        </Button>
      </Box>

      {error && (
        <Typography sx={{ px: 3, pb: 1.5, fontSize: 13, color: "#DC2626" }}>
          {error}
        </Typography>
      )}

      {/* Sessions table */}
      <TableContainer
        sx={{
          width: "100%",
          overflowX: "auto",
          "&::-webkit-scrollbar": {
            height: 6,
          },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "#CBD5E1",
            borderRadius: 10,
          },
        }}
      >
        <Table
          sx={{
            minWidth: 760,
            borderCollapse: "separate",
            borderSpacing: 0,
          }}
        >
          <TableHead>
            <TableRow>
              {["Device", "Location", "Login time", "Status", ""].map(
                (heading, index) => (
                  <TableCell
                    key={index}
                    align={heading ? "left" : "right"}
                    sx={{
                      ...headCellSx,
                      ...(index === 0 && { pl: 3 }),
                      ...(index === 4 && { pr: 3 }),
                    }}
                  >
                    {heading}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                  sx={{ py: 6, borderBottom: 0 }}
                >
                  <CircularProgress size={26} />
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              list.map((session) => (
                <TableRow
                  key={session.id}
                  hover
                  sx={{
                    transition: "background-color 0.15s ease",
                    "&:hover": {
                      bgcolor: "#FAFBFC",
                    },
                    "&:last-child td": {
                      borderBottom: 0,
                    },
                  }}
                >
                  {/* Device */}
                  <TableCell sx={{ ...bodyCellSx, pl: 3 }}>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{ minWidth: 200 }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          flexShrink: 0,
                          borderRadius: "10px",
                          bgcolor: "#F1F5F9",
                          color: "#475569",
                          display: "grid",
                          placeItems: "center",
                          border: "1px solid #E8EDF3",
                        }}
                      >
                        <DeviceIcon kind={session.kind} />
                      </Box>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: "#1E293B",
                            lineHeight: 1.5,
                          }}
                        >
                          {session.device}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.35,
                            fontSize: 11.5,
                            color: "#94A3B8",
                            lineHeight: 1.5,
                          }}
                        >
                          {session.type}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  {/* Location */}
                  <TableCell sx={bodyCellSx}>{session.location}</TableCell>

                  {/* Login time */}
                  <TableCell sx={bodyCellSx}>{session.time}</TableCell>

                  {/* Status */}
                  <TableCell sx={bodyCellSx}>
                    <StatusPill label="Active" />
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="right" sx={{ ...bodyCellSx, pr: 0 }}>
                    {session.current ? (
                      <Stack
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                        justifyContent="flex-end"
                      >
                        <Box
                          sx={{
                            width: 7,
                            height: 7,
                            flexShrink: 0,
                            borderRadius: "50%",
                            bgcolor: LIME,
                          }}
                        />

                        <Typography
                          sx={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: "#475569",
                          }}
                        >
                          This device
                        </Typography>
                      </Stack>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={busy}
                        onClick={() => logOut(session.id)}
                        sx={logoutButtonSx}
                      >
                        Log out
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}

            {!loading && list.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                  sx={{
                    py: 6,
                    borderBottom: 0,
                  }}
                >
                  <DevicesOutlinedIcon
                    sx={{
                      fontSize: 32,
                      color: "#CBD5E1",
                      mb: 1,
                    }}
                  />

                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#475569",
                    }}
                  >
                    No active sessions
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: 12,
                      color: "#94A3B8",
                    }}
                  >
                    No devices are currently listed.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Panel>
  );
}
