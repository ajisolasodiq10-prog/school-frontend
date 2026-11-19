import usePageTitle from "../hooks/usePageTitle.js";
import PageHeader from "../components/PageHeader.jsx";
import Section from "../components/Section.jsx";
import NewsCard from "../components/NewsCard.jsx";
import EmptyState from "../student-portal/components/EmptyState.jsx";
import usePublicNews from "../hooks/usePublicNews.js";

export default function News() {
  usePageTitle("News & Events");
  const { news } = usePublicNews();

  // Newest first.
  const sorted = [...news].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <PageHeader
        title="News & Events"
        intro="Announcements, achievements and upcoming events at our school."
      />
      <Section labelledBy="all-news-title">
        <h2 id="all-news-title" className="visually-hidden">
          All news and events
        </h2>
        {sorted.length === 0 ? (
          <EmptyState title="No news or events yet">
            <p>Check back soon for announcements and upcoming events.</p>
          </EmptyState>
        ) : (
          <div className="grid grid-3">
            {sorted.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
