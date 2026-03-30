export type Citation = {
  paper_id: string;
  title: string;
  reason: string;
};

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

export type GapItem = {
  gap_id: string;
  statement: string;
  rationale: string;
  citations: Citation[];
};

export type ProjectDirection = {
  title: string;
  hypothesis: string;
  short_scope: string;
  novelty_score: number;
  feasibility_score: number;
  impact_score: number;
  overall_score: number;
  citations: Citation[];
  priority: "high" | "medium" | "low";
};

export type AnalyzeResponse = {
  topic: string;
  normalized_keywords: string[];
  analyzed_papers: AnalyzedPaper[];
  extracted_limitations: string[];
  identified_research_gaps: GapItem[];
  top_suggested_research_directions: ProjectDirection[];
};
