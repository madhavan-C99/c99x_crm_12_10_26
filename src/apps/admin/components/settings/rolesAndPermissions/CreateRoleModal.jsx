import React, { useState, useEffect } from "react";
import {
  Dialog,
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { toast } from "react-toastify";

const ACCENT = "#90D916";

const labelStyles = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: "13.5px",
  color: "#2B2B2B",
  mb: 0.8,
};

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#F2F2F2",
    borderRadius: "5px",
    height: "38px",
    "& fieldset": { border: "0.5px solid #00000017" },
    "&:hover fieldset": { border: "0.5px solid #00000017" },
    "&.Mui-focused fieldset": { border: `1px solid ${ACCENT}` },
  },
  "& .MuiInputBase-input": {
    padding: "8px 12px",
    fontSize: "13.5px",
    fontFamily: "Inter, sans-serif",
    height: "38px",
    boxSizing: "border-box",
    "&::placeholder": {
      fontFamily: "Inter, sans-serif",
      fontWeight: 400,
      fontSize: "13.5px",
      color: "#9CA3AF",
      opacity: 1,
    },
  },
};

const selectFieldStyles = {
  backgroundColor: "#F2F2F2",
  borderRadius: "5px",
  height: "38px",
  fontFamily: "Inter, sans-serif",
  fontSize: "13.5px",
  color: "#2B2B2B",
  "& fieldset": { border: "0.5px solid #00000017" },
  "&:hover fieldset": { border: "0.5px solid #00000017" },
  "&.Mui-focused fieldset": { border: `1px solid ${ACCENT}` },
  "& .MuiSelect-select": {
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
  },
};

const DATA_SCOPES = [
  { id: "own", label: "Own leads" },
  { id: "team", label: "Team Leads" },
  { id: "all", label: "All leads" },
];

export default function CreateRoleModal({ open, onClose, onSave, existingRoles = [] }) {
  const [roleName, setRoleName] = useState("");
  const [duplicateFrom, setDuplicateFrom] = useState("blank");
  const [dataScope, setDataScope] = useState("own");

  useEffect(() => {
    if (open) {
      setRoleName("");
      setDuplicateFrom("blank");
      setDataScope("own");
    }
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    if (!roleName.trim()) {
      toast.error("Please enter Role Name");
      return;
    }

    if (onSave) {
      onSave({
        name: roleName.trim(),
        duplicateFrom,
        dataScope,
      });
    }

    toast.success(`Role "${roleName.trim()}" created successfully!`);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      sx={{
        "& .MuiDialog-paper": {
          width: "500px",
          borderRadius: "8px",
          overflow: "hidden",
          p: 0,
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      {/* Header Bar */}
      <Box
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <EditOutlinedIcon sx={{ color: ACCENT, fontSize: 20 }} />
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "16px",
              color: ACCENT,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Create Role
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "#64748B" }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Modal Body Form */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* Role Name */}
        <Box>
          <Typography sx={labelStyles}>Role Name*</Typography>
          <TextField
            fullWidth
            placeholder="Role Name"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            sx={fieldStyles}
          />
        </Box>

        {/* Duplicate from (optional) */}
        <Box>
          <Typography sx={labelStyles}>Duplicate from (optional)</Typography>
          <Select
            fullWidth
            value={duplicateFrom}
            onChange={(e) => setDuplicateFrom(e.target.value)}
            IconComponent={KeyboardArrowDownIcon}
            sx={selectFieldStyles}
          >
            <MenuItem value="blank">Start from blank</MenuItem>
            {existingRoles.map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.name}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Data Scope */}
        <Box>
          <Typography sx={labelStyles}>Data Scope</Typography>
          <Box sx={{ display: "flex", gap: 1.5, width: "100%" }}>
            {DATA_SCOPES.map((scope) => {
              const isSelected = dataScope === scope.id;
              return (
                <Button
                  key={scope.id}
                  onClick={() => setDataScope(scope.id)}
                  sx={{
                    flex: 1,
                    height: "36px",
                    borderRadius: "6px",
                    textTransform: "none",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    fontWeight: 500,
                    border: isSelected ? "1.5px solid #3B82F6" : "1px solid #CBD5E1",
                    backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
                    color: isSelected ? "#1E293B" : "#334155",
                    "&:hover": {
                      backgroundColor: isSelected ? "#DBEAFE" : "#F8FAFC",
                    },
                  }}
                >
                  {scope.label}
                </Button>
              );
            })}
          </Box>
          <Typography
            sx={{
              fontSize: "12px",
              color: "#64748B",
              fontFamily: "Inter, sans-serif",
              mt: 1,
            }}
          >
            Controls which records this role can see, separate from feature access below.
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1.5,
            pt: 1,
          }}
        >
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              borderColor: ACCENT,
              color: ACCENT,
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: "13.5px",
              textTransform: "none",
              height: "36px",
              px: 2.5,
              borderRadius: "5px",
              backgroundColor: "#FFFFFF",
              "&:hover": {
                borderColor: ACCENT,
                backgroundColor: "#F7FEE7",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              backgroundColor: ACCENT,
              color: "#FFFFFF",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: "13.5px",
              textTransform: "none",
              height: "36px",
              px: 2.5,
              borderRadius: "5px",
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.15)",
              "&:hover": {
                backgroundColor: "#7EC610",
              },
            }}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
