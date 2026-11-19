import { useState } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import { formatDate } from "../../config/content.js";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import FormField from "../../teacher-dashboard/components/FormField.jsx";
import Flash from "../../teacher-dashboard/components/Flash.jsx";
import ConfirmDialog from "../../teacher-dashboard/components/ConfirmDialog.jsx";
import useFlash from "../../teacher-dashboard/hooks/useFlash.js";
import StatusPill from "../components/StatusPill.jsx";
import { useAdminData } from "../context/AdminDataContext.jsx";
import { TERM_NAMES } from "../config/constants.js";

export default function Sessions() {
  usePageTitle("Academic Sessions and Terms");
  const { sessions, currentSession, currentTerm, addSession, addTerm, setCurrent, setTermStatus } = useAdminData();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [flash, setFlash] = useFlash();
  const [confirm, setConfirm] = useState(null); // { session, term }
  const [termAction, setTermAction] = useState(null); // { session, term, status }

  const create = async (e) => {
    e.preventDefault();
    const res = await addSession(name);
    if (!res.ok) { setError(res.error); document.getElementById("ses-name")?.focus(); return; }
    setFlash({ tone: "success", message: `Session ${name.trim()} created with three closed terms.` });
    setName(""); setError("");
  };
  const act = (res, msg) => setFlash(res.ok ? { tone: "success", message: msg } : { tone: "error", message: res.error });

  return (
    <>
      <PageTitle title="Academic Sessions & Terms" description="Create sessions, set the current term and open or close terms. Changing the current term never deletes results." />
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      <section className="sp-card ad-summary" aria-label="Current session and term">
        <p><strong>Current session:</strong> {currentSession?.name || "None yet. Create a session and set a current term."}</p>
        <p><strong>Current term:</strong> {currentTerm ? `${currentTerm.name} (${currentTerm.status})` : "None"}</p>
      </section>

      <section className="sp-card tp-panel" aria-labelledby="ses-create">
        <h2 id="ses-create">Create a session</h2>
        <form className="ad-adder" onSubmit={create} noValidate>
          <FormField id="ses-name" label="Session" value={name} onChange={(e) => setName(e.target.value)} error={error} hint="For example 2027/2028" autoComplete="off" />
          <Button type="submit" variant="primary">Create session</Button>
        </form>
      </section>

      {sessions.map((s) => {
        const missing = TERM_NAMES.filter((n) => !s.terms.some((t) => t.name === n));
        return (
          <section key={s.id} className="sp-card tp-panel" aria-labelledby={`ses-${s.id}`}>
            <h2 id={`ses-${s.id}`}>{s.name} {s.current && <StatusPill label="Current" />}</h2>
            <div className="sp-table-wrap" role="region" aria-label={`Terms in ${s.name}`} tabIndex={0}>
              <table className="sp-table tp-stack-table">
                <caption className="visually-hidden">Terms in {s.name}</caption>
                <thead><tr><th scope="col">Term</th><th scope="col">Dates</th><th scope="col">State</th><th scope="col">Current</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
                <tbody>
                  {s.terms.map((t) => {
                    const isCurrent = s.current && s.currentTermId === t.id;
                    return (
                      <tr key={t.id}>
                        <th scope="row" data-label="Term">{t.name}</th>
                        <td data-label="Dates">{t.start ? `${formatDate(t.start)} to ${formatDate(t.end)}` : "Dates not set"}</td>
                        <td data-label="State"><StatusPill label={t.status} /></td>
                        <td data-label="Current">{isCurrent ? <StatusPill label="Current" /> : "No"}</td>
                        <td className="sp-action-cell">
                          <div className="ad-row-actions">
                            {!isCurrent && <Button variant="outline" size="small" onClick={() => setConfirm({ session: s, term: t })} aria-label={`Set ${s.name} ${t.name} as current`}>Set current</Button>}
                            {t.status === "Open" && !isCurrent && <Button variant="outline" size="small" onClick={() => setTermAction({ session: s, term: t, status: "Closed" })} aria-label={`Close ${s.name} ${t.name}`}>Close</Button>}
                            {t.status === "Closed" && <Button variant="outline" size="small" onClick={() => setTermAction({ session: s, term: t, status: "Open" })} aria-label={`Open ${s.name} ${t.name}`}>Open</Button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {missing.length > 0 && (
              <p className="tp-actions-line">
                Add a term:{" "}
                {missing.map((n) => (
                  <Button key={n} variant="outline" size="small" onClick={async () => act(await addTerm(s.id, n), `${n} added to ${s.name}.`)}>{n}</Button>
                ))}
              </p>
            )}
          </section>
        );
      })}

      <ConfirmDialog open={Boolean(confirm)} title="Change the current term?" confirmLabel="Yes, set as current"
        onConfirm={async () => { act(await setCurrent(confirm.session.id, confirm.term.id), `${confirm.term.name} ${confirm.session.name} is now the current term. No results were changed.`); setConfirm(null); }}
        onCancel={() => setConfirm(null)}>
        {confirm && <p>{confirm.term.name} of {confirm.session.name} will become the only current term and will be opened. Results from earlier terms are kept.</p>}
      </ConfirmDialog>

      <ConfirmDialog open={Boolean(termAction)} title={termAction?.status === "Open" ? "Open this term?" : "Close this term?"}
        confirmLabel={termAction?.status === "Open" ? "Yes, open term" : "Yes, close term"}
        onConfirm={async () => { act(await setTermStatus(termAction.session.id, termAction.term.id, termAction.status), `${termAction.term.name} ${termAction.session.name} marked ${termAction.status.toLowerCase()}.`); setTermAction(null); }}
        onCancel={() => setTermAction(null)}>
        {termAction && <p>{termAction.status === "Open" ? "Teachers can enter and submit results for an open term." : "A closed term can no longer receive new results. Existing results are kept."}</p>}
      </ConfirmDialog>
    </>
  );
}
