import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/* ---------------------------------------------------------------- */
/* Small inline icons — identical set/style to Signup.jsx            */
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

const IconChat = ({ className }) => (
  <Svg className={className}>
    <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-4 4v-4h-.5A2.5 2.5 0 0 1 4 12.5v-6Z" {...s} />
  </Svg>
);

const IconAlert = ({ className }) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" {...s} />
    <path d="M12 7.5v5M12 16.2v.1" {...s} strokeWidth={2} />
  </Svg>
);

/* ---------------------------------------------------------------- */
/* Input row — same Field component as Signup                        */
/* ---------------------------------------------------------------- */

function Field({
  id,
  label,
  labelRight,
  icon: Icon,
  chip = 'bg-indigo-50 text-indigo-600',
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  trailing,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="block text-sm font-semibold text-slate-800">{label}</label>
        {labelRight}
      </div>
      <div className="flex items-center gap-3 rounded-2xl border bg-white/80 px-2.5 h-[46px] transition focus-within:bg-white focus-within:ring-4 border-slate-200 hover:border-slate-300 focus-within:border-indigo-400 focus-within:ring-indigo-100">
        <span className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center ${chip}`}>
          <Icon className="w-[18px] h-[18px]" />
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          autoComplete={autoComplete}
          className="flex-1 min-w-0 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
        />
        {trailing && <div className="relative z-10 flex items-center pr-1.5">{trailing}</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Floating hero cards (left side) — same layout as Signup           */
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
    <div className="relative w-full max-w-[600px] h-[400px] mt-12" aria-hidden="true">
      {/* decorative rings */}
      <div className="absolute left-[140px] top-[30px] w-[330px] h-[330px] rounded-full border border-dashed border-indigo-200/80" />
      <div className="absolute left-[185px] top-[75px] w-[240px] h-[240px] rounded-full border border-indigo-200/60" />

      {/* Customer message */}
      <div className="ae-float absolute left-0 top-0 w-[290px] rounded-2xl bg-white shadow-[0_12px_40px_-12px_rgba(79,70,229,0.28)] ring-1 ring-indigo-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
              <IconChat className="w-[18px] h-[18px]" />
            </span>
            <span className="text-sm font-semibold text-slate-800">Customer</span>
          </div>
          <Pill tone="red">Frustrated</Pill>
        </div>
        <div className="mt-3 rounded-xl bg-slate-100 px-3.5 py-3 text-[13px] leading-snug text-slate-700">
          My order is late again. I need this fixed today.
        </div>
      </div>

      {/* Suggested reply */}
      <div
        className="ae-float absolute left-[210px] top-[130px] w-[310px] rounded-2xl bg-white shadow-[0_12px_40px_-12px_rgba(124,58,237,0.3)] ring-1 ring-purple-50 p-4"
        style={{ animationDelay: '1.2s' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <IconSparkle className="w-[18px] h-[18px]" />
            </span>
            <span className="text-sm font-semibold text-slate-800">Suggested reply</span>
          </div>
          <Pill tone="green">Empathetic</Pill>
        </div>
        <div className="mt-3 rounded-xl bg-emerald-50 px-3.5 py-3 text-[13px] leading-snug text-slate-700">
          I'm sorry about the delay. Let me check the status and get you a firm delivery time.
        </div>
      </div>

      {/* Escalation risk */}
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
              strokeDasharray="24.1 100.5"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
            24
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Escalation risk</p>
          <div className="mt-1">
            <Pill tone="green">Low</Pill>
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
          <p className="text-[13px] text-slate-600">Late delivery policy</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ username, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      let message = 'Login failed. Check your credentials.';

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
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Google sign-in failed. Please try again.');
    }
  };

  // Loads Google's Identity Services script once, then keeps checking until
  // it is ready and renders Google's button into our container. A styled
  // placeholder sits underneath so the space is never blank.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not set — Google sign-in is disabled.');
      return undefined;
    }

    let cancelled = false;

    const renderGoogle = () => {
      const el = googleButtonRef.current;
      if (cancelled || !el || !window.google?.accounts?.id) return false;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      el.innerHTML = '';
      window.google.accounts.id.renderButton(el, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        logo_alignment: 'center',
        width: Math.min(el.offsetWidth || 340, 400),
        text: 'continue_with',
      });
      setGoogleReady(true);
      return true;
    };

    if (!document.getElementById('google-identity-script')) {
      const script = document.createElement('script');
      script.id = 'google-identity-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      // Intentionally not removing the script on unmount — Signup.jsx can reuse it.
    }

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (renderGoogle() || tries > 40) clearInterval(timer);
    }, 250);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePassword = () => setShowPassword((v) => !v);

  const eyeToggle = (shown, onToggle) => (
    <button
      type="button"
      onClick={onToggle}
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
    <div className="relative h-[100dvh] overflow-hidden flex flex-col bg-gradient-to-br from-[#EEF0FF] via-[#F5F3FF] to-[#F3E8FF]">
      {/* floating-card animation (respects reduced motion) */}
      <style>{`
        @keyframes ae-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .ae-float { animation: ae-float 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .ae-float { animation: none; } }
        /* scale both columns down on short windows so everything fits without scrolling */
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
      <header className="relative z-10 w-full px-6 sm:px-[70px] pt-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-200">
            A
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">AssistEdge</span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-5 py-2 text-[15px] font-medium text-slate-700 shadow-sm ring-1 ring-white hover:bg-white transition"
        >
          <IconArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </header>

      {/* main */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1280px] mx-auto px-6 sm:px-[70px] py-3 grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
        {/* Left: hero */}
        <section className="hidden lg:block pl-[40px] ae-fit">
          <h1 className="text-[50px] xl:text-[54px] font-extrabold leading-[1.08] tracking-tight text-slate-900">
            Great support is
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-500 bg-clip-text text-transparent">
              coached in the moment
            </span>
          </h1>
          <p className="mt-5 text-lg text-slate-500 max-w-lg leading-relaxed">
            Sentiment, escalation risk, knowledge answers and suggested replies,
            updating with every customer message.
          </p>
          <HeroCards />
        </section>

        {/* Right: login card */}
        <section className="w-full max-w-[550px] mx-auto lg:mx-0 lg:justify-self-center ae-fit">
          <div className="relative overflow-hidden rounded-[28px] bg-white/90 backdrop-blur shadow-[0_30px_80px_-30px_rgba(79,70,229,0.35)] ring-1 ring-white">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-500 to-sky-400" />

            <div className="p-5 sm:p-6">
              <h2 className="text-[28px] font-extrabold tracking-tight text-slate-900">
                Welcome back <span aria-hidden>👋</span>
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Sign in to continue coaching with AssistEdge.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-3 flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2"
                >
                  <IconAlert className="w-5 h-5 shrink-0 text-red-500 mt-px" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <Field
                  id="login-username"
                  label="Email or username"
                  icon={IconMail}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="username"
                />

                <Field
                  id="login-password"
                  label="Password"
                  labelRight={
                    <Link to="/forgot-password" className="text-sm font-semibold text-indigo-600 hover:text-purple-600 transition">
                      Forgot password?
                    </Link>
                  }
                  icon={IconLock}
                  chip="bg-purple-50 text-purple-600"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  trailing={eyeToggle(showPassword, togglePassword)}
                />

                <label className="flex items-start gap-3 text-sm text-slate-600 select-none cursor-pointer pt-0">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="mt-0.5 w-[18px] h-[18px] rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Keep me signed in</span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group w-full h-[48px] flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-base font-semibold shadow-lg shadow-indigo-300/50 transition hover:shadow-xl hover:shadow-indigo-300/60 hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Logging in…
                    </>
                  ) : (
                    <>
                      Login
                      <IconArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center gap-4 my-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">
                  Or continue with
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {GOOGLE_CLIENT_ID ? (
                <div className="relative w-full h-[44px]" style={{ minWidth: 280 }}>
                  {/* placeholder shown only until Google's own button has rendered */}
                  {!googleReady && (
                    <button
                      type="button"
                      onClick={() => setError('Google sign-in is still loading. Please try again in a moment.')}
                      className="absolute inset-0 flex items-center justify-center gap-2 rounded border border-slate-300 bg-white text-sm font-semibold text-slate-600"
                    >
                      <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
                        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.7 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
                        <path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.9-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z" />
                        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
                      </svg>
                      Continue with Google
                    </button>
                  )}
                  <div ref={googleButtonRef} className="absolute inset-0 flex items-center justify-center" />
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Set VITE_GOOGLE_CLIENT_ID to enable"
                  className="w-full h-[44px] flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-[15px] font-medium text-slate-400 cursor-not-allowed"
                >
                  Continue with Google
                </button>
              )}

              <p className="mt-3 text-center text-sm text-slate-500">
                By continuing you agree to the{' '}
                <Link to="/terms" className="font-medium text-indigo-600 hover:underline">Terms</Link>
                {' '}and{' '}
                <Link to="/privacy" className="font-medium text-indigo-600 hover:underline">Privacy Policy</Link>.
              </p>
              <p className="mt-3 text-center text-sm text-slate-500">
                New to AssistEdge?{' '}
                <Link to="/signup" className="font-semibold text-indigo-600 hover:underline">
                  Create an account
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
