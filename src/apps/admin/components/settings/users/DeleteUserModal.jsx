import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
} from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { toast } from "react-toastify";
import {
  fetchUserDeleteSummaryAdmin,
  deleteUserAdmin,
} from "@/apps/admin/services/userService";

const ACCENT = "#90D916";
const RED_BTN = "#D32F2F";

export default function DeleteUserModal({
  open,
  onClose,
  user,
  onDeleteConfirm,
  onTransferLeads,
}) {
  const [loading, setLoading] = useState(false);
  const [fetchingSummary, setFetchingSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    if (!open || !user) {
      setSummaryData(null);
      return;
    }

    let isMounted = true;
    const loadSummary = async () => {
      try {
        setFetchingSummary(true);
        const userIdVal = user?.id || user?.user_id || user?.raw?.id;
        const empIdVal =
          user?.emp_id ||
          user?.raw?.emp_id ||
          user?.raw?.employee_id ||
          user?.raw?.emp_code ||
          "";

        const response = await fetchUserDeleteSummaryAdmin({
          user_id: Number(userIdVal),
          id: Number(userIdVal),
          emp_id: String(empIdVal),
        });

        const rawRes = response?.data;
        const level1 = rawRes?.data?.data || rawRes?.data || rawRes || {};
        const finalSummary =
          level1?.has_assigned_leads !== undefined || level1?.user_id !== undefined || level1?.total_assigned_leads !== undefined
            ? level1
            : level1?.data || level1;

        if (isMounted) {
          setSummaryData(finalSummary);
        }
      } catch (err) {
        console.error("[DeleteUserModal] Failed to fetch summary:", err);
        if (isMounted) {
          setSummaryData(null);
        }
      } finally {
        if (isMounted) {
          setFetchingSummary(false);
        }
      }
    };

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, [open, user]);

  if (!open) return null;

  // Extract lead stats from summary API or user object fallback
  const activeLeadsCount = summaryData !== null
    ? Number(summaryData?.active_leads ?? 0)
    : Number(user?.active_leads ?? user?.activeLeads ?? user?.active_leads_count ?? 0);

  const newLeadsCount = summaryData !== null
    ? Number(summaryData?.new_leads ?? 0)
    : Number(user?.new_leads ?? user?.newLeads ?? user?.new_leads_count ?? 0);

  const followUpsCount = summaryData !== null
    ? Number(summaryData?.follow_ups ?? 0)
    : Number(user?.follow_ups ?? user?.followUps ?? user?.follow_ups_count ?? 0);

  const campaignsCount = summaryData !== null
    ? Number(summaryData?.campaigns_count ?? summaryData?.total_campaigns ?? (Array.isArray(summaryData?.campaigns) ? summaryData.campaigns.length : 0))
    : Number(user?.campaigns_count ?? user?.campaigns ?? 0);

  const totalAssignedLeads = summaryData !== null
    ? Number(summaryData?.total_assigned_leads ?? summaryData?.total_leads ?? (activeLeadsCount + newLeadsCount + followUpsCount + campaignsCount))
    : Number(user?.assigned_leads_count ?? user?.leads_count ?? (activeLeadsCount + newLeadsCount + followUpsCount + campaignsCount));

  const hasAssignedLeads = summaryData !== null
    ? Boolean(summaryData?.has_assigned_leads ?? (totalAssignedLeads > 0))
    : Boolean(user?.has_assigned_leads ?? (totalAssignedLeads > 0));

  const userName =
    summaryData?.user_name || user?.name || user?.full_name || "User";
  const userRole =
    summaryData?.role ||
    (typeof user?.role === "object" ? user?.role?.name : user?.role) ||
    "Executive";
  const userLocation =
    summaryData?.location || user?.location || user?.city || "-";

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      const userIdVal = user?.id || user?.user_id || user?.raw?.id;
      const empIdVal =
        user?.emp_id ||
        user?.raw?.emp_id ||
        user?.raw?.employee_id ||
        user?.raw?.emp_code ||
        "";

      const res = await deleteUserAdmin({
        id: Number(userIdVal),
        emp_id: String(empIdVal),
      });

      if (res?.data?.status === false) {
        toast.error(
          res?.data?.message || "Cannot delete user. Please transfer remaining assigned leads first."
        );
        return;
      }

      toast.success(res?.data?.message || "User deleted successfully!");
      if (onDeleteConfirm) {
        await onDeleteConfirm(user);
      }
      onClose();
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToTransfer = () => {
    onClose();
    if (onTransferLeads && user) {
      onTransferLeads(user);
    }
  };

  // Loading indicator inside Modal if fetching summary
  if (fetchingSummary) {
    return (
      <Dialog
        open={Boolean(open)}
        onClose={onClose}
        maxWidth={false}
        sx={{
          "& .MuiDialog-paper": {
            width: "360px",
            borderRadius: "12px",
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          },
        }}
      >
        <CircularProgress size={36} sx={{ color: ACCENT }} />
        <Typography sx={{ fontSize: "14px", color: "#64748B", fontFamily: "Inter, sans-serif" }}>
          Loading user details...
        </Typography>
      </Dialog>
    );
  }

  // SCENARIO 1: User HAS Assigned Leads -> Render "Delete User" Review Modal (Image 1)
  if (hasAssignedLeads) {
    return (
      <Dialog
        open={Boolean(open)}
        onClose={onClose}
        maxWidth={false}
        sx={{
          "& .MuiDialog-paper": {
            width: "440px",
            maxWidth: "95vw",
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
            boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.2)",
            p: 0,
          },
        }}
      >
        {/* Modal Header */}
        <Box
          sx={{
            px: 3,
            pt: 2.5,
            pb: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "17px",
              color: "#0F172A",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Delete User
          </Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: "#64748B" }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Modal Body */}
        <Box
          sx={{
            px: 3,
            pb: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: "13.5px",
              color: "#64748B",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Review what is currently assigned to this user.
          </Typography>

          {/* User Info Light Blue Card */}
          <Box
            sx={{
              backgroundColor: "#EBF5FF",
              borderRadius: "10px",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 0.3,
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "15px",
                color: "#1E293B",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {userName}
            </Typography>
            <Typography
              sx={{
                fontSize: "13px",
                color: "#64748B",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {userRole} · {userLocation}
            </Typography>
          </Box>

          {/* 4 Stat Boxes (2x2 Grid) matching Image 1 */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1.5,
            }}
          >
            {/* Box 1: Active Leads */}
            <Box
              sx={{
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                p: 1.8,
                backgroundColor: "#FFFFFF",
              }}
            >
              <Typography
                sx={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#2563EB",
                  fontFamily: "Inter, sans-serif",
                  lineHeight: 1.1,
                }}
              >
                {activeLeadsCount}
              </Typography>
              <Typography
                sx={{
                  fontSize: "12.5px",
                  color: "#64748B",
                  fontFamily: "Inter, sans-serif",
                  mt: 0.5,
                }}
              >
                Active Leads
              </Typography>
            </Box>

            {/* Box 2: New Leads */}
            <Box
              sx={{
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                p: 1.8,
                backgroundColor: "#FFFFFF",
              }}
            >
              <Typography
                sx={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#2563EB",
                  fontFamily: "Inter, sans-serif",
                  lineHeight: 1.1,
                }}
              >
                {newLeadsCount}
              </Typography>
              <Typography
                sx={{
                  fontSize: "12.5px",
                  color: "#64748B",
                  fontFamily: "Inter, sans-serif",
                  mt: 0.5,
                }}
              >
                New Leads
              </Typography>
            </Box>

            {/* Box 3: Follow-ups */}
            <Box
              sx={{
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                p: 1.8,
                backgroundColor: "#FFFFFF",
              }}
            >
              <Typography
                sx={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#2563EB",
                  fontFamily: "Inter, sans-serif",
                  lineHeight: 1.1,
                }}
              >
                {followUpsCount}
              </Typography>
              <Typography
                sx={{
                  fontSize: "12.5px",
                  color: "#64748B",
                  fontFamily: "Inter, sans-serif",
                  mt: 0.5,
                }}
              >
                Follow-ups
              </Typography>
            </Box>

            {/* Box 4: Campaigns */}
            <Box
              sx={{
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                p: 1.8,
                backgroundColor: "#FFFFFF",
              }}
            >
              <Typography
                sx={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#2563EB",
                  fontFamily: "Inter, sans-serif",
                  lineHeight: 1.1,
                }}
              >
                {campaignsCount}
              </Typography>
              <Typography
                sx={{
                  fontSize: "12.5px",
                  color: "#64748B",
                  fontFamily: "Inter, sans-serif",
                  mt: 0.5,
                }}
              >
                Campaigns
              </Typography>
            </Box>
          </Box>

          {/* Warning Banner Box */}
          <Box
            sx={{
              backgroundColor: "#FFF7ED",
              border: "1px solid #FED7AA",
              borderRadius: "8px",
              p: 1.5,
              display: "flex",
              alignItems: "flex-start",
              gap: 1.2,
            }}
          >
            <WarningAmberOutlinedIcon
              sx={{ color: "#EA580C", fontSize: 20, mt: 0.2 }}
            />
            <Typography
              sx={{
                fontSize: "12.5px",
                color: "#9A3412",
                fontWeight: 500,
                fontFamily: "Inter, sans-serif",
                lineHeight: 1.4,
              }}
            >
              You can't delete this user until their assigned leads are transferred
              to another user.
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              mt: 1,
            }}
          >
            <Button
              variant="contained"
              onClick={onClose}
              sx={{
                backgroundColor: "#E2E8F0",
                color: "#475569",
                fontSize: "13.5px",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: "6px",
                px: 2.5,
                py: 0.8,
                fontFamily: "Inter, sans-serif",
                boxShadow: "none",
                "&:hover": { backgroundColor: "#CBD5E1" },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleContinueToTransfer}
              endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
              sx={{
                backgroundColor: "#84CC16",
                color: "#FFFFFF",
                fontSize: "13.5px",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: "6px",
                px: 2.5,
                py: 0.8,
                fontFamily: "Inter, sans-serif",
                boxShadow: "none",
                "&:hover": { backgroundColor: "#65A30D" },
              }}
            >
              Continue
            </Button>
          </Box>
        </Box>
      </Dialog>
    );
  }

  // SCENARIO 2: User HAS NO Assigned Leads -> Render original Confirm Deletion Modal (Image 2)
  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth={false}
      sx={{
        "& .MuiDialog-paper": {
          width: "355px !important",
          minWidth: "355px !important",
          maxWidth: "355px !important",
          height: "149px !important",
          minHeight: "149px !important",
          maxHeight: "149px !important",
          borderRadius: "6px !important",
          backgroundColor: "#FFFFFF !important",
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15) !important",
          overflow: "hidden !important",
        },
      }}
    >
      <DialogContent
        sx={{
          padding: "22px 32px !important",
          display: "flex",
          flexDirection: "column",
          gap: "12px !important",
          width: "291px !important",
          maxWidth: "291px !important",
          height: "105px !important",
          minHeight: "105px !important",
          maxHeight: "105px !important",
          opacity: "1 !important",
          boxSizing: "content-box !important",
          justifyContent: "space-between",
        }}
      >
        {/* Header Frame */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            height: "22px",
          }}
        >
          <DeleteOutlinedIcon
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
            Confirm Deletion
          </Typography>
        </Box>

        {/* Body Text */}
        <Typography
          sx={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            fontSize: "14px",
            lineHeight: "21px",
            letterSpacing: "0%",
            color: "#4D4D4D",
            margin: 0,
          }}
        >
          Are you sure, you want to delete this User?
        </Typography>

        {/* Button Group Frame */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "19px",
            height: "26px",
          }}
        >
          {/* Cancel Button */}
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={loading}
            sx={{
              width: "74px !important",
              minWidth: "74px !important",
              height: "26px !important",
              borderRadius: "3px !important",
              border: `1px solid ${ACCENT} !important`,
              borderColor: `${ACCENT} !important`,
              padding: "4px !important",
              color: `${ACCENT} !important`,
              backgroundColor: "#FFFFFF !important",
              textTransform: "none !important",
              fontFamily: "Inter, sans-serif !important",
              fontWeight: "600 !important",
              fontSize: "16px !important",
              lineHeight: "100% !important",
              letterSpacing: "0% !important",
              boxSizing: "border-box !important",
              "&:hover": {
                borderColor: `${ACCENT} !important`,
                backgroundColor: "#F7FEE7 !important",
              },
            }}
          >
            Cancel
          </Button>

          {/* Yes Button (Red) */}
          <Button
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={loading}
            sx={{
              width: "74px !important",
              minWidth: "74px !important",
              height: "26px !important",
              borderRadius: "3px !important",
              padding: "4px !important",
              backgroundColor: `${RED_BTN} !important`,
              color: "#FFFFFF !important",
              textTransform: "none !important",
              fontFamily: "Inter, sans-serif !important",
              fontWeight: "600 !important",
              fontSize: "16px !important",
              lineHeight: "100% !important",
              letterSpacing: "0% !important",
              boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25) !important",
              boxSizing: "border-box !important",
              "&:hover": {
                backgroundColor: "#B71C1C !important",
                boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25) !important",
              },
            }}
          >
            {loading ? "Deleting..." : "Yes"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
