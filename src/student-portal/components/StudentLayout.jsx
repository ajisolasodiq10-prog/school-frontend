import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import LoadingState from "./LoadingState.jsx";
import StudentSidebar from "./StudentSidebar.jsx";
import InfoNotice from "./InfoNotice.jsx";
import { StudentPortalProvider, useStudentPortal } from "../context/StudentPortalContext.jsx";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";

function PortalShell() {
  const { student, ready, error } = useStudentPortal();
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
    if (!menuOpen) return;
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
    navigate("/student/login", { replace: true });
  };

  return (
    <div className="sp-shell">
      <StudentSidebar
        open={menuOpen}
        student={student}
        onClose={() => setMenuOpen(false)}
        onLogout={handleLogout}
      />
      {menuOpen && <div className="sp-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <div className="sp-main">
        <header className="sp-topbar sp-no-print">
          <button
            ref={toggleRef}
            type="button"
            className="sp-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="student-sidebar"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span>{menuOpen ? "Close" : "Menu"}</span>
          </button>
          <span className="sp-topbar-title">Student Portal</span>
          {student && (
            <span className="sp-topbar-student">
              <span className="sp-topbar-name">{student.fullName}</span>
            </span>
          )}
        </header>

        <main id="student-main" className="sp-content">
          <InfoNotice>
            Information on these pages is not connected to the school's records yet.
          </InfoNotice>
          {ready ? (
            <Outlet />
          ) : error ? (
            <p className="field-error" role="alert">
              Something went wrong while loading the portal. Please refresh the page.
            </p>
          ) : (
            <LoadingState label="Loading your portal" />
          )}
        </main>
      </div>
    </div>
  );
}

// Only signed-in students see the portal (the backend still checks every request).
export default function StudentLayout() {
  return (
    <ProtectedRoute role="student" loginPath="/student/login">
      <StudentPortalProvider>
        <PortalShell />
      </StudentPortalProvider>
    </ProtectedRoute>
  );
}
