import { useState, useEffect } from "react";
import { ClipboardList, Smile, Clock3, Play, Square, Bot } from "lucide-react";
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
      <div className="min-h-full w-full bg-indigo-50/60 p-6">
        <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#9333ea] rounded-2xl p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Simulator Mode</h1>
              <p className="text-white/80 text-sm">Configure your simulation session</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-white/15 px-3 py-1.5 rounded-full shrink-0">
            AI Roleplay
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium mb-4">
          <span>Simulator Mode</span>
          <span className="text-gray-400">›</span>
          <span className="text-gray-500 font-normal">Session Setup</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Session Details</h2>
              <p className="text-gray-500 text-xs">
                Define the scenario and customer behavior for this simulation.
              </p>
            </div>
          </div>

          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Scenario
              </label>
              <textarea
                value={scenario}
                onChange={(e) => setScenario(e.target.value.slice(0, SCENARIO_MAX))}
                placeholder="e.g. Customer received the wrong size and wants an urgent replacement"
                rows={2}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700
                           placeholder:text-gray-400 focus:outline-none focus:ring-2
                           focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              <div className="text-right text-xs text-gray-400 mt-0.5">
                {scenario.length}/{SCENARIO_MAX}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Customer Tone
                </label>
                <div className="relative">
                  <Smile className="w-4 h-4 text-amber-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <select
                    value={customerTone}
                    onChange={(e) => setCustomerTone(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 pl-11 pr-10 py-2.5
                               text-sm text-gray-700 focus:outline-none focus:ring-2
                               focus:ring-indigo-500 focus:border-transparent"
                  >
                    {Object.entries(TONE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <svg
                    className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Patience Level
                </label>
                <div className="relative">
                  <Clock3 className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <select
                    value={patienceLevel}
                    onChange={(e) => setPatienceLevel(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 pl-11 pr-10 py-2.5
                               text-sm text-gray-700 focus:outline-none focus:ring-2
                               focus:ring-indigo-500 focus:border-transparent"
                  >
                    {Object.entries(PATIENCE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <svg
                    className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Product Context <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={productContext}
                onChange={(e) => setProductContext(e.target.value.slice(0, CONTEXT_MAX))}
                placeholder="e.g. Online shopping app, Order ID, Product type, return policy"
                rows={2}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700
                           placeholder:text-gray-400 focus:outline-none focus:ring-2
                           focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              <div className="text-right text-xs text-gray-400 mt-0.5">
                {productContext.length}/{CONTEXT_MAX}
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 mt-2 mb-2">{error}</p>}

          <button
            onClick={handleStart}
            disabled={isLoading || !scenario.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl
                       bg-gradient-to-r from-indigo-600 to-purple-600 text-white
                       font-semibold py-3 mt-3 hover:opacity-90 transition-opacity
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Starting..." : "Start Session"}
            {!isLoading && <Play className="w-4 h-4 fill-white" />}
          </button>
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
              <p className="text-[10.5px] font-bold uppercase tracking-wider mb-2" style={{ color: "#4f46e5" }}>
                Scenario
              </p>
              <p className="text-sm leading-5 font-semibold line-clamp-2" style={{ color: "#4f46e5" }}>
                {scenario || "—"}
              </p>
            </div>

            <div className="rounded-xl p-4" style={{ background: toneTone.bg, border: `1px solid ${toneTone.border}` }}>
              <p className="text-[10.5px] font-bold uppercase tracking-wider mb-2" style={{ color: toneTone.fg }}>
                Customer Tone
              </p>
              <p className="coaching-display text-base font-bold" style={{ color: toneTone.fg }}>
                {TONE_LABELS[customerTone]}
              </p>
            </div>

            <div className="rounded-xl p-4" style={{ background: patienceTone.bg, border: `1px solid ${patienceTone.border}` }}>
              <p className="text-[10.5px] font-bold uppercase tracking-wider mb-2" style={{ color: patienceTone.fg }}>
                Patience Level
              </p>
              <p className="coaching-display text-base font-bold" style={{ color: patienceTone.fg }}>
                {PATIENCE_LABELS[patienceLevel]}
              </p>
            </div>

            <div className="rounded-xl p-4" style={{ background: "#ecfeff", border: "1px solid #bdeefc" }}>
              <p className="text-[10.5px] font-bold uppercase tracking-wider mb-2" style={{ color: "#0891b2" }}>
                Started At
              </p>
              <p className="coaching-display text-base font-bold" style={{ color: "#0891b2" }}>
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