import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent, mockCourses, mockAssignments } from '../../../data/mockData';
import { useRoadmaps } from '../../../hooks/useRoadmaps';
import { TeacherProfileService } from '../../../services/api/teacher-profile.service';
import { AuthService } from '../../../services/api/auth.service';
import type { RoadmapCatalogItem } from '../../../types';
import './StudentDashboard.css';

function normalizeRoadmaps(
  result: RoadmapCatalogItem[] | { content?: RoadmapCatalogItem[]; items?: RoadmapCatalogItem[] } | undefined
): RoadmapCatalogItem[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.content)) return result.content;
  if (Array.isArray(result?.items)) return result.items;
  return [];
}

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const roadmapsQuery = useRoadmaps();
  const [isTeacherApproved, setIsTeacherApproved] = React.useState(false);

  React.useEffect(() => {
    const checkStatus = async () => {
      // Check if user already has teacher role in token
      if (AuthService.hasRole('teacher')) {
        setIsTeacherApproved(true);
        return;
      }

      // If not in token, check via API (maybe just approved)
      try {
        const res = await TeacherProfileService.getMyProfile();
        if (res.result.status === 'APPROVED') {
          setIsTeacherApproved(true);
        }
      } catch (err) {
        // Silent fail if no profile or error
      }
    };
    checkStatus();
  }, []);

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

  const getAssignmentIcon = (type: string) => {
    if (type === 'quiz') return '📝';
    if (type === 'exam') return '📊';
    return '✍️';
  };

  const roadmapResult = roadmapsQuery.data?.result as
    | RoadmapCatalogItem[]
    | { content?: RoadmapCatalogItem[]; items?: RoadmapCatalogItem[] }
    | undefined;
  const roadmapList = normalizeRoadmaps(roadmapResult);

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: 'student' }}
      notificationCount={3}
    >
      <div className="student-dashboard">
        {isTeacherApproved && (
          <div className="teacher-switch-banner">
            <div className="banner-content">
              <span className="banner-icon">🎓</span>
              <div className="banner-text">
                <h3>Bạn đã được duyệt làm Giáo viên!</h3>
                <p>Bây giờ bạn có thể bắt đầu tạo nội dung và quản lý lớp học.</p>
              </div>
            </div>
            <button 
              className="btn btn-primary switch-btn" 
              onClick={() => {
                // If they have the role in token, just go. 
                // If not, we might need a re-login, but for now just navigate
                navigate('/teacher/dashboard');
              }}
            >
              Chuyển sang giao diện Giáo viên
            </button>
          </div>
        )}

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
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card" style={{ borderTopColor: stat.color }}>
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
                  <div className="assignment-icon">{getAssignmentIcon(assignment.type)}</div>
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
          {/* Roadmap list */}
          <div className="dashboard-card roadmap-list-card">
            <div className="card-header">
              <h2 className="card-title">Danh sách lộ trình</h2>
              <Link to="/roadmaps" className="card-link">
                Xem tất cả →
              </Link>
            </div>
            {roadmapsQuery.isLoading && <p className="roadmap-subtitle">Đang tải lộ trình...</p>}
            {roadmapsQuery.error && <p className="roadmap-subtitle">Không thể tải danh sách lộ trình.</p>}

            {!roadmapsQuery.isLoading && !roadmapsQuery.error && (
              <div className="roadmap-list">
                {roadmapList.slice(0, 5).map((roadmap) => (
                  <Link key={roadmap.id} to={`/roadmaps/${roadmap.id}`} className="roadmap-list__item">
                    <div>
                      <strong>{roadmap.name}</strong>
                      <p>{roadmap.subject}</p>
                    </div>
                    <span>{roadmap.totalTopicsCount} topics</span>
                  </Link>
                ))}
                {roadmapList.length === 0 && (
                  <p className="roadmap-subtitle">Chưa có lộ trình nào để chọn.</p>
                )}
              </div>
            )}
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
                <div key={day} className={`streak-day ${i < 5 ? 'active' : ''}`}>
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
            <button className="quick-action-btn" onClick={() => navigate('/student/courses')}>
              <span className="qa-icon">📚</span>
              <span className="qa-label">Giáo Trình</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/student/assignments')}>
              <span className="qa-icon">✍️</span>
              <span className="qa-label">Bài tập</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/student/assessments')}>
              <span className="qa-icon">📝</span>
              <span className="qa-label">Bài kiểm tra</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/student/grades')}>
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
            <button className="quick-action-btn" onClick={() => navigate('/student/wallet')}>
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
