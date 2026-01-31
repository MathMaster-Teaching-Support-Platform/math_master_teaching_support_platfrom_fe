import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent, mockCourses } from '../../data/mockData';
import './StudentGrades.css';

const StudentGrades: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  const gradesData = mockCourses.map((course) => ({
    courseId: course.id,
    courseName: course.name,
    teacher: course.teacher,
    assignments: [
      {
        name: 'Bài kiểm tra 15 phút - Chương 1',
        date: '2026-01-15',
        score: 8.5,
        maxScore: 10,
        weight: 10,
      },
      { name: 'Bài tập về nhà số 1', date: '2026-01-18', score: 9.0, maxScore: 10, weight: 5 },
      { name: 'Kiểm tra giữa kỳ', date: '2026-01-22', score: 7.8, maxScore: 10, weight: 30 },
      { name: 'Thuyết trình nhóm', date: '2026-01-25', score: 8.2, maxScore: 10, weight: 15 },
    ],
  }));

  const calculateCourseGrade = (
    assignments: Array<{ score: number; maxScore: number; weight: number }>
  ) => {
    const totalWeight = assignments.reduce((sum, a) => sum + a.weight, 0);
    const weightedScore = assignments.reduce(
      (sum, a) => sum + (a.score / a.maxScore) * a.weight,
      0
    );
    return ((weightedScore / totalWeight) * 10).toFixed(2);
  };

  const filteredData =
    selectedCourse === 'all' ? gradesData : gradesData.filter((g) => g.courseId === selectedCourse);

  const overallAverage = (
    gradesData.reduce(
      (sum, course) => sum + parseFloat(calculateCourseGrade(course.assignments)),
      0
    ) / gradesData.length
  ).toFixed(2);

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar!, role: 'student' }}
      notificationCount={3}
    >
      <div className="student-grades-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">📊 Bảng Điểm</h1>
            <p className="page-subtitle">Xem chi tiết điểm số và kết quả học tập của bạn</p>
          </div>
          <button className="btn btn-outline">📥 Xuất báo cáo</button>
        </div>

        {/* Overview Stats */}
        <div className="grades-overview">
          <div className="overview-card highlight">
            <div className="overview-icon">🎯</div>
            <div className="overview-content">
              <div className="overview-label">Điểm trung bình chung</div>
              <div className="overview-value large">{overallAverage}</div>
              <div className="overview-subtitle">Xếp loại: Giỏi</div>
            </div>
          </div>
          <div className="overview-card">
            <div className="overview-icon">📚</div>
            <div className="overview-content">
              <div className="overview-label">Số môn học</div>
              <div className="overview-value">{gradesData.length}</div>
            </div>
          </div>
          <div className="overview-card">
            <div className="overview-icon">✅</div>
            <div className="overview-content">
              <div className="overview-label">Bài đã chấm</div>
              <div className="overview-value">
                {gradesData.reduce((sum, c) => sum + c.assignments.length, 0)}
              </div>
            </div>
          </div>
          <div className="overview-card">
            <div className="overview-icon">🏆</div>
            <div className="overview-content">
              <div className="overview-label">Hạng trong lớp</div>
              <div className="overview-value">3/30</div>
            </div>
          </div>
        </div>

        {/* Course Filter */}
        <div className="grades-toolbar">
          <div className="course-filter">
            <label>Lọc theo môn học:</label>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              <option value="all">Tất cả môn học</option>
              {mockCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grades List */}
        <div className="grades-list">
          {filteredData.map((courseGrade) => {
            const courseAverage = calculateCourseGrade(courseGrade.assignments);
            const gradeClass =
              parseFloat(courseAverage) >= 8
                ? 'excellent'
                : parseFloat(courseAverage) >= 6.5
                  ? 'good'
                  : parseFloat(courseAverage) >= 5
                    ? 'average'
                    : 'poor';

            return (
              <div key={courseGrade.courseId} className="course-grade-card">
                <div className="course-grade-header">
                  <div className="header-left">
                    <h3 className="course-grade-title">{courseGrade.courseName}</h3>
                    <p className="course-teacher">👨‍🏫 {courseGrade.teacher}</p>
                  </div>
                  <div className={`course-average ${gradeClass}`}>
                    <div className="average-label">Điểm TB</div>
                    <div className="average-value">{courseAverage}</div>
                  </div>
                </div>

                <div className="assignments-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Tên bài tập</th>
                        <th>Ngày nộp</th>
                        <th>Hệ số</th>
                        <th>Điểm</th>
                        <th>Đóng góp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseGrade.assignments.map((assignment, index) => {
                        const scorePercent = (assignment.score / assignment.maxScore) * 100;
                        const contribution = (
                          (((assignment.score / assignment.maxScore) * assignment.weight) /
                            courseGrade.assignments.reduce((sum, a) => sum + a.weight, 0)) *
                          10
                        ).toFixed(2);

                        return (
                          <tr key={index}>
                            <td className="assignment-name">{assignment.name}</td>
                            <td>{new Date(assignment.date).toLocaleDateString('vi-VN')}</td>
                            <td>{assignment.weight}%</td>
                            <td>
                              <div className="score-cell">
                                <span
                                  className={`score-value ${scorePercent >= 80 ? 'high' : scorePercent >= 50 ? 'medium' : 'low'}`}
                                >
                                  {assignment.score}/{assignment.maxScore}
                                </span>
                                <div className="score-bar">
                                  <div
                                    className="score-fill"
                                    style={{ width: `${scorePercent}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="contribution">{contribution}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="grade-breakdown">
                  <h4 className="breakdown-title">Phân tích điểm số</h4>
                  <div className="breakdown-chart">
                    {courseGrade.assignments.map((assignment, index) => {
                      return (
                        <div key={index} className="chart-item" style={{ flex: assignment.weight }}>
                          <div
                            className="chart-bar"
                            style={{ height: `${(assignment.score / assignment.maxScore) * 100}%` }}
                          >
                            <span className="chart-label">{assignment.score}</span>
                          </div>
                          <span className="chart-name">{assignment.name.split(' - ')[0]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grade Legend */}
        <div className="grade-legend">
          <h4 className="legend-title">Thang điểm xếp loại</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-color excellent"></span>
              <span className="legend-text">8.0 - 10: Giỏi</span>
            </div>
            <div className="legend-item">
              <span className="legend-color good"></span>
              <span className="legend-text">6.5 - 7.9: Khá</span>
            </div>
            <div className="legend-item">
              <span className="legend-color average"></span>
              <span className="legend-text">5.0 - 6.4: Trung bình</span>
            </div>
            <div className="legend-item">
              <span className="legend-color poor"></span>
              <span className="legend-text">0 - 4.9: Yếu</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentGrades;
