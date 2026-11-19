// Result workflow:  Draft -> Submitted for Review -> Approved or Returned for
// Correction -> Published.
//
// The teacher dashboard can only create Drafts and Submit them. Approved,
// Returned and Published are statuses that will be set by the administrator: in the finished system they will
// be set by the Admin Dashboard and backend, never by the teacher.
export const RESULT_STATUS = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted for Review",
  APPROVED: "Approved",
  RETURNED: "Returned for Correction",
  PUBLISHED: "Published",
};

// Statuses a teacher may still edit.
export const EDITABLE_STATUSES = [RESULT_STATUS.DRAFT, RESULT_STATUS.RETURNED];

export const isEditable = (record) => !record || EDITABLE_STATUSES.includes(record.status);

// Class + subject pairs the teacher is responsible for.
export function assignedPairs(classes) {
  return classes.flatMap((item) =>
    item.subjects.map((subject) => ({ classId: item.id, className: item.name, subject }))
  );
}

export const sameResult = (record, classId, subject, session, term) =>
  record.classId === classId &&
  record.subject === subject &&
  record.session === session &&
  record.term === term;

// How many class/subject results still need to be submitted this term.
export function countAwaiting(classes, results, session, term) {
  return assignedPairs(classes).filter((pair) => {
    const record = results.find((r) => sameResult(r, pair.classId, pair.subject, session, term));
    return !record || EDITABLE_STATUSES.includes(record.status);
  }).length;
}
