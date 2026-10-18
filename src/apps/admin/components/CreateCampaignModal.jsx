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
  const [pipelineCategoryId, setPipelineCategoryId] = useState(
    initialPipelineCategoryId || ""
  );
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [selectedAgentIds, setSelectedAgentIds] = useState([]);
  const [distributionMode, setDistributionMode] = useState("on_demand"); // 'on_demand' or 'equal'

  // Dynamic Options state from Backend APIs
  const [pipelineCategories, setPipelineCategories] = useState([]);
  const [managersList, setManagersList] = useState([]);
  const [agentsList, setAgentsList] = useState([]);
  const [loading, setLoading] = useState(false);

  const hasFetchedRef = React.useRef(false);

  useEffect(() => {
    if (open) {
      if (initialPipelineCategoryId) {
        setPipelineCategoryId(initialPipelineCategoryId);
      }
      if (!hasFetchedRef.current) {
        hasFetchedRef.current = true;
        loadDropdownData();
      }
    } else {
      hasFetchedRef.current = false;
    }
  }, [open, initialPipelineCategoryId]);

  const loadDropdownData = async () => {
    try {
      setLoading(true);
      const [categories, managers, agents] = await Promise.all([
        getPipelineCategories(),
        getCampaignManagers(),
        getCampaignAgents(),
      ]);

      const catList = Array.isArray(categories) ? categories : [];
      const mgrList = Array.isArray(managers) ? managers : [];
      const agtList = Array.isArray(agents) ? agents : [];

      setPipelineCategories(catList);
      setManagersList(mgrList);
      setAgentsList(agtList);

      // Defaults
      if (initialPipelineCategoryId) {
        setPipelineCategoryId(initialPipelineCategoryId);
      } else if (catList.length > 0 && !pipelineCategoryId) {
        setPipelineCategoryId(catList[0].id);
      }
      if (mgrList.length > 0 && !selectedManagerId) {
        setSelectedManagerId(mgrList[0].id);
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
    setSelectedAgentIds(typeof value === "string" ? value.split(",") : value);
  };

  const handleCreate = async () => {
    if (typeof hasPermission === "function" && !hasPermission("api_create_campaign_admin")) {
      alert("Permission denied: api_create_campaign_admin");
      return;
    }

    if (!name.trim()) {
      alert("Please enter campaign name");
      return;
    }

    const payload = {
      name,
      pipeline_category_id: pipelineCategoryId ? Number(pipelineCategoryId) : null,
      manager_id: selectedManagerId ? Number(selectedManagerId) : null,
      agent_ids: selectedAgentIds,
      distribution_type: distributionMode === "Equal" || distributionMode === "equal" ? "equal" : "on_demand",
    };

    try {
      setLoading(true);
      await createCampaign(payload);
      onCreateSuccess?.(payload);
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
                if (!selected) {
                  return (
                    <Typography sx={{ color: "#A0A0A0", fontSize: "14px" }}>
                      Select Manager
                    </Typography>
                  );
                }
                const m = managersList.find((mgr) => mgr.id === selected);
                return m ? m.name || m.username : selected;
              }}
              sx={{
                backgroundColor: "#fff",
                borderRadius: "8px",
                height: "40px",
                fontSize: "14px",
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
              }}
            >
              {managersList.map((mgr) => (
                <MenuItem key={mgr.id} value={mgr.id}>
                  {mgr.name || mgr.username} ({mgr.email})
                </MenuItem>
              ))}
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
              const isChecked = selectedAgentIds.includes(agent.id);
              return (
                <MenuItem key={agent.id} value={agent.id}>
                  <Checkbox
                    checked={isChecked}
                    size="small"
                    sx={{
                      color: "#999",
                      "&.Mui-checked": { color: BRAND_GREEN },
                    }}
                  />
                  <ListItemText
                    primary={agent.name || agent.username}
                    secondary={agent.email}
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
                .filter((agent) =>
                  selectedAgentIds.some(
                    (id) => Number(id) === Number(agent.id),
                  ),
                )
                .map((agent) => (
                  <Box
                    key={agent.id}
                    onClick={() => toggleAgent(agent.id)}
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
                    <span>{agent.name || agent.username}</span>
                    <CancelOutlinedIcon
                      sx={{
                        fontSize: "16px",
                        color: "#7A7A7A",
                      }}
                    />
                  </Box>
                ))
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
