from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session as DBSession

from models import crud
from models.database import get_db
from models.models import Agent
from orchestrator import run_coaching_pipeline
from ratelimit import agent_rate_limit_check
from utils.auth import get_current_agent

router = APIRouter(prefix="/manual", tags=["Manual"])


class Turn(BaseModel):
    sender: str = Field(max_length=20)
    content: str = Field(max_length=4000)


class ManualMessageRequest(BaseModel):
    session_id: str = Field(max_length=64)
    customer_message: str = Field(max_length=4000)
    conversation_history: list[Turn] = Field(default_factory=list, max_length=200)


class EndSessionRequest(BaseModel):
    session_id: str = Field(max_length=64)
    final_agent_reply: str | None = Field(None, max_length=4000)


def _check_session_ownership(db: DBSession, session_id: str, current_agent: Agent):
    session = crud.get_session(db, session_id)
    if not session or session.agent_id != current_agent.id:
        raise HTTPException(status_code=404, detail="Session not found")


@router.post("/message")
def manual_message(
    payload: ManualMessageRequest,
    db: DBSession = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    agent_rate_limit_check(current_agent.id, "20/min", "coach-llm")
    _check_session_ownership(db, payload.session_id, current_agent)

    if not payload.customer_message.strip():
        raise HTTPException(status_code=400, detail="customer_message cannot be empty")

    history = [turn.model_dump() for turn in payload.conversation_history]

    if history and history[-1]["sender"] == "agent":
        crud.add_message(
            db,
            session_id=payload.session_id,
            sender="agent",
            content=history[-1]["content"],
        )

    updated_history = history + [{"sender": "customer", "content": payload.customer_message}]

    crud.add_message(
        db,
        session_id=payload.session_id,
        sender="customer",
        content=payload.customer_message,
    )

    pipeline_result = run_coaching_pipeline(db, payload.session_id, updated_history)

    return {
        "message": payload.customer_message,
        **pipeline_result,
    }


@router.post("/end-session")
def end_session(
    payload: EndSessionRequest,
    db: DBSession = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    agent_rate_limit_check(current_agent.id, "60/min", "coach-end")
    _check_session_ownership(db, payload.session_id, current_agent)

    if payload.final_agent_reply and payload.final_agent_reply.strip():
        crud.add_message(
            db,
            session_id=payload.session_id,
            sender="agent",
            content=payload.final_agent_reply.strip(),
        )
    return {"status": "ended", "session_id": payload.session_id}
