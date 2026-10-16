import React from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  Skeleton,
} from "@mui/material";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import FlagIcon from "@mui/icons-material/Flag";

const FONT = "Inter, sans-serif";

const DEFAULT_MISSED_FOLLOWUPS = [];
const DEFAULT_PENDING_PAYMENTS = [];

export default function FollowUpAndPaymentsTables({
  missedFollowUps = [],
  pendingPayments = [],
  onViewAllMissed,
  onViewAllPending,
  loading = false,
  loadingMissed = false,
  loadingPending = false,
}) {
  const isMissedLoading = loading || loadingMissed;
  const isPendingLoading = loading || loadingPending;
  const tableHeadSx = {
    backgroundColor: "#F1F5F9",
    "& .MuiTableCell-root": {
      fontSize: "12.5px",
      fontWeight: 600,
      color: "#475569",
      fontFamily: FONT,
      py: 1.2,
      px: 1.5,
      borderBottom: "1px solid #E2E8F0",
      whiteSpace: "nowrap",
    },
  };

  const tableBodyCellSx = {
    fontSize: "13px",
    fontWeight: 500,
    color: "#1E293B",
    fontFamily: FONT,
    py: 1.1,
    px: 1.5,
    borderBottom: "1px solid #F1F5F9",
    whiteSpace: "nowrap",
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
        gap: 2.2,
        fontFamily: FONT,
      }}
    >
      {/* CARD 1: Missed Follow Up Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            px: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SchoolOutlinedIcon sx={{ fontSize: 20, color: "#84CC16" }} />
            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#1E293B",
                fontFamily: FONT,
              }}
            >
              Missed Follow Up
            </Typography>
          </Box>
          <Typography
            onClick={onViewAllMissed}
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#84CC16",
              cursor: "pointer",
              fontFamily: FONT,
              "&:hover": { color: "#65A30D", textDecoration: "underline" },
            }}
          >
            View All
          </Typography>
        </Box>

        {/* Table Container */}
        <TableContainer sx={{ maxHeight: 370 }}>
          <Table stickyHeader size="small">
            <TableHead sx={tableHeadSx}>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Mobile Number</TableCell>
                <TableCell align="center">Lead Stage</TableCell>
                <TableCell>Follow up date</TableCell>
                <TableCell>Telecaller</TableCell>
                <TableCell align="center">Flag</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isMissedLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={tableBodyCellSx}><Skeleton variant="text" width={90} height={20} animation="wave" /></TableCell>
                    <TableCell sx={tableBodyCellSx}><Skeleton variant="text" width={85} height={20} animation="wave" /></TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>
                      <Skeleton variant="rounded" width={60} height={22} animation="wave" sx={{ mx: "auto", borderRadius: "12px" }} />
                    </TableCell>
                    <TableCell sx={tableBodyCellSx}><Skeleton variant="text" width={75} height={20} animation="wave" /></TableCell>
                    <TableCell sx={tableBodyCellSx}><Skeleton variant="text" width={80} height={20} animation="wave" /></TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>
                      <Skeleton variant="circular" width={18} height={18} animation="wave" sx={{ mx: "auto" }} />
                    </TableCell>
                  </TableRow>
                ))
              ) : Array.isArray(missedFollowUps) && missedFollowUps.length > 0 ? (
                missedFollowUps.map((row, idx) => {
                  const name = row.student_name || row.name || row.lead_name || "—";
                  const mobile = row.mobile_no || row.mobile || row.phone || "—";
                  const stage = row.lead_stage || row.stage || row.status || "Missed";
                  const date = row.follow_up_date || row.date || row.due_date || row.next_follow_up || "—";
                  const telecaller = row.telecaller_name || row.telecaller || row.assigned_to || "—";
                  const flagColor = row.flag === "yellow" ? "#F59E0B" : "#EF4444";

                  return (
                    <TableRow
                      key={row.id || idx}
                      sx={{
                        "&:hover": { backgroundColor: "#F8FAFC" },
                        "&:last-child td": { borderBottom: 0 },
                      }}
                    >
                      <TableCell sx={tableBodyCellSx}>{name}</TableCell>
                      <TableCell sx={{ ...tableBodyCellSx, color: "#475569" }}>{mobile}</TableCell>
                      <TableCell align="center" sx={tableBodyCellSx}>
                        <Box
                          sx={{
                            display: "inline-block",
                            px: 1,
                            py: 0.2,
                            borderRadius: "12px",
                            border: "1.5px solid #F87171",
                            color: "#EF4444",
                            fontSize: "11px",
                            fontWeight: 600,
                            backgroundColor: "#FFFFFF",
                            lineHeight: 1.2,
                          }}
                        >
                          {stage}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ ...tableBodyCellSx, color: "#64748B" }}>{date}</TableCell>
                      <TableCell sx={tableBodyCellSx}>{telecaller}</TableCell>
                      <TableCell align="center" sx={tableBodyCellSx}>
                        <FlagIcon
                          sx={{
                            fontSize: 16,
                            color: flagColor,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: "#94A3B8", fontSize: "13px", fontFamily: FONT }}>
                    No missed follow-ups recorded
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* CARD 2: Pending Payment List Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            px: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SchoolOutlinedIcon sx={{ fontSize: 20, color: "#84CC16" }} />
            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#1E293B",
                fontFamily: FONT,
              }}
            >
              Pending Payment List
            </Typography>
          </Box>
          <Typography
            onClick={onViewAllPending}
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#84CC16",
              cursor: "pointer",
              fontFamily: FONT,
              "&:hover": { color: "#65A30D", textDecoration: "underline" },
            }}
          >
            View All
          </Typography>
        </Box>

        {/* Table Container */}
        <TableContainer sx={{ maxHeight: 370 }}>
          <Table stickyHeader size="small">
            <TableHead sx={tableHeadSx}>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Telecaller</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isPendingLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={tableBodyCellSx}><Skeleton variant="text" width={90} height={20} animation="wave" /></TableCell>
                    <TableCell sx={tableBodyCellSx}><Skeleton variant="text" width={95} height={20} animation="wave" /></TableCell>
                    <TableCell sx={tableBodyCellSx}><Skeleton variant="text" width={60} height={20} animation="wave" /></TableCell>
                    <TableCell sx={tableBodyCellSx}><Skeleton variant="text" width={75} height={20} animation="wave" /></TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>
                      <Skeleton variant="rounded" width={60} height={22} animation="wave" sx={{ mx: "auto", borderRadius: "6px" }} />
                    </TableCell>
                    <TableCell sx={tableBodyCellSx}><Skeleton variant="text" width={80} height={20} animation="wave" /></TableCell>
                  </TableRow>
                ))
              ) : Array.isArray(pendingPayments) && pendingPayments.length > 0 ? (
                pendingPayments.map((row, idx) => {
                  const name = row.student_name || row.name || row.lead_name || "—";
                  const course = row.course || row.course_name || "—";
                  const amount = row.amount || row.pending_amount || "—";
                  const dueDate = row.due_date || row.dueDate || "—";
                  const status = row.status || "Overdue";
                  const telecaller = row.telecaller_name || row.telecaller || row.assigned_to || "—";

                  return (
                    <TableRow
                      key={row.id || idx}
                      sx={{
                        "&:hover": { backgroundColor: "#F8FAFC" },
                        "&:last-child td": { borderBottom: 0 },
                      }}
                    >
                      <TableCell sx={tableBodyCellSx}>{name}</TableCell>
                      <TableCell sx={{ ...tableBodyCellSx, color: "#475569" }}>{course}</TableCell>
                      <TableCell sx={{ ...tableBodyCellSx, fontWeight: 600 }}>{amount}</TableCell>
                      <TableCell sx={{ ...tableBodyCellSx, color: "#64748B" }}>{dueDate}</TableCell>
                      <TableCell align="center" sx={tableBodyCellSx}>
                        <Box
                          sx={{
                            display: "inline-block",
                            px: 1,
                            py: 0.2,
                            borderRadius: "6px",
                            border: `1px solid ${status === "Pending" ? "#FDE68A" : "#FCA5A5"}`,
                            backgroundColor: status === "Pending" ? "#FFFBEB" : "#FEF2F2",
                            color: status === "Pending" ? "#D97706" : "#DC2626",
                            fontSize: "11px",
                            fontWeight: 600,
                            lineHeight: 1.2,
                          }}
                        >
                          {status}
                        </Box>
                      </TableCell>
                      <TableCell sx={tableBodyCellSx}>{telecaller}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: "#94A3B8", fontSize: "13px", fontFamily: FONT }}>
                    No pending payments recorded
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
