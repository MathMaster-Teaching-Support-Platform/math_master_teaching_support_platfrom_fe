import { Link } from 'react-router-dom';
import type { RoadmapCatalogItem } from '../../types';
import './roadmap-card.css';

interface RoadmapCardProps {
  readonly roadmap: RoadmapCatalogItem;
  readonly progressPercent?: number;
}

const STATUS_LABELS: Record<string, string> = {
  PUBLISHED: 'Đã công khai',
  DRAFT: 'Nháp',
  ARCHIVED: 'Lưu trữ',
  GENERATED: 'Sẵn sàng',
  IN_PROGRESS: 'Đang học',
  COMPLETED: 'Hoàn thành',
};

export default function RoadmapCard({ roadmap, progressPercent = 0 }: Readonly<RoadmapCardProps>) {
  const pct = Math.min(100, Math.max(0, progressPercent));
  const hasProgress = pct > 0;

  return (
    <article className={`rmc ${hasProgress ? 'rmc--active' : ''}`}>
      <div className="rmc__accent" aria-hidden="true" />
      <div className="rmc__inner">
        <div className="rmc__tags">
          <span className="rmc__tag rmc__tag--subject">{roadmap.subject}</span>
          <span className="rmc__tag rmc__tag--grade">Lớp {roadmap.gradeLevel}</span>
          <span className={`rmc__status rmc__status--${roadmap.status.toLowerCase()}`}>
            {STATUS_LABELS[roadmap.status] ?? roadmap.status}
          </span>
        </div>

        <h3 className="rmc__title">{roadmap.name}</h3>

        {roadmap.description && <p className="rmc__desc">{roadmap.description}</p>}

        <div className="rmc__stats">
          <div className="rmc__stat">
            <strong>{roadmap.totalTopicsCount ?? 0}</strong>
            <span>Chủ đề</span>
          </div>
          <div className="rmc__stat">
            <strong>{roadmap.completedTopicsCount ?? 0}</strong>
            <span>Hoàn thành</span>
          </div>
          {hasProgress && (
            <div className="rmc__stat">
              <strong>{Math.round(pct)}%</strong>
              <span>Tiến độ</span>
            </div>
          )}
        </div>

        {hasProgress && (
          <div className="rmc__bar-track">
            <div className="rmc__bar-fill" style={{ width: `${pct}%` }} />
          </div>
        )}

        <div className="rmc__footer">
          <Link
            to={`/roadmaps/${roadmap.id}`}
            className={`rmc__cta ${hasProgress ? 'rmc__cta--continue' : 'rmc__cta--start'}`}
          >
            {hasProgress ? 'Tiếp tục học →' : 'Bắt đầu học →'}
          </Link>
        </div>
      </div>
    </article>
  );
}
