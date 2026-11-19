
// Status shown as text, coloured by tone.
const statuses = {
  locked: { label: "Locked", tone: "locked" },
  unlocked: { label: "Unlocked", tone: "ok" },
  pending: { label: "Pending", tone: "info" },
  submitted: { label: "Submitted", tone: "ok" },
  overdue: { label: "Overdue", tone: "warn" },
  closed: { label: "Closed", tone: "locked" },
};

export default function StatusBadge({ status }) {
  const config = statuses[status.toLowerCase()] || statuses.pending;
  return (
    <span className={`sp-badge sp-badge-${config.tone}`}>
      {config.label}
    </span>
  );
}
