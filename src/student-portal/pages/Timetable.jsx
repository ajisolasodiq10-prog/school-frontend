import usePageTitle from "../../hooks/usePageTitle.js";
import EmptyState from "../components/EmptyState.jsx";
import PageTitle from "../components/PageTitle.jsx";
import LoadingState from "../components/LoadingState.jsx";
import useAsync from "../hooks/useAsync.js";
import { getTimetable } from "../services/studentService.js";
import { useStudentPortal } from "../context/StudentPortalContext.jsx";

// Combines the period times with each day's lessons into table rows.
function buildRows(timetable) {
  let lessonIndex = -1;
  return timetable.periods.map((period) => {
    if (period.breakLabel) {
      return { time: period.time, breakLabel: period.breakLabel };
    }
    lessonIndex += 1;
    return {
      time: period.time,
      cells: timetable.days.map((day) => day.lessons[lessonIndex]),
    };
  });
}

export default function Timetable() {
  usePageTitle("Timetable");
  const { student } = useStudentPortal();
  const { data: timetable, loading } = useAsync(() => getTimetable(student.classId), [student.classId]);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long" });

  return (
    <>
      <PageTitle
        title="Timetable"
        description={student.className ? `Weekly lessons for ${student.className} ${student.arm}, ${student.term}.` : "Your weekly lessons."}
      />
      {loading || !timetable ? (
        <LoadingState label="Loading timetable" />
      ) : timetable.periods.length === 0 || timetable.days.length === 0 ? (
        <EmptyState title="No timetable yet">
          <p>Your weekly timetable will appear here once the school publishes it.</p>
        </EmptyState>
      ) : (
        <TimetableView timetable={timetable} today={today} />
      )}
    </>
  );
}

function TimetableView({ timetable, today }) {
  const rows = buildRows(timetable);

  return (
    <>
      {/* Wide screens: one table with days across the top */}
      <div className="sp-table-wrap sp-timetable-wide" role="region" aria-label="Weekly timetable" tabIndex={0}>
        <table className="sp-table sp-timetable">
          <caption className="visually-hidden">Weekly timetable</caption>
          <thead>
            <tr>
              <th scope="col">Time</th>
              {timetable.days.map((day) => (
                <th
                  key={day.name}
                  scope="col"
                  className={day.name === today ? "is-today" : ""}
                  aria-current={day.name === today ? "date" : undefined}
                >
                  {day.name}
                  {day.name === today && <span className="sp-today"> (today)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              row.breakLabel ? (
                <tr key={row.time} className="sp-break-row">
                  <th scope="row">{row.time}</th>
                  <td colSpan={timetable.days.length}>{row.breakLabel}</td>
                </tr>
              ) : (
                <tr key={row.time}>
                  <th scope="row">{row.time}</th>
                  {row.cells.map((cell, i) => (
                    <td key={timetable.days[i].name}>
                      <strong>{cell.subject}</strong>
                      <span>{cell.room}</span>
                    </td>
                  ))}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Phones: one card per day */}
      <div className="sp-timetable-narrow">
        {timetable.days.map((day, dayIndex) => (
          <section
            key={day.name}
            className={`sp-card sp-day ${day.name === today ? "is-today" : ""}`.trim()}
            aria-labelledby={`day-${day.name}`}
          >
            <h2 id={`day-${day.name}`}>
              {day.name}
              {day.name === today && <span className="sp-today"> (today)</span>}
            </h2>
            <ul>
              {rows.map((row) =>
                row.breakLabel ? (
                  <li key={row.time} className="sp-day-break">
                    <span>{row.time}</span>
                    <span>{row.breakLabel}</span>
                  </li>
                ) : (
                  <li key={row.time}>
                    <span className="sp-day-time">{row.time}</span>
                    <span>
                      <strong>{row.cells[dayIndex].subject}</strong>
                      <small>{row.cells[dayIndex].room}</small>
                    </span>
                  </li>
                )
              )}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
