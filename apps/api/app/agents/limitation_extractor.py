from __future__ import annotations

import re
from typing import Any


class LimitationExtractor:
    def extract(self, papers: list[dict[str, Any]]) -> list[dict[str, str]]:
        extracted: list[dict[str, str]] = []
        seen_texts: set[str] = set()
        
        def add_limitation(paper: dict[str, Any], text: str):
            clean_text = re.sub(r'[^a-z0-9]', '', text.lower())
            if not clean_text or clean_text in seen_texts:
                return
            seen_texts.add(clean_text)
            extracted.append(
                {
                    "paper_id": paper["paper_id"],
                    "title": paper["title"],
                    "text": text,
                }
            )

        for paper in papers:
            for limitation in paper.get("limitations", []):
                add_limitation(paper, limitation)

            for fw in paper.get("future_work", []):
                add_limitation(paper, f"Future work: {fw}")
                
        return extracted
