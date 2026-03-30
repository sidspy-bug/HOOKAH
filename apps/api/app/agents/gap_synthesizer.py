from __future__ import annotations

from collections import defaultdict


THEME_RULES: dict[str, list[str]] = {
    "personalization": ["personalized", "patient-specific", "adaptive", "tailored"],
    "fairness": ["fairness", "bias", "underrepresented", "equity"],
    "longitudinal": ["long-term", "longitudinal", "follow-up", "temporal"],
    "multimodal": ["multimodal", "sensor fusion", "text+image", "cross-modal"],
    "real_world": ["real-world", "deployment", "in-the-wild", "ecological"],
    "explainability": ["explainability", "interpretability", "transparent", "causal"],
}


class GapSynthesizer:
    def synthesize(self, extracted_limitations: list[dict[str, str]]) -> list[dict]:
        buckets: dict[str, list[dict[str, str]]] = defaultdict(list)

        for item in extracted_limitations:
            text = item["text"].lower()
            matched_theme = "general"
            for theme, keywords in THEME_RULES.items():
                if any(k in text for k in keywords):
                    matched_theme = theme
                    break
            buckets[matched_theme].append(item)

        gaps: list[dict] = []
        for idx, (theme, items) in enumerate(buckets.items(), start=1):
            representative = items[0]["text"]
            citations = [
                {
                    "paper_id": i["paper_id"],
                    "title": i["title"],
                    "reason": i["text"],
                }
                for i in items[:3]
            ]

            gaps.append(
                {
                    "gap_id": f"gap-{idx}",
                    "statement": self._statement_from_theme(theme),
                    "rationale": f"Recurring signals from {len(items)} extracted limitations. Example: {representative}",
                    "citations": citations,
                    "evidence_count": len(items),
                    "theme": theme,
                }
            )

        return sorted(gaps, key=lambda g: g["evidence_count"], reverse=True)

    @staticmethod
    def _statement_from_theme(theme: str) -> str:
        mapping = {
            "personalization": "Models are not sufficiently personalized for diverse user or patient profiles.",
            "fairness": "Current approaches lack robust fairness checks across demographic or contextual groups.",
            "longitudinal": "Most studies miss longitudinal evaluation and long-term behavior analysis.",
            "multimodal": "Evidence is limited on whether multimodal signals improve outcomes reliably.",
            "real_world": "There is a deployment gap between benchmark results and real-world settings.",
            "explainability": "Methods provide limited explainability for high-stakes decisions.",
            "general": "Important open problems remain under-specified in current literature samples.",
        }
        return mapping.get(theme, mapping["general"])
