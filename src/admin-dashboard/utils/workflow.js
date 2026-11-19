// ---------------------------------------------------------------------------
// RESULT REVIEW RULES
//
//   Draft -> Submitted for Review -> Approved or Returned for Correction -> Published
//
// These pure functions are the only place the rules live, so the pages cannot
// break them by accident. A real backend must enforce the same rules on the
// server: nothing here is a real permission check.
// ---------------------------------------------------------------------------
import { RESULT_STATUS as S } from "../../teacher-dashboard/utils/resultStatus.js";

export const canReview = (record) => record.status === S.SUBMITTED;
export const canApprove = (record, invalidCount = 0) => record.status === S.SUBMITTED && invalidCount === 0;
export const canReturn = (record) => record.status === S.SUBMITTED;
// Only approved results can be published. Drafts can never be published.
export const canPublish = (record) => record.status === S.APPROVED;

export function approve(record, adminName, date) {
  if (record.status !== S.SUBMITTED) throw new Error(`Only submitted results can be approved (this one is "${record.status}").`);
  return { ...record, status: S.APPROVED, reviewedOn: date, reviewedBy: adminName, feedback: null };
}

export function returnForCorrection(record, adminName, date, reason) {
  if (record.status !== S.SUBMITTED) throw new Error(`Only submitted results can be returned (this one is "${record.status}").`);
  if (!reason || reason.trim().length < 10) throw new Error("A reason of at least 10 characters is required.");
  return {
    ...record,
    status: S.RETURNED,
    reviewedOn: date,
    reviewedBy: adminName,
    feedback: { from: `${adminName} (Administrator)`, date, message: reason.trim() },
  };
}

export function publish(record, adminName, date) {
  if (record.status !== S.APPROVED) throw new Error(`Only approved results can be published (this one is "${record.status}").`);
  return { ...record, status: S.PUBLISHED, publishedOn: date, publishedBy: adminName };
}
