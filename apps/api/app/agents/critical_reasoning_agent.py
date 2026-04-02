from __future__ import annotations

from typing import Any

from app.agents.llm_utils import generate_json_with_retry
from app.agents.quality_guards import validate_critical_reasoning


class CriticalReasoningAgent:
    def analyze(
        self,
        title: str,
        overview: dict[str, Any],
        grouped_limitations: list[dict[str, Any]],
        gaps: list[dict[str, Any]],
        text: str,
    ) -> dict[str, list[str]]:
        fallback = {
            "hidden_assumptions": [
                "The study assumes performance on curated evaluation settings is a reliable proxy for messy real-world use, despite weak evidence about context drift.",
                "The paper implicitly treats measured outputs as sufficient indicators of utility, without modeling whether users or institutions respond differently under operational pressure.",
            ],
            "methodological_weaknesses": [
                "Method choices favor internal benchmark gains over designs that would expose causal drivers, making it difficult to separate true mechanism from dataset alignment.",
                "The evaluation logic under-specifies confounders that could explain reported improvements, especially when baseline comparability is not deeply interrogated.",
            ],
            "conceptual_gaps": [
                "The work optimizes for prediction quality but leaves the theory of when the method should fail under-articulated, limiting scientific learning from errors.",
                "Important contextual variables appear compressed into aggregate outcomes, which hides the boundary conditions that matter most for transfer.",
            ],
            "contradictions": [
                "The paper presents broad claims of robustness while the evidentiary design remains narrower than the scope of those claims.",
                "Interpretability or deployment value is implied as a downstream benefit without enough direct evidence tying the method to those practical outcomes.",
            ],
            "deep_insights": [
                "The deeper issue may not be a single weak result, but a mismatch between what the study measures and what stakeholders would need to trust the method in practice.",
                "A likely hidden bottleneck is that methodological success depends on unmeasured contextual stability, so the strongest-looking results may be the least transportable.",
            ],
        }

        prompt = f"""You are a critical reasoning agent for academic review.

Your job is not to restate the paper or repeat limitations. Go beyond the explicit text.

Identify:
- hidden assumptions
- methodological weaknesses
- conceptual gaps
- contradictions or overclaims
- deep insights that infer implications beyond the paper

Rules:
- do not summarize the paper
- do not restate existing limitations verbatim
- challenge the logic of design choices
- infer missing variables, confounders, and unstated dependencies
- never mention OCR, extraction, file format, or document layout
- output strict JSON only

JSON schema:
{{
  "hidden_assumptions": ["string", "string"],
  "methodological_weaknesses": ["string", "string"],
  "conceptual_gaps": ["string", "string"],
  "contradictions": ["string", "string"],
  "deep_insights": ["string", "string"]
}}

PAPER TITLE: {title}
OVERVIEW JSON: {overview}
GROUPED LIMITATIONS JSON: {grouped_limitations}
CURRENT GAPS JSON: {gaps}
PAPER TEXT:
\"\"\"
{text[:12000]}
\"\"\"
"""
        parsed = generate_json_with_retry(
            prompt,
            fallback,
            validator=validate_critical_reasoning,
            stage_name="critical_reasoning",
        )
        return {
            "hidden_assumptions": self._normalize_list(parsed.get("hidden_assumptions"), fallback["hidden_assumptions"]),
            "methodological_weaknesses": self._normalize_list(
                parsed.get("methodological_weaknesses"),
                fallback["methodological_weaknesses"],
            ),
            "conceptual_gaps": self._normalize_list(parsed.get("conceptual_gaps"), fallback["conceptual_gaps"]),
            "contradictions": self._normalize_list(parsed.get("contradictions"), fallback["contradictions"]),
            "deep_insights": self._normalize_list(parsed.get("deep_insights"), fallback["deep_insights"]),
        }

    @staticmethod
    def _normalize_list(value: Any, fallback: list[str]) -> list[str]:
        if isinstance(value, list):
            cleaned = [" ".join(str(item).split()) for item in value if str(item).strip()]
        else:
            cleaned = []
        return (cleaned or fallback)[:4]
