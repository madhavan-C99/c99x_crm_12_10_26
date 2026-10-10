import api from "@/shared/services/axios";

export const addnewlead = async (payload) => {
    return api.post(
        "/telecalling/add_new_lead",
        payload
    );
};
