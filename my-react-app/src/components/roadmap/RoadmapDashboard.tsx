import type { StudentRoadmapProgress } from '../../types';
import RoadmapProgressBar from './RoadmapProgressBar';
import './roadmap-dashboard.css';

interface RoadmapDashboardProps {
  readonly progress: StudentRoadmapProgress;
  readonly roadmapTitle: string;
}

export default function RoadmapDashboard(props: Readonly<RoadmapDashboardProps>) {
  const { progress, roadmapTitle } = props;
  return (
    <section className="roadmap-dashboard-widget">
      <header className="roadmap-dashboard-widget__header">
        <h2 className="roadmap-dashboard-widget__title">Roadmap Dashboard</h2>
        <span className="roadmap-dashboard-widget__roadmap">{roadmapTitle}</span>
      </header>

      <div className="roadmap-dashboard-widget__metrics">
        <article>
          <p>Completed lessons</p>
          <strong>{progress.completedLessons}</strong>
        </article>
        <article>
          <p>Total lessons</p>
          <strong>{progress.totalLessons}</strong>
        </article>
      </div>

      <RoadmapProgressBar value={progress.progressPercent} label="Overall progress" />
    </section>
  );
}
