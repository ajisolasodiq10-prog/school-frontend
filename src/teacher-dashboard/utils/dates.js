// Small date helpers. Dates are stored as "YYYY-MM-DD" text.
export const toISODate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const todayISO = () => toISODate(new Date());

// A date N days from today (negative = in the past). Handy for relative dates.
export function daysFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toISODate(date);
}
