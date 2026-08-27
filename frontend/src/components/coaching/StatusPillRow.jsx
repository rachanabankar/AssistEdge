import Badge from "../common/Badge";

function sentimentTone(state) {
  if (!state) return "gray";
  const s = state.toLowerCase();
  const negative = ["angry", "frustrated", "upset", "annoyed", "negative", "concerned"];
  const positive = ["happy", "satisfied", "positive", "calm", "pleased"];
  if (negative.some((n) => s.includes(n))) return "red";
  if (positive.some((p) => s.includes(p))) return "green";
  return "gray";
}

function riskTone(level) {
  if (level === "high") return "red";
  if (level === "medium") return "amber";
  if (level === "low") return "green";
  return "gray";
}

export default function StatusPillRow({ sentiment, knowledgeCount, escalationRisk }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Badge tone={sentimentTone(sentiment?.emotional_state)}>
        Sentiment · {sentiment?.emotional_state ?? "—"}
      </Badge>
      <Badge tone="teal">Knowledge · {knowledgeCount} matches</Badge>
      <Badge tone="purple">Coaching · Active</Badge>
      <Badge tone={riskTone(escalationRisk)}>
        Escalation · {escalationRisk ?? "—"}
      </Badge>
      <Badge tone="purple">AI Insight · Ready</Badge>
    </div>
  );
}