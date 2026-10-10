// filterUtils.js

import { CATEGORY_ALIAS } from "./filterConfig";

export const normalize = (value = "") => {
    return value
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
};

export const getCategoryKey = (label = "") => {
    const normalized = normalize(label);

    return (
        CATEGORY_ALIAS[normalized] ||
        normalized.replace(/\s+/g, "_")
    );
};

export const getDisplayLabel = (label = "") => {
    return label
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );
};

export const buildOptFilter = ({
    selectedPipelineId = 0,
    selectedFilters = {},
}) => {

    const optFilter = {};

    // Current Pipeline
    if (selectedPipelineId) {
        optFilter.pipeline_id =
            selectedPipelineId;
    }

    // Other selected filters
    Object.entries(
        selectedFilters || {}
    ).forEach(([key, value]) => {

        if (
            value !== undefined &&
            value !== null &&
            value !== "" &&
            value !== 0
        ) {
            optFilter[key] = value;
        }

    });

    return optFilter;
};
