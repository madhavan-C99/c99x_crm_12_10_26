import dayjs from "dayjs";
import { toTitleCase } from "@/apps/telecalling/utils/exportColumns";

/**
 * Pipeline (kanban) export: every stage becomes one Excel sheet, all stages in ONE file.
 *
 * Board response shape (per stage):
 *   { id, name, total_count, data: [cards],                      <- first stage
 *     past/current/future: { count, data: [cards] },             <- follow-up buckets of other stages
 *     tags: [{ id, name, data, past, current, future }] }        <- sub-lists of a stage
 * Card keys: id, name, mobile, priority, source, course_name, ... (see COLUMN_LABELS)
 */

// column key -> heading in the Excel / column picker (anything missing is Title Cased)
export const COLUMN_LABELS = {
  id: "Lead ID",
  name: "Name",
  mobile: "Mobile",
  priority: "Priority",
  source: "Source",
  course_name: "Course",
  course_plan: "Course Plan",
  timing: "Timing",
  date: "Date",
  call_summary: "Call Summary",
  notes: "Notes",
  summary: "Summary",
  attempts: "Attempts",
  last_tried: "Last Tried",
  retry_after: "Retry After",
  call_back: "Call Back",
  pending_amount: "Pending Amount",
  total_fees: "Total Fees",
  due_date: "Due Date",
  overdue_days: "Overdue Days",
  remaining_days: "Remaining Days",
  lost_reason: "Lost Reason",
  closed_on: "Closed On",
};

const HIDDEN_COLUMNS = ["priority_color"];
const DATE_COLUMNS = ["date", "last_tried", "retry_after", "call_back", "due_date", "closed_on"];
const BUCKETS = ["past", "current", "future"];

const asList = (value) => (Array.isArray(value) ? value : []);

/** Every lead of one stage (main list + follow-up buckets + tags), without duplicates. */
export const getStageCards = (stage) => {
  const lists = [
    stage?.data,
    ...BUCKETS.map((b) => stage?.[b]?.data),
    ...asList(stage?.tags).flatMap((tag) => [tag?.data, ...BUCKETS.map((b) => tag?.[b]?.data)]),
  ];

  const seen = new Set();
  const cards = [];
  lists.flatMap(asList).forEach((card) => {
    if (!card || typeof card !== "object") return;
    const key = card.id ?? JSON.stringify(card);
    if (seen.has(key)) return;
    seen.add(key);
    cards.push(card);
  });
  return cards;
};

/** Column list for the picker = all flat fields found on any card of any stage. */
export const getPipelineExportColumns = (stages) => {
  const keys = [];
  const seen = new Set(HIDDEN_COLUMNS);

  asList(stages).forEach((stage) =>
    getStageCards(stage).forEach((card) =>
      Object.entries(card).forEach(([key, value]) => {
        if (seen.has(key) || (value !== null && typeof value === "object")) return;
        seen.add(key);
        keys.push(key);
      }),
    ),
  );

  // known columns first (in COLUMN_LABELS order), unknown ones after
  const known = Object.keys(COLUMN_LABELS);
  keys.sort((a, b) => {
    const ia = known.indexOf(a);
    const ib = known.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  return keys.map((key) => ({ id: key, label: COLUMN_LABELS[key] || toTitleCase(key) }));
};

const formatValue = (key, value) => {
  if (value === null || value === undefined) return "";
  if (DATE_COLUMNS.includes(key) && dayjs(value).isValid()) {
    return dayjs(value).format("DD MMM YYYY, hh:mm A");
  }
  return value;
};

// Excel sheet names: max 31 chars, no \ / ? * [ ] :  and must be unique
const makeSheetNames = (stages) => {
  const used = new Set();
  return stages.map((stage, index) => {
    const base = String(stage?.name || `Stage ${index + 1}`).replace(/[\\/?*[\]:]/g, " ").trim() || `Stage ${index + 1}`;
    let name = base.slice(0, 31);
    let n = 2;
    while (used.has(name.toLowerCase())) {
      const suffix = ` (${n++})`;
      name = base.slice(0, 31 - suffix.length) + suffix;
    }
    used.add(name.toLowerCase());
    return name;
  });
};

/**
 * @returns {{ sheets: {name, headers, rows}[], warning?: string }}
 *   warning is set when a stage has more leads (total_count) than the board loaded.
 */
export const buildStageSheets = (stages, selectedKeys, columns) => {
  const list = asList(stages);
  const picked = columns.filter((c) => selectedKeys.includes(c.id));
  const names = makeSheetNames(list);
  const incomplete = [];

  const sheets = list.map((stage, index) => {
    const cards = getStageCards(stage);
    if (stage?.total_count > cards.length) {
      incomplete.push(`${stage.name} (${cards.length} of ${stage.total_count})`);
    }
    return {
      name: names[index],
      headers: picked.map((c) => c.label),
      rows: cards.map((card) => picked.map((c) => formatValue(c.id, card[c.id]))),
    };
  });

  return {
    sheets,
    warning: incomplete.length
      ? `Some stages have more leads than are loaded on the board: ${incomplete.join(", ")}`
      : undefined,
  };
};
