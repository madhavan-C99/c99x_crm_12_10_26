import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Switch,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Skeleton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  getCampaignDetail,
  updateCampaignDetail,
} from "@/apps/admin/services/campaignManagementService";

export const EditCampaign = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const campaignIdParam = searchParams.get("campaign_id");
  const rawName = searchParams.get("campaign_name") || "";
  const pipelineIdParam = searchParams.get("pipeline_id");
  const savedPipelineId = sessionStorage.getItem("admin_pipeline_selected");
  const effectivePipelineId = pipelineIdParam || savedPipelineId;

  const [loading, setLoading] = useState(true);
  const [campaignId, setCampaignId] = useState(campaignIdParam || null);
  const [campaignName, setCampaignName] = useState(rawName);
  const [pipelineName, setPipelineName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [distributionType, setDistributionType] = useState("");
  const [pauseCampaign, setPauseCampaign] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [agents, setAgents] = useState([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadCampaignData();
  }, [rawName, campaignIdParam, pipelineIdParam]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      const res = await getCampaignDetail({
        campaign_id: campaignIdParam ? Number(campaignIdParam) : null,
        campaign_name: rawName || undefined,
        pipeline_id: effectivePipelineId ? Number(effectivePipelineId) : undefined,
      });
      if (res?.data?.data) {
        const d = res.data.data;
        setCampaignId(d.campaign_id);
        setCampaignName(d.name || rawName);
        setPipelineName(d.pipeline_category_name || "");
        setManagerName(d.manager_name || "");
        setDistributionType(
          d.lead_distribution_type === "on_demand"
            ? "On Demand"
            : d.lead_distribution_type === "equal" ||
                d.lead_distribution_type === "equal_assignment"
              ? "Equal Assignment"
              : d.lead_distribution_type || "",
        );
        setPauseCampaign(!d.is_active);

        const mappedAgents = (d.agents || []).map((a) => ({
          id: a.agent_id,
          name: a.user_name,
          email: a.email,
          paused: !a.is_active, // GREEN (ON) = PAUSED, GREY (OFF) = ACTIVE
        }));
        setAgents(mappedAgents);
      }
    } catch (err) {
      console.error("Failed to fetch campaign details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePause = async (event) => {
    const isPaused = event.target.checked;
    setPauseCampaign(isPaused);

    try {
      setUpdating(true);
      await updateCampaignDetail({ campaign_id: campaignId ? Number(campaignId) : null, campaign_name: rawName, pipeline_id: effectivePipelineId ? Number(effectivePipelineId) : undefined, is_active: !isPaused }); toast.success(isPaused ? "Campaign paused successfully!" : "Campaign activated successfully!");
    } catch (err) {
      console.error("Failed to update campaign pause status:", err);
      setPauseCampaign(!isPaused); // revert on error
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleAgent = async (agentId) => {
    const updatedAgents = agents.map((a) =>
      a.id === agentId ? { ...a, paused: !a.paused } : a,
    );
    setAgents(updatedAgents);

    const toggledAgent = updatedAgents.find((a) => a.id === agentId);
    if (!toggledAgent) return;

    try {
      setUpdating(true);
      // toggledAgent.paused === true means agent is PAUSED -> is_active = false in DB
      await updateCampaignDetail({ campaign_id: campaignId ? Number(campaignId) : null, campaign_name: rawName, pipeline_id: effectivePipelineId ? Number(effectivePipelineId) : undefined, agent_toggles: [{ agent_id: agentId, is_active: !toggledAgent.paused }] }); toast.success(toggledAgent.paused ? "Agent paused for this campaign" : "Agent activated for this campaign");
    } catch (err) {
      console.error("Failed to update agent toggle status:", err);
      // revert on error
      setAgents(
        agents.map((a) => (a.id === agentId ? { ...a, paused: !a.paused } : a)),
      );
    } finally {
      setUpdating(false);
    }
  };

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.email && a.email.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3.5 },
        py: 3,
        bgcolor: "#F3F4F6",
        minHeight: "100vh",
      }}
    >
      {/* HEADER ROW */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <IconButton
            onClick={() => navigate(-1)}
            size="small"
            sx={{ color: "#111827", p: 0.5 }}
          >
            <ArrowBackIcon sx={{ fontSize: "22px" }} />
          </IconButton>
          <Typography
            sx={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Edit Campaign
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: "13.5px", color: "#4B5563" }}>
            Pause campaign
          </Typography>
          <Switch
            checked={pauseCampaign}
            onChange={handleTogglePause}
            disabled={loading || updating}
            size="small"
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "#90D916",
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "#90D916",
              },
            }}
          />
        </Box>
      </Box>

      {/* TOP CARD: PRIMARY CAMPAIGN INFO */}
      <Paper
        elevation={0}
        sx={{
          px: 3.5,
          py: 2.2,
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          backgroundColor: "#FFFFFF",
          mb: 2.5,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "300px 240px 1fr",
            },
            gap: 2,
            alignItems: "center",
          }}
        >
          <Box>
            <Typography sx={{ fontSize: "13px", color: "#6B7280", mb: 0.4 }}>
              Campaign Name:
            </Typography>
            <Typography
              sx={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}
            >
              {loading ? <Skeleton width={120} /> : campaignName}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: "13px", color: "#6B7280", mb: 0.4 }}>
              Pipeline:
            </Typography>
            <Typography
              sx={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#111827",
                textTransform: "uppercase",
              }}
            >
              {loading ? <Skeleton width={100} /> : pipelineName}
            </Typography>
          </Box>

          <Box sx={{ justifySelf: { sm: "flex-start" } }}>
            <Typography sx={{ fontSize: "13px", color: "#6B7280", mb: 0.4 }}>
              Campaign Manager:
            </Typography>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "#F3F4F6",
                px: 2.5,
                py: 0.6,
                borderRadius: "20px",
              }}
            >
              <Typography
                sx={{ fontSize: "13.5px", fontWeight: 500, color: "#374151" }}
              >
                {loading ? <Skeleton width={80} /> : managerName}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* MIDDLE SECTION: ADDITIONAL SETTINGS */}
      <Box sx={{ mb: 2.5 }}>
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#374151",
            mb: 1.2,
          }}
        >
          Additional Settings
        </Typography>

        <Paper
          elevation={0}
          sx={{
            px: 3.5,
            py: 2.2,
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            backgroundColor: "#FFFFFF",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "240px 220px 260px 1fr",
              },
              gap: 2,
              alignItems: "center",
            }}
          >
            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6B7280", mb: 0.4 }}>
                Lead Distribution
              </Typography>
              <Typography
                sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}
              >
                {loading ? <Skeleton width={120} /> : distributionType}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* BOTTOM SECTION: CAMPAIGN AGENTS */}
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Typography
            sx={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Campaign Agents
          </Typography>

          <TextField
            placeholder="Search Agent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{
              width: "200px",
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#FFFFFF",
                borderRadius: "8px",
                height: "36px",
                fontSize: "13px",
                "& fieldset": { borderColor: "#D1D5DB" },
              },
            }}
          />
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
          }}
        >
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "#FFFFFF" }}>
                <TableRow sx={{ borderBottom: "1px solid #E5E7EB" }}>
                  <TableCell
                    sx={{
                      width: "80px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#6B7280",
                      py: 1.5,
                      pl: 3.5,
                    }}
                  >
                    S.No
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#6B7280",
                      py: 1.5,
                    }}
                  >
                    User Name
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#6B7280",
                      py: 1.5,
                      pr: 4,
                    }}
                  >
                    Lead Assignment
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1, 2, 3].map((n) => (
                    <TableRow key={n}>
                      <TableCell pl={3.5}>
                        <Skeleton width={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={140} />
                      </TableCell>
                      <TableCell align="right" pr={4}>
                        <Skeleton
                          variant="rectangular"
                          width={34}
                          height={20}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAgents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      align="center"
                      sx={{ py: 3, color: "#6B7280" }}
                    >
                      No agents found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgents.map((agent, index) => (
                    <TableRow
                      key={agent.id}
                      sx={{
                        borderBottom: "1px solid #F3F4F6",
                        "&:last-child": { borderBottom: 0 },
                        "&:hover": { backgroundColor: "#F9FAFB" },
                      }}
                    >
                      <TableCell
                        sx={{
                          fontSize: "14px",
                          color: "#4B5563",
                          py: 1.5,
                          pl: 3.5,
                        }}
                      >
                        {index + 1}.
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#111827",
                          py: 1.5,
                        }}
                      >
                        {agent.name}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.5, pr: 4 }}>
                        <Switch
                          checked={agent.paused}
                          onChange={() => handleToggleAgent(agent.id)}
                          disabled={updating}
                          size="small"
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": {
                              color: "#90D916",
                            },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                              {
                                backgroundColor: "#90D916",
                              },
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default EditCampaign;
