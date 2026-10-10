import api from "@/shared/services/axios";

export const getPipelineData = async (payload = {}) => {
    return api.post(
        "/telecalling/pipeline_funnel",
        payload
    );
};
