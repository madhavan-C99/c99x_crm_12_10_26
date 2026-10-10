import api from "@/shared/services/axios";

export const getDisconnectDropdownOptions = async (id) => {
    return api.post(
        "/telecalling/disconnect_select_tag",
        {
            lead_id: id,
        }

    );
};
