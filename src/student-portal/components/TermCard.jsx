import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button.jsx";
import StatusBadge from "./StatusBadge.jsx";
import PinForm from "./PinForm.jsx";

// One term on the My Results page: session, term, status and an action.
export default function TermCard({ term }) {
  const [showPin, setShowPin] = useState(false);
  const navigate = useNavigate();
  const unlocked = term.status === "unlocked";

  return (
    <li className="sp-card sp-term-card">
      <div className="sp-term-top">
        <div>
          <h3>{term.term}</h3>
          <p className="sp-muted">
            Session {term.session} &middot; {term.className}
            {term.current && <span className="sp-tag">Current term</span>}
          </p>
        </div>
        <StatusBadge status={term.status} />
      </div>

      {unlocked ? (
        <Button to={`/student/results/${term.id}`} variant="primary" size="small">
          View Results
        </Button>
      ) : (
        <>
          <Button
            variant="outline"
            size="small"
            aria-expanded={showPin}
            aria-controls={`pin-panel-${term.id}`}
            onClick={() => setShowPin((open) => !open)}
          >
            {showPin ? "Hide PIN form" : "Enter Result PIN"}
          </Button>
          {showPin && (
            <div id={`pin-panel-${term.id}`} className="sp-pin-panel">
              <PinForm term={term} onUnlocked={() => navigate(`/student/results/${term.id}`)} />
            </div>
          )}
        </>
      )}
    </li>
  );
}
