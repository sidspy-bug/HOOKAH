from __future__ import annotations

import asyncio
import json
import os
import re
import time
from typing import Any

from app.agents.llm_utils import safe_parse_json
from app.agents.paper_analyst import PaperAnalyst
from app.agents.title_extractor_agent import TitleExtractorAgent
from app.api.ai_client import call_ollama
from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.ai_client import GeminiClient
from app.services.data_loader import load_sample_papers
from app.services.pdf_text_extractor import InsufficientTextError, PDFTextExtractor


class GapForgePipeline:
    def __init__(self) -> None:
        self.paper_selector = PaperAnalyst()
        self.title_extractor = TitleExtractorAgent()
        self.text_extractor = PDFTextExtractor()
        self.gemini = GeminiClient()

        self.max_pipeline_seconds = float(os.getenv("MAX_PIPELINE_SECONDS", "118"))
        self.gemini_stage_timeout = float(os.getenv("GEMINI_STAGE_TIMEOUT_SECONDS", "40"))
        self.gpu_stage_timeout = float(os.getenv("GPU_STAGE_TIMEOUT_SECONDS", "55"))
        self.critic_stage_timeout = float(os.getenv("CRITIC_STAGE_TIMEOUT_SECONDS", "25"))

        self.gpu_model = os.getenv("GPU_OLLAMA_MODEL", "qwen2.5:14b-instruct")
        self.gpu_base_url = os.getenv("GPU_OLLAMA_BASE_URL", "http://127.0.0.1:11434")
        self.gpu_temperature = float(os.getenv("GPU_OLLAMA_TEMPERATURE", "0.15"))
        self.gpu_keep_alive = os.getenv("GPU_OLLAMA_KEEP_ALIVE", "8m")

        self.critic_model = os.getenv("CRITIC_OLLAMA_MODEL", "llama3.1:8b-instruct")
        self.critic_base_url = os.getenv("CRITIC_OLLAMA_BASE_URL", "http://127.0.0.1:11434")
        self.critic_temperature = float(os.getenv("CRITIC_OLLAMA_TEMPERATURE", "0.1"))
        self.critic_keep_alive = os.getenv("CRITIC_OLLAMA_KEEP_ALIVE", "4m")

    async def run(self, req: AnalyzeRequest) -> AnalyzeResponse:
        papers = load_sample_papers()
        selected = self.paper_selector.analyze(
            topic=req.topic,
            keywords=req.keywords,
            domain=req.domain,
            papers=papers,
            limit=6,
        )
        pseudo_text = self._compose_text_from_papers(selected, req.topic)
        title = req.topic.strip() or "Research Paper"
        return await self._run_reasoning_flow(title=title, text=pseudo_text)

    async def run_pdf(self, pdf_bytes: bytes, filename: str | None = None) -> AnalyzeResponse:
        title = await asyncio.to_thread(self.title_extractor.extract, pdf_bytes, filename)
        extraction = await asyncio.to_thread(self.text_extractor.extract_hybrid, pdf_bytes)
        await asyncio.to_thread(self.text_extractor.ensure_sufficient, extraction)
        return await self._run_reasoning_flow(title=title, text=extraction.text)

    async def _run_reasoning_flow(self, title: str, text: str) -> AnalyzeResponse:
        started = time.perf_counter()

        structured = await self._run_gemini_structuring(title=title, text=text, started=started)
        reasoning_payload, reasoning_source = await self._run_gpu_reasoning_with_fallback(
            title=title,
            structured=structured,
            started=started,
        )
        critic_payload = await self._run_critic_review(
            title=title,
            structured=structured,
            reasoning_payload=reasoning_payload,
            started=started,
        )
        merged = self._merge_pipeline_outputs(
            title=title,
            structured=structured,
            reasoning_payload=reasoning_payload,
            critic_payload=critic_payload,
            reasoning_source=reasoning_source,
        )
        return AnalyzeResponse(**merged)

    async def _run_gemini_structuring(
        self,
        title: str,
        text: str,
        started: float,
    ) -> dict[str, Any]:
        fallback = self._heuristic_understanding(title, text)

        prompt = f"""Analyze the following research paper and extract structured understanding.

Return ONLY:

- Objective (clear and precise)
- Methodology (data, approach, sample)
- Key Findings (3–5 points)
- Important Sections (methods, results, limitations)

DO NOT explain.
DO NOT add interpretation.
ONLY extract factual structure.

Output must be structured JSON with this schema:
{{
  "objective": "string",
  "methodology": "string",
  "key_findings": ["string", "string", "string"],
  "important_sections": [
    {{
      "section": "string",
      "insight": "string",
      "evidence": "string"
    }}
  ]
}}

Research paper title: {title}
Research paper text:
\"\"\"
{text[:26000]}
\"\"\"
"""
        timeout = self._remaining_stage_timeout(started, self.gemini_stage_timeout, reserve=72.0)
        payload = await self._gemini_json(
            prompt=prompt,
            fallback=fallback,
            call_label="agent1_gemini_structuring",
            timeout_seconds=timeout,
        )
        if not self._validate_structured_payload(payload):
            return fallback
        return self._sanitize_structured_payload(payload, fallback=fallback)

    async def _run_gpu_reasoning_with_fallback(
        self,
        title: str,
        structured: dict[str, Any],
        started: float,
    ) -> tuple[dict[str, Any], str]:
        fallback = self._fallback_reasoning_payload(structured)
        prompt = self._reasoning_prompt(title=title, structured=structured)
        timeout = self._remaining_stage_timeout(started, self.gpu_stage_timeout, reserve=24.0)

        gpu_payload = await self._ollama_json(
            prompt=prompt,
            model=self.gpu_model,
            base_url=self.gpu_base_url,
            temperature=self.gpu_temperature,
            keep_alive=self.gpu_keep_alive,
            timeout_seconds=timeout,
            label="agent2_gpu_reasoning",
        )
        if self._validate_reasoning_payload(gpu_payload):
            return self._sanitize_reasoning_payload(gpu_payload, fallback=fallback), "gpu"

        gemini_fallback = await self._gemini_json(
            prompt=prompt,
            fallback=fallback,
            call_label="agent2_fallback_gemini_reasoning",
            timeout_seconds=min(self.gemini_stage_timeout, max(8.0, timeout)),
        )
        if self._validate_reasoning_payload(gemini_fallback):
            return self._sanitize_reasoning_payload(gemini_fallback, fallback=fallback), "gemini_fallback"
        return fallback, "fallback"

    async def _run_critic_review(
        self,
        title: str,
        structured: dict[str, Any],
        reasoning_payload: dict[str, Any],
        started: float,
    ) -> dict[str, Any]:
        fallback = {
            "executive_summary": str(reasoning_payload.get("executive_summary", "")).strip(),
            "insights": reasoning_payload.get("insights", []),
            "improvements": [
                "Strengthen causal claims with mechanism-level evaluation criteria.",
                "Tighten the link between evidence conditions and deployment assumptions.",
                "Make failure boundary conditions explicit in follow-up experiments.",
            ],
        }
        prompt = self._critic_prompt(
            title=title,
            structured=structured,
            reasoning_payload=reasoning_payload,
        )
        timeout = self._remaining_stage_timeout(started, self.critic_stage_timeout, reserve=4.0)
        critic_payload = await self._ollama_json(
            prompt=prompt,
            model=self.critic_model,
            base_url=self.critic_base_url,
            temperature=self.critic_temperature,
            keep_alive=self.critic_keep_alive,
            timeout_seconds=timeout,
            label="agent3_critic_review",
        )
        if not self._validate_reasoning_payload(critic_payload):
            return fallback

        if not isinstance(critic_payload, dict):
            return fallback
        improvements = critic_payload.get("improvements", fallback["improvements"])
        if not isinstance(improvements, list):
            improvements = fallback["improvements"]
        sanitized = self._sanitize_reasoning_payload(critic_payload, fallback=fallback)
        sanitized["improvements"] = [
            self._assertive(str(item), fallback["improvements"][0])
            for item in improvements[:4]
            if str(item).strip()
        ] or fallback["improvements"]
        return sanitized

    async def _gemini_json(
        self,
        prompt: str,
        fallback: dict[str, Any],
        call_label: str,
        timeout_seconds: float,
    ) -> dict[str, Any]:
        timeout = max(8.0, timeout_seconds)
        try:
            payload = await asyncio.wait_for(
                asyncio.to_thread(
                    self.gemini.generate_json,
                    prompt,
                    fallback,
                    call_label,
                ),
                timeout=timeout,
            )
        except Exception:
            return fallback
        return payload if isinstance(payload, dict) else fallback

    async def _ollama_json(
        self,
        prompt: str,
        model: str,
        base_url: str,
        temperature: float,
        keep_alive: str,
        timeout_seconds: float,
        label: str,
    ) -> dict[str, Any] | None:
        timeout = max(6.0, timeout_seconds)

        def _call() -> dict[str, Any] | None:
            raw = call_ollama(
                prompt,
                model_name=model,
                base_url=base_url,
                timeout_seconds=timeout,
                max_attempts=1,
                temperature=temperature,
                keep_alive=keep_alive,
            )
            return safe_parse_json(raw)

        try:
            payload = await asyncio.wait_for(asyncio.to_thread(_call), timeout=timeout + 2.0)
        except Exception:
            return None
        return payload if isinstance(payload, dict) else None

    def _merge_pipeline_outputs(
        self,
        title: str,
        structured: dict[str, Any],
        reasoning_payload: dict[str, Any],
        critic_payload: dict[str, Any],
        reasoning_source: str,
    ) -> dict[str, Any]:
        candidate_payload = critic_payload if self._validate_reasoning_payload(critic_payload) else reasoning_payload
        raw_insights = candidate_payload.get("insights", [])
        normalized = [self._normalize_insight(item, structured, idx + 1) for idx, item in enumerate(raw_insights)]
        ranked = self._dedupe_and_rank_insights(normalized)[:3]
        if not ranked:
            ranked = [self._fallback_insight(structured)]

        executive_summary = self._assertive(
            str(candidate_payload.get("executive_summary", "")).strip(),
            self._compose_executive_summary(structured, ranked),
        )

        formatted_insights = [self._to_response_insight(insight, structured) for insight in ranked]
        critical_reasoning = self._build_critical_reasoning(formatted_insights)
        grouped_limitations = self._build_limitations(structured, formatted_insights)
        improvements = self._build_improvements(candidate_payload, structured, formatted_insights)

        research_gaps = [
            {
                "title": insight["title"],
                "problem": insight["problem"],
                "evidence": insight["evidence"],
                "why_gap_exists": insight["why_gap_exists"],
                "why_it_matters": insight["why_it_matters"],
                "vulnerability": insight["vulnerability"],
                "impact": insight["impact"],
                "confidence": insight["confidence"],
                "depth_score": insight["depth_score"],
            }
            for insight in formatted_insights
        ]

        directions = [
            {
                "title": insight["direction"]["title"],
                "linked_gap": insight["title"],
                "approach": insight["direction"]["approach"],
                "scores": insight["scores"],
                "overall_score": insight["overall_score"],
            }
            for insight in formatted_insights
        ]

        return {
            "overview": {
                "title": title,
                "executive_summary": executive_summary,
                "objective": self._assertive(
                    str(structured.get("objective", "")).strip(),
                    "The paper addresses a concrete research objective with measurable implications.",
                ),
                "methodology": self._assertive(
                    str(structured.get("methodology", "")).strip(),
                    "The paper uses an explicit methodology with reproducible evaluation criteria.",
                ),
                "key_findings": [self._assertive(item, "The findings establish concrete evidence patterns.") for item in structured.get("key_findings", [])[:6]],
            },
            "limitations": {"grouped": grouped_limitations},
            "critical_reasoning": critical_reasoning,
            "research_gaps": research_gaps,
            "directions": directions,
            "insights": formatted_insights,
            "most_critical_insight": formatted_insights[0],
            "analysis_improvements": improvements,
        }

    def _reasoning_prompt(self, title: str, structured: dict[str, Any]) -> str:
        structured_json = json.dumps(structured, ensure_ascii=True)
        return f"""You are a senior research analyst.

Input is structured summary of a research paper.

Generate EXACTLY 3 deep research insights.

Each insight must include:
1. Problem (non-obvious limitation or gap)
2. Reasoning (why this issue exists — causal explanation)
3. Implication (why it matters in real-world or research context)
4. Direction (clear improvement or future work)
5. Scores (novelty, feasibility, impact out of 10)

STRICT RULES:
- Do NOT repeat points
- Do NOT give generic limitations
- Avoid vague phrases like “may”, “could”
- Focus on hidden assumptions and deeper issues
- Each insight must be distinct and meaningful

Output must be structured JSON.

Return this JSON schema:
{{
  "executive_summary": "string",
  "insights": [
    {{
      "problem": "string",
      "reasoning": "string",
      "implication": "string",
      "direction": "string",
      "scores": {{
        "novelty": 0-10,
        "feasibility": 0-10,
        "impact": 0-10
      }}
    }}
  ]
}}

Research paper title: {title}
Structured input:
{structured_json}
"""

    def _critic_prompt(
        self,
        title: str,
        structured: dict[str, Any],
        reasoning_payload: dict[str, Any],
    ) -> str:
        structured_json = json.dumps(structured, ensure_ascii=True)
        reasoning_json = json.dumps(reasoning_payload, ensure_ascii=True)
        return f"""You are a critical reviewer.

Review the following research insights.

Tasks:
- Remove any weak or generic insight
- Improve unclear reasoning
- Add ONE missing high-quality insight if needed

Keep total insights <= 3.

Be strict and concise.

Return structured JSON:
{{
  "executive_summary": "string",
  "insights": [
    {{
      "problem": "string",
      "reasoning": "string",
      "implication": "string",
      "direction": "string",
      "scores": {{
        "novelty": 0-10,
        "feasibility": 0-10,
        "impact": 0-10
      }}
    }}
  ],
  "improvements": ["string", "string", "string"]
}}

Research paper title: {title}
Structured summary:
{structured_json}

Research insights:
{reasoning_json}
"""

    def _heuristic_understanding(self, title: str, text: str) -> dict[str, Any]:
        sentences = self._split_sentences(text)
        objective = self._strip_source_prefixes(sentences[0]) if sentences else f"The paper investigates {title} through a focused experimental objective."
        methodology = self._strip_source_prefixes(sentences[1]) if len(sentences) > 1 else "The study applies a reproducible methodology with explicit evaluation criteria."
        findings = [self._strip_source_prefixes(sentence) for sentence in sentences[2:8] if len(sentence) > 40][:4]
        if not findings:
            findings = [
                "The reported evidence shows measurable gains under defined evaluation settings.",
                "Performance depends on assumptions that are not uniformly validated across conditions.",
                "The study leaves unresolved boundary conditions that affect reliability claims.",
            ]
        sections = [
            {
                "section": "Methodology",
                "insight": methodology,
                "evidence": findings[0],
            },
            {
                "section": "Findings",
                "insight": findings[1] if len(findings) > 1 else findings[0],
                "evidence": findings[0],
            },
            {
                "section": "Limitations",
                "insight": findings[2] if len(findings) > 2 else findings[0],
                "evidence": findings[-1],
            },
        ]
        return {
            "objective": self._assertive(objective, "The paper addresses a concrete research objective."),
            "methodology": self._assertive(methodology, "The paper uses a defined empirical methodology."),
            "key_findings": [self._assertive(item, "The study provides concrete evidence.") for item in findings][:5],
            "important_sections": sections,
        }

    @staticmethod
    def _strip_source_prefixes(text: str) -> str:
        cleaned = re.sub(r"\b(Title|Abstract|Methods|Findings|Limitations|Future Work)\s*:\s*", "", text, flags=re.IGNORECASE)
        return " ".join(cleaned.split())

    def _fallback_reasoning_payload(self, structured: dict[str, Any]) -> dict[str, Any]:
        objective = str(structured.get("objective", "the research objective"))
        methodology = str(structured.get("methodology", "the methodology"))
        findings = structured.get("key_findings", [])
        finding_hint = findings[0] if findings else "the reported evidence pattern"
        return {
            "executive_summary": (
                f"The paper advances {objective} through {methodology}. "
                f"The current evidence leaves unresolved mechanism-level gaps that block robust transfer. "
                f"Resolving these gaps directly improves reliability and applied scientific value."
            ),
            "insights": [
                {
                    "problem": "Mechanism attribution remains unresolved under the reported evaluation design.",
                    "reasoning": f"The evaluation emphasizes aggregate outcomes while leaving causal drivers under-identified, so {finding_hint} does not isolate why the method succeeds.",
                    "implication": "Without mechanism attribution, follow-up studies cannot determine which interventions transfer across contexts.",
                    "direction": "Run controlled ablations with counterfactual diagnostics that isolate causal drivers instead of reporting only aggregate gains.",
                    "scores": {"novelty": 8.0, "feasibility": 6.8, "impact": 8.6},
                },
                {
                    "problem": "Boundary conditions are under-specified for failure-prone contexts.",
                    "reasoning": "The current evidence focuses on favorable settings, so failure modes and stress conditions remain under-characterized.",
                    "implication": "Unspecified boundary conditions inflate confidence and weaken deployment decisions.",
                    "direction": "Design stress-test protocols that map where the method fails and tie those failures to measurable context variables.",
                    "scores": {"novelty": 7.5, "feasibility": 7.2, "impact": 8.3},
                },
                {
                    "problem": "Evaluation metrics under-represent downstream scientific utility.",
                    "reasoning": "Primary metrics optimize benchmark performance but do not fully measure practical decision quality or reproducibility outcomes.",
                    "implication": "Metric mismatch causes high benchmark scores to overstate real-world value.",
                    "direction": "Adopt a metric suite that couples task performance with robustness, reproducibility, and decision-level utility.",
                    "scores": {"novelty": 7.8, "feasibility": 7.6, "impact": 8.1},
                },
            ],
        }

    def _validate_structured_payload(self, payload: dict[str, Any] | None) -> bool:
        if not isinstance(payload, dict):
            return False
        objective = str(payload.get("objective", "")).strip()
        methodology = str(payload.get("methodology", "")).strip()
        findings = payload.get("key_findings", [])
        sections = payload.get("important_sections", [])
        if not objective or not methodology:
            return False
        if not isinstance(findings, list) or len(findings) < 3:
            return False
        if not isinstance(sections, list) or len(sections) < 2:
            return False
        return True

    def _sanitize_structured_payload(
        self,
        payload: dict[str, Any],
        fallback: dict[str, Any],
    ) -> dict[str, Any]:
        objective = self._assertive(str(payload.get("objective", "")).strip(), fallback["objective"])
        methodology = self._assertive(str(payload.get("methodology", "")).strip(), fallback["methodology"])
        findings = payload.get("key_findings", fallback["key_findings"])
        if not isinstance(findings, list):
            findings = fallback["key_findings"]
        clean_findings = [self._assertive(str(item), "The study reports concrete evidence.") for item in findings if str(item).strip()]
        clean_findings = clean_findings[:6] or fallback["key_findings"]

        raw_sections = payload.get("important_sections", fallback["important_sections"])
        clean_sections: list[dict[str, str]] = []
        if isinstance(raw_sections, list):
            for item in raw_sections[:8]:
                if isinstance(item, dict):
                    section = self._assertive(str(item.get("section", "Section")).strip(), "Section")
                    insight = self._assertive(str(item.get("insight", "")).strip(), clean_findings[0])
                    evidence = self._assertive(str(item.get("evidence", "")).strip(), clean_findings[0])
                else:
                    section = "Section"
                    insight = self._assertive(str(item), clean_findings[0])
                    evidence = clean_findings[0]
                clean_sections.append({"section": section, "insight": insight, "evidence": evidence})

        if not clean_sections:
            clean_sections = fallback["important_sections"]

        return {
            "objective": objective,
            "methodology": methodology,
            "key_findings": clean_findings,
            "important_sections": clean_sections,
        }

    def _validate_reasoning_payload(self, payload: dict[str, Any] | None) -> bool:
        if not isinstance(payload, dict):
            return False
        insights = payload.get("insights", [])
        if not isinstance(insights, list) or not insights:
            return False
        for insight in insights[:3]:
            if not isinstance(insight, dict):
                return False
            for field in ("problem", "reasoning", "implication", "direction", "scores"):
                if field not in insight:
                    return False
            if not isinstance(insight.get("scores"), dict):
                return False
        return True

    def _sanitize_reasoning_payload(
        self,
        payload: dict[str, Any],
        fallback: dict[str, Any],
    ) -> dict[str, Any]:
        insights = payload.get("insights", fallback["insights"])
        if not isinstance(insights, list):
            insights = fallback["insights"]

        clean_insights: list[dict[str, Any]] = []
        for item in insights[:3]:
            if not isinstance(item, dict):
                continue
            clean_insights.append(
                {
                    "problem": self._assertive(str(item.get("problem", "")).strip(), "A high-value unresolved research problem remains."),
                    "reasoning": self._assertive(str(item.get("reasoning", "")).strip(), "The current evidence isolates outcomes but not their causal drivers."),
                    "implication": self._assertive(str(item.get("implication", "")).strip(), "Resolving the problem improves scientific reliability and decision quality."),
                    "direction": self._assertive(str(item.get("direction", "")).strip(), "Design targeted follow-up experiments with explicit failure diagnostics."),
                    "scores": {
                        "novelty": self._score10(item.get("scores", {}).get("novelty"), 7.6),
                        "feasibility": self._score10(item.get("scores", {}).get("feasibility"), 7.1),
                        "impact": self._score10(item.get("scores", {}).get("impact"), 8.2),
                    },
                }
            )
        if not clean_insights:
            clean_insights = fallback["insights"]

        summary = self._assertive(
            str(payload.get("executive_summary", "")).strip(),
            str(fallback.get("executive_summary", "")).strip() or "The paper reveals concrete, unresolved gaps with high-impact research directions.",
        )
        return {"executive_summary": summary, "insights": clean_insights}

    def _normalize_insight(
        self,
        raw: dict[str, Any],
        structured: dict[str, Any],
        ordinal: int,
    ) -> dict[str, Any]:
        problem = self._assertive(str(raw.get("problem", "")).strip(), "A critical unresolved research problem remains.")
        reasoning = self._assertive(str(raw.get("reasoning", "")).strip(), "Current evidence leaves causal drivers under-identified.")
        implication = self._assertive(str(raw.get("implication", "")).strip(), "Resolving this issue changes practical reliability and scientific trust.")
        direction = self._assertive(str(raw.get("direction", "")).strip(), "Run targeted follow-up experiments with explicit mechanism diagnostics.")

        if self._normalize_text(problem) == self._normalize_text(reasoning):
            reasoning = self._assertive(
                f"{reasoning} The methodological pathway does not isolate the mechanism that produces the observed effect.",
                reasoning,
            )
        if self._normalize_text(implication) in {self._normalize_text(problem), self._normalize_text(reasoning)}:
            implication = self._assertive(
                f"{implication} This directly shifts what evidence is required before deployment claims remain valid.",
                implication,
            )

        scores = raw.get("scores", {})
        novelty = self._score10(scores.get("novelty"), 7.6)
        feasibility = self._score10(scores.get("feasibility"), 7.2)
        impact = self._score10(scores.get("impact"), 8.1)
        overall = round((novelty * 0.4) + (feasibility * 0.25) + (impact * 0.35), 2)
        title = self._insight_title(problem, ordinal)
        evidence = self._evidence_for(problem, structured)

        return {
            "title": title,
            "problem": problem,
            "reasoning": reasoning,
            "implication": implication,
            "direction": direction,
            "scores": {"novelty": novelty, "feasibility": feasibility, "impact": impact},
            "overall_score": overall,
            "evidence": evidence,
        }

    def _fallback_insight(self, structured: dict[str, Any]) -> dict[str, Any]:
        finding = structured.get("key_findings", ["The paper reports measurable findings under defined conditions."])[0]
        return {
            "title": "Mechanism-Level Validation Gap",
            "problem": "The paper demonstrates performance gains without fully identifying the mechanism that produces those gains.",
            "reasoning": "The current evaluation links outcomes to methods at an aggregate level, which leaves mechanism attribution unresolved.",
            "implication": "Unresolved mechanism attribution blocks reliable transfer and weakens confidence in downstream scientific decisions.",
            "direction": "Run mechanism-targeted ablations with controlled confound diagnostics and explicit boundary-condition testing.",
            "scores": {"novelty": 7.8, "feasibility": 7.0, "impact": 8.5},
            "overall_score": 7.93,
            "evidence": [finding],
        }

    def _dedupe_and_rank_insights(self, insights: list[dict[str, Any]]) -> list[dict[str, Any]]:
        deduped: list[dict[str, Any]] = []
        for candidate in insights:
            duplicate_index = -1
            candidate_tokens = self._token_set(candidate["problem"])
            for idx, existing in enumerate(deduped):
                existing_tokens = self._token_set(existing["problem"])
                overlap = self._jaccard(candidate_tokens, existing_tokens)
                if overlap >= 0.58:
                    duplicate_index = idx
                    break
            if duplicate_index == -1:
                deduped.append(candidate)
                continue
            if candidate["overall_score"] > deduped[duplicate_index]["overall_score"]:
                deduped[duplicate_index] = candidate

        return sorted(deduped, key=lambda item: item.get("overall_score", 0.0), reverse=True)

    def _to_response_insight(
        self,
        insight: dict[str, Any],
        structured: dict[str, Any],
    ) -> dict[str, Any]:
        feasibility = insight["scores"]["feasibility"]
        impact_score = insight["scores"]["impact"]
        novelty = insight["scores"]["novelty"]
        vulnerability = "high" if feasibility <= 4.9 else "medium" if feasibility <= 7.4 else "low"
        impact_label = "high" if impact_score >= 7.6 else "medium" if impact_score >= 5.3 else "low"
        confidence = round(max(0.0, min(((novelty + impact_score + feasibility) / 30.0) + 0.12, 1.0)), 2)
        depth_score = round((novelty * 0.45) + (impact_score * 0.35) + ((10.0 - feasibility) * 0.2), 2)

        objective = structured.get("objective", "the paper objective")
        methodology = structured.get("methodology", "the study methodology")

        hidden_assumption = self._assertive(
            f"The paper assumes that {methodology} continues to hold under conditions not directly evaluated.",
            "The paper relies on an assumption that remains untested under high-variance conditions.",
        )
        methodological_weakness = self._assertive(
            f"The current design links outcomes to {objective} without isolating confound pathways.",
            "The methodology does not isolate confound pathways that can reverse the observed effects.",
        )
        conceptual_gap = self._assertive(
            f"The conceptual model does not specify failure boundaries for {insight['problem'].lower()}",
            "The conceptual model leaves failure boundaries under-specified.",
        )
        contradiction = self._assertive(
            "The confidence implied by aggregate results exceeds the granularity of evidence supporting those claims.",
            "Evidence granularity is narrower than the strength of the implied claims.",
        )

        direction_title = self._insight_title(insight["direction"], 1).replace("Gap", "Direction")
        return {
            "title": insight["title"],
            "problem": insight["problem"],
            "evidence": insight["evidence"],
            "why_gap_exists": insight["reasoning"],
            "why_it_matters": insight["implication"],
            "vulnerability": vulnerability,
            "impact": impact_label,
            "confidence": confidence,
            "depth_score": self._score10(depth_score, 7.5),
            "hidden_assumption": hidden_assumption,
            "methodological_weakness": methodological_weakness,
            "conceptual_gap": conceptual_gap,
            "contradiction": contradiction,
            "deep_insight": self._assertive(insight["reasoning"], insight["problem"]),
            "direction": {"title": direction_title, "approach": insight["direction"]},
            "scores": insight["scores"],
            "overall_score": self._score10(insight["overall_score"], 7.5),
        }

    def _build_limitations(
        self,
        structured: dict[str, Any],
        insights: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        section_items = structured.get("important_sections", [])
        findings = structured.get("key_findings", [])
        category_map: dict[str, list[dict[str, Any]]] = {}

        for idx, section in enumerate(section_items[:8]):
            if not isinstance(section, dict):
                continue
            section_name = str(section.get("section", "evaluation"))
            category = self._category_for(section_name)
            insight_anchor = insights[idx % len(insights)] if insights else None
            impact_text = (
                insight_anchor.get("why_it_matters", "This limitation weakens confidence in transfer and reproducibility.")
                if insight_anchor
                else "This limitation weakens confidence in transfer and reproducibility."
            )
            evidence = [
                self._assertive(str(section.get("evidence", "")).strip(), findings[0] if findings else "The evidence remains constrained."),
            ]
            if findings:
                evidence.append(self._assertive(findings[idx % len(findings)], "The findings remain context-bound."))

            entry = {
                "title": self._assertive(
                    f"{section_name} constraint",
                    "Evaluation constraint",
                ),
                "explanation": self._assertive(str(section.get("insight", "")).strip(), "The section establishes a concrete evidence limitation."),
                "evidence": evidence[:3],
                "impact": self._assertive(impact_text, "The limitation changes how strongly the current conclusions can be generalized."),
            }
            category_map.setdefault(category, []).append(entry)

        if not category_map:
            category_map["evaluation"] = [
                {
                    "title": "Evaluation scope constraint",
                    "explanation": "The analysis identifies a narrow validation envelope relative to practical deployment variation.",
                    "evidence": findings[:2] or ["Current evidence remains narrower than the strongest implied claims."],
                    "impact": "This limitation materially reduces confidence in broad transfer claims.",
                }
            ]

        ordered_categories = ["data", "methodology", "evaluation", "bias", "deployment"]
        grouped: list[dict[str, Any]] = []
        for category in ordered_categories:
            items = category_map.get(category, [])
            if items:
                grouped.append({"category": category, "items": items[:6]})
        return grouped or [{"category": "evaluation", "items": category_map["evaluation"]}]

    def _build_critical_reasoning(self, insights: list[dict[str, Any]]) -> dict[str, list[str]]:
        return {
            "hidden_assumptions": [item["hidden_assumption"] for item in insights][:4],
            "methodological_weaknesses": [item["methodological_weakness"] for item in insights][:4],
            "conceptual_gaps": [item["conceptual_gap"] for item in insights][:4],
            "contradictions": [item["contradiction"] for item in insights][:4],
            "deep_insights": [item["deep_insight"] for item in insights][:4],
        }

    def _build_improvements(
        self,
        payload: dict[str, Any],
        structured: dict[str, Any],
        insights: list[dict[str, Any]],
    ) -> dict[str, list[str]]:
        raw = payload.get("improvements", [])
        items = [self._assertive(str(item), "") for item in raw if str(item).strip()] if isinstance(raw, list) else []
        objective = structured.get("objective", "the central objective")
        methodology = structured.get("methodology", "the current methodology")

        missing_angles = items[:2] or [
            f"Test whether causal conclusions hold when {objective.lower()} is evaluated under explicitly shifted conditions.",
            "Quantify failure trajectories instead of reporting only aggregate endpoint gains.",
        ]
        additional_perspectives = items[2:4] or [
            f"Cross-validate {methodology.lower()} against stakeholder-level risk and utility metrics.",
            "Add subgroup and operational variability analysis to expose hidden trade-offs.",
        ]
        future_improvements = [
            insight["direction"]["approach"] for insight in insights[:3]
        ] or [
            "Run mechanism-targeted studies with confound controls and reproducibility checkpoints.",
        ]

        return {
            "missing_angles": missing_angles[:4],
            "additional_perspectives": additional_perspectives[:4],
            "future_improvements": [self._assertive(item, "Run a targeted follow-up study.") for item in future_improvements[:4]],
        }

    def _compose_executive_summary(self, structured: dict[str, Any], insights: list[dict[str, Any]]) -> str:
        top = insights[0]
        return self._assertive(
            (
                f"The paper targets {structured.get('objective', 'a concrete objective')} through "
                f"{structured.get('methodology', 'an explicit methodology')}. "
                f"The dominant unresolved issue is {top['problem'].lower()} because {top['reasoning'].lower()} "
                f"The highest-value next step is {top['direction'].lower()}"
            ),
            "The analysis identifies high-value unresolved problems with direct causal explanations and actionable directions.",
        )

    def _remaining_stage_timeout(self, started: float, requested: float, reserve: float) -> float:
        elapsed = time.perf_counter() - started
        remaining = max(8.0, self.max_pipeline_seconds - elapsed - reserve)
        return max(8.0, min(requested, remaining))

    def _evidence_for(self, problem: str, structured: dict[str, Any]) -> list[str]:
        pool: list[str] = []
        for section in structured.get("important_sections", []):
            if isinstance(section, dict):
                pool.extend(
                    [
                        str(section.get("insight", "")).strip(),
                        str(section.get("evidence", "")).strip(),
                    ]
                )
            else:
                pool.append(str(section).strip())
        pool.extend([str(item).strip() for item in structured.get("key_findings", [])])
        pool = [self._assertive(item, "") for item in pool if item]
        if not pool:
            return ["The structured analysis identifies a concrete unresolved evidence pattern."]

        tokens = self._token_set(problem)
        scored = sorted(
            ((self._jaccard(tokens, self._token_set(item)), item) for item in pool),
            key=lambda pair: pair[0],
            reverse=True,
        )
        selected = [item for _, item in scored[:3] if item]
        return selected or pool[:3]

    @staticmethod
    def _compose_text_from_papers(papers: list[dict[str, Any]], topic: str) -> str:
        if not papers:
            return (
                f"Topic: {topic}\n"
                "The source corpus contains limited entries, so this analysis synthesizes available methodology and findings evidence."
            )

        sections: list[str] = []
        for paper in papers:
            sections.append(
                f"Title: {paper.get('title', 'Untitled')}\n"
                f"Abstract: {paper.get('abstract', '')}\n"
                f"Methods: {', '.join(paper.get('methods', []))}\n"
                f"Findings: {paper.get('findings', '')}\n"
                f"Limitations: {'; '.join(paper.get('limitations', []))}\n"
                f"Future Work: {'; '.join(paper.get('future_work', []))}\n"
            )
        return "\n---\n".join(sections)[:26000]

    def _category_for(self, section_name: str) -> str:
        text = section_name.lower()
        if any(token in text for token in ("data", "dataset", "sample")):
            return "data"
        if any(token in text for token in ("method", "algorithm", "model")):
            return "methodology"
        if any(token in text for token in ("bias", "fairness", "demographic")):
            return "bias"
        if any(token in text for token in ("deploy", "production", "runtime", "latency")):
            return "deployment"
        return "evaluation"

    def _insight_title(self, text: str, ordinal: int) -> str:
        cleaned = " ".join(text.split())
        words = cleaned.split()
        if not words:
            return f"Research Gap {ordinal}"
        title_words = words[:7]
        return " ".join(word.capitalize() if word.islower() else word for word in title_words)

    def _assertive(self, text: str, fallback: str) -> str:
        value = " ".join((text or "").split())
        if not value:
            value = fallback
        replacements = {
            r"\bmay\b": "does",
            r"\bmight\b": "does",
            r"\bcould\b": "does",
            r"\bcan\b": "does",
            r"\bpossibly\b": "directly",
            r"\bperhaps\b": "directly",
        }
        for pattern, repl in replacements.items():
            value = re.sub(pattern, repl, value, flags=re.IGNORECASE)
        return value[:900]

    @staticmethod
    def _score10(value: Any, default: float) -> float:
        try:
            return round(max(0.0, min(float(value), 10.0)), 2)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _normalize_text(text: str) -> str:
        cleaned = re.sub(r"[^a-z0-9\s]", " ", text.lower())
        return " ".join(cleaned.split())

    def _token_set(self, text: str) -> set[str]:
        normalized = self._normalize_text(text)
        return {token for token in normalized.split() if len(token) >= 4}

    @staticmethod
    def _jaccard(left: set[str], right: set[str]) -> float:
        if not left or not right:
            return 0.0
        union = left.union(right)
        if not union:
            return 0.0
        return len(left.intersection(right)) / len(union)

    @staticmethod
    def _split_sentences(text: str) -> list[str]:
        candidates = re.split(r"(?<=[.!?])\s+", text.strip())
        cleaned = [" ".join(item.split()) for item in candidates if len(item.strip()) > 30]
        return cleaned[:12]


__all__ = ["GapForgePipeline", "InsufficientTextError"]
