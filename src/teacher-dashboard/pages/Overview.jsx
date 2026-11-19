import { Link } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import { formatDate } from "../../config/content.js";
import Button from "../../components/Button.jsx";
import StatCard from "../components/StatCard.jsx";
import TeacherStatusBadge from "../components/TeacherStatusBadge.jsx";
import { useTeacherData } from "../context/TeacherDataContext.jsx";
import { RESULT_STATUS, countAwaiting } from "../utils/resultStatus.js";

export default function Overview() {
  usePageTitle("Teacher Overview");
  const { teacher, classes, allClasses, students, announcements, activities, results } = useTeacherData();

  const subjects = [...new Set(classes.flatMap((item) => item.subjects))];
  const awaiting = countAwaiting(classes, results, teacher.session, teacher.term);
  const submitted = results.filter((r) => r.status !== RESULT_STATUS.DRAFT);
  const recentSubmitted = [...submitted]
    .sort((a, b) => b.submittedOn.localeCompare(a.submittedOn))
    .slice(0, 3);
  const classNameOf = (id) => allClasses.find((item) => item.id === id)?.name ?? id;

  return (
    <>
      <section className="sp-card sp-welcome" aria-labelledby="teacher-welcome">
        <div>
          <h1 id="teacher-welcome">Welcome{teacher.fullName ? `, ${[teacher.title, teacher.fullName.split(" ").slice(-1)[0]].filter(Boolean).join(" ")}` : ""}</h1>
          <p>
            Teacher ID: <strong>{teacher.id || "Not available"}</strong>{teacher.department ? <> &middot; {teacher.department}</> : null}
          </p>
          {teacher.session && (
            <p>
              Session <strong>{teacher.session}</strong> &middot; <strong>{teacher.term}</strong>
            </p>
          )}
        </div>
      </section>

      <div className="tp-stats">
        <StatCard value={classes.length} label="Assigned classes" to="/teacher/classes" />
        <StatCard value={subjects.length} label="Assigned subjects" hint={subjects.join(", ")} />
        <StatCard value={students.length} label="Students taught" to="/teacher/students" />
        <StatCard value={awaiting} label="Results awaiting submission" to="/teacher/results/enter" hint="This term" />
        <StatCard value={submitted.length} label="Previously submitted results" to="/teacher/results/history" />
      </div>

      <div className="tp-two-col">
        <section className="sp-block" aria-labelledby="ov-classes">
          <h2 id="ov-classes">My classes and subjects</h2>
          <ul className="sp-list">
            {classes.map((item) => (
              <li key={item.id} className="sp-card tp-row">
                <div>
                  <h3>{item.name}</h3>
                  <p className="sp-muted">
                    {item.subjects.join(", ")} &middot; {item.studentCount} students
                  </p>
                </div>
                <Button to={`/teacher/classes/${item.id}`} variant="outline" size="small" aria-label={`View ${item.name}`}>
                  View
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section className="sp-block" aria-labelledby="ov-activities">
          <h2 id="ov-activities">Upcoming academic activities</h2>
          <ul className="sp-list">
            {activities.map((item) => (
              <li key={item.id} className="sp-card tp-activity">
                <time dateTime={item.date} className="tp-date-chip">
                  {formatDate(item.date)}
                </time>
                <div>
                  <h3>{item.title}</h3>
                  <p className="sp-muted">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="sp-block" aria-labelledby="ov-submitted">
        <div className="sp-block-head">
          <h2 id="ov-submitted">Recently submitted results</h2>
          <Link to="/teacher/results/history">View all</Link>
        </div>
        <ul className="sp-list">
          {recentSubmitted.map((record) => (
            <li key={record.id} className="sp-card tp-row">
              <div>
                <h3>{classNameOf(record.classId)} &middot; {record.subject}</h3>
                <p className="sp-muted">
                  {record.session}, {record.term} &middot; Submitted {formatDate(record.submittedOn)}
                </p>
              </div>
              <div className="tp-row-end">
                <TeacherStatusBadge status={record.status} />
                <Button to={`/teacher/results/history/${record.id}`} variant="outline" size="small" aria-label={`View ${classNameOf(record.classId)} ${record.subject} results`}>
                  View
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-block" aria-labelledby="ov-ann">
        <div className="sp-block-head">
          <h2 id="ov-ann">Recent school announcements</h2>
          <Link to="/teacher/announcements">View all</Link>
        </div>
        <ul className="sp-list">
          {announcements.slice(0, 3).map((item) => (
            <li key={item.id} className="sp-card sp-announcement">
              <p className="sp-muted">
                <span className="sp-tag">{item.category}</span>
                <time dateTime={item.date}>{formatDate(item.date)}</time>
              </p>
              <h3>{item.title}</h3>
              <p>{item.message}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
