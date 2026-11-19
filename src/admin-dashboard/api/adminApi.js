// Admin Dashboard <-> school backend. Every record the admin pages show for students,
// teachers, classes, subjects, allocations, sessions, accounts and the audit log is read
// from and saved to the database through these functions. Nothing is kept in the browser.
//
// The backend answers { status: "success", data }. Lists come back as { items, page, limit,
// total } with a maximum page size of 100, so getAll() walks every page.
import { get, post, patch, put, del } from "../../api/client.js";
import { AUDIENCE_OUT, EVENT_TYPE_OUT, mapAnnouncement, mapEvent } from "../../api/records.js";

const unwrap = (res) => (res && res.data !== undefined ? res.data : res);
const day = (value) => (value ? String(value).slice(0, 10) : "");
const cap = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : "");

export async function getAll(path, query = {}, maxPages = 50) {
  const items = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const data = unwrap(await get(path, { query: { ...query, page, limit: 100 } }));
    items.push(...(data.items || []));
    if (items.length >= (data.total ?? 0) || !data.items?.length) break;
  }
  return items;
}

// ---------------------------------------------------------------- mappers

export function mapSession(s) {
  const terms = (s.terms || []).map((t) => ({
    id: t.id,
    name: t.name,
    start: day(t.startDate),
    end: day(t.endDate),
    status: t.status === "open" ? "Open" : "Closed",
  }));
  const current = (s.terms || []).find((t) => t.isCurrent);
  return { id: s.id, name: s.name, current: Boolean(s.isCurrent), currentTermId: current?.id || null, status: s.status, terms };
}

export function mapSubject(s) {
  return { id: s.id, name: s.name, code: s.code, category: s.category || "", active: s.status === "active" };
}

export function mapClass(c, teachersByRecordId = new Map()) {
  return {
    id: c.id,
    level: c.name,
    arm: c.arm,
    name: c.displayName || `${c.name}${c.arm}`,
    room: c.room || "",
    classTeacherId: teachersByRecordId.get(c.classTeacherId)?.id || "",
    sessionId: c.academicSessionId,
    status: c.status,
    subjectIds: c.subjectIds || [],
    subjectTeachers: c.subjectTeachers || [],
  };
}

export function mapTeacher(t) {
  const fullName = [t.firstName, t.middleName, t.lastName].filter(Boolean).join(" ");
  return {
    id: t.teacherId, // the staff ID shown on screen (TCH-0001); recordId is the database id
    recordId: t.id,
    userId: t.userId,
    title: t.title || "",
    fullName,
    firstName: t.firstName,
    middleName: t.middleName || "",
    lastName: t.lastName,
    email: t.account?.email || "",
    username: t.account?.username || "",
    phone: t.phone || "",
    department: t.department || "",
    status: t.employmentStatus === "active" || t.employmentStatus === "on_leave" ? "Active" : "Deactivated",
    employmentStatus: t.employmentStatus,
  };
}

const STUDENT_STATUS = { active: "Active", inactive: "Inactive", graduated: "Graduated", transferred: "Inactive" };

export function mapStudent(s, classesByRecordId = new Map(), sessionsById = new Map()) {
  const cls = classesByRecordId.get(s.currentClassId);
  return {
    id: s.studentId, // the student ID shown on screen; recordId is the database id
    recordId: s.id,
    userId: s.userId || null,
    name: `${s.lastName} ${s.firstName}`,
    firstName: s.firstName,
    middleName: s.middleName || "",
    lastName: s.lastName,
    gender: cap(s.gender),
    dateOfBirth: day(s.dateOfBirth),
    classId: s.currentClassId || "",
    admissionDate: day(s.admissionDate),
    house: s.house || "",
    guardianName: s.guardianName || "",
    guardianPhone: s.guardianPhone || "",
    guardianEmail: s.guardianEmail || "",
    address: s.address || "",
    status: STUDENT_STATUS[s.status] || "Inactive",
    rawStatus: s.status,
    session: cls ? sessionsById.get(cls.sessionId)?.name || "" : "",
  };
}

export function mapAudit(a) {
  const category = cap(String(a.entityType || "other").replace(/_/g, " "));
  const action = cap(String(a.action || "").replace(/[._]/g, " "));
  return {
    id: a.id,
    timestamp: a.createdAt,
    action,
    category,
    user: a.actorName || cap(a.actorRole) || "System",
    record: a.student ? `${a.student.name} (${a.student.studentId})` : a.entityId || "-",
    description: a.summary || "",
  };
}

export function mapAccount(u) {
  return {
    id: (u.username || "").toUpperCase(),
    userId: u.id,
    name: u.fullName,
    email: u.email || "",
    role: cap(u.role === "admin" ? "administrator" : u.role),
    status: u.status === "active" ? "Active" : "Deactivated",
    accountStatus: u.accountStatus || "",
    kind: u.role,
  };
}

// ---------------------------------------------------------------- loading

export async function loadAll() {
  const [sessions, classes, subjects, teachers, students] = await Promise.all([
    getAll("/academic-sessions"),
    getAll("/classes"),
    getAll("/subjects"),
    getAll("/teachers"),
    getAll("/students"),
  ]);
  return { sessions, classes, subjects, teachers, students };
}

export const loadAudit = () => getAll("/audit-logs", {}, 10);
export const loadAccounts = () => getAll("/accounts");

// ---------------------------------------------------------------- students
export const createStudent = async (body) => unwrap(await post("/students", body)); // { user, profile, activation }
export const updateStudent = async (id, body) => unwrap(await patch(`/students/${id}`, body));
export const setStudentClass = async (id, classId, reason) => unwrap(await put(`/students/${id}/class`, { classId, reason }));
export const setStudentStatus = async (id, status) => unwrap(await post(`/students/${id}/status`, { status }));
export const getStudentHistory = async (id) => unwrap(await get(`/students/${id}/history`));
export const issueStudentActivationLink = async (id) => unwrap(await post(`/students/${id}/activation-link`, {}));

// ---------------------------------------------------------------- teachers
export const createTeacher = async (body) => unwrap(await post("/teachers", body));
export const updateTeacher = async (id, body) => unwrap(await patch(`/teachers/${id}`, body));
export const deactivateTeacher = async (id) => unwrap(await post(`/teachers/${id}/deactivate`, {}));
export const reactivateTeacher = async (id) => unwrap(await post(`/teachers/${id}/reactivate`, {}));

// ---------------------------------------------------------------- classes & subjects
export const createClass = async (body) => unwrap(await post("/classes", body));
export const updateClass = async (id, body) => unwrap(await patch(`/classes/${id}`, body));
export const setSubjectTeacher = async (classId, subjectId, teacherId) =>
  unwrap(await put(`/classes/${classId}/subject-teachers/${subjectId}`, { teacherId }));
export const clearSubjectTeacher = async (classId, subjectId) => unwrap(await del(`/classes/${classId}/subject-teachers/${subjectId}`));
export const createSubject = async (body) => unwrap(await post("/subjects", body));
export const updateSubject = async (id, body) => unwrap(await patch(`/subjects/${id}`, body));

// ---------------------------------------------------------------- sessions & terms
export const createSession = async (body) => unwrap(await post("/academic-sessions", body));
export const addTerm = async (sessionId, body) => unwrap(await post(`/academic-sessions/${sessionId}/terms`, body));
export const setCurrentSession = async (sessionId) => unwrap(await post(`/academic-sessions/${sessionId}/set-current`, {}));
export const setCurrentTerm = async (sessionId, termId) => unwrap(await post(`/academic-sessions/${sessionId}/terms/${termId}/set-current`, {}));
export const setTermStatus = async (sessionId, termId, status) => unwrap(await patch(`/academic-sessions/${sessionId}/terms/${termId}`, { status }));

// ---------------------------------------------------------------- result sheets (review workflow)
export const approveSheet = async (id) => unwrap(await post(`/result-sheets/${id}/approve`, {})).sheet;
export const returnSheet = async (id, reason) => unwrap(await post(`/result-sheets/${id}/return`, { reason })).sheet;
export const publishSheet = async (id) => unwrap(await post(`/result-sheets/${id}/publish`, {})).sheet;

// ---------------------------------------------------------------- result PINs
export const loadPins = () => getAll("/result-pins");
export const generatePin = async (body) => unwrap(await post("/result-pins", body)); // { pin, pinValue }
export const generatePinsBulk = async (body) => unwrap(await post("/result-pins/bulk", body)); // { generated, skipped, counts }
export const revokePin = async (id, reason) => unwrap(await post(`/result-pins/${id}/revoke`, { reason }));

// ---------------------------------------------------------------- accounts
export const setUserAccountStatus = async (userId, active) => unwrap(await post(`/accounts/${userId}/${active ? "activate" : "deactivate"}`, {}));

// ---------------------------------------------------------------- announcements
export const loadAnnouncements = async () => (await getAll("/announcements")).filter((a) => a.status !== "archived").map(mapAnnouncement);

const today = () => new Date().toISOString().slice(0, 10);
const publishOrSchedule = async (id, publishDate) =>
  publishDate <= today() ? post(`/announcements/${id}/publish`, {}) : post(`/announcements/${id}/schedule`, { startsAt: publishDate });

// data: { title, message, audience:{type, classId}, status:"Draft"|"Published", publishDate }
// existing: the announcement being edited (as mapped by mapAnnouncement), or undefined for a new one.
export async function saveAnnouncement(data, existing) {
  const audience = AUDIENCE_OUT[data.audience.type];
  const body = { title: data.title, body: data.message, audience, ...(audience === "class" && { classId: data.audience.classId }) };
  const wantsPublish = data.status === "Published";

  if (!existing) {
    const created = unwrap(await post("/announcements", { ...body, category: "general", startsAt: data.publishDate })).announcement;
    if (wantsPublish) await publishOrSchedule(created.id, data.publishDate);
    return created.id;
  }

  if (existing.backendStatus === "draft") {
    await patch(`/announcements/${existing.id}`, { ...body, classId: audience === "class" ? data.audience.classId : null, startsAt: data.publishDate });
    if (wantsPublish) await publishOrSchedule(existing.id, data.publishDate);
    return existing.id;
  }

  // Already published or scheduled: only the wording (and a scheduled start date) can still change.
  if (!wantsPublish) throw new Error("A published announcement cannot go back to a draft. Delete it instead.");
  if (existing.audience.type !== data.audience.type || (audience === "class" && existing.audience.classId !== data.audience.classId)) {
    throw new Error("The audience cannot be changed after an announcement is published. Delete it and create a new one.");
  }
  const scheduled = existing.publishDate > today();
  const dateChanged = data.publishDate !== existing.publishDate;
  if (scheduled && dateChanged && data.publishDate > today()) {
    await patch(`/announcements/${existing.id}`, { title: data.title, body: data.message, startsAt: data.publishDate });
  } else {
    await patch(`/announcements/${existing.id}`, { title: data.title, body: data.message });
    if (scheduled && dateChanged) await post(`/announcements/${existing.id}/publish`, {});
  }
  return existing.id;
}

// "Delete" archives the announcement: it disappears for everyone; the record stays in the database.
export const archiveAnnouncement = async (id) => unwrap(await post(`/announcements/${id}/archive`, {}));

// ---------------------------------------------------------------- calendar
export const loadEvents = async () => (await getAll("/calendar-events")).map(mapEvent);
const eventBody = (d) => ({ type: EVENT_TYPE_OUT[d.type], title: d.title, startDate: d.startDate, ...(d.description && { description: d.description }), ...(d.endDate && { endDate: d.endDate }) });
export const createEvent = async (data) => unwrap(await post("/calendar-events", eventBody(data)));
export const updateEvent = async (id, data) =>
  unwrap(await patch(`/calendar-events/${id}`, { ...eventBody(data), description: data.description || null, endDate: data.endDate || null }));
export const deleteEvent = async (id) => unwrap(await del(`/calendar-events/${id}`));

// ---------------------------------------------------------------- timetable
export const loadTimetable = async (classId) => unwrap(await get(`/timetables/${classId}`)).timetable;
export const saveTimetable = async (classId, body) => unwrap(await put(`/timetables/${classId}`, body)).timetable;

// ---------------------------------------------------------------- my profile
export const loadMyProfile = async () => unwrap(await get("/profile/me")).profile;
export const saveMyProfile = async (body) => unwrap(await patch("/profile/me", body)).profile;
