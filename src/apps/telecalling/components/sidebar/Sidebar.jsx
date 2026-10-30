import { Badge,Box, Drawer,Tooltip, useMediaQuery } from "@mui/material";

import logo from "@/shared/assets/logo.webp";
import dashboard_img from "@/apps/telecalling/assets/sidebar/dashboard.png";
import pipeline_img from "@/apps/telecalling/assets/sidebar/pipeline.png";
import payment_img from "@/apps/telecalling/assets/sidebar/payment.png";
import lead_img from "@/apps/telecalling/assets/sidebar/lead.png";
import report_img from "@/apps/telecalling/assets/sidebar/report.png";
import Close from "@mui/icons-material/Close";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import HelpRounded from "@mui/icons-material/HelpRounded";

import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import { useAuth } from "@/shared/context/AuthContext";
import { useLeadBadge } from "@/apps/telecalling/context/LeadBadgeContext";



const tooltipSlotProps = {
  tooltip: {
    sx: {
      bgcolor: "#1E293B",
      color: "#fff",
      fontSize: "13px",
      fontWeight: 600,
      px: 1.5,
      py: 0.75,
      borderRadius: "8px",
    },
  },
  arrow: { sx: { color: "#1E293B" } },
};


function Sidebar({ mobileOpen, onMobileClose }) {
    //lead badget context
    const { count: pipelineBadge } = useLeadBadge();


    const location = useLocation();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();

    // 🔥 RESPONSIVE CHECK
    const isMobile = useMediaQuery("(max-width:900px)");
    // 🔥 MOBILE DRAWER STATE (supports controlled via props or internal fallback)
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = mobileOpen !== undefined ? mobileOpen : internalOpen;
    const handleClose = () => {
        if (mobileOpen !== undefined) {
            onMobileClose?.();
        } else {
            setInternalOpen(false);
        }
    };

const topMenus = [
  { img: dashboard_img, label: "Dashboard", path: "/telecalling/dashboard", permission: "api_dashboard_top_tile" },
  { img: pipeline_img,  label: "Pipeline",  path: "/telecalling/pipeline",  permission: "api_fetch_pipeline_lead" },
  { img: payment_img,   label: "Pending Payments", path: "/telecalling/pending-payments", permission: "api_fetch_all_payment" },
  { img: lead_img,      label: "Leads",     path: "/telecalling/lead",      permission: "api_fetch_all_leads" },
  { img: report_img,    label: "Reports",   path: "/telecalling/report",    permission: "api_daily_report_api" },
];

const bottomMenus = [
  { icon: <SettingsRounded />, label: "Settings", path: "/telecalling/settings" },
  { icon: <HelpRounded />,     label: "Help",     path: "/telecalling/help" },
];

    const visibleTopMenus = topMenus.filter(
        (item) => !item.permission || hasPermission(item.permission)
    );

    const visibleBottomMenus = bottomMenus.filter(
        (item) => !item.permission || hasPermission(item.permission)
    );

    // 🔥 SIDEBAR CONTENT
    const sidebarContent = (
        <Box
            sx={{
                width: "76px",
                height: {
                    xs: "100vh",
                    md: "calc(100vh - 20px)",
                },
                background: "#000000",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderTopLeftRadius: {
                    xs: 0,
                    md: "25px",
                },
                borderBottomLeftRadius: {
                    xs: 0,
                    md: "25px",
                },
                mt: {
                    xs: 0,
                    md: "0px",
                },
                ml: {
                    xs: 0,
                    md: "10px",
                },
            }}
        >

            {/* TOP SECTION */}
            <Box>

                {/* LOGO */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        borderBottom: "1px solid grey",
                        paddingBottom: 0.5,
                    }}
                >
                    <img
                        src={logo}
                        alt="logo"
                        style={{
                            width: "51.09px",
                            height: "51.39px",
                            objectFit: "contain",
                            marginTop: "14px",
                        }}
                    />
                </Box>

                {/* TOP MENUS */}
                <Box
                    sx={{
                        mt: 1.5,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                    }}
                >

                    {visibleTopMenus.map((item, index) => {

                        const isActive =
                            location.pathname === item.path ||
                            (item.path === "/pipeline" &&
                                location.pathname.startsWith("/lead-details"));
                        return (
                        <Tooltip
                                key={index}
                                title={item.label}
                                placement="right"
                                arrow
                                slotProps={tooltipSlotProps}
                                disableHoverListener={isMobile}
                                disableTouchListener
                                >
                            <Box
                                
                                onClick={() => {
                                        if (item.path === "/telecalling/pipeline") {
                                            const activeCallLeadId = localStorage.getItem("activeCallLeadId");
                                            if (activeCallLeadId) {
                                                navigate(`/telecalling/lead-details/${activeCallLeadId}`);
                                            } else {
                                                navigate("/telecalling/pipeline");
                                            }
                                        } else {
                                            navigate(item.path);
                                        }

                                        if (isMobile) {
                                            handleClose();
                                        }
                                    }}
                                sx={{
                                    height: "32px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",

                                    borderRight:
                                        isActive
                                            ? "4px solid #B7E34A"
                                            : "4px solid transparent",

                                    background:
                                        isActive
                                            ? "#DDF5B5"
                                            : "transparent",
                                }}
                            >
                                {/* <img
                                    src={item.img}
                                    alt="menu"
                                    style={{
                                        width: "20px",
                                        height: "20px",
                                        objectFit: "contain",
                                        filter: isActive
                                            ? "none"
                                            : "invert(1)",
                                    }}
                                /> */}
                                <Badge
                                    badgeContent={item.path === "/telecalling/pipeline" ? pipelineBadge : 0}
                                    max={99}
                                    color="error"
                                    sx={{
                                        "& .MuiBadge-badge": {
                                            fontSize: "10px",
                                            height: "16px",
                                            minWidth: "16px",
                                            padding: "0 4px",
                                        },
                                    }}
                                >
                                    <img
                                        src={item.img}
                                        alt="menu"
                                        style={{
                                            width: "20px",
                                            height: "20px",
                                            objectFit: "contain",
                                            filter: isActive ? "none" : "invert(1)",
                                        }}
                                    />
                                </Badge>
                            </Box>
                            </Tooltip>
                        );
                    })}
                </Box>
            </Box>

            {/* BOTTOM MENUS */}
            <Box
                sx={{
                    mb: 6,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    borderTop: "1px solid grey",
                    p: 0,
                }}
            >
                {visibleBottomMenus.map((item, index) => {

                    const isActive = location.pathname === item.path;

                    return (
                            <Tooltip
                        key={index}
                        title={item.label}
                        placement="right"
                        arrow
                        slotProps={tooltipSlotProps}
                        disableHoverListener={isMobile}
                        disableTouchListener
                        >
                        <Box
                            key={index}
                            onClick={() => {
                                navigate(item.path);

                                if (isMobile) {
                                    handleClose();
                                }
                            }}
                            sx={{
                                height: "32px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",

                                cursor: "pointer",

                                borderRight:
                                    isActive
                                        ? "4px solid #B7E34A"
                                        : "4px solid transparent",

                                background:
                                    isActive
                                        ? "#DDF5B5"
                                        : "transparent",

                                color:
                                    isActive
                                        ? "#000"
                                        : "#fff",
                            }}
                        >
                            {item.icon}
                        </Box>
                        </Tooltip>
                    );
                })}
            </Box>

        </Box>
    );

    return (
        <>

            {/* 🔥 DESKTOP SIDEBAR */}
            <Box
                sx={{
                    display: {
                        xs: "none",
                        md: "flex",
                    },
                }}
            >
                {sidebarContent}
            </Box>

            {/* 🔥 MOBILE DRAWER */}
            <Drawer
                anchor="left"
                open={isOpen}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        background: "#000",
                        width: "76px",
                        boxShadow: "4px 0 24px rgba(0,0,0,0.4)",
                    },
                }}
            >
                {sidebarContent}
            </Drawer>
        </>
    );
}

export default Sidebar;
