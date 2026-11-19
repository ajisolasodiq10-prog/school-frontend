import { RESULT_STATUS as S } from "../utils/resultStatus.js";

// Result status as text, coloured by tone. Uses the portal's
// .sp-badge styles.
const looks = {
  [S.DRAFT]: { tone: "locked" },
  [S.SUBMITTED]: { tone: "info" },
  [S.APPROVED]: { tone: "ok" },
  [S.RETURNED]: { tone: "warn" },
  [S.PUBLISHED]: { tone: "ok" },
};

export default function TeacherStatusBadge({ status }) {
  const look = looks[status] || looks[S.DRAFT];
  return (
    <span className={`sp-badge sp-badge-${look.tone}`}>
      {status}
    </span>
  );
}
