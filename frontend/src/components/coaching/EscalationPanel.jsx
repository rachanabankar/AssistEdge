import Card from "../common/Card";
import Badge from "../common/Badge";
import ScoreRing from "../common/ScoreRing";
import { getScoreTone } from "../../utils/tone";

export default function EscalationPanel({ escalation }) {
  if (!escalation) {
    return (
      <Card title="Escalation Risk" accent="red">
        <p className="text-sm text-gray-400 italic">
          Escalation risk will appear here once a message is analyzed.
        </p>
      </Card>
    );
  }

  const ringTone = getScoreTone(escalation.escalation_risk_score);

  return (
    <Card title="Escalation Risk" accent="red">
      <div className="flex items-center gap-5">
        <ScoreRing value={escalation.escalation_risk_score} label="/ 100" tone={ringTone} />
        <div>
          <Badge tone={ringTone}>{escalation.risk_level}</Badge>
          <p className="text-xs text-gray-400 mt-2">
            Risk score {escalation.escalation_risk_score} of 100
          </p>
        </div>
      </div>

      {escalation.reasoning && (
        <div className="relative bg-rose-50/70 border border-rose-100 rounded-xl pl-4 pr-3 py-3 mt-5 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-rose-400">
          <p className="text-sm text-rose-900 leading-relaxed">{escalation.reasoning}</p>
        </div>
      )}

      {escalation.alert_triggered && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mt-3">
          <p className="text-sm font-semibold text-rose-700 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
            </span>
            Escalation alert triggered
          </p>
          <p className="text-sm text-rose-600 mt-1.5 leading-relaxed">{escalation.recommended_intervention}</p>
        </div>
      )}
    </Card>
  );
}