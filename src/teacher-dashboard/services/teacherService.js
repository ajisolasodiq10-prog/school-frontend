// ===========================================================================
// DATA ACCESS LAYER (school data)
//
// Pages get these lists through TeacherDataContext, which calls the functions
// below. There is no sample data. Announcements, upcoming activities, assignments and learning
// materials are read through ../api/teacherApi.js.
// To connect one, replace its body with a request through the shared client:
//   import { get } from "../../api/client.js";
//   export const getClasses = () => get("/api/...").then((res) => res.data);
// ===========================================================================

export const getClasses = () => Promise.resolve([]);
export const getStudents = () => Promise.resolve([]);
