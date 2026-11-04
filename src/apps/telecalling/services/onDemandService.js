import api from "@/shared/services/axios";

/**
 * Fetch unassigned leads available in the On-Demand Lead Pool
 */
export const fetchOnDemandPoolLeads = async (data = {}) => {
  return api.post("/telecalling/fetch_on_demand_pool_leads", data);
};

/**
 * Claim an unassigned lead from the On-Demand Lead Pool
 */
export const claimOnDemandLead = async (leadId) => {
  return api.post("/telecalling/claim_on_demand_lead", {
    lead_id: leadId,
  });
};
