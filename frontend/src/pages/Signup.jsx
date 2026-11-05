import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/* ---------------------------------------------------------------- */
/* Small inline icons — no new npm dependency required               */
/* ---------------------------------------------------------------- */

const Svg = ({ children, className = '' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    {children}
  </svg>
);

const s = {
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const IconUser = ({ className }) => (
  <Svg className={className}>
    <circle cx="12" cy="8" r="3.5" {...s} />
    <path d="M4.5 19.5c1.4-3.2 4.2-5 7.5-5s6.1 1.8 7.5 5" {...s} />
  </Svg>
);

const IconMail = ({ className }) => (
  <Svg className={className}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" {...s} />
    <path d="m4.5 7.5 7.5 5.5 7.5-5.5" {...s} />
  </Svg>
);

const IconLock = ({ className }) => (
  <Svg className={className}>
    <rect x="5" y="10.5" width="14" height="9" rx="2" {...s} />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" {...s} />
  </Svg>
);

const IconEye = ({ className }) => (
  <Svg className={className}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" {...s} />
    <circle cx="12" cy="12" r="2.75" {...s} />
  </Svg>
);

const IconEyeOff = ({ className }) => (
  <Svg className={className}>
    <path
      d="M3 3l18 18M9.9 9.9a2.75 2.75 0 0 0 3.9 3.9M6.2 6.5C3.9 8 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.7 0 3.1-.5 4.3-1.2M10.6 5.6c.45-.07.9-.1 1.4-.1 6 0 9.5 6.5 9.5 6.5s-.8 1.5-2.3 3"
      {...s}
    />
  </Svg>
);

const IconShield = ({ className }) => (
  <Svg className={className}>
    <path d="M12 3l7 3v5c0 4.7-3 8.4-7 10-4-1.6-7-5.3-7-10V6l7-3Z" {...s} />
    <path d="M9 12.2l2 2 4-4.2" {...s} />
  </Svg>
);

const IconArrowLeft = ({ className }) => (
  <Svg className={className}>
    <path d="M19 12H5M11 6l-6 6 6 6" {...s} />
  </Svg>
);

const IconArrowRight = ({ className }) => (
  <Svg className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" {...s} />
  </Svg>
);

const IconSparkle = ({ className }) => (
  <Svg className={className}>
    <path d="M10 4l1.6 4.4L16 10l-4.4 1.6L10 16l-1.6-4.4L4 10l4.4-1.6L10 4Z" {...s} />
    <path d="M17.5 14l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" {...s} strokeWidth={1.4} />
  </Svg>
);

const IconBook = ({ className }) => (
  <Svg className={className}>
    <path d="M12 6.5C10.3 5.3 8 5 5 5v12.5c3 0 5.3.3 7 1.5m0-12.5c1.7-1.2 4-1.5 7-1.5v12.5c-3 0-5.3.3-7 1.5m0-12.5V19" {...s} />
  </Svg>
);

const IconTrend = ({ className }) => (
  <Svg className={className}>
    <path d="M4 17l5-5 3.5 3.5L20 8" {...s} />
    <path d="M15 8h5v5" {...s} />
  </Svg>
);

const IconCheck = ({ className }) => (
  <Svg className={className}>
    <path d="M5 12.5l4.2 4.2L19 7" {...s} strokeWidth={2.2} />
  </Svg>
);

const IconAlert = ({ className }) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" {...s} />
    <path d="M12 7.5v5M12 16.2v.1" {...s} strokeWidth={2} />
  </Svg>
);

/* ---------------------------------------------------------------- */
/* Input row — icon chip + borderless input, same look as Login      */
/* ---------------------------------------------------------------- */

function Field({
  label,
  icon: Icon,
  chip = 'bg-indigo-50 text-indigo-600',
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  invalid = false,
  trailing,
  children,
}) {
  return (
    <div>
      {/* CHANGED: label text-[15px] mb-2 -> text-sm mb-1.5 */}
      <label className="block text-sm font-semibold text-slate-800 mb-1.5">{label}</label>
      <div
        /* CHANGED: h-[54px] -> h-[46px] */
        className={`flex items-center gap-3 rounded-2xl border bg-white/80 px-2.5 h-[46px] transition focus-within:bg-white focus-within:ring-4 ${
          invalid
            ? 'border-red-300 focus-within:border-red-400 focus-within:ring-red-100'
            : 'border-slate-200 hover:border-slate-300 focus-within:border-indigo-400 focus-within:ring-indigo-100'
        }`}
      >
        <span
          /* CHANGED: w-9 h-9 -> w-8 h-8 */
          className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center ${
            invalid ? 'bg-red-50 text-red-500' : chip
          }`}
        >
          <Icon className="w-[18px] h-[18px]" />
        </span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          /* CHANGED: added [&::-ms-reveal]:hidden so the browser's own reveal icon never clashes with ours */
          className="flex-1 min-w-0 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
        />
        {/* CHANGED: trailing wrapper is now relative z-10 flex so the eye button can always be clicked */}
        {trailing && <div className="relative z-10 flex items-center pr-1.5">{trailing}</div>}
      </div>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Password strength                                                 */
/* ---------------------------------------------------------------- */

const STRENGTH = [
  { label: '', bar: 'bg-slate-200', text: 'text-slate-400' },
  { label: 'Weak', bar: 'bg-red-400', text: 'text-red-500' },
  { label: 'Fair', bar: 'bg-amber-400', text: 'text-amber-600' },
  { label: 'Good', bar: 'bg-lime-500', text: 'text-lime-600' },
  { label: 'Strong', bar: 'bg-emerald-500', text: 'text-emerald-600' },
];

function scorePassword(pw) {
  if (!pw) return 0;
  const passed = [
    pw.length >= 8,
    /[a-z]/.test(pw) && /[A-Z]/.test(pw),
    /\d/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
  ].filter(Boolean).length;
  // Under 8 chars is capped at "Weak" so the meter agrees with minLength.
  return pw.length < 8 ? Math.min(passed, 1) || 1 : Math.max(passed, 1);
}

/* ---------------------------------------------------------------- */
/* Floating hero cards (left side) — mirrors the Login hero          */
/* ---------------------------------------------------------------- */

function Pill({ tone, children }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    red: 'bg-red-50 text-red-500',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

function HeroCards() {
  return (
    <div className="relative w-full max-w-[600px] h-[400px] mt-12">
      {/* decorative rings */}
      <div className="absolute left-[140px] top-[30px] w-[330px] h-[330px] rounded-full border border-dashed border-indigo-200/80" />
      <div className="absolute left-[185px] top-[75px] w-[240px] h-[240px] rounded-full border border-indigo-200/60" />

      {/* Sentiment journey */}
      <div className="ae-float absolute left-0 top-0 w-[290px] rounded-2xl bg-white shadow-[0_12px_40px_-12px_rgba(79,70,229,0.28)] ring-1 ring-indigo-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <IconTrend className="w-[18px] h-[18px]" />
            </span>
            <span className="text-sm font-semibold text-slate-800">Sentiment journey</span>
          </div>
          <Pill tone="green">Improving</Pill>
        </div>
        <svg viewBox="0 0 240 64" className="mt-3 w-full h-16" aria-hidden="true">
          <defs>
            <linearGradient id="spark-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="50%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
            <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M4 52 C40 54 56 30 90 38 S142 54 166 26 S214 10 236 8 V64 H4 Z" fill="url(#spark-fill)" />
          <path
            d="M4 52 C40 54 56 30 90 38 S142 54 166 26 S214 10 236 8"
            stroke="url(#spark-line)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="236" cy="8" r="4.5" fill="#10B981" />
        </svg>
        <div className="flex justify-between text-[11px] text-slate-400 -mt-0.5">
          <span>Frustrated</span>
          <span>Satisfied</span>
        </div>
      </div>

      {/* Coaching tip */}
      <div
        className="ae-float absolute left-[210px] top-[130px] w-[310px] rounded-2xl bg-white shadow-[0_12px_40px_-12px_rgba(124,58,237,0.3)] ring-1 ring-purple-50 p-4"
        style={{ animationDelay: '1.2s' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <IconSparkle className="w-[18px] h-[18px]" />
            </span>
            <span className="text-sm font-semibold text-slate-800">Coaching tip</span>
          </div>
          <Pill tone="indigo">Live</Pill>
        </div>
        <div className="mt-3 rounded-xl bg-emerald-50 px-3.5 py-3 text-[13px] leading-snug text-slate-700">
          Acknowledge the delay first, then offer a clear next step with a timeline.
        </div>
      </div>

      {/* Resolution score */}
      <div
        className="ae-float absolute left-[20px] top-[270px] w-[250px] rounded-2xl bg-white shadow-[0_12px_40px_-12px_rgba(79,70,229,0.25)] ring-1 ring-indigo-50 p-4 flex items-center gap-4"
        style={{ animationDelay: '2.2s' }}
      >
        <div className="relative w-14 h-14 shrink-0">
          <svg viewBox="0 0 40 40" className="w-14 h-14 -rotate-90" aria-hidden="true">
            <circle cx="20" cy="20" r="16" fill="none" stroke="#E0E7FF" strokeWidth="4" />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#10B981"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="86.5 100.5"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
            86
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Resolution score</p>
          <div className="mt-1">
            <Pill tone="green">Great</Pill>
          </div>
        </div>
      </div>

      {/* Knowledge match */}
      <div
        className="ae-float absolute left-[285px] top-[305px] w-[230px] rounded-2xl bg-white shadow-[0_12px_40px_-12px_rgba(14,165,233,0.25)] ring-1 ring-sky-50 px-4 py-3 flex items-center gap-3"
        style={{ animationDelay: '3s' }}
      >
        <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
          <IconBook className="w-[18px] h-[18px]" />
        </span>
        <div>
          <p className="text-xs font-semibold text-sky-700">Knowledge match</p>
          <p className="text-[13px] text-slate-600">Refund &amp; returns policy</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

export default function Signup() {
  const { signup, googleLogin } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const score = useMemo(() => scorePassword(password), [password]);
  const strength = STRENGTH[score];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      // NOTE: fullName is UI-only for now — not sent to backend, since
      // auth.py's signup payload shape is unconfirmed beyond {username, password}.
      // Flag if the backend actually accepts/expects a name field.
      await signup({ username, password });
      navigate('/dashboard', { replace: true }); // CHANGED: was '/LandingDashboard' (not a real route)
    } catch (err) {
      const detail = err?.response?.data?.detail;
      let message = 'Signup failed. Please try again.';

      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        message = detail.map((d) => d.msg).join(' ');
      }

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handles the credential response from Google Identity Services and
  // exchanges it with our backend for our own JWT.
  const handleGoogleResponse = async (response) => {
    setError('');
    try {
      await googleLogin(response.credential);
      navigate('/dashboard', { replace: true }); // CHANGED: was '/' (landing page)
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Google sign-up failed. Please try again.');
    }
  };

  // Loads Google's Identity Services script once and renders their button
  // into our container. Reuses the script tag Login.jsx may have injected.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not set — Google sign-up is disabled.');
      return;
    }

    const initializeGoogle = () => {
      if (!window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      // Defer measuring until after layout so we don't get a 0px-wide button.
      requestAnimationFrame(() => {
        if (!googleButtonRef.current) return;
        const containerWidth = googleButtonRef.current.offsetWidth || 320;
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          logo_alignment: 'center',
          // Google caps the rendered button around 400px.
          width: Math.min(containerWidth, 400),
          text: 'signup_with',
        });
      });
    };

    if (window.google) {
      initializeGoogle();
      return;
    }

    const existingScript = document.getElementById('google-identity-script');
    if (existingScript) {
      existingScript.addEventListener('load', initializeGoogle);
      return () => existingScript.removeEventListener('load', initializeGoogle);
    }

    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.body.appendChild(script);
    // Intentionally not removing the script on unmount — Login.jsx can reuse it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CHANGED: explicit toggle handlers (clearer than inline functional updates passed around)
  const togglePassword = () => setShowPassword((v) => !v);
  const toggleConfirmPassword = () => setShowConfirmPassword((v) => !v);

  const eyeToggle = (shown, onToggle) => (
    <button
      type="button"
      onClick={onToggle}
      /* CHANGED: keep focus on the input so clicking the eye doesn't interfere with the type switch */
      onMouseDown={(e) => e.preventDefault()}
      aria-label={shown ? 'Hide password' : 'Show password'}
      title={shown ? 'Hide password' : 'Show password'}
      aria-pressed={shown}
      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
    >
      {shown ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
    </button>
  );

  return (
    /* CHANGED: min-h-screen -> h-[100dvh] so the page is exactly one screen tall and cannot scroll */
    <div className="relative h-[100dvh] overflow-hidden flex flex-col bg-gradient-to-br from-[#EEF0FF] via-[#F5F3FF] to-[#F3E8FF]">
      {/* floating-card animation (respects reduced motion) */}
      <style>{`
        @keyframes ae-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .ae-float { animation: ae-float 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .ae-float { animation: none; } }
        /* CHANGED: scale both columns down on short windows so everything fits without scrolling */
        @media (max-height: 780px) { .ae-fit { zoom: 0.93; } }
        @media (max-height: 680px) { .ae-fit { zoom: 0.8; } }
      `}</style>

      {/* backdrop: soft blobs + dotted texture */}
      <div className="pointer-events-none absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-1/3 w-[460px] h-[460px] rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 w-[520px] h-[520px] rounded-full bg-purple-300/40 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(#C7D2FE 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at 35% 50%, black 10%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 35% 50%, black 10%, transparent 70%)',
        }}
      />

      {/* top bar */}
      {/* CHANGED: pt-6 -> pt-4 */}
      <header className="relative z-10 w-full px-6 sm:px-[70px] pt-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          {/* CHANGED: w-12 h-12 text-xl -> w-10 h-10 text-lg */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-200">
            A
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">AssistEdge</span>
        </Link>
        <Link
          to="/"
          /* CHANGED: py-2.5 -> py-2 */
          className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-5 py-2 text-[15px] font-medium text-slate-700 shadow-sm ring-1 ring-white hover:bg-white transition"
        >
          <IconArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </header>

      {/* main */}
      {/* CHANGED: py-8 -> py-3, added min-h-0 so it can shrink inside the fixed-height page */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1280px] mx-auto px-6 sm:px-[70px] py-3 grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
        {/* Left: hero */}
        {/* CHANGED: added ae-fit */}
        <section className="hidden lg:block pl-[40px] ae-fit">
          <h1 className="text-[54px] xl:text-[60px] font-extrabold leading-[1.08] tracking-tight text-slate-900">
            Start coaching
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-500 bg-clip-text text-transparent">
              smarter, today
            </span>
          </h1>
          <p className="mt-5 text-lg text-slate-500 max-w-lg leading-relaxed">
            Create your account and get real-time sentiment, knowledge and coaching
            guidance on every customer conversation.
          </p>
          <HeroCards />
        </section>

        {/* Right: signup card */}
        {/* CHANGED: added ae-fit */}
        <section className="w-full max-w-[550px] mx-auto lg:mx-0 lg:justify-self-center ae-fit">
          <div className="relative overflow-hidden rounded-[28px] bg-white/90 backdrop-blur shadow-[0_30px_80px_-30px_rgba(79,70,229,0.35)] ring-1 ring-white">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-500 to-sky-400" />

            {/* CHANGED: p-7 sm:p-9 -> p-5 sm:p-6 */}
            <div className="p-5 sm:p-6">
              {/* CHANGED: text-[34px] -> text-[28px] */}
              <h2 className="text-[28px] font-extrabold tracking-tight text-slate-900">
                Create account <span aria-hidden>✨</span>
              </h2>
              {/* CHANGED: mt-1.5 -> mt-1, text-[15px] -> text-sm */}
              <p className="mt-1 text-sm text-slate-500">
                Join AssistEdge and elevate your coaching experience.
              </p>

              {error && (
                <div
                  role="alert"
                  /* CHANGED: mt-5 -> mt-3, py-3 -> py-2 */
                  className="mt-3 flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2"
                >
                  <IconAlert className="w-5 h-5 shrink-0 text-red-500 mt-px" />
                  <span>{error}</span>
                </div>
              )}

              {/* CHANGED: mt-6 space-y-4 -> mt-4 space-y-3 */}
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <Field
                  label="Full name"
                  icon={IconUser}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  autoComplete="name"
                />

                <Field
                  label="Email or username"
                  icon={IconMail}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="username"
                />

                <Field
                  label="Password"
                  icon={IconLock}
                  chip="bg-purple-50 text-purple-600"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  minLength={8}
                  /* CHANGED: uses togglePassword */
                  trailing={eyeToggle(showPassword, togglePassword)}
                >
                  {password.length > 0 ? (
                    /* CHANGED: mt-2.5 -> mt-2 */
                    <div className="mt-2 flex items-center gap-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                            i <= score ? strength.bar : 'bg-slate-200'
                          }`}
                        />
                      ))}
                      <span className={`ml-2 w-14 text-right text-xs font-semibold ${strength.text}`}>
                        {strength.label}
                      </span>
                    </div>
                  ) : (
                    /* CHANGED: mt-2 -> mt-1.5 */
                    <p className="mt-1.5 text-xs text-slate-400">
                      Use 8+ characters with a mix of letters, numbers and symbols.
                    </p>
                  )}
                </Field>

                <Field
                  label="Confirm password"
                  icon={IconLock}
                  chip="bg-purple-50 text-purple-600"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  invalid={passwordsMismatch}
                  /* CHANGED: uses toggleConfirmPassword */
                  trailing={eyeToggle(showConfirmPassword, toggleConfirmPassword)}
                >
                  {(passwordsMismatch || passwordsMatch) && (
                    <p
                      /* CHANGED: mt-2 -> mt-1.5 */
                      className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${
                        passwordsMismatch ? 'text-red-500' : 'text-emerald-600'
                      }`}
                    >
                      {passwordsMismatch ? (
                        <>
                          <IconAlert className="w-3.5 h-3.5" /> Passwords don't match.
                        </>
                      ) : (
                        <>
                          <IconCheck className="w-3.5 h-3.5" /> Passwords match.
                        </>
                      )}
                    </p>
                  )}
                </Field>

                {/* CHANGED: text-[15px] -> text-sm, pt-1 -> pt-0 */}
                <label className="flex items-start gap-3 text-sm text-slate-600 select-none cursor-pointer pt-0">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-[18px] h-[18px] rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>
                    I agree to the{' '}
                    <span className="font-medium text-indigo-600 cursor-not-allowed" title="Coming soon">
                      Terms of Service
                    </span>{' '}
                    and{' '}
                    <span className="font-medium text-indigo-600 cursor-not-allowed" title="Coming soon">
                      Privacy Policy
                    </span>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting || !agreedToTerms}
                  /* CHANGED: h-[58px] text-lg -> h-[48px] text-base */
                  className="group w-full h-[48px] flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-base font-semibold shadow-lg shadow-indigo-300/50 transition hover:shadow-xl hover:shadow-indigo-300/60 hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Creating account…
                    </>
                  ) : (
                    <>
                      Sign Up
                      <IconArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              {/* CHANGED: my-6 -> my-3 */}
              <div className="flex items-center gap-4 my-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">
                  Or continue with
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {GOOGLE_CLIENT_ID ? (
                <div
                  ref={googleButtonRef}
                  style={{ minWidth: 280, minHeight: 44 }}
                  className="w-full flex justify-center"
                />
              ) : (
                <button
                  type="button"
                  disabled
                  title="Set VITE_GOOGLE_CLIENT_ID to enable"
                  /* CHANGED: h-[50px] -> h-[44px] */
                  className="w-full h-[44px] flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-[15px] font-medium text-slate-400 cursor-not-allowed"
                >
                  Continue with Google
                </button>
              )}

              {/* CHANGED: mt-6 text-[15px] -> mt-3 text-sm */}
              <p className="mt-3 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* footer */}
      <footer className="relative z-10 pb-3 pt-1 flex items-center justify-center lg:justify-start gap-2 text-sm text-slate-500 w-full max-w-[1280px] mx-auto px-6 sm:px-[70px]">
        <div className="lg:w-[60%] flex items-center justify-center gap-2">
          <IconShield className="w-4 h-4 text-emerald-500" />
          Your data stays protected. © {new Date().getFullYear()} AssistEdge
        </div>
      </footer>
    </div>
  );
}