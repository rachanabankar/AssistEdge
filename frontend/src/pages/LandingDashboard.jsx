import {
  Bot,
  MessageSquare,
  FileText,
  ArrowRight,
  Sparkles,
  Shield,
  BarChart3,
  BookOpen,
  Star,
} from "lucide-react";

const MODES = [
  {
    key: "simulator",
    title: "Simulator Mode",
    description:
      "Practice against an AI-generated customer for a scenario you define.",
    icon: Bot,
    accent: "indigo",
  },
  {
    key: "manual",
    title: "Manual Mode",
    description:
      "Paste real customer messages and get live coaching on your replies.",
    icon: MessageSquare,
    accent: "blue",
  },
  {
    key: "replay",
    title: "Replay Mode",
    description:
      "Step through a saved transcript turn by turn for training or review.",
    icon: FileText,
    accent: "emerald",
  },
];

const FEATURES = [
  {
    icon: Shield,
    title: "Real-time Coaching",
    subtitle: "Instant feedback & guidance",
    color: "text-indigo-600 bg-indigo-100",
  },
  {
    icon: BarChart3,
    title: "Escalation Insights",
    subtitle: "Spot risk before it grows",
    color: "text-blue-600 bg-blue-100",
  },
  {
    icon: BookOpen,
    title: "Knowledge Powered",
    subtitle: "Smart KB recommendations",
    color: "text-emerald-600 bg-emerald-100",
  },
  {
    icon: Star,
    title: "Improve & Grow",
    subtitle: "Become a top performer",
    color: "text-orange-500 bg-orange-100",
  },
];

const ACCENTS = {
  indigo: {
    iconBg: "bg-indigo-100 text-indigo-600",
    border: "border-indigo-600",
    btn: "bg-indigo-600 hover:bg-indigo-700",
    title: "text-indigo-600",
  },
  blue: {
    iconBg: "bg-blue-100 text-blue-600",
    border: "border-blue-600",
    btn: "bg-blue-600 hover:bg-blue-700",
    title: "text-blue-600",
  },
  emerald: {
    iconBg: "bg-emerald-100 text-emerald-600",
    border: "border-emerald-600",
    btn: "bg-emerald-600 hover:bg-emerald-700",
    title: "text-emerald-600",
  },
};

export default function LandingDashboard({ onSelectMode }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[30px]"
      style={{
        background: "#F8F7FF",
      }}
    >
      {/* Center Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 18%, rgba(99,102,241,0.14) 0%, rgba(99,102,241,0.08) 20%, transparent 55%)",
        }}
      />

      {/* Bottom Right Glow */}
      <div
        className="absolute -bottom-32 -right-24 w-[520px] h-[520px] rounded-full blur-[90px] pointer-events-none"
        style={{
          background: "rgba(139,92,246,.12)",
        }}
      />

      {/* Top Left Soft Glow */}
      <div
        className="absolute -top-24 left-40 w-[420px] h-[420px] rounded-full blur-[100px] pointer-events-none"
        style={{
          background: "rgba(147,197,253,.10)",
        }}
      />

      {/* Decorative Dot Block */}
      <div
        className="absolute top-14 left-14 w-28 h-28 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(99,102,241,.35) 2px, transparent 2px)",
          backgroundSize: "18px 18px",
        }}
      />

      {/* Decorative Contour Lines */}
      <div
        className="absolute -top-10 -right-10 w-[340px] h-[340px] opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-radial-gradient(
              circle at top right,
              rgba(99,102,241,.18) 0px,
              rgba(99,102,241,.18) 2px,
              transparent 2px,
              transparent 16px
            )`,
        }}
      />

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 py-6 text-center">
        <span className="inline-flex items-center gap-1.5 bg-white border border-indigo-100 text-indigo-600 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm mb-4">
          <Sparkles size={14} />
          AI-Powered Coaching
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
          Welcome to <span className="text-indigo-600">AssistEdge</span>
        </h1>

        <p className="text-gray-500 mb-4">
          AI-Powered Customer Support Coaching Assistant
        </p>

        <div className="flex items-center gap-3 text-sm text-gray-400 mb-6">
          <span className="h-px w-8 bg-gray-300" />
          Choose how you want to coach this session
          <span className="h-px w-8 bg-gray-300" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-5xl mb-5">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const a = ACCENTS[mode.accent];

            return (
              <button
                key={mode.key}
                onClick={() => onSelectMode(mode.key)}
                className={`text-left bg-white rounded-2xl border-b-4 ${a.border} p-5 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col`}
              >
                <span
                  className={`w-11 h-11 rounded-full flex items-center justify-center mb-3 ${a.iconBg}`}
                >
                  <Icon size={20} />
                </span>

                <h2 className={`text-base font-semibold mb-1.5 ${a.title}`}>
                  {mode.title}
                </h2>

                <p className="text-xs text-gray-500 mb-5 flex-1">
                  {mode.description}
                </p>

                <span
                  className={`w-8 h-8 rounded-full text-white flex items-center justify-center self-end ${a.btn}`}
                >
                  <ArrowRight size={14} />
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-md px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;

            return (
              <div key={f.title} className="flex items-center gap-3">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${f.color}`}
                >
                  <Icon size={15} />
                </span>

                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-800">
                    {f.title}
                  </p>

                  <p className="text-[11px] text-gray-400">
                    {f.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}