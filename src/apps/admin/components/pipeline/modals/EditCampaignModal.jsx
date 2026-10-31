import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  MenuItem,
  Select,
  IconButton,
  Button,
  Radio,
  Grid,
  Checkbox,
  ListItemText,
  Paper,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import {
  getPipelineCategories,
  getCampaignManagers,
  getCampaignAgents,
  getCampaignDetail,
  updateCampaignDetail,
} from "@/apps/admin/services/campaignManagementService";
import { useAuth } from "@/shared/context/AuthContext";

const BRAND_GREEN = "#90D916";
const LIGHT_CHIP_BG = "#E5F4CD";
const GREY_BG = "#F5F5F5";
const managerMenuProps = {
  className: "modal-select-menu",
  anchorOrigin: {
    vertical: "bottom",
    horizontal: "left",
  },
  transformOrigin: {
    vertical: "top",
    horizontal: "left",
  },
  PaperProps: {
    className: "modal-select-paper",
    style: { maxHeight: 250 },
    sx: {
      maxHeight: "250px !important",
      overflowY: "auto",
      borderRadius: "8px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      "&::-webkit-scrollbar": { width: "5px" },
      "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
    },
  },
  slotProps: {
    paper: {
      className: "modal-select-paper",
      style: { maxHeight: 250 },
      sx: {
        maxHeight: "250px !important",
        overflowY: "auto",
        borderRadius: "8px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        "&::-webkit-scrollbar": { width: "5px" },
        "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
      },
    },
    list: {
      style: { maxHeight: 250 },
      sx: {
        maxHeight: "250px !important",
        overflowY: "auto",
        "&::-webkit-scrollbar": { width: "5px" },
        "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
      },
    },
  },
  MenuListProps: {
    style: { maxHeight: 250 },
    sx: {
      maxHeight: "250px !important",
      overflowY: "auto",
      "&::-webkit-scrollbar": { width: "5px" },
      "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
    },
  },
};

const AgentSelectPaper = React.forwardRef(
  ({ children, className, style, onCancel, onSubmit, ...other }, ref) => (
    <Paper
      ref={ref}
      elevation={8}
      className={`modal-select-paper has-footer ${className || ""}`}
      style={{
        position: "absolute",
        ...style,
        display: "flex",
        flexDirection: "column",
        maxHeight: "250px",
        borderRadius: "8px",
        overflow: "hidden",
      }}
      {...other}
    >
      <div
        className="modal-select-scroll"
        style={{
          flex: "1 1 auto",
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {children}
      </div>
      <Box
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        sx={{
          borderTop: "1px solid #E2E8F0",
          p: 1.2,
          px: 2,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 1.5,
          backgroundColor: "#F8FAFC",
          flexShrink: 0,
          boxSizing: "border-box",
        }}
      >
        <Button
          variant="outlined"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCancel?.();
          }}
          sx={{
            height: "35px",
            px: 2.2,
            fontSize: "13.5px",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "6px",
            color: "#64748B",
            borderColor: "#CBD5E1",
            "&:hover": { borderColor: "#94A3B8", backgroundColor: "#FFFFFF" },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSubmit?.();
          }}
          sx={{
            height: "35px",
            px: 2.5,
            fontSize: "13.5px",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "6px",
            backgroundColor: BRAND_GREEN,
            color: "#FFFFFF",
            boxShadow: "none",
            "&:hover": { backgroundColor: "#7CB342", boxShadow: "none" },
          }}
        >
          Submit
        </Button>
      </Box>
    </Paper>
  ),
);
AgentSelectPaper.displayName = "AgentSelectPaper";



export const EditCampaignModal = ({
  open,
  onClose,
  campaign,
  pipelineId = null,
  onUpdateSuccess,
}) => {
  const { hasPermission } = useAuth();

  const [name, setName] = useState("");
  const [pipelineCategoryId, setPipelineCategoryId] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [selectedAgentIds, setSelectedAgentIds] = useState([]);
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);
  const [tempAgentIds, setTempAgentIds] = useState([]);
  const [distributionMode, setDistributionMode] = useState("on_demand"); // 'on_demand' or 'equal'

  // Dropdown states
  const [pipelineCategories, setPipelineCategories] = useState([]);
  const [managersList, setManagersList] = useState([]);
  const [agentsList, setAgentsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  const extractList = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  useEffect(() => {
    if (open && campaign) {
      loadInitialData();
    }
  }, [open, campaign]);

  const loadInitialData = async () => {
    try {
      setFetchingDetails(true);

      // 1. Fetch dropdown lists (categories, managers, agents)
      const [catRes, mgrRes, agtRes] = await Promise.all([
        getPipelineCategories().catch((err) => {
          console.error("Error loading categories:", err);
          return [];
        }),
        getCampaignManagers().catch((err) => {
          console.error("Error loading managers:", err);
          return [];
        }),
        getCampaignAgents().catch((err) => {
          console.error("Error loading agents:", err);
          return [];
        }),
      ]);

      const categories = extractList(catRes);
      const managers = extractList(mgrRes);
      const agents = extractList(agtRes);

      setPipelineCategories(categories);
      setManagersList(managers);
      setAgentsList(agents);

      // 2. Fetch specific campaign details to prefill form
      const campaignId = campaign?.id ?? campaign?.campaign_id;
      const campaignName = campaign?.name ?? campaign?.campaign_name ?? "";

      setName(campaignName);

      if (campaignId || campaignName) {
        const effectivePipelineId =
          pipelineId ??
          campaign?.pipeline_id ??
          sessionStorage.getItem("admin_pipeline_selected");

        const detailRes = await getCampaignDetail({
          campaign_id: campaignId ? Number(campaignId) : null,
          campaign_name: campaignName || undefined,
          pipeline_id: effectivePipelineId ? Number(effectivePipelineId) : undefined,
        }).catch((err) => {
          console.error("Error fetching campaign detail for edit:", err);
          return null;
        });

        if (detailRes?.data?.data) {
          const d = detailRes.data.data;
          if (d.name) setName(d.name);

          const pId =
            d.pipeline_id ||
            d.pipeline_category_id ||
            d.category_id ||
            campaign?.pipeline_id;
          if (pId) setPipelineCategoryId(Number(pId));

          if (d.manager_id) setSelectedManagerId(Number(d.manager_id));

          if (Array.isArray(d.agents)) {
            const agentIds = d.agents
              .map((a) => Number(a.agent_id || a.id))
              .filter(Boolean);
            setSelectedAgentIds(agentIds);
            setTempAgentIds(agentIds);
          }

          if (d.lead_distribution_type) {
            setDistributionMode(
              d.lead_distribution_type === "equal" ||
                d.lead_distribution_type === "equal_assignment"
                ? "equal"
                : "on_demand",
            );
          }
        }
      }
    } catch (err) {
      console.error("Failed to load edit campaign data:", err);
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleAgentMenuOpen = () => {
    setTempAgentIds([...selectedAgentIds]);
    setAgentMenuOpen(true);
  };

  const handleAgentMenuClose = () => {
    setTempAgentIds([...selectedAgentIds]);
    setAgentMenuOpen(false);
  };

  const handleTempAgentChange = (event) => {
    const {
      target: { value },
    } = event;
    const vals = typeof value === "string" ? value.split(",") : value;
    setTempAgentIds(vals.map((v) => Number(v)));
  };

  const handleSubmitAgentSelection = () => {
    setSelectedAgentIds([...tempAgentIds]);
    setAgentMenuOpen(false);
  };

  const handleCancelAgentSelection = () => {
    setTempAgentIds([...selectedAgentIds]);
    setAgentMenuOpen(false);
  };

  const toggleAgent = (agentId) => {
    setSelectedAgentIds((prev) => {
      const next = prev.some((id) => Number(id) === Number(agentId))
        ? prev.filter((id) => Number(id) !== Number(agentId))
        : [...prev, Number(agentId)];
      setTempAgentIds(next);
      return next;
    });
  };

  const handleAgentSelectChange = (event) => {
    const {
      target: { value },
    } = event;
    const vals = typeof value === "string" ? value.split(",") : value;
    setSelectedAgentIds(vals.map((v) => Number(v)));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter campaign name");
      return;
    }

    const campaignId = campaign?.id ?? campaign?.campaign_id;

    const payload = {
      campaign_id: campaignId ? Number(campaignId) : undefined,
      campaign_name: campaign?.name ?? campaign?.campaign_name ?? undefined,
      name: name.trim(),
      pipeline_id: pipelineCategoryId ? Number(pipelineCategoryId) : null,
      manager_id: selectedManagerId ? Number(selectedManagerId) : null,
      agent_ids: selectedAgentIds,
      distribution_type: distributionMode === "equal" ? "equal" : "on_demand",
    };

    try {
      setLoading(true);
      await updateCampaignDetail(payload);
      toast.success("Campaign updated successfully!");
      onUpdateSuccess?.(payload);
      onClose?.();
    } catch (err) {
      console.error("Error updating campaign:", err);
      const rawMsg = err?.response?.data?.message || err?.response?.data?.detail || err?.message || "Error updating campaign"; toast.error(Array.isArray(rawMsg) ? rawMsg.join(", ") : rawMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          p: 1.5,
          maxWidth: "740px",
        },
      }}
    >
      {/* DIALOG TITLE */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
          pt: 1.5,
          px: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: "20px",
            fontWeight: 700,
            color: BRAND_GREEN,
          }}
        >
          Edit Campaign
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: BRAND_GREEN }}>
          <CloseIcon fontSize="medium" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 2, py: 1 }}>
        {fetchingDetails ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 8,
            }}
          >
            <CircularProgress sx={{ color: BRAND_GREEN }} />
          </Box>
        ) : (
          <>
            {/* ROW 1: NAME AND PIPELINE */}
            <Grid container spacing={2.5} sx={{ mb: 2.5, mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#333",
                    mb: 0.8,
                  }}
                >
                  Name*
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: GREY_BG,
                      borderRadius: "8px",
                      height: "44px",
                      fontSize: "14px",
                      "& fieldset": { border: "none" },
                    },
                    "& input::placeholder": { color: "#A0A0A0", opacity: 1 },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#333",
                    mb: 0.8,
                  }}
                >
                  Pipeline*
                </Typography>
                <Select
                  fullWidth
                  displayEmpty
                  value={pipelineCategoryId}
                  onChange={(e) => setPipelineCategoryId(e.target.value)}
                  renderValue={(selected) => {
                    if (!selected && selected !== 0) {
                      return (
                        <Typography sx={{ color: "#A0A0A0", fontSize: "14px" }}>
                          Select Pipeline
                        </Typography>
                      );
                    }
                    const found = pipelineCategories.find(
                      (c) =>
                        c.id === selected ||
                        Number(c.id) === Number(selected) ||
                        c.value === selected,
                    );
                    return found
                      ? found.name ||
                          found.label ||
                          found.display_name ||
                          found.category_name ||
                          String(selected)
                      : String(selected);
                  }}
                  sx={{
                    backgroundColor: GREY_BG,
                    borderRadius: "8px",
                    height: "44px",
                    fontSize: "14px",
                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  }}
                >
                  {pipelineCategories.map((cat) => {
                    const cId = cat.id ?? cat.value;
                    const cName =
                      cat.name ||
                      cat.label ||
                      cat.display_name ||
                      cat.category_name ||
                      String(cId);
                    return (
                      <MenuItem key={cId} value={cId}>
                        {cName}
                      </MenuItem>
                    );
                  })}
                </Select>
              </Grid>
            </Grid>

            {/* ROW 2: WHO WILL BE MANAGING THIS CAMPAIGN */}
            <Box sx={{ mb: 2.5 }}>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#333",
                  mb: 0.8,
                }}
              >
                Who will be managing this campaign?
              </Typography>
              <Box
                sx={{
                  backgroundColor: GREY_BG,
                  borderRadius: "10px",
                  p: 1.5,
                  minHeight: "56px",
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Select
                  fullWidth
                  displayEmpty
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  MenuProps={managerMenuProps}
                  renderValue={(selected) => {
                    if (!selected && selected !== 0) {
                      return (
                        <Typography sx={{ color: "#A0A0A0", fontSize: "14px" }}>
                          Select Manager
                        </Typography>
                      );
                    }
                    const m = managersList.find(
                      (mgr) =>
                        mgr.id === selected ||
                        Number(mgr.id) === Number(selected) ||
                        mgr.value === selected,
                    );
                    return m ? (
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 1,
                          backgroundColor: LIGHT_CHIP_BG,
                          color: "#2C3E11",
                          px: 1.8,
                          py: 0.6,
                          borderRadius: "20px",
                          fontSize: "13.5px",
                          fontWeight: 500,
                        }}
                      >
                        <span>
                          {m.name || m.username || m.label || String(selected)}
                        </span>
                        <CancelOutlinedIcon
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedManagerId("");
                          }}
                          sx={{ fontSize: "16px", color: "#7A7A7A" }}
                        />
                      </Box>
                    ) : (
                      String(selected)
                    );
                  }}
                  sx={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    height: "40px",
                    fontSize: "14px",
                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  }}
                >
                  {managersList.map((mgr) => {
                    const mId = mgr.id ?? mgr.value;
                    const mName =
                      mgr.name || mgr.username || mgr.label || String(mId);
                    const mEmail = mgr.email ? ` (${mgr.email})` : "";
                    return (
                      <MenuItem key={mId} value={mId}>
                        {mName}
                        {mEmail}
                      </MenuItem>
                    );
                  })}
                </Select>
              </Box>
            </Box>

            {/* ROW 3: SELECT AGENTS (DROPDOWN + CHIPS) */}
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#333",
                  mb: 0.8,
                }}
              >
                Select Agents
              </Typography>

              {/* MULTI SELECT DROPDOWN */}
              <Select
                multiple
                fullWidth
                displayEmpty
                open={agentMenuOpen}
                onOpen={handleAgentMenuOpen}
                onClose={handleAgentMenuClose}
                value={tempAgentIds}
                onChange={handleTempAgentChange}
                renderValue={() => (
                  <Typography sx={{ color: "#777", fontSize: "14px" }}>
                    {selectedAgentIds.length === 0
                      ? "Select Agents..."
                      : `${selectedAgentIds.length} Agents Selected`}
                  </Typography>
                )}
                MenuProps={{
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left",
                  },
                  transformOrigin: {
                    vertical: "top",
                    horizontal: "left",
                  },
                  slots: {
                    paper: AgentSelectPaper,
                  },
                  slotProps: {
                    paper: {
                      className: "modal-select-paper has-footer",
                      onCancel: handleCancelAgentSelection,
                      onSubmit: handleSubmitAgentSelection,
                    },
                  },
                }}
                sx={{
                  backgroundColor: GREY_BG,
                  borderRadius: "8px",
                  height: "42px",
                  fontSize: "14px",
                  mb: 1.5,
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                }}
              >
                {agentsList.map((agent) => {
                  const aId = agent.id ?? agent.value;
                  const aName =
                    agent.name || agent.username || agent.label || String(aId);
                  const isChecked = tempAgentIds.some(
                    (id) => Number(id) === Number(aId),
                  );
                  return (
                    <MenuItem key={aId} value={aId}>
                      <Checkbox
                        checked={isChecked}
                        size="small"
                        sx={{
                          color: "#999",
                          "&.Mui-checked": { color: BRAND_GREEN },
                        }}
                      />
                      <ListItemText
                        primary={aName}
                        secondary={agent.email || ""}
                      />
                    </MenuItem>
                  );
                })}
              </Select>

              {/* SELECTED AGENTS CHIPS DISPLAY */}
              <Box
                sx={{
                  backgroundColor: GREY_BG,
                  borderRadius: "10px",
                  p: 1.8,
                  minHeight: "60px",
                  display: "flex",
                  alignContent: "flex-start",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1.2,
                }}
              >
                {selectedAgentIds.length === 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      py: 1,
                    }}
                  >
                    <Typography sx={{ color: "#9CA3AF", fontSize: "13px" }}>
                      Select agents from the dropdown above to assign to this campaign
                    </Typography>
                  </Box>
                ) : (
                  agentsList
                    .filter((agent) => {
                      const aId = agent.id ?? agent.value;
                      return selectedAgentIds.some(
                        (id) => Number(id) === Number(aId),
                      );
                    })
                    .map((agent) => {
                      const aId = agent.id ?? agent.value;
                      const aName =
                        agent.name ||
                        agent.username ||
                        agent.label ||
                        String(aId);
                      return (
                        <Box
                          key={aId}
                          onClick={() => toggleAgent(aId)}
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 1,
                            backgroundColor: LIGHT_CHIP_BG,
                            color: "#2C3E11",
                            px: 1.8,
                            py: 0.6,
                            borderRadius: "20px",
                            fontSize: "13.5px",
                            fontWeight: 500,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              opacity: 0.85,
                            },
                          }}
                        >
                          <span>{aName}</span>
                          <CancelOutlinedIcon
                            sx={{
                              fontSize: "16px",
                              color: "#7A7A7A",
                            }}
                          />
                        </Box>
                      );
                    })
                )}
              </Box>
            </Box>

            {/* ROW 4: LEAD DISTRIBUTION */}
            <Box sx={{ mb: 2 }}>
              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#333",
                  mb: 1.5,
                }}
              >
                Lead Distribution
              </Typography>

              {/* OPTION 1: ON DEMAND */}
              <Box
                onClick={() => setDistributionMode("on_demand")}
                sx={{
                  border: "1px solid #E0E0E0",
                  borderRadius: "10px",
                  p: 1.8,
                  mb: 1.5,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.2,
                  backgroundColor: "#fff",
                  transition: "border-color 0.2s ease",
                  "&:hover": { borderColor: BRAND_GREEN },
                }}
              >
                <Radio
                  checked={
                    distributionMode === "on_demand" ||
                    distributionMode === "On Demand"
                  }
                  onChange={() => setDistributionMode("on_demand")}
                  value="on_demand"
                  size="small"
                  sx={{
                    p: 0,
                    mt: 0.3,
                    color: "#999",
                    "&.Mui-checked": { color: BRAND_GREEN },
                  }}
                />
                <Box>
                  <Typography
                    sx={{ fontSize: "14px", fontWeight: 700, color: "#222" }}
                  >
                    On Demand
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12.5px",
                      color: "#777",
                      mt: 0.3,
                      lineHeight: 1.4,
                    }}
                  >
                    Leads stay unassigned until a user assign it to them self or
                    clicks start calling, then the system align ten lead at a
                    time.
                  </Typography>
                </Box>
              </Box>

              {/* OPTION 2: EQUAL */}
              <Box
                onClick={() => setDistributionMode("equal")}
                sx={{
                  border: "1px solid #E0E0E0",
                  borderRadius: "10px",
                  p: 1.8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.2,
                  backgroundColor: "#fff",
                  transition: "border-color 0.2s ease",
                  "&:hover": { borderColor: BRAND_GREEN },
                }}
              >
                <Radio
                  checked={
                    distributionMode === "equal" ||
                    distributionMode === "Equal"
                  }
                  onChange={() => setDistributionMode("equal")}
                  value="equal"
                  size="small"
                  sx={{
                    p: 0,
                    mt: 0.3,
                    color: "#999",
                    "&.Mui-checked": { color: BRAND_GREEN },
                  }}
                />
                <Box>
                  <Typography
                    sx={{ fontSize: "14px", fontWeight: 700, color: "#222" }}
                  >
                    Equal
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12.5px",
                      color: "#777",
                      mt: 0.3,
                      lineHeight: 1.4,
                    }}
                  >
                    Distributes leads equally among all agents in the campaign,
                    ensuring fair allocation.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>

      {/* DIALOG ACTIONS FOOTER */}
      <DialogActions sx={{ px: 2, pb: 1.5, pt: 1, gap: 1.5 }}>
        <Button
          onClick={onClose}
          disabled={loading || fetchingDetails}
          sx={{
            height: "36px",
            px: 3,
            borderRadius: "6px",
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 600,
            border: `1px solid ${BRAND_GREEN}`,
            color: BRAND_GREEN,
            backgroundColor: "#fff",
            "&:hover": {
              backgroundColor: "#F8FDF0",
              borderColor: BRAND_GREEN,
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading || fetchingDetails}
          sx={{
            height: "36px",
            px: 3.5,
            borderRadius: "6px",
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 600,
            backgroundColor: BRAND_GREEN,
            color: "#fff",
            boxShadow: "0px 4px 10px rgba(144, 217, 22, 0.3)",
            "&:hover": {
              backgroundColor: "#82C713",
            },
          }}
        >
          {loading ? "Saving..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditCampaignModal;
