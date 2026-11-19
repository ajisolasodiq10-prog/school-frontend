import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import { formatDate } from "../../config/content.js";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import FormField from "../../teacher-dashboard/components/FormField.jsx";
import TeacherStatusBadge from "../../teacher-dashboard/components/TeacherStatusBadge.jsx";
import { RESULT_STATUS as S } from "../../teacher-dashboard/utils/resultStatus.js";
import usePaged from "../hooks/usePaged.js";
import { useAdminData } from "../context/AdminDataContext.jsx";

const STATUSES = [S.SUBMITTED, S.APPROVED, S.RETURNED, S.PUBLISHED];
const blank = { classId: "all", subject: "all", session: "all", term: "all", teacherId: "all", status: "all" };

export default function ResultsManagement() {
  usePageTitle("Results Management");
  const [params] = useSearchParams();
  const { reviewableResults, classes, subjects, sessions, teachers, className, teacherName, students } = useAdminData();
  const initial = STATUSES.includes(params.get("status")) ? params.get("status") : "all";
  const [filters, setFilters] = useState({ ...blank, status: initial });
  const set = (f) => (e) => setFilters((x) => ({ ...x, [f]: e.target.value }));

  const rows = useMemo(() => reviewableResults
    .filter((r) => (filters.classId === "all" || r.classId === filters.classId) &&
      (filters.subject === "all" || r.subject === filters.subject) &&
      (filters.session === "all" || r.session === filters.session) &&
      (filters.term === "all" || r.term === filters.term) &&
      (filters.teacherId === "all" || r.teacherId === filters.teacherId) &&
      (filters.status === "all" || r.status === filters.status))
    .sort((a, b) => (b.submittedOn || "").localeCompare(a.submittedOn || "")), [reviewableResults, filters]);
  const { visible, remaining, showMore } = usePaged(rows, JSON.stringify(filters), 20);
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(blank);
  const termNames = [...new Set(sessions.flatMap((s) => s.terms.map((t) => t.name)))];
  const counts = (status) => reviewableResults.filter((r) => r.status === status).length;
  const studentCount = (r) => students.filter((s) => s.classId === r.classId && s.status !== "Graduated").length;

  return (
    <>
      <PageTitle title="Results Management" description="Review results submitted by teachers. Work a teacher has not yet submitted is never shown here." />

      <ul className="ad-count-row" aria-label="Results by status">
        {STATUSES.map((st) => <li key={st}><TeacherStatusBadge status={st} /> <strong>{counts(st)}</strong></li>)}
      </ul>

      <section className="tp-filters ad-filters-six" aria-label="Filter results">
        <FormField id="rm-class" label="Class" as="select" value={filters.classId} onChange={set("classId")}
          options={[{ value: "all", label: "All classes" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]} />
        <FormField id="rm-subject" label="Subject" as="select" value={filters.subject} onChange={set("subject")}
          options={[{ value: "all", label: "All subjects" }, ...subjects.map((s) => ({ value: s.name, label: s.name }))]} />
        <FormField id="rm-session" label="Session" as="select" value={filters.session} onChange={set("session")}
          options={[{ value: "all", label: "All sessions" }, ...sessions.map((s) => ({ value: s.name, label: s.name }))]} />
        <FormField id="rm-term" label="Term" as="select" value={filters.term} onChange={set("term")}
          options={[{ value: "all", label: "All terms" }, ...termNames.map((t) => ({ value: t, label: t }))]} />
        <FormField id="rm-teacher" label="Teacher" as="select" value={filters.teacherId} onChange={set("teacherId")}
          options={[{ value: "all", label: "All teachers" }, ...teachers.map((t) => ({ value: t.id, label: `${t.title} ${t.fullName}` }))]} />
        <FormField id="rm-status" label="Status" as="select" value={filters.status} onChange={set("status")}
          options={[{ value: "all", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))]} />
      </section>

      <p className="tp-count" role="status">
        {rows.length} of {reviewableResults.length} submissions
        {hasFilters && <> <button type="button" className="tp-link-button" onClick={() => setFilters(blank)}>Clear filters</button></>}
      </p>

      {rows.length === 0 ? (
        <EmptyState title="No submissions found"><p>No submission matches these filters.</p></EmptyState>
      ) : (
        <>
          <div className="sp-table-wrap" role="region" aria-label="Result submissions" tabIndex={0}>
            <table className="sp-table tp-stack-table">
              <caption className="visually-hidden">Result submissions</caption>
              <thead><tr>
                <th scope="col">Class</th><th scope="col">Subject</th><th scope="col">Session and term</th><th scope="col">Teacher</th>
                <th scope="col">Submitted</th><th scope="col">Students</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th>
              </tr></thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id}>
                    <th scope="row" data-label="Class">{className(r.classId)}</th>
                    <td data-label="Subject">{r.subject}</td>
                    <td data-label="Session">{r.session}, {r.term}</td>
                    <td data-label="Teacher">{teacherName(r.teacherId)}</td>
                    <td data-label="Submitted">{r.submittedOn ? formatDate(r.submittedOn) : "-"}</td>
                    <td data-label="Students">{studentCount(r)}</td>
                    <td data-label="Status"><TeacherStatusBadge status={r.status} /></td>
                    <td className="sp-action-cell">
                      <Button to={`/admin/results/${r.id}`} variant={r.status === S.SUBMITTED ? "primary" : "outline"} size="small"
                        aria-label={`${r.status === S.SUBMITTED ? "Review" : "Open"} ${className(r.classId)} ${r.subject}`}>
                        {r.status === S.SUBMITTED ? "Review" : "Open"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {remaining > 0 && <p className="ad-more"><Button variant="outline" size="small" onClick={showMore}>Show more ({remaining} remaining)</Button></p>}
        </>
      )}
    </>
  );
}
