import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
} from "@mui/material";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import { toast } from "react-toastify";

const ACCENT = "#90D916";

export default function DeactivateUserModal({ open, onClose, user, onConfirm }) {
  const [loading, setLoading] = useState(false);

  const isDeactivating = (user?.status || "").toLowerCase() === "active";
  const title = isDeactivating ? "Deactivate User" : "Activate User";
  const message = isDeactivating
    ? "Deactivating the user will log them out, prevent login, and stop new lead assignments. Are you sure you want to proceed?"
    : "Activating the user will restore login access and allow new lead assignments. Are you sure you want to proceed?";

  const handleConfirm = async () => {
    try {
      setLoading(true);
      if (onConfirm) {
        await onConfirm(user);
      }
      toast.success(
        isDeactivating ? "User deactivated successfully!" : "User activated successfully!"
      );
      onClose();
    } catch (err) {
      console.error("Error updating user status:", err);
      toast.error(err?.message || "Failed to update user status");
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
          width: "396px ",
          height: "190px ",
          borderRadius: "6px ",
          backgroundColor: "#FFFFFF ",
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15) ",
          overflow: "hidden ",
          margin: "0 auto",
        },
      }}
    >
      <DialogContent
        sx={{
          padding: "22px 32px !important",
          display: "flex",
          flexDirection: "column",
          gap: "12px !important",
          width: "332px ",
          height: "146.9px ",
          opacity: "1 !important",
          boxSizing: "content-box !important",
          justifyContent: "space-between",
        }}
      >
        {/* Title Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <LockResetOutlinedIcon
            sx={{
              color: ACCENT,
              fontSize: "20px",
              width: "20px",
              height: "20px",
              opacity: 1,
            }}
          />
          <Typography
            sx={{
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 600,
              fontSize: "17px",
              lineHeight: "100%",
              letterSpacing: "0%",
              color: ACCENT,
            }}
          >
            {title}
          </Typography>
        </Box>

        {/* Message Body Text */}
        <Typography
          sx={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            fontSize: "14px",
            lineHeight: "21px",
            color: "#475569",
            margin: 0,
            wordBreak: "break-word",
            width: "332px",
            height:"63px",
          }}
        >
          {message}
        </Typography>

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "19px",
            pt: 0.5,
          }}
        >
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={loading}
            sx={{
              border: `1.5px solid ${ACCENT} !important`,
              color: `${ACCENT} !important`,
              fontWeight: "600 !important",
              fontSize: "16px !important",
              borderRadius: "8px !important",
              minWidth: "70px ",
              height: "30px !important",
              px: 2.5,
              textTransform: "none !important",
              backgroundColor: "#FFFFFF !important",
              fontFamily: "Inter, sans-serif !important",
              "&:hover": { backgroundColor: "#F7FEE7 !important" },
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={loading}
            sx={{
              backgroundColor: `${ACCENT} !important`,
              color: "#FFFFFF !important",
              fontWeight: "600 !important",
              fontSize: "16px !important",
              borderRadius: "8px !important",
              minWidth: "80px !important",
              height: "30px !important",
              px: 2.5,
              textTransform: "none !important",
              fontFamily: "Inter, sans-serif !important",
              boxShadow: "0 2px 8px rgba(132, 204, 22, 0.35) !important",
              "&:hover": { backgroundColor: "#65A30D !important" },
            }}
          >
            {loading ? "Saving..." : "Yes"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
