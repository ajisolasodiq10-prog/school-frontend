import { Link, useParams } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import { formatDate } from "../../config/content.js";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import TeacherStatusBadge from "../components/TeacherStatusBadge.jsx";
import WorkflowSteps from "../components/WorkflowSteps.jsx";
import ScoreTable from "../components/ScoreTable.jsx";
import { useTeacherData } from "../context/TeacherDataContext.jsx";
import { TOTAL_MAX } from "../config/scoreConfig.js";
import { RESULT_STATUS } from "../utils/resultStatus.js";
import { summarise } from "../utils/scores.js";

export default function ResultDetail() {
  const { resultId } = useParams();
  const { allClasses: classes, results, getClassStudents } = useTeacherData();
  const record = results.find((r) => r.id === resultId);
  usePageTitle(record ? "Result details" : "Result not found");

  if (!record) {
    return (
      <EmptyState title="Record not found">
        <p>We could not find that result record.</p>
        <Button to="/teacher/results/history" variant="primary" size="small">
          Back to Results History
        </Button>
      </EmptyState>
    );
  }

  const item = classes.find((c) => c.id === record.classId);
  const students = getClassStudents(record.classId);
  const summary = summarise(record.scores, students);
  const editLink = `/teacher/results/enter?${new URLSearchParams({
    class: record.classId,
    subject: record.subject,
    session: record.session,
    term: record.term,
  }).toString()}`;

  return (
    <>
      <Link to="/teacher/results/history" className="sp-back-link">
        All results
      </Link>
      <PageTitle title={`${item.name} · ${record.subject}`} description={`${record.session}, ${record.term}`}>
        <TeacherStatusBadge status={record.status} />
      </PageTitle>

      <section className="sp-card tp-panel" aria-label="Workflow progress">
        <WorkflowSteps status={record.status} />
      </section>

      {record.status === RESULT_STATUS.RETURNED && record.feedback && (
        <section className="tp-feedback" aria-label="Feedback on returned results">
          <h2>Returned for correction</h2>
          <p>{record.feedback.message}</p>
          <p className="sp-muted">{record.feedback.from}, {formatDate(record.feedback.date)}</p>
          <Button to={editLink} variant="primary" size="small">
            &nbsp;Edit and resubmit
          </Button>
        </section>
      )}

      {record.status === RESULT_STATUS.DRAFT && (
        <p className="tp-actions-line">
          <Button to={editLink} variant="primary" size="small">
            &nbsp;Continue editing draft
          </Button>
        </p>
      )}

      <dl className="sp-summary tp-detail-summary">
        <div><dt>Class</dt><dd>{item.name}</dd></div>
        <div><dt>Students</dt><dd>{students.length}</dd></div>
        <div>
          <dt>Submission date</dt>
          <dd>{record.submittedOn ? formatDate(record.submittedOn) : "Not submitted"}</dd>
        </div>
        <div><dt>Last updated</dt><dd>{formatDate(record.updatedOn)}</dd></div>
        <div>
          <dt>Students scored</dt>
          <dd>{summary.complete} of {summary.count}</dd>
        </div>
        <div>
          <dt>Class average</dt>
          <dd>{summary.average === null ? "-" : `${summary.average} / ${TOTAL_MAX}`}</dd>
        </div>
      </dl>

      <section className="sp-block" aria-labelledby="rd-scores">
        <h2 id="rd-scores">Scores</h2>
        <ScoreTable students={students} scores={record.scores} />
      </section>
    </>
  );
}
