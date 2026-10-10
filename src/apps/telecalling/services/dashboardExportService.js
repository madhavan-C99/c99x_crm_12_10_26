import api from "@/shared/services/axios";

export const dashboardExportJsonData = async (payload) => {

    return api.post(
        "/telecalling/dashboard/pdf-data/",
        payload
    );
};
