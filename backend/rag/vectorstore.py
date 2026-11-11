from uuid import uuid4

from config import VECTOR_STORE
from rag.embeddings import create_embeddings

_embeddings = None
vectorstore = None
_pg_table = None
RELEVANCE_THRESHOLD = 0.5


def _get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = create_embeddings()
    return _embeddings


def _get_chroma():
    global vectorstore
    if vectorstore is None:
        from langchain_chroma import Chroma
        from paths import CHROMA_PERSIST_DIR

        vectorstore = Chroma(
            collection_name="kb_chunks", embedding_function=_get_embeddings(),
            persist_directory=str(CHROMA_PERSIST_DIR),
        )
    return vectorstore


def _get_pg_table():
    global _pg_table
    if _pg_table is None:
        from pgvector.sqlalchemy import Vector
        from sqlalchemy import Column, Index, JSON, MetaData, String, Table, Text

        _pg_table = Table(
            "kb_chunks_pg", MetaData(),
            Column("id", String, primary_key=True),
            Column("session_id", String, nullable=False, index=True),
            Column("content", Text, nullable=False),
            Column("metadata", JSON, nullable=False),
            Column("embedding", Vector(384), nullable=False),
        )
        Index(
            "ix_kb_chunks_pg_embedding_cosine", _pg_table.c.embedding,
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        )
    return _pg_table


def init_vectorstore():
    """Initialize persistent storage at startup without loading embedding models."""
    if VECTOR_STORE != "pgvector":
        return
    from models.database import engine
    from sqlalchemy import text

    if engine.dialect.name != "postgresql":
        raise RuntimeError("VECTOR_STORE=pgvector requires a PostgreSQL DATABASE_URL.")
    table = _get_pg_table()
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        table.create(connection, checkfirst=True)
        for index in table.indexes:
            index.create(connection, checkfirst=True)


def store_chunks(chunks, session_id: str):
    """Tag, embed and store chunks for a single session."""
    chunks = list(chunks)
    for chunk in chunks:
        chunk.metadata["session_id"] = session_id
    if VECTOR_STORE == "chroma":
        return _get_chroma().add_documents(chunks)
    if not chunks:
        return []
    from models.database import engine

    vectors = _get_embeddings().embed_documents([doc.page_content for doc in chunks])
    ids = [str(uuid4()) for _ in chunks]
    rows = [
        {"id": id_, "session_id": session_id, "content": doc.page_content,
         "metadata": doc.metadata, "embedding": vector}
        for id_, doc, vector in zip(ids, chunks, vectors, strict=True)
    ]
    with engine.begin() as connection:
        connection.execute(_get_pg_table().insert(), rows)
    return ids


def retrieve(query: str, session_id: str, k: int = 3):
    """Retrieve top-k chunks scoped to the session with the existing threshold."""
    if VECTOR_STORE == "chroma":
        results = _get_chroma().similarity_search_with_relevance_scores(
            query, k=k, filter={"session_id": session_id},
        )
        scored = [(doc.page_content, doc.metadata, score) for doc, score in results]
    else:
        from models.database import engine
        from sqlalchemy import select

        table = _get_pg_table()
        # Filter before ranking; avoid ANN post-filtering returning fewer than k.
        scoped = select(table).where(table.c.session_id == session_id).cte("scoped").prefix_with("MATERIALIZED")
        distance = scoped.c.embedding.cosine_distance(_get_embeddings().embed_query(query))
        statement = select(scoped.c.content, scoped.c.metadata, distance.label("distance")).order_by(distance).limit(k)
        with engine.connect() as connection:
            rows = connection.execute(statement).all()
        # pgvector returns cosine distance (lower is better). Convert to cosine
        # similarity so the relevance threshold keeps scores >= 0.5 (distance <= 0.5).
        scored = [(row.content, row.metadata, 1.0 - row.distance) for row in rows]
    return [
        {"content": content, "metadata": {**metadata, "relevance_score": round(score, 3)}}
        for content, metadata, score in scored if score >= RELEVANCE_THRESHOLD
    ]
