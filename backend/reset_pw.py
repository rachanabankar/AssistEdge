import sqlite3

con = sqlite3.connect('coaching_assistant.db')
cur = con.cursor()
cur.execute(
    "UPDATE agents SET password_hash = ? WHERE username = ?",
    ('$2b$12$sJgZuPcgZ8BgcAykSD1VUOytsBGWFwkiN5W/8.ZoMo6WDyMR9Qb5q', 'qwertyuiop')
)
con.commit()
print('rows updated:', cur.rowcount)
con.close()