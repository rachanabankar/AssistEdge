import requests, secrets, sys
B = "http://127.0.0.1:8000"
tag = secrets.token_hex(4)
email = f"zz_test_pw_{tag}@example.com"
pw1 = "A1-" + secrets.token_urlsafe(12)
pw2 = "B2-" + secrets.token_urlsafe(12)
fails = 0

def check(name, got, want):
    global fails
    ok = got in want if isinstance(want, (list, tuple, set)) else got == want
    if not ok: fails += 1
    print(("PASS " if ok else "FAIL ") + name + " -> " + str(got) + " (want " + str(want) + ")")

def hdr(t): return {"Authorization": "Bearer " + t}
def chpw(tok, cur, new):
    return requests.patch(B + "/profile/password", headers=hdr(tok),
                          json={"current_password": cur, "new_password": new}, timeout=20)

r = requests.post(B + "/auth/signup", json={"username": "zz_test_pw_" + tag, "email": email, "password": pw1}, timeout=20)
print("signup status:", r.status_code)
if r.status_code == 422:
    print("signup field errors:", [e.get("loc") for e in r.json().get("detail", [])])
    sys.exit(1)
r = requests.post(B + "/auth/login", json={"username": "zz_test_pw_" + tag, "password": pw1}, timeout=20)
print("login status:", r.status_code)
if r.status_code != 200:
    sys.exit(1)
tok0 = r.json().get("access_token")
if not tok0:
    print("no access_token in login response, keys:", list(r.json().keys())); sys.exit(1)

# validation (should not consume rate-limit budget if rejected by pydantic)
check("new password too short", chpw(tok0, pw1, "Ab1-xyz").status_code, [400, 422])
check("new password > 72 bytes", chpw(tok0, pw1, "A" * 73).status_code, [400, 422])
check("new == current", chpw(tok0, pw1, pw1).status_code, [400, 422])
check("wrong current password", chpw(tok0, "wrong-" + secrets.token_hex(6), pw2).status_code, [400, 401, 403])

# success
r = chpw(tok0, pw1, pw2)
check("change succeeds", r.status_code, 200)
body = r.json() if r.status_code == 200 else {}
tok1 = body.get("access_token")
check("response has access_token + bearer", bool(tok1) and body.get("token_type") == "bearer", True)

# token revocation
check("old JWT now rejected", requests.get(B + "/session/", headers=hdr(tok0), timeout=20).status_code, 401)
if tok1:
    check("returned JWT works", requests.get(B + "/session/", headers=hdr(tok1), timeout=20).status_code, 200)
check("login with old password", requests.post(B + "/auth/login", json={"username": "zz_test_pw_" + tag, "password": pw1}, timeout=20).status_code, 401)
check("login with new password", requests.post(B + "/auth/login", json={"username": "zz_test_pw_" + tag, "password": pw2}, timeout=20).status_code, 200)

# rate limit: per-account 5/min, 3 handler calls used so far in this window
codes = []
if tok1:
    for _ in range(5):
        codes.append(chpw(tok1, "wrong-" + secrets.token_hex(6), pw1).status_code)
print("rate-limit sequence:", codes)
check("429 appears in sequence", 429 in codes, True)

print("FAIL count:", fails)

