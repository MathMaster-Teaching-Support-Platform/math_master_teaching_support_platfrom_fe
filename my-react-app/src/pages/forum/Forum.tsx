import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import './Forum.css';

interface Discussion {
  id: number;
  author: string;
  avatar: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  replies: number;
  likes: number;
  createdAt: string;
  lastActivity: string;
  isPinned: boolean;
  isSolved: boolean;
}

const Forum: React.FC = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'unanswered'>('latest');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const discussions: Discussion[] = [
    {
      id: 1,
      author: 'Nguyễn Văn A',
      avatar: '👨‍🎓',
      title: 'Cách giải phương trình bậc 2 nhanh nhất?',
      content: 'Em muốn hỏi có cách nào giải phương trình bậc 2 nhanh hơn công thức delta không ạ?',
      category: 'Đại số',
      tags: ['Phương trình', 'Toán 9'],
      views: 125,
      replies: 8,
      likes: 15,
      createdAt: '2 giờ trước',
      lastActivity: '30 phút trước',
      isPinned: true,
      isSolved: true,
    },
    {
      id: 2,
      author: 'Trần Thị B',
      avatar: '👩‍🎓',
      title: 'Làm thế nào để học tốt Hình học không gian?',
      content: 'Em thấy Hình học không gian rất khó hình dung. Các bạn có mẹo gì không?',
      category: 'Hình học',
      tags: ['Hình học', 'Toán 11'],
      views: 89,
      replies: 12,
      likes: 23,
      createdAt: '5 giờ trước',
      lastActivity: '1 giờ trước',
      isPinned: false,
      isSolved: false,
    },
    {
      id: 3,
      author: 'Lê Văn C',
      avatar: '👨‍🎓',
      title: 'Tài liệu ôn thi THPT Quốc gia môn Toán',
      content: 'Mọi người có tài liệu nào hay để ôn thi THPT không? Share em với nhé!',
      category: 'Tài liệu',
      tags: ['THPT', 'Ôn thi'],
      views: 234,
      replies: 25,
      likes: 45,
      createdAt: '1 ngày trước',
      lastActivity: '3 giờ trước',
      isPinned: false,
      isSolved: false,
    },
    {
      id: 4,
      author: 'Phạm Thị D',
      avatar: '👩‍🎓',
      title: 'Giải thích khái niệm Đạo hàm',
      content: 'Em chưa hiểu rõ ý nghĩa hình học của đạo hàm. Ai có thể giải thích giúp em không?',
      category: 'Giải tích',
      tags: ['Đạo hàm', 'Toán 11'],
      views: 156,
      replies: 6,
      likes: 18,
      createdAt: '1 ngày trước',
      lastActivity: '5 giờ trước',
      isPinned: false,
      isSolved: true,
    },
    {
      id: 5,
      author: 'Hoàng Văn E',
      avatar: '👨‍🎓',
      title: 'Bài tập về Tích phân',
      content: 'Có ai giải được bài tập tích phân trong bài tập tuần này không? Em bị stuck quá!',
      category: 'Giải tích',
      tags: ['Tích phân', 'Toán 12'],
      views: 78,
      replies: 4,
      likes: 9,
      createdAt: '2 ngày trước',
      lastActivity: '1 ngày trước',
      isPinned: false,
      isSolved: false,
    },
    {
      id: 6,
      author: 'Đỗ Thị F',
      avatar: '👩‍🎓',
      title: 'Kinh nghiệm thi Olympic Toán',
      content: 'Chia sẻ kinh nghiệm của mình khi tham gia kỳ thi Olympic Toán cấp tỉnh',
      category: 'Chia sẻ',
      tags: ['Olympic', 'Kinh nghiệm'],
      views: 312,
      replies: 18,
      likes: 56,
      createdAt: '3 ngày trước',
      lastActivity: '2 ngày trước',
      isPinned: true,
      isSolved: false,
    },
  ];

  const filteredDiscussions = discussions.filter((disc) => {
    const matchCategory = categoryFilter === 'all' || disc.category === categoryFilter;
    const matchSearch =
      disc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      disc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      disc.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const sortedDiscussions = [...filteredDiscussions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    if (sortBy === 'popular') return b.likes - a.likes;
    if (sortBy === 'unanswered') return a.replies - b.replies;
    return 0;
  });

  const stats = {
    total: discussions.length,
    solved: discussions.filter((d) => d.isSolved).length,
    unanswered: discussions.filter((d) => d.replies === 0).length,
    active: discussions.filter(
      (d) => d.lastActivity.includes('giờ') || d.lastActivity.includes('phút')
    ).length,
  };

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar!, role: 'student' }}
      notificationCount={5}
    >
      <div className="forum-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">💬 Diễn Đàn Học Tập</h1>
            <p className="page-subtitle">Thảo luận, chia sẻ và học hỏi cùng cộng đồng</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            ➕ Tạo thảo luận mới
          </button>
        </div>

        {/* Stats */}
        <div className="forum-stats">
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              💬
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Thảo luận</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
            >
              ✅
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.solved}</div>
              <div className="stat-label">Đã giải quyết</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' }}
            >
              ❓
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.unanswered}</div>
              <div className="stat-label">Chưa trả lời</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
            >
              🔥
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Hoạt động</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="forum-controls">
          <div className="search-filter-group">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm thảo luận..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Tất cả danh mục</option>
              <option value="Đại số">📐 Đại số</option>
              <option value="Hình học">📏 Hình học</option>
              <option value="Giải tích">📊 Giải tích</option>
              <option value="Tài liệu">📄 Tài liệu</option>
              <option value="Chia sẻ">💡 Chia sẻ</option>
            </select>
          </div>

          <div className="sort-buttons">
            <button
              className={`sort-btn ${sortBy === 'latest' ? 'active' : ''}`}
              onClick={() => setSortBy('latest')}
            >
              🕐 Mới nhất
            </button>
            <button
              className={`sort-btn ${sortBy === 'popular' ? 'active' : ''}`}
              onClick={() => setSortBy('popular')}
            >
              🔥 Phổ biến
            </button>
            <button
              className={`sort-btn ${sortBy === 'unanswered' ? 'active' : ''}`}
              onClick={() => setSortBy('unanswered')}
            >
              ❓ Chưa trả lời
            </button>
          </div>
        </div>

        {/* Discussions List */}
        <div className="discussions-container">
          {sortedDiscussions.map((disc) => (
            <div key={disc.id} className={`discussion-card ${disc.isPinned ? 'pinned' : ''}`}>
              {disc.isPinned && <div className="pinned-badge">📌 Ghim</div>}
              {disc.isSolved && <div className="solved-badge">✅ Đã giải quyết</div>}

              <div className="discussion-avatar">{disc.avatar}</div>

              <div className="discussion-content">
                <div className="discussion-header">
                  <h3 className="discussion-title">{disc.title}</h3>
                  <span className="category-badge">{disc.category}</span>
                </div>

                <p className="discussion-excerpt">{disc.content}</p>

                <div className="discussion-tags">
                  {disc.tags.map((tag, idx) => (
                    <span key={idx} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="discussion-footer">
                  <div className="author-info">
                    <span className="author-name">{disc.author}</span>
                    <span className="separator">•</span>
                    <span className="created-time">{disc.createdAt}</span>
                  </div>

                  <div className="discussion-meta">
                    <span className="meta-item">👁️ {disc.views}</span>
                    <span className="meta-item">💬 {disc.replies}</span>
                    <span className="meta-item">❤️ {disc.likes}</span>
                  </div>
                </div>
              </div>

              <div className="discussion-actions">
                <button className="action-btn primary">📖 Xem chi tiết</button>
                <button className="action-btn secondary">💬 Trả lời</button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button className="pagination-btn">← Trước</button>
          <div className="pagination-pages">
            <button className="pagination-page active">1</button>
            <button className="pagination-page">2</button>
            <button className="pagination-page">3</button>
          </div>
          <button className="pagination-btn">Sau →</button>
        </div>

        {/* Create Discussion Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">➕ Tạo thảo luận mới</h2>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Tiêu đề *</label>
                  <input type="text" placeholder="Nhập tiêu đề thảo luận" />
                </div>

                <div className="form-group">
                  <label>Danh mục *</label>
                  <select>
                    <option>Chọn danh mục</option>
                    <option>📐 Đại số</option>
                    <option>📏 Hình học</option>
                    <option>📊 Giải tích</option>
                    <option>📄 Tài liệu</option>
                    <option>💡 Chia sẻ</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Nội dung *</label>
                  <textarea
                    rows={8}
                    placeholder="Viết nội dung chi tiết...&#10;&#10;Bạn có thể:&#10;• Đặt câu hỏi về bài tập&#10;• Chia sẻ kinh nghiệm học tập&#10;• Thảo luận phương pháp giải&#10;• Gợi ý tài liệu học tập"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Tags (phân cách bằng dấu phẩy)</label>
                  <input type="text" placeholder="Ví dụ: Toán 11, Đạo hàm, Khó" />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Đây là câu hỏi cần giải đáp gấp</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </button>
                <button className="btn btn-primary">✅ Đăng thảo luận</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Forum;
