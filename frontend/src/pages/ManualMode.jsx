import { useState, useEffect } from "react";

import {
  ClipboardList,
  Play,
  Square,
  PenLine,
  Clock3,
  Zap,
  Sparkles,
  Home,
  MessageCircle,
  Package,
  ClipboardPaste,
  Lightbulb,
  BookOpen,
  ShieldAlert,
  HeartPulse,
} from "lucide-react";

import StatusPillRow from "../components/coaching/StatusPillRow";
import ManualConversationPanel from "../components/coaching/ManualConversationPanel";
import SentimentPanel from "../components/coaching/SentimentPanel";
import KnowledgeBasePanel from "../components/coaching/KnowledgeBasePanel";
import CoachingPanel from "../components/coaching/CoachingPanel";
import EscalationPanel from "../components/coaching/EscalationPanel";

import { useManualSession } from "../hooks/useManualSession";

const SCENARIO_MAX = 500;
const CONTEXT_MAX = 300;
const META_LABEL_CLASS = "text-[10.5px] font-bold uppercase tracking-wider mb-1";
const DISPLAY_TITLE_CLASS = "manual-display text-base font-bold";

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const FIELD_CLASS = `
  w-full rounded-xl border border-gray-200 bg-white
  pl-11 pr-4 py-3.5
  text-sm text-gray-700 placeholder:text-gray-400
  shadow-sm resize-none transition-all
  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
`;

const HOW_IT_WORKS = [
  {
    icon: ClipboardList,
    title: "Provide context",
    description: "Describe the customer scenario and product information.",
  },
  {
    icon: Play,
    title: "Start your session",
    description: "Initialize your manual coaching session.",
  },
  {
    icon: ClipboardPaste,
    title: "Enter customer messages",
    description: "Paste actual customer messages into the conversation panel.",
  },
  {
    icon: Lightbulb,
    title: "Receive AI coaching",
    description: "Get live suggestions, sentiment insights and risk alerts.",
  },
];

const CAPABILITIES = [
  { icon: Zap, label: "Response suggestions" },
  { icon: HeartPulse, label: "Customer sentiment analysis" },
  { icon: BookOpen, label: "Knowledge base recommendations" },
  { icon: ShieldAlert, label: "Escalation risk monitoring" },
];

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

  // Session timer
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

  // =========================================================
  // STATE 1: SESSION SETUP  (mirrors Simulator Mode layout)
  // =========================================================

  if (!sessionId) {
    return (
      <div className="h-full min-h-0 w-full bg-[#EEF0FC] overflow-y-auto xl:overflow-hidden">
        <div className="mx-auto max-w-[1400px] min-h-full xl:h-full flex flex-col px-4 sm:px-6 xl:px-8 py-4">

          {/* ---------- Page header ---------- */}
          <header className="flex items-center gap-4 shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
              <PenLine className="w-7 h-7 text-indigo-600" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[0.25em] text-purple-700 uppercase">
                Manual Mode
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                Manual Mode
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">
                Get real-time AI coaching while handling live customer
                conversations from another channel.
              </p>
            </div>
          </header>

          {/* ---------- Breadcrumb ---------- */}
          <nav className="flex items-center gap-2 text-sm py-3 shrink-0">
            <Home className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-gray-300">›</span>
            <span className="font-semibold text-purple-700">Manual Mode</span>
            <span className="text-gray-300">›</span>
            <span className="text-gray-500">Session Setup</span>
          </nav>

          {/* ---------- Main grid ---------- */}
          <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5 xl:flex-1 xl:min-h-0 pb-1">

            {/* ===== LEFT: Session form ===== */}
            <section className="bg-white rounded-2xl border border-indigo-100 shadow-sm flex flex-col min-h-0 overflow-hidden">

              <div className="flex items-center gap-3.5 px-6 sm:px-8 py-4 border-b border-gray-100 shrink-0">
                <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900">Session Details</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Provide context to improve coaching and knowledge matching.
                  </p>
                </div>
              </div>

              {/* Body: fields stretch to fill the available height */}
              <div className="flex-1 min-h-0 flex flex-col gap-4 px-6 sm:px-8 py-5">

                {/* Scenario */}
                <div className="flex flex-col flex-1 min-h-[130px]">
                  <div className="flex items-center justify-between mb-2 shrink-0">
                    <label className="text-sm font-semibold text-gray-900">
                      Scenario
                      <span className="text-gray-400 font-normal ml-1.5">(optional)</span>
                    </label>
                    <span className="text-xs text-gray-400">
                      {scenario.length}/{SCENARIO_MAX}
                    </span>
                  </div>

                  <div className="relative flex-1 min-h-0">
                    <MessageCircle className="absolute left-4 top-4 w-[18px] h-[18px] text-gray-400 pointer-events-none" />
                    <textarea
                      value={scenario}
                      maxLength={SCENARIO_MAX}
                      onChange={(e) => setScenario(e.target.value.slice(0, SCENARIO_MAX))}
                      placeholder="e.g. Customer requesting a refund for a damaged item received two weeks ago"
                      className={`${FIELD_CLASS} h-full`}
                    />
                  </div>

                  <p className="text-xs text-gray-400 mt-1.5 shrink-0">
                    Briefly describe the customer's issue and what they need help with.
                  </p>
                </div>

                {/* Product Context */}
                <div className="flex flex-col flex-1 min-h-[130px]">
                  <div className="flex items-center justify-between mb-2 shrink-0">
                    <label className="text-sm font-semibold text-gray-900">
                      Product Context
                      <span className="text-gray-400 font-normal ml-1.5">(optional)</span>
                    </label>
                    <span className="text-xs text-gray-400">
                      {productContext.length}/{CONTEXT_MAX}
                    </span>
                  </div>

                  <div className="relative flex-1 min-h-0">
                    <Package className="absolute left-4 top-4 w-[18px] h-[18px] text-gray-400 pointer-events-none" />
                    <textarea
                      value={productContext}
                      maxLength={CONTEXT_MAX}
                      onChange={(e) => setProductContext(e.target.value.slice(0, CONTEXT_MAX))}
                      placeholder="e.g. Online shopping app, order ID, product type, return policy"
                      className={`${FIELD_CLASS} h-full`}
                    />
                  </div>

                  <p className="text-xs text-gray-400 mt-1.5 shrink-0">
                    Add relevant product or policy information.
                  </p>
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 shrink-0">
                    {error}
                  </p>
                )}

                {/* Start */}
                <div className="shrink-0">
                  <button
                    onClick={handleStart}
                    disabled={isLoading}
                    className="
                      w-full flex items-center justify-center gap-2.5
                      rounded-xl py-3.5 px-6
                      bg-gradient-to-r from-indigo-600 to-purple-600
                      text-white font-semibold text-base
                      hover:shadow-lg hover:shadow-purple-500/25 hover:brightness-105
                      transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {isLoading ? "Starting Session..." : "Start Session"}
                    {!isLoading && <Play className="w-4 h-4 fill-white" />}
                  </button>

                  <p className="text-center text-xs text-gray-400 mt-2">
                    You can provide additional context later through the conversation.
                  </p>
                </div>
              </div>
            </section>

            {/* ===== RIGHT: Info panel ===== */}
            <aside className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-4 flex flex-col gap-3 min-h-0 overflow-hidden">

              <div className="shrink-0">
                <p className="text-[11px] font-bold tracking-[0.2em] text-purple-700 uppercase">
                  Coach live conversations
                </p>
                <h3 className="text-lg font-extrabold text-gray-900 mt-0.5">
                  Handle real chats with confidence
                </h3>
              </div>

              

              {/* How it works */}
              <div className="flex-1 min-h-0 flex flex-col">
                <h4 className="text-sm font-bold text-gray-900 mb-2.5 shrink-0">
                  How it works
                </h4>

                <div className="flex-1 min-h-0 flex flex-col gap-2">
                  {HOW_IT_WORKS.map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div
                        key={step.title}
                        className="flex-1 min-h-0 flex items-center gap-3 rounded-xl bg-indigo-50/60 px-3.5"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                          <Icon className="w-[18px] h-[18px] text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-800 leading-tight">
                            <span className="text-indigo-400 mr-1.5">0{i + 1}</span>
                            {step.title}
                          </p>
                          <p className="text-xs text-gray-500 leading-snug truncate">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Capabilities */}
              <div className="rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 p-3.5 text-white shadow-md shadow-purple-500/15 shrink-0">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold">AI coaching capabilities</h4>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  {CAPABILITIES.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-white/95">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="leading-snug">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // STATE 2: ACTIVE SESSION (original look, compacted)
  // =========================================================

  return (
    <div className="min-h-full w-full bg-[#EEF0FC]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        .manual-display {
          font-family: 'Sora', 'Inter', sans-serif;
          letter-spacing: -0.01em;
        }
      `}</style>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 xl:px-8 py-4">

        {/* ---------- Gradient header ---------- */}
        <div className="relative overflow-hidden flex items-center justify-between gap-4 mb-4 rounded-2xl px-5 py-3.5 bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#9333ea] shadow-lg shadow-[#9333ea]/25">
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

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {/* ---------- Current Session card ---------- */}
        <div
          className="rounded-2xl overflow-hidden mb-4"
          style={{
            background: "#fff",
            border: "1px solid #f0f1f8",
            boxShadow: "0 5px 20px rgba(44,43,92,0.06)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{
              background: "linear-gradient(90deg, #eef2ff 0%, #f5f3ff 55%, #ffffff 100%)",
              borderBottom: "1px solid #f0f1f5",
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "#4f46e5" }} />
              <h3 className={DISPLAY_TITLE_CLASS} style={{ color: "#10162f" }}>
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

          <div className="p-4">
            <div className="grid grid-cols-2 xl:grid-cols-[0.7fr_1.5fr_1.5fr_0.9fr] gap-3 mb-3">
              <div className="rounded-xl px-4 py-3" style={{ background: "#f5f6ff", border: "1px solid #e6e8ff" }}>
                <p className={META_LABEL_CLASS} style={{ color: "#4f46e5" }}>
                  Mode
                </p>
                <p className={DISPLAY_TITLE_CLASS} style={{ color: "#4f46e5" }}>
                  Manual
                </p>
              </div>

              <div className="rounded-xl px-4 py-3 min-w-0" style={{ background: "#fff7ed", border: "1px solid #fde3c4" }}>
                <p className={META_LABEL_CLASS} style={{ color: "#ea580c" }}>
                  Scenario
                </p>
                <p title={scenario} className="text-sm leading-5 font-semibold line-clamp-2" style={{ color: "#ea580c" }}>
                  {scenario || "—"}
                </p>
              </div>

              <div className="rounded-xl px-4 py-3 min-w-0" style={{ background: "#ecfeff", border: "1px solid #bdeefc" }}>
                <p className={META_LABEL_CLASS} style={{ color: "#0891b2" }}>
                  Product Context
                </p>
                <p title={productContext} className="text-sm leading-5 font-semibold line-clamp-2" style={{ color: "#0891b2" }}>
                  {productContext || "—"}
                </p>
              </div>

              <div className="rounded-xl px-4 py-3" style={{ background: "#fdf2f8", border: "1px solid #fbcfe8" }}>
                <p className={META_LABEL_CLASS} style={{ color: "#db2777" }}>
                  Started At
                </p>
                <p className={DISPLAY_TITLE_CLASS} style={{ color: "#db2777" }}>
                  {startedAt ? startedAt.toLocaleTimeString() : "—"}
                </p>
              </div>
            </div>

            {/* Duration and End Session */}
            <div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl px-4 py-3"
              style={{
                background: "linear-gradient(90deg, #eef2ff 0%, #f5f3ff 100%)",
                border: "1px solid #e0e4ff",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white"
                  style={{ boxShadow: "0 4px 10px rgba(79,70,229,0.12)" }}
                >
                  <Clock3 className="w-5 h-5" style={{ color: "#4f46e5" }} />
                </div>

                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "#7c7ff0" }}>
                    Duration
                  </p>
                  <p className="manual-display text-xl font-extrabold tracking-tight leading-tight" style={{ color: "#4f46e5" }}>
                    {formatDuration(elapsed)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap min-w-0">
                <span
                  title={String(sessionId)}
                  className="text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-white truncate max-w-[300px]"
                  style={{ color: "#7a8198", border: "1px solid #e0e4ff" }}
                >
                  Session: {sessionId}
                </span>

                <button
                  onClick={handleEndSession}
                  className="flex items-center gap-2 rounded-lg text-sm font-semibold px-4 py-2.5 transition-colors hover:brightness-95"
                  style={{
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                  }}
                >
                  <Square className="w-3.5 h-3.5" style={{ fill: "#dc2626" }} />
                  End Session
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Status pills ---------- */}
        <StatusPillRow
          sentiment={sentiment}
          knowledgeCount={knowledgeSuggestions.length}
          escalationRisk={escalation?.risk_level}
        />

        {/* ---------- Conversation + analysis panels ---------- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4 items-start">
          <div className="space-y-5 min-w-0">
            <ManualConversationPanel
              messages={conversationHistory}
              onSendCustomerMessage={sendCustomerMessage}
              onLogAgentReply={logAgentReply}
              isLoading={isLoading}
            />

            <CoachingPanel coaching={coaching} />
          </div>

          <div className="space-y-5 min-w-0">
            <SentimentPanel
              sentiment={sentiment}
              sentimentHistory={sentimentHistory}
            />

            <EscalationPanel escalation={escalation} />

            <KnowledgeBasePanel sessionId={sessionId} />
          </div>
        </div>
      </div>
    </div>
  );
}