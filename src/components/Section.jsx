// A full-width page section with a centred content container.
// tone: "white" | "grey" | "navy"
export default function Section({ id, tone = "white", labelledBy, className = "", children }) {
  return (
    <section
      id={id}
      className={`section section-${tone} ${className}`.trim()}
      aria-labelledby={labelledBy}
    >
      <div className="container">{children}</div>
    </section>
  );
}
