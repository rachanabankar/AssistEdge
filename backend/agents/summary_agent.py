import json
from utils.llm_safety import agent_messages, parse_output, SummaryOutput

from sqlalchemy.orm import Session as DBSession

from models.models import Session, Message, Report
from prompts.summary_prompt import SUMMARY_SYSTEM_PROMPT
from utils.groq_client import call_groq


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
    return agent_messages(SUMMARY_SYSTEM_PROMPT, input_data,
                          "Produce the JSON report as specified.")[1]["content"]


def _get_fallback_report(fallback_sentiment_journey: list = None) -> dict:
    is_nullable = True
    try:
        is_nullable = bool(Report.resolution_score.property.columns[0].nullable)
    except Exception:
        pass
    return {
        "summary": "Automated summary could not be generated for this session.",
        "resolution_score": None if is_nullable else 0,
        "sentiment_journey": fallback_sentiment_journey if fallback_sentiment_journey is not None else [],
        "coaching_tips": ["Review this session manually."],
    }


def _extract_sentiment_journey_from_input(input_data: dict) -> list:
    journey = []
    if not input_data or "turns" not in input_data:
        return journey
    for turn in input_data.get("turns", []):
        if turn.get("sender") == "customer":
            sentiment = turn.get("sentiment") or {}
            journey.append({
                "turn": turn.get("turn", len(journey) + 1),
                "sentiment": sentiment.get("emotional_state") or "unknown",
                "frustration_score": turn.get("frustration_score"),
            })
    return journey


def _parse_summary_response(raw_content: str, fallback_sentiment_journey: list = None) -> dict:
    """
    Accept only schema-valid JSON; use a safe default for malformed output.
    """
    try:
        parsed = parse_output(raw_content, SummaryOutput)
        required_keys = {"summary", "resolution_score", "sentiment_journey", "coaching_tips"}
        if not required_keys.issubset(parsed.keys()):
            raise ValueError("Missing expected keys in model response")
        return parsed
    except (json.JSONDecodeError, ValueError, TypeError) as e:
        print(f"Summary agent: failed to parse model output ({e}). Raw: {raw_content}")
        return _get_fallback_report(fallback_sentiment_journey)


def generate_report(db: DBSession, session_id: str) -> Report:
    """
    Runs the Summary Agent for a session and upserts the Report row (one report per
    session â€” regeneration overwrites in place).
    """
    input_data = build_summary_input(db, session_id)
    fallback_sentiment_journey = _extract_sentiment_journey_from_input(input_data)
    messages = agent_messages(SUMMARY_SYSTEM_PROMPT, input_data,
                              "Produce the JSON report as specified.")

    try:
        raw_content = call_groq(messages, require_json=True)
    except Exception as e:
        print(f"Summary agent: call_groq failed ({e}), using fallback report.")
        raw_content = ""

    parsed = _parse_summary_response(raw_content, fallback_sentiment_journey=fallback_sentiment_journey)

    report_fields = {
        "summary": parsed["summary"],
        "resolution_score": parsed["resolution_score"],
        "sentiment_journey": json.dumps(parsed["sentiment_journey"]),
        "coaching_tips": json.dumps(parsed["coaching_tips"]),
    }

    existing = db.query(Report).filter(Report.session_id == session_id).first()
    if existing:
        for key, value in report_fields.items():
            setattr(existing, key, value)
        report = existing
    else:
        report = Report(session_id=session_id, **report_fields)
        db.add(report)

    db.commit()
    db.refresh(report)
    return report
