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
import { useQuery } from '@tanstack/react-query';
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
import { UI_TEXT } from '../../constants/uiText';

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
type CourseFilterStatus = 'all' | 'published' | 'draft' | 'rejected' | 'archived';
const languageOptions = ['Tiếng Việt', 'English'] as const;

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
  const [pricingMode, setPricingMode] = useState<'free' | 'paid'>('free');
  /** Chỉ số nguyên dương (nghìn VND) — dùng text + regex, không dùng type=number (tránh "1-1" / bước nhảy) */
  const [originalThousandInput, setOriginalThousandInput] = useState('');

  const gradesQuery = useQuery({
    queryKey: ['lesson-slide', 'school-grades', 'teacher-courses-modal'],
    queryFn: () => LessonSlideService.getSchoolGrades(true),
    staleTime: 5 * 60_000,
  });
  const subjectsQuery = useQuery({
    queryKey: ['lesson-slide', 'subjects-by-grade', form.schoolGradeId, 'teacher-courses-modal'],
    queryFn: () => LessonSlideService.getSubjectsBySchoolGrade(form.schoolGradeId ?? ''),
    enabled: form.provider === 'MINISTRY' && !!form.schoolGradeId,
    staleTime: 5 * 60_000,
  });
  const grades: SchoolGrade[] = gradesQuery.data?.result || [];
  const subjects: SubjectByGrade[] = subjectsQuery.data?.result || [];

  const handleGradeChange = (schoolGradeId: string) => {
    setForm({ ...form, schoolGradeId, subjectId: '' });
  };

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));
  const todayDate = new Date().toISOString().split('T')[0];

  const handlePriceChange = (original: number, percent: number) => {
    const discounted = Math.round(original * (1 - percent / 100));
    setForm({ ...form, originalPrice: original, discountedPrice: discounted });
    setDiscountPercent(percent);
  };

  const handlePricingModeChange = (mode: 'free' | 'paid') => {
    setPricingMode(mode);
    if (mode === 'free') {
      setOriginalThousandInput('');
      setDiscountPercent(0);
      setForm({
        ...form,
        originalPrice: 0,
        discountedPrice: 0,
        discountExpiryDate: '',
      });
      return;
    }

    const original = Number(form.originalPrice) > 0 ? Number(form.originalPrice) : 10000;
    const percent = Number.isInteger(discountPercent) && discountPercent >= 5 ? discountPercent : 10;
    setOriginalThousandInput(String(Math.round(original / 1000)));
    handlePriceChange(original, percent);
  };

  const handleOriginalThousandChange = (raw: string) => {
    if (raw === '' || /^\d+$/.test(raw)) {
      setOriginalThousandInput(raw);
      const n = raw === '' ? 0 : Number.parseInt(raw, 10);
      const original = n * 1000;
      handlePriceChange(original, discountPercent);
    }
  };

  const handleDiscountPercentInput = (rawInput: string) => {
    const normalized = rawInput.replace(/\D+/g, '');
    if (!normalized) {
      setDiscountPercent(0);
      setForm({ ...form, discountedPrice: Number(form.originalPrice) });
      return;
    }
    const parsed = Number(normalized);
    const bounded = Math.max(0, Math.min(100, parsed));
    setDiscountPercent(bounded);
    const discounted = Math.round(Number(form.originalPrice) * (1 - bounded / 100));
    setForm({ ...form, discountedPrice: discounted });
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setThumbnailFile(file);
  };

  const handleClearThumbnail = () => {
    setThumbnailFile(undefined);
  };

  const isDiscountPercentValid =
    pricingMode === 'free' ||
    (Number.isInteger(discountPercent) &&
      discountPercent >= 5 &&
      discountPercent <= 100 &&
      discountPercent % 5 === 0);

  const originalThousandInt =
    originalThousandInput === '' ? NaN : Number.parseInt(originalThousandInput, 10);
  const isOriginalPriceValid =
    pricingMode === 'free' ||
    (Number.isInteger(originalThousandInt) &&
      originalThousandInt >= 1 &&
      Number(form.originalPrice) === originalThousandInt * 1000);
  const expiryDateValue = form.discountExpiryDate ? form.discountExpiryDate.split('T')[0] : '';
  const isExpiryDateValid = !expiryDateValue || expiryDateValue >= todayDate;
  const isStep1Valid = !!form.title && (form.provider !== 'MINISTRY' || (!!form.subjectId && !!form.schoolGradeId));
  const canSubmit = !isLoading && (
    step === 1
      ? isStep1Valid
      : step === totalSteps
        ? pricingMode === 'free'
          ? isStep1Valid
          : (isStep1Valid && isOriginalPriceValid && isDiscountPercentValid && isExpiryDateValid)
        : true
  );

  return (
    <div className="modal-overlay create-course-modal">
      <button type="button" className="modal-backdrop" onClick={onClose} aria-label="Đóng" />
      <div className="modal-box wizard-modal-box create-course-wizard" aria-labelledby="create-course-title">
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 id="create-course-title">Tạo {UI_TEXT.COURSE.toLowerCase()} mới</h2>
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
                      <h3>Phân loại {UI_TEXT.COURSE.toLowerCase()}</h3>
                      <p>Chọn phương thức giảng dạy và đặt tên cho {UI_TEXT.COURSE.toLowerCase()} của bạn.</p>
                    </div>

                    <div className="provider-selector">
                      <button
                        type="button"
                        className={`provider-card ${form.provider === 'MINISTRY' ? 'is-active' : ''}`}
                        onClick={() => setForm({ ...form, provider: 'MINISTRY' })}
                      >
                        <div className="provider-card__icon" aria-hidden="true">
                          <GraduationCap size={22} />
                        </div>
                        <h4>Chương trình chuẩn</h4>
                        <p>Bám sát khung Bộ GD. Yêu cầu chọn khối/môn.</p>
                      </button>
                      <button
                        type="button"
                        className={`provider-card ${form.provider === 'CUSTOM' ? 'is-active' : ''}`}
                        onClick={() => setForm({ ...form, provider: 'CUSTOM', subjectId: '', schoolGradeId: '' })}
                      >
                        <div className="provider-card__icon" aria-hidden="true">
                          <Sparkles size={22} />
                        </div>
                        <h4>{UI_TEXT.COURSE} tùy chỉnh</h4>
                        <p>Xây dựng bài giảng theo phong cách cá nhân.</p>
                      </button>
                    </div>

                    {form.provider === 'MINISTRY' && (
                      <div className="form-row form-row--tight-below">
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
                      <label htmlFor="course-title" className="form-label">Tiêu đề {UI_TEXT.COURSE.toLowerCase()} <span className="required">*</span></label>
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
                      <p>Mô tả ngắn gọn và chọn hình ảnh đại diện cho {UI_TEXT.COURSE.toLowerCase()}.</p>
                    </div>

                    <div className="form-group form-group--tight-below">
                      <label className="form-label">Phụ đề (Catchy Subtitle)</label>
                      <input
                        className="form-input"
                        type="text"
                        value={form.subtitle || ''}
                        onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                        placeholder="Câu ngắn gọn thu hút học viên"
                      />
                    </div>

                    <div className="form-row form-row--tight-below">
                      <div className="form-group">
                        <label className="form-label">Ngôn ngữ</label>
                        <select
                          className="form-select"
                          value={form.language || ''}
                          onChange={(e) => setForm({ ...form, language: e.target.value })}
                        >
                          <option value="">-- Chọn ngôn ngữ --</option>
                          {languageOptions.map((lang) => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Ảnh thumbnail</label>
                        <label className="file-upload-field" htmlFor="course-thumbnail">
                          <span className="file-upload-title">
                            {thumbnailFile ? 'Đã chọn tệp ảnh' : 'Chọn ảnh từ máy'}
                          </span>
                          <span className="file-upload-name">
                            {thumbnailFile ? thumbnailFile.name : 'PNG, JPG, WEBP'}
                          </span>
                        </label>
                        <input
                          id="course-thumbnail"
                          className="file-upload-input"
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailChange}
                        />
                        {thumbnailFile && (
                          <button
                            type="button"
                            className="file-upload-clear"
                            onClick={handleClearThumbnail}
                          >
                            Bỏ ảnh đã chọn
                          </button>
                        )}
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
                      <h3>Tiếp thị {UI_TEXT.COURSE.toLowerCase()}</h3>
                      <p>Giúp học viên hiểu rõ lợi ích và yêu cầu của khóa học này.</p>
                    </div>

                    <div className="form-group form-group--tight-below">
                      <label className="form-label">Bạn sẽ học được gì? (Mỗi dòng một ý)</label>
                      <textarea
                        className="form-input form-textarea"
                        value={form.whatYouWillLearn || ''}
                        onChange={(e) => setForm({ ...form, whatYouWillLearn: e.target.value })}
                        placeholder="✔️ Kỹ năng thực tế 1..."
                        rows={3}
                      />
                    </div>

                    <div className="form-group form-group--tight-below">
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
                      <p>Thiết lập học phí và các chương trình giảm giá cho {UI_TEXT.COURSE.toLowerCase()} của bạn.</p>
                    </div>

                    <div className="pricing-mode-toggle form-group--tight-below">
                      <button
                        type="button"
                        className={`pricing-mode-btn ${pricingMode === 'free' ? 'is-active' : ''}`}
                        onClick={() => handlePricingModeChange('free')}
                      >
                        Miễn phí
                      </button>
                      <button
                        type="button"
                        className={`pricing-mode-btn ${pricingMode === 'paid' ? 'is-active' : ''}`}
                        onClick={() => handlePricingModeChange('paid')}
                      >
                        Có phí
                      </button>
                    </div>

                    {pricingMode === 'free' && (
                      <p className="form-hint pricing-free-note">
                        Khoá học <strong>miễn phí</strong>: không cần nhập giá, giảm giá hay ngày hết hạn. Chọn &quot;Có phí&quot; nếu bạn muốn thiết lập học phí.
                      </p>
                    )}

                    {pricingMode === 'paid' && (
                      <>
                        <div className="form-row form-row--loose-below">
                          <div className="form-group">
                            <label className="form-label" htmlFor="create-original-thousand">
                              Giá gốc (nghìn VND) <span className="required">*</span>
                            </label>
                            <input
                              id="create-original-thousand"
                              className="form-input"
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              value={originalThousandInput}
                              onChange={(e) => handleOriginalThousandChange(e.target.value)}
                              placeholder="Ví dụ: 10 → 10.000"
                            />
                            <p className={`form-hint ${!isOriginalPriceValid && originalThousandInput !== '' ? 'is-error' : ''}`}>
                              Chỉ nhập số nguyên dương (nghìn VND), ví dụ 10 tương ứng 10.000 VND.
                            </p>
                          </div>
                          <div className="form-group">
                            <label className="form-label" htmlFor="create-discount-pct">Phần trăm giảm giá (%)</label>
                            <input
                              id="create-discount-pct"
                              className="form-input"
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              value={discountPercent === 0 ? '' : String(discountPercent)}
                              onChange={(e) => handleDiscountPercentInput(e.target.value)}
                              placeholder="5, 10, 15...100"
                            />
                            <p className={`form-hint ${!isDiscountPercentValid ? 'is-error' : ''}`}>
                              Giảm giá: số nguyên từ 5 đến 100, chia hết cho 5.
                            </p>
                          </div>
                        </div>

                        <div className="pricing-summary-card">
                          <div className="pricing-summary-row">
                            <span>Giá bán thực tế:</span>
                            <strong>
                              {form.discountedPrice?.toLocaleString('vi-VN')}₫
                            </strong>
                          </div>
                          <div className="pricing-summary-row">
                            <span>Tiết kiệm cho học viên:</span>
                            <span className="pricing-summary-savings">
                              {(Number(form.originalPrice) - Number(form.discountedPrice)).toLocaleString('vi-VN')}₫ ({discountPercent}%)
                            </span>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="create-discount-expiry">Ngày hết hạn giảm giá</label>
                          <input
                            id="create-discount-expiry"
                            className="form-input"
                            type="date"
                            min={todayDate}
                            value={expiryDateValue}
                            onChange={(e) =>
                              setForm({ ...form, discountExpiryDate: e.target.value ? new Date(e.target.value).toISOString() : '' })
                            }
                          />
                          <p className={`form-hint ${!isExpiryDateValid ? 'is-error' : ''}`}>
                            Chỉ chọn từ hôm nay trở đi. Để trống nếu không giới hạn thời gian.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="wizard-footer">
            <button
              type="button"
              className="btn btn-sand"
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
              className="btn btn-terracotta"
              disabled={!canSubmit}
              onClick={step === totalSteps ? () => onSubmit(form, thumbnailFile) : nextStep}
            >
              {isLoading ? (
                <>
                  <span className="btn-spinner" /> Đang tạo...
                </>
              ) : step === totalSteps ? (
                <>
                  <Plus size={16} /> Tạo {UI_TEXT.COURSE.toLowerCase()}
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

  const getNormalizedStatus = (course: CourseResponse): 'published' | 'draft' | 'rejected' | 'archived' => {
    if (course.status === 'ARCHIVED') return 'archived';
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
      else if (filterStatus === 'archived') statusMatch = normalizedStatus === 'archived';
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
      archived: courses.filter((c) => getNormalizedStatus(c) === 'archived').length,
      students: courses.reduce((sum, c) => sum + c.studentsCount, 0),
    }),
    [courses]
  );

  const handleCreate = (data: CreateCourseRequest, thumbnailFile?: File) => {
    // Sanitize data for free courses
    const sanitizedData = { ...data };
    if (Number(data.originalPrice) === 0) {
      sanitizedData.originalPrice = 0;
      sanitizedData.discountedPrice = 0;
      sanitizedData.discountExpiryDate = '';
    }

    createMutation.mutate({ data: sanitizedData, thumbnailFile }, {
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
    if (globalThis.confirm(`Bạn có chắc muốn xóa ${UI_TEXT.COURSE.toLowerCase()} này?`)) {
      deleteMutation.mutate(courseId);
    }
  };

  const filterTabs = [
    { id: 'all' as const, label: `Tất cả (${stats.total})` },
    { id: 'published' as const, label: `Công khai (${stats.active})` },
    { id: 'draft' as const, label: `Nháp (${stats.draft})` },
    { id: 'rejected' as const, label: `Bị từ chối (${stats.rejected})` },
    { id: 'archived' as const, label: `Đã lưu trữ (${stats.archived})` },
  ];

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Giáo viên', avatar: '', role: 'teacher' }}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container">
        <section className="module-page teacher-courses-page teacher-courses-index-page">
          {/* ── Header ── */}
          <header className="page-header courses-header-row">
            <div className="header-stack">
              <div className="header-kicker">Teacher Studio</div>
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>{UI_TEXT.COURSE}</h2>
                {!isLoading && <span className="count-chip">{courses.length}</span>}
              </div>
              <p className="header-sub">
                {stats.active} đang hoạt động • {stats.students} học viên
              </p>
            </div>
              <button className="btn" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} />
                Tạo {UI_TEXT.COURSE.toLowerCase()}
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
                <p>{UI_TEXT.TOTAL_COURSES}</p>
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
                placeholder={`Tìm kiếm ${UI_TEXT.COURSE.toLowerCase()}...`}
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
              <p>Không thể tải {UI_TEXT.COURSE.toLowerCase()}. Vui lòng thử lại.</p>
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
                    <span
                        style={{
                          position: 'absolute',
                          top: '0.6rem',
                          left: '0.7rem',
                          zIndex: 2,
                          background: 'rgba(0,0,0,0.38)',
                          color: '#fff',
                          borderRadius: '999px',
                          padding: '2px 8px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          backdropFilter: 'blur(6px)',
                          border: '1px solid rgba(255,255,255,0.18)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {course.status === 'PENDING_REVIEW' ? (
                          <><CheckCircle2 size={11} /> Chờ duyệt</>
                        ) : course.status === 'REJECTED' ? (
                          <><AlertCircle size={11} /> Bị từ chối</>
                        ) : course.status === 'ARCHIVED' ? (
                          <><BookOpen size={11} /> Đã lưu trữ</>
                        ) : course.published ? (
                          <><Eye size={11} /> Công khai</>
                        ) : (
                          <><EyeOff size={11} /> Nháp</>
                        )}
                      </span>
                    <h3 className="cover-title">{course.title}</h3>
                  </div>

                  <div className="course-body">
                    <p className="course-desc">
                      {course.description || `Chưa có mô tả cho ${UI_TEXT.COURSE.toLowerCase()} này.`}
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
                        aria-label={`Xóa ${UI_TEXT.COURSE.toLowerCase()}`}
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
                Không tìm thấy {UI_TEXT.COURSE.toLowerCase()}{search ? ` khớp với "${search}"` : ' với bộ lọc này'}.
              </p>
            </div>
          )}

          {/* ── Empty: no courses ── */}
          {!isLoading && !error && courses.length === 0 && (
            <div className="empty">
              <BookOpen size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>Bạn chưa có {UI_TEXT.COURSE.toLowerCase()} nào. Hãy tạo {UI_TEXT.COURSE.toLowerCase()} để bắt đầu giảng dạy.</p>
              <button className="btn" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} /> Tạo {UI_TEXT.COURSE.toLowerCase()} đầu tiên
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
