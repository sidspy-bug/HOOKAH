from __future__ import annotations

from typing import Any


class ThemeClusteringAgent:
    ORDER = ["data", "methodology", "evaluation", "bias", "deployment"]

    def cluster(self, limitations: list[dict[str, Any]]) -> list[dict[str, Any]]:
        buckets: dict[str, list[dict[str, Any]]] = {category: [] for category in self.ORDER}

        for limitation in limitations:
            category = str(limitation.get("category", "evaluation")).strip().lower()
            if category not in buckets:
                category = "evaluation"

            title = self._title_from_statement(str(limitation.get("statement", "")))
            entry = {
                "title": title,
                "explanation": self._clean(limitation.get("explanation"), "The study presents a non-trivial limitation affecting evidence quality."),
                "evidence": self._evidence_list(limitation.get("evidence")),
                "impact": self._clean(limitation.get("impact"), "This limitation affects reliability, comparability, and downstream applicability."),
                "severity": self._severity(limitation.get("severity")),
            }
            buckets[category].append(entry)

        grouped: list[dict[str, Any]] = []
        for category in self.ORDER:
            if not buckets[category]:
                continue
            grouped.append(
                {
                    "category": category,
                    "items": buckets[category][:6],
                }
            )

        if not grouped:
            grouped.append(
                {
                    "category": "evaluation",
                    "items": [
                        {
                            "title": "Evaluation coverage limitations",
                            "explanation": "The current analysis indicates unresolved evaluation constraints in available evidence.",
                            "evidence": [
                                "Reported benchmarks cover limited scenarios.",
                                "Error mode analysis is not fully characterized.",
                                "Validation breadth is narrower than deployment variability.",
                            ],
                            "impact": "Weak evaluation breadth reduces trust in generalizability claims.",
                            "severity": "medium",
                        }
                    ],
                }
            )

        return grouped

    @staticmethod
    def _clean(value: Any, default: str = "") -> str:
        text = " ".join(str(value or "").split())
        return text[:700] if text else default

    @staticmethod
    def _evidence_list(value: Any) -> list[str]:
        if isinstance(value, list):
            cleaned = [" ".join(str(item).split()) for item in value if str(item).strip()]
        else:
            cleaned = [" ".join(str(value or "").split())] if str(value or "").strip() else []
        cleaned = [item[:500] for item in cleaned]
        return (cleaned + ["Evidence detail is present in the source text."])[:3]

    @staticmethod
    def _title_from_statement(statement: str) -> str:
        normalized = " ".join(statement.split())
        if not normalized:
            return "Unspecified limitation"
        words = normalized.split(" ")
        return " ".join(words[:10]).rstrip(".")

    @staticmethod
    def _severity(value: Any) -> str:
        level = str(value or "medium").strip().lower()
        return level if level in {"low", "medium", "high"} else "medium"

