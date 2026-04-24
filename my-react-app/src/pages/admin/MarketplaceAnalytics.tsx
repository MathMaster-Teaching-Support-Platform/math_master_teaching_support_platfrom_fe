import { Download, RefreshCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import {
  adminFinancialService,
  exportToCSV,
  formatCompactNumber,
  formatCurrency,
} from '../../services/admin-financial.service';
import type {
  MarketplaceTopCourse,
  MarketplaceTopInstructor,
} from '../../services/admin-financial.service';
import '../../styles/module-refactor.css';
import '../courses/TeacherCourses.css';
import './admin-mgmt-shell.css';
import AdminFinanceStudioShell from './AdminFinanceStudioShell';
import './admin-finance-studio.css';
import './MarketplaceAnalytics.css';

const MarketplaceAnalytics: React.FC = () => {
  const [topCourses, setTopCourses] = useState<MarketplaceTopCourse[]>([]);
  const [topInstructors, setTopInstructors] = useState<MarketplaceTopInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseLimit, setCourseLimit] = useState(10);
  const [instructorLimit, setInstructorLimit] = useState(10);

  useEffect(() => {
    fetchData();
  }, [courseLimit, instructorLimit]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [courses, instructors] = await Promise.all([
        adminFinancialService.getTopCourses(courseLimit),
        adminFinancialService.getTopInstructors(instructorLimit),
      ]);
      setTopCourses(courses);
      setTopInstructors(instructors);
    } catch (err: any) {
      console.error('Error fetching marketplace analytics:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu phân tích thị trường');
    } finally {
      setLoading(false);
    }
  };

  const getRankMedal = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  const renderStars = (rating: number): string => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return '⭐'.repeat(fullStars) + (hasHalfStar ? '½' : '');
  };

  const handleExportCourses = () => {
    if (topCourses.length === 0) return;

    const exportData = topCourses.map((course, index) => ({
      'Hạng': index + 1,
      'Khóa học': course.courseTitle,
      'Giảng viên': course.instructorName,
      'Lượt bán': course.salesCount,
      'Doanh thu (VND)': course.totalRevenue,
      'Hoa hồng (VND)': course.platformCommission,
      'Thu nhập GV (VND)': course.instructorEarnings,
      'Đánh giá': course.avgRating,
    }));

    exportToCSV(exportData, `top_courses_${courseLimit}`);
  };

  const handleExportInstructors = () => {
    if (topInstructors.length === 0) return;

    const exportData = topInstructors.map((instructor, index) => ({
      'Hạng': index + 1,
      'Giảng viên': instructor.instructorName,
      'Số khóa học': instructor.courseCount,
      'Tổng bán': instructor.totalSales,
      'Doanh thu (VND)': instructor.totalRevenue,
      'Thu nhập (VND)': instructor.totalEarnings,
      'Học viên': instructor.totalStudents,
      'Đánh giá': instructor.avgRating,
    }));

    exportToCSV(exportData, `top_instructors_${instructorLimit}`);
  };

  const shell = (body: React.ReactNode) => (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      contentClassName="dashboard-content--flush-bleed"
    >
      <AdminFinanceStudioShell>
        <div className="marketplace-analytics">{body}</div>
      </AdminFinanceStudioShell>
    </DashboardLayout>
  );

  if (loading) {
    return shell(
      <div className="loading-container">
        <div className="spinner" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return shell(
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Lỗi tải dữ liệu</h3>
        <p>{error}</p>
        <button type="button" onClick={fetchData} className="retry-button">
          Thử lại
        </button>
      </div>
    );
  }

  return shell(
    <>
      <header className="page-header courses-header-row analytics-header">
        <div className="header-stack">
          <div className="header-kicker">Tài chính</div>
          <h2 style={{ margin: 0 }}>Phân tích thị trường</h2>
          <p className="header-sub">Theo dõi hiệu suất khóa học và giảng viên hàng đầu</p>
        </div>
        <button type="button" onClick={fetchData} className="refresh-button">
          <RefreshCw size={16} aria-hidden />
          Làm mới
        </button>
      </header>

      {/* Overview Stats */}
      <div className="overview-stats">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Tổng Khóa Học</h3>
            <p className="stat-value">{topCourses.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Tổng Doanh Thu</h3>
            <p className="stat-value">
              {formatCurrency(
                topCourses.reduce((sum, course) => sum + course.totalRevenue, 0)
              )}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-content">
            <h3>Tổng Giảng Viên</h3>
            <p className="stat-value">{topInstructors.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Tổng Lượt Bán</h3>
            <p className="stat-value">
              {formatCompactNumber(
                topCourses.reduce((sum, course) => sum + course.salesCount, 0)
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Top Courses Section */}
      <div className="section-container">
        <div className="section-header">
          <h2>Khóa học bán chạy nhất</h2>
          <div className="section-controls">
            <button type="button" onClick={handleExportCourses} className="export-button">
              <Download size={16} aria-hidden />
              Xuất CSV
            </button>
            <label>
              Hiển thị:
              <select
                value={courseLimit}
                onChange={(e) => setCourseLimit(Number(e.target.value))}
                className="limit-select"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={50}>Top 50</option>
              </select>
            </label>
          </div>
        </div>

        {topCourses.length === 0 ? (
          <div className="empty-state">
            <p>Không có dữ liệu khóa học</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Khóa Học</th>
                  <th>Giảng Viên</th>
                  <th>Lượt Bán</th>
                  <th>Doanh Thu</th>
                  <th>Hoa Hồng</th>
                  <th>Thu Nhập GV</th>
                  <th>Đánh Giá</th>
                </tr>
              </thead>
              <tbody>
                {topCourses.map((course, index) => (
                  <tr key={course.courseId}>
                    <td className="rank-cell">
                      <span className="rank-badge">{getRankMedal(index + 1)}</span>
                    </td>
                    <td className="course-cell">
                      <div className="course-info">
                        {course.thumbnailUrl && (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.courseTitle}
                            className="course-thumbnail"
                          />
                        )}
                        <div className="course-details">
                          <span className="course-title">{course.courseTitle}</span>
                        </div>
                      </div>
                    </td>
                    <td>{course.instructorName}</td>
                    <td className="number-cell">{course.salesCount.toLocaleString()}</td>
                    <td className="currency-cell">{formatCurrency(course.totalRevenue)}</td>
                    <td className="currency-cell commission">
                      {formatCurrency(course.platformCommission)}
                    </td>
                    <td className="currency-cell earnings">
                      {formatCurrency(course.instructorEarnings)}
                    </td>
                    <td className="rating-cell">
                      <span className="rating-stars">{renderStars(course.avgRating)}</span>
                      <span className="rating-value">{course.avgRating.toFixed(1)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Instructors Section */}
      <div className="section-container">
        <div className="section-header">
          <h2>Giảng viên hàng đầu</h2>
          <div className="section-controls">
            <button type="button" onClick={handleExportInstructors} className="export-button">
              <Download size={16} aria-hidden />
              Xuất CSV
            </button>
            <label>
              Hiển thị:
              <select
                value={instructorLimit}
                onChange={(e) => setInstructorLimit(Number(e.target.value))}
                className="limit-select"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={50}>Top 50</option>
              </select>
            </label>
          </div>
        </div>

        {topInstructors.length === 0 ? (
          <div className="empty-state">
            <p>Không có dữ liệu giảng viên</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Giảng Viên</th>
                  <th>Khóa Học</th>
                  <th>Tổng Bán</th>
                  <th>Doanh Thu</th>
                  <th>Thu Nhập</th>
                  <th>Học Viên</th>
                  <th>Đánh Giá</th>
                </tr>
              </thead>
              <tbody>
                {topInstructors.map((instructor, index) => (
                  <tr key={instructor.instructorId}>
                    <td className="rank-cell">
                      <span className="rank-badge">{getRankMedal(index + 1)}</span>
                    </td>
                    <td className="instructor-cell">
                      <div className="instructor-info">
                        {instructor.avatarUrl && (
                          <img
                            src={instructor.avatarUrl}
                            alt={instructor.instructorName}
                            className="instructor-avatar"
                          />
                        )}
                        <span className="instructor-name">{instructor.instructorName}</span>
                      </div>
                    </td>
                    <td className="number-cell">{instructor.courseCount}</td>
                    <td className="number-cell">{instructor.totalSales.toLocaleString()}</td>
                    <td className="currency-cell">{formatCurrency(instructor.totalRevenue)}</td>
                    <td className="currency-cell earnings">
                      {formatCurrency(instructor.totalEarnings)}
                    </td>
                    <td className="number-cell">{instructor.totalStudents.toLocaleString()}</td>
                    <td className="rating-cell">
                      <span className="rating-stars">{renderStars(instructor.avgRating)}</span>
                      <span className="rating-value">{instructor.avgRating.toFixed(1)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="info-banner">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <h4>Về Phân Tích Thị Trường</h4>
          <ul>
            <li>
              <strong>Doanh Thu:</strong> Tổng giá trị tất cả đơn hàng thành công
            </li>
            <li>
              <strong>Hoa Hồng:</strong> 10% doanh thu thuộc về nền tảng
            </li>
            <li>
              <strong>Thu Nhập Giảng Viên:</strong> 90% doanh thu thuộc về giảng viên
            </li>
            <li>
              <strong>Đánh Giá:</strong> Đánh giá trung bình từ học viên (hiện tại là giá trị mẫu)
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default MarketplaceAnalytics;
