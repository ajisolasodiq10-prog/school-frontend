import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";

// Shown on pages that need a class when none has been assigned to the teacher yet.
export default function NoClasses({ title, description }) {
  return (
    <>
      <PageTitle title={title} description={description} />
      <EmptyState title="No classes assigned yet">
        <p>Classes and subjects assigned to you by the school will appear here.</p>
      </EmptyState>
    </>
  );
}
