from __future__ import annotations

from typing import Any


class LimitationExtractor:
    def extract(self, papers: list[dict[str, Any]]) -> list[dict[str, str]]:
        extracted: list[dict[str, str]] = []
        for paper in papers:
            for limitation in paper.get("limitations", []):
                extracted.append(
                    {
                        "paper_id": paper["paper_id"],
                        "title": paper["title"],
                        "text": limitation,
                    }
                )

            for fw in paper.get("future_work", []):
                extracted.append(
                    {
                        "paper_id": paper["paper_id"],
                        "title": paper["title"],
                        "text": f"Future work: {fw}",
                    }
                )
        return extracted
