import {
  Bot,
  MessageSquare,
  History,
  ArrowRight,
  Sparkles,
  HeartPulse,
  BookOpen,
  Lightbulb,
  ShieldAlert,
  FileBarChart,
  Check,
} from "lucide-react";

// Modes — descriptions match what each mode actually does in AssistEdge.
const MODES = [
  {
    key: "simulator",
    title: "Simulator Mode",
    pill: "Practice",
    description:
      "Practice against an AI-generated customer built from a scenario, tone and patience level you set.",
    points: [
      "Customer reacts to how well you reply",
      "Full live coaching on every turn",
    ],
    icon: Bot,
    accent: "indigo",
  },
  {
    key: "manual",
    title: "Manual Mode",
    pill: "Live support",
    description:
      "Coaching for a real chat happening on another channel. Paste the customer's messages and log your replies.",
    points: [
      "Sentiment, KB and escalation per turn",
      "Add scenario and product context",
    ],
    icon: MessageSquare,
    accent: "blue",
  },
  {
    key: "replay",
    title: "Replay Mode",
    pill: "Review",
    description:
      "Step through a completed session turn by turn, using the sentiment and escalation data saved with it.",
    points: [
      "Step through or auto-play",
      "No new AI calls during replay",
    ],
    icon: History,
    accent: "emerald",
  },
];

// The real analysis pipeline, in the order it runs on each customer message.
const PIPELINE = [
  {
    icon: HeartPulse,
    title: "Intent & Sentiment",
    subtitle: "Emotion and frustration score",
    color: "text-indigo-600 bg-indigo-100",
  },
  {
    icon: BookOpen,
    title: "Knowledge",
    subtitle: "Relevant articles from your KB",
    color: "text-blue-600 bg-blue-100",
  },
  {
    icon: Lightbulb,
    title: "Coaching",
    subtitle: "Suggested replies and tips",
    color: "text-emerald-600 bg-emerald-100",
  },
  {
    icon: ShieldAlert,
    title: "Escalation Risk",
    subtitle: "Risk level and intervention",
    color: "text-orange-500 bg-orange-100",
  },
  {
    icon: FileBarChart,
    title: "Session Report",
    subtitle: "Resolution score and PDF export",
    color: "text-purple-600 bg-purple-100",
  },
];

const ACCENTS = {
  indigo: {
    bar: "bg-indigo-600",
    iconBg: "bg-indigo-100 text-indigo-600",
    title: "text-indigo-600",
    pill: "bg-indigo-50 text-indigo-700",
    dot: "bg-indigo-500",
    check: "text-indigo-600",
    btn: "bg-indigo-600 group-hover:bg-indigo-700",
    ring: "focus-visible:ring-indigo-500",
  },
  blue: {
    bar: "bg-blue-600",
    iconBg: "bg-blue-100 text-blue-600",
    title: "text-blue-600",
    pill: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
    check: "text-blue-600",
    btn: "bg-blue-600 group-hover:bg-blue-700",
    ring: "focus-visible:ring-blue-500",
  },
  emerald: {
    bar: "bg-emerald-600",
    iconBg: "bg-emerald-100 text-emerald-600",
    title: "text-emerald-600",
    pill: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    check: "text-emerald-600",
    btn: "bg-emerald-600 group-hover:bg-emerald-700",
    ring: "focus-visible:ring-emerald-500",
  },
};

export default function LandingDashboard({ onSelectMode }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[30px]"
      style={{ background: "#F8F7FF" }}
    >
      {/* Soft background glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 12%, rgba(99,102,241,0.14) 0%, rgba(99,102,241,0.07) 22%, transparent 55%)",
        }}
      />
      <div
        className="absolute -bottom-32 -right-24 w-[520px] h-[520px] rounded-full blur-[90px] pointer-events-none"
        style={{ background: "rgba(139,92,246,.12)" }}
      />
      <div
        className="absolute -top-24 left-40 w-[420px] h-[420px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: "rgba(147,197,253,.10)" }}
      />
      <div
        className="absolute top-14 left-14 w-28 h-28 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(99,102,241,.35) 2px, transparent 2px)",
          backgroundSize: "18px 18px",
        }}
      />
      <div
        className="absolute -top-10 -right-10 w-[340px] h-[340px] opacity-20 pointer-events-none"
        style={{
          backgroundImage: `repeating-radial-gradient(
            circle at top right,
            rgba(99,102,241,.18) 0px,
            rgba(99,102,241,.18) 2px,
            transparent 2px,
            transparent 16px
          )`,
        }}
      />

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 sm:px-8 py-4 text-center">
        {/* Header */}
        <span className="inline-flex items-center gap-2 bg-white border border-indigo-100 text-indigo-600 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <Sparkles size={13} />
          AI-Powered Coaching
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AssistEdge
          </span>
        </h1>

        <p className="text-gray-600 text-sm sm:text-base mb-1">
          AI-Powered Customer Support Assistant with Live Response Guidance
        </p>
        <p className="text-sm text-gray-400 mb-5 max-w-xl">
          Choose how you want to coach this session.
        </p>

        {/* Mode cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl mb-4">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const a = ACCENTS[mode.accent];

            return (
              <button
                key={mode.key}
                onClick={() => onSelectMode(mode.key)}
                className={`group relative overflow-hidden text-left bg-white rounded-2xl border border-gray-100 p-5 pt-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col focus:outline-none focus-visible:ring-2 ${a.ring}`}
              >
                {/* Colored top accent bar */}
                <span
                  className={`absolute top-0 left-0 right-0 h-1.5 ${a.bar}`}
                />

                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`w-11 h-11 rounded-full flex items-center justify-center ${a.iconBg}`}
                  >
                    <Icon size={22} />
                  </span>

                  {/* Dotted status pill */}
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ${a.pill}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
                    {mode.pill}
                  </span>
                </div>

                <h2 className={`text-base font-semibold mb-1.5 ${a.title}`}>
                  {mode.title}
                </h2>

                <p className="text-[13px] text-gray-500 leading-relaxed mb-3">
                  {mode.description}
                </p>

                <ul className="hidden [@media(min-height:800px)]:block space-y-1.5 mb-4">
                  {mode.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2 text-xs text-gray-600"
                    >
                      <Check
                        size={14}
                        className={`mt-0.5 shrink-0 ${a.check}`}
                      />
                      {p}
                    </li>
                  ))}
                </ul>

                <span
                  className={`w-8 h-8 rounded-full text-white flex items-center justify-center self-end mt-auto transition-colors ${a.btn}`}
                >
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </button>
            );
          })}
        </div>

        {/* Pipeline strip — what runs on every customer message */}
        <div className="w-full max-w-5xl bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-600 to-purple-600" />
          <div className="px-6 pt-3 pb-0 text-left">
            <p className="text-sm font-semibold text-gray-800">
              What runs on every customer message
            </p>
            <p className="text-xs text-gray-400">
              Each step is handled by its own agent, and a failure in one does
              not block the others.
            </p>
          </div>
          <div className="px-6 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PIPELINE.map((f) => {
              const Icon = f.icon;

              return (
                <div key={f.title} className="flex items-center gap-3">
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${f.color}`}
                  >
                    <Icon size={16} />
                  </span>

                  <div className="text-left min-w-0">
                    <p className="text-xs font-semibold text-gray-800">
                      {f.title}
                    </p>
                    <p className="text-[11px] leading-snug text-gray-400">
                      {f.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}