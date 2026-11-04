import api from "@/shared/services/axios";

/**
 * Dropdown options almost never change during a session, but the same
 * category used to be requested 40+ times per page (every form section,
 * filter and modal fired its own call). This wrapper:
 *   1. de-duplicates identical in-flight requests, and
 *   2. keeps results for a few minutes.
 *
 * Supports both signatures:
 *   getSelectOptions({ field: "L_STAGES", opt_filter: { pipeline_id: 1 } })
 *   getSelectOptions("L_STAGES", { pipeline_id: 1 })
 *   getSelectOptions("L_STAGES", true)  // force refresh
 */
const TTL_MS = 5 * 60 * 1000;
const cache = new Map(); // key -> { expires, promise }

const keyOf = (payload) => JSON.stringify(payload ?? {});

export const getSelectOptions = (payload, filterOrForce = false, forceRefresh = false) => {
  let normalizedPayload;
  let force = false;

  if (typeof payload === "string") {
    const optFilter =
      typeof filterOrForce === "object" && filterOrForce !== null
        ? filterOrForce
        : {};
    force = typeof filterOrForce === "boolean" ? filterOrForce : Boolean(forceRefresh);
    normalizedPayload = { field: payload, opt_filter: optFilter };
  } else {
    normalizedPayload = payload;
    force = Boolean(filterOrForce);
  }

  const key = keyOf(normalizedPayload);
  const hit = cache.get(key);

  if (!force && hit && hit.expires > Date.now()) return hit.promise;

  const promise = api
    .post("/adm/get_select_options", normalizedPayload)
    .catch((error) => {
      cache.delete(key); // never cache failures
      throw error;
    });

  cache.set(key, { expires: Date.now() + TTL_MS, promise });
  return promise;
};

export const clearSelectOptionsCache = () => cache.clear();
