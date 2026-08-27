from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
import json

from models.database import get_db
from models import crud
from models.models import Agent
from utils.auth import get_current_agent
from rag.loader import load_document
from rag.splitter import chunk_documents
from rag.vectorstore import store_chunks, retrieve
from agents.summary_agent import generate_report
from utils.pdf_generator import render_report_pdf

router = APIRouter(prefix="/session", tags=["Session"])


# ---------- Request body schemas ----------
class SessionCreateRequest(BaseModel):
    mode: str
    scenario: str | None = None
    product_context: str | None = None
    customer_tone: str | None = None
    patience_level: str | None = None


class QueryRequest(BaseModel):
    query: str
    k: int = 3


# ---------- Ownership helper ----------
def _get_owned_session_or_404(db: Session, session_id: str, current_agent: Agent):
    session = crud.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.agent_id != current_agent.id:
        # 404 rather than 403 so we don't confirm to other agents that a given
        # session_id exists at all.
        raise HTTPException(status_code=404, detail="Session not found")
    return session


# ---------- POST /session ----------
@router.post("/")
def create_session(
    payload: SessionCreateRequest,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    new_session = crud.create_session(
        db,
        mode=payload.mode,
        agent_id=current_agent.id,
        scenario=payload.scenario,
        product_context=payload.product_context,
        customer_tone=payload.customer_tone,
        patience_level=payload.patience_level,
    )
    return {
        "id": new_session.id,
        "mode": new_session.mode,
        "scenario": new_session.scenario,
        "product_context": new_session.product_context,
        "customer_tone": new_session.customer_tone,
        "patience_level": new_session.patience_level,
        "created_at": new_session.created_at
    }


# ---------- GET /session/ (list agent's own sessions) ----------
@router.get("/")
def list_sessions(
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    sessions = crud.get_all_sessions(db, agent_id=current_agent.id)
    result = []
    for s in sessions:
        messages = crud.get_messages(db, s.id)
        turn_count = len(messages)
        if turn_count >= 2:
            duration_seconds = (messages[-1].timestamp - messages[0].timestamp).total_seconds()
        else:
            duration_seconds = 0
        result.append({
            "id": s.id,
            "mode": s.mode,
            "scenario": s.scenario,
            "customer_tone": s.customer_tone,
            "patience_level": s.patience_level,
            "created_at": s.created_at,
            "turn_count": turn_count,
            "duration_seconds": duration_seconds,
            "status": "completed" if turn_count > 0 else "empty"
        })
    return result


# ---------- GET /session/{id} (single session detail) ----------
@router.get("/{session_id}")
def get_session_detail(
    session_id: str,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    session = _get_owned_session_or_404(db, session_id, current_agent)

    messages = crud.get_messages(db, session_id)
    turn_count = len(messages)
    if turn_count >= 2:
        duration_seconds = (messages[-1].timestamp - messages[0].timestamp).total_seconds()
    else:
        duration_seconds = 0

    return {
        "id": session.id,
        "mode": session.mode,
        "scenario": session.scenario,
        "product_context": session.product_context,
        "customer_tone": session.customer_tone,
        "patience_level": session.patience_level,
        "created_at": session.created_at,
        "turn_count": turn_count,
        "duration_seconds": duration_seconds,
        "status": "completed" if turn_count > 0 else "empty",
    }


# ---------- GET /session/{id}/messages (replay mode) ----------
@router.get("/{session_id}/messages")
def get_session_messages(
    session_id: str,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    _get_owned_session_or_404(db, session_id, current_agent)

    # NEW: this is the endpoint Replay mode calls to pull an old transcript
    # for passive playback. Replay intentionally doesn't create a Session
    # row (see the ReplayView model comment in models.py — starting a
    # replay isn't a new coaching session, there's no new interaction to
    # track), so this is where we log that a replay happened, for the
    # "Replay Views" analytics stat.
    # ASSUMPTION: this endpoint is used exclusively by Replay mode's UI. If
    # any other page (e.g. a "view transcript" link from Reports) also
    # calls GET /session/{id}/messages, this will overcount replay views —
    # flag that if it's the case and I'll move the log call to a dedicated
    # endpoint instead.
    crud.log_replay_view(db, agent_id=current_agent.id, session_id=session_id)

    messages = crud.get_messages(db, session_id)
    result = []
    for m in messages:
        sentiment = None
        escalation = None
        if m.sentiment_json:
            try:
                sentiment = json.loads(m.sentiment_json)
            except (json.JSONDecodeError, TypeError):
                sentiment = None
        if m.escalation_json:
            try:
                escalation = json.loads(m.escalation_json)
            except (json.JSONDecodeError, TypeError):
                escalation = None

        result.append({
            "id": m.id,
            "sender": m.sender,
            "content": m.content,
            "timestamp": m.timestamp,
            "frustration_score": m.frustration_score,
            "sentiment": sentiment,
            "escalation": escalation,
        })
    return result


# ---------- POST /session/{id}/upload-docs ----------
UPLOAD_DIR = "uploaded_docs"

@router.post("/{session_id}/upload-docs")
def upload_docs(
    session_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    _get_owned_session_or_404(db, session_id, current_agent)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    save_path = os.path.join(UPLOAD_DIR, f"{session_id}_{file.filename}")

    with open(save_path, "wb") as f:
        f.write(file.file.read())

    docs = load_document(save_path)
    chunks = chunk_documents(docs)
    store_chunks(chunks, session_id=session_id)

    return {
        "message": "File uploaded successfully",
        "filename": file.filename,
        "saved_to": save_path,
        "chunks_indexed": len(chunks)
    }


# ---------- POST /session/{id}/query ----------
@router.post("/{session_id}/query")
def query_session_kb(
    session_id: str,
    payload: QueryRequest,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    _get_owned_session_or_404(db, session_id, current_agent)

    try:
        results = retrieve(payload.query, session_id=session_id, k=payload.k)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {str(e)}")

    return {
        "query": payload.query,
        "session_id": session_id,
        "results": results,
        "count": len(results)
    }


# ---------- Report endpoints ----------

def _serialize_report(report):
    return {
        "id": report.id,
        "session_id": report.session_id,
        "summary": report.summary,
        "resolution_score": report.resolution_score,
        "sentiment_journey": json.loads(report.sentiment_journey) if report.sentiment_journey else [],
        "coaching_tips": json.loads(report.coaching_tips) if report.coaching_tips else [],
        "created_at": report.created_at,
        "updated_at": report.updated_at,
    }


# ---------- GET /session/{id}/report ----------
@router.get("/{session_id}/report")
def get_session_report(
    session_id: str,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    _get_owned_session_or_404(db, session_id, current_agent)

    report = crud.get_report(db, session_id)
    if not report:
        raise HTTPException(status_code=404, detail="No report generated for this session")

    return _serialize_report(report)


# ---------- POST /session/{id}/report ----------
@router.post("/{session_id}/report")
def create_session_report(
    session_id: str,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    _get_owned_session_or_404(db, session_id, current_agent)

    try:
        report = generate_report(db, session_id)
    except ValueError as e:
        # e.g. no messages in the session yet
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

    if current_agent.notify_session_report:
        crud.create_notification(
            db,
            agent_id=current_agent.id,
            category="report",
            title="Session Report Ready",
            message="Your coaching session report has been generated and is ready to view.",
            session_id=session_id,
        )

    return _serialize_report(report)


# ---------- GET /session/{id}/report/pdf ----------
@router.get("/{session_id}/report/pdf")
def download_session_report_pdf(
    session_id: str,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    session = _get_owned_session_or_404(db, session_id, current_agent)

    report = crud.get_report(db, session_id)
    if not report:
        raise HTTPException(
            status_code=404,
            detail="No report generated yet — call POST /session/{id}/report first",
        )

    messages = crud.get_messages(db, session_id)
    pdf_bytes = render_report_pdf(session, report, messages)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="report-{session_id}.pdf"'},
    )