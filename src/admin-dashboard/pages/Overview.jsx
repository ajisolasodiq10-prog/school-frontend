import { useEffect } from "react";
import { Link } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import { formatDate } from "../../config/content.js";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import StatCard from "../../teacher-dashboard/components/StatCard.jsx";
import { RESULT_STATUS as S } from "../../teacher-dashboard/utils/resultStatus.js";
import { useAdminData } from "../context/AdminDataContext.jsx";
import { formatDateTime, todayISO } from "../utils/dates.js";

const quickActions = [
  { to: "/admin/students?add=1", label: "Add student" },
  { to: "/admin/teachers?add=1", label: "Add teacher" },
  { to: "/admin/classes?add=1", label: "Create class" },
  { to: `/admin/results?status=${encodeURIComponent(S.SUBMITTED)}`, label: "Review results" },
];

export default function Overview() {
  usePageTitle("Admin Overview");
  const { students, teachers, classes, subjects, reviewableResults, currentSession, currentTerm, audit, announcements, profile, refreshAudit } = useAdminData();
  useEffect(() => { refreshAudit(); }, [refreshAudit]);
  const today = todayISO();
  const awaiting = reviewableResults.filter((r) => r.status === S.SUBMITTED).length;
  const approved = reviewableResults.filter((r) => r.status === S.APPROVED).length;
  const activeStudents = students.filter((s) => s.status === "Active").length;
  const activeTeachers = teachers.filter((t) => t.status === "Active").length;
  const recent = [...audit].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 6);
  const recentAnn = [...announcements].sort((a, b) => b.publishDate.localeCompare(a.publishDate)).slice(0, 4);

  return (
    <>
      <PageTitle title={`Welcome${profile.fullName ? `, ${[profile.title, profile.fullName].filter(Boolean).join(" ")}` : ""}`} description="School administration overview." />

      <section className="sp-card ad-summary" aria-label="Current session">
        <p><strong>Current session:</strong> {currentSession?.name || "Not set"}</p>
        <p><strong>Current term:</strong> {currentTerm ? `${currentTerm.name} (${currentTerm.status})` : "Not set"}</p>
        <p><Link to="/admin/sessions">Manage sessions and terms</Link></p>
      </section>

      <section className="tp-stats ad-stats" aria-label="Summary">
        <StatCard value={students.length} label="Total students" hint={`${activeStudents} active`} to="/admin/students" />
        <StatCard value={teachers.length} label="Total teachers" hint={`${activeTeachers} active`} to="/admin/teachers" />
        <StatCard value={classes.length} label="Total classes" to="/admin/classes" />
        <StatCard value={subjects.length} label="Total subjects" to="/admin/subjects" />
        <StatCard value={awaiting} label="Results awaiting review" to={`/admin/results?status=${encodeURIComponent(S.SUBMITTED)}`} />
        <StatCard value={approved} label="Approved, not yet published" to={`/admin/results?status=${encodeURIComponent(S.APPROVED)}`} />
      </section>

      <section aria-labelledby="quick-title">
        <h2 id="quick-title">Quick actions</h2>
        <div className="ad-quick-grid">
          {quickActions.map((a) => (
            <Button key={a.to} to={a.to} variant="outline">
{a.label}
            </Button>
          ))}
        </div>
      </section>

      <div className="tp-two-col">
        <section className="sp-card tp-panel" aria-labelledby="act-title">
          <h2 id="act-title">Recent administrative activity</h2>
          <ul className="tp-activity">
            {recent.map((a) => (
              <li key={a.id}>
                <strong>{a.action}</strong>
                <span>{a.record}</span>
                <small>{a.user} &middot; {formatDateTime(a.timestamp)}</small>
              </li>
            ))}
          </ul>
          <p><Link to="/admin/audit">View the full audit log</Link></p>
        </section>

        <section className="sp-card tp-panel" aria-labelledby="ann-title">
          <h2 id="ann-title">Recent announcements</h2>
          <ul className="tp-activity">
            {recentAnn.map((a) => (
              <li key={a.id}>
                <strong>{a.title}</strong>
                <span>{a.status}{a.status === "Published" && a.publishDate > today ? " (scheduled)" : ""} &middot; {formatDate(a.publishDate)}</span>
              </li>
            ))}
          </ul>
          <p><Link to="/admin/announcements">Manage announcements</Link></p>
        </section>
      </div>
    </>
  );
}
