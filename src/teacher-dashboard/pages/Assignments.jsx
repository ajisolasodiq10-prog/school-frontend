import { useState } from "react";
import NoClasses from "../components/NoClasses.jsx";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import { formatDate } from "../../config/content.js";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import FormField from "../components/FormField.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Flash from "../components/Flash.jsx";
import useFlash from "../hooks/useFlash.js";
import { useTeacherData } from "../context/TeacherDataContext.jsx";
import { todayISO } from "../utils/dates.js";

// Open / Due today / Past due, worked out from the due date.
function statusOf(dueDate) {
  const today = todayISO();
  if (dueDate < today) return { label: "Past due", tone: "warn" };
  if (dueDate === today) return { label: "Due today", tone: "info" };
  return { label: "Open", tone: "ok" };
}

function validate(form, originalDueDate, classes) {
  const errors = {};
  if (form.title.trim().length < 3) errors.title = "Enter a title of at least 3 characters.";
  else if (form.title.trim().length > 100) errors.title = "Keep the title under 100 characters.";
  if (form.description.trim().length < 10) errors.description = "Describe the assignment in at least 10 characters.";
  const chosen = classes.find((c) => c.id === form.classId);
  if (!chosen) errors.classId = "Choose one of your classes.";
  else if (!chosen.subjects.includes(form.subject)) errors.subject = "Choose a subject you teach in this class.";
  if (!form.dueDate) errors.dueDate = "Choose a due date.";
  else if (form.dueDate !== originalDueDate && form.dueDate < todayISO()) errors.dueDate = "The due date cannot be in the past.";
  return errors;
}

function AssignmentsInner() {
  usePageTitle("Assignments");
  const { classes, assignments, saveAssignment, deleteAssignment } = useTeacherData();
  const blank = () => ({ title: "", description: "", classId: classes[0].id, subject: classes[0].subjects[0], dueDate: "" });

  const [editing, setEditing] = useState(null); // null = closed, "new" or an assignment id
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [toDelete, setToDelete] = useState(null);
  const [filter, setFilter] = useState("All");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useFlash();

  const originalDueDate = editing && editing !== "new" ? assignments.find((a) => a.id === editing)?.dueDate : null;
  const classOf = (id) => classes.find((c) => c.id === id);

  const openNew = () => {
    setForm(blank());
    setErrors({});
    setEditing("new");
  };
  const openEdit = (item) => {
    setForm({ title: item.title, description: item.description, classId: item.classId, subject: item.subject, dueDate: item.dueDate });
    setErrors({});
    setEditing(item.id);
  };
  const closeForm = () => {
    setEditing(null);
    setErrors({});
  };

  const change = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "classId") next.subject = classOf(value).subjects[0];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate(form, originalDueDate, classes);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(`asg-${first}`)?.focus();
      return;
    }
    const existing = editing !== "new" ? assignments.find((a) => a.id === editing) : null;
    setSaving(true);
    const res = await saveAssignment({
      id: existing?.id,
      title: form.title.trim(),
      description: form.description.trim(),
      classId: form.classId,
      subject: form.subject,
      dueDate: form.dueDate,
    });
    setSaving(false);
    if (!res.ok) { setFlash({ tone: "error", message: res.error }); return; }
    setFlash({ tone: "success", message: existing ? "Assignment updated." : "Assignment created." });
    closeForm();
  };

  const confirmDelete = async () => {
    const res = await deleteAssignment(toDelete.id);
    setFlash(res.ok ? { tone: "success", message: `"${toDelete.title}" was deleted.` } : { tone: "error", message: res.error });
    setToDelete(null);
  };

  const today = todayISO();
  const counts = {
    All: assignments.length,
    Open: assignments.filter((a) => a.dueDate >= today).length,
    "Past due": assignments.filter((a) => a.dueDate < today).length,
  };
  const visible = assignments
    .filter((a) => filter === "All" || statusOf(a.dueDate).label === filter || (filter === "Open" && a.dueDate === today))
    .sort((a, b) => {
      const aPast = a.dueDate < today;
      const bPast = b.dueDate < today;
      if (aPast !== bPast) return aPast ? 1 : -1;
      return aPast ? b.dueDate.localeCompare(a.dueDate) : a.dueDate.localeCompare(b.dueDate);
    });

  const formClass = classOf(form.classId);

  return (
    <>
      <PageTitle title="Assignments" description="Create and manage assignments for your classes.">
        {!editing && (
          <Button variant="primary" size="small" onClick={openNew}>
            &nbsp;New assignment
          </Button>
        )}
      </PageTitle>
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      {editing && (
        <section className="sp-card tp-panel" aria-labelledby="asg-form-title">
          <h2 id="asg-form-title">{editing === "new" ? "Create assignment" : "Edit assignment"}</h2>
          <form className="tp-form" onSubmit={handleSubmit} noValidate>
            <FormField id="asg-title" label="Title" value={form.title} onChange={change("title")} error={errors.title} maxLength={120} />
            <FormField id="asg-description" label="Description and instructions" as="textarea" rows={4} value={form.description} onChange={change("description")} error={errors.description} />
            <div className="tp-select-grid">
              <FormField id="asg-classId" label="Class" as="select" value={form.classId} onChange={change("classId")} error={errors.classId} disabled={editing !== "new"}
                options={classes.map((c) => ({ value: c.id, label: c.name }))} />
              <FormField id="asg-subject" label="Subject" as="select" value={form.subject} onChange={change("subject")} error={errors.subject} disabled={editing !== "new"}
                options={formClass.subjects.map((s) => ({ value: s, label: s }))} />
              <FormField id="asg-dueDate" label="Due date" type="date" value={form.dueDate} onChange={change("dueDate")} error={errors.dueDate} />
            </div>
            <div className="tp-form-actions">
              <Button type="submit" variant="primary" disabled={saving}>
                {editing === "new" ? "Create assignment" : "Save changes"}
              </Button>
              <Button variant="outline" onClick={closeForm}>
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}

      <div className="sp-chips" role="group" aria-label="Filter assignments by status">
        {Object.keys(counts).map((name) => (
          <button key={name} type="button" className="sp-chip" aria-pressed={filter === name} onClick={() => setFilter(name)}>
            {name} ({counts[name]})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No assignments here">
          <p>{assignments.length === 0 ? "Create your first assignment to see it here." : "No assignments match this filter."}</p>
          {assignments.length === 0 && (
            <Button variant="primary" size="small" onClick={openNew}>
              New assignment
            </Button>
          )}
        </EmptyState>
      ) : (
        <ul className="sp-list">
          {visible.map((item) => {
            const status = statusOf(item.dueDate);
            return (
              <li key={item.id} className="sp-card sp-assignment">
                <div className="sp-assignment-top">
                  <p className="sp-tag">{classOf(item.classId)?.name} &middot; {item.subject}</p>
                  <span className={`sp-badge sp-badge-${status.tone}`}>
                    {status.label}
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <dl className="sp-dates">
                  <div>
                    <dt>Created</dt>
                    <dd><time dateTime={item.createdOn}>{formatDate(item.createdOn)}</time></dd>
                  </div>
                  <div>
                    <dt>Due</dt>
                    <dd><time dateTime={item.dueDate}>{formatDate(item.dueDate)}</time></dd>
                  </div>
                </dl>
                <div className="tp-card-actions">
                  <Button variant="outline" size="small" onClick={() => openEdit(item)} aria-label={`Edit ${item.title}`}>
                    &nbsp;Edit
                  </Button>
                  <Button variant="outline-danger" size="small" onClick={() => setToDelete(item)} aria-label={`Delete ${item.title}`}>
                    &nbsp;Delete
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this assignment?"
        confirmLabel="Delete assignment"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      >
        <p>
          <strong>{toDelete?.title}</strong> will be removed.
        </p>
      </ConfirmDialog>
    </>
  );
}

export default function Assignments() {
  const { classes } = useTeacherData();
  if (classes.length === 0) return <NoClasses title="Assignments" description="Create assignments for your classes." />;
  return <AssignmentsInner />;
}
