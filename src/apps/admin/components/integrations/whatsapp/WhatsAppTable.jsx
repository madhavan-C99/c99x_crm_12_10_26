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
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Skeleton,
  Tooltip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import AddIcon from "@mui/icons-material/Add";
import PhoneIcon from "@mui/icons-material/Phone";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import { WhatsAppIcon } from "./WhatsAppConnectDialog";

function formatDate(isoString) {
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
}

/**
 * Dynamic Status Badge for WhatsApp Connections
 * - Active: Green badge
 * - Pending: Amber / Yellow badge
 * - Disconnected / Inactive: Gray / Red badge
 */
export function WhatsAppStatusBadge({ status }) {
  const norm = String(status || "pending").toLowerCase().trim();

  let label = "Pending";
  let bg = "#FEF3C7"; // Amber 100
  let color = "#92400E"; // Amber 800
  let border = "#FDE68A"; // Amber 200

  if (norm === "active") {
    label = "Active";
    bg = "#DCFCE7"; // Green 100
    color = "#166534"; // Green 800
    border = "#BBF7D0"; // Green 200
  } else if (norm === "inactive" || norm === "disconnected") {
    label = "Disconnected";
    bg = "#F1F5F9"; // Slate 100
    color = "#475569"; // Slate 600
    border = "#CBD5E1"; // Slate 300
  } else if (norm === "error" || norm === "failed") {
    label = "Error";
    bg = "#FEE2E2"; // Red 100
    color = "#991B1B"; // Red 800
    border = "#FECACA"; // Red 200
  }

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        height: 22,
        fontSize: "11px",
        fontWeight: 700,
        fontFamily: "Inter, sans-serif",
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
      }}
    />
  );
}

export default function WhatsAppTable({
  connections = [],
  loading = false,
  error = null,
  onOpenConnect,
  onDelete,
}) {
  const [copiedId, setCopiedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Strictly filter active connections only (exclude incomplete/pending)
  const activeConnections = (connections || []).filter(
    (item) => item?.status === "active" || item?.is_connected === true
  );

  const handleCopyLink = async (url, id) => {
    const linkUrl = String(url || "").trim();
    if (!linkUrl) return;

    let success = false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(linkUrl);
        success = true;
      }
    } catch (err) {
      console.warn("navigator.clipboard failed, using fallback:", err);
    }

    if (!success) {
      try {
        const el = document.createElement("textarea");
        el.value = linkUrl;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        success = true;
      } catch (err) {
        console.error("Fallback copy failed:", err);
      }
    }

    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget && onDelete) {
      try {
        setIsDeleting(true);
        await onDelete(deleteTarget.id);
      } finally {
        setIsDeleting(false);
        setDeleteTarget(null);
      }
    } else {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Skeleton variant="rounded" height={60} sx={{ borderRadius: "10px" }} />
        <Skeleton variant="rounded" height={60} sx={{ borderRadius: "10px" }} />
      </Box>
    );
  }

  if (activeConnections.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: "12px",
          border: "1px dashed #E2E8F0",
          backgroundColor: "#F8FAFC",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "12px",
            backgroundColor: "#DCFCE7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #BBF7D0",
          }}
        >
          <WhatsAppIcon size={26} />
        </Box>
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#0F172A",
            fontFamily: "Inter, sans-serif",
          }}
        >
          No WhatsApp numbers connected yet
        </Typography>
        <Typography
          sx={{
            fontSize: "13px",
            color: "#64748B",
            fontFamily: "Inter, sans-serif",
            maxWidth: "380px",
          }}
        >
          Connect your WhatsApp Web number to seamlessly capture inbound leads into CRM campaigns via Chrome extension.
        </Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onOpenConnect}
          sx={{
            mt: 0.5,
            textTransform: "none",
            fontSize: "13px",
            fontWeight: 600,
            fontFamily: "Inter, sans-serif",
            backgroundColor: "#25D366",
            color: "#FFFFFF",
            borderRadius: "6px",
            px: 2,
            "&:hover": { backgroundColor: "#1EA952" },
          }}
        >
          Connect WhatsApp
        </Button>
      </Paper>
    );
  }

  return (
    <>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
            <TableRow>
              <TableCell sx={{ fontSize: "12px", fontWeight: 700, color: "#64748B" }}>
                Client Name
              </TableCell>
              <TableCell sx={{ fontSize: "12px", fontWeight: 700, color: "#64748B" }}>
                WhatsApp Number
              </TableCell>
              <TableCell sx={{ fontSize: "12px", fontWeight: 700, color: "#64748B" }}>
                Campaign
              </TableCell>
              <TableCell sx={{ fontSize: "12px", fontWeight: 700, color: "#64748B" }}>
                Synced Leads
              </TableCell>
              <TableCell sx={{ fontSize: "12px", fontWeight: 700, color: "#64748B" }}>
                Connection Link
              </TableCell>
              <TableCell sx={{ fontSize: "12px", fontWeight: 700, color: "#64748B" }}>
                Status
              </TableCell>
              <TableCell sx={{ fontSize: "12px", fontWeight: 700, color: "#64748B" }}>
                Connected On
              </TableCell>
              <TableCell align="right" sx={{ fontSize: "12px", fontWeight: 700, color: "#64748B" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeConnections.map((conn) => {
              const isCopied = copiedId === conn.id;
              const rawNum = conn.whatsappNumber || conn.mobile || "";
              const formattedNum = rawNum
                ? rawNum.startsWith("+")
                  ? rawNum
                  : `+${rawNum}`
                : "-";
              const linkUrl = conn.connectionUrl || conn.url || "";
              const statusLabel = conn.status
                ? conn.status.charAt(0).toUpperCase() + conn.status.slice(1)
                : "Active";

              return (
                <TableRow
                  key={conn.id}
                  sx={{
                    "&:hover": { backgroundColor: "#F8FAFC" },
                    borderBottom: "1px solid #F1F5F9",
                  }}
                >
                  {/* Client Name */}
                  <TableCell>
                    <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>
                      {conn.clientName || "Code99 Admin"}
                    </Typography>
                  </TableCell>

                  {/* WhatsApp Number */}
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: "8px",
                          backgroundColor: "#DCFCE7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <WhatsAppIcon size={16} />
                      </Box>
                      <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>
                        {formattedNum}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Campaign */}
                  <TableCell>
                    <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                      {conn.campaignName || (conn.campaignId ? `Campaign #${conn.campaignId}` : "-")}
                    </Typography>
                    {conn.pipelineName && (
                      <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                        Pipeline: {conn.pipelineName}
                      </Typography>
                    )}
                  </TableCell>

                  {/* Total Leads Synced */}
                  <TableCell>
                    <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>
                      {conn.totalLeadsSynced ?? 0}
                    </Typography>
                  </TableCell>

                  {/* Connection Link */}
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Tooltip title={linkUrl ? `Click to copy full link:\n${linkUrl}` : "No link"} arrow>
                        <Typography
                          onClick={() => handleCopyLink(linkUrl, conn.id)}
                          sx={{
                            fontSize: "12px",
                            fontFamily: "monospace",
                            color: "#64748B",
                            maxWidth: "180px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                            "&:hover": { color: "#0F172A", textDecoration: "underline" },
                          }}
                        >
                          {linkUrl || "-"}
                        </Typography>
                      </Tooltip>
                      {linkUrl && (
                        <Tooltip title={isCopied ? "Copied Full URL!" : "Copy Full Connection URL"}>
                          <IconButton
                            size="small"
                            onClick={() => handleCopyLink(linkUrl, conn.id)}
                            sx={{
                              color: isCopied ? "#16A34A" : "#64748B",
                              p: 0.5,
                            }}
                          >
                            {isCopied ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>

                  {/* Dynamic Status Badge (Active: Green, Pending: Yellow, Disconnected: Gray/Red) */}
                  <TableCell>
                    <WhatsAppStatusBadge status={conn.status} />
                  </TableCell>

                  {/* Connected Date */}
                  <TableCell>
                    <Typography sx={{ fontSize: "12px", color: "#64748B" }}>
                      {formatDate(conn.createdAt)}
                    </Typography>
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="right">
                    <Tooltip title="Delete WhatsApp Connection">
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTarget(conn)}
                        sx={{
                          color: "#94A3B8",
                          "&:hover": { color: "#EF4444", backgroundColor: "#FEE2E2" },
                        }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "16px", color: "#0F172A" }}>
          Delete WhatsApp Connection?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "13px", color: "#64748B" }}>
            Are you sure you want to delete the connection for{" "}
            <strong>
              {deleteTarget?.whatsappNumber || deleteTarget?.mobile
                ? deleteTarget.whatsappNumber?.startsWith("+")
                  ? deleteTarget.whatsappNumber
                  : `+${deleteTarget.whatsappNumber || deleteTarget.mobile}`
                : "this number"}
            </strong>? The Chrome extension will no longer sync leads from this number into your CRM.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={isDeleting}
            sx={{ textTransform: "none", color: "#64748B" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            sx={{ textTransform: "none", borderRadius: "6px", minWidth: 100 }}
          >
            {isDeleting ? "Deleting..." : "Delete Connection"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
