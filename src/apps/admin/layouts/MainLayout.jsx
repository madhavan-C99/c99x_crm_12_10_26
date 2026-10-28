import React, { Suspense } from "react";
import { Box } from "@mui/material";
import Sidebar from "@/apps/admin/layouts/Sidebar";
import Navbar from "@/apps/admin/layouts/Navbar";
import PageLoader from "@/shared/components/layout/PageLoader";
import { Outlet } from "react-router-dom";

function MainLayout() {
  return (
    <Box
      sx={{
        display: "flex",
        height: "calc(100vh - 20px)",
        overflow: "hidden",
        boxSizing: "border-box",
        mt: 1,
        mr: 1,
      }}
    >
      {/* 1. SIDEBAR - ALWAYS VISIBLE */}
      <Sidebar />

      {/* 2. MAIN CONTENT AREA */}
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
        {/* NAVBAR - ALWAYS VISIBLE */}
        <Navbar />

        {/* 3. PAGE CONTENT (Outlet) - 100% FULL WIDTH */}
        <Box
          sx={{
            background: "#F1F1F1",
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            pt: 5,
            pl: 3.8,
            boxSizing: "border-box",
            width: "100%",
            scrollbarWidth: "none",
          }}
        >
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </Box>
      </Box>
    </Box>
  );
}

export default MainLayout;
