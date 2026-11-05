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
  Eye,
  EyeOff,
} from "lucide-react";
import SentimentPanel from "../components/coaching/SentimentPanel";
import EscalationPanel from "../components/coaching/EscalationPanel";
import ReplayConversationPanel from "../components/coaching/ReplayConversationPanel";
import { useReplaySession } from "../hooks/useReplaySession";

const SESSIONS_PAGE_SIZE = 8;
const META_ICON_CLASS = "w-3.5 h-3.5 text-[#a8a3c9] shrink-0";
const NAV_BUTTON_CLASS = "flex items-center gap-1 rounded-lg text-xs font-semibold px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

// Single source of truth for the session-row grid so the header and rows
// always line up.
const ROW_GRID =
  "sm:grid-cols-[minmax(0,1fr)_180px_84px_64px_140px]";

const CARD_CLASS =
  "relative bg-white rounded-2xl border border-[#d9d2f7] shadow-lg shadow-[#7c3aed]/10 overflow-hidden";

const CARD_HEADER_STYLE = {
  background: "linear-gradient(90deg, #ffffff 0%, #f8f7ff 60%, #f3f0ff 100%)",
  borderBottom: "1px solid #ece7fa",
};

function AccentBar() {
  return (
    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4f46e5] via-[#9333ea] to-[#06b6d4]" />
  );
}

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
  },
  manual: {
    label: "Manual",
    badgeBg: "bg-[#cffafe]",
    badgeText: "text-[#0e7490]",
    iconBg: "bg-gradient-to-br from-[#06b6d4] to-[#0891b2]",
  },
};

const FALLBACK_MODE = {
  label: "Session",
  badgeBg: "bg-gray-100",
  badgeText: "text-gray-500",
  iconBg: "bg-gray-400",
};

function SessionRow({ session, onSelect }) {
  const isEmpty = session.status === "empty";
  const mode = MODE_META[session.mode] ?? { ...FALLBACK_MODE, label: session.mode };

  return (
    <div
      className={`grid grid-cols-1 ${ROW_GRID} items-center gap-x-4 gap-y-2 px-4 py-3.5 rounded-xl
                  border border-transparent transition-all
                  hover:bg-[#f5f3ff] hover:border-[#e4defb] ${isEmpty ? "opacity-60" : ""}`}
    >
      {/* Title + icon */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`shrink-0 w-10 h-10 rounded-xl ${mode.iconBg} flex items-center justify-center shadow-sm`}
        >
          <FileText className="w-[18px] h-[18px] text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[14px] text-[#1e1b3a] truncate" title={sessionLabel(session)}>
            {sessionLabel(session)}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${mode.badgeBg} ${mode.badgeText}`}
            >
              {mode.label}
            </span>
            {isEmpty && (
              <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                No turns
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Date & time */}
      <div className="flex items-center gap-1.5 text-[12.5px] text-[#6b6690] min-w-0 pl-[52px] sm:pl-0">
        <Calendar className={META_ICON_CLASS} />
        <span className="truncate">{formatDateTime(session.created_at)}</span>
      </div>

      {/* Duration */}
      <div className="hidden sm:flex items-center gap-1.5 text-[12.5px] text-[#6b6690] font-mono">
        <Clock className={META_ICON_CLASS} />
        {formatDuration(session.duration_seconds)}
      </div>

      {/* Turns */}
      <div className="hidden sm:flex items-center gap-1.5 text-[12.5px] text-[#6b6690]">
        <MessageSquare className={META_ICON_CLASS} />
        {session.turn_count}
      </div>

      {/* CTA */}
      <button
        onClick={() => !isEmpty && onSelect(session.id)}
        disabled={isEmpty}
        className="justify-self-start sm:justify-self-end flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg
                   text-[12.5px] font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600
                   hover:shadow-md hover:shadow-[#9333ea]/25 transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
      >
        View Session
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
        active
          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-sm shadow-[#9333ea]/25"
          : "bg-white text-[#6b6690] border-[#e4defb] hover:bg-[#f5f3ff]"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-12 h-12 rounded-full bg-[#f3f2fb] flex items-center justify-center mb-3">
        <Inbox className="w-5 h-5 text-[#b3affd]" />
      </div>
      <p className="text-sm text-[#8b87a8]">{message}</p>
    </div>
  );
}

function OverviewTile({ icon: Icon, label, value, color, bg, border, mono, wide }) {
  return (
    <div
      className={`rounded-xl p-4 ${wide ? "col-span-2 md:col-span-1" : ""}`}
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-1.5"
        style={{ color }}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p
        className={`${wide ? "text-sm font-semibold leading-snug" : "text-base font-bold"} ${
          mono ? "font-mono" : ""
        } break-words`}
        style={{ color }}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function HighlightCard({ icon: Icon, label, value, sub, tone }) {
  const tones = {
    red: { box: "border-red-100 bg-red-50", label: "text-red-500", sub: "text-red-500/80", icon: "text-red-500" },
    green: { box: "border-emerald-100 bg-emerald-50", label: "text-emerald-600", sub: "text-emerald-600/80", icon: "text-emerald-600" },
    purple: { box: "border-purple-100 bg-purple-50", label: "text-purple-500", sub: "text-purple-500/80", icon: "text-purple-500" },
    amber: { box: "border-amber-100 bg-amber-50", label: "text-amber-600", sub: "text-amber-600/80", icon: "text-amber-500" },
    indigo: { box: "border-indigo-100 bg-indigo-50", label: "text-indigo-500", sub: "text-indigo-500/80", icon: "text-indigo-600" },
  }[tone];

  return (
    <div className={`rounded-xl border p-4 ${tones.box}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
          <Icon className={`w-4 h-4 ${tones.icon}`} />
        </div>
        <div className="min-w-0">
          <p className={`text-[11px] font-semibold uppercase tracking-wide mb-0.5 ${tones.label}`}>
            {label}
          </p>
          <p className="text-base font-bold text-gray-900">{value}</p>
          {sub && <p className={`text-xs ${tones.sub}`}>{sub}</p>}
        </div>
      </div>
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
  const [modeFilter, setModeFilter] = useState("all");
  const [showEmpty, setShowEmpty] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [page, setPage] = useState(1);

  const emptyCount = sessions.filter((s) => s.status === "empty").length;
  const replayableCount = sessions.length - emptyCount;

  // Empty sessions have nothing to replay, so they're hidden unless asked for.
  const filteredSessions = sessions.filter((s) => {
    if (!showEmpty && s.status === "empty") return false;
    if (modeFilter !== "all" && s.mode !== modeFilter) return false;
    return sessionLabel(s).toLowerCase().includes(query.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / SESSIONS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedSessions = filteredSessions.slice(
    (safePage - 1) * SESSIONS_PAGE_SIZE,
    safePage * SESSIONS_PAGE_SIZE
  );

  function resetPageAnd(fn) {
    return (value) => {
      fn(value);
      setPage(1);
    };
  }
  const handleQueryChange = resetPageAnd(setQuery);
  const handleModeFilter = resetPageAnd(setModeFilter);

  function handleSelectSession(id) {
    selectSession(id);
    setShowDetail(true);
  }

  // Most recent customer message up to the current turn, so agent turns
  // still show the last analyzed sentiment/escalation instead of going blank.
  let activeSentiment = null;
  let activeEscalation = null;
  for (let i = currentTurnIndex; i >= 0; i--) {
    if (messages[i]?.sender === "customer") {
      activeSentiment = messages[i].sentiment;
      activeEscalation = messages[i].escalation;
      break;
    }
  }

  const sentimentHistory = messages
    .slice(0, currentTurnIndex + 1)
    .filter((m) => m.sender === "customer" && m.frustration_score != null)
    .map((m, idx) => ({ turn: idx + 1, score: m.frustration_score }));

  const totalTurns = messages.length;
  const hasSession = !!selectedSessionId && !loading;
  const isManualSession = sessionDetail?.mode === "manual";

  // Session-wide highlights — independent of playback position.
  const allCustomerFrustrations = messages
    .filter((m) => m.sender === "customer" && m.frustration_score != null)
    .map((m, idx) => ({ turn: idx + 1, score: m.frustration_score }));

  const peakFrustration = allCustomerFrustrations.length
    ? allCustomerFrustrations.reduce((max, cur) => (cur.score > max.score ? cur : max))
    : null;

  const startFrustration = allCustomerFrustrations[0]?.score ?? null;
  const endFrustration = allCustomerFrustrations[allCustomerFrustrations.length - 1]?.score ?? null;
  const frustrationDelta =
    startFrustration != null && endFrustration != null ? endFrustration - startFrustration : null;
  const improving = frustrationDelta != null && frustrationDelta < 0;

  const escalationAlertCount = messages.filter((m) => m.escalation?.risk_level === "high").length;
  const customerTurnCount = messages.filter((m) => m.sender === "customer").length;
  const agentTurnCount = messages.filter((m) => m.sender === "agent").length;

  const secondaryBtnStyle = {
    background: "#f5f6ff",
    color: "#4f46e5",
    border: "1px solid #e6e8ff",
  };

  return (
    <div className="relative min-h-full overflow-x-hidden p-4 sm:p-6">
      {/* Themed page background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(160deg, #e4e0fa 0%, #ebe8fc 45%, #e8eefb 75%, #e3f3ef 100%)",
        }}
      />

      <div className="relative max-w-[1400px] mx-auto">
        {/* Header banner */}
        <div className="relative overflow-hidden flex items-center justify-between gap-4 mb-6 rounded-2xl p-6 bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#9333ea] shadow-lg shadow-[#9333ea]/25">
          <div className="pointer-events-none absolute -right-8 -top-14 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute right-20 bottom-[-36px] w-28 h-28 rounded-full bg-[#06b6d4]/30 blur-2xl" />

          <div className="relative flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 border border-white/20">
              <PlayCircle className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white leading-tight">Replay Mode</h1>
              <p className="text-white/75 text-sm">
                Review past sessions and analyze conversations turn by turn.
              </p>
            </div>
          </div>

          {!sessionsLoading && !sessionsError && (
            <div className="relative hidden md:flex items-center gap-3 shrink-0">
              <div className="rounded-xl bg-white/15 border border-white/20 backdrop-blur px-4 py-2 text-center">
                <p className="text-lg font-bold text-white leading-none">{replayableCount}</p>
                <p className="text-[11px] text-white/75 mt-1">Replayable</p>
              </div>
              <div className="rounded-xl bg-white/15 border border-white/20 backdrop-blur px-4 py-2 text-center">
                <p className="text-lg font-bold text-white leading-none">{sessions.length}</p>
                <p className="text-[11px] text-white/75 mt-1">Total sessions</p>
              </div>
            </div>
          )}
        </div>

        {/* Session selector */}
        {!showDetail && (
          <div className={`${CARD_CLASS} p-6 mb-6`}>
            <AccentBar />

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-[#1e1b3a] mb-0.5">
                  Select a completed session
                </h3>
                <p className="text-sm text-[#6b6690]">Choose a previous session to replay</p>
              </div>

              {!sessionsLoading && !sessionsError && sessions.length > 0 && (
                <div className="relative w-full lg:w-72">
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

            {/* Filters */}
            {!sessionsLoading && !sessionsError && sessions.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-[#ece7fa]">
                <div className="flex items-center gap-2">
                  <FilterChip active={modeFilter === "all"} onClick={() => handleModeFilter("all")}>
                    All
                  </FilterChip>
                  <FilterChip
                    active={modeFilter === "simulator"}
                    onClick={() => handleModeFilter("simulator")}
                  >
                    Simulator
                  </FilterChip>
                  <FilterChip
                    active={modeFilter === "manual"}
                    onClick={() => handleModeFilter("manual")}
                  >
                    Manual
                  </FilterChip>
                </div>

                {emptyCount > 0 && (
                  <button
                    onClick={() => {
                      setShowEmpty((v) => !v);
                      setPage(1);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#6b6690] hover:text-[#7c3aed] transition-colors"
                  >
                    {showEmpty ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showEmpty ? "Hide" : "Show"} {emptyCount} empty session
                    {emptyCount === 1 ? "" : "s"}
                  </button>
                )}
              </div>
            )}

            {sessionsLoading && <p className="text-sm text-gray-400">Loading sessions...</p>}
            {sessionsError && (
              <p className="text-sm text-red-500">Failed to load sessions. Please refresh.</p>
            )}

            {!sessionsLoading && !sessionsError && sessions.length === 0 && (
              <EmptyState message="No completed sessions yet." />
            )}

            {!sessionsLoading && !sessionsError && sessions.length > 0 && (
              <>
                {/* Column headers */}
                <div
                  className={`hidden sm:grid ${ROW_GRID} gap-x-4 px-4 pb-2 text-[11px] font-bold text-[#9b95c9] uppercase tracking-wide`}
                >
                  <span>Session</span>
                  <span>Date &amp; Time</span>
                  <span>Duration</span>
                  <span>Turns</span>
                  <span></span>
                </div>

                {filteredSessions.length > 0 ? (
                  <>
                    <div className="space-y-1">
                      {pagedSessions.map((s) => (
                        <SessionRow key={s.id} session={s} onSelect={handleSelectSession} />
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-[#ece7fa]">
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
                  <EmptyState
                    message={
                      query
                        ? `No sessions match "${query}"`
                        : "No sessions to show with these filters."
                    }
                  />
                )}
              </>
            )}

            {error && (
              <p className="text-sm text-red-500 mt-3">Failed to load this session's data.</p>
            )}
          </div>
        )}

        {/* Session detail */}
        {showDetail && (
          <div className="mb-4">
            <button
              onClick={() => setShowDetail(false)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7c3aed] hover:text-[#4f46e5]
                         bg-white/70 hover:bg-white border border-[#e4defb] rounded-full pl-2.5 pr-4 py-1.5 shadow-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to sessions
            </button>

            {loading && <p className="text-sm text-gray-500 mt-4">Loading session...</p>}
          </div>
        )}

        {showDetail && hasSession && messages.length > 0 && (
          <>
            {/* Session Overview */}
            <div className={`${CARD_CLASS} mb-6`}>
              <AccentBar />
              <div className="flex items-center gap-2.5 px-6 pt-5 pb-4" style={CARD_HEADER_STYLE}>
                <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
                <h3 className="text-xs font-bold text-[#7c3aed] uppercase tracking-wide">
                  Session Overview
                </h3>
              </div>
              <div className="p-6">
                <div
                  className={`grid grid-cols-2 gap-4 ${
                    isManualSession ? "md:grid-cols-4" : "md:grid-cols-5"
                  }`}
                >
                  <OverviewTile
                    wide
                    icon={FileText}
                    label="Scenario"
                    value={sessionDetail?.scenario}
                    color="#ea580c"
                    bg="#fff7ed"
                    border="#fde3c4"
                  />
                  {isManualSession ? (
                    <OverviewTile
                      icon={Tag}
                      label="Product Context"
                      value={sessionDetail?.product_context}
                      color="#0891b2"
                      bg="#ecfeff"
                      border="#bdeefc"
                    />
                  ) : (
                    <>
                      <OverviewTile
                        icon={Smile}
                        label="Customer Tone"
                        value={sessionDetail?.customer_tone}
                        color="#dc2626"
                        bg="#fef2f2"
                        border="#fecaca"
                      />
                      <OverviewTile
                        icon={Clock3}
                        label="Patience Level"
                        value={sessionDetail?.patience_level}
                        color="#7c3aed"
                        bg="#f5f3ff"
                        border="#ddd6fe"
                      />
                    </>
                  )}
                  <OverviewTile
                    icon={MessageSquare}
                    label="Total Turns"
                    value={sessionDetail?.turn_count}
                    color="#db2777"
                    bg="#fdf2f8"
                    border="#fbcfe8"
                  />
                  <OverviewTile
                    mono
                    icon={Clock}
                    label="Duration"
                    value={formatDuration(sessionDetail?.duration_seconds)}
                    color="#4f46e5"
                    bg="#f5f6ff"
                    border="#e6e8ff"
                  />
                </div>
              </div>
            </div>

            {/* Turn stepper */}
            <div className={`${CARD_CLASS} mb-6`}>
              <AccentBar />
              <div className="px-6 pt-6 pb-5" style={CARD_HEADER_STYLE}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#1e1b3a" }}>
                      Turn {currentTurnIndex + 1} of {totalTurns}
                    </p>
                    <p className="text-xs" style={{ color: "#8b87a8" }}>
                      Reviewing turn by turn
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                      className="text-xs border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      style={{ borderColor: "#d9d2f7", color: "#4f46e5" }}
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
                                 text-white text-xs font-semibold px-3 py-1.5 hover:opacity-90 transition-opacity shadow-sm shadow-[#7c3aed]/25
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

              <div className="flex flex-wrap items-center gap-2 px-6 py-4 bg-white">
                <button
                  onClick={goFirst}
                  disabled={currentTurnIndex === 0}
                  className={NAV_BUTTON_CLASS}
                  style={secondaryBtnStyle}
                >
                  <ChevronsLeft className="w-3.5 h-3.5" /> First
                </button>
                <button
                  onClick={goPrev}
                  disabled={currentTurnIndex === 0}
                  className={NAV_BUTTON_CLASS}
                  style={secondaryBtnStyle}
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button
                  onClick={goNext}
                  disabled={currentTurnIndex >= totalTurns - 1}
                  className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold
                             px-3 py-2 hover:opacity-90 transition-opacity shadow-sm shadow-[#7c3aed]/25
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={goLast}
                  disabled={currentTurnIndex >= totalTurns - 1}
                  className={NAV_BUTTON_CLASS}
                  style={secondaryBtnStyle}
                >
                  Last <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 min-w-0 space-y-6">
                <ReplayConversationPanel messages={messages} currentTurnIndex={currentTurnIndex} />

                {/* Session Highlights */}
                <div className={`${CARD_CLASS} p-6`}>
                  <AccentBar />
                  <div className="flex items-center gap-2 mb-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
                    <h3 className="text-xs font-bold text-[#7c3aed] uppercase tracking-wide">
                      Session Highlights
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <HighlightCard
                      icon={AlertTriangle}
                      tone="red"
                      label="Peak Frustration"
                      value={peakFrustration ? `${peakFrustration.score} / 100` : "—"}
                      sub={peakFrustration ? `at turn ${peakFrustration.turn}` : null}
                    />
                    <HighlightCard
                      icon={improving ? TrendingDown : TrendingUp}
                      tone={improving ? "green" : "purple"}
                      label="Frustration Trend"
                      value={
                        frustrationDelta != null
                          ? `${frustrationDelta > 0 ? "+" : ""}${frustrationDelta}`
                          : "—"
                      }
                      sub={
                        startFrustration != null && endFrustration != null
                          ? `${startFrustration} → ${endFrustration}`
                          : null
                      }
                    />
                    <HighlightCard
                      icon={AlertTriangle}
                      tone="amber"
                      label="Escalation Alerts"
                      value={escalationAlertCount}
                      sub="high-risk turns"
                    />
                    <HighlightCard
                      icon={Users}
                      tone="indigo"
                      label="Turn Split"
                      value={`${customerTurnCount} / ${agentTurnCount}`}
                      sub="customer / agent"
                    />
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
          <p className="text-sm text-gray-500">This session has no recorded turns to replay.</p>
        )}
      </div>
    </div>
  );
}