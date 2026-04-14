import { CheckCircle, Clock, TrendingUp, Users } from 'lucide-react';
import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockTeacher } from '../../data/mockData';
import '../../styles/module-refactor.css';
import './TeacherAnalytics.css';

const TeacherAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'semester'>('month');

  const analyticsData = {
    studentPerformance: [
      { name: 'Nguyễn Văn A', avgScore: 9.2, improvement: 12, attendance: 95 },
      { name: 'Trần Thị B', avgScore: 8.5, improvement: 8, attendance: 90 },
      { name: 'Lê Văn C', avgScore: 7.8, improvement: -3, attendance: 85 },
      { name: 'Phạm Thị D', avgScore: 9.0, improvement: 15, attendance: 98 },
      { name: 'Hoàng Văn E', avgScore: 6.5, improvement: -5, attendance: 75 },
    ],
    assignmentStats: {
      total: 15,
      avgCompletion: 87,
      avgScore: 7.8,
      onTimeRate: 82,
    },
    courseProgress: [
      { course: 'Toán 10 - Nâng cao', students: 30, avgProgress: 65, avgScore: 8.2 },
      { course: 'Đại số 11', students: 28, avgProgress: 52, avgScore: 7.5 },
      { course: 'Giải tích 12', students: 25, avgProgress: 78, avgScore: 8.8 },
    ],
    weeklyActivity: [
      { day: 'T2', lessons: 3, assignments: 2, submissions: 45 },
      { day: 'T3', lessons: 2, assignments: 1, submissions: 28 },
      { day: 'T4', lessons: 4, assignments: 3, submissions: 62 },
      { day: 'T5', lessons: 3, assignments: 2, submissions: 51 },
      { day: 'T6', lessons: 2, assignments: 1, submissions: 32 },
      { day: 'T7', lessons: 1, assignments: 0, submissions: 8 },
      { day: 'CN', lessons: 0, assignments: 0, submissions: 3 },
    ],
  };

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar!, role: 'teacher' }}
      notificationCount={5}
    >
      <div className="module-layout-container">
        <section className="module-page">
          {/* ── Header ── */}
          <header className="page-header ta-analytics-header-row">
            <div className="header-stack">
              <div className="header-kicker">Analytics</div>
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Phân Tích & Báo Cáo</h2>
              </div>
              <p className="header-sub">Theo dõi hiệu suất giảng dạy và tiến độ học sinh</p>
            </div>
            <div className="header-actions">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'semester')}
              >
                <option value="week">7 ngày qua</option>
                <option value="month">30 ngày qua</option>
                <option value="semester">Học kỳ này</option>
              </select>
              <button className="btn">Xuất báo cáo</button>
            </div>
          </header>

          {/* ── Stats ── */}
          <div className="stats-grid">
            <div className="stat-card stat-violet">
              <div className="stat-icon-wrap">
                <Users size={18} />
              </div>
              <div>
                <h3>83</h3>
                <p>Tổng học sinh</p>
              </div>
            </div>
            <div className="stat-card stat-emerald">
              <div className="stat-icon-wrap">
                <TrendingUp size={18} />
              </div>
              <div>
                <h3>8.2</h3>
                <p>Điểm TB chung</p>
              </div>
            </div>
            <div className="stat-card stat-blue">
              <div className="stat-icon-wrap">
                <CheckCircle size={18} />
              </div>
              <div>
                <h3>87%</h3>
                <p>Tỷ lệ hoàn thành</p>
              </div>
            </div>
            <div className="stat-card stat-amber">
              <div className="stat-icon-wrap">
                <Clock size={18} />
              </div>
              <div>
                <h3>82%</h3>
                <p>Nộp đúng hạn</p>
              </div>
            </div>
          </div>

          <div className="analytics-grid">
            {/* Student Performance */}
            <div className="analytics-card large">
              <div className="card-header">
                <h3 className="card-title">🎯 Hiệu suất học sinh</h3>
                <button className="btn btn-outline btn-sm">Xem tất cả</button>
              </div>
              <div className="student-performance-table">
                <table>
                  <thead>
                    <tr>
                      <th>Học sinh</th>
                      <th>Điểm TB</th>
                      <th>Tiến bộ</th>
                      <th>Điểm danh</th>
                      <th>Đánh giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.studentPerformance.map((student, index) => (
                      <tr key={index}>
                        <td className="student-name">
                          <div className="student-avatar">{student.name.charAt(0)}</div>
                          {student.name}
                        </td>
                        <td>
                          <span
                            className={`score-badge ${student.avgScore >= 8 ? 'high' : student.avgScore >= 6.5 ? 'medium' : 'low'}`}
                          >
                            {student.avgScore}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`improvement ${student.improvement > 0 ? 'positive' : 'negative'}`}
                          >
                            {student.improvement > 0 ? '↑' : '↓'} {Math.abs(student.improvement)}%
                          </span>
                        </td>
                        <td>
                          <div className="attendance-bar">
                            <div
                              className="attendance-fill"
                              style={{ width: `${student.attendance}%` }}
                            ></div>
                            <span className="attendance-text">{student.attendance}%</span>
                          </div>
                        </td>
                        <td>
                          {student.avgScore >= 8.5
                            ? '🌟 Xuất sắc'
                            : student.avgScore >= 7.5
                              ? '👍 Tốt'
                              : student.avgScore >= 6.5
                                ? '📈 Khá'
                                : '⚠️ Cần cải thiện'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Weekly Activity */}
            <div className="analytics-card">
              <div className="card-header">
                <h3 className="card-title">📅 Hoạt động tuần qua</h3>
              </div>
              <div className="activity-chart">
                {analyticsData.weeklyActivity.map((day, index) => {
                  const maxValue = Math.max(
                    ...analyticsData.weeklyActivity.map((d) => d.submissions)
                  );
                  const height = (day.submissions / maxValue) * 100;
                  return (
                    <div key={index} className="activity-bar-group">
                      <div className="activity-bar" style={{ height: `${height}%` }}>
                        <span className="bar-value">{day.submissions}</span>
                      </div>
                      <span className="bar-label">{day.day}</span>
                      <span className="bar-detail">
                        {day.lessons}L • {day.assignments}BT
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Course Progress */}
            <div className="analytics-card">
              <div className="card-header">
                <h3 className="card-title">📚 Tiến độ Giáo Trình</h3>
              </div>
              <div className="course-progress-list">
                {analyticsData.courseProgress.map((course, index) => (
                  <div key={index} className="progress-item">
                    <div className="progress-header">
                      <span className="progress-course-name">{course.course}</span>
                      <span className="progress-students">👥 {course.students}</span>
                    </div>
                    <div className="progress-stats">
                      <div className="stat">
                        <span className="stat-label">Tiến độ</span>
                        <span className="stat-value">{course.avgProgress}%</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Điểm TB</span>
                        <span className="stat-value">{course.avgScore}</span>
                      </div>
                    </div>
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${course.avgProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assignment Stats */}
            <div className="analytics-card">
              <div className="card-header">
                <h3 className="card-title">📝 Thống kê bài tập</h3>
              </div>
              <div className="assignment-stats-grid">
                <div className="stat-box">
                  <div className="stat-icon">📚</div>
                  <div className="stat-number">{analyticsData.assignmentStats.total}</div>
                  <div className="stat-name">Bài tập đã giao</div>
                </div>
                <div className="stat-box">
                  <div className="stat-icon">✅</div>
                  <div className="stat-number">{analyticsData.assignmentStats.avgCompletion}%</div>
                  <div className="stat-name">Hoàn thành TB</div>
                </div>
                <div className="stat-box">
                  <div className="stat-icon">💯</div>
                  <div className="stat-number">{analyticsData.assignmentStats.avgScore}</div>
                  <div className="stat-name">Điểm TB</div>
                </div>
                <div className="stat-box">
                  <div className="stat-icon">⏰</div>
                  <div className="stat-number">{analyticsData.assignmentStats.onTimeRate}%</div>
                  <div className="stat-name">Nộp đúng hạn</div>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="insights-section">
            <h3 className="section-title">💡 Nhận xét & Gợi ý</h3>
            <div className="insights-grid">
              <div className="insight-card positive">
                <div className="insight-icon">🎉</div>
                <div className="insight-content">
                  <h4 className="insight-title">Điểm mạnh</h4>
                  <p className="insight-text">
                    Tỷ lệ hoàn thành bài tập tăng 4% so với tháng trước. Học sinh có sự tiến bộ rõ
                    rệt.
                  </p>
                </div>
              </div>
              <div className="insight-card warning">
                <div className="insight-icon">⚠️</div>
                <div className="insight-content">
                  <h4 className="insight-title">Cần chú ý</h4>
                  <p className="insight-text">
                    2 học sinh có xu hướng giảm điểm. Nên có buổi trao đổi riêng để hỗ trợ.
                  </p>
                </div>
              </div>
              <div className="insight-card info">
                <div className="insight-icon">💡</div>
                <div className="insight-content">
                  <h4 className="insight-title">Gợi ý</h4>
                  <p className="insight-text">
                    Tỷ lệ nộp trễ tăng nhẹ. Có thể cân nhắc điều chỉnh deadline hoặc nhắc nhở sớm
                    hơn.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default TeacherAnalytics;
