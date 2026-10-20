import React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

export default function DeleteStageModal({
  open,
  onClose,
  stage,
  leadCount = 0,
  isLoading = false,
  isDeleting = false,
  onContinue,
  onDeleteDirect,
}) {
  const stageName = stage?.name || "this stage";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "14px",
          p: 2,
          position: "relative",
        },
      }}
    >
      {/* Top right close button */}
      <IconButton
        size="small"
        onClick={onClose}
        disabled={isDeleting}
        sx={{
          position: "absolute",
          top: 14,
          right: 14,
          color: "#64748B",
        }}
      >
        <CloseIcon sx={{ fontSize: 20 }} />
      </IconButton>

      <DialogContent sx={{ px: 1, pt: 2, pb: 1, textAlign: "center" }}>
        {/* Circular Red Trash Badge */}
        <Box
          sx={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "#FEE2E2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 1.5,
          }}
        >
          <DeleteOutlinedIcon sx={{ color: "#EF4444", fontSize: 30 }} />
        </Box>

        {/* Title */}
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "18px",
            color: "#0F172A",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Delete Stage
        </Typography>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress size={28} sx={{ color: "#EF4444" }} />
          </Box>
        ) : (
          <>
            {/* Subtitle */}
            <Typography
              sx={{
                fontSize: "13px",
                color: "#64748B",
                fontFamily: "Inter, sans-serif",
                mt: 0.8,
                px: 1,
                lineHeight: 1.4,
              }}
            >
              {leadCount > 0
                ? "You couldn't delete stage before transferring to some other stage"
                : `Are you sure you want to delete stage "${stageName}"? This action cannot be undone.`}
            </Typography>

            {/* Information Box with Bullet Points */}
            <Box
              sx={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                p: 2,
                mt: 2.5,
                textAlign: "left",
              }}
            >
              {leadCount > 0 ? (
                <Box component="ul" sx={{ m: 0, pl: 2, display: "flex", flexDirection: "column", gap: 0.8 }}>
                  <Typography
                    component="li"
                    sx={{ fontSize: "12px", color: "#334155", fontWeight: 500, fontFamily: "Inter, sans-serif" }}
                  >
                    <strong>{leadCount} Leads</strong> are currently in this stage
                  </Typography>
                  <Typography
                    component="li"
                    sx={{ fontSize: "12px", color: "#334155", fontWeight: 500, fontFamily: "Inter, sans-serif" }}
                  >
                    These Leads need to be moved to another stage
                  </Typography>
                  <Typography
                    component="li"
                    sx={{ fontSize: "12px", color: "#334155", fontWeight: 500, fontFamily: "Inter, sans-serif" }}
                  >
                    This action cannot be undone.
                  </Typography>
                </Box>
              ) : (
                <Box component="ul" sx={{ m: 0, pl: 2, display: "flex", flexDirection: "column", gap: 0.8 }}>
                  <Typography
                    component="li"
                    sx={{ fontSize: "12px", color: "#334155", fontWeight: 500, fontFamily: "Inter, sans-serif" }}
                  >
                    <strong>0 Leads</strong> are currently in this stage
                  </Typography>
                  <Typography
                    component="li"
                    sx={{ fontSize: "12px", color: "#334155", fontWeight: 500, fontFamily: "Inter, sans-serif" }}
                  >
                    This stage and its tags will be permanently removed.
                  </Typography>
                  <Typography
                    component="li"
                    sx={{ fontSize: "12px", color: "#334155", fontWeight: 500, fontFamily: "Inter, sans-serif" }}
                  >
                    This action cannot be undone.
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 1, pt: 1.5, pb: 1, display: "flex", gap: 1.5 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={isDeleting}
          sx={{
            flex: 1,
            height: "38px",
            borderColor: "#CBD5E1",
            color: "#475569",
            textTransform: "none",
            fontWeight: 500,
            fontSize: "14px",
            borderRadius: "6px",
            "&:hover": {
              borderColor: "#94A3B8",
              backgroundColor: "#F8FAFC",
            },
          }}
        >
          Cancel
        </Button>

        {leadCount > 0 ? (
          <Button
            variant="contained"
            onClick={onContinue}
            disabled={isLoading || isDeleting}
            sx={{
              flex: 1,
              height: "38px",
              backgroundColor: "#EF4444",
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "14px",
              borderRadius: "6px",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#DC2626",
                boxShadow: "none",
              },
            }}
          >
            Continue
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={onDeleteDirect}
            disabled={isLoading || isDeleting}
            sx={{
              flex: 1,
              height: "38px",
              backgroundColor: "#EF4444",
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "14px",
              borderRadius: "6px",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#DC2626",
                boxShadow: "none",
              },
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
