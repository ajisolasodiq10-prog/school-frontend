import { useEffect, useId, useRef } from "react";
import Button from "../../components/Button.jsx";

// A modal confirmation box built on the browser's own <dialog> element, which
// handles focus, the Escape key and the dimmed backdrop for us.
//   <ConfirmDialog open={show} title="..." onConfirm={...} onCancel={...}>text</ConfirmDialog>
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="tp-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        // A click on the dimmed area (the dialog element itself) cancels.
        if (event.target === dialogRef.current) onCancel();
      }}
    >
      <div className="tp-dialog-body">
        <h2 id={titleId}>{title}</h2>
        <div className="tp-dialog-text">{children}</div>
        <div className="tp-dialog-actions">
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
