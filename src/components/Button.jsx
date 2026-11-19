import { Link } from "react-router-dom";

// One button component for every call to action.
//   <Button to="/about">          -> internal page link
//   <Button href="https://...">   -> external link
//   <Button onClick={...}>        -> real button
// Variants: primary, secondary, outline, light, outline-light
export default function Button({
  to,
  href,
  variant = "primary",
  size,
  className = "",
  children,
  ...rest
}) {
  const classes = ["btn", `btn-${variant}`, size === "small" ? "btn-small" : "", className]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
