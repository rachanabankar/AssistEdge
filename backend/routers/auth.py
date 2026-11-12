import hashlib
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, field_validator
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from utils.email import send_password_reset_email

from models.database import get_db
from models import crud


from ratelimit import rate_limit

from utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    generate_reset_token,
)

# Dummy hash for timing-attack mitigation; computed once at import time,
# with the same hashing function as real passwords so the cost matches.
DUMMY_HASH = hash_password(secrets.token_urlsafe(16))

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

from config import APP_ENV
_raw_frontend_url = os.getenv("FRONTEND_BASE_URL")
if _raw_frontend_url is not None:
    _raw_frontend_url = _raw_frontend_url.strip().rstrip("/")

if not _raw_frontend_url:
    if APP_ENV != "development":
        raise RuntimeError(
            "FRONTEND_BASE_URL must be set when APP_ENV is not 'development'."
        )
    FRONTEND_BASE_URL = "http://localhost:5173"
else:
    FRONTEND_BASE_URL = _raw_frontend_url

RESET_TOKEN_EXPIRE_MINUTES = 30


# ---------- Request body schemas ----------
class SignupRequest(BaseModel):
    username: str
    password: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        # Ensure password is at least 8 characters
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        # Ensure password is no more than 72 UTF-8 bytes
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password must be at most 72 UTF-8 bytes')
        return v

class LoginRequest(BaseModel):
    username: str
    password: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        # Ensure password is no more than 72 UTF-8 bytes
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password must be at most 72 UTF-8 bytes')
        return v

class GoogleLoginRequest(BaseModel):
    id_token: str  # the credential JWT returned by Google Identity Services on the frontend


class ForgotPasswordRequest(BaseModel):
    identifier: str  # username OR email — whichever the agent has on file


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        # Ensure password is at least 8 characters
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        # Ensure password is no more than 72 UTF-8 bytes
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password must be at most 72 UTF-8 bytes')
        return v

# ---------- POST /auth/signup ----------
@router.post("/signup", dependencies=[Depends(rate_limit("5/min", "signup"))])
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = crud.get_agent_by_username(db, payload.username) or crud.get_agent_by_email(db, payload.username)
    if existing:
        raise HTTPException(status_code=400, detail="Unable to create account with these details")

    password_hash = hash_password(payload.password)
    try:
        new_agent = crud.create_agent(db, username=payload.username, password_hash=password_hash)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Unable to create account with these details") from None

    token = create_access_token(agent_id=new_agent.id, username=new_agent.username, token_version=new_agent.token_version)
    return {
        "access_token": token,
        "token_type": "bearer",
        "agent": {"id": new_agent.id, "username": new_agent.username, "has_password": new_agent.has_password},
    }


# ---------- POST /auth/login ----------
@router.post("/login", dependencies=[Depends(rate_limit("10/min", "login"))])
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    agent = crud.get_agent_by_username(db, payload.username)
    if not agent:
        # Timing attack mitigation: run password verification against a dummy hash
        verify_password(payload.password, DUMMY_HASH)
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not verify_password(payload.password, agent.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(agent_id=agent.id, username=agent.username, token_version=agent.token_version)
    return {
        "access_token": token,
        "token_type": "bearer",
        "agent": {"id": agent.id, "username": agent.username, "has_password": agent.has_password},
    }


# ---------- POST /auth/google ----------
@router.post("/google", dependencies=[Depends(rate_limit("10/min", "google"))])
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="Google login isn't configured on the server (missing GOOGLE_CLIENT_ID).",
        )

    try:
        idinfo = google_id_token.verify_oauth2_token(
            payload.id_token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except ValueError:
        # Fixed message on purpose: never return exception text to the client.
        raise HTTPException(status_code=401, detail="Invalid Google token")

    # Reject unless the claim is the boolean True (a string "true" or a
    # missing claim is rejected).
    if idinfo.get("email_verified") is not True:
        raise HTTPException(status_code=401, detail="Google email not verified")

    google_id = idinfo["sub"]
    email = idinfo.get("email")
    name = idinfo.get("name")

    # 1. Already linked to this Google account -> just log them in.
    agent = crud.get_agent_by_google_id(db, google_id)

    # The Google verifier and email_verified guard above authenticate the email.
    # Existing and new accounts receive the same successful login response.
    if not agent and email:
        existing = crud.get_agent_by_email(db, email)
        if existing:
            agent = crud.link_google_account(db, existing, google_id)

    # 3. Brand new agent -> create one. password_hash is required by the
    #    schema, so we set it to a random, unusable value the agent will
    #    never see or need (they always sign in via Google).
    if not agent:
        username = email or f"google_{google_id}"
        if crud.get_agent_by_username(db, username):
            username = f"{username}_{secrets.token_hex(3)}"

        random_password_hash = hash_password(secrets.token_urlsafe(32))
        agent = crud.create_agent(db, username=username, password_hash=random_password_hash, has_password=False)
        agent = crud.link_google_account(db, agent, google_id)
        if email:
            agent = crud.update_agent_profile(db, agent, email=email, name=name)

    token = create_access_token(agent_id=agent.id, username=agent.username, token_version=agent.token_version)
    return {
        "access_token": token,
        "token_type": "bearer",
        "agent": {"id": agent.id, "username": agent.username, "has_password": agent.has_password},
    }


# ---------- POST /auth/forgot-password ----------
@router.post("/forgot-password", dependencies=[Depends(rate_limit("5/min", "forgot-password"))])
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    agent = crud.get_agent_by_username(db, payload.identifier) or crud.get_agent_by_email(
        db, payload.identifier
    )

    generic_response = {
        "message": "If an account with that username or email exists, a reset link has been sent."
    }

    # Don't reveal whether the account exists or whether it has an email on file.
    if not agent or not agent.email:
        return generic_response

    token = generate_reset_token()
    expiry = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    crud.set_reset_token(db, agent, token, expiry)

    reset_link = f"{FRONTEND_BASE_URL}/reset-password?token={token}"

    email_sent = send_password_reset_email(agent.email, reset_link)

    if not email_sent:
        if APP_ENV == "development":
            print(f"\n[PASSWORD RESET] {agent.username} -> {reset_link}\n")
            return {
                "message": "If an account with that username or email exists, a reset link has been sent.",
                "dev_reset_link": reset_link,
            }
        logger.error("Failed to send password reset email for agent_id=%s", agent.id)

    return generic_response

# ---------- POST /auth/reset-password ----------
@router.post("/reset-password", dependencies=[Depends(rate_limit("5/min", "reset-password"))])
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    new_hash = hash_password(payload.new_password)
    if not crud.reset_password_and_revoke(db, token_hash, new_hash):
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    return {"message": "Password reset successful. Please log in with your new password."}
