import os
import jwt
import bcrypt
import secrets
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from models.database import get_db
from models import crud

load_dotenv()

from config import SECRET_KEY

# Validate the JWT secret at import time so the app refuses to start with an
# insecure configuration. Any caller that imports this module (including main.py)
# will get a RuntimeError before the ASGI server accepts any requests.
_PLACEHOLDER_KEYS = {
    "your-secret-key", "default", "changeme", "secret", "secretkey",
    "replace-me", "your_jwt_signing_secret_here",
}
if (
    len(SECRET_KEY) < 32
    or len(set(SECRET_KEY)) < 8
    or SECRET_KEY.lower() in _PLACEHOLDER_KEYS
    or any(marker in SECRET_KEY.lower() for marker in ("example", "dummy"))
):
    raise RuntimeError(
        "SECRET_KEY must contain at least 32 characters and 8 distinct characters, "
        "and must not be blank or a placeholder. "
        "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 60 minutes (1 hour)

# Points at the login endpoint so FastAPI's auto-docs know how to get a token.
# tokenUrl is relative to the app root, matching how routers.auth will be registered.
bearer_scheme = HTTPBearer()

# ---------- Password hashing ----------

def hash_password(plain_password: str) -> str:
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))


# ---------- JWT ----------

def create_access_token(agent_id: int, username: str, token_version: int = 0) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(agent_id),
        "username": username,
        "tv": int(token_version or 0),
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Raises jwt.PyJWTError (expired, invalid signature, malformed, etc.) on failure."""
    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
        options={"require": ["exp", "sub"]},
    )


# ---------- Password reset tokens ----------
# Separate from the JWT access token on purpose: this token is single-use,
# stored on the Agent row, and can be invalidated (see crud.clear_reset_token)
# the moment it's used or a newer "forgot password" request supersedes it.
# A stateless JWT can't be revoked early, which matters for a security-sensitive
# flow like password reset.

def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)


# ---------- FastAPI dependency ----------

def get_current_agent(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        agent_id_raw = payload.get("sub")
        if agent_id_raw is None:
            raise credentials_exception
        try:
            agent_id = int(agent_id_raw)
        except (ValueError, TypeError):
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    agent = crud.get_agent_by_id(db, agent_id)
    if agent is None:
        raise credentials_exception

    # Tokens issued before a password reset carry an older version and are rejected.
    # Tokens issued before this feature existed have no "tv" claim and count as 0.
    if payload.get("tv", 0) != (agent.token_version or 0):
        raise credentials_exception

    return agent
