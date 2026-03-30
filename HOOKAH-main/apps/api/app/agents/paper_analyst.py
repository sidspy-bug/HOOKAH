from __future__ import annotations

from collections import Counter
from typing import Any


class PaperAnalyst:
    def analyze(
        self,
        topic: str,
        keywords: list[str],
        domain: str | None,
        papers: list[dict[str, Any]],
        limit: int = 6,
    ) -> list[dict[str, Any]]:
        topic_terms = self._tokenize(topic)
        kw_terms = {k.lower().strip() for k in keywords if k.strip()}

        scored: list[tuple[float, dict[str, Any]]] = []
        for paper in papers:
            text_blob = " ".join(
                [
                    paper.get("title", ""),
                    paper.get("abstract", ""),
                    " ".join(paper.get("methods", [])),
                    paper.get("findings", ""),
                    " ".join(paper.get("limitations", [])),
                    " ".join(paper.get("future_work", [])),
                    " ".join(paper.get("keywords", [])),
                ]
            ).lower()

            text_terms = self._tokenize(text_blob)
            overlap_topic = len(topic_terms.intersection(text_terms))
            overlap_kw = len(kw_terms.intersection(text_terms))
            domain_bonus = (
                2.0
                if domain
                and paper.get("domain", "").lower().strip() == domain.lower().strip()
                else 0.0
            )
            recency_bonus = max((paper.get("year", 2020) - 2018) * 0.05, 0)

            score = overlap_topic * 1.2 + overlap_kw * 1.6 + domain_bonus + recency_bonus
            scored.append((score, paper))

        ranked = [paper for _, paper in sorted(scored, key=lambda x: x[0], reverse=True)]
        return ranked[:limit]

    @staticmethod
    def summarize_domains(selected_papers: list[dict[str, Any]]) -> dict[str, int]:
        counts = Counter(p.get("domain", "unknown") for p in selected_papers)
        return dict(counts)

    @staticmethod
    def _tokenize(text: str) -> set[str]:
        cleaned = (
            text.lower()
            .replace(",", " ")
            .replace(".", " ")
            .replace(";", " ")
            .replace(":", " ")
            .replace("(", " ")
            .replace(")", " ")
            .replace("/", " ")
            .replace("-", " ")
        )
        return {t for t in cleaned.split() if len(t) > 2}
