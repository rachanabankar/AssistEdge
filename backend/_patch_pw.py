import os, shutil

def rd(p):
    with open(p, encoding="utf-8", newline="") as f:
        raw = f.read()
    crlf = "\r\n" in raw
    return raw.replace("\r\n", "\n"), crlf

def wr(p, s, crlf):
    if crlf:
        s = s.replace("\n", "\r\n")
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(s)

RL_NEW = """def agent_rate_limit_check(agent_id, spec, scope):
    # Per-account limit. Call after authentication.
    if not RATE_LIMIT_ENABLED:
        return
    count_s, per = spec.split("/")
    max_requests = int(count_s)
    period = _PERIODS[per]
    now = time.monotonic()
    key = (scope, "agent:" + str(agent_id))
    with _lock:
        entry = _hits.get(key)
        if entry is None:
            entry = (period, deque())
            _hits[key] = entry
        dq = entry[1]
        while dq and now - dq[0] >= period:
            dq.popleft()
        if len(dq) >= max_requests:
            retry = int(period - (now - dq[0])) + 1
            raise HTTPException(
                status_code=429,
                detail="Too many requests",
                headers={"Retry-After": str(retry)},
            )
        dq.append(now)
"""

CRUD_OLD = """def change_agent_password(db: Session, agent: models.Agent, new_password_hash: str):
    agent.password_hash = new_password_hash
    db.commit()
    db.refresh(agent)
    return agent
"""
CRUD_NEW = CRUD_OLD + """
def change_password_and_revoke(db: Session, agent: models.Agent, new_password_hash: str):
    # One commit: new password and old JWTs revoked.
    agent.password_hash = new_password_hash
    agent.token_version = (agent.token_version or 0) + 1
    db.commit()
    db.refresh(agent)
    return agent
"""

P_EDITS = [
("from pydantic import BaseModel\n",
 "from pydantic import BaseModel, field_validator\n"),
("from utils.auth import get_current_agent, verify_password, hash_password\n",
 "from utils.auth import get_current_agent, verify_password, hash_password, create_access_token\nfrom ratelimit import agent_rate_limit_check\n"),
("""class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
""",
"""class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("current_password")
    @classmethod
    def validate_current_password(cls, v: str) -> str:
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes")
        return v

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes")
        return v
"""),
("""    if not verify_password(payload.current_password, agent.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    new_hash = hash_password(payload.new_password)
    crud.change_agent_password(db, agent, new_hash)
""",
"""    agent_rate_limit_check(agent.id, "5/min", "change-password")
    if not verify_password(payload.current_password, agent.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if payload.new_password == payload.current_password:
        raise HTTPException(status_code=400, detail="New password must be different from the current password")
    new_hash = hash_password(payload.new_password)
    crud.change_password_and_revoke(db, agent, new_hash)
"""),
("""    return {"detail": "Password updated successfully"}
""",
"""    token = create_access_token(agent_id=agent.id, username=agent.username, token_version=agent.token_version)
    return {"detail": "Password updated successfully", "access_token": token, "token_type": "bearer"}
"""),
]

plan = []
errors = []

t, c = rd("ratelimit.py")
if "def agent_rate_limit_check" in t:
    errors.append("ratelimit.py already patched")
else:
    plan.append(("ratelimit.py", t.rstrip("\n") + "\n\n\n" + RL_NEW, c))

t, c = rd("models/crud.py")
if t.count(CRUD_OLD) != 1:
    errors.append("crud.py: change_agent_password block not found exactly once")
else:
    plan.append(("models/crud.py", t.replace(CRUD_OLD, CRUD_NEW), c))

t, c = rd("routers/profile.py")
if not t.endswith("\n"): t += "\n"
for old, new in P_EDITS:
    if t.count(old) != 1:
        errors.append("profile.py: no unique match for: " + old.strip().splitlines()[0])
    else:
        t = t.replace(old, new)
plan.append(("routers/profile.py", t, c))

if errors:
    print("ABORTED, nothing written:")
    for e in errors:
        print("  -", e)
    raise SystemExit(1)

for p, s, c in plan:
    shutil.copyfile(p, p + ".bak_pw")
    wr(p, s, c)
    print("OK", p)

print("--- other callers of change_agent_password ---")
for root, dirs, files in os.walk("."):
    dirs[:] = [d for d in dirs if d not in ("venv", "__pycache__", "static")]
    for fn in files:
        if fn.endswith(".py") and not fn.startswith("_t_"):
            fp = os.path.join(root, fn)
            with open(fp, encoding="utf-8", errors="replace") as f:
                for n, line in enumerate(f, 1):
                    if "change_agent_password" in line:
                        print(fp + ":" + str(n) + ": " + line.strip())
