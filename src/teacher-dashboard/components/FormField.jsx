// Label + input/select/textarea + hint + error message, wired for accessibility.
//   <FormField id="title" label="Title" value={...} onChange={...} error="..." />
//   <FormField as="select" options={[{ value, label }]} ... />
//   <FormField as="textarea" rows={4} ... />
export default function FormField({ id, label, as = "input", error, hint, options = [], ...props }) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    name: id,
    "aria-invalid": error ? "true" : "false",
    "aria-describedby": describedBy,
    ...props,
  };

  let control;
  if (as === "select") {
    control = (
      <select {...common}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else if (as === "textarea") {
    control = <textarea {...common} />;
  } else {
    control = <input {...common} />;
  }

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {control}
      {hint && (
        <p className="form-note" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
