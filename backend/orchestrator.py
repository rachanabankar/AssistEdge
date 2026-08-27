import json
from sqlalchemy.orm import Session as DBSession

from agents.sentiment_agent import analyze_sentiment
from agents.knowledge_agent import recommend_knowledge
from agents.coaching_agent import generate_coaching_suggestions
from agents.escalation_agent import assess_escalation_risk
from models import crud


def run_coaching_pipeline(db: DBSession, session_id: str, updated_history: list) -> dict:
    """
    Runs the full agent pipeline for one conversation turn, in the correct order,
    and returns a single combined result.

    db: active SQLAlchemy session (for reading frustration history / other persisted data)
    session_id: the session this turn belongs to (used for KB scoping and frustration history)
    updated_history: list of {"sender": "customer"/"agent", "content": str}, including the
        latest customer message that just came in.

    Order of operations:
    1. Sentiment analysis on the latest customer message (context for everything downstream).
    2. Knowledge base retrieval (independent of sentiment).
    3. Coaching suggestions, informed by the sentiment result if it succeeded.
    4. Escalation risk, informed by the frustration_score trend pulled from the DB
       (including the score from step 1, once it's been saved by the caller).

    Each agent call is independently try/excepted so one agent failing (e.g. rate limit,
    malformed output) doesn't take down the others — matches the existing pattern in
    simulate.py where a sentiment failure returns None instead of erroring the whole request.

    Returns:
    {
        "sentiment": dict | None,
        "knowledge_suggestions": list,
        "coaching": dict | None,
        "escalation": dict | None,
    }
    """

    result = {
        "sentiment": None,
        "knowledge_suggestions": [],
        "coaching": None,
        "escalation": None,
    }

    # ---------- 1. Sentiment ----------
    try:
        result["sentiment"] = analyze_sentiment(updated_history)
    except Exception as e:
        print(f"Orchestrator: sentiment agent failed: {e}")
        result["sentiment"] = None

    # Persist the frustration_score and full sentiment object onto the latest customer
    # message row, so both are available for frustration history and Replay Mode.
    if result["sentiment"] and updated_history and updated_history[-1]["sender"] == "customer":
        frustration_score = result["sentiment"].get("frustration_score")
        try:
            latest_customer_message = crud.get_latest_customer_message(db, session_id)
            if latest_customer_message:
                if frustration_score is not None:
                    latest_customer_message.frustration_score = frustration_score
                latest_customer_message.sentiment_json = json.dumps(result["sentiment"])
                db.commit()
        except Exception as e:
            print(f"Orchestrator: failed to persist sentiment/frustration_score: {e}")

    # ---------- 2. Knowledge base ----------
    try:
        result["knowledge_suggestions"] = recommend_knowledge(updated_history, session_id=session_id)
    except Exception as e:
        print(f"Orchestrator: knowledge agent failed: {e}")
        result["knowledge_suggestions"] = []

    # ---------- 3. Coaching suggestions (sentiment-aware) ----------
    try:
        result["coaching"] = generate_coaching_suggestions(
            updated_history, sentiment_context=result["sentiment"]
        )
    except Exception as e:
        print(f"Orchestrator: coaching agent failed: {e}")
        result["coaching"] = None

    # ---------- 4. Escalation risk (trend-aware) ----------
    try:
        frustration_history = crud.get_frustration_history(db, session_id)
        result["escalation"] = assess_escalation_risk(
            updated_history, frustration_score_history=frustration_history
        )
    except Exception as e:
        print(f"Orchestrator: escalation agent failed: {e}")
        result["escalation"] = None

    # Persist the full escalation object onto the latest customer message row.
    # Independent of sentiment's success — escalation is derived from DB history,
    # not this turn's live sentiment result.
    if result["escalation"] and updated_history and updated_history[-1]["sender"] == "customer":
        try:
            latest_customer_message = crud.get_latest_customer_message(db, session_id)
            if latest_customer_message:
                latest_customer_message.escalation_json = json.dumps(result["escalation"])
                db.commit()
        except Exception as e:
            print(f"Orchestrator: failed to persist escalation_json: {e}")

    # Fire an Escalation Alert notification only when the agent actually flagged risk,
    # not on every turn (assess_escalation_risk runs every turn regardless of risk level),
    # and only if the agent hasn't turned off escalation notifications.
    if result["escalation"] and result["escalation"].get("alert_triggered"):
        try:
            session_obj = crud.get_session(db, session_id)
            if session_obj:
                agent = crud.get_agent_by_id(db, session_obj.agent_id)
                if agent and agent.notify_escalations:
                    crud.create_notification(
                        db,
                        agent_id=session_obj.agent_id,
                        category="escalation",
                        title="Escalation Alert",
                        message=result["escalation"].get(
                            "reasoning", "A conversation may require supervisor attention."
                        ),
                        session_id=session_id,
                    )
        except Exception as e:
            print(f"Orchestrator: failed to create escalation notification: {e}")

    return result