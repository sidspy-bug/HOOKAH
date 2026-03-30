type ScorePillProps = {
  label: string;
  score: number;
};

export default function ScorePill({ label, score }: ScorePillProps) {
  return (
    <div className="scorePill">
      <span>{label}</span>
      <strong>{score.toFixed(1)}/10</strong>
    </div>
  );
}
