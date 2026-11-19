
// Status as text, coloured by tone. Uses the portal's .sp-badge styles.
const looks = {
  Active: "ok", Open: "ok", Published: "ok", Used: "locked",
  Inactive: "locked", Closed: "locked", Draft: "locked",
  Graduated: "info", Current: "info", Unused: "info", Scheduled: "info",
  Deactivated: "warn", "Pending Activation": "warn", Administrator: "info", Teacher: "info", Student: "info",
};

export default function StatusPill({ label }) {
  const tone = looks[label] || "locked";
  return (
    <span className={`sp-badge sp-badge-${tone}`}>
      {label}
    </span>
  );
}
