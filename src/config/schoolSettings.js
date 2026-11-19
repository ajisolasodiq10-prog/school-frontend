// ---------------------------------------------------------------------------
// SCHOOL SETTINGS (shared by the Admin Dashboard, the Teacher Dashboard and the Student Portal)
//
// The administrator edits these on the Admin "School Settings" page and they are saved in the
// school database. Each dashboard reads them from the backend when it loads
// (fetchSchoolSettings) and this module keeps the current copy in memory for the pages that
// need the score maximums and grade boundaries. Nothing is kept in the browser's storage.
// ---------------------------------------------------------------------------
import { del, get, put } from "../api/client.js";
import { school } from "./siteConfig.js";

export const DEFAULT_SETTINGS = {
  schoolName: school.name,
  address: "",
  email: "",
  phone: "",
  caMax: 40,
  examMax: 60,
  // Grade boundaries as a percentage of the total. Highest grade first.
  gradeBands: [
    { grade: "A", remark: "Excellent", min: 70 },
    { grade: "B", remark: "Very Good", min: 60 },
    { grade: "C", remark: "Good", min: 50 },
    { grade: "D", remark: "Fair", min: 45 },
    { grade: "E", remark: "Pass", min: 40 },
    { grade: "F", remark: "Fail", min: 0 },
  ],
  display: { showGrade: true, showClassAverage: true, showRemarks: true },
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const unwrap = (res) => (res && res.data !== undefined ? res.data : res);

let current = clone(DEFAULT_SETTINGS);
const listeners = new Set();

// Calls fn(settings) now and whenever new settings arrive from the backend.
export function subscribeToSettings(fn) {
  listeners.add(fn);
  fn(current);
  return () => listeners.delete(fn);
}

function apply(settings) {
  current = { ...clone(DEFAULT_SETTINGS), ...settings, display: { ...DEFAULT_SETTINGS.display, ...(settings.display || {}) } };
  listeners.forEach((fn) => fn(current));
  return clone(current);
}

// The settings last read from the backend (the defaults until then).
export const loadSchoolSettings = () => clone(current);

export async function fetchSchoolSettings() {
  return apply(unwrap(await get("/settings")).settings);
}

export async function saveSchoolSettings(settings) {
  const { display, ...rest } = settings;
  return apply(unwrap(await put("/settings", { ...rest, ...display })).settings);
}

export async function resetSchoolSettings() {
  return apply(unwrap(await del("/settings")).settings);
}
