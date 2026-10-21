import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Dialog,
  DialogContent,
  Button,
} from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LocalPhoneOutlinedIcon from "@mui/icons-material/LocalPhoneOutlined";
import Table from "@/shared/components/table/Table";
import AdminLeadRowDetails from "@/apps/admin/components/common/AdminLeadRowDetails";
import { useAuth } from "@/shared/context/AuthContext";

const LeadTable = ({
  tableData = [],
  loading = false,
  page = 1,
  pageSize = 50,
  totalRecords = 0,
  onPageChange,
  onRowsPerPageChange,
  onEditLead,
  onRefreshLead,
  onReassignLead,
  onMarkAsWon,
  onMarkAsLost,
  onDeleteLead,
}) => {
  const { hasPermission } = useAuth();
  const [expandedLeadId, setExpandedLeadId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const selectedRowRef = useRef(null);

  const isMenuOpen = Boolean(anchorEl);




  const handleRowClick = (row) => {
    const rowId = row.id || row.lead_id;
    setExpandedLeadId((prev) => (prev === rowId ? null : rowId));
  };

  const handleMenuOpen = (event, row) => {
    event.stopPropagation();
    selectedRowRef.current = row;
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleWon = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const rowData = selectedRowRef.current || selectedRow;
    setAnchorEl(null);
    if (onMarkAsWon) onMarkAsWon(rowData || {});
  };

  const handleLost = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const rowData = selectedRowRef.current || selectedRow;
    setAnchorEl(null);
    if (onMarkAsLost) onMarkAsLost(rowData || {});
  };

  const handleDelete = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const rowData = selectedRowRef.current || selectedRow;
    setAnchorEl(null);
    if (rowData) {
      setLeadToDelete(rowData);
      setConfirmDeleteOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    setConfirmDeleteOpen(false);
    if (onDeleteLead && leadToDelete) {
      onDeleteLead(leadToDelete);
    }
    setLeadToDelete(null);
  };

  // Helper for dynamic stage badge colors matching Figma
  // const getStageBadgeStyle = (stageStr = "") => {
  //   const normalized = stageStr.toLowerCase();
  //   if (normalized.includes("won") || normalized.includes("closed won")) {
  //     return { bg: "#DFF3D6", color: "#3B8F1F", text: "Won" };
  //   }
  //   if (
  //     normalized.includes("loss") ||
  //     normalized.includes("lost") ||
  //     normalized.includes("drop") ||
  //     normalized.includes("reject") ||
  //     normalized.includes("cancel") ||
  //     normalized.includes("not interest") ||
  //     normalized.includes("no interest")
  //   ) {
  //     return { bg: "#F9D3D6", color: "#C22A34", text: "Lost" };
  //   }
  //   if (normalized.includes("follow")) {
  //     return { bg: "#FBE1F7", color: "#B0329E", text: "Follow up" };
  //   }
  //   if (
  //     normalized.includes("pending") ||
  //     normalized.includes("not connected")
  //   ) {
  //     return { bg: "#FBF4C6", color: "#9C8A00", text: "Missed Follow up" };
  //   }
  //   // Default New Lead Pill matching Figma
  //   return { bg: "#0000FF", color: "#FFFFFF", text: "New" };
  // };

  const columns = [
    {
      field: "s_no",
      headerName: "S.No",
      minWidth: 60,
      renderCell: (row) => {
        const index = tableData.indexOf(row);
        return (
          <Typography sx={{ fontSize: "14px", color: "#4B5563" }}>
            {row.s_no ?? (index >= 0 ? (page - 1) * pageSize + index + 1 : "-")}
          </Typography>
        );
      },
    },
    {
      field: "name",
      headerName: "Name",
      minWidth: 160,
      renderCell: (row) => (
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {row.full_name ||"-"}
        </Typography>
      ),
    },
    {
      field: "mobile_no",
      headerName: "Contact",
      minWidth: 160,
      renderCell: (row) => {
        const phoneVal = row.mobile_no || "-";
        const formattedPhone = phoneVal ? (phoneVal.startsWith("+") ? phoneVal : `+91 ${phoneVal}`) : "-";
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <LocalPhoneOutlinedIcon sx={{ fontSize: 16, color: "#6B7280" }} />
            <Typography sx={{ fontSize: "14px", color: "#374151", fontFamily: "Inter, sans-serif" }}>
              {formattedPhone}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "assigned_to",
      headerName: "Assigned to",
      minWidth: 140,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", color: "#374151" }}>
          {row.assigned_to || ""}
        </Typography>
      ),
    },
    {
      field: "stage",
      headerName: "Stage",
      minWidth: 110,
      renderCell: (row) => {
        const b_Color=row.stage_color;
        const color=row.color || "white"
        return (
          <Box
            sx={{
              backgroundColor: b_Color,
              color: b_Color && b_Color !== "#FFFFFF" ? " #FFFFFF" :" #000000",
              px: 1.8,
              py: 1,
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: 700,
              display: "inline-block",
              textAlign: "center",
            }}
          >
            {row.stage_name || "-"}
          </Box>
        );
      },
    },
    {
      field: "pipeline",
      headerName: "Pipeline",
      minWidth: 140,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", color: "#374151" }}>
          {row.pipeline_name ||"-"}
        </Typography>
      ),
    },
    {
      field: "campaign_name",
      headerName: "Campaign",
      minWidth: 160,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", color: "#374151" }}>
          {row.campaign_name || ""}
        </Typography>
      ),
    },
    {
      field: "source",
      headerName: "Source",
      minWidth: 120,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", color: "#374151" }}>
          {row.source_name || "-"}
        </Typography>
      ),
    },
    {
      field: "course_plan",
      headerName: "Course Plan",
      minWidth: 140,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", color: "#374151" }}>
          {row.course_plan_name || ""}
        </Typography>
      ),
    },
    {
      field: "course_name",
      headerName: "Course",
      minWidth: 200,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", color: "#374151" }}>
          {row.course_name || ""}
        </Typography>
      ),
    },
    {
      field: "next_follow_up",
      headerName: "Next Follow-Up",
      minWidth: 170,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", color: "#374151" }}>
          {row.next_follow_up ||  "-"}
        </Typography>
      ),
    },
    {
      field: "amount",
      headerName: "Amount",
      minWidth: 110,
      renderCell: (row) => (
        <Typography
          sx={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}
        >
          {row.amount || "-"}
        </Typography>
      ),
    },
    {
      field: "pending_amount",
      headerName: "Pending Amount",
      minWidth: 150,
      renderCell: (row) => (
        <Typography
          sx={{ fontSize: "14px", fontWeight: 600, color: "#EF4444" }}
        >
          {row.pending_amount ||""}
        </Typography>
      ),
    },
    {
      field: "last_contacted",
      headerName: "Last Contacted",
      minWidth: 170,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", color: "#374151" }}>
          {row.last_contacted || "-"}
        </Typography>
      ),
    },
    {
      field: "last_conversation_outcome",
      headerName: "Last Conversation Outcome",
      minWidth: 220,
      renderCell: (row) => (
        <Typography
          sx={{
            fontSize: "14px",
            color: "#374151",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 220,
          }}
        >
          {row.last_conversation_outcome || "-"}
        </Typography>
      ),
    },
    {
      field: "created",
      headerName: "Created",
      minWidth: 170,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", color: "#374151" }}>
          {row.created_at || "-"}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 90,
      renderCell: (row) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          {/* Pencil Edit Icon */}
          {hasPermission("api_edit_lead_admin") && (
            <Tooltip title="Edit" arrow placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEditLead) onEditLead(row);
                }}
                sx={{ color: "#374151", "&:hover": { backgroundColor: "#F3F4F6" } }}
              >
                <EditOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Reassign Lead Icon (Autorenew) */}
          {hasPermission("api_reassign_lead_admin") && (
            <Tooltip title="Reassign Lead" arrow placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onReassignLead) onReassignLead(row);
                  else if (onRefreshLead) onRefreshLead(row);
                }}
                sx={{ color: "#374151", "&:hover": { backgroundColor: "#F3F4F6" } }}
              >
                <AutorenewIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Three Vertical Dots Menu Icon */}
          <Tooltip title="More Actions" arrow placement="top">
            <IconButton
              size="small"
              onClick={(e) => handleMenuOpen(e, row)}
              sx={{ color: "#374151", "&:hover": { backgroundColor: "#F3F4F6" } }}
            >
              <MoreVertIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography
        sx={{
          fontSize: "14px",
          fontWeight: 400,
          color: "#4B5563",
          fontFamily: "Inter, sans-serif",
          mb: 1.2,
        }}
      >
        Showing{" "}
        <Box component="span" sx={{ fontWeight: 700, color: "#111827" }}>
          {totalRecords}
        </Box>{" "}
        leads
      </Typography>

      <Table
        serverSide={true}
        page={page - 1}
        rowsPerPage={pageSize}
        totalCount={totalRecords}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        columns={columns}
        rows={tableData}
        loading={loading}
        minWidth={2100}
        sx={{ mt: 0 }}
        onRowClick={handleRowClick}
        getRowId={(row) => row.id || row.lead_id || row.mobile_no}
        expandedRowId={expandedLeadId}
        renderExpandedRow={(row) => (
          <AdminLeadRowDetails
            row={row}
            onClose={() => setExpandedLeadId(null)}
          />
        )}
      />

      {/* Action Menu Popover matching screenshot design */}
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: "10px",
            boxShadow: "0px 4px 16px rgba(0,0,0,0.12)",
            minWidth: "165px",
            py: 0.5,
          },
        }}
      >
        {hasPermission("api_mark_as_won_admin") && (
          <MenuItem onClick={handleWon} sx={{ fontSize: "14px", py: 1 }}>
            <ListItemIcon sx={{ minWidth: "32px", color: "#374151" }}>
              <CheckCircleOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Mark as Won"
              primaryTypographyProps={{ fontSize: "14px" }}
            />
          </MenuItem>
        )}

        {hasPermission("api_mark_as_lost_admin") && (
          <MenuItem onClick={handleLost} sx={{ fontSize: "14px", py: 1 }}>
            <ListItemIcon sx={{ minWidth: "32px", color: "#374151" }}>
              <CancelOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Mark as Lost"
              primaryTypographyProps={{ fontSize: "14px" }}
            />
          </MenuItem>
        )}

        {hasPermission("api_delete_lead_admin") && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              onClick={handleDelete}
              sx={{ fontSize: "14px", color: "#EF4444", py: 1 }}
            >
              <ListItemIcon sx={{ minWidth: "32px", color: "#EF4444" }}>
                <DeleteOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Delete Lead"
                primaryTypographyProps={{ fontSize: "14px", color: "#EF4444" }}
              />
            </MenuItem>
          </>
        )}
      </Menu>


      {/* Exact Figma "Are you sure?" Delete Confirmation Popup */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: "480px",
            maxWidth: "92vw",
            borderRadius: "14px",
            overflow: "hidden",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.16)",
            backgroundColor: "#FFFFFF",
          },
        }}
      >
        <DialogContent sx={{ p: "32px 36px 28px 36px !important" }}>
          <Typography
            sx={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#84CC16",
              mb: 2,
              letterSpacing: "-0.2px",
            }}
          >
            Are you sure?
          </Typography>

          <Typography
            sx={{
              fontSize: "14.5px",
              color: "#475569",
              fontWeight: 400,
              lineHeight: 1.5,
              mb: 0.8,
            }}
          >
            Are you sure you want to delete this lead?
          </Typography>

          <Typography
            sx={{
              fontSize: "14.5px",
              color: "#475569",
              fontWeight: 400,
              lineHeight: 1.5,
              mb: 3.5,
            }}
          >
            Click "No" to go back, or "Yes" to delete the lead.
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              alignItems: "center",
            }}
          >
            <Button
              onClick={() => setConfirmDeleteOpen(false)}
              sx={{
                border: "1.5px solid #84CC16",
                color: "#84CC16",
                fontWeight: 700,
                fontSize: "14px",
                borderRadius: "8px",
                minWidth: "86px",
                height: "38px",
                px: 3,
                textTransform: "none",
                backgroundColor: "#FFFFFF",
                "&:hover": { backgroundColor: "#F7FEE7", borderColor: "#65A30D" },
              }}
            >
              No
            </Button>

            <Button
              onClick={handleConfirmDelete}
              sx={{
                backgroundColor: "#84CC16",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "14px",
                borderRadius: "8px",
                minWidth: "86px",
                height: "38px",
                px: 3,
                textTransform: "none",
                "&:hover": { backgroundColor: "#65A30D" },
              }}
            >
              Yes
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default LeadTable;
