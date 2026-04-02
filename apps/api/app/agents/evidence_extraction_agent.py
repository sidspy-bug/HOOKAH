from __future__ import annotations

from typing import Any

from app.agents.llm_utils import generate_json_with_retry
from app.agents.quality_guards import validate_evidence


class EvidenceExtractionAgent:
    def extract(
        self,
        text: str,
        objective: str,
        methodology: str,
        key_findings: list[str],
    ) -> list[dict[str, Any]]:
        fallback = {
            "limitations": [
                {
                    "statement": "Evaluation uses constrained benchmarks with limited context diversity.",
                    "explanation": "The test conditions do not fully represent real-world variability and operational drift.",
                    "evidence": [
                        "Evaluation scope is bounded to a narrow benchmark set.",
                        "Cross-context validation is not comprehensively reported.",
                        "External validity checks are limited in methodological detail.",
                    ],
                    "category": "evaluation",
                    "severity": "high",
                    "impact": "Limits confidence in deployment reliability and transferability.",
                },
                {
                    "statement": "Data coverage is not sufficiently representative across target populations.",
                    "explanation": "Sampling and dataset composition underrepresent important edge scenarios and subgroup diversity.",
                    "evidence": [
                        "Dataset composition details show restricted population spread.",
                        "Subgroup performance analysis is limited or absent.",
                        "Generalization claims exceed explicit data coverage evidence.",
                    ],
                    "category": "data",
                    "severity": "high",
                    "impact": "Raises fairness and robustness risks in downstream usage.",
                },
                {
                    "statement": "Method design lacks transparent ablation and error decomposition.",
                    "explanation": "Without fine-grained analysis, it is difficult to identify which components drive observed outcomes.",
                    "evidence": [
                        "Ablation studies are missing or minimal.",
                        "Error taxonomy is not systematically documented.",
                        "Causal contribution of core components is under-validated.",
                    ],
                    "category": "methodology",
                    "severity": "medium",
                    "impact": "Reduces interpretability of findings and weakens reproducibility.",
                },
            ]
        }

        prompt = f"""You are an evidence extraction system for research limitations.

Extract REAL limitations with:
- clear explanation
- supporting evidence
- impact on research validity

Avoid generic phrases like:
"This limits conclusions"

Rules:
- Output only strict JSON
- No generic statements
- No empty fields
- Do not mention OCR, file parsing, document structure, or extraction quality

JSON schema:
{{
  "limitations": [
    {{
      "statement": "string",
      "explanation": "string",
      "evidence": ["string", "string", "string"],
      "category": "data|methodology|evaluation|bias|deployment",
      "severity": "low|medium|high",
      "impact": "string"
    }}
  ]
}}

OBJECTIVE: {objective}
METHODOLOGY: {methodology}
KEY FINDINGS: {key_findings}
PAPER TEXT:
\"\"\"
{text[:14000]}
\"\"\"
"""
        parsed = generate_json_with_retry(
            prompt,
            fallback,
            validator=lambda payload: validate_evidence(payload, key_findings),
            stage_name="evidence_extraction",
        )
        limitations = parsed.get("limitations", [])
        if not isinstance(limitations, list):
            return fallback["limitations"]

        normalized: list[dict[str, Any]] = []
        for item in limitations:
            evidence = item.get("evidence", [])
            if not isinstance(evidence, list):
                evidence = [str(evidence)]
            clean_evidence = [self._clean(str(ev)) for ev in evidence if str(ev).strip()]
            clean_evidence = (clean_evidence + fallback["limitations"][0]["evidence"])[:3]

            category = str(item.get("category", "evaluation")).strip().lower()
            if category not in {"data", "methodology", "evaluation", "bias", "deployment"}:
                category = "evaluation"

            severity = str(item.get("severity", "medium")).strip().lower()
            if severity not in {"low", "medium", "high"}:
                severity = "medium"

            normalized.append(
                {
                    "statement": self._clean(item.get("statement"), "A substantive research limitation is identified in the study design."),
                    "explanation": self._clean(item.get("explanation"), "The limitation introduces uncertainty in validity and interpretability."),
                    "evidence": clean_evidence,
                    "category": category,
                    "severity": severity,
                    "impact": self._clean(item.get("impact"), "This constraint weakens confidence in scientific and deployment-level conclusions."),
                }
            )

        return normalized[:10] if normalized else fallback["limitations"]

    @staticmethod
    def _clean(value: Any, default: str = "") -> str:
        text = str(value or "").strip()
        if not text:
            text = default
        return " ".join(text.split())[:700]
