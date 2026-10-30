import api from "@/shared/services/axios";

// In-memory cache for dropdown options with TTL (60 seconds)
const optionsCache = new Map();
const CACHE_TTL_MS = 60000;

/**
 * Invalidate cached dropdown options.
 * @param {string|null} fieldKey - Field key to invalidate (e.g., "L_STAGES"). If null, clears entire cache.
 */
export const invalidateSelectOptions = (fieldKey = null) => {
  if (!fieldKey) {
    optionsCache.clear();
    return;
  }
  const prefix = String(fieldKey) + ":";
  for (const key of optionsCache.keys()) {
    if (key === fieldKey || key.startsWith(prefix)) {
      optionsCache.delete(key);
    }
  }
};

/**
 * Normalize individual option items returned from backend
 */
export const normalizeOptionItem = (item, idx = 0) => {
  if (item === null || item === undefined) return null;

  if (typeof item === "string" || typeof item === "number") {
    const val = item;
    const str = String(item);
    return {
      id: val,
      value: val,
      name: str,
      label: str,
      stage_name: str,
      source_name: str,
      campaign_name: str,
      user_name: str,
      course_name: str,
    };
  }

  if (typeof item === "object") {
    const val =
      item.id ??
      item.value ??
      item.stage_id ??
      item.source_id ??
      item.campaign_id ??
      item.user_id ??
      idx + 1;

    const rawName =
      item.name ??
      item.label ??
      item.stage_name ??
      item.source_name ??
      item.campaign_name ??
      item.user_name ??
      item.title ??
      item.display_name ??
      item.full_name ??
      item.username ??
      (typeof item.value === "string" ? item.value : String(val));

    const strName = typeof rawName === "string" ? rawName : String(rawName);

    return {
      ...item,
      id: val,
      value: val,
      name: strName,
      label: strName,
      stage_name: item.stage_name || strName,
      source_name: item.source_name || strName,
      campaign_name: item.campaign_name || strName,
      user_name: item.user_name || item.full_name || strName,
      course_name: item.course_name || strName,
    };
  }

  return {
    id: idx + 1,
    value: idx + 1,
    name: String(item),
    label: String(item),
  };
};

/**
 * Normalize an array of items returned by /adm/get_select_options
 */
export const normalizeOptionList = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeOptionItem).filter(Boolean);
};

/**
 * Generic centralized service to fetch select options on-demand from backend.
 * Supports both:
 * 1) getSelectOptions("L_CAMPAIGN_NAMES", { pipeline_id: 4 })
 * 2) getSelectOptions({ field: "L_CAMPAIGN_NAMES", opt_filter: { pipeline_id: 4 } })
 *
 * Uses in-memory caching with 60s TTL and throws on error.
 * @param {string|object} fieldOrPayload - Field identifier string or full payload object
 * @param {object|null} optFilter - Additional filter object (e.g. { pipeline_id: 4 })
 * @returns {Promise<Array>} List of normalized dropdown options
 */
export const getSelectOptions = async (fieldOrPayload, optFilter = null, forceRefresh = false) => {
  let field = fieldOrPayload;
  let filter = optFilter;

  if (typeof fieldOrPayload === "object" && fieldOrPayload !== null) {
    field = fieldOrPayload.field;
    filter = fieldOrPayload.opt_filter || fieldOrPayload.optFilter || null;
  }

  const cacheKey = `${field}:${JSON.stringify(filter || {})}`;
  const cached = optionsCache.get(cacheKey);

  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const payload = { field };
  if (filter && Object.keys(filter).length > 0) {
    const cleanFilter = { ...filter };
    if (cleanFilter.pipeline_id !== undefined && cleanFilter.category_id !== undefined) {
      delete cleanFilter.category_id;
    }
    payload.opt_filter = cleanFilter;
  }

  const response = await api.post("/adm/get_select_options", payload);
  const rawData = response?.data?.data ?? response?.data ?? [];

  if (Array.isArray(rawData)) {
    const normalized = normalizeOptionList(rawData);
    optionsCache.set(cacheKey, { data: normalized, timestamp: Date.now() });
    return normalized;
  }

  throw new Error(`Failed to fetch select options for field '${field}'`);
};

/**
 * Fetch multiple select option fields concurrently
 * @param {Array<string|object>} fields - Array of field names or field configuration objects
 * @returns {Promise<object>} Map of field names to normalized option arrays
 */
export const getMultipleSelectOptions = async (fields = [], forceRefresh = false) => {
  if (!Array.isArray(fields) || fields.length === 0) return {};

  const promises = fields.map((item) => {
    if (typeof item === "string") {
      return getSelectOptions(item, null, forceRefresh).then((data) => ({ field: item, data }));
    } else if (item && typeof item === "object" && item.field) {
      return getSelectOptions(item.field, item.optFilter || item.opt_filter || null, forceRefresh).then((data) => ({
        field: item.key || item.field,
        data,
      }));
    }
    return Promise.resolve({ field: "unknown", data: [] });
  });

  const results = await Promise.all(promises);
  const map = {};
  results.forEach(({ field, data }) => {
    map[field] = data;
  });
  return map;
};

export default {
  getSelectOptions,
  getMultipleSelectOptions,
  normalizeOptionItem,
  normalizeOptionList,
  invalidateSelectOptions,
};
