import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({ children, activeView, onNavigate }) {
  const { pathname } = useLocation();

  const normalize = (value) =>
    String(value ?? "").toLowerCase().replace(/[^a-z]/g, "");

  const viewKey = normalize(activeView);
  const pathKey = String(pathname ?? "").toLowerCase().replace(/\/+$/, "") || "/";

  // Use specific Select Mode identifiers only. Do not treat generic
  // "/" or "/dashboard" routes as Select Mode because Replay/Simulator
  // views may also be rendered from those routes.
  const isSelectModePage =
    ["select", "selectmode", "selectmodepage"].includes(viewKey) ||
    /\/(select-mode|selectmode|mode-selection|select)(\/|$)/.test(pathKey);

  const isReportsPage =
    viewKey === "reports" ||
    viewKey === "report" ||
    /\/reports?(\/|$)/.test(pathKey);

  const isAnalyticsPage =
    viewKey === "analytics" ||
    viewKey === "analytic" ||
    /\/analytics?(\/|$)/.test(pathKey);

  const showAccountControls =
    isSelectModePage || isReportsPage || isAnalyticsPage;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      <Sidebar active={activeView} onNavigate={onNavigate} />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {showAccountControls && (
          <div className="pointer-events-none absolute right-6 top-4 z-50">
            <div className="pointer-events-auto">
              <Header />
            </div>
          </div>
        )}

        <main className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
