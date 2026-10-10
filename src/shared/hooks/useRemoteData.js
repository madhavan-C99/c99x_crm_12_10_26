import { useCallback, useEffect, useRef, useState } from "react";

const defaultParse = (response) => response?.data?.data;

/**
 * Loads data from an API function and reloads when `params` change.
 *  - skips the call while `enabled` is false (e.g. waiting for the pipeline id)
 *  - ignores slow, outdated responses (only the newest request may update state)
 *
 * @param {object}   options
 * @param {Function} options.fetcher  (params) => axios promise
 * @param {object}   options.params   request payload (compared by value)
 * @param {boolean}  [options.enabled=true]
 * @param {Function} [options.parse]  (axiosResponse) => data   (keep it a stable function)
 * @param {*}        [options.initialData]  also used as the value after an error
 */
export default function useRemoteData({
  fetcher,
  params,
  enabled = true,
  parse = defaultParse,
  initialData = null,
}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(Boolean(enabled));
  const latestRequest = useRef(0);
  const paramsKey = JSON.stringify(params);

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    try {
      const response = await fetcher(JSON.parse(paramsKey));
      if (requestId !== latestRequest.current) return;
      setData(parse(response) ?? initialData);
    } catch (error) {
      if (requestId !== latestRequest.current) return;
      console.error("Failed to load data:", error?.response?.data || error);
      setData(initialData);
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
    // initialData is only a fallback value, it must not retrigger the call
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, paramsKey, parse]);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  return { data, loading, refetch: load };
}
