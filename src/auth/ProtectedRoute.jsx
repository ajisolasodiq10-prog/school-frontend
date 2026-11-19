import { Link, Navigate, useLocation } from "react-router-dom";
import Button from "../components/Button.jsx";
import AuthLayout from "../student-portal/components/AuthLayout.jsx";
import LoadingState from "../student-portal/components/LoadingState.jsx";
import { useAuth } from "./AuthContext.jsx";
import { ROLE_HOME, ROLE_LABEL } from "./roles.js";

// Wraps a dashboard. Only a signed-in user with the right role sees the children.
// This is for navigation and a good user experience only: the backend checks the token
// and the role again on every request and is the real security authority.
export default function ProtectedRoute({ role, loginPath, children }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === "loading") {
    return <AuthLayout><LoadingState label="Checking your session" /></AuthLayout>;
  }
  if (auth.status === "error") {
    return (
      <AuthLayout>
        <h1 className="sp-auth-title">Cannot reach the server</h1>
        <p role="alert">{auth.error}</p>
        <Button variant="primary" className="sp-full" onClick={auth.retry}>Try again</Button>
      </AuthLayout>
    );
  }
  if (auth.status !== "authenticated") {
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }
  if (auth.role !== role) {
    const home = ROLE_HOME[auth.role];
    return (
      <AuthLayout>
        <h1 className="sp-auth-title">Access not allowed</h1>
        <p role="alert">
          You are signed in as {auth.role === "administrator" ? "an" : "a"} {ROLE_LABEL[auth.role] || "different kind of user"}, so you cannot open the {ROLE_LABEL[role]} area.
        </p>
        <div className="sp-stack">
          {home ? <Button to={home} variant="primary" className="sp-full">Go to my dashboard</Button>
            : <p>There is no dashboard for this account type yet.</p>}
          <Button variant="outline" className="sp-full" onClick={async () => { await auth.logout(); }}>Log out</Button>
        </div>
        <p className="sp-auth-links"><Link to="/">Back to the school website</Link></p>
      </AuthLayout>
    );
  }
  return children;
}
