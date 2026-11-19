// Score helpers that take the school settings as a parameter, so the Admin
// pages always use the maximums and grade boundaries the administrator set.
const round = (value) => Math.round(value * 100) / 100;

export const totalMax = (settings) => settings.caMax + settings.examMax;

// Reads one stored score. Returns { value, problem }.
function readScore(raw, max) {
  const text = String(raw ?? "").trim();
  if (text === "") return { value: null, problem: "missing" };
  const n = Number(text);
  if (Number.isNaN(n) || n < 0) return { value: null, problem: "invalid" };
  if (n > max) return { value: n, problem: "over the maximum" };
  return { value: n, problem: null };
}

export function checkRow(entry, settings) {
  const ca = readScore(entry?.ca, settings.caMax);
  const exam = readScore(entry?.exam, settings.examMax);
  const problems = [];
  if (ca.problem) problems.push(`CA ${ca.problem}`);
  if (exam.problem) problems.push(`Exam ${exam.problem}`);
  const total = !problems.length ? round(ca.value + exam.value) : null;
  return { ca: ca.value, exam: exam.value, total, problems };
}

export function gradeFor(total, settings) {
  const percent = (total / totalMax(settings)) * 100;
  return settings.gradeBands.find((band) => percent >= band.min)?.grade ?? "F";
}

// Rows for a whole result record, plus class summary.
export function reviewRows(students, scores, settings) {
  const rows = students.map((student) => {
    const row = checkRow(scores[student.id], settings);
    return { student, ...row, grade: row.total === null ? null : gradeFor(row.total, settings) };
  });
  const totals = rows.map((r) => r.total).filter((t) => t !== null);
  return {
    rows,
    invalid: rows.filter((r) => r.problems.length > 0).length,
    average: totals.length ? round(totals.reduce((a, b) => a + b, 0) / totals.length) : null,
  };
}

// Checks the grade boundaries on the settings page. Returns { errors, ok }.
// Rules: whole numbers 0-100, highest grade first, each boundary strictly
// lower than the one above it (no overlaps), and the lowest grade starts at 0.
export function validateBands(bands) {
  const errors = {};
  bands.forEach((band, i) => {
    const value = band.min;
    if (value === "" || value === null || Number.isNaN(Number(value))) errors[band.grade] = "Enter a number.";
    else if (!Number.isInteger(Number(value))) errors[band.grade] = "Use a whole number.";
    else if (Number(value) < 0 || Number(value) > 100) errors[band.grade] = "Must be between 0 and 100.";
    else if (i === bands.length - 1 && Number(value) !== 0) errors[band.grade] = "The lowest grade must start at 0.";
    else if (i > 0 && !errors[bands[i - 1].grade] && Number(value) >= Number(bands[i - 1].min))
      errors[band.grade] = `Must be lower than ${bands[i - 1].grade} (${bands[i - 1].min}).`;
  });
  return { errors, ok: Object.keys(errors).length === 0 };
}

// "70 to 100", "60 to 69" ... derived from the lower boundaries.
export function bandRanges(bands) {
  return bands.map((band, i) => ({
    ...band,
    range: `${band.min} to ${i === 0 ? 100 : Number(bands[i - 1].min) - 1}`,
  }));
}
