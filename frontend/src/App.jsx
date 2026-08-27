import { useState } from "react";
import { Routes, Route } from "react-router-dom";
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
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/*"
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