// Helpers shared by the admin, teacher and student dashboards for reading school records from
// the backend (everything is saved in the database; nothing here touches browser storage).
import { get } from "./client.js";

export const unwrap = (res) => (res && res.data !== undefined ? res.data : res);
export const day = (value) => (value ? String(value).slice(0, 10) : "");

// Lists come back as { items, page, limit, total } with at most 100 per page: read every page.
export async function getAll(path, query = {}, maxPages = 50) {
  const items = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const data = unwrap(await get(path, { query: { ...query, page, limit: 100 } }));
    items.push(...(data.items || []));
    if (items.length >= (data.total ?? 0) || !data.items?.length) break;
  }
  return items;
}

// Readable text for an error from the backend.
export function errorText(e) {
  const first = Array.isArray(e?.details) && e.details[0];
  const extra = first?.message ? ` (${first.field ? `${first.field} ` : ""}${first.message})` : "";
  return `${e?.message || "Something went wrong. Please try again."}${extra}`;
}

// ---- result sheets -------------------------------------------------------------------------
export const SHEET_STATUS = {
  draft: "Draft",
  submitted: "Submitted for Review",
  approved: "Approved",
  returned: "Returned for Correction",
  published: "Published",
};

export const mapSession = (s) => ({
  id: s.id,
  name: s.name,
  current: Boolean(s.isCurrent),
  status: s.status,
  terms: (s.terms || []).map((t) => ({ id: t.id, name: t.name, current: Boolean(t.isCurrent), status: t.status })),
});

// A sheet from the backend in the shape the result pages use. Scores are keyed by the student ID
// people see (STU-...), found through studentCodes (database id -> student ID).
export function mapSheet(sheet, { subjects, sessions, studentCodes }) {
  const subject = subjects.get(sheet.subjectId);
  const session = sessions.get(sheet.academicSessionId);
  const term = session?.terms.find((t) => t.id === sheet.termId);
  const scores = {};
  for (const row of sheet.scores || []) {
    const code = studentCodes.get(row.studentId);
    if (code) scores[code] = { ca: row.ca ?? "", exam: row.exam ?? "" };
  }
  return {
    id: sheet.id,
    classId: sheet.classId,
    subjectId: sheet.subjectId,
    subject: subject?.name || "Subject",
    sessionId: sheet.academicSessionId,
    session: session?.name || "",
    termId: sheet.termId,
    term: term?.name || "",
    status: SHEET_STATUS[sheet.status] || sheet.status,
    scores,
    teacherRecordId: sheet.teacherId,
    createdOn: day(sheet.createdAt),
    updatedOn: day(sheet.updatedAt),
    submittedOn: day(sheet.submittedAt) || null,
    reviewedOn: day(sheet.reviewedAt) || null,
    reviewedBy: sheet.reviewedByName || null,
    publishedOn: day(sheet.publishedAt) || null,
    publishedBy: sheet.publishedByName || null,
    feedback: sheet.feedback ? { from: `${sheet.feedback.byName || "Administrator"} (Administrator)`, date: day(sheet.feedback.at), message: sheet.feedback.message } : null,
  };
}

// The body the backend wants for saving a sheet.
export function sheetBody({ classId, subjectId, sessionId, termId }, scores, students) {
  const recordIds = new Map(students.map((s) => [s.id, s.recordId]));
  return {
    classId,
    subjectId,
    academicSessionId: sessionId,
    termId,
    scores: Object.entries(scores)
      .filter(([code]) => recordIds.has(code))
      .map(([code, v]) => ({
        studentId: recordIds.get(code),
        ca: v.ca === "" || v.ca == null ? null : Number(v.ca),
        exam: v.exam === "" || v.exam == null ? null : Number(v.exam),
      })),
  };
}

// ---- announcements, calendar, assignments, materials, timetable ---------------------------------
// The backend audiences are public / students / staff / class; the pages say everyone / all-students /
// all-teachers / class.
export const AUDIENCE_OUT = { everyone: "public", "all-students": "students", "all-teachers": "staff", class: "class" };
export const AUDIENCE_IN = { public: "everyone", students: "all-students", staff: "all-teachers", class: "class" };

// An announcement as the admin pages show it. Scheduled ones count as Published (their date is in the future).
export const mapAnnouncement = (a) => ({
  id: a.id,
  title: a.title,
  message: a.body,
  audience: { type: AUDIENCE_IN[a.audience] || a.audience, classId: a.classId || "" },
  status: a.status === "draft" ? "Draft" : "Published",
  backendStatus: a.status,
  publishDate: day(a.startsAt) || day(a.publishedAt) || day(a.createdAt),
  createdBy: a.createdBy || "",
});

// An announcement as teachers and students read it.
export const mapReaderAnnouncement = (a) => ({
  id: a.id,
  title: a.title,
  message: a.body,
  category: a.category ? a.category[0].toUpperCase() + a.category.slice(1) : "General",
  date: day(a.startsAt) || day(a.publishedAt),
});

export const EVENT_TYPE_OUT = {
  Examination: "examination",
  Resumption: "resumption",
  Holiday: "holiday",
  "Parent-Teacher Meeting": "meeting",
  "School Event": "event",
  Deadline: "deadline",
};
export const EVENT_TYPE_IN = Object.fromEntries(Object.entries(EVENT_TYPE_OUT).map(([label, value]) => [value, label]));

export const mapEvent = (e) => ({
  id: e.id,
  type: EVENT_TYPE_IN[e.type] || "School Event",
  title: e.title,
  startDate: day(e.startDate),
  endDate: day(e.endDate),
  description: e.description || "",
});

export const MATERIAL_TYPE_IN = { notes: "Notes", document: "Document", link: "Link" };

// A material as the teacher and student pages show it (class and subject come with names).
export const mapMaterial = (m) => ({
  id: m.id,
  title: m.title,
  description: m.description,
  classId: m.classId,
  subjectId: m.subjectId,
  subject: m.subject?.name || "",
  type: MATERIAL_TYPE_IN[m.type] || m.type,
  link: m.link || "",
  createdOn: day(m.createdAt),
  teacher: m.teacher?.name || "",
});

export const mapAssignment = (a) => ({
  id: a.id,
  title: a.title,
  description: a.description || "",
  classId: a.classId,
  subjectId: a.subjectId,
  subject: a.subject?.name || "",
  teacher: a.teacher?.name || "",
  createdOn: day(a.issueDate),
  dueDate: day(a.dueDate),
  backendStatus: a.status,
});

// The weekly timetable in the shape the Student Portal draws: { periods:[{time, breakLabel}], days:[{name, lessons}] }.
export const mapTimetable = (t) => ({
  periods: (t.periods || []).map((p) => ({ time: `${p.start} - ${p.end}`, breakLabel: p.breakLabel || "" })),
  days: (t.days || []).map((d) => ({ name: d.name, lessons: (d.lessons || []).map((l) => ({ subject: l.subject || "-", room: l.room || "" })) })),
});
