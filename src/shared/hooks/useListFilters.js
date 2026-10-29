import { useState } from "react";
import useSessionState from "./useSessionState";
import useDebounce from "./useDebounce";

/**
 * State for a standard list-page toolbar (search, period, custom range, filters, sort).
 * Period, range and filter choices are remembered per page (`storageKey`);
 * the search text is debounced so the API is not hit on every key press.
 */
export default function useListFilters(
  storageKey,
  { defaultPeriod = "this_year", defaultFilters = {} } = {},
) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const initialPeriod = defaultPeriod === "year" ? "this_year" : defaultPeriod;
  const [storedFilterType, setStoredFilterType] = useSessionState(
    `${storageKey}_filterType`,
    initialPeriod,
  );
  const filterType = storedFilterType === "year" ? "this_year" : storedFilterType;
  const setFilterType = (val) => setStoredFilterType(val === "year" ? "this_year" : val);
  const [fromDate, setFromDate] = useSessionState(`${storageKey}_fromDate`, "");
  const [toDate, setToDate] = useSessionState(`${storageKey}_toDate`, "");
  const [selectedFilters, setSelectedFilters] = useSessionState(
    `${storageKey}_selectedFilters`,
    defaultFilters,
  );
  const [sortType, setSortType] = useState("newest");

  /** A "custom" period is only usable once both dates are chosen. */
  const isRangeIncomplete =
    (filterType === "custom" || filterType === "custom_date") &&
    (!fromDate || !toDate);

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
