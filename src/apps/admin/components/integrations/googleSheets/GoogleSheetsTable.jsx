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
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
} from "@mui/material";
import CodeIcon from "@mui/icons-material/Code";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineRounded";

import { GoogleSheetsIcon } from "./GoogleSheetsConnectDialog";

/**
 * Formats ISO date string
 */
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
 * Status Badge Component for Google Sheets
 */
function StatusBadge({ status }) {
  const normalized = (status || "waiting").toLowerCase();

  let label = "Waiting";
  let bg = "#FEF3C7";
  let text = "#92400E";
  let border = "#FDE68A";

  if (normalized === "active") {
    label = "Active";
    bg = "#DCFCE7";
    text = "#166534";
    border = "#BBF7D0";
  } else if (normalized === "error") {
    label = "Error";
    bg = "#FEE2E2";
    text = "#991B1B";
    border = "#FECACA";
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
        color: text,
        border: `1px solid ${border}`,
      }}
    />
  );
}

/**
 * Google Sheets Connections Table
 * Displays all Google Sheet connections with status badges, leads synced,
 * "View Code" action, and "Delete" confirmation modal.
 */
export default function GoogleSheetsTable({
  connections = [],
  loading = false,
  error = null,
  onRetry,
  onOpenConnect,
  onViewCode,
  onDelete,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleOpenDelete = (conn) => {
    setConnectionToDelete(conn);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!connectionToDelete || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(connectionToDelete.id || connectionToDelete.uid);
      setDeleteModalOpen(false);
      setConnectionToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  // 1. LOADING SKELETON
  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Skeleton variant="rounded" height={64} sx={{ borderRadius: "10px" }} />
        <Skeleton variant="rounded" height={64} sx={{ borderRadius: "10px" }} />
        <Skeleton variant="rounded" height={64} sx={{ borderRadius: "10px" }} />
      </Box>
    );
  }

  // 2. ERROR STATE
  if (error) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: "center",
          borderRadius: "14px",
          border: "1px solid #FECACA",
          backgroundColor: "#FEF2F2",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <ErrorOutlineIcon sx={{ color: "#DC2626", fontSize: 36 }} />
        <Typography
          sx={{
            fontSize: "15px",
            fontWeight: 600,
            color: "#991B1B",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Failed to load Google Sheets connections
        </Typography>
        <Typography sx={{ fontSize: "13px", color: "#B91C1C", maxWidth: "450px" }}>
          {error}
        </Typography>
        {onRetry && (
          <Button
            size="small"
            variant="outlined"
            onClick={onRetry}
            startIcon={<RefreshIcon />}
            sx={{
              mt: 1,
              borderColor: "#F87171",
              color: "#DC2626",
              textTransform: "none",
              borderRadius: "8px",
              "&:hover": { borderColor: "#DC2626", backgroundColor: "#FEE2E2" },
            }}
          >
            Retry
          </Button>
        )}
      </Paper>
    );
  }

  // 3. EMPTY STATE
  if (!connections || connections.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 5,
          textAlign: "center",
          borderRadius: "14px",
          border: "1px dashed #E2E8F0",
          backgroundColor: "#F8FAFC",
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
            backgroundColor: "#E6F4EA",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #CEEAD6",
          }}
        >
          <GoogleSheetsIcon size={34} />
        </Box>

        <Box sx={{ maxWidth: "420px" }}>
          <Typography
            sx={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#0F172A",
              fontFamily: "Inter, sans-serif",
              mb: 0.5,
            }}
          >
            No Google Sheets connected yet
          </Typography>
          <Typography
            sx={{
              fontSize: "14px",
              color: "#64748B",
              fontFamily: "Inter, sans-serif",
              lineHeight: 1.5,
            }}
          >
            Connect your Google Spreadsheets to automatically stream new row entries directly into your CRM campaigns.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onOpenConnect}
          sx={{
            backgroundColor: "#0F9D58",
            color: "#FFFFFF",
            textTransform: "none",
            fontSize: "14px",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            px: 3,
            py: 0.8,
            height: "36px",
            borderRadius: "6px",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#0B8043",
              boxShadow: "none",
            },
          }}
        >
          Connect Google Sheet
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
          <Table aria-label="google sheets connections table">
            <TableHead
              sx={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}
            >
              <TableRow>
                <TableCell
                  sx={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#64748B",
                    fontFamily: "Inter, sans-serif",
                    textTransform: "uppercase",
                  }}
                >
                  Spreadsheet Name
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#64748B",
                    fontFamily: "Inter, sans-serif",
                    textTransform: "uppercase",
                  }}
                >
                  Pipeline
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#64748B",
                    fontFamily: "Inter, sans-serif",
                    textTransform: "uppercase",
                  }}
                >
                  Campaign
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#64748B",
                    fontFamily: "Inter, sans-serif",
                    textTransform: "uppercase",
                  }}
                >
                  Rows Synced
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#64748B",
                    fontFamily: "Inter, sans-serif",
                    textTransform: "uppercase",
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#64748B",
                    fontFamily: "Inter, sans-serif",
                    textTransform: "uppercase",
                    pr: 3,
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {connections.map((conn) => {
                const connId = conn.id || conn.uid;
                const pipelineName =
                  conn.pipeline?.name || conn.pipelineName || "-";
                const campaignName =
                  conn.campaign?.name || conn.campaignName || "-";
                const totalSynced = conn.totalLeadsSynced ?? 0;

                return (
                  <TableRow
                    key={connId}
                    hover
                    sx={{
                      "&:hover": { backgroundColor: "#F8FAFC" },
                    }}
                  >
                    {/* Name Column */}
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <GoogleSheetsIcon size={24} />
                        <Box>
                          <Typography
                            sx={{
                              fontSize: "13.5px",
                              fontWeight: 600,
                              color: "#0F172A",
                              fontFamily: "Inter, sans-serif",
                            }}
                          >
                            {conn.name}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "11.5px",
                              color: "#94A3B8",
                              fontFamily: "Inter, sans-serif",
                            }}
                          >
                            Connected {formatDate(conn.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Pipeline Column */}
                    <TableCell sx={{ py: 2 }}>
                      <Typography
                        sx={{
                          fontSize: "13px",
                          color: "#334155",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {pipelineName}
                      </Typography>
                    </TableCell>

                    {/* Campaign Column */}
                    <TableCell sx={{ py: 2 }}>
                      <Typography
                        sx={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#0F172A",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {campaignName}
                      </Typography>
                    </TableCell>

                    {/* Rows Synced */}
                    <TableCell sx={{ py: 2 }}>
                      <Typography
                        sx={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#0F172A",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {totalSynced}
                      </Typography>
                    </TableCell>

                    {/* Status Column */}
                    <TableCell sx={{ py: 2 }}>
                      <StatusBadge status={conn.status} />
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell align="right" sx={{ py: 2, pr: 2 }}>
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <Tooltip title="View Apps Script Code & Setup">
                          <IconButton
                            size="small"
                            onClick={() => onViewCode && onViewCode(conn)}
                            sx={{
                              color: "#0F9D58",
                              "&:hover": { backgroundColor: "#E6F4EA" },
                            }}
                          >
                            <CodeIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Connection">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDelete(conn)}
                            sx={{
                              color: "#94A3B8",
                              "&:hover": {
                                color: "#EF4444",
                                backgroundColor: "#FEE2E2",
                              },
                            }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* MOBILE CARDS VIEW */
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {connections.map((conn) => {
            const connId = conn.id || conn.uid;
            const pipelineName = conn.pipeline?.name || conn.pipelineName || "-";
            const campaignName = conn.campaign?.name || conn.campaignName || "-";
            const totalSynced = conn.totalLeadsSynced ?? 0;

            return (
              <Card
                key={connId}
                variant="outlined"
                sx={{
                  borderRadius: "12px",
                  borderColor: "#E2E8F0",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 1.5,
                      mb: 1.5,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                      <GoogleSheetsIcon size={24} />
                      <Box>
                        <Typography
                          sx={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#0F172A",
                          }}
                        >
                          {conn.name}
                        </Typography>
                        <Typography sx={{ fontSize: "11px", color: "#94A3B8" }}>
                          Connected {formatDate(conn.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                    <StatusBadge status={conn.status} />
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 1,
                      pt: 1.5,
                      borderTop: "1px solid #F1F5F9",
                      mb: 1.5,
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                        Pipeline
                      </Typography>
                      <Typography sx={{ fontSize: "12.5px", fontWeight: 500, color: "#1E293B" }}>
                        {pipelineName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                        Campaign
                      </Typography>
                      <Typography sx={{ fontSize: "12.5px", fontWeight: 500, color: "#1E293B" }}>
                        {campaignName}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      pt: 1,
                      borderTop: "1px solid #F1F5F9",
                    }}
                  >
                    <Typography sx={{ fontSize: "12px", color: "#64748B" }}>
                      Rows: <strong>{totalSynced}</strong>
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Button
                        size="small"
                        startIcon={<CodeIcon sx={{ fontSize: 16 }} />}
                        onClick={() => onViewCode && onViewCode(conn)}
                        sx={{
                          fontSize: "12px",
                          textTransform: "none",
                          color: "#0F9D58",
                        }}
                      >
                        Code
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDelete(conn)}
                        sx={{ color: "#EF4444" }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "16px", color: "#0F172A" }}>
          Delete Google Sheet Connection?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "13px", color: "#64748B" }}>
            Are you sure you want to delete the connection for{" "}
            <strong>{connectionToDelete?.name || "this sheet"}</strong>? New row entries from this spreadsheet will no longer stream into your CRM.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteModalOpen(false)}
            disabled={deleting}
            sx={{ textTransform: "none", color: "#64748B" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting}
            sx={{ textTransform: "none", borderRadius: "6px" }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
