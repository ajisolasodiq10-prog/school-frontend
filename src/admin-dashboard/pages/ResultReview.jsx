import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import { formatDate } from "../../config/content.js";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import FormField from "../../teacher-dashboard/components/FormField.jsx";
import Flash from "../../teacher-dashboard/components/Flash.jsx";
import ConfirmDialog from "../../teacher-dashboard/components/ConfirmDialog.jsx";
import TeacherStatusBadge from "../../teacher-dashboard/components/TeacherStatusBadge.jsx";
import WorkflowSteps from "../../teacher-dashboard/components/WorkflowSteps.jsx";
import useFlash from "../../teacher-dashboard/hooks/useFlash.js";
import { RESULT_STATUS as S } from "../../teacher-dashboard/utils/resultStatus.js";
import { useAdminData } from "../context/AdminDataContext.jsx";
import { reviewRows, totalMax } from "../utils/scoring.js";
import { canApprove, canReturn, canPublish } from "../utils/workflow.js";

export default function ResultReview() {
  const { resultId } = useParams();
  const { resultById, students, settings, className, teacherName, approveResult, returnResult, publishResult } = useAdminData();
  const result = resultById(resultId);
  usePageTitle(result ? `Review ${className(result.classId)} ${result.subject}` : "Result not found");
  const [dialog, setDialog] = useState(null); // "approve" | "return" | "publish"
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [flash, setFlash] = useFlash();

  if (!result) {
    return (
      <EmptyState title="Result not found">
        <p>We could not find that submission.</p>
        <Button to="/admin/results" variant="primary">Back to results</Button>
      </EmptyState>
    );
  }
  if (result.status === S.DRAFT) {
    return (
      <EmptyState title="This result is still a draft">
        <p>Drafts have not been submitted by the teacher, so they cannot be reviewed, approved or published.</p>
        <Button to="/admin/results" variant="primary">Back to results</Button>
      </EmptyState>
    );
  }

  const roster = students.filter((s) => s.classId === result.classId && s.status !== "Graduated").sort((a, b) => a.name.localeCompare(b.name));
  const { rows, invalid, average } = reviewRows(roster, result.scores, settings);
  const max = totalMax(settings);
  const close = () => { setDialog(null); setReason(""); setReasonError(""); };
  const report = (res, message) => setFlash(res.ok ? { tone: "success", message } : { tone: "error", message: res.error });

  const doReturn = async () => {
    if (reason.trim().length < 10) { setReasonError("Please give a reason of at least 10 characters so the teacher knows what to correct."); return; }
    report(await returnResult(result.id, reason), "Returned to the teacher with your feedback.");
    close();
  };

  return (
    <>
      <Link to="/admin/results" className="sp-back-link">All submissions</Link>
      <PageTitle title={`${className(result.classId)} ${result.subject}`} description={`${result.session}, ${result.term}. Teacher: ${teacherName(result.teacherId)}`}>
        <TeacherStatusBadge status={result.status} />
      </PageTitle>
      <Flash flash={flash} onDismiss={() => setFlash(null)} />
      <WorkflowSteps status={result.status} />

      {result.status === S.RETURNED && result.feedback && (
        <section className="tp-feedback" aria-label="Feedback sent to the teacher">
          <h2>Feedback sent to the teacher</h2>
          <p>{result.feedback.message}</p>
          <small>{result.feedback.from} &middot; {formatDate(result.feedback.date)}</small>
        </section>
      )}
      {result.status === S.PUBLISHED && <p className="sp-notice"><span>Published{result.publishedOn ? ` on ${formatDate(result.publishedOn)}` : ""}. This result is visible to students.</span></p>}
      {result.status === S.APPROVED && <p className="sp-notice"><span>Approved{result.reviewedOn ? ` on ${formatDate(result.reviewedOn)}` : ""}. It can now be published.</span></p>}

      <section className="sp-card ad-summary" aria-label="Summary">
        <p><strong>Students:</strong> {rows.length}</p>
        <p><strong>Class average:</strong> {average ?? "-"} / {max}</p>
        <p><strong>Submitted:</strong> {result.submittedOn ? formatDate(result.submittedOn) : "-"}</p>
        <p><strong>Scores to fix:</strong> {invalid}</p>
      </section>
      {invalid > 0 && result.status === S.SUBMITTED && (
        <p className="field-error" role="alert">{invalid} row(s) have missing or invalid scores. A submission with invalid scores cannot be approved; return it to the teacher instead.</p>
      )}

      <div className="sp-table-wrap" role="region" aria-label="Student scores" tabIndex={0}>
        <table className="sp-table tp-stack-table">
          <caption className="visually-hidden">Scores for {className(result.classId)} {result.subject}</caption>
          <thead><tr>
            <th scope="col">Student ID</th><th scope="col">Name</th><th scope="col">CA ({settings.caMax})</th>
            <th scope="col">Exam ({settings.examMax})</th><th scope="col">Total ({max})</th><th scope="col">Grade</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.student.id} className={r.problems.length ? "ad-row-flag" : undefined}>
                <td data-label="Student ID">{r.student.id}</td>
                <th scope="row" data-label="Name">{r.student.name}</th>
                <td data-label="CA">{r.ca ?? "-"}</td>
                <td data-label="Exam">{r.exam ?? "-"}</td>
                <td data-label="Total">{r.total ?? "-"}</td>
                <td data-label="Grade">{r.grade ?? (r.problems.length ? <span className="field-error">{r.problems.join(", ")}</span> : "-")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ad-actions sp-no-print">
        {canReturn(result) && <Button variant="outline-danger" onClick={() => setDialog("return")}>Return for correction</Button>}
        {canReturn(result) && <Button variant="primary" onClick={() => setDialog("approve")} disabled={!canApprove(result, invalid)}>Approve</Button>}
        {canPublish(result) && <Button variant="primary" onClick={() => setDialog("publish")}>Publish results</Button>}
        {!canReturn(result) && !canPublish(result) && <p className="tp-lock-note">No further action is available for a {result.status.toLowerCase()} result.</p>}
        {result.status === S.SUBMITTED && <p className="tp-lock-note">Results must be approved before they can be published.</p>}
      </div>

      {canReturn(result) && <ConfirmDialog open={dialog === "approve"} title="Approve this submission?" confirmLabel="Yes, approve"
        onConfirm={async () => { report(await approveResult(result.id), "Approved. It can now be published."); close(); }} onCancel={close}>
        <p>Approving confirms that the scores for {className(result.classId)} {result.subject} look correct. The result will not be visible to students until it is published.</p>
      </ConfirmDialog>}
      {canPublish(result) && <ConfirmDialog open={dialog === "publish"} title="Publish these results?" confirmLabel="Yes, publish"
        onConfirm={async () => { report(await publishResult(result.id), "Published for students."); close(); }} onCancel={close}>
        <p>Publishing makes the approved results available to students.</p>
      </ConfirmDialog>}
      {canReturn(result) && <ConfirmDialog open={dialog === "return"} title="Return to the teacher?" confirmLabel="Return to teacher" danger
        onConfirm={doReturn} onCancel={close}>
        <p>The teacher will see your feedback and can correct and resubmit.</p>
        <FormField id="return-reason" label="Reason for returning" as="textarea" rows={4} value={reason}
          onChange={(e) => { setReason(e.target.value); setReasonError(""); }} error={reasonError} />
      </ConfirmDialog>}
    </>
  );
}
