"""Add and backfill has_password once; safe to rerun after passwords are set."""
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text


def migrate(engine):
    with engine.begin() as connection:
        dialect = connection.dialect.name
        if dialect == "postgresql":
            # Serialize concurrent runs so only the run adding the column backfills.
            connection.execute(text("LOCK TABLE agents IN ACCESS EXCLUSIVE MODE"))
            exists = connection.execute(text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_schema = current_schema() "
                "AND table_name = 'agents' AND column_name = 'has_password'"
            )).scalar() is not None
            connection.execute(text(
                "ALTER TABLE agents ADD COLUMN IF NOT EXISTS "
                "has_password BOOLEAN NOT NULL DEFAULT TRUE"
            ))
        elif dialect == "sqlite":
            connection.exec_driver_sql("BEGIN IMMEDIATE")
            exists = any(
                row[1] == "has_password"
                for row in connection.exec_driver_sql("PRAGMA table_info(agents)")
            )
            if not exists:
                connection.execute(text(
                    "ALTER TABLE agents ADD COLUMN "
                    "has_password BOOLEAN NOT NULL DEFAULT TRUE"
                ))
        else:
            raise ValueError("Only SQLite and PostgreSQL are supported")

        if not exists:
            connection.execute(text(
                "UPDATE agents SET has_password = FALSE WHERE google_id IS NOT NULL"
            ))
    print("has_password migration complete")


if __name__ == "__main__":
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise SystemExit("Set DATABASE_URL to the database to migrate")
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    engine = create_engine(url)
    try:
        migrate(engine)
    finally:
        engine.dispose()
