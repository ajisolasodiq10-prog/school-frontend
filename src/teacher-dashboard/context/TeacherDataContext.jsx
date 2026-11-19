import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import { sameResult } from "../utils/resultStatus.js";
import { errorText, mapSession, mapSheet, sheetBody } from "../../api/records.js";
import * as api from "../api/teacherApi.js";

// Classes, students, sessions, results, assignments, learning materials, announcements and the
// school calendar, school settings and the teacher's own editable profile details come from the
// database and every change is saved there. Nothing is kept in the browser.

const TeacherDataContext = createContext(null);

export function TeacherDataProvider({ children }) {
  const { user, profile } = useAuth();
  const [base, setBase] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [error, setError] = useState(false);

  const [assignments, setAssignments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [profileEdits, setProfileEdits] = useState({});

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.loadTeacherData(), api.loadSheets(), api.loadAnnouncements(), api.loadActivities(), api.loadAssignments(), api.loadMaterials(), api.loadSettings(), api.loadMyProfile()])
      .then(([data, rawSheets, announcements, activities, rawAssignments, rawMaterials, , myProfile]) => {
        if (cancelled) return;
        setProfileEdits(myProfile);
        setBase({ ...data, announcements, activities });
        setSheets(rawSheets);
        setAssignments(rawAssignments);
        setMaterials(rawMaterials);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sessions = useMemo(() => (base ? base.sessions.map(mapSession) : []), [base]);
  const currentSession = sessions.find((x) => x.current) || null;
  const currentTerm = currentSession?.terms.find((t) => t.current) || null;

  const subjectsById = useMemo(() => new Map((base?.subjects || []).map((x) => [x.id, x])), [base]);
  const students = useMemo(
    () => (base ? base.students.map((x) => ({
      id: x.studentId, // the student ID shown on screen; recordId is the database id
      recordId: x.id,
      name: `${x.lastName} ${x.firstName}`,
      gender: x.gender ? x.gender[0].toUpperCase() + x.gender.slice(1) : "",
      status: x.status,
      classId: x.currentClassId || "",
    })) : []),
    [base]
  );
  const studentCodes = useMemo(() => new Map(students.map((x) => [x.recordId, x.id])), [students]);

  // The classes of the current session in which this teacher has at least one subject.
  const allClasses = useMemo(() => {
    if (!base) return [];
    return base.classes.map((c) => {
      const pairs = c.subjectTeachers || [];
      const mine = new Set(pairs.filter((st) => st.teacherId === profile?.id).map((st) => st.subjectId));
      for (const sid of c.subjectIds || []) {
        if (!pairs.some((st) => st.subjectId === sid) && (profile?.subjectIds || []).includes(sid)) mine.add(sid);
      }
      const subjectIds = [...mine];
      return {
        id: c.id,
        name: c.displayName,
        room: c.room || "",
        sessionId: c.academicSessionId,
        subjectIds,
        subjects: subjectIds.map((sid) => subjectsById.get(sid)?.name).filter(Boolean),
        studentCount: students.filter((s) => s.classId === c.id).length,
      };
    });
  }, [base, profile, subjectsById, students]);
  const classes = useMemo(
    () => allClasses.filter((c) => c.sessionId === currentSession?.id && c.subjects.length > 0),
    [allClasses, currentSession]
  );

  const sessionsById = useMemo(() => new Map(sessions.map((x) => [x.id, x])), [sessions]);
  const results = useMemo(
    () => sheets.map((sheet) => mapSheet(sheet, { subjects: subjectsById, sessions: sessionsById, studentCodes })),
    [sheets, subjectsById, sessionsById, studentCodes]
  );

  // Teacher details come from the school's record of the teacher, plus the few editable ones.
  const teacher = useMemo(
    () => ({
      id: profile?.teacherId || (user?.username || "").toUpperCase(),
      title: profile?.title || "",
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: profile?.phone || "",
      department: profile?.department || "",
      role: "Teacher",
      qualification: profile?.qualification || "",
      bio: profile?.bio || "",
      session: currentSession?.name || "",
      term: currentTerm?.name || "",
      ...profileEdits,
    }),
    [user, profile, currentSession, currentTerm, profileEdits]
  );

  const getClassStudents = useCallback((classId) => students.filter((s) => s.classId === classId), [students]);
  const findResult = useCallback(
    (classId, subject, session, term) => results.find((r) => sameResult(r, classId, subject, session, term)) || null,
    [results]
  );

  // ---- results (saved in the database) ----
  // Saves the scores as a draft; with submit = true it is then sent for review.
  const saveResult = useCallback(async (record, submit = false) => {
    try {
      const klass = allClasses.find((c) => c.id === record.classId);
      const subjectId = klass?.subjectIds.find((sid) => subjectsById.get(sid)?.name === record.subject);
      const session = sessions.find((x) => x.name === record.session);
      const term = session?.terms.find((t) => t.name === record.term);
      if (!subjectId || !session || !term) return { ok: false, error: "Choose a class, subject, session and term that exist." };
      let sheet = await api.putSheet(sheetBody({ classId: record.classId, subjectId, sessionId: session.id, termId: term.id }, record.scores, getClassStudents(record.classId)));
      if (submit) sheet = await api.submitSheet(sheet.id);
      setSheets(await api.loadSheets());
      return { ok: true, sheet };
    } catch (e) {
      return { ok: false, error: errorText(e) };
    }
  }, [allClasses, subjectsById, sessions, getClassStudents]);

  // ---- assignments and learning materials (saved in the database) ----
  const subjectIdOf = (classId, subjectName) => {
    const klass = allClasses.find((c) => c.id === classId);
    return klass?.subjectIds.find((sid) => subjectsById.get(sid)?.name === subjectName);
  };

  // item: { id?, title, description, classId, subject, dueDate }. A class and subject cannot change once saved.
  const saveAssignment = useCallback(async (item) => {
    try {
      if (item.id) await api.updateAssignment(item.id, { title: item.title, description: item.description, dueDate: item.dueDate });
      else {
        const subjectId = subjectIdOf(item.classId, item.subject);
        if (!subjectId) return { ok: false, error: "Choose a subject you teach in this class." };
        await api.createAssignment({ classId: item.classId, subjectId, title: item.title, description: item.description, dueDate: item.dueDate });
      }
      setAssignments(await api.loadAssignments());
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorText(e) };
    }
  }, [allClasses, subjectsById]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteAssignment = useCallback(async (id) => {
    try {
      await api.deleteAssignment(id);
      setAssignments(await api.loadAssignments());
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorText(e) };
    }
  }, []);

  // item: { id?, title, description, classId, subject, type, link }
  const saveMaterial = useCallback(async (item) => {
    const type = item.type.toLowerCase();
    try {
      if (item.id) await api.updateMaterial(item.id, { title: item.title, description: item.description, type, link: item.link || null });
      else {
        const subjectId = subjectIdOf(item.classId, item.subject);
        if (!subjectId) return { ok: false, error: "Choose a subject you teach in this class." };
        await api.createMaterial({ classId: item.classId, subjectId, title: item.title, description: item.description, type, ...(item.link && { link: item.link }) });
      }
      setMaterials(await api.loadMaterials());
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorText(e) };
    }
  }, [allClasses, subjectsById]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteMaterial = useCallback(async (id) => {
    try {
      await api.deleteMaterial(id);
      setMaterials(await api.loadMaterials());
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorText(e) };
    }
  }, []);

  // Only the email, phone, qualification and profile information can be changed.
  const updateProfile = useCallback(async (fields) => {
    try {
      setProfileEdits(await api.saveMyProfile(fields));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorText(e) };
    }
  }, []);

  const value = {
    ready: Boolean(base),
    error,
    teacher,
    classes,
    students,
    allClasses,
    sessions,
    // School announcements the administrator has published for teachers (or everyone).
    announcements: base ? base.announcements : [],
    activities: base ? base.activities : [],
    results,
    assignments,
    materials,
    getClassStudents,
    findResult,
    saveResult,
    saveAssignment,
    deleteAssignment,
    saveMaterial,
    deleteMaterial,
    updateProfile,
  };

  return <TeacherDataContext.Provider value={value}>{children}</TeacherDataContext.Provider>;
}

export function useTeacherData() {
  const context = useContext(TeacherDataContext);
  if (!context) throw new Error("useTeacherData must be used inside <TeacherDataProvider>");
  return context;
}
