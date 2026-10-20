import { Box, IconButton } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Table from "@/shared/components/table/Table";

function LeadSummaryTable({
  rows = [],
  loading = false,
  onSelectionChange,
  onView,
}) {
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
      minWidth: 80,
      renderCell: (row) => (
        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
          <IconButton
            size="small"
            sx={{ color: "#388E3C" }}
            onClick={() => onView?.(row)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
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
