import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

import Table from "@/shared/components/table/Table";

export default function UserTable({
  tableData = [],
  loading = false,
  page = 1,
  pageSize = 50,
  totalRecords = 0,
  onPageChange,
  onRowsPerPageChange,
  onEditUser,
  onDeactivateUser,
  onChangePassword,
  onViewCampaigns,
  onTransferLeads,
  onDeleteUser,
  onToggleLeadAllocation,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionStates, setActionStates] = useState({});

  const handleMenuOpen = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedUser(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    const userToEdit = selectedUser;
    handleMenuClose();
    if (onEditUser) {
      onEditUser(userToEdit);
    }
  };

  const handleDeactivateClick = () => {
    const userToDeactivate = selectedUser;
    handleMenuClose();
    if (onDeactivateUser) {
      onDeactivateUser(userToDeactivate);
    }
  };

  const handleChangePasswordClick = () => {
    const userToChange = selectedUser;
    handleMenuClose();
    if (onChangePassword) {
      onChangePassword(userToChange);
    }
  };

  const handleViewCampaignsClick = () => {
    const userToView = selectedUser;
    handleMenuClose();
    if (onViewCampaigns) {
      onViewCampaigns(userToView);
    }
  };

  const handleTransferLeadsClick = () => {
    const userToTransfer = selectedUser;
    handleMenuClose();
    if (onTransferLeads) {
      onTransferLeads(userToTransfer);
    }
  };

  const handleDeleteClick = () => {
    const userToDelete = selectedUser;
    handleMenuClose();
    if (onDeleteUser) {
      onDeleteUser(userToDelete);
    }
  };

  const handleToggleActionState = (row) => {
    const apiVal =
      row.is_lead_enabled !== undefined
        ? row.is_lead_enabled
        : row.raw?.is_lead_enabled !== undefined
        ? row.raw?.is_lead_enabled
        : true;
    const currentVal = actionStates[row.id] ?? apiVal;
    const newVal = !currentVal;
    setActionStates((prev) => ({
      ...prev,
      [row.id]: newVal,
    }));
    if (onToggleLeadAllocation) {
      onToggleLeadAllocation(row, newVal);
    }
  };

  const columns = [
    {
      field: "s_no",
      headerName: "S.No",
      minWidth: 60,
      renderCell: (row, idx) => (
        <Typography sx={{ fontSize: "14px",fontWeight:500, color: "#374151" }}>
          {row.s_no ?? idx + 1}
        </Typography>
      ),
    },
    {
      field: "emp_id",
      headerName: "Employee Id",
      minWidth: 140,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", color: "#374151" }}>
          {row.emp_id || row.employee_id || ""}
        </Typography>
      ),
    },
    {
      field: "name",
      headerName: "Name",
      minWidth: 120,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", color: "#374151", fontWeight: 500 }}>
          {row.name || row.full_name || ""}
        </Typography>
      ),
    },
    {
      field: "mobile_no",
      headerName: "Mobile No",
      minWidth: 140,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", color: "#374151" }}>
          {row.mobile_no || row.phone_no || ""}
        </Typography>
      ),
    },
    {
      field: "location",
      headerName: "Location",
      minWidth: 130,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", color: "#374151" }}>
          {row.location || ""}
        </Typography>
      ),
    },
    {
      field: "email",
      headerName: "Email",
      minWidth: 200,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", color: "#374151" }}>
          {row.email || ""}
        </Typography>
      ),
    },
    {
      field: "role",
      headerName: "Role",
      minWidth: 130,
      renderCell: (row) => (
        <Typography sx={{ fontSize: "14px", color: "#374151" }}>
          {row.role || ""}
        </Typography>
      ),
    },
    {
      field: "reporting_to",
      headerName: "Reporting to",
      minWidth: 150,
      renderCell: (row) => {
        const val = row.reporting_to;
        const display =
          typeof val === "object" && val !== null
            ? val.name || val.full_name || val.username || ""
            : val || "";
        return (
          <Typography sx={{ fontSize: "14px", color: "#374151" }}>
            {display}
          </Typography>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      renderCell: (row) => {
        const isActive = (row.status || "").toLowerCase() === "active";
        return (
          <Box
            sx={{
              backgroundColor: isActive ? "#E2F1C6" : "#FBC6C6",
              color: isActive ? "#4A7C15" : "#991B1B",
              px: 2,
              py: 0.5,
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              display: "inline-block",
              textAlign: "center",
              minWidth: "80px",
            }}
          >
            {row.status || ""}
          </Box>
        );
      },
    },
    {
      field: "lead",
      headerName: "Lead",
      minWidth: 140,
      renderCell: (row) => {
        const apiVal =
          row.is_lead_enabled !== undefined
            ? row.is_lead_enabled
            : row.raw?.is_lead_enabled !== undefined
            ? row.raw?.is_lead_enabled
            : true;
        const isChecked = actionStates[row.id] ?? apiVal;
        return (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
            <Switch
              checked={isChecked}
              onChange={() => handleToggleActionState(row)}
              sx={{
                width: 54,
                height: 26,
                padding: 0,
                "& .MuiSwitch-switchBase": {
                  padding: "2px",
                  margin: 0,
                  transitionDuration: "300ms",
                  "&.Mui-checked": {
                    transform: "translateX(28px)",
                    color: "#FFFFFF",
                    "& + .MuiSwitch-track": {
                      backgroundColor: "#84CC16",
                      opacity: 1,
                      border: 0,
                    },
                  },
                },
                "& .MuiSwitch-thumb": {
                  boxSizing: "border-box",
                  width: 22,
                  height: 22,
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0px 1px 3px rgba(0,0,0,0.3)",
                },
                "& .MuiSwitch-track": {
                  borderRadius: 26 / 2,
                  backgroundColor: "#EF4444",
                  opacity: 1,
                },
              }}
            />
            <Typography
              sx={{
                fontSize: "12.5px",
                fontWeight: 600,
                color: isChecked ? "#15803D" : "#DC2626",
                minWidth: "48px",
                textAlign: "left",
              }}
            >
              {isChecked ? "Enable" : "Disable"}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "actions",
      headerName: "Action",
      minWidth: 80,
      renderCell: (row) => (
        <IconButton
          size="small"
          onClick={(e) => handleMenuOpen(e, row)}
          sx={{ color: "#111827" }}
        >
          <MoreVertIcon sx={{ fontSize: 20 }} />
        </IconButton>
      ),
    },
  ];

  return (
    <>
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
        minWidth={1818}
        sx={{ mt: 1 }}
      />

      {/* Action Popover Menu matching screenshot */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        sx={{
          "& .MuiPaper-root": {
            minWidth: "260px !important",
            width: "260px !important",
            borderRadius: "12px",
            py: 0.8,
            px: 0.5,
            boxShadow: "0px 6px 20px rgba(0,0,0,0.12)",
          },
        }}
        slotProps={{
          paper: {
            style: {
              minWidth: "260px",
              width: "260px",
            },
          },
        }}
      >
        <MenuItem onClick={handleEditClick} sx={{ py: 0.8, px: 2 }}>
          <ListItemIcon sx={{ minWidth: 30, color: "#374151" }}>
            <EditOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <Typography sx={{ fontSize: "14px !important", fontWeight: 500, color: "#374151" }}>
            Edit
          </Typography>
        </MenuItem>
        <Divider sx={{ my: 0.3, borderColor: "#F1F5F9" }} />

        <MenuItem onClick={handleDeactivateClick} sx={{ py: 0.8, px: 2 }}>
          <ListItemIcon sx={{ minWidth: 30, color: "#374151" }}>
            <BlockOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <Typography sx={{ fontSize: "14px !important", fontWeight: 500, color: "#374151" }}>
            {(selectedUser?.status || "").toLowerCase() === "active" ? "Deactivate" : "Activate"}
          </Typography>
        </MenuItem>
        <Divider sx={{ my: 0.3, borderColor: "#F1F5F9" }} />

        <MenuItem onClick={handleChangePasswordClick} sx={{ py: 0.8, px: 2 }}>
          <ListItemIcon sx={{ minWidth: 30, color: "#374151" }}>
            <LockResetOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <Typography sx={{ fontSize: "14px !important", fontWeight: 500, color: "#374151" }}>
            Change Password
          </Typography>
        </MenuItem>
        <Divider sx={{ my: 0.3, borderColor: "#F1F5F9" }} />

        <MenuItem onClick={handleViewCampaignsClick} sx={{ py: 0.8, px: 2 }}>
          <ListItemIcon sx={{ minWidth: 30, color: "#374151" }}>
            <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <Typography sx={{ fontSize: "14px !important", fontWeight: 500, color: "#374151" }}>
            View Campaigns
          </Typography>
        </MenuItem>
        <Divider sx={{ my: 0.3, borderColor: "#F1F5F9" }} />

        <MenuItem onClick={handleTransferLeadsClick} sx={{ py: 0.8, px: 2 }}>
          <ListItemIcon sx={{ minWidth: 30, color: "#374151" }}>
            <AutorenewOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <Typography sx={{ fontSize: "14px !important", fontWeight: 500, color: "#374151" }}>
            Transfer Leads
          </Typography>
        </MenuItem>
        <Divider sx={{ my: 0.3, borderColor: "#F1F5F9" }} />

        <MenuItem onClick={handleDeleteClick} sx={{ py: 0.8, px: 2 }}>
          <ListItemIcon sx={{ minWidth: 30, color: "#EF4444" }}>
            <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <Typography sx={{ fontSize: "14px !important", fontWeight: 500, color: "#EF4444" }}>
            Delete
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
