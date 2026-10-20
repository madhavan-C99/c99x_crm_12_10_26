import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { toast } from "react-toastify";
import { deleteCampaign } from "@/apps/admin/services/campaignCardsService";
import { moveLeadCampaign, getLeadSummaryReport } from "@/apps/admin/services/leadSummaryService";
import { fetchCampaignsDropdownAdmin } from "@/apps/admin/services/reportService";
import { getSelectOptions } from "@/apps/admin/services/dropdownService";

const DeleteCampaignModal = ({
  open,
  onClose,
  campaign,
  pipelineId,
  onDeleteSuccess,
  onTransferSuccess,
}) => {
  const [currentLeadCount, setCurrentLeadCount] = useState(0);
  const [targetCampaignId, setTargetCampaignId] = useState("");
  const [availableCampaigns, setAvailableCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferredCount, setTransferredCount] = useState(0);
  const [transferredToName, setTransferredToName] = useState("");
  const [backendError, setBackendError] = useState("");

  const campaignName = campaign?.name || campaign?.campaign_name || "";
  const campaignIdVal = campaign?.id || campaign?.campaign_id;

  // Initialize modal state on open or campaign change
  useEffect(() => {
    if (open && campaign) {
      const rawCount =
        campaign?.totalLeads ??
        campaign?.total_leads ??
        campaign?.lead_count ??
        campaign?.leads_count ??
        0;
      const count = Number(rawCount);
      setCurrentLeadCount(isNaN(count) ? 0 : count);
      setTargetCampaignId("");
      setTransferSuccess(false);
      setBackendError("");
      loadDestinationCampaigns();
    }
  }, [open, campaignIdVal]);

  const loadDestinationCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      let list = [];
      const activePipelineId =
        campaign?.pipeline_category_id ??
        campaign?.pipeline_id ??
        pipelineId;

      try {
        const optRes = await fetchCampaignsDropdownAdmin(activePipelineId);
        const rawList = Array.isArray(optRes)
          ? optRes
          : optRes?.data?.data || optRes?.data || [];
        if (Array.isArray(rawList) && rawList.length > 0) {
          list = rawList;
        }
      } catch (err) {
        console.warn("Dropdown fetch warning, attempting fallback:", err);
      }

      if (!list.length) {
        try {
          const fallbackRes = await getSelectOptions("L_CAMPAIGN_NAMES");
          const rawFallback = Array.isArray(fallbackRes)
            ? fallbackRes
            : fallbackRes?.data?.data || fallbackRes?.data || [];
          if (Array.isArray(rawFallback) && rawFallback.length > 0) {
            list = rawFallback;
          }
        } catch (err) {
          console.warn("L_CAMPAIGN_NAMES fetch warning:", err);
        }
      }

      // Filter out current campaign being deleted
      const filtered = list
        .map((item) => {
          const idVal = item.id ?? item.value ?? item.campaign_id;
          const nameVal = item.name ?? item.label ?? item.campaign_name;
          return {
            id: idVal,
            name: nameVal,
          };
        })
        .filter((c) => {
          if (!c.id && !c.name) return false;
          const isSameId = String(c.id) === String(campaignIdVal);
          const isSameName =
            c.name &&
            campaignName &&
            c.name.toLowerCase().trim() === campaignName.toLowerCase().trim();
          return !isSameId && !isSameName;
        });

      setAvailableCampaigns(filtered);
    } catch (error) {
      console.error("Failed to load destination campaigns:", error);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleTransfer = async () => {
    if (!targetCampaignId) {
      toast.warning("Please select a target campaign to transfer leads");
      return;
    }

    const targetObj = availableCampaigns.find(
      (c) => String(c.id) === String(targetCampaignId)
    );
    const targetName = targetObj?.name || "";

    try {
      setTransferring(true);

      // Attempt to retrieve lead IDs from lead summary report if available
      let leadIds = [];
      try {
        const summaryPayload = {
          campaign_id: Number(campaignIdVal),
        };
        const pId =
          pipelineId ||
          campaign?.pipeline_id ||
          campaign?.category_id ||
          sessionStorage.getItem("admin_pipeline_selected");
        if (pId) {
          summaryPayload.pipeline_id = Number(pId);
        }
        const summaryRes = await getLeadSummaryReport(summaryPayload);
        const rows =
          summaryRes?.data?.data?.rows || summaryRes?.data?.rows || [];
        if (Array.isArray(rows) && rows.length > 0) {
          leadIds = rows.map((r) => r.lead_id ?? r.id).filter(Boolean);
        }
      } catch (err) {
        console.warn("Notice: could not query lead summary report:", err);
      }

      const payload = {
        from_campaign_id: Number(campaignIdVal),
        target_campaign_id: Number(targetCampaignId),
        note: `Transferred leads from campaign "${campaignName}"`,
      };

      if (leadIds.length > 0) {
        payload.lead_ids = leadIds;
      }

      const res = await moveLeadCampaign(payload);

      toast.success(
        res?.data?.message ||
          `Successfully transferred leads to '${targetName}'!`
      );

      setTransferredCount(currentLeadCount);
      setTransferredToName(targetName);
      setCurrentLeadCount(0);
      setTransferSuccess(true);

      if (onTransferSuccess) {
        onTransferSuccess();
      }
    } catch (error) {
      console.error("Failed to transfer campaign leads:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Failed to transfer leads to the selected campaign"
      );
    } finally {
      setTransferring(false);
    }
  };

  const handleDelete = async () => {
    if (!campaignIdVal) return;
    setDeleting(true);
    try {
      const response = await deleteCampaign(campaignIdVal);
      if (response?.data?.data?.message) {
        toast.success(response.data.data.message);
      } else if (response?.data?.message) {
        toast.success(response.data.message);
      } else {
        toast.success(`Campaign '${campaignName}' deleted successfully!`);
      }
      if (onDeleteSuccess) {
        onDeleteSuccess(campaignIdVal);
      }
      onClose();
    } catch (error) {
      console.error("Delete campaign error:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to delete campaign";

      const lower = String(errorMsg).toLowerCase();
      if (
        lower.includes("lead") ||
        lower.includes("transfer") ||
        lower.includes("cannot delete")
      ) {
        setCurrentLeadCount((prev) => (prev > 0 ? prev : 1));
        setBackendError(errorMsg);
        toast.warning(errorMsg);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setDeleting(false);
    }
  };

  if (!campaign) return null;

  return (
    <Dialog
      open={Boolean(open)}
      onClose={deleting || transferring ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          p: 1.5,
          position: "relative",
          boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
        },
      }}
    >
      {/* Top right close button */}
      <IconButton
        size="small"
        onClick={onClose}
        disabled={deleting || transferring}
        sx={{
          position: "absolute",
          top: 14,
          right: 14,
          color: "#64748B",
          "&:hover": { bgcolor: "#F1F5F9" },
        }}
      >
        <CloseIcon sx={{ fontSize: 20 }} />
      </IconButton>

      {/* 🌟 STATE 1: Transfer Complete */}
      {transferSuccess ? (
        <>
          <DialogTitle sx={{ pb: 1, pt: 2, textAlign: "center" }}>
            <Box
              sx={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                bgcolor: "#DCFCE7",
                color: "#16A34A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 1.5,
              }}
            >
              <CheckCircleOutlineRoundedIcon sx={{ fontSize: "32px" }} />
            </Box>
            <Typography
              sx={{
                fontSize: "19px",
                fontWeight: 700,
                color: "#0F172A",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Leads Transferred Successfully
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ px: 2.5, py: 1, textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: "13.5px",
                color: "#475569",
                lineHeight: 1.5,
                mb: 1,
              }}
            >
              All{" "}
              <strong style={{ color: "#0F172A" }}>
                {transferredCount > 0 ? `${transferredCount} leads` : "leads"}
              </strong>{" "}
              have been moved to{" "}
              <strong style={{ color: "#16A34A" }}>
                "{transferredToName}"
              </strong>
              .
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#64748B" }}>
              This campaign now has 0 active leads. Would you like to proceed
              with deleting{" "}
              <strong style={{ color: "#DC2626" }}>"{campaignName}"</strong>?
            </Typography>
          </DialogContent>

          <DialogActions
            sx={{
              justifyContent: "center",
              gap: 1.5,
              px: 2,
              pb: 2,
              pt: 2,
            }}
          >
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={deleting}
              sx={{
                flex: 1,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                borderColor: "#CBD5E1",
                color: "#475569",
                py: 1,
                "&:hover": {
                  borderColor: "#94A3B8",
                  bgcolor: "#F8FAFC",
                },
              }}
            >
              Keep Campaign
            </Button>
            <Button
              variant="contained"
              onClick={handleDelete}
              disabled={deleting}
              startIcon={<DeleteOutlineRoundedIcon />}
              sx={{
                flex: 1,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "#DC2626",
                color: "#fff",
                py: 1,
                "&:hover": {
                  bgcolor: "#B91C1C",
                },
              }}
            >
              {deleting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Delete Campaign"
              )}
            </Button>
          </DialogActions>
        </>
      ) : currentLeadCount > 0 ? (
        /* 🌟 STATE 2: Campaign Has Leads -> Block Deletion & Show Transfer Option */
        <>
          <DialogTitle sx={{ pb: 1, pt: 2, textAlign: "center" }}>
            <Box
              sx={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                bgcolor: "#FEF3C7",
                color: "#D97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 1.5,
              }}
            >
              <WarningAmberRoundedIcon sx={{ fontSize: "32px" }} />
            </Box>
            <Typography
              sx={{
                fontSize: "19px",
                fontWeight: 700,
                color: "#0F172A",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Cannot Delete Campaign
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ px: 2.5, py: 1 }}>
            {/* Warning Info Box */}
            <Box
              sx={{
                bgcolor: "#FFFBEB",
                border: "1px solid #FDE68A",
                borderRadius: "10px",
                p: 2,
                mb: 2.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: "#92400E",
                  lineHeight: 1.4,
                  mb: 0.8,
                }}
              >
                This campaign has{" "}
                <span style={{ color: "#B45309", fontWeight: 700 }}>
                  {currentLeadCount} active{" "}
                  {currentLeadCount === 1 ? "lead" : "leads"}
                </span>
                .
              </Typography>
              <Typography
                sx={{
                  fontSize: "12.5px",
                  color: "#78350F",
                  lineHeight: 1.4,
                }}
              >
                Campaign has active leads. Reassign them before deleting.
              </Typography>
              {backendError && (
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#DC2626",
                    mt: 1,
                    fontWeight: 500,
                  }}
                >
                  {backendError}
                </Typography>
              )}
            </Box>

            {/* Target Campaign Selection Dropdown */}
            <Box sx={{ mb: 1 }}>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  mb: 0.8,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Transfer Leads to Campaign{" "}
                <span style={{ color: "#DC2626" }}>*</span>
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  displayEmpty
                  value={targetCampaignId}
                  onChange={(e) => setTargetCampaignId(e.target.value)}
                  disabled={loadingCampaigns || transferring}
                  sx={{
                    borderRadius: "8px",
                    fontSize: "14px",
                    bgcolor: "#FFFFFF",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#CBD5E1",
                    },
                  }}
                >
                  <MenuItem value="" disabled sx={{ color: "#94A3B8" }}>
                    {loadingCampaigns
                      ? "Loading campaigns..."
                      : "Select destination campaign"}
                  </MenuItem>
                  {availableCampaigns.length === 0 && !loadingCampaigns ? (
                    <MenuItem disabled sx={{ fontSize: "13px" }}>
                      No other campaigns available in this pipeline
                    </MenuItem>
                  ) : (
                    availableCampaigns.map((c) => (
                      <MenuItem
                        key={c.id}
                        value={c.id}
                        sx={{ fontSize: "13.5px" }}
                      >
                        {c.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>

          <DialogActions
            sx={{
              justifyContent: "center",
              gap: 1.5,
              px: 2.5,
              pb: 2,
              pt: 1.5,
            }}
          >
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={transferring}
              sx={{
                flex: 1,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                borderColor: "#CBD5E1",
                color: "#475569",
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
              onClick={handleTransfer}
              disabled={!targetCampaignId || transferring || loadingCampaigns}
              startIcon={<SwapHorizRoundedIcon />}
              sx={{
                flex: 1,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "#0011C5",
                color: "#fff",
                py: 1,
                "&:hover": {
                  bgcolor: "#000EA3",
                },
                "&.Mui-disabled": {
                  bgcolor: "#E2E8F0",
                  color: "#94A3B8",
                },
              }}
            >
              {transferring ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Transfer Leads"
              )}
            </Button>
          </DialogActions>
        </>
      ) : (
        /* 🌟 STATE 3: Campaign Has 0 Leads -> Standard Delete Confirmation */
        <>
          <DialogTitle sx={{ pb: 1, pt: 2, textAlign: "center" }}>
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
            <Typography
              sx={{
                fontSize: "19px",
                fontWeight: 700,
                color: "#0F172A",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Delete Campaign
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ px: 3, py: 1, textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: "14px",
                color: "#475569",
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to delete{" "}
              <Typography
                component="span"
                sx={{ fontWeight: 700, color: "#DC2626" }}
              >
                "{campaignName}"
              </Typography>
              ? This will remove the campaign from the pipeline. This action
              cannot be undone.
            </Typography>
          </DialogContent>

          <DialogActions
            sx={{
              justifyContent: "center",
              gap: 1.5,
              px: 3,
              pb: 2,
              pt: 2,
            }}
          >
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={deleting}
              sx={{
                flex: 1,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                borderColor: "#CBD5E1",
                color: "#475569",
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
              disabled={deleting}
              sx={{
                flex: 1,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "#DC2626",
                color: "#fff",
                py: 1,
                "&:hover": {
                  bgcolor: "#B91C1C",
                },
              }}
            >
              {deleting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Delete Campaign"
              )}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default DeleteCampaignModal;
