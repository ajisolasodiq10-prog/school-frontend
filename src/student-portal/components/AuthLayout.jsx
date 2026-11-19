import { Link } from "react-router-dom";
import { school } from "../../config/siteConfig.js";

// Centered card layout shared by the login and forgot-password pages.
export default function AuthLayout({ children }) {
  return (
    <div className="sp-auth">
      <main className="sp-auth-card">
        <div className="sp-auth-brand">
          <p className="sp-auth-school">{school.name}</p>
        </div>
        {children}
      </main>
      <Link className="sp-auth-back" to="/">
        Back to the school website
      </Link>
    </div>
  );
}
