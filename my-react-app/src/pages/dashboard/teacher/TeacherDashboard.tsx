import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout/DashboardLayout';
import { mockTeacher, mockCourses } from '../../../data/mockData';
import './TeacherDashboard.css';

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const stats = [
    {
      icon: '👥',
      label: 'Tổng học sinh',
      value: mockTeacher.totalStudents.toLocaleString('vi-VN'),
      trend: '+12%',
      trendType: 'up',
    },
    {
      icon: '📚',
      label: 'Khóa học',
      value: mockTeacher.totalCourses.toLocaleString('vi-VN'),
      trend: '-2%',
      trendType: 'down',
    },
    {
      icon: '📄',
      label: 'Tài liệu',
      value: mockTeacher.totalMaterials.toLocaleString('vi-VN'),
      trend: '+5%',
      trendType: 'up',
    },
  ] as const;

  const teachingProgress = [
    {
      course: 'Giải tích lớp 12 - Chương 1',
      progress: 85,
    },
    {
      course: 'Hình học không gian - Nâng cao',
      progress: 42,
    },
    {
      course: 'Xác suất thống kê đại cương',
      progress: 60,
    },
  ];

  const completionRate = 78;
  const completedLessons = mockCourses.reduce((sum, course) => sum + course.lessonsCount, 0);
  const todayLabel = new Date().toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar!, role: 'teacher' }}
      notificationCount={5}
    >
      <div className="teacher-dashboard">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Xin chào, {mockTeacher.name}! 👋</h1>
            <p className="dashboard-subtitle">
              Hôm nay bạn có 3 lớp học mới và 2 tài liệu cần phê duyệt.
            </p>
          </div>
          <div className="date-pill">{todayLabel}</div>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-top-row">
                <div className="stat-icon">{stat.icon}</div>
                <span className={`stat-trend ${stat.trendType}`}>{stat.trend}</span>
              </div>
              <div className="stat-info">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-main-grid">
          <section className="dashboard-card progress-card">
            <div className="card-header">
              <h2 className="card-title">Tiến độ giảng dạy</h2>
              <button className="card-link" onClick={() => navigate('/teacher/courses')}>
                Xem tất cả
              </button>
            </div>
            <div className="progress-list">
              {teachingProgress.map((item) => (
                <div key={item.course} className="progress-item">
                  <div className="progress-row">
                    <span className="progress-course">{item.course}</span>
                    <span className="progress-percent">{item.progress}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-card detail-card">
            <h2 className="card-title">Thống kê chi tiết</h2>
            <div className="ring-chart" style={{ ['--value' as string]: `${completionRate}%` }}>
              <div className="ring-inner">
                <span className="ring-value">{completionRate}%</span>
                <span className="ring-label">Hoàn thành</span>
              </div>
            </div>
            <div className="detail-legend">
              <div className="legend-item">
                <span className="legend-dot theory" />
                <span>Lý thuyết: 45%</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot practice" />
                <span>Bài tập: 33%</span>
              </div>
            </div>
            <button className="action-btn" onClick={() => navigate('/teacher/materials')}>
              Tạo tài liệu mới
            </button>
            <p className="detail-note">Đã triển khai {completedLessons} bài học trong tháng này.</p>
          </section>
        </div>

<<<<<<< Updated upstream
        <div className="quick-action-row">
          <button className="quick-btn" onClick={() => navigate('/teacher/mindmaps')}>
            🧠 Tạo mindmap
          </button>
          <button className="quick-btn" onClick={() => navigate('/teacher/question-templates')}>
            🧩 Tạo mẫu câu hỏi
          </button>
          <button className="quick-btn" onClick={() => navigate('/teacher/exam-matrices')}>
            📐 Lập ma trận đề
          </button>
=======
        {/* Quick Actions */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Hành động nhanh</h2>
          </div>
          <div className="quick-actions">
            <button className="quick-action-btn">
              <span className="qa-icon">📚</span>
              <span className="qa-label">Tạo khóa học</span>
            </button>
            <button className="quick-action-btn">
              <span className="qa-icon">📝</span>
              <span className="qa-label">Tạo bài tập</span>
            </button>
            <button className="quick-action-btn">
              <span className="qa-icon">📊</span>
              <span className="qa-label">Tạo đề thi</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/teacher/exam-matrices')}>
              <span className="qa-icon">🧩</span>
              <span className="qa-label">Ma trận đề</span>
            </button>
            <button className="quick-action-btn">
              <span className="qa-icon">🎨</span>
              <span className="qa-label">Tạo slide</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/teacher/mindmaps')}>
              <span className="qa-icon">🧠</span>
              <span className="qa-label">Tạo mindmap</span>
            </button>
            <button className="quick-action-btn">
              <span className="qa-icon">📈</span>
              <span className="qa-label">Tạo đồ thị</span>
            </button>
            <button className="quick-action-btn">
              <span className="qa-icon">🤖</span>
              <span className="qa-label">AI trợ lý</span>
            </button>
            <button className="quick-action-btn">
              <span className="qa-icon">📂</span>
              <span className="qa-label">Tài nguyên</span>
            </button>
          </div>
>>>>>>> Stashed changes
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
