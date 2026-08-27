import { useState } from "react";
import { Home, BarChart3, ClipboardList, Menu, Bot, ChevronRight, Sparkles } from "lucide-react";

const NAV_ITEMS = [
  { label: "Select Mode", view: "select-mode", icon: Home },
  { label: "Analytics", view: "analytics", icon: BarChart3 },
  { label: "Reports", view: "reports", icon: ClipboardList },
];

export default function Sidebar({ active, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${collapsed ? "w-[76px]" : "w-64"} shrink-0 bg-white border-r border-[#f0f1f8] min-h-screen px-3 py-6 flex flex-col transition-all duration-200`}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Logo */}
      <div className={`mb-8 ${collapsed ? "flex flex-col items-center gap-3" : "flex items-center justify-between px-2"}`}>
        <div className="flex items-center gap-2.5">
          <span
            className="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
              boxShadow: "0 4px 12px rgba(79,70,229,0.35)",
            }}
          >
            <Bot size={18} />
          </span>
          {!collapsed && (
            <h1 className="text-lg tracking-tight" style={{ fontFamily: "Sora, sans-serif", fontWeight: 700 }}>
              <span className="text-gray-900">Assist</span>
              <span
                style={{
                  background: "linear-gradient(90deg,#4f46e5,#7c3aed)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Edge
              </span>
            </h1>
          )}
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu size={17} />
        </button>
      </div>

      {/* Section label */}
      {!collapsed && (
        <p
          className="px-3 mb-2 text-[11px] uppercase tracking-wider text-gray-400"
          style={{ fontFamily: "Sora, sans-serif", fontWeight: 600, letterSpacing: "0.08em" }}
        >
          Menu
        </p>
      )}

      {/* Nav */}
      <nav className="space-y-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.view === active;
          const Icon = item.icon;
          return (
            <div
              key={item.view}
              onClick={() => onNavigate?.(item.view)}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all duration-150 ${
                collapsed ? "justify-center px-0" : "px-3"
              } ${
                isActive
                  ? "text-white"
                  : "text-gray-500 hover:text-indigo-700 hover:bg-indigo-50/70 hover:translate-x-0.5"
              }`}
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: isActive ? 600 : 500,
                background: isActive ? "linear-gradient(90deg,#4f46e5,#7c3aed)" : "transparent",
                boxShadow: isActive ? "0 6px 16px rgba(79,70,229,0.28)" : "none",
              }}
            >
              <Icon size={18} className="shrink-0" strokeWidth={isActive ? 2.4 : 2} />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && isActive && <ChevronRight size={14} className="opacity-80" />}
            </div>
          );
        })}
      </nav>

      {/* AI-Powered Coaching card */}
      {!collapsed && (
        <div
          className="mt-6 rounded-2xl text-white p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg,#4f46e5 0%,#6d28d9 55%,#7c3aed 100%)",
            boxShadow: "0 12px 28px rgba(79,70,229,0.32), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          {/* layered decorative glows */}
          <div
            className="absolute -top-8 -right-8 w-28 h-28 rounded-full"
            style={{ background: "rgba(255,255,255,0.10)" }}
          />
          <div
            className="absolute -bottom-10 -left-6 w-24 h-24 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          {/* fine dot-grid texture */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />

          <span
            className="relative w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-sm mb-3"
            style={{
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            <Sparkles size={18} />
          </span>

          <h3
            className="relative mb-1.5"
            style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "14.5px" }}
          >
            AI-Powered Coaching
          </h3>
          <p className="relative text-xs text-indigo-100 leading-relaxed">
            Improve agent performance with real-time insights and personalized feedback.
          </p>
        </div>
      )}
    </aside>
  );
}