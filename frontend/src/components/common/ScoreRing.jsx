export default function ScoreRing({ value, max = 100, label, tone = "purple", size = 90 }) {
  const theme = {
    green:  { from: "#34D399", to: "#059669", track: "#ECFDF5" },
    red:    { from: "#FB7185", to: "#E11D48", track: "#FFF1F2" },
    amber:  { from: "#FBBF24", to: "#D97706", track: "#FFFBEB" },
    purple: { from: "#818CF8", to: "#4F46E5", track: "#EEF2FF" },
  }[tone];

  const gradId = `ring-grad-${tone}`;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 90 90" className="-rotate-90 drop-shadow-sm">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.from} />
            <stop offset="100%" stopColor={theme.to} />
          </linearGradient>
        </defs>
        <circle cx="45" cy="45" r={radius} fill="none" stroke={theme.track} strokeWidth="9" />
        <circle
          cx="45"
          cy="45"
          r={radius}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={`url(#${gradId})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-extrabold text-gray-900 tabular-nums">{value}</span>
        {label && <span className="text-[10px] font-medium text-gray-400 mt-0.5">{label}</span>}
      </div>
    </div>
  );
}