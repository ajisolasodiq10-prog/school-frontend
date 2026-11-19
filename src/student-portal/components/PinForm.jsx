import { useState } from "react";
import Button from "../../components/Button.jsx";
import { useStudentPortal } from "../context/StudentPortalContext.jsx";

// Form for entering a result PIN. PINs are checked by the school's records system (see unlockTerm).
export default function PinForm({ term, onUnlocked }) {
  const { unlockTerm } = useStudentPortal();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const inputId = `pin-${term.id}`;

  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!pin.trim()) {
      setError("Please enter a result PIN.");
      return;
    }
    setBusy(true);
    const res = await unlockTerm(term.id, pin);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError("");
    if (onUnlocked) onUnlocked();
  };

  return (
    <form className="sp-pin-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor={inputId}>
          Result PIN for {term.term}, {term.session}
        </label>
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={`${inputId}-help${error ? ` ${inputId}-error` : ""}`}
        />
        <p className="form-note" id={`${inputId}-help`}>
          Enter the PIN you were given by the school for this term.
        </p>
        {error && (
          <p className="field-error" id={`${inputId}-error`} role="alert">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" variant="primary" size="small" disabled={busy}>
        {busy ? "Checking..." : "Unlock results"}
      </Button>
    </form>
  );
}
