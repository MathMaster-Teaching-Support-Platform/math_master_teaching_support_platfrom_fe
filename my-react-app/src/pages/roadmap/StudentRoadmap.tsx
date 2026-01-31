import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import './StudentRoadmap.css';

interface RoadmapNode {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'locked';
  type: 'lesson' | 'assignment' | 'quiz' | 'project';
  points: number;
  duration: string;
  prerequisites?: number[];
}

const StudentRoadmap: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);

  const roadmapData: RoadmapNode[] = [
    // Week 1-2
    {
      id: 1,
      title: 'Số học cơ bản',
      description: 'Các phép toán cộng, trừ, nhân, chia số tự nhiên',
      status: 'completed',
      type: 'lesson',
      points: 50,
      duration: '2 giờ',
    },
    {
      id: 2,
      title: 'Bài tập số học',
      description: 'Thực hành các phép toán cơ bản',
      status: 'completed',
      type: 'assignment',
      points: 30,
      duration: '1 giờ',
      prerequisites: [1],
    },
    {
      id: 3,
      title: 'Kiểm tra số học',
      description: 'Đánh giá kiến thức số học cơ bản',
      status: 'completed',
      type: 'quiz',
      points: 100,
      duration: '45 phút',
      prerequisites: [1, 2],
    },

    // Week 3-4
    {
      id: 4,
      title: 'Phân số',
      description: 'Khái niệm phân số, rút gọn, quy đồng',
      status: 'completed',
      type: 'lesson',
      points: 50,
      duration: '2.5 giờ',
      prerequisites: [3],
    },
    {
      id: 5,
      title: 'Phép toán phân số',
      description: 'Cộng, trừ, nhân, chia phân số',
      status: 'completed',
      type: 'lesson',
      points: 50,
      duration: '2 giờ',
      prerequisites: [4],
    },
    {
      id: 6,
      title: 'Bài tập phân số',
      description: 'Thực hành các phép toán phân số',
      status: 'current',
      type: 'assignment',
      points: 40,
      duration: '1.5 giờ',
      prerequisites: [4, 5],
    },

    // Week 5-6
    {
      id: 7,
      title: 'Số thập phân',
      description: 'Khái niệm số thập phân, chuyển đổi',
      status: 'current',
      type: 'lesson',
      points: 50,
      duration: '2 giờ',
      prerequisites: [5],
    },
    {
      id: 8,
      title: 'Phép toán thập phân',
      description: 'Cộng, trừ, nhân, chia số thập phân',
      status: 'locked',
      type: 'lesson',
      points: 50,
      duration: '2 giờ',
      prerequisites: [7],
    },
    {
      id: 9,
      title: 'Kiểm tra giữa kỳ',
      description: 'Đánh giá tổng hợp kiến thức đã học',
      status: 'locked',
      type: 'quiz',
      points: 200,
      duration: '90 phút',
      prerequisites: [6, 7],
    },

    // Week 7-8
    {
      id: 10,
      title: 'Tỷ lệ & Phần trăm',
      description: 'Tỷ lệ, phần trăm và ứng dụng',
      status: 'locked',
      type: 'lesson',
      points: 50,
      duration: '2.5 giờ',
      prerequisites: [8],
    },
    {
      id: 11,
      title: 'Bài toán tỷ lệ',
      description: 'Giải bài toán về tỷ lệ thực tế',
      status: 'locked',
      type: 'assignment',
      points: 40,
      duration: '1.5 giờ',
      prerequisites: [10],
    },

    // Week 9-10
    {
      id: 12,
      title: 'Hình học cơ bản',
      description: 'Điểm, đường thẳng, đoạn thẳng, góc',
      status: 'locked',
      type: 'lesson',
      points: 50,
      duration: '2 giờ',
      prerequisites: [9],
    },
    {
      id: 13,
      title: 'Đa giác',
      description: 'Tam giác, tứ giác, đa giác đều',
      status: 'locked',
      type: 'lesson',
      points: 50,
      duration: '2.5 giờ',
      prerequisites: [12],
    },
    {
      id: 14,
      title: 'Chu vi & Diện tích',
      description: 'Tính chu vi và diện tích hình phẳng',
      status: 'locked',
      type: 'lesson',
      points: 50,
      duration: '2 giờ',
      prerequisites: [13],
    },
    {
      id: 15,
      title: 'Dự án cuối kỳ',
      description: 'Dự án tổng hợp toán học',
      status: 'locked',
      type: 'project',
      points: 300,
      duration: '1 tuần',
      prerequisites: [14],
    },
  ];

  const stats = {
    completed: roadmapData.filter((n) => n.status === 'completed').length,
    total: roadmapData.length,
    points: roadmapData
      .filter((n) => n.status === 'completed')
      .reduce((sum, n) => sum + n.points, 0),
    totalPoints: roadmapData.reduce((sum, n) => sum + n.points, 0),
  };

  const progress = (stats.completed / stats.total) * 100;

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return '📚';
      case 'assignment':
        return '📝';
      case 'quiz':
        return '✅';
      case 'project':
        return '🎯';
      default:
        return '📖';
    }
  };

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar!, role: 'student' }}
      notificationCount={5}
    >
      <div className="roadmap-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">🗺️ Lộ Trình Học Tập</h1>
            <p className="page-subtitle">Theo dõi tiến độ và hoàn thành các mục tiêu học tập</p>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="progress-overview">
          <div className="overview-card main">
            <div className="overview-content">
              <h3>Tiến độ tổng thể</h3>
              <div className="progress-stats">
                <div className="stat">
                  <span className="stat-value">
                    {stats.completed}/{stats.total}
                  </span>
                  <span className="stat-label">Hoàn thành</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{progress.toFixed(0)}%</span>
                  <span className="stat-label">Tiến độ</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{stats.points}</span>
                  <span className="stat-label">Điểm tích lũy</span>
                </div>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="overview-card">
            <div
              className="overview-icon"
              style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
            >
              ✅
            </div>
            <div className="overview-content">
              <div className="overview-value">{stats.completed}</div>
              <div className="overview-label">Bài đã hoàn thành</div>
            </div>
          </div>

          <div className="overview-card">
            <div
              className="overview-icon"
              style={{ background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' }}
            >
              🎯
            </div>
            <div className="overview-content">
              <div className="overview-value">
                {roadmapData.filter((n) => n.status === 'current').length}
              </div>
              <div className="overview-label">Đang học</div>
            </div>
          </div>

          <div className="overview-card">
            <div
              className="overview-icon"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              🔒
            </div>
            <div className="overview-content">
              <div className="overview-value">
                {roadmapData.filter((n) => n.status === 'locked').length}
              </div>
              <div className="overview-label">Chưa mở khóa</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="roadmap-legend">
          <div className="legend-item">
            <div className="legend-icon completed">✓</div>
            <span>Hoàn thành</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon current">▶</div>
            <span>Đang học</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon locked">🔒</div>
            <span>Chưa mở khóa</span>
          </div>
        </div>

        {/* Roadmap Path */}
        <div className="roadmap-container">
          <div className="roadmap-path">
            {roadmapData.map((node) => (
              <div key={node.id} className={`roadmap-node ${node.status}`}>
                <div className="node-connector"></div>
                <div className="node-card" onClick={() => setSelectedNode(node)}>
                  <div className="node-icon">
                    {node.status === 'completed' ? '✓' : node.status === 'current' ? '▶' : '🔒'}
                  </div>
                  <div className="node-content">
                    <div className="node-header">
                      <span className="node-type">{getNodeIcon(node.type)}</span>
                      <h4 className="node-title">{node.title}</h4>
                    </div>
                    <p className="node-description">{node.description}</p>
                    <div className="node-meta">
                      <span className="node-duration">⏱️ {node.duration}</span>
                      <span className="node-points">⭐ {node.points} điểm</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="roadmap-node final">
              <div className="node-connector"></div>
              <div className="node-card final-card">
                <div className="final-icon">🎓</div>
                <div className="final-content">
                  <h3>Hoàn thành khóa học!</h3>
                  <p>Chúc mừng bạn đã hoàn thành lộ trình học tập</p>
                  <div className="final-reward">
                    <span>🏆 Chứng chỉ hoàn thành</span>
                    <span>⭐ {stats.totalPoints} điểm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Node Detail Modal */}
        {selectedNode && (
          <div className="modal-overlay" onClick={() => setSelectedNode(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {getNodeIcon(selectedNode.type)} {selectedNode.title}
                </h2>
                <button className="modal-close" onClick={() => setSelectedNode(null)}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className={`status-badge-large ${selectedNode.status}`}>
                  {selectedNode.status === 'completed'
                    ? '✅ Đã hoàn thành'
                    : selectedNode.status === 'current'
                      ? '▶️ Đang học'
                      : '🔒 Chưa mở khóa'}
                </div>

                <p className="node-detail-description">{selectedNode.description}</p>

                <div className="node-detail-info">
                  <div className="info-item">
                    <span className="info-label">Loại:</span>
                    <span className="info-value">
                      {selectedNode.type === 'lesson'
                        ? '📚 Bài học'
                        : selectedNode.type === 'assignment'
                          ? '📝 Bài tập'
                          : selectedNode.type === 'quiz'
                            ? '✅ Kiểm tra'
                            : '🎯 Dự án'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Thời lượng:</span>
                    <span className="info-value">⏱️ {selectedNode.duration}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Điểm:</span>
                    <span className="info-value">⭐ {selectedNode.points} điểm</span>
                  </div>
                  {selectedNode.prerequisites && selectedNode.prerequisites.length > 0 && (
                    <div className="info-item">
                      <span className="info-label">Yêu cầu:</span>
                      <span className="info-value">
                        Hoàn thành {selectedNode.prerequisites.length} bài trước
                      </span>
                    </div>
                  )}
                </div>

                {selectedNode.status === 'completed' && (
                  <div className="completion-info">
                    <div className="completion-icon">✅</div>
                    <div>
                      <div className="completion-title">Đã hoàn thành</div>
                      <div className="completion-date">
                        Ngày 15/01/2026 • Điểm: {selectedNode.points}
                      </div>
                    </div>
                  </div>
                )}

                {selectedNode.status === 'locked' && (
                  <div className="locked-info">
                    <div className="locked-icon">🔒</div>
                    <div>
                      <div className="locked-title">Chưa mở khóa</div>
                      <div className="locked-text">
                        Hoàn thành các bài học trước để mở khóa nội dung này
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {selectedNode.status === 'current' && (
                  <button className="btn btn-primary">▶️ Tiếp tục học</button>
                )}
                {selectedNode.status === 'completed' && (
                  <button className="btn btn-outline">📖 Xem lại</button>
                )}
                {selectedNode.status === 'locked' && (
                  <button className="btn btn-outline" disabled>
                    🔒 Chưa khả dụng
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentRoadmap;
