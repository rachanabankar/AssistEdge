import os

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker, declarative_base

# This is the path to your SQLite database file (it'll be created automatically)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./assistedge.db")

# The "engine" is what actually talks to the database file
_engine_options = (
    {"connect_args": {"check_same_thread": False}}
    if make_url(DATABASE_URL).get_backend_name() == "sqlite" else {}
)
engine = create_engine(DATABASE_URL, **_engine_options)

# SessionLocal is a factory that creates new database sessions (connections)
# whenever your API needs to read/write data
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the parent class all your models (tables) will inherit from
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
