import api from "@/shared/services/axios";

export const getLeadData = (
    payload
) => {

    return api.post(

        "/telecalling/fetch_all_leads",

        payload
    );
};
