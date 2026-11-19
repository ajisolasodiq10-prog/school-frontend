import { useMemo, useState } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import { formatDate } from "../../config/content.js";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import FormField from "../../teacher-dashboard/components/FormField.jsx";
import Flash from "../../teacher-dashboard/components/Flash.jsx";
import ConfirmDialog from "../../teacher-dashboard/components/ConfirmDialog.jsx";
import useFlash from "../../teacher-dashboard/hooks/useFlash.js";
import { useAdminData } from "../context/AdminDataContext.jsx";
import { EVENT_TYPES } from "../config/constants.js";
import { formatRange, todayISO } from "../utils/dates.js";

const blank = () => ({ type: "School Event", title: "", startDate: todayISO(), endDate: "", description: "" });
const monthLabel = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-NG", { month: "long", year: "numeric" });

export default function Calendar() {
  usePageTitle("School Calendar");
  const { events, saveEvent, deleteEvent } = useAdminData();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [type, setType] = useState("all");
  const [removing, setRemoving] = useState(null);
  const [flash, setFlash] = useFlash();

  const change = (f) => (e) => setForm((x) => ({ ...x, [f]: e.target.value }));
  const groups = useMemo(() => {
    const filtered = events.filter((e) => type === "all" || e.type === type).sort((a, b) => a.startDate.localeCompare(b.startDate));
    const map = new Map();
    filtered.forEach((e) => {
      const key = e.startDate.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    });
    return [...map.entries()];
  }, [events, type]);

  const openNew = () => { setForm(blank()); setErrors({}); setEditing("new"); };
  const openEdit = (e) => { setForm({ type: e.type, title: e.title, startDate: e.startDate, endDate: e.endDate || "", description: e.description || "" }); setErrors({}); setEditing(e.id); };

  const submit = async (ev) => {
    ev.preventDefault();
    const found = {};
    if (form.title.trim().length < 3) found.title = "Enter an event title (at least 3 characters).";
    if (!form.startDate) found.startDate = "Choose a start date.";
    if (form.endDate && form.endDate < form.startDate) found.endDate = "The end date cannot be before the start date.";
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) { document.getElementById(`evt-${first}`)?.focus(); return; }
    const res = await saveEvent({ ...form, title: form.title.trim(), description: form.description.trim() }, editing === "new" ? undefined : editing);
    if (!res.ok) { setFlash({ tone: "error", message: res.error }); return; }
    setFlash({ tone: "success", message: editing === "new" ? "Event added." : "Event updated." });
    setEditing(null);
  };

  return (
    <>
      <PageTitle title="School Calendar" description="Examination periods, resumption dates, holidays, meetings, events and deadlines.">
        {!editing && <Button variant="primary" size="small" onClick={openNew}>Add event</Button>}
      </PageTitle>
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      {editing && (
        <section className="sp-card tp-panel" aria-labelledby="evt-form-title">
          <h2 id="evt-form-title">{editing === "new" ? "Add event" : "Edit event"}</h2>
          <form className="tp-form" onSubmit={submit} noValidate>
            <div className="tp-select-grid">
              <FormField id="evt-title" label="Title" value={form.title} onChange={change("title")} error={errors.title} autoComplete="off" />
              <FormField id="evt-type" label="Type" as="select" value={form.type} onChange={change("type")} options={EVENT_TYPES.map((t) => ({ value: t, label: t }))} />
              <FormField id="evt-startDate" label="Start date" type="date" value={form.startDate} onChange={change("startDate")} error={errors.startDate} />
              <FormField id="evt-endDate" label="End date (optional)" type="date" value={form.endDate} onChange={change("endDate")} error={errors.endDate} />
            </div>
            <FormField id="evt-description" label="Details (optional)" as="textarea" rows={3} value={form.description} onChange={change("description")} />
            <div className="tp-form-actions">
              <Button type="submit" variant="primary">{editing === "new" ? "Add event" : "Save changes"}</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </form>
        </section>
      )}

      <section className="tp-filters tp-filters-one" aria-label="Filter events">
        <FormField id="evt-f-type" label="Event type" as="select" value={type} onChange={(e) => setType(e.target.value)}
          options={[{ value: "all", label: "All types" }, ...EVENT_TYPES.map((t) => ({ value: t, label: t }))]} />
      </section>

      {groups.length === 0 ? (
        <EmptyState title="No events found"><p>There are no events of this type.</p></EmptyState>
      ) : groups.map(([key, list]) => (
        <section key={key} aria-labelledby={`month-${key}`}>
          <h2 id={`month-${key}`}>{monthLabel(`${key}-01`)}</h2>
          <ul className="ad-event-list">
            {list.map((e) => (
              <li key={e.id} className="sp-card ad-event">
                <div>
                  <span className="sp-badge sp-badge-info">{e.type}</span>
                  <h3>{e.title}</h3>
                  <p className="ad-event-date">{formatRange(e.startDate, e.endDate, formatDate)}</p>
                  {e.description && <p>{e.description}</p>}
                </div>
                <div className="ad-row-actions">
                  <Button variant="outline" size="small" onClick={() => openEdit(e)} aria-label={`Edit ${e.title}`}>Edit</Button>
                  <Button variant="outline-danger" size="small" onClick={() => setRemoving(e)} aria-label={`Remove ${e.title}`}>Remove</Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <ConfirmDialog open={Boolean(removing)} title="Remove this event?" danger confirmLabel="Yes, remove"
        onConfirm={async () => {
          const res = await deleteEvent(removing.id);
          setFlash(res.ok ? { tone: "success", message: "Event removed." } : { tone: "error", message: res.error });
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}>
        {removing && <p>&ldquo;{removing.title}&rdquo; will be removed from the calendar.</p>}
      </ConfirmDialog>
    </>
  );
}
