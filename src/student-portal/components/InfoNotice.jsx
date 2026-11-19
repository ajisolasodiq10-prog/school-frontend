
// A short notice shown at the top of a portal.
export default function InfoNotice({ children }) {
  return (
    <p className="sp-notice">
      <span>{children}</span>
    </p>
  );
}
