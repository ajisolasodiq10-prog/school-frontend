import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import FormField from "../components/FormField.jsx";
import TeacherStatusBadge from "../components/TeacherStatusBadge.jsx";
import { useTeacherData } from "../context/TeacherDataContext.jsx";

export default function ClassDetail() {
  const { classId } = useParams();
  const { teacher, classes, getClassStudents, findResult } = useTeacherData();
  const item = classes.find((c) => c.id === classId);
  const [search, setSearch] = useState("");
  usePageTitle(item ? item.name : "Class not found");

  if (!item) {
    return (
      <EmptyState title="Class not found">
        <p>That class is not assigned to you.</p>
        <Button to="/teacher/classes" variant="primary" size="small">
          Back to My Classes
        </Button>
      </EmptyState>
    );
  }

  const students = getClassStudents(item.id);
  const query = search.trim().toLowerCase();
  const visible = students.filter(
    (s) => !query || s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query)
  );

  return (
    <>
      <Link to="/teacher/classes" className="sp-back-link">
        All classes
      </Link>
      <PageTitle
        title={item.name}
        description={`${item.room} · ${students.length} students · ${teacher.session}, ${teacher.term}`}
      />

      <section className="sp-block" aria-labelledby="cd-subjects">
        <h2 id="cd-subjects">Your subjects in this class</h2>
        <ul className="sp-list">
          {item.subjects.map((subject) => {
            const record = findResult(item.id, subject, teacher.session, teacher.term);
            const params = new URLSearchParams({ class: item.id, subject }).toString();
            return (
              <li key={subject} className="sp-card tp-row">
                <div>
                  <h3>{subject}</h3>
                  <p className="sp-muted">Results this term</p>
                </div>
                <div className="tp-row-end">
                  {record ? <TeacherStatusBadge status={record.status} /> : <span className="sp-muted">Not started</span>}
                  <Button to={`/teacher/results/enter?${params}`} variant="outline" size="small" aria-label={`Enter ${subject} results for ${item.name}`}>
                    Enter results
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="sp-block" aria-labelledby="cd-students">
        <h2 id="cd-students">Students in {item.name}</h2>
        <div className="tp-filters tp-filters-one">
          <FormField
            id="class-search"
            label="Search by name or ID"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {visible.length === 0 ? (
          <EmptyState title="No students found">
            <p>Try a different name or ID.</p>
          </EmptyState>
        ) : (
          <div className="sp-table-wrap" role="region" aria-label={`Students in ${item.name}`} tabIndex={0}>
            <table className="sp-table tp-stack-table">
              <caption className="visually-hidden">Students in {item.name}</caption>
              <thead>
                <tr>
                  <th scope="col">No.</th>
                  <th scope="col">Student ID</th>
                  <th scope="col">Student name</th>
                  <th scope="col">Subject</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((student) => (
                  <tr key={student.id}>
                    <td data-label="No.">{students.indexOf(student) + 1}</td>
                    <td data-label="Student ID">{student.id}</td>
                    <th scope="row" data-label="Name">{student.name}</th>
                    <td data-label="Subject">{item.subjects.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
