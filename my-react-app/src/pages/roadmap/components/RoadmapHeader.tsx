import React from 'react';

interface RoadmapHeaderProps {
  total: number;
  inProgress: number;
  completed: number;
  avgProgress: number;
}

const RoadmapHeader: React.FC<RoadmapHeaderProps> = ({ total, inProgress, completed, avgProgress }) => {
  return (
    <header className="page-header srp__header">
      <div className="header-stack srp__header-text">
        <div className="header-kicker">Học tập &amp; Phát triển</div>
        <div className="row" style={{ gap: '0.6rem' }}>
          <h2 className="srp__title">Lộ trình học tập</h2>
          {total > 0 && <span className="count-chip">{total}</span>}
        </div>
        <p className="srp__subtitle">Khám phá và theo dõi tiến trình học của bạn</p>
      </div>
      <div className="assessment-summary-bar srp__stats-bar">
        <div className="summary-item summary-item--primary">
          <span className="summary-label">Đang học</span>
          <strong className="summary-value">{inProgress}</strong>
        </div>
        <div className="summary-item">
          <span className="summary-label">Hoàn thành</span>
          <strong className="summary-value">{completed}</strong>
        </div>
        <div className="summary-item">
          <span className="summary-label">Tiến độ TB</span>
          <strong className="summary-value">{avgProgress}%</strong>
        </div>
      </div>
    </header>
  );
};

export default RoadmapHeader;
