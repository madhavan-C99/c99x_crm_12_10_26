const SEARCH_FIELDS = [
  "full_name",
  "mobile_no",
  "mobile",
  "alternative_mobile",
  "email",
  "course_name",
  "course_plan",
  "campaign_name",
  "stage",
];

/** Instant, client-side search over the rows already loaded. */
export const searchRows = (rows, term, fields = SEARCH_FIELDS) => {
  const needle = (term || "").toLowerCase().trim();
  if (!needle) return rows;
  const needleDigits = needle.replace(/\D/g, "");
  return rows.filter((row) =>
    fields.some((field) => {
      const val = String(row[field] ?? "");
      if (val.toLowerCase().includes(needle)) return true;
      if (
        needleDigits &&
        (field === "mobile_no" ||
          field === "alternative_mobile" ||
          field === "mobile")
      ) {
        const valDigits = val.replace(/\D/g, "");
        if (valDigits && valDigits.includes(needleDigits)) return true;
      }
      return false;
    }),
  );
};

/** The API returns newest first; "oldest" simply flips the order. */
export const sortRows = (rows, sortType) =>
  sortType === "oldest" ? [...rows].reverse() : rows;
