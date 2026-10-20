import React, { useState, useEffect } from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Divider,
  TextField,
  InputAdornment,
  Button,
  Checkbox,
  Avatar,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckIcon from "@mui/icons-material/Check";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import { getSelectOptions } from "@/apps/admin/services/dropdownService";

const PRIMARY_BLUE = "#0021CA";

export default function TransferSingleLeadModal({
  open,
  onClose,
  onTransferConfirm,
  onTransferSuccess,
  campaignId = null,
  telecallersList = [],
  title = "Transfer Leads",
  subtitleText = null,
  campaignValueText = "",
  leadsCountValueText = "",
  currentAssignee = "",
  totalLeadsCount = 0,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTelecallerIds, setSelectedTelecallerIds] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [fetchedTelecallers, setFetchedTelecallers] = useState([]);
  const [loadingTelecallers, setLoadingTelecallers] = useState(false);

  const activeSourceList = fetchedTelecallers.length > 0 ? fetchedTelecallers : telecallersList;

  const telecallers =
    Array.isArray(activeSourceList)
      ? activeSourceList.map((t, idx) => ({
          id: t.id !== undefined ? t.id : (t.value !== undefined ? t.value : idx + 1),
          name: t.name || t.full_name || t.label || t.user_name || "",
          currentLeads:
            t.current_leads !== undefined
              ? t.current_leads
              : t.currentLeads || 0,
          totalLeadsText: `${
            t.current_leads !== undefined
              ? t.current_leads
              : t.currentLeads || 0
          } Leads`,
          segments: Array.isArray(t.segments)
            ? t.segments
            : ["#0205C8", "#90D916", "#DC2626"],
        }))
      : [];

  const targetCount = subtitleText
    ? parseInt(String(subtitleText).replace(/\D/g, ""), 10) || totalLeadsCount || 0
    : totalLeadsCount || 0;

  useEffect(() => {
    let isMounted = true;
    if (open) {
      setSearchQuery("");
      setSelectedTelecallerIds([]);
      setAllocations({});
      setLoadingTelecallers(true);

      const optFilter = campaignId ? { campaign_id: Number(campaignId) } : null;

      getSelectOptions("L_TELECALLERS", optFilter)
        .then((options) => {
          if (!isMounted) return;
          const list = Array.isArray(options) ? options : [];
          setFetchedTelecallers(list);

          const source = list.length > 0 ? list : telecallersList;
          const mapped = Array.isArray(source)
            ? source.map((t, idx) => ({
                id: t.id !== undefined ? t.id : (t.value !== undefined ? t.value : idx + 1),
                name: t.name || t.full_name || t.label || t.user_name || "",
              }))
            : [];

          const initialSelected = mapped.slice(0, 2).map((t) => t.id);
          setSelectedTelecallerIds(initialSelected);

          if (initialSelected.length > 0) {
            const count = initialSelected.length;
            const perPerson = Math.floor(targetCount / count);
            const remainder = targetCount % count;
            const newAlloc = {};
            initialSelected.forEach((tId, idx) => {
              newAlloc[tId] = perPerson + (idx === 0 ? remainder : 0);
            });
            setAllocations(newAlloc);
          }
        })
        .catch((err) => {
          console.error("Error fetching campaign telecallers:", err);
          if (!isMounted) return;
          setFetchedTelecallers([]);
          setSelectedTelecallerIds([]);
          setAllocations({});
        })
        .finally(() => {
          if (isMounted) setLoadingTelecallers(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [open, campaignId, targetCount]);

  if (!open) return null;

  const filteredTelecallers = telecallers.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleTelecaller = (id) => {
    let nextIds;
    if (selectedTelecallerIds.includes(id)) {
      nextIds = selectedTelecallerIds.filter((item) => item !== id);
    } else {
      nextIds = [...selectedTelecallerIds, id];
    }
    setSelectedTelecallerIds(nextIds);

    // Auto distribute leads evenly whenever selection changes!
    if (nextIds.length > 0) {
      const count = nextIds.length;
      const perPerson = Math.floor(targetCount / count);
      const remainder = targetCount % count;
      const newAlloc = {};
      nextIds.forEach((tId, idx) => {
        newAlloc[tId] = perPerson + (idx === 0 ? remainder : 0);
      });
      setAllocations(newAlloc);
    } else {
      setAllocations({});
    }
  };

  const totalAllocated = selectedTelecallerIds.reduce(
    (sum, id) => sum + (allocations[id] || 0),
    0
  );
  const remainingLeads = Math.max(0, targetCount - totalAllocated);

  const handleTransfer = () => {
    const distributions = selectedTelecallerIds.map((tId) => {
      const tObj = telecallers.find((t) => t.id === tId);
      return {
        telecaller_id: Number(tId),
        telecaller_name: tObj?.name || "",
        lead_count: Number(allocations[tId] || 0),
      };
    });

    if (onTransferConfirm) {
      onTransferConfirm({
        selectedTelecallerIds,
        allocations,
        distributions,
      });
    }
    if (onTransferSuccess) {
      onTransferSuccess();
    }
    onClose();
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth={false}
      sx={{
        "& .MuiDialog-paper": {
          width: "396px",
          maxWidth: "95vw",
          maxHeight: "92vh",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          p: 0,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
          backgroundColor: "#FFFFFF",
        },
      }}
    >
      {/* 1. Header Bar matching Image */}
      <Box
        sx={{
          height: "44px",
          backgroundColor: PRIMARY_BLUE,
          px: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SettingsOutlinedIcon sx={{ color: "#FFFFFF", fontSize: 16 }} />
          <Typography
            sx={{
              color: "#FFFFFF",
              fontWeight: 500,
              fontSize: "16px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {title || "Transfer Leads"}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: "#FFFFFF", p: 0.5 }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Scrollable Body Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.8,
          backgroundColor: "#FFFFFF",
          "&::-webkit-scrollbar": { width: "5px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#CBD5E1",
            borderRadius: "4px",
          },
        }}
      >
        {/* Subtitle Banner */}
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight:500,
            color: "#475569",
            fontFamily: "Inter, sans-serif",
          }}
        >
          You're about to transfer{" "}
          <Box component="span" sx={{ color: PRIMARY_BLUE, fontWeight: 600 }}>
            {targetCount} leads
          </Box>
        </Typography>

        {/* Current Assignment Card */}
        <Box
          sx={{
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            p: 1.5,
            backgroundColor: "#FAFAFA",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 500,
                color: "#64748B",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Current Assignment
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight:600,
                color: "black",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {leadsCountValueText || `${targetCount} Leads`}
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#0F172A",
              fontFamily: "Inter, sans-serif",
              mb: 0.3,
            }}
          >
            {currentAssignee}
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight:500,
                color: "#64748B",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Campaign
            </Typography>
            <Typography
              sx={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#64748B",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {campaignValueText || "Google Ads"}
            </Typography>
          </Box>
        </Box>

        {/* Section 1: Transfer Leads to */}
        <Box sx={{ backgroundColor: "#F8FAFC", borderRadius: "8px", p: 1.5 }}>
          <Typography
            sx={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#0F172A",
              fontFamily: "Inter, sans-serif",
              mb: 1,
            }}
          >
            Transfer Leads to
          </Typography>

          {/* Search Telecaller Input */}
          <TextField
            fullWidth
            placeholder="Search Telecaller"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: "#94A3B8" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 1.2,
              "& .MuiOutlinedInput-root": {
                height: "34px",
                backgroundColor: "#FFFFFF",
                borderRadius: "6px",
                fontSize: "12.5px",
                "& fieldset": { border: "1px solid #E2E8F0" },
                "&:hover fieldset": { borderColor: "#CBD5E1" },
                "&.Mui-focused fieldset": { borderColor: PRIMARY_BLUE },
              },
            }}
          />

          {/* Telecallers Checkbox List */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
            {loadingTelecallers ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} sx={{ color: PRIMARY_BLUE }} />
              </Box>
            ) : filteredTelecallers.length === 0 ? (
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#64748B",
                  textAlign: "center",
                  py: 1.5,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                No telecallers found for this campaign.
              </Typography>
            ) : (
              filteredTelecallers.map((telecaller) => {
                const isChecked = selectedTelecallerIds.includes(telecaller.id);
                return (
                  <Box
                    key={telecaller.id}
                    onClick={() => handleToggleTelecaller(telecaller.id)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1,
                      backgroundColor: "#FFFFFF",
                      borderRadius: "6px",
                      border: "1px solid #E2E8F0",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      "&:hover": { borderColor: PRIMARY_BLUE },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <Checkbox
                        checked={isChecked}
                        onChange={() => handleToggleTelecaller(telecaller.id)}
                        size="small"
                        sx={{
                          p: 0,
                          color: "#CBD5E1",
                          "&.Mui-checked": { color: PRIMARY_BLUE },
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#1E293B",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {telecaller.name}
                      </Typography>
                    </Box>

                    {/* Progress Segments & Leads count */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                      <Box sx={{ display: "flex", gap: "2px" }}>
                        {telecaller.segments.map((color, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              width: "28px",
                              height: "8px",
                              backgroundColor: color,
                              borderRadius:
                                idx === 0
                                  ? "4px 0 0 4px"
                                  : idx === 2
                                  ? "0 4px 4px 0"
                                  : "0",
                            }}
                          />
                        ))}
                      </Box>

                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: 400,
                          color: "#64748B",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {telecaller.totalLeadsText}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>

        {/* Section 2: Distribution Summary Card matching Image 1 */}
        {selectedTelecallerIds.length > 0 && (
          <Box
            sx={{
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              p: 2,
              backgroundColor: "#FAFCFF",
              boxShadow: "0px 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#0F172A",
                fontFamily: "Inter, sans-serif",
                mb: 0.5,
              }}
            >
              Lead Distribution 
            </Typography>

            <Divider sx={{ mb: 1.2, borderColor: "#E2E8F0" }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {selectedTelecallerIds.map((id, index) => {
                const telecaller = telecallers.find((t) => t.id === id);
                if (!telecaller) return null;
                const allocated = allocations[id] || 0;

                return (
                  <React.Fragment key={id}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 0.5,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: "#DBEAFE",
                            color: PRIMARY_BLUE,
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Typography
                          sx={{
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "#0F172A",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {telecaller.name}
                        </Typography>
                      </Box>

                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "#64748B",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {allocated} leads
                      </Typography>
                    </Box>
                    {index < selectedTelecallerIds.length - 1 && (
                      <Divider sx={{ borderColor: "#F1F5F9" }} />
                    )}
                  </React.Fragment>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>

      {/* Footer Action Buttons */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 1.2,
          backgroundColor: "#FFFFFF",
          borderTop: "1px solid #F1F5F9",
          flexShrink: 0,
        }}
      >
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            backgroundColor: "#F1F5F9",
            color: "#475569",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: "13px",
            textTransform: "none",
            height: "36px",
            px: 2.2,
            borderRadius: "6px",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#E2E8F0",
              boxShadow: "none",
            },
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleTransfer}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
          sx={{
            backgroundColor: PRIMARY_BLUE,
            color: "#FFFFFF",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: "13px",
            textTransform: "none",
            height: "36px",
            px: 2.5,
            borderRadius: "6px",
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.15)",
            "&:hover": {
              backgroundColor: "#0104A0",
            },
          }}
        >
          Transfer {targetCount} Leads
        </Button>
      </Box>
    </Dialog>
  );
}
