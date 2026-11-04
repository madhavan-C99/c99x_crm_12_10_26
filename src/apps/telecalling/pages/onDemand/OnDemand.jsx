import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import BoltIcon from "@mui/icons-material/Bolt";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import LayersIcon from "@mui/icons-material/Layers";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import ActionFeedbackModal from "@/apps/telecalling/components/common/ActionFeedbackModal";
import { getSelectOptions } from "@/shared/services/dropdownService";
import {
  fetchOnDemandPoolLeads,
  claimOnDemandLead,
} from "@/apps/telecalling/services/onDemandService";
import { WS_BASE_URL } from "@/shared/config/env";

// Brand Colors
const LIME_GREEN = "#90D916";
const LIME_HOVER = "#78B810";
const LIME_LIGHT = "#F4FCE8";

// Deduplicate leads by unique mobile phone number and ID
const deduplicateLeads = (leadsList) => {
  if (!Array.isArray(leadsList)) return [];
  const seenPhones = new Set();
  const seenIds = new Set();
  const result = [];

  for (const lead of leadsList) {
    if (!lead || seenIds.has(lead.id)) continue;
    const cleanPhone = String(lead.phone || "").replace(/\s+/g, "");
    if (cleanPhone && seenPhones.has(cleanPhone)) continue;

    seenIds.add(lead.id);
    if (cleanPhone) seenPhones.add(cleanPhone);
    result.push(lead);
  }
  return result;
};

export default function OnDemand() {
  const navigate = useNavigate();

  // Pool State
  const [poolLeads, setPoolLeads] = useState(() => {
    const saved = sessionStorage.getItem("on_demand_pool_leads");
    return saved ? deduplicateLeads(JSON.parse(saved)) : [];
  });

  // WebSocket Connection State
  const [wsStatus, setWsStatus] = useState("connecting"); // 'connected' | 'connecting' | 'disconnected'
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Loading & Action State
  const [claimingIds, setClaimingIds] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");

  // Options from API
  const [campaignOptions, setCampaignOptions] = useState([]);
  const [sourceOptions, setSourceOptions] = useState([]);

  // Toast / Live Activity Notification
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Feedback Modal State
  const [feedback, setFeedback] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  // Sync to session storage
  useEffect(() => {
    sessionStorage.setItem("on_demand_pool_leads", JSON.stringify(poolLeads));
  }, [poolLeads]);

  // Load Dropdown Options
  useEffect(() => {
    getSelectOptions({ field: "L_CAMPAIGN_NAMES", opt_filter: {} })
      .then((res) => {
        const raw = res?.data?.data || res?.data || [];
        if (Array.isArray(raw)) {
          setCampaignOptions(
            raw.map((c) => ({
              id: String(c.id || c.value || c.name),
              name: String(c.name || c.label || c.value),
            }))
          );
        }
      })
      .catch(() => {});

    getSelectOptions({ field: "L_LEAD_SOURCES", opt_filter: {} })
      .then((res) => {
        const raw = res?.data?.data || res?.data || [];
        if (Array.isArray(raw)) {
          setSourceOptions(
            raw.map((s) => ({
              id: String(s.id || s.value || s.name),
              name: String(s.name || s.label || s.value),
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // Initial REST Fetch
  const loadInitialLeads = useCallback(async () => {
    try {
      const res = await fetchOnDemandPoolLeads();
      const raw = res?.data?.data || res?.data;
      if (Array.isArray(raw)) {
        setPoolLeads(deduplicateLeads(raw));
      }
    } catch (err) {
      console.warn("Failed to load initial pool leads via REST:", err);
    }
  }, []);

  useEffect(() => {
    loadInitialLeads();
  }, [loadInitialLeads]);

  // Real-Time WebSocket Connection
  useEffect(() => {
    let isCancelled = false;

    const connectWebSocket = () => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) {
        setWsStatus("disconnected");
        return;
      }

      try {
        setWsStatus("connecting");
        const wsUrl = `${WS_BASE_URL}/ws/lead_pool/?token=${encodeURIComponent(token)}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isCancelled) {
            ws.close();
            return;
          }
          setWsStatus("connected");
          // Request fresh pool leads
          ws.send(JSON.stringify({ action: "get_pool" }));
        };

        ws.onmessage = (event) => {
          if (isCancelled) return;
          try {
            const data = JSON.parse(event.data);

            // 1. Initial / full pool data
            if (data.type === "pool_data" && Array.isArray(data.payload)) {
              setPoolLeads(deduplicateLeads(data.payload));
            }

            // 2. Real-time new unassigned lead arrived
            else if (data.type === "new_lead" && data.lead) {
              setPoolLeads((prev) =>
                deduplicateLeads([data.lead, ...prev.filter((l) => l.id !== data.lead.id)])
              );
              setToast({
                open: true,
                message: `⚡ New Lead in Pool: ${data.lead.fullName} (${data.lead.campaign || "Inquiry"})`,
                severity: "info",
              });
            }

            // 3. Real-time lead claimed by any telecaller -> remove from pool
            else if (data.type === "lead_claimed" && data.lead_id) {
              setPoolLeads((prev) =>
                prev.filter((l) => String(l.id) !== String(data.lead_id))
              );
              if (data.claimed_by_name) {
                setToast({
                  open: true,
                  message: `Lead #${data.lead_id} claimed by ${data.claimed_by_name}`,
                  severity: "warning",
                });
              }
            }
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        ws.onerror = () => {
          if (!isCancelled) {
            setWsStatus("disconnected");
          }
        };

        ws.onclose = () => {
          if (!isCancelled) {
            setWsStatus("disconnected");
            // Schedule auto-reconnect after 4s
            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, 4000);
          }
        };
      } catch (err) {
        console.error("WebSocket connection error:", err);
        setWsStatus("disconnected");
      }
    };

    connectWebSocket();

    return () => {
      isCancelled = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return poolLeads.filter((lead) => {
      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = String(lead.fullName || "").toLowerCase().includes(term);
        const matchesPhone = String(lead.phone || "").replace(/\s+/g, "").includes(term);
        const matchesCity = String(lead.city || "").toLowerCase().includes(term);
        const matchesCampaign = String(lead.campaign || "").toLowerCase().includes(term);
        if (!matchesName && !matchesPhone && !matchesCity && !matchesCampaign) {
          return false;
        }
      }

      // Campaign
      if (
        selectedCampaign !== "all" &&
        lead.campaign !== selectedCampaign &&
        lead.campaignId !== selectedCampaign
      ) {
        return false;
      }

      // Source
      if (
        selectedSource !== "all" &&
        lead.source !== selectedSource &&
        lead.sourceId !== selectedSource
      ) {
        return false;
      }

      // Priority
      if (selectedPriority !== "all") {
        if (selectedPriority === "hot" && lead.priority !== "hot") return false;
        if (selectedPriority === "warm" && lead.priority !== "warm") return false;
        if (selectedPriority === "fresh") {
          const isFresh =
            lead.receivedAt &&
            dayjs().diff(dayjs(lead.receivedAt), "minute") <= 60;
          if (!isFresh) return false;
        }
      }

      return true;
    });
  }, [poolLeads, searchTerm, selectedCampaign, selectedSource, selectedPriority]);

  // Claim handler
  const handleClaimLead = async (leadToClaim) => {
    if (!leadToClaim) return;

    const leadId = leadToClaim.id;
    setClaimingIds((prev) => [...prev, leadId]);

    try {
      const res = await claimOnDemandLead(leadId);

      const isSuccess = res?.data?.data?.success || res?.data?.status;

      if (isSuccess) {
        // Remove from local pool immediately
        setPoolLeads((prev) => prev.filter((l) => l.id !== leadId));

        // Trigger success modal
        setFeedback({
          open: true,
          type: "success",
          title: "Lead Claimed Successfully! 🎉",
          message: `"${leadToClaim.fullName}" has been claimed from On-Demand Pool and added to your pipeline. You can now start calling!`,
        });
      } else {
        setFeedback({
          open: true,
          type: "error",
          title: "Claim Failed",
          message:
            res?.data?.message ||
            "This lead could not be claimed. Please try another.",
        });
      }
    } catch (err) {
      // If 400/409, lead was already claimed by another telecaller
      const errMsg =
        err?.response?.data?.message ||
        "This lead was already claimed by another telecaller or is no longer available.";

      // Remove from table since it's taken
      setPoolLeads((prev) => prev.filter((l) => l.id !== leadId));

      setFeedback({
        open: true,
        type: "error",
        title: "Already Claimed",
        message: errMsg,
      });
    } finally {
      setClaimingIds((prev) => prev.filter((id) => id !== leadId));
    }
  };

  // Refresh Pool handler
  const handleRefresh = async () => {
    setIsRefreshing(true);

    // If WebSocket is connected, request pool data
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "get_pool" }));
    }

    // Also call REST fallback
    try {
      const res = await fetchOnDemandPoolLeads();
      const raw = res?.data?.data || res?.data;
      if (Array.isArray(raw)) {
        setPoolLeads(deduplicateLeads(raw));
      }
    } catch (_) {}

    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  // Copy phone
  const handleCopyPhone = (phone, id) => {
    navigator.clipboard?.writeText(String(phone || "").replace(/\s+/g, ""));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Helper for human-readable time ago
  const formatTimeAgo = (receivedAt, fallbackText) => {
    if (fallbackText) return fallbackText;
    if (!receivedAt) return "Just now";
    const minutes = dayjs().diff(dayjs(receivedAt), "minute");
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  // Priority Chip color helper
  const renderPriorityChip = (priority) => {
    const p = String(priority || "").toLowerCase();
    switch (p) {
      case "hot":
        return (
          <Chip
            size="small"
            icon={
              <WhatshotIcon
                sx={{ fontSize: "14px !important", color: "#E11D48 !important" }}
              />
            }
            label="Hot Lead"
            sx={{
              backgroundColor: "#FFE4E6",
              color: "#BE123C",
              fontWeight: 700,
              fontSize: "11px",
              height: "22px",
            }}
          />
        );
      case "warm":
        return (
          <Chip
            size="small"
            icon={
              <BoltIcon
                sx={{ fontSize: "14px !important", color: "#D97706 !important" }}
              />
            }
            label="Warm"
            sx={{
              backgroundColor: "#FEF3C7",
              color: "#B45309",
              fontWeight: 600,
              fontSize: "11px",
              height: "22px",
            }}
          />
        );
      case "cold":
        return (
          <Chip
            size="small"
            label="Cold"
            sx={{
              backgroundColor: "#F1F5F9",
              color: "#475569",
              fontWeight: 600,
              fontSize: "11px",
              height: "22px",
            }}
          />
        );
      default:
        return (
          <Chip
            size="small"
            label="Normal"
            sx={{
              backgroundColor: "#F1F5F9",
              color: "#64748B",
              fontWeight: 500,
              fontSize: "11px",
              height: "22px",
            }}
          />
        );
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#F8FAFC",
        minHeight: "100vh",
        p: { xs: 2, sm: 3, md: 3.5 },
      }}
    >
      {/* 1. HEADER & LIVE STREAM INDICATOR */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          backgroundColor: "#FFFFFF",
          p: { xs: 2, sm: 2.5 },
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "12px",
              backgroundColor: LIME_LIGHT,
              border: `1.5px solid ${LIME_GREEN}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3A6B00",
            }}
          >
            <LayersIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography
                sx={{ fontSize: "20px", fontWeight: 700, color: "#0F172A" }}
              >
                On-Demand Lead Pool
              </Typography>

              {/* Real-time WebSocket Live Status Badge */}
              {wsStatus === "connected" ? (
                <Chip
                  icon={
                    <WifiIcon
                      sx={{
                        fontSize: "13px !important",
                        color: "#059669 !important",
                        animation: "pulse 2s infinite",
                        "@keyframes pulse": {
                          "0%": { opacity: 1 },
                          "50%": { opacity: 0.4 },
                          "100%": { opacity: 1 },
                        },
                      }}
                    />
                  }
                  label="Live Stream Active"
                  size="small"
                  sx={{
                    backgroundColor: "#ECFDF5",
                    color: "#059669",
                    fontWeight: 700,
                    fontSize: "11px",
                    border: "1px solid #A7F3D0",
                    height: "22px",
                  }}
                />
              ) : wsStatus === "connecting" ? (
                <Chip
                  icon={
                    <CircularProgress
                      size={10}
                      sx={{ color: "#D97706 !important" }}
                    />
                  }
                  label="Connecting Stream..."
                  size="small"
                  sx={{
                    backgroundColor: "#FEF3C7",
                    color: "#B45309",
                    fontWeight: 600,
                    fontSize: "11px",
                    border: "1px solid #FDE68A",
                    height: "22px",
                  }}
                />
              ) : (
                <Chip
                  icon={
                    <WifiOffIcon
                      sx={{
                        fontSize: "13px !important",
                        color: "#64748B !important",
                      }}
                    />
                  }
                  label="Stream Offline (Reconnecting)"
                  size="small"
                  sx={{
                    backgroundColor: "#F1F5F9",
                    color: "#64748B",
                    fontWeight: 600,
                    fontSize: "11px",
                    border: "1px solid #E2E8F0",
                    height: "22px",
                  }}
                />
              )}
            </Box>
            <Typography sx={{ fontSize: "13px", color: "#64748B", mt: 0.25 }}>
              Real-time unassigned inquiries streamed live. Claim instantly into your pipeline.
            </Typography>
          </Box>
        </Box>

        {/* Action Controls */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Chip
            label={`${filteredLeads.length} Leads Available`}
            size="small"
            sx={{
              backgroundColor: "#F1F5F9",
              color: "#334155",
              fontWeight: 700,
              fontSize: "12px",
              height: "30px",
              px: 1,
            }}
          />

          {/* Refresh Button */}
          <Tooltip title="Refresh Lead Pool">
            <IconButton
              onClick={handleRefresh}
              disabled={isRefreshing}
              sx={{
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                width: "40px",
                height: "40px",
                backgroundColor: "#FFF",
                "&:hover": { backgroundColor: "#F8FAFC" },
              }}
            >
              <RefreshIcon
                sx={{
                  fontSize: 20,
                  color: "#475569",
                  animation: isRefreshing ? "spin 0.6s linear infinite" : "none",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* 2. FILTER & SEARCH BAR */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          alignItems: "center",
          mb: 2,
        }}
      >
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search name, phone, city..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            flex: { xs: "1 1 100%", sm: "1 1 240px" },
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              fontSize: "13px",
            },
          }}
        />

        {/* Campaign Filter */}
        <TextField
          select
          size="small"
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
          sx={{
            minWidth: { xs: "140px", sm: "170px" },
            "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13px" },
          }}
        >
          <MenuItem value="all">All Campaigns</MenuItem>
          {campaignOptions.length > 0 ? (
            campaignOptions.map((c) => (
              <MenuItem key={c.id} value={c.name}>
                {c.name}
              </MenuItem>
            ))
          ) : (
            <>
              <MenuItem value="FullStack Python 2026">FullStack Python 2026</MenuItem>
              <MenuItem value="Data Science Masters">Data Science Masters</MenuItem>
              <MenuItem value="Cloud DevOps Batch">Cloud DevOps Batch</MenuItem>
            </>
          )}
        </TextField>

        {/* Source Filter */}
        <TextField
          select
          size="small"
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          sx={{
            minWidth: { xs: "130px", sm: "150px" },
            "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13px" },
          }}
        >
          <MenuItem value="all">All Sources</MenuItem>
          {sourceOptions.length > 0 ? (
            sourceOptions.map((s) => (
              <MenuItem key={s.id} value={s.name}>
                {s.name}
              </MenuItem>
            ))
          ) : (
            <>
              <MenuItem value="Instagram Ads">Instagram Ads</MenuItem>
              <MenuItem value="Google Search">Google Search</MenuItem>
              <MenuItem value="Facebook Leads">Facebook Leads</MenuItem>
              <MenuItem value="WhatsApp">WhatsApp</MenuItem>
            </>
          )}
        </TextField>

        {/* Priority Filter */}
        <TextField
          select
          size="small"
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          sx={{
            minWidth: "140px",
            "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13px" },
          }}
        >
          <MenuItem value="all">All Priorities</MenuItem>
          <MenuItem value="fresh">🔥 Fresh (&lt; 1 hr)</MenuItem>
          <MenuItem value="hot">Hot Leads Only</MenuItem>
          <MenuItem value="warm">Warm Leads</MenuItem>
        </TextField>

        {/* Clear Filters */}
        {(searchTerm ||
          selectedCampaign !== "all" ||
          selectedSource !== "all" ||
          selectedPriority !== "all") && (
          <Button
            size="small"
            onClick={() => {
              setSearchTerm("");
              setSelectedCampaign("all");
              setSelectedSource("all");
              setSelectedPriority("all");
            }}
            sx={{
              textTransform: "none",
              color: "#EF4444",
              fontWeight: 600,
              fontSize: "12px",
            }}
          >
            Reset Filters
          </Button>
        )}
      </Box>

      {/* 3. LEADS TABLE (Individual Claim Only, No Bulk/Checkboxes) */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
            <TableRow>
              <TableCell sx={{ fontSize: "12px", fontWeight: 700, color: "#475569", pl: 3 }}>
                LEAD DETAILS
              </TableCell>
              <TableCell sx={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                CONTACT & CITY
              </TableCell>
              <TableCell sx={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                CAMPAIGN
              </TableCell>
              <TableCell sx={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                SOURCE
              </TableCell>
              <TableCell sx={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                AGE / TIME
              </TableCell>
              <TableCell sx={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                PRIORITY
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontSize: "12px", fontWeight: 700, color: "#475569", pr: 3 }}
              >
                ACTION
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => {
                const isClaiming = claimingIds.includes(lead.id);

                return (
                  <TableRow
                    key={lead.id}
                    hover
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    {/* Lead Details */}
                    <TableCell sx={{ pl: 3 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            backgroundColor: "#EEF2FF",
                            color: "#4F46E5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "13px",
                          }}
                        >
                          {String(lead.fullName || "L").charAt(0).toUpperCase()}
                        </Box>
                        <Box>
                          <Typography
                            sx={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}
                          >
                            {lead.fullName}
                          </Typography>
                          <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                            {lead.courseInterest || lead.email || "Course Inquiry"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Contact & City */}
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                          {lead.maskedPhone || lead.phone || "—"}
                        </Typography>
                        {lead.phone && (
                          <Tooltip title={copiedId === lead.id ? "Copied!" : "Copy Number"}>
                            <IconButton
                              size="small"
                              onClick={() => handleCopyPhone(lead.phone, lead.id)}
                              sx={{ p: 0.5, color: "#94A3B8" }}
                            >
                              <ContentCopyIcon sx={{ fontSize: 13 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                      <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                        {lead.city ? lead.city : "Location N/A"}
                      </Typography>
                    </TableCell>

                    {/* Campaign */}
                    <TableCell>
                      <Chip
                        label={lead.campaign || "General"}
                        size="small"
                        sx={{
                          backgroundColor: "#F1F5F9",
                          color: "#334155",
                          fontWeight: 600,
                          fontSize: "11px",
                          height: "22px",
                        }}
                      />
                    </TableCell>

                    {/* Source */}
                    <TableCell>
                      <Typography sx={{ fontSize: "12px", color: "#334155", fontWeight: 500 }}>
                        {lead.source || "Direct"}
                      </Typography>
                    </TableCell>

                    {/* Age / Received Time */}
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <AccessTimeIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
                        <Typography sx={{ fontSize: "12px", color: "#64748B" }}>
                          {formatTimeAgo(lead.receivedAt, lead.timeAgo)}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Priority */}
                    <TableCell>{renderPriorityChip(lead.priority)}</TableCell>

                    {/* Action: Single Claim */}
                    <TableCell align="right" sx={{ pr: 3 }}>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={isClaiming}
                        onClick={() => handleClaimLead(lead)}
                        startIcon={
                          isClaiming ? (
                            <CircularProgress size={14} sx={{ color: "#111" }} />
                          ) : (
                            <PhoneInTalkIcon sx={{ fontSize: "14px !important" }} />
                          )
                        }
                        sx={{
                          backgroundColor: LIME_GREEN,
                          color: "#111827",
                          textTransform: "none",
                          fontSize: "12px",
                          fontWeight: 700,
                          borderRadius: "8px",
                          px: 2,
                          py: 0.6,
                          boxShadow: "0 2px 6px rgba(144, 217, 22, 0.25)",
                          "&:hover": {
                            backgroundColor: LIME_HOVER,
                            boxShadow: "0 4px 10px rgba(144, 217, 22, 0.35)",
                          },
                        }}
                      >
                        {isClaiming ? "Claiming..." : "Claim Lead"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 6, textAlign: "center" }}>
                  <Box sx={{ maxWidth: 360, margin: "0 auto" }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        backgroundColor: "#F1F5F9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 12px auto",
                        color: "#94A3B8",
                      }}
                    >
                      <LayersIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Typography sx={{ fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
                      No Leads in Pool
                    </Typography>
                    <Typography sx={{ fontSize: "13px", color: "#64748B", mt: 0.5 }}>
                      There are currently no unassigned leads matching your filters. When new inquiries arrive, they will appear here live via WebSocket automatically.
                    </Typography>
                    {(searchTerm ||
                      selectedCampaign !== "all" ||
                      selectedSource !== "all" ||
                      selectedPriority !== "all") && (
                      <Button
                        size="small"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedCampaign("all");
                          setSelectedSource("all");
                          setSelectedPriority("all");
                        }}
                        sx={{ mt: 1.5, textTransform: "none", color: "#2563EB", fontWeight: 600 }}
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 4. SUCCESS FEEDBACK MODAL */}
      <ActionFeedbackModal
        open={feedback.open}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        buttonText="View in Pipeline"
        onButtonClick={() => {
          setFeedback({ open: false, type: "success", title: "", message: "" });
          navigate("/telecalling/pipeline");
        }}
        onClose={() => {
          setFeedback({ open: false, type: "success", title: "", message: "" });
        }}
      />

      {/* 5. LIVE ACTIVITY SNACKBAR */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: "10px", fontWeight: 600 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
