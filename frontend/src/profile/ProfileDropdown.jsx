import {
  User,
  ShieldCheck,
  Bell,
  HelpCircle,
  LogOut,
} from "lucide-react";

export default function ProfileDropdown({
  onProfile,
  onPrivacySecurity,
  onNotifications,
  onHelpSupport,
  onLogout,
}) {
  return (
    <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">

      {/* USER HEADER */}
      <div className="border-b border-gray-100 px-5 py-4">
        <p className="text-sm font-bold text-gray-900">
          qwertyuiop
        </p>

        <p className="mt-1 text-xs text-gray-400">
          Coach Account
        </p>
      </div>

      {/* MENU */}
      <div className="p-2">

        {/* MY PROFILE */}
        <button
          onClick={onProfile}
          className="flex w-full items-center gap-3 rounded-xl
                     px-3 py-3 text-left text-sm text-gray-700
                     hover:bg-indigo-50 hover:text-indigo-600"
        >
          <User size={18} />
          <span>My Profile</span>
        </button>

        {/* PRIVACY & SECURITY */}
        <button
          onClick={onPrivacySecurity}
          className="flex w-full items-center gap-3 rounded-xl
                     px-3 py-3 text-left text-sm text-gray-700
                     hover:bg-indigo-50 hover:text-indigo-600"
        >
          <ShieldCheck size={18} />
          <span>Privacy &amp; Security</span>
        </button>

        {/* NOTIFICATIONS */}
        <button
          onClick={onNotifications}
          className="flex w-full items-center gap-3 rounded-xl
                     px-3 py-3 text-left text-sm text-gray-700
                     hover:bg-indigo-50 hover:text-indigo-600"
        >
          <Bell size={18} />
          <span>Notifications</span>
        </button>

        {/* HELP & SUPPORT */}
        <button
          onClick={onHelpSupport}
          className="flex w-full items-center gap-3 rounded-xl
                     px-3 py-3 text-left text-sm text-gray-700
                     hover:bg-indigo-50 hover:text-indigo-600"
        >
          <HelpCircle size={18} />
          <span>Help &amp; Support</span>
        </button>

      </div>

      {/* LOGOUT */}
      <div className="border-t border-gray-100 p-2">

        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl
                     px-3 py-3 text-left text-sm font-medium
                     text-red-500 hover:bg-red-50"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>

      </div>
    </div>
  );
}