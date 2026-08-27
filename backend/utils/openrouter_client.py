import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openrouter/free"

# Retry/backoff settings shared by every agent. Increased from the original per-agent
# defaults (3 attempts, fixed 5/10/15s) because the free-tier model rate-limits and
# occasionally 502s often enough that 3 attempts wasn't enough headroom for reliable
# end-to-end testing.
DEFAULT_MAX_RETRIES = 5
DEFAULT_BASE_WAIT_SECONDS = 5
MAX_WAIT_SECONDS = 60


def call_openrouter(
    messages: list,
    require_json: bool = False,
    max_retries: int = DEFAULT_MAX_RETRIES,
    base_wait_seconds: int = DEFAULT_BASE_WAIT_SECONDS,
) -> str:
    """
    Calls the OpenRouter chat completions endpoint with retry/backoff and returns the
    raw text content of the model's reply.

    messages: standard OpenAI-style messages list, e.g. [{"role": "system", ...}, {"role": "user", ...}]
    require_json: if True, also retries when the response doesn't look like it contains a
        JSON object (no "{" found) — used by every JSON-output agent (sentiment, coaching,
        escalation). Leave False for agents that return plain text (e.g. the customer
        simulator agent).
    max_retries / base_wait_seconds: override the shared defaults if a specific agent needs
        different behavior.

    Retries on:
    - HTTP 429 (rate limited)
    - HTTP 500/502/503/504 (transient server-side errors)
    - Non-JSON-looking response, if require_json=True
    - Network-level request exceptions (timeouts, connection errors)

    Raises RuntimeError if all attempts are exhausted.
    """

    last_error = None

    for attempt in range(max_retries):
        wait_time = min(MAX_WAIT_SECONDS, base_wait_seconds * (attempt + 1))

        try:
            response = requests.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL,
                    "messages": messages,
                },
                timeout=30,
            )
            print("Status Code:", response.status_code)
            print("Response Body:", response.text)

        except requests.exceptions.RequestException as e:
            last_error = e
            print(f"OpenRouter client: request error on attempt {attempt+1}/{max_retries} ({e}), retrying in {wait_time}s...")
            time.sleep(wait_time)
            continue

        if response.status_code == 429:
            print(f"OpenRouter client: rate limited on attempt {attempt+1}/{max_retries}, retrying in {wait_time}s...")
            last_error = RuntimeError(f"Rate limited (429) on attempt {attempt+1}")
            time.sleep(wait_time)
            continue

        if response.status_code in (500, 502, 503, 504):
            print(f"OpenRouter client: server error {response.status_code} on attempt {attempt+1}/{max_retries}, retrying in {wait_time}s...")
            last_error = RuntimeError(f"Server error {response.status_code} on attempt {attempt+1}")
            time.sleep(wait_time)
            continue

        response.raise_for_status()
        data = response.json()
        raw_content = data["choices"][0]["message"]["content"].strip()

        if require_json and "{" not in raw_content:
            print(f"OpenRouter client: non-JSON-looking response on attempt {attempt+1}/{max_retries}, retrying. Raw: {raw_content}")
            last_error = RuntimeError("Response did not contain JSON")
            time.sleep(wait_time)
            continue

        return raw_content

    raise RuntimeError(
        f"Failed after {max_retries} attempts due to rate limiting or repeated errors. Last error: {last_error}"
    )