import { Box } from "@mui/material";

import Sidebar from "@/apps/telecalling/components/sidebar/Sidebar";
import Navbar from "@/apps/telecalling/components/navbar/Navbar";
import { Outlet } from "react-router-dom";
function MainLayout() {

  return (

    <Box
      sx={{
        display: "flex",
        height: "calc(100vh - 20px)",
        overflow: "hidden",
        boxSizing: 'border-box',
        mt: 1,
        mr: 1

      }}
    >

      <Sidebar />

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          height: "100%",
          width: { xs: "100%", md: "calc(100% - 86px)" },
          overflow: "hidden",
        }}
      >
      <Navbar />

              <Box
          sx={{
            background: "#F1F1F1",
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            p: 2,
            boxSizing: "border-box",
            width: "100%",
            scrollbarWidth: "none", // Firefox-க்கு
            "&::-webkit-scrollbar": {
              display: "none", // Chrome, Brave, Edge & Safari-க்கு
            },
          }}
        >
          <Outlet />
        </Box>

       </Box>

    </Box>
  );
}

export default MainLayout;
