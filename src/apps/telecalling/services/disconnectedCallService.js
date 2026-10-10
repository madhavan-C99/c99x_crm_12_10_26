import api from "@/shared/services/axios";

export const getDisconnecetdCallDetails = async (payload) => {

    return api.post(
        "/telecalling/call_disconncet_api",
        payload
    );
};
