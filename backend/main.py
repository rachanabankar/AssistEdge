import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from models.database import Base, engine
from models import models  # noqa: F401 — registers ORM models with Base
from routers import analytics, auth, manual, notifications, profile, session, simulate, support

logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

os.makedirs("static/avatars", exist_ok=True)
os.makedirs("static/support_screenshots", exist_ok=True)

# --- CORS -------------------------------------------------------------------
# CORS_ORIGINS must be set in production. In development the env var may be
# omitted and the default localhost list is used.  Entries are trimmed and
# empty strings are dropped.
_APP_ENV = os.getenv("APP_ENV", "development")
_raw_origins = os.getenv("CORS_ORIGINS", "")
_cors_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

if not _cors_origins:
    if _APP_ENV != "development":
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
# Disable interactive docs in production — they expose the full API surface.
if _APP_ENV == "production":
    app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
else:
    app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router)
app.include_router(simulate.router)
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(support.router)
app.include_router(notifications.router)
app.include_router(analytics.router)
app.include_router(manual.router)


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
