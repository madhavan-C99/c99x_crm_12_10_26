import api from "@/shared/services/axios";

export const fetchOneWonData = (
    id
) => {

    return api.post(

        "/telecalling/fetch_one_won_data",
        {
            lead_id: id,
        }
    );
};

// LOSS DETAIL UPDATE

export const submitWonLead =
    async (payload) => {

        return api.post(

            "/telecalling/won_detail_update",
            payload
        );
    };
