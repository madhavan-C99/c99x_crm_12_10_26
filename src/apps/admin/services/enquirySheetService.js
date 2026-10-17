import api from "../../../shared/services/axios";

export const getCampaignEnquirySheet = async (campaignId, campaignName, pipelineId) => {
  let payload = {};
  if (typeof campaignId === "object" && campaignId !== null) {
    payload = { ...campaignId };
  } else {
    if (campaignId) payload.campaign_id = campaignId;
    if (campaignName) payload.campaign_name = campaignName;
    if (pipelineId) payload.pipeline_id = pipelineId;
  }

  if (!payload.pipeline_id && payload.pipeline_id) {
    payload.pipeline_id = payload.pipeline_id;
  }

  return api.post("/adm/campaign_enquiry_sheet", payload);
};