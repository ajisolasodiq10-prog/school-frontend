import { Navigate, Route, Routes } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop.jsx";
import LoginGate from "../auth/LoginGate.jsx";
import StudentLayout from "./components/StudentLayout.jsx";
import StudentLogin from "./pages/StudentLogin.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Overview from "./pages/Overview.jsx";
import MyResults from "./pages/MyResults.jsx";
import ResultDetail from "./pages/ResultDetail.jsx";
import AcademicHistory from "./pages/AcademicHistory.jsx";
import Timetable from "./pages/Timetable.jsx";
import LearningMaterials from "./pages/LearningMaterials.jsx";
import Assignments from "./pages/Assignments.jsx";
import Announcements from "./pages/Announcements.jsx";
import MyProfile from "./pages/MyProfile.jsx";
import "./styles/portal.css";

// All Student Portal routes. App.jsx loads this file on demand, so visitors
// to the public website never download the portal code.
// Paths here are relative to /student.
export default function StudentPortalRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="login" element={<LoginGate role="student"><StudentLogin /></LoginGate>} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route element={<StudentLayout />}>
          <Route index element={<Overview />} />
          <Route path="results" element={<MyResults />} />
          <Route path="results/:termId" element={<ResultDetail />} />
          <Route path="history" element={<AcademicHistory />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="materials" element={<LearningMaterials />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="profile" element={<MyProfile />} />
        </Route>
        <Route path="*" element={<Navigate to="/student" replace />} />
      </Routes>
    </>
  );
}
