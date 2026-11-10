import sys, shutil

def rd(p):
    with open(p, "r", encoding="utf-8", newline="") as f:
        return f.read()

SIM = r"routers\simulate.py"
MAN = r"routers\manual.py"

TURN_OLD = "class Turn(BaseModel):\n    sender: str\n    content: str\n"
TURN_NEW = ("class Turn(BaseModel):\n"
            "    sender: str = Field(max_length=20)\n"
            "    content: str = Field(max_length=4000)\n")
PYD_OLD = "from pydantic import BaseModel\n"
PYD_NEW = "from pydantic import BaseModel, Field\n"
ORCH_OLD = "from orchestrator import run_coaching_pipeline\n"
ORCH_NEW = ORCH_OLD + "from ratelimit import agent_rate_limit_check\n"

SIM_EDITS = [
    (PYD_OLD, PYD_NEW),
    (ORCH_OLD, ORCH_NEW),
    (TURN_OLD, TURN_NEW),
    ('    tone: str = "neutral"\n    patience: str = "medium"\n',
     '    tone: str = Field("neutral", max_length=50)\n    patience: str = Field("medium", max_length=50)\n'),
    ("    scenario: str\n    persona: Persona = Persona()\n    conversation_history: list[Turn] = []\n    session_id: str | None = None\n",
     "    scenario: str = Field(max_length=2000)\n    persona: Persona = Persona()\n"
     "    conversation_history: list[Turn] = Field(default_factory=list, max_length=100)\n"
     "    session_id: str | None = Field(None, max_length=64)\n"),
    ('    # session_id is optional here (simulator can run "dry" with no persistence),\n',
     '    agent_rate_limit_check(current_agent.id, "20/min", "coach-llm")\n\n'
     '    # session_id is optional here (simulator can run "dry" with no persistence),\n'),
]

OWN = "    _check_session_ownership(db, payload.session_id, current_agent)\n\n"
MAN_EDITS = [
    (PYD_OLD, PYD_NEW),
    (ORCH_OLD, ORCH_NEW),
    (TURN_OLD, TURN_NEW),
    ("class ManualMessageRequest(BaseModel):\n    session_id: str\n    customer_message: str\n    conversation_history: list[Turn] = []\n",
     "class ManualMessageRequest(BaseModel):\n    session_id: str = Field(max_length=64)\n"
     "    customer_message: str = Field(max_length=4000)\n"
     "    conversation_history: list[Turn] = Field(default_factory=list, max_length=100)\n"),
    ("class EndSessionRequest(BaseModel):\n    session_id: str\n    final_agent_reply: str | None = None\n",
     "class EndSessionRequest(BaseModel):\n    session_id: str = Field(max_length=64)\n"
     "    final_agent_reply: str | None = Field(None, max_length=4000)\n"),
    (OWN + "    if not payload.customer_message.strip():\n",
     '    agent_rate_limit_check(current_agent.id, "20/min", "coach-llm")\n' + OWN +
     "    if not payload.customer_message.strip():\n"),
    (OWN + "    if payload.final_agent_reply and payload.final_agent_reply.strip():\n",
     '    agent_rate_limit_check(current_agent.id, "60/min", "coach-end")\n' + OWN +
     "    if payload.final_agent_reply and payload.final_agent_reply.strip():\n"),
]

errors, out = [], {}
for path, edits in ((SIM, SIM_EDITS), (MAN, MAN_EDITS)):
    t = rd(path)
    NL = "\r\n" if "\r\n" in t else "\n"
    for old, new in edits:
        o, n = old.replace("\n", NL), new.replace("\n", NL)
        if t.count(o) != 1:
            errors.append(path + ": no unique match for: " + old.strip().splitlines()[0][:70])
        else:
            t = t.replace(o, n)
    out[path] = t

if errors:
    print("ABORTED, nothing written:")
    for e in errors: print("  - " + e)
    sys.exit(1)

for p, text in out.items():
    shutil.copyfile(p, p + ".bak_lim")
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(text)
    print("OK " + p)
