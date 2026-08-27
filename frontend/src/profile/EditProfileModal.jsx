import {
  X,
  Camera,
  User,
  Mail,
  Building2,
} from "lucide-react";
import { useState, useRef } from "react";
import { profileApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/constants";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function EditProfileModal({ isOpen, onClose }) {
  const { agent, updateAgent } = useAuth();
  const [form, setForm] = useState({
    name: agent?.name || "",
    email: agent?.email || "",
    phone: agent?.phone || "",
    department: agent?.department || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { data } = await profileApi.update(form);
      updateAgent(data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setError(null);
    try {
      const { data } = await profileApi.uploadAvatar(file);
      updateAgent(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
      e.target.value = ""; // allow re-selecting the same file later
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center
                    bg-slate-900/40 px-4 backdrop-blur-sm">

      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-100 px-7 py-5">

          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Edit Profile
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Update your personal information
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center
                       rounded-xl text-gray-400
                       hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>

        </div>

        {/* BODY */}
        <div className="max-h-[70vh] overflow-y-auto bg-[#f8f9ff] p-7">

          {error && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* PROFILE IMAGE */}
          <div className="mb-6 rounded-2xl border border-gray-100
                          bg-white p-6">

            <h3 className="mb-5 text-sm font-bold text-gray-900">
              Profile Picture
            </h3>

            <div className="flex items-center gap-5">

              <div className="relative">

                {agent?.avatar_url ? (
                  <img
                    src={`${API_BASE_URL}${agent.avatar_url}`}
                    alt="Profile"
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center
                                  rounded-full bg-gradient-to-br
                                  from-indigo-100 to-purple-100
                                  text-2xl font-bold text-indigo-600">
                    {getInitials(agent?.name || agent?.username || "?")}
                  </div>
                )}

                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 flex h-8 w-8
                             items-center justify-center rounded-full
                             border-2 border-white bg-indigo-600
                             text-white disabled:opacity-50"
                >
                  <Camera size={14} />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />

              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Profile Photo
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  JPG, PNG or WEBP. Maximum 2MB.
                </p>

                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="mt-3 rounded-lg border border-indigo-200
                             px-3 py-1.5 text-xs font-semibold
                             text-indigo-600 hover:bg-indigo-50
                             disabled:opacity-50"
                >
                  {uploadingAvatar ? "Uploading..." : "Change Photo"}
                </button>
              </div>

            </div>
          </div>

          {/* FORM */}
          <div className="rounded-2xl border border-gray-100
                          bg-white p-6">

            <h3 className="mb-5 text-sm font-bold text-gray-900">
              Personal Information
            </h3>

            <div className="space-y-5">

              {/* NAME */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">
                  Full Name
                </label>

                <div className="relative">
                  <User className="absolute left-3 top-1/2
                                    -translate-y-1/2 text-gray-400"
                        size={16} />

                  <input
                    value={form.name}
                    onChange={(e) =>
                      updateField("name", e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200
                               py-2.5 pl-10 pr-3 text-sm outline-none
                               focus:border-indigo-500
                               focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2
                                    -translate-y-1/2 text-gray-400"
                        size={16} />

                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      updateField("email", e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200
                               py-2.5 pl-10 pr-3 text-sm outline-none
                               focus:border-indigo-500
                               focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* PHONE */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">
                  Phone Number
                </label>

              <PhoneInput
                international
                defaultCountry="IN"
                value={form.phone}
                onChange={(value) => updateField("phone", value || "")}
                className="phone-input-custom"
              />
              </div>

              {/* DEPARTMENT */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">
                  Department
                </label>

                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2
                                         -translate-y-1/2 text-gray-400"
                              size={16} />

                  <input
                    value={form.department}
                    onChange={(e) =>
                      updateField("department", e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200
                               py-2.5 pl-10 pr-3 text-sm outline-none
                               focus:border-indigo-500
                               focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 border-t border-gray-100
                        px-7 py-4">

          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200
                       px-5 py-2.5 text-sm font-semibold
                       text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="rounded-xl bg-indigo-600 px-5 py-2.5
             text-sm font-semibold text-white
             hover:bg-indigo-700"
          >
             {saving ? "Saving..." : "Save Changes"}
          </button>

        </div>

      </div>
    </div>
  );
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}