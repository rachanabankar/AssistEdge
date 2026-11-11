"""Run with backend\\venv\\Scripts\\python.exe scripts\\test_pgvector.py."""
import os
from pathlib import Path
import sys
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from dotenv import load_dotenv
from sqlalchemy.engine import make_url


def main():
    load_dotenv(Path(__file__).resolve().parents[1] / "backend" / ".env")
    try:
        backend = make_url(os.environ.get("DATABASE_URL", "sqlite://")).get_backend_name()
    except Exception:
        print("SKIP: DATABASE_URL is not a valid PostgreSQL URL.")
        return 0
    if backend not in {"postgres", "postgresql"}:
        print("SKIP: DATABASE_URL is not PostgreSQL.")
        return 0
    os.environ["VECTOR_STORE"] = "pgvector"
    os.environ.setdefault("PGCONNECT_TIMEOUT", "10")
    sessions = ["pgvector-test-" + str(uuid4()) for _ in range(2)]
    try:
        from langchain_core.documents import Document
        from models.database import engine
        from rag.vectorstore import init_vectorstore, retrieve, store_chunks, _get_pg_table
        from sqlalchemy import delete

        init_vectorstore()
        texts = ["The blue bicycle is in the garage.", "The orange cat sleeps on the sofa."]
        try:
            for session, text in zip(sessions, texts):
                store_chunks([Document(page_content=text)], session)
            # Query both texts in both sessions; even a low-scoring foreign text must never leak.
            for session, own_text in zip(sessions, texts):
                own = retrieve(own_text, session)
                assert own and own[0]["content"] == own_text
                for query in texts:
                    results = retrieve(query, session)
                    assert all(row["metadata"]["session_id"] == session and row["content"] == own_text for row in results)
            assert retrieve(texts[0], "pgvector-test-" + str(uuid4())) == []
        finally:
            table = _get_pg_table()
            with engine.begin() as connection:
                for session in sessions:
                    connection.execute(delete(table).where(table.c.session_id == session))
        print("PASS: pgvector session isolation; test chunks removed.")
        return 0
    except Exception as exc:
        # Never emit database/transport exception text, which may contain credentials.
        print(f"FAIL: pgvector isolation test ({type(exc).__name__}); check dependencies, database access, extension permissions, and embedding provider.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
