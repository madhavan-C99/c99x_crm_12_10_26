import { Box, Typography, MenuList, MenuItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CloseIcon from "@mui/icons-material/Close";

import { useAuth } from "@/shared/context/AuthContext";

const actions = [
  { label: "Move to Other Campaign", icon: DriveFileMoveOutlinedIcon, permission: "api_move_lead_campaign_admin" },
  { label: "Assign to Telecaller", icon: AssignmentIndOutlinedIcon, permission: "api_assign_lead_telecaller_admin" },
  { label: "Change Lead status", icon: ContentCopyOutlinedIcon, permission: "api_change_lead_status_admin" },
  { label: "Delete", icon: DeleteOutlineOutlinedIcon, permission: "api_delete_lead_summary_admin" },
  { label: "Close Leads", icon: CloseIcon },
];

function BulkActionsPanel({ onSelect, disabled = false }) {
  const { hasPermission } = useAuth();
  const visibleActions = actions.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <Box sx={{ p: 2, minWidth: 260 }}>
      <Typography
        sx={{
          fontFamily: "'Inter', sans-serif",
          color: "#8BC34A",
          fontWeight: 700,
          fontSize: "18px",
          mb: 1.2,
        }}
      >
        Choose Bulk Actions
      </Typography>

      <Divider sx={{ mb: 1, borderColor: "#E0E0E0" }} />

      <MenuList sx={{ p: 0 }}>
        {visibleActions.map(({ label, icon: Icon }) => (
          <MenuItem
            key={label}
            onClick={() => onSelect?.(label)}
            sx={{
              px: 1,
              py: 1,
              borderRadius: "6px",
              color: "#555555",
              "&:hover": {
                bgcolor: "#F5F5F5",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: "#888888" }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={label}
              primaryTypographyProps={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                fontSize: "15px",
                color: "#666666",
                whiteSpace: "nowrap",
              }}
            />
          </MenuItem>
        ))}
      </MenuList>
    </Box>
  );
}

export default BulkActionsPanel;