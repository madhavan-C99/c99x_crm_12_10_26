import React, { useState } from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import Table from "@/shared/components/table/Table";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AdminLeadRowDetails from "@/apps/admin/components/common/AdminLeadRowDetails";
import { useAuth } from "@/shared/context/AuthContext";

const LossLeadApprovalTable = ({
  tableData = [],
  loading = false,
  page = 1,
  pageSize = 50,
  totalRecords = 0,
  onPageChange,
  onRowsPerPageChange,
  onApprove,
  onReject,
  onReassign,
}) => {
  const { hasPermission } = useAuth();
  const [expandedLeadId, setExpandedLeadId] = useState(null);

  const handleRowClick = (row) => {
    const rowId = row?.id || row?.lead_id;
    setExpandedLeadId((prev) => (prev === rowId ? null : rowId));
  };

  const safeTableData = Array.isArray(tableData) ? tableData : [];

  const columns = [
    {
      field: "s_no",
      headerName: "S.No",
      minWidth: 70,
      renderCell: (row, index) => {
        const serialNo = (page - 1) * pageSize + index + 1;
        return (
          <Typography sx={{ fontSize: "14px", fontWeight: 500, color: "#334155" }}>
            {row?.s_no ?? serialNo}
          </Typography>
        );
      },
    },
    {
      field: "name",
      headerName: "Name",
      minWidth: 160,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#000000" }}>
          {row?.name || row?.full_name || "-"}
        </Typography>
      ),
    },
    {
      field: "contact",
      headerName: "Contact",
      minWidth: 160,
      renderCell: (row) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.8,
            justifyContent: "center",
          }}
        >
          <CallOutlinedIcon sx={{ fontSize: "15px", color: "#475569" }} />
          <Typography
            sx={{ fontSize: "14px", color: "#334155", fontWeight: 500 }}
          >
            {row?.contact || row?.mobile_no || "-"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "assigned_to",
      headerName: "Assigned to",
      minWidth: 150,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", fontWeight: 500, color: "#334155" }}>
          {row?.assigned_to || row?.user_name || row?.telecaller || "-"}
        </Typography>
      ),
    },
    {
      field: "effort_summary",
      headerName: "Effort Summary",
      minWidth: 160,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#000000" }}>
          {row?.effort_summary || (row?.calls_count !== undefined && row?.calls_count !== null ? `${row.calls_count} Calls Done` : "-")}
        </Typography>
      ),
    },
    {
      field: "loss_reason",
      headerName: "Loss Reason",
      minWidth: 180,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", fontWeight: 400, color: "#334155" }}>
          {row?.loss_reason || row?.main_reason || row?.reason || "-"}
        </Typography>
      ),
    },
    {
      field: "last_conversation_outcome",
      headerName: "Last Conversation Outcome",
      minWidth: 240,
      renderCell: (row) => (
        <Typography
          sx={{ fontWeight: 400, color: "#334155", fontSize: "14px" }}
        >
          {row?.last_conversation_outcome ||
            row?.last_conversation ||
            row?.outcome ||
            "-"}
        </Typography>
      ),
    },
    {
      field: "last_contacted",
      headerName: "Last Contacted",
      minWidth: 180,
      renderCell: (row) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.8,
            justifyContent: "center",
          }}
        >
          <EventOutlinedIcon sx={{ fontSize: "15px", color: "#475569" }} />
          <Typography
            sx={{ fontSize: "14px", color: "#334155", fontWeight: 400 }}
          >
            {row?.last_contacted ||
              row?.last_call_date ||
              "-"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "inquiry_date",
      headerName: "Inquiry Date",
      minWidth: 180,
      renderCell: (row) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.8,
            justifyContent: "center",
          }}
        >
          <EventOutlinedIcon sx={{ fontSize: "15px", color: "#475569" }} />
          <Typography
            sx={{ fontSize: "14px", color: "#334155", fontWeight: 400 }}
          >
            {row?.inquiry_date ||
              row?.created_at ||
              row?.joining_date ||
              "-"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "lead_age",
      headerName: "Lead Age",
      minWidth: 130,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#000000" }}>
          {row?.lead_age || row?.age || "-"}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 150,
      renderCell: (row) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "center",
          }}
        >
          {/* Red X / Reject Icon */}
          {hasPermission("api_action_loss_lead_approval_admin") && (
            <Tooltip title="Reject Loss Request" arrow placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onReject && onReject(row);
                }}
                sx={{ p: 0 }}
              >
                <CancelIcon sx={{ color: "#DC2626", fontSize: 22 }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Green Check / Approve Icon */}
          {hasPermission("api_action_loss_lead_approval_admin") && (
            <Tooltip title="Approve Loss Lead" arrow placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove && onApprove(row);
                }}
                sx={{ p: 0 }}
              >
                <CheckCircleIcon sx={{ color: "#16A34A", fontSize: 22 }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Blue Person / Reassign Icon */}
          {hasPermission("api_reassign_lead_admin") && (
            <Tooltip title="Reassign to Another Telecaller" arrow placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onReassign && onReassign(row);
                }}
                sx={{ p: 0 }}
              >
                <AccountCircleIcon sx={{ color: "#2563EB", fontSize: 22 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  const getRowStyle = (row) => {
    const isOverdue = String(row?.status || row?.due_status || "")
      .toLowerCase()
      .includes("over");
    return isOverdue
      ? {
          color: "#E53935 !important",
          "& td, & p, & span, & svg": {
            color: "#E53935 !important",
          },
        }
      : {};
  };

  return (
    <Table
      serverSide={true}
      page={page - 1}
      rowsPerPage={pageSize}
      totalCount={totalRecords}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      columns={columns}
      rows={safeTableData}
      loading={loading}
      minWidth={1900}
      sx={{ mt: 3 }}
      getRowStyle={getRowStyle}
      onRowClick={handleRowClick}
      getRowId={(row, index) => row?.id || row?.lead_id || row?.payment_id || index}
      expandedRowId={expandedLeadId}
      renderExpandedRow={(row) => (
        <AdminLeadRowDetails
          row={row}
          onClose={() => setExpandedLeadId(null)}
        />
      )}
    />
  );
};

export default LossLeadApprovalTable;
