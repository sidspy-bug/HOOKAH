from __future__ import annotations

import io
import os
import re
import shutil
from dataclasses import dataclass

import pypdf


@dataclass
class ExtractionResult:
    text: str
    char_count: int
    used_ocr: bool
    page_count: int = 0


class InsufficientTextError(Exception):
    pass


class PDFTextExtractor:
    def __init__(self) -> None:
        self.min_chars = int(os.getenv("PDF_MIN_TEXT_CHARS", "1000"))
        self.min_words = int(os.getenv("PDF_MIN_TEXT_WORDS", "120"))

    def extract_hybrid(self, pdf_bytes: bytes) -> ExtractionResult:
        page_count = self._estimate_page_count(pdf_bytes)
        standard_text = self._extract_standard(pdf_bytes)
        if self._is_sufficient(standard_text, page_count):
            return ExtractionResult(
                text=standard_text,
                char_count=len(standard_text),
                used_ocr=False,
                page_count=page_count,
            )

        ocr_text = self._extract_ocr(pdf_bytes)
        merged = self._clean_text((standard_text + "\n\n" + ocr_text).strip())
        return ExtractionResult(
            text=merged,
            char_count=len(merged),
            used_ocr=bool(ocr_text.strip()),
            page_count=page_count,
        )

    def ensure_sufficient(self, result: ExtractionResult) -> None:
        if not self._is_sufficient(result.text, result.page_count):
            raise InsufficientTextError("Insufficient textual content for analysis")

    def _extract_standard(self, pdf_bytes: bytes) -> str:
        candidates = [
            self._extract_with_pdfplumber(pdf_bytes),
            self._extract_with_pypdf(pdf_bytes),
            self._extract_with_pymupdf(pdf_bytes),
        ]
        best = max(candidates, key=len, default="")
        return self._clean_text(best)

    def _extract_ocr(self, pdf_bytes: bytes) -> str:
        pages = self._render_pages_for_ocr(pdf_bytes)
        if not pages:
            return ""

        tesseract_text = self._extract_with_tesseract(pages)
        if tesseract_text:
            return tesseract_text

        rapid_text = self._extract_with_rapidocr(pages)
        if rapid_text:
            return rapid_text

        return ""

    def _extract_with_tesseract(self, pages: list) -> str:
        if not self._can_run_tesseract():
            return ""

        try:
            import pytesseract  # type: ignore
            import cv2  # type: ignore
            import numpy as np  # type: ignore
            from PIL import Image  # type: ignore
        except Exception:
            return ""

        ocr_chunks: list[str] = []
        for page in pages:
            try:
                image = page.convert("RGB")
                np_img = np.array(image)
                gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)
                _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                deskewed = self._deskew(thresh, cv2=cv2, np=np)
                pil_image = Image.fromarray(deskewed)
                text = pytesseract.image_to_string(pil_image, config="--oem 3 --psm 6")
                if text.strip():
                    ocr_chunks.append(text.strip())
            except Exception:
                continue

        return self._clean_text("\n\n".join(ocr_chunks))

    def _extract_with_rapidocr(self, pages: list) -> str:
        try:
            import cv2  # type: ignore
            import numpy as np  # type: ignore
            from rapidocr_onnxruntime import RapidOCR  # type: ignore
        except Exception:
            return ""

        try:
            ocr_engine = RapidOCR()
        except Exception:
            return ""

        ocr_chunks: list[str] = []
        for page in pages:
            try:
                image = page.convert("RGB")
                np_img = np.array(image)
                gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)
                _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                deskewed = self._deskew(thresh, cv2=cv2, np=np)
                result, _ = ocr_engine(deskewed)
                if not result:
                    continue
                lines: list[str] = []
                for item in result:
                    if isinstance(item, (list, tuple)) and len(item) >= 2 and isinstance(item[1], str):
                        line = item[1].strip()
                        if line:
                            lines.append(line)
                if lines:
                    ocr_chunks.append("\n".join(lines))
            except Exception:
                continue

        return self._clean_text("\n\n".join(ocr_chunks))

    def _render_pages_for_ocr(self, pdf_bytes: bytes) -> list:
        try:
            from pdf2image import convert_from_bytes  # type: ignore

            return convert_from_bytes(pdf_bytes, dpi=300)
        except Exception:
            return self._render_pages_with_pymupdf(pdf_bytes)

    @staticmethod
    def _render_pages_with_pymupdf(pdf_bytes: bytes) -> list:
        try:
            import fitz  # type: ignore
            from PIL import Image  # type: ignore
        except Exception:
            return []

        images = []
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            matrix = fitz.Matrix(2.0, 2.0)
            for page in doc:
                pix = page.get_pixmap(matrix=matrix, alpha=False)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                images.append(img)
            doc.close()
        except Exception:
            return []
        return images

    @staticmethod
    def _deskew(image, cv2, np):  # type: ignore[no-untyped-def]
        coords = np.column_stack(np.where(image > 0))
        if coords.size == 0:
            return image

        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle

        (height, width) = image.shape[:2]
        center = (width // 2, height // 2)
        matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            image,
            matrix,
            (width, height),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE,
        )
        return rotated

    @staticmethod
    def _clean_text(text: str) -> str:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        cleaned = "\n".join(lines)
        return cleaned[:60000]

    def _extract_with_pdfplumber(self, pdf_bytes: bytes) -> str:
        chunks: list[str] = []
        try:
            import pdfplumber  # type: ignore

            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text() or ""
                    if text.strip():
                        chunks.append(text.strip())
        except Exception:
            return ""
        return "\n\n".join(chunks)

    @staticmethod
    def _extract_with_pypdf(pdf_bytes: bytes) -> str:
        chunks: list[str] = []
        try:
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            for page in reader.pages:
                text = page.extract_text() or ""
                if text.strip():
                    chunks.append(text.strip())
        except Exception:
            return ""
        return "\n\n".join(chunks)

    @staticmethod
    def _extract_with_pymupdf(pdf_bytes: bytes) -> str:
        chunks: list[str] = []
        try:
            import fitz  # type: ignore

            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            for page in doc:
                text = page.get_text("text") or ""
                if text.strip():
                    chunks.append(text.strip())
            doc.close()
        except Exception:
            return ""
        return "\n\n".join(chunks)

    @staticmethod
    def _estimate_page_count(pdf_bytes: bytes) -> int:
        try:
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            return max(1, len(reader.pages))
        except Exception:
            return 1

    def _is_sufficient(self, text: str, page_count: int) -> bool:
        cleaned = self._clean_text(text)
        chars = len(cleaned)
        words = len(re.findall(r"\b\w+\b", cleaned))
        pages = max(1, page_count)

        char_threshold = max(350, min(self.min_chars, pages * 400))
        word_threshold = max(80, min(self.min_words, pages * 60))

        sentence_count = cleaned.count(".") + cleaned.count("!") + cleaned.count("?")
        has_sentences = sentence_count >= 3
        has_academic_signals = bool(
            re.search(
                r"\b(study|method|methods|results|dataset|evaluation|experiment|participants|objective|conclusion)\b",
                cleaned.lower(),
            )
        )
        return (chars >= char_threshold or words >= word_threshold) and (has_sentences or has_academic_signals)

    @staticmethod
    def _can_run_tesseract() -> bool:
        has_tesseract = shutil.which("tesseract") is not None
        if not has_tesseract:
            return False
        has_poppler = shutil.which("pdftoppm") is not None
        has_pymupdf = PDFTextExtractor._has_pymupdf()
        return has_poppler or has_pymupdf

    @staticmethod
    def _has_pymupdf() -> bool:
        try:
            import fitz  # type: ignore  # noqa: F401

            return True
        except Exception:
            return False
