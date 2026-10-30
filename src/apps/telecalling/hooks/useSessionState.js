import { useEffect, useState } from "react";

const read = (key) => {
  const raw = sessionStorage.getItem(key);
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw; // plain string saved by older code
  }
};

/** useState that survives page navigation (kept in sessionStorage until the tab closes). */
export default function useSessionState(key, initialValue) {
  const [value, setValue] = useState(() => {
    const saved = read(key);
    return saved !== undefined ? saved : initialValue;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full / blocked - state still works in memory */
    }
  }, [key, value]);

  return [value, setValue];
}
