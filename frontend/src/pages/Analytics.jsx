import React, { useState, useEffect } from "react";
import "./Analytics.css";
import { analyticsApi } from "../services/api";

/* ------------------------------------------------------------------ */
/* Palette — change colors here, everything below uses these tokens.   */
/*   indigo / violet : brand + primary data                            */
/*   sky             : Manual mode                                     */
/*   green           : positive / good                                 */
/*   slate           : neutral                                         */
/*   amber           : needs attention                                 */
/*   rose            : negative / escalations                          */
/* ------------------------------------------------------------------ */
const THEME_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');

.analytics-page {
  --ink: #1e1b4b;
  --text: #374063;
  --muted: #64688a;
  --faint: #9498b4;
  --border: #e6e5f4;
  --surface: #ffffff;
  --soft: #f4f3fc;

  --indigo: #4f46e5;
  --indigo-2: #6366f1;
  --violet: #7c3aed;
  --sky: #0ea5e9;
  --sky-2: #38bdf8;
  --green: #10b981;
  --green-2: #34d399;
  --green-dark: #047857;
  --slate: #64748b;
  --slate-2: #94a3b8;
  --amber: #f59e0b;
  --amber-dark: #b45309;
  --rose: #f43f5e;
  --rose-2: #fb7185;
  --rose-dark: #be123c;
}

.analytics-page,
.analytics-page * {
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
}
.analytics-page h1,
.analytics-page h2,
.analytics-page h3,
.analytics-page .donut-center strong {
  font-family: 'Manrope', 'Inter', system-ui, sans-serif;
}

/* Title */
.analytics-page .analytics-heading h1 {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin: 0 0 6px;
  color: var(--ink);
  background: linear-gradient(90deg, var(--ink) 0%, var(--indigo) 65%, var(--violet) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.analytics-page .analytics-heading p {
  margin: 0;
  font-size: 16px;
  color: var(--muted);
  font-weight: 400;
}

/* Date filter */
.analytics-page .date-filter {
  transition: box-shadow .18s ease, border-color .18s ease;
}
.analytics-page .date-filter:hover {
  border-color: #c7c6ea !important;
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.14) !important;
}

/* Stat cards */
.analytics-page .stat-card {
  transition: transform .2s ease, box-shadow .2s ease;
}
.analytics-page .stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(79, 70, 229, 0.12) !important;
}

/* Main cards */
.analytics-page .analytics-card {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 22px;
  box-shadow: 0 6px 20px rgba(60, 60, 120, 0.06);
  transition: box-shadow .2s ease;
}
.analytics-page .analytics-card:hover {
  box-shadow: 0 10px 26px rgba(79, 70, 229, 0.10);
}
.analytics-page .analytics-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 28px;
  right: 28px;
  height: 3px;
  border-radius: 0 0 6px 6px;
  background: linear-gradient(90deg, var(--indigo), var(--violet));
  opacity: 0.9;
  pointer-events: none;
}
.analytics-page .sessions-card::before { background: linear-gradient(90deg, var(--indigo), var(--indigo-2)); }
.analytics-page .mode-card::before { background: linear-gradient(90deg, var(--indigo), var(--sky)); }
.analytics-page .sentiment-card::before { background: linear-gradient(90deg, var(--green), var(--green-2)); }
.analytics-page .escalation-card::before { background: linear-gradient(90deg, var(--rose), var(--rose-2)); }
.analytics-page .insights-card::before { background: linear-gradient(90deg, var(--violet), #a78bfa); }

.analytics-page .card-header h3 {
  font-size: 16.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
  margin: 0;
}
.analytics-page .small-period {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  background: var(--soft);
  padding: 4px 10px;
  border-radius: 999px;
}
.analytics-page .card-header select {
  font-size: 13px;
  font-weight: 500;
  color: var(--indigo);
  background: var(--soft);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px 12px;
  outline: none;
  cursor: pointer;
}
.analytics-page .card-header select:focus {
  border-color: #a5a4ee;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}

/* Line chart */
.analytics-page .chart-y-axis span,
.analytics-page .chart-dates span {
  font-size: 12px;
  font-weight: 400;
  color: var(--faint);
}

/* Donut + legend */
.analytics-page .donut-center strong {
  font-size: 28px;
  font-weight: 800;
  color: var(--ink);
}
.analytics-page .donut-center span {
  font-size: 12px;
  font-weight: 500;
  color: var(--faint);
}
.analytics-page .purple-dot { background: var(--indigo) !important; }
.analytics-page .blue-dot { background: var(--sky) !important; }
.analytics-page .green-dot { background: var(--violet) !important; }
.analytics-page .mode-legend strong {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}
.analytics-page .mode-legend p {
  font-size: 13px;
  color: var(--muted);
  margin: 2px 0 0;
}
.analytics-page .replay-views-note {
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
}
.analytics-page .replay-views-note strong {
  color: var(--ink);
}

/* Sentiment */
.analytics-page .sentiment-title span:last-child {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}
.analytics-page .sentiment-row strong {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}
.analytics-page .progress {
  height: 9px;
  border-radius: 999px;
  background: #eeedf8;
  overflow: hidden;
}
.analytics-page .progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width .6s ease;
}
.analytics-page .green-fill { background: linear-gradient(90deg, var(--green), var(--green-2)); }
.analytics-page .blue-fill { background: linear-gradient(90deg, var(--slate), var(--slate-2)); }
.analytics-page .orange-fill { background: linear-gradient(90deg, var(--rose), var(--rose-2)); }

/* Sentiment icons */
.analytics-page .positive-icon { background: #d1fae5 !important; color: var(--green-dark) !important; }
.analytics-page .neutral-icon { background: #e2e8f0 !important; color: var(--slate) !important; }
.analytics-page .negative-icon { background: #ffe4e6 !important; color: var(--rose-dark) !important; }

/* Escalation bars */
.analytics-page .bar {
  background: linear-gradient(180deg, var(--rose-2) 0%, var(--rose) 100%);
  border-radius: 8px 8px 0 0;
  transition: height .5s ease;
}
/* No stub when a day has zero escalations */
.analytics-page .bar[style*="height: 0%"] {
  min-height: 0 !important;
  display: none;
}
.analytics-page .bar-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
}
.analytics-page .bar-column > span {
  font-size: 11px;
  font-weight: 400;
  color: var(--faint);
}
.analytics-page .total-escalations {
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
}
.analytics-page .total-escalations strong {
  margin-left: 6px;
  font-size: 15px;
  font-weight: 700;
}

/* Insights */
.analytics-page .insight {
  padding: 10px 12px;
  border-radius: 14px;
  transition: background .15s ease;
}
.analytics-page .insight:hover {
  background: var(--soft);
}
.analytics-page .insight strong {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}
.analytics-page .insight p {
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--muted);
  margin: 2px 0 0;
}
.analytics-page .green-insight  { background: #d1fae5 !important; color: var(--green-dark) !important; }
.analytics-page .blue-insight   { background: #e0f2fe !important; color: #0369a1 !important; }
.analytics-page .purple-insight { background: #ede9fe !important; color: var(--violet) !important; }
.analytics-page .amber-insight  { background: #fef3c7 !important; color: var(--amber-dark) !important; }
.analytics-page .rose-insight   { background: #ffe4e6 !important; color: var(--rose-dark) !important; }

/* Footer note + warning */
.analytics-page .analytics-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding: 10px 16px;
  border-radius: 999px;
  background: var(--soft);
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 400;
}
.analytics-page .analytics-refresh-warning {
  margin-bottom: 16px;
  padding: 10px 16px;
  border-radius: 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: var(--amber-dark);
  font-size: 13px;
  font-weight: 500;
}
`;

function formatDate(d) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Build the ISO date string from local date parts (avoids the UTC shift
// that toISOString() causes for users ahead of UTC, e.g. IST).
function toISODate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Mirrors backend RESOLVED_THRESHOLD (analytics.py).
const RESOLUTION_STRONG_THRESHOLD = 70;

// Selected range persists across unmount/remount (navigating to other pages).
const RANGE_STORAGE_KEY = "assistedge_analytics_range";

function loadStoredRange() {
  try {
    const raw = localStorage.getItem(RANGE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.rangeDays !== "number") return null;

    if (parsed.customRange && parsed.customRange.start && parsed.customRange.end) {
      const start = new Date(`${parsed.customRange.start}T00:00:00`);
      const end = new Date(`${parsed.customRange.end}T00:00:00`);
      if (isNaN(start) || isNaN(end)) return { rangeDays: parsed.rangeDays, customRange: null };
      return { rangeDays: parsed.rangeDays, customRange: { start, end } };
    }
    return { rangeDays: parsed.rangeDays, customRange: null };
  } catch {
    return null;
  }
}

// Small formatters for the stat cards. They tolerate missing/odd values
// so a field-name mismatch shows "—" instead of crashing the page.
function formatPercent(v) {
  if (typeof v !== "number" || isNaN(v)) return "—";
  return `${Math.round(v)}%`;
}

function formatAvgTime(v) {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  if (typeof v !== "number" || isNaN(v)) return "—";
  // Assumes seconds. If your backend sends minutes, change to v * 60.
  const m = Math.floor(v / 60);
  const s = Math.round(v % 60);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function getInsights(analyticsData) {
  const insights = [];
  const totalSessionsDelta = analyticsData.deltas?.totalSessions;
  const avgSessionTimeDelta = analyticsData.deltas?.avgSessionTime;
  const resolutionRateDelta = analyticsData.deltas?.resolutionRate;
  const avgResolutionScore = analyticsData.avgResolutionScore;

  // Slot 1: session volume
  if (totalSessionsDelta?.isNew) {
    insights.push({
      icon: "↑",
      color: "green",
      title: "Session activity is new this period",
      body: "No sessions were recorded in the previous period to compare against.",
    });
  } else if (totalSessionsDelta) {
    const up = totalSessionsDelta.value >= 0;
    insights.push({
      icon: up ? "↑" : "↓",
      color: up ? "green" : "amber",
      title: up ? "Session volume increased" : "Session volume decreased",
      body: up
        ? "More users are actively using the coaching platform."
        : "Fewer sessions were run than in the previous period.",
    });
  }

  // Slot 2: average session time
  if (avgSessionTimeDelta?.isNew) {
    insights.push({
      icon: "◷",
      color: "blue",
      title: "Session time — new this period",
      body: "No prior period data to compare average session time against.",
    });
  } else if (avgSessionTimeDelta) {
    const up = avgSessionTimeDelta.value >= 0;
    insights.push({
      icon: "◷",
      color: up ? "blue" : "amber",
      title: up ? "Average session time is improving" : "Average session time is dropping",
      body: up
        ? "Users are spending more time during coaching sessions."
        : "Sessions are wrapping up faster than in the previous period.",
    });
  }

  // Slot 3: resolution performance (absolute level, not a delta)
  const strong = avgResolutionScore >= RESOLUTION_STRONG_THRESHOLD;
  insights.push({
    icon: strong ? "✓" : "!",
    color: strong ? "green" : "rose",
    title: strong ? "Resolution performance is strong" : "Resolution performance needs attention",
    body: strong
      ? "Most customer issues are being successfully resolved."
      : "A notable share of sessions are ending without resolution.",
  });

  // Slot 4: resolution rate trend
  if (resolutionRateDelta?.isNew) {
    insights.push({
      icon: "↗",
      color: "purple",
      title: "Resolution rate — new this period",
      body: "No prior period data to compare resolution rate against.",
    });
  } else if (resolutionRateDelta) {
    const up = resolutionRateDelta.value >= 0;
    insights.push({
      icon: up ? "↗" : "↘",
      color: up ? "purple" : "rose",
      title: up ? "Resolution rate improved" : "Resolution rate declined",
      body: up
        ? "Coaching is helping improve successful resolutions."
        : "Resolution rate dropped compared to the previous period.",
    });
  }

  return insights;
}

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 12,
  fontWeight: 700,
  color: "#4f46e5",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const dateInputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e6e5f4",
  background: "#f4f3fc",
  color: "#1e1b4b",
  fontSize: 14,
  fontWeight: 500,
  textTransform: "none",
  letterSpacing: 0,
  fontFamily: "inherit",
};

function Analytics() {
  const storedRange = loadStoredRange();

  const [rangeDays, setRangeDays] = useState(storedRange?.rangeDays ?? 7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchedRange, setFetchedRange] = useState({ start: null, end: null });

  const [customRange, setCustomRange] = useState(storedRange?.customRange ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftStart, setDraftStart] = useState("");
  const [draftEnd, setDraftEnd] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(
        RANGE_STORAGE_KEY,
        JSON.stringify({
          rangeDays,
          customRange: customRange
            ? { start: toISODate(customRange.start), end: toISODate(customRange.end) }
            : null,
        })
      );
    } catch {
      // Storage unavailable — not persisting is fine.
    }
  }, [rangeDays, customRange]);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        let start, end;
        if (customRange) {
          start = customRange.start;
          end = customRange.end;
        } else {
          end = new Date();
          start = new Date();
          start.setDate(end.getDate() - (rangeDays - 1));
        }

        const res = await analyticsApi.getOverview(
          toISODate(start),
          toISODate(end)
        );

        if (!cancelled) {
          setData(res.data);
          setFetchedRange({ start, end });
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, [rangeDays, customRange]);

  if (loading && !data) {
    return (
      <main className="analytics-page">
        <style>{THEME_CSS}</style>
        <p>Loading analytics...</p>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="analytics-page">
        <style>{THEME_CSS}</style>
        <p>Failed to load analytics. Please try again.</p>
      </main>
    );
  }

  const analyticsData = data;

  const modeSimulator = analyticsData.modes.simulator || 0;
  const modeManual = analyticsData.modes.manual || 0;

  const totalModes = modeSimulator + modeManual;

  const simulatorPercent = totalModes ? (modeSimulator / totalModes) * 100 : 0;
  const manualPercent = totalModes ? (modeManual / totalModes) * 100 : 0;

  const totalEscalations = analyticsData.totalEscalations;

  const sessionsMax = Math.max(...analyticsData.sessions, 1);
  const yAxisMax = Math.ceil(sessionsMax / 30) * 30 || 30;
  const chartWidth = 700;
  const chartHeight = 250;
  const topPadding = 20;
  const bottomPadding = 20;

  const points = analyticsData.sessions.map((value, index) => {
    const x =
      analyticsData.sessions.length > 1
        ? (index / (analyticsData.sessions.length - 1)) * chartWidth
        : 0;
    const y =
      chartHeight -
      bottomPadding -
      (value / yAxisMax) * (chartHeight - topPadding - bottomPadding);
    return [x, y];
  });

  const polylinePoints = points.map(([x, y]) => `${x},${y}`).join(" ");
  const polygonPoints = `${polylinePoints} ${chartWidth},${chartHeight} 0,${chartHeight}`;

  const yAxisLabels = [
    yAxisMax,
    yAxisMax * 0.75,
    yAxisMax * 0.5,
    yAxisMax * 0.25,
    0,
  ];

  const rangeStart = fetchedRange.start;
  const rangeEnd = fetchedRange.end;

  function openPicker() {
    setDraftStart(toISODate(rangeStart));
    setDraftEnd(toISODate(rangeEnd));
    setPickerOpen(true);
  }

  function applyCustomRange() {
    if (!draftStart || !draftEnd) return;
    const s = new Date(`${draftStart}T00:00:00`);
    const e = new Date(`${draftEnd}T00:00:00`);
    if (s > e) return;
    setCustomRange({ start: s, end: e });
    setPickerOpen(false);
  }

  const insights = getInsights(analyticsData);

  // Stat cards. Field names other than avgResolutionScore, deltas.* and the
  // ones already used elsewhere in this file are assumed — a card shows "—"
  // if the backend field name differs.
  const statCards = [
    {
      key: "sessions",
      label: "Total Sessions",
      value: analyticsData.totalSessions ?? "—",
      delta: analyticsData.deltas?.totalSessions,
      icon: "▤",
      tint: "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
      iconColor: "#4f46e5",
    },
    {
      key: "time",
      label: "Avg Session Time",
      value: formatAvgTime(analyticsData.avgSessionTime),
      delta: analyticsData.deltas?.avgSessionTime,
      icon: "◷",
      tint: "linear-gradient(135deg, #e0f2fe, #bae6fd)",
      iconColor: "#0284c7",
    },
    {
      key: "score",
      label: "Avg Resolution Score",
      value:
        typeof analyticsData.avgResolutionScore === "number"
          ? Math.round(analyticsData.avgResolutionScore)
          : "—",
      delta: null,
      icon: "★",
      tint: "linear-gradient(135deg, #fef3c7, #fde68a)",
      iconColor: "#b45309",
      sub: "out of 100",
    },
    {
      key: "rate",
      label: "Resolution Rate",
      value: formatPercent(analyticsData.resolutionRate),
      delta: analyticsData.deltas?.resolutionRate,
      icon: "↗",
      tint: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
      iconColor: "#047857",
      sub: "of scored sessions",
    },
  ];

  return (
    <main className="analytics-page">
      <style>{THEME_CSS}</style>

      {error && data && (
        <div className="analytics-refresh-warning">
          Couldn't refresh analytics — showing the last loaded data.
        </div>
      )}

      {/* PAGE TITLE + DATE PICKER
          zIndex 50 keeps the popover above everything below it. Aligning the
          row to the bottom keeps the button clear of the header's bell/avatar. */}
      <section
        className="analytics-heading"
        style={{
          position: "relative",
          zIndex: 50,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          paddingTop: 56,
          marginBottom: 24,
        }}
      >
        <div>
          <h1>Analytics Overview</h1>
          <p>Track performance, monitor trends, and improve coaching outcomes</p>
        </div>

        <div style={{ position: "relative" }}>
          <button
            className="date-filter"
            onClick={() => (pickerOpen ? setPickerOpen(false) : openPicker())}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              height: 46,
              padding: "0 18px",
              borderRadius: 999,
              border: "1px solid #e6e5f4",
              background: "#ffffff",
              color: "#1e1b4b",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 6px 18px rgba(79, 70, 229, 0.10)",
              whiteSpace: "nowrap",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="3" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            {formatDate(rangeStart)} – {formatDate(rangeEnd)}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64688a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: pickerOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {pickerOpen && (
            <>
              {/* Invisible backdrop: click outside to close */}
              <div
                onClick={() => setPickerOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 40 }}
              />

              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: 0,
                  width: "min(92vw, 310px)",
                  background: "#ffffff",
                  border: "1px solid #e6e5f4",
                  borderRadius: 20,
                  padding: 20,
                  boxShadow: "0 24px 48px rgba(30, 27, 75, 0.20)",
                  zIndex: 60,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  boxSizing: "border-box",
                }}
              >
                <label style={labelStyle}>
                  Start date
                  <input
                    type="date"
                    value={draftStart}
                    max={draftEnd || toISODate(new Date())}
                    onChange={(e) => setDraftStart(e.target.value)}
                    style={dateInputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  End date
                  <input
                    type="date"
                    value={draftEnd}
                    min={draftStart}
                    max={toISODate(new Date())}
                    onChange={(e) => setDraftEnd(e.target.value)}
                    style={dateInputStyle}
                  />
                </label>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginTop: 2,
                  }}
                >
                  <button
                    onClick={() => setPickerOpen(false)}
                    style={{
                      padding: "9px 16px",
                      borderRadius: 12,
                      border: "1px solid #e6e5f4",
                      background: "#fff",
                      color: "#374063",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyCustomRange}
                    disabled={!draftStart || !draftEnd || draftStart > draftEnd}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      boxShadow: "0 8px 18px rgba(79, 70, 229, 0.30)",
                      opacity: !draftStart || !draftEnd || draftStart > draftEnd ? 0.5 : 1,
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* STAT CARDS — zIndex 1 < heading's 50, so the popover opens on top. */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 18,
          marginBottom: 22,
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.key}
            className="stat-card"
            style={{
              background: "#ffffff",
              borderRadius: 22,
              padding: "22px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              boxShadow: "0 6px 20px rgba(60, 60, 120, 0.06)",
              border: "1px solid #e6e5f4",
              minWidth: 0,
              minHeight: 128,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                background: card.tint,
                color: card.iconColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 700,
                flexShrink: 0,
                position: "relative",
                zIndex: 1,
              }}
            >
              {card.icon}
            </div>

            <div
              style={{
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                position: "relative",
                zIndex: 1,
              }}
            >
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#64688a" }}>
                {card.label}
              </p>
              <h2
                style={{
                  margin: 0,
                  fontSize: 32,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "#1e1b4b",
                  lineHeight: 1.15,
                }}
              >
                {card.value}
              </h2>
              <div
                style={{
                  minHeight: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 2,
                }}
              >
                {card.sub && (
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#9498b4" }}>
                    {card.sub}
                  </span>
                )}
                {card.delta &&
                  (card.delta.isNew ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.04em",
                        color: "#4338ca",
                        background: "#e0e7ff",
                        padding: "3px 9px",
                        borderRadius: 999,
                      }}
                    >
                      NEW
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "3px 9px",
                        borderRadius: 999,
                        color: card.delta.value >= 0 ? "#047857" : "#be123c",
                        background: card.delta.value >= 0 ? "#d1fae5" : "#ffe4e6",
                      }}
                    >
                      {card.delta.value >= 0 ? "↑" : "↓"} {Math.abs(card.delta.value).toFixed(1)}%
                    </span>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* MAIN CHART ROW */}
      <section className="analytics-grid-large" style={{ position: "relative", zIndex: 1 }}>
        {/* SESSIONS OVER TIME */}
        <div className="analytics-card sessions-card">
          <div className="card-header">
            <h3>Sessions Over Time</h3>

            <select
              value={rangeDays}
              onChange={(e) => {
                setCustomRange(null);
                setRangeDays(Number(e.target.value));
              }}
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
          </div>

          <div className="line-chart">
            <div className="chart-y-axis">
              {yAxisLabels.map((label, i) => (
                <span key={i}>{Math.round(label)}</span>
              ))}
            </div>

            <div className="chart-area">
              <div className="grid-line line-120"></div>
              <div className="grid-line line-90"></div>
              <div className="grid-line line-60"></div>
              <div className="grid-line line-30"></div>
              <div className="grid-line line-0"></div>

              <svg
                className="sessions-svg"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="sessionLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>

                <polygon points={polygonPoints} fill="url(#sessionGradient)" />

                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="url(#sessionLine)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />

                {points.map(([x, y], index) => (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="4.5"
                    fill="#ffffff"
                    stroke="#4f46e5"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>

              <div className="chart-dates">
                {analyticsData.dates.map((date, i) => (
                  <span key={`${date}-${i}`}>{date}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SESSIONS BY MODE */}
        <div className="analytics-card mode-card">
          <div className="card-header">
            <h3>Sessions by Mode</h3>
          </div>

          <div className="mode-content">
            <div
              className="donut-chart"
              style={{
                background: `conic-gradient(
                  #4f46e5 0 ${simulatorPercent}%,
                  #0ea5e9 ${simulatorPercent}% 100%
                )`,
              }}
            >
              <div className="donut-center">
                <strong>{totalModes}</strong>
                <span>Total</span>
              </div>
            </div>

            <div className="mode-legend">
              <div className="legend-item">
                <span className="legend-dot purple-dot"></span>
                <div>
                  <strong>Simulator Mode</strong>
                  <p>
                    {modeSimulator} ({simulatorPercent.toFixed(1)}%)
                  </p>
                </div>
              </div>

              <div className="legend-item">
                <span className="legend-dot blue-dot"></span>
                <div>
                  <strong>Manual Mode</strong>
                  <p>
                    {modeManual} ({manualPercent.toFixed(1)}%)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="replay-views-note">
            <span className="legend-dot green-dot"></span>
            Replay Views: <strong>{analyticsData.replayViews}</strong>
          </div>
        </div>
      </section>

      {/* BOTTOM ROW */}
      <section className="analytics-grid-bottom" style={{ position: "relative", zIndex: 1 }}>
        {/* SENTIMENT */}
        <div className="analytics-card sentiment-card">
          <div className="card-header">
            <h3>Sentiment Overview</h3>
            <span className="small-period">Current Data</span>
          </div>

          <div className="sentiment-list">
            <div className="sentiment-row">
              <div className="sentiment-title">
                <span className="sentiment-icon positive-icon">↑</span>
                <span>Positive</span>
              </div>

              <div className="progress">
                <div
                  className="progress-fill green-fill"
                  style={{ width: `${analyticsData.sentiment.positive}%` }}
                ></div>
              </div>

              <strong>{analyticsData.sentiment.positive}%</strong>
            </div>

            <div className="sentiment-row">
              <div className="sentiment-title">
                <span className="sentiment-icon neutral-icon">—</span>
                <span>Neutral</span>
              </div>

              <div className="progress">
                <div
                  className="progress-fill blue-fill"
                  style={{ width: `${analyticsData.sentiment.neutral}%` }}
                ></div>
              </div>

              <strong>{analyticsData.sentiment.neutral}%</strong>
            </div>

            <div className="sentiment-row">
              <div className="sentiment-title">
                <span className="sentiment-icon negative-icon">↓</span>
                <span>Negative</span>
              </div>

              <div className="progress">
                <div
                  className="progress-fill orange-fill"
                  style={{ width: `${analyticsData.sentiment.negative}%` }}
                ></div>
              </div>

              <strong>{analyticsData.sentiment.negative}%</strong>
            </div>
          </div>
        </div>

        {/* ESCALATIONS */}
        <div className="analytics-card escalation-card">
          <div className="card-header">
            <h3>Escalations Over Time</h3>
            <span className="small-period">Last {rangeDays} Days</span>
          </div>

          <div className="bar-chart">
            {analyticsData.escalations.map((value, index) => (
              <div className="bar-column" key={index}>
                <div className="bar-value">{value}</div>

                <div className="bar-wrapper">
                  <div
                    className="bar"
                    style={{
                      height: `${(value / Math.max(...analyticsData.escalations, 1)) * 100}%`,
                    }}
                  ></div>
                </div>

                <span>{analyticsData.dates[index]}</span>
              </div>
            ))}
          </div>

          <div className="total-escalations">
            Total Escalations:
            <strong style={{ color: totalEscalations > 0 ? "#be123c" : "#047857" }}>
              {totalEscalations}
            </strong>
          </div>
        </div>

        {/* KEY INSIGHTS */}
        <div className="analytics-card insights-card">
          <div className="card-header">
            <h3>Key Insights</h3>
          </div>

          {insights.map((insight, i) => (
            <div className="insight" key={i}>
              <div className={`insight-icon ${insight.color}-insight`}>{insight.icon}</div>
              <div>
                <strong>{insight.title}</strong>
                <p>{insight.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="analytics-info">
        <span>ⓘ</span>
        Analytics are updated in real-time. All times are shown in your local timezone.
      </div>
    </main>
  );
}

export default Analytics;