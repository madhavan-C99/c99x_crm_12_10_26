import api from "@/shared/services/axios";

export const getEnrolledcourse = async (data) => {
    return api.post(
        "/telecalling/tele_performance",
        data
    );
};



export const getPerformanceData = async (data) => {
    return api.post(
        "/adm/fetch_performance_overview_admin",
        data
    );
};
