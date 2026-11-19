import { useState } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import FormField from "../components/FormField.jsx";
import Flash from "../components/Flash.jsx";
import useFlash from "../hooks/useFlash.js";
import { useTeacherData } from "../context/TeacherDataContext.jsx";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[\d\s()-]{7,20}$/;

function validate(form) {
  const errors = {};
  if (!form.email.trim()) errors.email = "Enter your email address.";
  else if (!emailPattern.test(form.email.trim())) errors.email = "Enter a valid email address, such as name@example.com.";
  if (!form.phone.trim()) errors.phone = "Enter your phone number.";
  else if (!phonePattern.test(form.phone.trim())) errors.phone = "Enter a valid phone number, such as +234 800 000 0000.";
  if (!form.qualification.trim()) errors.qualification = "Enter your qualification.";
  else if (form.qualification.trim().length > 100) errors.qualification = "Keep this under 100 characters.";
  if (form.bio.trim().length > 300) errors.bio = `Keep your profile information under 300 characters (now ${form.bio.trim().length}).`;
  return errors;
}

export default function MyProfile() {
  usePageTitle("My Profile");
  const { teacher, classes, updateProfile } = useTeacherData();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [flash, setFlash] = useFlash();

  const subjects = [...new Set(classes.flatMap((c) => c.subjects))];

  const startEdit = () => {
    setForm({ email: teacher.email, phone: teacher.phone, qualification: teacher.qualification, bio: teacher.bio });
    setErrors({});
    setEditing(true);
  };
  const change = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSave = async (event) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(`prof-${first}`)?.focus();
      return;
    }
    // Only these four fields can be changed. Name, ID, role, department,
    // classes and subjects are set by the school and cannot be edited here.
    const res = await updateProfile({
      email: form.email.trim(),
      phone: form.phone.trim(),
      qualification: form.qualification.trim(),
      bio: form.bio.trim(),
    });
    if (!res.ok) { setFlash({ tone: "error", message: res.error }); return; }
    setEditing(false);
    setFlash({ tone: "success", message: "Profile updated." });
  };

  const locked = [
    ["Teacher name", `${teacher.title} ${teacher.fullName}`.trim()],
    ["Teacher ID", teacher.id],
    ["Department", teacher.department],
    ["Role", teacher.role],
    ["Assigned subjects", subjects.join(", ")],
    ["Assigned classes", classes.map((c) => c.name).join(", ")],
  ];

  return (
    <>
      <PageTitle title="My Profile" description="Your account details." />
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      <div className="sp-card sp-profile-head">
        <div>
          <h2>{teacher.title} {teacher.fullName}</h2>
          <p className="sp-muted">{teacher.id} &middot; {teacher.department}</p>
        </div>
      </div>

      <div className="sp-two-col">
        <section className="sp-card sp-detail-card" aria-labelledby="prof-school">
          <h2 id="prof-school">School records</h2>
          <p className="form-note tp-lock-note">
            Set by the school. Teachers cannot change their role, department, classes or subjects.
          </p>
          <dl className="sp-details">
            {locked.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="sp-card sp-detail-card" aria-labelledby="prof-contact">
          <div className="sp-block-head">
            <h2 id="prof-contact">Contact and profile information</h2>
            {!editing && (
              <Button variant="outline" size="small" onClick={startEdit}>
                &nbsp;Edit
              </Button>
            )}
          </div>
          {editing ? (
            <form className="tp-form" onSubmit={handleSave} noValidate>
              <FormField id="prof-email" label="Email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={change("email")} error={errors.email} />
              <FormField id="prof-phone" label="Phone number" type="tel" autoComplete="tel" value={form.phone} onChange={change("phone")} error={errors.phone} />
              <FormField id="prof-qualification" label="Qualification" value={form.qualification} onChange={change("qualification")} error={errors.qualification} />
              <FormField id="prof-bio" label="Profile information" as="textarea" rows={4} value={form.bio} onChange={change("bio")} error={errors.bio} hint="Up to 300 characters." />
              <div className="tp-form-actions">
                <Button type="submit" variant="primary">
                  Save changes
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <dl className="sp-details">
              <div><dt>Email</dt><dd>{teacher.email}</dd></div>
              <div><dt>Phone number</dt><dd>{teacher.phone}</dd></div>
              <div><dt>Qualification</dt><dd>{teacher.qualification}</dd></div>
              <div><dt>Profile information</dt><dd>{teacher.bio}</dd></div>
            </dl>
          )}
        </section>
      </div>

    </>
  );
}
