import React, { useState } from "react";
import type { GapItem } from "../lib/types";

type GapCardProps = {
  gap: GapItem;
  index: number;
  onPaperClick: (id: string) => void;
};

export default function GapCard({ gap, index, onPaperClick }: GapCardProps) {
  const [showLims, setShowLims] = useState(false);

  const displayCitations = gap.citations.slice(0, 2);
  const remainingCount = gap.citations.length - 2;

  // Mocking related limitations for UI layout matching
  const relatedLims = [
    "Test algorithms using diverse real-world datasets.",
    "Adapt interpretability metrics across diverse demographic subgroups."
  ];

  return (
    <article className="card gapCard" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', borderLeft: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ color: 'var(--teal)', flexShrink: 0, marginTop: 2 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 className="gapStatement" style={{ fontSize: 14, fontWeight: 700, margin: 0, lineHeight: 1.4, color: 'var(--text)' }}>
            {gap.statement}
          </h4>
          
          {gap.citations.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {displayCitations.map(c => (
                <div 
                  key={c.paper_id} 
                  className="linkedPaperChip" 
                  style={{ margin: 0 }}
                  onClick={() => onPaperClick(c.paper_id)}
                  title={c.title}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 2, opacity: 0.6}}>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                  {c.title.length > 35 ? c.title.substring(0, 35) + '...' : c.title}
                </div>
              ))}
              {remainingCount > 0 && (
                <div className="linkedPaperChip chip-more" style={{ margin: 0 }}>
                  +{remainingCount} more
                </div>
              )}
            </div>
          )}
          
          <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 12, fontWeight: 500, lineHeight: 1.5 }}>
            {gap.rationale}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <div 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setShowLims(!showLims)}
        >
          <div className="inlineExpander" style={{ margin: 0, opacity: 1, color: 'var(--teal)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color: 'var(--teal)'}}>
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            Show 3 related limitations
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--muted)', transform: showLims ? 'rotate(90deg)' : 'none', transition: 'transform 200ms ease' }}>
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>

        {showLims && (
          <div className="expandedContent" style={{ border: 'none', paddingTop: 8, marginTop: 4 }}>
            {relatedLims.map((lim, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--muted)', padding: '6px 0', borderBottom: i === relatedLims.length-1 ? 'none' : '1px dashed var(--line)' }}>
                <span style={{ color: 'var(--red)', marginRight: 6 }}>▸</span>
                {lim}
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
