import { loadSchoolSettings } from "../../config/schoolSettings.js";

// Grading key built from the school's grade boundaries (School Settings).
function gradeKey(bands) {
  return bands.map((band, i) => ({
    grade: band.grade,
    meaning: band.remark,
    range: i === 0 ? `${band.min}% and above` : `${band.min}% to ${bands[i - 1].min - 1}%`,
  }));
}

export default function ResultsTable({ subjects, summary }) {
  const settings = loadSchoolSettings();
  const gradeScale = gradeKey(settings.gradeBands);
  return (
    <>
      <div className="sp-table-wrap" role="region" aria-label="Results table, scrolls sideways on small screens" tabIndex={0}>
        <table className="sp-table sp-results-table">
          <caption className="visually-hidden">Subject scores and grades</caption>
          <thead>
            <tr>
              <th scope="col">Subject</th>
              <th scope="col" className="num">CA ({settings.caMax})</th>
              <th scope="col" className="num">Exam ({settings.examMax})</th>
              <th scope="col" className="num">Total ({settings.caMax + settings.examMax})</th>
              <th scope="col">Grade</th>
              <th scope="col">Teacher&apos;s remark</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((row) => (
              <tr key={row.subject}>
                <th scope="row">{row.subject}</th>
                <td className="num">{row.ca}</td>
                <td className="num">{row.exam}</td>
                <td className="num"><strong>{row.total}</strong></td>
                <td><span className={`sp-grade sp-grade-${row.grade}`}>{row.grade}</span></td>
                <td>{row.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="sp-summary">
        <div>
          <dt>Total score</dt>
          <dd>{summary.grandTotal} / {summary.maxTotal}</dd>
        </div>
        <div>
          <dt>Average</dt>
          <dd>{summary.average}%</dd>
        </div>
        <div>
          <dt>Subjects passed</dt>
          <dd>{summary.passed} of {summary.count}</dd>
        </div>
      </dl>

      <div className="sp-grade-key">
        <h3>Grading key</h3>
        <ul>
          {gradeScale.map((item) => (
            <li key={item.grade}>
              <span className={`sp-grade sp-grade-${item.grade}`}>{item.grade}</span> {item.range}: {item.meaning}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
