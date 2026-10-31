import React from "react";
import {
  Dialog,
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Backdrop,
} from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloudDownloadOutlinedIcon from "@mui/icons-material/CloudDownloadOutlined";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const typeConfig = {
  loading: {
    color: "#2563EB",
    bgColor: "#EFF6FF",
    borderColor: "#DBEAFE",
    glowColor: "rgba(37, 99, 235, 0.15)",
    icon: <CircularProgress size={34} thickness={4} sx={{ color: "#2563EB" }} />,
    btnBg: "#2563EB",
    btnHover: "#1D4ED8",
    btnColor: "#FFFFFF",
    btnShadow: "rgba(37, 99, 235, 0.35)",
    btnShadowHover: "rgba(37, 99, 235, 0.45)",
    defaultButtonText: "Processing...",
  },
  success: {
    color: "#16A34A",
    bgColor: "#F0FDF4",
    borderColor: "#DCFCE7",
    glowColor: "rgba(22, 163, 74, 0.15)",
    icon: <CheckRoundedIcon sx={{ fontSize: 38, color: "#16A34A" }} />,
    btnBg: "#90D916",
    btnHover: "#7ebd10",
    btnColor: "#111827",
    btnShadow: "rgba(144, 217, 22, 0.35)",
    btnShadowHover: "rgba(144, 217, 22, 0.45)",
    defaultButtonText: "Continue",
  },
  download: {
    color: "#0284C7",
    bgColor: "#F0F9FF",
    borderColor: "#E0F2FE",
    glowColor: "rgba(2, 132, 199, 0.15)",
    icon: <CloudDownloadOutlinedIcon sx={{ fontSize: 38, color: "#0284C7" }} />,
    btnBg: "#90D916",
    btnHover: "#7ebd10",
    btnColor: "#111827",
    btnShadow: "rgba(144, 217, 22, 0.35)",
    btnShadowHover: "rgba(144, 217, 22, 0.45)",
    defaultButtonText: "Done",
  },
  error: {
    color: "#DC2626",
    bgColor: "#FEF2F2",
    borderColor: "#FEE2E2",
    glowColor: "rgba(220, 38, 38, 0.15)",
    icon: <ErrorOutlineRoundedIcon sx={{ fontSize: 38, color: "#DC2626" }} />,
    btnBg: "#DC2626",
    btnHover: "#B91C1C",
    btnColor: "#FFFFFF",
    btnShadow: "rgba(220, 38, 38, 0.35)",
    btnShadowHover: "rgba(220, 38, 38, 0.45)",
    defaultButtonText: "Close",
  },
};

const ActionFeedbackModal = ({
  open = false,
  onClose,
  type = "success",
  title = "Action Successful!",
  message = "The operation has been completed successfully.",
  buttonText,
  onButtonClick,
  showCloseIcon = true,
}) => {
  const current = typeConfig[type] || typeConfig.success;
  const isLoading = type === "loading";

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      aria-labelledby="feedback-modal-title"
      aria-describedby="feedback-modal-description"
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 300,
          sx: {
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
          },
        },
        paper: {
          sx: {
            borderRadius: "24px",
            p: { xs: 3, sm: 4.5 },
            m: 2,
            textAlign: "center",
            maxWidth: "400px",
            width: "100%",
            position: "relative",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.18)",
            border: "1px solid rgba(255, 255, 255, 0.8)",
            background: "linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)",
            overflow: "visible",
          },
        },
      }}
    >
      {showCloseIcon && !isLoading && (
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close"
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 1,
            width: 32,
            height: 32,
            color: "#94A3B8",
            backgroundColor: "#F8FAFC",
            border: "1px solid #F1F5F9",
            transition: "all 0.2s ease",
            "&:hover": {
              color: "#334155",
              backgroundColor: "#E2E8F0",
              transform: "rotate(90deg)",
            },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      )}

      {/* Icon */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2.5 }}>
        <Box
          key={type} // re-triggers animation when type changes (loading -> success)
          sx={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            backgroundColor: current.bgColor,
            border: `2px solid ${current.borderColor}`,
            boxShadow: `0 0 0 8px ${current.glowColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "scaleUp 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            "@keyframes scaleUp": {
              "0%": { transform: "scale(0.5)", opacity: 0 },
              "100%": { transform: "scale(1)", opacity: 1 },
            },
          }}
        >
          {current.icon}
        </Box>
      </Box>

      <Typography
        id="feedback-modal-title"
        component="h2"
        sx={{
          fontSize: { xs: "19px", sm: "21px" },
          fontWeight: 700,
          color: "#0F172A",
          letterSpacing: "-0.02em",
          mb: 1,
        }}
      >
        {title}
      </Typography>

      <Typography
        id="feedback-modal-description"
        sx={{
          fontSize: { xs: "13px", sm: "14px" },
          color: "#64748B",
          lineHeight: 1.6,
          mb: isLoading ? 0 : 3.5,
          px: { xs: 0.5, sm: 1 },
        }}
      >
        {message}
      </Typography>

      {!isLoading && (
        <Button
          fullWidth
          variant="contained"
          disableElevation
          onClick={onButtonClick || onClose}
          sx={{
            borderRadius: "14px",
            py: 1.35,
            fontSize: "14.5px",
            fontWeight: 700,
            textTransform: "none",
            backgroundColor: current.btnBg,
            color: current.btnColor,
            boxShadow: `0 4px 14px ${current.btnShadow}`,
            letterSpacing: "0.01em",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              backgroundColor: current.btnHover,
              transform: "translateY(-1px)",
              boxShadow: `0 6px 20px ${current.btnShadowHover}`,
            },
            "&:active": { transform: "translateY(1px)" },
          }}
        >
          {buttonText || current.defaultButtonText}
        </Button>
      )}
    </Dialog>
  );
};

export default ActionFeedbackModal;