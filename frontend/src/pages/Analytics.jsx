import React, { useState, useEffect } from "react";
import "./Analytics.css";
import { analyticsApi } from "../services/api";

function formatDate(d) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// FIX: previously used d.toISOString().split("T")[0], which converts to UTC
// before slicing the date. For users ahead of UTC (e.g. IST), any request made
// between midnight and the UTC offset would silently shift the range back a day.
// Build the ISO date string from local date parts instead.
function toISODate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// NEW: mirrors backend RESOLVED_THRESHOLD (analytics.py) — used only to
// decide the tone of the "Resolution performance" insight below. If the
// backend threshold changes, update this too.
const RESOLUTION_STRONG_THRESHOLD = 70;

// NEW: the selected date range (preset or custom) is persisted here so it
// survives this component unmounting when the user navigates to another
// page (Select Mode, Reports) and back. Local component state alone was
// wiped on every remount, silently resetting the range to "Last 7 Days".
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
    // Corrupt JSON, private-mode storage restrictions, etc. — just fall
    // back to the default range instead of throwing.
    return null;
  }
}

// NEW: builds the 4 Key Insights blocks from real analyticsData instead of
// static copy. Each slot mirrors one of the original hardcoded messages but
// now flips wording/icon/color based on the actual delta direction, and
// has an explicit branch for "isNew" (zero-baseline) periods so it doesn't
// claim a trend that isn't there.
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
      color: up ? "green" : "orange",
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
      color: up ? "blue" : "orange",
      title: up ? "Average session time is improving" : "Average session time is dropping",
      body: up
        ? "Users are spending more time during coaching sessions."
        : "Sessions are wrapping up faster than in the previous period.",
    });
  }

  // Slot 3: resolution performance — based on the current score level, not
  // a delta, since "strong" is about absolute performance, not direction.
  const strong = avgResolutionScore >= RESOLUTION_STRONG_THRESHOLD;
  insights.push({
    icon: strong ? "✓" : "!",
    color: "orange",
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
      color: up ? "purple" : "orange",
      title: up ? "Resolution rate improved" : "Resolution rate declined",
      body: up
        ? "Coaching is helping improve successful resolutions."
        : "Resolution rate dropped compared to the previous period.",
    });
  }

  return insights;
}

function Analytics() {
  // CHANGED: seed both from localStorage (if a range was previously picked)
  // instead of always defaulting to 7 / null. See loadStoredRange() above.
  const storedRange = loadStoredRange();

  const [rangeDays, setRangeDays] = useState(storedRange?.rangeDays ?? 7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // FIX: track the exact start/end actually sent to the API, so the header
  // "date-filter" button never drifts from what was queried.
  const [fetchedRange, setFetchedRange] = useState({ start: null, end: null });

  // NEW: custom date range picked via the header button. When set, it takes
  // priority over the rangeDays preset. Cleared whenever a preset is chosen.
  const [customRange, setCustomRange] = useState(storedRange?.customRange ?? null); // { start: Date, end: Date } | null
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftStart, setDraftStart] = useState("");
  const [draftEnd, setDraftEnd] = useState("");

  // NEW: persist the current selection whenever it changes, so navigating
  // away (Select Mode, Reports) and back restores the same range instead of
  // resetting to the default 7-day view.
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
      // Storage unavailable (private mode, quota, etc.) — not persisting is
      // fine, just don't let it break the page.
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
  }, [rangeDays, customRange]); // FIX: refetch when a custom range is applied too

  if (loading && !data) {
    return (
      <main className="analytics-page">
        <p>Loading analytics...</p>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="analytics-page">
        <p>Failed to load analytics. Please try again.</p>
      </main>
    );
  }

  const analyticsData = data;

  // FIX: fall back to 0 for any mode missing from the response (backend only
  // includes a mode key if at least one session used it), otherwise this sum
  // becomes NaN and every downstream percentage collapses to 0.
  // CHANGED: "replay" removed from this donut — replay no longer creates a
  // Session row, so it can't meaningfully be a slice of "Sessions by Mode."
  // See analyticsData.replayViews for replay activity instead.
  const modeSimulator = analyticsData.modes.simulator || 0;
  const modeManual = analyticsData.modes.manual || 0;

  const totalModes = modeSimulator + modeManual;

  const simulatorPercent = totalModes ? (modeSimulator / totalModes) * 100 : 0;
  const manualPercent = totalModes ? (modeManual / totalModes) * 100 : 0;

  const totalEscalations = analyticsData.totalEscalations;

  // Build SVG line-chart points dynamically from analyticsData.sessions
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

  // FIX: use the range that was actually sent to the API instead of
  // recomputing "now" again at render time (previously could drift from the
  // real query near a day boundary). Guarded by the loading check above, so
  // fetchedRange is always populated by the time we reach this line.
  const rangeStart = fetchedRange.start;
  const rangeEnd = fetchedRange.end;

  // NEW: label the delta comparison correctly whether we're on a preset
  // (rangeDays) or a custom applied range.
  const periodLabel = customRange ? "previous period" : `last ${rangeDays} days`;

  // CHANGED: deltas are now { value, isNew } objects (see analytics.py).
  // A zero-baseline period renders as "New" instead of a misleading
  // "↑100.0%".
  function renderDelta(delta) {
    if (!delta) return null;
    if (delta.isNew) {
      return <small className="positive">New</small>;
    }
    const positive = delta.value >= 0;
    return (
      <>
        <small className={positive ? "positive" : "negative"}>
          {positive ? "↑" : "↓"} {Math.abs(delta.value).toFixed(1)}%
        </small>
        <small> vs {periodLabel}</small>
      </>
    );
  }

  // NEW: open the custom range popover, seeded with the currently applied range.
  function openPicker() {
    setDraftStart(toISODate(rangeStart));
    setDraftEnd(toISODate(rangeEnd));
    setPickerOpen(true);
  }

  // NEW: apply the picked range, replacing any active preset.
  function applyCustomRange() {
    if (!draftStart || !draftEnd) return;
    const s = new Date(`${draftStart}T00:00:00`);
    const e = new Date(`${draftEnd}T00:00:00`);
    if (s > e) return; // basic guard against an inverted range
    setCustomRange({ start: s, end: e });
    setPickerOpen(false);
  }

  const insights = getInsights(analyticsData);

  return (
    <main className="analytics-page">

      {/* Non-blocking notice if a background refetch (e.g. switching range) fails
          while we still have stale data on screen, so failures aren't silent. */}
      {error && data && (
        <div className="analytics-refresh-warning">
          Couldn't refresh analytics — showing the last loaded data.
        </div>
      )}

      {/* PAGE TITLE */}
      <section className="analytics-heading">
        <div>
          <h1>Analytics Overview</h1>
          <p>
            Track performance, monitor trends, and improve coaching outcomes
          </p>
        </div>

        <div style={{ position: "relative" }}>
          <button
            className="date-filter"
            onClick={() => (pickerOpen ? setPickerOpen(false) : openPicker())}
          >
            <span>▣</span>
            {formatDate(rangeStart)} - {formatDate(rangeEnd)}
            <span>⌄</span>
          </button>

          {pickerOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                background: "#fff",
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                padding: 16,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                zIndex: 20,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                minWidth: 220,
              }}
            >
              <label style={{ display: "flex", flexDirection: "column", fontSize: 13, gap: 4 }}>
                Start date
                <input
                  type="date"
                  value={draftStart}
                  max={draftEnd || toISODate(new Date())}
                  onChange={(e) => setDraftStart(e.target.value)}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", fontSize: 13, gap: 4 }}>
                End date
                <input
                  type="date"
                  value={draftEnd}
                  min={draftStart}
                  max={toISODate(new Date())}
                  onChange={(e) => setDraftEnd(e.target.value)}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                <button onClick={() => setPickerOpen(false)}>Cancel</button>
                <button onClick={applyCustomRange}>Apply</button>
              </div>
            </div>
          )}
        </div>
      </section>


      {/* SUMMARY CARDS */}
      <section className="analytics-stats">

        <div className="stat-card">
          <div className="stat-icon purple">▢</div>
          <div>
            <span className="stat-label">Total Sessions</span>
            <h2>{analyticsData.totalSessions}</h2>
            {renderDelta(analyticsData.deltas?.totalSessions)}
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-icon green">♙</div>
          <div>
            <span className="stat-label">Active Days</span>
            <h2>{analyticsData.activeDays}</h2>
            {renderDelta(analyticsData.deltas?.activeDays)}
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-icon blue">◷</div>
          <div>
            <span className="stat-label">Avg. Session Time</span>
            <h2>{analyticsData.avgSessionTime}</h2>
            {renderDelta(analyticsData.deltas?.avgSessionTime)}
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-icon orange">◉</div>
          <div>
            <span className="stat-label">Avg. Resolution Score</span>
            <h2>{analyticsData.avgResolutionScore}%</h2>
            {renderDelta(analyticsData.deltas?.avgResolutionScore)}
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-icon violet">↗</div>
          <div>
            <span className="stat-label">Resolution Rate</span>
            <h2>{analyticsData.resolutionRate}%</h2>
            {/* NEW: clarifies the denominator is scored sessions, not all
                sessions in the period, per product decision. */}
            <small className="stat-sublabel">of scored sessions</small>
            {renderDelta(analyticsData.deltas?.resolutionRate)}
          </div>
        </div>

      </section>


      {/* MAIN CHART ROW */}
      <section className="analytics-grid-large">

        {/* SESSIONS OVER TIME */}
        <div className="analytics-card sessions-card">

          <div className="card-header">
            <h3>Sessions Over Time</h3>

            <select
              value={rangeDays}
              onChange={(e) => {
                setCustomRange(null); // FIX: preset wins over any custom range
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
                  <linearGradient
                    id="sessionGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#4f46e5"
                      stopOpacity="0.22"
                    />
                    <stop
                      offset="100%"
                      stopColor="#4f46e5"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <polygon points={polygonPoints} fill="url(#sessionGradient)" />

                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="3"
                />

                {points.map(([x, y], index) => (
                  <circle key={index} cx={x} cy={y} r="5" fill="#4f46e5" />
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
                  #06b6d4 ${simulatorPercent}% 100%
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
                    {modeSimulator} (
                    {simulatorPercent.toFixed(1)}%)
                  </p>
                </div>
              </div>


              <div className="legend-item">
                <span className="legend-dot blue-dot"></span>
                <div>
                  <strong>Manual Mode</strong>
                  <p>
                    {modeManual} (
                    {manualPercent.toFixed(1)}%)
                  </p>
                </div>
              </div>


            </div>

          </div>

          {/* NEW: replay isn't a Session-mode slice anymore (see above), but
              it's still useful activity to surface — shown as its own line
              instead of a fake donut segment. */}
          <div className="replay-views-note">
            <span className="legend-dot green-dot"></span>
            Replay Views: <strong>{analyticsData.replayViews}</strong>
          </div>

        </div>

      </section>


      {/* BOTTOM ROW */}
      <section className="analytics-grid-bottom">

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
                  style={{
                    width: `${analyticsData.sentiment.positive}%`,
                  }}
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
                  style={{
                    width: `${analyticsData.sentiment.neutral}%`,
                  }}
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
                  style={{
                    width: `${analyticsData.sentiment.negative}%`,
                  }}
                ></div>
              </div>

              <strong>{analyticsData.sentiment.negative}%</strong>
            </div>

          </div>

          {/* REMOVED: "View sentiment details →" — no /analytics/sentiment
              route exists anywhere in App.jsx, so this was a dead button.
              Re-add once a real detail view exists. */}

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
            <strong>{totalEscalations}</strong>
          </div>

        </div>


        {/* KEY INSIGHTS */}
        <div className="analytics-card insights-card">

          <div className="card-header">
            <h3>Key Insights</h3>
          </div>

          {/* CHANGED: was 4 hardcoded blocks that never read analyticsData
              (always claimed things were improving, even when deltas showed
              the opposite). Now generated from getInsights() above. */}
          {insights.map((insight, i) => (
            <div className="insight" key={i}>
              <div className={`insight-icon ${insight.color}-insight`}>
                {insight.icon}
              </div>
              <div>
                <strong>{insight.title}</strong>
                <p>{insight.body}</p>
              </div>
            </div>
          ))}

          {/* REMOVED: "View all insights →" — same reason as the sentiment
              button above; no route exists yet. */}

        </div>

      </section>


      {/* FOOTER INFORMATION */}
      <div className="analytics-info">
        <span>ⓘ</span>
        Analytics are updated in real-time. All times are shown in your
        local timezone.
      </div>

    </main>
  );
}

export default Analytics;