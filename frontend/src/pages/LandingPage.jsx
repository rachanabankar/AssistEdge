import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Zap, Smile, ShieldAlert, BookOpen, MessageSquare, Users, PlayCircle,
  FileText, BarChart3, ShieldCheck, Lock, Check, Download, Menu, X, ChevronDown,
  GraduationCap, UserPlus, LayoutGrid,
  SlidersHorizontal, UploadCloud, ClipboardCheck, Bot, Layers, Gauge,
} from "lucide-react";

/* ---------------- tokens: light, white cards, indigo -> purple ---------------- */
const GRAD = "bg-gradient-to-r from-indigo-600 to-purple-500";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";
const DISPLAY = "font-[Sora,ui-sans-serif,system-ui,sans-serif]";
const GTEXT = "bg-gradient-to-r from-indigo-700 via-purple-600 to-fuchsia-600 bg-clip-text pb-1 text-transparent";
const GTEXT_LIGHT = "bg-gradient-to-r from-indigo-200 via-purple-200 to-cyan-200 bg-clip-text pb-1 text-transparent";

const NAV = [
  ["top", "Home"], ["modes", "Modes"], ["features", "Features"], ["how", "How it works"],
  ["start", "Get started"], ["reports", "Reports"], ["about", "About"],
];
const IDS = NAV.map(([id]) => id);

const scrollToId = (id) => (e) => {
  e.preventDefault();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
};

/* ---------------- content ---------------- */
const MODES = [
  {
    key: "Simulator", icon: MessageSquare, title: "Simulator Mode", bar: "from-indigo-500 to-purple-500",
    text: "Practice against an AI customer built from your scenario. Choose the tone and patience level, then reply. The customer escalates, plateaus or calms down depending on how well you handle each turn.",
    points: ["A new, in-character customer message every turn", "Three-panel console: conversation, coaching feed and knowledge, updating every message", "Safe to make mistakes: no real customer is involved"],
    setup: ["Scenario", "Product context", "Customer tone", "Patience level"],
  },
  {
    key: "Manual", icon: Users, title: "Manual Mode", bar: "from-cyan-500 to-indigo-500",
    text: "Coach a real conversation happening on email, chat or phone notes. Paste what the customer wrote, read the guidance, then log the reply you sent.",
    points: ["Works next to any support channel", "Sentiment, risk and knowledge suggestions per customer message", "End the session to save your final reply"],
    setup: ["Scenario", "Product context"],
  },
  {
    key: "Replay", icon: PlayCircle, title: "Replay Mode", bar: "from-purple-500 to-fuchsia-500",
    text: "Open any finished session and watch it back turn by turn, using the sentiment and escalation data saved at the time. Nothing is regenerated, so replays are instant and faithful.",
    points: ["Next, previous, first, last, slider and auto-play", "Transcript, sentiment and escalation risk panels", "Shows scenario, tone, turns and duration"],
    setup: ["Pick a past session", "Step or auto-play"],
  },
];

const FEATURES = [
  { icon: Zap, title: "Live response coaching", span: "lg:col-span-2", tone: "from-indigo-50", ico: "from-indigo-500 to-purple-500", bar: "bg-indigo-500",
    text: "Get suggested replies in different tones, tone and clarity feedback, and communication tips with the reasoning behind them. Pick one, edit it, and send.",
    art: <div className="flex flex-wrap gap-2 text-xs font-semibold">{["Empathetic", "Direct", "Reassuring"].map((t, i) => <span key={t} className={`rounded-full px-3 py-1 ${["bg-indigo-100 text-indigo-700", "bg-purple-100 text-purple-700", "bg-cyan-100 text-cyan-700"][i]}`}>{t}</span>)}</div> },
  { icon: Smile, title: "Sentiment & intent", tone: "from-emerald-50", ico: "from-emerald-500 to-teal-500", bar: "bg-emerald-500",
    text: "Intent, emotional state, a 0–100 frustration score and the satisfaction trend for each customer message.",
    art: <div className="flex h-9 items-end gap-1.5">{[80, 62, 48, 30, 18].map((h) => <i key={h} style={{ height: `${h}%` }} className="w-4 rounded-t bg-emerald-400" />)}</div> },
  { icon: ShieldAlert, title: "Escalation monitor", tone: "from-rose-50", ico: "from-rose-500 to-orange-500", bar: "bg-rose-500",
    text: "Risk scored 0–100 on every turn, with reasoning. At 70 or above an alert appears with recommended resolution strategies.",
    art: <div className="h-2 overflow-hidden rounded-full bg-rose-100"><div className="h-full w-[72%] rounded-full bg-gradient-to-r from-amber-400 to-rose-500" /></div> },
  { icon: BookOpen, title: "Knowledge recommendations", span: "lg:col-span-2", tone: "from-cyan-50", ico: "from-cyan-500 to-blue-500", bar: "bg-cyan-500",
    text: "Upload FAQs, support docs and policy PDFs for a session. They are chunked and embedded on your own machine, and the two most relevant passages surface as the conversation moves. You can also search the knowledge base by hand.",
    art: <div className="flex flex-wrap gap-2 text-xs font-semibold text-cyan-800">{["FAQs", "Support docs", "Policies"].map((t) => <span key={t} className="rounded-lg bg-cyan-100 px-3 py-1">{t}</span>)}</div> },
  { icon: FileText, title: "Session reports", tone: "from-purple-50", ico: "from-purple-500 to-fuchsia-500", bar: "bg-purple-500",
    text: "A summary, resolution quality score, sentiment journey and coaching tips. Regenerate any time, then download as PDF.",
    art: <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700"><Download size={13} /> report.pdf</span> },
  { icon: BarChart3, title: "Analytics", tone: "from-amber-50", ico: "from-amber-500 to-orange-500", bar: "bg-amber-500",
    text: "Trends across sessions: common escalation triggers, knowledge gaps and agent improvement indicators, plus sessions, resolution rate and sentiment over 7 or 30 days.",
    art: <svg viewBox="0 0 120 30" className="h-8 w-28"><polyline fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points="2,24 22,16 42,20 62,9 82,13 118,3" /></svg> },
];

const PIPELINE = [
  { icon: MessageSquare, title: "Customer message", text: "Generated by the Customer Simulator Agent, pasted in Manual Mode, or loaded in Replay Mode.", out: ["Simulator", "Manual", "Replay"], c: "from-slate-400 to-slate-500" },
  { icon: Smile, title: "Intent & Sentiment Agent", text: "Works out what the customer wants and how they feel.", out: ["intent", "emotional state", "frustration 0–100", "satisfaction trend"], c: "from-emerald-400 to-teal-500" },
  { icon: BookOpen, title: "Knowledge Recommendation Agent", text: "Searches your uploaded documents for the passages that answer the customer.", out: ["top 2 passages", "source details"], c: "from-cyan-400 to-blue-500" },
  { icon: Zap, title: "Coaching & Response Agent", text: "Writes suggested replies and explains the thinking.", out: ["replies by tone", "tone & clarity feedback", "improvement tips", "reasoning"], c: "from-indigo-400 to-purple-500" },
  { icon: ShieldAlert, title: "Escalation Risk Monitor", text: "Scores how likely the customer is to escalate and what to do about it.", out: ["risk 0–100", "reasoning", "alert at 70+", "resolution strategies"], c: "from-rose-400 to-orange-500" },
  { icon: FileText, title: "Post-Interaction Summary Agent", text: "Reads the finished session and its saved scores to build the report.", out: ["summary", "resolution quality score", "sentiment journey", "coaching tips"], c: "from-purple-400 to-fuchsia-500" },
];

const STEPS = [
  { icon: UserPlus, title: "Create your account", text: "Sign up with email and password, or continue with Google. Forgot your password? Reset it from the login page.", chip: "Sign Up" },
  { icon: LayoutGrid, title: "Pick a mode", text: "From the dashboard choose Simulator to practise, Manual to coach a live chat, or Replay to review a past session.", chip: "Dashboard" },
  { icon: SlidersHorizontal, title: "Describe the session", text: "Add the scenario and product context. In Simulator Mode, also set the customer's tone and patience level.", chip: "Setup form" },
  { icon: UploadCloud, title: "Add your knowledge base", text: "Upload FAQs, support docs or policy files so recommendations come from your own material. This step is optional.", chip: "Optional" },
  { icon: MessageSquare, title: "Chat and follow the coaching", text: "On every customer message, check the sentiment, risk, knowledge and suggested replies before you answer.", chip: "Live panels" },
  { icon: ClipboardCheck, title: "End and review", text: "Finish the session, generate the report, download the PDF, or replay the conversation to see where it turned.", chip: "Reports" },
];

const STACK = [
  ["Backend", "bg-indigo-50 text-indigo-700 border-indigo-100", ["FastAPI", "SQLite", "SQLAlchemy"]],
  ["Frontend", "bg-cyan-50 text-cyan-700 border-cyan-100", ["React 19", "Vite", "Tailwind CSS"]],
  ["AI and retrieval", "bg-purple-50 text-purple-700 border-purple-100", ["OpenRouter", "LangChain", "ChromaDB", "Sentence-transformers"]],
];

const STATS = [
  { icon: Bot, n: "6", label: "AI agents", text: "Simulator, sentiment, knowledge, coaching, escalation and summary", tone: "from-indigo-50", ico: "from-indigo-500 to-purple-500", bar: "bg-indigo-500" },
  { icon: Layers, n: "3", label: "Interaction modes", text: "Practise, coach a live chat, or replay a session", tone: "from-cyan-50", ico: "from-cyan-500 to-blue-500", bar: "bg-cyan-500" },
  { icon: Gauge, n: "0–100", label: "Live scores", text: "Frustration and escalation risk on every message", tone: "from-rose-50", ico: "from-rose-500 to-orange-500", bar: "bg-rose-500" },
  { icon: FileText, n: "PDF", label: "Session reports", text: "Resolution quality score, sentiment journey and coaching tips", tone: "from-purple-50", ico: "from-purple-500 to-fuchsia-500", bar: "bg-purple-500" },
];

const SOFT = {
  Simulator: "from-indigo-100 via-violet-100 to-purple-100",
  Manual: "from-cyan-100 via-sky-100 to-indigo-100",
  Replay: "from-purple-100 via-fuchsia-100 to-pink-100",
};

const FAQ = [
  ["Do I need real customers to try it?", "No. Simulator Mode generates a realistic customer from the scenario, tone and patience level you choose, so you can practise with no risk."],
  ["Can it coach a chat that happens somewhere else?", "Yes. In Manual Mode you paste the customer's messages and log your replies. AssistEdge runs the same analysis on every customer turn."],
  ["Does Replay Mode call the AI again?", "No. Replay shows data saved during the session, so it is fast and always matches what happened live."],
  ["Where do the knowledge suggestions come from?", "From the documents you upload for the session. They are embedded locally, so no extra embedding service is needed."],
  ["Which sign-in options are available?", "Email and password, Google sign-in, and a password reset flow."],
];

const DEMO = [
  { customer: "I'm really frustrated. My order hasn't arrived and it's been two weeks!", agent: "I'm sorry for the delay — that's not the experience we want you to have. Let me check the status for you right now.",
    risk: 74, level: "High", emotion: "Frustrated", frustration: 81, trend: "Declining", tip: "Acknowledge the delay first, then give a clear next step.", kb: "Order delay & late delivery policy" },
  { customer: "Okay. But I need to know exactly when it will arrive.", agent: "Your parcel is at the local depot and is scheduled for delivery tomorrow by 6 PM. I'll email you the tracking link now.",
    risk: 46, level: "Medium", emotion: "Impatient", frustration: 52, trend: "Stabilising", tip: "Give a specific time and confirm what you will send.", kb: "Tracking and delivery windows" },
  { customer: "Alright, that helps. Thanks for sorting it out.", agent: "Happy to help. If it doesn't arrive by tomorrow evening, reply here and I'll arrange a replacement straight away.",
    risk: 18, level: "Low", emotion: "Satisfied", frustration: 21, trend: "Improving", tip: "Close with a clear fallback so the customer feels covered.", kb: "Replacement and refund options" },
];
const riskTone = (v) => (v >= 70 ? "red" : v >= 40 ? "amber" : "green");
const RING = { red: "#e11d48", amber: "#f59e0b", green: "#10b981" };

/* ---------------- small pieces ---------------- */
function Logo({ light }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${GRAD} text-lg font-bold text-white shadow-md shadow-indigo-200`}>A</span>
      <span className={`${DISPLAY} text-xl font-bold tracking-tight ${light ? "text-white" : "text-slate-900"}`}>AssistEdge</span>
    </span>
  );
}

function Ring({ value, color = "#6366f1", size = 84, label }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label || `Score ${value} out of 100`}>
      <svg viewBox="0 0 80 80" width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#eef2ff" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)} className="transition-all duration-700 motion-reduce:transition-none" />
      </svg>
      <span className={`${DISPLAY} absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-900`}>{value}</span>
    </div>
  );
}

function Pill({ tone = "green", children }) {
  const t = { red: "bg-rose-50 text-rose-600", amber: "bg-amber-50 text-amber-600", green: "bg-emerald-50 text-emerald-600", indigo: "bg-indigo-50 text-indigo-600" }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${t}`}>
      <i className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />{children}
    </span>
  );
}

function SectionHead({ title, sub, align = "center", light }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      <h2 className={`${DISPLAY} text-3xl font-bold tracking-tight sm:text-4xl ${light ? GTEXT_LIGHT : GTEXT}`}>{title}</h2>
      {sub && <p className={`mt-3 text-base leading-relaxed sm:text-lg ${light ? "text-indigo-100" : "text-indigo-900/70"}`}>{sub}</p>}
    </div>
  );
}

function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return undefined;
    const obs = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-35% 0px -60% 0px" });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [ids]);
  return active;
}

/* mode illustrations, drawn with markup so no image files are needed */
function ModeArt({ k }) {
  const bub = "rounded-2xl border px-3.5 py-2 text-xs";
  const card = "rounded-xl border border-slate-200 bg-white p-3 shadow-sm";
  if (k === "Simulator")
    return (
      <div className="space-y-2.5">
        <div className="flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-indigo-600 px-3 py-1 text-white">Tone: Frustrated</span><span className="rounded-full bg-purple-600 px-3 py-1 text-white">Patience: Low</span></div>
        <p className={`${bub} max-w-[85%] rounded-tl-sm border-slate-200 bg-slate-100 text-slate-800`}>My refund still hasn't come through!</p>
        <p className={`${bub} ml-auto max-w-[85%] rounded-tr-sm border-emerald-200 bg-emerald-100 text-emerald-900`}>I understand. Let me look at it now.</p>
        <p className={`${bub} max-w-[85%] rounded-tl-sm border-slate-200 bg-slate-100 text-slate-800`}>Okay… that's a bit better.</p>
      </div>
    );
  if (k === "Manual")
    return (
      <div className="space-y-2.5 text-xs">
        <div className={card}><p className="font-semibold text-cyan-700">Paste customer message</p><p className="mt-1 text-slate-800">Hi, my invoice shows a double charge…</p></div>
        <div className={card}><p className="font-semibold text-emerald-700">Your reply</p><p className="mt-1 text-slate-800">Thanks for flagging this, I'm checking it now.</p></div>
        <div className="flex justify-end"><span className={`rounded-lg ${GRAD} px-3 py-1.5 font-semibold text-white`}>End session</span></div>
      </div>
    );
  return (
    <div className="space-y-2.5 text-xs">
      <div className={card}><p className="font-semibold text-purple-700">Turn 4 of 8</p><div className="mt-2 h-1.5 rounded-full bg-purple-100"><div className="h-full w-1/2 rounded-full bg-purple-500" /></div></div>
      <div className={card}>
        <p className="font-semibold text-slate-600">Escalation risk across the session</p>
        <svg viewBox="0 0 200 50" className="mt-1 w-full"><polyline fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points="4,10 32,16 60,34 88,28 116,40 144,36 172,44 196,46" /></svg>
      </div>
      <div className="flex gap-2"><Pill tone="amber">Medium</Pill><Pill tone="indigo">Step through</Pill></div>
    </div>
  );
}

/* hero demo: loops continuously, no controls or counters */
function LiveDemo() {
  const [i, setI] = useState(0);
  const t = DEMO[i], tone = riskTone(t.risk);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % DEMO.length), 4800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-indigo-200/60 via-purple-200/50 to-cyan-200/40 blur-2xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-indigo-100">
        <div className={`h-1.5 ${GRAD}`} />
        <div className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className={`${DISPLAY} font-bold text-slate-900`}>Live conversation</span>
            <Pill tone="green">Coaching live</Pill>
          </div>
          <div className="min-h-[150px] space-y-2.5 text-sm">
            <p className="max-w-[88%] rounded-2xl rounded-tl-sm bg-slate-100 px-3.5 py-2 text-slate-800"><span className="block text-xs font-semibold text-slate-500">Customer</span>{t.customer}</p>
            <p className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-emerald-100 px-3.5 py-2 text-emerald-900"><span className="block text-xs font-semibold text-emerald-700">You</span>{t.agent}</p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200"><div className="h-1 bg-rose-500" />
              <div className="flex items-center gap-3 p-3">
                <Ring value={t.risk} color={RING[tone]} size={72} label={`Escalation risk ${t.risk} out of 100`} />
                <div className="space-y-1.5"><p className="text-sm font-semibold text-slate-900">Escalation risk</p><Pill tone={tone}>{t.level}</Pill></div>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200"><div className="h-1 bg-emerald-500" />
              <div className="space-y-1.5 p-3">
                <p className="text-sm font-semibold text-slate-900">Sentiment</p>
                <div className="flex flex-wrap gap-1.5"><Pill tone={tone}>{t.emotion}</Pill><Pill tone="indigo">{t.trend}</Pill></div>
                <p className="text-xs text-slate-500">Frustration {t.frustration} / 100</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/60"><div className="h-1 bg-indigo-500" />
              <div className="p-3"><p className="flex items-center gap-1.5 text-sm font-semibold text-indigo-700"><Zap size={14} aria-hidden="true" /> Coaching tip</p><p className="mt-1 text-sm text-slate-700">{t.tip}</p></div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-cyan-100 bg-cyan-50/60"><div className="h-1 bg-cyan-500" />
              <div className="p-3"><p className="flex items-center gap-1.5 text-sm font-semibold text-cyan-700"><BookOpen size={14} aria-hidden="true" /> Knowledge</p><p className="mt-1 text-sm text-slate-700">{t.kb}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */
export default function LandingPage() {
  const [tab, setTab] = useState(0);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [faq, setFaq] = useState(0);
  const active = useScrollSpy(IDS);
  const mode = MODES[tab];

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!menu) return undefined;
    const on = (e) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [menu]);

  const navTo = (id) => (e) => { setMenu(false); scrollToId(id)(e); };
  const onTabKey = (e) => {
    if (e.key === "ArrowRight") setTab((n) => (n + 1) % MODES.length);
    if (e.key === "ArrowLeft") setTab((n) => (n - 1 + MODES.length) % MODES.length);
  };

  const journey = [78, 71, 58, 44, 31, 20];
  const pts = journey.map((v, k) => [8 + k * 56.8, 8 + (v / 100) * 50]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f8ff] text-slate-800 antialiased">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&display=swap');`}</style>

      {/* NAV */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur transition-colors ${scrolled ? "border-slate-200 bg-white/90 shadow-sm" : "border-transparent bg-white/60"}`}>
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6" aria-label="Main">
          <a href="#top" onClick={navTo("top")} aria-label="AssistEdge home" className={`rounded-lg ${FOCUS}`}><Logo /></a>
          <div className="hidden items-center gap-0.5 lg:flex">
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={navTo(id)} aria-current={active === id ? "true" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${FOCUS} ${active === id ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:text-indigo-600"}`}>{label}</a>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className={`hidden rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 sm:block ${FOCUS}`}>Login</Link>
            <Link to="/signup" className={`hidden rounded-lg ${GRAD} px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:opacity-90 sm:block ${FOCUS}`}>Sign Up</Link>
            <button onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-controls="mobile-menu" aria-label={menu ? "Close menu" : "Open menu"} className={`rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden ${FOCUS}`}>
              {menu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
        {menu && (
          <div id="mobile-menu" className="border-t border-slate-200 bg-white px-5 pb-5 pt-3 lg:hidden">
            <div className="flex flex-col">
              {NAV.map(([id, label]) => (
                <a key={id} href={`#${id}`} onClick={navTo(id)} className={`rounded-lg px-3 py-3 text-base font-medium ${active === id ? "bg-indigo-50 text-indigo-700" : "text-slate-700"}`}>{label}</a>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link to="/login" className="rounded-xl border border-slate-300 py-2.5 text-center text-sm font-semibold text-slate-800">Login</Link>
              <Link to="/signup" className={`rounded-xl ${GRAD} py-2.5 text-center text-sm font-semibold text-white`}>Sign Up</Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* HERO: sized to fit one screen */}
        <section id="top" className="relative flex min-h-[calc(100svh-4rem)] scroll-mt-16 items-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(129,140,248,0.30),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.18),transparent_55%)]" aria-hidden="true" />
          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-5 py-8 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-1.5 text-sm font-medium text-indigo-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />Customer support coaching, during the conversation
              </span>
              <h1 className={`${DISPLAY} mt-5 text-4xl font-extrabold leading-[1.15] tracking-tight ${GTEXT} xl:text-[2.9rem]`}>
                An AI coach beside every support agent, in every live conversation
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-indigo-900/80">
                AssistEdge coaches support agents message by message. It reads customer intent and emotion, flags escalation risk, pulls answers from your own FAQs and policies, and suggests what to say next. Every session ends with a report you can learn from.
              </p>
              <div className="mt-7 flex flex-wrap gap-4">
                <a href="#start" onClick={navTo("start")} className={`inline-flex items-center gap-2 rounded-xl ${GRAD} px-7 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:opacity-90 ${FOCUS}`}>
                  Start a session <ArrowRight size={18} aria-hidden="true" />
                </a>
                <a href="#modes" onClick={navTo("modes")} className={`inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-7 py-3.5 font-semibold text-slate-800 transition hover:border-indigo-300 hover:text-indigo-700 ${FOCUS}`}>Explore the modes</a>
              </div>
              <ul className="mt-6 grid max-w-md grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-600">
                {["Real-time sentiment", "Escalation alerts", "Knowledge from your docs", "PDF reports"].map((x) => (
                  <li key={x} className="flex items-center gap-1.5"><Check size={16} className="shrink-0 text-indigo-600" aria-hidden="true" />{x}</li>
                ))}
              </ul>
            </div>
            <LiveDemo />
          </div>
        </section>

        {/* STATS */}
        <section className="bg-white py-10" aria-label="At a glance">
          <dl className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {STATS.map(({ icon: Icon, n, label, text, tone, ico, bar }) => (
              <div key={label} className={`overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${tone} to-white`}>
                <div className={`h-1 ${bar}`} />
                <div className="flex items-start gap-4 p-5">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${ico} text-white shadow-md`}><Icon size={22} aria-hidden="true" /></span>
                  <div>
                    <dt className={`${DISPLAY} text-3xl font-extrabold leading-tight ${GTEXT}`}>{n}</dt>
                    <dd className="mt-1.5 text-sm font-semibold text-slate-800">{label}</dd>
                    <dd className="mt-0.5 text-xs leading-relaxed text-slate-500">{text}</dd>
                  </div>
                </div>
              </div>
            ))}
          </dl>
        </section>

        {/* MODES: sized to fit one screen */}
        <section id="modes" className="flex min-h-[calc(100svh-4rem)] scroll-mt-16 items-center bg-gradient-to-b from-indigo-50 via-white to-purple-50 py-10">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-6">
            <div className="text-center">
              <h2 className={`${DISPLAY} text-3xl font-bold tracking-tight ${GTEXT} sm:text-4xl`}>Practise, coach live, or review</h2>
              <p className="mx-auto mt-2 max-w-xl text-indigo-900/70">Three modes on one platform. Pick the one that matches what you are doing right now.</p>
            </div>
            <div role="tablist" aria-label="Interaction modes" onKeyDown={onTabKey} className="mx-auto mt-6 flex w-fit max-w-full rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
              {MODES.map((m, k) => (
                <button key={m.key} role="tab" id={`tab-${m.key}`} aria-selected={tab === k} aria-controls="mode-panel" tabIndex={tab === k ? 0 : -1} onClick={() => setTab(k)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition sm:px-5 ${FOCUS} ${tab === k ? `${GRAD} text-white shadow` : "text-slate-600 hover:text-indigo-600"}`}>
                  <m.icon size={16} aria-hidden="true" />{m.key}
                </button>
              ))}
            </div>
            <div id="mode-panel" role="tabpanel" aria-labelledby={`tab-${mode.key}`} className="mx-auto mt-6 grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-indigo-100 md:grid-cols-[1.1fr_1fr]">
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${mode.bar} text-white`}><mode.icon size={22} aria-hidden="true" /></span>
                  <h3 className={`${DISPLAY} text-xl font-bold text-indigo-900`}>{mode.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{mode.text}</p>
                <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
                  {mode.points.map((p) => <li key={p} className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-indigo-600" aria-hidden="true" />{p}</li>)}
                </ul>
                <p className="mt-4 text-sm font-semibold text-slate-900">What you set up</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {mode.setup.map((x) => <span key={x} className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{x}</span>)}
                </div>
                <a href="#start" onClick={navTo("start")} className={`mt-5 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-indigo-600 hover:text-indigo-800 ${FOCUS}`}>See how to start <ArrowRight size={16} aria-hidden="true" /></a>
              </div>
              <div className={`flex items-center bg-gradient-to-br ${SOFT[mode.key]} p-6 md:p-8`}>
                <div className="w-full rounded-2xl border border-white/80 bg-white/60 p-4 shadow-sm backdrop-blur">
                  <div className="mb-3 flex gap-1.5" aria-hidden="true"><i className="h-2.5 w-2.5 rounded-full bg-rose-300" /><i className="h-2.5 w-2.5 rounded-full bg-amber-300" /><i className="h-2.5 w-2.5 rounded-full bg-emerald-300" /></div>
                  <ModeArt k={mode.key} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="scroll-mt-16 bg-white py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <SectionHead title="Everything an agent needs, in the moment" sub="Every customer message is analysed and the results land in separate panels, so you can read what matters at a glance." />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ icon: Icon, title, text, art, bar, tone, ico, span = "" }) => (
                <article key={title} className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${tone} to-white ${span}`}>
                  <div className={`h-1 ${bar}`} />
                  <div className="flex flex-1 flex-col p-6">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${ico} text-white shadow-md`}><Icon size={21} aria-hidden="true" /></span>
                    <h3 className="mt-4 font-bold text-indigo-900">{title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{text}</p>
                    <div className="mt-5">{art}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="relative scroll-mt-16 overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-900 py-24">
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
            <SectionHead light title="How every message is handled" sub="Each customer message passes through the same six steps. If one agent fails, the others still run, so you always get something useful." />
            <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {PIPELINE.map(({ icon: Icon, title, text, out, c }, k) => (
                <li key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${c} text-white shadow-lg`}><Icon size={21} aria-hidden="true" /></span>
                    <span className={`${DISPLAY} text-sm font-bold text-indigo-200`}>Step {k + 1}</span>
                  </div>
                  <h3 className="mt-4 font-bold text-white">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-indigo-100/90">{text}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {out.map((o) => <span key={o} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-indigo-100">{o}</span>)}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* GET STARTED */}
        <section id="start" className="scroll-mt-16 bg-gradient-to-b from-white to-indigo-50 py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <SectionHead title="How to start a session" sub="You can be coached on your first customer message in about five minutes." />
            <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, text, chip }, k) => (
                <li key={title} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className={`absolute inset-x-0 top-0 h-1 ${GRAD}`} />
                  <div className="flex items-center gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${GRAD} text-white shadow-md shadow-indigo-200`}><Icon size={21} aria-hidden="true" /></span>
                    <span className={`${DISPLAY} text-sm font-bold text-indigo-600`}>Step {k + 1}</span>
                    <span className="ml-auto rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{chip}</span>
                  </div>
                  <h3 className="mt-4 font-bold text-indigo-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link to="/signup" className={`inline-flex items-center gap-2 rounded-xl ${GRAD} px-8 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 hover:opacity-90 ${FOCUS}`}>Create your account <ArrowRight size={18} aria-hidden="true" /></Link>
              <Link to="/login" className={`rounded-xl border border-slate-300 bg-white px-8 py-3.5 font-semibold text-slate-800 hover:border-indigo-300 hover:text-indigo-700 ${FOCUS}`}>I already have an account</Link>
            </div>
          </div>
        </section>

        {/* REPORTS */}
        <section id="reports" className="relative scroll-mt-16 overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-purple-50 py-24">
          <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <h2 className={`${DISPLAY} text-3xl font-bold tracking-tight ${GTEXT} sm:text-4xl`}>Every session ends with a clear report</h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">The Post-Interaction Summary Agent reviews the whole conversation, so you know what worked and what to change. Regenerate it whenever you like, or download it as a PDF.</p>
              <ul className="mt-7 space-y-3">
                {[
                  [Gauge, "Resolution quality score", "One 0–100 score for how well the issue was resolved.", "from-indigo-500 to-purple-500"],
                  [Smile, "Sentiment journey", "See exactly where the customer's mood turned.", "from-emerald-500 to-teal-500"],
                  [Zap, "Coaching tips", "Specific advice to use in your next session.", "from-amber-500 to-orange-500"],
                ].map(([Icon, t, d, c]) => (
                  <li key={t} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c} text-white`}><Icon size={21} aria-hidden="true" /></span>
                    <span><span className="block font-bold text-indigo-900">{t}</span><span className="text-sm text-slate-600">{d}</span></span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-slate-500">The Reports page lets you search, filter by mode and page through every session.</p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-indigo-100">
              <div className={`h-1.5 ${GRAD}`} />
              <div className="p-6 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className={`${DISPLAY} font-bold text-slate-900`}>Order delay · Simulator</p><p className="text-xs text-slate-500">Sample report preview</p></div>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-700"><Download size={13} aria-hidden="true" /> PDF</span>
                </div>
                <div className="mt-5 grid items-center gap-5 sm:grid-cols-[auto_1fr]">
                  <div className="flex items-center gap-4 rounded-2xl bg-indigo-50/70 p-4">
                    <Ring value={82} size={92} label="Sample resolution quality score 82 out of 100" />
                    <p className="text-sm font-semibold text-slate-800">Resolution<br />quality score</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[["8", "Turns", "bg-cyan-50 text-cyan-700"], ["6 min", "Duration", "bg-emerald-50 text-emerald-700"], ["1", "Alerts", "bg-rose-50 text-rose-700"]].map(([v, l, c]) => (
                      <div key={l} className={`rounded-xl px-2 py-3 ${c}`}><p className={`${DISPLAY} text-lg font-bold`}>{v}</p><p className="text-xs">{l}</p></div>
                    ))}
                  </div>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-slate-600">The customer opened frustrated about a late order. The agent acknowledged the delay, gave a delivery time and offered a fallback, and sentiment improved steadily.</p>
                <p className="mt-5 text-sm font-semibold text-slate-900">Sentiment journey</p>
                <svg viewBox="0 0 300 70" className="mt-2 w-full" role="img" aria-label="Customer frustration falling steadily over the session">
                  <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" /><stop offset="100%" stopColor="#6366f1" stopOpacity="0" /></linearGradient></defs>
                  <polygon fill="url(#rg)" points={`8,70 ${pts.map((q) => q.join(",")).join(" ")} 292.0,70`} />
                  <polyline fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={pts.map((q) => q.join(",")).join(" ")} />
                  {pts.map(([x, y]) => <circle key={x} cx={x} cy={y} r="4" fill="#fff" stroke="#6366f1" strokeWidth="2.5" />)}
                </svg>
                <div className="flex justify-between text-xs text-slate-500"><span>Frustrated</span><span>Satisfied</span></div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <p className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" />Acknowledge frustration earlier in the conversation.</p>
                  <p className="flex gap-2 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900"><Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" />Offer a concrete next step before closing.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT + FAQ */}
        <section id="about" className="scroll-mt-16 bg-gradient-to-b from-white via-indigo-50/70 to-purple-50 py-24">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-indigo-100">
              <div className={`h-1.5 ${GRAD}`} />
              <div className="p-7 sm:p-9">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${GRAD} text-white shadow-md shadow-indigo-200`}><GraduationCap size={24} aria-hidden="true" /></span>
                <h2 className={`${DISPLAY} mt-5 text-3xl font-bold tracking-tight ${GTEXT}`}>Built to coach in the moment</h2>
                <p className="mt-4 leading-relaxed text-slate-600">Support agents handle many conversations a day, often without live guidance or quick feedback, and post-call reviews arrive too late to help. AssistEdge gives that guidance while the conversation is still going.</p>
                <div className="mt-7 space-y-4 border-t border-slate-100 pt-6">
                  <p className="text-sm font-bold text-slate-900">Built with</p>
                  {STACK.map(([group, cls, items]) => (
                    <div key={group} className="flex flex-wrap items-center gap-2">
                      <span className="w-28 shrink-0 text-xs font-semibold text-slate-500">{group}</span>
                      {items.map((x) => <span key={x} className={`rounded-full border px-3 py-1 text-xs font-medium ${cls}`}>{x}</span>)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-indigo-100">
              <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500" />
              <div className="p-7 sm:p-9">
                <h3 className={`${DISPLAY} text-2xl font-bold text-indigo-900`}>Common questions</h3>
                <div className="mt-5 space-y-3">
                  {FAQ.map(([q, a], k) => (
                    <div key={q} className={`overflow-hidden rounded-2xl border transition-colors ${faq === k ? "border-indigo-200 bg-indigo-50/60" : "border-slate-200 bg-white hover:border-indigo-200"}`}>
                      <button onClick={() => setFaq(faq === k ? -1 : k)} aria-expanded={faq === k} aria-controls={`faq-${k}`} className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-indigo-900 ${FOCUS}`}>
                        {q}
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${faq === k ? `${GRAD} text-white` : "bg-indigo-50 text-indigo-600"}`}>
                          <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${faq === k ? "rotate-180" : ""}`} />
                        </span>
                      </button>
                      {faq === k && <p id={`faq-${k}`} className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{a}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-b from-purple-50 to-white px-5 pb-20 pt-4 sm:px-6">
          <div className={`relative mx-auto max-w-7xl overflow-hidden rounded-3xl ${GRAD} px-8 py-16 text-center text-white shadow-xl shadow-indigo-200`}>
            <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-20 -right-12 h-64 w-64 rounded-full bg-white/10" aria-hidden="true" />
            <div className="relative">
              <h2 className={`${DISPLAY} text-3xl font-bold tracking-tight sm:text-4xl`}>Run your first coached session today</h2>
              <p className="mx-auto mt-3 max-w-xl text-indigo-100">Create an account, choose a scenario, and see the guidance appear on your first customer message.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2.5 text-sm font-medium">
                {["Practise in Simulator Mode", "Live coaching panels", "PDF session reports"].map((x) => (
                  <span key={x} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5"><Check size={14} aria-hidden="true" />{x}</span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link to="/signup" className={`inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-indigo-700 shadow-lg hover:bg-indigo-50 ${FOCUS}`}>Create account <ArrowRight size={17} aria-hidden="true" /></Link>
                <Link to="/login" className={`rounded-xl border border-white/60 px-8 py-3 font-semibold hover:bg-white/10 ${FOCUS}`}>Login</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 py-10 text-indigo-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-5 text-sm sm:px-6">
          <Logo light />
          <nav aria-label="Legal" className="flex gap-6">
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:underline">Terms of Service</Link>
          </nav>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            <span className="flex items-center gap-2"><ShieldCheck size={16} aria-hidden="true" /> Secure sign-in</span>
            <span className="flex items-center gap-2"><Zap size={16} aria-hidden="true" /> AI-powered coaching</span>
            <span className="flex items-center gap-2"><Lock size={16} aria-hidden="true" /> Your sessions, in your account</span>
          </div>
          <p className="text-center text-xs text-indigo-300">© {new Date().getFullYear()} AssistEdge</p>
        </div>
      </footer>
    </div>
  );
}
