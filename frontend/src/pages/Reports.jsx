import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Filter,
  MessageSquareText,
  FileText,
  TrendingUp,
  Smile,
  Lightbulb,
  Download,
  Sparkles,
  Clock3,
  CheckCircle2,
  RefreshCw,
  Inbox,
} from 'lucide-react'
import { replayApi, reportApi } from '../services/api' // adjust path to your actual api.js location

// Panels fill the viewport instead of using a fixed pixel height, so the
// pagination bar and the report actions are never pushed below the fold.
const PANEL_STYLE = { minHeight: 0, height: '100%' }
const TITLE_DISPLAY_CLASS = 'reports-display text-sm font-bold'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// Defensive parser: sentiment_journey may arrive as a JSON string or an
// array/object of per-turn points. Returns [{ turn, value }] or [].
function parseJourney(raw) {
  let data = raw
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return []
    }
  }
  if (data && !Array.isArray(data)) data = data.timeline || data.journey || data.points || []
  if (!Array.isArray(data)) return []

  return data
    .map((p, i) => {
      if (typeof p === 'number') return { turn: i + 1, value: p }
      const v = p?.frustration_score ?? p?.frustration ?? p?.score ?? p?.value
      return { turn: p?.turn ?? p?.turn_number ?? i + 1, value: Number(v) }
    })
    .filter((p) => Number.isFinite(p.value))
}

function JourneyChart({ points }) {
  const W = 320
  const H = 90
  const pad = 8
  const step = points.length > 1 ? (W - pad * 2) / (points.length - 1) : 0
  const coords = points.map((p, i) => ({
    x: pad + i * step,
    y: pad + (1 - Math.min(100, Math.max(0, p.value)) / 100) * (H - pad * 2),
  }))
  const line = coords.map((c) => `${c.x},${c.y}`).join(' ')
  const area = `${pad},${H - pad} ${line} ${coords[coords.length - 1].x},${H - pad}`

  return (
    <div className="rounded-xl p-4 mb-6" style={{ background: '#fff', border: '1px solid #f0f1f5' }}>
      <div className="flex items-center justify-between mb-2">
        <h4 className={TITLE_DISPLAY_CLASS} style={{ color: '#10162f' }}>
          Sentiment Journey
        </h4>
        <span className="text-xs" style={{ color: '#9aa0b3' }}>
          Frustration · {points[0].value} → {points[points.length - 1].value}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" preserveAspectRatio="none">
        <polygon points={area} fill="rgba(79,70,229,0.08)" />
        <polyline points={line} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3.5" fill="#fff" stroke="#4f46e5" strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] mt-1" style={{ color: '#9aa0b3' }}>
        <span>Turn {points[0].turn}</span>
        <span>Turn {points[points.length - 1].turn}</span>
      </div>
    </div>
  )
}

export default function Reports() {
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionsError, setSessionsError] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [modeFilter, setModeFilter] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)

  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [report, setReport] = useState(null)
  const [reportState, setReportState] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    replayApi
      .listSessions()
      .then((res) => setSessions(res.data))
      .catch(() => setSessionsError('Could not load sessions. Check that the backend is running.'))
      .finally(() => setSessionsLoading(false))
  }, [])

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (modeFilter !== 'all' && s.mode !== modeFilter) return false
      if (!searchTerm.trim()) return true

      const haystack = `${s.scenario || ''} ${s.product_context || ''} ${s.id}`.toLowerCase()
      return haystack.includes(searchTerm.trim().toLowerCase())
    })
  }, [sessions, modeFilter, searchTerm])

  function selectSession(session) {
    setSelectedSessionId(session.id)
    setReport(null)
    setErrorMessage('')

    // Sessions with no messages can't produce a meaningful report.
    if (!session.turn_count) {
      setReportState('empty')
      return
    }

    setReportState('checking')

    reportApi
      .getReport(session.id)
      .then((res) => {
        setReport(res.data)
        setReportState('found')
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          setReportState('not_found')
        } else {
          setReportState('error')
          setErrorMessage('Could not check report status. Try selecting the session again.')
        }
      })
  }

  function generateReport() {
    setReportState('generating')
    setErrorMessage('')

    reportApi
      .generateReport(selectedSessionId)
      .then((res) => {
        setReport(res.data)
        setReportState('found')
        setShowRegenerateConfirm(false)
      })
      .catch((err) => {
        setReportState('error')
        setShowRegenerateConfirm(false)
        setErrorMessage(err?.response?.data?.detail || 'Report generation failed. Try again.')
      })
  }

  async function downloadPdf() {
    if (!selectedSessionId || reportState !== 'found') return

    setDownloading(true)
    setErrorMessage('')

    try {
      const res = await reportApi.downloadReportPdf(selectedSessionId)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')

      link.href = url
      link.download = `report-${selectedSessionId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setErrorMessage('Download failed. Try again.')
    } finally {
      setDownloading(false)
    }
  }

  const selectedSession = sessions.find((s) => s.id === selectedSessionId)

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })

  // Resolution score → ring/label tone (green / orange / red).
  const scoreTone = (score) => {
    if (score >= 80) return { ring: '#059669', text: '#059669', bg: '#ecfdf5', label: 'Strong' }
    if (score >= 50) return { ring: '#f97316', text: '#f97316', bg: '#fff7ed', label: 'Needs work' }
    return { ring: '#dc2626', text: '#dc2626', bg: '#fef2f2', label: 'At risk' }
  }

  // Shared centered state wrapper for the preview panel
  const CenterState = ({ icon: Icon, iconColor = '#4f46e5', iconBg = '#eef2ff', title, text, children, textColor }) => (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: iconBg, border: '1px solid #e0e4ff' }}
      >
        <Icon className="w-6 h-6" style={{ color: iconColor }} />
      </div>
      {title && (
        <h3 className="reports-display text-base font-bold" style={{ color: '#10162f' }}>
          {title}
        </h3>
      )}
      {text && (
        <p className="text-sm max-w-sm mt-2" style={{ color: textColor || '#7a8198' }}>
          {text}
        </p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        .reports-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #10162f;
          background:
            radial-gradient(circle at 50% 0%, rgba(79, 70, 229, 0.10) 0%, rgba(79, 70, 229, 0.05) 22%, transparent 50%),
            radial-gradient(circle at 92% 88%, rgba(139, 92, 246, 0.14) 0%, transparent 45%),
            radial-gradient(circle at 4% 18%, rgba(96, 165, 250, 0.12) 0%, transparent 40%),
            radial-gradient(rgba(79, 70, 229, 0.16) 1.4px, transparent 1.4px) 8px 8px / 22px 22px,
            #f8f7ff;
        }

        .reports-display {
          font-family: 'Sora', 'Inter', sans-serif;
          letter-spacing: -0.01em;
        }

        .reports-title-gradient {
          background: linear-gradient(90deg, #10162f 0%, #4f46e5 120%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          display: inline-block;
        }

        .reports-card {
          background: #fff;
          border: 1px solid #f0f1f8;
          border-radius: 16px;
          box-shadow: 0 5px 20px rgba(44, 43, 92, 0.06);
        }

        .reports-row {
          transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
        }
        .reports-row:hover {
          border-color: #d9ddff !important;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.08);
        }

        .reports-btn-secondary {
          border: 1px solid #e8e9f1;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .reports-btn-secondary:hover:not(:disabled) {
          background: #f8f8fc;
          border-color: #d9ddff;
        }

        .reports-list::-webkit-scrollbar,
        .reports-body::-webkit-scrollbar {
          width: 6px;
        }
        .reports-list::-webkit-scrollbar-thumb,
        .reports-body::-webkit-scrollbar-thumb {
          background: #e2e2f5;
          border-radius: 10px;
        }
      `}</style>

      <main className="reports-page h-[100dvh] w-full p-6 box-border overflow-hidden flex flex-col">

        {/* Page Header */}
        <div className="mb-5 relative z-10 shrink-0">
          {/* title block keeps clear of the app header (bell / profile) */}
          <div className="lg:pr-56">
          <div className="flex items-center gap-3.5">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 8px 20px rgba(79,70,229,0.30)' }}
            >
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h2 className="reports-display reports-title-gradient text-[30px] leading-none font-extrabold" style={{ fontWeight: 800 }}>
              Reports
            </h2>
          </div>

          <p className="text-sm mt-2.5 max-w-2xl" style={{ color: '#6b7390' }}>
            Generate a coaching report for any session — summary, resolution score, sentiment
            journey, and coaching recommendations.
          </p>
          </div>

          {/* Quick stats — four equal cards spanning the full width */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            {[
              { icon: MessageSquareText, label: 'Total sessions', value: sessions.length, fg: '#4f46e5', bg: '#eef2ff' },
              { icon: CheckCircle2, label: 'Ready for report', value: sessions.filter((s) => s.status === 'completed').length, fg: '#059669', bg: '#ecfdf5' },
              { icon: Smile, label: 'Manual', value: sessions.filter((s) => s.mode === 'manual').length, fg: '#0891b2', bg: '#ecfeff' },
              { icon: TrendingUp, label: 'Simulator', value: sessions.filter((s) => s.mode === 'simulator').length, fg: '#ea580c', bg: '#fff7ed' },
            ].map((st) => (
              <div
                key={st.label}
                className="flex items-center gap-3.5 bg-white rounded-2xl px-4 py-3"
                style={{ border: '1px solid #f0f1f8', boxShadow: '0 5px 20px rgba(44,43,92,0.06)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: st.bg }}>
                  <st.icon className="w-5 h-5" style={{ color: st.fg }} />
                </div>
                <div className="leading-tight">
                  <div className="reports-display text-xl font-bold" style={{ color: '#10162f' }}>{st.value}</div>
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: '#9aa0b3' }}>{st.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Workspace — fills the remaining height; only the lists scroll inside */}
        <div className="grid grid-cols-1 grid-rows-2 xl:grid-cols-2 xl:grid-rows-1 gap-5 relative z-10 flex-1 min-h-0">

          {/* Sessions */}
          <section className="reports-card overflow-hidden flex flex-col" style={PANEL_STYLE}>
            <div className="p-4 border-b shrink-0" style={{ borderColor: '#f0f1f5' }}>
              <div className="flex gap-3">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9ba1b3' }} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search sessions by title or ID..."
                    className="w-full h-10 pl-10 pr-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                    style={{ background: '#f8f8fc', border: '1px solid #ececf7', color: '#10162f' }}
                  />
                </div>

                <div className="relative shrink-0">
                  <button
                    onClick={() => setFilterOpen((v) => !v)}
                    className="h-10 min-w-[104px] flex items-center justify-center gap-2 px-3.5 text-sm font-medium rounded-xl transition-colors"
                    style={
                      modeFilter !== 'all'
                        ? { background: '#eef2ff', color: '#4f46e5', border: '1px solid #d9ddff' }
                        : { background: '#fff', color: '#454c65', border: '1px solid #e8e9f1' }
                    }
                  >
                    <Filter className="w-4 h-4" style={{ color: modeFilter !== 'all' ? '#4f46e5' : '#9ba1b3' }} />
                    {modeFilter === 'all' ? 'Filter' : modeFilter === 'manual' ? 'Manual' : 'Simulator'}
                  </button>

                  {filterOpen && (
                    <>
                      {/* click-away layer */}
                      <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                      <div
                        className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl z-20 p-1.5"
                        style={{ border: '1px solid #ececf7' }}
                      >
                        {[
                          { value: 'all', label: 'All Modes' },
                          { value: 'manual', label: 'Manual' },
                          { value: 'simulator', label: 'Simulator' },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setModeFilter(opt.value)
                              setFilterOpen(false)
                            }}
                            className="w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors hover:bg-slate-50"
                            style={
                              modeFilter === opt.value
                                ? { background: '#eef2ff', color: '#4f46e5', fontWeight: 600 }
                                : { color: '#454c65' }
                            }
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 gap-3">
                <div>
                  <p className={TITLE_DISPLAY_CLASS} style={{ color: '#10162f' }}>
                    Sessions
                  </p>
                </div>

                <div className="flex items-center gap-3 text-[11px]" style={{ color: '#9aa0b3' }}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#059669' }} />
                    Completed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#c3c8d8' }} />
                    Empty
                  </span>
                </div>
              </div>
            </div>

            <div className="reports-list p-3 flex-1 min-h-0 overflow-y-scroll overscroll-contain" style={{ background: '#fbfbfe' }}>
              {sessionsLoading && (
                <div className="bg-white rounded-xl p-6 text-sm text-center" style={{ border: '1px solid #ececf7', color: '#9aa0b3' }}>
                  Loading sessions…
                </div>
              )}

              {sessionsError && (
                <div className="rounded-xl p-5 text-sm" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626' }}>
                  {sessionsError}
                </div>
              )}

              {!sessionsLoading && !sessionsError && filteredSessions.length === 0 && (
                <div className="bg-white rounded-xl p-8 text-center" style={{ border: '1px dashed #d9dae8' }}>
                  <MessageSquareText className="w-8 h-8 mx-auto mb-2" style={{ color: '#d9dae8' }} />
                  <p className="text-sm font-medium" style={{ color: '#454c65' }}>No sessions found</p>
                  <p className="text-xs mt-1" style={{ color: '#9aa0b3' }}>Try changing your search or filter.</p>
                </div>
              )}

              <div className="space-y-2.5">
                {filteredSessions.map((s) => {
                  const isSelected = selectedSessionId === s.id
                  const isCompleted = s.status === 'completed'
                  const isSimulator = s.mode === 'simulator'

                  return (
                    <button
                      key={s.id}
                      onClick={() => selectSession(s)}
                      className="reports-row relative w-full text-left rounded-xl p-3.5 pl-4 flex gap-3.5 overflow-hidden"
                      style={
                        isSelected
                          ? { background: '#eef2ff', border: '1px solid #c7ccfb', boxShadow: '0 4px 14px rgba(79,70,229,0.10)' }
                          : { background: '#fff', border: '1px solid #f0f1f5' }
                      }
                    >
                      <span
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-r transition-opacity"
                        style={{ background: '#4f46e5', opacity: isSelected ? 1 : 0 }}
                      />

                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 self-center"
                        style={isSelected ? { background: '#4f46e5' } : { background: '#f4f4fa' }}
                      >
                        <MessageSquareText className="w-4 h-4" style={{ color: isSelected ? '#fff' : '#4f46e5' }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className="text-[10.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={
                              isSimulator
                                ? { background: '#eef2ff', color: '#4f46e5' }
                                : { background: '#ecfeff', color: '#0891b2' }
                            }
                          >
                            {s.mode}
                          </span>
                          <span className="text-xs whitespace-nowrap" style={{ color: '#9aa0b3' }}>
                            {plural(s.turn_count ?? 0, 'turn')}
                          </span>
                        </div>

                        <div className="reports-display text-sm font-semibold mt-1.5 truncate" style={{ color: '#10162f' }}>
                          {s.scenario || s.product_context || `Session ${s.id.slice(0, 8)}`}
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-2">
                          <span className="text-[11px] truncate" style={{ color: '#9aa0b3' }}>
                            {formatDate(s.created_at)} · {formatTime(s.created_at)} · ID {s.id.slice(0, 8)}
                          </span>

                          <span
                            className="shrink-0 text-[11px] px-2 py-0.5 rounded-full font-semibold"
                            style={
                              isCompleted
                                ? { background: '#ecfdf5', color: '#059669' }
                                : { background: '#f4f4fa', color: '#7f869a' }
                            }
                          >
                            {isCompleted ? 'Completed' : 'Empty'}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

          </section>

          {/* Report Preview */}
          <section className="reports-card overflow-hidden flex flex-col" style={PANEL_STYLE}>

            {reportState === 'idle' && (
              <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                <div className="relative w-20 h-20 mb-4 shrink-0">
                  <div className="absolute inset-0 rounded-3xl" style={{ background: '#eef2ff', border: '1px solid #e0e4ff' }} />
                  <div className="absolute inset-3 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                    <FileText className="w-8 h-8" style={{ color: '#4f46e5' }} />
                  </div>
                  <Sparkles className="w-5 h-5 absolute -top-1 -right-1" style={{ color: '#9333ea' }} />
                </div>

                <h3 className="reports-display text-lg font-bold" style={{ color: '#10162f' }}>
                  Select a session to generate report
                </h3>

                <p className="text-sm max-w-md mx-auto mt-2 leading-6" style={{ color: '#7a8198' }}>
                  Choose a completed session from the list to view the full report with insights,
                  scores, and coaching recommendations.
                </p>

                <div className="w-full max-w-xl border-t mt-5 pt-5" style={{ borderColor: '#f0f1f5' }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-4" style={{ color: '#9aa0b3' }}>
                    What you'll get in the report
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-left">
                    {[
                      { icon: FileText, bg: '#eef2ff', border: '#dbe1ff', fg: '#4f46e5', title: 'Session Summary', desc: 'Scenario, customer tone, turns and duration.' },
                      { icon: TrendingUp, bg: '#ecfdf5', border: '#bdf0d8', fg: '#059669', title: 'Resolution Score', desc: 'How well the issue was resolved.' },
                      { icon: Smile, bg: '#ecfeff', border: '#bdeefc', fg: '#0891b2', title: 'Sentiment Journey', desc: 'Frustration trend across the conversation.' },
                      { icon: Lightbulb, bg: '#fff7ed', border: '#fde3c4', fg: '#ea580c', title: 'Coaching Insights', desc: 'Actionable tips to improve performance.' },
                    ].map((f) => (
                      <div
                        key={f.title}
                        className="rounded-xl p-3.5 flex items-start gap-3"
                        style={{ background: f.bg, border: `1px solid ${f.border}` }}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: '#ffffffb3' }}
                        >
                          <f.icon className="w-4 h-4" style={{ color: f.fg }} />
                        </div>
                        <div>
                          <div className="text-xs font-bold" style={{ color: f.fg }}>{f.title}</div>
                          <div className="text-[11px] mt-0.5 leading-4" style={{ color: f.fg, opacity: 0.75 }}>{f.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {reportState === 'checking' && (
              <CenterState icon={Clock3} title="Checking report status…" text="Please wait a moment." />
            )}

            {reportState === 'empty' && (
              <CenterState
                icon={Inbox}
                iconColor="#7f869a"
                iconBg="#f4f4fa"
                title="This session is empty"
                text="There are no messages in this session yet, so there is nothing to report on. Pick a completed session instead."
              />
            )}

            {reportState === 'not_found' && (
              <CenterState
                icon={FileText}
                title="No report yet"
                text="This session does not have a generated report. Generate one to see its insights."
              >
                <button
                  onClick={generateReport}
                  className="px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all hover:brightness-110"
                  style={{ background: '#4f46e5', boxShadow: '0 8px 20px rgba(79,70,229,0.25)' }}
                >
                  Generate Report
                </button>
              </CenterState>
            )}

            {reportState === 'generating' && (
              <CenterState icon={Sparkles} title="Generating report…" text="This can take a few seconds." />
            )}

            {reportState === 'error' && (
              <CenterState
                icon={FileText}
                iconColor="#dc2626"
                iconBg="#fef2f2"
                text={errorMessage}
                textColor="#dc2626"
              >
                <button
                  onClick={selectedSession?.turn_count ? generateReport : undefined}
                  className="px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all hover:brightness-110"
                  style={{ background: '#4f46e5', boxShadow: '0 8px 20px rgba(79,70,229,0.25)' }}
                >
                  Try Again
                </button>
              </CenterState>
            )}

            {reportState === 'found' && report && (() => {
              const tone = scoreTone(report.resolution_score)
              const circumference = 2 * Math.PI * 26
              const dash = ((report.resolution_score ?? 0) / 100) * circumference
              const tips = report.coaching_tips || []
              const journey = parseJourney(report.sentiment_journey)

              return (
                <>
                  {/* Header */}
                  <div className="p-5 border-b shrink-0" style={{ borderColor: '#f0f1f5', background: 'linear-gradient(90deg, #f5f6ff 0%, #ffffff 60%)' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-2.5"
                          style={{ background: '#eef2ff', color: '#4f46e5' }}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Report Ready
                        </div>

                        <h3 className="reports-display text-lg font-bold truncate" style={{ color: '#10162f' }}>
                          {selectedSession?.scenario || selectedSession?.product_context || 'Session Report'}
                        </h3>

                        {selectedSession && (
                          <p className="text-xs mt-1 capitalize" style={{ color: '#7a8198' }}>
                            {selectedSession.mode} · {plural(selectedSession.turn_count ?? 0, 'turn')} ·{' '}
                            {formatDate(selectedSession.created_at)}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        <div className="relative w-14 h-14">
                          <svg viewBox="0 0 64 64" className="w-14 h-14 -rotate-90">
                            <circle cx="32" cy="32" r="26" fill="none" stroke="#eef2ff" strokeWidth="6" />
                            <circle
                              cx="32" cy="32" r="26" fill="none"
                              stroke={tone.ring} strokeWidth="6" strokeLinecap="round"
                              strokeDasharray={`${dash} ${circumference}`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={TITLE_DISPLAY_CLASS} style={{ color: tone.text }}>
                              {report.resolution_score}
                            </span>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: '#9aa0b3' }}>
                            Resolution
                          </p>
                          <p className="text-xs font-semibold" style={{ color: tone.text }}>{tone.label}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable body */}
                  <div className="reports-body p-5 overflow-y-auto overscroll-contain flex-1 min-h-0" style={{ background: '#fbfbfe' }}>
                    <div className="rounded-xl p-4 mb-6" style={{ background: '#f5f6ff', border: '1px solid #e6e8ff' }}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4f46e5' }}>
                        Session Summary
                      </p>
                      <p className="text-sm leading-6" style={{ color: '#454c65' }}>{report.summary}</p>
                    </div>

                    {journey.length > 0 && <JourneyChart points={journey} />}

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={TITLE_DISPLAY_CLASS} style={{ color: '#10162f' }}>
                          Coaching Recommendations
                        </h4>
                        <span className="text-xs" style={{ color: '#9aa0b3' }}>
                          {plural(tips.length, 'insight')}
                        </span>
                      </div>

                      {tips.length === 0 ? (
                        <p className="text-sm" style={{ color: '#9aa0b3' }}>No coaching tips for this session.</p>
                      ) : (
                        <ul className="space-y-2.5">
                          {tips.map((tip, i) => (
                            <li key={i} className="flex gap-3 rounded-xl p-3.5 bg-white" style={{ border: '1px solid #f0f1f5' }}>
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#fff7ed' }}>
                                <Lightbulb className="w-4 h-4" style={{ color: '#f97316' }} />
                              </div>
                              <div className="text-sm leading-5" style={{ color: '#454c65' }}>
                                {tip.tip}
                                {tip.related_turn != null && (
                                  <span className="block text-[11px] mt-1" style={{ color: '#9aa0b3' }}>
                                    Related to turn {tip.related_turn}
                                  </span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Pinned action bar — always visible, no scrolling needed */}
                  <div className="shrink-0 border-t bg-white px-5 py-3.5 flex flex-wrap items-center gap-3" style={{ borderColor: '#f0f1f5' }}>
                    <button
                      onClick={downloadPdf}
                      disabled={downloading}
                      className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all hover:brightness-110"
                      style={{ background: '#4f46e5', boxShadow: '0 8px 20px rgba(79,70,229,0.25)' }}
                    >
                      <Download className="w-4 h-4" />
                      {downloading ? 'Downloading…' : 'Download PDF'}
                    </button>

                    <button
                      onClick={() => setShowRegenerateConfirm(true)}
                      className="reports-btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl"
                      style={{ color: '#454c65' }}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </button>

                    {errorMessage && <p className="text-sm" style={{ color: '#dc2626' }}>{errorMessage}</p>}
                  </div>
                </>
              )
            })()}
          </section>
        </div>

        {/* Regenerate Confirmation */}
        {showRegenerateConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(16,22,47,0.45)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" style={{ border: '1px solid #f0f1f8' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: '#eef2ff', border: '1px solid #e0e4ff' }}>
                <Sparkles className="w-5 h-5" style={{ color: '#4f46e5' }} />
              </div>

              <h4 className="reports-display text-base font-bold mb-2" style={{ color: '#10162f' }}>
                Regenerate this report?
              </h4>

              <p className="text-sm leading-5 mb-6" style={{ color: '#7a8198' }}>
                This session already has a report. Generating a new one will replace it.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowRegenerateConfirm(false)}
                  className="px-4 py-2.5 text-sm font-medium"
                  style={{ color: '#7a8198' }}
                >
                  Cancel
                </button>

                <button
                  onClick={generateReport}
                  className="px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition-all hover:brightness-110"
                  style={{ background: '#4f46e5', boxShadow: '0 8px 20px rgba(79,70,229,0.25)' }}
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}