import { useState } from "react";
import { Box } from "@mui/material";

import Sidebar from "@/apps/telecalling/components/sidebar/Sidebar";
import Navbar from "@/apps/telecalling/components/navbar/Navbar";
import { LeadBadgeProvider } from "@/shared/context/LeadBadgeContext";
import { Outlet } from "react-router-dom";
function MainLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
<LeadBadgeProvider>
    <Box
      sx={{
        display: "flex",
        height: { xs: "100vh", md: "calc(100vh - 20px)" },
        overflow: "hidden",
        boxSizing: 'border-box',
        mt: { xs: 0, md: 1 },
        mr: { xs: 0, md: 1 }
      }}
    >

      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

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
        
      <Navbar onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} />

              <Box
          sx={{
            background: "#F1F1F1",
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            p: { xs: 1.5, sm: 2 },
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
    </LeadBadgeProvider>
  );
}

export default MainLayout;
