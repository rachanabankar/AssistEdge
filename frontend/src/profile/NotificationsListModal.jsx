import { X, AlertTriangle, BarChart2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { notificationApi } from "../services/api";

const CATEGORY_CONFIG = {
  escalation: { icon: AlertTriangle, iconBg: "bg-orange-50", iconColor: "text-orange-500" },
  report: { icon: BarChart2, iconBg: "bg-blue-50", iconColor: "text-blue-500" },
  profile: { icon: User, iconBg: "bg-indigo-50", iconColor: "text-indigo-500" },
};

function formatRelativeTime(dateString) {
  const hasTz = /Z$|[+-]\d{2}:\d{2}$/.test(dateString);
  const date = new Date(hasTz ? dateString : dateString + "Z");

  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

export default function NotificationsListModal({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    notificationApi
      .listAll()
      .then((res) => setNotifications(res.data))
      .catch((err) => console.error("Failed to load notifications:", err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleMarkRead = async (n) => {
    if (n.is_read) return;
    try {
      await notificationApi.markRead(n.id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-7 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">All Notifications</h2>
            <p className="mt-1 text-sm text-gray-400">Everything, most recent first</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto bg-[#f8f9ff] p-7">
          <div className="rounded-2xl border border-gray-100 bg-white p-3">
            {loading && <p className="p-6 text-center text-sm text-gray-400">Loading…</p>}
            {!loading && notifications.length === 0 && (
              <p className="p-6 text-center text-sm text-gray-400">No notifications yet.</p>
            )}
            {!loading &&
              notifications.map((n, index) => {
                const config = CATEGORY_CONFIG[n.category] || CATEGORY_CONFIG.report;
                const Icon = config.icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n)}
                    className={`flex gap-4 p-4 cursor-pointer hover:bg-gray-50 ${
                      index !== notifications.length - 1 ? "border-b border-gray-100" : ""
                    } ${!n.is_read ? "bg-indigo-50/40" : ""}`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.iconBg} ${config.iconColor}`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                      <p className="mt-1 text-xs text-gray-400">{n.message}</p>
                      <p className="mt-1 text-[11px] text-gray-400">{formatRelativeTime(n.created_at)}</p>
                    </div>
                    {!n.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />}
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