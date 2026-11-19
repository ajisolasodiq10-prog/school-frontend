// Explains what deactivating or re-activating a teacher account does.
export default function DeactivateText({ teacher }) {
  const name = `${teacher.title} ${teacher.fullName}`.trim();
  return teacher.status === "Active" ? (
    <>
      <p>
        <strong>{name}</strong> will lose access to the Teacher Dashboard. The teacher record, subject allocations and
        submitted results are <strong>kept</strong>, so historical records stay intact. Teachers are never deleted.
      </p>
      <p>You can activate the account again at any time.</p>
    </>
  ) : (
    <p>
      <strong>{name}</strong> will be able to use the Teacher Dashboard again.
    </p>
  );
}
