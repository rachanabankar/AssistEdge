export default function AuthLayout({ heading, subheading, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-2">
        {/* Left branding panel */}
        <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-lg">
                🤖
              </div>
              <span className="text-xl font-bold text-gray-900">
                Assist<span className="text-indigo-600">Edge</span>
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {heading}
            </h1>
            <p className="text-gray-500">{subheading}</p>
          </div>

          {/* Simple stylized illustration placeholder — swap for real asset later */}
          <div className="flex items-center justify-center py-10">
            <div className="w-32 h-32 rounded-full bg-white/60 flex items-center justify-center text-6xl shadow-inner">
              🤖
            </div>
          </div>

          <div>
            <p className="font-semibold text-indigo-700">AI-Powered Coaching</p>
            <p className="text-sm text-gray-500 mt-1">
              Real-time guidance, smarter insights, better performance.
            </p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="p-10 flex flex-col justify-center">{children}</div>
      </div>
    </div>
  );
}