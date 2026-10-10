import api from "@/shared/services/axios";

export const fetchLeadCallHistory =
    async (leadId) => {

        return api.post(
            "/telecalling/fetch_lead_call_history",
            {
                lead_id: leadId,
            }
        );
    };
