// The public website <-> school backend: public announcements only (no sign-in).
import { get } from "./client.js";
import { mapReaderAnnouncement } from "./records.js";

const SCHOOL_CODE = String(import.meta.env?.VITE_SCHOOL_CODE ?? "").trim();

// Announcements the administrator published for "Everyone", newest first, in the shape NewsCard shows.
export async function loadPublicNews() {
  const query = { ...(SCHOOL_CODE && { schoolCode: SCHOOL_CODE }) };
  const items = [];
  for (let page = 1; page <= 5; page += 1) {
    const res = await get("/public/announcements", { auth: false, query: { ...query, page, limit: 50 } });
    const data = res && res.data !== undefined ? res.data : res;
    items.push(...(data.items || []));
    if (items.length >= (data.total ?? 0) || !data.items?.length) break;
  }
  return items.map(mapReaderAnnouncement).map((a) => ({ id: a.id, date: a.date, type: a.category, title: a.title, text: a.message }));
}
