from __future__ import annotations

import json
import os
import re
from typing import Any, Callable

from app.api.ai_client import call_llama
from app.services.ai_client import GeminiClient


ValidatorFn = Callable[[dict[str, Any]], bool]
_gemini_client: GeminiClient | None = None


def safe_parse_json(response: str) -> dict[str, Any] | None:
    if not response:
        return None

    try:
        parsed = json.loads(response)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", response, re.DOTALL)
        if not match:
            return None
        try:
            parsed = json.loads(match.group(0))
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            return None


def generate_json_with_retry(
    prompt: str,
    fallback: dict[str, Any],
    validator: ValidatorFn | None = None,
    stage_name: str = "stage",
) -> dict[str, Any]:
    retry_suffix = (
        "\n\nValidation failed in the previous output.\n"
        "Return STRICT JSON only and ensure all fields are domain-grounded, non-generic, and evidence-linked."
    )

    candidates: list[dict[str, Any] | None] = []

    first_llama = safe_parse_json(call_llama(prompt))
    candidates.append(first_llama)

    second_llama = safe_parse_json(call_llama(prompt + retry_suffix))
    candidates.append(second_llama)

    if _should_use_gemini():
        gemini = _get_gemini_client()
        gemini_first = gemini.generate_json(prompt, {}, call_label=f"{stage_name}_gemini_1")
        candidates.append(gemini_first if isinstance(gemini_first, dict) else None)

        gemini_second = gemini.generate_json(prompt + retry_suffix, {}, call_label=f"{stage_name}_gemini_2")
        candidates.append(gemini_second if isinstance(gemini_second, dict) else None)

    for candidate in candidates:
        if candidate is None:
            continue
        if validator is None or validator(candidate):
            return candidate

    return fallback


def _get_gemini_client() -> GeminiClient:
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = GeminiClient()
    return _gemini_client


def _should_use_gemini() -> bool:
    enabled = os.getenv("ENABLE_GEMINI_FALLBACK", "0").strip().lower()
    if enabled not in {"1", "true", "yes", "on"}:
        return False
    return bool(os.getenv("GEMINI_API_KEY", "").strip())
