import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import PublicRoute from "./components/auth/PublicRoute";
import LandingPage from "./pages/LandingPage";
import LandingDashboard from "./pages/LandingDashboard";
import DashboardLayout from "./components/layout/DashboardLayout";
import CoachingConsole from "./pages/CoachingConsole";
import ManualMode from "./pages/ManualMode";
import ReplayMode from "./pages/ReplayMode";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const PAGES = {
  simulator: CoachingConsole,
  manual: ManualMode,
  replay: ReplayMode,
  analytics: Analytics,
  reports: Reports,
  settings: Settings,
};

function Dashboard() {
  const [view, setView] = useState("select-mode");

  const PageComponent = PAGES[view];

  return (
    <DashboardLayout activeView={view} onNavigate={setView}>
      {view === "select-mode" ? (
        <LandingDashboard onSelectMode={setView} />
      ) : (
        <PageComponent />
      )}
    </DashboardLayout>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      {/* CHANGED: removed the unwrapped duplicate /login, /signup, /forgot-password
          and /reset-password routes that sat above these and matched first,
          so PublicRoute never ran. Also removed the duplicate "/" route. */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      {/* CHANGED: left unwrapped on purpose so emailed reset links always work */}
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
export default App;
