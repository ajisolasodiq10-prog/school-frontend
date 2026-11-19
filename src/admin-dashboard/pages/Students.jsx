import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import { formatDate } from "../../config/content.js";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import FormField from "../../teacher-dashboard/components/FormField.jsx";
import ConfirmDialog from "../../teacher-dashboard/components/ConfirmDialog.jsx";
import Flash from "../../teacher-dashboard/components/Flash.jsx";
import useFlash from "../../teacher-dashboard/hooks/useFlash.js";
import StatusPill from "../components/StatusPill.jsx";
import ActivationLinkPanel from "../components/ActivationLinkPanel.jsx";
import usePaged from "../hooks/usePaged.js";
import { useAdminData } from "../context/AdminDataContext.jsx";
import { STUDENT_STATUSES } from "../config/constants.js";
import { todayISO } from "../utils/dates.js";

const namePattern = /^[A-Za-z][A-Za-z\s'-]{1,39}$/;

function validate(form) {
  const errors = {};
  if (!namePattern.test(form.firstName.trim())) errors.firstName = "Enter a first name (letters only, at least 2 characters).";
  if (!namePattern.test(form.lastName.trim())) errors.lastName = "Enter a surname (letters only, at least 2 characters).";
  if (!form.gender) errors.gender = "Choose a gender.";
  if (!form.classId) errors.classId = "Choose a class and arm.";
  if (!form.dateOfBirth) errors.dateOfBirth = "Enter the date of birth.";
  else if (form.dateOfBirth >= todayISO()) errors.dateOfBirth = "The date of birth must be in the past.";
  if (form.guardianEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guardianEmail.trim())) errors.guardianEmail = "Enter a valid email address.";
  if (!form.admissionDate) errors.admissionDate = "Enter the admission date.";
  else if (form.admissionDate > todayISO()) errors.admissionDate = "The admission date cannot be in the future.";
  return errors;
}

export default function Students() {
  usePageTitle("Students");
  const [params] = useSearchParams();
  const { students, classes, sessions, classById, addStudent, updateStudent } = useAdminData();
  const blank = () => ({ firstName: "", lastName: "", gender: "", classId: "", dateOfBirth: "", admissionDate: "", status: "Active", house: "", guardianName: "", guardianPhone: "", guardianEmail: "", address: "" });

  const [editing, setEditing] = useState(params.get("add") ? "new" : null); // null, "new" or a student ID
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [pendingSave, setPendingSave] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activation, setActivation] = useState(null);
  const [filters, setFilters] = useState({ search: "", classId: "all", status: "all", session: "all" });
  const [flash, setFlash] = useFlash();

  const query = filters.search.trim().toLowerCase();
  const filtered = students
    .filter(
      (s) =>
        (!query || s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query)) &&
        (filters.classId === "all" || s.classId === filters.classId) &&
        (filters.status === "all" || s.status === filters.status) &&
        (filters.session === "all" || s.session === filters.session)
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  const { visible, remaining, showMore } = usePaged(filtered, JSON.stringify(filters));
  const hasFilters = filters.search || filters.classId !== "all" || filters.status !== "all" || filters.session !== "all";
  const setFilter = (field) => (event) => setFilters((f) => ({ ...f, [field]: event.target.value }));
  const change = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  const openNew = () => { setForm(blank()); setErrors({}); setEditing("new"); };
  const openEdit = (s) => {
    setForm({ firstName: s.firstName, lastName: s.lastName, gender: s.gender, classId: s.classId, dateOfBirth: s.dateOfBirth, admissionDate: s.admissionDate, status: s.status, house: s.house, guardianName: s.guardianName, guardianPhone: s.guardianPhone, guardianEmail: s.guardianEmail, address: s.address });
    setErrors({});
    setEditing(s.id);
  };
  const closeForm = () => { setEditing(null); setErrors({}); };

  const commit = async () => {
    setSaving(true);
    const result = editing === "new" ? await addStudent(form) : await updateStudent(editing, form);
    setSaving(false);
    setPendingSave(null);
    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }
    setFlash({ tone: "success", message: editing === "new" ? `Student added with ID ${result.student.id}.` : "Student record updated." });
    if (editing === "new" && result.activation) setActivation({ id: result.student.id, name: result.student.name, ...result.activation });
    closeForm();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) { document.getElementById(`stu-${first}`)?.focus(); return; }
    if (editing !== "new") {
      const before = students.find((s) => s.id === editing);
      const changes = [];
      if (before.classId !== form.classId) changes.push(`move from ${classById(before.classId)?.name || "no class"} to ${classById(form.classId)?.name || "no class"}`);
      if (before.status !== form.status) changes.push(`change the status from ${before.status} to ${form.status}`);
      if (changes.length) { setPendingSave(changes.join(" and ")); return; }
    }
    commit();
  };

  return (
    <>
      <PageTitle title="Students" description="Manage student records.">
        {!editing && (
          <Button variant="primary" size="small" onClick={openNew}>
            &nbsp;Add student
          </Button>
        )}
      </PageTitle>
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      {activation && (
        <ActivationLinkPanel title={`Student account created for ${activation.name}`} id={activation.id} link={activation.link} expiresAt={activation.expiresAt} onClose={() => setActivation(null)} />
      )}

      {editing && (
        <section className="sp-card tp-panel" aria-labelledby="stu-form-title">
          <h2 id="stu-form-title">{editing === "new" ? "Add student" : `Edit student ${editing}`}</h2>
          <form className="tp-form" onSubmit={handleSubmit} noValidate>
            {errors.form && <p className="field-error" role="alert">{errors.form}</p>}
            <div className="tp-select-grid">
              <FormField id="stu-firstName" label="First name" value={form.firstName} onChange={change("firstName")} error={errors.firstName} autoComplete="off" />
              <FormField id="stu-lastName" label="Surname" value={form.lastName} onChange={change("lastName")} error={errors.lastName} autoComplete="off" />
              <FormField id="stu-gender" label="Gender" as="select" value={form.gender} onChange={change("gender")} error={errors.gender}
                options={[{ value: "", label: "Choose..." }, { value: "Female", label: "Female" }, { value: "Male", label: "Male" }]} />
              <FormField id="stu-classId" label="Class and arm" as="select" value={form.classId} onChange={change("classId")} error={errors.classId}
                options={[{ value: "", label: "Choose..." }, ...classes.map((c) => ({ value: c.id, label: c.name }))]} />
              <FormField id="stu-dateOfBirth" label="Date of birth" type="date" value={form.dateOfBirth} onChange={change("dateOfBirth")} error={errors.dateOfBirth} />
              <FormField id="stu-admissionDate" label="Admission date" type="date" value={form.admissionDate} onChange={change("admissionDate")} error={errors.admissionDate} />
              <FormField id="stu-status" label="Status" as="select" value={form.status} onChange={change("status")}
                options={STUDENT_STATUSES.map((s) => ({ value: s, label: s }))} />
              <FormField id="stu-house" label="House (optional)" value={form.house} onChange={change("house")} autoComplete="off" />
              <FormField id="stu-guardianName" label="Parent or guardian (optional)" value={form.guardianName} onChange={change("guardianName")} autoComplete="off" />
              <FormField id="stu-guardianPhone" label="Guardian phone (optional)" type="tel" value={form.guardianPhone} onChange={change("guardianPhone")} error={errors.guardianPhone} />
              <FormField id="stu-guardianEmail" label="Guardian email (optional)" type="email" value={form.guardianEmail} onChange={change("guardianEmail")} error={errors.guardianEmail} />
              <FormField id="stu-address" label="Home address (optional)" value={form.address} onChange={change("address")} />
            </div>
            <div className="tp-form-actions">
              <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving..." : editing === "new" ? "Add student" : "Save changes"}</Button>
              <Button variant="outline" onClick={closeForm}>Cancel</Button>
            </div>
          </form>
        </section>
      )}

      <section className="tp-filters ad-filters-four" aria-label="Filter students">
        <FormField id="stu-search" label="Search by name or ID" type="search" value={filters.search} onChange={setFilter("search")} />
        <FormField id="stu-f-class" label="Class" as="select" value={filters.classId} onChange={setFilter("classId")}
          options={[{ value: "all", label: "All classes" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]} />
        <FormField id="stu-f-status" label="Status" as="select" value={filters.status} onChange={setFilter("status")}
          options={[{ value: "all", label: "All statuses" }, ...STUDENT_STATUSES.map((s) => ({ value: s, label: s }))]} />
        <FormField id="stu-f-session" label="Session" as="select" value={filters.session} onChange={setFilter("session")}
          options={[{ value: "all", label: "All sessions" }, ...sessions.map((s) => ({ value: s.name, label: s.name }))]} />
      </section>

      <p className="tp-count" role="status">
        Showing {Math.min(visible.length, filtered.length)} of {filtered.length} matching students ({students.length} in total)
        {hasFilters && (
          <>
            {" "}
            <button type="button" className="tp-link-button" onClick={() => setFilters({ search: "", classId: "all", status: "all", session: "all" })}>
              Clear filters
            </button>
          </>
        )}
      </p>

      {filtered.length === 0 ? (
        <EmptyState title="No students found">
          <p>No student matches your search or filters.</p>
        </EmptyState>
      ) : (
        <>
          <div className="sp-table-wrap" role="region" aria-label="Student list" tabIndex={0}>
            <table className="sp-table tp-stack-table">
              <caption className="visually-hidden">Students</caption>
              <thead>
                <tr>
                  <th scope="col">Student ID</th>
                  <th scope="col">Full name</th>
                  <th scope="col">Class and arm</th>
                  <th scope="col">Gender</th>
                  <th scope="col">Admission date</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => (
                  <tr key={s.id}>
                    <td data-label="Student ID">{s.id}</td>
                    <th scope="row" data-label="Name">{s.name}</th>
                    <td data-label="Class">{classById(s.classId)?.name}</td>
                    <td data-label="Gender">{s.gender}</td>
                    <td data-label="Admitted">{formatDate(s.admissionDate)}</td>
                    <td data-label="Status"><StatusPill label={s.status} /></td>
                    <td className="sp-action-cell">
                      <div className="ad-row-actions">
                        <Button to={`/admin/students/${s.id}`} variant="outline" size="small" aria-label={`View profile of ${s.name}`}>View</Button>
                        <Button variant="outline" size="small" onClick={() => openEdit(s)} aria-label={`Edit ${s.name}`}>Edit</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {remaining > 0 && (
            <p className="ad-more">
              <Button variant="outline" size="small" onClick={showMore}>Show more ({remaining} remaining)</Button>
            </p>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingSave)}
        title="Save these changes?"
        confirmLabel="Yes, save changes"
        onConfirm={commit}
        onCancel={() => setPendingSave(null)}
      >
        <p>You are about to {pendingSave}.</p>
      </ConfirmDialog>
    </>
  );
}
