import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Grid,
  Chip,
  Snackbar,
  Alert,
  Skeleton,
} from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import FacebookConnectDialog from "@/apps/admin/components/integrations/FacebookConnectDialog";
import ConnectedList from "@/apps/admin/components/integrations/ConnectedList";

import {
  getConnections,
  deleteConnection,
} from "@/apps/admin/services/integrationsApi";

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState("browse"); // "browse" | "connected"
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [lastConnectedId, setLastConnectedId] = useState(null);

  // Toast Snackbar State
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  // Load existing connections on mount
  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const data = await getConnections();
      setConnections(data || []);
    } catch (err) {
      console.error("Failed to load integrations connections:", err);
    } finally {
      setLoading(false);
    }
  };

  // On Connection Created
  const handleConnectionSuccess = (newConn) => {
    setConnections((prev) => [newConn, ...prev.filter((c) => c.id !== newConn.id)]);
    setLastConnectedId(newConn.id);
    setActiveTab("connected");
    showToast("Page connected successfully!");
  };

  // On Connection Deleted
  const handleDisconnect = async (connId) => {
    try {
      await deleteConnection(connId);
      setConnections((prev) => prev.filter((c) => c.id !== connId));
      showToast("Page disconnected.", "info");
    } catch (err) {
      console.error("Disconnect error:", err);
      showToast("Failed to disconnect page.", "error");
    }
  };

  const connectedCount = connections.length;

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
            sx={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}
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
          Connect external advertising platforms and social channels to automate
          lead generation and instant synchronization.
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
                  label={connectedCount}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "11px",
                    fontWeight: 700,
                    fontFamily: "Inter, sans-serif",
                    backgroundColor:
                      activeTab === "connected" ? "#84CC16" : "#F1F5F9",
                    color: activeTab === "connected" ? "#FFFFFF" : "#64748B",
                  }}
                />
              </Box>
            }
            sx={{
              textTransform: "none",
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
              fontWeight: activeTab === "connected" ? 600 : 500,
              color: activeTab === "connected" ? "#0F172A" : "#64748B",
              minHeight: "40px",
              py: 0.8,
              "&.Mui-selected": { color: "#0F172A" },
            }}
          />
        </Tabs>
      </Box>

      {/* TAB 1: BROWSE */}
      {activeTab === "browse" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Section: Social Media */}
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
              Social media
            </Typography>

            <Grid container spacing={2.5}>
              {/* Facebook & Instagram Integration Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  onClick={() => setIsWizardOpen(true)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsWizardOpen(true);
                    }
                  }}
                  sx={{
                    p: 2.5,
                    height: "100%",
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
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                  >
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
                        <InstagramIcon
                          sx={{ color: "#FFFFFF", fontSize: 14 }}
                        />
                      </Box>
                    </Box>

                    {/* Card Body */}
                    <Box>
                      <Typography
                        sx={{
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#0F172A",
                          mb: 0.5,
                        }}
                      >
                        Facebook &amp; Instagram
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "13px",
                          color: "#64748B",
                          lineHeight: 1.5,
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

                    {connectedCount > 0 && (
                      <Chip
                        label={`${connectedCount} active`}
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
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}

      {/* TAB 2: CONNECTED */}
      {activeTab === "connected" && (
        <Box>
          {loading ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Skeleton
                variant="rounded"
                height={60}
                sx={{ borderRadius: "10px" }}
              />
              <Skeleton
                variant="rounded"
                height={60}
                sx={{ borderRadius: "10px" }}
              />
            </Box>
          ) : (
            <ConnectedList
              connections={connections}
              onDisconnect={handleDisconnect}
              onOpenWizard={() => setIsWizardOpen(true)}
              expandedConnectionId={lastConnectedId}
            />
          )}
        </Box>
      )}

      {/* Facebook & Instagram Connect Wizard Dialog */}
      <FacebookConnectDialog
        open={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        existingConnections={connections}
        onConnectionSuccess={handleConnectionSuccess}
      />
    </Box>
  );
}
