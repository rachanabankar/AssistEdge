# legacy, SQLite-only, not needed for a fresh Postgres database
"""
One-off migration: drop the dead `notify_email` column from `agents`.

SQLite (older versions) doesn't support ALTER TABLE ... DROP COLUMN, so we
rebuild the table: create agents_new with the correct schema, copy rows
over (explicitly excluding notify_email), drop the old table, rename the
new one into place.

Run this from inside backend/, with the venv active:
    python migrate_drop_notify_email.py

Make a backup first:
    copy coaching_assistant.db coaching_assistant.db.bak
"""

from models.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Sanity check: show current schema before touching anything
    result = conn.execute(text("PRAGMA table_info(agents)"))
    columns_before = [row[1] for row in result]
    print("Current agents columns:", columns_before)

    if "notify_email" not in columns_before:
        print("notify_email not present — nothing to do. Exiting.")
        raise SystemExit(0)

    try:
        # 1. Create new table with the exact target schema (matches models.py)
        conn.execute(text("""
            CREATE TABLE agents_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR NOT NULL UNIQUE,
                password_hash VARCHAR NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                avatar_url VARCHAR,
                name VARCHAR,
                email VARCHAR,
                phone VARCHAR,
                department VARCHAR,
                time_zone VARCHAR,
                language VARCHAR,
                last_active TIMESTAMP,
                notify_escalations BOOLEAN NOT NULL DEFAULT 1,
                notify_session_report BOOLEAN NOT NULL DEFAULT 1,
                notify_profile_updated BOOLEAN NOT NULL DEFAULT 1,
                notify_password_changed BOOLEAN NOT NULL DEFAULT 1
            )
        """))

        # 2. Copy rows across, explicitly listing columns (notify_email omitted)
        conn.execute(text("""
            INSERT INTO agents_new (
                id, username, password_hash, created_at, avatar_url,
                name, email, phone, department, time_zone, language, last_active,
                notify_escalations, notify_session_report,
                notify_profile_updated, notify_password_changed
            )
            SELECT
                id, username, password_hash, created_at, avatar_url,
                name, email, phone, department, time_zone, language, last_active,
                notify_escalations, notify_session_report,
                notify_profile_updated, notify_password_changed
            FROM agents
        """))

        # 3. Swap tables
        conn.execute(text("DROP TABLE agents"))
        conn.execute(text("ALTER TABLE agents_new RENAME TO agents"))

        conn.commit()
        print("Migration committed.")
    except Exception as e:
        conn.rollback()
        print(f"Migration failed, rolled back: {e}")
        raise

    # 4. Verify
    result = conn.execute(text("PRAGMA table_info(agents)"))
    columns_after = [row[1] for row in result]
    print("New agents columns:", columns_after)
    assert "notify_email" not in columns_after, "notify_email still present!"

    result = conn.execute(text("SELECT id, username, name, email FROM agents"))
    rows = result.fetchall()
    print(f"Row count after migration: {len(rows)}")
    for row in rows:
        print(row)

        