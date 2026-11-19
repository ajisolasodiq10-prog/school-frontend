import { Link } from "react-router-dom";

// Title banner used at the top of every inner page.
export default function PageHeader({ title, intro }) {
  return (
    <div className="page-header">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{title}</span>
        </nav>
        <h1>{title}</h1>
        {intro && <p className="page-intro">{intro}</p>}
      </div>
    </div>
  );
}
