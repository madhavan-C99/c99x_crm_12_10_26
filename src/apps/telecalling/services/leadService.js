import api from "@/shared/services/axios";

export const getLeadData = (
    payload
) => {

    return api.post(

        "/telecalling/fetch_all_leads",

        payload
    );
};

export const lookupLeadByNumber = (mobile) => {
    return api.post("/telecalling/lookup_lead_number", { mobile });
};
