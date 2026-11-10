from models.database import engine
from sqlalchemy import text

statements = [
    "ALTER TABLE agents ADD COLUMN notify_password_changed BOOLEAN NOT NULL DEFAULT 1",
]

with engine.connect() as conn:
    for stmt in statements:
        try:
            conn.execute(text(stmt))
            conn.commit()
            print(f"OK: {stmt}")
        except Exception as e:
            print(f"SKIP (likely already exists): {stmt} -> {e}")