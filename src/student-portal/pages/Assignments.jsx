import { useState } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import { formatDate } from "../../config/content.js";
import PageTitle from "../components/PageTitle.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import LoadingState from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import useAsync from "../hooks/useAsync.js";
import { getAssignments } from "../services/studentService.js";

const filters = ["All", "Pending", "Overdue", "Closed"];

export default function Assignments() {
  usePageTitle("Assignments");
  const { data: assignments, loading } = useAsync(getAssignments, []);
  const [filter, setFilter] = useState("All");

  const visible = (assignments || []).filter((item) => filter === "All" || item.status === filter);
  const countFor = (name) =>
    (assignments || []).filter((item) => name === "All" || item.status === name).length;

  return (
    <>
      <PageTitle title="Assignments" description="Work given by your teachers, with issue and due dates." />
      {loading ? (
        <LoadingState label="Loading assignments" />
      ) : (
        <>
          <div className="sp-chips" role="group" aria-label="Filter assignments by status">
            {filters.map((name) => (
              <button
                key={name}
                type="button"
                className="sp-chip"
                aria-pressed={filter === name}
                onClick={() => setFilter(name)}
              >
                {name} ({countFor(name)})
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <EmptyState title="No assignments here">
              <p>There are no {filter.toLowerCase()} assignments right now.</p>
            </EmptyState>
          ) : (
            <ul className="sp-list">
              {visible.map((item) => (
                <li key={item.id} className="sp-card sp-assignment">
                  <div className="sp-assignment-top">
                    <p className="sp-tag">{item.subject}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.instructions}</p>
                  <dl className="sp-dates">
                    <div>
                      <dt>Issued</dt>
                      <dd><time dateTime={item.issued}>{formatDate(item.issued)}</time></dd>
                    </div>
                    <div>
                      <dt>Due</dt>
                      <dd><time dateTime={item.due}>{formatDate(item.due)}</time></dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
