import { useState, useEffect } from "react";
import { ClipboardList, Play, Square, PenLine, Clock3 } from "lucide-react";
import StatusPillRow from "../components/coaching/StatusPillRow";
import ManualConversationPanel from "../components/coaching/ManualConversationPanel";
import SentimentPanel from "../components/coaching/SentimentPanel";
import KnowledgeBasePanel from "../components/coaching/KnowledgeBasePanel";
import CoachingPanel from "../components/coaching/CoachingPanel";
import EscalationPanel from "../components/coaching/EscalationPanel";
import Card from "../components/common/Card";
import { useManualSession } from "../hooks/useManualSession";

const SCENARIO_MAX = 500;
const CONTEXT_MAX = 300;

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ManualMode() {
  const [scenario, setScenario] = useState("");
  const [productContext, setProductContext] = useState("");
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
    logAgentReply,
    sendCustomerMessage,
    endSession,
  } = useManualSession();

  useEffect(() => {
    if (!sessionId || !startedAt) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [sessionId, startedAt]);

  const handleStart = () => {
    startSession({
      scenario: scenario.trim() || undefined,
      productContext: productContext.trim() || undefined,
    });
    setStartedAt(new Date());
    setElapsed(0);
  };

  const handleEndSession = async () => {
    await endSession?.();
    setStartedAt(null);
    setElapsed(0);
  };

  // ---------------- STATE 1: Session Setup ----------------
if (!sessionId) {
  return (
    <div className="relative overflow-x-hidden min-h-full">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "#EEF0FC" }} />

      <div className="relative max-w-3xl mx-auto px-4 py-8">
        {/* Header banner — matches Replay Mode */}
        <div className="relative overflow-hidden flex items-center gap-4 mb-5 rounded-2xl p-5 bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#9333ea] shadow-lg shadow-[#9333ea]/25">
          <div className="pointer-events-none absolute -right-8 -top-14 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 border border-white/20">
            <PenLine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Manual Mode</h1>
            <p className="text-white/75 text-sm">
              Coach a real, live conversation you're handling elsewhere
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm font-medium mb-4">
          <span className="text-indigo-600 font-semibold">Manual Mode</span>
          <span className="text-indigo-300">›</span>
          <span className="text-[#6b6690]">Session Setup</span>
        </div>

        <Card accent="purple">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Session Details</h2>
              <p className="text-gray-500 text-xs">
                Optional context to improve coaching and knowledge base matches.
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Scenario <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value.slice(0, SCENARIO_MAX))}
              placeholder="e.g. Customer requesting refund for a damaged item received 2 weeks ago"
              rows={2}
              className="w-full rounded-xl border border-indigo-100 bg-white/70 px-4 py-2.5 text-sm text-gray-700
                         placeholder:text-gray-400 focus:outline-none focus:ring-2
                         focus:ring-indigo-500 focus:border-transparent resize-none transition-shadow"
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {scenario.length}/{SCENARIO_MAX}
            </div>
          </div>

          <div className="mb-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Product Context <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={productContext}
              onChange={(e) => setProductContext(e.target.value.slice(0, CONTEXT_MAX))}
              placeholder="e.g. Online shopping app, Order ID, Product type, return policy"
              rows={2}
              className="w-full rounded-xl border border-indigo-100 bg-white/70 px-4 py-2.5 text-sm text-gray-700
                         placeholder:text-gray-400 focus:outline-none focus:ring-2
                         focus:ring-indigo-500 focus:border-transparent resize-none transition-shadow"
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {productContext.length}/{CONTEXT_MAX}
            </div>
          </div>

          {error && <p className="text-sm text-red-500 mt-2 mb-2 shrink-0">{error}</p>}

          <button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full shrink-0 flex items-center justify-center gap-2 rounded-xl
                       bg-gradient-to-r from-indigo-600 to-purple-600 text-white
                       font-semibold py-3 mt-2 hover:shadow-lg hover:shadow-[#9333ea]/25 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Starting..." : "Start Session"}
            {!isLoading && <Play className="w-4 h-4 fill-white" />}
          </button>
        </Card>
      </div>
    </div>
  );
}

  // ---------------- STATE 2: Active Session ----------------
  return (
    <div className="relative overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        .manual-display { font-family: 'Sora', 'Inter', sans-serif; letter-spacing: -0.01em; }
      `}</style>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "#EEF0FC" }} />

      <div className="relative">
        <div className="relative overflow-hidden flex items-center justify-between gap-4 mb-6 rounded-2xl p-5 bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#9333ea] shadow-lg shadow-[#9333ea]/25">
        <div className="pointer-events-none absolute -right-8 -top-14 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 border border-white/20">
            <PenLine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Manual Mode</h1>
            <p className="text-white/75 text-sm">Live session diagnostics</p>
          </div>
        </div>
        <span className="relative inline-flex items-center gap-1.5 text-xs font-medium text-white bg-white/15 backdrop-blur ring-1 ring-inset ring-white/25 px-3 py-1.5 rounded-full shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Live Session
      </span>
    </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {/* Current Session overview */}
        <div
          className="rounded-2xl overflow-hidden mb-8"
          style={{ background: "#fff", border: "1px solid #f0f1f8", boxShadow: "0 5px 20px rgba(44,43,92,0.06)" }}
        >
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{
              background: "linear-gradient(90deg, #eef2ff 0%, #f5f3ff 55%, #ffffff 100%)",
              borderBottom: "1px solid #f0f1f5",
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "#4f46e5" }} />
              <h3 className="manual-display text-base font-bold" style={{ color: "#10162f" }}>
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
                  Mode
                </p>
                <p className="manual-display text-base font-bold" style={{ color: "#4f46e5" }}>
                  Manual
                </p>
              </div>

              <div className="rounded-xl p-4" style={{ background: "#fff7ed", border: "1px solid #fde3c4" }}>
                <p className="text-[10.5px] font-bold uppercase tracking-wider mb-2" style={{ color: "#ea580c" }}>
                  Scenario
                </p>
                <p className="text-sm leading-5 font-semibold line-clamp-2" style={{ color: "#ea580c" }}>
                  {scenario || "—"}
                </p>
              </div>

              <div className="rounded-xl p-4" style={{ background: "#ecfeff", border: "1px solid #bdeefc" }}>
                <p className="text-[10.5px] font-bold uppercase tracking-wider mb-2" style={{ color: "#0891b2" }}>
                  Product Context
                </p>
                <p className="text-sm leading-5 font-semibold line-clamp-2" style={{ color: "#0891b2" }}>
                  {productContext || "—"}
                </p>
              </div>

              <div className="rounded-xl p-4" style={{ background: "#fdf2f8", border: "1px solid #fbcfe8" }}>
                <p className="text-[10.5px] font-bold uppercase tracking-wider mb-2" style={{ color: "#db2777" }}>
                  Started At
                </p>
                <p className="manual-display text-base font-bold" style={{ color: "#db2777" }}>
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
                  <p className="manual-display text-2xl font-extrabold tracking-tight" style={{ color: "#4f46e5" }}>
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

        <StatusPillRow
          sentiment={sentiment}
          knowledgeCount={knowledgeSuggestions.length}
          escalationRisk={escalation?.risk_level}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="space-y-6">
            <ManualConversationPanel
              messages={conversationHistory}
              onSendCustomerMessage={sendCustomerMessage}
              onLogAgentReply={logAgentReply}
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
    </div>
  );
}