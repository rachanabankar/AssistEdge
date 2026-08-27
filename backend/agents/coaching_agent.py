import json

from prompts.coaching_prompt import COACHING_SYSTEM_PROMPT
from utils.openrouter_client import call_openrouter


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

    customer_messages = [t for t in conversation_history if t["sender"] == "customer"]
    if not customer_messages:
        raise ValueError("No customer message found in conversation_history to analyze.")

    transcript_lines = []
    for turn in conversation_history:
        role_label = "Customer" if turn["sender"] == "customer" else "Agent"
        transcript_lines.append(f"{role_label}: {turn['content']}")
    transcript = "\n".join(transcript_lines)

    sentiment_lines = "No sentiment data provided."
    if sentiment_context:
        sentiment_lines = (
            f"emotional_state={sentiment_context.get('emotional_state', 'unknown')}, "
            f"frustration_score={sentiment_context.get('frustration_score', 'unknown')}, "
            f"intent={sentiment_context.get('intent', 'unknown')}"
        )

    user_prompt = (
        f"Conversation so far:\n\n{transcript}\n\n"
        f"Sentiment: {sentiment_lines}\n\n"
        f"Suggest responses for the agent's next message."
    )

    messages = [
        {"role": "system", "content": COACHING_SYSTEM_PROMPT},
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


if __name__ == "__main__":
    test_history = [
        {"sender": "customer", "content": "My order was supposed to arrive 3 days ago and still nothing."},
        {"sender": "agent", "content": "I'm sorry about that, let me check the tracking for you."},
        {"sender": "customer", "content": "I've already checked it myself, it just says 'in transit' with no update. This is ridiculous."},
    ]
    result = generate_coaching_suggestions(test_history)
    print(json.dumps(result, indent=2))