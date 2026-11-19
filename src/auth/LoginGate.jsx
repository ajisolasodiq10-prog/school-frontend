import { Navigate } from "react-router-dom";
import AuthLayout from "../student-portal/components/AuthLayout.jsx";
import LoadingState from "../student-portal/components/LoadingState.jsx";
import { useAuth } from "./AuthContext.jsx";
import { ROLE_HOME } from "./roles.js";

// Wraps a login page: someone already signed in with the matching role goes straight
// to their dashboard instead of seeing the form again.
export default function LoginGate({ role, children }) {
  const auth = useAuth();
  if (auth.status === "loading") return <AuthLayout><LoadingState label="Checking your session" /></AuthLayout>;
  if (auth.hasRole(role)) return <Navigate to={ROLE_HOME[role]} replace />;
  return children;
}
