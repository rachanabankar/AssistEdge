export function getScoreTone(score) {
  if (score >= 67) return "red";
  if (score >= 34) return "amber";
  return "green";
}

export function getEmotionTone(emotionalState) {
  if (!emotionalState) return "gray";
  const state = emotionalState.toLowerCase();

  const red = ["angry", "furious", "irate", "hostile"];
  const amber = ["frustrated", "annoyed", "impatient", "worried", "upset"];
  const green = ["calm", "happy", "satisfied", "content", "neutral"];

  if (red.some((w) => state.includes(w))) return "red";
  if (amber.some((w) => state.includes(w))) return "amber";
  if (green.some((w) => state.includes(w))) return "green";
  return "gray";
}