import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({ children, activeView, onNavigate }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar active={activeView} onNavigate={onNavigate} />

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Header */}
        <header className="flex h-20 shrink-0 items-center justify-end px-6">
          <Header />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}