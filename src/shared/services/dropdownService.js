import api from "@/shared/services/axios";

/**
 * Dropdown options almost never change during a session, but the same
 * category used to be requested 40+ times per page (every form section,
 * filter and modal fired its own call). This wrapper:
 *   1. de-duplicates identical in-flight requests, and
 *   2. keeps results for a few minutes.
 *
 * The return value is still an axios-style response, so callers don't change.
 */
const TTL_MS = 5 * 60 * 1000;
const cache = new Map(); // key -> { expires, promise }

const keyOf = (payload) => JSON.stringify(payload ?? {});

export const getSelectOptions = (payload, forceRefresh = false) => {
  // Defensive normalize: if a string category is passed (e.g. "L_CAMPAIGN_NAMES"), wrap as object
  const normalizedPayload =
    typeof payload === "string" ? { field: payload, opt_filter: {} } : payload;

  const key = keyOf(normalizedPayload);
  const hit = cache.get(key);

  if (!forceRefresh && hit && hit.expires > Date.now()) return hit.promise;

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
