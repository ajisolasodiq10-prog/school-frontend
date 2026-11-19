import { useRef, useState } from "react";
import Button from "./Button.jsx";

const emptyForm = { name: "", email: "", subject: "", message: "" };

function validate(values) {
  const errors = {};
  if (!values.name.trim()) {
    errors.name = "Please enter your name.";
  }
  if (!values.email.trim()) {
    errors.email = "Please enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address, such as name@example.com.";
  }
  if (!values.subject.trim()) {
    errors.subject = "Please enter a subject.";
  }
  if (values.message.trim().length < 10) {
    errors.message = "Please write a message of at least 10 characters.";
  }
  return errors;
}

// Basic contact form with validation only.
// It is NOT connected to a server yet, and it says so honestly.
// When a backend is ready, send `values` inside handleSubmit.
export default function ContactForm() {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [checked, setChecked] = useState(false);
  const formRef = useRef(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const next = { ...values, [name]: value };
    setValues(next);
    setChecked(false);
    // Once an error is showing, update it as the person types.
    if (errors[name]) {
      const nextErrors = validate(next);
      setErrors((current) => ({ ...current, [name]: nextErrors[name] }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const foundErrors = validate(values);
    setErrors(foundErrors);

    const firstInvalid = Object.keys(foundErrors)[0];
    if (firstInvalid) {
      setChecked(false);
      formRef.current.elements[firstInvalid].focus();
      return;
    }

    // TODO: connect a backend here. Until then, nothing is sent.
    setChecked(true);
  };

  const field = (name, label, props = {}, Tag = "input") => (
    <div className="form-field">
      <label htmlFor={`contact-${name}`}>{label}</label>
      <Tag
        id={`contact-${name}`}
        name={name}
        value={values[name]}
        onChange={handleChange}
        aria-invalid={errors[name] ? "true" : "false"}
        aria-describedby={errors[name] ? `contact-${name}-error` : undefined}
        {...props}
      />
      {errors[name] && (
        <p className="field-error" id={`contact-${name}-error`}>
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <form className="contact-form" ref={formRef} onSubmit={handleSubmit} noValidate>
      {field("name", "Your name", { type: "text", autoComplete: "name" })}
      {field("email", "Email address", { type: "email", autoComplete: "email", inputMode: "email" })}
      {field("subject", "Subject", { type: "text" })}
      {field("message", "Message", { rows: 5 }, "textarea")}

      <p className="form-note">
        This form is not connected to the school's inbox yet, so messages are not
        sent. Please use the phone number or email address shown on this page.
      </p>

      <Button type="submit" variant="primary">
        Submit message
      </Button>

      {checked && (
        <p className="form-status" role="status">
          Your details look correct, but no message has been sent because the form
          is not connected to a server yet. Please contact the school directly.
        </p>
      )}
    </form>
  );
}
