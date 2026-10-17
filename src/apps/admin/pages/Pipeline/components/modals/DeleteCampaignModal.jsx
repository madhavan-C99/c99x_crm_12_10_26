import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { deleteCampaign } from "@/apps/admin/services/campaignCardsService";
import { toast } from "react-toastify";

const DeleteCampaignModal = ({ open, onClose, campaign, onDeleteSuccess }) => {
  const [loading, setLoading] = useState(false);

  if (!campaign) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await deleteCampaign(campaign.id);
      if (response?.data?.data?.message) {
        toast.success(response.data.data.message);
      } else {
        toast.success(`Campaign '${campaign.name}' deleted successfully!`);
      }
      if (onDeleteSuccess) {
        onDeleteSuccess(campaign.id);
      }
      onClose();
    } catch (error) {
      console.error("Delete campaign error:", error);
      toast.error(error?.response?.data?.detail || "Failed to delete campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          p: 1.5,
          textAlign: "center",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: 2 }}>
        <Box
          sx={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            bgcolor: "#FEE2E2",
            color: "#DC2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 1.5,
          }}
        >
          <WarningAmberRoundedIcon sx={{ fontSize: "32px" }} />
        </Box>
        <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111" }}>
          Delete Campaign
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 1 }}>
        <Typography sx={{ fontSize: "14px", color: "#555", lineHeight: 1.5 }}>
          Are you sure you want to delete{" "}
          <Typography
            component="span"
            sx={{ fontWeight: 700, color: "#DC2626" }}
          >
            "{campaign.name}"
          </Typography>
          ? This will remove the campaign from the pipeline.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", gap: 1.5, px: 3, pb: 2, pt: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 600,
            borderColor: "#CBD5E1",
            color: "#475569",
            px: 3,
            py: 1,
            "&:hover": {
              borderColor: "#94A3B8",
              bgcolor: "#F8FAFC",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleDelete}
          disabled={loading}
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 600,
            bgcolor: "#DC2626",
            color: "#fff",
            px: 3,
            py: 1,
            "&:hover": {
              bgcolor: "#B91C1C",
            },
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : "Delete Campaign"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteCampaignModal;
