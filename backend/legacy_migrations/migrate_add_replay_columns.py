# legacy, SQLite-only, not needed for a fresh Postgres database
import sqlite3
DB_PATH = "coaching_assistant.db"
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
for column, statement in [
    ("customer_tone", "ALTER TABLE sessions ADD COLUMN customer_tone TEXT"),
    ("patience_level", "ALTER TABLE sessions ADD COLUMN patience_level TEXT"),
]:
    try:
        cur.execute(statement)
        print(f"Added column: {column}")
    except sqlite3.OperationalError as e:
        print(f"Skipped {column}: {e}")
conn.commit()
conn.close()