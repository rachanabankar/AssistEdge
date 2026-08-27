from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession

from agents.simulator import generate_customer_message
from orchestrator import run_coaching_pipeline
from models.database import get_db
from models import crud
from models.models import Agent
from utils.auth import get_current_agent

router = APIRouter(prefix="/simulate", tags=["Simulate"])


class Turn(BaseModel):
    sender: str      # "customer" or "agent"
    content: str


class Persona(BaseModel):
    tone: str = "neutral"
    patience: str = "medium"


class SimulateMessageRequest(BaseModel):
    scenario: str
    persona: Persona = Persona()
    conversation_history: list[Turn] = []
    session_id: str | None = None   # NEW — enables persistence, sentiment, KB


@router.post("/message")
def simulate_message(
    payload: SimulateMessageRequest,
    db: DBSession = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    # session_id is optional here (simulator can run "dry" with no persistence),
    # so only check ownership when one was actually provided.
    if payload.session_id:
        session = crud.get_session(db, payload.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        if session.agent_id != current_agent.id:
            raise HTTPException(status_code=404, detail="Session not found")

    history = [turn.model_dump() for turn in payload.conversation_history]

    # If this turn includes an agent reply not yet saved, persist it first.
    # (Frontend sends the full history each time, so the last "agent" turn
    # is the newest one to save.)
    if payload.session_id and history and history[-1]["sender"] == "agent":
        crud.add_message(
            db,
            session_id=payload.session_id,
            sender="agent",
            content=history[-1]["content"],
        )

    try:
        message = generate_customer_message(
            scenario=payload.scenario,
            persona=payload.persona.model_dump(),
            conversation_history=history,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Simulator call failed: {str(e)}")

    updated_history = history + [{"sender": "customer", "content": message}]

    response = {"message": message}

    if payload.session_id:
        crud.add_message(
            db,
            session_id=payload.session_id,
            sender="customer",
            content=message,
        )

        pipeline_result = run_coaching_pipeline(db, payload.session_id, updated_history)
        response["sentiment"] = pipeline_result["sentiment"]
        response["knowledge_suggestions"] = pipeline_result["knowledge_suggestions"]
        response["coaching"] = pipeline_result["coaching"]
        response["escalation"] = pipeline_result["escalation"]
        

    return response