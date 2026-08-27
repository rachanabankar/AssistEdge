from models.database import engine
from sqlalchemy import text

statements = [
    "ALTER TABLE agents ADD COLUMN notify_escalations BOOLEAN NOT NULL DEFAULT 1",
    "ALTER TABLE agents ADD COLUMN notify_session_report BOOLEAN NOT NULL DEFAULT 1",
    "ALTER TABLE agents ADD COLUMN notify_profile_updated BOOLEAN NOT NULL DEFAULT 1",
    "ALTER TABLE agents ADD COLUMN notify_email BOOLEAN NOT NULL DEFAULT 0",
]

with engine.connect() as conn:
    for stmt in statements:
        try:
            conn.execute(text(stmt))
            conn.commit()
            print(f"OK: {stmt}")
        except Exception as e:
            print(f"SKIP (likely already exists): {stmt} -> {e}")