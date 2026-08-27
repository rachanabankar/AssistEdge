from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# This is the path to your SQLite database file (it'll be created automatically)
DATABASE_URL = "sqlite:///./coaching_assistant.db"

# The "engine" is what actually talks to the database file
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

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