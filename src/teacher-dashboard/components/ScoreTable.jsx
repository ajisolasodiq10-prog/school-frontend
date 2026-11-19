import { TOTAL_MAX, CA_MAX, EXAM_MAX } from "../config/scoreConfig.js";
import { totalOf, gradeFor } from "../utils/scores.js";

// Read-only table of scores (used on the result detail page).
export default function ScoreTable({ students, scores }) {
  return (
    <div className="sp-table-wrap" role="region" aria-label="Student scores" tabIndex={0}>
      <table className="sp-table tp-stack-table">
        <caption className="visually-hidden">Student scores</caption>
        <thead>
          <tr>
            <th scope="col">Student ID</th>
            <th scope="col">Student name</th>
            <th scope="col" className="num">CA ({CA_MAX})</th>
            <th scope="col" className="num">Exam ({EXAM_MAX})</th>
            <th scope="col" className="num">Total ({TOTAL_MAX})</th>
            <th scope="col">Grade</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const entry = scores[student.id] || {};
            const total = totalOf(entry);
            return (
              <tr key={student.id}>
                <td data-label="Student ID">{student.id}</td>
                <th scope="row" data-label="Name">{student.name}</th>
                <td className="num" data-label="CA">{entry.ca !== undefined && entry.ca !== "" ? entry.ca : "-"}</td>
                <td className="num" data-label="Exam">{entry.exam !== undefined && entry.exam !== "" ? entry.exam : "-"}</td>
                <td className="num" data-label="Total"><strong>{total === null ? "-" : total}</strong></td>
                <td data-label="Grade">
                  {total === null ? "-" : <span className={`sp-grade sp-grade-${gradeFor(total)}`}>{gradeFor(total)}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
