import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCampaignCards } from "../../../services/campaignCardsService";

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

import {
    StarBorder,
    Star,
    MoreVert,
    ArrowForward,
} from "@mui/icons-material";

import { useAuth } from "@/shared/context/AuthContext";

const CampaignCard = ({ campaign, onToggleFavorite, onMenuAction, onViewDetails }) => {
    const { hasPermission } = useAuth();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const progressPercent =
        campaign.leadProgressTotal > 0
            ? (campaign.leadProgress / campaign.leadProgressTotal) * 100
            : 0;

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

                        {/* TODO(backend): Favorite campaign API not supported by backend */}

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
                        >
                            {/* TODO(backend): Duplicate, Archive, and Delete APIs are not implemented on backend. Only Edit is supported. */}
                            {["Edit"].map((label) => {
                                if (label === "Edit" && !hasPermission("api_update_campaign_detail_admin")) {
                                    return null;
                                }
                                return (
                                    <MenuItem
                                        key={label}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMenuAction(campaign.id, label);
                                            setAnchorEl(null);
                                        }}
                                        sx={{ fontSize: "13px" }}
                                    >
                                        {label}
                                    </MenuItem>
                                );
                            })}
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
                        <Typography sx={{ fontSize: "16px", fontWeight: 700, color: "#111" }}>
                            {campaign.totalLeads}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography sx={{ fontSize: "12px", color: "#777" }}>
                            Conversion
                        </Typography>
                        <Typography sx={{ fontSize: "16px", fontWeight: 700, color: "#111" }}>
                            {campaign.conversion}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography sx={{ fontSize: "12px", color: "#777" }}>
                            Closed
                        </Typography>
                        <Typography sx={{ fontSize: "16px", fontWeight: 700, color: "#111" }}>
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
                        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#111" }}>
                            Lead progress
                        </Typography>
                        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#111" }}>
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
                onClick={() => onViewDetails(campaign.id)}
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
    searchValue = "",
    refreshKey = 0,
    onToggleFavorite = () => {},
    onMenuAction = () => {},
    onViewDetails,
}) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [fetchedCampaigns, setFetchedCampaigns] = useState([]);

    const handleViewDetails =
        onViewDetails || ((campaignId) => navigate(`/admin/enquiry-sheet?campaign_id=${campaignId}`));

    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                setLoading(true);
                const res = await getCampaignCards();
                const data = res?.data?.data;
                if (Array.isArray(data) && isMounted) {
                    setFetchedCampaigns(data);
                }
            } catch (err) {
                console.error("Failed to load campaign cards:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        })();
        return () => {
            isMounted = false;
        };
    }, [refreshKey]);

    const data = campaigns && campaigns.length ? campaigns : fetchedCampaigns;
    const trimmedSearch = (searchValue || "").trim().toLowerCase();
    const displayData = trimmedSearch
        ? data.filter((campaign) =>
              (campaign?.name || campaign?.campaign_name || "")
                  .toLowerCase()
                  .includes(trimmedSearch)
          )
        : data;

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
                    <Paper key={n} elevation={0} sx={{ p: 2.5, borderRadius: "14px", border: "1px solid #ECECEC" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                            <Skeleton variant="text" width="55%" height={24} />
                            <Skeleton variant="circular" width={24} height={24} />
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", my: 2 }}>
                            <Skeleton variant="rectangular" width="28%" height={32} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" width="28%" height={32} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" width="28%" height={32} sx={{ borderRadius: 1 }} />
                        </Box>
                        <Skeleton variant="rectangular" width="100%" height={8} sx={{ borderRadius: 4, my: 1.5 }} />
                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Skeleton variant="text" width="30%" height={20} />
                        </Box>
                    </Paper>
                ))}
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
            {displayData.map((campaign) => (
                <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onToggleFavorite={onToggleFavorite}
                    onMenuAction={onMenuAction}
                    onViewDetails={handleViewDetails}
                />
            ))}
        </Box>
    );
};

export default CampaignCards;