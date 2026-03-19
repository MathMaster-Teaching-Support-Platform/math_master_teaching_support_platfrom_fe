import { Link } from 'react-router-dom';
import type { RoadmapCatalogItem } from '../../types';
import RoadmapProgressBar from './RoadmapProgressBar';
import './roadmap-card.css';

interface RoadmapCardProps {
  readonly roadmap: RoadmapCatalogItem;
  readonly progressPercent?: number;
}

export default function RoadmapCard(props: Readonly<RoadmapCardProps>) {
  const { roadmap, progressPercent } = props;
  return (
    <article className="roadmap-card">
      <div className="roadmap-card__header">
        <p className="roadmap-card__level">{roadmap.subject} • Grade {roadmap.gradeLevel}</p>
        <span className={`roadmap-card__status roadmap-card__status--${roadmap.status.toLowerCase()}`}>
          {roadmap.status}
        </span>
      </div>
      <h3 className="roadmap-card__title">{roadmap.name}</h3>
      <p className="roadmap-card__description">{roadmap.description}</p>

      <div className="roadmap-card__stats">
        <span>{roadmap.totalTopicsCount} topics</span>
        <span>{roadmap.completedTopicsCount} completed</span>
        <span>{Math.round(roadmap.progressPercentage)}%</span>
      </div>

      <RoadmapProgressBar value={progressPercent ?? 0} label="Completion" />

      <div className="roadmap-card__actions">
        <Link to={`/roadmaps/${roadmap.id}`} className="roadmap-card__cta">
          View roadmap
        </Link>
      </div>
    </article>
  );
}
