from __future__ import annotations

import json
import logging
import os
import socket
import time
from urllib import request
from urllib.error import URLError

logger = logging.getLogger("gapforge.ai_client")


def call_ollama(
    prompt: str,
    *,
    model_name: str,
    base_url: str,
    timeout_seconds: float,
    max_attempts: int,
    temperature: float,
    keep_alive: str,
) -> str:
    model_name = model_name.strip() or "qwen2.5:7b-instruct"
    base_url = base_url.rstrip("/") or "http://localhost:11434"
    timeout_seconds = max(5.0, float(timeout_seconds))
    max_attempts = max(1, int(max_attempts))
    keep_alive = keep_alive.strip() or "5m"

    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
        },
        "keep_alive": keep_alive,
    }
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url=f"{base_url}/api/generate",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    for attempt in range(1, max_attempts + 1):
        try:
            with request.urlopen(req, timeout=timeout_seconds) as response:
                raw = response.read().decode("utf-8")
            parsed = json.loads(raw)
            return str(parsed.get("response", "")).strip()
        except (URLError, json.JSONDecodeError, socket.timeout, TimeoutError, OSError) as exc:
            is_last_attempt = attempt >= max_attempts
            logger.warning(
                "Ollama call failed (attempt %s/%s): %s",
                attempt,
                max_attempts,
                exc,
            )
            if is_last_attempt:
                logger.error("All Ollama attempts failed; returning empty response.")
                return ""
            time.sleep(0.6 * attempt)

    return ""


def call_llama(prompt: str) -> str:
    return call_ollama(
        prompt,
        model_name=os.getenv("OLLAMA_MODEL", "qwen2.5:7b-instruct"),
        base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        timeout_seconds=float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "240")),
        max_attempts=int(os.getenv("OLLAMA_MAX_RETRIES", "2")),
        temperature=float(os.getenv("OLLAMA_TEMPERATURE", "0.2")),
        keep_alive=os.getenv("OLLAMA_KEEP_ALIVE", "5m"),
    )
