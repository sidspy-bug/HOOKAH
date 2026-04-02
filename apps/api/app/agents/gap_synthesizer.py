"""
GapSynthesizer agent.

Two modes:
  - structure_from_ai(): Takes raw Gemini JSON output and formats it into GapItem schema.
  - synthesize():        Legacy heuristic fallback using keyword bucketing.
"""
from __future__ import annotations

from collections import defaultdict
from typing import Any


# ── Legacy keyword rules (used only in fallback mode) ────────────
THEME_RULES: dict[str, list[str]] = {
    "personalization": ["personalized", "patient-specific", "adaptive", "tailored"],
    "fairness": ["fairness", "bias", "underrepresented", "equity"],
    "longitudinal": ["long-term", "longitudinal", "follow-up", "temporal"],
    "multimodal": ["multimodal", "sensor fusion", "text+image", "cross-modal"],
    "real_world": ["real-world", "deployment", "in-the-wild", "ecological"],
    "explainability": ["explainability", "interpretability", "transparent", "causal"],
}


class GapSynthesizer:
    """Structures research gaps — either from AI output or heuristic fallback."""

    # ── AI Mode ──────────────────────────────────────────────────

    def structure_from_ai(
        self,
        ai_gaps: list[dict[str, Any]],
        paper_map: dict[str, dict[str, str]],
    ) -> list[dict]:
        """
        Convert Gemini Call #1 output into the GapItem schema
        expected by the frontend.

        Args:
            ai_gaps:   List of dicts from Gemini with keys:
                       title, description, explanation, confidence
            paper_map: Dict mapping paper_id -> {title, paper_id} for citation linking.

        Returns:
            List of gap dicts matching the GapItem schema.
        """
        gaps: list[dict] = []
        paper_list = list(paper_map.values())

        for idx, gap in enumerate(ai_gaps, start=1):
            # Build citations by distributing available papers across gaps.
            # Each gap references up to 3 papers cyclically.
            citations = []
            for offset in range(min(3, len(paper_list))):
                paper_idx = (idx - 1 + offset) % len(paper_list)
                p = paper_list[paper_idx]
                citations.append({
                    "paper_id": p["paper_id"],
                    "title": p["title"],
                    "reason": gap.get("explanation", gap.get("description", "")),
                })

            gaps.append({
                "gap_id": f"gap-{idx}",
                "title": gap.get("title", f"Research Gap #{idx}"),
                "statement": gap.get("description", gap.get("title", "")),
                "evidence": gap.get("description", ""),
                "importance": gap.get("explanation", ""),
                "citations": citations,
                "evidence_count": max(1, len(citations)),
                "theme": "ai_generated",
                "confidence": gap.get("confidence", "medium"),
            })

        return gaps

    # ── Fallback / Legacy Mode ───────────────────────────────────

    def synthesize(self, extracted_limitations: list[dict[str, str]]) -> list[dict]:
        """Legacy heuristic synthesis using keyword bucketing. Used when AI mode is off."""
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
                    "title": f"{theme.capitalize()} Research Gap",
                    "statement": self._statement_from_theme(theme),
                    "evidence": f"Recurring signals from {len(items)} extracted limitations. Example: {representative}",
                    "importance": f"Addressing this gap in the {theme} aspects will strengthen methodology and reliability.",
                    "confidence": "medium",
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
