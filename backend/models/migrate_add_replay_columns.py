import sqlite3
DB_PATH = "coaching_assistant.db"
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
for column in ["customer_tone", "patience_level"]:
    try:
        cur.execute(f"ALTER TABLE sessions ADD COLUMN {column} TEXT")
        print(f"Added column: {column}")
    except sqlite3.OperationalError as e:
        print(f"Skipped {column}: {e}")
conn.commit()
conn.close()