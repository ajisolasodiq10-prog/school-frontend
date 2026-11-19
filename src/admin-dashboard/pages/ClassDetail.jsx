import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import FormField from "../../teacher-dashboard/components/FormField.jsx";
import Flash from "../../teacher-dashboard/components/Flash.jsx";
import ConfirmDialog from "../../teacher-dashboard/components/ConfirmDialog.jsx";
import useFlash from "../../teacher-dashboard/hooks/useFlash.js";
import StatusPill from "../components/StatusPill.jsx";
import AllocationAdder from "../components/AllocationAdder.jsx";
import { useAdminData } from "../context/AdminDataContext.jsx";

export default function ClassDetail() {
  const { classId } = useParams();
  const { classById, students, allocations, teachers, updateClass, teacherName, subjectName, removeAllocation } = useAdminData();
  const cls = classById(classId);
  usePageTitle(cls ? cls.name : "Class not found");
  const [form, setForm] = useState(() => ({ room: cls?.room || "", classTeacherId: cls?.classTeacherId || "" }));
  const [flash, setFlash] = useFlash();
  const [removing, setRemoving] = useState(null);

  if (!cls) {
    return (
      <EmptyState title="Class not found">
        <p>We could not find that class.</p>
        <Button to="/admin/classes" variant="primary">Back to classes</Button>
      </EmptyState>
    );
  }

  const roster = students.filter((s) => s.classId === cls.id).sort((a, b) => a.name.localeCompare(b.name));
  const allocs = allocations.filter((a) => a.classId === cls.id);
  const save = (e) => {
    e.preventDefault();
    updateClass(cls.id, form);
    setFlash({ tone: "success", message: "Class details updated." });
  };

  return (
    <>
      <Link className="sp-back-link" to="/admin/classes">&larr; All classes</Link>
      <PageTitle title={cls.name} description={`${roster.filter((s) => s.status !== "Graduated").length} current students, ${allocs.length} subjects`} />
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      <section className="sp-card tp-panel" aria-labelledby="cd-edit">
        <h2 id="cd-edit">Class details</h2>
        <form className="tp-form" onSubmit={save}>
          <div className="tp-select-grid">
            <FormField id="cd-room" label="Classroom" value={form.room} onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))} />
            <FormField id="cd-teacher" label="Class teacher" as="select" value={form.classTeacherId}
              onChange={(e) => setForm((f) => ({ ...f, classTeacherId: e.target.value }))}
              options={[{ value: "", label: "Not assigned" }, ...teachers.filter((t) => t.status === "Active" || t.id === cls.classTeacherId).map((t) => ({ value: t.id, label: `${t.title} ${t.fullName}${t.status !== "Active" ? " (deactivated)" : ""}` }))]} />
          </div>
          <div className="tp-form-actions"><Button type="submit" variant="primary">Save changes</Button></div>
        </form>
      </section>

      <section className="sp-card tp-panel" aria-labelledby="cd-subj">
        <h2 id="cd-subj">Subjects in {cls.name}</h2>
        <AllocationAdder fixed={{ classId: cls.id }} onResult={(m) => setFlash({ tone: "success", message: `${m}.` })} />
        {allocs.length === 0 ? <p>No subjects assigned yet.</p> : (
          <div className="sp-table-wrap" role="region" aria-label="Subjects in this class" tabIndex={0}>
            <table className="sp-table tp-stack-table">
              <caption className="visually-hidden">Subjects</caption>
              <thead><tr><th scope="col">Subject</th><th scope="col">Teacher</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                {allocs.map((a) => (
                  <tr key={a.id}>
                    <th scope="row" data-label="Subject">{subjectName(a.subjectId)}</th>
                    <td data-label="Teacher">{teacherName(a.teacherId)}</td>
                    <td className="sp-action-cell"><Button variant="outline-danger" size="small" onClick={() => setRemoving(a)} aria-label={`Remove ${subjectName(a.subjectId)} from ${cls.name}`}>Remove</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="sp-card tp-panel" aria-labelledby="cd-stu">
        <h2 id="cd-stu">Students ({roster.length})</h2>
        {roster.length === 0 ? <p>No students in this class.</p> : (
          <div className="sp-table-wrap" role="region" aria-label="Students in this class" tabIndex={0}>
            <table className="sp-table tp-stack-table">
              <caption className="visually-hidden">Students</caption>
              <thead><tr><th scope="col">Student ID</th><th scope="col">Name</th><th scope="col">Gender</th><th scope="col">Status</th></tr></thead>
              <tbody>
                {roster.map((s) => (
                  <tr key={s.id}>
                    <td data-label="Student ID">{s.id}</td>
                    <th scope="row" data-label="Name"><Link to={`/admin/students/${s.id}`}>{s.name}</Link></th>
                    <td data-label="Gender">{s.gender}</td>
                    <td data-label="Status"><StatusPill label={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog open={Boolean(removing)} title="Remove this subject from the class?" danger confirmLabel="Yes, remove"
        onConfirm={() => { removeAllocation(removing.id); setFlash({ tone: "success", message: "Subject removed from the class. Existing results are kept." }); setRemoving(null); }}
        onCancel={() => setRemoving(null)}>
        {removing && <p>{subjectName(removing.subjectId)} will no longer be allocated to {cls.name}. Results already submitted are not deleted.</p>}
      </ConfirmDialog>
    </>
  );
}
