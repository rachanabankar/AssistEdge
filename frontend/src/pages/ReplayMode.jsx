import { useState } from "react";
import {
  PlayCircle,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Play,
  Pause,
  FileText,
  Calendar,
  Clock,
  MessageSquare,
  Search,
  ArrowRight,
  Inbox,
  Smile,
  Clock3,
  Tag,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
} from "lucide-react";
import SentimentPanel from "../components/coaching/SentimentPanel";
import EscalationPanel from "../components/coaching/EscalationPanel";
import ReplayConversationPanel from "../components/coaching/ReplayConversationPanel";
import { useReplaySession } from "../hooks/useReplaySession";

// Cap the session list so it doesn't scroll indefinitely — same treatment
// as the paginated list on the Reports page.
const SESSIONS_PAGE_SIZE = 8;

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "—";
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) +
    " • " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

// Label for the session row. Falls back to a mode-aware label when
// no scenario was captured (scenario is optional on manual sessions).
function sessionLabel(s) {
  if (s.scenario) return s.scenario;
  if (s.mode === "manual") return "Manual session";
  return "Untitled session";
}

const MODE_META = {
  simulator: {
    label: "Simulator",
    badgeBg: "bg-[#ede9fe]",
    badgeText: "text-[#7c3aed]",
    iconBg: "bg-gradient-to-br from-[#4f46e5] to-[#9333ea]",
    rowTint: "even:bg-[#faf8ff]",
  },
  manual: {
    label: "Manual",
    badgeBg: "bg-[#cffafe]",
    badgeText: "text-[#0e7490]",
    iconBg: "bg-gradient-to-br from-[#06b6d4] to-[#0891b2]",
    rowTint: "even:bg-[#f5fdfd]",
  },
};

function SessionRow({ session, onSelect }) {
  const isEmpty = session.status === "empty";
  const mode =
    MODE_META[session.mode] ?? {
      label: session.mode,
      badgeBg: "bg-gray-50",
      badgeText: "text-gray-500",
      iconBg: "bg-gray-400",
      rowTint: "",
    };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_150px_84px_64px_128px] items-center gap-3 px-3 py-3.5 border-b border-[#f0eefb] last:border-b-0 hover:bg-[#f5f3ff] transition-colors rounded-lg">
      {/* Title + icon */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={`shrink-0 w-9 h-9 rounded-lg ${mode.iconBg} flex items-center justify-center shadow-sm`}>
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[14px] text-[#1e1b3a] truncate">
            {sessionLabel(session)}
          </p>
          <span
            className={`inline-block mt-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${mode.badgeBg} ${mode.badgeText}`}
          >
            {mode.label}
            {isEmpty ? " · empty" : ""}
          </span>
        </div>
      </div>

      {/* Date & time */}
      <div className="flex items-center gap-1.5 text-[12.5px] text-[#6b6690] min-w-0">
        <Calendar className="w-3.5 h-3.5 text-[#a8a3c9] shrink-0" />
        <span className="truncate">{formatDateTime(session.created_at)}</span>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-1.5 text-[12.5px] text-[#6b6690]">
        <Clock className="w-3.5 h-3.5 text-[#a8a3c9] shrink-0" />
        {formatDuration(session.duration_seconds)}
      </div>

      {/* Turns */}
      <div className="flex items-center gap-1.5 text-[12.5px] text-[#6b6690]">
        <MessageSquare className="w-3.5 h-3.5 text-[#a8a3c9] shrink-0" />
        {session.turn_count}
      </div>

      {/* CTA */}
      <button
        onClick={() => !isEmpty && onSelect(session.id)}
        disabled={isEmpty}
        className="justify-self-end flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-semibold text-white
                   bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-md hover:shadow-[#9333ea]/25 transition-all
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        View Session
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function ReplayMode() {
  const {
    sessions,
    sessionsLoading,
    sessionsError,
    selectedSessionId,
    sessionDetail,
    messages,
    loading,
    error,
    selectSession,
    currentTurnIndex,
    currentMessage,
    goFirst,
    goPrev,
    goNext,
    goLast,
    goToTurn,
    isPlaying,
    togglePlay,
    playbackSpeed,
    setPlaybackSpeed,
  } = useReplaySession();

  const [query, setQuery] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [page, setPage] = useState(1);

  const filteredSessions = sessions.filter((s) =>
    sessionLabel(s).toLowerCase().includes(query.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / SESSIONS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedSessions = filteredSessions.slice(
    (safePage - 1) * SESSIONS_PAGE_SIZE,
    safePage * SESSIONS_PAGE_SIZE
  );

  function handleQueryChange(value) {
    setQuery(value);
    setPage(1);
  }

  function handleSelectSession(id) {
    selectSession(id);
    setShowDetail(true);
  }

  // Find the most recent customer message up to and including the current
  // turn, so agent turns still show the last analyzed sentiment/escalation
  // instead of going blank.
  let activeSentiment = null;
  let activeEscalation = null;
  for (let i = currentTurnIndex; i >= 0; i--) {
    if (messages[i]?.sender === "customer") {
      activeSentiment = messages[i].sentiment;
      activeEscalation = messages[i].escalation;
      break;
    }
  }

  // Frustration trend across customer turns played so far.
  const sentimentHistory = messages
    .slice(0, currentTurnIndex + 1)
    .filter((m) => m.sender === "customer" && m.frustration_score != null)
    .map((m, idx) => ({ turn: idx + 1, score: m.frustration_score }));

  const totalTurns = messages.length;
  const hasSession = !!selectedSessionId && !loading;
  const isManualSession = sessionDetail?.mode === "manual";

  // Session-wide highlights — computed over the full transcript, independent
  // of playback position, so they summarize the whole session at a glance.
  const allCustomerFrustrations = messages
    .filter((m) => m.sender === "customer" && m.frustration_score != null)
    .map((m, idx) => ({ turn: idx + 1, score: m.frustration_score }));

  const peakFrustration = allCustomerFrustrations.length
    ? allCustomerFrustrations.reduce((max, cur) => (cur.score > max.score ? cur : max))
    : null;

  const startFrustration = allCustomerFrustrations[0]?.score ?? null;
  const endFrustration =
    allCustomerFrustrations[allCustomerFrustrations.length - 1]?.score ?? null;
  const frustrationDelta =
    startFrustration != null && endFrustration != null
      ? endFrustration - startFrustration
      : null;

  const escalationAlertCount = messages.filter(
    (m) => m.escalation?.risk_level === "high"
  ).length;

  const customerTurnCount = messages.filter((m) => m.sender === "customer").length;
  const agentTurnCount = messages.filter((m) => m.sender === "agent").length;

  return (
    <div className="relative overflow-x-hidden">
      {/* Fixed full-viewport themed background — decoupled from layout flow so it
          can never itself cause horizontal overflow, regardless of parent padding */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(160deg, #ede9fe 0%, #f3f0ff 25%, #f8f7ff 55%, #ecfdf9 100%)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "#EEF0FC" }}
        />
      </div>

      {/* Header — brand gradient banner */}
      <div className="relative overflow-hidden flex items-center justify-between gap-4 mb-6 rounded-2xl p-6 bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#9333ea] shadow-lg shadow-[#9333ea]/25">
        <div className="pointer-events-none absolute -right-8 -top-14 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute right-20 bottom-[-36px] w-28 h-28 rounded-full bg-[#06b6d4]/30 blur-2xl" />

        <div className="relative flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 border border-white/20">
            <PlayCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">Replay Mode</h1>
            <p className="text-white/75 text-sm">
              Review past sessions and analyze conversations turn by turn.
            </p>
          </div>
        </div>
        <span className="relative inline-flex items-center gap-1.5 text-xs font-semibold text-[#7c3aed] bg-white px-3 py-1.5 rounded-full shrink-0 shadow-sm">
          <PlayCircle className="w-3.5 h-3.5" />
          Replay Mode
        </span>
      </div>

      {/* Session selector — the "first page" */}
      {!showDetail && (
        <div className="relative bg-white/90 backdrop-blur rounded-2xl border border-[#e4defb] shadow-lg shadow-[#9333ea]/5 p-6 mb-6 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4f46e5] via-[#9333ea] to-[#06b6d4]" />
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
            <div>
              <h3 className="text-base font-bold text-[#1e1b3a] mb-0.5">Select a completed session</h3>
              <p className="text-sm text-[#6b6690]">Choose a previous session to replay</p>
            </div>

            {!sessionsLoading && !sessionsError && sessions.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9333ea]" />
                <input
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Search sessions..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#e4defb] bg-[#f5f3ff] text-sm text-[#1e1b3a]
                             placeholder:text-[#a89ce0] focus:outline-none focus:ring-2 focus:ring-[#9333ea]/40 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {sessionsLoading && <p className="text-sm text-gray-400">Loading sessions...</p>}
          {sessionsError && (
            <p className="text-sm text-red-500">Failed to load sessions. Please refresh.</p>
          )}

          {!sessionsLoading && !sessionsError && sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 rounded-full bg-[#f3f2fb] flex items-center justify-center mb-3">
                <Inbox className="w-5 h-5 text-[#b3affd]" />
              </div>
              <p className="text-sm text-[#8b87a8]">No completed sessions yet.</p>
            </div>
          )}

          {!sessionsLoading && !sessionsError && sessions.length > 0 && (
            <>
              {/* Column headers */}
              <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_150px_84px_64px_128px] gap-3 px-3 pb-2 mb-1 border-b border-[#ece7fa] text-[11px] font-bold text-[#9b95c9] uppercase tracking-wide">
                <span>Session</span>
                <span>Date &amp; Time</span>
                <span>Duration</span>
                <span>Turns</span>
                <span></span>
              </div>

              {filteredSessions.length > 0 ? (
                <>
                  <div>
                    {pagedSessions.map((s) => (
                      <SessionRow key={s.id} session={s} onSelect={handleSelectSession} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#ece7fa]">
                      <p className="text-xs text-[#9b95c9]">
                        Showing {(safePage - 1) * SESSIONS_PAGE_SIZE + 1}–
                        {Math.min(safePage * SESSIONS_PAGE_SIZE, filteredSessions.length)} of{" "}
                        {filteredSessions.length} sessions
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={safePage === 1}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#7c3aed]
                                     hover:bg-[#f5f3ff] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                          <button
                            key={n}
                            onClick={() => setPage(n)}
                            className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors ${
                              safePage === n
                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-[#9333ea]/25"
                                : "text-[#6b6690] hover:bg-[#f5f3ff]"
                            }`}
                          >
                            {n}
                          </button>
                        ))}

                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={safePage === totalPages}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#7c3aed]
                                     hover:bg-[#f5f3ff] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#f3f2fb] flex items-center justify-center mb-3">
                    <Inbox className="w-5 h-5 text-[#b3affd]" />
                  </div>
                  <p className="text-sm text-[#8b87a8]">No sessions match "{query}"</p>
                </div>
              )}
            </>
          )}

          {error && <p className="text-sm text-red-500 mt-3">Failed to load this session's data.</p>}
        </div>
      )}

      {/* Session detail — the "next page" */}
      {showDetail && (
        <div className="relative mb-6">
          <button
            onClick={() => setShowDetail(false)}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#7c3aed] hover:text-[#4f46e5] mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to sessions
          </button>

          {loading && <p className="text-sm text-gray-400 mb-6">Loading session...</p>}
        </div>
      )}

      {showDetail && hasSession && messages.length > 0 && (
        <>
          {/* Session Overview — full width, directly under selector */}
          <div className="relative mb-6 bg-white rounded-2xl shadow-sm overflow-hidden">
            <div
              className="flex items-center gap-2.5 px-6 py-4"
              style={{
                background: "linear-gradient(90deg, #eef2ff 0%, #f5f3ff 55%, #ffffff 100%)",
                borderBottom: "1px solid #f0f1f5",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
              <h3 className="text-xs font-bold text-[#7c3aed] uppercase tracking-wide">
                Session Overview
              </h3>
            </div>
            <div className="p-6">
            {isManualSession ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2 md:col-span-1 rounded-xl p-4" style={{ background: "#fff7ed", border: "1px solid #fde3c4" }}>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#ea580c" }}>
                      <FileText className="w-3.5 h-3.5" />
                      Scenario
                    </div>
                    <p className="text-sm font-semibold leading-snug" style={{ color: "#ea580c" }}>
                      {sessionDetail?.scenario || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "#ecfeff", border: "1px solid #bdeefc" }}>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#0891b2" }}>
                      <Tag className="w-3.5 h-3.5" />
                      Product Context
                    </div>
                    <p className="text-base font-bold" style={{ color: "#0891b2" }}>
                      {sessionDetail?.product_context || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "#fdf2f8", border: "1px solid #fbcfe8" }}>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#db2777" }}>
                      <MessageSquare className="w-3.5 h-3.5" />
                      Total Turns
                    </div>
                    <p className="text-base font-bold" style={{ color: "#db2777" }}>{sessionDetail?.turn_count ?? "—"}</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "#f5f6ff", border: "1px solid #e6e8ff" }}>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#4f46e5" }}>
                      <Clock className="w-3.5 h-3.5" />
                      Duration
                    </div>
                    <p className="text-base font-bold font-mono" style={{ color: "#4f46e5" }}>
                      {formatDuration(sessionDetail?.duration_seconds)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="col-span-2 md:col-span-1 rounded-xl p-4" style={{ background: "#fff7ed", border: "1px solid #fde3c4" }}>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#ea580c" }}>
                      <FileText className="w-3.5 h-3.5" />
                      Scenario
                    </div>
                    <p className="text-sm font-semibold leading-snug" style={{ color: "#ea580c" }}>
                      {sessionDetail?.scenario || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#dc2626" }}>
                      <Smile className="w-3.5 h-3.5" />
                      Customer Tone
                    </div>
                    <p className="text-base font-bold" style={{ color: "#dc2626" }}>{sessionDetail?.customer_tone || "—"}</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "#f5f3ff", border: "1px solid #ddd6fe" }}>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#7c3aed" }}>
                      <Clock3 className="w-3.5 h-3.5" />
                      Patience Level
                    </div>
                    <p className="text-base font-bold" style={{ color: "#7c3aed" }}>{sessionDetail?.patience_level || "—"}</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "#fdf2f8", border: "1px solid #fbcfe8" }}>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#db2777" }}>
                      <MessageSquare className="w-3.5 h-3.5" />
                      Total Turns
                    </div>
                    <p className="text-base font-bold" style={{ color: "#db2777" }}>{sessionDetail?.turn_count ?? "—"}</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "#f5f6ff", border: "1px solid #e6e8ff" }}>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#4f46e5" }}>
                      <Clock className="w-3.5 h-3.5" />
                      Duration
                    </div>
                    <p className="text-base font-bold font-mono" style={{ color: "#4f46e5" }}>
                      {formatDuration(sessionDetail?.duration_seconds)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Turn stepper */}
          <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            <div
              className="px-6 pt-5 pb-4"
              style={{
                background: "linear-gradient(90deg, #eef2ff 0%, #f5f3ff 55%, #ffffff 100%)",
                borderBottom: "1px solid #f0f1f5",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold" style={{ color: "#1e1b3a" }}>
                    Turn {currentTurnIndex + 1} of {totalTurns}
                  </p>
                  <p className="text-xs" style={{ color: "#8b87a8" }}>Reviewing turn by turn</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    className="text-xs border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ borderColor: "#e0e4ff", color: "#4f46e5" }}
                  >
                    <option value={1000}>1s / turn</option>
                    <option value={2000}>2s / turn</option>
                    <option value={3000}>3s / turn</option>
                    <option value={5000}>5s / turn</option>
                  </select>
                  <button
                    onClick={togglePlay}
                    disabled={currentTurnIndex >= totalTurns - 1 && !isPlaying}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600
                               text-white text-xs font-semibold px-3 py-1.5 hover:opacity-90 transition-opacity
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" /> Auto-Play
                      </>
                    )}
                  </button>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={Math.max(totalTurns - 1, 0)}
                value={currentTurnIndex}
                onChange={(e) => goToTurn(Number(e.target.value))}
                className="w-full accent-[#7c3aed]"
              />
            </div>

            <div className="flex items-center gap-2 px-6 py-4">
              <button
                onClick={goFirst}
                disabled={currentTurnIndex === 0}
                className="flex items-center gap-1 rounded-lg text-xs font-semibold
                           px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#f5f6ff", color: "#4f46e5", border: "1px solid #e6e8ff" }}
              >
                <ChevronsLeft className="w-3.5 h-3.5" /> First
              </button>
              <button
                onClick={goPrev}
                disabled={currentTurnIndex === 0}
                className="flex items-center gap-1 rounded-lg text-xs font-semibold
                           px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#f5f6ff", color: "#4f46e5", border: "1px solid #e6e8ff" }}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                onClick={goNext}
                disabled={currentTurnIndex >= totalTurns - 1}
                className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold
                           px-3 py-2 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={goLast}
                disabled={currentTurnIndex >= totalTurns - 1}
                className="flex items-center gap-1 rounded-lg text-xs font-semibold
                           px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#f5f6ff", color: "#4f46e5", border: "1px solid #e6e8ff" }}
              >
                Last <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Main grid — transcript left, sentiment/escalation right */}
          <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 min-w-0 space-y-6">
              <ReplayConversationPanel messages={messages} currentTurnIndex={currentTurnIndex} />

              {/* Session Highlights — summary stats derived from the full transcript */}
              <div className="relative bg-white rounded-2xl shadow-sm p-6 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4f46e5] via-[#9333ea] to-[#06b6d4]" />
                <div className="flex items-center gap-2 mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
                  <h3 className="text-xs font-bold text-[#7c3aed] uppercase tracking-wide">
                    Session Highlights
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wide mb-0.5">
                          Peak Frustration
                        </p>
                        <p className="text-base font-bold text-gray-900">
                          {peakFrustration ? `${peakFrustration.score} / 100` : "—"}
                        </p>
                        {peakFrustration && (
                          <p className="text-xs text-red-500/80">at turn {peakFrustration.turn}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`rounded-xl border p-4 ${
                      frustrationDelta != null && frustrationDelta < 0
                        ? "border-emerald-100 bg-emerald-50"
                        : "border-purple-100 bg-purple-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                        {frustrationDelta != null && frustrationDelta < 0 ? (
                          <TrendingDown className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-purple-500" />
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-[11px] font-semibold uppercase tracking-wide mb-0.5 ${
                            frustrationDelta != null && frustrationDelta < 0
                              ? "text-emerald-500"
                              : "text-purple-500"
                          }`}
                        >
                          Frustration Trend
                        </p>
                        <p className="text-base font-bold text-gray-900">
                          {frustrationDelta != null
                            ? `${frustrationDelta > 0 ? "+" : ""}${frustrationDelta}`
                            : "—"}
                        </p>
                        {startFrustration != null && endFrustration != null && (
                          <p
                            className={`text-xs ${
                              frustrationDelta != null && frustrationDelta < 0
                                ? "text-emerald-500/80"
                                : "text-purple-500/80"
                            }`}
                          >
                            {startFrustration} → {endFrustration}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-wide mb-0.5">
                          Escalation Alerts
                        </p>
                        <p className="text-base font-bold text-gray-900">{escalationAlertCount}</p>
                        <p className="text-xs text-amber-500/80">high-risk turns</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                        <Users className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wide mb-0.5">
                          Turn Split
                        </p>
                        <p className="text-base font-bold text-gray-900">
                          {customerTurnCount} / {agentTurnCount}
                        </p>
                        <p className="text-xs text-indigo-500/80">customer / agent</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 min-w-0">
              <SentimentPanel sentiment={activeSentiment} sentimentHistory={sentimentHistory} />
              <EscalationPanel escalation={activeEscalation} />
            </div>
          </div>
        </>
      )}

      {showDetail && hasSession && messages.length === 0 && (
        <p className="relative text-sm text-gray-400">This session has no recorded turns to replay.</p>
      )}
    </div>
  );
}