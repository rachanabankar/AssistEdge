"""HTTP smoke checks against an already running local production server."""
import json
import time
import uuid
from pathlib import Path

import httpx
from dotenv import dotenv_values
from sqlalchemy import create_engine, text


def main():
    results = []
    username = f"prod_smoke_{uuid.uuid4().hex}"
    credentials = {"username": username, "password": uuid.uuid4().hex}
    config = dotenv_values(Path(__file__).resolve().parents[1] / ".env")
    engine = create_engine(config["DATABASE_URL"], pool_pre_ping=True)
    agent_id = session_id = None

    def check(name, passed, detail):
        results.append({"check": name, "result": "PASS" if passed else "FAIL", "detail": detail})
        print(json.dumps(results[-1]), flush=True)

    try:
        with httpx.Client(base_url="http://127.0.0.1:8011", timeout=180) as client:
            for attempt in range(60):
                try:
                    response = client.get("/health", timeout=2)
                    break
                except httpx.ConnectError:
                    time.sleep(1)
            else:
                raise RuntimeError("Local server did not start")
            check("Health", response.status_code == 200 and response.json() == {"status": "ok"}, response.text)
            check("Production mode", client.get("/docs").status_code == 404 and "strict-transport-security" in response.headers, "Docs disabled and HSTS present")
            response = client.post("/auth/signup", json=credentials)
            data = response.json()
            agent_id = data.get("agent", {}).get("id")
            check("Signup", response.status_code == 200 and bool(data.get("access_token")), f"HTTP {response.status_code}; token issued={bool(data.get('access_token'))}")
            response = client.post("/auth/login", json=credentials)
            token = response.json().get("access_token")
            headers = {"Authorization": f"Bearer {token}"}
            profile = client.get("/profile", headers=headers)
            check("Login", response.status_code == 200 and profile.status_code == 200, f"Login HTTP {response.status_code}; authenticated profile HTTP {profile.status_code}")
            response = client.get("/profile")
            check("Missing token", response.status_code == 401, f"HTTP {response.status_code}")
            response = client.get("/health", headers={"Origin": "https://disallowed.invalid"})
            cors = {key: value for key, value in response.headers.items() if key.startswith("access-control-")}
            check("Disallowed Origin", response.status_code == 200 and not cors, f"CORS headers: {cors}")
            response = client.get("/health", headers={"Origin": "http://localhost:5173"})
            check("Allowed Origin", response.headers.get("access-control-allow-origin") == "http://localhost:5173", f"HTTP {response.status_code}; localhost permitted")
            # Cover the existing-account/email-send-failure branch without sending mail.
            with engine.begin() as connection:
                connection.execute(text("UPDATE agents SET email=:email WHERE id=:id"), {"email": username + "@example.invalid", "id": agent_id})
            expected = {"message": "If an account with that username or email exists, a reset link has been sent."}
            responses = [client.post("/auth/forgot-password", json={"identifier": identifier}) for identifier in (username, username + "_missing")]
            check("Forgot password", all(r.status_code == 200 and r.json() == expected for r in responses), "Existing and unknown account: generic message only; no URL/token")
            response = client.post("/session/", headers=headers, json={"mode": "manual"})
            session_id = response.json()["id"]
            document = "The cobalt lantern warranty covers repairs for exactly forty seven months."
            response = client.post(f"/session/{session_id}/upload-docs", headers=headers, files={"file": ("smoke.txt", document.encode(), "text/plain")})
            check("pgvector upload", response.status_code == 200 and response.json().get("chunks_indexed", 0) > 0, f"HTTP {response.status_code}: {response.text}")
            with engine.connect() as connection:
                rows = connection.execute(text("SELECT vector_dims(embedding) FROM kb_chunks_pg WHERE session_id=:sid"), {"sid": session_id}).scalars().all()
            check("pgvector persistence", bool(rows) and all(d == 384 for d in rows), f"Stored {len(rows)} real 384-dimensional PostgreSQL vectors")
            response = client.post(f"/session/{session_id}/query", headers=headers, json={"query": document, "k": 3})
            found = response.json().get("results", [])
            check("pgvector search", response.status_code == 200 and any("forty seven months" in item["content"] for item in found), f"HTTP {response.status_code}; matches={len(found)}")
    finally:
        # Remove only rows belonging to this uniquely named smoke-test account.
        with engine.begin() as connection:
            if session_id:
                connection.execute(text("DELETE FROM kb_chunks_pg WHERE session_id=:sid"), {"sid": session_id})
                connection.execute(text("DELETE FROM sessions WHERE id=:sid"), {"sid": session_id})
            if agent_id:
                connection.execute(text("DELETE FROM agents WHERE id=:id AND username=:username"), {"id": agent_id, "username": username})
        engine.dispose()
        Path(__file__).with_name("production_smoke_results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    return 0 if results and all(row["result"] == "PASS" for row in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
