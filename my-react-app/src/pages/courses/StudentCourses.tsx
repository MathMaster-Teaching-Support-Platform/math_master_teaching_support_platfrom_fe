import React, { useState, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent, mockCourses } from '../../data/mockData';
import './StudentCourses.css';

// Fixed timestamp for consistent data generation
const FIXED_TIMESTAMP = 1738713600000; // Feb 5, 2026

const StudentCourses: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const enrolledCourses = useMemo(() => {
    return mockCourses.map((course, index) => {
      const seed = index * 13 + 27;
      return {
        ...course,
        progress: 10 + (seed % 90),
        lastAccessed: new Date(FIXED_TIMESTAMP - (seed % 7) * 24 * 60 * 60 * 1000).toISOString(),
      };
    });
  }, []);

  const activeCourse = selectedCourse ? enrolledCourses.find((c) => c.id === selectedCourse) : null;

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar!, role: 'student' }}
      notificationCount={3}
    >
      <div className="student-courses-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">📚 Giáo Trình của tôi</h1>
            <p className="page-subtitle">Các Giáo Trình bạn đã đăng ký và đang học</p>
          </div>
          <button className="btn btn-primary">🔍 Khám phá Giáo Trình</button>
        </div>

        {/* Progress Overview */}
        <div className="progress-overview">
          <div className="overview-card">
            <div
              className="overview-icon"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              📚
            </div>
            <div className="overview-content">
              <div className="overview-value">{enrolledCourses.length}</div>
              <div className="overview-label">Giáo Trình đang học</div>
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
              <div className="overview-value">
                {(enrolledCourses.reduce((sum, c) => sum + c.progress, 0) /
                  enrolledCourses.length) |
                  0}
                %
              </div>
              <div className="overview-label">Tiến độ trung bình</div>
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
              <div className="overview-value">12</div>
              <div className="overview-label">Bài học hoàn thành</div>
            </div>
          </div>
          <div className="overview-card">
            <div
              className="overview-icon"
              style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
            >
              ⏱️
            </div>
            <div className="overview-content">
              <div className="overview-value">18.5h</div>
              <div className="overview-label">Tổng thời gian học</div>
            </div>
          </div>
        </div>

        {!selectedCourse ? (
          /* Courses Grid */
          <div className="courses-grid">
            {enrolledCourses.map((course) => (
              <div
                key={course.id}
                className="course-card"
                onClick={() => setSelectedCourse(course.id)}
              >
                <div className="course-thumbnail">
                  <img src={course.thumbnail} alt={course.name} />
                  <div className="course-overlay">
                    <button className="play-btn">▶️ Tiếp tục học</button>
                  </div>
                </div>

                <div className="course-body">
                  <h3 className="course-name">{course.name}</h3>
                  <p className="course-teacher">👨‍🏫 {course.teacher}</p>

                  <div className="course-stats">
                    <div className="stat-item">
                      <span className="stat-icon">📚</span>
                      <span>{course.lessonsCount} bài học</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">⭐</span>
                      <span>{course.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="course-progress-section">
                    <div className="progress-info">
                      <span className="progress-label">Tiến độ</span>
                      <span className="progress-percent">{course.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${course.progress}%` }}></div>
                    </div>
                  </div>

                  <div className="course-footer">
                    <span className="last-accessed">
                      Học gần đây: {new Date(course.lastAccessed).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Course Detail View */
          <div className="course-detail-view">
            <button className="back-btn" onClick={() => setSelectedCourse(null)}>
              ← Quay lại danh sách
            </button>

            <div className="course-detail-header">
              <img
                src={activeCourse?.thumbnail}
                alt={activeCourse?.name}
                className="detail-thumbnail"
              />
              <div className="detail-info">
                <h2 className="detail-title">{activeCourse?.name}</h2>
                <p className="detail-teacher">👨‍🏫 Giảng viên: {activeCourse?.teacher}</p>
                <p className="detail-description">{activeCourse?.description}</p>

                <div className="detail-meta">
                  <span className="meta-badge">⭐ {activeCourse?.rating.toFixed(1)}</span>
                  <span className="meta-badge">📚 {activeCourse?.lessonsCount} bài học</span>
                  <span className="meta-badge">👥 {activeCourse?.studentsEnrolled} học viên</span>
                </div>

                <div className="detail-progress">
                  <div className="progress-header">
                    <span>Tiến độ của bạn</span>
                    <span className="progress-value">{activeCourse?.progress}%</span>
                  </div>
                  <div className="progress-bar large">
                    <div
                      className="progress-fill"
                      style={{ width: `${activeCourse?.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="course-content">
              <div className="content-tabs">
                <button className="tab-btn active">📖 Nội dung</button>
                <button className="tab-btn">📝 Bài tập</button>
                <button className="tab-btn">📊 Điểm số</button>
                <button className="tab-btn">💬 Thảo luận</button>
              </div>

              <div className="lessons-list">
                <h3 className="section-title">Danh sách bài học</h3>

                {/* Chapter 1 */}
                <div className="chapter-section">
                  <div className="chapter-header">
                    <h4 className="chapter-title">Chương 1: Căn bản</h4>
                    <span className="chapter-progress">3/5 bài học</span>
                  </div>

                  <div className="lesson-item completed">
                    <div className="lesson-icon">✅</div>
                    <div className="lesson-info">
                      <h5 className="lesson-name">Bài 1: Giới thiệu về phương trình</h5>
                      <span className="lesson-duration">⏱️ 15 phút • Video</span>
                    </div>
                    <button className="lesson-btn">Xem lại</button>
                  </div>

                  <div className="lesson-item completed">
                    <div className="lesson-icon">✅</div>
                    <div className="lesson-info">
                      <h5 className="lesson-name">Bài 2: Phương trình bậc nhất</h5>
                      <span className="lesson-duration">⏱️ 20 phút • Video + Bài tập</span>
                    </div>
                    <button className="lesson-btn">Xem lại</button>
                  </div>

                  <div className="lesson-item current">
                    <div className="lesson-icon">▶️</div>
                    <div className="lesson-info">
                      <h5 className="lesson-name">Bài 3: Giải phương trình bậc nhất</h5>
                      <span className="lesson-duration">⏱️ 25 phút • Video</span>
                    </div>
                    <button className="lesson-btn primary">Tiếp tục học</button>
                  </div>

                  <div className="lesson-item locked">
                    <div className="lesson-icon">🔒</div>
                    <div className="lesson-info">
                      <h5 className="lesson-name">Bài 4: Bài tập thực hành</h5>
                      <span className="lesson-duration">⏱️ 30 phút • Thực hành</span>
                    </div>
                    <button className="lesson-btn" disabled>
                      Chưa mở
                    </button>
                  </div>

                  <div className="lesson-item locked">
                    <div className="lesson-icon">🔒</div>
                    <div className="lesson-info">
                      <h5 className="lesson-name">Bài 5: Kiểm tra chương 1</h5>
                      <span className="lesson-duration">⏱️ 45 phút • Kiểm tra</span>
                    </div>
                    <button className="lesson-btn" disabled>
                      Chưa mở
                    </button>
                  </div>
                </div>

                {/* Chapter 2 */}
                <div className="chapter-section">
                  <div className="chapter-header">
                    <h4 className="chapter-title">Chương 2: Nâng cao</h4>
                    <span className="chapter-progress">0/4 bài học</span>
                  </div>

                  <div className="lesson-item locked">
                    <div className="lesson-icon">🔒</div>
                    <div className="lesson-info">
                      <h5 className="lesson-name">Bài 6: Phương trình bậc hai</h5>
                      <span className="lesson-duration">⏱️ 30 phút • Video</span>
                    </div>
                    <button className="lesson-btn" disabled>
                      Chưa mở
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentCourses;
