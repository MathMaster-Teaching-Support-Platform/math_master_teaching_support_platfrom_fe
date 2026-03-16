import './roadmap-progress-bar.css';

type RoadmapProgressBarProps = Readonly<{
  value: number;
  label?: string;
}>;

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export default function RoadmapProgressBar(props: Readonly<RoadmapProgressBarProps>) {
  const { value, label } = props;
  const safeValue = clamp(value);

  return (
    <div className="roadmap-progress-bar">
      <div className="roadmap-progress-bar__meta">
        <span>{label ?? 'Progress'}</span>
        <strong>{safeValue.toFixed(0)}%</strong>
      </div>
      <div className="roadmap-progress-bar__track">
        <div className="roadmap-progress-bar__fill" style={{ width: `${safeValue}%` }} />
      </div>
      <progress className="roadmap-progress-bar__native" max={100} value={safeValue}>
        {safeValue}%
      </progress>
    </div>
  );
}
