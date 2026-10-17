import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Box, Skeleton } from "@mui/material";
import SheetHeader from "../components/SheetHeader";
import SheetCard from "../components/SheetCard";
import LeadDistributionTable from "../components/LeadDistributionTable";
import { getCampaignEnquirySheet } from "@/apps/admin/services/enquirySheetService";
import UploadExcelModal from "../components/modals/UploadExcelModal";
import AddLeadModal from "../components/modals/AddLeadModal";
import PauseCampaignModal from "../components/modals/PauseCampaignModal";

const GRADIENT_MAP = {
  "Total Leads": "linear-gradient(230.65deg, #EEF1F4 -42.71%, #E1F0FF 90.89%)",
  "New Lead": "linear-gradient(230.65deg, #EEF1F4 -42.71%, #C8E3FF 90.89%)",
  "1st Time Not picked":
    "linear-gradient(230.65deg, #FFEBD0 -42.71%, #FFD6A0 90.89%)",
  "Follow Up": "linear-gradient(230.65deg, #EEF1F4 -42.71%, #FCAFEF 90.89%)",
  "Missed Follow Up":
    "linear-gradient(230.65deg, #EEF1F4 -42.71%, #FFFB89 90.89%)",
  "Not Connected":
    "linear-gradient(230.65deg, #EEF1F4 -42.71%, #FFBFA7 90.89%)",
  Won: "linear-gradient(230.65deg, #EEF1F4 -42.71%, #C3FF5E 90.89%)",
  Lost: "linear-gradient(230.65deg, #EEF1F4 -42.71%, #FF8D8D 90.89%)",
};

const defaultStats = [
  {
    label: "Total Leads",
    value: 0,
    bg: GRADIENT_MAP["Total Leads"],
    color: "#194066",
  },
  {
    label: "New Lead",
    value: 0,
    bg: GRADIENT_MAP["New Lead"],
    color: "#194066",
  },
  {
    label: "1st Time Not picked",
    value: 0,
    bg: GRADIENT_MAP["1st Time Not picked"],
    color: "#194066",
  },
  {
    label: "Follow Up",
    value: 0,
    bg: GRADIENT_MAP["Follow Up"],
    color: "#194066",
  },
  {
    label: "Missed Follow Up",
    value: 0,
    bg: GRADIENT_MAP["Missed Follow Up"],
    color: "#194066",
  },
  {
    label: "Not Connected",
    value: 0,
    bg: GRADIENT_MAP["Not Connected"],
    color: "#194066",
  },
  { label: "Won", value: 0, bg: GRADIENT_MAP["Won"], color: "#194066" },
  { label: "Lost", value: 0, bg: GRADIENT_MAP["Lost"], color: "#194066" },
];

function EnquirySheet() {
  const { campaignId } = useParams();
  const [searchParams] = useSearchParams();
  const campaignNameParam = searchParams.get("campaign_name");
  const pipelineIdParam = searchParams.get("pipeline_id");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [stats, setStats] = useState(defaultStats);
  const [rows, setRows] = useState([]);
  const [rawCampaignName, setRawCampaignName] = useState("");
  const [resolvedCampaignId, setResolvedCampaignId] = useState(
    campaignId || null,
  );
  const [isCampaignActive, setIsCampaignActive] = useState(true);
  const [uploadExcelOpen, setUploadExcelOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [pauseCampaignOpen, setPauseCampaignOpen] = useState(false);

  const loadEnquiryData = async () => {
    try {
      setLoading(true);
      const res = await getCampaignEnquirySheet({
        campaign_id: campaignId ? Number(campaignId) : undefined,
        campaign_name: campaignNameParam || undefined,
        pipeline_id: pipelineIdParam ? Number(pipelineIdParam) : undefined,
      });
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
        if (d.is_active !== undefined)
          setIsCampaignActive(Boolean(d.is_active));

        if (d.stats && Array.isArray(d.stats)) {
          const updatedStats = d.stats.map((s) => ({
            ...s,
            bg:
              GRADIENT_MAP[s.label] ||
              "linear-gradient(230.65deg, #EEF1F4 -42.71%, #E1F0FF 90.89%)",
            color: "#194066",
          }));
          setStats(updatedStats);
        } else {
          setStats(defaultStats);
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
    if (campaignId) query.set("campaign_id", campaignId);
    const activeCampName = rawCampaignName || campaignNameParam;
    if (activeCampName) query.set("campaign_name", activeCampName);

    navigate(`/admin/lead-summary-report?${query.toString()}`);
  };

  const handleCallLogs = () => {
    const query = new URLSearchParams();
    if (campaignId) query.set("campaign_id", campaignId);
    const activeCampName = rawCampaignName || campaignNameParam;
    if (activeCampName) query.set("campaign_name", activeCampName);

    navigate(`/admin/call-log-report?${query.toString()}`);
  };

  const handleAction = (label) => {
    if (label === "Disposition") {
      const query = new URLSearchParams();
      if (campaignId) query.set("campaign_id", campaignId);
      const activeCampName = rawCampaignName || campaignNameParam;
      if (activeCampName) query.set("campaign_name", activeCampName);

      navigate(`/admin/disposition-log-report?${query.toString()}`);
    } else if (label === "Upload Excel Sheet") {
      setUploadExcelOpen(true);
    } else if (label === "Add Lead") {
      setAddLeadOpen(true);
    } else if (label === "Pause Campaign" || label === "Resume Campaign") {
      setPauseCampaignOpen(true);
    } else if (label === "Campaign Setting") {
      const activeCampName = rawCampaignName || campaignNameParam || "";
      const query = new URLSearchParams();
      if (activeCampName) query.set("campaign_name", activeCampName);
      if (campaignId) query.set("campaign_id", campaignId);
      navigate(`/admin/edit-campaign?${query.toString()}`);
    } else if (label === "Edit Enquiry Form") {
      const activeCampName = rawCampaignName || campaignNameParam || "";
      const query = new URLSearchParams();
      if (activeCampName) query.set("campaign_name", activeCampName);
      if (campaignId) query.set("campaign_id", campaignId);
      navigate(`/admin/edit-enquiry-form?${query.toString()}`);
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
                xs: "repeat(4, 1fr)",
                sm: "repeat(4, 1fr)",
                md: "repeat(8, 1fr)",
              },
              gap: 1.5,
              mb: 2.5,
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
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
                xs: "repeat(4, 1fr)",
                sm: "repeat(4, 1fr)",
                md: "repeat(8, 1fr)",
              },
              gap: 1.5,
              mb: 2.5,
            }}
          >
            {stats.map((s) => (
              <SheetCard key={s.label} {...s} />
            ))}
          </Box>

          <LeadDistributionTable rows={rows} onRefresh={loadEnquiryData} />
        </>
      )}

      {/* UPLOAD EXCEL SHEET MODAL */}
      <UploadExcelModal
        open={uploadExcelOpen}
        campaignId={
          resolvedCampaignId || (campaignId ? Number(campaignId) : null)
        }
        campaignName={rawCampaignName || campaignNameParam}
        onClose={() => setUploadExcelOpen(false)}
        onUploadSuccess={(resData) => {
          console.log("Excel uploaded on EnquirySheet:", resData);
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
