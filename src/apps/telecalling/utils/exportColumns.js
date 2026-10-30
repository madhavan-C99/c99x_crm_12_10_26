/**
 * Builds the export column list from the rows the table already received
 * from its API (field names = keys of the response objects).
 *
 *   [{ lead_name: "A", mobile_no: "9..." }]  ->  [{ key: "lead_name", label: "Lead Name" }, ...]
 *
 * - keys are collected from ALL rows (first row may miss optional fields)
 * - nested objects / arrays are skipped (they cannot be written to one Excel cell)
 */
export const toTitleCase = (str) =>
  String(str)
    .replace(/_/g, " ")
    .replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1));

const isFlatValue = (value) => value === null || typeof value !== "object";

export function getColumnsFromRows(rows, { excludeKeys = [] } = {}) {
  if (!Array.isArray(rows) || !rows.length) return [];

  const skip = new Set(excludeKeys);
  const keys = [];
  const seen = new Set();

  rows.forEach((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return;
    Object.entries(row).forEach(([key, value]) => {
      if (seen.has(key) || skip.has(key)) return;
      if (!isFlatValue(value)) return;
      seen.add(key);
      keys.push(key);
    });
  });

  return keys.map((key) => ({ key, label: toTitleCase(key) }));
}
