import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Star,
  Users,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CourseBreadcrumb } from '../../components/course/CourseBreadcrumb';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import {
  useApproveCourseReview,
  useCourseDetail,
  useCourseStudents,
  useRejectCourseReview,
} from '../../hooks/useCourses';
import '../../styles/module-refactor.css';
import '../courses/TeacherCourseDetail.css';
import '../courses/TeacherCourses.css';
import '../courses/tabs/CourseOverviewTab.css';
import '../courses/tabs/course-detail-tabs.css';

// Import tab components
import CourseAssessmentsTab from '../courses/tabs/CourseAssessmentsTab.tsx';
import CourseLessonsTab from '../courses/tabs/CourseLessonsTab.tsx';
import CourseOverviewTab from '../courses/tabs/CourseOverviewTab.tsx';
import CourseReviewsTab from '../courses/tabs/CourseReviewsTab.tsx';
import CourseStudentsTab from '../courses/tabs/CourseStudentsTab.tsx';

type TabType = 'overview' | 'lessons' | 'assessments' | 'students' | 'reviews';

/** Loading overlay */
const CourseDetailLoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
  <div className="course-math-loading-overlay" role="dialog" aria-modal="true">
    <div className="course-math-loading-popup" role="status" aria-live="polite">
      <div className="course-math-loader-ring" aria-hidden="true" />
      <p className="course-math-loading-kicker">Admin Console</p>
      <p className="course-math-loading-text">{message}</p>
    </div>
  </div>
);

const AdminCourseReviewDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'overview';

  const { data: courseData, isLoading: loadingCourse, refetch } = useCourseDetail(courseId!);
  const { data: studentsData } = useCourseStudents(courseId!);
  const approveMutation = useApproveCourseReview();
  const rejectMutation = useRejectCourseReview();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const course = courseData?.result;
  const students = studentsData?.result?.content ?? [];

  const loadingMessage = loadingCourse
    ? 'Đang tải thông tin khóa học...'
    : approveMutation.isPending
      ? 'Đang duyệt khóa học...'
      : rejectMutation.isPending
        ? 'Đang từ chối khóa học...'
        : '';
  const showLoadingPopup = Boolean(loadingMessage);

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  const handleApprove = () => {
    if (!course) return;
    approveMutation.mutate(course.id, {
      onSuccess: () => {
        showToast({ type: 'success', message: 'Đã duyệt và xuất bản khóa học.' });
        refetch();
        // Optionally redirect back to review list
        setTimeout(() => {
          window.close(); // Close the tab if opened in new tab
        }, 1500);
      },
      onError: (err: unknown) => {
        showToast({
          type: 'error',
          message: err instanceof Error ? err.message : 'Không thể duyệt khóa học.',
        });
      },
    });
  };

  const handleReject = () => {
    if (!course) return;
    const reason = rejectReason.trim();
    if (!reason) {
      showToast({ type: 'error', message: 'Vui lòng nhập lý do từ chối.' });
      return;
    }
    rejectMutation.mutate(
      { courseId: course.id, data: { reason } },
      {
        onSuccess: () => {
          showToast({ type: 'success', message: 'Đã từ chối khóa học.' });
          setShowRejectModal(false);
          setRejectReason('');
          refetch();
          // Optionally redirect back to review list
          setTimeout(() => {
            window.close(); // Close the tab if opened in new tab
          }, 1500);
        },
        onError: (err: unknown) => {
          showToast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Không thể từ chối khóa học.',
          });
        },
      }
    );
  };

  if (loadingCourse) {
    return (
      <DashboardLayout
        role="admin"
        user={{ name: 'Admin', avatar: '', role: 'admin' }}
        contentClassName="dashboard-content--flush-bleed dashboard-content--course-detail-parchment"
      >
        <CourseDetailLoadingOverlay message={loadingMessage} />
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout
        role="admin"
        user={{ name: 'Admin', avatar: '', role: 'admin' }}
        contentClassName="dashboard-content--flush-bleed dashboard-content--course-detail-parchment"
      >
        <div className="module-layout-container">
          <section className="module-page module-page--bleed" lang="vi">
            <div className="empty">
              <AlertCircle size={32} style={{ marginBottom: 8, color: '#ef4444' }} />
              <p>Không tìm thấy khóa học</p>
              <button className="btn secondary" onClick={() => navigate('/admin/courses/review')}>
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
    { id: 'overview' as const, label: 'Tổng quan', icon: BookOpen },
    { id: 'lessons' as const, label: 'Bài học', icon: FileText, count: course.lessonsCount },
    { id: 'assessments' as const, label: 'Bài đánh giá', icon: CheckCircle2 },
    { id: 'students' as const, label: 'Học viên', icon: Users, count: students.length },
    { id: 'reviews' as const, label: 'Đánh giá', icon: Star },
  ];

  const isPendingReview = course.status === 'PENDING_REVIEW';

  return (
    <DashboardLayout
      role="admin"
      user={{ name: 'Admin', avatar: '', role: 'admin' }}
      contentClassName="dashboard-content--flush-bleed dashboard-content--course-detail-parchment"
    >
      <div className="module-layout-container">
        <section className="module-page module-page--bleed" lang="vi">
          {/* Breadcrumb */}
          <CourseBreadcrumb
            homePath="/admin/courses/review"
            items={[{ label: 'Duyệt khóa học' }, { label: course.title }]}
            courseTitle={course.title}
          />

          {/* Course Header */}
          <div className="course-detail-header">
            <div className="course-header-main">
              <button
                className="btn secondary btn-sm"
                onClick={() => navigate('/admin/courses/review')}
              >
                <ArrowLeft size={14} />
                Quay lại
              </button>

              <div className="course-header-info">
                <div className="course-header-title-row">
                  <h1 className="course-detail-title" lang="vi">
                    {course.title}
                  </h1>
                  <span
                    className={`course-badge ${
                      course.status === 'PENDING_REVIEW'
                        ? 'badge-review'
                        : course.status === 'PUBLISHED'
                          ? 'badge-live'
                          : course.status === 'REJECTED'
                            ? 'badge-rejected'
                            : 'badge-draft'
                    }`}
                  >
                    {course.status === 'PENDING_REVIEW' ? (
                      <>
                        <CheckCircle2 size={11} /> Chờ duyệt
                      </>
                    ) : course.status === 'REJECTED' ? (
                      <>
                        <AlertCircle size={11} /> Bị từ chối
                      </>
                    ) : course.published ? (
                      <>
                        <Eye size={11} /> Công khai
                      </>
                    ) : (
                      <>
                        <EyeOff size={11} /> Nháp
                      </>
                    )}
                  </span>
                </div>

                <div className="course-header-meta">
                  <span className="meta-item">
                    <GraduationCap size={14} />
                    {course.subjectName} • Khối {course.gradeLevel}
                  </span>
                  <span className="meta-separator">•</span>
                  <span className="meta-item">
                    <BookOpen size={14} />
                    {course.lessonsCount} bài học
                  </span>
                  <span className="meta-separator">•</span>
                  <span className="meta-item">
                    <Users size={14} />
                    {course.studentsCount} học viên
                  </span>
                  <span className="meta-separator">•</span>
                  <span className="meta-item">Giảng viên: {course.teacherName ?? '—'}</span>
                </div>

                {course.description && (
                  <p className="course-header-description">{course.description}</p>
                )}

                {/* Audit Trail for Approved Courses */}
                {course.status === 'PUBLISHED' && course.approvedBy && (
                  <div
                    className="course-audit-trail"
                    style={{
                      color: '#065f46',
                      backgroundColor: '#ecfdf5',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      marginTop: '0.5rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    <strong>✓ Đã duyệt bởi:</strong> {course.approvedBy}
                    {course.approvedAt && (
                      <>
                        <br />
                        <strong>Thời gian:</strong>{' '}
                        {new Date(course.approvedAt).toLocaleString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </>
                    )}
                  </div>
                )}

                {/* Rejection Info */}
                {course.status === 'REJECTED' && (
                  <>
                    {course.rejectionReason && (
                      <div
                        className="course-header-description"
                        style={{
                          color: '#b42318',
                          backgroundColor: '#fef3f2',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          marginTop: '0.5rem',
                        }}
                      >
                        <strong>Lý do từ chối:</strong> {course.rejectionReason}
                      </div>
                    )}
                    {course.rejectedBy && (
                      <div
                        className="course-audit-trail"
                        style={{
                          color: '#991b1b',
                          backgroundColor: '#fef2f2',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          marginTop: '0.5rem',
                          fontSize: '0.875rem',
                        }}
                      >
                        <strong>✗ Bị từ chối bởi:</strong> {course.rejectedBy}
                        {course.rejectedAt && (
                          <>
                            <br />
                            <strong>Thời gian:</strong>{' '}
                            {new Date(course.rejectedAt).toLocaleString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Admin Actions */}
            {isPendingReview && (
              <div className="course-header-actions">
                <button
                  className="btn btn--feat-emerald"
                  onClick={handleApprove}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <CheckCircle2 size={14} />
                  {approveMutation.isPending ? 'Đang duyệt...' : 'Duyệt khóa học'}
                </button>
                <button
                  className="btn danger"
                  onClick={() => {
                    setShowRejectModal(true);
                    setRejectReason('');
                  }}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <XCircle size={14} />
                  Từ chối
                </button>
              </div>
            )}
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
                {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
              </button>
            ))}
          </div>

          {/* Tab Content - Read-only mode */}
          <div className="course-tab-content">
            {activeTab === 'overview' && <CourseOverviewTab course={course} />}
            {activeTab === 'lessons' && <CourseLessonsTab courseId={course.id} course={course} />}
            {activeTab === 'assessments' && (
              <CourseAssessmentsTab courseId={course.id} course={course} />
            )}
            {activeTab === 'students' && <CourseStudentsTab courseId={course.id} />}
            {activeTab === 'reviews' && <CourseReviewsTab courseId={course.id} />}
          </div>
        </section>
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            className="course-review-modal-root"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <button
              type="button"
              className="course-review-modal-backdrop"
              aria-label="Đóng"
              onClick={() => setShowRejectModal(false)}
            />
            <div
              className="course-review-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="course-review-reject-title"
            >
              <h2 id="course-review-reject-title">Từ chối khóa học</h2>
              <p>Nhập lý do để giáo viên chỉnh sửa và gửi lại.</p>
              <textarea
                className="textarea course-review-modal__textarea"
                rows={5}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Nội dung khóa học chưa đủ rõ ràng ở phần mục tiêu học tập..."
              />
              <div className="course-review-modal__actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn danger"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showLoadingPopup && <CourseDetailLoadingOverlay message={loadingMessage} />}
    </DashboardLayout>
  );
};

export default AdminCourseReviewDetail;
