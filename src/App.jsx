import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Academics from "./pages/Academics.jsx";
import Admissions from "./pages/Admissions.jsx";
import News from "./pages/News.jsx";
import Contact from "./pages/Contact.jsx";
import PortalLogin from "./pages/PortalLogin.jsx";
import NotFound from "./pages/NotFound.jsx";

// The Student Portal is loaded only when someone visits /student.
const StudentPortalRoutes = lazy(() => import("./student-portal/StudentPortalRoutes.jsx"));
// The Teacher Dashboard is loaded only when someone visits /teacher.
const TeacherRoutes = lazy(() => import("./teacher-dashboard/TeacherRoutes.jsx"));
// The Admin Dashboard is loaded only when someone visits /admin.
const AdminRoutes = lazy(() => import("./admin-dashboard/AdminRoutes.jsx"));

// Every page is wrapped by <Layout>, which adds the navbar and footer.
export default function App() {
  return (
    <Routes>
      {/* Student Portal: has its own layout, separate from the public website */}
      <Route
        path="/student/*"
        element={
          <Suspense fallback={<p style={{ padding: "2rem" }}>Loading...</p>}>
            <StudentPortalRoutes />
          </Suspense>
        }
      />

      {/* Teacher Dashboard: also has its own layout */}
      <Route
        path="/teacher/*"
        element={
          <Suspense fallback={<p style={{ padding: "2rem" }}>Loading...</p>}>
            <TeacherRoutes />
          </Suspense>
        }
      />

      {/* Admin Dashboard: also has its own layout */}
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<p style={{ padding: "2rem" }}>Loading...</p>}>
            <AdminRoutes />
          </Suspense>
        }
      />

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/academics" element={<Academics />} />
        <Route path="/admissions" element={<Admissions />} />
        <Route path="/news" element={<News />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/portal-login" element={<PortalLogin />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
