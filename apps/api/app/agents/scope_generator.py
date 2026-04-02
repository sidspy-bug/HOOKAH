from __future__ import annotations


class ScopeGenerator:
    def generate(self, topic: str, gap: dict) -> dict[str, str]:
        statement = gap["statement"]
        theme = gap.get("theme", "general")

        title = f"{topic}: {self._title_suffix(theme)}"
        evidence = f"Derived from the identified gap: {statement}"
        why_it_matters = (
            "Addressing this gap provides a foundational step to resolve the inconsistencies "
            "and methodological limitations currently observed in the field."
        )

        return {
            "title": title,
            "evidence": evidence,
            "why_it_matters": why_it_matters,
            "confidence": "medium",
        }

    @staticmethod
    def _title_suffix(theme: str) -> str:
        mapping = {
            "personalization": "Adaptive Personalization Strategy",
            "fairness": "Bias-Aware Evaluation and Mitigation",
            "longitudinal": "Longitudinal Performance Modeling",
            "multimodal": "Multimodal Signal Integration",
            "real_world": "Real-World Deployment Readiness",
            "explainability": "Interpretable Decision Pipeline",
            "general": "Focused Gap-Driven Prototype",
        }
        return mapping.get(theme, mapping["general"])
