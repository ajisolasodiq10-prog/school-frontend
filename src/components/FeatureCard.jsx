import Card from "./Card.jsx";

// Title + short text. Used in "Why Choose Our School?".
export default function FeatureCard({ title, children }) {
  return (
    <Card className="feature-card">
      <h3>{title}</h3>
      <p>{children}</p>
    </Card>
  );
}
