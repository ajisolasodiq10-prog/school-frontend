import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import FormField from "../../teacher-dashboard/components/FormField.jsx";
import ConfirmDialog from "../../teacher-dashboard/components/ConfirmDialog.jsx";
import Flash from "../../teacher-dashboard/components/Flash.jsx";
import useFlash from "../../teacher-dashboard/hooks/useFlash.js";
import StatusPill from "../components/StatusPill.jsx";
import DeactivateText from "../components/DeactivateText.jsx";
import ActivationLinkPanel from "../components/ActivationLinkPanel.jsx";
import { useAdminData } from "../context/AdminDataContext.jsx";
import { DEPARTMENTS, TEACHER_STATUSES } from "../config/constants.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[\d\s()-]{7,20}$/;

export function validateTeacher(form) {
  const errors = {};
  if (form.fullName.trim().length < 3) errors.fullName = "Enter the teacher's full name.";
  if (!form.email.trim()) errors.email = "Enter an email address.";
  else if (!emailPattern.test(form.email.trim())) errors.email = "Enter a valid email address, such as name@example.com.";
  if (form.phone.trim() && !phonePattern.test(form.phone.trim())) errors.phone = "Enter a valid phone number, such as +234 800 000 0000.";
  if (!form.department) errors.department = "Choose a department.";
  return errors;
}

export default function Teachers() {
  usePageTitle("Teachers");
  const [params] = useSearchParams();
  const { teachers, allocations, classes, subjectById, classById, addTeacher, updateTeacher, setTeacherStatus } = useAdminData();
  const blank = () => ({ title: "Mr.", fullName: "", email: "", phone: "", department: "" });

  const [editing, setEditing] = useState(params.get("add") ? "new" : null);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [toggle, setToggle] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activation, setActivation] = useState(null);
  const [filters, setFilters] = useState({ search: "", department: "all", status: "all" });
  const [flash, setFlash] = useFlash();

  const query = filters.search.trim().toLowerCase();
  const rows = teachers
    .map((t) => {
      const mine = allocations.filter((a) => a.teacherId === t.id);
      return {
        ...t,
        subjectNames: [...new Set(mine.map((a) => subjectById(a.subjectId)?.name))].filter(Boolean),
        classNames: [...new Set(mine.map((a) => classById(a.classId)?.name))].filter(Boolean),
        classTeacherOf: classes.filter((c) => c.classTeacherId === t.id).map((c) => c.name),
      };
    })
    .filter(
      (t) =>
        (!query || t.fullName.toLowerCase().includes(query) || t.id.toLowerCase().includes(query) || t.email.toLowerCase().includes(query)) &&
        (filters.department === "all" || t.department === filters.department) &&
        (filters.status === "all" || t.status === filters.status)
    );
  const hasFilters = filters.search || filters.department !== "all" || filters.status !== "all";
  const setFilter = (field) => (event) => setFilters((f) => ({ ...f, [field]: event.target.value }));
  const change = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  const openNew = () => { setForm(blank()); setErrors({}); setEditing("new"); };
  const openEdit = (t) => { setForm({ title: t.title, fullName: t.fullName, email: t.email, phone: t.phone, department: t.department }); setErrors({}); setEditing(t.id); };
  const closeForm = () => { setEditing(null); setErrors({}); };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateTeacher(form);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) { document.getElementById(`tch-${first}`)?.focus(); return; }
    setSaving(true);
    const result = editing === "new" ? await addTeacher(form) : await updateTeacher(editing, form);
    setSaving(false);
    if (!result.ok) { setErrors({ form: result.error }); return; }
    setFlash({ tone: "success", message: editing === "new" ? `Teacher added with ID ${result.teacher.id}. Assign subjects and classes from their profile.` : "Teacher details updated." });
    if (editing === "new" && result.activation) setActivation({ id: result.teacher.id, name: form.fullName, email: form.email.trim(), ...result.activation });
    closeForm();
  };

  const confirmToggle = async () => {
    const next = toggle.status === "Active" ? "Deactivated" : "Active";
    const result = await setTeacherStatus(toggle.id, next);
    setFlash(result.ok ? { tone: "success", message: `${toggle.fullName}'s account is now ${next.toLowerCase()}.` } : { tone: "error", message: result.error });
    setToggle(null);
  };

  return (
    <>
      <PageTitle title="Teachers" description="Manage teacher records and accounts.">
        {!editing && (
          <Button variant="primary" size="small" onClick={openNew}>
            &nbsp;Add teacher
          </Button>
        )}
      </PageTitle>
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      {activation && (
        <ActivationLinkPanel title={`Teacher account created for ${activation.name}`} id={activation.id} link={activation.link} expiresAt={activation.expiresAt} emailedTo={activation.email} onClose={() => setActivation(null)} />
      )}

      {editing && (
        <section className="sp-card tp-panel" aria-labelledby="tch-form-title">
          <h2 id="tch-form-title">{editing === "new" ? "Add teacher" : `Edit teacher ${editing}`}</h2>
          <form className="tp-form" onSubmit={handleSubmit} noValidate>
            {errors.form && <p className="field-error" role="alert">{errors.form}</p>}
            <div className="tp-select-grid">
              <FormField id="tch-title" label="Title" as="select" value={form.title} onChange={change("title")}
                options={["Mr.", "Mrs.", "Miss", "Dr."].map((t) => ({ value: t, label: t }))} />
              <FormField id="tch-fullName" label="Full name" value={form.fullName} onChange={change("fullName")} error={errors.fullName} autoComplete="off" />
              <FormField id="tch-email" label="Email" type="email" inputMode="email" value={form.email} onChange={change("email")} error={errors.email} autoComplete="off" />
              <FormField id="tch-phone" label="Phone (optional)" type="tel" value={form.phone} onChange={change("phone")} error={errors.phone} autoComplete="off" />
              <FormField id="tch-department" label="Department" as="select" value={form.department} onChange={change("department")} error={errors.department}
                options={[{ value: "", label: "Choose..." }, ...DEPARTMENTS.map((d) => ({ value: d, label: d }))]} />
            </div>
            <p className="form-note">Subjects, classes and class-teacher duties are assigned from the teacher&apos;s profile after saving.</p>
            <div className="tp-form-actions">
              <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving..." : editing === "new" ? "Add teacher" : "Save changes"}</Button>
              <Button variant="outline" onClick={closeForm}>Cancel</Button>
            </div>
          </form>
        </section>
      )}

      <section className="tp-filters ad-filters-three" aria-label="Filter teachers">
        <FormField id="tch-search" label="Search by name, ID or email" type="search" value={filters.search} onChange={setFilter("search")} />
        <FormField id="tch-f-dept" label="Department" as="select" value={filters.department} onChange={setFilter("department")}
          options={[{ value: "all", label: "All departments" }, ...DEPARTMENTS.map((d) => ({ value: d, label: d }))]} />
        <FormField id="tch-f-status" label="Account status" as="select" value={filters.status} onChange={setFilter("status")}
          options={[{ value: "all", label: "All statuses" }, ...TEACHER_STATUSES.map((s) => ({ value: s, label: s }))]} />
      </section>

      <p className="tp-count" role="status">
        Showing {rows.length} of {teachers.length} teachers
        {hasFilters && (
          <>
            {" "}
            <button type="button" className="tp-link-button" onClick={() => setFilters({ search: "", department: "all", status: "all" })}>Clear filters</button>
          </>
        )}
      </p>

      {rows.length === 0 ? (
        <EmptyState title="No teachers found">
          <p>No teacher matches your search or filters.</p>
        </EmptyState>
      ) : (
        <div className="sp-table-wrap" role="region" aria-label="Teacher list" tabIndex={0}>
          <table className="sp-table tp-stack-table">
            <caption className="visually-hidden">Teachers</caption>
            <thead>
              <tr>
                <th scope="col">Teacher ID</th><th scope="col">Full name</th><th scope="col">Email</th><th scope="col">Department</th>
                <th scope="col">Subjects</th><th scope="col">Classes</th><th scope="col">Account</th>
                <th scope="col"><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td data-label="Teacher ID">{t.id}</td>
                  <th scope="row" data-label="Name">{t.title} {t.fullName}</th>
                  <td data-label="Email">{t.email}</td>
                  <td data-label="Department">{t.department}</td>
                  <td data-label="Subjects">{t.subjectNames.length ? t.subjectNames.join(", ") : "None assigned"}</td>
                  <td data-label="Classes">{t.classNames.length ? t.classNames.join(", ") : "None assigned"}{t.classTeacherOf.length > 0 && <span className="ad-sub"> Class teacher: {t.classTeacherOf.join(", ")}</span>}</td>
                  <td data-label="Account"><StatusPill label={t.status} /></td>
                  <td className="sp-action-cell">
                    <div className="ad-row-actions">
                      <Button to={`/admin/teachers/${t.id}`} variant="outline" size="small" aria-label={`View profile of ${t.fullName}`}>View</Button>
                      <Button variant="outline" size="small" onClick={() => openEdit(t)} aria-label={`Edit ${t.fullName}`}>Edit</Button>
                      <Button variant={t.status === "Active" ? "outline-danger" : "outline"} size="small" onClick={() => setToggle(t)}
                        aria-label={`${t.status === "Active" ? "Deactivate" : "Activate"} account of ${t.fullName}`}>
                        {t.status === "Active" ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toggle)}
        title={toggle?.status === "Active" ? "Deactivate this account?" : "Activate this account?"}
        confirmLabel={toggle?.status === "Active" ? "Deactivate account" : "Activate account"}
        danger={toggle?.status === "Active"}
        onConfirm={confirmToggle}
        onCancel={() => setToggle(null)}
      >
        {toggle && <DeactivateText teacher={toggle} />}
      </ConfirmDialog>
    </>
  );
}
