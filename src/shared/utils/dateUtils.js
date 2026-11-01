import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

/**
 * Safely parses any date string from backend (ISO, SQL, with or without timezone)
 */
export const parseSafeDate = (val) => {
  if (!val || val === "-" || val === "null" || val === "NULL") return null;
  const d = dayjs(val);
  return d.isValid() ? d : null;
};

/**
 * 1. Pure Relative Time:
 * "Just now", "2 minutes ago", "an hour ago", "a day ago", "5 days ago", "2 weeks ago"
 */
export const formatRelativeTime = (val) => {
  const d = parseSafeDate(val);
  if (!d) return "-";
  const now = dayjs();
  const diffSeconds = now.diff(d, "second");
  if (diffSeconds >= 0 && diffSeconds < 45) return "Just now";
  return d.fromNow();
};

/**
 * 2. Notification Time (Choice B: Relative + Exact Time):
 * Today: "15 minutes ago • 11:30 AM" / "Just now • 11:30 AM"
 * Yesterday: "Yesterday • 04:30 PM"
 * This Week / Earlier: "3 days ago • 28 Oct, 02:15 PM"
 */
export const formatNotificationTime = (val) => {
  const d = parseSafeDate(val);
  if (!d) return "";
  const now = dayjs();
  const startOfToday = now.startOf("day");
  const startOfYesterday = startOfToday.subtract(1, "day");
  const timeStr = d.format("hh:mm A");

  // Replaces "a day ago" -> "1 day ago", "an hour ago" -> "1 hour ago", etc.
  const cleanRelative = (text) => text.replace(/^an?\s/i, "1 ");

  // 1. Today
  if (d.isAfter(startOfToday) || d.isSame(startOfToday)) {
    const diffSeconds = now.diff(d, "second");
    const rel =
      diffSeconds >= 0 && diffSeconds < 45
        ? "Just now"
        : cleanRelative(d.fromNow());
    return `${rel} • ${timeStr}`;
  }

  // 2. Yesterday
  if (d.isAfter(startOfYesterday) || d.isSame(startOfYesterday)) {
    return `Yesterday • ${timeStr}`;
  }

  // 3. Older (This Week & Earlier)
  const rel = cleanRelative(d.fromNow());
  const dateStr =
    d.year() === now.year()
      ? d.format("DD MMM, hh:mm A")
      : d.format("DD MMM YYYY, hh:mm A");
  return `${rel} • ${dateStr}`;
};

/**
 * 3. Notification Time with Both Relative + Exact:
 * "2 minutes ago • 11:28 AM"
 */
export const formatNotificationTimeFull = (val) => {
  return formatNotificationTime(val, true);
};

/**
 * 4. Full Date + Time: "26 Oct 2026, 11:20 AM"
 */
export const formatDateTime = (val) => {
  const d = parseSafeDate(val);
  if (!d) return "-";
  return d.format("DD MMM YYYY, hh:mm A");
};

/**
 * 5. Date Only: "26 Oct 2026"
 */
export const formatDate = (val) => {
  const d = parseSafeDate(val);
  if (!d) return "-";
  return d.format("DD MMM YYYY");
};

/**
 * 6. Time Only: "11:20 AM"
 */
export const formatTime = (val) => {
  const d = parseSafeDate(val);
  if (!d) return "-";
  return d.format("hh:mm A");
};

/**
 * 7. Payload for Backend API query/mutation: "YYYY-MM-DD"
 */
export const toApiDate = (val) => {
  const d = parseSafeDate(val);
  if (!d) return null;
  return d.format("YYYY-MM-DD");
};

/**
 * 8. Group notifications/reminders by relative date sections:
 * "Today", "Yesterday", "This Week", "Earlier"
 */
export const groupNotificationsByDate = (items = []) => {
  const groups = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Earlier: [],
  };

  const now = dayjs();
  const startOfToday = now.startOf("day");
  const startOfYesterday = startOfToday.subtract(1, "day");
  const startOfWeek = now.startOf("week");

  items.forEach((item) => {
    const d = parseSafeDate(item.date);
    if (!d) {
      groups["Earlier"].push(item);
      return;
    }

    if (d.isAfter(startOfToday) || d.isSame(startOfToday)) {
      groups["Today"].push(item);
    } else if (d.isAfter(startOfYesterday) || d.isSame(startOfYesterday)) {
      groups["Yesterday"].push(item);
    } else if (d.isAfter(startOfWeek) || d.isSame(startOfWeek)) {
      groups["This Week"].push(item);
    } else {
      groups["Earlier"].push(item);
    }
  });

  return Object.entries(groups).filter(([, list]) => list.length > 0);
};

export default {
  parseSafeDate,
  formatRelativeTime,
  formatNotificationTime,
  formatNotificationTimeFull,
  formatDateTime,
  formatDate,
  formatTime,
  toApiDate,
  groupNotificationsByDate,
};
