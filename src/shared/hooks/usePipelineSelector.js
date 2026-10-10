import { useCallback, useEffect, useState } from "react";
import { getSelectOptions } from "@/shared/services/dropdownService";

const normalizePipeline = (o) => ({
  ...o,
  id: o.id ?? o.value,
  name: o.name ?? o.label ?? o.display_name ?? o.category_name,
});

/**
 * Loads the pipeline list and remembers the selected pipeline per page.
 *
 * `isReady` is false only until the first valid pipeline id is known. Pages
 * should wait for it before fetching data, otherwise every widget calls its
 * API once with pipeline 0 and then again with the real id.
 */
const usePipelineSelector = (storageKey = "default") => {
  const selectedKey = `telecalling_pipeline_selected_${storageKey}`;
  const switchedKey = `telecalling_pipeline_user_switched_${storageKey}`;

  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState(() =>
    Number(sessionStorage.getItem(selectedKey)) || 0,
  );
  // If we already have a saved selection we can fetch immediately.
  const [isReady, setIsReady] = useState(() => Boolean(sessionStorage.getItem(selectedKey)));

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await getSelectOptions({ field: "L_CATEGORIES" });
        const raw = res?.data?.data ?? res?.data ?? [];
        const list = (Array.isArray(raw) ? raw : []).map(normalizePipeline);
        if (cancelled) return;

        setPipelines(list);
        if (!list.length) return;

        const saved = sessionStorage.getItem(selectedKey);
        const savedStillExists = saved && list.some((p) => String(p.id) === String(saved));

        if (savedStillExists) {
          setSelectedPipelineId(Number(saved));
        } else {
          const fallback = (list.find((p) => p.is_default) || list[0]).id;
          sessionStorage.setItem(selectedKey, String(fallback));
          setSelectedPipelineId(Number(fallback));
        }
      } catch (error) {
        console.error("Failed to fetch pipeline options:", error);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedKey]);

  const handlePipelineChange = useCallback(
    (newPipelineId) => {
      const id = Number(newPipelineId);
      setSelectedPipelineId(id);
      sessionStorage.setItem(selectedKey, String(id));
      sessionStorage.setItem(switchedKey, "true");
    },
    [selectedKey, switchedKey],
  );

  return { pipelines, selectedPipelineId, handlePipelineChange, isReady };
};

export default usePipelineSelector;
