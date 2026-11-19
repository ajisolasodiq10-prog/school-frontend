import usePageTitle from "../hooks/usePageTitle.js";
import PageHeader from "../components/PageHeader.jsx";
import Section from "../components/Section.jsx";
import Button from "../components/Button.jsx";

export default function NotFound() {
  usePageTitle("Page not found");

  return (
    <>
      <PageHeader title="Page not found" />
      <Section>
        <p>The page you are looking for does not exist or has moved.</p>
        <Button to="/" variant="primary">
          Go to the home page
        </Button>
      </Section>
    </>
  );
}
