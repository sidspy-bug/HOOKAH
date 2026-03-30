import { useState } from "react";
import type { AnalyzedPaper } from "../lib/types";

type PaperCardProps = {
  paper: AnalyzedPaper;
};

export default function PaperCard({ paper }: PaperCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="card paperCard">
      <div className="rowBetween">
        <h4>{paper.title}</h4>
        <span className="badge">{paper.domain}</span>
      </div>
      <p className="muted small">{paper.year}</p>

      <div className={`paperAbstract ${expanded ? "expanded" : "collapsed"}`}>
        <p>{paper.abstract}</p>
        <p>
          <strong>Methods:</strong> {paper.methods.join(", ")}
        </p>
        <p>
          <strong>Findings:</strong> {paper.findings}
        </p>
        {paper.limitations.length > 0 && (
          <div className="limitationTags">
            {paper.limitations.map((lim, i) => (
              <span key={i} className="limitTag">
                {lim}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        className="expandBtn"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {expanded ? "Show less ▲" : "Show more ▼"}
      </button>
    </article>
  );
}
