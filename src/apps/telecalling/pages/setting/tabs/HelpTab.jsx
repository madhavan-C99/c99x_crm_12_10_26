import React from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import HelpIcon from "@mui/icons-material/Help";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import ScheduleIcon from "@mui/icons-material/Schedule";

import Panel from "../../../components/settings/components/Panel";
import { LIME, LIME_SOFT, LIME_DARK, INK } from "../theme";
const cards = [
  {
    Icon: MenuBookOutlinedIcon,
    title: "User Guide",
    desc: "Access full CRM documentation and setup guides.",
    btn: "Open User Guide",
  },
  {
    Icon: PlayCircleIcon,
    title: "Video Tutorials",
    desc: "Watch step-by-step walkthroughs of every feature.",
    btn: "Watch Tutorials",
  },
  {
    Icon: HelpIcon,
    title: "Browse FAQs",
    desc: "Find answers to commonly asked questions.",
    btn: "Open FAQs",
  },
];

export default function HelpTab() {
  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        {cards.map(({ Icon, title, desc, btn }) => (
          <Grid size={{ xs: 12, md: 4 }} key={title}>
            <Panel sx={{ textAlign: "center", height: "100%" }}>
              <Box sx={{ width: 64, height: 64, mx: "auto", mb: 2, borderRadius: "50%", bgcolor: LIME_SOFT, color: "#4E8A00", display: "grid", placeItems: "center" }}>
                <Icon fontSize="large" />
              </Box>
              <Typography fontWeight={700} fontSize={18} mb={0.5}>{title}</Typography>
              <Typography variant="body2" color="text.secondary" mb={2.5}>{desc}</Typography>
              <Button fullWidth variant="outlined"
                sx={{ borderColor: LIME, color: LIME_DARK, "&:hover": { borderColor: LIME, bgcolor: LIME_SOFT } }}>
                {btn}
              </Button>
            </Panel>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Panel sx={{ height: "100%" }}>
            <Typography fontWeight={700} fontSize={16}>Your support contact</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>Reach out for account or CRM issues</Typography>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <Avatar sx={{ bgcolor: LIME, color: "#fff", fontWeight: 700 }}>AP</Avatar>
              <Box>
                <Typography fontWeight={600}>Alex Pandian</Typography>
                <Typography variant="body2" color="text.secondary">alexpandian@gmail.com</Typography>
                <Typography variant="body2" color="text.secondary">+91 75468 987650</Typography>
              </Box>
            </Stack>
            <Alert icon={<ScheduleIcon fontSize="small" />} severity="success"
              sx={{ bgcolor: LIME_SOFT, color: INK, "& .MuiAlert-icon": { color: "#4E8A00" } }}>
              Support hours: Monday–Friday, 9:00 AM – 6:00 PM. We usually reply within 24 hrs.
            </Alert>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card elevation={0} sx={{
            height: "100%", minHeight: 220, p: 4, color: "#fff", borderRadius: 3,
            background: "linear-gradient(135deg,#0E1B3D 0%,#13244F 60%,#1B3A6B 100%)",
            display: "flex", flexDirection: "column", justifyContent: "center",
          }}>
            <Typography variant="h5" fontWeight={800}>Live Chat</Typography>
            <Typography sx={{ opacity: 0.8 }} mb={3}>Start a live chat with CRM support.</Typography>
            <Box><Button variant="contained" startIcon={<ChatBubbleIcon  />}>Start Chat</Button></Box>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
