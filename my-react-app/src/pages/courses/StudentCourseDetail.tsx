import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { CourseBreadcrumb } from '../../components/course/CourseBreadcrumb';
import {
  useCourseProgress,
  useDropEnrollment,
  useMyEnrollments,
  useCourseDetail,
} from '../../hooks/useCourses';
import '../../styles/module-refactor.css';
import './StudentCourses.css';
import './TeacherCourses.css';

// Import tab components
import StudentLessonsTab from './student-tabs/StudentLessonsTab';
import StudentAssessmentsTab from './student-tabs/StudentAssessmentsTab';
import StudentProgressTab from './student-tabs/StudentProgressTab';

type TabType = 'lessons' | 'assessments' | 'progress';

const coverGradients = [
  'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
  'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
  'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
] as const;

const coverAccents = ['#1d4ed8', '#0f766e', '#047857', '#c2410c', '#be185d', '#6d28d9'] as const;

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
  const dropMutation = useDropEnrollment();

  const course = courseData?.result;
  const progress = progressData?.result;

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  const handleDrop = () => {
    if (window.confirm('Bạn có chắc muốn hủy đăng ký khóa học này?')) {
      dropMutation.mutate(enrollmentId!, {
        onSuccess: () => navigate('/student/courses'),
      });
    }
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
                    <span
                      className={`course-badge ${enrollment.status === 'ACTIVE' ? 'badge-live' : 'badge-draft'}`}
                      style={{ marginBottom: '0.75rem' }}
                    >
                      {enrollment.status === 'ACTIVE' ? 'Đang học' : 'Đã hủy'}
                    </span>

                    {course && (
                      <div className="course-header-meta" style={{ marginTop: '0.5rem' }}>
                        <span className="meta-item">
                          <BookOpen size={14} />
                          {course.subjectName} • Khối {course.gradeLevel}
                        </span>
                        <span className="meta-separator">•</span>
                        <span className="meta-item">
                          <FileText size={14} />
                          {course.lessonsCount} bài học
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
                              width: `${progress.completionRate}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #1f5eff, #60a5fa)',
                              borderRadius: 999,
                              transition: 'width 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                            }}
                          />
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.35rem' }}>
                          {progress.completedLessons}/{progress.totalLessons} bài học hoàn thành
                        </p>
                      </div>
                    )}

                    <button
                      className="btn danger"
                      style={{ marginTop: '0.75rem' }}
                      onClick={handleDrop}
                      disabled={dropMutation.isPending || enrollment.status !== 'ACTIVE'}
                      title={enrollment.status !== 'ACTIVE' ? 'Khóa học đã hủy' : undefined}
                    >
                      {dropMutation.isPending ? 'Đang hủy...' : 'Hủy đăng ký'}
                    </button>
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
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StudentCourseDetail;
