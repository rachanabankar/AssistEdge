import { useState, useRef, useEffect } from "react";
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

  // Profile dropdown
  const [open, setOpen] = useState(false);

  // Individual UI windows
  const [profileOpen, setProfileOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [privacySecurityOpen, setPrivacySecurityOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsListOpen, setNotificationsListOpen] = useState(false);
  const [helpSupportOpen, setHelpSupportOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const menuRef = useRef(null);


  // Close dropdown when clicking outside
  useEffect(() => {

    function handleClickOutside(e) {

      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }

    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };

  }, []);


  // Logout
  const handleLogout = () => {

    logout();

    navigate("/login");

  };


  const displayName =
    agent?.name ||
    agent?.username ||
    "Account";

  const displayEmail =
    agent?.email ||
    "";


  return (
    <>

      {/* ================= NOTIFICATION ICON ================= */}

      <NotificationsDropdown onViewAll={() => setNotificationsListOpen(true)} />


      {/* ================= PROFILE ================= */}

      <div
        className="relative"
        ref={menuRef}
      >

        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-full
                     py-1 pl-1 pr-2 hover:bg-gray-50"
        >

          {/* Profile Image */}

          {agent?.avatar_url ? (
            <img
              src={`${API_BASE_URL}${agent.avatar_url}`}
              alt="Profile"
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (

            <span
              className="flex h-9 w-9 items-center justify-center
                         rounded-full bg-indigo-100
                         text-sm font-semibold text-indigo-700"
            >
              {getInitials(agent)}
            </span>
          )}
          <ChevronDown
            size={16}
            className="text-gray-400"
          />

        </button>


        {/* ================= DROPDOWN ================= */}

        {open && (

          <div
            className="absolute right-0 z-50 mt-2 w-64
                       overflow-hidden rounded-xl border
                       border-gray-100 bg-white
                       py-2 shadow-xl"
          >

            {/* USER INFORMATION */}

            <div
              className="border-b border-gray-100
                         px-4 py-3"
            >

              <p className="text-sm font-semibold text-gray-900">
                {displayName}
              </p>

              {displayEmail && (
                <p className="mt-0.5 text-xs text-gray-500">
                  {displayEmail}
                </p>
              )}

            </div>


            {/* ================= MY PROFILE ================= */}

            <button
              onClick={() => {

                setOpen(false);
                setProfileOpen(true);

              }}
              className="flex w-full items-center gap-3
                         px-4 py-2.5 text-left text-sm
                         text-gray-700 hover:bg-indigo-50
                         hover:text-indigo-600"
            >

              <User size={16} />

              <span>
                My Profile
              </span>

            </button>

           {/* ================= PRIVACY & SECURITY ================= */}

            <button
              onClick={() => {

                setOpen(false);
                setPrivacySecurityOpen(true);

              }}
              className="flex w-full items-center gap-3
                         px-4 py-2.5 text-left text-sm
                         text-gray-700 hover:bg-indigo-50
                         hover:text-indigo-600"
            >

              <ShieldCheck size={16} />

              <span>
                Privacy &amp; Security
              </span>

            </button>


            {/* ================= NOTIFICATIONS ================= */}

            <button
              onClick={() => {

                setOpen(false);
                setNotificationsOpen(true);

              }}
              className="flex w-full items-center gap-3
                         px-4 py-2.5 text-left text-sm
                         text-gray-700 hover:bg-indigo-50
                         hover:text-indigo-600"
            >

              <Bell size={16} />

              <span>
                Notifications
              </span>

            </button>

            {/* ================= HELP & SUPPORT ================= */}

            <button
              onClick={() => {

                setOpen(false);
                setHelpSupportOpen(true);

              }}
              className="flex w-full items-center gap-3
                         px-4 py-2.5 text-left text-sm
                         text-gray-700 hover:bg-indigo-50
                         hover:text-indigo-600"
            >

              <HelpCircle size={16} />

              <span>
                Help &amp; Support
              </span>

            </button>


            {/* ================= LOG OUT ================= */}

            <div
              className="mt-1 border-t border-gray-100 pt-1"
            >

              <button
                onClick={() => {

                  setOpen(false);
                  setLogoutOpen(true);

                }}
                className="flex w-full items-center gap-3
                           px-4 py-2.5 text-left text-sm
                           text-red-600 hover:bg-red-50"
              >

                <LogOut size={16} />

                <span>
                  Log Out
                </span>

              </button>

            </div>

          </div>

        )}

      </div>


      {/* ================================================== */}
      {/* MODALS */}
      {/* ================================================== */}


      {/* MY PROFILE */}

      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}

        // Edit Profile button can call this
        onEditProfile={() => {

          setProfileOpen(false);
          setEditProfileOpen(true);

        }}
      />


      {/* EDIT PROFILE */}

      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => {
          setEditProfileOpen(false);
          setProfileOpen(true);
        }}
      />

      {/* PRIVACY & SECURITY */}

      <PrivacySecurityModal
        isOpen={privacySecurityOpen}
        onClose={() => setPrivacySecurityOpen(false)}
      />


      {/* NOTIFICATIONS */}

      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      {/* NOTIFICATIONS LIST (moved out of profile dropdown block) */}

      <NotificationsListModal
        isOpen={notificationsListOpen}
        onClose={() => setNotificationsListOpen(false)}
      />


      {/* HELP & SUPPORT */}

      <HelpSupportModal
        isOpen={helpSupportOpen}
        onClose={() => setHelpSupportOpen(false)}
      />


      {/* LOGOUT */}

      <LogoutModal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />

    </>
  );
}