from __future__ import annotations

import io

import pypdf


class TitleExtractorAgent:
    def extract(self, pdf_bytes: bytes, filename: str | None = None) -> str:
        title = ""
        try:
            pdf = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        except Exception:
            return self._clean_title(filename or "Untitled Research Paper")

        if pdf.metadata and pdf.metadata.title:
            candidate = str(pdf.metadata.title).strip()
            if self._looks_like_title(candidate):
                title = candidate

        if not title and len(pdf.pages) > 0:
            first_page = pdf.pages[0].extract_text() or ""
            lines = [line.strip() for line in first_page.split("\n") if line.strip()]
            for line in lines[:12]:
                if self._looks_like_title(line):
                    title = line
                    break

        if not title:
            title = filename or "Untitled Research Paper"

        return self._clean_title(title)

    @staticmethod
    def _looks_like_title(text: str) -> bool:
        low = text.lower().strip()
        if len(low) < 12:
            return False
        banned = {"abstract", "introduction", "references", "keywords", "acknowledgements"}
        return low not in banned and not low.startswith("figure")

    @staticmethod
    def _clean_title(text: str) -> str:
        normalized = " ".join(text.replace("_", " ").split())
        return normalized[:180] if normalized else "Untitled Research Paper"

