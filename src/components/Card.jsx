// Generic card. Other cards below build on the same CSS classes.
export default function Card({ as: Tag = "div", className = "", children, ...rest }) {
  return (
    <Tag className={`card ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
