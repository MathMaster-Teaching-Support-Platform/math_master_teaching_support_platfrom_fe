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
        <p className="roadmap-card__level">{roadmap.level}</p>
        <span className={`roadmap-card__status roadmap-card__status--${roadmap.status.toLowerCase()}`}>
          {roadmap.status}
        </span>
      </div>
      <h3 className="roadmap-card__title">{roadmap.title}</h3>
      <p className="roadmap-card__description">{roadmap.description}</p>

      <div className="roadmap-card__stats">
        <span>{roadmap.moduleCount} modules</span>
        <span>{roadmap.lessonCount} lessons</span>
        <span>{roadmap.estimatedHours}h</span>
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
