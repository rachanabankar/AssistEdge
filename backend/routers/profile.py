from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
import os, uuid
from utils.uploads import safe_ext, read_bounded, require_image
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from typing import Optional

from models.database import get_db
from models import crud
from utils.auth import get_current_agent, verify_password, hash_password, create_access_token
from ratelimit import agent_rate_limit_check

router = APIRouter(prefix="/profile", tags=["Profile"])

from paths import AVATAR_DIR
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_SIZE_BYTES = 2 * 1024 * 1024  # 2MB, matches the UI copy ("Maximum 2MB")
PROFILE_EDITABLE_FIELDS = {"name", "phone", "department", "time_zone", "language"}

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    time_zone: Optional[str] = None
    language: Optional[str] = None


def _serialize(agent):
    return {
        "id": agent.id,
        "username": agent.username,
        "has_password": agent.has_password,
        "name": agent.name,
        "email": agent.email,
        "phone": agent.phone,
        "department": agent.department,
        "time_zone": agent.time_zone,
        "language": agent.language,
        "created_at": agent.created_at,
        "last_active": agent.last_active,
        "avatar_url": agent.avatar_url,
    }


@router.get("")
def get_profile(current_agent=Depends(get_current_agent)):
    return _serialize(current_agent)


@router.patch("")
def update_profile(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_agent=Depends(get_current_agent),
):
    changes = {
        k: v
        for k, v in payload.model_dump(exclude_unset=True).items()
        if k in PROFILE_EDITABLE_FIELDS
    }
    updated = crud.update_agent_profile(db, current_agent, **changes)

    if updated.notify_profile_updated:
        crud.create_notification(
            db,
            agent_id=current_agent.id,
            category="profile",
            title="Profile Updated",
            message="Your profile has been updated successfully.",
        )

    return _serialize(updated)


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_agent=Depends(get_current_agent),
):
    ext = safe_ext(file.filename, ALLOWED_EXTENSIONS)
    contents = await read_bounded(file, MAX_SIZE_BYTES)
    require_image(ext, contents)

    filename = f"{current_agent.id}_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(AVATAR_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    avatar_url = f"/static/avatars/{filename}"
    updated = crud.update_agent_avatar(db, current_agent, avatar_url)
    return _serialize(updated)


class ChangePasswordRequest(BaseModel):
    current_password: Optional[str] = None
    new_password: str

    @field_validator("current_password")
    @classmethod
    def validate_current_password(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes")
        return v

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes")
        return v


@router.patch("/password")
def change_password(
    payload: ChangePasswordRequest,
    agent=Depends(get_current_agent),
    db: Session = Depends(get_db),
):
    agent_rate_limit_check(agent.id, "5/min", "change-password")
    if agent.has_password:
        if payload.current_password is None:
            raise HTTPException(status_code=422, detail="Current password is required")
        if not verify_password(payload.current_password, agent.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        if payload.new_password == payload.current_password:
            raise HTTPException(status_code=400, detail="New password must be different from the current password")
    new_hash = hash_password(payload.new_password)
    crud.change_password_and_revoke(db, agent, new_hash)

    if agent.notify_password_changed:
        crud.create_notification(
            db,
            agent_id=agent.id,
            category="profile",
            title="Password Changed",
            message="Your password has been changed successfully.",
        )

    token = create_access_token(agent_id=agent.id, username=agent.username, token_version=agent.token_version)
    return {"detail": "Password updated successfully", "access_token": token, "token_type": "bearer"}
