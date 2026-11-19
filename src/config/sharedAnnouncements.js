// ---------------------------------------------------------------------------
// ANNOUNCEMENTS PUBLISHED BY THE ADMINISTRATOR
//
// The Admin Dashboard keeps announcements in local storage. This helper lets
// the Teacher Dashboard and Student Portal show the ones that are published
// and meant for them. A real system would fetch this from the backend.
// ---------------------------------------------------------------------------
export const ADMIN_ANNOUNCEMENTS_KEY = "adminData.v1.announcements";

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// audience: "teachers" or "students"
export function getPublishedAnnouncementsFor(audience) {
  try {
    const list = JSON.parse(localStorage.getItem(ADMIN_ANNOUNCEMENTS_KEY) || "[]");
    const today = todayISO();
    return list
      .filter((a) => a.status === "Published" && a.publishDate <= today)
      .filter((a) => a.audience.type === "everyone" || a.audience.type === `all-${audience}`)
      .map((a) => ({ id: `admin-${a.id}`, date: a.publishDate, title: a.title, message: a.message }));
  } catch {
    return [];
  }
}
