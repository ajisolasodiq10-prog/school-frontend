import { CA_MAX, EXAM_MAX, TOTAL_MAX, gradeBands } from "../config/scoreConfig.js";

const round = (value) => Math.round(value * 100) / 100;

// Checks one typed score. Returns { value, empty, error }.
export function checkScore(raw, max) {
  const text = String(raw ?? "").trim();
  if (text === "") return { value: null, empty: true, error: null };
  if (!/^-?\d*\.?\d+$/.test(text)) {
    return { value: null, empty: false, error: "Enter numbers only." };
  }
  const number = Number(text);
  if (number < 0) return { value: null, empty: false, error: "Cannot be negative." };
  if (number > max) return { value: null, empty: false, error: `Cannot be more than ${max}.` };
  return { value: number, empty: false, error: null };
}

// Total for one student, or null when either score is missing/invalid.
export function totalOf(entry) {
  const ca = checkScore(entry?.ca, CA_MAX);
  const exam = checkScore(entry?.exam, EXAM_MAX);
  if (ca.value === null || exam.value === null) return null;
  return round(ca.value + exam.value);
}

export function gradeFor(total) {
  const percent = (total / TOTAL_MAX) * 100;
  return gradeBands.find((band) => percent >= band.min).grade;
}

// Validates every student's scores.
// requireAll = true also reports blank scores (used when submitting).
// Returns { errors: { [studentId]: { ca, exam } }, count }.
export function validateRows(values, students, requireAll) {
  const errors = {};
  let count = 0;
  students.forEach((student) => {
    const entry = values[student.id] || {};
    const ca = checkScore(entry.ca, CA_MAX);
    const exam = checkScore(entry.exam, EXAM_MAX);
    const row = {};
    if (ca.error) row.ca = ca.error;
    else if (requireAll && ca.empty) row.ca = "Required.";
    if (exam.error) row.exam = exam.error;
    else if (requireAll && exam.empty) row.exam = "Required.";
    if (row.ca || row.exam) {
      errors[student.id] = row;
      count += 1;
    }
  });
  return { errors, count };
}

// Class summary: how many students are complete, and the average total.
export function summarise(values, students) {
  const totals = students.map((s) => totalOf(values[s.id])).filter((t) => t !== null);
  const average = totals.length ? round(totals.reduce((a, b) => a + b, 0) / totals.length) : null;
  return { complete: totals.length, count: students.length, average };
}
