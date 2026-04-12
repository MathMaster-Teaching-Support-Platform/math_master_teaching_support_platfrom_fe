interface ScoreDisplayProps {
  currentScore?: number;
  overrideScore?: number | null;
}

export function ScoreDisplay({ currentScore, overrideScore }: ScoreDisplayProps) {
  const hasOverride = overrideScore !== null && overrideScore !== undefined;
  const displayScore = hasOverride ? overrideScore : (currentScore ?? 0);
  
  return (
    <div className="score-display">
      <div className="score-display__item">
        <span className="score-display__label">Điểm mặc định</span>
        <span className={`score-display__value ${hasOverride ? 'score-display__value--dimmed' : ''}`}>
          {currentScore ?? 0}
        </span>
      </div>
      
      {hasOverride && (
        <div className="score-display__item score-display__item--override">
          <span className="score-display__label">Điểm override</span>
          <span className="score-display__value score-display__value--override">
            {overrideScore}
          </span>
        </div>
      )}
      
      {!hasOverride && (
        <div className="score-display__item">
          <span className="score-display__label">Điểm hiện tại</span>
          <span className="score-display__value score-display__value--current">
            {displayScore}
          </span>
        </div>
      )}
    </div>
  );
}
