from __future__ import annotations

from typing import Any

from app.agents.llm_utils import generate_json_with_retry
from app.agents.quality_guards import validate_improvement_plan, validate_review


class ReviewerAgent:
    def review(
        self,
        title: str,
        overview: dict[str, Any],
        grouped_limitations: list[dict[str, Any]],
        gaps: list[dict[str, Any]],
        critical_reasoning: dict[str, list[str]],
    ) -> dict[str, Any]:
        fallback = {
            "approved": True,
            "needs_regeneration": False,
            "feedback": "The draft is reasonably insightful, but the strongest version should continue emphasizing causal reasoning, hidden assumptions, and consequences beyond the author discussion.",
            "gap_reviews": [
                {
                    "title": gap.get("title", f"Gap {index + 1}"),
                    "depth_score": self._depth(gap.get("depth_score"), 7.2),
                    "is_obvious": False,
                    "reasoning_note": "The gap links evidence to an underlying research failure mode rather than only naming a visible limitation.",
                    "revision_focus": "Tighten causal reasoning and state the hidden assumption driving the unresolved problem.",
                }
                for index, gap in enumerate(gaps[:5])
            ]
            or [
                {
                    "title": "Evidence-grounded gap",
                    "depth_score": 7.2,
                    "is_obvious": False,
                    "reasoning_note": "The draft goes beyond paraphrase and identifies an underlying research issue.",
                    "revision_focus": "Increase specificity about causal mechanisms and scientific consequences.",
                }
            ],
        }

        prompt = f"""You are a reviewer agent for a research intelligence system.

Review the generated gaps and decide whether they are genuinely insightful.

Ask:
- Is this obvious or insightful?
- Does this go beyond the paper?
- Does it reveal hidden logic, not just repeat limitations?

If the output is generic, predictable, or textbook-level:
- set approved to false
- set needs_regeneration to true
- explain why

Rules:
- be strict
- reward non-obvious causal reasoning
- penalize paraphrases of explicit limitations
- assign depth_score from 1 to 10 for each gap
- if a gap is below 7, it should not be treated as strong enough
- output strict JSON only

JSON schema:
{{
  "approved": true,
  "needs_regeneration": false,
  "feedback": "string",
  "gap_reviews": [
    {{
      "title": "string",
      "depth_score": 0-10,
      "is_obvious": false,
      "reasoning_note": "string",
      "revision_focus": "string"
    }}
  ]
}}

PAPER TITLE: {title}
OVERVIEW JSON: {overview}
GROUPED LIMITATIONS JSON: {grouped_limitations}
GAPS JSON: {gaps}
CRITICAL REASONING JSON: {critical_reasoning}
"""
        parsed = generate_json_with_retry(
            prompt,
            fallback,
            validator=validate_review,
            stage_name="reviewer",
        )

        gap_reviews = parsed.get("gap_reviews", [])
        if not isinstance(gap_reviews, list) or not gap_reviews:
            gap_reviews = fallback["gap_reviews"]

        normalized_reviews: list[dict[str, Any]] = []
        low_depth_found = False
        obvious_found = False
        for index, review in enumerate(gap_reviews[:5]):
            depth_score = self._depth(review.get("depth_score"), 6.8)
            is_obvious = bool(review.get("is_obvious", False))
            low_depth_found = low_depth_found or depth_score < 7.0
            obvious_found = obvious_found or is_obvious
            normalized_reviews.append(
                {
                    "title": self._clean(review.get("title"), gaps[index]["title"] if index < len(gaps) else "Evidence-grounded gap"),
                    "depth_score": depth_score,
                    "is_obvious": is_obvious,
                    "reasoning_note": self._clean(
                        review.get("reasoning_note"),
                        "The gap is useful only if it reveals a deeper causal problem rather than paraphrasing a visible limitation.",
                    ),
                    "revision_focus": self._clean(
                        review.get("revision_focus"),
                        "State the hidden assumption, causal mechanism, and downstream consequence more explicitly.",
                    ),
                }
            )

        feedback = self._clean(
            parsed.get("feedback"),
            fallback["feedback"],
        )
        approved = bool(parsed.get("approved", True))
        needs_regeneration = bool(parsed.get("needs_regeneration", False))

        if low_depth_found or obvious_found:
            approved = False
            needs_regeneration = True

        return {
            "approved": approved,
            "needs_regeneration": needs_regeneration,
            "feedback": feedback,
            "gap_reviews": normalized_reviews,
        }

    def suggest_improvements(
        self,
        title: str,
        overview: dict[str, Any],
        insights: list[dict[str, Any]],
        critical_reasoning: dict[str, list[str]],
    ) -> dict[str, list[str]]:
        fallback = {
            "missing_angles": [
                "Probe whether unmeasured contextual factors are stronger drivers of outcomes than the paper assumes.",
                "Examine whether boundary-case failures reveal a different mechanism than the one emphasized by the main narrative.",
            ],
            "additional_perspectives": [
                "Add stakeholder, deployment, or decision-theoretic perspectives instead of relying only on aggregate technical performance.",
                "Interrogate whether subgroup or environment-specific tradeoffs change the interpretation of the claimed contribution.",
            ],
            "future_improvements": [
                "Pair performance evaluation with causal diagnostics that distinguish true method value from benchmark alignment.",
                "Design follow-up studies that expose hidden dependencies before scaling conclusions to broader settings.",
            ],
        }

        prompt = f"""You are reflecting on a completed research intelligence analysis.

Answer this question:
"How can this analysis be improved further?"

Generate:
- missing angles
- additional perspectives
- future improvements

Rules:
- do not repeat the same insight three times
- keep suggestions analytical and academically useful
- push the analysis toward hidden variables, alternative interpretations, and stronger critique
- output strict JSON only

JSON schema:
{{
  "missing_angles": ["string", "string"],
  "additional_perspectives": ["string", "string"],
  "future_improvements": ["string", "string"]
}}

PAPER TITLE: {title}
OVERVIEW JSON: {overview}
INSIGHTS JSON: {insights}
CRITICAL REASONING JSON: {critical_reasoning}
"""
        parsed = generate_json_with_retry(
            prompt,
            fallback,
            validator=validate_improvement_plan,
            stage_name="analysis_improvement",
        )
        return {
            "missing_angles": self._list(parsed.get("missing_angles"), fallback["missing_angles"]),
            "additional_perspectives": self._list(
                parsed.get("additional_perspectives"),
                fallback["additional_perspectives"],
            ),
            "future_improvements": self._list(
                parsed.get("future_improvements"),
                fallback["future_improvements"],
            ),
        }

    @staticmethod
    def _clean(value: Any, default: str = "") -> str:
        text = " ".join(str(value or "").split())
        return text[:700] if text else default

    @staticmethod
    def _depth(value: Any, default: float) -> float:
        try:
            return round(max(1.0, min(float(value), 10.0)), 2)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _list(value: Any, fallback: list[str]) -> list[str]:
        if isinstance(value, list):
            cleaned = [" ".join(str(item).split()) for item in value if str(item).strip()]
        else:
            cleaned = []
        return (cleaned or fallback)[:4]
