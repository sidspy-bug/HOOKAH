import type { ProjectDirection } from "../lib/types";
import ScorePill from "./ScorePill";

type DirectionCardProps = {
  direction: ProjectDirection;
  index: number;
};

export default function DirectionCard({ direction, index }: DirectionCardProps) {
  return (
    <article className="card directionCard">
      <div className="rowBetween">
        <h4>
          #{index + 1} {direction.title}
        </h4>
        <span className={`priority ${direction.priority}`}>{direction.priority}</span>
      </div>
      <p className="muted">{direction.hypothesis}</p>
      <p>{direction.short_scope}</p>

      <div className="scoreGrid">
        <ScorePill label="Novelty" score={direction.novelty_score} />
        <ScorePill label="Feasibility" score={direction.feasibility_score} />
        <ScorePill label="Impact" score={direction.impact_score} />
        <ScorePill label="Overall" score={direction.overall_score} />
      </div>

      <div>
        <h5>Citations</h5>
        <ul>
          {direction.citations.map((c) => (
            <li key={`${direction.title}-${c.paper_id}-${c.reason}`}>
              <strong>{c.paper_id}</strong> — {c.title}
              <div className="muted small">{c.reason}</div>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
