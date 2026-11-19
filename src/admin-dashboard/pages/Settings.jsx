import { useState } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import FormField from "../../teacher-dashboard/components/FormField.jsx";
import Flash from "../../teacher-dashboard/components/Flash.jsx";
import ConfirmDialog from "../../teacher-dashboard/components/ConfirmDialog.jsx";
import useFlash from "../../teacher-dashboard/hooks/useFlash.js";
import { useAdminData } from "../context/AdminDataContext.jsx";
import { validateBands, bandRanges } from "../utils/scoring.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[\d\s()-]{7,20}$/;

export default function Settings() {
  usePageTitle("School Settings");
  const { settings, updateSettings, restoreSettings } = useAdminData();
  const [form, setForm] = useState(() => ({
    schoolName: settings.schoolName, address: settings.address, email: settings.email, phone: settings.phone,
    caMax: String(settings.caMax), examMax: String(settings.examMax),
    bands: settings.gradeBands.map((b) => ({ ...b, min: String(b.min) })),
    display: { ...settings.display },
  }));
  const [errors, setErrors] = useState({});
  const [bandErrors, setBandErrors] = useState({});
  const [flash, setFlash] = useFlash();
  const [dialog, setDialog] = useState(null); // "max" | "reset"
  const [saving, setSaving] = useState(false);

  const change = (f) => (e) => setForm((x) => ({ ...x, [f]: e.target.value }));
  const setBand = (i, v) => setForm((x) => ({ ...x, bands: x.bands.map((b, j) => (j === i ? { ...b, min: v } : b)) }));
  const setDisplay = (k) => (e) => setForm((x) => ({ ...x, display: { ...x.display, [k]: e.target.checked } }));
  const maxChanged = Number(form.caMax) !== settings.caMax || Number(form.examMax) !== settings.examMax;

  const commit = async () => {
    setSaving(true);
    const res = await updateSettings({
      ...settings,
      schoolName: form.schoolName.trim(), address: form.address.trim(), email: form.email.trim(), phone: form.phone.trim(),
      caMax: Number(form.caMax), examMax: Number(form.examMax),
      gradeBands: form.bands.map((b) => ({ ...b, min: Number(b.min) })),
      display: form.display,
    });
    setSaving(false);
    setDialog(null);
    setFlash(res.ok
      ? { tone: "success", message: "Settings saved. Teachers and students get the new score maximums and grade boundaries the next time they open their dashboard." }
      : { tone: "error", message: res.error });
  };

  const submit = (e) => {
    e.preventDefault();
    const found = {};
    if (form.schoolName.trim().length < 3) found.schoolName = "Enter the school name.";
    if (form.address.trim().length < 5) found.address = "Enter the school address.";
    if (!emailPattern.test(form.email.trim())) found.email = "Enter a valid email address.";
    if (!phonePattern.test(form.phone.trim())) found.phone = "Enter a valid phone number.";
    const ca = Number(form.caMax);
    const exam = Number(form.examMax);
    if (!Number.isInteger(ca) || ca < 1 || ca > 99) found.caMax = "Use a whole number from 1 to 99.";
    if (!Number.isInteger(exam) || exam < 1 || exam > 99) found.examMax = "Use a whole number from 1 to 99.";
    if (!found.caMax && !found.examMax && ca + exam !== 100) found.examMax = `The CA and exam maximums must add up to 100 (they add up to ${ca + exam}).`;
    const bands = validateBands(form.bands);
    setErrors(found);
    setBandErrors(bands.errors);
    const first = Object.keys(found)[0];
    if (first) { document.getElementById(`set-${first}`)?.focus(); return; }
    if (!bands.ok) { document.getElementById(`set-band-${Object.keys(bands.errors)[0]}`)?.focus(); return; }
    if (maxChanged) setDialog("max"); else commit();
  };

  const ranges = validateBands(form.bands).ok ? bandRanges(form.bands.map((b) => ({ ...b, min: Number(b.min) }))) : null;

  return (
    <>
      <PageTitle title="School Settings" description="School profile, scoring and result display settings." />
      <Flash flash={flash} onDismiss={() => setFlash(null)} />
      <form className="tp-form" onSubmit={submit} noValidate>
        <section className="sp-card tp-panel" aria-labelledby="set-school">
          <h2 id="set-school">School details</h2>
          <div className="tp-select-grid">
            <FormField id="set-schoolName" label="School name" value={form.schoolName} onChange={change("schoolName")} error={errors.schoolName} />
            <FormField id="set-address" label="Address" value={form.address} onChange={change("address")} error={errors.address} />
            <FormField id="set-email" label="Contact email" type="email" value={form.email} onChange={change("email")} error={errors.email} />
            <FormField id="set-phone" label="Contact phone" value={form.phone} onChange={change("phone")} error={errors.phone} />
          </div>
        </section>

        <section className="sp-card tp-panel" aria-labelledby="set-scores">
          <h2 id="set-scores">Score maximums</h2>
          <div className="tp-select-grid">
            <FormField id="set-caMax" label="Continuous assessment maximum" inputMode="numeric" value={form.caMax} onChange={change("caMax")} error={errors.caMax} />
            <FormField id="set-examMax" label="Examination maximum" inputMode="numeric" value={form.examMax} onChange={change("examMax")} error={errors.examMax} hint="The two maximums must add up to 100." />
          </div>
        </section>

        <section className="sp-card tp-panel" aria-labelledby="set-grades">
          <h2 id="set-grades">Grade boundaries</h2>
          <p>Enter the lowest percentage for each grade. Each boundary must be lower than the grade above it, and the lowest grade must start at 0.</p>
          <div className="ad-band-grid">
            {form.bands.map((b, i) => (
              <FormField key={b.grade} id={`set-band-${b.grade}`} label={`Grade ${b.grade} (${b.remark}) starts at`} inputMode="numeric"
                value={b.min} onChange={(e) => setBand(i, e.target.value)} error={bandErrors[b.grade]} />
            ))}
          </div>
          {ranges && <p className="form-note">Ranges: {ranges.map((r) => `${r.grade} ${r.range}`).join(", ")}</p>}
        </section>

        <section className="sp-card tp-panel" aria-labelledby="set-display">
          <h2 id="set-display">Result display</h2>
          <label className="ad-check"><input type="checkbox" checked={form.display.showGrade} onChange={setDisplay("showGrade")} /> Show grade</label>
          <label className="ad-check"><input type="checkbox" checked={form.display.showClassAverage} onChange={setDisplay("showClassAverage")} /> Show class average</label>
          <label className="ad-check"><input type="checkbox" checked={form.display.showRemarks} onChange={setDisplay("showRemarks")} /> Show teacher remarks</label>
        </section>

        <div className="tp-form-actions">
          <Button type="submit" variant="primary" disabled={saving}>Save settings</Button>
          <Button variant="outline" onClick={() => setDialog("reset")}>Restore default settings</Button>
        </div>
      </form>

      <ConfirmDialog open={dialog === "max"} title="Change the score maximums?" confirmLabel="Yes, save" onConfirm={commit} onCancel={() => setDialog(null)}>
        <p>CA out of {form.caMax} and exam out of {form.examMax} will be used when teachers enter scores and in result review. The backend will refuse scores above these maximums. Existing scores are not changed, so some may now be flagged as over the maximum.</p>
      </ConfirmDialog>
      <ConfirmDialog open={dialog === "reset"} title="Restore default settings?" danger confirmLabel="Yes, restore"
        onConfirm={async () => {
          const res = await restoreSettings();
          setDialog(null);
          if (res.ok) window.location.reload(); else setFlash({ tone: "error", message: res.error });
        }} onCancel={() => setDialog(null)}>
        <p>All settings return to their default values. This page will reload.</p>
      </ConfirmDialog>
    </>
  );
}
