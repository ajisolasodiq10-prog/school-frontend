import usePageTitle from "../hooks/usePageTitle.js";
import Button from "../components/Button.jsx";
import Section from "../components/Section.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import FeatureCard from "../components/FeatureCard.jsx";
import Card from "../components/Card.jsx";
import NewsCard from "../components/NewsCard.jsx";
import ContactSection from "../components/ContactSection.jsx";
import { school } from "../config/siteConfig.js";
import { whyChoose, programmes, schoolLife } from "../config/content.js";
import usePublicNews from "../hooks/usePublicNews.js";

export default function Home() {
  usePageTitle("");
  const { news } = usePublicNews();

  return (
    <>
      {/* 1. Hero */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero-content">
          <h1 id="hero-title">Excellence in learning. Strength in character.</h1>
          <p>
            At {school.name}, students are challenged to achieve academic excellence,
            grow in character and discipline, and develop the confidence to lead in
            school and beyond.
          </p>
          <div className="button-row">
            <Button to="/about" variant="light">
              Explore Our School
            </Button>
            <Button to="/admissions" variant="outline-light">
              Admissions Information
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Welcome and principal's message */}
      <Section id="welcome" labelledBy="welcome-title">
        <div className="welcome-layout">
          <div className="welcome-text">
            <SectionHeading id="welcome-title" title={`Welcome to ${school.shortName}`} />
            <p>
              We are a community of teachers, parents and students working together
              to give every child a strong education in a safe, caring and orderly
              environment.
            </p>
            <p>
              Our aim is simple: to help each student discover their strengths, work
              hard, and become a responsible young person who contributes to Nigeria
              and the world.
            </p>
            <Button to="/about" variant="outline">
              Learn more about us
            </Button>
          </div>

          <Card className="principal-card">
            <div className="principal-body">
              <h3>A message from the Principal</h3>
              <p>
                [Principal's message goes here. A short, warm paragraph welcoming
                parents and students and describing the school's values and goals.]
              </p>
              <p className="principal-name">
                <strong>[Principal's Name]</strong>
                <span>Principal, {school.name}</span>
              </p>
            </div>
          </Card>
        </div>
      </Section>

      {/* 3. Why choose our school */}
      <Section id="why-choose" tone="grey" labelledBy="why-title">
        <SectionHeading
          id="why-title"
          title="Why Choose Our School?"
          intro="Parents choose us for a simple reason: students here are well taught, well guided and well cared for."
          centered
        />
        <div className="grid grid-3">
          {whyChoose.map((item) => (
            <FeatureCard key={item.title} title={item.title}>
              {item.text}
            </FeatureCard>
          ))}
        </div>
      </Section>

      {/* 4. Academic programmes */}
      <Section id="programmes" labelledBy="programmes-title">
        <SectionHeading
          id="programmes-title"
          title="Academic Programmes"
          intro="Two stages of secondary education, each with clear goals and careful support."
        />
        <div className="grid grid-2">
          {programmes.map((programme) => (
            <Card as="article" key={programme.id} className="programme-card">
              <div className="programme-body">
                <p className="programme-levels">{programme.levels}</p>
                <h3>{programme.title}</h3>
                <p>{programme.text}</p>
                <Button to={`/academics#${programme.id}`} variant="primary">
                  Learn More
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* 5. School life */}
      <Section id="school-life" tone="grey" labelledBy="life-title">
        <SectionHeading
          id="life-title"
          title="School Life"
          intro="Learning happens in the classroom, the laboratory, on the field and in clubs."
        />
        <div className="life-grid">
          {schoolLife.map((item) => (
            <div className="life-item" key={item.key}>
              <h3>{item.title}</h3>
            </div>
          ))}
        </div>
      </Section>

      {/* 6. Latest news and events (hidden until there is news) */}
      {news.length > 0 && (
        <Section id="latest-news" labelledBy="news-title">
          <SectionHeading id="news-title" title="Latest News and Events" />
          <div className="grid grid-3">
            {news.slice(0, 3).map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
          <div className="section-action">
            <Button to="/news" variant="outline">
              View all news and events
            </Button>
          </div>
        </Section>
      )}

      {/* 7. Admissions call to action */}
      <Section id="admissions-cta" tone="navy" labelledBy="cta-title">
        <div className="cta-band">
          <div>
            <h2 id="cta-title">Admission is open for the new academic session</h2>
            <p>
              Parents and guardians are welcome to enquire about places, entry
              requirements and the admission process. Our team will be glad to help.
            </p>
          </div>
          <Button to="/contact#contact-form" variant="light">
            Enquire About Admission
          </Button>
        </div>
      </Section>

      {/* 8. Contact section */}
      <ContactSection id="contact" />
    </>
  );
}
