import { X, Lock, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import PasswordInput from "../components/PasswordInput";
import { profileApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function PrivacySecurityModal({ isOpen, onClose }) {
  const { agent, updateToken, refreshAgent } = useAuth();
  const isSettingPassword = agent?.has_password === false;

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
    if (enc.encode(newPassword).length > 72 || (!isSettingPassword && enc.encode(currentPassword).length > 72)) {
      setError("Passwords must be at most 72 bytes");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await profileApi.changePassword(isSettingPassword ? undefined : currentPassword, newPassword);
      if (res.data && res.data.access_token) updateToken(res.data.access_token);
      await refreshAgent();
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
                  {isSettingPassword ? "Set password" : "Change Password"}
                </h3>

                <p className="text-xs text-gray-400">
                  {isSettingPassword
                    ? "You signed in with Google. Set a password to also log in with your email."
                    : "Update your account password"}
                </p>
              </div>

            </div>

            <div className="mt-6 space-y-4">

              {!isSettingPassword && <PasswordInput
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200
                           px-4 py-3 text-sm outline-none
                           focus:border-indigo-500"
              />}

              <PasswordInput
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200
                           px-4 py-3 text-sm outline-none
                           focus:border-indigo-500"
              />

              <PasswordInput
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
              {loading ? (isSettingPassword ? "Setting..." : "Changing...") : (isSettingPassword ? "Set password" : "Change Password")}
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}