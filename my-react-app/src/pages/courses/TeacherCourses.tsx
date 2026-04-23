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
  Grid2x2,
  List,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import {
  useCreateCourse,
  useDeleteCourse,
  usePublishCourse,
  useSubmitCourseForReview,
  useTeacherCourses,
} from '../../hooks/useCourses';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import '../../styles/module-refactor.css';
import type { CourseResponse, CreateCourseRequest, CourseLevel } from '../../types';
import type { SchoolGrade, SubjectByGrade } from '../../types/lessonSlide.types';
import './TeacherCourses.css';

const coverGradients = [
  'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
  'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
  'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
] as const;

const coverAccents = ['#1d4ed8', '#0f766e', '#047857', '#c2410c', '#be185d', '#6d28d9'] as const;
const PAGE_SIZE = 9;
type CourseFilterStatus = 'all' | 'published' | 'draft' | 'rejected';

// ─── Create Course Modal ───────────────────────────────────────────────────────
interface CreateModalProps {
  onClose: () => void;
  onSubmit: (data: CreateCourseRequest, thumbnailFile?: File) => void;
  isLoading: boolean;
}

const CreateCourseModal: React.FC<CreateModalProps> = ({ onClose, onSubmit, isLoading }) => {
  const [form, setForm] = useState<CreateCourseRequest>({
    provider: 'MINISTRY',
    subjectId: '',
    schoolGradeId: '',
    level: 'ALL_LEVELS',
    title: '',
    subtitle: '',
    description: '',
    whatYouWillLearn: '',
    requirements: '',
    targetAudience: '',
    originalPrice: 0,
    discountedPrice: 0,
    discountExpiryDate: '',
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | undefined>(undefined);
  const [discountPercent, setDiscountPercent] = useState(0);

  const [grades, setGrades] = useState<SchoolGrade[]>([]);
  const [subjects, setSubjects] = useState<SubjectByGrade[]>([]);
  React.useEffect(() => {
    LessonSlideService.getSchoolGrades(true)
      .then((r) => setGrades(r.result || []))
      .catch(() => {});
  }, []);

  const handleGradeChange = async (schoolGradeId: string) => {
    setForm({ ...form, schoolGradeId, subjectId: '' });
    setSubjects([]);
    if (!schoolGradeId) return;
    try {
      const r = await LessonSlideService.getSubjectsBySchoolGrade(schoolGradeId);
      setSubjects(r.result || []);
    } catch {}
  };

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handlePriceChange = (original: number, percent: number) => {
    const discounted = Math.round(original * (1 - percent / 100));
    setForm({ ...form, originalPrice: original, discountedPrice: discounted });
    setDiscountPercent(percent);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setThumbnailFile(file);
  };

  return (
    <div className="modal-overlay">
      <button type="button" className="modal-backdrop" onClick={onClose} aria-label="Đóng" />
      <div className="modal-box wizard-modal-box">
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <h2>Tạo giáo trình mới</h2>
              <p>Bước {step} trên {totalSteps}</p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="wizard-steps-indicator">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`wizard-step-item ${step === i ? 'active' : ''} ${step > i ? 'completed' : ''}`}>
              <div className="wizard-step-circle">
                {step > i ? <Check size={18} /> : i}
              </div>
              <span className="wizard-step-label">
                {i === 1 ? 'Phân loại' : i === 2 ? 'Chi tiết' : i === 3 ? 'Tiếp thị' : 'Định giá'}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="modal-form">
          <div className="wizard-content-wrapper">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="wizard-step-content"
              >
                {step === 1 && (
                  <div className="step-1-classification">
                    <div className="form-section-header">
                      <h3>Phân loại giáo trình</h3>
                      <p>Chọn phương thức giảng dạy và đặt tên cho giáo trình của bạn.</p>
                    </div>

                    <div className="provider-selector" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div
                        className={`provider-card ${form.provider === 'MINISTRY' ? 'active' : ''}`}
                        onClick={() => setForm({ ...form, provider: 'MINISTRY' })}
                        style={{
                          border: `2px solid ${form.provider === 'MINISTRY' ? '#2563eb' : '#e2e8f0'}`,
                          borderRadius: '8px',
                          padding: '1rem',
                          cursor: 'pointer',
                          background: form.provider === 'MINISTRY' ? '#eff6ff' : '#fff',
                        }}
                      >
                        <GraduationCap size={24} style={{ color: form.provider === 'MINISTRY' ? '#2563eb' : '#64748b', marginBottom: '0.5rem' }} />
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Chương trình chuẩn</h4>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>Bám sát khung Bộ GD. Yêu cầu chọn khối/môn.</p>
                      </div>
                      <div
                        className={`provider-card ${form.provider === 'CUSTOM' ? 'active' : ''}`}
                        onClick={() => setForm({ ...form, provider: 'CUSTOM', subjectId: '', schoolGradeId: '' })}
                        style={{
                          border: `2px solid ${form.provider === 'CUSTOM' ? '#059669' : '#e2e8f0'}`,
                          borderRadius: '8px',
                          padding: '1rem',
                          cursor: 'pointer',
                          background: form.provider === 'CUSTOM' ? '#f0fdf4' : '#fff',
                        }}
                      >
                        <Sparkles size={24} style={{ color: form.provider === 'CUSTOM' ? '#059669' : '#64748b', marginBottom: '0.5rem' }} />
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Giáo trình Tùy chỉnh</h4>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>Xây dựng bài giảng theo phong cách cá nhân.</p>
                      </div>
                    </div>

                    {form.provider === 'MINISTRY' && (
                      <div className="form-row" style={{ marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">Khối lớp <span className="required">*</span></label>
                          <select
                            className="form-select"
                            value={form.schoolGradeId || ''}
                            onChange={(e) => void handleGradeChange(e.target.value)}
                            required
                          >
                            <option value="">-- Chọn khối lớp --</option>
                            {grades.map((g) => (
                              <option key={g.id} value={g.id}>Khối {g.gradeLevel} – {g.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Môn học <span className="required">*</span></label>
                          <select
                            className="form-select"
                            value={form.subjectId || ''}
                            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                            required
                            disabled={!form.schoolGradeId}
                          >
                            <option value="">-- Chọn môn học --</option>
                            {subjects.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="course-title" className="form-label">Tiêu đề giáo trình <span className="required">*</span></label>
                      <input
                        id="course-title"
                        className="form-input"
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Ví dụ: Làm chủ Toán học lớp 12"
                        required
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="step-2-details">
                    <div className="form-section-header">
                      <h3>Chi tiết nội dung</h3>
                      <p>Mô tả ngắn gọn và chọn hình ảnh đại diện cho giáo trình.</p>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Phụ đề (Catchy Subtitle)</label>
                      <input
                        className="form-input"
                        type="text"
                        value={form.subtitle || ''}
                        onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                        placeholder="Câu ngắn gọn thu hút học viên"
                      />
                    </div>

                    <div className="form-row" style={{ marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Ngôn ngữ</label>
                        <input
                          className="form-input"
                          type="text"
                          value={form.language || ''}
                          onChange={(e) => setForm({ ...form, language: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Ảnh thumbnail</label>
                        <input className="form-input" type="file" accept="image/*" onChange={handleThumbnailChange} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mô tả tổng quát</label>
                      <textarea
                        className="form-input form-textarea"
                        value={form.description || ''}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="step-3-marketing">
                    <div className="form-section-header">
                      <h3>Tiếp thị giáo trình</h3>
                      <p>Giúp học viên hiểu rõ lợi ích và yêu cầu của khóa học này.</p>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Bạn sẽ học được gì? (Mỗi dòng một ý)</label>
                      <textarea
                        className="form-input form-textarea"
                        value={form.whatYouWillLearn || ''}
                        onChange={(e) => setForm({ ...form, whatYouWillLearn: e.target.value })}
                        placeholder="✔️ Kỹ năng thực tế 1..."
                        rows={3}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Yêu cầu (Mỗi dòng một ý)</label>
                      <textarea
                        className="form-input form-textarea"
                        value={form.requirements || ''}
                        onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                        placeholder="• Kiến thức nền tảng..."
                        rows={2}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Đối tượng mục tiêu</label>
                      <textarea
                        className="form-input form-textarea"
                        value={form.targetAudience || ''}
                        onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                        placeholder="Dành cho học sinh khối 12..."
                        rows={2}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Cấp độ (Level)</label>
                      <select
                        className="form-select"
                        value={form.level || 'ALL_LEVELS'}
                        onChange={(e) => setForm({ ...form, level: e.target.value as CourseLevel })}
                      >
                        <option value="ALL_LEVELS">Mọi cấp độ</option>
                        <option value="BEGINNER">Người mới bắt đầu</option>
                        <option value="INTERMEDIATE">Trình độ trung cấp</option>
                        <option value="ADVANCED">Trình độ nâng cao</option>
                      </select>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="step-4-pricing">
                    <div className="form-section-header">
                      <h3>Định giá & Khuyến mãi</h3>
                      <p>Thiết lập học phí và các chương trình giảm giá cho giáo trình của bạn.</p>
                    </div>

                    <div className="form-row" style={{ marginBottom: '1.5rem' }}>
                      <div className="form-group">
                        <label className="form-label">Giá gốc (VND) <span className="required">*</span></label>
                        <input
                          className="form-input"
                          type="number"
                          value={form.originalPrice || ''}
                          onChange={(e) => handlePriceChange(Number(e.target.value), discountPercent)}
                          placeholder="0"
                        />
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                          Nhập 0 nếu bạn muốn cung cấp giáo trình miễn phí.
                        </p>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phần trăm giảm giá (%)</label>
                        <input
                          className="form-input"
                          type="number"
                          min="0"
                          max="99"
                          value={discountPercent || ''}
                          onChange={(e) => handlePriceChange(Number(form.originalPrice), Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="pricing-summary-card" style={{ 
                      background: '#f8fafc',
                      padding: '1.25rem',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '1.5rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#64748b' }}>Giá bán thực tế:</span>
                        <strong style={{ fontSize: '1.1rem', color: '#1e293b' }}>
                          {form.discountedPrice?.toLocaleString('vi-VN')}₫
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Tiết kiệm cho học viên:</span>
                        <span style={{ color: '#059669', fontWeight: 600 }}>
                          {(Number(form.originalPrice) - Number(form.discountedPrice)).toLocaleString('vi-VN')}₫ ({discountPercent}%)
                        </span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Ngày hết hạn giảm giá</label>
                      <input
                        className="form-input"
                        type="date"
                        value={form.discountExpiryDate ? form.discountExpiryDate.split('T')[0] : ''}
                        onChange={(e) => setForm({ ...form, discountExpiryDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                      />
                      <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                        Sau ngày này, giáo trình sẽ quay trở về giá gốc. Để trống nếu không giới hạn thời gian.
                      </p>
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
              onClick={step === 1 ? onClose : prevStep}
              disabled={isLoading}
            >
              {step === 1 ? 'Hủy bỏ' : (
                <>
                  <ArrowLeft size={16} /> Quay lại
                </>
              )}
            </button>

            <button
              type="button"
              className="btn primary"
              disabled={isLoading || (step === 1 && (!form.title || (form.provider === 'MINISTRY' && (!form.subjectId || !form.schoolGradeId))))}
              onClick={step === totalSteps ? () => onSubmit(form, thumbnailFile) : nextStep}
            >
              {isLoading ? (
                <>
                  <span className="btn-spinner" /> Đang tạo...
                </>
              ) : step === totalSteps ? (
                <>
                  <Plus size={16} /> Tạo giáo trình
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
  );
};

// Main Page
const TeacherCourses: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<CourseFilterStatus>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: coursesData, isLoading, error } = useTeacherCourses();
  const createMutation = useCreateCourse();
  const deleteMutation = useDeleteCourse();
  const publishMutation = usePublishCourse();
  const submitReviewMutation = useSubmitCourseForReview();

  const courses: CourseResponse[] = useMemo(() => coursesData?.result ?? [], [coursesData]);

  const getNormalizedStatus = (course: CourseResponse): 'published' | 'draft' | 'rejected' => {
    if (course.status === 'REJECTED') return 'rejected';
    if (course.published || course.status === 'PUBLISHED') return 'published';
    return 'draft';
  };

  const getGradeMeta = (course: CourseResponse) => {
    if (course.schoolGradeId) {
      return {
        value: course.schoolGradeId,
        label: course.gradeLevel ? `Lớp ${course.gradeLevel}` : 'Có phân lớp',
      };
    }
    if (course.gradeLevel) {
      return {
        value: `grade-${course.gradeLevel}`,
        label: `Lớp ${course.gradeLevel}`,
      };
    }
    return { value: 'unassigned', label: 'Chưa phân lớp' };
  };

  const gradeOptions = useMemo(() => {
    const map = new Map<string, string>();
    courses.forEach((course) => {
      const meta = getGradeMeta(course);
      map.set(meta.value, meta.label);
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const normalizedStatus = getNormalizedStatus(course);
      let statusMatch = true;
      if (filterStatus === 'published') statusMatch = normalizedStatus === 'published';
      else if (filterStatus === 'draft') statusMatch = normalizedStatus === 'draft';
      else if (filterStatus === 'rejected') statusMatch = normalizedStatus === 'rejected';
      const searchMatch = course.title.toLowerCase().includes(search.toLowerCase());
      const gradeMatch = filterGrade === 'all' || getGradeMeta(course).value === filterGrade;
      return statusMatch && searchMatch && gradeMatch;
    });
  }, [courses, filterStatus, filterGrade, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCourses = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredCourses.slice(start, start + PAGE_SIZE);
  }, [filteredCourses, safeCurrentPage]);

  const stats = useMemo(
    () => ({
      total: courses.length,
      active: courses.filter((c) => getNormalizedStatus(c) === 'published').length,
      draft: courses.filter((c) => getNormalizedStatus(c) === 'draft').length,
      rejected: courses.filter((c) => getNormalizedStatus(c) === 'rejected').length,
      students: courses.reduce((sum, c) => sum + c.studentsCount, 0),
    }),
    [courses]
  );

  const handleCreate = (data: CreateCourseRequest, thumbnailFile?: File) => {
    createMutation.mutate({ data, thumbnailFile }, {
      onSuccess: () => setShowCreateModal(false),
    });
  };

  const handleTogglePublish = (course: CourseResponse) => {
    publishMutation.mutate({ courseId: course.id, data: { published: !course.published } });
  };

  const handleSubmitForReview = (course: CourseResponse) => {
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

  const handleDelete = (courseId: string) => {
    if (globalThis.confirm('Bạn có chắc muốn xóa giáo trình này?')) {
      deleteMutation.mutate(courseId);
    }
  };

  const filterTabs = [
    { id: 'all' as const, label: `Tất cả (${stats.total})` },
    { id: 'published' as const, label: `Công khai (${stats.active})` },
    { id: 'draft' as const, label: `Nháp (${stats.draft})` },
    { id: 'rejected' as const, label: `Bị từ chối (${stats.rejected})` },
  ];

  const getBadgeClass = (course: CourseResponse) => {
    if (course.status === 'PENDING_REVIEW') return 'badge-review';
    if (course.status === 'REJECTED') return 'badge-rejected';
    return course.published ? 'badge-live' : 'badge-draft';
  };

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Giáo viên', avatar: '', role: 'teacher' }}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container">
        <section className="module-page teacher-courses-page">
          {/* ── Header ── */}
          <header className="page-header courses-header-row">
            <div className="header-stack">
              <div className="header-kicker">Teacher Studio</div>
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Giáo trình</h2>
                {!isLoading && <span className="count-chip">{courses.length}</span>}
              </div>
              <p className="header-sub">
                {stats.active} đang hoạt động • {stats.students} học viên
              </p>
            </div>
            <button className="btn" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              Tạo giáo trình
            </button>
          </header>

          {/* ── Stats ── */}
          <div className="stats-grid">
            <div className="stat-card stat-blue">
              <div className="stat-icon-wrap">
                <BookOpen size={20} />
              </div>
              <div>
                <h3>{stats.total}</h3>
                <p>Tổng giáo trình</p>
              </div>
            </div>
            <div className="stat-card stat-emerald">
              <div className="stat-icon-wrap">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3>{stats.active}</h3>
                <p>Đang hoạt động</p>
              </div>
            </div>
            <div className="stat-card stat-amber">
              <div className="stat-icon-wrap">
                <FileText size={20} />
              </div>
              <div>
                <h3>{stats.draft}</h3>
                <p>Bản nháp</p>
              </div>
            </div>
            <div className="stat-card stat-violet">
              <div className="stat-icon-wrap">
                <GraduationCap size={20} />
              </div>
              <div>
                <h3>{stats.students}</h3>
                <p>Học viên</p>
              </div>
            </div>
          </div>

          {/* ── Toolbar ── */}
          <div className="toolbar">
            <label className="search-box">
              <span className="search-box__icon" aria-hidden="true">
                <Search size={15} />
              </span>
              <input
                placeholder="Tìm kiếm giáo trình..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {search && (
                <button
                  type="button"
                  className="search-box__clear"
                  aria-label="Xóa nội dung tìm kiếm"
                  onClick={() => setSearch('')}
                >
                  <X size={14} />
                </button>
              )}
            </label>

            <select
              className="grade-filter-select"
              value={filterGrade}
              onChange={(e) => {
                setFilterGrade(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Lọc theo lớp"
            >
              <option value="all">Tất cả lớp</option>
              {gradeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="pill-group">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`pill-btn${filterStatus === tab.id ? ' active' : ''}`}
                  onClick={() => {
                    setFilterStatus(tab.id);
                    setCurrentPage(1);
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="view-toggle" style={{ marginLeft: 'auto' }}>
              <button
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => {
                  setViewMode('grid');
                  setCurrentPage(1);
                }}
                aria-label="Hiển thị lưới"
              >
                <Grid2x2 size={16} />
              </button>
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => {
                  setViewMode('list');
                  setCurrentPage(1);
                }}
                aria-label="Hiển thị danh sách"
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* ── Summary bar ── */}
          {!isLoading && !error && courses.length > 0 && (
            <div className="assessment-summary-bar">
              <div className="summary-item summary-item--primary">
                <span className="summary-label">Hiển thị</span>
                <strong className="summary-value">
                  {paginatedCourses.length} / {filteredCourses.length}
                </strong>
              </div>
              <div className="summary-item">
                <span className="summary-dot summary-dot--progress" />
                <span className="summary-label">Công khai</span>
                <strong className="summary-value">{stats.active}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-dot summary-dot--upcoming" />
                <span className="summary-label">Nháp</span>
                <strong className="summary-value">{stats.draft}</strong>
              </div>
            </div>
          )}

          {/* ── Loading ── */}
          {isLoading && (
            <div className="skeleton-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="empty">
              <AlertCircle
                size={28}
                style={{ opacity: 0.5, marginBottom: 8, color: 'var(--mod-danger)' }}
              />
              <p>Không thể tải giáo trình. Vui lòng thử lại.</p>
            </div>
          )}

          {/* ── Grid ── */}
          {!isLoading && !error && filteredCourses.length > 0 && (
            <div className={`grid-cards${viewMode === 'list' ? ' list-view' : ''}`}>
              {paginatedCourses.map((course, idx) => (
                <article key={course.id} className="data-card course-card">
                  <div
                    className="course-cover"
                    style={{
                      background: coverGradients[idx % coverGradients.length],
                      color: coverAccents[idx % coverAccents.length],
                    }}
                  >
                    {course.thumbnailUrl && (
                      <img src={course.thumbnailUrl} alt={course.title} className="cover-thumb" />
                    )}
                    <div className="cover-overlay" />
                    <div className="cover-index">#{String((safeCurrentPage - 1) * PAGE_SIZE + idx + 1).padStart(2, '0')}</div>
                    <span className={`course-badge ${getBadgeClass(course)}`}>
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
                    <h3 className="cover-title">{course.title}</h3>
                  </div>

                  <div className="course-body">
                    <p className="course-desc">
                      {course.description || 'Chưa có mô tả cho giáo trình này.'}
                    </p>

                    <div className="course-metrics">
                      <div className="metric">
                        <Users size={13} />
                        <span>{course.studentsCount} học viên</span>
                      </div>
                      <div className="metric">
                        <Star size={13} />
                        <span>{Number(course.rating).toFixed(1)}</span>
                      </div>
                      <div className="metric">
                        <BookOpen size={13} />
                        <span>{course.lessonsCount} bài</span>
                      </div>
                    </div>

                    <div className="course-actions">
                      <button
                        className="action-primary"
                        onClick={() => navigate(`/teacher/courses/${course.id}`)}
                      >
                        <Settings2 size={14} /> Quản lý
                      </button>
                      {!course.published && course.status !== 'PENDING_REVIEW' && (
                        <button
                          className="action-toggle"
                          onClick={() => handleSubmitForReview(course)}
                          disabled={submitReviewMutation.isPending}
                          title="Gửi khóa học để admin phê duyệt"
                        >
                          <CheckCircle2 size={14} /> Gửi duyệt
                        </button>
                      )}
                      <button
                        className={`action-toggle${course.published ? ' is-live' : ''}`}
                        onClick={() => handleTogglePublish(course)}
                        disabled={publishMutation.isPending || !course.published && course.status !== 'PUBLISHED'}
                        title={
                          !course.published && course.status !== 'PUBLISHED'
                            ? 'Khóa học cần được duyệt trước khi công khai'
                            : undefined
                        }
                      >
                        {course.published ? (
                          <>
                            <EyeOff size={14} /> Ẩn
                          </>
                        ) : (
                          <>
                            <Eye size={14} /> Công khai
                          </>
                        )}
                      </button>
                      <button
                        className="action-danger"
                        onClick={() => handleDelete(course.id)}
                        disabled={deleteMutation.isPending}
                        aria-label="Xóa giáo trình"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!isLoading && !error && filteredCourses.length > PAGE_SIZE && (
            <div className="courses-pagination">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, Math.min(totalPages, p) - 1))}
                disabled={safeCurrentPage === 1}
              >
                <ArrowLeft size={14} /> Trước
              </button>
              <span className="pagination-info">
                Trang <strong>{safeCurrentPage}</strong> / {totalPages}
              </span>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, Math.min(totalPages, p) + 1))}
                disabled={safeCurrentPage === totalPages}
              >
                Sau <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* ── Empty: filtered ── */}
          {!isLoading && !error && filteredCourses.length === 0 && courses.length > 0 && (
            <div className="empty">
              <Search size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>
                Không tìm thấy giáo trình{search ? ` khớp với "${search}"` : ' với bộ lọc này'}.
              </p>
            </div>
          )}

          {/* ── Empty: no courses ── */}
          {!isLoading && !error && courses.length === 0 && (
            <div className="empty">
              <BookOpen size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>Bạn chưa có giáo trình nào. Hãy tạo giáo trình để bắt đầu giảng dạy.</p>
              <button className="btn" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} /> Tạo giáo trình đầu tiên
              </button>
            </div>
          )}
        </section>

        {showCreateModal && (
          <CreateCourseModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreate}
            isLoading={createMutation.isPending}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherCourses;
