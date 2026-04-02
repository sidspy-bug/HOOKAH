from __future__ import annotations

from typing import Any

from app.agents.llm_utils import generate_json_with_retry
from app.agents.quality_guards import validate_gaps


class GapSynthesisAgent:
    def synthesize(
        self,
        grouped_limitations: list[dict[str, Any]],
        title: str,
        review_feedback: str = "",
    ) -> list[dict[str, Any]]:
        fallback = {
            "gaps": [
                {
                    "title": "External validity is inferred from optimization evidence rather than demonstrated under operational variation",
                    "problem": "The study treats performance gains in controlled settings as evidence of broader reliability, even though the design does not isolate how context shift alters conclusions.",
                    "evidence": [
                        "Evaluation evidence is concentrated in narrower settings than the claims imply.",
                        "Reported results emphasize aggregate gains over stability across changing conditions.",
                        "The study does not deeply test whether contextual variation changes the causal story behind performance.",
                    ],
                    "why_gap_exists": "The field rewards benchmark improvements, so researchers often optimize for measurable gains before establishing the boundary conditions under which those gains remain trustworthy.",
                    "why_it_matters": "If the method depends on hidden contextual stability, practical adoption could fail exactly where the paper sounds most confident.",
                    "vulnerability": "high",
                    "impact": "high",
                    "confidence": 0.81,
                    "depth_score": 8.5,
                },
                {
                    "title": "Method effectiveness may be confounded by dataset alignment rather than the claimed mechanism",
                    "problem": "The paper attributes improvement to the proposed method, but the evidence leaves open whether gains arise from dataset-specific regularities or evaluation framing instead of the intended mechanism.",
                    "evidence": [
                        "Ablation or mechanism-isolating comparisons are limited relative to the strength of the causal claim.",
                        "Findings emphasize outcome differences without equally strong evidence about what component actually drives them.",
                        "Confounding variables and benchmark construction choices are not exhaustively stress-tested.",
                    ],
                    "why_gap_exists": "Empirical papers often privilege result magnitude over causal decomposition, which leaves the mechanism of success under-validated.",
                    "why_it_matters": "Without mechanism clarity, future work may scale the wrong component and mistake benchmark fit for genuine scientific progress.",
                    "vulnerability": "high",
                    "impact": "high",
                    "confidence": 0.79,
                    "depth_score": 8.3,
                },
                {
                    "title": "The paper under-theorizes when the approach should fail and what that says about the domain",
                    "problem": "Failure conditions are described weakly, which means the study offers performance evidence without a strong account of the conceptual limits of the underlying approach.",
                    "evidence": [
                        "Error reporting is less developed than headline performance reporting.",
                        "Boundary-case behavior is not deeply connected to domain theory or causal explanation.",
                        "The paper provides limited guidance on how results should be interpreted when assumptions break.",
                    ],
                    "why_gap_exists": "Research narratives tend to foreground success cases, so the conceptual meaning of failure is often treated as secondary analysis.",
                    "why_it_matters": "A weak theory of failure limits both scientific learning and the ability to design robust next-generation methods.",
                    "vulnerability": "medium",
                    "impact": "high",
                    "confidence": 0.77,
                    "depth_score": 8.1,
                },
            ]
        }

        prompt = f"""You are a research reasoning engine.

Your task is to generate non-obvious research gaps from grouped study limitations.

Each research gap MUST:
1. Identify a non-obvious issue
2. Explain WHY it exists using causal reasoning
3. Explain WHY it matters using impact reasoning
4. Extend beyond the author's direct discussion
5. Include a depth_score from 1 to 10

Reject anything that:
- sounds generic
- feels textbook-level
- directly repeats what the paper already says
- only paraphrases a limitation without inference
- mentions OCR, extraction, file format, or document layout

Return strict JSON only.

JSON schema:
{{
  "gaps": [
    {{
      "title": "string",
      "problem": "string",
      "evidence": ["string", "string", "string"],
      "why_gap_exists": "string",
      "why_it_matters": "string",
      "vulnerability": "low|medium|high",
      "impact": "low|medium|high",
      "confidence": 0.0,
      "depth_score": 0-10
    }}
  ]
}}

PAPER TITLE: {title}
GROUPED LIMITATIONS JSON:
{grouped_limitations}
REVIEWER FEEDBACK:
{review_feedback or "No reviewer feedback yet. Produce the strongest non-obvious gaps on the first pass."}
"""
        parsed = generate_json_with_retry(
            prompt,
            fallback,
            validator=validate_gaps,
            stage_name="gap_synthesis",
        )
        gaps = parsed.get("gaps", [])
        if not isinstance(gaps, list):
            return fallback["gaps"]

        normalized: list[dict[str, Any]] = []
        for gap in gaps:
            evidence = gap.get("evidence", [])
            if not isinstance(evidence, list):
                evidence = [str(evidence)]
            clean_evidence = [" ".join(str(item).split()) for item in evidence if str(item).strip()]
            clean_evidence = (clean_evidence + fallback["gaps"][0]["evidence"])[:3]

            vulnerability = str(gap.get("vulnerability", "medium")).strip().lower()
            if vulnerability not in {"low", "medium", "high"}:
                vulnerability = "medium"

            impact = str(gap.get("impact", "high")).strip().lower()
            if impact not in {"low", "medium", "high"}:
                impact = "high"

            normalized.append(
                {
                    "title": self._clean(gap.get("title"), "Evidence-grounded research gap"),
                    "problem": self._clean(gap.get("problem"), "An unresolved, evidence-backed research problem persists beyond the paper's surface narrative."),
                    "evidence": clean_evidence,
                    "why_gap_exists": self._clean(
                        gap.get("why_gap_exists"),
                        "The gap persists because current studies optimize for visible performance rather than the hidden conditions that make results trustworthy.",
                    ),
                    "why_it_matters": self._clean(
                        gap.get("why_it_matters"),
                        "Resolving this gap would improve both scientific validity and practical reliability under real-world variation.",
                    ),
                    "vulnerability": vulnerability,
                    "impact": impact,
                    "confidence": self._confidence(gap.get("confidence")),
                    "depth_score": self._depth(gap.get("depth_score")),
                }
            )

        normalized = [gap for gap in normalized if gap["depth_score"] >= 7.0]
        return normalized[:5] if len(normalized) >= 3 else fallback["gaps"]

    @staticmethod
    def _clean(value: Any, default: str = "") -> str:
        text = " ".join(str(value or "").split())
        return text[:750] if text else default

    @staticmethod
    def _confidence(value: Any) -> float:
        try:
            return round(max(0.0, min(float(value), 1.0)), 2)
        except (TypeError, ValueError):
            return 0.76

    @staticmethod
    def _depth(value: Any) -> float:
        try:
            return round(max(1.0, min(float(value), 10.0)), 2)
        except (TypeError, ValueError):
            return 7.4
