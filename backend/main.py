import logging
import os

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

# config must be imported before anything that reads env vars at import time
# (utils/auth.py reads SECRET_KEY). It also loads .env via load_dotenv().
from config import APP_ENV

from models.database import Base, engine
from models import models  # noqa: F401 - registers ORM models with Base
from routers import analytics, auth, manual, notifications, profile, session, simulate, support

logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

os.makedirs("static/avatars", exist_ok=True)
os.makedirs("static/support_screenshots", exist_ok=True)

# --- CORS -------------------------------------------------------------------
# CORS_ORIGINS must be set in production. In development the env var may be
# omitted and the default localhost list is used.  Entries are trimmed and
# empty strings are dropped.
_raw_origins = os.getenv("CORS_ORIGINS", "")
_cors_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
if "*" in _cors_origins:
    raise RuntimeError("CORS_ORIGINS must not contain '*'.")

if not _cors_origins:
    if APP_ENV != "development":
        raise RuntimeError(
            "CORS_ORIGINS must be set to a comma-separated list of allowed origins "
            "when APP_ENV is not 'development'."
        )
    # Safe local-dev defaults
    _cors_origins = [
        "http://localhost:5173",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ]

# --- FastAPI app ------------------------------------------------------------
# Disable interactive docs in production - they expose the full API surface.
if APP_ENV != "development":
    app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
else:
    app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

# Auth uses a Bearer header, not cookies, so credentials are not needed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# --- Security headers -------------------------------------------------------
# Registered AFTER CORS so it is the outermost middleware and also covers
# CORS preflight responses.
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


app.include_router(session.router)
app.include_router(simulate.router)
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(support.router)
app.include_router(notifications.router)
app.include_router(analytics.router)
app.include_router(manual.router)


# --- Validation errors ------------------------------------------------------
# FastAPI's default 422 echoes the whole request body in "input" (including
# passwords). Return only the location and message.
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": [{"loc": e["loc"], "msg": e["msg"]} for e in exc.errors()]},
    )


# --- Global 500 handler -----------------------------------------------------
# Returns a generic message to clients; full traceback goes to server logs only.
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )


@app.get("/")
def root():
    return {"message": "Backend is running"}