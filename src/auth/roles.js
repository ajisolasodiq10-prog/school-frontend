// Roles used by the backend. "parent" has no dashboard in this app yet.
export const ROLES = { ADMIN: "admin", TEACHER: "teacher", STUDENT: "student", PARENT: "parent" };

export const ROLE_HOME = { admin: "/admin", teacher: "/teacher", student: "/student" };
export const ROLE_LOGIN = { admin: "/admin/login", teacher: "/teacher/login", student: "/student/login" };
export const ROLE_LABEL = { admin: "administrator", teacher: "teacher", student: "student", parent: "parent" };
