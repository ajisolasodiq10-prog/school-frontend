import { useState } from "react";
import { Link } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import AuthLayout from "../../student-portal/components/AuthLayout.jsx";
import useLogin from "../../auth/useLogin.js";
import LoginMessages from "../../auth/LoginMessages.jsx";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(login, password) {
  const errors = {};
  const value = login.trim();
  if (!value) {
    errors.login = "Please enter your Teacher ID or email address.";
  } else if (value.includes("@") && !emailPattern.test(value)) {
    errors.login = "That email address does not look right. Example: name@example.com";
  }
  if (!password) {
    errors.password = "Please enter your password.";
  }
  return errors;
}

export default function TeacherLogin() {
  usePageTitle("Teacher Login");
  const { submit, submitting, error, notice } = useLogin("teacher");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validate(login, password);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.getElementById(found.login ? "teacher-login" : "teacher-password")?.focus();
      return;
    }
    submit(login.trim(), password);
  };

  return (
    <AuthLayout>
      <h1 className="sp-auth-title">Teacher Login</h1>
      <p className="sp-notice">
        <span>Use the username (or email) and password given to you by your school.</span>
      </p>
      <LoginMessages notice={notice} error={error} />

      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="teacher-login">Teacher ID or email</label>
          <input
            id="teacher-login"
            type="text"
            autoComplete="username"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            aria-invalid={errors.login ? "true" : "false"}
            aria-describedby={errors.login ? "teacher-login-error" : undefined}
          />
          {errors.login && (
            <p className="field-error" id="teacher-login-error">
              {errors.login}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="teacher-password">Password</label>
          <div className="sp-password">
            <input
              id="teacher-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "teacher-password-error" : undefined}
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
            <p className="field-error" id="teacher-password-error">
              {errors.password}
            </p>
          )}
        </div>

        <Button type="submit" variant="primary" className="sp-full" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </Button>
        <p className="sp-auth-links">
          <Link to="/teacher/forgot-password">Forgot password?</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
