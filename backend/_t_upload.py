import random, struct, sys, uuid, zlib
try:
    import requests
except ImportError:
    sys.exit("requests is not installed: run  pip install requests  and rerun")

BASE = "http://127.0.0.1:8000"
fails = 0

def row(status, label, detail=""):
    global fails
    if status == "FAIL":
        fails += 1
    print(f"{status:<6} {label:<48} {detail}")

def signup(tag):
    u = f"zz_up{tag}_{random.randint(0, 999999)}"
    pw = "Aa1!" + uuid.uuid4().hex[:12]
    r = requests.post(f"{BASE}/auth/signup", json={"username": u, "password": pw}, timeout=30)
    if r.status_code != 200:
        sys.exit(f"signup {tag} failed: {r.status_code} (rate limit? wait a minute and rerun)")
    return {"Authorization": "Bearer " + r.json()["access_token"]}

def tiny_png():
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(b"\x00\xff\x00\x00"))
            + chunk(b"IEND", b""))

def tiny_pdf():
    text = "AssistEdge upload test. Refund policy: refunds are accepted within thirty days."
    stream = f"BT /F1 12 Tf 72 720 Td ({text}) Tj ET".encode()
    objs = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out = b"%PDF-1.4\n"
    offs = []
    for i, o in enumerate(objs, 1):
        offs.append(len(out))
        out += f"{i} 0 obj\n".encode() + o + b"\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {len(objs) + 1}\n".encode() + b"0000000000 65535 f \n"
    for o in offs:
        out += f"{o:010d} 00000 n \n".encode()
    out += f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    return out

A = signup("A")
B = signup("B")

def avatar(name, data, ctype="application/octet-stream"):
    return requests.post(f"{BASE}/profile/avatar", headers=A,
                         files={"file": (name, data, ctype)}, timeout=60)

print("--- avatar upload + /static headers ---")
r = avatar("t.png", tiny_png(), "image/png")
row("PASS" if r.status_code == 200 else "FAIL", "valid PNG accepted", f"got {r.status_code}")
url = r.json().get("avatar_url") if r.status_code == 200 else None
if url:
    s = requests.get(BASE + url, timeout=30)  # deliberately unauthenticated
    row("PASS" if s.status_code == 200 else "FAIL", "static GET of uploaded avatar", f"got {s.status_code}")
    row("PASS" if s.headers.get("x-content-type-options", "").lower() == "nosniff" else "FAIL",
        "static response has nosniff", f"value: {s.headers.get('x-content-type-options')}")
    row("INFO", "static content-type", str(s.headers.get("content-type")))
    row("INFO", "static x-frame-options", str(s.headers.get("x-frame-options")))

print("\n--- avatar: types that must be rejected ---")
probes = [
    ("x.svg", b'<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>', "image/svg+xml"),
    ("x.html", b"<html><script>1</script></html>", "text/html"),
    ("x.js", b"alert(1)", "application/javascript"),
    ("x.php", b"<?php echo 1; ?>", "application/x-php"),
    ("x.exe", b"MZ", "application/octet-stream"),
    ("noext", b"abc", "application/octet-stream"),
]
for name, body, ct in probes:
    r = avatar(name, body, ct)
    row("PASS" if r.status_code in (400, 415, 422) else "FAIL", f"reject {name}", f"got {r.status_code}")

r = avatar("fake.png", b"<html><script>1</script></html>", "image/png")
row("INFO", "HTML body named fake.png", f"got {r.status_code} (200 = content not verified)")

r = requests.post(f"{BASE}/profile/avatar", headers=A,
                  files={"file": ("", b"abc", "image/png")}, timeout=30)
row("PASS" if r.status_code < 500 else "FAIL", "empty filename gives no 500", f"got {r.status_code}")

r = avatar("big.png", tiny_png() + b"0" * (3 * 1024 * 1024), "image/png")
row("PASS" if r.status_code in (400, 413) else "FAIL", "3MB avatar rejected", f"got {r.status_code}")

print("\n--- upload-docs ---")
r = requests.post(f"{BASE}/session/", headers=A,
                  json={"mode": "manual", "scenario": "upload test", "product_context": "upload test"}, timeout=30)
sid = r.json().get("id") or r.json().get("session_id")
up = f"{BASE}/session/{sid}/upload-docs"

r = requests.post(up, headers=A, files={"file": ("policy.pdf", tiny_pdf(), "application/pdf")}, timeout=300)
j = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
row("PASS" if r.status_code == 200 and j.get("chunks_indexed", 0) >= 1 else "FAIL",
    "real PDF accepted and indexed", f"got {r.status_code} chunks={j.get('chunks_indexed')} detail={j.get('detail')}")
row("INFO", "response exposes saved_to path", str("saved_to" in j))

r = requests.post(up, headers=A, files={"file": ("..\\..\\evil.pdf", tiny_pdf(), "application/pdf")}, timeout=300)
j = r.json() if r.status_code == 200 else {}
ok = r.status_code == 200 and j.get("filename") == "evil.pdf" and ".." not in j.get("saved_to", "")
row("PASS" if ok else "FAIL", "traversal filename sanitised", f"got {r.status_code} filename={j.get('filename')}")

r = requests.post(up, headers=A, files={"file": ("run.exe", b"MZ", "application/octet-stream")}, timeout=60)
row("PASS" if r.status_code == 400 else "FAIL", "reject .exe", f"got {r.status_code}")

r = requests.post(up, headers=A, files={"file": ("", b"abc", "application/pdf")}, timeout=60)
row("PASS" if r.status_code < 500 else "FAIL", "empty filename gives no 500", f"got {r.status_code}")

r = requests.post(up, headers=A, files={"file": ("big.pdf", b"%PDF-1.4\n" + b"0" * (11 * 1024 * 1024), "application/pdf")}, timeout=120)
row("PASS" if r.status_code == 413 else "FAIL", "11MB upload -> 413", f"got {r.status_code}")

r = requests.post(up, headers=B, files={"file": ("policy.pdf", tiny_pdf(), "application/pdf")}, timeout=60)
row("PASS" if r.status_code in (403, 404) else "FAIL", "account B cannot upload to A's session", f"got {r.status_code}")

r = requests.post(up, files={"file": ("policy.pdf", tiny_pdf(), "application/pdf")}, timeout=60)
row("PASS" if r.status_code == 401 else "FAIL", "anonymous upload -> 401", f"got {r.status_code}")

print(f"\nFAIL count: {fails}")
