import { useState } from "react";
import { Link } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import useLogin from "../../auth/useLogin.js";
import LoginMessages from "../../auth/LoginMessages.jsx";

export default function StudentLogin() {
  usePageTitle("Student Login");
  const { submit, submitting, error, notice } = useLogin("student");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = {};
    if (!studentId.trim()) found.studentId = "Please enter your Student ID.";
    if (!password) found.password = "Please enter your password.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    submit(studentId.trim(), password);
  };

  return (
    <AuthLayout>
      <h1 className="sp-auth-title">Student Login</h1>
      <p className="sp-notice">
        <span>Use the Student ID (or email) and password given to you by your school.</span>
      </p>
      <LoginMessages notice={notice} error={error} />

      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="student-id">Student ID</label>
          <input
            id="student-id"
            type="text"
            autoComplete="username"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            aria-invalid={errors.studentId ? "true" : "false"}
            aria-describedby={errors.studentId ? "student-id-error" : undefined}
          />
          {errors.studentId && (
            <p className="field-error" id="student-id-error">
              {errors.studentId}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="student-password">Password</label>
          <div className="sp-password">
            <input
              id="student-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "student-password-error" : undefined}
            />
            <button
              type="button"
              className="sp-password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-pressed={showPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <span aria-hidden="true">{showPassword ? "Hide" : "Show"}</span>
            </button>
          </div>
          {errors.password && (
            <p className="field-error" id="student-password-error">
              {errors.password}
            </p>
          )}
        </div>

        <Button type="submit" variant="primary" className="sp-full" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </Button>
        <p className="sp-auth-links">
          <Link to="/student/forgot-password">Forgot password?</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
