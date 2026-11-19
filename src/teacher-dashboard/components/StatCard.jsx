import { Link } from "react-router-dom";

// Number + label card used on the overview. Becomes a link when `to` is given.
export default function StatCard({ value, label, to, hint }) {
  const content = (
    <>
      <span className="tp-stat-text">
        <strong>{value}</strong>
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </span>
    </>
  );
  return to ? (
    <Link to={to} className="sp-card tp-stat tp-stat-link">
      {content}
    </Link>
  ) : (
    <div className="sp-card tp-stat">{content}</div>
  );
}
