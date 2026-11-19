import { Link } from "react-router-dom";
import ContactDetails from "./ContactDetails.jsx";
import { school, navLinks } from "../config/siteConfig.js";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-about">
          <div className="footer-brand">
            <strong>{school.name}</strong>
          </div>
          <p>{school.motto}</p>
          <ul className="social-list" aria-label="Social media (placeholders)">
            {school.social.map((item) => (
              <li key={item.name}>
                <a
                  href={item.url}
                  aria-label={`${item.name} (link coming soon)`}
                  onClick={item.url === "#" ? (event) => event.preventDefault() : undefined}
                >
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav className="footer-links" aria-label="Footer navigation">
          <h2>Quick links</h2>
          <ul>
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
            <li>
              <Link to="/portal-login">Portal Login</Link>
            </li>
          </ul>
        </nav>

        <div className="footer-contact">
          <h2>Contact us</h2>
          <ContactDetails />
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>
            &copy; {year} {school.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
