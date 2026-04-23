import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Pencil,
  Trash2,
  Users,
  Star,
  X,
  Save,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import { CourseBreadcrumb } from '../../components/course/CourseBreadcrumb';
import {
  useCourseDetail,
  useDeleteCourse,
  usePublishCourse,
  useSubmitCourseForReview,
  useCourseStudents,
  useUpdateCourse,
} from '../../hooks/useCourses';
import '../../styles/module-refactor.css';
import './TeacherCourses.css';
import './TeacherCourseDetail.css';
import type { UpdateCourseRequest, CourseLevel } from '../../types';

// Import tab components
import CourseOverviewTab from './tabs/CourseOverviewTab.tsx';
import CourseLessonsTab from './tabs/CourseLessonsTab.tsx';
import CourseAssessmentsTab from './tabs/CourseAssessmentsTab.tsx';
import CourseReviewsTab from './tabs/CourseReviewsTab.tsx';
import CourseStudentsTab from './tabs/CourseStudentsTab.tsx';

type TabType = 'overview' | 'lessons' | 'assessments' | 'students' | 'reviews';

const TeacherCourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'overview';

  const { data: courseData, isLoading: loadingCourse } = useCourseDetail(courseId!);
  const { data: studentsData } = useCourseStudents(courseId!);
  const deleteMutation = useDeleteCourse();
  const publishMutation = usePublishCourse();
  const submitReviewMutation = useSubmitCourseForReview();
  const updateMutation = useUpdateCourse();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editStep, setEditStep] = useState(1);
  const [editForm, setEditForm] = useState<UpdateCourseRequest>({
    whatYouWillLearn: '',
    requirements: '',
    targetAudience: '',
    originalPrice: 0,
    discountedPrice: 0,
    discountExpiryDate: '',
    level: 'ALL_LEVELS' as CourseLevel,
  });
  const [discountPercent, setDiscountPercent] = useState(0);

  const course = courseData?.result;
  const students = studentsData?.result?.content ?? [];

  useEffect(() => {
    if (course) {
      setEditForm({
        title: course.title || '',
        description: course.description || '',
        subtitle: course.subtitle || '',
        language: course.language || '',
        whatYouWillLearn: course.whatYouWillLearn || '',
        requirements: course.requirements || '',
        targetAudience: course.targetAudience || '',
        originalPrice: course.originalPrice || 0,
        discountedPrice: course.discountedPrice || 0,
        discountExpiryDate: course.discountExpiryDate || '',
        level: (course.level as CourseLevel) || 'ALL_LEVELS',
      });
      if (course.originalPrice && course.discountedPrice) {
        setDiscountPercent(
          Math.round(((course.originalPrice - course.discountedPrice) / course.originalPrice) * 100)
        );
      }
    }
  }, [course]);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    updateMutation.mutate(
      { courseId: course.id, data: editForm },
      {
        onSuccess: () => setShowEditModal(false),
      }
    );
  };

  const handlePriceChange = (original: number, percent: number) => {
    const discounted = Math.round(original * (1 - percent / 100));
    setEditForm({ ...editForm, originalPrice: original, discountedPrice: discounted });
    setDiscountPercent(percent);
  };

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  const handleTogglePublish = () => {
    if (!course) return;
    publishMutation.mutate({
      courseId: course.id,
      data: { published: !course.published },
    });
  };

  const handleSubmitForReview = () => {
    if (!course) return;
    submitReviewMutation.mutate(course.id, {
      onSuccess: () => {
        showToast({ type: 'success', message: 'Đã gửi khóa học lên hàng chờ duyệt.' });
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Không thể gửi duyệt khóa học.';
        showToast({ type: 'error', message: msg });
      },
    });
  };

  const handleDelete = () => {
    if (!course) return;
    if (
      window.confirm(
        `Bạn có chắc muốn xóa giáo trình "${course.title}"? Hành động này không thể hoàn tác.`
      )
    ) {
      deleteMutation.mutate(course.id, {
        onSuccess: () => navigate('/teacher/courses'),
      });
    }
  };

  if (loadingCourse) {
    return (
      <DashboardLayout
        role="teacher"
        user={{ name: 'Giáo viên', avatar: '', role: 'teacher' }}
        contentClassName="dashboard-content--flush-bleed"
      >
        <div className="module-layout-container">
          <section className="module-page module-page--bleed">
            <div className="course-detail-loading" aria-live="polite" aria-busy="true">
              <div className="course-detail-loading__header" />
              <div className="course-detail-loading__meta" />
              <div className="course-detail-loading__meta course-detail-loading__meta--short" />
              <div className="course-detail-loading__tabs">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="course-detail-loading__panel" />
            </div>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout
        role="teacher"
        user={{ name: 'Giáo viên', avatar: '', role: 'teacher' }}
        contentClassName="dashboard-content--flush-bleed"
      >
        <div className="module-layout-container">
          <section className="module-page module-page--bleed">
            <div className="empty">
              <AlertCircle size={32} style={{ marginBottom: 8, color: '#ef4444' }} />
              <p>Không tìm thấy giáo trình</p>
              <button className="btn secondary" onClick={() => navigate('/teacher/courses')}>
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

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Giáo viên', avatar: '', role: 'teacher' }}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container">
        <section className="module-page module-page--bleed">
          {/* Breadcrumb */}
          <CourseBreadcrumb
            homePath="/teacher/courses"
            items={[{ label: course.title }]}
            courseTitle={course.title}
          />

          {/* Course Header */}
          <div className="course-detail-header">
            <div className="course-header-main">
              <button className="btn secondary btn-sm" onClick={() => navigate('/teacher/courses')}>
                <ArrowLeft size={14} />
                Quay lại
              </button>

              <div className="course-header-info">
                <div className="course-header-title-row">
                  <h1 className="course-detail-title">{course.title}</h1>
                  <span
                    className={`course-badge ${course.published ? 'badge-live' : 'badge-draft'}`}
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
                </div>

                {course.description && (
                  <p className="course-header-description">{course.description}</p>
                )}

                {course.status === 'REJECTED' && course.rejectionReason && (
                  <p className="course-header-description" style={{ color: '#b42318' }}>
                    Lý do từ chối: {course.rejectionReason}
                  </p>
                )}
              </div>
            </div>

            <div className="course-header-actions">
              {!course.published && course.status !== 'PENDING_REVIEW' && (
                <button
                  className="btn secondary"
                  onClick={handleSubmitForReview}
                  disabled={submitReviewMutation.isPending}
                >
                  <CheckCircle2 size={14} />
                  {submitReviewMutation.isPending ? 'Đang gửi...' : 'Gửi duyệt'}
                </button>
              )}
              <button
                className="btn secondary"
                onClick={() => setShowEditModal(true)}
                title="Chỉnh sửa thông tin giáo trình"
              >
                <Pencil size={14} />
                Chỉnh sửa
              </button>
              <button
                className={`btn ${course.published ? 'secondary' : ''}`}
                onClick={handleTogglePublish}
                disabled={
                  publishMutation.isPending || (!course.published && course.status !== 'PUBLISHED')
                }
                title={
                  !course.published && course.status !== 'PUBLISHED'
                    ? 'Khóa học cần được admin duyệt trước khi công khai'
                    : undefined
                }
              >
                {course.published ? (
                  <>
                    <EyeOff size={14} />
                    Ẩn giáo trình
                  </>
                ) : (
                  <>
                    <Eye size={14} />
                    Công khai
                  </>
                )}
              </button>
              <button
                className="btn danger"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 size={14} />
                Xóa
              </button>
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
                {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
              </button>
            ))}
          </div>

          {/* Tab Content */}
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <button
            type="button"
            className="modal-backdrop"
            onClick={() => setShowEditModal(false)}
          />
          <div className="modal-box wizard-modal-box">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-icon">
                  <Pencil size={18} />
                </div>
                <div>
                  <h2>Chỉnh sửa giáo trình</h2>
                  <p>Bước {editStep} trên 4</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowEditModal(false)}
                aria-label="Đóng"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="wizard-steps-indicator">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`wizard-step-item ${editStep === i ? 'active' : ''} ${editStep > i ? 'completed' : ''}`}
                >
                  <div className="wizard-step-circle">{editStep > i ? <Check size={18} /> : i}</div>
                  <span className="wizard-step-label">
                    {i === 1
                      ? 'Phân loại'
                      : i === 2
                        ? 'Chi tiết'
                        : i === 3
                          ? 'Tiếp thị'
                          : 'Định giá'}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="modal-form">
              <div className="wizard-content-wrapper">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={editStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="wizard-step-content"
                  >
                    {editStep === 1 && (
                      <div className="edit-step-1">
                        <div className="form-section-header">
                          <h3>Thông tin cơ bản</h3>
                          <p>Cập nhật lại tiêu đề và mục tiêu chính của giáo trình.</p>
                        </div>

                        <div className="form-group full-width" style={{ marginBottom: '1.25rem' }}>
                          <label className="form-label">Tiêu đề giáo trình</label>
                          <input
                            type="text"
                            className="form-input"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          />
                        </div>

                        <div className="form-group full-width">
                          <label className="form-label">Phụ đề (Catchy subtitle)</label>
                          <input
                            type="text"
                            className="form-input"
                            value={editForm.subtitle}
                            onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                            placeholder="Câu ngắn gọn thu hút học viên"
                          />
                        </div>
                      </div>
                    )}

                    {editStep === 2 && (
                      <div className="edit-step-2">
                        <div className="form-section-header">
                          <h3>Chi tiết nội dung</h3>
                          <p>Cập nhật ngôn ngữ và mô tả tổng quan của khóa học.</p>
                        </div>

                        <div className="form-group full-width" style={{ marginBottom: '1.25rem' }}>
                          <label className="form-label">Ngôn ngữ</label>
                          <input
                            type="text"
                            className="form-input"
                            value={editForm.language}
                            onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                            placeholder="Ví dụ: Tiếng Việt"
                          />
                        </div>

                        <div className="form-group full-width" style={{ marginBottom: '1.25rem' }}>
                          <label className="form-label">Mô tả tổng quát</label>
                          <textarea
                            rows={5}
                            className="form-input form-textarea"
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({ ...editForm, description: e.target.value })
                            }
                            placeholder="Mô tả chi tiết về khóa học..."
                          />
                        </div>

                        <div className="form-group full-width">
                          <label className="form-label">Cấp độ học</label>
                          <select
                            className="form-select"
                            value={editForm.level || 'ALL_LEVELS'}
                            onChange={(e) =>
                              setEditForm({ ...editForm, level: e.target.value as CourseLevel })
                            }
                          >
                            <option value="ALL_LEVELS">Mọi cấp độ</option>
                            <option value="BEGINNER">Cơ bản</option>
                            <option value="INTERMEDIATE">Trung bình</option>
                            <option value="ADVANCED">Nâng cao</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {editStep === 3 && (
                      <div className="edit-step-3">
                        <div className="form-section-header">
                          <h3>Tiếp thị & Đối tượng</h3>
                          <p>Tối ưu hóa nội dung tiếp thị để thu hút học viên.</p>
                        </div>

                        <div className="form-group full-width" style={{ marginBottom: '1rem' }}>
                          <label className="form-label">Bạn sẽ học được gì? (Mỗi dòng một ý)</label>
                          <textarea
                            rows={3}
                            className="form-input form-textarea"
                            value={editForm.whatYouWillLearn}
                            onChange={(e) =>
                              setEditForm({ ...editForm, whatYouWillLearn: e.target.value })
                            }
                            placeholder="✔️ Kỹ năng thực tế 1..."
                          />
                        </div>

                        <div className="form-group full-width" style={{ marginBottom: '1rem' }}>
                          <label className="form-label">Yêu cầu (Mỗi dòng một ý)</label>
                          <textarea
                            rows={2}
                            className="form-input form-textarea"
                            value={editForm.requirements}
                            onChange={(e) =>
                              setEditForm({ ...editForm, requirements: e.target.value })
                            }
                            placeholder="• Kiến thức cơ bản về..."
                          />
                        </div>

                        <div className="form-group full-width">
                          <label className="form-label">Đối tượng mục tiêu (Mỗi dòng một ý)</label>
                          <textarea
                            rows={2}
                            className="form-input form-textarea"
                            value={editForm.targetAudience}
                            onChange={(e) =>
                              setEditForm({ ...editForm, targetAudience: e.target.value })
                            }
                            placeholder="Dành cho học sinh lớp 11 ôn thi THPT..."
                          />
                        </div>
                      </div>
                    )}

                    {editStep === 4 && (
                      <div className="edit-step-4">
                        <div className="form-section-header">
                          <h3>Định giá & Khuyến mãi</h3>
                          <p>Cập nhật học phí và các chương trình ưu đãi.</p>
                        </div>

                        <div
                          className="form-row"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '1rem',
                            marginBottom: '1.5rem',
                          }}
                        >
                          <div className="form-group">
                            <label className="form-label">
                              Giá gốc (VND) <span className="required">*</span>
                            </label>
                            <input
                              type="number"
                              className="form-input"
                              value={editForm.originalPrice || ''}
                              onChange={(e) =>
                                handlePriceChange(Number(e.target.value), discountPercent)
                              }
                              placeholder="0"
                            />
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                              Nhập 0 cho giáo trình miễn phí.
                            </p>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Giảm giá (%)</label>
                            <input
                              type="number"
                              className="form-input"
                              min="0"
                              max="99"
                              value={discountPercent || ''}
                              onChange={(e) =>
                                handlePriceChange(
                                  Number(editForm.originalPrice),
                                  Number(e.target.value)
                                )
                              }
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div
                          className="pricing-summary-card"
                          style={{
                            background: '#f8fafc',
                            padding: '1.25rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            marginBottom: '1.5rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <span style={{ color: '#64748b' }}>Giá bán thực tế:</span>
                            <strong style={{ fontSize: '1.1rem', color: '#1e293b' }}>
                              {editForm.discountedPrice?.toLocaleString('vi-VN')}₫
                            </strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Tiết kiệm:</span>
                            <span style={{ color: '#059669', fontWeight: 600 }}>
                              {(
                                Number(editForm.originalPrice) - Number(editForm.discountedPrice)
                              ).toLocaleString('vi-VN')}
                              ₫ ({discountPercent}%)
                            </span>
                          </div>
                        </div>

                        <div className="form-group full-width">
                          <label className="form-label">Ngày hết hạn giảm giá</label>
                          <input
                            type="datetime-local"
                            className="form-input"
                            value={
                              editForm.discountExpiryDate
                                ? editForm.discountExpiryDate.substring(0, 16)
                                : ''
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) {
                                setEditForm({ ...editForm, discountExpiryDate: '' });
                              } else {
                                // append :00.000Z to make it compatible, or use new Date
                                setEditForm({
                                  ...editForm,
                                  discountExpiryDate: new Date(val).toISOString(),
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="wizard-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={
                    editStep === 1 ? () => setShowEditModal(false) : () => setEditStep((s) => s - 1)
                  }
                  disabled={updateMutation.isPending}
                >
                  {editStep === 1 ? (
                    'Hủy'
                  ) : (
                    <>
                      <ArrowLeft size={16} /> Quay lại
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn primary"
                  disabled={updateMutation.isPending || !editForm.title}
                  onClick={editStep === 4 ? handleEditSubmit : () => setEditStep((s) => s + 1)}
                >
                  {updateMutation.isPending ? (
                    'Đang lưu...'
                  ) : editStep === 4 ? (
                    <>
                      <Save size={16} /> Lưu thay đổi
                    </>
                  ) : (
                    <>
                      Tiếp theo <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeacherCourseDetail;
