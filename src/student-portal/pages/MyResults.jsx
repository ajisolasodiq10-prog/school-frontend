import usePageTitle from "../../hooks/usePageTitle.js";
import PageTitle from "../components/PageTitle.jsx";
import TermCard from "../components/TermCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useStudentPortal } from "../context/StudentPortalContext.jsx";
import groupBySession from "../utils/groupBySession.js";

export default function MyResults() {
  usePageTitle("My Results");
  const { terms } = useStudentPortal();
  const sessions = groupBySession(terms);

  return (
    <>
      <PageTitle
        title="My Results"
        description="Choose a term to view its results. Locked terms need a result PIN."
      />
      {sessions.length === 0 ? (
        <EmptyState title="No results available yet">
          <p>Your results will appear here when the school publishes them.</p>
        </EmptyState>
      ) : (
        sessions.map((group) => (
          <section key={group.session} className="sp-block" aria-labelledby={`session-${group.session.replace("/", "-")}`}>
            <h2 id={`session-${group.session.replace("/", "-")}`}>Session {group.session}</h2>
            <ul className="sp-grid">
              {group.terms.map((term) => (
                <TermCard key={term.id} term={term} />
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
