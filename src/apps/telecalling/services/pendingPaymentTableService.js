import api from "@/shared/services/axios";

export const
getPendingPaymentTableData = (
    payload
) => {

    return api.post(

        "/telecalling/fetch_all_payments",

        payload
    );
};
