import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  Star, 
  PlayCircle, 
  Lock,
  Globe, 
  FileText, 
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowLeft,
  X
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
import { VideoUploadService } from '../../services/api/videoUpload.service';
import { getEffectivePrice, isDiscountActive } from '../../utils/pricing';
import { CountdownTimer } from '../../components/common/CountdownTimer';
import { CourseLearningPanels } from '../../components/course/CourseLearningPanels';
import { CourseIncludesList } from '../../components/course/CourseIncludesList';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import './CoursePreview.css';

const CoursePreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAuthenticated = AuthService.isAuthenticated();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor' | 'reviews'>('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Preview states
  const [previewLesson, setPreviewLesson] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Data fetching
  const { data: courseResp, isLoading: isLoadingCourse } = useCourseDetail(id!);
  const { data: lessonsResp } = useCourseLessons(id!);
  const { data: sectionsResp } = useCustomCourseSections(id!);
  const { data: reviewsResp } = useCourseReviews(id!);
  const { data: summaryResp } = useReviewSummary(id!);
  
  const course = courseResp?.result;
  const lessons = lessonsResp?.result || [];
  const sections = sectionsResp?.result || [];
  const reviews = reviewsResp?.result?.content || [];
  const summary = summaryResp?.result;
  const previewLessons = useMemo(() => lessons.filter(l => l.isFreePreview), [lessons]);
  const lockedLessonsCount = useMemo(() => Math.max(lessons.length - previewLessons.length, 0), [lessons.length, previewLessons.length]);

  const totalDurationMinutes = useMemo(() => {
    return lessons.reduce((acc, l) => acc + Math.floor((l.durationSeconds || 0) / 60), 0);
  }, [lessons]);

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
  
  const handlePlayPreview = async (lesson: any) => {
    if (!lesson.id) return;
    setLoadingPreview(true);
    try {
      const resp = await VideoUploadService.getVideoUrl(id!, lesson.id);
      setPreviewUrl(resp.result);
      setPreviewLesson(lesson);
    } catch (err) {
      console.error('Failed to load preview:', err);
      alert('Không thể tải video xem trước. Vui lòng thử lại sau.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const getPreviewMaterials = (lesson: any) => {
    if (!lesson?.materials) return [];
    try {
      const parsed = JSON.parse(lesson.materials);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((m: any) => !!m?.url);
    } catch {
      return [];
    }
  };

  const isFreeCourse = useMemo(() => course ? getEffectivePrice(course) === 0 : false, [course]);
  
  const hasFreeLessons = useMemo(() => {
    return lessons.some(l => l.isFreePreview);
  }, [lessons]);

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/course/${id}` } });
      return;
    }
    enrollMutation.mutate(id!, {
      onSuccess: (resp) => {
        const enrollmentId = resp?.result?.id;
        if (enrollmentId) {
          navigate(`/student/courses/${enrollmentId}`);
        }
      }
    });
  };

  const handlePrimaryAction = () => {
    if (course.isEnrolled) {
      navigate('/student/courses');
      return;
    }
    handleEnroll();
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

  const previewContent = (
    <div className="course-preview-v2">
      {/* ── Dark Header Section ── */}
      <header className="preview-header-dark">
        <div className="preview-container">
          <Link to="/student/courses" className="breadcrumb-link">
            <ArrowLeft size={16} /> Trang giới thiệu khóa học
          </Link>

          <div className="preview-purpose-note" style={{ marginBottom: '1rem' }}>
            <span style={{ fontWeight: 700 }}>Chế độ xem trước:</span> Bạn đang xem phiên bản giới thiệu công khai của khóa học. Chỉ các bài được đánh dấu xem trước miễn phí mới có thể phát ngay.
          </div>
          
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
                <Link to={`/student/instructors/${course.teacherId}`} className="teacher-link">
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

                  <div style={{ marginTop: '1.5rem' }}>
                    <CourseLearningPanels
                      whatYouWillLearn={course.whatYouWillLearn}
                      requirements={course.requirements}
                      targetAudience={course.targetAudience}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'curriculum' && (
                <div className="curriculum-pane">
                  <div className="curriculum-stats">
                    <span>{course.sectionsCount} chương</span>
                    <span className="dot">•</span>
                    <span>{lessons.length} bài học</span>
                    <span className="dot">•</span>
                    <span>{course.totalVideoHours ? course.totalVideoHours + ' giờ tổng cộng' : `${totalDurationMinutes} phút`}</span>
                    <span className="dot">•</span>
                    <span>{previewLessons.length} bài xem trước</span>
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
                              <div 
                                key={lesson.id} 
                                className={`lesson-row ${lesson.isFreePreview ? 'clickable-preview' : 'locked-lesson-row'}`}
                                onClick={() => lesson.isFreePreview && handlePlayPreview(lesson)}
                              >
                                <div className="lesson-left">
                                  <PlayCircle size={16} className="play-icon" />
                                  <span className="lesson-title-text">{lesson.lessonTitle}</span>
                                </div>
                                <div className="lesson-right">
                                  {lesson.isFreePreview && (
                                    <span className="preview-tag-v2">Xem trước</span>
                                  )}
                                  {!lesson.isFreePreview && (
                                    <span className="locked-tag-v2"><Lock size={13} /> Bị khóa</span>
                                  )}
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
                        <Link to={`/student/instructors/${course.teacherId}`}>{teacher?.fullName}</Link>
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
              <div
                className="video-preview-thumbnail"
                onClick={() => {
                  const firstPreview = lessons.find(l => l.isFreePreview);
                  if (firstPreview) handlePlayPreview(firstPreview);
                }}
                style={{ cursor: previewLessons.length > 0 ? 'pointer' : 'not-allowed' }}
              >
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} />
                ) : (
                  <div className="thumbnail-fallback">
                    <PlayCircle size={64} />
                  </div>
                )}
                <div className="play-overlay">
                  <PlayCircle size={64} />
                  <span>{previewLessons.length > 0 ? 'Xem trước khóa học' : 'Không có bài xem trước'}</span>
                </div>
              </div>

              <div style={{ padding: '0.75rem 1.5rem 0', color: '#4b5563', fontSize: '0.88rem' }}>
                <strong>{previewLessons.length}</strong> bài học miễn phí xem trước • <strong>{lockedLessonsCount}</strong> bài học mở sau khi đăng ký
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
                
                {!isFreeCourse && hasFreeLessons && (
                  <div style={{ marginTop: '0.5rem', color: '#1c1d1f', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                    <PlayCircle size={14} color="#a435f0" />
                    <span>Bài học thử miễn phí đã sẵn sàng</span>
                  </div>
                )}

                {isDiscountActive(course) && course.discountExpiryDate && (
                  <CountdownTimer expiryDate={course.discountExpiryDate} />
                )}
              </div>

              <button 
                className={`btn-enroll-primary ${enrollMutation.isPending ? 'loading' : ''}`}
                onClick={handlePrimaryAction}
                disabled={enrollMutation.isPending}
              >
                {enrollMutation.isPending
                  ? 'Đang xử lý...'
                  : course.isEnrolled
                    ? 'Tiếp tục học'
                    : !isAuthenticated
                      ? 'Đăng nhập để đăng ký'
                      : getEffectivePrice(course) > 0
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
                <CourseIncludesList
                  totalVideoHours={course.totalVideoHours}
                  articlesCount={course.articlesCount}
                  resourcesCount={course.resourcesCount}
                  mobileText="Truy cập trên thiết bị di động và TV"
                />
              </div>

              <div className="sidebar-actions" style={{ display: 'block', textAlign: 'left' }}>
                <p style={{ margin: 0, color: '#4b5563', fontSize: '0.86rem', lineHeight: 1.5 }}>
                  Đây là trang giới thiệu khóa học. Bài học bị khóa sẽ mở đầy đủ sau khi đăng ký thành công.
                </p>
              </div>
            </div>
          </aside>

        </div>
      </div>
      
      {/* ── Video Preview Modal ── */}
      {previewLesson && (
        <div className="video-modal-overlay" onClick={() => setPreviewLesson(null)}>
          <div className="video-modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-box">
                <span className="preview-label">Xem trước khóa học</span>
                <h3 className="modal-lesson-title">{previewLesson.lessonTitle}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setPreviewLesson(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-video-box">
              <video 
                src={previewUrl} 
                controls 
                autoPlay 
                className="preview-video-player"
                style={{ width: '100%', borderRadius: '4px' }}
              />
            </div>

            <div className="modal-footer-info" style={{ padding: '1.5rem', borderTop: '1px solid #d1d7dc' }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Tài liệu bài học</h4>
              <div className="preview-materials" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {getPreviewMaterials(previewLesson).map((m: any) => (
                  <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="preview-material-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a435f0', textDecoration: 'none', fontWeight: 600 }}>
                    <FileText size={16} />
                    <span>{m.name}</span>
                  </a>
                ))}
                {getPreviewMaterials(previewLesson).length === 0 && (
                  <p className="muted-italic" style={{ color: '#6a6f73', fontStyle: 'italic' }}>Không có tài liệu miễn phí cho bài học xem trước này.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {loadingPreview && (
        <div className="loading-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <p>Đang chuẩn bị video...</p>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .video-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .video-modal-container {
          background: white;
          width: 100%;
          max-width: 900px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }

        .modal-header {
          padding: 1.25rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #d1d7dc;
        }

        .preview-label {
          color: #6a6f73;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.25rem;
        }

        .modal-lesson-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }

        .modal-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #1c1d1f;
        }

        .modal-video-box {
          background: #000;
          aspect-ratio: 16/9;
        }
        
        .clickable-preview {
          cursor: pointer;
        }
        
        .clickable-preview:hover {
          background: #f7f9fa;
        }

        .locked-lesson-row {
          cursor: default;
          opacity: 0.9;
        }

        .locked-tag-v2 {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 999px;
          padding: 0.18rem 0.6rem;
          font-size: 0.72rem;
          font-weight: 700;
        }

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

        .preview-tag-v2 {
          background: #f7f9fa;
          border: 1px solid #1c1d1f;
          padding: 2px 8px;
          border-radius: 4px;
          color: #a435f0;
          text-decoration: underline;
          font-size: 0.8rem;
          margin-right: 1rem;
          font-weight: 700;
        }

        .preview-tag-v2:hover {
          background: #e3e7ea;
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

  if (isAuthenticated) {
    return (
      <DashboardLayout
        role="student"
        user={{ name: 'Học sinh', avatar: '', role: 'student' }}
      >
        {previewContent}
      </DashboardLayout>
    );
  }

  return previewContent;
};

export default CoursePreview;
