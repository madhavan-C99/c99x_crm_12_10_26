import { Box, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import Table from "@/shared/components/table/Table";
import { useAuth } from "@/shared/context/AuthContext";

function LeadSummaryTable({
  rows = [],
  loading = false,
  onSelectionChange,
  onEdit,
  onView,
  onDelete,
}) {
  const { hasPermission } = useAuth();
  const columns = [
    { field: "no", headerName: "No", minWidth: 60 },
    { field: "lead_name", headerName: "Lead Name", minWidth: 140 },
    { field: "lead_number", headerName: "Lead Number", minWidth: 130 },
    { field: "email", headerName: "Email ID", minWidth: 180 },
    { field: "campaign_name", headerName: "Campaign Name", minWidth: 150 },
    { field: "lead_source", headerName: "Lead Source", minWidth: 120 },
    { field: "creation_date", headerName: "Creation Date", minWidth: 120 },
    { field: "updated_at", headerName: "Updated at", minWidth: 140 },
    { field: "lead_stage", headerName: "Lead Stage", minWidth: 130 },
    { field: "tag", headerName: "Tag", minWidth: 120 },
    { field: "assigned_to", headerName: "Assigned to", minWidth: 130 },
    { field: "followup_time", headerName: "Follow up Time", minWidth: 140 },
    { field: "lead_status", headerName: "Lead Status", minWidth: 120 },
    { field: "deal_amount", headerName: "Deal Amount", minWidth: 120 },
    { field: "last_contacted", headerName: "Last Contacted", minWidth: 140 },
    {
      field: "call_attempt_count",
      headerName: "Call Attempt Count",
      minWidth: 150,
    },

    {
      field: "action",
      headerName: "Action",
      minWidth: 120,
      renderCell: (row) => (
        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
          {hasPermission("api_update_lead_summary_admin") && (
            <IconButton
              size="small"
              sx={{ color: "#1976D2" }}
              onClick={() => onEdit?.(row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}

          <IconButton
            size="small"
            sx={{ color: "#388E3C" }}
            onClick={() => onView?.(row)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>

          {hasPermission("api_delete_lead_summary_admin") && (
            <IconButton
              size="small"
              sx={{ color: "#D32F2F" }}
              onClick={() => onDelete?.(row)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      rows={rows}
      loading={loading}
      selectable
      onSelectionChange={onSelectionChange}
    />
  );
}

export default LeadSummaryTable;
