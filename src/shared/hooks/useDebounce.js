import { useState, useEffect } from "react";

/**
 * Universal Debounce Hook shared across Admin and Telecalling.
 * Delays updating the returned value until `delay` milliseconds have elapsed
 * since the last change.
 *
 * @param {*} value - The input value to debounce
 * @param {number} delay - Debounce delay in milliseconds (default: 400ms)
 * @returns {*} The debounced value
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
