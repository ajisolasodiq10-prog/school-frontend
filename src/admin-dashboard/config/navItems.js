// Admin dashboard sidebar links. "Logout" is added separately in the sidebar.
export const adminNavItems = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/students", label: "Students" },
  { to: "/admin/teachers", label: "Teachers" },
  { to: "/admin/classes", label: "Classes" },
  { to: "/admin/subjects", label: "Subjects" },
  { to: "/admin/sessions", label: "Academic Sessions & Terms" },
  { to: "/admin/results", label: "Results Management" },
  { to: "/admin/pins", label: "Result PIN Management" },
  { to: "/admin/announcements", label: "Announcements" },
  { to: "/admin/calendar", label: "School Calendar" },
  { to: "/admin/timetables", label: "Class Timetables" },
  { to: "/admin/accounts", label: "Account Management" },
  { to: "/admin/audit", label: "Audit Log" },
  { to: "/admin/settings", label: "School Settings" },
  { to: "/admin/profile", label: "My Profile" },
];
