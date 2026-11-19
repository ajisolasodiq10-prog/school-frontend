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

export default function Pins() {
  usePageTitle("Result PIN Management");
  const { pins, sessions, classes, students, currentSession, currentTerm, generatePin, generatePinsForClass, revokePin } = useAdminData();
  const [filters, setFilters] = useState({ search: "", status: "all", session: "all", term: "all" });
  const [flash, setFlash] = useFlash();

  // Generate panel
  const [gen, setGen] = useState({ sessionId: currentSession?.id || "", termId: currentTerm?.id || "", classId: "", studentId: "" });
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState(null); // PINs shown once, never stored
  const [revoking, setRevoking] = useState(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const genSession = sessions.find((s) => s.id === gen.sessionId);
  const classStudents = students.filter((s) => s.classId === gen.classId && s.status === "Active");
  const termNames = [...new Set(sessions.flatMap((s) => s.terms.map((t) => t.name)))];

  const setGenField = (field) => (e) => setGen((g) => ({ ...g, [field]: e.target.value, ...(field === "sessionId" ? { termId: "" } : {}), ...(field === "classId" ? { studentId: "" } : {}) }));

  const generate = async (event) => {
    event.preventDefault();
    if (!gen.sessionId || !gen.termId || !gen.classId) {
      setFlash({ tone: "error", message: "Choose a session, a term and a class." });
      return;
    }
    setBusy(true);
    const res = gen.studentId ? await generatePin(gen.studentId, gen.sessionId, gen.termId) : await generatePinsForClass(gen.classId, gen.sessionId, gen.termId);
    setBusy(false);
    if (!res.ok) {
      setFlash({ tone: "error", message: res.error });
      return;
    }
    const skipped = res.skipped?.length || 0;
    setIssued({ list: res.issued, skipped });
    setFlash({ tone: "success", message: `${res.issued.length} PIN${res.issued.length === 1 ? "" : "s"} created.${skipped ? ` ${skipped} skipped (they already have a PIN).` : ""}` });
  };

  const copyAll = async () => {
    const text = issued.list.map((x) => `${x.studentId}\t${x.name}\t${x.pin}`).join("\n");
    try { await navigator.clipboard.writeText(text); setFlash({ tone: "success", message: "PINs copied." }); } catch { setFlash({ tone: "error", message: "Could not copy. Select the table and copy it by hand." }); }
  };

  const confirmRevoke = async () => {
    if (reason.trim().length < 3) { setReasonError("Give a short reason."); return; }
    const res = await revokePin(revoking.id, reason);
    setFlash(res.ok ? { tone: "success", message: "PIN revoked." } : { tone: "error", message: res.error });
    setRevoking(null); setReason(""); setReasonError("");
  };

  const q = filters.search.trim().toLowerCase();
  const rows = pins
    .filter((p) => (!q || p.studentId.toLowerCase().includes(q) || p.studentName.toLowerCase().includes(q)) &&
      (filters.status === "all" || p.status === filters.status) &&
      (filters.session === "all" || p.session === filters.session) &&
      (filters.term === "all" || p.term === filters.term));
  const { visible, remaining, showMore } = usePaged(rows, JSON.stringify(filters), 20);

  return (
    <>
      <PageTitle title="Result PIN Management" description="Create result PINs and track whether they have been used." />
      <Flash flash={flash} onDismiss={() => setFlash(null)} />
      <section className="sp-notice ad-demo-note" aria-label="About result PINs">
        <span>
          Each PIN belongs to one student and one term and works once. A PIN is shown only when it is created, because the system stores it in a form nobody can read back. Give PINs to families outside this portal. No payments are handled here.
        </span>
      </section>

      <section className="sp-card tp-panel" aria-label="Create result PINs">
        <h2>Create PINs</h2>
        <form onSubmit={generate} noValidate>
          <div className="tp-select-grid">
            <FormField id="gen-session" label="Session" as="select" value={gen.sessionId} onChange={setGenField("sessionId")}
              options={[{ value: "", label: "Choose a session" }, ...sessions.map((s) => ({ value: s.id, label: s.name }))]} />
            <FormField id="gen-term" label="Term" as="select" value={gen.termId} onChange={setGenField("termId")}
              options={[{ value: "", label: "Choose a term" }, ...(genSession?.terms || []).map((t) => ({ value: t.id, label: t.name }))]} />
            <FormField id="gen-class" label="Class" as="select" value={gen.classId} onChange={setGenField("classId")}
              options={[{ value: "", label: "Choose a class" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]} />
            <FormField id="gen-student" label="Student" as="select" value={gen.studentId} onChange={setGenField("studentId")}
              options={[{ value: "", label: "Every student in the class" }, ...classStudents.map((s) => ({ value: s.id, label: `${s.name} (${s.id})` }))]} />
          </div>
          <Button type="submit" variant="primary" disabled={busy}>{busy ? "Creating..." : "Create PINs"}</Button>
        </form>
      </section>

      {issued && (
        <section className="sp-card tp-panel" aria-labelledby="issued-title" role="status">
          <h2 id="issued-title">New PINs (shown once)</h2>
          <p>Copy or print these now. They cannot be shown again. If one is lost, revoke it and create a new one.</p>
          <div className="sp-table-wrap" role="region" aria-label="New PINs" tabIndex={0}>
            <table className="sp-table">
              <thead><tr><th scope="col">Student ID</th><th scope="col">Name</th><th scope="col">PIN</th></tr></thead>
              <tbody>{issued.list.map((x) => <tr key={x.studentId}><td>{x.studentId}</td><th scope="row">{x.name}</th><td><code>{x.pin}</code></td></tr>)}</tbody>
            </table>
          </div>
          {issued.skipped > 0 && <p className="sp-muted">{issued.skipped} student(s) already had a PIN for this term and were skipped.</p>}
          <p className="tp-actions-line sp-no-print">
            <Button variant="outline" size="small" onClick={copyAll}>Copy all</Button>{" "}
            <Button variant="outline" size="small" onClick={() => window.print()}>Print</Button>{" "}
            <Button variant="primary" size="small" onClick={() => setIssued(null)}>Done</Button>
          </p>
        </section>
      )}

      <section className="tp-filters ad-filters-four" aria-label="Filter PIN records">
        <FormField id="pf-search" label="Search student or ID" type="search" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
        <FormField id="pf-status" label="Status" as="select" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          options={[{ value: "all", label: "All statuses" }, { value: "Unused", label: "Unused" }, { value: "Used", label: "Used" }, { value: "Revoked", label: "Revoked" }]} />
        <FormField id="pf-session" label="Session" as="select" value={filters.session} onChange={(e) => setFilters((f) => ({ ...f, session: e.target.value }))}
          options={[{ value: "all", label: "All sessions" }, ...sessions.map((s) => ({ value: s.name, label: s.name }))]} />
        <FormField id="pf-term" label="Term" as="select" value={filters.term} onChange={(e) => setFilters((f) => ({ ...f, term: e.target.value }))}
          options={[{ value: "all", label: "All terms" }, ...termNames.map((t) => ({ value: t, label: t }))]} />
      </section>
      <p className="tp-count" role="status">{rows.length} of {pins.length} PIN records</p>

      {rows.length === 0 ? (
        <EmptyState title="No PIN records found"><p>No PINs have been created yet, or none match your search or filters.</p></EmptyState>
      ) : (
        <>
          <div className="sp-table-wrap" role="region" aria-label="PIN records" tabIndex={0}>
            <table className="sp-table tp-stack-table">
              <caption className="visually-hidden">PIN records</caption>
              <thead><tr><th scope="col">Student</th><th scope="col">Session and term</th><th scope="col">Created</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Action</span></th></tr></thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id}>
                    <th scope="row" data-label="Student">{p.studentName ? `${p.studentName} (${p.studentId})` : p.studentId}</th>
                    <td data-label="Term">{p.session}, {p.term}</td>
                    <td data-label="Created">{p.createdOn ? formatDate(p.createdOn) : "-"}</td>
                    <td data-label="Status"><StatusPill label={p.status} />{p.usedOn && <small> {formatDate(p.usedOn)}</small>}</td>
                    <td data-label="Action">{p.status === "Unused" && <Button variant="outline-danger" size="small" onClick={() => setRevoking(p)}>Revoke</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {remaining > 0 && <p className="ad-more"><Button variant="outline" size="small" onClick={showMore}>Show more ({remaining} remaining)</Button></p>}
        </>
      )}

      <ConfirmDialog open={Boolean(revoking)} title="Revoke this PIN?" confirmLabel="Revoke PIN" danger onConfirm={confirmRevoke} onCancel={() => { setRevoking(null); setReason(""); setReasonError(""); }}>
        <p>The PIN for <strong>{revoking?.studentName || revoking?.studentId}</strong> will stop working. You can then create a new one.</p>
        <FormField id="revoke-reason" label="Reason" value={reason} onChange={(e) => { setReason(e.target.value); setReasonError(""); }} error={reasonError} />
      </ConfirmDialog>
    </>
  );
}
