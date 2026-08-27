export default function ProgressBar({ value, max = 100, tone = "purple" }) {
  const toneClasses = {
    green: "bg-emerald-400",
    red: "bg-rose-400",
    amber: "bg-amber-400",
    purple: "bg-indigo-400",
  }[tone];

  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
      <div className={`h-full ${toneClasses}`} style={{ width: `${pct}%` }} />
    </div>
  );
}