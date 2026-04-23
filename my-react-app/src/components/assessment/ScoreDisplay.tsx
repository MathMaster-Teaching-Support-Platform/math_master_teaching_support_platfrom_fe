interface ScoreDisplayProps {
  currentScore?: number;
  overrideScore?: number | null;
}

export function ScoreDisplay({ currentScore, overrideScore }: Readonly<ScoreDisplayProps>) {
  const hasOverride = overrideScore !== null && overrideScore !== undefined;
  const displayScore = hasOverride ? overrideScore : (currentScore ?? 0);
  
  return (
    <div className="score-display">
      <div className="score-display__item">
        <span className="score-display__label">Điểm</span>
        <span className="score-display__value score-display__value--current">
          {displayScore}
        </span>
      </div>
    </div>
  );
}
