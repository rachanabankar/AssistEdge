import { useState, useEffect } from "react";
import {
  ClipboardList, Smile, Clock3, Play, Square, Bot, Headphones,
  MessageCircle, Package, Zap, Target, BarChart3, ShieldCheck,
} from "lucide-react";
import StatusPillRow from "../components/coaching/StatusPillRow";
import ConversationPanel from "../components/coaching/ConversationPanel";
import SentimentPanel from "../components/coaching/SentimentPanel";
import KnowledgeBasePanel from "../components/coaching/KnowledgeBasePanel";
import CoachingPanel from "../components/coaching/CoachingPanel";
import EscalationPanel from "../components/coaching/EscalationPanel";
import { useSimulatorSession } from "../hooks/useSimulatorSession";

const SCENARIO_MAX = 500;
const CONTEXT_MAX = 300;

const TONE_LABELS = {
  frustrated_polite: "Frustrated but polite",
  calm: "Calm",
  angry: "Angry",
  confused: "Confused",
};

// Tone → pill color, same red/orange/green/indigo vocabulary used on Reports.
const TONE_TONE = {
  angry: { bg: "#fef2f2", fg: "#dc2626", border: "#fecaca" },
  frustrated_polite: { bg: "#fff7ed", fg: "#ea580c", border: "#fde3c4" },
  confused: { bg: "#eef2ff", fg: "#4f46e5", border: "#dbe1ff" },
  calm: { bg: "#ecfdf5", fg: "#059669", border: "#bdf0d8" },
};

const PATIENCE_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

// Patience → pill color. Kept in its own pink/violet family so it never
// collides visually with the Customer Tone tile next to it (which uses
// red/orange/indigo/green). Low patience still reads as the risky state.
const PATIENCE_TONE = {
  low: { bg: "#fdf2f8", fg: "#db2777", border: "#fbcfe8" },
  medium: { bg: "#f5f3ff", fg: "#7c3aed", border: "#ddd6fe" },
  high: { bg: "#ecfdf5", fg: "#059669", border: "#bdf0d8" },
};

const TILE_HEADER_CLASS = "text-[10.5px] font-bold uppercase tracking-wider mb-2";
const TILE_VALUE_CLASS = "coaching-display text-base font-bold";

const SIMULATOR_FEATURES = [
  { icon: Zap, label: "Scenario-based AI customer messages" },
  { icon: Target, label: "Customer tone adapts to your replies" },
  { icon: BarChart3, label: "Live sentiment and escalation-risk analysis" },
  { icon: ShieldCheck, label: "Knowledge-base suggestions and live response coaching" },
];

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function CoachingConsole() {
  // --- Setup form state ---
  const [scenario, setScenario] = useState("");
  const [customerTone, setCustomerTone] = useState("frustrated_polite");
  const [patienceLevel, setPatienceLevel] = useState("medium");
  const [productContext, setProductContext] = useState("");

  // --- Active session bookkeeping (client-side; hook doesn't track this yet) ---
  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const {
    sessionId,
    conversationHistory,
    sentiment,
    sentimentHistory, 
    knowledgeSuggestions,
    coaching,
    escalation,
    isLoading,
    error,
    startSession,
    sendAgentReply,
    endSession, // NOTE: assumed to exist on the hook — add if missing
  } = useSimulatorSession();

  useEffect(() => {
    if (!sessionId || !startedAt) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [sessionId, startedAt]);

  const handleStart = () => {
    if (!scenario.trim()) return;
    // NOTE: startSession currently only accepts a scenario string in the
    // hook you last shared. Passing the full object here — update the
    // hook signature to `startSession({ scenario, customerTone, patienceLevel, productContext })`
    // (or destructure what it needs) for tone/patience/context to actually reach the backend.
    startSession({
      scenario: scenario.trim(),
      customerTone,
      patienceLevel,
      productContext: productContext.trim() || undefined,
    });
    setStartedAt(new Date());
    setElapsed(0);
  };

  const handleEndSession = () => {
    endSession?.(); // NOTE: add `endSession` to useSimulatorSession if it doesn't exist yet
    setStartedAt(null);
    setElapsed(0);
  };

  const toneTone = TONE_TONE[customerTone] || TONE_TONE.calm;
  const patienceTone = PATIENCE_TONE[patienceLevel] || PATIENCE_TONE.medium;

  // ---------------- STATE 1: Session Setup ----------------
  if (!sessionId) {
    return (
      <div className="relative h-full min-h-0 w-full overflow-hidden bg-[#f5f6ff] px-4 py-3 sm:px-6 lg:px-8">
        {/* Soft ambient background accents */}
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />

        <div className="relative mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col">
          {/* Compact page heading */}
          <div className="mb-3 flex shrink-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-200 to-indigo-100 shadow-sm ring-1 ring-violet-200/70">
              <Headphones className="h-7 w-7 text-violet-700" />
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">
                SIMULATOR MODE
              </p>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-[#1e2459] sm:text-3xl">
                Simulator Mode
              </h1>
              <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
                Configure your simulation session and practice real customer support scenarios.
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="mb-3 flex shrink-0 items-center gap-2 text-xs sm:text-sm">
            <span className="font-semibold text-violet-700">⌂</span>
            <span className="text-slate-400">›</span>
            <span className="font-semibold text-violet-700">Simulator Mode</span>
            <span className="text-slate-400">›</span>
            <span className="text-slate-500">Session Setup</span>
          </div>

          {/* Both panels share the remaining viewport height. */}
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.85fr)_minmax(290px,0.9fr)]">
            {/* Session form */}
            <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-violet-200/90 bg-white shadow-[0_12px_40px_rgba(79,70,229,0.08)]">
              <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-white via-violet-50/60 to-white px-5 py-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">Session Details</h2>
                  <p className="text-xs text-slate-500">
                    Define the scenario and customer behavior for this simulation.
                  </p>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
                {/* Scenario */}
                <div className="shrink-0">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label htmlFor="sim-scenario" className="text-sm font-semibold text-slate-800">
                      Scenario <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs tabular-nums text-slate-400">{scenario.length}/{SCENARIO_MAX}</span>
                  </div>
                  <div className="relative">
                    <MessageCircle className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <textarea
                      id="sim-scenario"
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value.slice(0, SCENARIO_MAX))}
                      placeholder="e.g. Customer received the wrong size and wants an urgent replacement"
                      rows={2}
                      maxLength={SCENARIO_MAX}
                      required
                      className="h-[76px] w-full resize-none rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm leading-5 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-violet-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">Describe the customer’s issue and what they need help with.</p>
                </div>

                {/* Tone and patience */}
                <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="sim-tone" className="mb-1.5 block text-sm font-semibold text-slate-800">
                      Customer Tone <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Smile className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-500" />
                      <select
                        id="sim-tone"
                        value={customerTone}
                        onChange={(e) => setCustomerTone(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-12 pr-10 text-sm text-slate-800 shadow-sm outline-none transition hover:border-violet-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                      >
                        {Object.entries(TONE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="sim-patience" className="mb-1.5 block text-sm font-semibold text-slate-800">
                      Patience Level <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock3 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                      <select
                        id="sim-patience"
                        value={patienceLevel}
                        onChange={(e) => setPatienceLevel(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-12 pr-10 text-sm text-slate-800 shadow-sm outline-none transition hover:border-violet-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                      >
                        {Object.entries(PATIENCE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Product context */}
                <div className="shrink-0">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label htmlFor="sim-context" className="text-sm font-semibold text-slate-800">
                      Product Context <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <span className="text-xs tabular-nums text-slate-400">{productContext.length}/{CONTEXT_MAX}</span>
                  </div>
                  <div className="relative">
                    <Package className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
                    <textarea
                      id="sim-context"
                      value={productContext}
                      onChange={(e) => setProductContext(e.target.value.slice(0, CONTEXT_MAX))}
                      placeholder="e.g. Online shopping app, Order ID, Product type, return policy"
                      rows={2}
                      maxLength={CONTEXT_MAX}
                      className="h-[62px] w-full resize-none rounded-xl border border-slate-200 bg-white py-2.5 pl-12 pr-4 text-sm leading-5 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-violet-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    />
                  </div>
                </div>

                {error && (
                  <div role="alert" className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    {error}
                  </div>
                )}

                <div className="shrink-0">
                  <button
                    onClick={handleStart}
                    disabled={isLoading || !scenario.trim()}
                    className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-violet-500 via-violet-600 to-purple-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/25 focus:outline-none focus:ring-4 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {isLoading ? "Starting session..." : "Start Session"}
                    {!isLoading && <Play className="h-4 w-4 fill-current" />}
                  </button>
                  <p className="mt-1.5 text-center text-[11px] text-slate-400">
                    Your AI customer simulation will begin once the session is created.
                  </p>
                </div>
              </div>
            </section>

            {/* Information panel */}
            <aside className="flex h-fit min-h-0 flex-col self-start overflow-hidden rounded-3xl border border-violet-200/90 bg-white p-3 shadow-[0_12px_40px_rgba(79,70,229,0.08)] sm:p-4">
              {/* Compact visual header */}
              <div className="relative mb-3 flex h-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-100 sm:h-24">
                <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/60 blur-2xl" />
                <div className="absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-violet-200/60 blur-2xl" />
                <div className="relative flex h-16 w-28 items-center justify-center">
                  <div className="absolute bottom-0 h-2.5 w-24 rounded-full bg-violet-300/50 blur-sm" />
                  <div className="relative flex h-12 w-[4.25rem] items-center justify-center rounded-2xl border-[3px] border-violet-500 bg-gradient-to-br from-indigo-500 to-violet-700 shadow-lg shadow-violet-500/25">
                    <Bot className="h-8 w-8 text-white" />
                  </div>
                  <Headphones className="absolute -left-2 -top-1 h-10 w-10 text-violet-600" strokeWidth={2.5} />
                  <span className="absolute -right-2 top-0 text-lg font-bold text-fuchsia-500">〰</span>
                </div>
              </div>

              <div className="shrink-0">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-700">
                  Practice with confidence
                </p>
                <h2 className="text-base font-extrabold tracking-tight text-slate-950 sm:text-lg">
                  Practice with an AI customer
                </h2>
                <p className="mt-1 text-xs leading-[1.15rem] text-slate-600">
                  Practice realistic support conversations with an AI customer while AssistEdge analyses sentiment, monitors escalation risk, and offers live response guidance.
                </p>
              </div>

              <div className="my-2.5 h-px shrink-0 bg-gradient-to-r from-violet-200 via-slate-200 to-transparent" />

              <div className="grid shrink-0 grid-cols-1 gap-1.5">
                {SIMULATOR_FEATURES.map(({ icon: FeatureIcon, label }) => (
                  <div key={label} className="flex items-center gap-2.5 rounded-xl bg-violet-50/70 px-2.5 py-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm ring-1 ring-violet-100">
                      <FeatureIcon className="h-4 w-4" />
                    </span>
                    <span className="text-[11px] font-semibold leading-4 text-slate-700 sm:text-xs">{label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-2.5 flex shrink-0 items-center gap-2 rounded-xl border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-2.5 py-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-violet-700 shadow-sm">
                  <Headphones className="h-3.5 w-3.5" />
                </span>
                <p className="text-[10px] leading-[1.05rem] text-slate-600">
                  <span className="font-bold text-violet-800">Ready when you are.</span> Set your scenario, customer tone, and patience level to begin.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- STATE 2: Active Session ----------------
  return (
    <div className="min-h-full w-full bg-indigo-50/60 p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        .coaching-display { font-family: 'Sora', 'Inter', sans-serif; letter-spacing: -0.01em; }
        .session-card {
          background: #fff;
          border: 1px solid #f0f1f8;
          border-radius: 16px;
          box-shadow: 0 5px 20px rgba(44, 43, 92, 0.06);
        }
      `}</style>

      <div className="bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#9333ea] rounded-2xl p-6 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="coaching-display text-xl font-bold text-white">Simulator Mode</h1>
            <p className="text-white/80 text-sm">Live session diagnostics</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-white/15 px-3 py-1.5 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Live Session
        </span>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {/* Current Session overview */}
      <div className="session-card overflow-hidden mb-8">
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: "linear-gradient(90deg, #eef2ff 0%, #f5f3ff 55%, #ffffff 100%)",
            borderBottom: "1px solid #f0f1f5",
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full" style={{ background: "#4f46e5" }} />
            <h3 className="coaching-display text-base font-bold" style={{ color: "#10162f" }}>
              Current Session
            </h3>
          </div>
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{ background: "#059669", color: "#fff" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Active
          </span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div className="rounded-xl p-4" style={{ background: "#f5f6ff", border: "1px solid #e6e8ff" }}>
              <p className={TILE_HEADER_CLASS} style={{ color: "#4f46e5" }}>
                Scenario
              </p>
              <p className="text-sm leading-5 font-semibold line-clamp-2" style={{ color: "#4f46e5" }}>
                {scenario || "—"}
              </p>
            </div>

            <div className="rounded-xl p-4" style={{ background: toneTone.bg, border: `1px solid ${toneTone.border}` }}>
              <p className={TILE_HEADER_CLASS} style={{ color: toneTone.fg }}>
                Customer Tone
              </p>
              <p className={TILE_VALUE_CLASS} style={{ color: toneTone.fg }}>
                {TONE_LABELS[customerTone]}
              </p>
            </div>

            <div className="rounded-xl p-4" style={{ background: patienceTone.bg, border: `1px solid ${patienceTone.border}` }}>
              <p className={TILE_HEADER_CLASS} style={{ color: patienceTone.fg }}>
                Patience Level
              </p>
              <p className={TILE_VALUE_CLASS} style={{ color: patienceTone.fg }}>
                {PATIENCE_LABELS[patienceLevel]}
              </p>
            </div>

            <div className="rounded-xl p-4" style={{ background: "#ecfeff", border: "1px solid #bdeefc" }}>
              <p className={TILE_HEADER_CLASS} style={{ color: "#0891b2" }}>
                Started At
              </p>
              <p className={TILE_VALUE_CLASS} style={{ color: "#0891b2" }}>
                {startedAt ? startedAt.toLocaleTimeString() : "—"}
              </p>
            </div>
          </div>

          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl p-4"
            style={{ background: "linear-gradient(90deg, #eef2ff 0%, #f5f3ff 100%)", border: "1px solid #e0e4ff" }}
          >
            <div className="flex items-center gap-3.5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-white"
                style={{ boxShadow: "0 4px 10px rgba(79,70,229,0.12)" }}
              >
                <Clock3 className="w-5 h-5" style={{ color: "#4f46e5" }} />
              </div>
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#7c7ff0" }}>
                  Duration
                </p>
                <p className="coaching-display text-2xl font-extrabold tracking-tight" style={{ color: "#4f46e5" }}>
                  {formatDuration(elapsed)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className="text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-white"
                style={{ color: "#7a8198", border: "1px solid #e0e4ff" }}
              >
                Session: {sessionId}
              </span>
              <button
                onClick={handleEndSession}
                className="flex items-center gap-2 rounded-lg text-sm font-semibold px-4 py-2.5 transition-colors"
                style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
              >
                <Square className="w-3.5 h-3.5" style={{ fill: "#dc2626" }} />
                End Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Diagnostics — reposition only, no logic change */}
      <StatusPillRow
        sentiment={sentiment}
        knowledgeCount={knowledgeSuggestions.length}
        escalationRisk={escalation?.risk_level}
      />

      {/* Coaching Dashboard grid — reposition only, no logic change */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="space-y-6">
          <ConversationPanel
            messages={conversationHistory}
            onSend={sendAgentReply}
            isLoading={isLoading}
          />
          <CoachingPanel coaching={coaching} />
        </div>
       <div className="space-y-6">
          <SentimentPanel sentiment={sentiment} sentimentHistory={sentimentHistory} />
          <EscalationPanel escalation={escalation} />
          <KnowledgeBasePanel sessionId={sessionId} />
        </div>
      </div>
    </div>
  );
}
