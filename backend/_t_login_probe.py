import requests
r = requests.post("http://127.0.0.1:8000/auth/login", json={"email": "x@example.com", "password": "x"}, timeout=20)
print("status:", r.status_code)
if r.status_code == 422:
    print("field errors:", [(e.get("loc"), e.get("type")) for e in r.json().get("detail", [])])
