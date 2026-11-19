import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import PageTitle from "../components/PageTitle.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useStudentPortal } from "../context/StudentPortalContext.jsx";
import groupBySession from "../utils/groupBySession.js";

export default function AcademicHistory() {
  usePageTitle("Academic History");
  const { terms, student } = useStudentPortal();

  // History = every session before the current one.
  const pastTerms = terms.filter((term) => term.session !== student.session);
  const sessions = groupBySession(pastTerms);

  return (
    <>
      <PageTitle
        title="Academic History"
        description="Your previous sessions and terms. Results you have unlocked stay available here."
      />
      {sessions.length === 0 ? (
        <EmptyState title="No previous sessions yet">
          <p>Earlier sessions will be listed here.</p>
        </EmptyState>
      ) : (
        sessions.map((group) => (
          <section key={group.session} className="sp-block" aria-labelledby={`hist-${group.session.replace("/", "-")}`}>
            <h2 id={`hist-${group.session.replace("/", "-")}`}>
              Session {group.session} <span className="sp-muted">({group.terms[0].className})</span>
            </h2>
            <div className="sp-table-wrap" role="region" aria-label={`Terms in session ${group.session}`} tabIndex={0}>
              <table className="sp-table">
                <thead>
                  <tr>
                    <th scope="col">Term</th>
                    <th scope="col">Class</th>
                    <th scope="col">Status</th>
                    <th scope="col"><span className="visually-hidden">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {group.terms.map((term) => (
                    <tr key={term.id}>
                      <th scope="row">{term.term}</th>
                      <td>{term.className}</td>
                      <td><StatusBadge status={term.status} /></td>
                      <td className="sp-action-cell">
                        <Button
                          to={`/student/results/${term.id}`}
                          variant={term.status === "unlocked" ? "primary" : "outline"}
                          size="small"
                          aria-label={`${term.status === "unlocked" ? "View results" : "Enter result PIN"} for ${term.term}, ${term.session}`}
                        >
                          {term.status === "unlocked" ? "View Results" : "Enter Result PIN"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </>
  );
}
