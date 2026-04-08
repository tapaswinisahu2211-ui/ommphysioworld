import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AboutPage from "./pages/AboutPage";
import BookAppointmentPage from "./pages/BookAppointmentPage";
import CareerPage from "./pages/CareerPage";
import CareerRequirementsPage from "./pages/CareerRequirementsPage";
import ContactPage from "./pages/ContactPage";
import HomePage from "./pages/HomePage";
import JobRequirementsManagement from "./pages/JobRequirementsManagement";
import Login from "./pages/Login";
import PatientAuthPage from "./pages/PatientAuthPage";
import PatientDashboardPage from "./pages/PatientDashboardPage";
import PatientProfilePage from "./pages/PatientProfilePage";
import Dashboard from "./pages/Dashboard";
import FeedbackManagement from "./pages/FeedbackManagement";
import FaqPage from "./pages/FaqPage";
import Patients from "./pages/Patients";
import PublicServicesPage from "./pages/PublicServicesPage";
import Services from "./pages/Services";
import Staff from "./pages/Staff";
import StaffProfile from "./pages/StaffProfile";
import PatientProfile from "./pages/PatientProfile";
import AdminProfile from "./pages/AdminProfile";
import ProtectedRoute from "./utils/ProtectedRoute";
import Mailbox from "./pages/Mailbox";
import ReportsPage from "./pages/ReportsPage";
import TreatmentTracker from "./pages/TreatmentTracker";

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTopOnRouteChange />
      <Routes>

        {/* PUBLIC WEBSITE */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/care" element={<PublicServicesPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/career" element={<CareerPage />} />
        <Route path="/career/requirements" element={<CareerRequirementsPage />} />
        <Route path="/carrer" element={<CareerPage />} />
        <Route path="/carrer/requirements" element={<CareerRequirementsPage />} />
        <Route path="/book-appointment" element={<BookAppointmentPage />} />
        <Route path="/patient-login" element={<PatientAuthPage mode="login" />} />
        <Route path="/patient-register" element={<PatientAuthPage mode="register" />} />
        <Route path="/patient-dashboard" element={<PatientDashboardPage />} />
        <Route path="/patient-profile" element={<PatientProfilePage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* LOGIN */}
        <Route path="/admin" element={<Login />} />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute moduleKey="dashboard">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* OTHER PAGES */}
        <Route
          path="/patients"
          element={
            <ProtectedRoute moduleKey="patients">
              <Patients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute moduleKey="services">
              <Services />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute adminOnly>
              <FeedbackManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/job-requirements"
          element={
            <ProtectedRoute adminOnly>
              <JobRequirementsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute moduleKey="staff">
              <Staff />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/:id"
          element={
            <ProtectedRoute moduleKey="staff">
              <StaffProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-profile"
          element={
            <ProtectedRoute>
              <StaffProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mailbox"
          element={
            <ProtectedRoute moduleKey="mailbox">
              <Mailbox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/treatment-tracker"
          element={
            <ProtectedRoute moduleKey="treatment_tracker">
              <TreatmentTracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute adminOnly>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute moduleKey="patients">
              <PatientProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/:id"
          element={
            <ProtectedRoute moduleKey="patients">
              <PatientProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute adminOnly>
              <AdminProfile />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
