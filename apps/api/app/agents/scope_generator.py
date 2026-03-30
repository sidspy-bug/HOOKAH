from __future__ import annotations


class ScopeGenerator:
    def generate(self, topic: str, gap: dict) -> dict[str, str]:
        statement = gap["statement"]
        theme = gap.get("theme", "general")

        title = f"{topic}: {self._title_suffix(theme)}"
        hypothesis = f"Addressing this gap can improve measurable outcomes versus baseline methods: {statement}"
        short_scope = (
            "8-10 week scope: (1) define benchmark + baseline, (2) implement one focused method, "
            "(3) evaluate on 2-3 metrics, (4) report error analysis and limitations."
        )

        return {
            "title": title,
            "hypothesis": hypothesis,
            "short_scope": short_scope,
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
