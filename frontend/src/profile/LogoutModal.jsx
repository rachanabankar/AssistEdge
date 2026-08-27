import { LogOut, X, AlertTriangle } from "lucide-react";

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center
                    bg-slate-900/40 px-4 backdrop-blur-sm">

      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center
                       rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center">

          <div className="flex h-14 w-14 items-center justify-center
                          rounded-2xl bg-red-50 text-red-500">
            <AlertTriangle size={25} />
          </div>

          <h2 className="mt-5 text-lg font-bold text-gray-900">
            Log out of AssistEdge?
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            Are you sure you want to log out? You will need to sign in
            again to access your account.
          </p>

          <div className="mt-7 flex w-full gap-3">

            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200
                         px-4 py-2.5 text-sm font-semibold
                         text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              className="flex flex-1 items-center justify-center gap-2
                         rounded-xl bg-red-500 px-4 py-2.5
                         text-sm font-semibold text-white
                         hover:bg-red-600"
            >
              <LogOut size={16} />
              Log Out
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}