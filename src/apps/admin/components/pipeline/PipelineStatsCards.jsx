import { useEffect, useState } from "react";
import { Box, Paper, Typography, Skeleton } from "@mui/material";
import { NorthEast, SouthEast } from "@mui/icons-material";
import { getCampaignStatsTile } from "@/apps/admin/services/campaignStatsService";

const CARD_STYLE = {
  total_campaign: {
    title: "Total campaign",
    bg: "#E5F1FF",
    valueColor: "#0B1E3F",
  },
  total_leads_collected: {
    title: "Total leads collected",
    bg: "#DCFBF1",
    valueColor: "#0B1E3F",
  },
  avg_conversion_rate: {
    title: "Avg- conversion rate",
    bg: "#FBE9CE",
    valueColor: "#0B1E3F",
  },
  top_lead_source: {
    title: "Top Lead Source",
    bg: "#E4F6C9",
    valueColor: "#0B1E3F",
  },
};

const PipelineStatsCards = ({ refreshKey = 0, pipelineId = null }) => {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);

  useEffect(() => {
    if (!pipelineId) return;
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const payload = {
          pipeline_id: Number(pipelineId),
        };
        const res = await getCampaignStatsTile(payload);
        const data = res?.data?.data;
        if (!data || !isMounted) {
          setCards([]);
          return;
        }
        setCards(
          Object.keys(CARD_STYLE).map((key) => ({
            key,
            value: data[key]?.value ?? 0,
            note: data[key]?.note ?? "",
            show_trend: Boolean(data[key]?.show_trend),
            trend: data[key]?.trend ?? "up",
          })),
        );
      } catch (err) {
        console.error("Failed to load pipeline stats:", err);
        if (isMounted) setCards([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [refreshKey, pipelineId]);

  // 🌟 SKELETON PLACEHOLDER LOADING STATE
  if (loading) {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(1, 1fr)",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
          p: { xs: 1.5, sm: 2 },
        }}
      >
        {[1, 2, 3, 4].map((n) => (
          <Paper
            key={n}
            elevation={0}
            sx={{ p: 2.5, borderRadius: "14px", background: "#f8fafc" }}
          >
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton
              variant="rectangular"
              width="45%"
              height={32}
              sx={{ my: 1, borderRadius: 1 }}
            />
            <Skeleton variant="text" width="75%" height={16} />
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
          md: "repeat(4, 1fr)",
        },
        gap: 2,
        p: { xs: 1.5, sm: 2 },
      }}
    >
      {cards.map((item) => {
        const style = CARD_STYLE[item.key] || CARD_STYLE.total_campaign;
        const isUp = item.trend !== "down";
        const trendColor = isUp ? "#1F9254" : "#D32F2F";
        const TrendIcon = isUp ? NorthEast : SouthEast;

        return (
          <Paper
            key={item.key}
            elevation={0}
            sx={{ p: 2.5, borderRadius: "14px", background: style.bg }}
          >
            <Typography sx={{ fontSize: "14px", color: "#444" }}>
              {style.title}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: "22px", sm: "24px", md: "28px" },
                fontWeight: 700,
                color: style.valueColor,
                mt: 0.5,
              }}
            >
              {item.value}
            </Typography>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}
            >
              {item.show_trend && (
                <TrendIcon sx={{ fontSize: "14px", color: trendColor }} />
              )}
              <Typography
                sx={{
                  fontSize: "12px",
                  color: item.show_trend ? trendColor : "#666",
                  fontWeight: 500,
                }}
              >
                {item.note}
              </Typography>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
};

export default PipelineStatsCards;
