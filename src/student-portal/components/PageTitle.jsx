// Heading used at the top of every portal page.
export default function PageTitle({ title, description, children }) {
  return (
    <header className="sp-page-title">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="sp-page-actions sp-no-print">{children}</div>}
    </header>
  );
}
