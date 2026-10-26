import api from "../../../shared/services/axios";
import { invalidateSelectOptions } from "./dropdownService";

/**
 * Fetch all active pipeline categories for Code 99 organization
 */
export const getSettingsPipelineCategories = async (payload = {}) => {
    let body = {};
    if (typeof payload === "number" || typeof payload === "string") {
        body = {
            pipeline_id: Number(payload),
            id: Number(payload),
        };
    } else if (payload && typeof payload === "object") {
        body = { ...payload };
        if (body.pipeline_id !== undefined && body.id === undefined) {
            body.id = body.pipeline_id;
        } else if (body.id !== undefined && body.pipeline_id === undefined) {
            body.pipeline_id = body.id;
        }
    }
    return api.post("/adm/settings_pipeline_categories", body);
};

/**
 * Create a new pipeline category linked to Code 99 organization
 */
export const createSettingsPipelineCategory = async (payload) => {
    const res = await api.post("/adm/settings_create_pipeline_category", payload);
    invalidateSelectOptions("L_CATEGORIES");
    return res;
};

/**
 * Update stages and tags for a pipeline category
 */
export const updateSettingsPipelineStages = async (payload) => {
    const res = await api.post("/adm/settings_update_pipeline_stages", payload);
    invalidateSelectOptions("L_STAGES");
    invalidateSelectOptions("L_TAGS");
    return res;
};

/**
 * Check lead count for a stage before deletion
 */
export const checkSettingsStageLeads = async ({ stage_id }) => {
    return api.post("/adm/settings_check_stage_leads", { stage_id });
};

/**
 * Delete a pipeline stage, transferring leads to a target stage & tag if needed
 */
export const deleteSettingsPipelineStage = async ({ pipeline_id, stage_id, target_stage_id, target_priority_id, deletion_reason }) => {
    const res = await api.post("/adm/settings_delete_pipeline_stage", {
        pipeline_id,
        stage_id,
        target_stage_id,
        target_priority_id,
        deletion_reason,
    });
    invalidateSelectOptions("L_STAGES");
    return res;
};

/**
 * Check lead count for a tag/priority before deletion
 */
export const checkSettingsTagLeads = async ({ stage_id, tag_id, tag_name }) => {
    return api.post("/adm/settings_check_tag_leads", {
        stage_id,
        tag_id,
        tag_name,
    });
};

/**
 * Delete a tag, transferring leads to a target tag & stage if needed
 */
export const deleteSettingsTag = async ({ pipeline_id, stage_id, tag_id, tag_name, target_stage_id, target_tag_id, deletion_reason }) => {
    const res = await api.post("/adm/settings_delete_tag", {
        pipeline_id,
        stage_id,
        tag_id,
        tag_name,
        target_stage_id,
        target_tag_id,
        deletion_reason,
    });
    invalidateSelectOptions("L_TAGS");
    return res;
};

/**
 * Fetch all loss reasons filtered by pipeline_id (/adm/get_loss_reasons_admin)
 */
export const getSettingsLossReasons = async (payload = {}) => {
    const finalPayload = typeof payload === "object" ? payload : { pipeline_id: payload };
    try {
        return await api.post("/adm/get_loss_reasons_admin", finalPayload);
    } catch (err) {
        return await api.post("/adm/get_select_options", { field: "L_LOSS_REASONS" });
    }
};

/**
 * Add a new loss reason linked to pipeline_id (/adm/add_loss_reason_admin)
 */
export const addSettingsLossReason = async (payload) => {
    const res = await api.post("/adm/add_loss_reason_admin", payload);
    invalidateSelectOptions("L_LOSS_REASONS");
    return res;
};

/**
 * Delete a loss reason with pipeline_id, reason_id & reason (/adm/delete_loss_reason_admin)
 */
export const deleteSettingsLossReason = async (payload) => {
    const res = await api.post("/adm/delete_loss_reason_admin", payload);
    invalidateSelectOptions("L_LOSS_REASONS");
    return res;
};
