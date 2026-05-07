import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Facebook,
  FileText,
  Globe,
  Linkedin,
  MessageSquare,
  PlayCircle,
  Sparkles,
  Star,
  Users,
  Youtube,
} from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CourseBreadcrumb } from '../../components/course/CourseBreadcrumb';
import { CourseIncludesList } from '../../components/course/CourseIncludesList';
import { CourseLearningPanels } from '../../components/course/CourseLearningPanels';
import CourseRecommendationRow from '../../components/course/CourseRecommendationRow';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { UI_TEXT } from '../../constants/uiText';
import {
  useCourseDetail,
  useCourseProgress,
  useCourseStudents,
  useInstructorCourses,
  useMyEnrollments,
  useRelatedCourses,
  useTeacherProfile,
} from '../../hooks/useCourses';
import { useMyAssessmentsByCourse } from '../../hooks/useStudentAssessment';
import '../../styles/module-refactor.css';
import './StudentCourses.css';
import './tabs/CourseOverviewTab.css';
import './tabs/course-detail-tabs.css';
import CourseOverviewTab from './tabs/CourseOverviewTab.tsx';
import CourseStudentsTab from './tabs/CourseStudentsTab.tsx';
// Import tab components
import StudentAssessmentsTab from './student-tabs/StudentAssessmentsTab';
import StudentLessonsTab from './student-tabs/StudentLessonsTab';
import StudentProgressTab from './student-tabs/StudentProgressTab';
import StudentReviewsTab from './student-tabs/StudentReviewsTab';

type TabType = 'overview' | 'lessons' | 'assessments' | 'students' | 'reviews';

const VALID_TABS = new Set<TabType>(['overview', 'lessons', 'assessments', 'students', 'reviews']);

function normalizeStudentCourseTab(raw: string | null): TabType {
  if (!raw || raw === 'progress') return 'overview';
  return VALID_TABS.has(raw as TabType) ? (raw as TabType) : 'overview';
}

const coverGradients = [
  'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
  'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
  'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
] as const;

const levelMap: Record<string, { label: string; color: string }> = {
  BEGINNER: { label: 'Cơ bản', color: '#10b981' },
  INTERMEDIATE: { label: 'Trung bình', color: '#f59e0b' },
  ADVANCED: { label: 'Nâng cao', color: '#ef4444' },
  ALL_LEVELS: { label: 'Mọi cấp độ', color: '#6366f1' },
};

const secondaryBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors shadow-sm';

const StudentCourseDetail: React.FC = () => {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: enrollmentsData } = useMyEnrollments();
  const enrollments = enrollmentsData?.result ?? [];
  const enrollment = enrollments.find((e) => e.id === enrollmentId);
  const enrollmentIndex = enrollments.findIndex((e) => e.id === enrollmentId);

  const courseIdForQueries = enrollment?.courseId ?? '';

  const { data: courseData } = useCourseDetail(courseIdForQueries);
  const { data: progressData } = useCourseProgress(enrollmentId ?? '');
  const { data: assessmentsMeta } = useMyAssessmentsByCourse(
    courseIdForQueries,
    { page: 0, size: 1, sortBy: 'dueDate', sortDir: 'ASC' },
    { enabled: !!courseIdForQueries }
  );
  const { data: studentsData } = useCourseStudents(courseIdForQueries);

  const course = courseData?.result;
  const progress = progressData?.result;

  const activeTab = normalizeStudentCourseTab(searchParams.get('tab'));

  useEffect(() => {
    const raw = searchParams.get('tab');
    if (!raw) return;
    if (raw === 'progress' || !VALID_TABS.has(raw as TabType)) {
      setSearchParams({ tab: 'overview' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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

  const assessmentsTotal = assessmentsMeta?.result?.totalElements ?? 0;
  const studentsTotal =
    studentsData?.result?.totalElements ?? course?.studentsCount ?? 0;
  const lessonsCountBadge = course?.lessonsCount ?? 0;
  const reviewsCountBadge = course?.ratingCount ?? 0;

  const tabsConfig = [
    { id: 'overview' as const, label: 'Tổng quan', icon: BookOpen },
    {
      id: 'lessons' as const,
      label: 'Bài học',
      icon: FileText,
      count: lessonsCountBadge,
    },
    {
      id: 'assessments' as const,
      label: UI_TEXT.QUIZ,
      icon: CheckCircle2,
      count: assessmentsTotal,
    },
    {
      id: 'students' as const,
      label: 'Học viên',
      icon: Users,
      count: studentsTotal,
    },
    {
      id: 'reviews' as const,
      label: 'Đánh giá',
      icon: Star,
      count: reviewsCountBadge,
    },
  ];

  if (!enrollment) {
    return (
      <DashboardLayout
        role="student"
        user={{ name: 'Học sinh', avatar: '', role: 'student' }}
        contentClassName="dashboard-content--flush-bleed"
      >
        <div className="px-6 py-16 lg:px-8 flex justify-center">
          <div className="max-w-md w-full rounded-2xl border border-[#E8E6DC] bg-white p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#F5F4ED] text-[#87867F] flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7" />
            </div>
            <h2 className="font-[Playfair_Display] text-xl font-medium text-[#141413] mb-2">
              Không tìm thấy thông tin đăng ký
            </h2>
            <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mb-6">
              Khóa học có thể đã bị gỡ hoặc liên kết không hợp lệ.
            </p>
            <button type="button" className={secondaryBtn} onClick={() => navigate('/student/courses')}>
              <ArrowLeft size={16} strokeWidth={2} />
              Quay lại danh sách
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const coverIdx = enrollmentIndex >= 0 ? enrollmentIndex : 0;

  return (
    <DashboardLayout
      role="student"
      user={{ name: 'Học sinh', avatar: '', role: 'student' }}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="w-full min-w-0 max-w-none px-4 sm:px-6 lg:px-8 py-8 pb-12 box-border">
        <div className="w-full min-w-0 max-w-none space-y-6">
          <div className="w-full border-b border-[#E8E6DC]/80 bg-[#FAF9F5]/80 px-4 py-3">
            <CourseBreadcrumb
              homePath="/student/courses"
              items={[{ label: enrollment.courseTitle ?? UI_TEXT.COURSE }]}
              courseTitle={enrollment.courseTitle ?? UI_TEXT.COURSE}
            />
          </div>

          <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-[#E8E6DC] bg-white shadow-[0_2px_24px_rgba(20,20,19,0.06)] overflow-hidden"
          >
            <div
              className="h-1 w-full bg-gradient-to-r from-[#C96442] via-[#E07B39] to-[#6366F1]"
              aria-hidden
            />
            <div className="p-6 md:p-8 space-y-6">
              <button
                type="button"
                className={secondaryBtn}
                onClick={() => navigate('/student/courses')}
              >
                <ArrowLeft size={16} strokeWidth={2} />
                Quay lại danh sách
              </button>

              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                <div className="w-full max-w-[260px] mx-auto lg:mx-0 flex-shrink-0">
                  <div
                    className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#E8E6DC] shadow-sm"
                    style={{ background: coverGradients[coverIdx % coverGradients.length] }}
                  >
                    {course?.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={enrollment.courseTitle ?? 'Course thumbnail'}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : null}
                    <div
                      className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[rgba(20,20,19,0.55)] to-transparent"
                      aria-hidden
                    />
                    <p className="absolute bottom-3 left-3 right-3 font-[Be_Vietnam_Pro] text-[12px] font-semibold text-white drop-shadow-sm line-clamp-2">
                      {enrollment.courseTitle}
                    </p>
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-4">
                  <h1 className="font-[Playfair_Display] text-[clamp(1.35rem,3vw,1.85rem)] font-medium text-[#141413] leading-snug tracking-tight">
                    {enrollment.courseTitle}
                  </h1>
                  {course?.subtitle ? (
                    <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#5E5D59] leading-relaxed">
                      {course.subtitle}
                    </p>
                  ) : null}
                  {teacherProfile ? (
                    <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
                      Giảng viên:{' '}
                      <Link
                        to={`/student/instructors/${teacherProfile.userId}`}
                        className="font-semibold text-[#4338CA] hover:text-[#3730A3]"
                      >
                        {teacherProfile.fullName}
                      </Link>
                    </p>
                  ) : null}

                  {course ? (
                    <div className="flex flex-wrap gap-2">
                      {course.provider === 'MINISTRY' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-[#EEF2FF] px-3 py-1.5 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#1e3a8a]">
                          <BookOpen size={12} strokeWidth={2} /> Chuẩn Bộ GD&ĐT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-amber-950">
                          <Sparkles size={12} strokeWidth={2} /> Khóa học mở rộng
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide ${
                          enrollment.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                            : 'bg-[#F5F4ED] text-[#5E5D59] border-[#E8E6DC]'
                        }`}
                      >
                        {enrollment.status === 'ACTIVE' ? 'Đang học' : 'Đã hủy'}
                      </span>
                      {course.level ? (
                        <span className="inline-flex items-center rounded-full border border-[#E8E6DC] bg-[#FAF9F5] px-3 py-1.5 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#5E5D59]">
                          {levelMap[course.level]?.label ?? 'Mọi cấp độ'}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {course ? (
                    <div className="flex flex-wrap gap-2">
                      {course.provider === 'MINISTRY' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF9F5] border border-[#E8E6DC] px-3 py-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#5E5D59]">
                          <BookOpen size={14} className="text-[#87867F]" />
                          {course.subjectName} · Lớp {course.gradeLevel}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF9F5] border border-[#E8E6DC] px-3 py-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#5E5D59]">
                        <Users size={14} className="text-[#87867F]" />
                        {course.studentsCount} học viên
                      </span>
                      {course.language ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF9F5] border border-[#E8E6DC] px-3 py-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#5E5D59]">
                          <Globe size={14} className="text-[#87867F]" />
                          {course.language}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF9F5] border border-[#E8E6DC] px-3 py-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#5E5D59]">
                        <FileText size={14} className="text-[#87867F]" />
                        {course.lessonsCount} bài học
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF7ED] border border-[#FDE68A] px-3 py-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#92400E]">
                        <Star size={14} className="text-amber-500" fill="#FBBF24" color="#FBBF24" />
                        <strong>{course.rating || 0}</strong>
                        <span className="text-[#87867F] font-normal">
                          ({course.ratingCount || 0} đánh giá)
                        </span>
                      </span>
                    </div>
                  ) : null}

                  {progress ? (
                    <div className="rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] px-4 py-3">
                      <div className="flex justify-between font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59] mb-2">
                        <span>Tiến độ của bạn</span>
                        <strong className="text-[#C96442] tabular-nums">
                          {progress.completionRate.toFixed(1)}%
                        </strong>
                      </div>
                      <div className="h-2 rounded-full bg-[#E8E6DC] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#C96442] to-[#E07B39] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                          style={{
                            width: `${Math.min(100, Math.max(0, progress.completionRate))}%`,
                          }}
                        />
                      </div>
                      <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-2">
                        {progress.completedLessons}/{progress.totalLessons} bài học hoàn thành
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.article>

          <div className="rounded-2xl border border-[#E8E6DC] bg-white overflow-hidden shadow-sm">
            <div
              className="flex flex-wrap gap-1 p-2 bg-[#F5F4ED] border-b border-[#E8E6DC]"
              role="tablist"
              aria-label="Nội dung khóa học"
            >
              {tabsConfig.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 ${
                      active
                        ? 'bg-white text-[#141413] shadow-sm ring-1 ring-black/[0.04]'
                        : 'text-[#87867F] hover:text-[#5E5D59] hover:bg-white/60'
                    }`}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <tab.icon size={15} strokeWidth={2} />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[10px] font-bold ${
                          active ? 'bg-[#C96442] text-white' : 'bg-[#E8E6DC] text-[#5E5D59]'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-5 md:p-7 bg-[#F5F4ED]/90 min-h-[200px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  role="tabpanel"
                  data-student-course-tab-panel
                  className="min-w-0 w-full overflow-x-auto"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  {activeTab === 'overview' && (
                    <div className="space-y-5 min-w-0">
                      {!course ? (
                        <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] py-6 text-center rounded-xl border border-dashed border-[#E8E6DC] bg-white/60">
                          Đang tải thông tin khóa học...
                        </p>
                      ) : (
                        <>
                          <StudentProgressTab enrollmentId={enrollmentId!} enrollment={enrollment} />
                          <CourseOverviewTab course={course} />
                        </>
                      )}
                    </div>
                  )}
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
                  {activeTab === 'students' && (
                    <CourseStudentsTab courseId={enrollment.courseId} />
                  )}
                  {activeTab === 'reviews' && <StudentReviewsTab courseId={enrollment.courseId} />}
                </motion.div>
              </AnimatePresence>
            </div>
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentCourseDetail;
