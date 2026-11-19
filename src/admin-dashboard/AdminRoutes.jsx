import { Navigate, Route, Routes } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop.jsx";
import LoginGate from "../auth/LoginGate.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminForgotPassword from "./pages/AdminForgotPassword.jsx";
import Overview from "./pages/Overview.jsx";
import Students from "./pages/Students.jsx";
import StudentDetail from "./pages/StudentDetail.jsx";
import Teachers from "./pages/Teachers.jsx";
import TeacherDetail from "./pages/TeacherDetail.jsx";
import Classes from "./pages/Classes.jsx";
import ClassDetail from "./pages/ClassDetail.jsx";
import Subjects from "./pages/Subjects.jsx";
import Sessions from "./pages/Sessions.jsx";
import ResultsManagement from "./pages/ResultsManagement.jsx";
import ResultReview from "./pages/ResultReview.jsx";
import Pins from "./pages/Pins.jsx";
import Announcements from "./pages/Announcements.jsx";
import Calendar from "./pages/Calendar.jsx";
import Timetable from "./pages/Timetable.jsx";
import Accounts from "./pages/Accounts.jsx";
import Audit from "./pages/Audit.jsx";
import Settings from "./pages/Settings.jsx";
import Profile from "./pages/Profile.jsx";
// The Admin Dashboard reuses the Student Portal's shell styles and the Teacher
// Dashboard's form/table styles, and adds its own (prefixed ad-) on top.
import "../student-portal/styles/portal.css";
import "../teacher-dashboard/styles/teacher.css";
import "./styles/admin.css";

// All Admin Dashboard routes. App.jsx loads this file on demand.
// Paths here are relative to /admin.
export default function AdminRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="login" element={<LoginGate role="admin"><AdminLogin /></LoginGate>} />
        <Route path="forgot-password" element={<AdminForgotPassword />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="students" element={<Students />} />
          <Route path="students/:studentId" element={<StudentDetail />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="teachers/:teacherId" element={<TeacherDetail />} />
          <Route path="classes" element={<Classes />} />
          <Route path="classes/:classId" element={<ClassDetail />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="results" element={<ResultsManagement />} />
          <Route path="results/:resultId" element={<ResultReview />} />
          <Route path="pins" element={<Pins />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="timetables" element={<Timetable />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="audit" element={<Audit />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </>
  );
}
