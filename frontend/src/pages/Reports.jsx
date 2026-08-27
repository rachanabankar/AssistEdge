import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  FileText,
  TrendingUp,
  Smile,
  Lightbulb,
  Download,
  Sparkles,
  Clock3,
  CheckCircle2,
} from 'lucide-react'
import { replayApi, reportApi } from '../services/api' // adjust path to your actual api.js location

const PAGE_SIZE = 6

// Fixed panel height so the session list and the report preview always
// match — same treatment as Analytics' fixed-height cards (sessions-card /
// mode-card at 285px), just taller since this page has more to show.
const PANEL_HEIGHT = 640

export default function Reports() {
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionsError, setSessionsError] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [modeFilter, setModeFilter] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [page, setPage] = useState(1)

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

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / PAGE_SIZE))
  const pageSessions = filteredSessions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [searchTerm, modeFilter])

  function selectSession(sessionId) {
    setSelectedSessionId(sessionId)
    setReport(null)
    setReportState('checking')
    setErrorMessage('')

    reportApi
      .getReport(sessionId)
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
        setErrorMessage(err?.response?.data?.detail || 'Report generation failed. Try again.')
      })
  }

  async function downloadPdf() {
    if (!selectedSessionId || reportState !== 'found') return

    setDownloading(true)

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

  // Resolution score → ring/label tone, using the same positive/negative
  // vocabulary as Analytics (green #059669 / orange #f97316 / red #dc2626).
  const scoreTone = (score) => {
    if (score >= 80) return { ring: '#059669', text: '#059669', bg: '#ecfdf5', label: 'Strong' }
    if (score >= 50) return { ring: '#f97316', text: '#f97316', bg: '#fff7ed', label: 'Needs work' }
    return { ring: '#dc2626', text: '#dc2626', bg: '#fef2f2', label: 'At risk' }
  }

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

        .reports-btn-ghost {
          border: 1px solid transparent;
          box-shadow: 0 4px 18px rgba(35, 36, 80, 0.08);
          transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
        }

        .reports-btn-ghost:hover:not(:disabled) {
          box-shadow: 0 8px 24px rgba(79, 70, 229, 0.16);
          border-color: #e0e0fc;
          transform: translateY(-1px);
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

      <main className="reports-page min-h-screen -m-6 p-8 box-border">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-7 relative z-10">
          <div>
            <h2 className="reports-display reports-title-gradient text-[28px] font-extrabold">
              Reports
            </h2>
            <p className="text-sm mt-1.5 max-w-2xl" style={{ color: '#7a8198' }}>
              Generate a coaching report for any session — summary, resolution score, sentiment
              journey, and coaching recommendations.
            </p>
          </div>

          <button
            onClick={downloadPdf}
            disabled={reportState !== 'found' || downloading}
            className="reports-btn-ghost flex items-center justify-center gap-2 px-4 py-3 bg-white text-sm font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0"
            style={{ color: '#4f46e5' }}
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Exporting…' : 'Export Report'}
          </button>
        </div>

        {/* Main Workspace — equal-width, equal-height columns */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 relative z-10">

          {/* Sessions */}
          <section
            className="reports-card overflow-hidden flex flex-col"
            style={{ height: PANEL_HEIGHT }}
          >
            <div className="p-4 border-b shrink-0" style={{ borderColor: '#f0f1f5' }}>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9ba1b3' }} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search sessions by title or ID..."
                    className="w-full h-10 pl-10 pr-3 text-sm rounded-xl focus:outline-none transition-all"
                    style={{ background: '#f8f8fc', border: '1px solid #ececf7', color: '#10162f' }}
                  />
                </div>

                <div className="relative">
                  <button
                    onClick={() => setFilterOpen((v) => !v)}
                    className="h-10 flex items-center gap-2 px-3.5 text-sm font-medium rounded-xl transition-colors"
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
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl z-20 p-1.5" style={{ border: '1px solid #ececf7' }}>
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
                          className="w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors"
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
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div>
                  <p className="reports-display text-sm font-bold" style={{ color: '#10162f' }}>
                    Completed Sessions
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#9aa0b3' }}>
                    {filteredSessions.length} session{filteredSessions.length === 1 ? '' : 's'} available
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs" style={{ color: '#9aa0b3' }}>
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#059669' }} />
                  Saved reports
                </div>
              </div>
            </div>

            <div className="reports-list p-3 flex-1 overflow-y-auto" style={{ background: '#fbfbfe' }}>
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
                {pageSessions.map((s) => {
                  const isSelected = selectedSessionId === s.id
                  const isCompleted = s.status === 'completed'
                  const isSimulator = s.mode === 'simulator'

                  return (
                    <button
                      key={s.id}
                      onClick={() => selectSession(s.id)}
                      className="relative w-full text-left rounded-xl p-3.5 pl-4 transition-all flex gap-3 group overflow-hidden"
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
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
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
                                : { background: '#ecfeff', color: '#06b6d4' }
                            }
                          >
                            {s.mode}
                          </span>
                          <span className="text-xs whitespace-nowrap" style={{ color: '#9aa0b3' }}>
                            {s.turn_count} turns
                          </span>
                        </div>

                        <div className="reports-display text-sm font-semibold mt-1.5 truncate" style={{ color: '#10162f' }}>
                          {s.scenario || s.product_context || `Session ${s.id.slice(0, 8)}`}
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-2">
                          <span className="text-[11px] truncate" style={{ color: '#9aa0b3' }}>
                            {formatDate(s.created_at)} · {formatTime(s.created_at)} · ID: {s.id.slice(0, 8)}…
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

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 p-3.5 border-t bg-white shrink-0" style={{ borderColor: '#f0f1f5' }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-30"
                  style={{ color: '#7f869a' }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className="w-8 h-8 text-xs font-semibold rounded-lg transition-colors"
                    style={
                      page === n
                        ? { background: '#4f46e5', color: '#fff', boxShadow: '0 4px 10px rgba(79,70,229,0.25)' }
                        : { color: '#7f869a' }
                    }
                  >
                    {n}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-30"
                  style={{ color: '#7f869a' }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </section>

          {/* Report Preview */}
          <section className="reports-card overflow-hidden flex flex-col" style={{ height: PANEL_HEIGHT }}>

            {reportState === 'idle' && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
                <div className="relative w-20 h-20 mb-5">
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

                <div className="w-full max-w-xl border-t mt-7 pt-6" style={{ borderColor: '#f0f1f5' }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-5" style={{ color: '#9aa0b3' }}>
                    What you'll get in the report
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                    {[
                      { icon: FileText, bg: '#eef2ff', border: '#dbe1ff', fg: '#4f46e5', title: 'Session Summary', desc: 'Scenario, customer tone, turns and duration.' },
                      { icon: TrendingUp, bg: '#ecfdf5', border: '#bdf0d8', fg: '#059669', title: 'Resolution Score', desc: 'How well the issue was resolved.' },
                      { icon: Smile, bg: '#ecfeff', border: '#bdeefc', fg: '#0891b2', title: 'Sentiment Journey', desc: 'Frustration trend across the conversation.' },
                      { icon: Lightbulb, bg: '#fff7ed', border: '#fde3c4', fg: '#ea580c', title: 'Coaching Insights', desc: 'Actionable tips to improve performance.' },
                    ].map((f) => (
                      <div
                        key={f.title}
                        className="rounded-xl p-3.5"
                        style={{ background: f.bg, border: `1px solid ${f.border}` }}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5"
                          style={{ background: '#ffffffb3' }}
                        >
                          <f.icon className="w-4 h-4" style={{ color: f.fg }} />
                        </div>
                        <div className="text-xs font-bold" style={{ color: f.fg }}>{f.title}</div>
                        <div className="text-[11px] mt-1 leading-4" style={{ color: f.fg, opacity: 0.75 }}>{f.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {reportState === 'checking' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#eef2ff' }}>
                  <Clock3 className="w-5 h-5 animate-pulse" style={{ color: '#4f46e5' }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: '#454c65' }}>Checking report status...</p>
                <p className="text-xs mt-1" style={{ color: '#9aa0b3' }}>Please wait a moment.</p>
              </div>
            )}

            {reportState === 'not_found' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#eef2ff', border: '1px solid #e0e4ff' }}>
                  <FileText className="w-6 h-6" style={{ color: '#4f46e5' }} />
                </div>

                <h3 className="reports-display text-base font-bold" style={{ color: '#10162f' }}>No report yet</h3>
                <p className="text-sm max-w-sm mt-2 mb-6" style={{ color: '#7a8198' }}>
                  This session does not have a generated report. Generate one to see its insights.
                </p>

                <button
                  onClick={generateReport}
                  className="px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all hover:brightness-110"
                  style={{ background: '#4f46e5', boxShadow: '0 8px 20px rgba(79,70,229,0.25)' }}
                >
                  Generate Report
                </button>
              </div>
            )}

            {reportState === 'generating' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#eef2ff', border: '1px solid #e0e4ff' }}>
                  <Sparkles className="w-6 h-6 animate-pulse" style={{ color: '#4f46e5' }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: '#454c65' }}>Generating report...</p>
                <p className="text-xs mt-1" style={{ color: '#9aa0b3' }}>This can take a few seconds.</p>
              </div>
            )}

            {reportState === 'error' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#fef2f2' }}>
                  <FileText className="w-6 h-6" style={{ color: '#dc2626' }} />
                </div>

                <p className="text-sm max-w-sm mb-5" style={{ color: '#dc2626' }}>{errorMessage}</p>

                <button
                  onClick={generateReport}
                  className="px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all hover:brightness-110"
                  style={{ background: '#4f46e5', boxShadow: '0 8px 20px rgba(79,70,229,0.25)' }}
                >
                  Try Again
                </button>
              </div>
            )}

            {reportState === 'found' && report && (() => {
              const tone = scoreTone(report.resolution_score)
              const circumference = 2 * Math.PI * 26
              const dash = (report.resolution_score / 100) * circumference

              return (
                <>
                  <div className="p-5 border-b shrink-0" style={{ borderColor: '#f0f1f5', background: 'linear-gradient(90deg, #f5f6ff 0%, #ffffff 60%)' }}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <div
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-2.5"
                          style={{ background: '#eef2ff', color: '#4f46e5' }}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Report Ready
                        </div>

                        <h3 className="reports-display text-lg font-bold" style={{ color: '#10162f' }}>
                          {selectedSession?.scenario || selectedSession?.product_context || 'Session Report'}
                        </h3>

                        {selectedSession && (
                          <p className="text-xs mt-1" style={{ color: '#7a8198' }}>
                            {selectedSession.mode} · {selectedSession.turn_count} turns ·{' '}
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
                            <span className="reports-display text-sm font-bold" style={{ color: tone.text }}>
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

                  <div className="reports-body p-5 overflow-y-auto flex-1">
                    <div className="rounded-xl p-4 mb-6" style={{ background: '#f5f6ff', border: '1px solid #e6e8ff' }}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4f46e5' }}>
                        Session Summary
                      </p>
                      <p className="text-sm leading-6" style={{ color: '#454c65' }}>{report.summary}</p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="reports-display text-sm font-bold" style={{ color: '#10162f' }}>Coaching Recommendations</h4>
                        <span className="text-xs" style={{ color: '#9aa0b3' }}>
                          {report.coaching_tips?.length || 0} insights
                        </span>
                      </div>

                      <ul className="space-y-2.5">
                        {report.coaching_tips.map((tip, i) => (
                          <li key={i} className="flex gap-3 rounded-xl p-3.5" style={{ background: '#fafafd', border: '1px solid #f0f1f5' }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#fff7ed' }}>
                              <Lightbulb className="w-4 h-4" style={{ color: '#f97316' }} />
                            </div>
                            <div className="text-sm leading-5" style={{ color: '#454c65' }}>
                              {tip.tip}
                              <span className="block text-[11px] mt-1" style={{ color: '#9aa0b3' }}>
                                Related to turn {tip.related_turn}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={downloadPdf}
                        disabled={downloading}
                        className="px-4 py-2.5 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all hover:brightness-110"
                        style={{ background: '#4f46e5', boxShadow: '0 8px 20px rgba(79,70,229,0.25)' }}
                      >
                        {downloading ? 'Downloading…' : 'Download PDF'}
                      </button>

                      <button
                        onClick={() => setShowRegenerateConfirm(true)}
                        className="px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors"
                        style={{ color: '#454c65', border: '1px solid #e8e9f1' }}
                      >
                        Regenerate Report
                      </button>
                    </div>

                    {errorMessage && <p className="text-sm mt-3" style={{ color: '#dc2626' }}>{errorMessage}</p>}
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