import { NavLink, Link } from "react-router-dom";
import { school } from "../../config/siteConfig.js";
import { adminNavItems } from "../config/navItems.js";

// Navy sidebar (same look as the other portals). On phones it is a drawer.
export default function AdminSidebar({ open, profile, onClose, onLogout }) {
  return (
    <aside id="admin-sidebar" className={`sp-sidebar ${open ? "is-open" : ""}`.trim()} aria-label="Admin dashboard">
      <div className="sp-sidebar-head">
        <Link to="/admin" className="sp-sidebar-brand">
          <span>
            <strong>{school.shortName}</strong>
            <small>Admin Dashboard</small>
          </span>
        </Link>
        <button type="button" className="sp-sidebar-close" onClick={onClose}>
          <span>Close menu</span>
        </button>
      </div>

      {profile && (
        <div className="sp-sidebar-student">
          <span>
            <strong>{profile.title} {profile.fullName}</strong>
            <small>{profile.id}</small>
          </span>
        </div>
      )}

      <nav aria-label="Admin dashboard navigation">
        <ul className="sp-nav">
          {adminNavItems.map((item) => (
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
