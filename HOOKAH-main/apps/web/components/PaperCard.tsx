import type { AnalyzedPaper } from "../lib/types";

type PaperCardProps = {
  paper: AnalyzedPaper;
};

export default function PaperCard({ paper }: PaperCardProps) {
  return (
    <article className="card paperCard">
      <div className="rowBetween">
        <h4>{paper.title}</h4>
        <span className="badge">{paper.domain}</span>
      </div>
      <p className="muted small">{paper.year}</p>
      <p>{paper.abstract}</p>
      <p>
        <strong>Methods:</strong> {paper.methods.join(", ")}
      </p>
      <p>
        <strong>Findings:</strong> {paper.findings}
      </p>
    </article>
  );
}
