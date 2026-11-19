import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { ROLE_HOME } from "./roles.js";

// Shared by the three login pages. Returns submit(identifier, password), which signs in
// through the backend and opens the dashboard for the portal's role.
export default function useLogin(role) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = useCallback(async (identifier, password) => {
    setSubmitting(true);
    setError("");
    auth.dismissNotice();
    try {
      await auth.login(identifier, password, role);
      navigate(ROLE_HOME[role], { replace: true });
    } catch (e) {
      setError(e.code === "RATE_LIMITED" && e.retryAfter
        ? `${e.message} Try again in about ${Math.ceil(e.retryAfter / 60)} minute(s).`
        : e.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [auth, navigate, role]);

  return { submit, submitting, error, notice: auth.notice };
}
