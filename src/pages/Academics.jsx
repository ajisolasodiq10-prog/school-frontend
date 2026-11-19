import usePageTitle from "../hooks/usePageTitle.js";
import PageHeader from "../components/PageHeader.jsx";
import Section from "../components/Section.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import Button from "../components/Button.jsx";

const jssSubjects = [
  "English Language",
  "Mathematics",
  "Basic Science",
  "Basic Technology",
  "Social Studies",
  "Civic Education",
  "Digital Technology / ICT",
  "Business Studies",
  "Cultural and Creative Arts",
  "Nigerian Language (Yoruba, Igbo or Hausa)",
  "Christian or Islamic Religious Studies",
  "Physical and Health Education",
];

const sssCore = ["English Language", "General Mathematics", "Civic Education", "Digital Technology / ICT", "Trade subject or Entrepreneurship"];

const sssDepartments = [
  { name: "Science", text: "Physics, Chemistry, Biology, Further Mathematics, Agricultural Science and Technical Drawing." },
  { name: "Arts", text: "Literature in English, Government, History, Christian or Islamic Studies, and Nigerian Languages." },
  { name: "Commercial", text: "Accounting, Commerce, Economics, Business Studies and Marketing." },
];

export default function Academics() {
  usePageTitle("Academics");

  return (
    <>
      <PageHeader
        title="Academics"
        intro="A clear path from Junior Secondary School to the senior school certificate examinations."
      />

      <Section id="jss" labelledBy="jss-title">
        <SectionHeading
          id="jss-title"
          title="Junior Secondary School (JSS 1 to JSS 3)"
          intro="Three years to build strong foundations in literacy, numeracy, science and good study habits. Students sit the Basic Education Certificate Examination (BECE) at the end of JSS 3."
        />
        <h3>Subjects</h3>
        <ul className="pill-list">
          {jssSubjects.map((subject) => (
            <li key={subject}>{subject}</li>
          ))}
        </ul>
      </Section>

      <Section id="sss" tone="grey" labelledBy="sss-title">
        <SectionHeading
          id="sss-title"
          title="Senior Secondary School (SS 1 to SS 3)"
          intro="Students choose a department that matches their strengths and career goals, and prepare for the WAEC and NECO Senior School Certificate Examinations."
        />
        <h3>Core subjects for all students</h3>
        <ul className="pill-list">
          {sssCore.map((subject) => (
            <li key={subject}>{subject}</li>
          ))}
        </ul>
        <h3 className="spaced-heading">Departments</h3>
        <div className="grid grid-3">
          {sssDepartments.map((department) => (
            <div className="statement" key={department.name}>
              <h3>{department.name}</h3>
              <p>{department.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section labelledBy="assessment-title">
        <SectionHeading
          id="assessment-title"
          title="How we assess progress"
          intro="How we support learning and progress."
        />
        <ul className="check-list">
          <li>Three terms each academic session, with continuous assessment tests and assignments.</li>
          <li>End-of-term examinations, with report sheets shared with parents and guardians.</li>
          <li>Mock examinations in SS 3 to prepare students for WAEC and NECO.</li>
          <li>Extra lessons and guidance for students who need additional support.</li>
        </ul>
        <div className="section-action align-left">
          <Button to="/admissions" variant="primary">
            See how to apply
          </Button>
        </div>
      </Section>
    </>
  );
}
