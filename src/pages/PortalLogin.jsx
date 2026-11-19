import { useState } from "react";
import usePageTitle from "../hooks/usePageTitle.js";
import PageHeader from "../components/PageHeader.jsx";
import Section from "../components/Section.jsx";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import { portals } from "../config/siteConfig.js";

export default function PortalLogin() {
  usePageTitle("Portal Login");
  const [message, setMessage] = useState("");

  return (
    <>
      <PageHeader title="Portal Login" intro="Choose the portal that matches your role at the school." />
      <Section labelledBy="portal-title">
        <h2 id="portal-title" className="visually-hidden">
          Choose a portal
        </h2>
        <div className="grid grid-3">
          {portals.map((portal) => (
            <Card as="article" key={portal.id} className="portal-card">
              <h3>{portal.title}</h3>
              <p>{portal.description}</p>
              {portal.url ? (
                <Button
                  {...(portal.url.startsWith("/") ? { to: portal.url } : { href: portal.url })}
                  variant="primary"
                >
                  Open {portal.title}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setMessage(`The ${portal.title} is not available yet.`)}
                >
                  Open {portal.title}
                </Button>
              )}
            </Card>
          ))}
        </div>
        <p className="portal-message" role="status">
          {message}
        </p>
      </Section>
    </>
  );
}
