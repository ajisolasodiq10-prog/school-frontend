import { useEffect, useState } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import LoadingState from "../../student-portal/components/LoadingState.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import FormField from "../../teacher-dashboard/components/FormField.jsx";
import Flash from "../../teacher-dashboard/components/Flash.jsx";
import useFlash from "../../teacher-dashboard/hooks/useFlash.js";
import { useAdminData } from "../context/AdminDataContext.jsx";
import * as api from "../api/adminApi.js";
import { errorText } from "../../api/records.js";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const blankCell = () => ({ subjectId: "", room: "" });
const defaultPeriods = () => [
  { start: "08:00", end: "08:40", breakLabel: "" },
  { start: "08:40", end: "09:20", breakLabel: "" },
  { start: "09:20", end: "09:50", breakLabel: "Break" },
  { start: "09:50", end: "10:30", breakLabel: "" },
  { start: "10:30", end: "11:10", breakLabel: "" },
];
const emptyCells = (count) => Object.fromEntries(DAYS.map((d) => [d, Array.from({ length: count }, blankCell)]));

// Turns the saved timetable into the editor's state: cells[day][periodIndex].
function toEditor(t) {
  if (!t.periods.length) return { periods: defaultPeriods(), cells: emptyCells(5) };
  const cells = emptyCells(t.periods.length);
  for (const day of t.days) {
    if (!cells[day.name]) continue;
    let lesson = -1;
    t.periods.forEach((p, i) => {
      if (p.breakLabel) return;
      lesson += 1;
      const l = day.lessons[lesson];
      if (l) cells[day.name][i] = { subjectId: l.subjectId || "", room: l.room || "" };
    });
  }
  return { periods: t.periods.map((p) => ({ start: p.start, end: p.end, breakLabel: p.breakLabel || "" })), cells };
}

export default function Timetable() {
  usePageTitle("Class Timetables");
  const { classes, subjects } = useAdminData();
  const [classId, setClassId] = useState(classes[0]?.id || "");
  const [state, setState] = useState(null); // { periods, cells }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useFlash();

  const klass = classes.find((c) => c.id === classId);
  const offered = (klass?.subjectIds || []).map((id) => subjects.find((s) => s.id === id)).filter(Boolean);

  useEffect(() => {
    if (!classId) return undefined;
    let cancelled = false;
    setLoading(true);
    setState(null);
    api.loadTimetable(classId)
      .then((t) => { if (!cancelled) setState(toEditor(t)); })
      .catch((e) => { if (!cancelled) setFlash({ tone: "error", message: errorText(e) }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [classId, setFlash]);

  const setPeriod = (i, field, value) => setState((s) => ({ ...s, periods: s.periods.map((p, k) => (k === i ? { ...p, [field]: value } : p)) }));
  const addPeriod = (isBreak) => setState((s) => {
    const last = s.periods[s.periods.length - 1];
    const start = last?.end || "08:00";
    const [h, m] = start.split(":").map(Number);
    const endMin = h * 60 + m + (isBreak ? 30 : 40);
    const end = `${String(Math.floor(endMin / 60) % 24).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
    return {
      periods: [...s.periods, { start, end, breakLabel: isBreak ? "Break" : "" }],
      cells: Object.fromEntries(DAYS.map((d) => [d, [...s.cells[d], blankCell()]])),
    };
  });
  const removePeriod = (i) => setState((s) => ({
    periods: s.periods.filter((_, k) => k !== i),
    cells: Object.fromEntries(DAYS.map((d) => [d, s.cells[d].filter((_, k) => k !== i)])),
  }));
  const setCell = (day, i, field, value) => setState((s) => ({
    ...s,
    cells: { ...s.cells, [day]: s.cells[day].map((c, k) => (k === i ? { ...c, [field]: value } : c)) },
  }));

  const save = async () => {
    const teachingIdx = state.periods.map((p, i) => (p.breakLabel ? -1 : i)).filter((i) => i >= 0);
    const body = {
      periods: state.periods.map((p) => ({ start: p.start, end: p.end, ...(p.breakLabel.trim() && { breakLabel: p.breakLabel.trim() }) })),
      days: DAYS.map((name) => ({
        name,
        lessons: teachingIdx.map((i) => ({ subjectId: state.cells[name][i].subjectId || null, room: state.cells[name][i].room.trim() || null })),
      })),
    };
    setSaving(true);
    try {
      setState(toEditor(await api.saveTimetable(classId, body)));
      setFlash({ tone: "success", message: "Timetable saved. Students of this class can see it now." });
    } catch (e) {
      setFlash({ tone: "error", message: errorText(e) });
    } finally {
      setSaving(false);
    }
  };

  if (classes.length === 0) {
    return (
      <>
        <PageTitle title="Class Timetables" description="Set the weekly timetable of each class." />
        <EmptyState title="No classes yet"><p>Create a class for the current session first.</p></EmptyState>
      </>
    );
  }

  return (
    <>
      <PageTitle title="Class Timetables" description="Set the weekly timetable of each class. Students see it in their portal." />
      <Flash flash={flash} onDismiss={() => setFlash(null)} />
      <section className="tp-filters tp-filters-one" aria-label="Choose a class">
        <FormField id="tt-class" label="Class" as="select" value={classId} onChange={(e) => setClassId(e.target.value)}
          options={classes.map((c) => ({ value: c.id, label: c.name }))} />
      </section>

      {loading || !state ? <LoadingState label="Loading timetable" /> : (
        <>
          <section className="sp-card tp-panel" aria-labelledby="tt-periods">
            <h2 id="tt-periods">Periods</h2>
            <p className="form-note">The same periods apply to every day. A period with a break name has no lesson.</p>
            {state.periods.map((p, i) => (
              <div key={i} className="tp-select-grid">
                <FormField id={`tt-start-${i}`} label={`Period ${i + 1} start`} type="time" value={p.start} onChange={(e) => setPeriod(i, "start", e.target.value)} />
                <FormField id={`tt-end-${i}`} label="End" type="time" value={p.end} onChange={(e) => setPeriod(i, "end", e.target.value)} />
                <FormField id={`tt-break-${i}`} label="Break name (leave empty for a lesson)" value={p.breakLabel} onChange={(e) => setPeriod(i, "breakLabel", e.target.value)} />
                <div><Button variant="outline-danger" size="small" onClick={() => removePeriod(i)} aria-label={`Remove period ${i + 1}`}>Remove</Button></div>
              </div>
            ))}
            <div className="tp-form-actions">
              <Button variant="outline" size="small" onClick={() => addPeriod(false)}>Add lesson period</Button>
              <Button variant="outline" size="small" onClick={() => addPeriod(true)}>Add break</Button>
            </div>
          </section>

          {DAYS.map((day) => (
            <section key={day} className="sp-card tp-panel" aria-labelledby={`tt-${day}`}>
              <h2 id={`tt-${day}`}>{day}</h2>
              {state.periods.map((p, i) => (p.breakLabel ? (
                <p key={i} className="sp-muted">{p.start} - {p.end}: {p.breakLabel}</p>
              ) : (
                <div key={i} className="tp-select-grid">
                  <FormField id={`tt-${day}-${i}-s`} label={`${p.start} - ${p.end} subject`} as="select" value={state.cells[day][i].subjectId}
                    onChange={(e) => setCell(day, i, "subjectId", e.target.value)}
                    options={[{ value: "", label: "Free period" }, ...offered.map((s) => ({ value: s.id, label: s.name }))]} />
                  <FormField id={`tt-${day}-${i}-r`} label="Room" value={state.cells[day][i].room} onChange={(e) => setCell(day, i, "room", e.target.value)} maxLength={60} />
                </div>
              )))}
            </section>
          ))}
          <div className="tp-form-actions">
            <Button variant="primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save timetable"}</Button>
          </div>
        </>
      )}
    </>
  );
}
