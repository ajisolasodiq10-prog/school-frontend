import { Link, useParams } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import { school } from "../../config/siteConfig.js";
import PageTitle from "../components/PageTitle.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import PinForm from "../components/PinForm.jsx";
import ResultsTable from "../components/ResultsTable.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useStudentPortal } from "../context/StudentPortalContext.jsx";
import useAsync from "../hooks/useAsync.js";
import downloadCsv from "../utils/downloadCsv.js";

export default function ResultDetail() {
  const { termId } = useParams();
  const { student, terms, getTermResults } = useStudentPortal();
  const term = terms.find((item) => item.id === termId);
  const unlocked = term?.status === "unlocked";

  usePageTitle(term ? `${term.term} Results` : "Results");

  // Results are only loaded once the term is unlocked.
  const { data, loading, error } = useAsync(
    () => (unlocked ? getTermResults(termId) : Promise.resolve(null)),
    [termId, unlocked, getTermResults]
  );

  if (!term) {
    return (
      <EmptyState title="Term not found">
        <p>We could not find that term.</p>
        <Button to="/student/results" variant="primary" size="small">
          Back to My Results
        </Button>
      </EmptyState>
    );
  }

  const backLink = (
    <Link to="/student/results" className="sp-back-link sp-no-print">
      All results
    </Link>
  );

  if (!unlocked) {
    return (
      <>
        {backLink}
        <PageTitle title={`${term.term}, ${term.session}`} />
        <section className="sp-card sp-locked-panel" aria-labelledby="locked-heading">
          <h2 id="locked-heading">These results are locked</h2>
          <p>Enter your result PIN to view the results for this term.</p>
          <PinForm term={term} />
        </section>
      </>
    );
  }

  const handleDownload = () => {
    const rows = [
      [`${school.name}`],
      [`Student: ${student.fullName}`, `ID: ${student.id}`, `Class: ${term.className}`],
      [`Session: ${term.session}`, `Term: ${term.term}`],
      [],
      ["Subject", "CA (40)", "Exam (60)", "Total (100)", "Grade", "Teacher's remark"],
      ...data.subjects.map((row) => [row.subject, row.ca, row.exam, row.total, row.grade, row.remark]),
      [],
      ["Total score", `${data.summary.grandTotal} / ${data.summary.maxTotal}`],
      ["Average", `${data.summary.average}%`],
    ];
    downloadCsv(`results-${term.id}.csv`, rows);
  };

  return (
    <>
      {backLink}
      <PageTitle title={`${term.term} Results`} description={`Session ${term.session}`}>
        <Button variant="outline" size="small" onClick={() => window.print()} disabled={loading}>
          &nbsp;Print
        </Button>
        <Button variant="primary" size="small" onClick={handleDownload} disabled={loading}>
          &nbsp;Download (CSV)
        </Button>
      </PageTitle>

      {error ? (
        <EmptyState title="Results could not be loaded">
          <p>{error.message || "Please try again in a moment."}</p>
        </EmptyState>
      ) : loading || !data ? (
        <LoadingState label="Loading results" />
      ) : (
        <section className="sp-card sp-sheet" aria-label="Result sheet">
          <div className="sp-sheet-head">
            <h2>{school.name}</h2>
            <p>Student result sheet</p>
          </div>
          <dl className="sp-sheet-info">
            <div><dt>Student</dt><dd>{student.fullName}</dd></div>
            <div><dt>Student ID</dt><dd>{student.id}</dd></div>
            <div><dt>Class</dt><dd>{term.className}</dd></div>
            <div><dt>Session and term</dt><dd>{term.session}, {term.term}</dd></div>
            <div><dt>Status</dt><dd><StatusBadge status="unlocked" /></dd></div>
          </dl>
          <ResultsTable subjects={data.subjects} summary={data.summary} />
        </section>
      )}
    </>
  );
}
