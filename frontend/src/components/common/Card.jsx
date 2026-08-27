export default function Card({ title, accent = "gray", children, className = "" }) {
  const theme = {
    blue:   { wash: "from-blue-50/70",    ring: "ring-blue-100",    title: "text-blue-700",    dot: "bg-blue-500" },
    green:  { wash: "from-emerald-50/70", ring: "ring-emerald-100", title: "text-emerald-700", dot: "bg-emerald-500" },
    red:    { wash: "from-rose-50/70",    ring: "ring-rose-100",    title: "text-rose-700",    dot: "bg-rose-500" },
    purple: { wash: "from-indigo-50/70",  ring: "ring-indigo-100",  title: "text-indigo-700",  dot: "bg-indigo-500" },
    amber:  { wash: "from-amber-50/70",   ring: "ring-amber-100",   title: "text-amber-700",   dot: "bg-amber-500" },
     teal:   { wash: "from-teal-50/70",    ring: "ring-teal-100",    title: "text-teal-700",    dot: "bg-teal-500" },
    gray:   { wash: "from-gray-50/70",    ring: "ring-gray-100",    title: "text-gray-600",    dot: "bg-gray-400" },
  }[accent];

  return (
    <div
      className={`relative bg-gradient-to-b ${theme.wash} to-white rounded-2xl ring-1 ${theme.ring} overflow-hidden
      shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)]
      transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_12px_32px_-8px_rgba(15,23,42,0.16)]
      ${className}`}
    >
      <div className="relative p-6">
        {title && (
          <h3 className={`flex items-center gap-2 text-[11px] font-bold tracking-[0.08em] uppercase mb-5 ${theme.title}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
}