import { useState } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import { formatDate } from "../../config/content.js";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import { useTeacherData } from "../context/TeacherDataContext.jsx";

export default function Announcements() {
  usePageTitle("Announcements");
  const { announcements } = useTeacherData();
  const [category, setCategory] = useState("All");

  const categories = ["All", ...new Set(announcements.map((a) => a.category))];
  const visible = [...announcements]
    .filter((a) => category === "All" || a.category === category)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <PageTitle title="Announcements" description="Notices from the school administration." />
      <div className="sp-chips" role="group" aria-label="Filter announcements by category">
        {categories.map((name) => (
          <button key={name} type="button" className="sp-chip" aria-pressed={category === name} onClick={() => setCategory(name)}>
            {name}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No announcements">
          <p>There are no announcements in this category.</p>
        </EmptyState>
      ) : (
        <ul className="sp-list">
          {visible.map((item) => (
            <li key={item.id} className="sp-card sp-announcement">
              <p className="tp-ann-meta">
                <span className="sp-tag">{item.category}</span>
                <time dateTime={item.date}>{formatDate(item.date)}</time>
              </p>
              <h2>{item.title}</h2>
              <p>{item.message}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
