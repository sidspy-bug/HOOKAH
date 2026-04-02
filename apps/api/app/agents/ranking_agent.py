from __future__ import annotations

from typing import Any


class RankingAgent:
    def rank(
        self,
        gaps: list[dict[str, Any]],
        directions: list[dict[str, Any]],
        critical_reasoning: dict[str, list[str]],
    ) -> list[dict[str, Any]]:
        linked = self._merge_gap_direction(gaps, directions, critical_reasoning)
        scored: list[dict[str, Any]] = []
        for insight in linked:
            novelty = self._score(insight["scores"].get("novelty"), 7.4)
            feasibility = self._score(insight["scores"].get("feasibility"), 7.0)
            impact_score = self._score(insight["scores"].get("impact"), 8.2)
            depth_score = self._score(insight.get("depth_score"), 7.4)

            overall = round((novelty * 0.4) + (feasibility * 0.3) + (impact_score * 0.3), 2)
            criticality = round((novelty * 0.3) + (impact_score * 0.35) + (depth_score * 0.35), 2)

            insight["scores"] = {
                "novelty": novelty,
                "feasibility": feasibility,
                "impact": impact_score,
            }
            insight["depth_score"] = depth_score
            insight["overall_score"] = overall
            insight["criticality_score"] = criticality
            scored.append(insight)

        return sorted(
            scored,
            key=lambda item: (item.get("criticality_score", 0.0), item.get("overall_score", 0.0)),
            reverse=True,
        )

    def _merge_gap_direction(
        self,
        gaps: list[dict[str, Any]],
        directions: list[dict[str, Any]],
        critical_reasoning: dict[str, list[str]],
    ) -> list[dict[str, Any]]:
        if not gaps:
            return []

        by_gap: dict[str, dict[str, Any]] = {}
        for direction in directions:
            key = str(direction.get("gap_title", "")).strip().lower()
            if key:
                by_gap[key] = direction

        critical_map = self._critical_map(gaps, critical_reasoning)

        merged: list[dict[str, Any]] = []
        for idx, gap in enumerate(gaps):
            key = str(gap.get("title", "")).strip().lower()
            direction = by_gap.get(key)
            if direction is None and directions:
                direction = directions[idx % len(directions)]

            if direction is None:
                direction = {
                    "title": "Focused validation direction",
                    "approach": "Run a practical evaluation program with deployment-facing metrics, causal diagnostics, and reproducibility checks.",
                    "scores": {"novelty": 7.3, "feasibility": 7.0, "impact": 8.4},
                }

            critical = critical_map[idx]
            merged.append(
                {
                    "title": gap.get("title", "Evidence-grounded gap"),
                    "problem": gap.get("problem", ""),
                    "evidence": gap.get("evidence", []),
                    "why_gap_exists": gap.get("why_gap_exists", ""),
                    "why_it_matters": gap.get("why_it_matters", ""),
                    "vulnerability": gap.get("vulnerability", "medium"),
                    "impact": gap.get("impact", "high"),
                    "confidence": self._confidence(gap.get("confidence")),
                    "depth_score": self._score(gap.get("depth_score"), 7.4),
                    "hidden_assumption": critical["hidden_assumption"],
                    "methodological_weakness": critical["methodological_weakness"],
                    "conceptual_gap": critical["conceptual_gap"],
                    "contradiction": critical["contradiction"],
                    "deep_insight": critical["deep_insight"],
                    "direction": {
                        "title": str(direction.get("title", "Targeted research direction")),
                        "approach": str(direction.get("approach", "")),
                    },
                    "scores": direction.get("scores", {"novelty": 7.2, "feasibility": 7.0, "impact": 8.2}),
                    "overall_score": 0.0,
                    "criticality_score": 0.0,
                }
            )

        return merged

    def _critical_map(
        self,
        gaps: list[dict[str, Any]],
        critical_reasoning: dict[str, list[str]],
    ) -> list[dict[str, str]]:
        bundles: list[dict[str, str]] = []
        assumptions = critical_reasoning.get("hidden_assumptions", [])
        weaknesses = critical_reasoning.get("methodological_weaknesses", [])
        concepts = critical_reasoning.get("conceptual_gaps", [])
        contradictions = critical_reasoning.get("contradictions", [])
        insights = critical_reasoning.get("deep_insights", [])

        for index, gap in enumerate(gaps):
            bundles.append(
                {
                    "hidden_assumption": self._pick_best(gap, assumptions, index, "The work relies on an implicit assumption that remains under-tested."),
                    "methodological_weakness": self._pick_best(
                        gap,
                        weaknesses,
                        index,
                        "Method choices leave important confounders or causal drivers under-identified.",
                    ),
                    "conceptual_gap": self._pick_best(
                        gap,
                        concepts,
                        index,
                        "The conceptual framing does not fully explain when the method should stop working.",
                    ),
                    "contradiction": self._pick_best(
                        gap,
                        contradictions,
                        index,
                        "The strength of the claims appears broader than the direct evidentiary design can fully support.",
                    ),
                    "deep_insight": self._pick_best(
                        gap,
                        insights,
                        index,
                        "The deeper issue is that the strongest-looking results may depend on hidden conditions the paper does not adequately model.",
                    ),
                }
            )
        return bundles

    def _pick_best(
        self,
        gap: dict[str, Any],
        candidates: list[str],
        index: int,
        default: str,
    ) -> str:
        if not candidates:
            return default

        gap_tokens = self._tokens(" ".join([str(gap.get("title", "")), str(gap.get("problem", ""))]))
        best_item = candidates[index % len(candidates)]
        best_score = -1
        for candidate in candidates:
            score = len(gap_tokens.intersection(self._tokens(candidate)))
            if score > best_score:
                best_item = candidate
                best_score = score
        return " ".join(str(best_item).split())[:700]

    @staticmethod
    def _tokens(text: str) -> set[str]:
        return {token for token in "".join(ch if ch.isalnum() else " " for ch in text.lower()).split() if len(token) >= 5}

    @staticmethod
    def _score(value: Any, default: float) -> float:
        try:
            return round(max(0.0, min(float(value), 10.0)), 2)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _confidence(value: Any) -> float:
        try:
            return round(max(0.0, min(float(value), 1.0)), 2)
        except (TypeError, ValueError):
            return 0.72
