import React, { useState } from 'react';
import './CoursePreview.css';

interface Lesson {
  id: number;
  title: string;
  duration: string;
  isFree: boolean;
}

interface Review {
  id: number;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  content: string;
}

const CoursePreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews'>('overview');
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const course = {
    title: 'Toán 11 - Đại Số Nâng Cao',
    subtitle: 'Làm chủ kiến thức Đại số lớp 11 với phương pháp học hiện đại',
    instructor: 'Thầy Nguyễn Văn A',
    instructorAvatar: '👨‍🏫',
    rating: 4.8,
    totalReviews: 1234,
    totalStudents: 5678,
    price: 1990000,
    originalPrice: 2990000,
    duration: '40 giờ',
    totalLessons: 85,
    level: 'Trung cấp',
    language: 'Tiếng Việt',
    thumbnail: '📐',
    description:
      'Giáo Trình Toán 11 - Đại Số Nâng Cao được thiết kế đặc biệt để giúp học sinh nắm vững kiến thức Đại số, từ cơ bản đến nâng cao. Với phương pháp giảng dạy sinh động, kết hợp công nghệ AI hỗ trợ, Giáo Trình sẽ giúp bạn tự tin chinh phục mọi dạng bài tập.',
    highlights: [
      'Hơn 85 bài học video chất lượng cao',
      'Hơn 500 bài tập thực hành có lời giải chi tiết',
      'Hệ thống AI Assistant hỗ trợ 24/7',
      'Chứng chỉ hoàn thành Giáo Trình',
      'Truy cập trọn đời',
      'Cộng đồng học tập sôi động',
    ],
    requirements: [
      'Kiến thức Toán lớp 10',
      'Máy tính hoặc điện thoại có kết nối internet',
      'Tinh thần học hỏi và rèn luyện',
    ],
    whatYouWillLearn: [
      'Phương trình và bất phương trình',
      'Hàm số và đồ thị',
      'Dãy số và cấp số',
      'Giới hạn và liên tục',
      'Đạo hàm và ứng dụng',
      'Kỹ thuật giải bài tập nâng cao',
    ],
  };

  const curriculum: { chapter: string; lessons: Lesson[] }[] = [
    {
      chapter: 'Chương 1: Hàm số lượng giác',
      lessons: [
        { id: 1, title: 'Giới thiệu về hàm số lượng giác', duration: '15:30', isFree: true },
        { id: 2, title: 'Công thức lượng giác cơ bản', duration: '22:45', isFree: true },
        { id: 3, title: 'Phương trình lượng giác', duration: '28:15', isFree: false },
        { id: 4, title: 'Bài tập thực hành', duration: '35:20', isFree: false },
      ],
    },
    {
      chapter: 'Chương 2: Dãy số và cấp số',
      lessons: [
        { id: 5, title: 'Khái niệm dãy số', duration: '18:40', isFree: false },
        { id: 6, title: 'Cấp số cộng', duration: '25:30', isFree: false },
        { id: 7, title: 'Cấp số nhân', duration: '24:15', isFree: false },
        { id: 8, title: 'Tổng của cấp số', duration: '30:50', isFree: false },
      ],
    },
    {
      chapter: 'Chương 3: Giới hạn',
      lessons: [
        { id: 9, title: 'Giới hạn của dãy số', duration: '26:20', isFree: false },
        { id: 10, title: 'Giới hạn của hàm số', duration: '32:10', isFree: false },
        { id: 11, title: 'Các dạng vô định', duration: '28:45', isFree: false },
      ],
    },
  ];

  const reviews: Review[] = [
    {
      id: 1,
      author: 'Nguyễn Thị B',
      avatar: '👩‍🎓',
      rating: 5,
      date: '2 ngày trước',
      content:
        'Giáo Trình rất chi tiết và dễ hiểu. Thầy giảng rất nhiệt tình. Các bài tập phong phú giúp em nắm chắc kiến thức.',
    },
    {
      id: 2,
      author: 'Trần Văn C',
      avatar: '👨‍🎓',
      rating: 5,
      date: '1 tuần trước',
      content:
        'Đây là Giáo Trình Toán hay nhất em từng học. AI Assistant giúp em giải quyết mọi thắc mắc ngay lập tức.',
    },
    {
      id: 3,
      author: 'Lê Thị D',
      avatar: '👩‍🎓',
      rating: 4,
      date: '2 tuần trước',
      content:
        'Nội dung tốt, video chất lượng cao. Tuy nhiên em mong có thêm bài tập nâng cao hơn nữa.',
    },
    {
      id: 4,
      author: 'Phạm Văn E',
      avatar: '👨‍🎓',
      rating: 5,
      date: '3 tuần trước',
      content: 'Giá cả hợp lý, kiến thức đầy đủ. Em đã đạt 9.5 điểm môn Toán nhờ Giáo Trình này!',
    },
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <span key={idx} className={`star ${idx < rating ? 'filled' : ''}`}>
        ⭐
      </span>
    ));
  };

  return (
    <div className="course-preview-page">
      {/* Header */}
      <div className="preview-header">
        <div className="header-container">
          <a href="/" className="back-link">
            ← Trang chủ
          </a>
          <div className="header-content">
            <div className="course-info">
              <h1 className="course-title">{course.title}</h1>
              <p className="course-subtitle">{course.subtitle}</p>
              <div className="course-meta">
                <span className="rating">
                  ⭐ {course.rating} ({course.totalReviews.toLocaleString()} đánh giá)
                </span>
                <span className="separator">•</span>
                <span className="students">
                  👥 {course.totalStudents.toLocaleString()} học viên
                </span>
                <span className="separator">•</span>
                <span className="instructor">
                  {course.instructorAvatar} {course.instructor}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="preview-container">
        {/* Main Content */}
        <div className="preview-main">
          {/* Tabs */}
          <div className="preview-tabs">
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Tổng quan
            </button>
            <button
              className={`tab-btn ${activeTab === 'curriculum' ? 'active' : ''}`}
              onClick={() => setActiveTab('curriculum')}
            >
              Nội dung Giáo Trình
            </button>
            <button
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Đánh giá ({course.totalReviews})
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-content">
              <section className="content-section">
                <h2>Mô tả Giáo Trình</h2>
                <p>{course.description}</p>
              </section>

              <section className="content-section">
                <h2>Điểm nổi bật</h2>
                <ul className="highlights-list">
                  {course.highlights.map((item, idx) => (
                    <li key={idx}>✅ {item}</li>
                  ))}
                </ul>
              </section>

              <section className="content-section">
                <h2>Bạn sẽ học được gì?</h2>
                <div className="learning-grid">
                  {course.whatYouWillLearn.map((item, idx) => (
                    <div key={idx} className="learning-item">
                      <span className="check-icon">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="content-section">
                <h2>Yêu cầu</h2>
                <ul className="requirements-list">
                  {course.requirements.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>
          )}

          {/* Curriculum Tab */}
          {activeTab === 'curriculum' && (
            <div className="tab-content">
              <div className="curriculum-header">
                <h2>
                  {curriculum.length} chương • {course.totalLessons} bài học • {course.duration}
                </h2>
              </div>
              <div className="curriculum-list">
                {curriculum.map((chapter, idx) => (
                  <div key={idx} className="chapter-item">
                    <div className="chapter-header">
                      <h3>{chapter.chapter}</h3>
                      <span className="chapter-info">{chapter.lessons.length} bài học</span>
                    </div>
                    <div className="lessons-list">
                      {chapter.lessons.map((lesson) => (
                        <div key={lesson.id} className="lesson-item">
                          <div className="lesson-info">
                            <span className="lesson-icon">{lesson.isFree ? '🎬' : '🔒'}</span>
                            <span className="lesson-title">{lesson.title}</span>
                            {lesson.isFree && <span className="free-badge">Miễn phí</span>}
                          </div>
                          <span className="lesson-duration">⏱️ {lesson.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="tab-content">
              <div className="reviews-summary">
                <div className="rating-overview">
                  <div className="rating-number">{course.rating}</div>
                  <div className="rating-stars">{renderStars(5)}</div>
                  <div className="rating-text">{course.totalReviews.toLocaleString()} đánh giá</div>
                </div>
              </div>
              <div className="reviews-list">
                {reviews.map((review) => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <div className="review-author">
                        <span className="author-avatar">{review.avatar}</span>
                        <div>
                          <div className="author-name">{review.author}</div>
                          <div className="review-date">{review.date}</div>
                        </div>
                      </div>
                      <div className="review-rating">{renderStars(review.rating)}</div>
                    </div>
                    <p className="review-content">{review.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="preview-sidebar">
          <div className="sidebar-card">
            <div className="course-thumbnail">{course.thumbnail}</div>
            <div className="price-section">
              <div className="current-price">{course.price.toLocaleString()}đ</div>
              <div className="original-price">{course.originalPrice.toLocaleString()}đ</div>
              <div className="discount-badge">-33%</div>
            </div>
            <button className="btn-enroll" onClick={() => setShowEnrollModal(true)}>
              Đăng ký ngay
            </button>
            <div className="course-includes">
              <h3>Giáo Trình bao gồm:</h3>
              <ul>
                <li>⏱️ {course.duration} video</li>
                <li>📚 {course.totalLessons} bài học</li>
                <li>📝 Bài tập thực hành</li>
                <li>📜 Chứng chỉ hoàn thành</li>
                <li>♾️ Truy cập trọn đời</li>
                <li>📱 Học trên mọi thiết bị</li>
              </ul>
            </div>
          </div>

          <div className="instructor-card">
            <h3>Giảng viên</h3>
            <div className="instructor-info">
              <div className="instructor-avatar-large">{course.instructorAvatar}</div>
              <div className="instructor-name">{course.instructor}</div>
              <div className="instructor-title">Giáo viên Toán</div>
              <div className="instructor-stats">
                <div className="stat">⭐ 4.9 Đánh giá</div>
                <div className="stat">👥 15,234 Học viên</div>
                <div className="stat">📚 8 Giáo Trình</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="modal-overlay" onClick={() => setShowEnrollModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Đăng ký Giáo Trình</h2>
              <button className="modal-close" onClick={() => setShowEnrollModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Bạn cần đăng nhập để đăng ký Giáo Trình này.</p>
              <div className="enroll-actions">
                <a href="/login" className="btn btn-primary">
                  Đăng nhập
                </a>
                <a href="/register" className="btn btn-outline">
                  Đăng ký tài khoản
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePreview;
