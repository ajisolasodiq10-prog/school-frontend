import { NavLink, Link } from "react-router-dom";
import { school } from "../../config/siteConfig.js";
import { studentNavItems } from "../config/navItems.js";

// Navy sidebar. On phones it slides in as a drawer (see portal.css).
export default function StudentSidebar({ open, student, onClose, onLogout }) {
  return (
    <aside id="student-sidebar" className={`sp-sidebar ${open ? "is-open" : ""}`.trim()} aria-label="Student portal">
      <div className="sp-sidebar-head">
        <Link to="/student" className="sp-sidebar-brand">
          <span>
            <strong>{school.shortName}</strong>
            <small>Student Portal</small>
          </span>
        </Link>
        <button type="button" className="sp-sidebar-close" onClick={onClose}>
          <span>Close menu</span>
        </button>
      </div>

      {student && (
        <div className="sp-sidebar-student">
          <span>
            <strong>{student.fullName}</strong>
            <small>{student.className ? `${student.className} ${student.arm}` : student.id}</small>
          </span>
        </div>
      )}

      <nav aria-label="Student portal navigation">
        <ul className="sp-nav">
          {studentNavItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className="sp-nav-link">
                {item.label}
              </NavLink>
            </li>
          ))}
          <li>
            <button type="button" className="sp-nav-link sp-nav-button" onClick={onLogout}>
              Logout
            </button>
          </li>
        </ul>
      </nav>

      <Link to="/" className="sp-sidebar-back">
        School website
      </Link>
    </aside>
  );
}
