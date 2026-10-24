import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  FormControl,
  Select,
  MenuItem,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

export default function PageStep({
  state,
  onChange,
  facebookAccounts = [],
  pages = [],
  existingConnections = [],
  loadingPages = false,
  onSwitchAccount,
  onConnectFacebook,
}) {
  const { facebookAccount, pageId } = state;
  const [connectingFb, setConnectingFb] = useState(false);

  const handleStartFacebookLogin = async () => {
    setConnectingFb(true);
    try {
      if (onConnectFacebook) {
        await onConnectFacebook();
      }
    } finally {
      setConnectingFb(false);
    }
  };

  const handlePageSelect = (e) => {
    const selectedPage = pages.find((p) => String(p.id) === String(e.target.value));
    onChange({
      ...state,
      pageId: e.target.value,
      pageName: selectedPage?.name || "Facebook Page",
      pageAccessToken: selectedPage?.pageAccessToken || "",
    });
  };

  // Check which pages are already connected across any connection
  const isPageAlreadyConnected = (pid) => {
    return existingConnections.some((c) => String(c.pageId) === String(pid));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Title */}
      <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>
        Facebook Page
      </Typography>

      {/* STATE A: NOT LOGGED IN YET */}
      {!facebookAccount ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: "10px",
            border: "1.5px dashed #CBD5E1",
            backgroundColor: "#F8FAFC",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "rgba(24, 119, 242, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FacebookIcon sx={{ fontSize: 36, color: "#1877F2" }} />
          </Box>

          <Box sx={{ maxWidth: "420px" }}>
            <Typography sx={{ fontSize: "15px", fontWeight: 600, color: "#0F172A", fontFamily: "Inter, sans-serif", mb: 0.5 }}>
              Connect with Meta Lead Ads
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#64748B", fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>
              Grant read-only permissions for your Facebook Pages and Lead Forms. We never post or modify your ads.
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="medium"
            disabled={connectingFb}
            startIcon={connectingFb ? <CircularProgress size={18} color="inherit" /> : <FacebookIcon />}
            onClick={handleStartFacebookLogin}
            sx={{
              backgroundColor: "#1877F2",
              color: "#FFFFFF",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              px: 3,
              py: 1,
              borderRadius: "6px",
              boxShadow: "0 2px 4px rgba(24, 119, 242, 0.2)",
              "&:hover": {
                backgroundColor: "#166FE5",
              },
            }}
          >
            {connectingFb ? "Authenticating with Meta..." : "Continue with Facebook"}
          </Button>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, color: "#94A3B8" }}>
            <LockOutlinedIcon sx={{ fontSize: 14 }} />
            <Typography sx={{ fontSize: "11px", fontFamily: "Inter, sans-serif" }}>
              Encrypted OAuth 2.0 handshake using official Meta Graph API
            </Typography>
          </Box>
        </Paper>
      ) : (
        /* STATE B: LOGGED IN */
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Account Card with Re-authenticate / Switch Account Option */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar
                src={facebookAccount.avatar}
                alt={facebookAccount.name}
                sx={{ width: 44, height: 44, border: "2px solid #1877F2" }}
              >
                {facebookAccount.name?.charAt(0)}
              </Avatar>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>
                    Signed in as {facebookAccount.name}
                  </Typography>
                  <CheckCircleRoundedIcon sx={{ fontSize: 16, color: "#84CC16" }} />
                </Box>
                <Typography sx={{ fontSize: "12px", color: "#64748B", fontFamily: "Inter, sans-serif" }}>
                  {facebookAccount.email || "Meta Business Account Verified"}
                </Typography>
              </Box>
            </Box>

            {/* "Use another account" button - re-triggers OAuth with auth_type=reauthenticate */}
            <Button
              size="small"
              variant="outlined"
              startIcon={<SwapHorizIcon />}
              onClick={onSwitchAccount}
              sx={{
                textTransform: "none",
                fontSize: "12px",
                fontFamily: "Inter, sans-serif",
                borderColor: "#CBD5E1",
                color: "#334155",
                borderRadius: "6px",
                "&:hover": {
                  borderColor: "#84CC16",
                  color: "#65A30D",
                  backgroundColor: "rgba(132, 204, 22, 0.08)",
                },
              }}
            >
              Use another account
            </Button>
          </Paper>

          {/* Page Select Section */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.8 }}>
              <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#1E293B", fontFamily: "Inter, sans-serif" }}>
                Select Facebook Page <Typography component="span" sx={{ color: "#EF4444" }}>*</Typography>
              </Typography>
              {loadingPages && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <CircularProgress size={12} sx={{ color: "#84CC16" }} />
                  <Typography sx={{ fontSize: "11px", color: "#64748B", fontFamily: "Inter, sans-serif" }}>Refreshing pages...</Typography>
                </Box>
              )}
            </Box>

            <FormControl fullWidth size="small">
              <Select
                value={pageId || ""}
                onChange={handlePageSelect}
                displayEmpty
                sx={{
                  borderRadius: "6px",
                  backgroundColor: "#FFFFFF",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  "& fieldset": { borderColor: "#E2E8F0" },
                  "&:hover fieldset": { borderColor: "#CBD5E1" },
                  "&.Mui-focused fieldset": { borderColor: "#84CC16" },
                }}
              >
                <MenuItem value="" disabled sx={{ fontSize: "14px", fontFamily: "Inter, sans-serif" }}>
                  <em>Choose a Facebook Page...</em>
                </MenuItem>
                {pages.map((p) => {
                  const alreadyConnected = isPageAlreadyConnected(p.id);
                  return (
                    <MenuItem
                      key={p.id}
                      value={p.id}
                      disabled={alreadyConnected}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 1,
                        fontSize: "14px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FacebookIcon sx={{ color: alreadyConnected ? "#94A3B8" : "#1877F2", fontSize: 18 }} />
                        <Typography sx={{ fontSize: "13px", fontWeight: 500, color: alreadyConnected ? "#94A3B8" : "#1E293B", fontFamily: "Inter, sans-serif" }}>
                          {p.name}
                        </Typography>
                        {p.followers && (
                          <Chip
                            label={`${p.followers} followers`}
                            size="small"
                            sx={{ height: 18, fontSize: "10px", backgroundColor: "#F1F5F9", color: "#64748B", fontFamily: "Inter, sans-serif" }}
                          />
                        )}
                      </Box>

                      {alreadyConnected && (
                        <Typography sx={{ fontSize: "12px", color: "#94A3B8", fontStyle: "italic", fontFamily: "Inter, sans-serif" }}>
                          (already connected)
                        </Typography>
                      )}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>

          {/* Helper Text for Multi-Account Login */}
          <Alert
            severity="info"
            icon={<InfoOutlinedIcon sx={{ fontSize: 18, color: "#1877F2" }} />}
            sx={{
              backgroundColor: "rgba(24, 119, 242, 0.05)",
              color: "#1E293B",
              borderRadius: "8px",
              fontSize: "12px",
              fontFamily: "Inter, sans-serif",
              py: 0.8,
              border: "1px solid rgba(24, 119, 242, 0.15)",
              "& .MuiAlert-message": { fontSize: "12px", fontFamily: "Inter, sans-serif" },
            }}
          >
            <strong>Tip for agency admins:</strong> On the Facebook screen, choose &apos;Log in as another account&apos; to use a different login and manage separate client ad accounts.
          </Alert>
        </Box>
      )}
    </Box>
  );
}
