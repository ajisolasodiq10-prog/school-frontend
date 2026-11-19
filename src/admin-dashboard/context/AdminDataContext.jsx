import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { RESULT_STATUS as S } from "../../teacher-dashboard/utils/resultStatus.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { saveSchoolSettings, resetSchoolSettings, fetchSchoolSettings, DEFAULT_SETTINGS } from "../../config/schoolSettings.js";
import * as api from "../api/adminApi.js";
import { mapSheet } from "../../api/records.js";

// Students, teachers, classes, subjects, allocations, sessions/terms, accounts and the audit
// log are loaded from the database and every change is saved to it (see ../api/adminApi.js).
// Result review, PINs, announcements, the calendar, school settings and the admin's own profile are
// saved in the database too. Nothing is kept in the browser.
const ok = (extra = {}) => ({ ok: true, ...extra });
const fail = (error) => ({ ok: false, error });
const same = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
const errorText = (e) => {
  const first = Array.isArray(e?.details) && e.details[0];
  const extra = first?.message ? ` (${first.field ? `${first.field} ` : ""}${first.message})` : "";
  return `${e?.message || "Something went wrong. Please try again."}${extra}`;
};
const GENDER = { Female: "female", Male: "male" };
const STATUS_OUT = { Active: "active", Inactive: "inactive", Graduated: "graduated" };
const splitName = (fullName) => {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || "", middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : "", lastName: parts.length > 1 ? parts[parts.length - 1] : "" };
};
const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v !== undefined && v !== null));
const nullable = (v) => (v === "" || v === undefined ? null : v);

const LOADERS = {
  sessions: () => api.getAll("/academic-sessions"),
  classes: () => api.getAll("/classes"),
  subjects: () => api.getAll("/subjects"),
  teachers: () => api.getAll("/teachers"),
  students: () => api.getAll("/students"),
  accounts: () => api.loadAccounts(),
  sheets: () => api.getAll("/result-sheets"),
  pins: () => api.loadPins(),
  announcements: () => api.loadAnnouncements(),
  events: () => api.loadEvents(),
  settings: () => fetchSchoolSettings(),
  myProfile: () => api.loadMyProfile(),
};

const AdminDataContext = createContext(null);

export function AdminDataProvider({ children }) {
  const [raw, setRaw] = useState({ sessions: [], classes: [], subjects: [], teachers: [], students: [], accounts: [], sheets: [], pins: [], announcements: [], events: [], settings: DEFAULT_SETTINGS, myProfile: {} });
  const [rawAudit, setRawAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const announcements = raw.announcements;
  const events = raw.events;
  const { user } = useAuth();
  const settings = raw.settings;
  const profileEdits = raw.myProfile;

  // Loads some or all database lists. Used on start-up, by the retry button and after every change.
  const refresh = useCallback(async (...keys) => {
    const names = keys.length ? keys : Object.keys(LOADERS);
    const results = await Promise.all(names.map((k) => LOADERS[k]()));
    setRaw((prev) => ({ ...prev, ...Object.fromEntries(names.map((k, i) => [k, results[i]])) }));
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      await refresh();
    } catch (e) {
      setLoadError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    reload();
  }, [reload]);

  const refreshAudit = useCallback(async () => {
    try {
      setRawAudit(await api.loadAudit());
    } catch (e) {
      setLoadError(errorText(e));
    }
  }, []);

  // Runs a save, then re-reads the lists it affects so the screen always matches the database.
  const run = useCallback(async (fn, ...keys) => {
    try {
      const value = await fn();
      if (keys.length) await refresh(...keys);
      return ok(value === undefined ? {} : { value });
    } catch (e) {
      return fail(errorText(e));
    }
  }, [refresh]);

  // ---------- database records, in the shapes the pages use ----------
  const sessions = useMemo(() => raw.sessions.map(api.mapSession), [raw.sessions]);
  const sessionsById = useMemo(() => new Map(sessions.map((x) => [x.id, x])), [sessions]);
  const teachers = useMemo(() => raw.teachers.map(api.mapTeacher), [raw.teachers]);
  const teachersByRecordId = useMemo(() => new Map(teachers.map((t) => [t.recordId, t])), [teachers]);
  // Every class ever created (all sessions), so older students and results still show their class name.
  const allClasses = useMemo(() => raw.classes.map((c) => api.mapClass(c, teachersByRecordId)), [raw.classes, teachersByRecordId]);
  const classesById = useMemo(() => new Map(allClasses.map((c) => [c.id, c])), [allClasses]);
  const subjects = useMemo(() => raw.subjects.map(api.mapSubject), [raw.subjects]);
  const students = useMemo(() => raw.students.map((x) => api.mapStudent(x, classesById, sessionsById)), [raw.students, classesById, sessionsById]);
  const audit = useMemo(() => rawAudit.map(api.mapAudit), [rawAudit]);
  const allocations = useMemo(() => allClasses.flatMap((c) => c.subjectTeachers
    .map((st) => ({ id: `${c.id}:${st.subjectId}`, classId: c.id, subjectId: st.subjectId, teacherId: teachersByRecordId.get(st.teacherId)?.id || "" }))
    .filter((a) => a.teacherId)), [allClasses, teachersByRecordId]);

  // Name, ID and email come from the signed-in account; the rest can be edited.
  const profile = useMemo(() => ({
    id: (user?.username || "").toUpperCase(),
    role: "Administrator",
    title: profileEdits.title || "",
    fullName: profileEdits.fullName || user?.fullName || "",
    email: profileEdits.email || user?.email || "",
    phone: profileEdits.phone || "",
    bio: profileEdits.bio || "",
  }), [user, profileEdits]);

  const adminName = `${profile.title ? `${profile.title} ` : ""}${profile.fullName}`.trim();

  // The backend writes the audit trail itself for every change, so nothing is recorded here.
  // Kept so the pages that still call log() (Phase 2+ features) keep working.
  const log = useCallback(() => {}, []);

  // ---------- lookups ----------
  const classById = useCallback((id) => classesById.get(id), [classesById]);
  const className = useCallback((id) => classById(id)?.name || id || "-", [classById]);
  const teacherById = useCallback((id) => teachers.find((t) => t.id === id), [teachers]);
  const teacherName = useCallback((id) => {
    const t = teachers.find((x) => x.id === id);
    return t ? `${t.title} ${t.fullName}`.trim() : "-";
  }, [teachers]);
  const subjectById = useCallback((id) => subjects.find((s) => s.id === id), [subjects]);
  const subjectName = useCallback((id) => subjects.find((s) => s.id === id)?.name || id || "-", [subjects]);
  const studentById = useCallback((id) => students.find((s) => s.id === id), [students]);

  const currentSession = useMemo(() => sessions.find((s) => s.current) || sessions[0], [sessions]);
  const currentTerm = useMemo(
    () => currentSession?.terms.find((t) => t.id === currentSession.currentTermId) || currentSession?.terms[0],
    [currentSession]
  );

  // The classes of the current session are the ones managed on the Classes pages.
  const classes = useMemo(() => (currentSession ? allClasses.filter((c) => c.sessionId === currentSession.id) : allClasses), [allClasses, currentSession]);

  // ---------- results (saved in the database) ----------
  const studentCodes = useMemo(() => new Map(students.map((x) => [x.recordId, x.id])), [students]);
  const subjectsByRecordId = useMemo(() => new Map(raw.subjects.map((x) => [x.id, x])), [raw.subjects]);
  const allResults = useMemo(() => raw.sheets.map((sheet) => ({
    ...mapSheet(sheet, { subjects: subjectsByRecordId, sessions: sessionsById, studentCodes }),
    teacherId: teachersByRecordId.get(sheet.teacherId)?.id || "",
  })), [raw.sheets, subjectsByRecordId, sessionsById, studentCodes, teachersByRecordId]);
  // Drafts are never shown for review.
  const reviewableResults = useMemo(() => allResults.filter((r) => r.status !== S.DRAFT), [allResults]);
  const resultById = useCallback((id) => allResults.find((r) => r.id === id), [allResults]);

  const approveResult = useCallback((id) => run(() => api.approveSheet(id), "sheets"), [run]);
  const returnResult = useCallback((id, reason) => run(() => api.returnSheet(id, reason.trim()), "sheets"), [run]);
  const publishResult = useCallback((id) => run(() => api.publishSheet(id), "sheets"), [run]);

  // ---------- result PINs (saved in the database; a PIN is shown only when it is created) ----------
  const pins = useMemo(() => raw.pins.map((p) => ({
    id: p.id,
    studentRecordId: p.studentId,
    studentId: p.student?.studentId || studentCodes.get(p.studentId) || "",
    studentName: p.student?.name || "",
    sessionId: p.academicSessionId,
    termId: p.termId,
    session: sessionsById.get(p.academicSessionId)?.name || "",
    term: sessionsById.get(p.academicSessionId)?.terms.find((t) => t.id === p.termId)?.name || "",
    status: p.status === "active" ? "Unused" : p.status === "redeemed" ? "Used" : "Revoked",
    createdOn: String(p.generatedAt || "").slice(0, 10),
    usedOn: p.redeemedAt ? String(p.redeemedAt).slice(0, 10) : "",
  })), [raw.pins, studentCodes, sessionsById]);

  const generatePin = useCallback(async (studentCode, sessionId, termId) => {
    const st = students.find((x) => x.id === studentCode);
    if (!st) return fail("Student not found.");
    const res = await run(() => api.generatePin({ studentId: st.recordId, academicSessionId: sessionId, termId }), "pins");
    return res.ok ? ok({ issued: [{ studentId: st.id, name: st.name, pin: res.value.pinValue }], skipped: [] }) : res;
  }, [students, run]);

  const generatePinsForClass = useCallback(async (classId, sessionId, termId) => {
    const res = await run(() => api.generatePinsBulk({ classId, academicSessionId: sessionId, termId }), "pins");
    if (!res.ok) return res;
    return ok({
      issued: res.value.generated.map((g) => ({ studentId: g.student?.studentId || studentCodes.get(g.studentId) || "", name: g.student?.name || "", pin: g.pinValue })),
      skipped: res.value.skipped,
    });
  }, [studentCodes, run]);

  const revokePin = useCallback((id, reason) => run(() => api.revokePin(id, reason.trim()), "pins"), [run]);

  // ---------- students ----------
  const addStudent = useCallback(async (data) => {
    const cls = classes.find((c) => c.id === data.classId);
    if (!cls) return fail("Choose a class.");
    if (!data.dateOfBirth) return fail("Enter the date of birth.");
    const res = await run(async () => {
      const created = await api.createStudent(clean({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        gender: GENDER[data.gender],
        dateOfBirth: data.dateOfBirth,
        admissionDate: data.admissionDate,
        currentClassId: data.classId,
        house: (data.house || "").trim(),
        guardianName: (data.guardianName || "").trim(),
        guardianPhone: (data.guardianPhone || "").trim(),
        guardianEmail: (data.guardianEmail || "").trim(),
        address: (data.address || "").trim(),
      }));
      if (data.status && data.status !== "Active") await api.setStudentStatus(created.profile.id, STATUS_OUT[data.status]);
      return created;
    }, "students");
    if (!res.ok) return res;
    const { profile, activation } = res.value;
    return ok({ student: { id: profile.studentId, name: `${profile.lastName} ${profile.firstName}` }, activation });
  }, [classes, run]);

  const updateStudent = useCallback(async (id, data) => {
    const old = students.find((s) => s.id === id);
    if (!old) return fail("Student not found.");
    return run(async () => {
      await api.updateStudent(old.recordId, {
        ...clean({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          gender: GENDER[data.gender],
          dateOfBirth: data.dateOfBirth,
          admissionDate: data.admissionDate,
        }),
        // An emptied field is cleared in the database.
        house: nullable((data.house || "").trim()),
        guardianName: nullable((data.guardianName || "").trim()),
        guardianPhone: nullable((data.guardianPhone || "").trim()),
        guardianEmail: nullable((data.guardianEmail || "").trim()),
        address: nullable((data.address || "").trim()),
      });
      if (data.classId && data.classId !== old.classId) await api.setStudentClass(old.recordId, data.classId, "Changed by an administrator");
      if (data.status && data.status !== old.status) await api.setStudentStatus(old.recordId, STATUS_OUT[data.status]);
    }, "students");
  }, [students, run]);

  // Creates a new one-time activation link for a student who has not activated yet.
  const issueStudentActivation = useCallback(async (id) => {
    const st = students.find((s) => s.id === id);
    if (!st) return fail("Student not found.");
    return run(async () => {
      const res = await api.issueStudentActivationLink(st.recordId);
      return res.activation || res;
    });
  }, [students, run]);

  // ---------- teachers ----------
  const teacherBody = (data) => {
    const { firstName, middleName, lastName } = splitName(data.fullName);
    return { firstName, middleName, lastName };
  };

  const addTeacher = useCallback(async (data) => {
    if (teachers.some((t) => same(t.email, data.email))) return fail("A teacher with this email already exists.");
    const res = await run(async () => api.createTeacher(clean({
      ...teacherBody(data),
      email: data.email.trim(),
      title: data.title,
      phone: data.phone,
      department: data.department,
    })), "teachers");
    if (!res.ok) return res;
    const { profile, activation } = res.value;
    return ok({ teacher: { id: profile.teacherId }, activation });
  }, [teachers, run]);

  const updateTeacher = useCallback(async (id, data) => {
    const t = teachers.find((x) => x.id === id);
    if (!t) return fail("Teacher not found.");
    if (teachers.some((x) => x.id !== id && same(x.email, data.email))) return fail("Another teacher already uses this email.");
    return run(() => {
      const names = teacherBody(data);
      return api.updateTeacher(t.recordId, {
        firstName: names.firstName,
        middleName: nullable(names.middleName),
        lastName: names.lastName,
        email: data.email.trim(),
        title: nullable(data.title),
        phone: nullable(data.phone),
        department: nullable(data.department),
      });
    }, "teachers", "accounts");
  }, [teachers, run]);

  // Deactivation revokes access only. The teacher record, allocations and results are all kept.
  const setTeacherStatus = useCallback(async (id, status) => {
    const t = teachers.find((x) => x.id === id);
    if (!t) return fail("Teacher not found.");
    return run(() => (status === "Active" ? api.reactivateTeacher(t.recordId) : api.deactivateTeacher(t.recordId)), "teachers", "accounts");
  }, [teachers, run]);

  // ---------- classes ----------
  const addClass = useCallback(async ({ level, arm, room, classTeacherId }) => {
    const a = arm.trim().toUpperCase();
    if (!a) return fail("Enter an arm, for example A.");
    if (!currentSession) return fail("Create an academic session and make it current before adding classes.");
    if (classes.some((c) => c.sessionId === currentSession.id && c.level === level && c.arm === a)) return fail(`${level}${a} already exists.`);
    const res = await run(() => api.createClass(clean({
      name: level,
      arm: a,
      academicSessionId: currentSession.id,
      room: room.trim(),
      classTeacherId: teachers.find((t) => t.id === classTeacherId)?.recordId,
    })), "classes");
    return res.ok ? ok({ id: res.value.class.id }) : res;
  }, [classes, teachers, currentSession, run]);

  const updateClass = useCallback(async (id, { room, classTeacherId }) => run(() => api.updateClass(id, {
    room: nullable(room.trim()),
    classTeacherId: teachers.find((t) => t.id === classTeacherId)?.recordId || null,
  }), "classes"), [teachers, run]);

  const setClassTeacher = useCallback(async (classId, teacherId) => {
    if (!classes.some((c) => c.id === classId)) return fail("Class not found.");
    return run(() => api.updateClass(classId, { classTeacherId: teachers.find((t) => t.id === teacherId)?.recordId || null }), "classes");
  }, [classes, teachers, run]);

  // ---------- subjects & allocations ----------
  const addSubject = useCallback(async ({ name, code, category }) => {
    if (subjects.some((s) => same(s.name, name))) return fail("A subject with this name already exists.");
    if (subjects.some((s) => same(s.code, code))) return fail("That subject code is already used.");
    const res = await run(() => api.createSubject(clean({ name: name.trim(), code: code.trim().toUpperCase(), category })), "subjects");
    return res.ok ? ok({ id: res.value.subject.id }) : res;
  }, [subjects, run]);

  const updateSubject = useCallback(async (id, { name, code, category }) => {
    const old = subjects.find((s) => s.id === id);
    if (!old) return fail("Subject not found.");
    if (subjects.some((s) => s.id !== id && same(s.name, name))) return fail("Another subject already has this name.");
    if (!same(old.code, code)) return fail("A subject code cannot be changed after the subject is created.");
    return run(() => api.updateSubject(id, { name: name.trim(), category: nullable(category) }), "subjects");
  }, [subjects, run]);

  const findAllocation = useCallback((classId, subjectId) => allocations.find((a) => a.classId === classId && a.subjectId === subjectId), [allocations]);

  // Adds or replaces the teacher for a class + subject pair.
  const saveAllocation = useCallback(async ({ classId, subjectId, teacherId }) => {
    const t = teachers.find((x) => x.id === teacherId);
    if (!t) return fail("Choose a teacher.");
    if (t.status !== "Active") return fail("Deactivated teachers cannot be assigned.");
    return run(() => api.setSubjectTeacher(classId, subjectId, t.recordId), "classes", "teachers");
  }, [teachers, run]);

  const removeAllocation = useCallback(async (id) => {
    const a = allocations.find((x) => x.id === id);
    if (!a) return fail("Allocation not found.");
    return run(() => api.clearSubjectTeacher(a.classId, a.subjectId), "classes", "teachers");
  }, [allocations, run]);

  // ---------- sessions & terms ----------
  const termDefaults = (startYear) => ({
    "First Term": [`${startYear}-09-14`, `${startYear}-12-18`],
    "Second Term": [`${startYear + 1}-01-11`, `${startYear + 1}-04-02`],
    "Third Term": [`${startYear + 1}-04-26`, `${startYear + 1}-07-23`],
  });

  const addSession = useCallback(async (name) => {
    const m = name.trim().match(/^(\d{4})\/(\d{4})$/);
    if (!m || Number(m[2]) !== Number(m[1]) + 1) return fail("Use the format 2027/2028 (consecutive years).");
    if (sessions.some((x) => x.name === name.trim())) return fail("That session already exists.");
    const y = Number(m[1]);
    const defaults = termDefaults(y);
    return run(() => api.createSession({
      name: name.trim(),
      startDate: `${y}-09-01`,
      endDate: `${y + 1}-07-31`,
      terms: Object.entries(defaults).map(([n, [startDate, endDate]]) => ({ name: n, startDate, endDate })),
    }), "sessions");
  }, [sessions, run]);

  const addTerm = useCallback(async (sessionId, termName) => {
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) return fail("Session not found.");
    if (s.terms.some((t) => t.name === termName)) return fail(`${termName} already exists in this session.`);
    const [startDate, endDate] = termDefaults(Number(s.name.slice(0, 4)))[termName];
    return run(() => api.addTerm(sessionId, { name: termName, startDate, endDate }), "sessions");
  }, [sessions, run]);

  // Only one session and term is current at a time. No results are touched.
  const setCurrent = useCallback(async (sessionId, termId) => {
    const s = sessions.find((x) => x.id === sessionId);
    if (!s?.terms.some((x) => x.id === termId)) return fail("Term not found.");
    return run(async () => {
      if (!s.current) await api.setCurrentSession(sessionId);
      await api.setCurrentTerm(sessionId, termId);
    }, "sessions", "classes");
  }, [sessions, run]);

  const setTermStatus = useCallback(async (sessionId, termId, status) => {
    const s = sessions.find((x) => x.id === sessionId);
    if (!s?.terms.some((x) => x.id === termId)) return fail("Term not found.");
    if (status === "Closed" && s.current && s.currentTermId === termId) return fail("The current term cannot be closed. Set another term as current first.");
    return run(() => api.setTermStatus(sessionId, termId, status === "Open" ? "open" : "closed"), "sessions");
  }, [sessions, run]);

  // ---------- announcements (saved in the database) ----------
  const saveAnnouncement = useCallback(
    (data, id) => run(() => api.saveAnnouncement(data, id ? raw.announcements.find((x) => x.id === id) : undefined), "announcements"),
    [raw.announcements, run]
  );
  const deleteAnnouncement = useCallback((id) => run(() => api.archiveAnnouncement(id), "announcements"), [run]);

  // ---------- calendar (saved in the database) ----------
  const saveEvent = useCallback((data, id) => run(() => (id ? api.updateEvent(id, data) : api.createEvent(data)), "events"), [run]);
  const deleteEvent = useCallback((id) => run(() => api.deleteEvent(id), "events"), [run]);

  // ---------- accounts ----------
  const accountRows = useMemo(() => {
    const graduatedUsers = new Set(raw.students.filter((x) => x.status === "graduated").map((x) => x.userId));
    return raw.accounts.map(api.mapAccount).map((a) => (graduatedUsers.has(a.userId) ? { ...a, status: "Graduated" } : a));
  }, [raw.accounts, raw.students]);

  const setAccountStatus = useCallback(async (row, active) => {
    if (row.userId === user?.id || row.id === profile.id) return fail("You cannot deactivate your own account.");
    if (row.status === "Graduated") return fail("Graduated students keep read-only records.");
    if (row.kind === "teacher") {
      const t = teachers.find((x) => x.userId === row.userId);
      if (t) return setTeacherStatus(t.id, active ? "Active" : "Deactivated");
    }
    if (row.kind === "student") {
      const st = students.find((x) => x.userId === row.userId);
      if (st) return run(() => api.setStudentStatus(st.recordId, active ? "active" : "inactive"), "students", "accounts");
    }
    return run(() => api.setUserAccountStatus(row.userId, active), "accounts");
  }, [user, profile.id, teachers, students, setTeacherStatus, run]);

  // ---------- settings & profile (saved in the database) ----------
  const updateSettings = useCallback((next) => run(() => saveSchoolSettings(next), "settings"), [run]);
  const restoreSettings = useCallback(() => run(() => resetSchoolSettings(), "settings"), [run]);

  // The role and ID are locked: only these fields can change.
  const updateProfile = useCallback(({ fullName, email, phone, bio }) =>
    run(() => api.saveMyProfile({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), bio: bio.trim() }), "myProfile"), [run]);

  const value = {
    loading, loadError, reload, refreshAudit,
    students, teachers, classes, subjects, allocations, sessions, announcements, events, pins, generatePin, generatePinsForClass, revokePin, audit, accountRows, profile, settings,
    adminName, currentSession, currentTerm, allResults, results: allResults, reviewableResults,
    classById, className, teacherById, teacherName, subjectById, subjectName, studentById, resultById, findAllocation,
    addStudent, updateStudent, issueStudentActivation, addTeacher, updateTeacher, setTeacherStatus, addClass, updateClass, setClassTeacher,
    addSubject, updateSubject, saveAllocation, removeAllocation,
    addSession, addTerm, setCurrent, setTermStatus,
    approveResult, returnResult, publishResult,
    saveAnnouncement, deleteAnnouncement, saveEvent, deleteEvent, setAccountStatus,
    updateSettings, restoreSettings, updateProfile, log,
  };
  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used inside AdminDataProvider");
  return ctx;
}
