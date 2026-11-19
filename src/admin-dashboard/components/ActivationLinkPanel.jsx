import { useState } from "react";
import Button from "../../components/Button.jsx";
import { formatDate } from "../../config/content.js";
import StatusPill from "./StatusPill.jsx";

// Shown after an account is created (or a new link is issued). The link comes from the account
// service, is shown only now and is not stored anywhere in this browser. When the account was set
// up by email instead (teachers), there is no link and the panel says so.
export default function ActivationLinkPanel({ title, id, link, expiresAt, emailedTo, onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const field = document.getElementById("act-link");
      field?.select();
      document.execCommand?.("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="sp-card tp-panel" aria-labelledby="act-title" role="status">
      <h2 id="act-title">{title} <StatusPill label="Pending Activation" /></h2>
      {id && <p><strong>ID:</strong> {id}</p>}
      {link ? (
        <>
          <p>Give this one-time link to the account holder so they can choose a password. It is shown only once, so copy it before you close this panel.</p>
          <div className="ad-adder">
            <label className="visually-hidden" htmlFor="act-link">Activation link</label>
            <input id="act-link" className="ad-link-field" type="text" readOnly value={link} onFocus={(e) => e.target.select()} style={{ width: "100%" }} />
            <Button variant="primary" size="small" onClick={copy}>{copied ? "Copied" : "Copy Link"}</Button>
          </div>
          {expiresAt && <p><small>The link expires on {formatDate(String(expiresAt).slice(0, 10))}.</small></p>}
        </>
      ) : (
        <p>{emailedTo ? `An activation email has been sent to ${emailedTo}. ` : "An activation email has been sent. "}The account stays pending until they open it and set a password.</p>
      )}
      <p className="tp-actions-line"><Button variant="outline" size="small" onClick={onClose}>Done</Button></p>
    </section>
  );
}
