import api from "@/shared/services/axios";

export const fetchOneLossData = (
    id
) => {

    return api.post(

        "/telecalling/fetch_one_loss_data",
        {
            lead_id: id,
        }
    );
};

// LOSS DETAIL UPDATE

export const submitLossLead =
    async (payload) => {

        return api.post(

            "/telecalling/loss_detail_update",
            payload
        );
    };
