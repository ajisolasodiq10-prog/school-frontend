// Teacher Dashboard <-> school backend. Classes, students, sessions and result sheets are read
// from and saved to the database. Nothing is kept in the browser.
import { del, get, patch, post, put } from "../../api/client.js";
import { fetchSchoolSettings } from "../../config/schoolSettings.js";
import { getAll, unwrap, mapSession, mapReaderAnnouncement, mapAssignment, mapMaterial, mapEvent } from "../../api/records.js";

export const loadTeacherData = async () => {
  const [sessions, classes, subjects, students] = await Promise.all([
    getAll("/academic-sessions"),
    getAll("/classes"),
    getAll("/subjects"),
    getAll("/students"),
  ]);
  return { sessions, classes, subjects, students };
};

export const loadSheets = () => getAll("/result-sheets");
export const putSheet = async (body) => unwrap(await put("/result-sheets", body)).sheet;
export const submitSheet = async (id) => unwrap(await post(`/result-sheets/${id}/submit`, {})).sheet;
export { mapSession };

// ---- announcements and calendar (read only for teachers) ----
export const loadAnnouncements = async () => (await getAll("/announcements")).map(mapReaderAnnouncement);
// Upcoming calendar events, for "Upcoming academic activities".
export const loadActivities = async () => {
  const today = new Date().toISOString().slice(0, 10);
  return (await getAll("/calendar-events", { from: today })).map(mapEvent).map((e) => ({
    id: e.id,
    date: e.startDate,
    title: e.title,
    detail: [e.type, e.description].filter(Boolean).join(" - "),
  }));
};

// ---- assignments ----
export const loadAssignments = async () => (await getAll("/assignments")).map(mapAssignment);
export const createAssignment = async (body) => unwrap(await post("/assignments", body)).assignment;
export const updateAssignment = async (id, body) => unwrap(await patch(`/assignments/${id}`, body)).assignment;
export const deleteAssignment = async (id) => unwrap(await del(`/assignments/${id}`));

// ---- learning materials ----
export const loadMaterials = async () => (await getAll("/materials")).map(mapMaterial);
export const createMaterial = async (body) => unwrap(await post("/materials", body)).material;
export const updateMaterial = async (id, body) => unwrap(await patch(`/materials/${id}`, body)).material;
export const deleteMaterial = async (id) => unwrap(await del(`/materials/${id}`));

// ---- school settings (score maximums, grade boundaries) and my profile ----
export const loadSettings = () => fetchSchoolSettings();
export const loadMyProfile = async () => unwrap(await get("/profile/me")).profile;
export const saveMyProfile = async (body) => unwrap(await patch("/profile/me", body)).profile;
