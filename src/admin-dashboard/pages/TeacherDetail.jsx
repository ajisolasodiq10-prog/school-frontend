import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import FormField from "../../teacher-dashboard/components/FormField.jsx";
import ConfirmDialog from "../../teacher-dashboard/components/ConfirmDialog.jsx";
import Flash from "../../teacher-dashboard/components/Flash.jsx";
import useFlash from "../../teacher-dashboard/hooks/useFlash.js";
import StatusPill from "../components/StatusPill.jsx";
import AllocationAdder from "../components/AllocationAdder.jsx";
import DeactivateText from "../components/DeactivateText.jsx";
import { useAdminData } from "../context/AdminDataContext.jsx";

export default function TeacherDetail() {
  const { teacherId } = useParams();
  const { teacherById, allocations, classes, classById, subjectById, results, setTeacherStatus, removeAllocation, setClassTeacher } = useAdminData();
  const teacher = teacherById(teacherId);
  usePageTitle(teacher ? teacher.fullName : "Teacher not found");
  const [toggle, setToggle] = useState(false);
  const [toRemove, setToRemove] = useState(null);
  const [classChoice, setClassChoice] = useState("");
  const [pendingClass, setPendingClass] = useState(null);
  const [flash, setFlash] = useFlash();

  if (!teacher) {
    return (
      <EmptyState title="Teacher not found">
        <p>We could not find that teacher.</p>
        <Button to="/admin/teachers" variant="primary" size="small">Back to Teachers</Button>
      </EmptyState>
    );
  }

  const mine = allocations.filter((a) => a.teacherId === teacher.id)
    .sort((a, b) => (classById(a.classId)?.name || "").localeCompare(classById(b.classId)?.name || ""));
  const classTeacherOf = classes.filter((c) => c.classTeacherId === teacher.id);
  const submitted = results.filter((r) => r.teacherId === teacher.id).length;
  const active = teacher.status === "Active";

  const report = (res, message) => setFlash(res.ok ? { tone: "success", message } : { tone: "error", message: res.error });
  const confirmToggle = async () => {
    const res = await setTeacherStatus(teacher.id, active ? "Deactivated" : "Active");
    report(res, `Account ${active ? "deactivated" : "activated"}.${active ? " Historical records are preserved." : ""}`);
    setToggle(false);
  };
  const confirmRemove = async () => {
    const res = await removeAllocation(toRemove.id);
    report(res, "Teaching assignment removed.");
    setToRemove(null);
  };
  const assignClass = async (classId) => {
    const res = await setClassTeacher(classId, teacher.id);
    report(res, `${teacher.fullName} is now class teacher of ${classById(classId).name}.`);
    setPendingClass(null);
    setClassChoice("");
  };
  const startAssignClass = () => {
    const c = classById(classChoice);
    if (c.classTeacherId && c.classTeacherId !== teacher.id) setPendingClass(c);
    else assignClass(classChoice);
  };

  return (
    <>
      <Link to="/admin/teachers" className="sp-back-link">
        All teachers
      </Link>
      <PageTitle title={`${teacher.title} ${teacher.fullName}`} description={`${teacher.id} · ${teacher.department}`}>
        <StatusPill label={teacher.status} />
        <Button variant={active ? "outline-danger" : "primary"} size="small" onClick={() => setToggle(true)}>
          {active ? "Deactivate account" : "Activate account"}
        </Button>
      </PageTitle>
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      <section className="sp-card sp-detail-card" aria-labelledby="td-details">
        <div className="ad-profile-head">
          <h2 id="td-details">Teacher details</h2>
        </div>
        <dl className="sp-details">
          {[["Teacher ID", teacher.id], ["Email", teacher.email], ["Phone", teacher.phone || "Not provided"], ["Department", teacher.department],
            ["Joined", teacher.joined], ["Account status", teacher.status], ["Results submitted", String(submitted)]].map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
        {!active && (
          <p className="tp-locked-note">
            <span>Access is revoked. This teacher&apos;s records are preserved and nothing has been deleted.</span>
          </p>
        )}
      </section>

      <section className="sp-block" aria-labelledby="td-assign">
        <h2 id="td-assign">Subjects and classes taught</h2>
        {mine.length === 0 ? (
          <p className="sp-muted">No teaching assignments yet.</p>
        ) : (
          <div className="sp-table-wrap" role="region" aria-label="Teaching assignments" tabIndex={0}>
            <table className="sp-table tp-stack-table">
              <caption className="visually-hidden">Teaching assignments</caption>
              <thead>
                <tr><th scope="col">Class</th><th scope="col">Subject</th><th scope="col"><span className="visually-hidden">Action</span></th></tr>
              </thead>
              <tbody>
                {mine.map((a) => (
                  <tr key={a.id}>
                    <th scope="row" data-label="Class">{classById(a.classId).name}</th>
                    <td data-label="Subject">{subjectById(a.subjectId).name}</td>
                    <td className="sp-action-cell">
                      <Button variant="outline-danger" size="small" onClick={() => setToRemove(a)}
                        aria-label={`Remove ${subjectById(a.subjectId).name} in ${classById(a.classId).name}`}>Remove</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {active ? (
          <div className="ad-adder-box">
            <h3>Assign a subject and class</h3>
            <AllocationAdder fixed={{ teacherId: teacher.id }} onResult={(m) => setFlash({ tone: "success", message: `${m}.` })} />
          </div>
        ) : (
          <p className="form-note">Activate the account before assigning new classes or subjects.</p>
        )}
      </section>

      <section className="sp-block" aria-labelledby="td-ct">
        <h2 id="td-ct">Class-teacher responsibilities</h2>
        {classTeacherOf.length === 0 ? (
          <p className="sp-muted">Not a class teacher.</p>
        ) : (
          <ul className="pill-list">
            {classTeacherOf.map((c) => (
              <li key={c.id}>
                {c.name}{" "}
                <button type="button" className="tp-link-button" onClick={async () => report(await setClassTeacher(c.id, ""), `Class teacher removed from ${c.name}.`)}
                  aria-label={`Remove class-teacher duty for ${c.name}`}>remove</button>
              </li>
            ))}
          </ul>
        )}
        {active && (
          <div className="ad-inline-form ad-adder-box">
            <FormField id="td-class" label="Assign as class teacher of" as="select" value={classChoice} onChange={(e) => setClassChoice(e.target.value)}
              options={[{ value: "", label: "Choose a class..." }, ...classes.filter((c) => c.classTeacherId !== teacher.id).map((c) => ({ value: c.id, label: c.name }))]} />
            <Button variant="outline" size="small" disabled={!classChoice} onClick={startAssignClass}>Assign</Button>
          </div>
        )}
      </section>

      <ConfirmDialog open={toggle} title={active ? "Deactivate this account?" : "Activate this account?"} confirmLabel={active ? "Deactivate account" : "Activate account"}
        danger={active} onConfirm={confirmToggle} onCancel={() => setToggle(false)}>
        <DeactivateText teacher={teacher} />
      </ConfirmDialog>

      <ConfirmDialog open={Boolean(toRemove)} title="Remove this assignment?" confirmLabel="Remove assignment" danger onConfirm={confirmRemove} onCancel={() => setToRemove(null)}>
        {toRemove && <p>Remove <strong>{subjectById(toRemove.subjectId).name}</strong> in <strong>{classById(toRemove.classId).name}</strong> from {teacher.fullName}? The class will have no teacher for this subject until one is assigned.</p>}
      </ConfirmDialog>

      <ConfirmDialog open={Boolean(pendingClass)} title="Replace the class teacher?" confirmLabel="Replace class teacher" onConfirm={() => assignClass(pendingClass.id)} onCancel={() => setPendingClass(null)}>
        {pendingClass && <p>{pendingClass.name} already has a class teacher. Assigning {teacher.fullName} replaces them.</p>}
      </ConfirmDialog>
    </>
  );
}
