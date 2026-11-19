import usePageTitle from "../hooks/usePageTitle.js";
import PageHeader from "../components/PageHeader.jsx";
import Section from "../components/Section.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import FeatureCard from "../components/FeatureCard.jsx";
import Button from "../components/Button.jsx";
import { school } from "../config/siteConfig.js";

const values = [
  { title: "Excellence", text: "We expect students to give their best effort in their studies and in everything they do." },
  { title: "Integrity", text: "We value honesty, fairness and doing the right thing even when no one is watching." },
  { title: "Respect", text: "We respect teachers, classmates, parents and the wider community." },
  { title: "Responsibility", text: "We help students take ownership of their learning, behaviour and future." },
];

const facilities = [
  "Well-ventilated classrooms",
  "Science laboratories (Physics, Chemistry, Biology)",
  "ICT and computer room",
  "School library",
  "Sports field and courts",
  "Assembly hall",
];

export default function About() {
  usePageTitle("About Us");

  return (
    <>
      <PageHeader
        title="About Us"
        intro={`Learn about ${school.name}, our purpose and the values that guide our school.`}
      />

      <Section labelledBy="story-title">
        <div className="split">
          <div>
            <SectionHeading id="story-title" title="Our story" />
            <p>
              [Founded in year], {school.name} began with a simple goal: to give
              young Nigerians an education that develops both mind and character.
              Today we serve [number] students from [area/state].
            </p>
            <p>
              [Add two or three short paragraphs about the school's history, its
              founders and proprietors, and its achievements.]
            </p>
          </div>
        </div>
      </Section>

      <Section tone="grey" labelledBy="mission-title">
        <SectionHeading id="mission-title" title="Mission and vision" />
        <div className="grid grid-2">
          <div className="statement">
            <h3>Our mission</h3>
            <p>
              [To provide quality, affordable secondary education that builds
              knowledge, discipline and character in every student.]
            </p>
          </div>
          <div className="statement">
            <h3>Our vision</h3>
            <p>
              [To be a leading secondary school whose graduates are confident,
              capable and ready to serve their communities.]
            </p>
          </div>
        </div>
      </Section>

      <Section labelledBy="values-title">
        <SectionHeading id="values-title" title="Our core values" centered />
        <div className="grid grid-4">
          {values.map((value) => (
            <FeatureCard key={value.title} title={value.title}>
              {value.text}
            </FeatureCard>
          ))}
        </div>
      </Section>

      <Section tone="grey" labelledBy="facilities-title">
        <div className="split">
          <div>
            <SectionHeading
              id="facilities-title"
              title="Our facilities"
              intro="What the school offers."
            />
            <ul className="check-list">
              {facilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="statement">
            <h3>Visit the school</h3>
            <p>
              The best way to get to know us is to see the school for yourself.
              Contact us to arrange a visit.
            </p>
            <Button to="/contact" variant="primary">
              Contact Us
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
