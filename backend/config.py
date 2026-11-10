import os
from dotenv import load_dotenv

# Load environment variables early
load_dotenv()

# Central configuration
# Default to production for safety, strip whitespace
APP_ENV = os.getenv("ENV", os.getenv("APP_ENV", "production")).strip()

if APP_ENV not in {"development", "production"}:
    raise RuntimeError("ENV (or APP_ENV) must be 'development' or 'production'")

CORS_ORIGINS = [
    origin.strip() for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]
if "*" in CORS_ORIGINS:
    raise RuntimeError("CORS_ORIGINS must not contain '*'.")
if not CORS_ORIGINS:
    if APP_ENV == "production":
        raise RuntimeError("CORS_ORIGINS must be non-empty when ENV=production.")
    CORS_ORIGINS = ["http://localhost:5173"]

# Rate limiting toggle - enabled by default; can be disabled in dev
RATE_LIMIT_ENABLED = APP_ENV == "production" or (
    os.getenv("RATE_LIMIT_ENABLED", "true").strip().lower() != "false"
)

