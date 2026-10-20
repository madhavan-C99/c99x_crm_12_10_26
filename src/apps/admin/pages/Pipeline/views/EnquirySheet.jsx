import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Box, Skeleton } from "@mui/material";
import SheetHeader from "../components/SheetHeader";
import SheetCard from "../components/SheetCard";
import LeadDistributionTable from "../components/LeadDistributionTable";
import { getCampaignEnquirySheet } from "@/apps/admin/services/enquirySheetService";
import UploadLeadsModal from "@/apps/admin/pages/Leads/components/UploadLeadsModal";
import AddLeadModal from "../components/modals/AddLeadModal";
import PauseCampaignModal from "../components/modals/PauseCampaignModal";


function EnquirySheet() {
  const { campaignId } = useParams();
  const [searchParams] = useSearchParams();
  const campaignNameParam = searchParams.get("campaign_name");
  const pipelineIdParam = searchParams.get("pipeline_id");
  const savedPipelineId = sessionStorage.getItem("admin_pipeline_selected");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [stats, setStats] = useState([]);
  const [rows, setRows] = useState([]);
  const [rawCampaignName, setRawCampaignName] = useState("");
  const [resolvedCampaignId, setResolvedCampaignId] = useState(
    campaignId || null,
  );
  const [resolvedPipelineId, setResolvedPipelineId] = useState(
    pipelineIdParam || savedPipelineId || null,
  );
  const [isCampaignActive, setIsCampaignActive] = useState(true);
  const [uploadExcelOpen, setUploadExcelOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [pauseCampaignOpen, setPauseCampaignOpen] = useState(false);

  const loadEnquiryData = async () => {
    try {
      setLoading(true);
      const effectivePipelineId =
        resolvedPipelineId || pipelineIdParam || savedPipelineId;
      const payload = {
        campaign_id: campaignId ? Number(campaignId) : undefined,
        pipeline_id: effectivePipelineId
          ? Number(effectivePipelineId)
          : undefined,
      };
      if (!payload.campaign_id && campaignNameParam) {
        payload.campaign_name = campaignNameParam;
      }
      const res = await getCampaignEnquirySheet(payload);
      if (res.data && res.data.data) {
        const d = res.data.data;
        const cName = d.campaign_name || campaignNameParam || "";
        setRawCampaignName(cName);
        const cleanName = cName.replace(/enquiry sheet$/i, "").trim();
        const displayTitle = cleanName
          ? `${cleanName} Enquiry Sheet`
          : cName;
        setTitle(displayTitle);
        if (d.campaign_id) setResolvedCampaignId(d.campaign_id);
        const returnedPipelineId =
          d.pipeline_id || d.category_id || d.pipeline_category_id;
        if (returnedPipelineId) {
          setResolvedPipelineId(returnedPipelineId);
          sessionStorage.setItem(
            "admin_pipeline_selected",
            String(returnedPipelineId),
          );
        }
        if (d.is_active !== undefined)
          setIsCampaignActive(Boolean(d.is_active));

        if (d.stats && Array.isArray(d.stats)) {
          const updatedStats = d.stats.map((s) => ({
            label: s.label,
            value: s.value ?? 0,
            color: s.color || "#ffffff",
          }));
          setStats(updatedStats);
        } else {
          setStats([]);
        }

        setRows(
          d.telecallers ||
            d.distribution_rows ||
            d.lead_distribution ||
            d.distribution ||
            d.agents ||
            [],
        );
      }
    } catch (err) {
      console.error("Failed to load enquiry sheet data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiryData();
  }, [campaignId, campaignNameParam, pipelineIdParam]);

  const handleBack = () => navigate(-1);

  const handleLeadSummary = () => {
    const query = new URLSearchParams();
    const effectiveCampaignId = resolvedCampaignId || campaignId;
    if (effectiveCampaignId) query.set("campaign_id", effectiveCampaignId);
    const activePipelineId =
      resolvedPipelineId ||
      pipelineIdParam ||
      sessionStorage.getItem("admin_pipeline_selected");
    if (activePipelineId) query.set("pipeline_id", activePipelineId);
    const activeCampName = rawCampaignName || campaignNameParam;
    if (activeCampName) query.set("campaign_name", activeCampName);

    navigate(`/admin/lead-summary-report?${query.toString()}`);
  };

  const handleCallLogs = () => {
    const query = new URLSearchParams();
    const effectiveCampaignId = resolvedCampaignId || campaignId;
    if (effectiveCampaignId) query.set("campaign_id", effectiveCampaignId);
    const activePipelineId =
      resolvedPipelineId ||
      pipelineIdParam ||
      sessionStorage.getItem("admin_pipeline_selected");
    if (activePipelineId) query.set("pipeline_id", activePipelineId);
    const activeCampName = rawCampaignName || campaignNameParam;
    if (activeCampName) query.set("campaign_name", activeCampName);

    navigate(`/admin/call-log-report?${query.toString()}`);
  };

  const handleAction = (label) => {
    const effectiveCampaignId = resolvedCampaignId || campaignId;
    const activePipelineId =
      resolvedPipelineId ||
      pipelineIdParam ||
      sessionStorage.getItem("admin_pipeline_selected");
    const activeCampName = rawCampaignName || campaignNameParam;

    if (label === "Disposition") {
      const query = new URLSearchParams();
      if (effectiveCampaignId) query.set("campaign_id", effectiveCampaignId);
      if (activePipelineId) query.set("pipeline_id", activePipelineId);
      if (activeCampName) query.set("campaign_name", activeCampName);

      navigate(`/admin/disposition-log-report?${query.toString()}`);
    } else if (label === "Upload Excel Sheet") {
      setUploadExcelOpen(true);
    } else if (label === "Add Lead") {
      setAddLeadOpen(true);
    } else if (label === "Pause Campaign" || label === "Resume Campaign") {
      setPauseCampaignOpen(true);
    } else if (label === "Campaign Setting") {
      const query = new URLSearchParams();
      if (activeCampName) query.set("campaign_name", activeCampName);
      if (effectiveCampaignId) query.set("campaign_id", effectiveCampaignId);
      if (activePipelineId) query.set("pipeline_id", activePipelineId);
      navigate(`/admin/edit-campaign?${query.toString()}`);
    }

  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <SheetHeader
        title={title}
        isCampaignActive={isCampaignActive}
        onBack={handleBack}
        onLeadSummary={handleLeadSummary}
        onCallLogs={handleCallLogs}
        onAction={handleAction}
      />

      {loading ? (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(6, 1fr)",
              },
              gap: 1.5,
              mb: 2.5,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={72} />
            ))}
          </Box>
          <Skeleton variant="rounded" height={360} />
        </>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: `repeat(${Math.max(stats.length, 1)}, 1fr)`,
              },
              gap: 1.5,
              mb: 2.5,
            }}
          >
            {stats.map((s) => (
              <SheetCard key={s.label} {...s} />
            ))}
          </Box>

          <LeadDistributionTable
            rows={rows}
            stages={stats.filter((s) => !/total/i.test(s.label))}
            onRefresh={loadEnquiryData}
          />
        </>
      )}

      {/* UPLOAD EXCEL SHEET MODAL */}
      <UploadLeadsModal
        open={uploadExcelOpen}
        onClose={() => setUploadExcelOpen(false)}
        pipelineId={resolvedPipelineId || pipelineIdParam}
        campaignId={
          resolvedCampaignId || (campaignId ? Number(campaignId) : null)
        }
        campaignName={rawCampaignName || campaignNameParam}
        lockCampaign={true}
        onUpload={() => {
          loadEnquiryData();
        }}
      />

      {/* ADD NEW LEAD MODAL */}
      <AddLeadModal
        open={addLeadOpen}
        initialCampaignId={campaignId ? Number(campaignId) : null}
        initialCampaignName={rawCampaignName || campaignNameParam}
        lockCampaign={true}
        onClose={() => setAddLeadOpen(false)}
        onSaveSuccess={(data) => {
          console.log("New Lead Added on EnquirySheet:", data);
          loadEnquiryData();
        }}
      />

      {/* PAUSE / RESUME CAMPAIGN CONFIRMATION MODAL */}
      <PauseCampaignModal
        open={pauseCampaignOpen}
        campaignId={
          resolvedCampaignId || (campaignId ? Number(campaignId) : null)
        }
        isCurrentlyActive={isCampaignActive}
        onClose={() => setPauseCampaignOpen(false)}
        onConfirmPause={(newStatus) => {
          console.log(
            "Campaign Paused/Resumed from EnquirySheet, newStatus:",
            newStatus,
          );
          loadEnquiryData();
        }}
      />
    </Box>
  );
}

export default EnquirySheet;
