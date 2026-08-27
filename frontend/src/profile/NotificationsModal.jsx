import { X, AlertTriangle, FileText, User, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { notificationApi } from "../services/api";

export default function NotificationsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    escalations: true,
    sessionReport: true,
    profileUpdated: true,
    passwordChanged: true,
  });

  useEffect(() => {
    if (!isOpen) return;
    notificationApi
      .getPreferences()
      .then((res) => setSettings(res.data))
      .catch((err) => console.error("Failed to load notification preferences:", err));
  }, [isOpen]);

  if (!isOpen) return null;

  const toggle = (key) => {
    const nextValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: nextValue }));

    notificationApi.updatePreferences({ [key]: nextValue }).catch((err) => {
      console.error("Failed to save notification preference:", err);
      setSettings((prev) => ({ ...prev, [key]: !nextValue })); // revert on failure
    });
  };

  const options = [
    {
      key: "escalations",
      title: "Escalation Alerts",
      description: "Receive alerts when a session requires attention.",
      icon: AlertTriangle,
    },
    {
      key: "sessionReport",
      title: "Session Report Ready",
      description: "Get notified when a session's report is ready to view.",
      icon: FileText,
    },
    {
      key: "profileUpdated",
      title: "Profile Updated",
      description: "Get notified when your profile is successfully updated.",
      icon: User,
    },
    {
      key: "passwordChanged",
      title: "Password Changed",
      description: "Get notified when your password is successfully changed.",
      icon: Lock,
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center
                    bg-slate-900/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-7 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            <p className="mt-1 text-sm text-gray-400">Choose which notifications you want to receive</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="bg-[#f8f9ff] p-7">
          <div className="rounded-2xl border border-gray-100 bg-white p-3">
            {options.map((option, index) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.key}
                  className={`flex items-center justify-between gap-4 p-4
                    ${index !== options.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{option.title}</p>
                      <p className="mt-1 text-xs text-gray-400">{option.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggle(option.key)}
                    className={`relative h-6 w-11 shrink-0 rounded-full ${settings[option.key] ? "bg-indigo-600" : "bg-gray-200"}`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${settings[option.key] ? "left-6" : "left-1"}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-100 px-7 py-4">
          <button onClick={onClose} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}