// ---------------------------------------------------------------------------
// PAGE CONTENT
// General wording for the public pages. Edit it to match the school.
// ---------------------------------------------------------------------------

export const whyChoose = [
  {
    title: "Quality Education",
    text: "A balanced curriculum that follows the national syllabus and prepares students for BECE, WAEC and NECO examinations.",
  },
  {
    title: "Experienced Teachers",
    text: "Qualified and dedicated teachers who know their students well and keep parents informed about progress.",
  },
  {
    title: "Discipline and Character",
    text: "Clear expectations, respect for others and integrity are part of everyday school life.",
  },
  {
    title: "Modern Learning Environment",
    text: "Bright classrooms, equipped laboratories, a library and ICT facilities that support hands-on learning.",
  },
  {
    title: "Extracurricular Activities",
    text: "Sports, clubs, debating, music and community service help students discover and grow their talents.",
  },
  {
    title: "Student Development",
    text: "Mentoring, career guidance and leadership opportunities prepare students for university and life beyond school.",
  },
];

export const programmes = [
  {
    id: "jss",
    title: "Junior Secondary School",
    levels: "JSS 1 to JSS 3",
    alt: "Junior secondary students working together in a classroom",
    text: "Students build strong foundations in English, Mathematics, Basic Science and Technology, and the humanities, and sit the Basic Education Certificate Examination (BECE) at the end of JSS 3.",
  },
  {
    id: "sss",
    title: "Senior Secondary School",
    levels: "SS 1 to SS 3",
    alt: "Senior secondary students studying in a school library",
    text: "Students choose a Science, Arts or Commercial pathway and prepare for the WAEC and NECO Senior School Certificate Examinations and for admission to higher institutions.",
  },
];

export const schoolLife = [
  { key: "classroom", title: "Classrooms", alt: "A bright, well-arranged classroom with students at their desks" },
  { key: "laboratory", title: "Science laboratories", alt: "Students carrying out an experiment in a science laboratory" },
  { key: "sports", title: "Sports", alt: "Students playing football on the school field" },
  { key: "activities", title: "Clubs and activities", alt: "Students taking part in a school club activity" },
  { key: "facilities", title: "School facilities", alt: "The school library and ICT facilities" },
];

// News and events are no longer listed here: they are the announcements the administrator
// publishes for "Everyone" (see hooks/usePublicNews.js).

export const formatDate = (isoDate) =>
  new Date(isoDate + "T12:00:00").toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
