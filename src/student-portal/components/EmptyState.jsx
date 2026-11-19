
// Friendly message for "nothing to show".
export default function EmptyState({ title, children }) {
  return (
    <div className="sp-state">
      <h2>{title}</h2>
      {children && <div className="sp-state-body">{children}</div>}
    </div>
  );
}
