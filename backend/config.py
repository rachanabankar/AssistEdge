import os
from dotenv import load_dotenv

# Load environment variables early
load_dotenv()

# Central configuration
# Default to production for safety, strip whitespace
APP_ENV = os.getenv("APP_ENV", "production").strip()

if APP_ENV not in {"development", "production"}:
    raise RuntimeError("APP_ENV must be 'development' or 'production'")

# Rate limiting toggle - enabled by default; can be disabled in dev
RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() != "false"

