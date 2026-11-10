import sqlite3, glob
fs = [f for f in glob.glob("**/*.db", recursive=True) if "venv" not in f]
print("db files:", fs)
assert len(fs) == 1, "expected exactly one .db file, tell me what the list above shows"
c = sqlite3.connect(fs[0])
n = c.execute("UPDATE agents SET email=? WHERE username=?", ("zz_test_158986@example.invalid", "zz_test_158986")).rowcount
c.commit()
print("rows updated:", n)
