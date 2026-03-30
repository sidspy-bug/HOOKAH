from __future__ import annotations

from app.agents.gap_synthesizer import GapSynthesizer
from app.agents.limitation_extractor import LimitationExtractor
from app.agents.novelty_validator import NoveltyValidator
from app.agents.paper_analyst import PaperAnalyst
from app.agents.ranking_agent import RankingAgent
from app.agents.scope_generator import ScopeGenerator
from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.data_loader import load_sample_papers


class GapForgePipeline:
    def __init__(self) -> None:
        self.paper_analyst = PaperAnalyst()
        self.limitation_extractor = LimitationExtractor()
        self.gap_synthesizer = GapSynthesizer()
        self.novelty_validator = NoveltyValidator()
        self.scope_generator = ScopeGenerator()
        self.ranking_agent = RankingAgent()

    def run(self, req: AnalyzeRequest) -> AnalyzeResponse:
        papers = load_sample_papers()
        selected_papers = self.paper_analyst.analyze(
            topic=req.topic,
            keywords=req.keywords,
            domain=req.domain,
            papers=papers,
            limit=6,
        )

        extracted = self.limitation_extractor.extract(selected_papers)
        gaps = self.gap_synthesizer.synthesize(extracted)

        directions: list[dict] = []
        for gap in gaps[:5]:
            scores = self.novelty_validator.score(gap, req.topic, req.keywords)
            scope = self.scope_generator.generate(req.topic, gap)
            directions.append(
                {
                    **scope,
                    **scores,
                    "citations": gap["citations"],
                }
            )

        ranked = self.ranking_agent.rank(directions)

        return AnalyzeResponse(
            topic=req.topic,
            normalized_keywords=[k.strip().lower() for k in req.keywords if k.strip()],
            analyzed_papers=[
                {
                    "paper_id": p["paper_id"],
                    "title": p["title"],
                    "domain": p["domain"],
                    "year": p["year"],
                    "abstract": p["abstract"],
                    "methods": p["methods"],
                    "findings": p["findings"],
                    "limitations": p["limitations"],
                }
                for p in selected_papers
            ],
            extracted_limitations=[e["text"] for e in extracted],
            identified_research_gaps=[
                {
                    "gap_id": g["gap_id"],
                    "statement": g["statement"],
                    "rationale": g["rationale"],
                    "citations": g["citations"],
                }
                for g in gaps
            ],
            top_suggested_research_directions=ranked,
        )
