"""Embedding providers; hosted mode never imports the local ML stack."""
import math
import time

import httpx
from langchain_core.embeddings import Embeddings

from config import EMBEDDING_PROVIDER, HF_API_TOKEN

MODEL = "sentence-transformers/all-MiniLM-L6-v2"
_URL = f"https://router.huggingface.co/hf-inference/models/{MODEL}/pipeline/feature-extraction"


class HostedEmbeddings(Embeddings):
    """Bounded batches of sentence embeddings from HF Inference."""

    def __init__(self, token: str | None):
        if not token or not token.strip():
            raise RuntimeError("HF_API_TOKEN is required when EMBEDDING_PROVIDER=hosted.")
        self._token = token.strip()

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        vectors = []
        with httpx.Client(timeout=httpx.Timeout(30.0, connect=10.0)) as client:
            for start in range(0, len(texts), 16):
                batch = [text.replace("\n", " ") for text in texts[start:start + 16]]
                vectors.extend(self._embed_batch(client, batch))
        return vectors

    def _embed_batch(self, client, batch):
        for attempt in range(4):
            try:
                response = client.post(
                    _URL,
                    headers={"Authorization": f"Bearer {self._token}"},
                    json={"inputs": batch, "normalize": True, "truncate": True},
                    follow_redirects=False,
                )
            except httpx.TransportError:
                if attempt == 3:
                    raise RuntimeError("HF embeddings request failed after 4 attempts (network/timeout).") from None
            else:
                if response.status_code == 200:
                    try:
                        result = response.json()
                        if not isinstance(result, list) or len(result) != len(batch):
                            raise ValueError
                        if any(
                            not isinstance(row, list) or len(row) != 384
                            or any(type(v) not in (int, float) or not math.isfinite(v) for v in row)
                            for row in result
                        ):
                            raise ValueError
                        return result
                    except (ValueError, TypeError):
                        raise RuntimeError("HF embeddings returned invalid data; expected one 384-dimensional vector per text.") from None
                if response.status_code not in {408, 429, 500, 502, 503, 504} or attempt == 3:
                    # Do not include response bodies, request headers, or transport errors: they may contain credentials.
                    raise RuntimeError(f"HF embeddings request failed (HTTP {response.status_code}); check token permissions and model availability.")
            time.sleep(2 ** attempt)

    def embed_query(self, text: str) -> list[float]:
        return self.embed_documents([text])[0]


def create_embeddings() -> Embeddings:
    if EMBEDDING_PROVIDER == "hosted":
        return HostedEmbeddings(HF_API_TOKEN)
    if EMBEDDING_PROVIDER == "local":
        from langchain_huggingface import HuggingFaceEmbeddings

        return HuggingFaceEmbeddings(model_name=MODEL)
    raise RuntimeError("EMBEDDING_PROVIDER must be 'local' or 'hosted'.")
