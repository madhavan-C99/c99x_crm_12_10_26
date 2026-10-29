// import dayjs from "dayjs";
// import relativeTime from "dayjs/plugin/relativeTime";

// dayjs.extend(relativeTime);

// /**
//  * Safely parses any date string from backend (ISO, SQL, with or without timezone)
//  */
// export const parseSafeDate = (val) => {
//   if (!val || val === "-" || val === "null" || val === "NULL") return null;
//   const d = dayjs(val);
//   return d.isValid() ? d : null;
// };

// /**
//  * 1. Pure Relative Time:
//  * "Just now", "2 minutes ago", "an hour ago", "a day ago", "5 days ago", "2 weeks ago"
//  */
// export const formatRelativeTime = (val) => {
//   const d = parseSafeDate(val);
//   if (!d) return "-";
//   const now = dayjs();
//   const diffSeconds = now.diff(d, "second");
//   if (diffSeconds >= 0 && diffSeconds < 45) return "Just now";
//   return d.fromNow();
// };

// /**
//  * 2. Notification Time:
//  * "Just now", "2 minutes ago", "an hour ago", "a day ago", "1 week ago"
//  */
// export const formatNotificationTime = (val, includeExact = false) => {
//   const d = parseSafeDate(val);
//   if (!d) return "";
//   const now = dayjs();
//   const diffSeconds = now.diff(d, "second");
//   const rel = diffSeconds >= 0 && diffSeconds < 45 ? "Just now" : d.fromNow();

//   if (includeExact) {
//     const exact = d.format("hh:mm A");
//     return `${rel} • ${exact}`;
//   }
//   return rel;
// };

// /**
//  * 3. Notification Time with Both Relative + Exact:
//  * "2 minutes ago • 11:28 AM"
//  */
// export const formatNotificationTimeFull = (val) => {
//   return formatNotificationTime(val, true);
// };

// /**
//  * 4. Full Date + Time: "26 Oct 2026, 11:20 AM"
//  */
// export const formatDateTime = (val) => {
//   const d = parseSafeDate(val);
//   if (!d) return "-";
//   return d.format("DD MMM YYYY, hh:mm A");
// };

// /**
//  * 5. Date Only: "26 Oct 2026"
//  */
// export const formatDate = (val) => {
//   const d = parseSafeDate(val);
//   if (!d) return "-";
//   return d.format("DD MMM YYYY");
// };

// /**
//  * 6. Time Only: "11:20 AM"
//  */
// export const formatTime = (val) => {
//   const d = parseSafeDate(val);
//   if (!d) return "-";
//   return d.format("hh:mm A");
// };

// /**
//  * 7. Payload for Backend API query/mutation: "YYYY-MM-DD"
//  */
// export const toApiDate = (val) => {
//   const d = parseSafeDate(val);
//   if (!d) return null;
//   return d.format("YYYY-MM-DD");
// };

// export default {
//   parseSafeDate,
//   formatRelativeTime,
//   formatNotificationTime,
//   formatNotificationTimeFull,
//   formatDateTime,
//   formatDate,
//   formatTime,
//   toApiDate,
// };



import { useState } from "react";
import useSessionState from "./useSessionState";
import useDebouncedValue from "./useDebouncedValue";

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
  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  const initialPeriod = defaultPeriod === "year" ? "this_year" : defaultPeriod;
  const [storedFilterType, setStoredFilterType] = useSessionState(
    `${storageKey}_filterType`,
    initialPeriod,
  );
  const filterType =
    storedFilterType === "year" ? "this_year" : storedFilterType;
  const setFilterType = (val) =>
    setStoredFilterType(val === "year" ? "this_year" : val);
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
