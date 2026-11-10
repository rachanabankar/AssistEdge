import { X, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { profileApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function PrivacySecurityModal({ isOpen, onClose }) {
  const { updateToken } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuccess(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChangePassword = async () => {
    setError("");
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    const enc = new TextEncoder();
    if (enc.encode(newPassword).length > 72 || enc.encode(currentPassword).length > 72) {
      setError("Passwords must be at most 72 bytes");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await profileApi.changePassword(currentPassword, newPassword);
      if (res.data && res.data.access_token) updateToken(res.data.access_token);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === "string" ? d : "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center
                    bg-slate-900/40 px-4 backdrop-blur-sm">

      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-gray-100 px-7 py-5">

          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Privacy &amp; Security
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Manage your password and account security
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center
                       rounded-xl text-gray-400 hover:bg-gray-100"
          >
            <X size={20} />
          </button>

        </div>

        <div className="bg-[#f8f9ff] p-7">

          {/* SECURITY STATUS */}
          <div className="mb-5 flex items-center gap-4 rounded-2xl
                          border border-emerald-100 bg-emerald-50 p-5">

            <div className="flex h-11 w-11 items-center justify-center
                            rounded-xl bg-white text-emerald-600">
              <ShieldCheck size={21} />
            </div>

            <div>
              <p className="text-sm font-bold text-gray-800">
                Your account is secure
              </p>

              <p className="mt-1 text-xs text-gray-500">
                No security issues have been detected.
              </p>
            </div>

          </div>

          {/* CHANGE PASSWORD */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center
                              rounded-xl bg-indigo-50 text-indigo-600">
                <Lock size={18} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Change Password
                </h3>

                <p className="text-xs text-gray-400">
                  Update your account password
                </p>
              </div>

            </div>

            <div className="mt-6 space-y-4">

              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200
                           px-4 py-3 text-sm outline-none
                           focus:border-indigo-500"
              />

              <div className="relative">

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200
                             px-4 py-3 pr-11 text-sm outline-none
                             focus:border-indigo-500"
                />

                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2
                             -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200
                           px-4 py-3 text-sm outline-none
                           focus:border-indigo-500"
              />

            </div>

            {error && (
              <p className="mt-3 text-xs font-medium text-red-500">{error}</p>
            )}

            {success && (
              <p className="mt-3 text-xs font-medium text-emerald-600">
                Password changed successfully.
              </p>
            )}

            <button
              onClick={handleChangePassword}
              disabled={loading}
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5
                         text-sm font-semibold text-white
                         hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Changing..." : "Change Password"}
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}