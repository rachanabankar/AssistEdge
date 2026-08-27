import json

from prompts.sentiment_prompt import SENTIMENT_SYSTEM_PROMPT
from utils.openrouter_client import call_openrouter


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

    customer_messages = [t for t in conversation_history if t["sender"] == "customer"]
    if not customer_messages:
        raise ValueError("No customer message found in conversation_history to analyze.")

    transcript_lines = []
    for turn in conversation_history:
        role_label = "Customer" if turn["sender"] == "customer" else "Agent"
        transcript_lines.append(f"{role_label}: {turn['content']}")
    transcript = "\n".join(transcript_lines)

    user_prompt = f"Conversation so far:\n\n{transcript}\n\nAnalyze the customer's latest message above."

    messages = [
        {"role": "system", "content": SENTIMENT_SYSTEM_PROMPT},
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


if __name__ == "__main__":
    test_history = [
        {"sender": "customer", "content": "My order was supposed to arrive 3 days ago and still nothing."},
        {"sender": "agent", "content": "I'm sorry about that, let me check the tracking for you."},
        {"sender": "customer", "content": "I've already checked it myself, it just says 'in transit' with no update. This is ridiculous."},
    ]
    result = analyze_sentiment(test_history)
    print(json.dumps(result, indent=2))