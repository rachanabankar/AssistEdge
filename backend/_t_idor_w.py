import requests, secrets, sys, json
B = "http://127.0.0.1:8000"
tag = secrets.token_hex(4)
fails = 0
marker = "zzmark" + secrets.token_hex(4)

def check(name, got, want):
    global fails
    ok = got in want if isinstance(want, (list, tuple, set)) else got == want
    if not ok: fails += 1
    print(("PASS " if ok else "FAIL ") + name + " -> " + str(got) + " (want " + str(want) + ")")

def hdr(t): return {"Authorization": "Bearer " + t}

def signup(who):
    pw = "A1-" + secrets.token_urlsafe(12)
    r = requests.post(B + "/auth/signup", json={
        "username": "zz_idor_w_" + who + "_" + tag,
        "email": "zz_idor_w_" + who + "_" + tag + "@example.com",
        "password": pw}, timeout=20)
    print("signup " + who + ":", r.status_code)
    if r.status_code != 200:
        if r.status_code == 422:
            print("field errors:", [e.get("loc") for e in r.json().get("detail", [])])
        sys.exit(1)
    return r.json().get("access_token")

ta = signup("a")
tb = signup("b")
if not ta or not tb:
    print("missing access_token in signup response"); sys.exit(1)

r = requests.post(B + "/session/", headers=hdr(ta),
                  json={"mode": "manual", "scenario": "zz test", "product_context": "zz test"}, timeout=20)
print("create session (A):", r.status_code)
if r.status_code not in (200, 201):
    if r.status_code == 422:
        print("field errors:", [e.get("loc") for e in r.json().get("detail", [])])
    sys.exit(1)
j = r.json()
sid = j.get("id") or j.get("session_id")
if not sid:
    print("no session id in response, keys:", list(j.keys())); sys.exit(1)

def a_messages_text():
    r = requests.get(B + "/session/" + str(sid) + "/messages", headers=hdr(ta), timeout=20)
    return r.status_code, r.text

# --- B attacks A's session ---
hist = [{"sender": "agent", "content": marker}]
check("B /simulate/message on A session",
      requests.post(B + "/simulate/message", headers=hdr(tb), timeout=20,
                    json={"scenario": "zz", "session_id": sid, "conversation_history": hist}).status_code, 404)
check("B /manual/message on A session",
      requests.post(B + "/manual/message", headers=hdr(tb), timeout=20,
                    json={"session_id": sid, "customer_message": marker, "conversation_history": hist}).status_code, 404)
check("B /manual/end-session on A session",
      requests.post(B + "/manual/end-session", headers=hdr(tb), timeout=20,
                    json={"session_id": sid, "final_agent_reply": marker}).status_code, 404)
check("B GET messages on A session",
      requests.get(B + "/session/" + str(sid) + "/messages", headers=hdr(tb), timeout=20).status_code, 404)

# --- nonexistent session ---
fake = "00000000-0000-0000-0000-000000000000"
check("B /manual/end-session nonexistent session",
      requests.post(B + "/manual/end-session", headers=hdr(tb), timeout=20,
                    json={"session_id": fake, "final_agent_reply": marker}).status_code, 404)

# --- anonymous ---
check("anon /simulate/message",
      requests.post(B + "/simulate/message", timeout=20, json={"scenario": "zz", "session_id": sid}).status_code, [401, 403])
check("anon /manual/message",
      requests.post(B + "/manual/message", timeout=20,
                    json={"session_id": sid, "customer_message": marker}).status_code, [401, 403])
check("anon /manual/end-session",
      requests.post(B + "/manual/end-session", timeout=20,
                    json={"session_id": sid, "final_agent_reply": marker}).status_code, [401, 403])

# --- nothing written into A's session by B/anon ---
sc, txt = a_messages_text()
check("A reads own messages", sc, 200)
check("attack marker absent from A's session", marker in txt, False)

# --- positive control (no LLM): A ends own session ---
ctrl = "zzctrl" + secrets.token_hex(4)
check("A /manual/end-session on own session",
      requests.post(B + "/manual/end-session", headers=hdr(ta), timeout=20,
                    json={"session_id": sid, "final_agent_reply": ctrl}).status_code, 200)
sc, txt = a_messages_text()
check("A's own reply was saved", ctrl in txt, True)

print("FAIL count:", fails)
