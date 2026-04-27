import React from 'react';
import { CheckCircle2, ChevronRight, Circle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RoadmapCatalogItem } from '../../../types';

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    COMPLETED: 'Hoàn thành',
    IN_PROGRESS: 'Đang học',
    GENERATED: 'Sẵn sàng',
    ARCHIVED: 'Lưu trữ',
  };
  return map[status] ?? status;
}

const RoadmapCard: React.FC<{ roadmap: RoadmapCatalogItem }> = ({ roadmap }) => {
  return (
    <Link
      to={`/roadmaps/${roadmap.id}`}
      className={`srp__grid-card srp__grid-card--${roadmap.status.toLowerCase()}`}
    >
      <div className="srp__grid-card-top">
        <span className={`srp__badge srp__badge--${roadmap.status.toLowerCase()}`}>
          <Circle className="srp__badge-dot" />
          {statusLabel(roadmap.status)}
        </span>
        <ChevronRight className="srp__grid-card-arrow" />
      </div>

      <h3 className="srp__grid-card-title">{roadmap.name}</h3>
      <p className="srp__grid-card-meta">
        {roadmap.subject} · Lớp {roadmap.gradeLevel}
      </p>

      <div className="srp__grid-progress-wrap">
        <div className="srp__grid-progress">
          <div className="srp__grid-progress-fill" style={{ width: `${roadmap.progressPercentage}%` }} />
        </div>
        <span className="srp__grid-progress-pct">{roadmap.progressPercentage}%</span>
      </div>

      <div className="srp__grid-card-footer">
        <span className="srp__grid-card-count">
          {roadmap.completedTopicsCount}/{roadmap.totalTopicsCount} chủ đề
        </span>
        {roadmap.status === 'COMPLETED' ? (
          <CheckCircle2 className="srp__grid-card-icon" />
        ) : (
          <Sparkles className="srp__grid-card-icon" />
        )}
      </div>
    </Link>
  );
};

export default RoadmapCard;
