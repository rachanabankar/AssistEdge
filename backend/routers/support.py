from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
import os, uuid
from sqlalchemy.orm import Session
from typing import Optional

from models.database import get_db
from models import crud
from utils.auth import get_current_agent

router = APIRouter(prefix="/support", tags=["Support"])

SCREENSHOT_DIR = "static/support_screenshots"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_SIZE_BYTES = 2 * 1024 * 1024  # 2MB, same limit as avatar uploads


def _serialize(ticket):
    return {
        "id": ticket.id,
        "agent_id": ticket.agent_id,
        "issue_type": ticket.issue_type,
        "subject": ticket.subject,
        "priority": ticket.priority,
        "screenshot_url": ticket.screenshot_url,
        "status": ticket.status,
        "created_at": ticket.created_at,
    }


@router.post("/tickets")
async def create_ticket(
    issue_type: str = Form(...),
    subject: str = Form(...),
    priority: str = Form(...),
    screenshot: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_agent=Depends(get_current_agent),
):
    screenshot_url = None

    if screenshot is not None:
        ext = os.path.splitext(screenshot.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        contents = await screenshot.read()
        if len(contents) > MAX_SIZE_BYTES:
            raise HTTPException(status_code=400, detail="File too large (max 2MB)")

        filename = f"{current_agent.id}_{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(SCREENSHOT_DIR, filename)

        with open(filepath, "wb") as f:
            f.write(contents)

        screenshot_url = f"/static/support_screenshots/{filename}"

    ticket = crud.create_support_ticket(
        db,
        agent_id=current_agent.id,
        issue_type=issue_type,
        subject=subject,
        priority=priority,
        screenshot_url=screenshot_url,
    )
    return _serialize(ticket)