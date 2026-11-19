// Helpers for building readable IDs and codes.

export const slug = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// "JSS 2" + "A" -> "jss2a"
export const classIdFor = (level, arm) => `${level.replace(/\s+/g, "").toLowerCase()}${arm.toLowerCase()}`;

// "JSS 2" + "A" -> "J2A", "SS 1" + "B" -> "S1B"
export const classCodeFor = (level, arm) => `${level[0]}${level.replace(/\D+/g, "")}${arm.toUpperCase()}`;

export const classNameFor = (level, arm) => `${level}${arm.toUpperCase()}`;

// Next free number in a list of IDs such as "STU-J2A-004" or "TCH-021".
export function nextNumber(ids, pattern) {
  const numbers = ids.map((id) => Number((id.match(pattern) || [])[1])).filter((n) => !Number.isNaN(n));
  return numbers.length ? Math.max(...numbers) + 1 : 1;
}

export const nextStudentId = (students, classCode) =>
  `STU-${classCode}-${String(nextNumber(students.map((s) => s.id).filter((id) => id.startsWith(`STU-${classCode}-`)), /-(\d+)$/)).padStart(3, "0")}`;

export const nextTeacherId = (teachers) =>
  `TCH-${String(nextNumber(teachers.map((t) => t.id), /-(\d+)$/)).padStart(3, "0")}`;

export const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

