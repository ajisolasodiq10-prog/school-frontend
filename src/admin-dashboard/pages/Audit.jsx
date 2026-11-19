import { useEffect, useState } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import FormField from "../../teacher-dashboard/components/FormField.jsx";
import usePaged from "../hooks/usePaged.js";
import { useAdminData } from "../context/AdminDataContext.jsx";
import { formatDateTime } from "../utils/dates.js";

export default function Audit() {
  usePageTitle("Audit Log");
  const { audit, refreshAudit } = useAdminData();
  useEffect(() => { refreshAudit(); }, [refreshAudit]);
  const [filters, setFilters] = useState({ search: "", category: "all", user: "all" });
  const categories = [...new Set(audit.map((a) => a.category))].sort();
  const users = [...new Set(audit.map((a) => a.user))].sort();
  const q = filters.search.trim().toLowerCase();
  const rows = audit
    .filter((a) => (!q || `${a.action} ${a.record} ${a.description}`.toLowerCase().includes(q)) &&
      (filters.category === "all" || a.category === filters.category) && (filters.user === "all" || a.user === filters.user))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const { visible, remaining, showMore } = usePaged(rows, JSON.stringify(filters), 25);
  const set = (f) => (e) => setFilters((x) => ({ ...x, [f]: e.target.value }));

  return (
    <>
      <PageTitle title="Audit Log" description="A read-only record of administrative actions." />
      <section className="tp-filters" aria-label="Filter audit records">
        <FormField id="au-search" label="Search actions and records" type="search" value={filters.search} onChange={set("search")} />
        <FormField id="au-cat" label="Category" as="select" value={filters.category} onChange={set("category")}
          options={[{ value: "all", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))]} />
        <FormField id="au-user" label="User" as="select" value={filters.user} onChange={set("user")}
          options={[{ value: "all", label: "All users" }, ...users.map((u) => ({ value: u, label: u }))]} />
      </section>
      <p className="tp-count" role="status">{rows.length} of {audit.length} records</p>
      {rows.length === 0 ? (
        <EmptyState title="No records found"><p>No audit record matches your search.</p></EmptyState>
      ) : (
        <>
          <div className="sp-table-wrap" role="region" aria-label="Audit records" tabIndex={0}>
            <table className="sp-table tp-stack-table">
              <caption className="visually-hidden">Audit records</caption>
              <thead><tr><th scope="col">Date and time</th><th scope="col">Action</th><th scope="col">User</th><th scope="col">Record</th><th scope="col">Description</th></tr></thead>
              <tbody>
                {visible.map((a) => (
                  <tr key={a.id}>
                    <td data-label="When">{formatDateTime(a.timestamp)}</td>
                    <th scope="row" data-label="Action">{a.action}</th>
                    <td data-label="User">{a.user}</td>
                    <td data-label="Record">{a.record}</td>
                    <td data-label="Description">{a.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {remaining > 0 && <p className="ad-more"><Button variant="outline" size="small" onClick={showMore}>Show more ({remaining} remaining)</Button></p>}
        </>
      )}
    </>
  );
}
