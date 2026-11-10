import json
from utils.llm_safety import agent_messages, parse_output, CoachingOutput

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

    messages = agent_messages(COACHING_SYSTEM_PROMPT, {"conversation": conversation_history, "sentiment": sentiment_context},
                              'Suggest agent responses using the required JSON schema.')

    raw_content = call_groq(messages, require_json=True)
    return _parse_json_response(raw_content)


def _parse_json_response(raw_content: str) -> dict:
    """
    Accept only schema-valid JSON; use a safe default for malformed output.
    """
    try:
        parsed = parse_output(raw_content, CoachingOutput)
        required_keys = {"suggested_responses", "coaching_tip", "reasoning"}
        if not required_keys.issubset(parsed.keys()):
            raise ValueError("Missing expected keys in model response")
        return parsed
    except (json.JSONDecodeError, ValueError, TypeError) as e:
        print(f"Coaching agent: failed to parse model output ({e}). Raw: {raw_content}")
        return {
            "suggested_responses": [
                {"tone": "neutral", "response": "Thanks for your message, let me look into this for you."}
            ],
            "coaching_tip": "Could not generate tailored suggestions; using a safe neutral fallback.",
            "reasoning": "Could not parse model output; returning a neutral default.",
        }
