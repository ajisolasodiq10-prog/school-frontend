
// Success or error message shown after an action. Use with the useFlash hook.
// The outer element is always on the page so screen readers announce changes.
export default function Flash({ flash, onDismiss }) {
  return (
    <div role="status" aria-live="polite">
      {flash && (
        <div className={`tp-flash tp-flash-${flash.tone}`}>
          <span>{flash.message}</span>
          <button type="button" onClick={onDismiss} aria-label="Dismiss message">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
