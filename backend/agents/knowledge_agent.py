from rag.vectorstore import retrieve


def recommend_knowledge(conversation_history: list, session_id: str, k: int = 2) -> list:
    """
    conversation_history: list of {"sender": "customer"/"agent", "content": str}
    session_id: scopes retrieval to this session's uploaded docs
    k: how many chunks to return (default 2 — enough to be useful without
       cluttering a live coaching panel)

    Uses the latest customer message as the implicit query and returns
    the most relevant KB chunks for the agent to reference right now.

    Returns a list of:
    {
        "content": str,
        "metadata": dict   # includes session_id, and whatever else was set at ingestion
    }
    Returns an empty list if there's no customer message yet, or if the
    session's KB is empty / retrieval fails — callers should treat that as
    "no suggestions yet," not an error.
    """
    latest_message = next(
        (t["content"] for t in reversed(conversation_history) if t.get("sender") == "customer"),
        None,
    )
    if not latest_message:
        return []

    try:
        results = retrieve(latest_message, session_id=session_id, k=k)
    except Exception as e:
        print(f"Knowledge agent: retrieval failed ({e})")
        return []

    # Dedup by content — sparse KBs (single doc/chunk) can otherwise return
    # the same chunk twice to fill up to k results
    seen = set()
    deduped = []
    for r in results:
        if r["content"] not in seen:
            seen.add(r["content"])
            deduped.append(r)

    return deduped
