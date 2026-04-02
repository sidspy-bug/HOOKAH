from __future__ import annotations

from typing import Any

from app.agents.llm_utils import generate_json_with_retry
from app.agents.quality_guards import validate_directions


class DirectionAgent:
    def generate(
        self,
        gaps: list[dict[str, Any]],
        title: str,
        critical_reasoning: dict[str, list[str]] | None = None,
    ) -> list[dict[str, Any]]:
        fallback = {
            "directions": [
                {
                    "gap_title": "External validity is inferred from optimization evidence rather than demonstrated under operational variation",
                    "title": "Shift-aware validity mapping study",
                    "approach": "Test the method across deliberately varied operational contexts, model which environmental variables break performance assumptions, and publish a boundary-condition map instead of a single headline score.",
                    "scores": {"novelty": 8.2, "feasibility": 6.9, "impact": 9.0},
                },
                {
                    "gap_title": "Method effectiveness may be confounded by dataset alignment rather than the claimed mechanism",
                    "title": "Mechanism-isolating causal evaluation design",
                    "approach": "Use stronger ablations, counterfactual controls, and benchmark redesign to separate true method contribution from dataset alignment effects.",
                    "scores": {"novelty": 8.6, "feasibility": 6.8, "impact": 8.7},
                },
                {
                    "gap_title": "The paper under-theorizes when the approach should fail and what that says about the domain",
                    "title": "Failure-first theory building program",
                    "approach": "Treat failure cases as primary data, derive a structured taxonomy of breakdown modes, and connect each failure class to revised design or theory hypotheses.",
                    "scores": {"novelty": 8.4, "feasibility": 7.1, "impact": 8.8},
                },
            ]
        }

        prompt = f"""You are a research direction generation system.

Generate actionable directions linked to specific non-obvious gaps.

Rules:
- every direction must solve one specific gap
- practical and implementable
- connected to real-world application
- use the critical reasoning context to avoid shallow suggestions
- never mention OCR, extraction, file format, or document layout
- strict JSON only
- no empty fields

JSON schema:
{{
  "directions": [
    {{
      "gap_title": "string",
      "title": "string",
      "approach": "string",
      "scores": {{
        "novelty": 0-10,
        "feasibility": 0-10,
        "impact": 0-10
      }}
    }}
  ]
}}

PAPER TITLE: {title}
GAPS JSON:
{gaps}
CRITICAL REASONING JSON:
{critical_reasoning or {}}
"""
        parsed = generate_json_with_retry(
            prompt,
            fallback,
            validator=validate_directions,
            stage_name="direction_generation",
        )
        directions = parsed.get("directions", [])
        if not isinstance(directions, list):
            return fallback["directions"]

        normalized: list[dict[str, Any]] = []
        for index, direction in enumerate(directions):
            scores = direction.get("scores", {})
            if not isinstance(scores, dict):
                scores = {}
            normalized.append(
                {
                    "gap_title": self._clean(
                        direction.get("gap_title"),
                        gaps[index]["title"] if index < len(gaps) else "Evidence-grounded gap",
                    ),
                    "title": self._clean(direction.get("title"), "Targeted research direction"),
                    "approach": self._clean(
                        direction.get("approach"),
                        "Design a concrete intervention protocol with measurable outcomes, mechanism checks, and deployment-facing validation.",
                    ),
                    "scores": {
                        "novelty": self._score(scores.get("novelty"), 7.5),
                        "feasibility": self._score(scores.get("feasibility"), 7.0),
                        "impact": self._score(scores.get("impact"), 8.3),
                    },
                }
            )

        return normalized[:5] if len(normalized) >= 3 else fallback["directions"]

    @staticmethod
    def _clean(value: Any, default: str = "") -> str:
        text = " ".join(str(value or "").split())
        return text[:750] if text else default

    @staticmethod
    def _score(value: Any, default: float) -> float:
        try:
            return round(max(0.0, min(float(value), 10.0)), 2)
        except (TypeError, ValueError):
            return default
