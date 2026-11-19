import { useState } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import FormField from "../../teacher-dashboard/components/FormField.jsx";
import Flash from "../../teacher-dashboard/components/Flash.jsx";
import ConfirmDialog from "../../teacher-dashboard/components/ConfirmDialog.jsx";
import useFlash from "../../teacher-dashboard/hooks/useFlash.js";
import StatusPill from "../components/StatusPill.jsx";
import usePaged from "../hooks/usePaged.js";
import { useAdminData } from "../context/AdminDataContext.jsx";

export default function Accounts() {
  usePageTitle("Account Management");
  const { accountRows, setAccountStatus, profile } = useAdminData();
  const [filters, setFilters] = useState({ search: "", role: "all", status: "all" });
  const [toggle, setToggle] = useState(null);
  const [flash, setFlash] = useFlash();

  const q = filters.search.trim().toLowerCase();
  const rows = accountRows.filter((a) => (!q || a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || (a.email || "").toLowerCase().includes(q)) &&
    (filters.role === "all" || a.role === filters.role) && (filters.status === "all" || a.status === filters.status));
  const { visible, remaining, showMore } = usePaged(rows, JSON.stringify(filters), 25);
  const set = (f) => (e) => setFilters((x) => ({ ...x, [f]: e.target.value }));

  const confirm = async () => {
    const activate = toggle.status !== "Active";
    const res = await setAccountStatus(toggle, activate);
    setFlash(res.ok ? { tone: "success", message: `${toggle.name} ${activate ? "activated" : "deactivated"}.` } : { tone: "error", message: res.error });
    setToggle(null);
  };

  return (
    <>
      <PageTitle title="Account Management" description="View accounts and their roles, and activate or deactivate access." />
      <section className="sp-notice ad-demo-note" aria-label="About administrator accounts">
        <span>
          <strong>No public administrator registration.</strong> The first administrator is created by the platform operator with the setup script on the server.
          Teacher and student accounts are created from the Teachers and Students pages, and each person sets their own password from an activation link.
        </span>
      </section>
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      <section className="tp-filters" aria-label="Filter accounts">
        <FormField id="ac-search" label="Search name, ID or email" type="search" value={filters.search} onChange={set("search")} />
        <FormField id="ac-role" label="Role" as="select" value={filters.role} onChange={set("role")}
          options={[{ value: "all", label: "All roles" }, { value: "Administrator", label: "Administrator" }, { value: "Teacher", label: "Teacher" }, { value: "Student", label: "Student" }, { value: "Parent", label: "Parent" }]} />
        <FormField id="ac-status" label="Status" as="select" value={filters.status} onChange={set("status")}
          options={[{ value: "all", label: "All statuses" }, { value: "Active", label: "Active" }, { value: "Deactivated", label: "Deactivated" }, { value: "Graduated", label: "Graduated" }]} />
      </section>
      <p className="tp-count" role="status">{rows.length} of {accountRows.length} accounts</p>

      {rows.length === 0 ? (
        <EmptyState title="No accounts found"><p>No account matches your search.</p></EmptyState>
      ) : (
        <>
          <div className="sp-table-wrap" role="region" aria-label="Accounts" tabIndex={0}>
            <table className="sp-table tp-stack-table">
              <caption className="visually-hidden">Accounts</caption>
              <thead><tr><th scope="col">ID</th><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                {visible.map((a) => (
                  <tr key={`${a.kind}-${a.id}`}>
                    <td data-label="ID">{a.id}</td>
                    <th scope="row" data-label="Name">{a.name}</th>
                    <td data-label="Role"><StatusPill label={a.role} /></td>
                    <td data-label="Status"><StatusPill label={a.status} /></td>
                    <td className="sp-action-cell">
                      {a.status === "Graduated" ? <small>Read-only</small> : a.id === profile.id ? <small>Your account</small> : (
                        <Button variant={a.status === "Active" ? "outline-danger" : "outline"} size="small" onClick={() => setToggle(a)}
                          aria-label={`${a.status === "Active" ? "Deactivate" : "Activate"} ${a.name}`}>
                          {a.status === "Active" ? "Deactivate" : "Activate"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {remaining > 0 && <p className="ad-more"><Button variant="outline" size="small" onClick={showMore}>Show more ({remaining} remaining)</Button></p>}
        </>
      )}

      <ConfirmDialog open={Boolean(toggle)} title={toggle?.status === "Active" ? "Deactivate this account?" : "Activate this account?"}
        danger={toggle?.status === "Active"} confirmLabel={toggle?.status === "Active" ? "Yes, deactivate" : "Yes, activate"} onConfirm={confirm} onCancel={() => setToggle(null)}>
        {toggle && <p>{toggle.name} ({toggle.role}) {toggle.status === "Active" ? "will lose access. Records and history are kept." : "will regain access."}</p>}
      </ConfirmDialog>
    </>
  );
}
