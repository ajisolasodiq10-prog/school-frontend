import { useState } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import FormField from "../../teacher-dashboard/components/FormField.jsx";
import Flash from "../../teacher-dashboard/components/Flash.jsx";
import useFlash from "../../teacher-dashboard/hooks/useFlash.js";
import StatusPill from "../components/StatusPill.jsx";
import { useAdminData } from "../context/AdminDataContext.jsx";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[\d\s()-]{7,20}$/;

export default function Profile() {
  usePageTitle("My Profile");
  const { profile, updateProfile } = useAdminData();
  const [form, setForm] = useState({ fullName: profile.fullName, email: profile.email, phone: profile.phone, bio: profile.bio });
  const [errors, setErrors] = useState({});
  const [flash, setFlash] = useFlash();
  const [editing, setEditing] = useState(false);
  const change = (f) => (e) => setForm((x) => ({ ...x, [f]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (form.fullName.trim().length < 3) found.fullName = "Enter your full name.";
    if (!emailPattern.test(form.email.trim())) found.email = "Enter a valid email address.";
    if (!phonePattern.test(form.phone.trim())) found.phone = "Enter a valid phone number.";
    if (form.bio.length > 300) found.bio = "Keep this under 300 characters.";
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) { document.getElementById(`prof-${first}`)?.focus(); return; }
    const res = await updateProfile(form);
    if (!res.ok) { setFlash({ tone: "error", message: res.error }); return; }
    setFlash({ tone: "success", message: "Profile updated." });
    setEditing(false);
  };

  return (
    <>
      <PageTitle title="My Profile" description="Your administrator details. Your role cannot be changed here." />
      <Flash flash={flash} onDismiss={() => setFlash(null)} />
      <section className="sp-card tp-panel" aria-label="Profile summary">
        <div className="ad-profile-head">
          <div>
            <h2>{profile.title} {profile.fullName}</h2>
            <p>Administrator ID: <strong>{profile.id}</strong></p>
            <StatusPill label={profile.role} />
          </div>
        </div>
        <dl className="ad-details">
          <div><dt>Email</dt><dd>{profile.email}</dd></div>
          <div><dt>Phone</dt><dd>{profile.phone}</dd></div>
          <div><dt>Role</dt><dd>{profile.role} (cannot be changed here)</dd></div>
          <div><dt>About</dt><dd>{profile.bio || "-"}</dd></div>
        </dl>
        {!editing && <Button variant="primary" onClick={() => { setForm({ fullName: profile.fullName, email: profile.email, phone: profile.phone, bio: profile.bio }); setErrors({}); setEditing(true); }}>Edit profile</Button>}
      </section>
      {editing && <section className="sp-card tp-panel" aria-labelledby="prof-edit">
        <h2 id="prof-edit">Edit details</h2>
        <form className="tp-form" onSubmit={submit} noValidate>
          <div className="tp-select-grid">
            <FormField id="prof-fullName" label="Full name" value={form.fullName} onChange={change("fullName")} error={errors.fullName} />
            <FormField id="prof-email" label="Email" type="email" value={form.email} onChange={change("email")} error={errors.email} />
            <FormField id="prof-phone" label="Phone" value={form.phone} onChange={change("phone")} error={errors.phone} />
            <FormField id="prof-id" label="Administrator ID" value={profile.id} readOnly disabled hint="Locked." />
            <FormField id="prof-role" label="Role" value={profile.role} readOnly disabled hint="Your role cannot be changed from the profile page." />
          </div>
          <FormField id="prof-bio" label="About you" as="textarea" rows={3} value={form.bio} onChange={change("bio")} error={errors.bio} />
          <div className="tp-form-actions">
            <Button type="submit" variant="primary">Save profile</Button>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </form>
      </section>}
    </>
  );
}
