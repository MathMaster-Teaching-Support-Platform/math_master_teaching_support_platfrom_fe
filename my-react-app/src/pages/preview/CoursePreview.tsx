import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  Star, 
  PlayCircle, 
  Globe, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Infinity as InfinityIcon, 
  Smartphone, 
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowLeft,
  Download
} from 'lucide-react';
import { 
  useCourseDetail, 
  useCourseLessons, 
  useCustomCourseSections,
  useCourseReviews,
  useReviewSummary,
  useTeacherProfile,
  useEnroll
} from '../../hooks/useCourses';
import { AuthService } from '../../services/api/auth.service';
import { getEffectivePrice, isDiscountActive } from '../../utils/pricing';
import { CountdownTimer } from '../../components/common/CountdownTimer';
import './CoursePreview.css';

const CoursePreview: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const isAuthenticated = AuthService.isAuthenticated();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor' | 'reviews'>('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Data fetching
  const { data: courseResp, isLoading: isLoadingCourse } = useCourseDetail(courseId!);
  const { data: lessonsResp } = useCourseLessons(courseId!);
  const { data: sectionsResp } = useCustomCourseSections(courseId!);
  const { data: reviewsResp } = useCourseReviews(courseId!);
  const { data: summaryResp } = useReviewSummary(courseId!);
  
  const course = courseResp?.result;
  const lessons = lessonsResp?.result || [];
  const sections = sectionsResp?.result || [];
  const reviews = reviewsResp?.result?.content || [];
  const summary = summaryResp?.result;

  const { data: teacherResp } = useTeacherProfile(course?.teacherId || '');
  const teacher = teacherResp?.result;

  const enrollMutation = useEnroll();

  // Group lessons by section or chapter
  const groupedCurriculum = useMemo(() => {
    if (!course) return [];
    
    if (course.provider === 'CUSTOM') {
      return sections.map(section => ({
        id: section.id,
        title: section.title,
        description: section.description,
        lessons: lessons.filter(l => l.sectionId === section.id).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
      })).sort((a) => (a.id === 'default' ? -1 : 0)); // Handle potential default section
    } else {
      // For MINISTRY, group by chapterTitle
      const chapters: Record<string, any[]> = {};
      lessons.forEach(lesson => {
        const title = lesson.chapterTitle || 'Chương chưa phân loại';
        if (!chapters[title]) chapters[title] = [];
        chapters[title].push(lesson);
      });
      return Object.entries(chapters).map(([title, items]) => ({
        id: title,
        title,
        lessons: items.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
      }));
    }
  }, [course, sections, lessons]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/preview/${courseId}` } });
      return;
    }
    enrollMutation.mutate(courseId!, {
      onSuccess: () => navigate(`/student/courses/${courseId}`)
    });
  };

  if (isLoadingCourse) {
    return (
      <div className="preview-loading">
        <div className="spinner" />
        <p>Đang tải thông tin khóa học...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="preview-error">
        <AlertCircle size={48} />
        <h2>Không tìm thấy khóa học</h2>
        <Link to="/student/courses" className="btn secondary">Quay lại danh sách</Link>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <Star 
        key={idx} 
        size={16} 
        className={idx < Math.round(rating) ? 'star-filled' : 'star-empty'}
        fill={idx < Math.round(rating) ? 'currentColor' : 'none'}
      />
    ));
  };

  const learningOutcomes = course.whatYouWillLearn?.split('\n').filter(Boolean) || [];
  const courseRequirements = course.requirements?.split('\n').filter(Boolean) || [];
  const targetAudiences = course.targetAudience?.split('\n').filter(Boolean) || [];

  return (
    <div className="course-preview-v2">
      {/* ── Dark Header Section ── */}
      <header className="preview-header-dark">
        <div className="preview-container">
          <Link to="/student/courses" className="breadcrumb-link">
            <ArrowLeft size={16} /> Quay lại danh sách
          </Link>
          
          <div className="header-grid">
            <div className="header-main-info">
              <h1 className="course-title-xl">{course.title}</h1>
              <p className="course-subtitle-lg">{course.subtitle || course.description?.substring(0, 150) + '...'}</p>
              
              <div className="course-meta-row">
                {course.rating > 0 && (
                  <div className="meta-badge rating-badge">
                    <span className="rating-num">{course.rating.toFixed(1)}</span>
                    <div className="stars-mini">{renderStars(course.rating)}</div>
                    <span className="rating-count">({course.ratingCount.toLocaleString()} đánh giá)</span>
                  </div>
                )}
                <div className="meta-item">
                  <Users size={16} />
                  <span>{course.studentsCount.toLocaleString()} học viên</span>
                </div>
              </div>

              <div className="creator-info">
                <span>Giảng viên: </span>
                <Link to={`/instructor/${course.teacherId}`} className="teacher-link">
                  {course.teacherName}
                </Link>
              </div>

              <div className="header-footer-meta">
                <div className="meta-item">
                  <AlertCircle size={16} />
                  <span>Cập nhật lần cuối {new Date(course.updatedAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="meta-item">
                  <Globe size={16} />
                  <span>{course.language || 'Tiếng Việt'}</span>
                </div>
              </div>
            </div>
            
            <div className="header-sidebar-anchor">
              {/* Sidebar placeholder for layout spacing on desktop */}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Layout with Floating Sidebar ── */}
      <div className="preview-content-layout">
        <div className="preview-container grid-layout">
          
          <div className="preview-main-column">
            {/* What you'll learn */}
            {learningOutcomes.length > 0 && (
              <section className="preview-card outcomes-card">
                <h2 className="section-title">Nội dung bạn sẽ học</h2>
                <div className="outcomes-grid">
                  {learningOutcomes.map((outcome, idx) => (
                    <div key={idx} className="outcome-item">
                      <CheckCircle2 size={18} className="check-icon" />
                      <span>{outcome}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tabs Navigation */}
            <nav className="preview-page-tabs">
              <button 
                className={`tab-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Tổng quan
              </button>
              <button 
                className={`tab-link ${activeTab === 'curriculum' ? 'active' : ''}`}
                onClick={() => setActiveTab('curriculum')}
              >
                Chương trình học
              </button>
              <button 
                className={`tab-link ${activeTab === 'instructor' ? 'active' : ''}`}
                onClick={() => setActiveTab('instructor')}
              >
                Giảng viên
              </button>
              <button 
                className={`tab-link ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Đánh giá
              </button>
            </nav>

            <div className="tab-pane-content">
              {activeTab === 'overview' && (
                <div className="overview-pane">
                  <section className="description-section">
                    <h2 className="pane-title">Mô tả khóa học</h2>
                    <div className="rich-text-content" style={{ whiteSpace: 'pre-wrap' }}>
                      {course.description}
                    </div>
                  </section>

                  {courseRequirements.length > 0 && (
                    <section className="requirements-section">
                      <h2 className="pane-title">Yêu cầu</h2>
                      <ul className="requirements-ul">
                        {courseRequirements.map((req, idx) => (
                          <li key={idx} style={{ marginBottom: '0.25rem' }}>{req}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {targetAudiences.length > 0 && (
                    <section className="target-audience-section" style={{ marginTop: '1.5rem' }}>
                      <h2 className="pane-title">Khóa học này dành cho ai?</h2>
                      <ul className="requirements-ul">
                        {targetAudiences.map((audience, idx) => (
                          <li key={idx} style={{ marginBottom: '0.25rem' }}>{audience}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}

              {activeTab === 'curriculum' && (
                <div className="curriculum-pane">
                  <div className="curriculum-stats">
                    <span>{course.sectionsCount} chương</span>
                    <span className="dot">•</span>
                    <span>{lessons.length} bài học</span>
                    <span className="dot">•</span>
                    <span>{course.totalVideoHours ? course.totalVideoHours + ' giờ tổng cộng' : 'N/A'}</span>
                  </div>

                  <div className="accordion-curriculum">
                    {groupedCurriculum.map((section) => (
                      <div key={section.id} className={`accordion-item ${expandedSections[section.id] ? 'expanded' : ''}`}>
                        <button className="accordion-header" onClick={() => toggleSection(section.id)}>
                          <div className="header-left">
                            {expandedSections[section.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            <span className="section-title-text">{section.title}</span>
                          </div>
                          <span className="section-meta-text">{section.lessons.length} bài học</span>
                        </button>
                        
                        {expandedSections[section.id] && (
                          <div className="accordion-body">
                            {section.lessons.map((lesson: any) => (
                              <div key={lesson.id} className="lesson-row">
                                <div className="lesson-left">
                                  <PlayCircle size={16} className="play-icon" />
                                  <span className="lesson-title-text">{lesson.lessonTitle}</span>
                                </div>
                                <div className="lesson-right">
                                  {lesson.isFreePreview && <span className="preview-tag">Xem trước</span>}
                                  <span className="lesson-time">
                                    {lesson.durationSeconds ? `${Math.floor(lesson.durationSeconds / 60)}:${(lesson.durationSeconds % 60).toString().padStart(2, '0')}` : '--:--'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'instructor' && (
                <div className="instructor-pane">
                  <div className="instructor-header">
                    <img 
                      src={teacher?.avatar || 'https://via.placeholder.com/150'} 
                      alt={teacher?.fullName} 
                      className="instructor-avatar-circle"
                    />
                    <div className="instructor-header-info">
                      <h3 className="instructor-name-link">
                        <Link to={`/instructor/${course.teacherId}`}>{teacher?.fullName}</Link>
                      </h3>
                      <p className="instructor-tagline">{teacher?.position || 'Giảng viên chuyên nghiệp'}</p>
                      
                      <div className="instructor-quick-stats">
                        <div className="q-stat">
                          <Star size={14} fill="#eab308" color="#eab308" />
                          <span>{teacher?.averageRating.toFixed(1)} Xếp hạng</span>
                        </div>
                        <div className="q-stat">
                          <FileText size={14} />
                          <span>{teacher?.totalRatings.toLocaleString()} Đánh giá</span>
                        </div>
                        <div className="q-stat">
                          <Users size={14} />
                          <span>{teacher?.totalStudents.toLocaleString()} Học viên</span>
                        </div>
                        <div className="q-stat">
                          <PlayCircle size={14} />
                          <span>{teacher?.totalCourses} Khóa học</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="instructor-bio">
                    {teacher?.description}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="reviews-pane">
                  <h2 className="pane-title">
                    <Star size={24} fill="#eab308" color="#eab308" style={{ marginRight: '8px' }} />
                    {summary?.averageRating.toFixed(1)} xếp hạng khóa học • {summary?.totalReviews} đánh giá
                  </h2>
                  
                  <div className="reviews-list-v2">
                    {reviews.map((review) => (
                      <div key={review.id} className="review-card-v2">
                        <div className="review-user-avatar">
                          {review.studentAvatar ? (
                            <img src={review.studentAvatar} alt={review.studentName} />
                          ) : (
                            <div className="avatar-initials">{review.studentName.charAt(0)}</div>
                          )}
                        </div>
                        <div className="review-body-v2">
                          <div className="review-header-v2">
                            <h4 className="reviewer-name">{review.studentName}</h4>
                            <div className="review-stars-row">
                              {renderStars(review.rating)}
                              <span className="review-date-v2">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </div>
                          <p className="review-text-v2">{review.comment}</p>
                          
                          {review.instructorReply && (
                            <div className="instructor-reply-box">
                              <div className="reply-header">Phản hồi từ giảng viên</div>
                              <p className="reply-content">{review.instructorReply}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="preview-sidebar-column">
            <div className="sidebar-sticky-card">
              <div className="video-preview-thumbnail">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} />
                ) : (
                  <div className="thumbnail-fallback">
                    <PlayCircle size={64} />
                  </div>
                )}
                <div className="play-overlay">
                  <PlayCircle size={64} />
                  <span>Xem trước khóa học</span>
                </div>
              </div>

              <div className="sidebar-price-container">
                {isDiscountActive(course) ? (
                  <div className="price-group">
                    <span className="price-primary">{getEffectivePrice(course) === 0 ? 'Miễn phí' : getEffectivePrice(course).toLocaleString('vi-VN') + '₫'}</span>
                    {course.originalPrice && course.originalPrice > getEffectivePrice(course) && (
                      <span className="price-original">{course.originalPrice.toLocaleString('vi-VN')}₫</span>
                    )}
                    {course.originalPrice && course.originalPrice > getEffectivePrice(course) && (
                      <span className="price-discount">
                        {Math.round(((course.originalPrice - getEffectivePrice(course)) / course.originalPrice) * 100)}% off
                      </span>
                    )}
                  </div>
                ) : course.originalPrice && course.originalPrice > 0 ? (
                  <span className="price-primary">{course.originalPrice.toLocaleString('vi-VN')}₫</span>
                ) : (
                  <span className="price-primary">Miễn phí</span>
                )}
                
                {isDiscountActive(course) && course.discountExpiryDate && (
                  <CountdownTimer expiryDate={course.discountExpiryDate} />
                )}
              </div>

              <button 
                className={`btn-enroll-primary ${enrollMutation.isPending ? 'loading' : ''}`}
                onClick={handleEnroll}
                disabled={enrollMutation.isPending}
              >
                {enrollMutation.isPending ? 'Đang xử lý...' : 
                 getEffectivePrice(course) > 0 
                   ? 'Mua ngay' 
                   : 'Đăng ký miễn phí'}
              </button>

              {enrollMutation.isError && (
                <div className="enroll-error-alert" style={{ margin: '0 1.5rem 1.5rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#991b1b', fontSize: '0.9rem' }}>
                  <AlertCircle size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
                  {(enrollMutation.error as any)?.response?.data?.code === 1029 ? (
                    <>
                      <strong style={{ display: 'inline-block', marginBottom: '0.25rem' }}>Số dư ví không đủ!</strong>
                      <div style={{ marginTop: '0.25rem' }}>Vui lòng nạp thêm tiền để tiếp tục thanh toán khóa học.</div>
                      <button 
                        onClick={() => navigate('/student/wallet')} 
                        style={{ background: 'none', border: 'none', color: '#b91c1c', textDecoration: 'underline', padding: 0, marginTop: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                      >
                        Đến ví của tôi &rarr;
                      </button>
                    </>
                  ) : (
                    <span>{(enrollMutation.error as any)?.response?.data?.message || 'Có lỗi xảy ra khi đăng ký khóa học.'}</span>
                  )}
                </div>
              )}

              <div className="sidebar-inclusions">
                <h4>Khóa học này bao gồm:</h4>
                <ul className="inclusion-list">
                  <li>
                    <Clock size={16} />
                    <span>{course.totalVideoHours || '--'} giờ video theo yêu cầu</span>
                  </li>
                  <li>
                    <FileText size={16} />
                    <span>{course.articlesCount || 0} bài báo/tài liệu đọc</span>
                  </li>
                  {(course.resourcesCount ?? 0) > 0 && (
                    <li>
                      <Download size={16} />
                      <span>{course.resourcesCount} tài nguyên tải xuống</span>
                    </li>
                  )}
                  <li>
                    <Smartphone size={16} />
                    <span>Truy cập trên thiết bị di động và TV</span>
                  </li>
                  <li>
                    <InfinityIcon size={16} />
                    <span>Quyền truy cập trọn đời</span>
                  </li>
                </ul>
              </div>

              <div className="sidebar-actions">
                <button className="btn-share">Chia sẻ</button>
                <button className="btn-coupon">Áp dụng mã giảm giá</button>
              </div>
            </div>
          </aside>

        </div>
      </div>
      
      <style>{`
        .course-preview-v2 {
          background: #fff;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .preview-header-dark {
          background: #1c1d1f;
          color: #fff;
          padding: 2rem 0 3rem;
        }

        .preview-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .breadcrumb-link {
          color: #a435f0;
          font-weight: 700;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
          text-decoration: none;
        }

        .header-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 2rem;
        }

        .course-title-xl {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          line-height: 1.2;
        }

        .course-subtitle-lg {
          font-size: 1.2rem;
          line-height: 1.4;
          margin-bottom: 1.5rem;
          color: #d1d7dc;
        }

        .course-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          align-items: center;
          margin-bottom: 1rem;
        }

        .rating-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .rating-num {
          color: #f69c08;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .stars-mini {
          display: flex;
          gap: 2px;
          color: #eab308;
        }

        .rating-count {
          color: #c0c4c9;
          font-size: 0.85rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.9rem;
          color: #fff;
        }

        .creator-info {
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .teacher-link {
          color: #a435f0;
          text-decoration: underline;
          font-weight: 600;
        }

        .header-footer-meta {
          display: flex;
          gap: 1.5rem;
          color: #fff;
          font-size: 0.85rem;
        }

        /* ── Floating Sidebar ── */
        .preview-content-layout {
          position: relative;
          margin-top: -120px;
          padding-bottom: 4rem;
        }

        .grid-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 3rem;
        }

        .preview-card {
          background: white;
          border: 1px solid #d1d7dc;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .outcomes-card {
          border-radius: 4px;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .outcomes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 0.5rem 2rem;
        }

        .outcome-item {
          display: flex;
          gap: 0.75rem;
          font-size: 0.9rem;
          line-height: 1.4;
          color: #2d2f31;
        }

        .check-icon {
          flex-shrink: 0;
          color: #1c1d1f;
        }

        /* Tabs */
        .preview-page-tabs {
          display: flex;
          border-bottom: 1px solid #d1d7dc;
          margin-bottom: 2rem;
          position: sticky;
          top: 0;
          background: white;
          z-index: 50;
        }

        .tab-link {
          padding: 1rem 1.5rem;
          font-weight: 700;
          color: #6a6f73;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-link:hover { color: #1c1d1f; }
        .tab-link.active {
          color: #1c1d1f;
          border-bottom-color: #1c1d1f;
        }

        .pane-title {
          font-size: 1.35rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .rich-text-content {
          line-height: 1.6;
          color: #2d2f31;
          white-space: pre-wrap;
        }

        .curriculum-stats {
          margin-bottom: 1rem;
          font-size: 0.9rem;
          color: #2d2f31;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .dot { color: #6a6f73; }

        .accordion-curriculum {
          border: 1px solid #d1d7dc;
        }

        .accordion-item {
          border-bottom: 1px solid #d1d7dc;
        }

        .accordion-item:last-child { border-bottom: none; }

        .accordion-header {
          width: 100%;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f7f9fa;
          border: none;
          cursor: pointer;
          text-align: left;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .section-title-text {
          font-weight: 700;
          color: #1c1d1f;
        }

        .section-meta-text {
          font-size: 0.85rem;
          color: #1c1d1f;
        }

        .accordion-body {
          padding: 0.5rem 0;
          background: white;
        }

        .lesson-row {
          padding: 0.75rem 1rem 0.75rem 3.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background 0.2s;
        }

        .lesson-row:hover { background: #f7f9fa; }

        .lesson-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
        }

        .play-icon { color: #6a6f73; }

        .preview-tag {
          color: #a435f0;
          text-decoration: underline;
          font-size: 0.85rem;
          margin-right: 1rem;
          font-weight: 600;
        }

        .lesson-time {
          font-size: 0.85rem;
          color: #6a6f73;
        }

        /* Instructor */
        .instructor-header {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .instructor-avatar-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
        }

        .instructor-name-link {
          font-size: 1.25rem;
          margin: 0;
        }

        .instructor-name-link a {
          color: #a435f0;
          text-decoration: underline;
        }

        .instructor-tagline {
          color: #6a6f73;
          margin: 0.25rem 0 0.75rem;
        }

        .instructor-quick-stats {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .q-stat {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
          color: #1c1d1f;
        }

        /* Sidebar Card */
        .sidebar-sticky-card {
          background: white;
          border: 1px solid #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1);
          border-radius: 4px;
          overflow: hidden;
          position: sticky;
          top: 2rem;
          z-index: 100;
        }

        .video-preview-thumbnail {
          position: relative;
          aspect-ratio: 16/9;
          background: #000;
          cursor: pointer;
        }

        .video-preview-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.7;
        }

        .play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: white;
          gap: 1rem;
        }

        .play-overlay span {
          font-weight: 700;
          font-size: 1rem;
        }

        .sidebar-price-container {
          padding: 1.5rem 1.5rem 0.5rem;
        }

        .price-group {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .price-primary {
          font-size: 2rem;
          font-weight: 700;
          color: #1c1d1f;
        }

        .price-original {
          font-size: 1rem;
          color: #6a6f73;
          text-decoration: line-through;
        }

        .price-discount {
          font-size: 1rem;
          color: #1c1d1f;
        }

        .price-expiry {
          margin-top: 0.5rem;
        }

        .btn-enroll-primary {
          width: calc(100% - 3rem);
          margin: 1rem 1.5rem;
          background: #a435f0;
          color: white;
          border: none;
          padding: 1rem;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-enroll-primary:hover { background: #8710d8; }
        .btn-enroll-primary.loading { opacity: 0.7; pointer-events: none; }

        .sidebar-inclusions {
          padding: 0 1.5rem 1.5rem;
        }

        .sidebar-inclusions h4 {
          font-size: 1rem;
          margin-bottom: 1rem;
        }

        .inclusion-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .inclusion-list li {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.85rem;
          color: #2d2f31;
        }

        .sidebar-actions {
          padding: 0 1.5rem 1.5rem;
          display: flex;
          gap: 1rem;
        }

        .btn-share, .btn-coupon {
          flex: 1;
          background: none;
          border: 1px solid #1c1d1f;
          padding: 0.75rem;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .btn-share:hover, .btn-coupon:hover { background: #f7f9fa; }

        @media (max-width: 1024px) {
          .header-grid, .grid-layout {
            grid-template-columns: 1fr;
          }
          .header-sidebar-anchor, .preview-sidebar-column {
            display: none;
          }
          .header-main-info { max-width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default CoursePreview;
