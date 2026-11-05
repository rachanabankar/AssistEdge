import { useState } from "react";
import Card from "../common/Card";

// Each suggested response gets a light tint + accent color, keyed by its
// tone label. Falls back to a rotating palette for unrecognized tones so
// boxes never all render the same flat white.
const TONE_STYLES = {
  empathetic: { bg: "#ecfdf5", border: "#bdf0d8", accent: "#059669" },
  "firm and policy-based": { bg: "#eef2ff", border: "#dbe1ff", accent: "#4f46e5" },
  "concise and solution-focused": { bg: "#ecfeff", border: "#bdeefc", accent: "#0891b2" },
};

const FALLBACK_PALETTE = [
  { bg: "#fff7ed", border: "#fde3c4", accent: "#ea580c" },
  { bg: "#fdf2f8", border: "#fbcfe8", accent: "#db2777" },
  { bg: "#f5f3ff", border: "#ddd6fe", accent: "#7c3aed" },
];

function toneStyleFor(tone, index) {
  if (tone && TONE_STYLES[tone.toLowerCase()]) return TONE_STYLES[tone.toLowerCase()];
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

export default function CoachingPanel({ coaching }) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  if (!coaching) {
    return (
      <Card title="Coaching" accent="purple">
        <p className="text-sm text-gray-400 italic">
          Coaching suggestions will appear here once a message is analyzed.
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="Coaching"
      className="border-t-4 border-violet-500 bg-[#F6F3FF]"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">💡</span>

        <p className="text-sm leading-7 text-gray-700">
          {coaching.coaching_tip}
        </p>
      </div>

      <button
        onClick={() => setShowSuggestions((s) => !s)}
        className="mt-4 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
      >
        {showSuggestions
          ? "Hide suggested responses ▲"
          : "View suggested responses ▾"}
      </button>

      {showSuggestions && (
        <div className="mt-5 space-y-4">
          {coaching.suggested_responses?.map((r, i) => {
            const style = toneStyleFor(r.tone, i);

            return (
              <div
                key={i}
                className="relative overflow-hidden rounded-xl p-4 pl-5 shadow-sm transition-all hover:shadow-md"
                style={{ background: style.bg, border: `1px solid ${style.border}` }}
              >
                <span
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ background: style.accent }}
                />

                <span
                  className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "#ffffffb3", color: style.accent, border: `1px solid ${style.border}` }}
                >
                  {r.tone}
                </span>

                <p className="mt-3 text-sm leading-7" style={{ color: "#3a3f52" }}>
                  {r.response}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
