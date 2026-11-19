import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import { formatDate } from "../../config/content.js";
import PageTitle from "../components/PageTitle.jsx";
import { useStudentPortal } from "../context/StudentPortalContext.jsx";

function DetailList({ title, items }) {
  return (
    <section className="sp-card sp-detail-card" aria-label={title}>
      <h2>{title}</h2>
      <dl className="sp-details">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || "Not available"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function MyProfile() {
  usePageTitle("My Profile");
  const { student } = useStudentPortal();

  return (
    <>
      <PageTitle title="My Profile" description="Your account details." />
      <div className="sp-card sp-profile-head">
        <div>
          <h2>{student.fullName}</h2>
          <p className="sp-muted">{student.id}{student.className ? ` · ${student.className} ${student.arm}` : ""}</p>
        </div>
      </div>

      <div className="sp-two-col">
        <DetailList
          title="School details"
          items={[
            ["Student ID", student.id],
            ["Class", student.className],
            ["Arm", student.arm],
            ["House", student.house],
            ["Admitted", student.admissionYear],
            ["Current session", student.session ? `${student.session}, ${student.term}` : ""],
          ]}
        />
        <DetailList
          title="Personal and contact details"
          items={[
            ["Gender", student.gender],
            ["Date of birth", student.dateOfBirth ? formatDate(student.dateOfBirth) : ""],
            ["Student email", student.studentEmail],
            ["Parent or guardian", student.guardianName],
            ["Guardian phone", student.guardianPhone],
            ["Guardian email", student.guardianEmail],
            ["Address", student.address],
          ]}
        />
      </div>

      <p className="sp-profile-help">
        To correct any detail, please contact the school office.{" "}
        <Button to="/contact" variant="outline" size="small">
          Contact the school
        </Button>
      </p>
    </>
  );
}
