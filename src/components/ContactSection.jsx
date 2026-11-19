import Section from "./Section.jsx";
import SectionHeading from "./SectionHeading.jsx";
import ContactDetails from "./ContactDetails.jsx";
import ContactForm from "./ContactForm.jsx";

// Contact details beside the contact form. Used on the Home and Contact pages.
export default function ContactSection({ id = "contact", tone = "grey" }) {
  return (
    <Section id={id} tone={tone} labelledBy={`${id}-title`}>
      <SectionHeading
        id={`${id}-title`}
        title="Get in Touch"
        intro="Visit us, call, or send a message. We are happy to answer questions from parents, guardians and students."
      />
      <div className="contact-layout">
        <div className="contact-info">
          <ContactDetails />
        </div>
        <div className="contact-card">
          <h3>Send us a message</h3>
          <ContactForm />
        </div>
      </div>
    </Section>
  );
}
