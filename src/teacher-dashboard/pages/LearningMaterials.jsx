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

const TYPES = ["Notes", "Document", "Link"];
const linkPattern = /^(https?:\/\/[^\s]+|\/[^\s]*)$/i;

function validate(form, classes) {
  const errors = {};
  if (form.title.trim().length < 3) errors.title = "Enter a title of at least 3 characters.";
  if (form.description.trim().length < 10) errors.description = "Describe the material in at least 10 characters.";
  const chosen = classes.find((c) => c.id === form.classId);
  if (!chosen) errors.classId = "Choose one of your classes.";
  else if (!chosen.subjects.includes(form.subject)) errors.subject = "Choose a subject you teach in this class.";
  if (!TYPES.includes(form.type)) errors.type = "Choose a material type.";
  const link = form.link.trim();
  if (form.type === "Link" && !link) errors.link = "Add the link for this material.";
  else if (link && !linkPattern.test(link)) errors.link = "Enter a web address starting with https://.";
  return errors;
}

function LearningMaterialsInner() {
  usePageTitle("Learning Materials");
  const { classes, materials, saveMaterial, deleteMaterial } = useTeacherData();
  const blank = () => ({ title: "", description: "", classId: classes[0].id, subject: classes[0].subjects[0], type: "Notes", link: "" });

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [toRemove, setToRemove] = useState(null);
  const [classFilter, setClassFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useFlash();

  const classOf = (id) => classes.find((c) => c.id === id);
  const openNew = () => {
    setForm(blank());
    setErrors({});
    setEditing("new");
  };
  const openEdit = (item) => {
    setForm({ title: item.title, description: item.description, classId: item.classId, subject: item.subject, type: item.type, link: item.link });
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
    const found = validate(form, classes);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(`mat-${first}`)?.focus();
      return;
    }
    const existing = editing !== "new" ? materials.find((m) => m.id === editing) : null;
    setSaving(true);
    const res = await saveMaterial({
      id: existing?.id,
      title: form.title.trim(),
      description: form.description.trim(),
      classId: form.classId,
      subject: form.subject,
      type: form.type,
      link: form.link.trim(),
    });
    setSaving(false);
    if (!res.ok) { setFlash({ tone: "error", message: res.error }); return; }
    setFlash({ tone: "success", message: existing ? "Material updated." : "Material added." });
    closeForm();
  };

  const confirmRemove = async () => {
    const res = await deleteMaterial(toRemove.id);
    setFlash(res.ok ? { tone: "success", message: `"${toRemove.title}" was removed.` } : { tone: "error", message: res.error });
    setToRemove(null);
  };

  const visible = materials.filter((m) => classFilter === "all" || m.classId === classFilter);
  const formClass = classOf(form.classId);

  return (
    <>
      <PageTitle title="Learning Materials" description="Add links to notes and resources for your classes.">
        {!editing && (
          <Button variant="primary" size="small" onClick={openNew}>
            &nbsp;Add material
          </Button>
        )}
      </PageTitle>
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      {editing && (
        <section className="sp-card tp-panel" aria-labelledby="mat-form-title">
          <h2 id="mat-form-title">{editing === "new" ? "Add material" : "Edit material"}</h2>
          <form className="tp-form" onSubmit={handleSubmit} noValidate>
            <FormField id="mat-title" label="Title" value={form.title} onChange={change("title")} error={errors.title} maxLength={120} />
            <FormField id="mat-description" label="Description" as="textarea" rows={3} value={form.description} onChange={change("description")} error={errors.description} />
            <div className="tp-select-grid">
              <FormField id="mat-classId" label="Class" as="select" value={form.classId} onChange={change("classId")} error={errors.classId} disabled={editing !== "new"}
                options={classes.map((c) => ({ value: c.id, label: c.name }))} />
              <FormField id="mat-subject" label="Subject" as="select" value={form.subject} onChange={change("subject")} error={errors.subject} disabled={editing !== "new"}
                options={formClass.subjects.map((s) => ({ value: s, label: s }))} />
              <FormField id="mat-type" label="Material type" as="select" value={form.type} onChange={change("type")} error={errors.type}
                options={TYPES.map((t) => ({ value: t, label: t }))} />
            </div>
            <FormField
              id="mat-link"
              label="Resource link"
              type="text"
              inputMode="url"
              value={form.link}
              onChange={change("link")}
              error={errors.link}
              hint="Files are not uploaded; add a link to the resource."
            />
            <div className="tp-form-actions">
              <Button type="submit" variant="primary" disabled={saving}>
                {editing === "new" ? "Add material" : "Save changes"}
              </Button>
              <Button variant="outline" onClick={closeForm}>
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}

      <div className="tp-filters tp-filters-one">
        <FormField
          id="mat-filter"
          label="Show class"
          as="select"
          value={classFilter}
          onChange={(event) => setClassFilter(event.target.value)}
          options={[{ value: "all", label: "All classes" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No materials yet">
          <p>Add a link to notes or a resource for your class.</p>
          <Button variant="primary" size="small" onClick={openNew}>
            Add material
          </Button>
        </EmptyState>
      ) : (
        <ul className="sp-list">
          {visible.map((item) => (
            <li key={item.id} className="sp-card tp-material">
              <div className="tp-material-info">
                <h3>{item.title}</h3>
                <p className="sp-muted">
                  {classOf(item.classId)?.name} &middot; {item.subject} &middot; {item.type} &middot; Added{" "}
                  <time dateTime={item.createdOn}>{formatDate(item.createdOn)}</time>
                </p>
                <p>{item.description}</p>
              </div>
              <div className="tp-card-actions">
                {item.link ? (
                  <Button href={item.link} variant="outline" size="small" target="_blank" rel="noopener noreferrer" aria-label={`View ${item.title}`}>
                    &nbsp;View
                  </Button>
                ) : (
                  <span className="sp-muted">No link added</span>
                )}
                <Button variant="outline" size="small" onClick={() => openEdit(item)} aria-label={`Edit ${item.title}`}>
                  &nbsp;Edit
                </Button>
                <Button variant="outline-danger" size="small" onClick={() => setToRemove(item)} aria-label={`Remove ${item.title}`}>
                  &nbsp;Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toRemove)}
        title="Remove this material?"
        confirmLabel="Remove material"
        danger
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
      >
        <p>
          <strong>{toRemove?.title}</strong> will be removed.
        </p>
      </ConfirmDialog>
    </>
  );
}

export default function LearningMaterials() {
  const { classes } = useTeacherData();
  if (classes.length === 0) return <NoClasses title="Learning Materials" description="Add resources for your classes." />;
  return <LearningMaterialsInner />;
}
