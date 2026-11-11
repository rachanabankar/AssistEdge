"""Embedding providers; hosted mode never imports the local ML stack."""
import math
import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import httpx
from langchain_core.embeddings import Embeddings

from config import EMBEDDING_PROVIDER, FASTEMBED_CACHE_PATH, HF_API_TOKEN

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
        deadline = time.monotonic() + 90.0
        for attempt in range(5):
            delay = 2 ** attempt
            if time.monotonic() >= deadline:
                raise RuntimeError("HF embeddings retry time limit reached (90 seconds).")
            try:
                response = client.post(
                    _URL,
                    headers={"Authorization": f"Bearer {self._token}"},
                    json={"inputs": batch, "normalize": True, "truncate": True},
                    follow_redirects=False,
                    timeout=httpx.Timeout(min(30.0, deadline - time.monotonic()), connect=min(10.0, deadline - time.monotonic())),
                )
            except httpx.TransportError:
                if attempt == 4:
                    raise RuntimeError("HF embeddings request failed after 5 attempts (network/timeout).") from None
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
                if response.status_code == 402:
                    raise RuntimeError("HF embeddings request failed (HTTP 402): Hugging Face credits are required.")
                if response.status_code not in {408, 429, 500, 502, 503, 504} or attempt == 4:
                    # Do not include response bodies, request headers, or transport errors: they may contain credentials.
                    raise RuntimeError(f"HF embeddings request failed (HTTP {response.status_code}); check token permissions and model availability.")
                if response.status_code in {429, 503}:
                    delay = self._retry_delay(response, attempt)
            remaining = deadline - time.monotonic()
            if remaining <= 0 or delay >= remaining:
                raise RuntimeError("HF embeddings retry time limit reached (90 seconds).")
            time.sleep(min(delay, 30.0))

    @staticmethod
    def _retry_delay(response, attempt):
        retry_after = response.headers.get("Retry-After")
        if retry_after is not None:
            try:
                delay = float(retry_after)
            except ValueError:
                try:
                    delay = (parsedate_to_datetime(retry_after) - datetime.now(timezone.utc)).total_seconds()
                except (ValueError, TypeError, OverflowError):
                    delay = float("nan")
            if math.isfinite(delay):
                return min(30.0, max(0.0, delay))
        if response.status_code == 503:
            try:
                delay = float(response.json()["estimated_time"])
                if math.isfinite(delay) and delay >= 0:
                    return min(30.0, delay)
            except (ValueError, TypeError, KeyError, OverflowError):
                pass
            return min(30.0, 5.0 * 2 ** attempt)
        return min(30.0, 2.0 ** attempt)

    def embed_query(self, text: str) -> list[float]:
        return self.embed_documents([text])[0]


class FastEmbedEmbeddings(Embeddings):
    """Load the ONNX model only when an embedding is requested."""

    def __init__(self, embedding_class):
        self._embedding_class = embedding_class
        self._model = None

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        if self._model is None:
            options = {"cache_dir": FASTEMBED_CACHE_PATH} if FASTEMBED_CACHE_PATH else {}
            self._model = self._embedding_class(model_name=MODEL, **options)
        return [[float(value) for value in vector] for vector in self._model.embed(texts)]

    def embed_query(self, text: str) -> list[float]:
        return self.embed_documents([text])[0]


def create_embeddings() -> Embeddings:
    if EMBEDDING_PROVIDER == "fastembed":
        try:
            from fastembed import TextEmbedding
        except ImportError as exc:
            raise RuntimeError(f"fastembed import failed: {type(exc).__name__}: {exc}") from exc
        return FastEmbedEmbeddings(TextEmbedding)
    if EMBEDDING_PROVIDER == "hosted":
        return HostedEmbeddings(HF_API_TOKEN)
    if EMBEDDING_PROVIDER == "local":
        from langchain_huggingface import HuggingFaceEmbeddings

        return HuggingFaceEmbeddings(model_name=MODEL)
    raise RuntimeError("EMBEDDING_PROVIDER must be 'local', 'hosted', or 'fastembed'.")
