import json
import logging
import os
import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Response, Request, Path
from pydantic import BaseModel, Field
from starlette.datastructures import UploadFile as StarletteUploadFile
from sqlalchemy.orm import Session

from agents.summary_agent import generate_report
from models import crud
from models.database import get_db
from models.models import Agent
from rag.loader import load_document
from rag.splitter import chunk_documents
from rag.vectorstore import retrieve, store_chunks
from utils.auth import get_current_agent
from utils.pdf_generator import render_report_pdf

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/session", tags=["Session"])
UPLOAD_DIR = "uploaded_docs"
DOC_ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".docx"}
DOC_MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB per file
DOC_CHUNK_SIZE = 1024 * 1024  # 1 MB chunk


class SessionCreateRequest(BaseModel):
    mode: str = Field(max_length=20)
    scenario: str | None = Field(None, max_length=2000)
    product_context: str | None = Field(None, max_length=2000)
    customer_tone: str | None = Field(None, max_length=50)
    patience_level: str | None = Field(None, max_length=50)


class QueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    k: int = Field(3, ge=1, le=10)


def _safe_json_loads(data: str | None):
    if not data:
        return None
    try:
        return json.loads(data)
    except (json.JSONDecodeError, TypeError):
        return None


def _get_session_stats(messages: list):
    turn_count = len(messages)
    duration_seconds = (
        (messages[-1].timestamp - messages[0].timestamp).total_seconds()
        if turn_count >= 2
        else 0
    )
    return turn_count, duration_seconds


def _get_owned_session_or_404(db: Session, session_id: str, current_agent: Agent):
    session = crud.get_session(db, session_id)
    # 404 rather than 403 so we don't confirm existence of other agents' sessions.
    if not session or session.agent_id != current_agent.id:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


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
        "created_at": new_session.created_at,
    }


@router.get("/")
def list_sessions(
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    sessions = crud.get_all_sessions(db, agent_id=current_agent.id)
    result = []
    for s in sessions:
        messages = crud.get_messages(db, s.id)
        turn_count, duration_seconds = _get_session_stats(messages)
        result.append({
            "id": s.id,
            "mode": s.mode,
            "scenario": s.scenario,
            "product_context": s.product_context,
            "customer_tone": s.customer_tone,
            "patience_level": s.patience_level,
            "created_at": s.created_at,
            "turn_count": turn_count,
            "duration_seconds": duration_seconds,
            "status": "completed" if turn_count > 0 else "empty",
        })
    return result


@router.get("/{session_id}")
def get_session_detail(
    session_id: Annotated[str, Path(max_length=64)],
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    session = _get_owned_session_or_404(db, session_id, current_agent)
    messages = crud.get_messages(db, session_id)
    turn_count, duration_seconds = _get_session_stats(messages)

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


@router.get("/{session_id}/messages")
def get_session_messages(
    session_id: Annotated[str, Path(max_length=64)],
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    _get_owned_session_or_404(db, session_id, current_agent)

    # Replay intentionally doesn't create a Session row; log playback here for Replay Views analytics.
    crud.log_replay_view(db, agent_id=current_agent.id, session_id=session_id)

    messages = crud.get_messages(db, session_id)
    return [
        {
            "id": m.id,
            "sender": m.sender,
            "content": m.content,
            "timestamp": m.timestamp,
            "frustration_score": m.frustration_score,
            "sentiment": _safe_json_loads(m.sentiment_json),
            "escalation": _safe_json_loads(m.escalation_json),
        }
        for m in messages
    ]


@router.post("/{session_id}/upload-docs")
async def upload_docs(
    session_id: Annotated[str, Path(max_length=64)],
    request: Request,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    _get_owned_session_or_404(db, session_id, current_agent)
    # Limit multipart parsing too, before saving any file. Both legacy "file"
    # and repeated "files" fields are supported.
    async with request.form(max_files=5, max_fields=5) as form:
        files = [value for _, value in form.multi_items() if isinstance(value, StarletteUploadFile)]
        if not files or len(files) > 5:
            raise HTTPException(status_code=400, detail="Upload between 1 and 5 files.")
        extensions = [os.path.splitext(file.filename or "")[1].lower() for file in files]
        if any(ext not in DOC_ALLOWED_EXTENSIONS for ext in extensions):
            raise HTTPException(status_code=400, detail="Allowed file types: pdf, txt, md, docx.")
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        saved_paths = []
        results = []
        try:
            # Validate and save the entire batch before indexing any of it.
            for file, ext in zip(files, extensions):
                storage_name = f"{uuid.uuid4().hex}{ext}"
                save_path = os.path.join(UPLOAD_DIR, storage_name)
                with open(save_path, "xb") as destination:
                    saved_paths.append(save_path)
                    total_size = 0
                    while chunk := await file.read(DOC_CHUNK_SIZE):
                        total_size += len(chunk)
                        if total_size > DOC_MAX_SIZE_BYTES:
                            raise HTTPException(status_code=413, detail="File exceeds maximum allowed size of 5 MB.")
                        destination.write(chunk)
                results.append({"filename": storage_name})
            batches = [chunk_documents(load_document(path)) for path in saved_paths]
            for result, chunks in zip(results, batches):
                store_chunks(chunks, session_id=session_id)
                result["chunks_indexed"] = len(chunks)
        except HTTPException:
            raise
        except (ValueError, UnicodeError):
            logger.exception("Invalid uploaded document")
            raise HTTPException(status_code=400, detail="Invalid or unsupported document content.") from None
        except Exception:
            logger.exception("Document ingestion failed")
            raise HTTPException(status_code=500, detail="Document ingestion failed.") from None
        finally:
            # Only parsed text is retained in the KB; original uploads are never served.
            for path in saved_paths:
                if os.path.exists(path):
                    os.remove(path)
        if len(results) == 1:
            return {"message": "File uploaded successfully", **results[0]}
        return {"message": "Files uploaded successfully", "files": results,
                "chunks_indexed": sum(item["chunks_indexed"] for item in results)}


@router.post("/{session_id}/query")
def query_session_kb(
    session_id: Annotated[str, Path(max_length=64)],
    payload: QueryRequest,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    _get_owned_session_or_404(db, session_id, current_agent)

    try:
        results = retrieve(payload.query, session_id=session_id, k=payload.k)
    except Exception as e:
        logger.exception("Retrieval failed: %s", e)
        raise HTTPException(status_code=500, detail="Retrieval failed.")

    return {
        "query": payload.query,
        "session_id": session_id,
        "results": results,
        "count": len(results),
    }


@router.get("/{session_id}/report")
def get_session_report(
    session_id: Annotated[str, Path(max_length=64)],
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    _get_owned_session_or_404(db, session_id, current_agent)

    report = crud.get_report(db, session_id)
    if not report:
        raise HTTPException(status_code=404, detail="No report generated for this session")

    return _serialize_report(report)


@router.post("/{session_id}/report")
def create_session_report(
    session_id: Annotated[str, Path(max_length=64)],
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    _get_owned_session_or_404(db, session_id, current_agent)

    try:
        report = generate_report(db, session_id)
    except ValueError as e:
        logger.exception("Report input validation failed")
        raise HTTPException(status_code=400, detail="Report cannot be generated from this session.") from None
    except Exception as e:
        logger.exception("Report generation failed: %s", e)
        raise HTTPException(status_code=500, detail="Report generation failed.")

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


@router.get("/{session_id}/report/pdf")
def download_session_report_pdf(
    session_id: Annotated[str, Path(max_length=64)],
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
    try:
        pdf_bytes = render_report_pdf(session, report, messages)
    except Exception:
        logger.exception("PDF generation failed")
        raise HTTPException(
            status_code=500, detail="PDF generation failed"
        ) from None

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="report-{session_id}.pdf"'},
    )
