// Student Portal <-> school backend: class, terms, PIN unlock and published results.
// Results are read from the database and only for terms unlocked with a result PIN.
import { get, post } from "../../api/client.js";
import { getAll, unwrap, mapReaderAnnouncement, mapAssignment, mapMaterial, mapTimetable } from "../../api/records.js";
import { fetchSchoolSettings, loadSchoolSettings } from "../../config/schoolSettings.js";

// A term on the My Results page is identified by "<sessionId>:<termId>".
export const termKey = (item) => `${item.academicSessionId}:${item.termId}`;
export const splitTermKey = (key) => key.split(":");

export async function loadStudentBase() {
  const [classes, sessions] = await Promise.all([getAll("/classes"), getAll("/academic-sessions")]);
  return { classes, sessions };
}

export async function loadTerms(studentRecordId) {
  const data = unwrap(await get("/result-sheets/published/terms", { query: { studentId: studentRecordId } }));
  return (data.items || []).map((item) => ({
    id: termKey(item),
    sessionId: item.academicSessionId,
    termId: item.termId,
    session: item.sessionName,
    term: item.termName,
    className: item.className,
    current: item.current,
    status: item.unlocked ? "unlocked" : "locked",
  }));
}

// Throws with the backend's message for a wrong, revoked or already used PIN.
export async function redeemPin(studentRecordId, key, pin) {
  const [academicSessionId, termId] = splitTermKey(key);
  return unwrap(await post("/result-access/redeem", { studentId: studentRecordId, academicSessionId, termId, pin: pin.trim() }));
}

const gradeFor = (total, max, bands) => {
  const percent = (total / max) * 100;
  return (bands.find((b) => percent >= b.min) || bands[bands.length - 1]);
};

// The published scores of one unlocked term, with totals, grades and a summary.
export async function loadTermResults(studentRecordId, key) {
  const [academicSessionId, termId] = splitTermKey(key);
  const data = unwrap(await get("/result-sheets/published/term", { query: { studentId: studentRecordId, academicSessionId, termId } }));
  const settings = loadSchoolSettings();
  const max = settings.caMax + settings.examMax;
  const subjects = data.subjects.map((row) => {
    const total = Math.round(((row.ca ?? 0) + (row.exam ?? 0)) * 100) / 100;
    const band = gradeFor(total, max, settings.gradeBands);
    return { subject: row.subject, ca: row.ca ?? 0, exam: row.exam ?? 0, total, grade: band.grade, remark: band.remark, classAverage: row.classAverage };
  });
  const grandTotal = Math.round(subjects.reduce((sum, r) => sum + r.total, 0) * 100) / 100;
  const passMark = settings.gradeBands.find((b) => b.grade === "E")?.min ?? 40;
  return {
    subjects,
    summary: {
      grandTotal,
      maxTotal: subjects.length * max,
      average: subjects.length ? Math.round((grandTotal / (subjects.length * max)) * 10000) / 100 : 0,
      passed: subjects.filter((r) => (r.total / max) * 100 >= passMark).length,
      count: subjects.length,
    },
  };
}

// ---- announcements, assignments, materials and the timetable (read only) ----
export const loadAnnouncements = async () => (await getAll("/announcements")).map(mapReaderAnnouncement);

// Pending until the due date has passed, Overdue after it, Closed once the teacher completed or cancelled it.
export const loadAssignments = async () => {
  const today = new Date().toISOString().slice(0, 10);
  return (await getAll("/assignments")).map(mapAssignment).map((a) => ({
    id: a.id,
    subject: a.subject,
    title: a.title,
    instructions: a.description,
    issued: a.createdOn,
    due: a.dueDate,
    status: a.backendStatus !== "active" ? "Closed" : a.dueDate < today ? "Overdue" : "Pending",
  }));
};

export const loadMaterials = async () => (await getAll("/materials")).map(mapMaterial).map((m) => ({
  id: m.id,
  title: m.title,
  description: m.description,
  subject: m.subject,
  type: m.type,
  url: m.link,
  date: m.createdOn,
  teacher: m.teacher,
}));

export const loadTimetable = async (classId) => {
  if (!classId) return { periods: [], days: [] };
  return mapTimetable(unwrap(await get(`/timetables/${classId}`)).timetable);
};

// ---- school settings (score maximums, grade boundaries, what a result shows) ----
export const loadSettings = () => fetchSchoolSettings();
