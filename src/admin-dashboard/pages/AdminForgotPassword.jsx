import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import AuthLayout from "../../student-portal/components/AuthLayout.jsx";

// Frontend-only page. No password reset exists yet.
export default function AdminForgotPassword() {
  usePageTitle("Forgot Password");
  return (
    <AuthLayout>
      <h1 className="sp-auth-title">Forgot your password?</h1>
      <p>
        Online password reset is not available yet. Administrators recover access through a controlled process
        managed by the school and the platform operator.
      </p>
      <div className="sp-stack">
        <Button to="/admin/login" variant="primary" className="sp-full">Back to login</Button>
        <Button to="/contact" variant="outline" className="sp-full">Contact the school</Button>
      </div>
    </AuthLayout>
  );
}
