"""
Reusable Gemini AI client for GapForge.

Uses the new google-genai SDK (replaces deprecated google-generativeai).
Provides a single generate_json() method that sends a prompt to Google Gemini
and returns parsed JSON. Handles markdown fences, partial JSON, and API errors
gracefully with fallback support.
"""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Optional

from google import genai

logger = logging.getLogger("gapforge.ai_client")


class GeminiClient:
    """Thin wrapper around Google GenAI SDK (new google-genai package)."""

    def __init__(self) -> None:
        api_key = os.getenv("GEMINI_API_KEY", "")
        self._model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

        if not api_key:
            logger.warning("GEMINI_API_KEY not set — AI calls will return fallback data.")
            self._client = None
            return

        self._client = genai.Client(api_key=api_key)
        logger.info("GeminiClient initialized with model: %s", self._model_name)

    # ── Public API ───────────────────────────────────────────────

    def generate_json(
        self,
        prompt: str,
        fallback: dict[str, Any],
        call_label: str = "gemini",
    ) -> dict[str, Any]:
        """
        Send a prompt to Gemini and parse the response as JSON.

        Args:
            prompt:     The full prompt string.
            fallback:   Dict to return if the API call fails for any reason.
            call_label: Label for logging (e.g. "call_1_gaps", "call_2_ideas").

        Returns:
            Parsed JSON dict from Gemini, or `fallback` on any error.
        """
        if self._client is None:
            logger.warning("[%s] No client configured — returning fallback.", call_label)
            return fallback

        try:
            logger.info("[%s] Sending prompt (%d chars) to %s…",
                        call_label, len(prompt), self._model_name)

            response = self._client.models.generate_content(
                model=self._model_name,
                contents=prompt,
            )

            raw_text = response.text
            logger.info("[%s] Received response (%d chars).", call_label, len(raw_text))

            parsed = self._extract_json(raw_text)
            if parsed is None:
                logger.error("[%s] Failed to parse JSON from response. Raw text:\n%s",
                             call_label, raw_text[:500])
                return fallback

            return parsed

        except Exception as exc:
            logger.error("[%s] Gemini API error: %s", call_label, exc, exc_info=True)
            return fallback

    # ── Private helpers ──────────────────────────────────────────

    @staticmethod
    def _extract_json(text: str) -> Optional[dict[str, Any]]:
        """
        Extract JSON from a Gemini response that may contain markdown fences.

        Tries three strategies in order:
        1. Extract content between ```json ... ``` fences
        2. Extract content between { ... } (greedy outermost match)
        3. Direct json.loads() on the raw text
        """
        # Strategy 1: markdown fenced block
        fence_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
        if fence_match:
            try:
                return json.loads(fence_match.group(1))
            except json.JSONDecodeError:
                pass

        # Strategy 2: outermost braces
        brace_match = re.search(r"\{.*\}", text, re.DOTALL)
        if brace_match:
            try:
                return json.loads(brace_match.group(0))
            except json.JSONDecodeError:
                pass

        # Strategy 3: raw text
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return None
