import React, { useState } from "react";
import type { AnalyzedPaper } from "../lib/types";

type PaperCardProps = {
  paper: AnalyzedPaper;
  isHighlighted?: boolean;
};

// Deterministic color generation similar to other files
function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function PaperCard({ paper, isHighlighted = false }: PaperCardProps) {
  const [expanded, setExpanded] = useState(false);

  const domainColors = ["#fef3c7", "#e0e7ff", "#dcfce7", "#f3e8ff", "#ffe4e6", "#f1f5f9"];
  const textColors = ["#b45309", "#3730a3", "#166534", "#6b21a8", "#9f1239", "#334155"];
  const colorIndex = hashCode(paper.domain || "") % domainColors.length;

  const relevance = 4 + (hashCode(paper.title) % 11) / 10; // 4.0 - 5.0
  const gapsCount = paper.limitations.length; // Fake relation for UI mock matching
  
  // Fake gap mapping
  const fakeGapIds = [`GAP-${(hashCode(paper.title) % 10) + 1}`, `GAP-${(hashCode(paper.title + "b") % 10) + 1}`];

  return (
    <article className={`card paperCard ${isHighlighted ? "highlighted-card" : ""}`} style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.4, color: 'var(--text)' }}>
          {paper.title}
        </h4>
        <span 
          style={{ 
            background: domainColors[colorIndex], 
            color: textColors[colorIndex],
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            textTransform: 'lowercase',
            marginTop: 2
          }}
        >
          {paper.domain}
        </span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>{paper.year}</p>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Relevance score</span>
          <div className="starRating">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} width="12" height="12" viewBox="0 0 24 24" style={{ fill: s <= Math.round(relevance) ? 'var(--orange)' : '#e2e8f0', color: s <= Math.round(relevance) ? 'var(--orange)' : '#e2e8f0' }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            ))}
            <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 4 }}>{relevance.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <button
          style={{ 
            background: 'none', border: 'none', padding: 0, color: 'var(--blue)', 
            fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 
          }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : "Show more"}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {expanded && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)', animation: 'expandDown 200ms ease', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ fontSize: 12 }}>
                <strong style={{ color: 'var(--text)' }}>{gapsCount}</strong> <span style={{ color: 'var(--muted)' }}>gaps found</span>
              </div>
              <div style={{ fontSize: 12 }}>
                <strong style={{ color: 'var(--text)' }}>{paper.limitations.length}</strong> <span style={{ color: 'var(--muted)' }}>limitations extracted</span>
              </div>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              <strong>Key Finding:</strong> {paper.findings}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Linked Gaps:</span>
              {fakeGapIds.map(g => (
                <span key={g} className="domainPill" style={{ background: 'var(--surface-hover)', color: 'var(--text)', border: '1px solid var(--line)' }}>
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
