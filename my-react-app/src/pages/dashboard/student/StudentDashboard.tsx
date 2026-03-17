import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent, mockCourses, mockAssignments } from '../../../data/mockData';
import './StudentDashboard.css';

const StudentDashboard: React.FC = () => {
  const stats = [
    {
      icon: '📚',
      label: 'Giáo Trình đang học',
      value: mockStudent.enrolledCourses,
      color: '#667eea',
    },
    {
      icon: '✍️',
      label: 'Bài tập đã hoàn thành',
      value: mockStudent.completedAssignments,
      color: '#43e97b',
    },
    { icon: '⭐', label: 'Điểm trung bình', value: mockStudent.averageScore, color: '#fbbf24' },
    { icon: '🎯', label: 'Bài tập cần làm', value: 3, color: '#f093fb' },
  ];

  const upcomingAssignments = mockAssignments.filter(
    (a) => a.status === 'pending' || a.status === 'upcoming'
  );

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar!, role: 'student' }}
      notificationCount={3}
    >
      <div className="student-dashboard">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Chào {mockStudent.name}! 👋</h1>
            <p className="dashboard-subtitle">
              Hôm nay là ngày tuyệt vời để học toán! Bạn có {upcomingAssignments.length} bài tập cần
              hoàn thành.
            </p>
          </div>
          <button className="btn btn-primary">
            <span>🤖</span> Chat với AI
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card" style={{ borderTopColor: stat.color }}>
              <div
                className="stat-icon"
                style={{ background: `${stat.color}20`, color: stat.color }}
              >
                {stat.icon}
              </div>
              <div className="stat-info">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-grid">
          {/* My Courses */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Giáo Trình của tôi</h2>
              <a href="/student/courses" className="card-link">
                Xem tất cả →
              </a>
            </div>
            <div className="courses-list">
              {mockCourses.map((course) => (
                <div key={course.id} className="course-item">
                  <div className="course-thumbnail">{course.thumbnail}</div>
                  <div className="course-info">
                    <h3 className="course-title">{course.title}</h3>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '65%' }}></div>
                    </div>
                    <p className="course-progress">65% hoàn thành</p>
                  </div>
                  <button className="btn btn-sm btn-primary">Tiếp tục</button>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Assignments */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Bài tập sắp tới</h2>
              <a href="/student/assignments" className="card-link">
                Xem tất cả →
              </a>
            </div>
            <div className="assignments-list">
              {upcomingAssignments.map((assignment) => (
                <div key={assignment.id} className="assignment-item">
                  <div className="assignment-icon">
                    {assignment.type === 'quiz' ? '📝' : assignment.type === 'exam' ? '📊' : '✍️'}
                  </div>
                  <div className="assignment-info">
                    <h3 className="assignment-title">{assignment.title}</h3>
                    <p className="assignment-meta">
                      {assignment.courseName} • Hạn:{' '}
                      {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <button className="btn btn-sm btn-outline">Làm bài</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-grid-2">
          {/* Roadmap */}
          <div className="dashboard-card roadmap-card">
            <div className="card-header">
              <h2 className="card-title">Lộ trình học tập</h2>
              <Link to="/student/roadmap" className="card-link">
                Mở roadmap →
              </Link>
            </div>
            <p className="roadmap-subtitle">
              Theo dõi tiến độ từng chủ đề, mở khóa bài học mới và hoàn thành mục tiêu theo tuần.
            </p>
            <div className="roadmap-progress-line">
              <div className="roadmap-progress-fill" style={{ width: '40%' }}></div>
            </div>
            <div className="roadmap-meta">
              <span>6/15 nội dung đã hoàn thành</span>
              <span>40%</span>
            </div>
            <Link to="/student/roadmap" className="btn btn-primary roadmap-btn">
              🗺️ Vào lộ trình học
            </Link>
          </div>

          {/* Learning Progress */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Tiến độ học tập</h2>
            </div>
            <div className="progress-chart">
              <div className="progress-item">
                <div className="progress-info">
                  <span className="progress-label">Đại số 10</span>
                  <span className="progress-percent">75%</span>
                </div>
                <div className="progress-bar-large">
                  <div
                    className="progress-fill"
                    style={{ width: '75%', background: '#667eea' }}
                  ></div>
                </div>
              </div>
              <div className="progress-item">
                <div className="progress-info">
                  <span className="progress-label">Hình học 11</span>
                  <span className="progress-percent">60%</span>
                </div>
                <div className="progress-bar-large">
                  <div
                    className="progress-fill"
                    style={{ width: '60%', background: '#43e97b' }}
                  ></div>
                </div>
              </div>
              <div className="progress-item">
                <div className="progress-info">
                  <span className="progress-label">Giải tích 12</span>
                  <span className="progress-percent">45%</span>
                </div>
                <div className="progress-bar-large">
                  <div
                    className="progress-fill"
                    style={{ width: '45%', background: '#f093fb' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Grades */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Điểm số gần đây</h2>
              <a href="/student/grades" className="card-link">
                Xem tất cả →
              </a>
            </div>
            <div className="grades-list">
              <div className="grade-item">
                <div className="grade-icon">📝</div>
                <div className="grade-info">
                  <h3 className="grade-title">Kiểm tra 15 phút - Tập hợp</h3>
                  <p className="grade-date">28/01/2026</p>
                </div>
                <div className="grade-score excellent">8.5</div>
              </div>
              <div className="grade-item">
                <div className="grade-icon">📊</div>
                <div className="grade-info">
                  <h3 className="grade-title">Bài tập Mệnh đề</h3>
                  <p className="grade-date">25/01/2026</p>
                </div>
                <div className="grade-score good">7.8</div>
              </div>
              <div className="grade-item">
                <div className="grade-icon">✍️</div>
                <div className="grade-info">
                  <h3 className="grade-title">Đề thi giữa kỳ</h3>
                  <p className="grade-date">20/01/2026</p>
                </div>
                <div className="grade-score excellent">9.0</div>
              </div>
            </div>
          </div>
        </div>

        {/* Study Streak */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">🔥 Chuỗi học tập của bạn</h2>
          </div>
          <div className="streak-container">
            <div className="streak-info">
              <div className="streak-number">7</div>
              <div className="streak-label">ngày liên tiếp</div>
            </div>
            <div className="streak-calendar">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, i) => (
                <div key={i} className={`streak-day ${i < 5 ? 'active' : ''}`}>
                  <div className="day-label">{day}</div>
                  <div className="day-indicator">{i < 5 ? '✓' : ''}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Truy cập nhanh</h2>
          </div>
          <div className="quick-actions">
            <button className="quick-action-btn">
              <span className="qa-icon">📚</span>
              <span className="qa-label">Giáo Trình</span>
            </button>
            <button className="quick-action-btn">
              <span className="qa-icon">✍️</span>
              <span className="qa-label">Bài tập</span>
            </button>
            <button className="quick-action-btn">
              <span className="qa-icon">📊</span>
              <span className="qa-label">Điểm số</span>
            </button>
            <Link to="/student/roadmap" className="quick-action-btn">
              <span className="qa-icon">🗺️</span>
              <span className="qa-label">Lộ trình</span>
            </Link>
            <button className="quick-action-btn">
              <span className="qa-icon">🤖</span>
              <span className="qa-label">AI Trợ lý</span>
            </button>
            <button className="quick-action-btn">
              <span className="qa-icon">💰</span>
              <span className="qa-label">Ví</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
