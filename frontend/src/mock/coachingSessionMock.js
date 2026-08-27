export const mockConversation = [
  { sender: "customer", content: "Your store sent me the wrong size, and I need a replacement *now*. This isn't optional—fix it or I'm wasting more time than I already have." },
  { sender: "agent", content: "I hear your urgency. I'm processing a replacement for the correct size immediately to resolve this for you." },
];

export const mockSentiment = {
  score: 88,
  label: "angry",
  summary: "demanding immediate replacement",
  trend: "stable",
  explanation: "Customer uses urgent, confrontational language with explicit threats, indicating high frustration despite no prior messages to compare.",
  session_frustration: [88],
};

export const mockKnowledge = [
  {
    content: "For sizing errors, initiate replacement without requiring the customer to return the wrong item first if order value is under ₹2000.",
    metadata: { session_id: "demo-session-1", title: "Wrong Item Replacement Policy", source: "returns_policy.pdf" },
  },
  {
    content: "Expedited shipping should be offered automatically when escalation risk exceeds 70 and the issue is a fulfillment error.",
    metadata: { session_id: "demo-session-1", title: "Expedited Shipping SOP", source: "shipping_sop.pdf" },
  },
];

export const mockCoaching = {
  tip: "When frustration is high, validate the customer's wasted time immediately before jumping into the logistics of the replacement.",
  suggested_responses: [
    {
      tone: "empathetic",
      text: "I am so sorry for this mistake and the frustration it's causing you. I'm prioritizing your replacement right now to get this sorted out as quickly as possible.",
    },
    {
      tone: "firm and policy-based",
      text: "I understand this is urgent. I will initiate an immediate replacement for the correct size and send you the new tracking details as soon as they are generated.",
    },
    {
      tone: "concise and solution-focused",
      text: "I hear your urgency. I'm processing a replacement for the correct size immediately to resolve this for you.",
    },
  ],
};

export const mockEscalation = {
  risk_score: 85,
  risk_label: "high",
  alert_triggered: true,
  alert_title: "Escalation alert triggered",
  alert_action: "Acknowledge the error immediately, bypass standard troubleshooting, and offer expedited shipping for the replacement to resolve the urgency.",
};

export const mockKbStats = {
  indexed_documents: 31,
  active_articles: 19,
  pending_approvals: 0,
  chunks_stored: 1208,
};
export const mockFrustrationTrend = [40, 55, 48, 62, 58, 70, 65, 80, 74, 88, 82, 90, 85, 88];