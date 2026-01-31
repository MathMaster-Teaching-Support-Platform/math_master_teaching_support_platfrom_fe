import React from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout/DashboardLayout';
import { mockTeacher, mockCourses, mockAssignments, mockStudents } from '../../../data/mockData';
import './TeacherDashboard.css';

const TeacherDashboard: React.FC = () => {
  const stats = [
    { icon: '👥', label: 'Tổng học sinh', value: mockTeacher.totalStudents, color: '#667eea' },
    { icon: '📚', label: 'Khóa học', value: mockTeacher.totalCourses, color: '#43e97b' },
    { icon: '📝', label: 'Tài liệu', value: mockTeacher.totalMaterials, color: '#f093fb' },
    { icon: '✍️', label: 'Bài tập chờ chấm', value: 12, color: '#fee140' },
  ];

  const recentActivities = [
    {
      type: 'submit',
      student: 'Nguyễn Văn A',
      action: 'đã nộp bài',
      item: 'Bài tập Mệnh đề',
      time: '5 phút trước',
    },
    {
      type: 'complete',
      student: 'Trần Thị B',
      action: 'đã hoàn thành',
      item: 'Bài 2: Tập hợp',
      time: '15 phút trước',
    },
    {
      type: 'question',
      student: 'Lê Văn C',
      action: 'đã đặt câu hỏi trong',
      item: 'Đại số 10',
      time: '1 giờ trước',
    },
    {
      type: 'submit',
      student: 'Phạm Thị D',
      action: 'đã nộp bài',
      item: 'Kiểm tra 15 phút',
      time: '2 giờ trước',
    },
  ];

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
              Chào mừng quay trở lại. Đây là tổng quan của bạn hôm nay.
            </p>
          </div>
          <button className="btn btn-primary">
            <span>✨</span> Tạo tài liệu mới
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
          {/* Recent Courses */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Khóa học gần đây</h2>
              <a href="/teacher/courses" className="card-link">
                Xem tất cả →
              </a>
            </div>
            <div className="courses-list">
              {mockCourses.slice(0, 3).map((course) => (
                <div key={course.id} className="course-item">
                  <div className="course-thumbnail">{course.thumbnail}</div>
                  <div className="course-info">
                    <h3 className="course-title">{course.title}</h3>
                    <p className="course-meta">
                      {course.lessons} bài học • {course.students} học sinh
                    </p>
                  </div>
                  <span className={`course-status status-${course.status}`}>
                    {course.status === 'active' ? 'Đang mở' : 'Nháp'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Assignments */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Bài tập cần chấm</h2>
              <a href="/teacher/assignments" className="card-link">
                Xem tất cả →
              </a>
            </div>
            <div className="assignments-list">
              {mockAssignments
                .filter((a) => a.status === 'pending')
                .map((assignment) => (
                  <div key={assignment.id} className="assignment-item">
                    <div className="assignment-icon">📝</div>
                    <div className="assignment-info">
                      <h3 className="assignment-title">{assignment.title}</h3>
                      <p className="assignment-course">{assignment.courseName}</p>
                    </div>
                    <div className="assignment-actions">
                      <span className="assignment-count">12 bài nộp</span>
                      <button className="btn btn-sm btn-outline">Chấm điểm</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="dashboard-grid-2">
          {/* Top Students */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Học sinh xuất sắc</h2>
            </div>
            <div className="students-list">
              {mockStudents.slice(0, 5).map((student, index) => (
                <div key={student.id} className="student-item">
                  <div className="student-rank">#{index + 1}</div>
                  <div className="student-avatar">{student.avatar}</div>
                  <div className="student-info">
                    <div className="student-name">{student.name}</div>
                    <div className="student-progress">
                      {student.completedLessons}/{student.totalLessons} bài học
                    </div>
                  </div>
                  <div className="student-score">{student.averageScore}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Hoạt động gần đây</h2>
            </div>
            <div className="activities-list">
              {recentActivities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className={`activity-icon type-${activity.type}`}>
                    {activity.type === 'submit' ? '📤' : activity.type === 'complete' ? '✅' : '❓'}
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">
                      <strong>{activity.student}</strong> {activity.action}{' '}
                      <span className="activity-item-name">{activity.item}</span>
                    </p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

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
            <button className="quick-action-btn">
              <span className="qa-icon">🎨</span>
              <span className="qa-label">Tạo slide</span>
            </button>
            <button className="quick-action-btn">
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
