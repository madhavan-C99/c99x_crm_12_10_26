import React from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Button,
  Avatar,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import PersonIcon from "@mui/icons-material/Person";

const PRIMARY_BLUE = "#0B25E0";

export default function TransferLeadsSuccessModal({
  open,
  onClose,
  count = 30,
  distributions = [],
}) {
  if (!open) return null;

  const telecallerCount = distributions.length;
  const hasDistributions = Array.isArray(distributions) && distributions.length > 0;

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth={false}
      sx={{
        "& .MuiDialog-paper": {
          width: "410px",
          maxWidth: "92vw",
          borderRadius: "16px",
          overflow: "hidden",
          p: 2.5,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.18)",
          backgroundColor: "#FFFFFF",
          position: "relative",
        },
      }}
    >
      {/* Top Right Close Button */}
      <IconButton
        size="small"
        onClick={onClose}
        sx={{
          position: "absolute",
          top: 14,
          right: 14,
          color: "#94A3B8",
          p: 0.5,
          "&:hover": { color: "#334155" },
        }}
      >
        <CloseIcon sx={{ fontSize: 18 }} />
      </IconButton>

      {/* Main Content Body */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          pt: 1,
        }}
      >
        {/* Top Green Check Circle */}
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "#22C55E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
            boxShadow: "0px 4px 12px rgba(34, 197, 94, 0.3)",
          }}
        >
          <CheckIcon sx={{ color: "#FFFFFF", fontSize: 34, strokeWidth: 2.5 }} />
        </Box>

        {/* Title */}
        <Typography
          sx={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#0F172A",
            fontFamily: "Inter, sans-serif",
            mb: 0.8,
          }}
        >
          Leads Transferred Successfully!
        </Typography>

        {/* Subtitle */}
        <Typography
          sx={{
            fontSize: "13.5px",
            color: "#64748B",
            fontFamily: "Inter, sans-serif",
            mb: hasDistributions ? 2.5 : 3,
            lineHeight: 1.4,
          }}
        >
          {hasDistributions ? (
            <>
              {count} leads have been transferred to{" "}
              <Box component="span" sx={{ fontWeight: 700, color: PRIMARY_BLUE }}>
                {telecallerCount}
              </Box>{" "}
              telecallers.
            </>
          ) : (
            `${count} leads have been reassigned successfully.`
          )}
        </Typography>

        {/* Distribution Summary Card */}
        {hasDistributions && (
          <Box
            sx={{
              width: "100%",
              backgroundColor: "#F8FAFC",
              borderRadius: "12px",
              border: "1px solid #F1F5F9",
              p: 2,
              mb: 2.5,
              textAlign: "left",
            }}
          >
            <Typography
              sx={{
                fontSize: "13.5px",
                fontWeight: 700,
                color: "#1E293B",
                fontFamily: "Inter, sans-serif",
                mb: 1.5,
              }}
            >
              Distribution Summary
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
              {distributions.map((item, index) => {
                const name =
                  item.telecaller_name || item.name || `Telecaller ${index + 1}`;
                const leadCount = item.lead_count ?? item.count ?? 0;

                return (
                  <React.Fragment key={index}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 0.4,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: "#E2E8F0",
                            color: "#475569",
                            fontSize: "14px",
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 18, color: "#64748B" }} />
                        </Avatar>
                        <Typography
                          sx={{
                            fontSize: "13.5px",
                            fontWeight: 600,
                            color: "#0F172A",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {name}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "13.5px",
                          fontWeight: 500,
                          color: "#64748B",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {leadCount} leads
                      </Typography>
                    </Box>
                    {index < distributions.length - 1 && (
                      <Divider sx={{ borderColor: "#F1F5F9" }} />
                    )}
                  </React.Fragment>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Full-width Done Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{
            backgroundColor: PRIMARY_BLUE,
            color: "#FFFFFF",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: "15px",
            textTransform: "none",
            height: "44px",
            borderRadius: "8px",
            boxShadow: "0px 3px 8px rgba(11, 37, 224, 0.25)",
            "&:hover": {
              backgroundColor: "#081EB8",
              boxShadow: "0px 4px 12px rgba(11, 37, 224, 0.35)",
            },
          }}
        >
          Done
        </Button>
      </Box>
    </Dialog>
  );
}
