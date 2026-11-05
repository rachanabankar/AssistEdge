import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, AlertTriangle, BarChart2, User } from "lucide-react";
import { notificationApi } from "../../services/api";

const CATEGORY_CONFIG = {
  escalation: { icon: AlertTriangle, iconBg: "bg-orange-50", iconColor: "text-orange-500" },
  report: { icon: BarChart2, iconBg: "bg-blue-50", iconColor: "text-blue-500" },
  profile: { icon: User, iconBg: "bg-indigo-50", iconColor: "text-indigo-500" },
};

const POLL_INTERVAL_MS = 1000;

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

export default function NotificationsDropdown({ onViewAll }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const fetchUnreadCount = useCallback(() => {
    notificationApi
      .unreadCount()
      .then((res) => setUnreadCount(res.data.count))
      .catch((err) => console.error("Failed to load unread count:", err));
  }, []);

  // Initial fetch and poll for updates so the badge stays current
  useEffect(() => {
    fetchUnreadCount();
    const intervalId = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchUnreadCount]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      Promise.all([
        notificationApi.listRecent(4),
        notificationApi.unreadCount(),
      ])
        .then(([listRes, countRes]) => {
          setNotifications(listRes.data);
          setUnreadCount(countRes.data.count);
        })
        .catch((err) => console.error("Failed to load notifications:", err))
        .finally(() => setLoading(false));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleMarkRead = async (n) => {
    if (n.is_read) return;
    try {
      await notificationApi.markRead(n.id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === n.id ? { ...item, is_read: true } : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggleOpen}
        className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-96 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 className="text-base font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && <p className="px-5 py-6 text-center text-sm text-gray-400">Loading…</p>}
            {!loading && notifications.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-gray-400">You're all caught up.</p>
            )}
            {!loading &&
              notifications.map((n, index) => {
                const config = CATEGORY_CONFIG[n.category] || CATEGORY_CONFIG.report;
                const Icon = config.icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n)}
                    className={`flex gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 ${
                      index !== notifications.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.iconBg} ${config.iconColor}`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{n.message}</p>
                      <p className="mt-1 text-[11px] text-gray-400">{formatRelativeTime(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                    )}
                  </div>
                );
              })}
          </div>

          <div className="border-t border-gray-100 px-5 py-3">
            <button
              onClick={() => {
                setOpen(false);
                onViewAll();
              }}
              className="flex w-full items-center justify-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
