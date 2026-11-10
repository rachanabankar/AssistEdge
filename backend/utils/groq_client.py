import inspect
import json
import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

DEFAULT_GROQ_MODELS = "openai/gpt-oss-120b,openai/gpt-oss-20b"
FALLBACK_STATUS_CODES = {404, 429, 500, 502, 503}

DEFAULT_MAX_RETRIES = 5
DEFAULT_BASE_WAIT_SECONDS = 2
MAX_WAIT_SECONDS = 30

AGENT_ENV_MAP = {
    "sentiment": "GROQ_MODEL_SENTIMENT",
    "coaching": "GROQ_MODEL_COACHING",
    "escalation": "GROQ_MODEL_ESCALATION",
    "summary": "GROQ_MODEL_SUMMARY",
    "simulator": "GROQ_MODEL_SIMULATOR",
}


def _get_models_for_agent(agent: str = None) -> list[str]:
    """
    Returns ordered list of models for the given agent or caller context.
    Checks agent override env var first, then falls back to GROQ_MODELS env var,
    then DEFAULT_GROQ_MODELS.
    """
    if not agent:
        frame = inspect.currentframe()
        # Look back through call stack for agent caller
        caller = frame.f_back
        while caller:
            fname = os.path.basename(caller.f_code.co_filename).lower()
            if "sentiment" in fname:
                agent = "sentiment"
                break
            elif "coaching" in fname:
                agent = "coaching"
                break
            elif "escalation" in fname:
                agent = "escalation"
                break
            elif "summary" in fname:
                agent = "summary"
                break
            elif "simulator" in fname:
                agent = "simulator"
                break
            caller = caller.f_back

    if agent and agent.lower() in AGENT_ENV_MAP:
        env_var = AGENT_ENV_MAP[agent.lower()]
        override = os.getenv(env_var)
        if override and override.strip():
            return [m.strip() for m in override.split(",") if m.strip()]

    env_models = os.getenv("GROQ_MODELS")
    if env_models and env_models.strip():
        models = [m.strip() for m in env_models.split(",") if m.strip()]
        if models:
            return models

    return [m.strip() for m in DEFAULT_GROQ_MODELS.split(",") if m.strip()]


def call_groq(
    messages: list,
    require_json: bool = False,
    max_retries: int = DEFAULT_MAX_RETRIES,
    base_wait_seconds: int = DEFAULT_BASE_WAIT_SECONDS,
    agent: str = None,
    models: list = None,
) -> str:
    """
    Calls Groq chat completions endpoint with automatic model fallback.
    - Tries models in order from env or agent override.
    - Automatically falls back to the next model on HTTP 404, 429, 500, 502, 503.
    - Stops and raises immediately on client errors like 400 or 401.
    """
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not set. Add it to your .env file.")

    candidate_models = models or _get_models_for_agent(agent)
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    last_error = None

    for model_idx, model in enumerate(candidate_models):
        payload = {
            "model": model,
            "messages": messages,
        }

        try:
            response = requests.post(GROQ_URL, headers=headers, json=payload, timeout=30)
        except requests.exceptions.RequestException as e:
            last_error = e
            print(f"Groq client: request error with model '{model}' ({e}). Falling back to next model...")
            continue

        if response.status_code in FALLBACK_STATUS_CODES:
            last_error = RuntimeError(f"Model '{model}' failed with status {response.status_code}: {response.text}")
            print(f"Groq client: model '{model}' returned HTTP {response.status_code}. Falling back to next model...")
            continue

        if not response.ok:
            # Fatal client errors (400, 401, etc.) - stop and raise immediately
            raise RuntimeError(f"Groq API error {response.status_code}: {response.text}")

        data = response.json()
        choice = data.get("choices", [{}])[0]
        raw_content = choice.get("message", {}).get("content", "")
        if raw_content is None:
            raw_content = ""
        raw_content = raw_content.strip()

        try:
            if require_json:
                if len(raw_content) > 100000 or not isinstance(json.loads(raw_content), dict):
                    raise ValueError("Expected a bounded JSON object")
        except (ValueError, TypeError):
            last_error = RuntimeError(f"Model '{model}' returned non-JSON response: {raw_content}")
            print(f"Groq client: non-JSON response from model '{model}'. Falling back to next model...")
            continue

        return raw_content

    raise RuntimeError(
        f"All candidate Groq models failed ({candidate_models}). Last error: {last_error}"
    )
