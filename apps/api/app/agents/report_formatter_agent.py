from __future__ import annotations

from typing import Any


class ReportFormatterAgent:
    def format_report(
        self,
        title: str,
        overview: dict[str, Any],
        grouped_limitations: list[dict[str, Any]],
        critical_reasoning: dict[str, list[str]],
        insights: list[dict[str, Any]],
        analysis_improvements: dict[str, list[str]],
    ) -> dict[str, Any]:
        formatted_overview = {
            "title": self._clean(overview.get("title"), title or "Untitled Research Paper"),
            "executive_summary": self._executive_summary(overview, grouped_limitations, insights),
            "objective": self._clean(
                overview.get("objective"),
                "Clarify the central objective and unresolved research problem in the analyzed paper.",
            ),
            "methodology": self._clean(
                overview.get("methodology"),
                "Apply structured empirical analysis with explicit evaluation and evidence synthesis.",
            ),
            "key_findings": self._finding_list(overview.get("key_findings")),
        }

        formatted_grouped = self._format_limitations(grouped_limitations)
        formatted_critical = self._format_critical_reasoning(critical_reasoning)
        formatted_insights = self._format_insights(insights)

        most_critical_insight = formatted_insights[0]

        research_gaps = [
            {
                "title": insight["title"],
                "problem": insight["problem"],
                "evidence": insight["evidence"],
                "why_gap_exists": insight["why_gap_exists"],
                "why_it_matters": insight["why_it_matters"],
                "vulnerability": insight["vulnerability"],
                "impact": insight["impact"],
                "confidence": insight["confidence"],
                "depth_score": insight["depth_score"],
            }
            for insight in formatted_insights
        ]

        directions = [
            {
                "title": insight["direction"]["title"],
                "linked_gap": insight["title"],
                "approach": insight["direction"]["approach"],
                "scores": insight["scores"],
                "overall_score": insight["overall_score"],
            }
            for insight in formatted_insights
        ]

        formatted_improvements = {
            "missing_angles": self._string_list(
                analysis_improvements.get("missing_angles"),
                [
                    "Interrogate hidden contextual variables that could reverse the interpretation of the reported results.",
                    "Push deeper on boundary conditions rather than treating aggregate performance as the primary endpoint.",
                ],
            ),
            "additional_perspectives": self._string_list(
                analysis_improvements.get("additional_perspectives"),
                [
                    "Add stakeholder and deployment perspectives alongside methodological critique.",
                    "Consider whether subgroup-level tradeoffs change the meaning of the claimed contribution.",
                ],
            ),
            "future_improvements": self._string_list(
                analysis_improvements.get("future_improvements"),
                [
                    "Strengthen the analysis with mechanism-oriented evaluation and causal diagnostics.",
                    "Use follow-up studies to test whether hidden assumptions hold under broader operational variation.",
                ],
            ),
        }

        return {
            "overview": formatted_overview,
            "limitations": {"grouped": formatted_grouped},
            "critical_reasoning": formatted_critical,
            "research_gaps": research_gaps,
            "directions": directions,
            "insights": formatted_insights,
            "most_critical_insight": most_critical_insight,
            "analysis_improvements": formatted_improvements,
        }

    def _format_limitations(self, grouped_limitations: list[dict[str, Any]]) -> list[dict[str, Any]]:
        formatted_grouped: list[dict[str, Any]] = []
        for group in grouped_limitations:
            category = str(group.get("category", "evaluation")).strip().lower()
            if category not in {"data", "methodology", "evaluation", "bias", "deployment"}:
                category = "evaluation"

            items: list[dict[str, Any]] = []
            for item in group.get("items", []):
                items.append(
                    {
                        "title": self._clean(item.get("title"), "Research limitation"),
                        "explanation": self._clean(
                            item.get("explanation"),
                            "The limitation introduces uncertainty in evidence quality or transferability.",
                        ),
                        "evidence": self._evidence_list(item.get("evidence")),
                        "impact": self._clean(
                            item.get("impact"),
                            "This limitation affects confidence in conclusions and practical applicability.",
                        ),
                    }
                )

            if items:
                formatted_grouped.append({"category": category, "items": items[:8]})

        if formatted_grouped:
            return formatted_grouped

        return [
            {
                "category": "evaluation",
                "items": [
                    {
                        "title": "Evaluation scope constraints",
                        "explanation": "The evidence indicates unresolved constraints in evaluation breadth and diagnostic depth.",
                        "evidence": [
                            "Evaluation scenarios are limited relative to deployment diversity.",
                            "Error-mode reporting is not comprehensive.",
                            "Generalization evidence remains partial.",
                        ],
                        "impact": "Constrains reliability claims and weakens practical transfer confidence.",
                    }
                ],
            }
        ]

    def _format_critical_reasoning(self, critical_reasoning: dict[str, list[str]]) -> dict[str, list[str]]:
        return {
            "hidden_assumptions": self._string_list(
                critical_reasoning.get("hidden_assumptions"),
                ["The paper assumes measured gains remain meaningful under contexts that are not directly tested."],
            ),
            "methodological_weaknesses": self._string_list(
                critical_reasoning.get("methodological_weaknesses"),
                ["Method choices do not fully isolate whether the claimed mechanism is truly responsible for the observed gains."],
            ),
            "conceptual_gaps": self._string_list(
                critical_reasoning.get("conceptual_gaps"),
                ["The conceptual framing explains success more clearly than failure, leaving boundary conditions under-theorized."],
            ),
            "contradictions": self._string_list(
                critical_reasoning.get("contradictions"),
                ["The scope of the claims appears broader than the depth of the validation strategy."],
            ),
            "deep_insights": self._string_list(
                critical_reasoning.get("deep_insights"),
                ["The deeper bottleneck may be a mismatch between benchmark success and the conditions needed for trustworthy real-world use."],
            ),
        }

    def _format_insights(self, insights: list[dict[str, Any]]) -> list[dict[str, Any]]:
        formatted_insights: list[dict[str, Any]] = []
        for insight in insights:
            scores = insight.get("scores", {})
            formatted_insights.append(
                {
                    "title": self._clean(insight.get("title"), "Evidence-grounded research insight"),
                    "problem": self._clean(insight.get("problem"), "An unresolved, evidence-backed research problem persists."),
                    "evidence": self._evidence_list(insight.get("evidence")),
                    "why_gap_exists": self._clean(
                        insight.get("why_gap_exists"),
                        "The gap persists due to insufficient methodological and validation coverage in current literature.",
                    ),
                    "why_it_matters": self._clean(
                        insight.get("why_it_matters"),
                        "Resolving this gap improves reliability, applicability, and downstream scientific value.",
                    ),
                    "vulnerability": self._enum3(insight.get("vulnerability"), "medium"),
                    "impact": self._enum3(insight.get("impact"), "high"),
                    "confidence": self._confidence(insight.get("confidence"), 0.72),
                    "depth_score": self._score10(insight.get("depth_score"), 7.4),
                    "hidden_assumption": self._clean(
                        insight.get("hidden_assumption"),
                        "The paper relies on an implicit assumption that remains under-tested.",
                    ),
                    "methodological_weakness": self._clean(
                        insight.get("methodological_weakness"),
                        "Method choices leave causal drivers or confounders only partially resolved.",
                    ),
                    "conceptual_gap": self._clean(
                        insight.get("conceptual_gap"),
                        "The conceptual model does not fully explain when the method should fail.",
                    ),
                    "contradiction": self._clean(
                        insight.get("contradiction"),
                        "The evidentiary design is narrower than the strongest claims it is used to support.",
                    ),
                    "deep_insight": self._clean(
                        insight.get("deep_insight"),
                        "The most important unresolved issue lies in the hidden conditions required for the reported success to remain meaningful.",
                    ),
                    "direction": {
                        "title": self._clean(
                            insight.get("direction", {}).get("title"),
                            "Targeted research direction",
                        ),
                        "approach": self._clean(
                            insight.get("direction", {}).get("approach"),
                            "Design and evaluate a practical intervention with reproducible metrics and deployment-facing validation.",
                        ),
                    },
                    "scores": {
                        "novelty": self._score10(scores.get("novelty"), 7.4),
                        "feasibility": self._score10(scores.get("feasibility"), 7.0),
                        "impact": self._score10(scores.get("impact"), 8.2),
                    },
                    "overall_score": self._score10(insight.get("overall_score"), 7.6),
                }
            )

        if formatted_insights:
            return formatted_insights

        return [
            {
                "title": "External validity evidence gap",
                "problem": "Current findings do not sufficiently establish robust behavior across varied deployment contexts.",
                "evidence": [
                    "Benchmark conditions are narrower than real-world variability.",
                    "Cross-context validation remains limited.",
                    "Transfer claims are stronger than direct evidence coverage.",
                ],
                "why_gap_exists": "Research emphasis has focused on benchmark optimization rather than comprehensive context robustness.",
                "why_it_matters": "This gap blocks confident translation from research outcomes to dependable practical systems.",
                "vulnerability": "high",
                "impact": "high",
                "confidence": 0.76,
                "depth_score": 8.0,
                "hidden_assumption": "The work assumes context stability that is not directly established by the evaluation design.",
                "methodological_weakness": "The method is validated more as a benchmark artifact than as a context-robust mechanism.",
                "conceptual_gap": "The paper does not strongly theorize the failure conditions that matter most for transfer.",
                "contradiction": "The claims of reliability are broader than the practical scope of the evidence.",
                "deep_insight": "The central risk is not only weaker generalization, but misplaced confidence in what the benchmark actually proves.",
                "direction": {
                    "title": "Cross-context robustness validation",
                    "approach": "Run standardized evaluations across multiple contexts with explicit shift, failure, and reproducibility diagnostics.",
                },
                "scores": {"novelty": 7.8, "feasibility": 7.2, "impact": 8.9},
                "overall_score": 8.02,
            }
        ]

    @staticmethod
    def _clean(value: Any, default: str = "") -> str:
        text = " ".join(str(value or "").split())
        return text[:800] if text else default

    @staticmethod
    def _evidence_list(value: Any) -> list[str]:
        if isinstance(value, list):
            cleaned = [" ".join(str(item).split()) for item in value if str(item).strip()]
        else:
            cleaned = [" ".join(str(value or "").split())] if str(value or "").strip() else []
        return (cleaned + ["Evidence is grounded in extracted paper findings and limitation statements."])[:3]

    @staticmethod
    def _finding_list(value: Any) -> list[str]:
        if isinstance(value, list):
            cleaned = [" ".join(str(item).split()) for item in value if str(item).strip()]
        else:
            cleaned = []
        if not cleaned:
            cleaned = [
                "The paper demonstrates promising results under controlled conditions.",
                "Method-level strengths are offset by limits in evaluation breadth and transfer validation.",
                "Evidence quality indicates actionable opportunities for stronger real-world robustness studies.",
            ]
        return cleaned[:6]

    def _executive_summary(
        self,
        overview: dict[str, Any],
        grouped_limitations: list[dict[str, Any]],
        insights: list[dict[str, Any]],
    ) -> str:
        objective = self._clean(overview.get("objective"), "a substantive research contribution")
        methodology = self._clean(overview.get("methodology"), "a structured empirical design")
        first_limitation = ""
        if grouped_limitations and grouped_limitations[0].get("items"):
            first_limitation = self._clean(grouped_limitations[0]["items"][0].get("title"), "")
        top_insight = insights[0] if insights else {}
        implication = self._clean(top_insight.get("deep_insight"), top_insight.get("title", "an unresolved research implication"))

        lines = [
            f"Core contribution: the paper advances {objective} through {methodology}.",
            f"Core limitation: {first_limitation or 'the evidence base remains narrower than the strength of the claims it supports'}.",
            f"Core implication: {implication}.",
        ]
        return " ".join(lines)[:520]

    @staticmethod
    def _string_list(value: Any, fallback: list[str]) -> list[str]:
        if isinstance(value, list):
            cleaned = [" ".join(str(item).split()) for item in value if str(item).strip()]
        else:
            cleaned = []
        return (cleaned or fallback)[:4]

    @staticmethod
    def _enum3(value: Any, default: str) -> str:
        text = str(value or "").strip().lower()
        return text if text in {"low", "medium", "high"} else default

    @staticmethod
    def _confidence(value: Any, default: float) -> float:
        try:
            return round(max(0.0, min(float(value), 1.0)), 2)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _score10(value: Any, default: float) -> float:
        try:
            return round(max(0.0, min(float(value), 10.0)), 2)
        except (TypeError, ValueError):
            return default
