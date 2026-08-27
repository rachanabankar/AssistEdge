"""
models/migrate_add_report_constraints.py

Adds a UNIQUE constraint on reports.session_id and an updated_at column.

Unlike migrate_add_replay_columns.py, this can't be a plain ALTER TABLE ADD
COLUMN — SQLite doesn't support adding a UNIQUE constraint to an existing
column via ALTER TABLE. This does the standard SQLite workaround: build a
new table with the right schema, copy the data over, swap it in.

Run once from your backend project root:
    python models/migrate_add_report_constraints.py
"""

import sqlite3

DB_PATH = "coaching_assistant.db"


def migrate():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='reports'")
    if cur.fetchone() is None:
        print("reports table doesn't exist yet — nothing to migrate, "
              "Base.metadata.create_all() will create it correctly on next run.")
        conn.close()
        return

    cur.execute("SELECT COUNT(*) FROM reports")
    existing_count = cur.fetchone()[0]
    if existing_count > 0:
        cur.execute(
            "SELECT session_id, COUNT(*) FROM reports GROUP BY session_id HAVING COUNT(*) > 1"
        )
        dupes = cur.fetchall()
        if dupes:
            print(
                "ABORTING: found duplicate session_id rows in reports "
                f"({dupes}). Resolve duplicates manually before adding the "
                "unique constraint, or this migration will fail/lose data."
            )
            conn.close()
            return

    # Already migrated? (rerun safety, same spirit as their try/except pattern)
    cur.execute("PRAGMA table_info(reports)")
    existing_cols = {row[1] for row in cur.fetchall()}
    if "updated_at" in existing_cols:
        print("Skipped: reports table already has updated_at (migration already applied).")
        conn.close()
        return

    print(f"Migrating reports table ({existing_count} existing rows)...")

    cur.executescript(
        """
        BEGIN TRANSACTION;

        CREATE TABLE reports_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id VARCHAR NOT NULL UNIQUE REFERENCES sessions(id),
            summary TEXT,
            resolution_score INTEGER,
            sentiment_journey TEXT,
            coaching_tips TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        INSERT INTO reports_new (id, session_id, summary, resolution_score,
                                  sentiment_journey, coaching_tips, created_at, updated_at)
        SELECT id, session_id, summary, resolution_score,
               sentiment_journey, coaching_tips, created_at, created_at
        FROM reports;

        DROP TABLE reports;
        ALTER TABLE reports_new RENAME TO reports;

        COMMIT;
        """
    )

    print("Added column: updated_at")
    print("Added constraint: UNIQUE(session_id)")
    conn.close()


if __name__ == "__main__":
    migrate()