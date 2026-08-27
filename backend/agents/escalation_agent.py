import json

from prompts.escalation_prompt import ESCALATION_SYSTEM_PROMPT
from utils.openrouter_client import call_openrouter

ALERT_THRESHOLD = 70


def assess_escalation_risk(conversation_history: list, frustration_score_history: list = None) -> dict:
    """
    conversation_history: list of {"sender": "customer"/"agent", "content": str}
    frustration_score_history: optional list of ints, frustration_score per customer turn so
        far, oldest first. Standalone callers can omit this; the orchestrator builds and passes
        it in from the DB via crud.get_frustration_history().

    Returns a dict:
    {
        "escalation_risk_score": int,       # 0-100
        "risk_level": str,                  # "low" / "medium" / "high"
        "alert_triggered": bool,            # true if escalation_risk_score >= 70
        "reasoning": str,
        "recommended_intervention": str
    }
    """

    customer_messages = [t for t in conversation_history if t["sender"] == "customer"]
    if not customer_messages:
        raise ValueError("No customer message found in conversation_history to analyze.")

    transcript_lines = []
    for turn in conversation_history:
        role_label = "Customer" if turn["sender"] == "customer" else "Agent"
        transcript_lines.append(f"{role_label}: {turn['content']}")
    transcript = "\n".join(transcript_lines)

    if frustration_score_history:
        history_line = f"frustration_score_history: {frustration_score_history}"
    else:
        history_line = "frustration_score_history: not provided"

    user_prompt = (
        f"Conversation so far:\n\n{transcript}\n\n"
        f"{history_line}\n\n"
        f"Assess escalation risk based on the customer's latest message and the trend above."
    )

    messages = [
        {"role": "system", "content": ESCALATION_SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    raw_content = call_openrouter(messages, require_json=True)
    return _parse_json_response(raw_content)


def _parse_json_response(raw_content: str) -> dict:
    """
    openrouter/free sometimes wraps JSON in markdown fences or adds stray text.
    Strip that before parsing, and fall back to a safe default if parsing fails
    rather than crashing the whole request.
    """
    cleaned = raw_content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()

    try:
        parsed = json.loads(cleaned)
        required_keys = {
            "escalation_risk_score",
            "risk_level",
            "alert_triggered",
            "reasoning",
            "recommended_intervention",
        }
        if not required_keys.issubset(parsed.keys()):
            raise ValueError("Missing expected keys in model response")

        score = parsed.get("escalation_risk_score", 0)
        parsed["alert_triggered"] = score >= ALERT_THRESHOLD

        return parsed
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Escalation agent: failed to parse model output ({e}). Raw: {raw_content}")
        return {
            "escalation_risk_score": 50,
            "risk_level": "medium",
            "alert_triggered": False,
            "reasoning": "Could not parse model output; returning a neutral default.",
            "recommended_intervention": "Review this conversation manually; automatic risk scoring failed.",
        }


if __name__ == "__main__":
    test_history = [
        {"sender": "customer", "content": "My order was supposed to arrive 3 days ago and still nothing."},
        {"sender": "agent", "content": "I'm sorry about that, let me check the tracking for you."},
        {"sender": "customer", "content": "This is the third time I've reached out. If it's not fixed by tomorrow I'm cancelling my subscription and leaving a review warning others."},
    ]
    result = assess_escalation_risk(test_history)
    print(json.dumps(result, indent=2))