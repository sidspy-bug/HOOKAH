from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    topic: str = Field(..., min_length=4, max_length=240)
    keywords: list[str] = Field(default_factory=list)
    domain: str | None = Field(default=None, max_length=120)


class Citation(BaseModel):
    paper_id: str
    title: str
    reason: str


class AnalyzedPaper(BaseModel):
    paper_id: str
    title: str
    domain: str
    year: int
    abstract: str
    methods: list[str]
    findings: str
    limitations: list[str]


class GapItem(BaseModel):
    gap_id: str
    statement: str
    rationale: str
    citations: list[Citation]


class ProjectDirection(BaseModel):
    title: str
    hypothesis: str
    short_scope: str
    novelty_score: float
    feasibility_score: float
    impact_score: float
    overall_score: float
    citations: list[Citation]
    priority: Literal["high", "medium", "low"]


class AnalyzeResponse(BaseModel):
    topic: str
    normalized_keywords: list[str]
    analyzed_papers: list[AnalyzedPaper]
    extracted_limitations: list[str]
    identified_research_gaps: list[GapItem]
    top_suggested_research_directions: list[ProjectDirection]
