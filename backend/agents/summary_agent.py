import json

from sqlalchemy.orm import Session as DBSession

from prompts.summary_prompt import SUMMARY_SYSTEM_PROMPT
from utils.openrouter_client import call_openrouter

# NOTE: adjust this import to wherever Session/Message/Report actually live in your project
# (they were shown to me together, so I'm assuming one models module — split as needed).
from models.models import Session, Message, Report


def build_summary_input(db: DBSession, session_id: str) -> dict:
    """
    Gathers everything the Summary Agent needs from the DB: session metadata and the
    full turn-by-turn transcript, including the sentiment/escalation data that was
    already computed and persisted per message.
    """
    session = db.query(Session).filter(Session.id == session_id).first()
    if session is None:
        raise ValueError(f"No session found with id={session_id}")

    messages = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.timestamp.asc())
        .all()
    )
    if not messages:
        raise ValueError(f"Session {session_id} has no messages to summarize.")

    turns = []
    customer_turn_number = 0
    for m in messages:
        entry = {
            "sender": m.sender,
            "content": m.content,
        }
        if m.sender == "customer":
            customer_turn_number += 1
            entry["turn"] = customer_turn_number
            entry["frustration_score"] = m.frustration_score
            entry["sentiment"] = json.loads(m.sentiment_json) if m.sentiment_json else None
            entry["escalation"] = json.loads(m.escalation_json) if m.escalation_json else None
        turns.append(entry)

    return {
        "mode": session.mode,
        "scenario": session.scenario,
        "product_context": session.product_context,
        "customer_tone": session.customer_tone,
        "patience_level": session.patience_level,
        "turns": turns,
    }


def _build_user_prompt(input_data: dict) -> str:
    lines = []
    if input_data.get("scenario"):
        lines.append(f"Scenario: {input_data['scenario']}")
    if input_data.get("product_context"):
        lines.append(f"Product context: {input_data['product_context']}")
    lines.append("")
    lines.append("Full transcript with prior sentiment/escalation data on customer turns:")
    lines.append("")

    for t in input_data["turns"]:
        role_label = "Customer" if t["sender"] == "customer" else "Agent"
        line = f"{role_label}: {t['content']}"
        if t["sender"] == "customer":
            line += (
                f"\n  [turn {t['turn']} | frustration_score={t['frustration_score']} "
                f"| sentiment={t['sentiment']} | escalation={t['escalation']}]"
            )
        lines.append(line)

    lines.append("")
    lines.append("Produce the JSON report as specified.")
    return "\n".join(lines)


def _parse_summary_response(raw_content: str) -> dict:
    """
    Same defensive parsing pattern as sentiment_agent: strip markdown fences, validate
    required keys, fall back to a safe default rather than crashing the request.
    """
    cleaned = raw_content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()

    try:
        parsed = json.loads(cleaned)
        required_keys = {"summary", "resolution_score", "sentiment_journey", "coaching_tips"}
        if not required_keys.issubset(parsed.keys()):
            raise ValueError("Missing expected keys in model response")
        return parsed
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Summary agent: failed to parse model output ({e}). Raw: {raw_content}")
        raise


def generate_report(db: DBSession, session_id: str) -> Report:
    """
    Runs the Summary Agent for a session and upserts the Report row (one report per
    session — regeneration overwrites in place).
    """
    input_data = build_summary_input(db, session_id)
    user_prompt = _build_user_prompt(input_data)

    messages = [
        {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    raw_content = call_openrouter(messages, require_json=True)

    try:
        parsed = _parse_summary_response(raw_content)
    except (json.JSONDecodeError, ValueError):
        # one retry before giving up, since this is a bigger/pricier call than sentiment
        raw_content = call_openrouter(messages, require_json=True)
        parsed = _parse_summary_response(raw_content)  # let it raise if it fails again

    existing = db.query(Report).filter(Report.session_id == session_id).first()
    if existing:
        existing.summary = parsed["summary"]
        existing.resolution_score = parsed["resolution_score"]
        existing.sentiment_journey = json.dumps(parsed["sentiment_journey"])
        existing.coaching_tips = json.dumps(parsed["coaching_tips"])
        report = existing
    else:
        report = Report(
            session_id=session_id,
            summary=parsed["summary"],
            resolution_score=parsed["resolution_score"],
            sentiment_journey=json.dumps(parsed["sentiment_journey"]),
            coaching_tips=json.dumps(parsed["coaching_tips"]),
        )
        db.add(report)

    db.commit()
    db.refresh(report)
    return report


if __name__ == "__main__":
    # Quick manual test: python -m agents.summary_agent <session_id>
    import sys
    from models.database import SessionLocal

    if len(sys.argv) < 2:
        print("Usage: python -m agents.summary_agent <session_id>")
        sys.exit(1)

    db = SessionLocal()
    try:
        result = generate_report(db, sys.argv[1])
        print(
            json.dumps(
                {
                    "session_id": result.session_id,
                    "summary": result.summary,
                    "resolution_score": result.resolution_score,
                    "sentiment_journey": json.loads(result.sentiment_journey),
                    "coaching_tips": json.loads(result.coaching_tips),
                },
                indent=2,
            )
        )
    finally:
        db.close()