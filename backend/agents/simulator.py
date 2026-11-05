from prompts.customer_prompt import CUSTOMER_SYSTEM_PROMPT_TEMPLATE
from utils.groq_client import call_groq


def generate_customer_message(scenario: str, persona: dict, conversation_history: list) -> str:
    """
    scenario: e.g. "Customer upset about a delayed shipment"
    persona: e.g. {"tone": "frustrated but polite", "patience": "low"}
    conversation_history: list of {"sender": "customer"/"agent", "content": str}
    Returns: the next customer message as a string
    """
    system_prompt = CUSTOMER_SYSTEM_PROMPT_TEMPLATE.format(
        scenario=scenario,
        tone=persona.get("tone", "neutral"),
        patience=persona.get("patience", "medium"),
    )

    messages = [{"role": "system", "content": system_prompt}]

    for turn in conversation_history:
        role = "assistant" if turn["sender"] == "customer" else "user"
        messages.append({"role": role, "content": turn["content"]})

    if not conversation_history:
        messages.append({
            "role": "user",
            "content": "Start the conversation as the customer, based on the scenario.",
        })

    # require_json=False (default) — this agent returns plain text, not JSON
    return call_groq(messages)
