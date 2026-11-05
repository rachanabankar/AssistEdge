import { useState } from "react";
import {
  Home,
  BarChart3,
  ClipboardList,
  Menu,
  Bot,
  ChevronsLeft,
  ChevronRight,
  HeartPulse,
  Lightbulb,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

// Each item has its own accent color (matches the mode cards on the dashboard).
const NAV_ITEMS = [
  {
    label: "Home",
    view: "select-mode",
    icon: Home,
    solid: "from-indigo-500 to-violet-500",
    glow: "shadow-indigo-500/30",
    soft: "bg-indigo-100 text-indigo-600",
  },
  {
    label: "Analytics",
    view: "analytics",
    icon: BarChart3,
    solid: "from-sky-500 to-blue-600",
    glow: "shadow-sky-500/30",
    soft: "bg-sky-100 text-sky-600",
  },
  {
    label: "Reports",
    view: "reports",
    icon: ClipboardList,
    solid: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/30",
    soft: "bg-emerald-100 text-emerald-600",
  },
];

// What the product does, shown in the bottom card.
const WHAT_IT_DOES = [
  { icon: HeartPulse, text: "Reads customer mood", color: "bg-indigo-100 text-indigo-600", dot: "bg-indigo-500" },
  { icon: Lightbulb, text: "Suggests your next reply", color: "bg-amber-100 text-amber-600", dot: "bg-amber-500" },
  { icon: ShieldAlert, text: "Flags escalation risk", color: "bg-rose-100 text-rose-600", dot: "bg-rose-500" },
];

export default function Sidebar({ active, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${
        collapsed ? "w-[84px]" : "w-64"
      } relative shrink-0 min-h-screen px-3 py-6 flex flex-col overflow-hidden border-r border-slate-200/70 bg-gradient-to-b from-white via-white to-indigo-50/40 shadow-[4px_0_24px_-12px_rgba(99,102,241,0.18)] transition-all duration-300 ease-out`}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes ae-pulse-ring {
          0%   { transform: scale(1);   opacity: .55; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes ae-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
      `}</style>

      {/* Decorative background glows */}
      <div className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full bg-indigo-300/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-24 -right-20 w-44 h-44 rounded-full bg-violet-300/20 blur-3xl" />

      {/* Logo */}
      <div
        className={`relative mb-8 ${
          collapsed ? "flex flex-col items-center gap-4" : "flex items-center justify-between px-1.5"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="relative shrink-0">
            <span
              className="w-11 h-11 rounded-2xl text-white flex items-center justify-center ring-4 ring-indigo-100"
              style={{
                background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 55%,#a855f7 100%)",
                boxShadow: "0 8px 20px rgba(99,102,241,0.4)",
              }}
            >
              <Bot size={21} />
            </span>
            {/* live dot */}
            <span className="absolute -bottom-0.5 -right-0.5 flex w-3.5 h-3.5">
              <span
                className="absolute inset-0 rounded-full bg-emerald-400"
                style={{ animation: "ae-pulse-ring 1.8s ease-out infinite" }}
              />
              <span className="relative w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
            </span>
          </span>

          {!collapsed && (
            <div className="leading-tight">
              <h1
                className="text-[19px] tracking-tight text-slate-900"
                style={{ fontFamily: "Sora, sans-serif", fontWeight: 800 }}
              >
                Assist
                <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
                  Edge
                </span>
              </h1>
              <p className="text-[10.5px] font-medium text-slate-400 tracking-wide">
                Live support coach
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <Menu size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>

      {/* Section label */}
      {!collapsed ? (
        <div className="relative flex items-center gap-2 px-3 mb-3">
          <p
            className="text-[11px] uppercase text-slate-400"
            style={{ fontFamily: "Sora, sans-serif", fontWeight: 600, letterSpacing: "0.1em" }}
          >
            Menu
          </p>
          <span className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
        </div>
      ) : (
        <span className="relative mx-auto mb-3 w-6 h-px bg-slate-200" />
      )}

      {/* Nav */}
      <nav className="relative space-y-1.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.view === active;
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => onNavigate?.(item.view)}
              aria-current={isActive ? "page" : undefined}
              className={`group relative w-full flex items-center gap-3 rounded-2xl text-sm text-left cursor-pointer transition-all duration-200 ${
                collapsed ? "justify-center p-2" : "px-2.5 py-2"
              } ${
                isActive
                  ? `bg-white shadow-lg ${item.glow} ring-1 ring-slate-100 text-slate-900`
                  : "text-slate-500 hover:bg-white/80 hover:shadow-sm hover:text-slate-900 hover:translate-x-0.5"
              }`}
              style={{ fontWeight: isActive ? 600 : 500 }}
            >
              {/* active accent bar */}
              {isActive && (
                <span
                  className={`absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-gradient-to-b ${item.solid}`}
                />
              )}

              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                  isActive
                    ? `bg-gradient-to-br ${item.solid} text-white shadow-md ${item.glow}`
                    : `${item.soft} group-hover:scale-110`
                }`}
              >
                <Icon size={17} strokeWidth={2.2} />
              </span>

              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight
                    size={15}
                    className={`transition-all duration-200 ${
                      isActive
                        ? "text-slate-400 opacity-100"
                        : "text-slate-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
                    }`}
                  />
                </>
              )}

              {/* tooltip when collapsed */}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Product info card */}
      {!collapsed ? (
        <div className="relative mt-6 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/80 via-white to-white shadow-[0_10px_24px_-14px_rgba(99,102,241,0.35)]">
          {/* top accent bar (same as dashboard cards) */}
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

          {/* soft decorative glow */}
          <span className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-violet-200/40 blur-2xl" />

          <div className="relative p-4">
            <div className="flex items-start justify-between mb-1">
              <p
                className="text-[14px] text-slate-900"
                style={{ fontFamily: "Sora, sans-serif", fontWeight: 700 }}
              >
                Your live support coach
              </p>
              <span
                className="text-indigo-500"
                style={{ animation: "ae-float 3s ease-in-out infinite" }}
              >
                <Sparkles size={15} />
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3.5">
              AssistEdge guides agents during customer chats and turns every session into a report.
            </p>

            <ul className="space-y-2">
              {WHAT_IT_DOES.map(({ icon: Icon, text, color }) => (
                <li
                  key={text}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all hover:-translate-y-px hover:border-indigo-100 hover:shadow-md"
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={14} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="relative mt-6 flex justify-center">
          <span
            className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-sm"
            title="Your live support coach"
          >
            <Sparkles size={18} />
          </span>
        </div>
      )}
    </aside>
  );
}