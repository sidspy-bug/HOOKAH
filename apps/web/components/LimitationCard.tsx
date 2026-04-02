import React, { useState } from "react";
import type { LimitationEntry, LimitationGroup } from "../lib/types";

type LimitationCardProps = {
  limitation: LimitationEntry;
  category: LimitationGroup["category"];
};

export default function LimitationCard({ limitation, category }: LimitationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const evidenceItems = limitation.evidence || [];

  return (
    <article className="limitationCard">
      <div className="limHeader">
        <span className="limSeverityBadge moderate">
          {categoryLabel}
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
        <strong>{limitation.title}</strong>
      </div>

      <div className="limRemediation" style={{ color: "var(--text)" }}>
        {limitation.explanation}
      </div>

      <div className="suggestedNextStep" style={{ marginTop: 10 }}>
        <label>Research impact:</label>
        <span>{limitation.impact}</span>
      </div>

      {expanded && (
        <div className="expandedContent">
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Evidence
          </label>
          <ul className="insightEvidenceList" style={{ marginTop: 8 }}>
            {evidenceItems.map((item, itemIndex) => (
              <li key={`${limitation.title}-${itemIndex}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
