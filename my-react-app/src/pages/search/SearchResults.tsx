import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import './SearchResults.css';

interface SearchResult {
  id: number;
  type: 'course' | 'lesson' | 'assignment' | 'material' | 'student' | 'teacher';
  title: string;
  description: string;
  thumbnail?: string;
  metadata?: string;
  url: string;
}

const SearchResults: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('toán');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');

  // Mock search results
  const allResults: SearchResult[] = [
    // Courses
    {
      id: 1,
      type: 'course',
      title: 'Toán 11 - Chương trình nâng cao',
      description:
        'Khóa học toán nâng cao dành cho học sinh lớp 11 bao gồm đại số, giải tích và hình học',
      thumbnail: '📐',
      metadata: '45 bài học • 1200 học viên',
      url: '/student/courses/1',
    },
    {
      id: 2,
      type: 'course',
      title: 'Toán Đại số 12',
      description: 'Đại số và giải tích lớp 12 theo chương trình chuẩn',
      thumbnail: '📊',
      metadata: '38 bài học • 890 học viên',
      url: '/student/courses/2',
    },

    // Lessons
    {
      id: 3,
      type: 'lesson',
      title: 'Đạo hàm hàm số',
      description: 'Khái niệm đạo hàm, ý nghĩa hình học và vật lý của đạo hàm',
      thumbnail: '📚',
      metadata: 'Toán 11 • 45 phút',
      url: '/student/courses/1/lesson/3',
    },
    {
      id: 4,
      type: 'lesson',
      title: 'Phương trình bậc 2',
      description: 'Giải phương trình bậc 2 bằng công thức nghiệm',
      thumbnail: '📚',
      metadata: 'Toán 9 • 30 phút',
      url: '/student/courses/1/lesson/4',
    },
    {
      id: 5,
      type: 'lesson',
      title: 'Hình học không gian',
      description: 'Các khái niệm cơ bản về hình học trong không gian 3 chiều',
      thumbnail: '📚',
      metadata: 'Toán 11 • 60 phút',
      url: '/student/courses/1/lesson/5',
    },

    // Assignments
    {
      id: 6,
      type: 'assignment',
      title: 'Bài tập Đạo hàm cơ bản',
      description: 'Thực hành tính đạo hàm các hàm số thường gặp',
      thumbnail: '📝',
      metadata: 'Hạn nộp: 15/02/2026 • 100 điểm',
      url: '/student/assignments/6',
    },
    {
      id: 7,
      type: 'assignment',
      title: 'Kiểm tra giữa kỳ Toán 11',
      description: 'Kiểm tra tổng hợp kiến thức đã học',
      thumbnail: '📝',
      metadata: 'Hạn nộp: 20/02/2026 • 200 điểm',
      url: '/student/assignments/7',
    },

    // Materials
    {
      id: 8,
      type: 'material',
      title: 'Công thức Toán học tổng hợp',
      description: 'Tổng hợp các công thức toán học từ lớp 6 đến 12',
      thumbnail: '📄',
      metadata: 'PDF • 25 trang',
      url: '/materials/8',
    },
    {
      id: 9,
      type: 'material',
      title: 'Bài tập Đại số nâng cao',
      description: 'Bộ đề bài tập đại số nâng cao có lời giải chi tiết',
      thumbnail: '📄',
      metadata: 'PDF • 50 trang',
      url: '/materials/9',
    },
    {
      id: 10,
      type: 'material',
      title: 'Mind Map Toán 11',
      description: 'Sơ đồ tư duy tổng hợp kiến thức Toán lớp 11',
      thumbnail: '🗺️',
      metadata: 'Image • 1 trang',
      url: '/materials/10',
    },

    // Teachers/Students
    {
      id: 11,
      type: 'teacher',
      title: 'Nguyễn Văn A',
      description: 'Giáo viên Toán, chuyên dạy lớp 11-12',
      thumbnail: '👨‍🏫',
      metadata: '15 năm kinh nghiệm • 500+ học viên',
      url: '/teachers/11',
    },
    {
      id: 12,
      type: 'student',
      title: 'Trần Thị B',
      description: 'Học sinh lớp 11A1, đạt giải Nhì Olympic Toán',
      thumbnail: '👨‍🎓',
      metadata: 'Lớp 11A1 • Điểm TB: 9.2',
      url: '/students/12',
    },
  ];

  const filteredResults = allResults.filter((result) => {
    const matchCategory = categoryFilter === 'all' || result.type === categoryFilter;
    const matchQuery =
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  const stats = {
    total: filteredResults.length,
    courses: filteredResults.filter((r) => r.type === 'course').length,
    lessons: filteredResults.filter((r) => r.type === 'lesson').length,
    assignments: filteredResults.filter((r) => r.type === 'assignment').length,
    materials: filteredResults.filter((r) => r.type === 'material').length,
    people: filteredResults.filter((r) => r.type === 'teacher' || r.type === 'student').length,
  };

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar!, role: 'student' }}
      notificationCount={5}
    >
      <div className="search-results-page">
        {/* Search Bar */}
        <div className="search-header">
          <div className="search-bar-large">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm khóa học, bài học, tài liệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-btn">Tìm kiếm</button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="results-summary">
          <h2 className="results-title">
            Tìm thấy <span className="highlight">{stats.total}</span> kết quả cho "
            <span className="query">{searchQuery}</span>"
          </h2>
          <div className="sort-filter">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'relevance' | 'date')}
            >
              <option value="relevance">Liên quan nhất</option>
              <option value="date">Mới nhất</option>
            </select>
          </div>
        </div>

        {/* Category Filters */}
        <div className="category-filters">
          <button
            className={`category-btn ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            🔍 Tất cả ({stats.total})
          </button>
          <button
            className={`category-btn ${categoryFilter === 'course' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('course')}
          >
            📚 Khóa học ({stats.courses})
          </button>
          <button
            className={`category-btn ${categoryFilter === 'lesson' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('lesson')}
          >
            📖 Bài học ({stats.lessons})
          </button>
          <button
            className={`category-btn ${categoryFilter === 'assignment' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('assignment')}
          >
            📝 Bài tập ({stats.assignments})
          </button>
          <button
            className={`category-btn ${categoryFilter === 'material' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('material')}
          >
            📄 Tài liệu ({stats.materials})
          </button>
          <button
            className={`category-btn ${categoryFilter === 'teacher' || categoryFilter === 'student' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('teacher')}
          >
            👥 Người dùng ({stats.people})
          </button>
        </div>

        {/* Results Grid */}
        <div className="results-container">
          {filteredResults.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>Không tìm thấy kết quả</h3>
              <p>Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc</p>
            </div>
          ) : (
            <div className="results-list">
              {filteredResults.map((result) => (
                <div key={result.id} className={`result-card type-${result.type}`}>
                  <div className="result-thumbnail">{result.thumbnail}</div>
                  <div className="result-content">
                    <div className="result-type-badge">
                      {result.type === 'course'
                        ? '📚 Khóa học'
                        : result.type === 'lesson'
                          ? '📖 Bài học'
                          : result.type === 'assignment'
                            ? '📝 Bài tập'
                            : result.type === 'material'
                              ? '📄 Tài liệu'
                              : result.type === 'teacher'
                                ? '👨‍🏫 Giáo viên'
                                : '👨‍🎓 Học sinh'}
                    </div>
                    <h3 className="result-title">{result.title}</h3>
                    <p className="result-description">{result.description}</p>
                    {result.metadata && <div className="result-metadata">{result.metadata}</div>}
                  </div>
                  <div className="result-actions">
                    <button className="action-btn primary">
                      {result.type === 'course'
                        ? '📚 Xem khóa học'
                        : result.type === 'lesson'
                          ? '📖 Học ngay'
                          : result.type === 'assignment'
                            ? '📝 Làm bài'
                            : result.type === 'material'
                              ? '📥 Tải xuống'
                              : '👁️ Xem'}
                    </button>
                    <button className="action-btn secondary" title="Thêm vào yêu thích">
                      ⭐
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredResults.length > 0 && (
          <div className="pagination">
            <button className="pagination-btn">← Trước</button>
            <div className="pagination-pages">
              <button className="pagination-page active">1</button>
              <button className="pagination-page">2</button>
              <button className="pagination-page">3</button>
              <span>...</span>
              <button className="pagination-page">10</button>
            </div>
            <button className="pagination-btn">Sau →</button>
          </div>
        )}

        {/* Suggestions */}
        {filteredResults.length > 0 && (
          <div className="search-suggestions">
            <h3>Tìm kiếm liên quan</h3>
            <div className="suggestions-tags">
              <span className="tag">Toán học</span>
              <span className="tag">Đại số</span>
              <span className="tag">Hình học</span>
              <span className="tag">Giải tích</span>
              <span className="tag">Phương trình</span>
              <span className="tag">Đạo hàm</span>
              <span className="tag">Tích phân</span>
              <span className="tag">Lượng giác</span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SearchResults;
