import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { fetchLeadCallHistory } from "@/shared/services/callHistoryService";

const BRAND_GREEN = "#8DC63F";
const BRAND_GREEN_DARK = "#7CB342";

function formatHistoryRow(row, fallbackAssignedUser = "No Data") {
  // 1. User Assigned
  const userAssigned =
    row.userAssigned ||
    row.telecaller_name ||
    row.telecaller ||
    row.assigned_to ||
    row.first_name ||
    row.user_name ||
    row.user ||
    row.username ||
    (fallbackAssignedUser && fallbackAssignedUser !== "-" ? fallbackAssignedUser : "No Data");

  // 2. Date & Time Parsing
  const rawDateStr = row.called_at || row.callDate || row.call_date || row.called_date || row.created_at || "";
  let callDate = "No Data";
  let callTime = row.callTime || row.call_time || row.called_time || "No Data";

  if (rawDateStr) {
    try {
      const d = new Date(rawDateStr);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, "0");
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = monthNames[d.getMonth()];
        const year = d.getFullYear();
        callDate = `${day}-${month}-${year}`;

        if (callTime === "No Data") {
          let hours = d.getHours();
          const minutes = String(d.getMinutes()).padStart(2, "0");
          const ampm = hours >= 12 ? "PM" : "AM";
          hours = hours % 12 || 12;
          callTime = `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
        }
      } else {
        callDate = String(rawDateStr).split("T")[0] || String(rawDateStr);
      }
    } catch (e) {
      callDate = String(rawDateStr);
    }
  }

  // 3. Call Status
  const callStatus = row.callStatus || row.connection_status || row.call_status || row.status || "No Data";

  // 4. Lead Stage (Backend SQL query returns 'name' for Stage)
  const rawStage = row.name || row.leadStage || row.pipeline_stage || row.stage_name || row.stage || row.lead_stage;
  const leadStage = (rawStage && String(rawStage).trim()) ? String(rawStage).trim() : "No Data";

  // 5. Tag
  const rawTag = row.select_tag || row.tag || row.tag_name || row.priority;
  const tag = (rawTag && String(rawTag).trim()) ? String(rawTag).trim() : "No Data";

  // 6. Remarks / Call Notes
  const rawRemarks = row.call_notes || row.remarks || row.conversation_summary || row.call_summary || row.notes || row.retry_notes;
  const remarks = (rawRemarks && String(rawRemarks).trim()) ? String(rawRemarks).trim() : "No Data";

  return {
    userAssigned,
    callDate,
    callTime,
    callStatus,
    leadStage,
    tag,
    remarks,
    reassignCampaign: row.reassignCampaign || "No",
    reassignUser: row.reassignUser || "No",
  };
}

export default function LeadHistoryModal({ open, onClose, lead = {} }) {
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCallHistory() {
      if (open && lead?.id) {
        setLoading(true);
        try {
          const res = await fetchLeadCallHistory(lead.id);
          if (res?.data?.data && Array.isArray(res.data.data)) {
            setHistoryLogs(res.data.data);
          } else {
            setHistoryLogs([]);
          }
        } catch (e) {
          console.error("Failed to fetch call history:", e);
          setHistoryLogs([]);
        } finally {
          setLoading(false);
        }
      } else {
        setHistoryLogs([]);
      }
    }
    loadCallHistory();
  }, [open, lead]);

  const assignedUserFallback = lead.assigned_to || lead.assignedTo || "No Data";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      sx={{
        "& .MuiDialog-paper": {
          width: "840px !important",
          maxWidth: "95vw !important",
          borderRadius: "16px",
          p: 1,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2.5,
          pt: 2,
          pb: 1.5,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: BRAND_GREEN,
            fontSize: "18px",
          }}
        >
          View Lead History
        </Typography>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "#9CA3AF",
            "&:hover": { color: "#4B5563", backgroundColor: "#F3F4F6" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 2, pb: 2.5, pt: 1 }}>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: "1px solid #EAEAEA",
            borderRadius: "8px",
            maxHeight: "380px",
            overflowX: "hidden",
            overflowY: "auto",
          }}
        >
          <Table stickyHeader size="small" sx={{ minWidth: "100%", tableLayout: "auto" }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    backgroundColor: "#EBEBEB",
                    color: "#444444",
                    fontWeight: 700,
                    fontSize: 12.5,
                    py: 1.5,
                    px: 1.2,
                    borderBottom: "1px solid #D0D0D0",
                    whiteSpace: "nowrap",
                  }}
                >
                  User Assigned
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: "#EBEBEB",
                    color: "#444444",
                    fontWeight: 700,
                    fontSize: 12.5,
                    py: 1.5,
                    px: 1.2,
                    borderBottom: "1px solid #D0D0D0",
                    whiteSpace: "nowrap",
                  }}
                >
                  Call Date
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: "#EBEBEB",
                    color: "#444444",
                    fontWeight: 700,
                    fontSize: 12.5,
                    py: 1.5,
                    px: 1.2,
                    borderBottom: "1px solid #D0D0D0",
                    whiteSpace: "nowrap",
                  }}
                >
                  Call Time
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: "#EBEBEB",
                    color: "#444444",
                    fontWeight: 700,
                    fontSize: 12.5,
                    py: 1.5,
                    px: 1.2,
                    borderBottom: "1px solid #D0D0D0",
                    whiteSpace: "nowrap",
                  }}
                >
                  Call Status
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: "#EBEBEB",
                    color: "#444444",
                    fontWeight: 700,
                    fontSize: 12.5,
                    py: 1.5,
                    px: 1.2,
                    borderBottom: "1px solid #D0D0D0",
                    whiteSpace: "nowrap",
                  }}
                >
                  Lead Stage
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: "#EBEBEB",
                    color: "#444444",
                    fontWeight: 700,
                    fontSize: 12.5,
                    py: 1.5,
                    px: 1.2,
                    borderBottom: "1px solid #D0D0D0",
                    whiteSpace: "nowrap",
                  }}
                >
                  Tag
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: "#EBEBEB",
                    color: "#444444",
                    fontWeight: 700,
                    fontSize: 12.5,
                    py: 1.5,
                    px: 1.2,
                    borderBottom: "1px solid #D0D0D0",
                  }}
                >
                  Remarks
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: "#EBEBEB",
                    color: "#444444",
                    fontWeight: 700,
                    fontSize: 12.5,
                    py: 1.5,
                    px: 1.2,
                    borderBottom: "1px solid #D0D0D0",
                    textAlign: "center",
                  }}
                >
                  Reassign Campaign
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: "#EBEBEB",
                    color: "#444444",
                    fontWeight: 700,
                    fontSize: 12.5,
                    py: 1.5,
                    px: 1.2,
                    borderBottom: "1px solid #D0D0D0",
                    textAlign: "center",
                  }}
                >
                  Reassign User
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={26} sx={{ color: BRAND_GREEN }} />
                    <Typography sx={{ fontSize: 13, color: "#666", mt: 1 }}>Loading lead history...</Typography>
                  </TableCell>
                </TableRow>
              ) : historyLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography sx={{ fontSize: 13.5, color: "#777", fontWeight: 500 }}>
                      No call history recorded yet for this lead.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                historyLogs.map((rawRow, index) => {
                  const item = formatHistoryRow(rawRow, assignedUserFallback);
                  return (
                    <TableRow
                      key={rawRow.id || index}
                      sx={{
                        "&:hover": { backgroundColor: "#F9FAFB" },
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      <TableCell sx={{ fontSize: 12.5, color: "#222", py: 1.2, px: 1.2, borderBottom: "1px solid #EAEAEA", whiteSpace: "nowrap" }}>
                        {item.userAssigned}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12.5, color: "#222", py: 1.2, px: 1.2, borderBottom: "1px solid #EAEAEA", whiteSpace: "nowrap" }}>
                        {item.callDate}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12.5, color: "#222", py: 1.2, px: 1.2, borderBottom: "1px solid #EAEAEA", whiteSpace: "nowrap" }}>
                        {item.callTime}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12.5, color: "#222", py: 1.2, px: 1.2, borderBottom: "1px solid #EAEAEA" }}>
                        {item.callStatus}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12.5, color: "#222", py: 1.2, px: 1.2, borderBottom: "1px solid #EAEAEA" }}>
                        {item.leadStage}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12.5, color: "#222", py: 1.2, px: 1.2, borderBottom: "1px solid #EAEAEA" }}>
                        {item.tag}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12.5, color: "#222", py: 1.2, px: 1.2, borderBottom: "1px solid #EAEAEA" }}>
                        {item.remarks}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12.5, color: "#222", py: 1.2, px: 1.2, borderBottom: "1px solid #EAEAEA", textAlign: "center" }}>
                        {item.reassignCampaign}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12.5, color: "#222", py: 1.2, px: 1.2, borderBottom: "1px solid #EAEAEA", textAlign: "center" }}>
                        {item.reassignUser}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer Action Button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2.5 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderColor: BRAND_GREEN,
              color: BRAND_GREEN,
              borderRadius: "8px",
              textTransform: "none",
              px: 3,
              py: 0.6,
              fontSize: 14,
              fontWeight: 600,
              minWidth: 90,
              "&:hover": {
                borderColor: BRAND_GREEN_DARK,
                backgroundColor: "rgba(141, 198, 63, 0.08)",
              },
            }}
          >
            Cancel
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
