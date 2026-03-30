import type { GapItem } from "../lib/types";

type GapCardProps = {
  gap: GapItem;
  index: number;
};

export default function GapCard({ gap, index }: GapCardProps) {
  return (
    <article className="card gapCard">
      <div className="gapHeader">
        <span className="gapIndex">Gap #{index + 1}</span>
        <span className="gapId">{gap.gap_id}</span>
      </div>
      <h4 className="gapStatement">{gap.statement}</h4>
      <p className="muted">{gap.rationale}</p>

      {gap.citations.length > 0 && (
        <div className="gapCitations">
          <h5>Supporting Evidence</h5>
          <ul>
            {gap.citations.map((c) => (
              <li key={`${gap.gap_id}-${c.paper_id}`}>
                <span className="citationId">{c.paper_id}</span>
                <span className="citationTitle">{c.title}</span>
                <p className="muted small">{c.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
