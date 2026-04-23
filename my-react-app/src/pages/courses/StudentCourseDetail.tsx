import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Facebook,
  FileText,
  Globe,
  Linkedin,
  MessageSquare,
  PlayCircle,
  Star,
  TrendingUp,
  Users,
  Youtube,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CourseBreadcrumb } from '../../components/course/CourseBreadcrumb';
import { CourseIncludesList } from '../../components/course/CourseIncludesList';
import { CourseLearningPanels } from '../../components/course/CourseLearningPanels';
import CourseRecommendationRow from '../../components/course/CourseRecommendationRow';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useCourseDetail,
  useCourseProgress,
  useInstructorCourses,
  useMyEnrollments,
  useRelatedCourses,
  useTeacherProfile,
} from '../../hooks/useCourses';
import '../../styles/module-refactor.css';
import './StudentCourses.css';
// Import tab components
import StudentAssessmentsTab from './student-tabs/StudentAssessmentsTab';
import StudentLessonsTab from './student-tabs/StudentLessonsTab';
import StudentProgressTab from './student-tabs/StudentProgressTab';
import StudentReviewsTab from './student-tabs/StudentReviewsTab';

type TabType = 'lessons' | 'assessments' | 'progress' | 'reviews';

const coverGradients = [
  'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
  'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
  'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
] as const;

const coverAccents = ['#1d4ed8', '#0f766e', '#047857', '#c2410c', '#be185d', '#6d28d9'] as const;

const levelMap: Record<string, { label: string; color: string }> = {
  BEGINNER: { label: 'Cơ bản', color: '#10b981' },
  INTERMEDIATE: { label: 'Trung bình', color: '#f59e0b' },
  ADVANCED: { label: 'Nâng cao', color: '#ef4444' },
  ALL_LEVELS: { label: 'Mọi cấp độ', color: '#6366f1' },
};

const StudentCourseDetail: React.FC = () => {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'lessons';

  const { data: enrollmentsData } = useMyEnrollments();
  const enrollments = enrollmentsData?.result ?? [];
  const enrollment = enrollments.find((e) => e.id === enrollmentId);
  const enrollmentIndex = enrollments.findIndex((e) => e.id === enrollmentId);

  const { data: courseData } = useCourseDetail(enrollment?.courseId ?? '');
  const { data: progressData } = useCourseProgress(enrollmentId!);

  const course = courseData?.result;
  const progress = progressData?.result;

  const { data: teacherProfileData } = useTeacherProfile(course?.teacherId ?? '');
  const { data: relatedCoursesData, isLoading: loadingRelated } = useRelatedCourses(
    course?.id ?? ''
  );
  const { data: teacherCoursesData, isLoading: loadingTeacherCourses } = useInstructorCourses(
    course?.teacherId ?? ''
  );

  const teacherProfile = teacherProfileData?.result;
  const relatedCourses = relatedCoursesData?.result?.content ?? [];
  const teacherCourses = (teacherCoursesData?.result ?? []).filter((c) => c.id !== course?.id);

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  if (!enrollment) {
    return (
      <DashboardLayout role="student" user={{ name: 'Học sinh', avatar: '', role: 'student' }}>
        <div className="module-layout-container">
          <section className="module-page">
            <div className="empty">
              <FileText size={32} style={{ marginBottom: 8, color: '#94a3b8' }} />
              <p>Không tìm thấy thông tin đăng ký</p>
              <button className="btn secondary" onClick={() => navigate('/student/courses')}>
                <ArrowLeft size={14} />
                Quay lại danh sách
              </button>
            </div>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'lessons' as const, label: 'Bài học', icon: BookOpen },
    { id: 'assessments' as const, label: 'Bài đánh giá', icon: FileText },
    { id: 'reviews' as const, label: 'Đánh giá', icon: Star },
    { id: 'progress' as const, label: 'Tiến độ', icon: TrendingUp },
  ];

  return (
    <DashboardLayout role="student" user={{ name: 'Học sinh', avatar: '', role: 'student' }}>
      <div className="module-layout-container">
        <section className="module-page">
          <AnimatePresence mode="wait">
            <motion.div
              key="detail-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Breadcrumb */}
              <CourseBreadcrumb courseTitle={enrollment.courseTitle ?? 'Giáo trình'} />

              {/* Course Header */}
              <div className="course-detail-header">
                <button
                  className="btn secondary btn-sm"
                  style={{ marginBottom: '1rem' }}
                  onClick={() => navigate('/student/courses')}
                >
                  <ArrowLeft size={16} strokeWidth={2} />
                  Quay lại danh sách
                </button>

                {/* Course Hero Card */}
                <div
                  className="hero-card"
                  style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}
                >
                  <div
                    style={{
                      width: 200,
                      minWidth: 160,
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: coverGradients[enrollmentIndex % coverGradients.length],
                      color: coverAccents[enrollmentIndex % coverAccents.length],
                      minHeight: 130,
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: '1rem',
                      position: 'relative',
                      flexShrink: 0,
                    }}
                  >
                    {course?.thumbnailUrl && (
                      <img
                        src={course.thumbnailUrl}
                        alt={enrollment.courseTitle ?? 'Course thumbnail'}
                        className="cover-thumb"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'radial-gradient(circle at top right, rgba(255,255,255,0.7), transparent 36%), linear-gradient(to top, rgba(255,255,255,0.12), transparent 70%)',
                      }}
                    />
                    <h3
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        margin: 0,
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: 'var(--mod-ink)',
                      }}
                    >
                      {enrollment.courseTitle}
                    </h3>
                  </div>

                  <div style={{ flex: 1, minWidth: 240 }}>
                    <h2
                      style={{
                        margin: '0 0 0.5rem',
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        color: 'var(--mod-ink)',
                      }}
                    >
                      {enrollment.courseTitle}
                    </h2>
                    {course?.subtitle && (
                      <p
                        className="course-hero-subtitle"
                        style={{ fontSize: '1rem', color: '#475569', marginBottom: '1rem' }}
                      >
                        {course.subtitle}
                      </p>
                    )}
                    {teacherProfile && (
                      <div
                        className="hero-instructor-link"
                        style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#64748b' }}
                      >
                        <span>Giảng viên: </span>
                        <Link
                          to={`/student/instructors/${teacherProfile.userId}`}
                          style={{
                            color: '#4f46e5',
                            textDecoration: 'none',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                          }}
                        >
                          {teacherProfile.fullName}
                        </Link>
                      </div>
                    )}
                    <span
                      className={`course-badge ${enrollment.status === 'ACTIVE' ? 'badge-live' : 'badge-draft'}`}
                      style={{ marginBottom: '0.75rem', marginRight: '0.5rem' }}
                    >
                      {enrollment.status === 'ACTIVE' ? 'Đang học' : 'Đã hủy'}
                    </span>
                    {course?.level && (
                      <span
                        className="course-badge"
                        style={{
                          marginBottom: '0.75rem',
                          background: levelMap[course.level]?.color ?? '#6366f1',
                        }}
                      >
                        {levelMap[course.level]?.label ?? 'Mọi cấp độ'}
                      </span>
                    )}

                    {course && (
                      <div className="course-header-meta" style={{ marginTop: '0.5rem' }}>
                        <span className="meta-item">
                          <BookOpen size={14} />
                          {course.subjectName} • Khối {course.gradeLevel}
                        </span>
                        <span className="meta-separator">•</span>
                        <span className="meta-item">
                          <Users size={14} />
                          {course.studentsCount} học viên
                        </span>
                        {course.language && (
                          <>
                            <span className="meta-separator">•</span>
                            <span className="meta-item">
                              <Globe size={14} />
                              {course.language}
                            </span>
                          </>
                        )}
                        <span className="meta-separator">•</span>
                        <span className="meta-item">
                          <FileText size={14} />
                          {course.lessonsCount} bài học
                        </span>
                        <span className="meta-separator">•</span>
                        <span className="meta-item">
                          <Star size={14} fill="#FBBF24" color="#FBBF24" />
                          <strong style={{ marginLeft: 4 }}>{course.rating || 0}</strong>
                          <span style={{ color: 'var(--sc-text-muted)', marginLeft: 4 }}>
                            ({course.ratingCount || 0} đánh giá)
                          </span>
                        </span>
                      </div>
                    )}

                    {progress && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.84rem',
                            color: '#60748f',
                            marginBottom: '0.4rem',
                          }}
                        >
                          <span>Tiến độ của bạn</span>
                          <strong style={{ color: '#1f5eff' }}>
                            {progress.completionRate.toFixed(1)}%
                          </strong>
                        </div>
                        <div
                          style={{
                            height: 6,
                            background: '#e8eef8',
                            borderRadius: 999,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              transform: `scaleX(${progress.completionRate / 100})`,
                              transformOrigin: 'left',
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(90deg, #1f5eff, #60a5fa)',
                              borderRadius: 999,
                              transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                            }}
                          />
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.35rem' }}>
                          {progress.completedLessons}/{progress.totalLessons} bài học hoàn thành
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="course-tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`course-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <tab.icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="course-tab-content">
                {activeTab === 'lessons' && (
                  <StudentLessonsTab
                    enrollmentId={enrollmentId!}
                    courseId={enrollment.courseId}
                    enrollmentStatus={enrollment.status}
                  />
                )}
                {activeTab === 'assessments' && (
                  <StudentAssessmentsTab courseId={enrollment.courseId} />
                )}
                {activeTab === 'progress' && (
                  <StudentProgressTab enrollmentId={enrollmentId!} enrollment={enrollment} />
                )}
                {activeTab === 'reviews' && <StudentReviewsTab courseId={enrollment.courseId} />}
              </div>

              {/* ── Enhanced Metadata (Udemy Style) ── */}
              <div className="course-udemy-metadata">
                <CourseLearningPanels
                  whatYouWillLearn={course?.whatYouWillLearn}
                  requirements={course?.requirements}
                  targetAudience={course?.targetAudience}
                />
              </div>

              {/* ── Instructor Section ── */}
              {teacherProfile && (
                <section className="instructor-profile-section">
                  <div className="section-title-alt">
                    <h3>Giảng viên hướng dẫn</h3>
                  </div>
                  <div className="instructor-card-detailed">
                    <div className="instructor-main">
                      <Link
                        to={`/student/instructors/${teacherProfile.userId}`}
                        className="instructor-identity-link"
                      >
                        <div className="instructor-identity">
                          {teacherProfile.avatar ? (
                            <img
                              src={teacherProfile.avatar}
                              alt={teacherProfile.fullName}
                              className="instructor-avatar-large"
                            />
                          ) : (
                            <div className="avatar-placeholder-large">
                              {teacherProfile.fullName.charAt(0)}
                            </div>
                          )}
                          <div className="instructor-info-box">
                            <h4 className="instructor-name">{teacherProfile.fullName}</h4>
                            <p className="instructor-position">
                              {teacherProfile.position || 'Giảng viên chuyên nghiệp'}
                            </p>

                            <div className="instructor-social-links-mini">
                              {teacherProfile.websiteUrl && <Globe size={14} />}
                              {teacherProfile.linkedinUrl && <Linkedin size={14} />}
                              {teacherProfile.youtubeUrl && <Youtube size={14} />}
                              {teacherProfile.facebookUrl && <Facebook size={14} />}
                            </div>

                            <div className="instructor-stats-row">
                              <div className="instructor-stat">
                                <Star size={14} fill="#FBBF24" color="#FBBF24" />
                                <span>{teacherProfile.averageRating.toFixed(1)} Xếp hạng</span>
                              </div>
                              <div className="instructor-stat">
                                <MessageSquare size={14} />
                                <span>{teacherProfile.totalRatings} Đánh giá</span>
                              </div>
                              <div className="instructor-stat">
                                <Users size={14} />
                                <span>{teacherProfile.totalStudents} Học viên</span>
                              </div>
                              <div className="instructor-stat">
                                <PlayCircle size={14} />
                                <span>{teacherProfile.totalCourses} Khóa học</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>

                      {teacherProfile.description && (
                        <div className="instructor-bio">
                          <p>{teacherProfile.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}
              <div style={{ marginTop: '2rem' }}>
                <CourseIncludesList
                  totalVideoHours={course?.totalVideoHours}
                  articlesCount={course?.articlesCount}
                  resourcesCount={course?.resourcesCount}
                />
              </div>
              <div className="course-recommendations-area">
                <CourseRecommendationRow
                  title="Các khóa học liên quan"
                  courses={relatedCourses}
                  loading={loadingRelated}
                />

                <CourseRecommendationRow
                  title={`Khóa học khác của ${teacherProfile?.fullName || 'giảng viên'}`}
                  courses={teacherCourses}
                  loading={loadingTeacherCourses}
                />
              </div>

              <style>{`
                .section-title-alt {
                  margin: 3rem 0 1.5rem;
                  padding-bottom: 0.75rem;
                  border-bottom: 1px solid #e2e8f0;
                }
                .section-title-alt h3 {
                  font-size: 1.5rem;
                  font-weight: 800;
                  color: #1e293b;
                  margin: 0;
                }

                .instructor-card-detailed {
                  background: white;
                  border-radius: 20px;
                  border: 1px solid #e2e8f0;
                  padding: 2rem;
                  margin-bottom: 3rem;
                }

                .instructor-identity {
                  display: flex;
                  gap: 1.5rem;
                  align-items: center;
                  margin-bottom: 1.5rem;
                }

                .instructor-avatar-large, .avatar-placeholder-large {
                  width: 100px;
                  height: 100px;
                  border-radius: 20px;
                  object-fit: cover;
                  flex-shrink: 0;
                }

                .avatar-placeholder-large {
                  background: #f1f5f9;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 2.5rem;
                  font-weight: 800;
                  color: #4f46e5;
                }

                .instructor-name {
                  font-size: 1.25rem;
                  font-weight: 700;
                  color: #1e293b;
                  margin: 0 0 0.25rem;
                }

                .instructor-position {
                  font-size: 0.95rem;
                  color: #64748b;
                  margin: 0 0 1rem;
                }

                .instructor-stats-row {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 1.25rem;
                  margin-top: 1rem;
                }

                .instructor-stat {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  font-size: 0.85rem;
                  font-weight: 600;
                  color: #475569;
                }

                .instructor-bio {
                  color: #334155;
                  line-height: 1.7;
                  font-size: 0.95rem;
                  padding-top: 1.5rem;
                  border-top: 1px solid #f1f5f9;
                }

                .instructor-bio p {
                  margin: 0;
                  white-space: pre-wrap;
                }

                .instructor-identity-link {
                   text-decoration: none;
                   color: inherit;
                   display: block;
                 }

                 .instructor-identity-link:hover .instructor-name {
                   color: #4f46e5;
                 }

                 .instructor-social-links-mini {
                   display: flex;
                   gap: 8px;
                   color: #94a3b8;
                   margin-top: 4px;
                 }

                 .course-udemy-metadata {
                   margin: 2rem 0;
                 }

                 .metadata-section {
                   background: white;
                   border-radius: 16px;
                   border: 1px solid #e2e8f0;
                   padding: 1.5rem;
                   margin-bottom: 1.5rem;
                 }

                 .section-title-premium-small {
                   font-size: 1.15rem;
                   font-weight: 800;
                   margin-bottom: 1rem;
                   color: #1e293b;
                 }

                 .objectives-list {
                   display: grid;
                   grid-template-columns: repeat(auto-fill, minmax(45%, 1fr));
                   gap: 0.75rem;
                 }

                 .objective-item {
                   display: flex;
                   gap: 8px;
                   font-size: 0.95rem;
                   color: #475569;
                 }

                 .objective-item .item-icon {
                   color: #10b981;
                   flex-shrink: 0;
                 }

                 .simple-list-premium {
                   margin: 0;
                   padding-left: 1.25rem;
                   color: #475569;
                   font-size: 0.95rem;
                 }

                 .simple-list-premium li {
                   margin-bottom: 0.5rem;
                 }

                @media (max-width: 640px) {
                  .instructor-identity { flex-direction: column; text-align: center; }
                  .instructor-stats-row { justify-content: center; }
                }
              `}</style>
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StudentCourseDetail;
