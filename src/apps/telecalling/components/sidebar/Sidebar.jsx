import { Box, Drawer, useMediaQuery } from "@mui/material";

import logo from "@/shared/assets/logo.webp";
import dashboard_img from "@/shared/assets/sidebar/dashboard.png";
import pipeline_img from "@/shared/assets/sidebar/pipeline.png";
import payment_img from "@/shared/assets/sidebar/payment.png";
import lead_img from "@/shared/assets/sidebar/lead.png";
import report_img from "@/shared/assets/sidebar/report.png";
import Close from "@mui/icons-material/Close";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import HelpRounded from "@mui/icons-material/HelpRounded";

import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import { useAuth } from "@/shared/context/AuthContext";

function Sidebar() {

    const location = useLocation();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();

    // 🔥 RESPONSIVE CHECK
    const isMobile = useMediaQuery("(max-width:900px)");
    // 🔥 MOBILE DRAWER STATE
    const [openSidebar, setOpenSidebar] = useState(false);

    const topMenus = [
        {
            img: dashboard_img,
            path: "/telecalling/dashboard",
            permission: "api_dashboard_top_tile",
        },
        {
            img: pipeline_img,
            path: "/telecalling/pipeline",
            permission: "api_fetch_pipeline_lead",
        },
        {
            img: payment_img,
            path: "/telecalling/pending-payments",
            permission: "api_fetch_all_payment",
        },
        {
            img: lead_img,
            path: "/telecalling/lead",
            permission: "api_fetch_all_leads",
        },
        {
            img: report_img,
            path: "/telecalling/report",
            permission: "api_daily_report_api",
        },
    ];

    const bottomMenus = [
        {
            icon: <SettingsRounded />,
            path: "/telecalling/settings",
            permission: "api_get_all_settings_api",
        },
        {
            icon: <HelpRounded />,
            path: "/telecalling/help",
        },
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
                            <Box
                                key={index}
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
                                            setOpenSidebar(false);
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
                                <img
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
                                />
                            </Box>
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
                    p: 2,
                }}
            >
                {visibleBottomMenus.map((item, index) => {

                    const isActive = location.pathname === item.path;

                    return (
                        <Box
                            key={index}
                            onClick={() => {
                                navigate(item.path);

                                if (isMobile) {
                                    setOpenSidebar(false);
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
                open={openSidebar}
                onClose={() => setOpenSidebar(false)}
                PaperProps={{
                    sx: {
                        background: "transparent",
                        boxShadow: "none",
                    },
                }}
            >
                {sidebarContent}
            </Drawer>

            {/* 🔥 MOBILE MENU BUTTON */}

            {isMobile && (

                <Box
                    onClick={() => setOpenSidebar(!openSidebar)}
                    sx={{
                        position: "fixed",
                        top: 20,
                        left: openSidebar ? 86 : 15,

                        width: 40,
                        height: 40,

                        background: "#000",
                        color: "#fff",

                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",

                        borderRadius: "8px",

                        zIndex: 2500,

                        cursor: "pointer",

                        fontSize: "20px",
                        fontWeight: 700,
                    }}
                >
                    {openSidebar ? <Close /> : "☰"}
                </Box>
            )}

        </>
    );
}

export default Sidebar;
