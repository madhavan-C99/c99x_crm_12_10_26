import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
} from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const ACCENT = "#84CC16";

export default function DeleteTeamModal({ open, onClose, onConfirm, team }) {
  const [loading, setLoading] = useState(false);

  const teamName = team?.name || "this team";

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      if (onConfirm) {
        await onConfirm(team);
      }
      onClose();
    } catch (err) {
      console.error("Error deleting team:", err);
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
          width: "420px",
          borderRadius: "10px",
          backgroundColor: "#FFFFFF",
          boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.15)",
          overflow: "hidden",
          p: 0,
        },
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        {/* Header Icon + Title */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <DeleteOutlinedIcon sx={{ color: ACCENT, fontSize: 22 }} />
          <Typography
            sx={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              color: ACCENT,
            }}
          >
            Delete Team
          </Typography>
        </Box>

        {/* Message Lines */}
        <Typography
          sx={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14.5px",
            fontWeight: 500,
            color: "#334155",
            lineHeight: 1.4,
          }}
        >
          Are you sure, you want to delete {teamName}?
        </Typography>

        <Typography
          sx={{
            fontFamily: "Inter, sans-serif",
            fontSize: "13.5px",
            fontWeight: 600,
            color: "#DC2626",
            mt: 0.5,
          }}
        >
          This action cannot be undone
        </Typography>

        {/* Info Alert Box */}
        <Box
          sx={{
            mt: 2.5,
            p: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#EEF2FF",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <InfoOutlinedIcon sx={{ color: "#1D4ED8", fontSize: 20, flexShrink: 0 }} />
          <Typography
            sx={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13.5px",
              fontWeight: 500,
              color: "#1E293B",
            }}
          >
            Members assigned to this team will become unassigned.
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1.5,
            mt: 3,
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
              fontSize: "15px !important",
              borderRadius: "6px !important",
              height: "34px !important",
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
            onClick={handleConfirmDelete}
            disabled={loading}
            sx={{
              backgroundColor: "#D32F2F !important",
              color: "#FFFFFF !important",
              fontWeight: "600 !important",
              fontSize: "15px !important",
              borderRadius: "6px !important",
              height: "34px !important",
              px: 3,
              textTransform: "none !important",
              fontFamily: "Inter, sans-serif !important",
              boxShadow: "0 2px 6px rgba(211, 47, 47, 0.3) !important",
              "&:hover": { backgroundColor: "#B71C1C !important" },
            }}
          >
            {loading ? "Deleting..." : "Yes"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
