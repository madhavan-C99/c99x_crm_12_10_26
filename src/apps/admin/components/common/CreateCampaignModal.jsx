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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import {
  getPipelineCategories,
  getCampaignManagers,
  getCampaignAgents,
  createCampaign,
} from "@/apps/admin/services/campaignManagementService";

import { useAuth } from "@/shared/context/AuthContext";

const BRAND_GREEN = "#90D916";
const LIGHT_CHIP_BG = "#E5F4CD";
const GREY_BG = "#F5F5F5";

export const CreateCampaignModal = ({
  open,
  onClose,
  onCreateSuccess,
  initialPipelineCategoryId = null,
}) => {
  const { hasPermission } = useAuth();
  const [name, setName] = useState("");
  const [pipelineCategoryId, setPipelineCategoryId] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [selectedAgentIds, setSelectedAgentIds] = useState([]);
  const [distributionMode, setDistributionMode] = useState("on_demand"); // 'on_demand' or 'equal'

  // Dynamic Options state from Backend APIs
  const [pipelineCategories, setPipelineCategories] = useState([]);
  const [managersList, setManagersList] = useState([]);
  const [agentsList, setAgentsList] = useState([]);
  const [loading, setLoading] = useState(false);

  const extractList = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  useEffect(() => {
    if (open) {
      if (initialPipelineCategoryId) {
        setPipelineCategoryId(Number(initialPipelineCategoryId));
      }
      setSelectedAgentIds([]);
      loadDropdownData();
    } else {
      setName("");
      setSelectedAgentIds([]);
    }
  }, [open, initialPipelineCategoryId]);

  const loadDropdownData = async () => {
    try {
      setLoading(true);
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

      // Defaults
      if (initialPipelineCategoryId) {
        setPipelineCategoryId(Number(initialPipelineCategoryId));
      } else if (categories.length > 0 && !pipelineCategoryId) {
        setPipelineCategoryId(categories[0].id ?? categories[0].value);
      }
      if (managers.length > 0 && !selectedManagerId) {
        setSelectedManagerId(managers[0].id ?? managers[0].value);
      }
    } catch (err) {
      console.error("Error loading dropdown data for create campaign modal:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = (agentId) => {
    setSelectedAgentIds((prev) =>
      prev.some((id) => Number(id) === Number(agentId))
        ? prev.filter((id) => Number(id) !== Number(agentId))
        : [...prev, Number(agentId)]
    );
  };

  const handleAgentSelectChange = (event) => {
    const {
      target: { value },
    } = event;
    const vals = typeof value === "string" ? value.split(",") : value;
    setSelectedAgentIds(vals.map((v) => Number(v)));
  };

  const handleCreate = async () => {
    if (!hasPermission("api_create_campaign_admin")) {
      alert("Permission denied: api_create_campaign_admin");
      return;
    }

    if (!name.trim()) {
      alert("Please enter campaign name");
      return;
    }

    const pId = pipelineCategoryId ? Number(pipelineCategoryId) : null;
    const payload = {
      name,
      pipeline_id: pId,
      pipeline_category_id: pId,
      manager_id: selectedManagerId ? Number(selectedManagerId) : null,
      agent_ids: selectedAgentIds,
      distribution_type: distributionMode === "Equal" || distributionMode === "equal" ? "equal" : "on_demand",
    };

    try {
      setLoading(true);
      const res = await createCampaign(payload);
      const resData = res?.data?.data || res?.data || {};
      onCreateSuccess?.({
        ...payload,
        ...resData,
        id: resData?.id ?? resData?.campaign_id ?? payload?.id,
      });
      onClose?.();
      // Reset form
      setName("");
    } catch (err) {
      console.error("Error creating campaign:", err);
      alert(err?.response?.data?.message || err?.message || "Error creating campaign");
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
          Create Campaign
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: BRAND_GREEN }}>
          <CloseIcon fontSize="medium" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 2, py: 1 }}>
        {/* ROW 1: NAME AND PIPELINE */}
        <Grid container spacing={2.5} sx={{ mb: 2.5, mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <Typography
              sx={{ fontSize: "14px", fontWeight: 600, color: "#333", mb: 0.8 }}
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
              sx={{ fontSize: "14px", fontWeight: 600, color: "#333", mb: 0.8 }}
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
                  cat.name || cat.label || cat.display_name || cat.category_name || String(cId);
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
            sx={{ fontSize: "14px", fontWeight: 600, color: "#333", mb: 0.8 }}
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
                return m
                  ? m.name || m.username || m.label || String(selected)
                  : String(selected);
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
                const mName = mgr.name || mgr.username || mgr.label || String(mId);
                const mEmail = mgr.email ? ` (${mgr.email})` : "";
                return (
                  <MenuItem key={mId} value={mId}>
                    {mName}{mEmail}
                  </MenuItem>
                );
              })}
            </Select>
          </Box>
        </Box>

        {/* ROW 3: SELECT AGENTS (DROPDOWN + CHIPS) */}
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{ fontSize: "14px", fontWeight: 600, color: "#333", mb: 0.8 }}
          >
            Select Agents
          </Typography>

          {/* MULTI SELECT DROPDOWN */}
          <Select
            multiple
            fullWidth
            displayEmpty
            value={selectedAgentIds}
            onChange={handleAgentSelectChange}
            renderValue={() => (
              <Typography sx={{ color: "#777", fontSize: "14px" }}>
                {selectedAgentIds.length === 0
                  ? "Select Agents..."
                  : `${selectedAgentIds.length} Agents Selected`}
              </Typography>
            )}
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
              const aName = agent.name || agent.username || agent.label || String(aId);
              const isChecked =
                selectedAgentIds.includes(aId) ||
                selectedAgentIds.includes(Number(aId));
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
                    agent.name || agent.username || agent.label || String(aId);
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
            sx={{ fontSize: "15px", fontWeight: 700, color: "#333", mb: 1.5 }}
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
              checked={distributionMode === "on_demand" || distributionMode === "On Demand"}
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
                Leads stay unassigned until a user assign it to them self or clicks
                start calling, then the system align ten lead at a time.
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
              checked={distributionMode === "equal" || distributionMode === "Equal"}
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
      </DialogContent>

      {/* DIALOG ACTIONS FOOTER */}
      <DialogActions sx={{ px: 2, pb: 1.5, pt: 1, gap: 1.5 }}>
        <Button
          onClick={onClose}
          disabled={loading}
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
          onClick={handleCreate}
          disabled={loading}
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
          {loading ? "Creating..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateCampaignModal;
