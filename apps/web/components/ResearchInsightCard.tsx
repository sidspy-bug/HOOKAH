import type { InsightItem } from "../lib/types";

type ResearchInsightCardProps = {
  insight: InsightItem;
  index: number;
};

function severityColor(level: "low" | "medium" | "high"): { bg: string; text: string } {
  if (level === "high") return { bg: "#fee2e2", text: "#b91c1c" };
  if (level === "medium") return { bg: "#fef3c7", text: "#92400e" };
  return { bg: "#dcfce7", text: "#166534" };
}

function scoreFill(score: number): string {
  if (score >= 8) return "#0f7a52";
  if (score >= 6) return "#1a65a6";
  return "#b45309";
}

export default function ResearchInsightCard({ insight, index }: ResearchInsightCardProps) {
  const vulnerabilityStyle = severityColor(insight.vulnerability);
  const impactStyle = severityColor(insight.impact);

  return (
    <article className="card researchInsightCard">
      <div className="insightTop">
        <div>
          <div className="insightIndex">Insight #{index + 1}</div>
          <h3 className="insightTitle">{insight.title}</h3>
        </div>
        <div className="insightOverallWrap">
          <span className="insightOverallLabel">Overall</span>
          <strong className="insightOverallScore">{insight.overall_score.toFixed(1)}</strong>
          <span className="insightOverallScale">/10</span>
        </div>
      </div>

      <div className="insightMetaRow">
        <span className="insightTag" style={{ background: vulnerabilityStyle.bg, color: vulnerabilityStyle.text }}>
          Vulnerability: {insight.vulnerability}
        </span>
        <span className="insightTag" style={{ background: impactStyle.bg, color: impactStyle.text }}>
          Impact: {insight.impact}
        </span>
        <span className="insightTag neutralTag">
          Confidence: {Math.round(insight.confidence * 100)}%
        </span>
        <span className="insightTag neutralTag">
          Depth: {insight.depth_score.toFixed(1)}/10
        </span>
      </div>

      <section className="insightBlock">
        <h4>Problem</h4>
        <p>{insight.problem}</p>
      </section>

      <section className="insightBlock">
        <h4>Evidence</h4>
        <ul className="insightEvidenceList">
          {insight.evidence.map((item, itemIndex) => (
            <li key={`${insight.title}-evidence-${itemIndex}`}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="insightBlock">
        <h4>Why Gap Exists</h4>
        <p>{insight.why_gap_exists}</p>
      </section>

      <section className="insightBlock">
        <h4>Why It Matters</h4>
        <p>{insight.why_it_matters}</p>
      </section>

      <section className="insightBlock">
        <h4>Hidden Assumption</h4>
        <p>{insight.hidden_assumption}</p>
      </section>

      <section className="insightBlock">
        <h4>Methodological Weakness</h4>
        <p>{insight.methodological_weakness}</p>
      </section>

      <section className="insightBlock">
        <h4>Conceptual Gap</h4>
        <p>{insight.conceptual_gap}</p>
      </section>

      <section className="insightBlock">
        <h4>Contradiction or Overclaim</h4>
        <p>{insight.contradiction}</p>
      </section>

      <section className="insightBlock">
        <h4>Deep Insight</h4>
        <p>{insight.deep_insight}</p>
      </section>

      <section className="insightDirection">
        <h4>Direction</h4>
        <p className="insightDirectionTitle">{insight.direction.title}</p>
        <p>{insight.direction.approach}</p>
      </section>

      <section className="scoreGrid">
        <div className="scoreBarWrap">
          <div className="scoreBarLabel">
            <span>Novelty</span>
            <strong>{insight.scores.novelty.toFixed(1)}</strong>
          </div>
          <div className="scoreBarTrack">
            <div
              className="scoreBarFill"
              style={{ width: `${insight.scores.novelty * 10}%`, background: scoreFill(insight.scores.novelty) }}
            />
          </div>
        </div>

        <div className="scoreBarWrap">
          <div className="scoreBarLabel">
            <span>Feasibility</span>
            <strong>{insight.scores.feasibility.toFixed(1)}</strong>
          </div>
          <div className="scoreBarTrack">
            <div
              className="scoreBarFill"
              style={{ width: `${insight.scores.feasibility * 10}%`, background: scoreFill(insight.scores.feasibility) }}
            />
          </div>
        </div>

        <div className="scoreBarWrap">
          <div className="scoreBarLabel">
            <span>Impact</span>
            <strong>{insight.scores.impact.toFixed(1)}</strong>
          </div>
          <div className="scoreBarTrack">
            <div
              className="scoreBarFill"
              style={{ width: `${insight.scores.impact * 10}%`, background: scoreFill(insight.scores.impact) }}
            />
          </div>
        </div>
      </section>
    </article>
  );
}
