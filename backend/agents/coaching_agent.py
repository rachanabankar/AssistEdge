import json

from prompts.coaching_prompt import COACHING_SYSTEM_PROMPT
from utils.groq_client import call_groq


def generate_coaching_suggestions(conversation_history: list, sentiment_context: dict = None) -> dict:
    """
    conversation_history: list of {"sender": "customer"/"agent", "content": str}
    sentiment_context: optional dict, typically the output of sentiment_agent.analyze_sentiment().
        Standalone callers can omit this entirely — it defaults to None. The orchestrator passes
        it in once sentiment analysis has run for this turn.

    Returns a dict:
    {
        "suggested_responses": [
            {"tone": str, "response": str},
            {"tone": str, "response": str},
            {"tone": str, "response": str}
        ],
        "coaching_tip": str,
        "reasoning": str
    }
    """
    if not any(t.get("sender") == "customer" for t in conversation_history):
        raise ValueError("No customer message found in conversation_history to analyze.")

    transcript = "\n".join(
        f"{'Customer' if turn['sender'] == 'customer' else 'Agent'}: {turn['content']}"
        for turn in conversation_history
    )

    if sentiment_context:
        sentiment_lines = (
            f"emotional_state={sentiment_context.get('emotional_state', 'unknown')}, "
            f"frustration_score={sentiment_context.get('frustration_score', 'unknown')}, "
            f"intent={sentiment_context.get('intent', 'unknown')}"
        )
    else:
        sentiment_lines = "No sentiment data provided."

    user_prompt = (
        f"Conversation so far:\n\n{transcript}\n\n"
        f"Sentiment: {sentiment_lines}\n\n"
        f"Suggest responses for the agent's next message."
    )

    messages = [
        {"role": "system", "content": COACHING_SYSTEM_PROMPT},
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
        required_keys = {"suggested_responses", "coaching_tip", "reasoning"}
        if not required_keys.issubset(parsed.keys()):
            raise ValueError("Missing expected keys in model response")
        return parsed
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Coaching agent: failed to parse model output ({e}). Raw: {raw_content}")
        return {
            "suggested_responses": [
                {"tone": "neutral", "response": "Thanks for your message, let me look into this for you."}
            ],
            "coaching_tip": "Could not generate tailored suggestions; using a safe neutral fallback.",
            "reasoning": "Could not parse model output; returning a neutral default.",
        }
