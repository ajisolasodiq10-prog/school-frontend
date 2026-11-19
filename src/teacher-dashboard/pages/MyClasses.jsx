import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import { useTeacherData } from "../context/TeacherDataContext.jsx";

export default function MyClasses() {
  usePageTitle("My Classes");
  const { teacher, classes } = useTeacherData();

  return (
    <>
      <PageTitle title="My Classes" description="The classes and subjects assigned to you this term." />
      {classes.length === 0 ? (
        <EmptyState title="No classes assigned">
          <p>Classes assigned to you by the school will appear here.</p>
        </EmptyState>
      ) : (
        <ul className="sp-grid">
          {classes.map((item) => (
            <li key={item.id} className="sp-card tp-class-card">
              <div className="tp-class-head">
                <h2>{item.name}</h2>
              </div>
              <dl className="tp-meta">
                <div>
                  <dt>{item.subjects.length > 1 ? "Subjects" : "Subject"}</dt>
                  <dd>{item.subjects.join(", ")}</dd>
                </div>
                <div>
                  <dt>Students</dt>
                  <dd>{item.studentCount}</dd>
                </div>
                <div>
                  <dt>Session and term</dt>
                  <dd>{teacher.session}, {teacher.term}</dd>
                </div>
              </dl>
              <Button to={`/teacher/classes/${item.id}`} variant="primary" size="small" aria-label={`View class ${item.name}`}>
                View Class
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
