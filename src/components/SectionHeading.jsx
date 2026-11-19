export default function SectionHeading({ id, title, intro, centered = false }) {
  return (
    <div className={`section-heading ${centered ? "is-centered" : ""}`.trim()}>
      <h2 id={id}>{title}</h2>
      {intro && <p>{intro}</p>}
    </div>
  );
}
