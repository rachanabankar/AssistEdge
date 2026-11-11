from pathlib import Path
from tempfile import gettempdir

from dotenv import load_dotenv
from pydantic import AliasChoices, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent / ".env"

# Preserve environment loading for callers that still read os.environ directly.
load_dotenv(_ENV_FILE)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILE, extra="ignore",
        hide_input_in_errors=True, case_sensitive=True,
    )

    APP_ENV: str = Field(default="production", validation_alias=AliasChoices("ENV", "APP_ENV"))
    DATABASE_URL: str = "sqlite:///./assistedge.db"
    SECRET_KEY: str = Field(validation_alias=AliasChoices("JWT_SECRET", "SECRET_KEY"))
    GROQ_API_KEY: str = Field(default="", validate_default=True)
    GROQ_MODELS: str | None = None
    GROQ_MODEL_SENTIMENT: str | None = None
    GROQ_MODEL_COACHING: str | None = None
    GROQ_MODEL_ESCALATION: str | None = None
    GROQ_MODEL_SUMMARY: str | None = None
    GROQ_MODEL_SIMULATOR: str | None = None
    GROQ_TIMEOUT_SECONDS: float = 20
    JWT_EXPIRE_MINUTES: int = 60
    GOOGLE_CLIENT_ID: str | None = None
    CORS_ORIGINS: str = ""
    FRONTEND_BASE_URL: str = "http://localhost:5173"
    UPLOAD_DIR: str = "static"
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    VECTOR_STORE: str = "chroma"
    EMBEDDING_PROVIDER: str = "local"
    FASTEMBED_CACHE_PATH: str = str(Path(gettempdir()) / "fastembed_cache")
    HF_API_TOKEN: str | None = None
    RATE_LIMIT_ENABLED: str = "true"

    @field_validator("VECTOR_STORE")
    @classmethod
    def validate_vector_store(cls, value: str) -> str:
        if value not in {"chroma", "pgvector"}:
            raise ValueError("VECTOR_STORE must be 'chroma' or 'pgvector'.")
        return value

    @field_validator("GROQ_API_KEY")
    @classmethod
    def validate_groq_api_key(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("GROQ_API_KEY is required and must not be empty. Set it in backend/.env or the environment.")
        return value

    @model_validator(mode="after")
    def validate_production_database(self) -> "Settings":
        database_url = self.DATABASE_URL.strip()
        if self.VECTOR_STORE == "pgvector" and not database_url.lower().startswith(
            ("postgres://", "postgresql://", "postgresql+")
        ):
            raise ValueError("VECTOR_STORE=pgvector requires a PostgreSQL DATABASE_URL.")
        if self.APP_ENV == "production" and (
            not database_url or database_url.lower().startswith("sqlite")
        ):
            raise ValueError(
                "DATABASE_URL must be non-empty and must not use SQLite "
                "when APP_ENV=production."
            )
        return self

    @field_validator("APP_ENV")
    @classmethod
    def validate_app_env(cls, value: str) -> str:
        value = value.strip()
        if value not in {"development", "production"}:
            raise ValueError("ENV (or APP_ENV) must be 'development' or 'production'")
        return value

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        value = value.strip()
        placeholders = {
            "your-secret-key", "default", "changeme", "secret", "secretkey",
            "replace-me", "your_jwt_signing_secret_here",
        }
        if (
            len(value) < 32
            or len(set(value)) < 8
            or value.lower() in placeholders
            or any(marker in value.lower() for marker in ("example", "dummy"))
        ):
            raise ValueError(
                "SECRET_KEY must contain at least 32 characters and 8 distinct "
                "characters, and must not be blank or a placeholder."
            )
        return value

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def cors_origins(self) -> list[str]:
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        if "*" in origins:
            raise RuntimeError("CORS_ORIGINS must not contain '*'.")
        if not origins:
            if self.APP_ENV == "production":
                raise RuntimeError("CORS_ORIGINS must be non-empty when ENV=production.")
            return ["http://localhost:5173"]
        return origins


settings = Settings()
APP_ENV = settings.APP_ENV
DATABASE_URL = settings.DATABASE_URL
SECRET_KEY = settings.SECRET_KEY
JWT_EXPIRE_MINUTES = settings.JWT_EXPIRE_MINUTES
GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID
CORS_ORIGINS = settings.cors_origins
FRONTEND_BASE_URL = settings.FRONTEND_BASE_URL
UPLOAD_DIR = settings.UPLOAD_DIR
CHROMA_PERSIST_DIR = settings.CHROMA_PERSIST_DIR
VECTOR_STORE = settings.VECTOR_STORE
EMBEDDING_PROVIDER = settings.EMBEDDING_PROVIDER
FASTEMBED_CACHE_PATH = settings.FASTEMBED_CACHE_PATH
HF_API_TOKEN = settings.HF_API_TOKEN
RATE_LIMIT_ENABLED = APP_ENV == "production" or (
    settings.RATE_LIMIT_ENABLED.strip().lower() != "false"
)
