import { school, isPlaceholder } from "../config/siteConfig.js";

// Address, phone, email and opening hours. Phone and email become tappable
// links automatically once real values replace the [placeholders].
export default function ContactDetails() {
  const phoneHref = `tel:${school.phone.replace(/[^+\d]/g, "")}`;
  const emailHref = `mailto:${school.email}`;

  return (
    <ul className="contact-list">
      <li>
        <div>
          <strong>Address</strong>
          <span>{school.address}</span>
        </div>
      </li>
      <li>
        <div>
          <strong>Phone</strong>
          {isPlaceholder(school.phone) ? (
            <span>{school.phone}</span>
          ) : (
            <a href={phoneHref}>{school.phone}</a>
          )}
        </div>
      </li>
      <li>
        <div>
          <strong>Email</strong>
          {isPlaceholder(school.email) ? (
            <span>{school.email}</span>
          ) : (
            <a href={emailHref}>{school.email}</a>
          )}
        </div>
      </li>
      <li>
        <div>
          <strong>Opening hours</strong>
          <span>{school.hours}</span>
        </div>
      </li>
    </ul>
  );
}
