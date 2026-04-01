import React, { useState } from "react";
import type { ProjectDirection } from "../lib/types";

type DirectionCardProps = {
  direction: ProjectDirection;
  index: number;
  allLimitations: string[];
};

export default function DirectionCard({ direction, index, allLimitations }: DirectionCardProps) {
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null);
  const [showLims, setShowLims] = useState(false);

  const priorityColors: Record<string, { bg: string, text: string }> = {
    high: { bg: "#fef3c7", text: "#b45309" },      // amber
    medium: { bg: "#dbeafe", text: "#1e40af" },   // blue
    low: { bg: "#f3f4f6", text: "#374151" },       // gray
  };

  const pColor = priorityColors[direction.priority] || priorityColors.medium;

  // Fake limitation matching simulator for the "Show 3 related limitations"
  const relatedLims = allLimitations.slice(0, 3); // Just grab first 3 for UI functional mockup accuracy

  return (
    <article className="card directionCard" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.4, flex: 1, color: 'var(--text)' }}>
          <span className="directionIndex">#{index + 1}</span> {direction.title}
        </h4>
        <span
          className="priorityBadge"
          style={{
            background: pColor.bg,
            color: pColor.text,
            border: "none",
            flexShrink: 0,
            marginTop: 2
          }}
        >
          {direction.priority} Impact
        </span>
      </div>

      <p className="scopeText" style={{ background: 'transparent', padding: 0, border: 'none', marginBottom: 12 }}>{direction.short_scope}</p>
      
      <div style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
        <span style={{ color: '#b45309', fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', marginRight: 6 }}>Why this matters:</span>
        <span className="muted">{direction.hypothesis}</span>
      </div>

      <div className="suggestedNextStep" style={{ marginBottom: 16 }}>
        <label>Suggested Next Step:</label>
        <span>Define benchmarks, implement focused method, report error</span>
      </div>

      {direction.citations.length > 0 && (
        <div className="directionCitations" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {direction.citations.map((c) => (
            <div key={`${direction.title}-${c.paper_id}`} className="citationRow" style={{ margin: 0 }}>
              <div 
                className="citationRowHeader"
                onClick={() => setExpandedCitation(expandedCitation === c.paper_id ? null : c.paper_id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color: 'var(--teal)'}}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <span className="citationTitle" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                    {c.title.length > 50 ? c.title.substring(0, 50) + '...' : c.title}
                  </span>
                </div>
                <div style={{ transform: expandedCitation === c.paper_id ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease', color: 'var(--muted)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
              {expandedCitation === c.paper_id && (
                <div className="citationRowContent" style={{ animation: 'expandDown 200ms ease' }}>
                  {c.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {relatedLims.length > 0 && (
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <div className="inlineExpander" onClick={() => setShowLims(!showLims)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color: 'var(--teal)'}}>
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            Show 3 related limitations
          </div>
          {showLims && (
            <div className="expandedContent" style={{ border: 'none', paddingTop: 4, marginTop: 4 }}>
              {relatedLims.map((lim, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--muted)', padding: '6px 0', borderBottom: i === relatedLims.length-1 ? 'none' : '1px dashed var(--line)' }}>
                  <span style={{ color: 'var(--red)', marginRight: 6 }}>▸</span>
                  {lim.length > 80 ? lim.substring(0, 80) + '...' : lim}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
