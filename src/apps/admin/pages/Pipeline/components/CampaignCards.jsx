import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getCampaignCards } from "@/apps/admin/services/campaignCardsService";

import {
  Box,
  Paper,
  Typography,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Skeleton,
} from "@mui/material";

import { StarBorder, Star, MoreVert, ArrowForward } from "@mui/icons-material";

import { useAuth } from "@/shared/context/AuthContext";

const CampaignCard = ({
  campaign,
  pipelineId,
  onToggleFavorite,
  onMenuAction,
  onViewDetails,
}) => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const progressPercent =
    campaign.leadProgressTotal > 0
      ? (campaign.leadProgress / campaign.leadProgressTotal) * 100
      : 0;

  const handleViewLogs = () => {
    navigate(
      `/admin/call-log-report?campaign_id=${campaign.id}&campaign_name=${encodeURIComponent(campaign.name)}`,
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: "14px",
        border: "1px solid #ECECEC",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        bgcolor: "#fff",
        transition: "all 0.3s ease-in-out",
        cursor: "pointer",

        // 🌟 HOVER SOFT GREEN GLOW SHADOW
        "&:hover": {
          bgcolor: "#fff",
          boxShadow: "0 8px 24px rgba(183, 227, 74, 0.5)",
          transform: "translateY(-3px)",
        },
      }}
    >
      <Box>
        {/* HEADER ROW */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              sx={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#111",
              }}
            >
              {campaign.name}
            </Typography>
            {(campaign.isActive === false || campaign.is_active === false) && (
              <Box
                sx={{
                  px: 1,
                  py: 0.2,
                  borderRadius: "4px",
                  backgroundColor: "#FFE5E5",
                  color: "#D9383A",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                }}
              >
                PAUSED
              </Box>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(campaign.id);
              }}
            >
              {campaign.isFavorite ? (
                <Star sx={{ fontSize: "18px", color: "#F5A623" }} />
              ) : (
                <StarBorder sx={{ fontSize: "18px", color: "#B0B0B0" }} />
              )}
            </IconButton>

            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setAnchorEl(e.currentTarget);
              }}
            >
              <MoreVert sx={{ fontSize: "18px", color: "#B0B0B0" }} />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={() => setAnchorEl(null)}
              PaperProps={{
                elevation: 2,
                sx: {
                  borderRadius: "8px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  border: "1px solid #ECECEC",
                  minWidth: "130px",
                  py: 0.5,
                },
              }}
            >
              {hasPermission("api_update_campaign_detail_admin") && (
                <MenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onMenuAction(campaign.id, "Edit", campaign);
                    setAnchorEl(null);
                  }}
                  sx={{ fontSize: "14px", py: 0.8, px: 2, color: "#111" }}
                >
                  Edit
                </MenuItem>
              )}
              <MenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuAction(campaign.id, "Copy", campaign);
                  setAnchorEl(null);
                }}
                sx={{ fontSize: "14px", py: 0.8, px: 2, color: "#111" }}
              >
                Copy
              </MenuItem>
              <MenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewLogs();
                  setAnchorEl(null);
                }}
                sx={{ fontSize: "14px", py: 0.8, px: 2, color: "#111" }}
              >
                View Logs
              </MenuItem>
              <MenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuAction(campaign.id, "Archive", campaign);
                  setAnchorEl(null);
                }}
                sx={{ fontSize: "14px", py: 0.8, px: 2, color: "#111" }}
              >
                Archive
              </MenuItem>
              <MenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuAction(campaign.id, "Delete", campaign);
                  setAnchorEl(null);
                }}
                sx={{ fontSize: "14px", py: 0.8, px: 2, color: "#D32F2F" }}
              >
                Delete
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* STATS ROW */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: { xs: 1.5, sm: 3 },
            mt: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: "12px", color: "#777" }}>
              Total Leads
            </Typography>
            <Typography
              sx={{ fontSize: "16px", fontWeight: 700, color: "#111" }}
            >
              {campaign.totalLeads}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: "12px", color: "#777" }}>
              Conversion
            </Typography>
            <Typography
              sx={{ fontSize: "16px", fontWeight: 700, color: "#111" }}
            >
              {campaign.conversion}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: "12px", color: "#777" }}>
              Closed
            </Typography>
            <Typography
              sx={{ fontSize: "16px", fontWeight: 700, color: "#111" }}
            >
              {campaign.closed}
            </Typography>
          </Box>
        </Box>

        {/* PROGRESS */}
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 0.5,
            }}
          >
            <Typography
              sx={{ fontSize: "13px", fontWeight: 600, color: "#111" }}
            >
              Lead progress
            </Typography>
            <Typography
              sx={{ fontSize: "13px", fontWeight: 600, color: "#111" }}
            >
              {campaign.leadProgress}
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              height: 6,
              borderRadius: 4,
              backgroundColor: "#EDEDED",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
                backgroundColor: "#0011C5",
              },
            }}
          />
        </Box>
      </Box>

      {/* VIEW DETAILS */}
      <Box
        onClick={() => onViewDetails(campaign.id, campaign.name, pipelineId)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 0.5,
          mt: 2,
          cursor: "pointer",
        }}
      >
        <Typography
          sx={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#0011C5",
            textDecoration: "underline",
          }}
        >
          View Details
        </Typography>
        <ArrowForward sx={{ fontSize: "14px", color: "#0011C5" }} />
      </Box>
    </Paper>
  );
};

const CampaignCards = ({
  campaigns,
  refreshKey = 0,
  pipelineId = null,
  searchValue = "",
  onToggleFavorite = () => {},
  onMenuAction = () => {},
  onViewDetails,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fetchedCampaigns, setFetchedCampaigns] = useState([]);

  const handleViewDetails =
    onViewDetails ||
    ((campaignId, campaignName, pId) => {
      const activePipelineId = pId || pipelineId;
      const query = new URLSearchParams();
      if (campaignName) query.set("campaign_name", campaignName);
      if (activePipelineId) query.set("pipeline_id", activePipelineId);
      navigate(`/admin/enquiry-sheet/${campaignId}?${query.toString()}`);
    });

  useEffect(() => {
    if (!pipelineId) return;
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const payload = {
          pipeline_id: Number(pipelineId),
        };
        if (searchValue && searchValue.trim()) {
          payload.search = searchValue.trim();
        }
        const res = await getCampaignCards(payload);
        const data = res?.data?.data;
        if (Array.isArray(data) && isMounted) {
          setFetchedCampaigns(data);
        } else if (isMounted) {
          setFetchedCampaigns([]);
        }
      } catch (err) {
        console.error("Failed to load campaign cards:", err);
        if (isMounted) setFetchedCampaigns([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [refreshKey, pipelineId, searchValue]);

  const rawList = campaigns && campaigns.length ? campaigns : fetchedCampaigns;

  const data = useMemo(() => {
    let list = Array.isArray(rawList) ? rawList : [];
    if (pipelineId) {
      list = list.filter((c) => {
        const catId = c.pipeline_category_id ?? c.pipeline_id ?? c.category_id;
        return catId ? Number(catId) === Number(pipelineId) : true;
      });
    }
    if (searchValue && searchValue.trim()) {
      const q = searchValue.toLowerCase().trim();
      list = list.filter((c) => {
        const name = String(c.name || c.campaign_name || "").toLowerCase();
        return name.includes(q);
      });
    }
    return list;
  }, [rawList, pipelineId, searchValue]);

  // 🌟 SKELETON PLACEHOLDER LOADING STATE
  if (loading) {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(1, 1fr)",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
          p: { xs: 1, sm: 2 },
          pt: 1.5,
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <Paper
            key={n}
            elevation={0}
            sx={{ p: 2.5, borderRadius: "14px", border: "1px solid #ECECEC" }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Skeleton variant="text" width="55%" height={24} />
              <Skeleton variant="circular" width={24} height={24} />
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", my: 2 }}
            >
              <Skeleton
                variant="rectangular"
                width="28%"
                height={32}
                sx={{ borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                width="28%"
                height={32}
                sx={{ borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                width="28%"
                height={32}
                sx={{ borderRadius: 1 }}
              />
            </Box>
            <Skeleton
              variant="rectangular"
              width="100%"
              height={8}
              sx={{ borderRadius: 4, my: 1.5 }}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Skeleton variant="text" width="30%" height={20} />
            </Box>
          </Paper>
        ))}
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box sx={{ p: 6, textAlign: "center", color: "#64748B" }}>
        <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#334155", mb: 0.5 }}>
          No Campaigns Found
        </Typography>
        <Typography sx={{ fontSize: "13px", color: "#94A3B8" }}>
          No campaigns found for the selected pipeline. Click 'Create Campaign' to add one.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(1, 1fr)",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(4, 1fr)",
        },
        gap: 2,
        p: { xs: 1, sm: 2 },
        pt: 1.5,
      }}
    >
      {data.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          pipelineId={pipelineId}
          onToggleFavorite={onToggleFavorite}
          onMenuAction={onMenuAction}
          onViewDetails={handleViewDetails}
        />
      ))}
    </Box>
  );
};

export default CampaignCards;
