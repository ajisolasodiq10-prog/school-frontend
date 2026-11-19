import { RESULT_STATUS as S } from "../utils/resultStatus.js";

// Shows where a result sits in: Draft > Submitted > Approved/Returned > Published.
export default function WorkflowSteps({ status }) {
  const currentIndex = {
    [S.DRAFT]: 0,
    [S.SUBMITTED]: 1,
    [S.APPROVED]: 2,
    [S.RETURNED]: 2,
    [S.PUBLISHED]: 3,
  }[status];

  const reviewLabel =
    status === S.RETURNED ? "Returned for Correction" : status === S.APPROVED || status === S.PUBLISHED ? "Approved" : "Approved or Returned";

  const steps = ["Draft", "Submitted for Review", reviewLabel, "Published"];

  return (
    <ol className="tp-steps" aria-label="Result workflow">
      {steps.map((label, index) => {
        const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
        return (
          <li
            key={label}
            className={`tp-step tp-step-${state} ${status === S.RETURNED && index === 2 ? "is-returned" : ""}`.trim()}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span className="tp-step-dot" aria-hidden="true">{state === "done" ? "\u2713" : index + 1}</span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
