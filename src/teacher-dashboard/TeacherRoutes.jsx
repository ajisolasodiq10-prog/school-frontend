import { Navigate, Route, Routes } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop.jsx";
import LoginGate from "../auth/LoginGate.jsx";
import TeacherLayout from "./components/TeacherLayout.jsx";
import TeacherLogin from "./pages/TeacherLogin.jsx";
import TeacherForgotPassword from "./pages/TeacherForgotPassword.jsx";
import Overview from "./pages/Overview.jsx";
import MyClasses from "./pages/MyClasses.jsx";
import ClassDetail from "./pages/ClassDetail.jsx";
import MyStudents from "./pages/MyStudents.jsx";
import EnterResults from "./pages/EnterResults.jsx";
import ResultsHistory from "./pages/ResultsHistory.jsx";
import ResultDetail from "./pages/ResultDetail.jsx";
import Assignments from "./pages/Assignments.jsx";
import LearningMaterials from "./pages/LearningMaterials.jsx";
import Announcements from "./pages/Announcements.jsx";
import MyProfile from "./pages/MyProfile.jsx";
// The Teacher Dashboard reuses the Student Portal's shell styles (sidebar,
// top bar, cards, tables) and adds its own on top.
import "../student-portal/styles/portal.css";
import "./styles/teacher.css";

// All Teacher Dashboard routes. App.jsx loads this file on demand, so visitors
// to the public website never download the dashboard code.
// Paths here are relative to /teacher.
export default function TeacherRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="login" element={<LoginGate role="teacher"><TeacherLogin /></LoginGate>} />
        <Route path="forgot-password" element={<TeacherForgotPassword />} />
        <Route element={<TeacherLayout />}>
          <Route index element={<Overview />} />
          <Route path="classes" element={<MyClasses />} />
          <Route path="classes/:classId" element={<ClassDetail />} />
          <Route path="students" element={<MyStudents />} />
          <Route path="results" element={<Navigate to="/teacher/results/enter" replace />} />
          <Route path="results/enter" element={<EnterResults />} />
          <Route path="results/history" element={<ResultsHistory />} />
          <Route path="results/history/:resultId" element={<ResultDetail />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="materials" element={<LearningMaterials />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="profile" element={<MyProfile />} />
        </Route>
        <Route path="*" element={<Navigate to="/teacher" replace />} />
      </Routes>
    </>
  );
}
