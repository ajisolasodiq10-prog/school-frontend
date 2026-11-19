import usePageTitle from "../hooks/usePageTitle.js";
import PageHeader from "../components/PageHeader.jsx";
import ContactSection from "../components/ContactSection.jsx";

export default function Contact() {
  usePageTitle("Contact Us");

  return (
    <>
      <PageHeader
        title="Contact Us"
        intro="We would love to hear from you. Reach out with questions about admission, academics or visiting the school."
      />
      <ContactSection id="contact-form" tone="white" />
    </>
  );
}
