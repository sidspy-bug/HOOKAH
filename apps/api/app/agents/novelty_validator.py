from __future__ import annotations


class NoveltyValidator:
    def score(self, gap: dict, topic: str, requested_keywords: list[str]) -> dict[str, float]:
        evidence = gap.get("evidence_count", 1)
        novelty = min(9.0, 4.5 + evidence * 0.6)

        topic_l = topic.lower()
        theme = gap.get("theme", "general")
        keyword_bonus = 0.0
        for kw in requested_keywords:
            if kw.lower() in topic_l:
                keyword_bonus += 0.2

        impact = min(9.5, 5.0 + evidence * 0.7 + keyword_bonus)
        feasibility = max(4.0, 8.5 - evidence * 0.4)

        if theme == "real_world":
            impact += 0.5
            feasibility -= 0.3
        if theme == "longitudinal":
            novelty += 0.3
            feasibility -= 0.4

        novelty = round(max(1.0, min(10.0, novelty)), 1)
        impact = round(max(1.0, min(10.0, impact)), 1)
        feasibility = round(max(1.0, min(10.0, feasibility)), 1)

        return {
            "novelty_score": novelty,
            "impact_score": impact,
            "feasibility_score": feasibility,
        }
