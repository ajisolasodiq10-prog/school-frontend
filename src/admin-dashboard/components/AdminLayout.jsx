import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import InfoNotice from "../../student-portal/components/InfoNotice.jsx";
import AdminSidebar from "./AdminSidebar.jsx";
import { AdminDataProvider, useAdminData } from "../context/AdminDataContext.jsx";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";

function DashboardShell() {
  const { profile, loading, loadError, reload } = useAdminData();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="sp-shell">
      <AdminSidebar open={menuOpen} profile={profile} onClose={() => setMenuOpen(false)} onLogout={handleLogout} />
      {menuOpen && <div className="sp-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <div className="sp-main">
        <header className="sp-topbar sp-no-print">
          <button
            ref={toggleRef}
            type="button"
            className="sp-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="admin-sidebar"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span>{menuOpen ? "Close" : "Menu"}</span>
          </button>
          <span className="sp-topbar-title">Admin Dashboard</span>
          <span className="sp-topbar-student">
            <span className="sp-topbar-name">{profile.title} {profile.fullName}</span>
          </span>
        </header>

        <main id="admin-main" className="sp-content tp-content ad-content">
          <InfoNotice>
            Everything on these pages is saved in the school database. Nothing is kept in this browser.
          </InfoNotice>
          {loading ? (
            <p role="status" className="sp-muted">Loading school records...</p>
          ) : loadError ? (
            <div role="alert" className="sp-card tp-panel">
              <h2>The school records could not be loaded</h2>
              <p>{loadError}</p>
              <button type="button" className="btn btn-primary" onClick={reload}>Try again</button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}

// Only signed-in administrators see the dashboard (the backend still checks every request).
export default function AdminLayout() {
  return (
    <ProtectedRoute role="admin" loginPath="/admin/login">
      <AdminDataProvider>
        <DashboardShell />
      </AdminDataProvider>
    </ProtectedRoute>
  );
}
