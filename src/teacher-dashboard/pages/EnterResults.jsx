import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import NoClasses from "../components/NoClasses.jsx";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import { formatDate } from "../../config/content.js";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import FormField from "../components/FormField.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Flash from "../components/Flash.jsx";
import TeacherStatusBadge from "../components/TeacherStatusBadge.jsx";
import useFlash from "../hooks/useFlash.js";
import { useTeacherData } from "../context/TeacherDataContext.jsx";
import { CA_MAX, EXAM_MAX, TOTAL_MAX, TERMS } from "../config/scoreConfig.js";
import { validateRows, totalOf, gradeFor, summarise } from "../utils/scores.js";
import { RESULT_STATUS, isEditable } from "../utils/resultStatus.js";
import { todayISO } from "../utils/dates.js";

// Turns a saved record into the { studentId: { ca, exam } } map the form edits.
function valuesFromRecord(record, students) {
  const values = {};
  students.forEach((student) => {
    const saved = record?.scores?.[student.id];
    values[student.id] = { ca: saved?.ca ?? "", exam: saved?.exam ?? "" };
  });
  return values;
}

function EnterResultsInner() {
  usePageTitle("Enter Results");
  const [params] = useSearchParams();
  const { teacher, classes, sessions, getClassStudents, findResult, saveResult } = useTeacherData();
  const SESSIONS = sessions.map((x) => x.name);
  const [saving, setSaving] = useState(false);

  // Start from the link (?class=...&subject=...) when there is one.
  const initialSelection = useMemo(() => {
    const chosen = classes.find((c) => c.id === params.get("class")) || classes[0];
    const subject = chosen.subjects.includes(params.get("subject")) ? params.get("subject") : chosen.subjects[0];
    return {
      classId: chosen.id,
      subject,
      session: SESSIONS.includes(params.get("session")) ? params.get("session") : teacher.session || SESSIONS[0],
      term: TERMS.includes(params.get("term")) ? params.get("term") : teacher.term || TERMS[0],
    };
    // Only needed once, when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selection, setSelection] = useState(initialSelection);
  const students = getClassStudents(selection.classId);
  const record = findResult(selection.classId, selection.subject, selection.session, selection.term);
  const editable = isEditable(record);
  const className = classes.find((c) => c.id === selection.classId).name;

  const [values, setValues] = useState(() => valuesFromRecord(record, students));
  const [dirty, setDirty] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [pendingSelection, setPendingSelection] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [flash, setFlash] = useFlash();

  // Errors for typed scores. Blank scores only count as errors after the
  // teacher tries to submit.
  const { errors, count: errorCount } = validateRows(values, students, showMissing);
  const summary = summarise(values, students);

  const applySelection = (next) => {
    setSelection(next);
    setValues(valuesFromRecord(findResult(next.classId, next.subject, next.session, next.term), getClassStudents(next.classId)));
    setDirty(false);
    setShowMissing(false);
    setFlash(null);
  };

  const changeSelection = (field, value) => {
    const next = { ...selection, [field]: value };
    if (field === "classId") next.subject = classes.find((c) => c.id === value).subjects[0];
    if (dirty) setPendingSelection(next);
    else applySelection(next);
  };

  const changeScore = (studentId, field, value) => {
    setValues((current) => ({ ...current, [studentId]: { ...current[studentId], [field]: value } }));
    setDirty(true);
    setFlash(null);
  };

  // Builds the record to store. `submit` also moves it to "Submitted for Review".
  const buildRecord = (submit) => {
    const base = record || {
      id: `res-${Date.now()}`,
      ...selection,
      status: RESULT_STATUS.DRAFT,
      createdOn: todayISO(),
      submittedOn: null,
      feedback: null,
    };
    return {
      ...base,
      scores: values,
      updatedOn: todayISO(),
      ...(submit ? { status: RESULT_STATUS.SUBMITTED, submittedOn: todayISO(), feedback: null } : {}),
    };
  };

  const focusFirstError = (found) => {
    const firstId = Object.keys(found)[0];
    if (!firstId) return;
    const field = found[firstId].ca ? "ca" : "exam";
    document.getElementById(`score-${firstId}-${field}`)?.focus();
  };

  const saveDraft = async () => {
    const check = validateRows(values, students, false);
    if (check.count > 0) {
      setFlash({ tone: "error", message: `Please correct ${check.count} highlighted ${check.count === 1 ? "student" : "students"} before saving.` });
      focusFirstError(check.errors);
      return;
    }
    setSaving(true);
    const res = await saveResult(buildRecord(false));
    setSaving(false);
    if (!res.ok) {
      setFlash({ tone: "error", message: res.error });
      return;
    }
    setDirty(false);
    setFlash({ tone: "success", message: "Draft saved. You can keep editing it." });
  };

  const requestSubmit = () => {
    setShowMissing(true);
    const check = validateRows(values, students, true);
    if (check.count > 0) {
      setFlash({ tone: "error", message: `${check.count} ${check.count === 1 ? "student needs" : "students need"} a valid CA and exam score before you can submit.` });
      focusFirstError(check.errors);
      return;
    }
    setConfirmSubmit(true);
  };

  const confirmSubmission = async () => {
    setSaving(true);
    const res = await saveResult(buildRecord(true), true);
    setSaving(false);
    setConfirmSubmit(false);
    if (!res.ok) {
      setFlash({ tone: "error", message: res.error });
      return;
    }
    setDirty(false);
    setFlash({ tone: "success", message: "Results marked as Submitted for Review." });
  };

  const selectedClass = classes.find((c) => c.id === selection.classId);

  return (
    <>
      <PageTitle
        title="Enter Results"
        description="Choose a class and subject, enter scores, save a draft and submit for review."
      />
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      <section className="sp-card tp-panel" aria-label="Choose class, subject and term">
        <div className="tp-select-grid">
          <FormField
            id="result-class"
            label="Class"
            as="select"
            value={selection.classId}
            onChange={(event) => changeSelection("classId", event.target.value)}
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
          />
          <FormField
            id="result-subject"
            label="Subject"
            as="select"
            value={selection.subject}
            onChange={(event) => changeSelection("subject", event.target.value)}
            options={selectedClass.subjects.map((s) => ({ value: s, label: s }))}
          />
          <FormField
            id="result-session"
            label="Session"
            as="select"
            value={selection.session}
            onChange={(event) => changeSelection("session", event.target.value)}
            options={SESSIONS.map((s) => ({ value: s, label: s }))}
          />
          <FormField
            id="result-term"
            label="Term"
            as="select"
            value={selection.term}
            onChange={(event) => changeSelection("term", event.target.value)}
            options={TERMS.map((t) => ({ value: t, label: t }))}
          />
        </div>
        <p className="form-note">
          Scoring: continuous assessment (CA) out of {CA_MAX} + examination out of {EXAM_MAX} = {TOTAL_MAX}.
        </p>
      </section>

      <section className="tp-status-line" aria-label="Status of these results">
        <span>
          {className} &middot; {selection.subject} &middot; {selection.session}, {selection.term}
        </span>
        {record ? <TeacherStatusBadge status={record.status} /> : <span className="sp-badge sp-badge-locked">New, not saved yet</span>}
        {dirty && <span className="sp-tag">Unsaved changes</span>}
      </section>

      {record?.status === RESULT_STATUS.RETURNED && record.feedback && (
        <section className="tp-feedback" aria-label="Feedback on returned results">
          <h2>Returned for correction</h2>
          <p>{record.feedback.message}</p>
          <p className="sp-muted">{record.feedback.from}, {formatDate(record.feedback.date)}</p>
          <p>Correct the scores below and submit again.</p>
        </section>
      )}

      {!editable && (
        <section className="tp-locked-note" aria-label="Results are locked">
          <p>
            These results are <strong>{record.status}</strong> and can no longer be edited here.{" "}
            <Link to={`/teacher/results/history/${record.id}`}>View details</Link>
          </p>
        </section>
      )}

      <div className="sp-table-wrap" role="region" aria-label="Score entry table" tabIndex={0}>
        <table className="sp-table tp-stack-table tp-entry-table">
          <caption className="visually-hidden">
            Scores for {className} {selection.subject}
          </caption>
          <thead>
            <tr>
              <th scope="col">No.</th>
              <th scope="col">Student ID</th>
              <th scope="col">Student name</th>
              <th scope="col" className="num">CA (max {CA_MAX})</th>
              <th scope="col" className="num">Exam (max {EXAM_MAX})</th>
              <th scope="col" className="num">Total ({TOTAL_MAX})</th>
              <th scope="col">Grade</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => {
              const entry = values[student.id];
              const rowErrors = errors[student.id] || {};
              const total = totalOf(entry);
              const cell = (field, max, label) =>
                editable ? (
                  <div className="tp-cell-control">
                    <input
                      id={`score-${student.id}-${field}`}
                      className="tp-score-input"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={entry[field]}
                      onChange={(event) => changeScore(student.id, field, event.target.value)}
                      aria-label={`${label} score for ${student.name}, maximum ${max}`}
                      aria-invalid={rowErrors[field] ? "true" : "false"}
                      aria-describedby={rowErrors[field] ? `score-${student.id}-${field}-error` : undefined}
                    />
                    {rowErrors[field] && (
                      <span className="tp-cell-error" id={`score-${student.id}-${field}-error`}>
                        {rowErrors[field]}
                      </span>
                    )}
                  </div>
                ) : (
                  <span>{entry[field] === "" ? "-" : entry[field]}</span>
                );
              return (
                <tr key={student.id}>
                  <td data-label="No.">{index + 1}</td>
                  <td data-label="Student ID">{student.id}</td>
                  <th scope="row" data-label="Name">{student.name}</th>
                  <td className="num" data-label={`CA (max ${CA_MAX})`}>{cell("ca", CA_MAX, "CA")}</td>
                  <td className="num" data-label={`Exam (max ${EXAM_MAX})`}>{cell("exam", EXAM_MAX, "Exam")}</td>
                  <td className="num" data-label="Total"><strong>{total === null ? "-" : total}</strong></td>
                  <td data-label="Grade">
                    {total === null ? "-" : <span className={`sp-grade sp-grade-${gradeFor(total)}`}>{gradeFor(total)}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <dl className="sp-summary tp-entry-summary">
        <div>
          <dt>Students scored</dt>
          <dd>{summary.complete} of {summary.count}</dd>
        </div>
        <div>
          <dt>Class average</dt>
          <dd>{summary.average === null ? "-" : `${summary.average} / ${TOTAL_MAX}`}</dd>
        </div>
        <div>
          <dt>Problems to fix</dt>
          <dd>{errorCount}</dd>
        </div>
      </dl>

      {editable && (
        <div className="tp-action-bar sp-no-print">
          <Button variant="outline" onClick={saveDraft} disabled={saving}>
            &nbsp;Save as draft
          </Button>
          <Button variant="primary" onClick={requestSubmit} disabled={saving}>
            &nbsp;Submit for review
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmSubmit}
        title="Submit results for review?"
        confirmLabel="Yes, submit"
        onConfirm={confirmSubmission}
        onCancel={() => setConfirmSubmit(false)}
      >
        <p>
          You are about to submit <strong>{selection.subject}</strong> results for <strong>{className}</strong>,{" "}
          {selection.session} {selection.term}, covering {students.length} students.
        </p>
        <p>
          After submitting you will not be able to edit them unless they are returned for correction.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(pendingSelection)}
        title="Discard unsaved changes?"
        confirmLabel="Discard changes"
        danger
        onConfirm={() => {
          applySelection(pendingSelection);
          setPendingSelection(null);
        }}
        onCancel={() => setPendingSelection(null)}
      >
        <p>You have scores that are not saved. Changing the class, subject or term will lose them. Save a draft first to keep them.</p>
      </ConfirmDialog>
    </>
  );
}

export default function EnterResults() {
  const { classes } = useTeacherData();
  if (classes.length === 0) return <NoClasses title="Enter Results" description="Choose a class and subject, enter scores, save a draft and submit for review." />;
  return <EnterResultsInner />;
}
