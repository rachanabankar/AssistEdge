import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/constants";
import NotificationsDropdown from "./NotificationsDropdown";
import NotificationsListModal from "../../profile/NotificationsListModal";

import {
  Bell,
  ChevronDown,
  User,
  ShieldCheck,
  HelpCircle,
  LogOut,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import ProfileModal from "./ProfileModal";
import EditProfileModal from "../../profile/EditProfileModal";
import PrivacySecurityModal from "../../profile/PrivacySecurityModal";
import NotificationsModal from "../../profile/NotificationsModal";
import HelpSupportModal from "../../profile/HelpSupportModal";
import LogoutModal from "../../profile/LogoutModal";

const MENU_ITEM_CLASS =
  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700";

function getInitials(agent) {
  const source = agent?.name || agent?.username || "?";

  return source
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Header() {
  const { agent, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [privacySecurityOpen, setPrivacySecurityOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsListOpen, setNotificationsListOpen] = useState(false);
  const [helpSupportOpen, setHelpSupportOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = agent?.name || agent?.username || "Account";
  const displayEmail = agent?.email || "";

  const openModal = (setter) => {
    setMenuOpen(false);
    setter(true);
  };

  return (
    <>
      {/* The header intentionally contains only two controls:
          notifications and the user profile. */}
      <div className="relative z-50 flex h-full items-center justify-end gap-4">
        <NotificationsDropdown
          onViewAll={() => setNotificationsListOpen(true)}
        />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((isOpen) => !isOpen)}
            aria-label="Open profile menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="group flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {agent?.avatar_url ? (
              <img
                src={`${API_BASE_URL}${agent.avatar_url}`}
                alt={`${displayName}'s profile`}
                className="h-10 w-10 rounded-full border border-indigo-100 object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-100 bg-indigo-100 text-sm font-semibold text-indigo-700">
                {getInitials(agent)}
              </span>
            )}

            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform duration-200 ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 shadow-[0_16px_45px_rgba(31,41,55,0.14)]"
            >
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {displayName}
                </p>
                {displayEmail && (
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {displayEmail}
                  </p>
                )}
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => openModal(setProfileOpen)}
                className={MENU_ITEM_CLASS}
              >
                <User size={16} />
                My Profile
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => openModal(setPrivacySecurityOpen)}
                className={MENU_ITEM_CLASS}
              >
                <ShieldCheck size={16} />
                Privacy &amp; Security
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => openModal(setNotificationsOpen)}
                className={MENU_ITEM_CLASS}
              >
                <Bell size={16} />
                Notification Settings
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => openModal(setHelpSupportOpen)}
                className={MENU_ITEM_CLASS}
              >
                <HelpCircle size={16} />
                Help &amp; Support
              </button>

              <div className="mt-1 border-t border-slate-100 pt-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => openModal(setLogoutOpen)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Existing profile and account dialogs are retained. */}
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        onEditProfile={() => {
          setProfileOpen(false);
          setEditProfileOpen(true);
        }}
      />

      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => {
          setEditProfileOpen(false);
          setProfileOpen(true);
        }}
      />

      <PrivacySecurityModal
        isOpen={privacySecurityOpen}
        onClose={() => setPrivacySecurityOpen(false)}
      />

      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      <NotificationsListModal
        isOpen={notificationsListOpen}
        onClose={() => setNotificationsListOpen(false)}
      />

      <HelpSupportModal
        isOpen={helpSupportOpen}
        onClose={() => setHelpSupportOpen(false)}
      />

      <LogoutModal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
