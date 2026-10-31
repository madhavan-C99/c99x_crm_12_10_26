// import React from "react";
// import {
//   Alert,
//   Avatar,
//   Box,
//   Button,
//   Card,
//   Grid,
//   Stack,
//   Typography,
// } from "@mui/material";

// import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
// import PlayCircleIcon from "@mui/icons-material/PlayCircle";
// import HelpIcon from "@mui/icons-material/Help";
// import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
// import ScheduleIcon from "@mui/icons-material/Schedule";

// import Panel from "../../../components/settings/components/Panel";
// import { LIME, LIME_SOFT, LIME_DARK, INK } from "../theme";
// const cards = [
//   {
//     Icon: MenuBookOutlinedIcon,
//     title: "User Guide",
//     desc: "Access full CRM documentation and setup guides.",
//     btn: "Open User Guide",
//   },
//   {
//     Icon: PlayCircleIcon,
//     title: "Video Tutorials",
//     desc: "Watch step-by-step walkthroughs of every feature.",
//     btn: "Watch Tutorials",
//   },
//   {
//     Icon: HelpIcon,
//     title: "Browse FAQs",
//     desc: "Find answers to commonly asked questions.",
//     btn: "Open FAQs",
//   },
// ];

// export default function HelpTab() {
//   return (
//     <Stack spacing={3}>
//       <Grid container spacing={3}>
//         {cards.map(({ Icon, title, desc, btn }) => (
//           <Grid size={{ xs: 12, md: 4 }} key={title}>
//             <Panel sx={{ textAlign: "center", height: "100%" }}>
//               <Box sx={{ width: 64, height: 64, mx: "auto", mb: 2, borderRadius: "50%", bgcolor: LIME_SOFT, color: "#4E8A00", display: "grid", placeItems: "center" }}>
//                 <Icon fontSize="large" />
//               </Box>
//               <Typography fontWeight={700} fontSize={18} mb={0.5}>{title}</Typography>
//               <Typography variant="body2" color="text.secondary" mb={2.5}>{desc}</Typography>
//               <Button fullWidth variant="outlined"
//                 sx={{ borderColor: LIME, color: LIME_DARK, "&:hover": { borderColor: LIME, bgcolor: LIME_SOFT } }}>
//                 {btn}
//               </Button>
//             </Panel>
//           </Grid>
//         ))}
//       </Grid>

//       <Grid container spacing={3}>
//         <Grid size={{ xs: 12, md: 5 }}>
//           <Panel sx={{ height: "100%" }}>
//             <Typography fontWeight={700} fontSize={16}>Your support contact</Typography>
//             <Typography variant="body2" color="text.secondary" mb={2}>Reach out for account or CRM issues</Typography>
//             <Stack direction="row" spacing={2} alignItems="center" mb={2}>
//               <Avatar sx={{ bgcolor: LIME, color: "#fff", fontWeight: 700 }}>AP</Avatar>
//               <Box>
//                 <Typography fontWeight={600}>Alex Pandian</Typography>
//                 <Typography variant="body2" color="text.secondary">alexpandian@gmail.com</Typography>
//                 <Typography variant="body2" color="text.secondary">+91 75468 987650</Typography>
//               </Box>
//             </Stack>
//             <Alert icon={<ScheduleIcon fontSize="small" />} severity="success"
//               sx={{ bgcolor: LIME_SOFT, color: INK, "& .MuiAlert-icon": { color: "#4E8A00" } }}>
//               Support hours: Monday–Friday, 9:00 AM – 6:00 PM. We usually reply within 24 hrs.
//             </Alert>
//           </Panel>
//         </Grid>
//         <Grid size={{ xs: 12, md: 7 }}>
//           <Card elevation={0} sx={{
//             height: "100%", minHeight: 220, p: 4, color: "#fff", borderRadius: 3,
//             background: "linear-gradient(135deg,#0E1B3D 0%,#13244F 60%,#1B3A6B 100%)",
//             display: "flex", flexDirection: "column", justifyContent: "center",
//           }}>
//             <Typography variant="h5" fontWeight={800}>Live Chat</Typography>
//             <Typography sx={{ opacity: 0.8 }} mb={3}>Start a live chat with CRM support.</Typography>
//             <Box><Button variant="contained" startIcon={<ChatBubbleIcon  />}>Start Chat</Button></Box>
//           </Card>
//         </Grid>
//       </Grid>
//     </Stack>
//   );
// }



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

const panelSx = {
  height: "100%",
  p: { xs: 2, sm: 2.5, md: 3 },
  borderRadius: "14px",
  border: "1px solid #E8EDF3",
  boxShadow: "0 2px 10px rgba(15, 23, 42, 0.035)",
  bgcolor: "#FFFFFF",
  boxSizing: "border-box",
};

const sectionTitleSx = {
  fontSize: 15,
  fontWeight: 700,
  color: "#1E293B",
  lineHeight: 1.5,
};

const descriptionSx = {
  fontSize: 12.5,
  color: "#64748B",
  lineHeight: 1.7,
};

export default function HelpTab() {
  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ width: "100%", minWidth: 0 }}>
      {/* Help Resources */}
      <Grid container spacing={{ xs: 2, md: 2.5 }} alignItems="stretch">
        {cards.map(({ Icon, title, desc, btn }) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={title}>
            <Panel
              sx={{
                ...panelSx,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                minHeight: 245,
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",

                "&:hover": {
                  borderColor: "#D5E5BC",
                  boxShadow: "0 5px 18px rgba(15, 23, 42, 0.06)",
                },
              }}
            >
              <Box
                sx={{
                  width: 54,
                  height: 54,
                  mb: 2,
                  flexShrink: 0,
                  borderRadius: "15px",
                  bgcolor: LIME_SOFT,
                  color: "#4E8A00",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon sx={{ fontSize: 27 }} />
              </Box>

              <Typography
                sx={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#1E293B",
                  mb: 0.75,
                  lineHeight: 1.5,
                }}
              >
                {title}
              </Typography>

              <Typography
                sx={{
                  ...descriptionSx,
                  mb: 2.5,
                  flex: 1,
                  maxWidth: 260,
                }}
              >
                {desc}
              </Typography>

              <Button
                fullWidth
                variant="outlined"
                sx={{
                  mt: "auto",
                  minHeight: 38,
                  borderRadius: "8px",
                  borderColor: LIME,
                  color: LIME_DARK,
                  fontSize: 12.5,
                  fontWeight: 600,
                  textTransform: "none",

                  "&:hover": {
                    borderColor: LIME,
                    bgcolor: LIME_SOFT,
                  },
                }}
              >
                {btn}
              </Button>
            </Panel>
          </Grid>
        ))}
      </Grid>

      {/* Support and Live Chat */}
      <Grid container spacing={{ xs: 2, md: 2.5 }} alignItems="stretch">
        <Grid size={{ xs: 12, md: 5 }}>
          <Panel
            sx={{
              ...panelSx,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography sx={sectionTitleSx}>
              Your support contact
            </Typography>

            <Typography sx={{ ...descriptionSx, mt: 0.5, mb: 2.5 }}>
              Reach out for account or CRM issues
            </Typography>

            <Stack
              direction="row"
              spacing={1.75}
              alignItems="center"
              sx={{ mb: 2.5, minWidth: 0 }}
            >
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  bgcolor: LIME,
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                AP
              </Avatar>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "#1E293B",
                    mb: 0.5,
                  }}
                >
                  GunalRaj
                </Typography>

                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#64748B",
                    overflowWrap: "anywhere",
                    lineHeight: 1.7,
                  }}
                >
                  hr.gunalraj@c99x.com
                </Typography>

                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#64748B",
                    lineHeight: 1.7,
                  }}
                >
                  +91 75468 987650
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ mt: "auto" }}>
              <Alert
                icon={<ScheduleIcon sx={{ fontSize: 18 }} />}
                severity="success"
                sx={{
                  alignItems: "flex-start",
                  p: 1.5,
                  border: "1px solid #E1EDCF",
                  borderRadius: "10px",
                  bgcolor: LIME_SOFT,
                  color: INK,

                  "& .MuiAlert-icon": {
                    color: "#4E8A00",
                    pt: 0.2,
                    mr: 1,
                  },

                  "& .MuiAlert-message": {
                    p: 0,
                    fontSize: 11.5,
                    lineHeight: 1.8,
                  },
                }}
              >
                Support hours: Monday–Friday, 9:00 AM – 6:00 PM. We usually
                reply within 24 hrs.
              </Alert>
            </Box>
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              minHeight: 245,
              p: { xs: 2.5, sm: 3.5, md: 4 },
              color: "#FFFFFF",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(135deg, #0E1B3D 0%, #13244F 60%, #1B3A6B 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              boxSizing: "border-box",
              overflow: "hidden",
              position: "relative",

              "&::before": {
                content: '""',
                position: "absolute",
                width: 180,
                height: 180,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.07)",
                right: -65,
                top: -75,
                pointerEvents: "none",
              },
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                mb: 2,
                display: "grid",
                placeItems: "center",
                borderRadius: "12px",
                bgcolor: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <ChatBubbleIcon sx={{ fontSize: 22, color: "#D7F0B1" }} />
            </Box>

            <Typography
              sx={{
                fontSize: { xs: 20, sm: 22 },
                fontWeight: 700,
                lineHeight: 1.4,
                letterSpacing: "-0.3px",
              }}
            >
              Live Chat
            </Typography>

            <Typography
              sx={{
                mt: 0.75,
                mb: 2.5,
                fontSize: 13,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.75)",
                maxWidth: 360,
              }}
            >
              Start a live chat with CRM support.
            </Typography>

            <Button
              variant="contained"
              startIcon={<ChatBubbleIcon sx={{ fontSize: 17 }} />}
              disableElevation
              sx={{
                minHeight: 40,
                px: 2.25,
                borderRadius: "8px",
                bgcolor: "#D7F0B1",
                color: "#1D3520",
                fontSize: 12.5,
                fontWeight: 700,
                textTransform: "none",

                "&:hover": {
                  bgcolor: "#C7E69A",
                },
              }}
            >
              Start Chat
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
