import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import FormField from "../../teacher-dashboard/components/FormField.jsx";
import Flash from "../../teacher-dashboard/components/Flash.jsx";
import useFlash from "../../teacher-dashboard/hooks/useFlash.js";
import { useAdminData } from "../context/AdminDataContext.jsx";
import { CLASS_LEVELS } from "../config/constants.js";

export default function Classes() {
  usePageTitle("Classes");
  const [params] = useSearchParams();
  const { classes, students, allocations, teachers, addClass, teacherName } = useAdminData();
  const [creating, setCreating] = useState(Boolean(params.get("add")));
  const [form, setForm] = useState({ level: "JSS 1", arm: "", room: "", classTeacherId: "" });
  const [errors, setErrors] = useState({});
  const [filters, setFilters] = useState({ search: "", level: "all" });
  const [flash, setFlash] = useFlash();

  const change = (f) => (e) => setForm((x) => ({ ...x, [f]: e.target.value }));
  const q = filters.search.trim().toLowerCase();
  const rows = classes
    .filter((c) => (filters.level === "all" || c.level === filters.level) &&
      (!q || c.name.toLowerCase().includes(q) || teacherName(c.classTeacherId).toLowerCase().includes(q)))
    .map((c) => ({
      ...c,
      count: students.filter((s) => s.classId === c.id && s.status !== "Graduated").length,
      subjectCount: allocations.filter((a) => a.classId === c.id).length,
    }));

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!/^[A-Za-z]$/.test(form.arm.trim())) found.arm = "Enter a single letter for the arm, for example A.";
    setErrors(found);
    if (found.arm) { document.getElementById("cls-arm")?.focus(); return; }
    const res = await addClass(form);
    if (!res.ok) { setErrors({ arm: res.error }); document.getElementById("cls-arm")?.focus(); return; }
    setFlash({ tone: "success", message: `${form.level}${form.arm.trim().toUpperCase()} created.` });
    setForm({ level: "JSS 1", arm: "", room: "", classTeacherId: "" });
    setCreating(false);
  };

  return (
    <>
      <PageTitle title="Classes" description="Create classes and arms, assign class teachers and see what each class studies.">
        {!creating && (
          <Button variant="primary" size="small" onClick={() => setCreating(true)}>
Create class
          </Button>
        )}
      </PageTitle>
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      {creating && (
        <section className="sp-card tp-panel" aria-labelledby="cls-form-title">
          <h2 id="cls-form-title">Create class or arm</h2>
          <form className="tp-form" onSubmit={submit} noValidate>
            <div className="tp-select-grid">
              <FormField id="cls-level" label="Level" as="select" value={form.level} onChange={change("level")}
                options={CLASS_LEVELS.map((l) => ({ value: l, label: l }))} />
              <FormField id="cls-arm" label="Arm (letter)" value={form.arm} onChange={change("arm")} error={errors.arm} maxLength={1} hint="For example A or B" autoComplete="off" />
              <FormField id="cls-room" label="Classroom (optional)" value={form.room} onChange={change("room")} autoComplete="off" />
              <FormField id="cls-classTeacherId" label="Class teacher (optional)" as="select" value={form.classTeacherId} onChange={change("classTeacherId")}
                options={[{ value: "", label: "Not assigned" }, ...teachers.filter((t) => t.status === "Active").map((t) => ({ value: t.id, label: `${t.title} ${t.fullName}` }))]} />
            </div>
            <div className="tp-form-actions">
              <Button type="submit" variant="primary">Create class</Button>
              <Button variant="outline" onClick={() => { setCreating(false); setErrors({}); }}>Cancel</Button>
            </div>
          </form>
        </section>
      )}

      <section className="tp-filters" aria-label="Filter classes">
        <FormField id="cls-search" label="Search by class or class teacher" type="search" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
        <FormField id="cls-f-level" label="Level" as="select" value={filters.level} onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value }))}
          options={[{ value: "all", label: "All levels" }, ...CLASS_LEVELS.map((l) => ({ value: l, label: l }))]} />
      </section>
      <p className="tp-count" role="status">Showing {rows.length} of {classes.length} classes</p>

      {rows.length === 0 ? (
        <EmptyState title="No classes found"><p>No class matches your search.</p></EmptyState>
      ) : (
        <div className="sp-table-wrap" role="region" aria-label="Class list" tabIndex={0}>
          <table className="sp-table tp-stack-table">
            <caption className="visually-hidden">Classes</caption>
            <thead>
              <tr>
                <th scope="col">Class</th><th scope="col">Class teacher</th><th scope="col">Students</th>
                <th scope="col">Subjects</th><th scope="col">Classroom</th><th scope="col"><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <th scope="row" data-label="Class">{c.name}</th>
                  <td data-label="Class teacher">{c.classTeacherId ? teacherName(c.classTeacherId) : "Not assigned"}</td>
                  <td data-label="Students">{c.count}</td>
                  <td data-label="Subjects">{c.subjectCount}</td>
                  <td data-label="Classroom">{c.room || "-"}</td>
                  <td className="sp-action-cell"><Button to={`/admin/classes/${c.id}`} variant="outline" size="small" aria-label={`Open ${c.name}`}>Open</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
