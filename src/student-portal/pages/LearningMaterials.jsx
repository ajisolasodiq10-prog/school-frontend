import { useMemo, useState } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import Button from "../../components/Button.jsx";
import { formatDate } from "../../config/content.js";
import PageTitle from "../components/PageTitle.jsx";
import LoadingState from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import useAsync from "../hooks/useAsync.js";
import { getMaterials } from "../services/studentService.js";

export default function LearningMaterials() {
  usePageTitle("Learning Materials");
  const { data: materials, loading } = useAsync(getMaterials, []);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All");

  const subjects = useMemo(
    () => (materials ? ["All", ...new Set(materials.map((item) => item.subject))] : ["All"]),
    [materials]
  );

  const visible = (materials || []).filter((item) => {
    const matchesSubject = subject === "All" || item.subject === subject;
    const matchesSearch = item.title.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <>
      <PageTitle
        title="Learning Materials"
        description="Notes and worksheets shared by your teachers."
      />
      {loading ? (
        <LoadingState label="Loading materials" />
      ) : (
        <>
          <div className="sp-filters">
            <div className="form-field">
              <label htmlFor="material-search">Search by title</label>
              <input
                id="material-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="material-subject">Subject</label>
              <select id="material-subject" value={subject} onChange={(event) => setSubject(event.target.value)}>
                {subjects.map((name) => (
                  <option key={name} value={name}>
                    {name === "All" ? "All subjects" : name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState title="No materials found">
              <p>Try a different search word or choose another subject.</p>
            </EmptyState>
          ) : (
            <ul className="sp-list">
              {visible.map((item) => (
                <li key={item.id} className="sp-card sp-material">
                  <div className="sp-material-info">
                    <h3>{item.title}</h3>
                    <p className="sp-muted">
                      {item.subject} &middot; {item.type} &middot; Added{" "}
                      <time dateTime={item.date}>{formatDate(item.date)}</time> &middot; {item.teacher}
                    </p>
                    {item.description && <p>{item.description}</p>}
                  </div>
                  {item.url ? (
                    <Button
                      href={item.url}
                      variant="outline"
                      size="small"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${item.title}`}
                    >
                      &nbsp;Open
                    </Button>
                  ) : (
                    <span className="sp-muted">No link added</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
