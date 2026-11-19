import Card from "./Card.jsx";
import Button from "./Button.jsx";
import { formatDate } from "../config/content.js";

export default function NewsCard({ item }) {
  return (
    <Card as="article" className="news-card" id={item.id}>
      <div className="news-card-body">
        <p className="news-meta">
          <span className="news-type">{item.type}</span>
          <time dateTime={item.date}>{formatDate(item.date)}</time>
        </p>
        <h3>{item.title}</h3>
        <p>{item.text}</p>
        <Button to={`/news#${item.id}`} variant="outline" size="small" aria-label={`Read more about ${item.title}`}>
          Read More
        </Button>
      </div>
    </Card>
  );
}
