import { NavLink, Link } from "react-router-dom";
import { school } from "../../config/siteConfig.js";
import { teacherNavItems } from "../config/navItems.js";

// Navy sidebar (same look as the Student Portal). On phones it is a drawer.
export default function TeacherSidebar({ open, teacher, onClose, onLogout }) {
  return (
    <aside id="teacher-sidebar" className={`sp-sidebar ${open ? "is-open" : ""}`.trim()} aria-label="Teacher dashboard">
      <div className="sp-sidebar-head">
        <Link to="/teacher" className="sp-sidebar-brand">
          <span>
            <strong>{school.shortName}</strong>
            <small>Teacher Dashboard</small>
          </span>
        </Link>
        <button type="button" className="sp-sidebar-close" onClick={onClose}>
          <span>Close menu</span>
        </button>
      </div>

      {teacher && (
        <div className="sp-sidebar-student">
          <span>
            <strong>{teacher.title} {teacher.fullName}</strong>
            <small>{teacher.id}</small>
          </span>
        </div>
      )}

      <nav aria-label="Teacher dashboard navigation">
        <ul className="sp-nav">
          {teacherNavItems.map((item) => (
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
