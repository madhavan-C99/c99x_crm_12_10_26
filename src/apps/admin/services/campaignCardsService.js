import api from "../../../shared/services/axios";

export const getCampaignCards = async (payload = {}) => {
    return api.post("/adm/campaign_cards_tile", payload);
};

export const deleteCampaign = async (campaignId) => {
    return api.post("/adm/delete_campaign", { campaign_id: campaignId });
};