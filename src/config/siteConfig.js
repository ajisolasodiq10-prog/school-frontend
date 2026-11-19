// ---------------------------------------------------------------------------
// SCHOOL DETAILS
// Everything in [square brackets] is placeholder text. Replace it with the
// school's real information. The whole website updates automatically.
// ---------------------------------------------------------------------------

export const school = {
  name: "[School Name] Secondary School",
  shortName: "[School Name]",
  motto: "[School motto]",
  address: "[Street address], [Town/City], [State], Nigeria",
  phone: "[+234 000 000 0000]",
  email: "[info@yourschool.edu.ng]",
  hours: "Monday to Friday, 7:30 am to 4:00 pm",
  social: [
    { name: "Facebook", url: "#" },
    { name: "Instagram", url: "#" },
    { name: "X (Twitter)", url: "#" },
  ],
};

// Main navigation (the Portal Login button is added separately).
export const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/academics", label: "Academics" },
  { to: "/admissions", label: "Admissions" },
  { to: "/news", label: "News & Events" },
  { to: "/contact", label: "Contact Us" },
];

// Portal links. Set `url` to the real portal address when each portal is built.
// A url starting with "/" opens a page inside this site.
// While `url` is empty, the button shows a "not available yet" message.
export const portals = [
  {
    id: "student",
    title: "Student Portal",
    description: "For students to view timetables, results and learning materials.",
    url: "/student/login",
  },
  {
    id: "teacher",
    title: "Teacher Portal",
    description: "For teachers to manage classes, attendance and assessments.",
    url: "/teacher/login",
  },
  {
    id: "admin",
    title: "Admin Portal",
    description: "For school administrators to manage records and settings.",
    url: "/admin/login",
  },
];

export const isPlaceholder = (text) => text.includes("[");
