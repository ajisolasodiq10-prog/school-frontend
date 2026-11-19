import usePageTitle from "../../hooks/usePageTitle.js";
import { formatDate } from "../../config/content.js";
import PageTitle from "../components/PageTitle.jsx";
import LoadingState from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import useAsync from "../hooks/useAsync.js";
import { getAnnouncements } from "../services/studentService.js";

export default function Announcements() {
  usePageTitle("Announcements");
  const { data: announcements, loading } = useAsync(getAnnouncements, []);

  return (
    <>
      <PageTitle title="Announcements" description="Notices from the school." />
      {loading ? (
        <LoadingState label="Loading announcements" />
      ) : !announcements || announcements.length === 0 ? (
        <EmptyState title="No announcements yet">
          <p>New school announcements will appear here.</p>
        </EmptyState>
      ) : (
        <ul className="sp-list">
          {announcements.map((item) => (
            <li key={item.id} className="sp-card sp-announcement">
              <p className="sp-muted">
                <span className="sp-tag">{item.category}</span>
                <time dateTime={item.date}>{formatDate(item.date)}</time>
              </p>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
