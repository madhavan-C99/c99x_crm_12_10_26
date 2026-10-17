import React from "react";
import { Dialog, DialogContent, Box, Typography, Button } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const BRAND_GREEN = "#8DC63F";
const BRAND_GREEN_DARK = "#7CB342";
const RED_COLOR = "#E50914";
const RED_COLOR_DARK = "#C8000A";

export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  lead = {},
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: "14px",
          p: 0.5,
          width: "480px",
          maxWidth: "92vw",
          boxShadow: "0 10px 30px rgba(0,0,0,0.14)",
        },
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        {/* Title */}
        <Typography
          sx={{
            fontSize: 20,
            fontWeight: 700,
            color: BRAND_GREEN,
            mb: 1.5,
          }}
        >
          Confirm Deletion
        </Typography>

        {/* Main Instruction Text */}
        <Typography
          sx={{
            fontSize: 13.5,
            fontWeight: 500,
            color: "#333333",
            lineHeight: 1.4,
            mb: 0.75,
          }}
        >
          Are you sure you want to Delete the lead ? Click &ldquo;No&rdquo; to
          go back and &ldquo;Yes&rdquo; to cancel the lead
        </Typography>

        {/* Warning text in Red */}
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 600,
            color: RED_COLOR,
            mb: 2,
          }}
        >
          This action cannot be undone
        </Typography>

        {/* Info Alert Box */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            backgroundColor: "#EEF2FF",
            borderRadius: "8px",
            p: 1.5,
            mb: 3,
          }}
        >
          <InfoOutlinedIcon
            sx={{ color: "#3B82F6", fontSize: 22, flexShrink: 0 }}
          />
          <Typography
            sx={{
              fontSize: 12.5,
              fontWeight: 500,
              color: "#374151",
              lineHeight: 1.3,
            }}
          >
            Please Note: You will not be able to retrieve it later.
          </Typography>
        </Box>

        {/* Modal Action Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
          }}
        >
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderColor: BRAND_GREEN,
              color: BRAND_GREEN,
              borderRadius: "8px",
              textTransform: "none",
              px: 3,
              py: 0.7,
              fontSize: 14,
              fontWeight: 600,
              minWidth: 88,
              "&:hover": {
                borderColor: BRAND_GREEN_DARK,
                backgroundColor: "rgba(141, 198, 63, 0.08)",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={() => {
              if (onConfirm) onConfirm(lead);
              onClose();
            }}
            variant="contained"
            disableElevation
            sx={{
              backgroundColor: RED_COLOR,
              color: "#FFFFFF",
              borderRadius: "8px",
              textTransform: "none",
              px: 3,
              py: 0.7,
              fontSize: 14,
              fontWeight: 600,
              minWidth: 88,
              "&:hover": {
                backgroundColor: RED_COLOR_DARK,
              },
            }}
          >
            Yes
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
