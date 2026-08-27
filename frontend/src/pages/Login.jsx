import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/* ---------------------------------------------------------------- */
/* Small inline icons — no new npm dependency required               */
/* ---------------------------------------------------------------- */

function IconUser({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4.5 19.5c1.4-3.2 4.2-5 7.5-5s6.1 1.8 7.5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconLock({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="10.5" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M8 10.5V8a4 4 0 0 1 8 0v2.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconEye({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function IconEyeOff({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 3l18 18M9.9 9.9a2.75 2.75 0 0 0 3.9 3.9M6.2 6.5C3.9 8 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.7 0 3.1-.5 4.3-1.2M10.6 5.6c.45-.07.9-.1 1.4-.1 6 0 9.5 6.5 9.5 6.5s-.8 1.5-2.3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShield({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3l7 3v5c0 4.7-3 8.4-7 10-4-1.6-7-5.3-7-10V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9 12.2l2 2 4-4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBolt({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12.5 2.5 5 14h5.5L11 21.5 19 10h-5.5l-1-7.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function IconLockCheck({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9.5 15l1.8 1.8L14.5 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconHeart({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 20.5s-7.5-4.6-9.7-9.2C.9 8 2.3 4.8 5.6 4.1c2-.4 3.9.5 5 2.1a5.4 5.4 0 0 1 1.4-1.6c1.5-1.2 3.5-1.4 5.2-.5 2.8 1.4 3.6 4.9 1.7 7.9-2.2 3.5-6.9 8.5-6.9 8.5Z" />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/* Hero illustration — robot + laptop chat mockup                    */
/* ---------------------------------------------------------------- */

function HeroIllustration() {
  return (
    <svg viewBox="0 0 420 300" className="w-full max-w-md mx-auto" role="img" aria-label="AssistEdge assistant helping with live chat">
      <defs>
        <linearGradient id="botGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EEF2FF" />
          <stop offset="100%" stopColor="#E0E7FF" />
        </linearGradient>
      </defs>

      {/* floor shadow */}
      <ellipse cx="210" cy="278" rx="150" ry="12" fill="#C7D2FE" opacity="0.5" />

      {/* laptop */}
      <rect x="120" y="70" width="220" height="145" rx="14" fill="#1E1B4B" />
      <rect x="132" y="82" width="196" height="121" rx="6" fill="url(#screenGrad)" />
      <rect x="95" y="215" width="270" height="14" rx="7" fill="#312E81" />

      {/* chat bubbles on screen */}
      <rect x="144" y="94" width="120" height="20" rx="10" fill="#C7D2FE" />
      <rect x="144" y="122" width="150" height="20" rx="10" fill="#818CF8" />
      <rect x="164" y="152" width="120" height="20" rx="10" fill="#C7D2FE" />
      <rect x="144" y="180" width="90" height="16" rx="8" fill="#7C3AED" />

      {/* plant */}
      <rect x="360" y="230" width="26" height="24" rx="4" fill="#A5B4FC" />
      <path d="M373 230c-4-14-20-18-24-30 16 2 26 14 24 30Z" fill="#34D399" />
      <path d="M373 230c4-12 18-14 22-24-14 0-24 10-22 24Z" fill="#10B981" />

      {/* robot */}
      <g transform="translate(28,60)">
        <ellipse cx="45" cy="215" rx="46" ry="9" fill="#C7D2FE" opacity="0.6" />
        {/* body */}
        <rect x="10" y="120" width="70" height="85" rx="20" fill="url(#botGrad)" />
        <rect x="26" y="140" width="38" height="26" rx="8" fill="white" opacity="0.85" />
        {/* head */}
        <circle cx="45" cy="70" r="42" fill="url(#botGrad)" />
        <circle cx="45" cy="70" r="32" fill="#EEF2FF" />
        <circle cx="33" cy="70" r="5" fill="#312E81" />
        <circle cx="57" cy="70" r="5" fill="#312E81" />
        <path d="M33 84c4 5 16 5 24 0" stroke="#312E81" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* antenna */}
        <line x1="45" y1="28" x2="45" y2="10" stroke="#7C3AED" strokeWidth="4" strokeLinecap="round" />
        <circle cx="45" cy="7" r="6" fill="#FBBF24" />
        {/* headset */}
        <path d="M8 68a37 37 0 0 1 74 0" stroke="#4C1D95" strokeWidth="4" fill="none" strokeLinecap="round" />
        <rect x="2" y="62" width="12" height="20" rx="6" fill="#4C1D95" />
        <rect x="76" y="62" width="12" height="20" rx="6" fill="#4C1D95" />
      </g>
    </svg>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ username, password });
      navigate('/');
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
      navigate('/');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Google sign-in failed. Please try again.');
    }
  };

  // Loads Google's Identity Services script once and renders their button
  // into our own button-shaped container, so we don't have to touch
  // index.html for this.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not set — Google sign-in is disabled.');
      return;
    }

    const initializeGoogle = () => {
      if (!window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      // Defer measuring the container's width until after the browser has
      // finished laying out the page. Measuring synchronously on mount can
      // catch the flex/grid ancestors mid-layout and return 0, which makes
      // Google render the button at zero width (i.e. invisible).
      requestAnimationFrame(() => {
        if (!googleButtonRef.current) return;
        const containerWidth = googleButtonRef.current.offsetWidth || 320;
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          logo_alignment: 'center',
          // Google caps the rendered button around 400px regardless of what's
          // passed, so request the smaller of the two to avoid asking for
          // (and visually expecting) width it will never actually use.
          width: Math.min(containerWidth, 400),
          text: 'continue_with',
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
    // Intentionally not removing the script on unmount — Signup.jsx can
    // reuse it via the `existingScript` branch above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const features = [
    {
      icon: IconUser,
      title: 'Live Response Guidance',
      description: 'Get real-time AI suggestions while you chat with customers.',
    },
    {
      icon: IconBolt,
      title: 'AI-Powered Assistance',
      description: 'Smart answers, context-aware suggestions, faster resolutions.',
    },
    {
      icon: IconShield,
      title: 'Improve Performance',
      description: 'Resolve queries faster and improve customer satisfaction.',
    },
  ];

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-[#F4F3FF] via-[#F7F6FF] to-white flex flex-col">
      {/* Top bar */}
      <div className="max-w-6xl w-full mx-auto px-6 pt-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <span className="text-lg font-bold text-slate-900">AssistEdge</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
          <span>Better support. Smarter every day.</span>
          <IconHeart className="w-3.5 h-3.5 text-indigo-400" />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl w-full mx-auto px-6 flex-1 min-h-0 grid lg:grid-cols-2 gap-10 items-center">
        {/* Left: marketing panel */}
        <div className="hidden lg:block">
          <h1 className="text-[26px] font-extrabold text-slate-900 leading-[1.2]">
            AI-Powered
            <br />
            <span className="text-indigo-600">Customer Support Agent</span>
            <br />
            with Live Response Guidance
          </h1>
          <p className="text-sm text-slate-500 mt-3 max-w-md">
            Empower your support team with real-time AI assistance and deliver exceptional
            customer experiences.
          </p>

          <div className="mt-5 space-y-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-9 h-9 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{title}</p>
                  <p className="text-xs text-slate-500">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 max-w-[240px]">
            <HeroIllustration />
          </div>
        </div>

        {/* Right: login card */}
        <div className="bg-white rounded-3xl shadow-xl border border-indigo-50 p-6 sm:p-7 my-4 max-h-full overflow-y-auto">
          <h2 className="text-xl font-bold text-slate-900">Welcome Back! 👋</h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">Sign in to continue to AssistEdge</p>

          {error && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <IconUser className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Email or Username"
                required
                autoComplete="username"
                className="w-full rounded-xl border border-gray-300 pl-11 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <IconLock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-gray-300 pl-11 pr-11 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-indigo-600 font-medium hover:underline">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2.5 hover:opacity-90 disabled:opacity-50 transition"
            >
              {submitting ? 'Logging in…' : 'Login'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-xs text-gray-400">OR</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          {GOOGLE_CLIENT_ID ? (
            <div
              ref={googleButtonRef}
              style={{ minWidth: 280 }}
              className="w-full flex justify-center"
            />
          ) : (
            <button
              type="button"
              disabled
              title="Set VITE_GOOGLE_CLIENT_ID to enable"
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-500 cursor-not-allowed"
            >
              Continue with Google
            </button>
          )}

          <p className="text-center text-sm text-slate-500 mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Trust badges */}
      <div className="max-w-6xl w-full mx-auto px-6 py-2.5 border-t border-indigo-100 flex flex-wrap items-center justify-center gap-x-10 gap-y-1 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <IconShield className="w-3.5 h-3.5 text-indigo-500" />
          Secure &amp; Reliable
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <IconBolt className="w-3.5 h-3.5 text-indigo-500" />
          AI-Powered
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <IconLockCheck className="w-3.5 h-3.5 text-indigo-500" />
          Your Data, Our Priority
        </div>
      </div>
    </div>
  );
}