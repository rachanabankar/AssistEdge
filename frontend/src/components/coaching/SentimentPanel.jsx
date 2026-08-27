import Card from "../common/Card";
import Badge from "../common/Badge";
import ScoreRing from "../common/ScoreRing";
import { getScoreTone, getEmotionTone } from "../../utils/tone";

const TONE_BAR_GRADIENT = {
  green: "bg-gradient-to-t from-emerald-500 to-emerald-300",
  amber: "bg-gradient-to-t from-amber-500 to-amber-300",
  red: "bg-gradient-to-t from-rose-500 to-rose-300",
  gray: "bg-gray-200",
};

function FrustrationTrend({ history }) {
  if (!history || history.length === 0) return null;
  return (
    <div className="mt-5">
      <p className="text-[11px] font-medium text-gray-400 mb-2 tracking-wide uppercase">
        Frustration across this session
      </p>
      <div className="flex items-end gap-1 h-9 bg-gray-50 rounded-lg p-1.5">
        {history.map((point) => {
          const tone = getScoreTone(point.score);
          const heightPct = Math.max(15, point.score);
          return (
            <div
              key={point.turn}
              title={`Turn ${point.turn}: ${point.score}`}
              className={`flex-1 rounded-sm transition-all ${TONE_BAR_GRADIENT[tone]}`}
              style={{ height: `${heightPct}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function SentimentPanel({ sentiment, sentimentHistory }) {
  if (!sentiment) {
    return (
      <Card title="Sentiment & Intent" accent="green">
        <p className="text-sm text-gray-400 italic">
          Sentiment will appear here once a message is analyzed.
        </p>
      </Card>
    );
  }

  const ringTone = getScoreTone(sentiment.frustration_score);
  const badgeTone = getEmotionTone(sentiment.emotional_state);

  return (
    <Card title="Sentiment & Intent" accent="green">
      <div className="flex items-center gap-5">
        <ScoreRing value={sentiment.frustration_score} label="Frustration" tone={ringTone} />
        <div>
          <Badge tone={badgeTone}>{sentiment.emotional_state}</Badge>
          <p className="text-sm font-semibold text-gray-800 mt-2">{sentiment.intent}</p>
          <p className="text-xs text-gray-400 mt-1">— {sentiment.satisfaction_trend}</p>
        </div>
      </div>

      <div className="relative bg-emerald-50/70 border border-emerald-100 rounded-xl pl-4 pr-3 py-3 mt-5 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-emerald-400">
        <p className="text-sm text-emerald-900 leading-relaxed">{sentiment.reasoning}</p>
      </div>

      <FrustrationTrend history={sentimentHistory} />
    </Card>
  );
}