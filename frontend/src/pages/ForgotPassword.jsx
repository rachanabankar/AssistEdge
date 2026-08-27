import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { authApi } from '../services/api';

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState(null); // TEMP — shown until real email is wired up

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await authApi.forgotPassword(identifier);
      setSent(true);
      if (data?.dev_reset_link) {
        setDevLink(data.dev_reset_link); // TEMP
      }
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      heading="Forgot Password?"
      subheading="No worries — we'll help you get back in."
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Reset your password
      </h2>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {sent ? (
        <div className="space-y-4">
          <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
            If an account with that username or email exists, a reset link has been sent.
          </div>

          {/* TEMP: no email provider wired up yet — remove this block once real email sending is added */}
          {devLink && (
            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 break-all">
              <p className="font-medium text-gray-600 mb-1">Dev mode — reset link:</p>
              <a href={devLink} className="text-indigo-600 hover:underline">
                {devLink}
              </a>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username or Email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your username or email"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium py-2.5 hover:opacity-90 disabled:opacity-50 transition"
          >
            {submitting ? 'Sending…' : 'Send reset link'} <span aria-hidden>→</span>
          </button>
        </form>
      )}

      <p className="text-center text-sm text-gray-500 mt-6">
        Remembered your password?{' '}
        <Link to="/login" className="text-indigo-600 font-medium hover:underline">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}