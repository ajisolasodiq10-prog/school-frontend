import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import LoadingState from "../../student-portal/components/LoadingState.jsx";
import InfoNotice from "../../student-portal/components/InfoNotice.jsx";
import TeacherSidebar from "./TeacherSidebar.jsx";
import { TeacherDataProvider, useTeacherData } from "../context/TeacherDataContext.jsx";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";

function DashboardShell() {
  const { teacher, ready, error } = useTeacherData();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Close the mobile menu after choosing a page.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close the mobile menu with Escape and return focus to the menu button.
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
    navigate("/teacher/login", { replace: true });
  };

  return (
    <div className="sp-shell">
      <TeacherSidebar open={menuOpen} teacher={teacher} onClose={() => setMenuOpen(false)} onLogout={handleLogout} />
      {menuOpen && <div className="sp-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <div className="sp-main">
        <header className="sp-topbar sp-no-print">
          <button
            ref={toggleRef}
            type="button"
            className="sp-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="teacher-sidebar"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span>{menuOpen ? "Close" : "Menu"}</span>
          </button>
          <span className="sp-topbar-title">Teacher Dashboard</span>
          {teacher && (
            <span className="sp-topbar-student">
              <span className="sp-topbar-name">{teacher.title} {teacher.fullName}</span>
            </span>
          )}
        </header>

        <main id="teacher-main" className="sp-content tp-content">
          <InfoNotice>
            Records you enter here are kept in this browser only until the school's records are connected.
          </InfoNotice>
          {ready ? (
            <Outlet />
          ) : error ? (
            <p className="field-error" role="alert">
              Something went wrong while loading the dashboard. Please refresh the page.
            </p>
          ) : (
            <LoadingState label="Loading your dashboard" />
          )}
        </main>
      </div>
    </div>
  );
}

// Only signed-in teachers see the dashboard (the backend still checks every request).
export default function TeacherLayout() {
  return (
    <ProtectedRoute role="teacher" loginPath="/teacher/login">
      <TeacherDataProvider>
        <DashboardShell />
      </TeacherDataProvider>
    </ProtectedRoute>
  );
}
