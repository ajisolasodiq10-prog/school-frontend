export { toISODate, todayISO, daysFromToday } from "../../teacher-dashboard/utils/dates.js";

// "2026-10-24T09:30:00" -> "24 October 2026, 9:30 am"
export function formatDateTime(iso) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}, ${d
    .toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })
    .toLowerCase()}`;
}

// A date N days ago at a fixed hour, as an ISO date-time.
export function daysAgoAt(days, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const formatRange = (start, end, formatDate) =>
  end && end !== start ? `${formatDate(start)} to ${formatDate(end)}` : formatDate(start);
