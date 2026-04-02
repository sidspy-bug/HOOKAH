export type AnalyzedPaper = {
  paper_id: string;
  title: string;
  domain: string;
  year: number;
  abstract: string;
  methods: string[];
  findings: string;
  limitations: string[];
};

export type Overview = {
  title: string;
  executive_summary: string;
  objective: string;
  methodology: string;
  key_findings: string[];
};

export type LimitationEntry = {
  title: string;
  explanation: string;
  evidence: string[];
  impact: string;
};

export type LimitationGroup = {
  category: "data" | "methodology" | "evaluation" | "bias" | "deployment";
  items: LimitationEntry[];
};

export type LimitationsSection = {
  grouped: LimitationGroup[];
};

export type CriticalReasoningSection = {
  hidden_assumptions: string[];
  methodological_weaknesses: string[];
  conceptual_gaps: string[];
  contradictions: string[];
  deep_insights: string[];
};

export type AnalysisImprovements = {
  missing_angles: string[];
  additional_perspectives: string[];
  future_improvements: string[];
};

export type InsightItem = {
  title: string;
  problem: string;
  evidence: string[];
  why_gap_exists: string;
  why_it_matters: string;
  vulnerability: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  confidence: number;
  depth_score: number;
  hidden_assumption: string;
  methodological_weakness: string;
  conceptual_gap: string;
  contradiction: string;
  deep_insight: string;
  direction: {
    title: string;
    approach: string;
  };
  scores: {
    novelty: number;
    feasibility: number;
    impact: number;
  };
  overall_score: number;
};

export type ResearchGap = {
  title: string;
  problem: string;
  evidence: string[];
  why_gap_exists: string;
  why_it_matters: string;
  vulnerability: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  confidence: number;
  depth_score: number;
};

export type DirectionItem = {
  title: string;
  linked_gap: string;
  approach: string;
  scores: {
    novelty: number;
    feasibility: number;
    impact: number;
  };
  overall_score: number;
};

export type AnalyzeResponse = {
  overview: Overview;
  limitations: LimitationsSection;
  critical_reasoning: CriticalReasoningSection;
  research_gaps: ResearchGap[];
  directions: DirectionItem[];
  insights: InsightItem[];
  most_critical_insight: InsightItem;
  analysis_improvements: AnalysisImprovements;
};
