import { useState } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import { formatDate } from "../../config/content.js";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import FormField from "../components/FormField.jsx";
import TeacherStatusBadge from "../components/TeacherStatusBadge.jsx";
import { useTeacherData } from "../context/TeacherDataContext.jsx";
import { TERMS } from "../config/scoreConfig.js";
import { RESULT_STATUS } from "../utils/resultStatus.js";

const noFilters = { classId: "all", subject: "all", session: "all", term: "all", status: "all" };
const allOption = (label) => ({ value: "all", label });

export default function ResultsHistory() {
  usePageTitle("Results History");
  const { allClasses: classes, sessions, results } = useTeacherData();
  const SESSIONS = sessions.map((x) => x.name);
  const [filters, setFilters] = useState(noFilters);

  const subjects = [...new Set(classes.flatMap((c) => c.subjects))];
  const classOf = (id) => classes.find((c) => c.id === id);
  const setFilter = (field) => (event) => setFilters((current) => ({ ...current, [field]: event.target.value }));

  const visible = results
    .filter(
      (r) =>
        (filters.classId === "all" || r.classId === filters.classId) &&
        (filters.subject === "all" || r.subject === filters.subject) &&
        (filters.session === "all" || r.session === filters.session) &&
        (filters.term === "all" || r.term === filters.term) &&
        (filters.status === "all" || r.status === filters.status)
    )
    .sort((a, b) => b.updatedOn.localeCompare(a.updatedOn));

  const hasFilters = Object.values(filters).some((value) => value !== "all");

  return (
    <>
      <PageTitle title="Results History" description="Results you have saved or submitted." />
      <section className="tp-filters tp-filters-five" aria-label="Filter results">
        <FormField id="f-class" label="Class" as="select" value={filters.classId} onChange={setFilter("classId")}
          options={[allOption("All classes"), ...classes.map((c) => ({ value: c.id, label: c.name }))]} />
        <FormField id="f-subject" label="Subject" as="select" value={filters.subject} onChange={setFilter("subject")}
          options={[allOption("All subjects"), ...subjects.map((s) => ({ value: s, label: s }))]} />
        <FormField id="f-session" label="Session" as="select" value={filters.session} onChange={setFilter("session")}
          options={[allOption("All sessions"), ...SESSIONS.map((s) => ({ value: s, label: s }))]} />
        <FormField id="f-term" label="Term" as="select" value={filters.term} onChange={setFilter("term")}
          options={[allOption("All terms"), ...TERMS.map((t) => ({ value: t, label: t }))]} />
        <FormField id="f-status" label="Status" as="select" value={filters.status} onChange={setFilter("status")}
          options={[allOption("All statuses"), ...Object.values(RESULT_STATUS).map((s) => ({ value: s, label: s }))]} />
      </section>

      <p className="tp-count" role="status">
        Showing {visible.length} of {results.length} records
        {hasFilters && (
          <>
            {" "}
            <button type="button" className="tp-link-button" onClick={() => setFilters(noFilters)}>
              Clear filters
            </button>
          </>
        )}
      </p>

      {visible.length === 0 ? (
        <EmptyState title="No results found">
          <p>{hasFilters ? "No records match these filters." : "Saved and submitted results will appear here."}</p>
          {hasFilters ? (
            <Button variant="outline" size="small" onClick={() => setFilters(noFilters)}>
              Clear filters
            </Button>
          ) : (
            <Button to="/teacher/results/enter" variant="primary" size="small">
              Enter results
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="sp-table-wrap" role="region" aria-label="Results history" tabIndex={0}>
          <table className="sp-table tp-stack-table">
            <caption className="visually-hidden">Saved and submitted results</caption>
            <thead>
              <tr>
                <th scope="col">Class</th>
                <th scope="col">Subject</th>
                <th scope="col">Session</th>
                <th scope="col">Term</th>
                <th scope="col">Submission date</th>
                <th scope="col" className="num">Students</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="visually-hidden">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((record) => {
                const item = classOf(record.classId);
                return (
                  <tr key={record.id}>
                    <th scope="row" data-label="Class">{item.name}</th>
                    <td data-label="Subject">{record.subject}</td>
                    <td data-label="Session">{record.session}</td>
                    <td data-label="Term">{record.term}</td>
                    <td data-label="Submitted">{record.submittedOn ? formatDate(record.submittedOn) : "Not submitted"}</td>
                    <td className="num" data-label="Students">{item.studentCount}</td>
                    <td data-label="Status"><TeacherStatusBadge status={record.status} /></td>
                    <td className="sp-action-cell">
                      <Button
                        to={`/teacher/results/history/${record.id}`}
                        variant="outline"
                        size="small"
                        aria-label={`View ${item.name} ${record.subject} ${record.term} ${record.session}`}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
