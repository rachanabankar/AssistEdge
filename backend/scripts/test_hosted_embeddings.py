"""Check embedding providers without exposing credentials or download logs."""
import argparse
from contextlib import redirect_stdout, redirect_stderr
import importlib.util
import math
import os
from pathlib import Path
import re
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--provider', choices=('local', 'hosted', 'fastembed'), default='hosted')
    args = parser.parse_args()
    os.environ['EMBEDDING_PROVIDER'] = args.provider
    os.environ['HF_HUB_DISABLE_PROGRESS_BARS'] = '1'
    os.environ['TOKENIZERS_PARALLELISM'] = 'false'
    try:
        # Discard library output: download/transport diagnostics may contain URLs.
        with open(os.devnull, 'w') as sink, redirect_stdout(sink), redirect_stderr(sink):
            from rag import embeddings
            if args.provider == 'fastembed':
                from loguru import logger
                logger.remove()
            vector = embeddings.create_embeddings().embed_query('refund policy for damaged items')
            rss = None
            if importlib.util.find_spec('psutil') is not None:
                import psutil
                rss = psutil.Process().memory_info().rss / (1024 * 1024)
            similarity = None
            if args.provider == 'fastembed':
                try:
                    from langchain_huggingface import HuggingFaceEmbeddings
                except ImportError:
                    similarity = 'similarity check skipped'
                else:
                    local = HuggingFaceEmbeddings(model_name=embeddings.MODEL)
                    other = local.embed_query('refund policy for damaged items')
                    cosine = sum(a * b for a, b in zip(vector, other)) / math.sqrt(
                        sum(a * a for a in vector) * sum(b * b for b in other))
                    similarity = f'cosine similarity: {cosine:.6f} ' + ('OK' if cosine >= 0.99 else 'FAIL')
        print(f'provider: {args.provider}')
        print(f'vector length: {len(vector)}')
        print('OK' if len(vector) == 384 else 'FAIL')
        if rss is not None:
            print(f'RSS: {rss:.2f} MB')
        if similarity is not None:
            print(similarity)
        return 0 if len(vector) == 384 and (similarity is None or not similarity.endswith('FAIL')) else 1
    except Exception as exc:
        message = str(exc)
        safe = (
            r'HF_API_TOKEN is required when EMBEDDING_PROVIDER=hosted\.',
            r'HF embeddings retry time limit reached \(90 seconds\)\.',
            r'HF embeddings request failed after 5 attempts \(network/timeout\)\.',
            r'HF embeddings request failed \(HTTP [0-9]{3}\); check token permissions and model availability\.',
            r'HF embeddings request failed \(HTTP 402\): Hugging Face credits are required\.',
            r'HF embeddings returned invalid data; expected one 384-dimensional vector per text\.',
            r'The fastembed package is required; pip install fastembed\.',
        )
        if args.provider != 'fastembed' and not any(re.fullmatch(pattern, message) for pattern in safe):
            message = 'Embedding configuration, model loading, or execution failed; details suppressed to protect credentials.'
        print(f'{type(exc).__name__}: {message}')
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
