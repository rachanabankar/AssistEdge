from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from config import settings

DATABASE_URL = settings.DATABASE_URL

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql://" + DATABASE_URL[len("postgres://"):]

# The "engine" is what actually talks to the database file
_engine_options = (
    {"connect_args": {"check_same_thread": False}}
    if DATABASE_URL.startswith("sqlite")
    else {"pool_pre_ping": True}
)
engine = create_engine(DATABASE_URL, **_engine_options)

# SessionLocal is a factory that creates new database sessions (connections)
# whenever your API needs to read/write data
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the parent class all your models (tables) will inherit from
Base = declarative_base()


def init_database():
    """Register all models and create missing tables without altering existing ones."""
    from models import models  # noqa: F401 - registers every model with Base

    Base.metadata.create_all(bind=engine)
    from rag.vectorstore import init_vectorstore

    init_vectorstore()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
