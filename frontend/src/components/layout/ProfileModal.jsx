import { X, User, Mail, Phone, Building2, Edit3 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { formatPhoneNumberIntl } from "react-phone-number-input";
import { API_BASE_URL } from "../../config/constants";

export default function ProfileModal({
  isOpen,
  onClose,
  onEditProfile,
}) {
  const { agent } = useAuth();

  if (!isOpen) return null;

  const displayName =
    agent?.name ||
    agent?.username ||
    "Account";

  const displayEmail =
    agent?.email ||
    "No email available";

  const displayPhone = agent?.phone
  ? formatPhoneNumberIntl(agent.phone)
  : "Not provided";

  const displayDepartment =
    agent?.department ||
    "Customer Support";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center
                 bg-slate-900/40 px-4 backdrop-blur-sm"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl
                   border border-gray-100 bg-white shadow-2xl"
      >

        {/* ================= HEADER ================= */}

        <div
          className="flex items-center justify-between
                     border-b border-gray-100 px-7 py-5"
        >
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              My Profile
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              View your profile information
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center
                       rounded-xl text-gray-400
                       hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close profile"
          >
            <X size={20} />
          </button>
        </div>


        {/* ================= PROFILE BODY ================= */}

        <div className="bg-[#f8f9ff] p-7">

          {/* PROFILE OVERVIEW */}

          <div
            className="rounded-2xl border border-gray-100
                       bg-white p-6"
          >

            {/* PROFILE TOP */}

            <div className="flex flex-col items-center
                            text-center sm:flex-row
                            sm:text-left"
            >

              {/* PROFILE IMAGE */}

              {agent?.avatar_url ? (
               <img
                src={`${API_BASE_URL}${agent.avatar_url}`}
                alt="Profile"
                className="h-24 w-24 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-24 w-24 shrink-0
                            items-center justify-center
                            rounded-full bg-gradient-to-br
                            from-indigo-100 to-purple-100
                            text-2xl font-bold text-indigo-600"
                >
                  {getInitials(displayName)}
                </div>
              )}
          

              {/* NAME */}

              <div className="mt-4 sm:ml-5 sm:mt-0">

                <h3 className="text-xl font-bold text-gray-900">
                  {displayName}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {displayEmail}
                </p>

                <div className="mt-2 inline-flex items-center
                                rounded-full bg-indigo-50
                                px-3 py-1 text-xs font-medium
                                text-indigo-600"
                >
                  Coach Account
                </div>

              </div>

            </div>


            {/* DIVIDER */}

            <div className="my-6 border-t border-gray-100" />


            {/* INFORMATION */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* EMAIL */}

              <ProfileInfo
                icon={Mail}
                label="Email Address"
                value={displayEmail}
              />


              {/* PHONE */}

              <ProfileInfo
                icon={Phone}
                label="Phone Number"
                value={displayPhone}
              />


              {/* DEPARTMENT */}

              <ProfileInfo
                icon={Building2}
                label="Department"
                value={displayDepartment}
              />


              {/* USERNAME */}
              {agent?.username && agent.username !== agent?.email && (
                <ProfileInfo
                  icon={User}
                  label="Username"
                  value={agent.username}
                />
              )}
            </div>

          </div>


          {/* EDIT PROFILE */}

          <button
            type="button"
            onClick={onEditProfile}
            className="mt-5 flex w-full items-center
                       justify-center gap-2 rounded-xl
                       bg-indigo-600 px-5 py-3
                       text-sm font-semibold text-white
                       transition hover:bg-indigo-700"
          >
            <Edit3 size={17} />

            Edit Profile
          </button>

        </div>


        {/* ================= FOOTER ================= */}

        <div
          className="flex justify-end border-t
                     border-gray-100 px-7 py-4"
        >

          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200
                       px-5 py-2.5 text-sm font-semibold
                       text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>

        </div>

      </div>
    </div>
  );
}


/* =====================================================
   PROFILE INFORMATION COMPONENT
===================================================== */

function ProfileInfo({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl
                 bg-gray-50 p-4"
    >

      <div
        className="flex h-10 w-10 shrink-0
                   items-center justify-center
                   rounded-xl bg-indigo-50
                   text-indigo-600"
      >
        <Icon size={18} />
      </div>

      <div className="min-w-0">

        <p className="text-xs text-gray-400">
          {label}
        </p>

        <p className="mt-1 truncate text-sm
                      font-semibold text-gray-800">
          {value}
        </p>

      </div>

    </div>
  );
}


/* =====================================================
   INITIALS
===================================================== */

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}