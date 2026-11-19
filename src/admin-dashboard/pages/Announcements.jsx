import { useState } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import { formatDate } from "../../config/content.js";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import FormField from "../../teacher-dashboard/components/FormField.jsx";
import Flash from "../../teacher-dashboard/components/Flash.jsx";
import ConfirmDialog from "../../teacher-dashboard/components/ConfirmDialog.jsx";
import useFlash from "../../teacher-dashboard/hooks/useFlash.js";
import StatusPill from "../components/StatusPill.jsx";
import usePaged from "../hooks/usePaged.js";
import { useAdminData } from "../context/AdminDataContext.jsx";
import { AUDIENCE_TYPES, ANNOUNCEMENT_STATUSES } from "../config/constants.js";
import { todayISO } from "../utils/dates.js";

const blank = () => ({ title: "", message: "", audienceType: "everyone", classId: "", status: "Draft", publishDate: todayISO() });

export default function Announcements() {
  usePageTitle("Announcements");
  const { announcements, classes, saveAnnouncement, deleteAnnouncement, className } = useAdminData();
  const [editing, setEditing] = useState(null); // null | "new" | id
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [filters, setFilters] = useState({ search: "", status: "all" });
  const [flash, setFlash] = useFlash();
  const [removing, setRemoving] = useState(null);
  const [pendingPublish, setPendingPublish] = useState(false);
  const [saving, setSaving] = useState(false);

  const change = (f) => (e) => setForm((x) => ({ ...x, [f]: e.target.value }));
  const audienceLabel = (a) => (a.type === "class" ? `Class ${className(a.classId)}` : AUDIENCE_TYPES.find((t) => t.value === a.type)?.label || a.type);
  const stateLabel = (a) => (a.status === "Published" && a.publishDate > todayISO() ? "Scheduled" : a.status);

  const q = filters.search.trim().toLowerCase();
  const rows = announcements
    .filter((a) => (!q || a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q)) && (filters.status === "all" || a.status === filters.status))
    .sort((a, b) => b.publishDate.localeCompare(a.publishDate));
  const { visible, remaining, showMore } = usePaged(rows, JSON.stringify(filters), 15);

  const openNew = () => { setForm(blank()); setErrors({}); setEditing("new"); };
  const openEdit = (a) => {
    setForm({ title: a.title, message: a.message, audienceType: a.audience.type, classId: a.audience.classId || "", status: a.status, publishDate: a.publishDate });
    setErrors({}); setEditing(a.id);
  };

  const commit = async () => {
    const audience = form.audienceType === "class" ? { type: "class", classId: form.classId } : { type: form.audienceType };
    setSaving(true);
    const res = await saveAnnouncement({ title: form.title.trim(), message: form.message.trim(), audience, status: form.status, publishDate: form.publishDate }, editing === "new" ? undefined : editing);
    setSaving(false);
    setPendingPublish(false);
    if (!res.ok) { setFlash({ tone: "error", message: res.error }); return; }
    setFlash({ tone: "success", message: form.status === "Published" ? "Announcement published." : "Announcement saved as a draft." });
    setEditing(null);
  };

  const submit = (e) => {
    e.preventDefault();
    const found = {};
    if (form.title.trim().length < 5) found.title = "Enter a title of at least 5 characters.";
    if (form.message.trim().length < 10) found.message = "Enter a message of at least 10 characters.";
    if (form.audienceType === "class" && !form.classId) found.classId = "Choose a class.";
    if (!form.publishDate) found.publishDate = "Choose a publication date.";
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) { document.getElementById(`ann-${first}`)?.focus(); return; }
    if (form.status === "Published") setPendingPublish(true); else commit();
  };

  return (
    <>
      <PageTitle title="Announcements" description="Create announcements for students, teachers or a class. Published ones appear in the Student and Teacher views on their publication date.">
        {!editing && <Button variant="primary" size="small" onClick={openNew}>New announcement</Button>}
      </PageTitle>
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      {editing && (
        <div className="tp-two-col">
          <section className="sp-card tp-panel" aria-labelledby="ann-form-title">
            <h2 id="ann-form-title">{editing === "new" ? "New announcement" : "Edit announcement"}</h2>
            <form className="tp-form" onSubmit={submit} noValidate>
              <FormField id="ann-title" label="Title" value={form.title} onChange={change("title")} error={errors.title} autoComplete="off" />
              <FormField id="ann-message" label="Message" as="textarea" rows={5} value={form.message} onChange={change("message")} error={errors.message} />
              <div className="tp-select-grid">
                <FormField id="ann-audienceType" label="Audience" as="select" value={form.audienceType} onChange={change("audienceType")}
                  options={AUDIENCE_TYPES} />
                {form.audienceType === "class" && (
                  <FormField id="ann-classId" label="Class" as="select" value={form.classId} onChange={change("classId")} error={errors.classId}
                    options={[{ value: "", label: "Choose class" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]} />
                )}
                <FormField id="ann-status" label="Status" as="select" value={form.status} onChange={change("status")}
                  options={ANNOUNCEMENT_STATUSES.map((s) => ({ value: s, label: s }))} />
                <FormField id="ann-publishDate" label="Publication date" type="date" value={form.publishDate} onChange={change("publishDate")} error={errors.publishDate} />
              </div>
              {form.audienceType === "everyone" && <p className="form-note">An announcement for everyone is also visible on the public school website.</p>}
              {form.audienceType === "class" && <p className="form-note">A class announcement is shown to the students of that class and their parents.</p>}
              <div className="tp-form-actions">
                <Button type="submit" variant="primary" disabled={saving}>{form.status === "Published" ? "Publish" : "Save draft"}</Button>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              </div>
            </form>
          </section>
          <section className="sp-card tp-panel" aria-labelledby="ann-preview-title">
            <h2 id="ann-preview-title">Preview</h2>
            <article className="ad-preview">
              <small>{form.publishDate ? formatDate(form.publishDate) : "No date"} &middot; {form.audienceType === "class" ? `Class ${className(form.classId) === "-" ? "(not chosen)" : className(form.classId)}` : AUDIENCE_TYPES.find((t) => t.value === form.audienceType)?.label}</small>
              <h3>{form.title || "Announcement title"}</h3>
              <p>{form.message || "The announcement message will appear here."}</p>
              <StatusPill label={form.status} />
            </article>
          </section>
        </div>
      )}

      <section className="tp-filters" aria-label="Filter announcements">
        <FormField id="an-search" label="Search announcements" type="search" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
        <FormField id="an-status" label="Status" as="select" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          options={[{ value: "all", label: "All" }, ...ANNOUNCEMENT_STATUSES.map((s) => ({ value: s, label: s }))]} />
      </section>
      <p className="tp-count" role="status">{rows.length} of {announcements.length} announcements</p>

      {rows.length === 0 ? (
        <EmptyState title="No announcements found"><p>No announcement matches your search.</p></EmptyState>
      ) : (
        <>
          <div className="sp-table-wrap" role="region" aria-label="Announcements" tabIndex={0}>
            <table className="sp-table tp-stack-table">
              <caption className="visually-hidden">Announcements</caption>
              <thead><tr><th scope="col">Title</th><th scope="col">Audience</th><th scope="col">Publication date</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                {visible.map((a) => (
                  <tr key={a.id}>
                    <th scope="row" data-label="Title">{a.title}</th>
                    <td data-label="Audience">{audienceLabel(a.audience)}</td>
                    <td data-label="Date">{formatDate(a.publishDate)}</td>
                    <td data-label="Status"><StatusPill label={stateLabel(a)} /></td>
                    <td className="sp-action-cell">
                      <div className="ad-row-actions">
                        <Button variant="outline" size="small" onClick={() => openEdit(a)} aria-label={`Edit ${a.title}`}>Edit</Button>
                        <Button variant="outline-danger" size="small" onClick={() => setRemoving(a)} aria-label={`Delete ${a.title}`}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {remaining > 0 && <p className="ad-more"><Button variant="outline" size="small" onClick={showMore}>Show more ({remaining} remaining)</Button></p>}
        </>
      )}

      <ConfirmDialog open={pendingPublish} title="Publish this announcement?" confirmLabel={saving ? "Publishing..." : "Yes, publish"} onConfirm={commit} onCancel={() => setPendingPublish(false)}>
        <p>It will appear for its audience from {form.publishDate ? formatDate(form.publishDate) : "the chosen date"}.</p>
      </ConfirmDialog>
      <ConfirmDialog open={Boolean(removing)} title="Delete this announcement?" danger confirmLabel="Yes, delete"
        onConfirm={async () => {
          const res = await deleteAnnouncement(removing.id);
          setFlash(res.ok ? { tone: "success", message: "Announcement deleted." } : { tone: "error", message: res.error });
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}>
        {removing && <p>&ldquo;{removing.title}&rdquo; will be removed.</p>}
      </ConfirmDialog>
    </>
  );
}
