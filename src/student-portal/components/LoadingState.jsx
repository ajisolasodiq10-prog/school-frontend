export default function LoadingState({ label = "Loading" }) {
  return (
    <div className="sp-state" role="status" aria-live="polite">
      <span className="sp-spinner" aria-hidden="true" />
      <p>{label}...</p>
    </div>
  );
}
