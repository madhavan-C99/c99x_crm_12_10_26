import React, { useState } from "react";
import { Dialog, DialogContent, Box, Typography, Button } from "@mui/material";
import { toggleCampaignStatus } from "@/apps/admin/services/campaignManagementService";
import { useAuth } from "@/shared/context/AuthContext";

const BRAND_GREEN = "#85CC14";
const RED_CANCEL = "#D9383A";

export const PauseCampaignModal = ({
  open,
  onClose,
  onConfirmPause,
  campaignId = null,
  isCurrentlyActive = true,
}) => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!hasPermission("api_toggle_campaign_status_admin")) {
      alert("Permission denied: api_toggle_campaign_status_admin");
      return;
    }

    if (!campaignId) {
      onConfirmPause?.();
      onClose?.();
      return;
    }

    try {
      setLoading(true);
      const newStatus = !isCurrentlyActive; // Toggle active status
      await toggleCampaignStatus({
        campaign_id: Number(campaignId),
        is_active: newStatus,
      });
      onConfirmPause?.(newStatus);
      onClose?.();
    } catch (err) {
      console.error("Error toggling campaign status:", err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Error toggling campaign status",
      );
    } finally {
      setLoading(false);
    }
  };

  const actionText = isCurrentlyActive ? "Pause" : "Resume";

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: "28px",
          width: "380px",
          maxWidth: "90%",
          p: 1.5,
          boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.08)",
        },
      }}
    >
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          p: "24px 16px 16px 16px",
          textAlign: "center",
        }}
      >
        {/* WARNING EXCLAMATION CIRCLE ICON */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            border: "2.5px solid #FF5C5C",
            color: "#FF5C5C",
            fontSize: "30px",
            fontWeight: 400,
            lineHeight: 1,
            mb: 2,
            fontFamily: "monospace",
          }}
        >
          !
        </Box>

        {/* TITLE */}
        <Typography
          sx={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#1E293B",
            mb: 1,
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.2,
          }}
        >
          Are you sure?
        </Typography>

        {/* SUBTITLE */}
        <Typography
          sx={{
            fontSize: "14px",
            color: "#64748B",
            mb: 3.5,
            fontFamily: "'Inter', sans-serif",
            maxWidth: "260px",
            width: "100%",
          }}
        >
          Do you want to {actionText} the Campaign?
        </Typography>

        {/* BUTTONS ROW */}
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            width: "100%",
            justifyContent: "center",
          }}
        >
          <Button
            onClick={handleConfirm}
            disabled={loading}
            sx={{
              height: "38px",
              px: 2.8,
              borderRadius: "8px",
              backgroundColor: BRAND_GREEN,
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "none",
              fontFamily: "'Inter', sans-serif",
              "&:hover": {
                backgroundColor: "#74b311",
                boxShadow: "none",
              },
            }}
          >
            {loading ? "Updating..." : `Yes, ${actionText}!`}
          </Button>

          <Button
            onClick={onClose}
            disabled={loading}
            sx={{
              height: "38px",
              px: 3,
              borderRadius: "8px",
              backgroundColor: RED_CANCEL,
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "none",
              fontFamily: "'Inter', sans-serif",
              "&:hover": {
                backgroundColor: "#bf2e30",
                boxShadow: "none",
              },
            }}
          >
            Cancel
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PauseCampaignModal;
