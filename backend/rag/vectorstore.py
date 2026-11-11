from langchain_chroma import Chroma
from paths import CHROMA_PERSIST_DIR
from rag.embeddings import create_embeddings

_embeddings = create_embeddings()

vectorstore = Chroma(
    collection_name="kb_chunks",
    embedding_function=_embeddings,
    persist_directory=str(CHROMA_PERSIST_DIR),
)

RELEVANCE_THRESHOLD = 0.5  # 0 = unrelated, 1 = perfect match


def store_chunks(chunks, session_id: str):
    """
    Tag each chunk with session_id so retrieval can later be scoped
    to just that session's uploaded documents, then embed + store.
    """
    for chunk in chunks:
        chunk.metadata["session_id"] = session_id

    return vectorstore.add_documents(chunks)


def retrieve(query: str, session_id: str, k: int = 3):
    """
    Retrieve the top-k most relevant chunks for a given query,
    filtered to a specific session's knowledge base, and drop
    any chunk below RELEVANCE_THRESHOLD so unrelated content
    doesn't get returned just because k >= number of stored chunks.
    """
    results = vectorstore.similarity_search_with_relevance_scores(
        query,
        k=k,
        filter={"session_id": session_id},
    )

    return [
        {
            "content": doc.page_content,
            "metadata": {**doc.metadata, "relevance_score": round(score, 3)},
        }
        for doc, score in results
        if score >= RELEVANCE_THRESHOLD
    ]
