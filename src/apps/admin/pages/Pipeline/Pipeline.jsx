import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";

import PipelineHeader from "./components/PipelineHeader";
import PipelineStatsCards from "./components/PipelineStatsCards";
import CampaignCards from "./components/CampaignCards";
import CreateCampaignModal from "./components/modals/CreateCampaignModal";
import UploadExcelModal from "./components/modals/UploadExcelModal";
import AddLeadModal from "./components/modals/AddLeadModal";
import DeleteCampaignModal from "./components/modals/DeleteCampaignModal";
import { getSelectOptions } from "@/apps/admin/services/dropdownService";

const Pipeline = () => {
  const [searchValue, setSearchValue] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [uploadExcelModalOpen, setUploadExcelModalOpen] = useState(false);
  const [addLeadModalOpen, setAddLeadModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCampaignForDelete, setSelectedCampaignForDelete] =
    useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Dynamic Pipeline Categories & Selected Pipeline
  const [pipelinesList, setPipelinesList] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);

  const navigate = useNavigate();

  // Load pipeline categories on mount
  useEffect(() => {
    getSelectOptions("L_CATEGORIES")
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setPipelinesList(cats);
          const initialId = cats[0].id ?? cats[0].value ?? null;
          setSelectedPipeline(initialId);
        } else {
          setSelectedPipeline(null);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch L_CATEGORIES for pipeline:", err);
        setSelectedPipeline(null);
      });
  }, []);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleCreateCampaign = () => {
    setCreateModalOpen(true);
  };

  const currentPipelineObj = (
    Array.isArray(pipelinesList) ? pipelinesList : []
  ).find(
    (p) => (p.id ?? p.value) === selectedPipeline || p === selectedPipeline,
  );
  const selectedPipelineName =
    currentPipelineObj?.name ||
    currentPipelineObj?.label ||
    currentPipelineObj?.category_name ||
    "";

  const handleLeadSummary = () => {
    const query = selectedPipeline
      ? `?pipeline_id=${selectedPipeline}&pipeline_name=${encodeURIComponent(selectedPipelineName)}`
      : "";
    navigate(`/admin/lead-summary-report${query}`);
  };

  const handleCallLogs = () => {
    const query = selectedPipeline
      ? `?pipeline_id=${selectedPipeline}&pipeline_name=${encodeURIComponent(selectedPipelineName)}`
      : "";
    navigate(`/admin/call-log-report${query}`);
  };

  const handleAction = (label) => {
    if (label === "Disposition") {
      const query = selectedPipeline
        ? `?pipeline_id=${selectedPipeline}&pipeline_name=${encodeURIComponent(selectedPipelineName)}`
        : "";
      navigate(`/admin/disposition-log-report${query}`);
    } else if (label === "Upload Excel Sheet") {
      setUploadExcelModalOpen(true);
    } else if (label === "Add Lead") {
      setAddLeadModalOpen(true);
    } else if (label === "Manage Pipeline") {
      navigate("/admin/Settings");
    } else {
      console.log("Action selected:", label);
    }
  };

  const handleToggleFavorite = (id) => {
    console.log("Toggle favorite for campaign:", id);
  };

  const handleMenuAction = (id, label, campaign) => {
    if (label === "Delete") {
      setSelectedCampaignForDelete(campaign || { id, name: `Campaign ${id}` });
      setDeleteModalOpen(true);
    } else {
      console.log("Menu action:", label, "on campaign:", id);
    }
  };

  const handleViewDetails = (campaignId, campaignName, pId) => {
    const activePipelineId = pId || selectedPipeline;
    const query = new URLSearchParams();
    if (campaignName) query.set("campaign_name", campaignName);
    if (activePipelineId) query.set("pipeline_id", activePipelineId);
    navigate(`/admin/enquiry-sheet/${campaignId}?${query.toString()}`);
  };

  return (
    <Box
      sx={{
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <PipelineHeader
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        pipelinesList={pipelinesList}
        selectedPipeline={selectedPipeline}
        onPipelineChange={setSelectedPipeline}
        onCreateCampaign={handleCreateCampaign}
        onLeadSummary={handleLeadSummary}
        onCallLogs={handleCallLogs}
        onAction={handleAction}
      />

      {/* STAT CARDS */}
      <PipelineStatsCards
        refreshKey={refreshKey}
        pipelineId={selectedPipeline}
      />

      {/* CAMPAIGN CARDS GRID */}
      <CampaignCards
        refreshKey={refreshKey}
        pipelineId={selectedPipeline}
        searchValue={searchValue}
        onToggleFavorite={handleToggleFavorite}
        onMenuAction={handleMenuAction}
        onViewDetails={handleViewDetails}
      />

      {/* CREATE CAMPAIGN MODAL */}
      <CreateCampaignModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        initialPipelineCategoryId={selectedPipeline}
        onCreateSuccess={(data) => {
          console.log("Campaign created successfully:", data);
          triggerRefresh();
        }}
      />

      {/* UPLOAD EXCEL SHEET MODAL */}
      <UploadExcelModal
        open={uploadExcelModalOpen}
        onClose={() => setUploadExcelModalOpen(false)}
        selectedPipelineId={selectedPipeline}
        onUploadSuccess={(file) => {
          console.log("Excel File uploaded:", file);
          triggerRefresh();
        }}
      />

      {/* ADD LEAD MODAL */}
      <AddLeadModal
        open={addLeadModalOpen}
        onClose={() => setAddLeadModalOpen(false)}
        initialPipelineCategoryId={selectedPipeline}
        onSaveSuccess={(data) => {
          console.log("Lead created successfully:", data);
          triggerRefresh();
        }}
      />

      {/* DELETE CAMPAIGN MODAL */}
      <DeleteCampaignModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedCampaignForDelete(null);
        }}
        campaign={selectedCampaignForDelete}
        onDeleteSuccess={(deletedId) => {
          console.log("Campaign deleted:", deletedId);
          triggerRefresh();
        }}
      />
    </Box>
  );
};

export default Pipeline;
