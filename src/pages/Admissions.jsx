import usePageTitle from "../hooks/usePageTitle.js";
import PageHeader from "../components/PageHeader.jsx";
import Section from "../components/Section.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import Button from "../components/Button.jsx";

const steps = [
  { title: "Make an enquiry", text: "Contact the school by phone, email or the contact page, or visit during opening hours." },
  { title: "Collect the admission form", text: "Collect and complete the admission form at the school office." },
  { title: "Take the entrance assessment", text: "Applicants sit a short assessment in English and Mathematics." },
  { title: "Interview with parents or guardians", text: "A member of staff meets the applicant and family to discuss the school's expectations." },
  { title: "Receive the admission decision", text: "Successful applicants receive an admission letter with the next steps." },
  { title: "Complete registration", text: "Submit the required documents and complete registration at the school office." },
];

const documents = [
  "Completed admission form",
  "Copy of birth certificate or declaration of age",
  "Recent report sheets from the previous school",
  "Primary School Leaving Certificate or BECE result (where applicable)",
  "Recent passport photographs",
];

const faqs = [
  { q: "Which classes are open for admission?", a: "[State the classes with available places, usually JSS 1, with limited places in other classes.]" },
  { q: "What are the school fees?", a: "[Fees are available on request from the school office. Please contact us for the current schedule.]" },
  { q: "Is there a school bus or boarding option?", a: "[Add details here, or remove this question if it does not apply.]" },
  { q: "When does the new session begin?", a: "[Add the resumption date for the new academic session.]" },
];

export default function Admissions() {
  usePageTitle("Admissions");

  return (
    <>
      <PageHeader
        title="Admissions"
        intro="We welcome applications from students who are ready to learn and grow. Here is how admission works."
      />

      <Section labelledBy="steps-title">
        <SectionHeading id="steps-title" title="How to apply" />
        <ol className="steps">
          {steps.map((step) => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
        <p className="note">
          Admission forms and documents are handled in person at the school office.
          Please do not send personal documents through this website.
        </p>
      </Section>

      <Section tone="grey" labelledBy="docs-title">
        <div className="split">
          <div>
            <SectionHeading id="docs-title" title="Documents to bring" />
            <ul className="check-list">
              {documents.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="statement">
            <h3>Entry requirements</h3>
            <p>
              <strong>JSS 1:</strong> [Primary school completion and a successful entrance assessment.]
            </p>
            <p>
              <strong>SS 1:</strong> [BECE result or equivalent, and a successful entrance assessment.]
            </p>
          </div>
        </div>
      </Section>

      <Section labelledBy="faq-title">
        <SectionHeading id="faq-title" title="Frequently asked questions" />
        <div className="faq">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section tone="navy" labelledBy="enquire-title">
        <div className="cta-band">
          <div>
            <h2 id="enquire-title">Have a question about admission?</h2>
            <p>Send us a message or call the school office. We will be glad to help.</p>
          </div>
          <Button to="/contact#contact-form" variant="light">
            Enquire About Admission
          </Button>
        </div>
      </Section>
    </>
  );
}
