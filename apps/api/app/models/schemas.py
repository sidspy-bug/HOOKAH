from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    topic: str = Field(..., min_length=4, max_length=240)
    keywords: list[str] = Field(default_factory=list)
    domain: Optional[str] = Field(default=None, max_length=120)


class Overview(BaseModel):
    title: str
    executive_summary: str
    objective: str
    methodology: str
    key_findings: list[str] = Field(default_factory=list)


class LimitationEntry(BaseModel):
    title: str
    explanation: str
    evidence: list[str] = Field(default_factory=list)
    impact: str


class LimitationGroup(BaseModel):
    category: Literal["data", "methodology", "evaluation", "bias", "deployment"]
    items: list[LimitationEntry] = Field(default_factory=list)


class LimitationsSection(BaseModel):
    grouped: list[LimitationGroup] = Field(default_factory=list)


class CriticalReasoningSection(BaseModel):
    hidden_assumptions: list[str] = Field(default_factory=list)
    methodological_weaknesses: list[str] = Field(default_factory=list)
    conceptual_gaps: list[str] = Field(default_factory=list)
    contradictions: list[str] = Field(default_factory=list)
    deep_insights: list[str] = Field(default_factory=list)


class AnalysisImprovements(BaseModel):
    missing_angles: list[str] = Field(default_factory=list)
    additional_perspectives: list[str] = Field(default_factory=list)
    future_improvements: list[str] = Field(default_factory=list)


class InsightDirection(BaseModel):
    title: str
    approach: str


class InsightScores(BaseModel):
    novelty: float = Field(..., ge=0.0, le=10.0)
    feasibility: float = Field(..., ge=0.0, le=10.0)
    impact: float = Field(..., ge=0.0, le=10.0)


class InsightItem(BaseModel):
    title: str
    problem: str
    evidence: list[str] = Field(..., min_length=1)
    why_gap_exists: str
    why_it_matters: str
    vulnerability: Literal["low", "medium", "high"]
    impact: Literal["low", "medium", "high"]
    confidence: float = Field(..., ge=0.0, le=1.0)
    depth_score: float = Field(..., ge=1.0, le=10.0)
    hidden_assumption: str
    methodological_weakness: str
    conceptual_gap: str
    contradiction: str
    deep_insight: str
    direction: InsightDirection
    scores: InsightScores
    overall_score: float = Field(..., ge=0.0, le=10.0)


class ResearchGap(BaseModel):
    title: str
    problem: str
    evidence: list[str] = Field(default_factory=list)
    why_gap_exists: str
    why_it_matters: str
    vulnerability: Literal["low", "medium", "high"]
    impact: Literal["low", "medium", "high"]
    confidence: float = Field(..., ge=0.0, le=1.0)
    depth_score: float = Field(..., ge=1.0, le=10.0)


class DirectionItem(BaseModel):
    title: str
    linked_gap: str
    approach: str
    scores: InsightScores
    overall_score: float = Field(..., ge=0.0, le=10.0)


class AnalyzeResponse(BaseModel):
    overview: Overview
    limitations: LimitationsSection
    critical_reasoning: CriticalReasoningSection
    research_gaps: list[ResearchGap] = Field(default_factory=list)
    directions: list[DirectionItem] = Field(default_factory=list)
    insights: list[InsightItem] = Field(default_factory=list)
    most_critical_insight: InsightItem
    analysis_improvements: AnalysisImprovements
