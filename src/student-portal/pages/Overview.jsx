import { Link } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import { formatDate } from "../../config/content.js";
import LoadingState from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useStudentPortal } from "../context/StudentPortalContext.jsx";
import useAsync from "../hooks/useAsync.js";
import { getAnnouncements } from "../services/studentService.js";

const quickLinks = [
  { to: "/student/results", title: "My Results", text: "View your term results or enter a result PIN." },
  { to: "/student/timetable", title: "Timetable", text: "See this week's lessons, times and classrooms." },
  { to: "/student/materials", title: "Learning Materials", text: "Notes and worksheets from your teachers." },
];

export default function Overview() {
  usePageTitle("Student Overview");
  const { student } = useStudentPortal();
  const { data: announcements, loading } = useAsync(getAnnouncements, []);

  return (
    <>
      <section className="sp-card sp-welcome" aria-labelledby="welcome-heading">
        <div>
          <h1 id="welcome-heading">Welcome{student.firstName ? `, ${student.firstName}` : ""}</h1>
          <p>
            Here is a quick look at your school life this term. Keep up the good work and check
            your assignments regularly.
          </p>
        </div>
      </section>

      <dl className="sp-facts">
        <div className="sp-card">
          <dt>Student ID</dt>
          <dd>{student.id || "Not available"}</dd>
        </div>
        <div className="sp-card">
          <dt>Class and arm</dt>
          <dd>{student.className ? `${student.className} ${student.arm}` : "Not available"}</dd>
        </div>
        <div className="sp-card">
          <dt>Session</dt>
          <dd>{student.session || "Not available"}</dd>
        </div>
        <div className="sp-card">
          <dt>Term</dt>
          <dd>{student.term || "Not available"}</dd>
        </div>
      </dl>

      <section aria-labelledby="quick-heading" className="sp-block">
        <h2 id="quick-heading">Quick access</h2>
        <div className="sp-quick-grid">
          {quickLinks.map((item) => (
            <Link key={item.to} to={item.to} className="sp-card sp-quick-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="ann-heading" className="sp-block">
        <div className="sp-block-head">
          <h2 id="ann-heading">Latest announcements</h2>
          <Link to="/student/announcements">View all</Link>
        </div>
        {loading ? (
          <LoadingState label="Loading announcements" />
        ) : !announcements || announcements.length === 0 ? (
          <EmptyState title="No announcements yet">
            <p>New school announcements will appear here.</p>
          </EmptyState>
        ) : (
          <ul className="sp-list">
            {announcements.slice(0, 3).map((item) => (
              <li key={item.id} className="sp-card sp-announcement">
                <p className="sp-muted">
                  <time dateTime={item.date}>{formatDate(item.date)}</time>
                </p>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
