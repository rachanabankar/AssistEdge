import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from utils.email import send_password_reset_email

from models.database import get_db
from models import crud
from utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    generate_reset_token,
)

router = APIRouter(prefix="/auth", tags=["Auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")
RESET_TOKEN_EXPIRE_MINUTES = 30


# ---------- Request body schemas ----------
class SignupRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class GoogleLoginRequest(BaseModel):
    id_token: str  # the credential JWT returned by Google Identity Services on the frontend


class ForgotPasswordRequest(BaseModel):
    identifier: str  # username OR email — whichever the agent has on file


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ---------- POST /auth/signup ----------
@router.post("/signup")
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = crud.get_agent_by_username(db, payload.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    password_hash = hash_password(payload.password)
    new_agent = crud.create_agent(db, username=payload.username, password_hash=password_hash)

    token = create_access_token(agent_id=new_agent.id, username=new_agent.username)
    return {
        "access_token": token,
        "token_type": "bearer",
        "agent": {"id": new_agent.id, "username": new_agent.username},
    }


# ---------- POST /auth/login ----------
@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    agent = crud.get_agent_by_username(db, payload.username)
    if not agent or not verify_password(payload.password, agent.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(agent_id=agent.id, username=agent.username)
    return {
        "access_token": token,
        "token_type": "bearer",
        "agent": {"id": agent.id, "username": agent.username},
    }


# ---------- POST /auth/google ----------
@router.post("/google")
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
        raise HTTPException(status_code=401, detail="Invalid Google token")

    google_id = idinfo["sub"]
    email = idinfo.get("email")
    name = idinfo.get("name")

    # 1. Already linked to this Google account -> just log them in.
    agent = crud.get_agent_by_google_id(db, google_id)

    # 2. Not linked yet, but an existing account shares this email -> link it.
    if not agent and email:
        agent = crud.get_agent_by_email(db, email)
        if agent:
            agent = crud.link_google_account(db, agent, google_id)

    # 3. Brand new agent -> create one. password_hash is required by the
    #    schema, so we set it to a random, unusable value the agent will
    #    never see or need (they always sign in via Google).
    if not agent:
        username = email or f"google_{google_id}"
        if crud.get_agent_by_username(db, username):
            username = f"{username}_{secrets.token_hex(3)}"

        random_password_hash = hash_password(secrets.token_urlsafe(32))
        agent = crud.create_agent(db, username=username, password_hash=random_password_hash)
        agent = crud.link_google_account(db, agent, google_id)
        if email:
            agent = crud.update_agent_profile(db, agent, email=email, name=name)

    token = create_access_token(agent_id=agent.id, username=agent.username)
    return {
        "access_token": token,
        "token_type": "bearer",
        "agent": {"id": agent.id, "username": agent.username},
    }


# ---------- POST /auth/forgot-password ----------
@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    agent = crud.get_agent_by_username(db, payload.identifier) or crud.get_agent_by_email(
        db, payload.identifier
    )

    generic_response = {
        "message": "If an account with that username or email exists, a reset link has been sent."
    }

    if not agent:
        # Don't reveal whether the account exists.
        return generic_response

    if not agent.email:
        # Account exists but has no email on file (e.g. old username-only
        # account that never linked an email). Nothing to send to — keep the
        # response generic so this isn't distinguishable from "no account".
        return generic_response

    token = generate_reset_token()
    expiry = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    crud.set_reset_token(db, agent, token, expiry)

    reset_link = f"{FRONTEND_BASE_URL}/reset-password?token={token}"

    email_sent = send_password_reset_email(agent.email, reset_link)

    if not email_sent:
        # Fallback for local dev when RESEND_API_KEY isn't configured, or if
        # the send call fails for some other reason — keep the flow testable
        # without blocking on email infra. Remove this block once email
        # sending is confirmed reliable in your deployed environment.
        print(f"\n[PASSWORD RESET] {agent.username} -> {reset_link}\n")
        generic_response["dev_reset_link"] = reset_link

    return generic_response

# ---------- POST /auth/reset-password ----------
@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    agent = crud.get_agent_by_reset_token(db, payload.token)
    if not agent or not agent.reset_token_expiry:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    expiry = agent.reset_token_expiry
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    if expiry < datetime.now(timezone.utc):
        crud.clear_reset_token(db, agent)
        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")

    new_hash = hash_password(payload.new_password)
    crud.change_agent_password(db, agent, new_hash)
    crud.clear_reset_token(db, agent)

    return {"message": "Password reset successful. Please log in with your new password."}