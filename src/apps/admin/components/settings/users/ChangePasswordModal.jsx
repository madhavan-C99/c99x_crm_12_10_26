import React, { useState, useEffect } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  Divider,
  Stack,
  IconButton,
  InputAdornment,
} from "@mui/material";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { toast } from "react-toastify";

const ACCENT = "#90D916";

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#F2F2F2",
    borderRadius: "5px",
    height: "35px",
    mt:0.5,
    opacity: 1,
    "& fieldset": { border: "0.5px solid #00000017" },
    "&:hover fieldset": { border: "0.5px solid #00000017" },
    "&.Mui-focused fieldset": { border: `1px solid ${ACCENT}` },
  },
  "& .MuiInputBase-input": {
    padding: "6px 12px",
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
    height: "35px",
    boxSizing: "border-box",
    "&::placeholder": {
      fontFamily: "Inter, sans-serif",
      fontWeight: 400,
      fontSize: "12px",
      lineHeight: "100%",
      letterSpacing: "0%",
      opacity: 1,
      color: "#98A2B3",
    },
  },
};

const labelStyles = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: "100%",
  letterSpacing: "0%",
  color: "#2b2b2b",
  mb: 0.5,
};

function FieldLabel({ children, required }) {
  return (
    <Typography sx={labelStyles}>
      {children}
      {required && (
        <Box component="span" sx={{ color: ACCENT }}>
          {" "}
          *
        </Box>
      )}
    </Typography>
  );
}

export default function ChangePasswordModal({ open, onClose, user, onSave }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open]);

  const handleUpdate = async () => {
    if (!newPassword.trim()) {
      toast.error("Please enter New Password");
      return;
    }
    if (!confirmPassword.trim()) {
      toast.error("Please enter Confirm New Password");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New Password and Confirm New Password do not match");
      return;
    }

    try {
      setLoading(true);
      if (onSave) {
        await onSave({ user, newPassword, confirmPassword });
      }
      toast.success("Password updated successfully!");
      onClose();
    } catch (err) {
      console.error("Error updating password:", err);
      toast.error(err?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth={false}
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "6px",
          width: "435px",
          height:"308px",
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 3, pt: 2, pb: 1.5 }}>
        <LockResetOutlinedIcon sx={{ color: ACCENT, fontSize: 22 }} />
        <Typography sx={{ color: ACCENT, fontWeight: 600, fontSize: "17px", fontFamily: "Inter, sans-serif" }}>
          Change Password
        </Typography>
      </Box>
      <Divider />

      {/* Content */}
      <DialogContent sx={{ px: 3, pt: 2.5, pb: 3 }}>
        <Stack spacing={2}>
          {/* New Password */}
          <Box>
            <FieldLabel required>New Password</FieldLabel>
            <TextField
              fullWidth
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter Name"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              sx={fieldStyles}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      edge="end"
                      sx={{ color: "#64748B" }}
                    >
                      {showNewPassword ? (
                        <VisibilityOffOutlinedIcon fontSize="small" />
                      ) : (
                        <VisibilityOutlinedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Confirm New Password */}
          <Box>
            <FieldLabel required>Confirm New Password</FieldLabel>
            <TextField
              fullWidth
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Enter Name"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={fieldStyles}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      edge="end"
                      sx={{ color: "#64748B" }}
                    >
                      {showConfirmPassword ? (
                        <VisibilityOffOutlinedIcon fontSize="small" />
                      ) : (
                        <VisibilityOutlinedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Stack>
      </DialogContent>

      <Divider />

      {/* Actions */}
      <DialogActions sx={{ px: 3, py: 3 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{
            color: ACCENT,
            borderColor: ACCENT,
            border: `1px solid ${ACCENT}`,
            backgroundColor: "#FFFFFF",
            minWidth: "74px",
            height: "28px",
            borderRadius: "3px",
            padding: "4px 12px",
            textTransform: "none",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: "16px",
            lineHeight: "100%",
            letterSpacing: "0%",
            opacity: 1,
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
          onClick={handleUpdate}
          disabled={loading}
          sx={{
            backgroundColor: ACCENT,
            color: "#FFFFFF",
            minWidth: "74px",
            height: "28px",
            borderRadius: "3px",
            padding: "4px 12px",
            textTransform: "none",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: "16px",
            lineHeight: "100%",
            letterSpacing: "0%",
            boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
            opacity: 1,
            "&:hover": {
              backgroundColor: "#7EC610",
              boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
            },
          }}
        >
          {loading ? "Updating..." : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
