from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from models.database import get_db
from models import crud
from models.models import Agent
from utils.auth import get_current_agent

from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _serialize(n):
    return {
        "id": n.id,
        "category": n.category,
        "title": n.title,
        "message": n.message,
        "session_id": n.session_id,
        "is_read": n.is_read,
        "created_at": n.created_at,
    }

class NotificationPreferencesUpdate(BaseModel):
    escalations: Optional[bool] = None
    sessionReport: Optional[bool] = None
    profileUpdated: Optional[bool] = None
    email: Optional[bool] = None


@router.get("/preferences")
def get_preferences(current_agent: Agent = Depends(get_current_agent)):
    return crud.get_notification_preferences(current_agent)


@router.patch("/preferences")
def update_preferences(
    payload: NotificationPreferencesUpdate,
    db: DBSession = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    updated = crud.update_notification_preferences(db, current_agent, **payload.dict())
    return crud.get_notification_preferences(updated)


# ---------- GET /notifications (recent, for the bell dropdown) ----------
@router.get("/")
def list_recent_notifications(
    limit: int = 4,
    db: DBSession = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    notifications = crud.get_notifications(db, agent_id=current_agent.id, limit=limit)
    return [_serialize(n) for n in notifications]


# ---------- GET /notifications/all ("View all notifications") ----------
@router.get("/all")
def list_all_notifications(
    db: DBSession = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    notifications = crud.get_notifications(db, agent_id=current_agent.id)
    return [_serialize(n) for n in notifications]


# ---------- GET /notifications/unread-count (for the badge) ----------
@router.get("/unread-count")
def unread_count(
    db: DBSession = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    return {"count": crud.get_unread_count(db, agent_id=current_agent.id)}


# ---------- POST /notifications/{id}/read ----------
@router.post("/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: DBSession = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    notification = crud.get_notification(db, notification_id)
    if not notification or notification.agent_id != current_agent.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    return _serialize(crud.mark_notification_read(db, notification))


# ---------- POST /notifications/mark-all-read ----------
@router.post("/mark-all-read")
def mark_all_read(
    db: DBSession = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    crud.mark_all_notifications_read(db, agent_id=current_agent.id)
    return {"status": "ok"}

