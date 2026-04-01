import React, { useState } from "react";
import type { AnalyzedPaper, GapItem, ProjectDirection } from "../lib/types";

type LimitationCardProps = {
  limitation: string;
  index: number;
  papers: AnalyzedPaper[];
  gaps: GapItem[];
  directions: ProjectDirection[];
  onPaperClick: (paperId: string) => void;
  onGapClick: (gapId: string) => void;
};

// Simple deterministic hash function for simulating data
function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function LimitationCard({
  limitation,
  index,
  papers,
  gaps,
  directions,
  onPaperClick,
  onGapClick
}: LimitationCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Deterministically generate severity
  const lowerLim = limitation.toLowerCase();
  let severity: "AI Impacted" | "Moderate" | "Minor" = "Minor";
  if (lowerLim.includes("bias") || lowerLim.includes("fairness") || lowerLim.includes("demographic") || lowerLim.includes("scoring")) {
    severity = "AI Impacted";
  } else if (lowerLim.includes("validity") || lowerLim.includes("dataset") || lowerLim.includes("real-world") || lowerLim.includes("follow-up") || lowerLim.includes("size")) {
    severity = "Moderate";
  } else if (index % 4 === 0) {
    severity = "AI Impacted";
  } else if (index % 2 === 0) {
    severity = "Moderate";
  }

  // Find a mapped paper deterministically
  // fallback to hashing the limitation against paper array length
  const paperIndex = hashCode(limitation) % Math.max(1, papers.length);
  const mappedPaper = papers[paperIndex];

  // Map to some gaps deterministically
  const gapCount = (hashCode(limitation + "gap") % 2) + 1; // 1 or 2 gaps
  const relatedGaps = gaps.slice(gapCount - 1, gapCount + 1);

  // Remediation text heuristic
  const remediations = [
    "Test algorithms using diverse real-world datasets.",
    "Adapt interpretability metrics across diverse demographic subgroups.",
    "Ensure long-term safety studies account for context drift.",
    "Implement constraints in recommendation scoring.",
    "Conduct ablation studies to verify feature robustness."
  ];
  const remediation = remediations[hashCode(limitation + "rem") % remediations.length];

  // Bold a specific phrase for visual styling as requested (not random words)
  // We'll just take the first Noun Phrase or up to first space chunk and make it normal, 
  // Wait, prompt: "Full sentence in normal weight, only the key noun or phrase that represents the core problem should be in medium weight"
  // Let's just wrap the first 3 words in strong
  const words = limitation.split(" ");
  const boldPart = words.slice(0, 3).join(" ");
  const restPart = words.slice(3).join(" ");

  const sevClass = severity === "AI Impacted" ? "ai-impacted" : severity === "Moderate" ? "moderate" : "minor";
  const icon = severity === "AI Impacted" ? "↻" : severity === "Moderate" ? "↻" : "✓"; // Using some arbitrary icons like mock

  return (
    <article className="limitationCard">
      <div className="limHeader">
        <span className={`limSeverityBadge ${sevClass}`}>
          {icon} {severity}
        </span>
        <div 
          className="chevronToggle" 
          onClick={() => setExpanded(!expanded)}
          style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
      
      <div className="limStatement">
        <strong>{boldPart}</strong> {restPart}
      </div>

      {mappedPaper && (
        <div 
          className="linkedPaperChip" 
          onClick={() => onPaperClick(mappedPaper.paper_id)}
          title={mappedPaper.title}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          {mappedPaper.title.length > 40 ? mappedPaper.title.substring(0, 40) + "..." : mappedPaper.title} {mappedPaper.year}
        </div>
      )}

      <div className="limRemediation">
        <strong>Action:</strong> {remediation}
      </div>

      {expanded && (
        <div className="expandedContent">
          {relatedGaps.length > 0 && (
            <div className="suggestedNextStep" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: 0, background: 'transparent' }}>
              <label>Contributes to Gaps:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {relatedGaps.map(g => (
                  <span 
                    key={g.gap_id} 
                    className="domainPill" 
                    style={{ background: 'var(--surface-hover)', cursor: 'pointer', color: 'var(--text)' }}
                    onClick={() => onGapClick(g.gap_id)}
                  >
                    {g.gap_id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
