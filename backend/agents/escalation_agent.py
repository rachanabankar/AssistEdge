import json
from utils.llm_safety import agent_messages, parse_output, EscalationOutput

from prompts.escalation_prompt import ESCALATION_SYSTEM_PROMPT
from utils.groq_client import call_groq

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
    if not any(t.get("sender") == "customer" for t in conversation_history):
        raise ValueError("No customer message found in conversation_history to analyze.")

    messages = agent_messages(ESCALATION_SYSTEM_PROMPT, {"conversation": conversation_history, "frustration_history": frustration_score_history},
                              'Assess escalation risk using the required JSON schema.')

    raw_content = call_groq(messages, require_json=True)
    return _parse_json_response(raw_content)


def _parse_json_response(raw_content: str) -> dict:
    """
    Accept only schema-valid JSON; use a safe default for malformed output.
    """
    try:
        parsed = parse_output(raw_content, EscalationOutput)
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
    except (json.JSONDecodeError, ValueError, TypeError) as e:
        print(f"Escalation agent: failed to parse model output ({e}). Raw: {raw_content}")
        return {
            "escalation_risk_score": 50,
            "risk_level": "medium",
            "alert_triggered": False,
            "reasoning": "Could not parse model output; returning a neutral default.",
            "recommended_intervention": "Review this conversation manually; automatic risk scoring failed.",
        }
