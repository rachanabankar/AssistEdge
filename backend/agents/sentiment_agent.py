import json
from utils.llm_safety import agent_messages, parse_output, SentimentOutput

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

    messages = agent_messages(SENTIMENT_SYSTEM_PROMPT, {"conversation": conversation_history},
                              'Analyze the latest customer message using the required JSON schema.')

    raw_content = call_groq(messages, require_json=True)
    return _parse_json_response(raw_content)


def _parse_json_response(raw_content: str) -> dict:
    """
    Accept only schema-valid JSON; use a safe default for malformed output.
    """
    try:
        parsed = parse_output(raw_content, SentimentOutput)
        required_keys = {"intent", "emotional_state", "frustration_score", "satisfaction_trend"}
        if not required_keys.issubset(parsed.keys()):
            raise ValueError("Missing expected keys in model response")
        return parsed
    except (json.JSONDecodeError, ValueError, TypeError) as e:
        print(f"Sentiment agent: failed to parse model output ({e}). Raw: {raw_content}")
        return {
            "intent": "unknown",
            "emotional_state": "unknown",
            "frustration_score": 50,
            "satisfaction_trend": "stable",
            "reasoning": "Could not parse model output; returning neutral default.",
        }
