// filterConfig.js

export const CATEGORY_ALIAS = {
    pipeline: "pipeline",

    pipeline_stage: "L_WON_REASONS",
    course_name: "L_COURSE_NAMES",
    course_plan: "L_COURSE_PLANS",
    course_time: "L_COURSE_TIMES",
    loss_reason: "L_LOSS_REASON",
    lead_source: "L_LEAD_SOURCES",
    priority: "L_TAGS",
    campaign_name: "L_CAMPAIGN_NAMES",
    preferred_timing: "L_FETCH_PREFERRED_TIMINGS",
    payment_status: "L_PAYMENT_STATUSES",
    payment_stage: "L_PAYMENT_STAGES",
    pending_amount: "L_PENDING_AMOUNTS",
};


export const FIELD_MAP = {
    campaign_name: "campaign_name_id",

    lead_source: "lead_source_id",

    pipeline_stage: "pipeline_stage_id",

    priority: "priority_id",

    course_name: "course_name_id",

    course_plan: "course_plan_id",

    course_time: "course_time_id",

    payment_status: "payment_status",

    payment_stage: "payment_stage_id",

    pending_amount: "pending_amount_id",
};

export const DEFAULT_LEAD_FILTERS = {
    pipeline_stage_id: 0,
    lead_source_id: 0,
    course_name_id: 0,
    priority_id: 0,
    course_plan_id: 0,
    payment_status: 0,
    campaign_name_id: 0,
};

export const DEFAULT_PAYMENT_FILTERS = {
    course_name_id: 0,
    course_plan_id: 0,
    payment_status: 0,
    payment_stage_id: 0,
    pending_amount_id: 0,
    course_time_id: 0,
};
