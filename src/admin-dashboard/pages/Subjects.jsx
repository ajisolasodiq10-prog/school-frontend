import { useState } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import FormField from "../../teacher-dashboard/components/FormField.jsx";
import Flash from "../../teacher-dashboard/components/Flash.jsx";
import ConfirmDialog from "../../teacher-dashboard/components/ConfirmDialog.jsx";
import useFlash from "../../teacher-dashboard/hooks/useFlash.js";
import usePaged from "../hooks/usePaged.js";
import AllocationAdder from "../components/AllocationAdder.jsx";
import { useAdminData } from "../context/AdminDataContext.jsx";
import { SUBJECT_CATEGORIES } from "../config/constants.js";

export default function Subjects() {
  usePageTitle("Subjects");
  const { subjects, allocations, classes, addSubject, updateSubject, removeAllocation, className, teacherName, subjectName, teachers } = useAdminData();
  const [editing, setEditing] = useState(null); // null | "new" | subject id
  const [form, setForm] = useState({ name: "", code: "", category: "Core" });
  const [errors, setErrors] = useState({});
  const [flash, setFlash] = useFlash();
  const [sFilter, setSFilter] = useState("");
  const [aFilters, setAFilters] = useState({ subjectId: "all", classId: "all", teacherId: "all" });
  const [removing, setRemoving] = useState(null);

  const change = (f) => (e) => setForm((x) => ({ ...x, [f]: e.target.value }));
  const q = sFilter.trim().toLowerCase();
  const subjectRows = subjects.filter((s) => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  const allocRows = allocations
    .filter((a) => (aFilters.subjectId === "all" || a.subjectId === aFilters.subjectId) &&
      (aFilters.classId === "all" || a.classId === aFilters.classId) &&
      (aFilters.teacherId === "all" || a.teacherId === aFilters.teacherId))
    .sort((a, b) => subjectName(a.subjectId).localeCompare(subjectName(b.subjectId)) || a.classId.localeCompare(b.classId));
  const { visible, remaining, showMore } = usePaged(allocRows, JSON.stringify(aFilters), 20);

  const openNew = () => { setForm({ name: "", code: "", category: "Core" }); setErrors({}); setEditing("new"); };
  const openEdit = (s) => { setForm({ name: s.name, code: s.code, category: s.category }); setErrors({}); setEditing(s.id); };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (form.name.trim().length < 3) found.name = "Enter the subject name (at least 3 characters).";
    if (!/^[A-Za-z0-9]{2,6}$/.test(form.code.trim())) found.code = "Use 2 to 6 letters or numbers, for example ENG.";
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) { document.getElementById(`sub-${first}`)?.focus(); return; }
    const res = editing === "new" ? await addSubject(form) : await updateSubject(editing, form);
    if (!res.ok) { setErrors({ name: res.error }); return; }
    setFlash({ tone: "success", message: editing === "new" ? "Subject added." : "Subject updated." });
    setEditing(null);
  };

  return (
    <>
      <PageTitle title="Subjects" description="Add subjects, assign them to classes and teachers, and review allocations.">
        {!editing && <Button variant="primary" size="small" onClick={openNew}>Add subject</Button>}
      </PageTitle>
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      {editing && (
        <section className="sp-card tp-panel" aria-labelledby="sub-form-title">
          <h2 id="sub-form-title">{editing === "new" ? "Add subject" : "Edit subject"}</h2>
          <form className="tp-form" onSubmit={submit} noValidate>
            <div className="tp-select-grid">
              <FormField id="sub-name" label="Subject name" value={form.name} onChange={change("name")} error={errors.name} autoComplete="off" />
              <FormField id="sub-code" label="Subject code" value={form.code} onChange={change("code")} error={errors.code} maxLength={6} autoComplete="off" />
              <FormField id="sub-category" label="Category" as="select" value={form.category} onChange={change("category")}
                options={SUBJECT_CATEGORIES.map((c) => ({ value: c, label: c }))} />
            </div>
            <div className="tp-form-actions">
              <Button type="submit" variant="primary">{editing === "new" ? "Add subject" : "Save changes"}</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </form>
        </section>
      )}

      <section aria-labelledby="sub-list">
        <h2 id="sub-list">All subjects</h2>
        <div className="tp-filters tp-filters-one">
          <FormField id="sub-search" label="Search subjects" type="search" value={sFilter} onChange={(e) => setSFilter(e.target.value)} />
        </div>
        {subjectRows.length === 0 ? (
          <EmptyState title="No subjects found"><p>No subject matches your search.</p></EmptyState>
        ) : (
          <div className="sp-table-wrap" role="region" aria-label="Subject list" tabIndex={0}>
            <table className="sp-table tp-stack-table">
              <caption className="visually-hidden">Subjects</caption>
              <thead><tr><th scope="col">Subject</th><th scope="col">Code</th><th scope="col">Category</th><th scope="col">Classes</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                {subjectRows.map((s) => (
                  <tr key={s.id}>
                    <th scope="row" data-label="Subject">{s.name}</th>
                    <td data-label="Code">{s.code}</td>
                    <td data-label="Category">{s.category}</td>
                    <td data-label="Classes">{allocations.filter((a) => a.subjectId === s.id).length}</td>
                    <td className="sp-action-cell"><Button variant="outline" size="small" onClick={() => openEdit(s)} aria-label={`Edit ${s.name}`}>Edit</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="sp-card tp-panel" aria-labelledby="alloc-title">
        <h2 id="alloc-title">Subject allocations</h2>
        <p>Assign a subject to a class and a teacher. Choosing an existing class and subject replaces its teacher.</p>
        <AllocationAdder onResult={(m) => setFlash({ tone: "success", message: `${m}.` })} />
        <div className="tp-filters">
          <FormField id="al-subject" label="Subject" as="select" value={aFilters.subjectId} onChange={(e) => setAFilters((f) => ({ ...f, subjectId: e.target.value }))}
            options={[{ value: "all", label: "All subjects" }, ...subjects.map((s) => ({ value: s.id, label: s.name }))]} />
          <FormField id="al-class" label="Class" as="select" value={aFilters.classId} onChange={(e) => setAFilters((f) => ({ ...f, classId: e.target.value }))}
            options={[{ value: "all", label: "All classes" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]} />
          <FormField id="al-teacher" label="Teacher" as="select" value={aFilters.teacherId} onChange={(e) => setAFilters((f) => ({ ...f, teacherId: e.target.value }))}
            options={[{ value: "all", label: "All teachers" }, ...teachers.map((t) => ({ value: t.id, label: `${t.title} ${t.fullName}` }))]} />
        </div>
        <p className="tp-count" role="status">{allocRows.length} allocations</p>
        {allocRows.length === 0 ? <p>No allocations match these filters.</p> : (
          <>
            <div className="sp-table-wrap" role="region" aria-label="Allocation list" tabIndex={0}>
              <table className="sp-table tp-stack-table">
                <caption className="visually-hidden">Allocations</caption>
                <thead><tr><th scope="col">Subject</th><th scope="col">Class</th><th scope="col">Teacher</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
                <tbody>
                  {visible.map((a) => (
                    <tr key={a.id}>
                      <th scope="row" data-label="Subject">{subjectName(a.subjectId)}</th>
                      <td data-label="Class">{className(a.classId)}</td>
                      <td data-label="Teacher">{teacherName(a.teacherId)}</td>
                      <td className="sp-action-cell"><Button variant="outline-danger" size="small" onClick={() => setRemoving(a)} aria-label={`Remove ${subjectName(a.subjectId)} from ${className(a.classId)}`}>Remove</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {remaining > 0 && <p className="ad-more"><Button variant="outline" size="small" onClick={showMore}>Show more ({remaining} remaining)</Button></p>}
          </>
        )}
      </section>

      <ConfirmDialog open={Boolean(removing)} title="Remove this allocation?" danger confirmLabel="Yes, remove"
        onConfirm={async () => { const res = await removeAllocation(removing.id); setFlash(res.ok ? { tone: "success", message: "Allocation removed. Existing results are kept." } : { tone: "error", message: res.error }); setRemoving(null); }}
        onCancel={() => setRemoving(null)}>
        {removing && <p>{subjectName(removing.subjectId)} will no longer be allocated to {className(removing.classId)}. Results already submitted are not deleted.</p>}
      </ConfirmDialog>
    </>
  );
}
