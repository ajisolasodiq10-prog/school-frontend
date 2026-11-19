// ===========================================================================
// DATA ACCESS LAYER
//
// Every page gets its data through the functions below. Announcements, assignments, learning
// materials and the timetable are read from the school database through ../api/studentApi.js.
// Nothing is kept in the browser.
// ===========================================================================

import * as api from "../api/studentApi.js";

// School announcements for this student (everyone, all students, or the student's class).
export const getAnnouncements = async () =>
  (await api.loadAnnouncements()).map((a) => ({ id: a.id, date: a.date, category: a.category, title: a.title, text: a.message }));
export const getTimetable = (classId) => api.loadTimetable(classId);
export const getMaterials = () => api.loadMaterials();
export const getAssignments = () => api.loadAssignments();
