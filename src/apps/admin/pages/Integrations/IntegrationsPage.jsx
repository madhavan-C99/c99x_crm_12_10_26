import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Chip,
  Snackbar,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
} from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CableIcon from "@mui/icons-material/Cable";
import RefreshIcon from "@mui/icons-material/Refresh";

import FacebookConnectDialog from "@/apps/admin/components/integrations/FacebookConnectDialog";
import ConnectedList from "@/apps/admin/components/integrations/ConnectedList";

import GoogleFormsConnectDialog, {
  GoogleFormsIcon,
} from "@/apps/admin/components/integrations/googleForms/GoogleFormsConnectDialog";
import GoogleFormsTable from "@/apps/admin/components/integrations/googleForms/GoogleFormsTable";

import GoogleSheetsConnectDialog, {
  GoogleSheetsIcon,
} from "@/apps/admin/components/integrations/googleSheets/GoogleSheetsConnectDialog";
import GoogleSheetsTable from "@/apps/admin/components/integrations/googleSheets/GoogleSheetsTable";

import WhatsAppConnectDialog, {
  WhatsAppIcon,
} from "@/apps/admin/components/integrations/whatsapp/WhatsAppConnectDialog";
import WhatsAppTable from "@/apps/admin/components/integrations/whatsapp/WhatsAppTable";

import {
  getConnections,
  deleteConnection,
} from "@/apps/admin/services/integrationsApi";
import {
  getGoogleConnections,
  deleteGoogleConnection,
} from "@/apps/admin/services/googleFormsApi";
import {
  getGoogleSheetConnections,
  deleteGoogleSheetConnection,
} from "@/apps/admin/services/googleSheetsApi";
import {
  getWhatsAppConnections,
  deleteWhatsAppConnection,
} from "@/apps/admin/services/whatsappApi";
import { extractErrorMessage } from "@/apps/admin/utils/errorUtils";

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState("browse"); // "browse" | "connected"
  const [connectedFilter, setConnectedFilter] = useState("all"); // "all" | "sheets" | "google" | "facebook" | "whatsapp"

  // Facebook Connections State
  const [facebookConnections, setFacebookConnections] = useState([]);
  const [facebookLoading, setFacebookLoading] = useState(true);
  const [isFacebookWizardOpen, setIsFacebookWizardOpen] = useState(false);
  const [lastConnectedFbId, setLastConnectedFbId] = useState(null);

  // Google Forms Connections State
  const [googleConnections, setGoogleConnections] = useState([]);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [googleError, setGoogleError] = useState(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [viewCodeConnection, setViewCodeConnection] = useState(null);

  // Google Sheets Connections State
  const [googleSheetConnections, setGoogleSheetConnections] = useState([]);
  const [googleSheetLoading, setGoogleSheetLoading] = useState(true);
  const [googleSheetError, setGoogleSheetError] = useState(null);
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);
  const [viewCodeSheetConnection, setViewCodeSheetConnection] = useState(null);

  // WhatsApp Connections State
  const [whatsappConnections, setWhatsappConnections] = useState([]);
  const [whatsappLoading, setWhatsappLoading] = useState(true);
  const [isWhatsAppWizardOpen, setIsWhatsAppWizardOpen] = useState(false);

  // Toast Snackbar State
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  // Load existing connections on mount
  useEffect(() => {
    loadFacebookConnections();
    loadGoogleConnections();
    loadGoogleSheetConnections();
    loadWhatsAppConnections();
  }, []);

  // Live reload connections when switching to "connected" tab
  useEffect(() => {
    if (activeTab === "connected") {
      loadWhatsAppConnections();
      loadFacebookConnections();
      loadGoogleConnections();
      loadGoogleSheetConnections();
    }
  }, [activeTab]);

  // Facebook loader
  const loadFacebookConnections = async () => {
    setFacebookLoading(true);
    try {
      const data = await getConnections();
      setFacebookConnections(data || []);
    } catch (err) {
      console.error("Failed to load Facebook connections:", err);
    } finally {
      setFacebookLoading(false);
    }
  };

  // Google Forms loader
  const loadGoogleConnections = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const data = await getGoogleConnections();
      setGoogleConnections(data || []);
    } catch (err) {
      console.error("Failed to load Google Forms connections:", err);
      setGoogleError(
        extractErrorMessage(
          err,
          "Failed to load Google Forms connections. Please try again."
        )
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  // WhatsApp loader
  const loadWhatsAppConnections = async () => {
    setWhatsappLoading(true);
    try {
      const data = await getWhatsAppConnections();
      // Strictly filter active connections only (exclude pending / incomplete)
      const activeConnections = (data || []).filter(
        (item) => item?.status === "active" || item?.is_connected === true
      );
      setWhatsappConnections(activeConnections);
    } catch (err) {
      console.error("Failed to load WhatsApp connections:", err);
    } finally {
      setWhatsappLoading(false);
    }
  };

  // On Facebook Connection Created
  const handleFacebookSuccess = (newConn) => {
    if (newConn?.id) {
      setLastConnectedFbId(newConn.id);
    }
    loadFacebookConnections();
    setActiveTab("connected");
    setConnectedFilter("facebook");
    showToast("Facebook Page connected successfully!");
  };

  // On Facebook Connection Deleted
  const handleFacebookDisconnect = async (connId) => {
    try {
      await deleteConnection(connId);
      showToast("Page disconnected.", "info");
      await loadFacebookConnections();
    } catch (err) {
      console.error("Disconnect error:", err);
      showToast(extractErrorMessage(err, "Failed to disconnect page."), "error");
    }
  };

  // On Google Form Connection Created
  const handleGoogleSuccess = (newConn, isDone = false) => {
    loadGoogleConnections();
    if (isDone) {
      setActiveTab("connected");
      setConnectedFilter("google");
      showToast("Google Form connected successfully!");
    }
  };

  // On Google Form Deleted
  const handleGoogleDelete = async (connId) => {
    try {
      await deleteGoogleConnection(connId);
      showToast("Google Form disconnected successfully.", "info");
      await loadGoogleConnections();
    } catch (err) {
      console.error("Delete Google connection error:", err);
      showToast(
        extractErrorMessage(err, "Failed to disconnect Google Form."),
        "error"
      );
    }
  };

  // Google Sheets loader
  const loadGoogleSheetConnections = async () => {
    setGoogleSheetLoading(true);
    setGoogleSheetError(null);
    try {
      const data = await getGoogleSheetConnections();
      setGoogleSheetConnections(data || []);
    } catch (err) {
      console.error("Failed to load Google Sheets connections:", err);
      setGoogleSheetError(
        extractErrorMessage(
          err,
          "Failed to load Google Sheets connections. Please try again."
        )
      );
    } finally {
      setGoogleSheetLoading(false);
    }
  };

  // On Google Sheet Connection Created
  const handleGoogleSheetSuccess = (newConn, isDone = false) => {
    loadGoogleSheetConnections();
    if (isDone) {
      setActiveTab("connected");
      setConnectedFilter("sheets");
      showToast("Google Sheet connected successfully!");
    }
  };

  // On Google Sheet Deleted
  const handleGoogleSheetDelete = async (connId) => {
    try {
      await deleteGoogleSheetConnection(connId);
      setGoogleSheetConnections((prev) =>
        prev.filter((c) => String(c.id) !== String(connId) && String(c.uid) !== String(connId))
      );
      showToast("Google Sheet disconnected successfully.", "info");
      await loadGoogleSheetConnections();
    } catch (err) {
      console.error("Delete Google Sheet connection error:", err);
      showToast(
        extractErrorMessage(err, "Failed to disconnect Google Sheet."),
        "error"
      );
    }
  };

  // Open "View Code" for a Google Sheet
  const handleViewSheetCode = (conn) => {
    setViewCodeSheetConnection(conn);
    setIsGoogleSheetModalOpen(true);
  };

  // On WhatsApp Connection Created
  const handleWhatsAppSuccess = () => {
    loadWhatsAppConnections();
    setActiveTab("connected");
    setConnectedFilter("whatsapp");
    showToast(
      "Connection URL generated! Connect via Chrome Extension to activate.",
      "info"
    );
  };

  // On WhatsApp Connection Deleted
  const handleWhatsAppDelete = async (connId) => {
    try {
      await deleteWhatsAppConnection(connId);
      setWhatsappConnections((prev) =>
        prev.filter((c) => String(c.id) !== String(connId))
      );
      showToast("WhatsApp connection deleted successfully.", "info");
      await loadWhatsAppConnections();
    } catch (err) {
      console.error("Delete WhatsApp connection error:", err);
      showToast(
        extractErrorMessage(err, "Failed to delete WhatsApp connection."),
        "error"
      );
    }
  };

  // Open "View Code" for a Google Form
  const handleViewCode = (conn) => {
    setViewCodeConnection(conn);
    setIsGoogleModalOpen(true);
  };

  // Counts
  const totalConnectedCount =
    facebookConnections.length +
    googleConnections.length +
    googleSheetConnections.length +
    whatsappConnections.length;

  const isInitialLoading =
    facebookLoading && googleLoading && googleSheetLoading && whatsappLoading;

  return (
    <Box sx={{ width: "100%", maxWidth: "1280px", mx: "auto", pb: 5 }}>
      {/* Toast Notification Pop-up */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ top: "25px !important" }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            backgroundColor: "#FFFFFF",
            color: "#0F172A",
            px: 2.5,
            py: 1.2,
            borderRadius: "50px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
            border: "1px solid #E2E8F0",
            borderBottom:
              toast.severity === "error"
                ? "3px solid #EF4444"
                : "3px solid #84CC16",
          }}
        >
          <CheckCircleIcon
            sx={{
              color: toast.severity === "error" ? "#EF4444" : "#84CC16",
              fontSize: 22,
            }}
          />
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#0F172A",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {toast.message}
          </Typography>
        </Box>
      </Snackbar>

      {/* Header Section */}
      <Box sx={{ mb: 2.5 }}>
        <Typography
          sx={{
            fontSize: "17px",
            fontWeight: 600,
            color: "#0F172A",
            fontFamily: "Inter, sans-serif",
            mb: 0.3,
          }}
        >
          Integrations
        </Typography>
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 400,
            color: "#64748B",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Connect external advertising platforms, Google Forms, WhatsApp and social
          channels to automate lead generation and instant synchronization.
        </Typography>
      </Box>

      {/* Navigation Tabs (Browse / Connected (n)) */}
      <Box sx={{ borderBottom: "1px solid #E2E8F0", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            "& .MuiTabs-indicator": {
              backgroundColor: "#84CC16",
              height: "2.5px",
              borderRadius: "2px",
            },
          }}
        >
          <Tab
            value="browse"
            label="Browse"
            sx={{
              textTransform: "none",
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
              fontWeight: activeTab === "browse" ? 600 : 500,
              color: activeTab === "browse" ? "#84CC16" : "#64748B",
              minHeight: "40px",
              py: 0.8,
              "&.Mui-selected": { color: "#84CC16" },
            }}
          />
          <Tab
            value="connected"
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span>Connected</span>
                <Chip
                  label={totalConnectedCount}
                  size="small"
                  sx={{
                    height: 20,
                    minWidth: 20,
                    fontSize: "11px",
                    fontWeight: 700,
                    fontFamily: "Inter, sans-serif",
                    backgroundColor:
                      activeTab === "connected" ? "#84CC16" : "#FFFFFF",
                    color: activeTab === "connected" ? "#FFFFFF" : "#84CC16",
                    border: "1px solid #84CC16",
                  }}
                />
              </Box>
            }
            sx={{
              textTransform: "none",
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
              fontWeight: activeTab === "connected" ? 600 : 500,
              color: activeTab === "connected" ? "#84CC16" : "#64748B",
              minHeight: "40px",
              py: 0.8,
              "&.Mui-selected": { color: "#84CC16" },
            }}
          />
        </Tabs>
      </Box>

      {/* ========================================================= */}
      {/* TAB 1: BROWSE                                             */}
      {/* ========================================================= */}
      {activeTab === "browse" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
          <Box>
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                mb: 2,
              }}
            >
              Lead Sources &amp; Form Ingestion
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 2.5,
                width: "100%",
              }}
            >
              {/* 1. Facebook & Instagram Integration Card */}
              <Paper
                elevation={0}
                onClick={() => setIsFacebookWizardOpen(true)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsFacebookWizardOpen(true);
                  }
                }}
                sx={{
                  p: 2.5,
                  height: "100%",
                  minHeight: "210px",
                  borderRadius: "14px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 2,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: "#84CC16",
                    boxShadow: "0 8px 24px -4px rgba(132, 204, 22, 0.12)",
                    transform: "translateY(-2px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid #84CC16",
                    outlineOffset: "2px",
                  },
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {/* Overlapping Brand Icons */}
                  <Box sx={{ position: "relative", width: 44, height: 44 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: "#1877F2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 6px rgba(24, 119, 242, 0.25)",
                      }}
                    >
                      <FacebookIcon sx={{ color: "#FFFFFF", fontSize: 22 }} />
                    </Box>
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid #FFFFFF",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                      }}
                    >
                      <InstagramIcon sx={{ color: "#FFFFFF", fontSize: 14 }} />
                    </Box>
                  </Box>

                  {/* Card Body */}
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography
                      sx={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#0F172A",
                        mb: 0.5,
                        minHeight: "24px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      Facebook &amp; Instagram
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "13px",
                        color: "#64748B",
                        lineHeight: 1.5,
                        minHeight: "40px",
                      }}
                    >
                      Capture leads from Meta Lead Ads and Instant Forms
                    </Typography>
                  </Box>
                </Box>

                {/* Card Action Link */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    pt: 1.5,
                    borderTop: "1px solid #F1F5F9",
                    minHeight: "36px",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#84CC16",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    Connect a Page
                    <ArrowForwardIcon sx={{ fontSize: 15 }} />
                  </Typography>

                  {facebookConnections.length > 0 && (
                    <Chip
                      label={`${facebookConnections.length} active`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "10px",
                        fontWeight: 700,
                        backgroundColor: "#E9F6D4",
                        color: "#3A6B00",
                      }}
                    />
                  )}
                </Box>
              </Paper>

              {/* 2. Google Forms Integration Card */}
              <Paper
                elevation={0}
                onClick={() => {
                  setViewCodeConnection(null);
                  setIsGoogleModalOpen(true);
                }}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setViewCodeConnection(null);
                    setIsGoogleModalOpen(true);
                  }
                }}
                sx={{
                  p: 2.5,
                  height: "100%",
                  minHeight: "210px",
                  borderRadius: "14px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 2,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: "#7248B9",
                    boxShadow: "0 8px 24px -4px rgba(114, 72, 185, 0.15)",
                    transform: "translateY(-2px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid #7248B9",
                    outlineOffset: "2px",
                  },
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {/* Google Forms Logo Container */}
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      backgroundColor: "#F3E8FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #E9D5FF",
                      boxShadow: "0 2px 6px rgba(114, 72, 185, 0.15)",
                    }}
                  >
                    <GoogleFormsIcon size={26} />
                  </Box>

                  {/* Card Body */}
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography
                      sx={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#0F172A",
                        mb: 0.5,
                        minHeight: "24px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      Google Forms
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "13px",
                        color: "#64748B",
                        lineHeight: 1.5,
                        minHeight: "40px",
                      }}
                    >
                      Capture Google Form responses as leads automatically
                    </Typography>
                  </Box>
                </Box>

                {/* Card Action Link */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    pt: 1.5,
                    borderTop: "1px solid #F1F5F9",
                    minHeight: "36px",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#7248B9",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    Connect Now
                    <ArrowForwardIcon sx={{ fontSize: 15 }} />
                  </Typography>

                  {googleConnections.length > 0 && (
                    <Chip
                      label={`${googleConnections.length} active`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "10px",
                        fontWeight: 700,
                        backgroundColor: "#F3E8FF",
                        color: "#6B21A8",
                      }}
                    />
                  )}
                </Box>
              </Paper>

              {/* 3. Google Sheets Integration Card */}
              <Paper
                elevation={0}
                onClick={() => {
                  setViewCodeSheetConnection(null);
                  setIsGoogleSheetModalOpen(true);
                }}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setViewCodeSheetConnection(null);
                    setIsGoogleSheetModalOpen(true);
                  }
                }}
                sx={{
                  p: 2.5,
                  height: "100%",
                  minHeight: "210px",
                  borderRadius: "14px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 2,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: "#0F9D58",
                    boxShadow: "0 8px 24px -4px rgba(15, 157, 88, 0.15)",
                    transform: "translateY(-2px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid #0F9D58",
                    outlineOffset: "2px",
                  },
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {/* Google Sheets Logo Container */}
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      backgroundColor: "#E6F4EA",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #CEEAD6",
                      boxShadow: "0 2px 6px rgba(15, 157, 88, 0.15)",
                    }}
                  >
                    <GoogleSheetsIcon size={26} />
                  </Box>

                  {/* Card Body */}
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography
                      sx={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#0F172A",
                        mb: 0.5,
                        minHeight: "24px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      Google Sheets
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "13px",
                        color: "#64748B",
                        lineHeight: 1.5,
                        minHeight: "40px",
                      }}
                    >
                      Stream new spreadsheet rows as CRM leads automatically
                    </Typography>
                  </Box>
                </Box>

                {/* Card Action Link */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    pt: 1.5,
                    borderTop: "1px solid #F1F5F9",
                    minHeight: "36px",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#0F9D58",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    Connect Now
                    <ArrowForwardIcon sx={{ fontSize: 15 }} />
                  </Typography>

                  {googleSheetConnections.length > 0 && (
                    <Chip
                      label={`${googleSheetConnections.length} active`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "10px",
                        fontWeight: 700,
                        backgroundColor: "#E6F4EA",
                        color: "#137333",
                      }}
                    />
                  )}
                </Box>
              </Paper>

              {/* 4. WhatsApp Integration Card */}
              <Paper
                elevation={0}
                onClick={() => setIsWhatsAppWizardOpen(true)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsWhatsAppWizardOpen(true);
                  }
                }}
                sx={{
                  p: 2.5,
                  height: "100%",
                  minHeight: "210px",
                  borderRadius: "14px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 2,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: "#25D366",
                    boxShadow: "0 8px 24px -4px rgba(37, 211, 102, 0.15)",
                    transform: "translateY(-2px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid #25D366",
                    outlineOffset: "2px",
                  },
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {/* WhatsApp Logo Container */}
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      backgroundColor: "#DCFCE7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #BBF7D0",
                      boxShadow: "0 2px 6px rgba(37, 211, 102, 0.15)",
                    }}
                  >
                    <WhatsAppIcon size={26} />
                  </Box>

                  {/* Card Body */}
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography
                      sx={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#0F172A",
                        mb: 0.5,
                        minHeight: "24px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      WhatsApp
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "13px",
                        color: "#64748B",
                        lineHeight: 1.5,
                        minHeight: "40px",
                      }}
                    >
                      Capture WhatsApp leads into your CRM using the Chrome extension.
                    </Typography>
                  </Box>
                </Box>

                {/* Card Action Link */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    pt: 1.5,
                    borderTop: "1px solid #F1F5F9",
                    minHeight: "36px",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#16A34A",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    Connect WhatsApp
                    <ArrowForwardIcon sx={{ fontSize: 15 }} />
                  </Typography>

                  {whatsappConnections.length > 0 && (
                    <Chip
                      label={`${whatsappConnections.length} active`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "10px",
                        fontWeight: 700,
                        backgroundColor: "#DCFCE7",
                        color: "#166534",
                      }}
                    />
                  )}
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CONNECTED                                          */}
      {/* ========================================================= */}
      {activeTab === "connected" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {isInitialLoading ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <Skeleton variant="rounded" height={36} width={340} sx={{ borderRadius: "20px" }} />
              <Skeleton variant="rounded" height={160} sx={{ borderRadius: "14px" }} />
            </Box>
          ) : totalConnectedCount === 0 ? (
            /* Single Clean Empty State when NOTHING is connected */
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, sm: 6 },
                borderRadius: "16px",
                border: "1px dashed #CBD5E1",
                backgroundColor: "#F8FAFC",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                my: 2,
              }}
            >
              <Box
                sx={{
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  backgroundColor: "#E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <CableIcon sx={{ fontSize: 30, color: "#64748B" }} />
              </Box>
              <Typography
                sx={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#0F172A",
                  fontFamily: "Inter, sans-serif",
                  mb: 0.6,
                }}
              >
                No integrations connected yet
              </Typography>
              <Typography
                sx={{
                  fontSize: "13px",
                  color: "#64748B",
                  fontFamily: "Inter, sans-serif",
                  maxWidth: "440px",
                  mb: 3,
                  lineHeight: 1.5,
                }}
              >
                You haven&apos;t connected any external channels yet. Connect Facebook Lead Ads, Google Forms, Google Sheets, or WhatsApp to automatically stream leads into your CRM pipelines.
              </Typography>
              <Button
                variant="contained"
                onClick={() => setActiveTab("browse")}
                sx={{
                  textTransform: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  backgroundColor: "#84CC16",
                  color: "#FFFFFF",
                  borderRadius: "8px",
                  px: 3,
                  py: 0.9,
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "#65A30D",
                    boxShadow: "none",
                  },
                }}
              >
                Browse Integrations
              </Button>
            </Paper>
          ) : (
            <>
              {/* Sub-filter chips: All | Google Sheets | Google Forms | Facebook | WhatsApp */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={`All (${totalConnectedCount})`}
                  onClick={() => setConnectedFilter("all")}
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    fontSize: "12px",
                    borderRadius: "20px",
                    backgroundColor:
                      connectedFilter === "all" ? "#0F172A" : "#F1F5F9",
                    color: connectedFilter === "all" ? "#FFFFFF" : "#475569",
                    "&:hover": {
                      backgroundColor:
                        connectedFilter === "all" ? "#1E293B" : "#E2E8F0",
                    },
                  }}
                />
                <Chip
                  icon={
                    <Box sx={{ display: "flex", pl: 0.5 }}>
                      <GoogleSheetsIcon size={16} />
                    </Box>
                  }
                  label={`Google Sheets (${googleSheetConnections.length})`}
                  onClick={() => setConnectedFilter("sheets")}
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    fontSize: "12px",
                    borderRadius: "20px",
                    backgroundColor:
                      connectedFilter === "sheets" ? "#0F9D58" : "#F1F5F9",
                    color:
                      connectedFilter === "sheets" ? "#FFFFFF" : "#475569",
                    "& .MuiChip-icon": { color: "inherit" },
                    "&:hover": {
                      backgroundColor:
                        connectedFilter === "sheets" ? "#0B8043" : "#E2E8F0",
                    },
                  }}
                />
                <Chip
                  icon={
                    <Box sx={{ display: "flex", pl: 0.5 }}>
                      <GoogleFormsIcon size={16} />
                    </Box>
                  }
                  label={`Google Forms (${googleConnections.length})`}
                  onClick={() => setConnectedFilter("google")}
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    fontSize: "12px",
                    borderRadius: "20px",
                    backgroundColor:
                      connectedFilter === "google" ? "#7248B9" : "#F1F5F9",
                    color:
                      connectedFilter === "google" ? "#FFFFFF" : "#475569",
                    "& .MuiChip-icon": { color: "inherit" },
                    "&:hover": {
                      backgroundColor:
                        connectedFilter === "google" ? "#583196" : "#E2E8F0",
                    },
                  }}
                />
                <Chip
                  icon={
                    <FacebookIcon
                      sx={{
                        fontSize: 16,
                        color:
                          connectedFilter === "facebook" ? "#FFFFFF" : "#1877F2",
                      }}
                    />
                  }
                  label={`Facebook & Instagram (${facebookConnections.length})`}
                  onClick={() => setConnectedFilter("facebook")}
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    fontSize: "12px",
                    borderRadius: "20px",
                    backgroundColor:
                      connectedFilter === "facebook" ? "#1877F2" : "#F1F5F9",
                    color:
                      connectedFilter === "facebook" ? "#FFFFFF" : "#475569",
                    "& .MuiChip-icon": { color: "inherit" },
                    "&:hover": {
                      backgroundColor:
                        connectedFilter === "facebook" ? "#1664D9" : "#E2E8F0",
                    },
                  }}
                />
                <Chip
                  icon={
                    <Box sx={{ display: "flex", pl: 0.5 }}>
                      <WhatsAppIcon size={16} />
                    </Box>
                  }
                  label={`WhatsApp (${whatsappConnections.length})`}
                  onClick={() => setConnectedFilter("whatsapp")}
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    fontSize: "12px",
                    borderRadius: "20px",
                    backgroundColor:
                      connectedFilter === "whatsapp" ? "#25D366" : "#F1F5F9",
                    color:
                      connectedFilter === "whatsapp" ? "#FFFFFF" : "#475569",
                    "& .MuiChip-icon": { color: "inherit" },
                    "&:hover": {
                      backgroundColor:
                        connectedFilter === "whatsapp" ? "#1EA952" : "#E2E8F0",
                    },
                  }}
                />
              </Box>

              {/* SECTION A: GOOGLE FORMS CONNECTIONS */}
              {(connectedFilter === "google" || (connectedFilter === "all" && googleConnections.length > 0)) && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <GoogleFormsIcon size={20} />
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#0F172A",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        Google Forms Connections
                      </Typography>
                      <Chip
                        label={googleConnections.length}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "11px",
                          fontWeight: 700,
                          backgroundColor: "#F3E8FF",
                          color: "#6B21A8",
                        }}
                      />
                    </Box>
                  </Box>

                  <GoogleFormsTable
                    connections={googleConnections}
                    loading={googleLoading}
                    error={googleError}
                    onRetry={loadGoogleConnections}
                    onOpenConnect={() => {
                      setViewCodeConnection(null);
                      setIsGoogleModalOpen(true);
                    }}
                    onViewCode={handleViewCode}
                    onDelete={handleGoogleDelete}
                  />
                </Box>
              )}

              {/* SECTION B: GOOGLE SHEETS CONNECTIONS */}
              {(connectedFilter === "sheets" || (connectedFilter === "all" && googleSheetConnections.length > 0)) && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    mt: connectedFilter === "all" ? 1 : 0,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <GoogleSheetsIcon size={20} />
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#0F172A",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        Google Sheets Connections
                      </Typography>
                      <Chip
                        label={googleSheetConnections.length}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "11px",
                          fontWeight: 700,
                          backgroundColor: "#E6F4EA",
                          color: "#137333",
                        }}
                      />
                    </Box>
                    <Tooltip title="Refresh Google Sheets connections">
                      <IconButton
                        size="small"
                        onClick={loadGoogleSheetConnections}
                        disabled={googleSheetLoading}
                        sx={{ color: "#64748B", "&:hover": { color: "#0F9D58" } }}
                      >
                        <RefreshIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <GoogleSheetsTable
                    connections={googleSheetConnections}
                    loading={googleSheetLoading}
                    error={googleSheetError}
                    onRetry={loadGoogleSheetConnections}
                    onOpenConnect={() => {
                      setViewCodeSheetConnection(null);
                      setIsGoogleSheetModalOpen(true);
                    }}
                    onViewCode={handleViewSheetCode}
                    onDelete={handleGoogleSheetDelete}
                  />
                </Box>
              )}

              {/* SECTION C: FACEBOOK & INSTAGRAM CONNECTIONS */}
              {(connectedFilter === "facebook" || (connectedFilter === "all" && facebookConnections.length > 0)) && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    mt: connectedFilter === "all" ? 1 : 0,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <FacebookIcon sx={{ color: "#1877F2", fontSize: 20 }} />
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#0F172A",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        Facebook &amp; Instagram Pages
                      </Typography>
                      <Chip
                        label={facebookConnections.length}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "11px",
                          fontWeight: 700,
                          backgroundColor: "#E9F6D4",
                          color: "#3A6B00",
                        }}
                      />
                    </Box>
                  </Box>

                  {facebookLoading ? (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                    >
                      <Skeleton
                        variant="rounded"
                        height={60}
                        sx={{ borderRadius: "10px" }}
                      />
                    </Box>
                  ) : (
                    <ConnectedList
                      connections={facebookConnections}
                      onDisconnect={handleFacebookDisconnect}
                      onOpenWizard={() => setIsFacebookWizardOpen(true)}
                      expandedConnectionId={lastConnectedFbId}
                    />
                  )}
                </Box>
              )}

              {/* SECTION D: WHATSAPP CONNECTIONS */}
              {(connectedFilter === "whatsapp" || (connectedFilter === "all" && whatsappConnections.length > 0)) && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    mt: connectedFilter === "all" ? 1 : 0,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <WhatsAppIcon size={20} />
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#0F172A",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        WhatsApp Connections
                      </Typography>
                      <Chip
                        label={whatsappConnections.length}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "11px",
                          fontWeight: 700,
                          backgroundColor: "#DCFCE7",
                          color: "#166534",
                        }}
                      />
                    </Box>
                    <Tooltip title="Refresh WhatsApp connections status">
                      <IconButton
                        size="small"
                        onClick={loadWhatsAppConnections}
                        disabled={whatsappLoading}
                        sx={{ color: "#64748B", "&:hover": { color: "#16A34A" } }}
                      >
                        <RefreshIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <WhatsAppTable
                    connections={whatsappConnections}
                    loading={whatsappLoading}
                    onOpenConnect={() => setIsWhatsAppWizardOpen(true)}
                    onDelete={handleWhatsAppDelete}
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      {/* Facebook & Instagram Connect Wizard Dialog */}
      <FacebookConnectDialog
        open={isFacebookWizardOpen}
        onClose={() => setIsFacebookWizardOpen(false)}
        existingConnections={facebookConnections}
        onConnectionSuccess={handleFacebookSuccess}
      />

      {/* Google Forms Connect & Instructions Dialog */}
      <GoogleFormsConnectDialog
        open={isGoogleModalOpen}
        onClose={() => {
          setIsGoogleModalOpen(false);
          setViewCodeConnection(null);
        }}
        onSuccess={handleGoogleSuccess}
        viewCodeConnection={viewCodeConnection}
      />

      {/* Google Sheets Connect & Instructions Dialog */}
      <GoogleSheetsConnectDialog
        open={isGoogleSheetModalOpen}
        onClose={() => {
          setIsGoogleSheetModalOpen(false);
          setViewCodeSheetConnection(null);
        }}
        onSuccess={handleGoogleSheetSuccess}
        viewCodeConnection={viewCodeSheetConnection}
      />

      {/* WhatsApp Connect Dialog */}
      <WhatsAppConnectDialog
        open={isWhatsAppWizardOpen}
        onClose={() => setIsWhatsAppWizardOpen(false)}
        onSuccess={handleWhatsAppSuccess}
      />
    </Box>
  );
}
