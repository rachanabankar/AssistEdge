export default function Badge({ children, tone = "gray" }) {
  const toneClasses = {
    green:  "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red:    "bg-rose-50 text-rose-700 ring-rose-200",
    amber:  "bg-amber-50 text-amber-700 ring-amber-200",
    purple: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    teal:   "bg-teal-50 text-teal-700 ring-teal-200",
    gray:   "bg-gray-50 text-gray-600 ring-gray-200",
  }[tone];

  const dotClasses = {
    green: "bg-emerald-500", red: "bg-rose-500", amber: "bg-amber-500",
    purple: "bg-indigo-500", teal: "bg-teal-500", gray: "bg-gray-400",
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${toneClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClasses}`} />
      {children}
    </span>
  );
}