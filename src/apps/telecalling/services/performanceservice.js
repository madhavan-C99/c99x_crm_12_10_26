import api from "@/shared/services/axios";

export const getPerformanceData = async (data) => {
    return api.post(
        "/telecalling/tele_performance",
        data
    );
};
