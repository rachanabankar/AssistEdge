import json

from prompts.sentiment_prompt import SENTIMENT_SYSTEM_PROMPT
from utils.groq_client import call_groq


def analyze_sentiment(conversation_history: list) -> dict:
    """
    conversation_history: list of {"sender": "customer"/"agent", "content": str}
    Analyzes the latest customer message in context of the conversation so far.

    Returns a dict:
    {
        "intent": str,                  # short label, e.g. "requesting refund"
        "emotional_state": str,         # e.g. "frustrated", "anxious", "calm"
        "frustration_score": int,       # 0-100
        "satisfaction_trend": str,      # "improving" / "stable" / "worsening"
        "reasoning": str                # 1 sentence, why the model scored it this way
    }
    """
    if not any(t.get("sender") == "customer" for t in conversation_history):
        raise ValueError("No customer message found in conversation_history to analyze.")

    transcript = "\n".join(
        f"{'Customer' if turn['sender'] == 'customer' else 'Agent'}: {turn['content']}"
        for turn in conversation_history
    )
    user_prompt = f"Conversation so far:\n\n{transcript}\n\nAnalyze the customer's latest message above."

    messages = [
        {"role": "system", "content": SENTIMENT_SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    raw_content = call_groq(messages, require_json=True)
    return _parse_json_response(raw_content)


def _parse_json_response(raw_content: str) -> dict:
    """
    The LLM sometimes wraps JSON in markdown fences or adds stray text.
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
        required_keys = {"intent", "emotional_state", "frustration_score", "satisfaction_trend"}
        if not required_keys.issubset(parsed.keys()):
            raise ValueError("Missing expected keys in model response")
        return parsed
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Sentiment agent: failed to parse model output ({e}). Raw: {raw_content}")
        return {
            "intent": "unknown",
            "emotional_state": "unknown",
            "frustration_score": 50,
            "satisfaction_trend": "stable",
            "reasoning": "Could not parse model output; returning neutral default.",
        }
