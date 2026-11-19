
// Session notices ("Your session has expired...") and login errors, shown above a login form.
export default function LoginMessages({ notice, error }) {
  return (
    <>
      {notice && (
        <p className="sp-notice" role="status">
          <span>{notice}</span>
        </p>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
    </>
  );
}
