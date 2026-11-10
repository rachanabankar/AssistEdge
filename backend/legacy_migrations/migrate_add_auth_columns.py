"""
Run once: python migrate_add_auth_columns.py
Adds the 3 new columns needed for Google login + forgot password to the
existing `agents` table without wiping your data.
Safe to re-run — already-added columns are skipped.
"""
import sqlite3

con = sqlite3.connect("coaching_assistant.db")
cur = con.cursor()

statements = [
    "ALTER TABLE agents ADD COLUMN google_id VARCHAR",
    "ALTER TABLE agents ADD COLUMN reset_token VARCHAR",
    "ALTER TABLE agents ADD COLUMN reset_token_expiry TIMESTAMP",
]

for stmt in statements:
    try:
        cur.execute(stmt)
        print("OK:", stmt)
    except sqlite3.OperationalError as e:
        print("SKIPPED:", stmt, "->", e)

con.commit()
con.close()
print("\nDone.")