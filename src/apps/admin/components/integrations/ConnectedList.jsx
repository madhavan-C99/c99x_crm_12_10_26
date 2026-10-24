import React, { useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Collapse,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import SearchIcon from "@mui/icons-material/Search";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import AddIcon from "@mui/icons-material/Add";
import WebhookIcon from "@mui/icons-material/Webhook";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

export default function ConnectedList({
  connections = [],
  onDisconnect,
  onOpenWizard,
  expandedConnectionId = null,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [expandedId, setExpandedId] = useState(expandedConnectionId);
  const [formSearchQueries, setFormSearchQueries] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Disconnect Confirmation Dialog state
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [connectionToDisconnect, setConnectionToDisconnect] = useState(null);

  // Sync expanded row when newly connected
  React.useEffect(() => {
    if (expandedConnectionId) {
      setExpandedId(expandedConnectionId);
    }
  }, [expandedConnectionId]);

  const handleToggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleCopyWebhook = (url, id) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2500);
      });
    } else {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleOpenDisconnectModal = (conn) => {
    setConnectionToDisconnect(conn);
    setDisconnectModalOpen(true);
  };

  const handleConfirmDisconnect = () => {
    if (connectionToDisconnect && onDisconnect) {
      const targetId = connectionToDisconnect.id ?? connectionToDisconnect.numericId ?? connectionToDisconnect.uid;
      onDisconnect(targetId);
    }
    setDisconnectModalOpen(false);
    setConnectionToDisconnect(null);
  };

  const getCampaignDisplay = (routing) => {
    if (!routing) return { name: "Default Campaign", caption: "Direct routing" };
    if (routing.campaignName) {
      return {
        name: routing.campaignName,
        caption: routing.type === "new" ? "New campaign" : "Existing campaign",
      };
    }
    if (routing.campaignId) {
      return {
        name: `Campaign #${routing.campaignId}`,
        caption: "Existing campaign",
      };
    }
    return { name: "Default Campaign", caption: "Standard" };
  };

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  // EMPTY STATE
  if (!connections || connections.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: "center",
          borderRadius: "16px",
          border: "1.5px dashed #CBD5E1",
          backgroundColor: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: "#F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <FacebookIcon sx={{ fontSize: 32, color: "#1877F2" }} />
          <InstagramIcon
            sx={{
              fontSize: 20,
              color: "#E1306C",
              position: "absolute",
              bottom: 6,
              right: 6,
              backgroundColor: "#FFFFFF",
              borderRadius: "4px",
            }}
          />
        </Box>

        <Box sx={{ maxWidth: "380px" }}>
          <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#0F172A", fontFamily: "Inter, sans-serif", mb: 0.5 }}>
            No Pages connected yet
          </Typography>
          <Typography sx={{ fontSize: "14px", color: "#64748B", fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>
            Link your Facebook &amp; Instagram business pages to start capturing real-time leads from Meta ads directly into your CRM pipelines.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onOpenWizard}
          sx={{
            backgroundColor: "#84CC16",
            color: "#FFFFFF",
            textTransform: "none",
            fontSize: "14px",
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            px: 3,
            py: 0.8,
            height: "36px",
            borderRadius: "6px",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#65A30D",
              boxShadow: "none",
            },
          }}
        >
          Connect a Page
        </Button>
      </Paper>
    );
  }

  return (
    <>
      {/* DESKTOP TABLE VIEW */}
      {!isMobile ? (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: "10px",
            border: "1px solid #E2E8F0",
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
          }}
        >
          <Table aria-label="connected meta pages table">
            <TableHead sx={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              <TableRow>
                <TableCell sx={{ fontSize: "12px", fontWeight: 600, color: "#64748B", fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}>
                  Campaign
                </TableCell>
                <TableCell sx={{ fontSize: "12px", fontWeight: 600, color: "#64748B", fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}>
                  Facebook Page
                </TableCell>
                <TableCell sx={{ fontSize: "12px", fontWeight: 600, color: "#64748B", fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}>
                  Forms
                </TableCell>
                <TableCell sx={{ fontSize: "12px", fontWeight: 600, color: "#64748B", fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}>
                  Added On
                </TableCell>
                <TableCell align="right" sx={{ width: 50 }} />
              </TableRow>
            </TableHead>

            <TableBody>
              {connections.map((conn, idx) => {
                const connId = conn.id || conn.numericId || `conn_${idx}`;
                const isExpanded = expandedId === connId;
                const campaignInfo = getCampaignDisplay(conn.routing);
                const searchQuery = formSearchQueries[connId] || "";
                const filteredForms = (conn.forms || []).filter((f) =>
                  f && (f.name || "").toLowerCase().includes(searchQuery.toLowerCase())
                );

                return (
                  <React.Fragment key={connId}>
                    {/* Main Row */}
                    <TableRow
                      hover
                      onClick={() => handleToggleExpand(connId)}
                      tabIndex={0}
                      role="button"
                      aria-expanded={isExpanded}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleToggleExpand(connId);
                        }
                      }}
                      sx={{
                        cursor: "pointer",
                        backgroundColor: isExpanded ? "rgba(132, 204, 22, 0.03)" : "inherit",
                        "&:hover": { backgroundColor: "#F8FAFC" },
                        "&:focus-visible": { outline: "2px solid #84CC16" },
                      }}
                    >
                      {/* Campaign Column */}
                      <TableCell sx={{ py: 2 }}>
                        <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>
                          {campaignInfo.name}
                        </Typography>
                        <Typography sx={{ fontSize: "12px", color: "#64748B", fontFamily: "Inter, sans-serif" }}>
                          {campaignInfo.caption}
                        </Typography>
                      </TableCell>

                      {/* Facebook Page Column */}
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ position: "relative", width: 26, height: 26 }}>
                            <FacebookIcon sx={{ color: "#1877F2", fontSize: 24 }} />
                            <InstagramIcon
                              sx={{
                                color: "#E1306C",
                                fontSize: 13,
                                position: "absolute",
                                bottom: -2,
                                right: -2,
                                backgroundColor: "#FFFFFF",
                                borderRadius: "2px",
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>
                              {conn.pageName}
                            </Typography>
                            <Typography sx={{ fontSize: "12px", color: "#64748B", fontFamily: "Inter, sans-serif" }}>
                              via {conn.facebookAccount?.name || "Meta Account"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Forms Column */}
                      <TableCell sx={{ py: 2 }}>
                        {conn.formMode === "all" ? (
                          <Chip
                            label="All forms"
                            size="small"
                            sx={{
                              backgroundColor: "#F1F5F9",
                              color: "#334155",
                              fontSize: "12px",
                              fontWeight: 600,
                              fontFamily: "Inter, sans-serif",
                            }}
                          />
                        ) : (
                          <Chip
                            label={`${conn.formIds?.length || conn.forms?.length || 0} forms`}
                            size="small"
                            sx={{
                              backgroundColor: "#F7FEE7",
                              color: "#65A30D",
                              border: "1px solid #84CC16",
                              fontSize: "12px",
                              fontWeight: 600,
                              fontFamily: "Inter, sans-serif",
                            }}
                          />
                        )}
                      </TableCell>

                      {/* Added On Column */}
                      <TableCell sx={{ py: 2 }}>
                        <Typography sx={{ fontSize: "13px", color: "#64748B", fontFamily: "Inter, sans-serif" }}>
                          {formatDate(conn.createdAt)}
                        </Typography>
                      </TableCell>

                      {/* Expand Chevron */}
                      <TableCell align="right" sx={{ py: 2 }}>
                        <IconButton size="small" aria-label={isExpanded ? "Collapse row" : "Expand row"}>
                          {isExpanded ? (
                            <KeyboardArrowUpIcon sx={{ color: "#84CC16" }} />
                          ) : (
                            <KeyboardArrowDownIcon sx={{ color: "#94A3B8" }} />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Detail Panel */}
                    <TableRow>
                      <TableCell colSpan={5} sx={{ p: 0, borderBottom: isExpanded ? "1px solid #E2E8F0" : "none" }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 3, backgroundColor: "#FAFAFA", display: "flex", flexDirection: "column", gap: 2.5 }}>
                            {/* Meta Header Badges */}
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                                <Chip
                                  icon={<LayersOutlinedIcon sx={{ fontSize: "16px !important" }} />}
                                  label={`Pipeline: ${conn.pipelineName || "Education"}`}
                                  size="small"
                                  sx={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", fontWeight: 600, fontSize: "12px", fontFamily: "Inter, sans-serif" }}
                                />
                                <Chip
                                  label={`Page ID: ${conn.pageId}`}
                                  size="small"
                                  sx={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", fontSize: "12px", color: "#64748B", fontFamily: "Inter, sans-serif" }}
                                />
                                <Chip
                                  icon={<CheckCircleRoundedIcon sx={{ fontSize: "15px !important", color: "#65A30D" }} />}
                                  label="Active"
                                  size="small"
                                  sx={{ backgroundColor: "#F7FEE7", color: "#65A30D", border: "1px solid #84CC16", fontWeight: 600, fontSize: "12px", fontFamily: "Inter, sans-serif" }}
                                />
                                {conn.totalLeadsSynced !== undefined && (
                                  <Chip
                                    label={`${conn.totalLeadsSynced} leads synced`}
                                    size="small"
                                    sx={{ backgroundColor: "#F1F5F9", color: "#334155", fontWeight: 600, fontSize: "12px", fontFamily: "Inter, sans-serif" }}
                                  />
                                )}
                              </Box>

                              {/* Disconnect Action Button */}
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<LinkOffIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDisconnectModal(conn);
                                }}
                                sx={{
                                  textTransform: "none",
                                  fontSize: "12px",
                                  fontFamily: "Inter, sans-serif",
                                  borderRadius: "6px",
                                  borderColor: "#FCA5A5",
                                  color: "#DC2626",
                                  "&:hover": { borderColor: "#DC2626", backgroundColor: "#FEF2F2" },
                                }}
                              >
                                Disconnect
                              </Button>
                            </Box>

                            {/* Forms Section */}
                            <Box sx={{ p: 2, borderRadius: "10px", backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
                                <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>
                                  Connected Lead Forms
                                </Typography>

                                {conn.formMode !== "all" && (
                                  <TextField
                                    size="small"
                                    placeholder="Filter forms..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                      setFormSearchQueries({ ...formSearchQueries, [connId]: e.target.value })
                                    }
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          <SearchIcon sx={{ fontSize: 16, color: "#94A3B8" }} />
                                        </InputAdornment>
                                      ),
                                    }}
                                    sx={{ width: { xs: "100%", sm: "200px" }, "& input": { fontSize: "12px", fontFamily: "Inter, sans-serif" } }}
                                  />
                                )}
                              </Box>

                              {conn.formMode === "all" ? (
                                <Box sx={{ p: 1.5, borderRadius: "6px", backgroundColor: "#F7FFE7", border: "1px solid #DDF6A8" }}>
                                  <Typography sx={{ fontSize: "12px", color: "#3A6B00", fontWeight: 500, fontFamily: "Inter, sans-serif" }}>
                                    ✓ New forms on this Page are added automatically. All incoming leads from any form on &quot;{conn.pageName}&quot; are synchronized.
                                  </Typography>
                                </Box>
                              ) : filteredForms.length === 0 ? (
                                <Typography sx={{ fontSize: "12px", color: "#94A3B8", py: 1, fontFamily: "Inter, sans-serif" }}>
                                  No forms match &quot;{searchQuery}&quot;.
                                </Typography>
                              ) : (
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                  {filteredForms.map((f) => (
                                    <Box
                                      key={f.id}
                                      sx={{
                                        p: 1.2,
                                        borderRadius: "6px",
                                        backgroundColor: "#F8FAFC",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        border: "1px solid #F1F5F9",
                                      }}
                                    >
                                      <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#1E293B", fontFamily: "Inter, sans-serif" }}>
                                        {f.name}
                                      </Typography>
                                      <Chip
                                        label={`${f.leadCount || 0} leads`}
                                        size="small"
                                        sx={{ height: 20, fontSize: "11px", backgroundColor: "#E2E8F0", fontFamily: "Inter, sans-serif" }}
                                      />
                                    </Box>
                                  ))}
                                </Box>
                              )}
                            </Box>

                            {/* Webhook Endpoint */}
                            <Box sx={{ p: 2, borderRadius: "10px", backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                              <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#0F172A", fontFamily: "Inter, sans-serif", mb: 0.5 }}>
                                Webhook Endpoint
                              </Typography>
                              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={conn.webhookUrl || ""}
                                  InputProps={{
                                    readOnly: true,
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <WebhookIcon sx={{ fontSize: 16, color: "#64748B" }} />
                                      </InputAdornment>
                                    ),
                                  }}
                                  sx={{
                                    backgroundColor: "#F8FAFC",
                                    "& input": { fontSize: "12px", fontFamily: "monospace", color: "#334155" },
                                  }}
                                />
                                <Tooltip title={copiedId === connId ? "Copied!" : "Copy endpoint"}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleCopyWebhook(conn.webhookUrl, connId)}
                                    startIcon={copiedId === connId ? <CheckIcon sx={{ color: "#84CC16" }} /> : <ContentCopyIcon />}
                                    sx={{
                                      textTransform: "none",
                                      fontSize: "12px",
                                      fontFamily: "Inter, sans-serif",
                                      borderColor: copiedId === connId ? "#84CC16" : "#CBD5E1",
                                      color: copiedId === connId ? "#65A30D" : "#334155",
                                      backgroundColor: copiedId === connId ? "#F7FEE7" : "transparent",
                                      minWidth: "90px",
                                      borderRadius: "6px",
                                      "&:hover": {
                                        borderColor: "#84CC16",
                                        color: "#65A30D",
                                        backgroundColor: "#F7FEE7",
                                      },
                                    }}
                                  >
                                    {copiedId === conn.id ? "Copied" : "Copy"}
                                  </Button>
                                </Tooltip>
                              </Box>
                              <Typography sx={{ fontSize: "11px", color: "#64748B", fontFamily: "Inter, sans-serif", mt: 0.8 }}>
                                Share with your Page admin if they connect it for you.
                              </Typography>
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* MOBILE STACKED CARDS VIEW */
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {connections.map((conn, idx) => {
            const connId = conn.id || conn.numericId || `conn_${idx}`;
            const isExpanded = expandedId === connId;
            const campaignInfo = getCampaignDisplay(conn.routing);
            const searchQuery = formSearchQueries[connId] || "";
            const filteredForms = (conn.forms || []).filter((f) =>
              f && (f.name || "").toLowerCase().includes(searchQuery.toLowerCase())
            );

            return (
              <Paper
                key={connId}
                elevation={0}
                sx={{
                  borderRadius: "12px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  overflow: "hidden",
                }}
              >
                {/* Mobile Card Header */}
                <Box
                  onClick={() => handleToggleExpand(connId)}
                  sx={{ p: 2, cursor: "pointer", display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <FacebookIcon sx={{ color: "#1877F2", fontSize: 24 }} />
                      <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>
                        {conn.pageName}
                      </Typography>
                    </Box>
                    <IconButton size="small">
                      {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                    <Box>
                      <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                        {campaignInfo.name}
                      </Typography>
                      <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                        {campaignInfo.caption}
                      </Typography>
                    </Box>

                    <Chip
                      label={conn.formMode === "all" ? "All forms" : `${conn.formIds?.length || 0} forms`}
                      size="small"
                      sx={{ fontSize: "11px", fontWeight: 600 }}
                    />
                  </Box>
                </Box>

                {/* Mobile Expanded Content */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{ p: 2, backgroundColor: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Chip label={`Pipeline: ${conn.pipelineName || "Education"}`} size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }} />
                      <Chip label="Active" size="small" sx={{ backgroundColor: "#F7FEE7", color: "#65A30D", border: "1px solid #84CC16", fontWeight: 600, fontSize: "12px", fontFamily: "Inter, sans-serif" }} />
                      {conn.totalLeadsSynced !== undefined && (
                        <Chip label={`${conn.totalLeadsSynced} leads synced`} size="small" sx={{ backgroundColor: "#F1F5F9", color: "#334155", fontWeight: 600, fontSize: "12px", fontFamily: "Inter, sans-serif" }} />
                      )}
                    </Box>

                    {/* Webhook Endpoint Mobile */}
                    <Box>
                      <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#0F172A", mb: 0.5 }}>
                        Webhook Endpoint
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={conn.webhookUrl || ""}
                          InputProps={{ readOnly: true }}
                          sx={{ "& input": { fontSize: "11px", fontFamily: "monospace" } }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleCopyWebhook(conn.webhookUrl, connId)}
                        >
                          {copiedId === connId ? "Copied" : "Copy"}
                        </Button>
                      </Box>
                    </Box>

                    {/* Disconnect */}
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() => handleOpenDisconnectModal(conn)}
                      sx={{ textTransform: "none", fontSize: "13px" }}
                    >
                      Disconnect Page
                    </Button>
                  </Box>
                </Collapse>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Disconnect Confirmation Dialog */}
      <Dialog
        open={disconnectModalOpen}
        onClose={() => setDisconnectModalOpen(false)}
        maxWidth="xs"
        fullWidth
        sx={{ "& .MuiDialog-paper": { borderRadius: "14px", p: 1 } }}
      >
        <DialogTitle sx={{ fontSize: "16px", fontWeight: 600, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>
          Disconnect {connectionToDisconnect?.pageName}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "14px", color: "#64748B", fontFamily: "Inter, sans-serif" }}>
            Are you sure you want to disconnect this Facebook Page? Incoming leads from its forms will no longer sync to your CRM. You can reconnect it at any time.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setDisconnectModalOpen(false)}
            sx={{
              textTransform: "none",
              color: "#65A30D",
              border: "1px solid #84CC16",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 500,
              borderRadius: "5px",
              px: 2,
              "&:hover": {
                backgroundColor: "rgba(132, 204, 22, 0.08)",
                border: "1px solid #84CC16",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDisconnect}
            sx={{ textTransform: "none", fontSize: "13px", fontFamily: "Inter, sans-serif", fontWeight: 500, borderRadius: "5px", px: 2, boxShadow: "none" }}
          >
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
