import { useState } from "react";
import Button from "../../components/Button.jsx";
import FormField from "../../teacher-dashboard/components/FormField.jsx";
import ConfirmDialog from "../../teacher-dashboard/components/ConfirmDialog.jsx";
import { useAdminData } from "../context/AdminDataContext.jsx";

// Assigns a teacher to a subject in a class. Any of classId / subjectId /
// teacherId can be fixed by the page that uses it (so that field is hidden).
export default function AllocationAdder({ fixed = {}, onResult }) {
  const { classes, subjects, teachers, findAllocation, saveAllocation, teacherName, className, subjectName } = useAdminData();
  const [form, setForm] = useState({ classId: "", subjectId: "", teacherId: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null);

  const values = { ...form, ...fixed };
  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));
  const activeTeachers = teachers.filter((t) => t.status === "Active");

  const commit = async (v) => {
    const res = await saveAllocation(v);
    if (!res.ok) { setError(res.error); return; }
    setError("");
    setPending(null);
    setForm((f) => ({ ...f, subjectId: fixed.subjectId ? f.subjectId : "", classId: fixed.classId ? f.classId : "", teacherId: fixed.teacherId ? f.teacherId : "" }));
    onResult?.(`${subjectName(v.subjectId)} in ${className(v.classId)} assigned to ${teacherName(v.teacherId)}`);
  };

  const submit = (event) => {
    event.preventDefault();
    if (!values.classId || !values.subjectId || !values.teacherId) {
      setError("Choose a class, a subject and a teacher.");
      return;
    }
    const existing = findAllocation(values.classId, values.subjectId);
    if (existing && existing.teacherId === values.teacherId) {
      setError("That teacher is already assigned to this subject in this class.");
      return;
    }
    if (existing) { setError(""); setPending(values); return; }
    commit(values);
  };

  return (
    <>
      <form className="ad-adder" onSubmit={submit} noValidate>
        {!fixed.classId && (
          <FormField id="adder-class" label="Class" as="select" value={values.classId} onChange={set("classId")}
            options={[{ value: "", label: "Choose class" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]} />
        )}
        {!fixed.subjectId && (
          <FormField id="adder-subject" label="Subject" as="select" value={values.subjectId} onChange={set("subjectId")}
            options={[{ value: "", label: "Choose subject" }, ...subjects.map((s) => ({ value: s.id, label: s.name }))]} />
        )}
        {!fixed.teacherId && (
          <FormField id="adder-teacher" label="Teacher" as="select" value={values.teacherId} onChange={set("teacherId")}
            options={[{ value: "", label: "Choose teacher" }, ...activeTeachers.map((t) => ({ value: t.id, label: `${t.title} ${t.fullName}` }))]} />
        )}
        <Button type="submit" variant="primary">Assign</Button>
        {error && <p className="field-error ad-adder-error" role="alert">{error}</p>}
      </form>

      <ConfirmDialog
        open={Boolean(pending)}
        title="Replace the current teacher?"
        confirmLabel="Replace teacher"
        onConfirm={() => commit(pending)}
        onCancel={() => setPending(null)}
      >
        {pending && (
          <p>
            {subjectName(pending.subjectId)} in {className(pending.classId)} is currently taught by{" "}
            <strong>{teacherName(findAllocation(pending.classId, pending.subjectId)?.teacherId)}</strong>. Replace with{" "}
            <strong>{teacherName(pending.teacherId)}</strong>?
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
