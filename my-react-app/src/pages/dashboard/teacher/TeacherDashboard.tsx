import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout/DashboardLayout';
import { mockCourses, mockTeacher } from '../../../data/mockData';
import './TeacherDashboard.css';

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const todayLabel = new Date().toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const stats = [
    {
      icon: '👥',
      title: 'Tổng học sinh',
      value: mockTeacher.totalStudents,
      delta: '+12%',
      up: true,
    },
    { icon: '📘', title: 'Giáo Trình', value: mockTeacher.totalCourses, delta: '-2%', up: false },
    { icon: '📄', title: 'Tài liệu', value: mockTeacher.totalMaterials, delta: '+5%', up: true },
  ];

  const teachingProgress = [
    { name: 'Giải tích lớp 12 - Chương 1', value: 85 },
    { name: 'Hình học không gian - Nâng cao', value: 42 },
    { name: 'Xác suất thống kê đại cương', value: 60 },
  ];

  const completionRate = 78;
  const completedLessons = mockCourses.reduce((sum, course) => sum + course.lessonsCount, 0);

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar!, role: 'teacher' }}
      notificationCount={5}
    >
      <div className="teacher-dashboard">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Xin chào, {mockTeacher.name}! 👋</h1>
            <p className="dashboard-subtitle">
              Hôm nay bạn có 3 lớp học mới và 2 tài liệu cần phê duyệt.
            </p>
          </div>
          <div className="dashboard-date">{todayLabel}</div>
        </header>

        <section className="stats-grid">
          {stats.map((item) => (
            <article key={item.title} className="stat-card">
              <div className="stat-head">
                <span className="stat-title">{item.title}</span>
                <span className="stat-icon">{item.icon}</span>
              </div>
              <div className="stat-value">{item.value.toLocaleString('vi-VN')}</div>
              <div className={`stat-delta ${item.up ? 'up' : 'down'}`}>{item.delta} tháng này</div>
            </article>
          ))}
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-card progress-card">
            <p className="section-label">Tiến độ giảng dạy</p>
            <div className="progress-list">
              {teachingProgress.map((item) => (
                <div key={item.name} className="progress-item">
                  <div className="progress-row">
                    <span>{item.name}</span>
                    <strong>{item.value}%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-card completion-card">
            <p className="section-label">Hoàn thành</p>
            <div className="ring-wrap">
              <div className="ring" style={{ ['--value' as string]: `${completionRate}%` }}>
                <div className="ring-center">
                  <div className="ring-value">{completionRate}%</div>
                  <div className="ring-label">Tổng quan</div>
                </div>
              </div>
            </div>
            <div className="ring-meta">
              <div>
                <span>Lý thuyết</span>
                <strong>45%</strong>
              </div>
              <div>
                <span>Bài tập</span>
                <strong>33%</strong>
              </div>
            </div>
          </article>
        </section>

        <section className="quick-panel">
          <div className="quick-summary">
            <div className="quick-title">
              Đã triển khai {completedLessons} bài học trong tháng này
            </div>
            <p>Tăng 15% so với cùng kỳ tháng trước</p>
          </div>
          <div className="quick-actions">
            <button onClick={() => navigate('/teacher/materials')}>Tạo tài liệu mới</button>
            <button onClick={() => navigate('/teacher/mindmaps')}>Tạo mindmap</button>
            <button onClick={() => navigate('/teacher/question-templates')}>Tạo mẫu câu hỏi</button>
            <button className="primary" onClick={() => navigate('/teacher/exam-matrices')}>
              Lập ma trận đề
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
