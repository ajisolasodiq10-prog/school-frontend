import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import { errorText } from "../../api/records.js";
import * as api from "../api/studentApi.js";

// Shares the student's details and the unlocked/locked state of each term with every portal
// page. Everything comes from the school database; a PIN is checked by the backend.
const StudentPortalContext = createContext(null);

export function StudentPortalProvider({ children }) {
  const { user, profile } = useAuth();
  const [terms, setTerms] = useState(null);
  const [base, setBase] = useState({ classes: [], sessions: [] });
  const [error, setError] = useState(false);

  const recordId = profile?.id;

  useEffect(() => {
    let cancelled = false;
    // The school settings (score maximums, grade boundaries) are read first: the result pages use them.
    api.loadSettings()
      .then(() => Promise.all([api.loadStudentBase().catch(() => ({ classes: [], sessions: [] })), recordId ? api.loadTerms(recordId) : Promise.resolve([])]))
      .then(([baseData, termData]) => {
        if (cancelled) return;
        setBase(baseData);
        setTerms(termData);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [recordId]);

  // Checks the PIN at the school's records system. On success the terms are read again so the
  // term shows as unlocked everywhere.
  const unlockTerm = useCallback(async (key, pin) => {
    try {
      await api.redeemPin(recordId, key, pin);
      setTerms(await api.loadTerms(recordId));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorText(e) };
    }
  }, [recordId]);

  const getTermResults = useCallback((key) => api.loadTermResults(recordId, key), [recordId]);

  // The student's details come from the school's record of the student.
  const student = useMemo(() => {
    const klass = base.classes.find((c) => c.id === profile?.currentClassId);
    const session = base.sessions.find((s) => s.isCurrent);
    const term = session?.terms.find((t) => t.isCurrent);
    const fullName = user?.fullName || [profile?.firstName, profile?.lastName].filter(Boolean).join(" ");
    return {
      id: profile?.studentId || (user?.username || "").toUpperCase(),
      fullName,
      firstName: profile?.firstName || fullName.split(" ")[0] || "",
      studentEmail: user?.email || "",
      classId: profile?.currentClassId || "",
      className: klass?.name || "",
      arm: klass?.arm || "",
      house: profile?.house || "",
      admissionYear: profile?.admissionDate ? String(profile.admissionDate).slice(0, 4) : "",
      session: session?.name || "",
      term: term?.name || "",
      gender: profile?.gender ? profile.gender[0].toUpperCase() + profile.gender.slice(1) : "",
      dateOfBirth: profile?.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : "",
      guardianName: profile?.guardianName || "",
      guardianPhone: profile?.guardianPhone || "",
      guardianEmail: profile?.guardianEmail || "",
      address: profile?.address || "",
    };
  }, [user, profile, base]);

  const value = { student, terms, ready: Boolean(terms), error, unlockTerm, getTermResults };

  return <StudentPortalContext.Provider value={value}>{children}</StudentPortalContext.Provider>;
}

export function useStudentPortal() {
  const context = useContext(StudentPortalContext);
  if (!context) {
    throw new Error("useStudentPortal must be used inside <StudentPortalProvider>");
  }
  return context;
}
