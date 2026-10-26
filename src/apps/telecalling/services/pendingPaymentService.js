import api from "@/shared/services/axios";

export const getPendingPaymentStats = async (payload = {}) => {
    return api.post(
        "/telecalling/pending_payment_tile",
        payload
    );
};
