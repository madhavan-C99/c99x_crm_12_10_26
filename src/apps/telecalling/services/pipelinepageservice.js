
import api from "@/shared/services/axios";
import { getSelectOptions } from "@/shared/services/dropdownService";

export const getPipelinePageData = async (payload) => {
    return api.post("/telecalling/fetch_pipeline_lead", payload);
};

export const getActivePipelines = async () => {
    return getSelectOptions({ field: "category_list", opt_filter: {} });
};
