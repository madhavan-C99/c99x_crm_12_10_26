const SEARCH_FIELDS = [
  "full_name",
  "mobile_no",
  "email",
  "course_name",
  "course_plan",
  "campaign_name",
  "stage",
];

/** Instant, client-side search over the rows already loaded. */
export const searchRows = (rows, term, fields = SEARCH_FIELDS) => {
  const needle = (term || "").toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    fields.some((field) =>
      String(row[field] ?? "")
        .toLowerCase()
        .includes(needle),
    ),
  );
};

/** The API returns newest first; "oldest" simply flips the order. */
export const sortRows = (rows, sortType) =>
  sortType === "oldest" ? [...rows].reverse() : rows;
