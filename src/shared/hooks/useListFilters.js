import { useState } from "react";
import useSessionState from "./useSessionState";
import useDebouncedValue from "./useDebouncedValue";

/**
 * State for a standard list-page toolbar (search, period, custom range, filters, sort).
 * Period, range and filter choices are remembered per page (`storageKey`);
 * the search text is debounced so the API is not hit on every key press.
 */
export default function useListFilters(storageKey, { defaultPeriod = "year", defaultFilters = {} } = {}) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  const [filterType, setFilterType] = useSessionState(`${storageKey}_filterType`, defaultPeriod);
  const [fromDate, setFromDate] = useSessionState(`${storageKey}_fromDate`, "");
  const [toDate, setToDate] = useSessionState(`${storageKey}_toDate`, "");
  const [selectedFilters, setSelectedFilters] = useSessionState(
    `${storageKey}_selectedFilters`,
    defaultFilters,
  );
  const [sortType, setSortType] = useState("newest");

  /** A "custom" period is only usable once both dates are chosen. */
  const isRangeIncomplete =
    (filterType === "custom" || filterType === "custom_date") && (!fromDate || !toDate);

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearch,
    filterType,
    setFilterType,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    selectedFilters,
    setSelectedFilters,
    sortType,
    setSortType,
    isRangeIncomplete,
  };
}
