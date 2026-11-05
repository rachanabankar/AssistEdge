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

SECRET_KEY = os.getenv("SECRET_KEY")

# Validate the JWT secret at import time so the app refuses to start with an
# insecure configuration. Any caller that imports this module (including main.py)
# will get a RuntimeError before the ASGI server accepts any requests.
_PLACEHOLDER_KEYS = {"your-secret-key", "default", "changeme", "secret", "secretkey"}
if not SECRET_KEY or len(SECRET_KEY) < 32 or SECRET_KEY.lower() in _PLACEHOLDER_KEYS:
    raise RuntimeError(
        "SECRET_KEY is missing, too short (< 32 chars), or uses a placeholder value. "
        "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

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

def create_access_token(agent_id: int, username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(agent_id),
        "username": username,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Raises jwt.PyJWTError (expired, invalid signature, malformed, etc.) on failure."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


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
        agent_id = payload.get("sub")
        if agent_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    agent = crud.get_agent_by_id(db, int(agent_id))
    if agent is None:
        raise credentials_exception

    return agent
