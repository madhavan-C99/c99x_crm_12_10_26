import api from "@/shared/services/axios";

export const fetchPaymentHistory = async (
    leadId
) => {

    return api.post(
        "/telecalling/fetch_lead_payment_history",
        {
            lead_id: leadId,
        }
    );
};

// ADD PAYMENT DETAILS

export const addPaymentDetails =
    async (payload) => {

        return api.post(
            "/telecalling/payment_details",
            payload
        );
    };
