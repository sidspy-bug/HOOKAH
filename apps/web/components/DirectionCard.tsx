import type { ProjectDirection } from "../lib/types";

type DirectionCardProps = {
  direction: ProjectDirection;
  index: number;
};

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  const pct = Math.min(100, (score / 10) * 100);
  return (
    <div className="scoreBarWrap">
      <div className="scoreBarLabel">
        <span>{label}</span>
        <strong>{score.toFixed(1)}</strong>
      </div>
      <div className="scoreBarTrack">
        <div
          className="scoreBarFill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function DirectionCard({ direction, index }: DirectionCardProps) {
  const priorityColors: Record<string, string> = {
    high: "var(--text)",      // slate-900 equivalent for high priority
    medium: "var(--muted)",   // slate-500 equivalent
    low: "var(--line)",       // light edge color, but text needs to be dark
  };

  return (
    <article className="card directionCard">
      <div className="rowBetween">
        <h4>
          <span className="directionIndex">#{index + 1}</span> {direction.title}
        </h4>
        <span
          className="priorityBadge"
          style={{
            background: priorityColors[direction.priority] || "var(--muted)",
            color: direction.priority === "low" ? "var(--text)" : "#fff",
            border: direction.priority === "low" ? "1px solid var(--line)" : "none"
          }}
        >
          {direction.priority}
        </span>
      </div>

      <p className="muted hypothesis">{direction.hypothesis}</p>
      <p className="scopeText">{direction.short_scope}</p>

      <div className="scoreGrid">
        <ScoreBar label="Novelty" score={direction.novelty_score} color="var(--muted)" />
        <ScoreBar label="Feasibility" score={direction.feasibility_score} color="var(--muted)" />
        <ScoreBar label="Impact" score={direction.impact_score} color="var(--muted)" />
        <ScoreBar
          label="Overall"
          score={direction.overall_score}
          color="var(--text)"
        />
      </div>

      {direction.citations.length > 0 && (
        <div className="directionCitations">
          <h5>Citations</h5>
          <ul>
            {direction.citations.map((c) => (
              <li key={`${direction.title}-${c.paper_id}-${c.reason}`}>
                <span className="citationId">{c.paper_id}</span>
                <span className="citationTitle">{c.title}</span>
                <div className="muted small">{c.reason}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
