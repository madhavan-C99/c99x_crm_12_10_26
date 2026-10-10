import api from "@/shared/services/axios";

export const fetchOneLeadForm =
    async (payload) => {

        return api.post(

            "/telecalling/fetch_one_lead_form",
            payload
        );
    };
