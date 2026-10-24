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
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import { GoogleFormsIcon } from "./GoogleFormsConnectDialog";

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
 * Status Badge Component
 */
function StatusBadge({ status, failedCount = 0 }) {
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
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
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

      {failedCount > 0 && (
        <Chip
          label={`Failed: ${failedCount}`}
          size="small"
          sx={{
            height: 22,
            fontSize: "11px",
            fontWeight: 700,
            fontFamily: "Inter, sans-serif",
            backgroundColor: "#FEF2F2",
            color: "#DC2626",
            border: "1px solid #FCA5A5",
          }}
        />
      )}
    </Box>
  );
}

/**
 * Google Forms Connections Table
 * Displays all active Google Forms connections with status badges, leads synced,
 * "View Code" action, and "Delete" confirmation modal.
 */
export default function GoogleFormsTable({
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
          Failed to load Google Forms connections
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
              textTransform: "none",
              color: "#991B1B",
              borderColor: "#FCA5A5",
              borderRadius: "6px",
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
            backgroundColor: "#F3E8FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GoogleFormsIcon size={34} />
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
            No Google Forms connected yet
          </Typography>
          <Typography
            sx={{
              fontSize: "14px",
              color: "#64748B",
              fontFamily: "Inter, sans-serif",
              lineHeight: 1.5,
            }}
          >
            Connect your Google Forms to automatically stream respondent submissions directly into your CRM pipelines.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onOpenConnect}
          sx={{
            backgroundColor: "#84CC16",
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
              backgroundColor: "#65A30D",
              boxShadow: "none",
            },
          }}
        >
          Connect Google Form
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
          <Table aria-label="google forms connections table">
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
                  Name
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
                  Leads Synced
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
                const failedCount = conn.failedLeadsCount ?? 0;

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
                        <GoogleFormsIcon size={24} />
                        <Box>
                          <Typography
                            sx={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#0F172A",
                              fontFamily: "Inter, sans-serif",
                            }}
                          >
                            {conn.name}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "12px",
                              color: "#64748B",
                              fontFamily: "Inter, sans-serif",
                            }}
                          >
                            Added {formatDate(conn.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Pipeline Column */}
                    <TableCell sx={{ py: 2 }}>
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#1E293B",
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
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#1E293B",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {campaignName}
                      </Typography>
                    </TableCell>

                    {/* Leads Synced */}
                    <TableCell sx={{ py: 2 }}>
                      <Chip
                        label={`${totalSynced} leads`}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "11px",
                          fontWeight: 700,
                          fontFamily: "Inter, sans-serif",
                          backgroundColor: totalSynced > 0 ? "#F0FDF4" : "#F1F5F9",
                          color: totalSynced > 0 ? "#15803D" : "#64748B",
                          border: totalSynced > 0 ? "1px solid #BBF7D0" : "1px solid #E2E8F0",
                        }}
                      />
                    </TableCell>

                    {/* Status Badge + Failed count */}
                    <TableCell sx={{ py: 2 }}>
                      <StatusBadge
                        status={conn.status}
                        failedCount={failedCount}
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right" sx={{ py: 2, pr: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 1,
                        }}
                      >
                        <Tooltip title="View Apps Script code and instructions">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CodeIcon sx={{ fontSize: 16 }} />}
                            onClick={() => onViewCode(conn)}
                            sx={{
                              textTransform: "none",
                              fontSize: "12px",
                              fontFamily: "Inter, sans-serif",
                              fontWeight: 500,
                              borderRadius: "6px",
                              color: "#475569",
                              borderColor: "#CBD5E1",
                              backgroundColor: "#FFFFFF",
                              "&:hover": {
                                borderColor: "#84CC16",
                                color: "#0F172A",
                                backgroundColor: "#F8FAFC",
                              },
                            }}
                          >
                            View Code
                          </Button>
                        </Tooltip>

                        <Tooltip title="Delete this connection">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDelete(conn)}
                            sx={{
                              borderRadius: "6px",
                              border: "1px solid #FECACA",
                              backgroundColor: "#FEF2F2",
                              "&:hover": {
                                backgroundColor: "#FEE2E2",
                                borderColor: "#F87171",
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
        /* MOBILE CARD STACK VIEW */
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {connections.map((conn) => {
            const connId = conn.id || conn.uid;
            const pipelineName =
              conn.pipeline?.name || conn.pipelineName || "-";
            const campaignName =
              conn.campaign?.name || conn.campaignName || "-";
            const totalSynced = conn.totalLeadsSynced ?? 0;
            const failedCount = conn.failedLeadsCount ?? 0;

            return (
              <Card
                key={connId}
                elevation={0}
                sx={{
                  borderRadius: "12px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1.5,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <GoogleFormsIcon size={24} />
                      <Typography
                        sx={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#0F172A",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {conn.name}
                      </Typography>
                    </Box>
                    <StatusBadge
                      status={conn.status}
                      failedCount={failedCount}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: "8px",
                      backgroundColor: "#F8FAFC",
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                        Pipeline
                      </Typography>
                      <Typography
                        sx={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}
                      >
                        {pipelineName}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                        Campaign
                      </Typography>
                      <Typography
                        sx={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}
                      >
                        {campaignName}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                        Leads Synced
                      </Typography>
                      <Typography
                        sx={{ fontSize: "13px", fontWeight: 700, color: "#15803D" }}
                      >
                        {totalSynced} leads
                      </Typography>
                    </Box>

                    <Box>
                      <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                        Added On
                      </Typography>
                      <Typography sx={{ fontSize: "13px", color: "#475569" }}>
                        {formatDate(conn.createdAt)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      startIcon={<CodeIcon sx={{ fontSize: 16 }} />}
                      onClick={() => onViewCode(conn)}
                      sx={{
                        textTransform: "none",
                        fontSize: "13px",
                        fontFamily: "Inter, sans-serif",
                        color: "#334155",
                        borderColor: "#CBD5E1",
                      }}
                    >
                      View Code
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleOpenDelete(conn)}
                      sx={{ minWidth: 42, px: 1 }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setConnectionToDelete(null);
          }
        }}
        maxWidth="xs"
        fullWidth
        aria-labelledby="delete-google-connection-dialog-title"
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "14px",
            p: 1,
            backgroundColor: "#FFFFFF",
          },
        }}
      >
        <DialogTitle
          id="delete-google-connection-dialog-title"
          sx={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#0F172A",
            fontFamily: "Inter, sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "#FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <WarningAmberRoundedIcon sx={{ color: "#DC2626", fontSize: 22 }} />
          </Box>
          Disconnect Google Form?
        </DialogTitle>

        <DialogContent>
          <DialogContentText
            sx={{
              fontSize: "14px",
              color: "#475569",
              fontFamily: "Inter, sans-serif",
              lineHeight: 1.6,
            }}
          >
            Deleting removes this connection from the CRM. Remember to remove the script from your Google Form, otherwise it will keep sending leads which the CRM will reject.
          </DialogContentText>

          {connectionToDelete && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: "8px",
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
              }}
            >
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0F172A",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {connectionToDelete.name}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDeleteModalOpen(false);
              setConnectionToDelete(null);
            }}
            disabled={deleting}
            sx={{
              textTransform: "none",
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
              color: "#64748B",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting}
            sx={{
              textTransform: "none",
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              borderRadius: "6px",
              px: 2.5,
              boxShadow: "none",
            }}
          >
            {deleting ? "Deleting..." : "Delete Connection"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
