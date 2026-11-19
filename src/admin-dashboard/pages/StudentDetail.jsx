import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import { formatDate } from "../../config/content.js";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import FormField from "../../teacher-dashboard/components/FormField.jsx";
import ConfirmDialog from "../../teacher-dashboard/components/ConfirmDialog.jsx";
import Flash from "../../teacher-dashboard/components/Flash.jsx";
import useFlash from "../../teacher-dashboard/hooks/useFlash.js";
import { RESULT_STATUS as S } from "../../teacher-dashboard/utils/resultStatus.js";
import StatusPill from "../components/StatusPill.jsx";
import ActivationLinkPanel from "../components/ActivationLinkPanel.jsx";
import { getStudentHistory } from "../api/adminApi.js";
import { useAdminData } from "../context/AdminDataContext.jsx";
import { STUDENT_STATUSES } from "../config/constants.js";
import { checkRow, gradeFor, totalMax } from "../utils/scoring.js";

export default function StudentDetail() {
  const { studentId } = useParams();
  const { studentById, classes, classById, results, settings, updateStudent, issueStudentActivation } = useAdminData();
  const student = studentById(studentId);
  usePageTitle(student ? student.name : "Student not found");
  const [change, setChange] = useState(null); // { type: "class" | "status", value }
  const [classChoice, setClassChoice] = useState("");
  const [statusChoice, setStatusChoice] = useState("");
  const [flash, setFlash] = useFlash();
  const [history, setHistory] = useState(null);
  const [activation, setActivation] = useState(null);
  const [busy, setBusy] = useState(false);

  // The real class history comes from the database.
  const recordId = student?.recordId;
  useEffect(() => {
    if (!recordId) return undefined;
    let live = true;
    getStudentHistory(recordId).then((h) => { if (live) setHistory(h); }).catch(() => { if (live) setHistory({ classHistory: [] }); });
    return () => { live = false; };
  }, [recordId, student?.classId]);

  if (!student) {
    return (
      <EmptyState title="Student not found">
        <p>We could not find that student.</p>
        <Button to="/admin/students" variant="primary" size="small">Back to Students</Button>
      </EmptyState>
    );
  }

  const cls = classById(student.classId);
  const className = cls?.name || "No class";
  // Class history: one row per class the student has been in, newest first.
  const placements = [...(history?.classHistory || [])].reverse()
    .map((h, i) => ({ key: `${h.classId}-${i}`, session: h.academicSessionName || "Session", className: h.className || "-" }));
  // Published results only. Drafts and unpublished results are never shown as results.
  const published = results.filter((r) => r.status === S.PUBLISHED && r.scores[student.id]);

  const confirmChange = async () => {
    const next = change.type === "class" ? { classId: change.value } : { status: change.value };
    const result = await updateStudent(student.id, { ...student, ...next });
    setChange(null);
    setClassChoice("");
    setStatusChoice("");
    setFlash(result.ok
      ? { tone: "success", message: change.type === "class" ? `Moved to ${classById(change.value)?.name}.` : `Status updated to ${change.value}.` }
      : { tone: "error", message: result.error });
  };

  const newLink = async () => {
    setBusy(true);
    const result = await issueStudentActivation(student.id);
    setBusy(false);
    if (result.ok && result.value?.link) setActivation(result.value);
    else setFlash({ tone: "error", message: result.ok ? "No link was returned. The account may already be active." : result.error });
  };

  const details = [
    ["Student ID", student.id], ["Class and arm", className], ["Gender", student.gender],
    ["Admission date", formatDate(student.admissionDate)], ["Session", student.session],
    ["House", student.house || "-"], ["Parent or guardian", student.guardianName || "-"],
    ["Guardian phone", student.guardianPhone || "-"], ["Guardian email", student.guardianEmail || "-"],
    ["Home address", student.address || "-"],
  ];

  return (
    <>
      <Link to="/admin/students" className="sp-back-link">
        All students
      </Link>
      <PageTitle title={student.name} description={`${student.id} · ${className}`}>
        <StatusPill label={student.status} />
      </PageTitle>
      <Flash flash={flash} onDismiss={() => setFlash(null)} />
      {activation && <ActivationLinkPanel title={`Activation link for ${student.name}`} id={student.id} link={activation.link} expiresAt={activation.expiresAt} onClose={() => setActivation(null)} />}

      <div className="sp-two-col">
        <section className="sp-card sp-detail-card" aria-labelledby="sd-details">
          <div className="ad-profile-head">
            <h2 id="sd-details">Student details</h2>
          </div>
          <dl className="sp-details">
            {details.map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </section>

        <section className="sp-card sp-detail-card" aria-labelledby="sd-manage">
          <h2 id="sd-manage">Class and status</h2>
          <div className="tp-form">
            <div className="ad-inline-form">
              <FormField id="sd-class" label="Assign to class and arm" as="select" value={classChoice} onChange={(e) => setClassChoice(e.target.value)}
                options={[{ value: "", label: "Choose a class..." }, ...classes.filter((c) => c.id !== student.classId).map((c) => ({ value: c.id, label: c.name }))]} />
              <Button variant="outline" size="small" disabled={!classChoice} onClick={() => setChange({ type: "class", value: classChoice })}>Move student</Button>
            </div>
            <div className="ad-inline-form">
              <FormField id="sd-status" label="Update status" as="select" value={statusChoice} onChange={(e) => setStatusChoice(e.target.value)}
                options={[{ value: "", label: "Choose a status..." }, ...STUDENT_STATUSES.filter((s) => s !== student.status).map((s) => ({ value: s, label: s }))]} />
              <Button variant="outline" size="small" disabled={!statusChoice} onClick={() => setChange({ type: "status", value: statusChoice })}>Update status</Button>
            </div>
            <p className="form-note">Changing a status never deletes the student&apos;s records.</p>
            <div className="ad-inline-form">
              <Button variant="outline" size="small" disabled={busy} onClick={newLink}>{busy ? "Creating link..." : "New activation link"}</Button>
            </div>
          </div>
        </section>
      </div>

      <section className="sp-block" aria-labelledby="sd-history">
        <h2 id="sd-history">Academic history</h2>
        <h3>Classes by session</h3>
        <ul className="pill-list">
          {placements.length === 0 ? <li>No class history yet.</li> : placements.map((p) => <li key={p.key}>{p.session}: {p.className}</li>)}
        </ul>
        <h3 className="spaced-heading">Published results</h3>
        {published.length === 0 ? (
          <p className="sp-muted">No published results for this student.</p>
        ) : (
          <div className="sp-table-wrap" role="region" aria-label="Published results" tabIndex={0}>
            <table className="sp-table tp-stack-table">
              <caption className="visually-hidden">Published results</caption>
              <thead>
                <tr>
                  <th scope="col">Session</th><th scope="col">Term</th><th scope="col">Subject</th>
                  <th scope="col" className="num">Total ({totalMax(settings)})</th><th scope="col">Grade</th>
                </tr>
              </thead>
              <tbody>
                {published.map((r) => {
                  const row = checkRow(r.scores[student.id], settings);
                  return (
                    <tr key={r.id}>
                      <td data-label="Session">{r.session}</td>
                      <td data-label="Term">{r.term}</td>
                      <th scope="row" data-label="Subject">{r.subject}</th>
                      <td className="num" data-label="Total">{row.total ?? "-"}</td>
                      <td data-label="Grade">{row.total === null ? "-" : <span className={`sp-grade sp-grade-${gradeFor(row.total, settings)}`}>{gradeFor(row.total, settings)}</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(change)}
        title={change?.type === "class" ? "Move this student?" : "Update this student's status?"}
        confirmLabel="Yes, continue"
        onConfirm={confirmChange}
        onCancel={() => setChange(null)}
      >
        {change && (
          <p>
            {change.type === "class"
              ? <>Move <strong>{student.name}</strong> from {className} to <strong>{classById(change.value)?.name}</strong>?</>
              : <>Change <strong>{student.name}</strong> from {student.status} to <strong>{change.value}</strong>?</>}{" "}
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
