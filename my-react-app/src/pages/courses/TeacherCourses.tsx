import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
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
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { UI_TEXT } from '../../constants/uiText';
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
import type { CourseLevel, CourseResponse, CreateCourseRequest } from '../../types';
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
type CourseFilterStatus =
  | 'all'
  | 'published'
  | 'pending_review'
  | 'draft'
  | 'rejected'
  | 'archived';
const languageOptions = ['Tiếng Việt', 'English'] as const;

const tcSelectCls =
  'w-full sm:w-auto border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] bg-white transition-colors min-h-[42px] flex-shrink-0';
const tcSecondaryBtn =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-45 disabled:pointer-events-none';
const tcPrimaryBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C96442] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150';

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
    const percent =
      Number.isInteger(discountPercent) && discountPercent >= 5 ? discountPercent : 10;
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
  const isStep1Valid =
    !!form.title && (form.provider !== 'MINISTRY' || (!!form.subjectId && !!form.schoolGradeId));
  const canSubmit =
    !isLoading &&
    (step === 1
      ? isStep1Valid
      : step === totalSteps
        ? pricingMode === 'free'
          ? isStep1Valid
          : isStep1Valid && isOriginalPriceValid && isDiscountPercentValid && isExpiryDateValid
        : true);

  return (
    <div className="modal-overlay create-course-modal">
      <button type="button" className="modal-backdrop" onClick={onClose} aria-label="Đóng" />
      <div
        className="modal-box wizard-modal-box create-course-wizard"
        aria-labelledby="create-course-title"
      >
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 id="create-course-title">Tạo {UI_TEXT.COURSE.toLowerCase()} mới</h2>
              <p>
                Bước {step} trên {totalSteps}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="wizard-steps-indicator">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`wizard-step-item ${step === i ? 'active' : ''} ${step > i ? 'completed' : ''}`}
            >
              <div className="wizard-step-circle">{step > i ? <Check size={18} /> : i}</div>
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
                      <p>
                        Chọn phương thức giảng dạy và đặt tên cho {UI_TEXT.COURSE.toLowerCase()} của
                        bạn.
                      </p>
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
                        <p>Bám sát khung Bộ GD. Yêu cầu chọn lớp/môn.</p>
                      </button>
                      <button
                        type="button"
                        className={`provider-card ${form.provider === 'CUSTOM' ? 'is-active' : ''}`}
                        onClick={() =>
                          setForm({ ...form, provider: 'CUSTOM', subjectId: '', schoolGradeId: '' })
                        }
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
                          <label className="form-label">
                            Lớp <span className="required">*</span>
                          </label>
                          <select
                            className="form-select"
                            value={form.schoolGradeId || ''}
                            onChange={(e) => void handleGradeChange(e.target.value)}
                            required
                          >
                            <option value="">-- Chọn lớp --</option>
                            {grades.map((g) => (
                              <option key={g.id} value={g.id}>
                                Lớp {g.gradeLevel} – {g.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">
                            Môn học <span className="required">*</span>
                          </label>
                          <select
                            className="form-select"
                            value={form.subjectId || ''}
                            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                            required
                            disabled={!form.schoolGradeId}
                          >
                            <option value="">-- Chọn môn học --</option>
                            {subjects.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="course-title" className="form-label">
                        Tiêu đề {UI_TEXT.COURSE.toLowerCase()} <span className="required">*</span>
                      </label>
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
                      <p>
                        Mô tả ngắn gọn và chọn hình ảnh đại diện cho {UI_TEXT.COURSE.toLowerCase()}.
                      </p>
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
                            <option key={lang} value={lang}>
                              {lang}
                            </option>
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
                        placeholder="Dành cho học sinh lớp 12..."
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
                      <p>
                        Thiết lập học phí và các chương trình giảm giá cho{' '}
                        {UI_TEXT.COURSE.toLowerCase()} của bạn.
                      </p>
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
                        Khoá học <strong>miễn phí</strong>: không cần nhập giá, giảm giá hay ngày
                        hết hạn. Chọn &quot;Có phí&quot; nếu bạn muốn thiết lập học phí.
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
                            <p
                              className={`form-hint ${!isOriginalPriceValid && originalThousandInput !== '' ? 'is-error' : ''}`}
                            >
                              Chỉ nhập số nguyên dương (nghìn VND), ví dụ 10 tương ứng 10.000 VND.
                            </p>
                          </div>
                          <div className="form-group">
                            <label className="form-label" htmlFor="create-discount-pct">
                              Phần trăm giảm giá (%)
                            </label>
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
                            <strong>{form.discountedPrice?.toLocaleString('vi-VN')}₫</strong>
                          </div>
                          <div className="pricing-summary-row">
                            <span>Tiết kiệm cho học viên:</span>
                            <span className="pricing-summary-savings">
                              {(
                                Number(form.originalPrice) - Number(form.discountedPrice)
                              ).toLocaleString('vi-VN')}
                              ₫ ({discountPercent}%)
                            </span>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="create-discount-expiry">
                            Ngày hết hạn giảm giá
                          </label>
                          <input
                            id="create-discount-expiry"
                            className="form-input"
                            type="date"
                            min={todayDate}
                            value={expiryDateValue}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                discountExpiryDate: e.target.value
                                  ? new Date(e.target.value).toISOString()
                                  : '',
                              })
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
              {step === 1 ? (
                'Hủy bỏ'
              ) : (
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

  const getNormalizedStatus = (
    course: CourseResponse
  ): 'published' | 'pending_review' | 'draft' | 'rejected' | 'archived' => {
    if (course.status === 'ARCHIVED') return 'archived';
    if (course.status === 'REJECTED') return 'rejected';
    if (course.published || course.status === 'PUBLISHED') return 'published';
    if (course.status === 'PENDING_REVIEW') return 'pending_review';
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
      else if (filterStatus === 'pending_review')
        statusMatch = normalizedStatus === 'pending_review';
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
      pendingReview: courses.filter((c) => getNormalizedStatus(c) === 'pending_review').length,
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

    createMutation.mutate(
      { data: sanitizedData, thumbnailFile },
      {
        onSuccess: () => setShowCreateModal(false),
      }
    );
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
    { id: 'pending_review' as const, label: `Chờ duyệt (${stats.pendingReview})` },
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
      <div className="px-6 py-8 lg:px-8 w-full min-w-0">
        <div className="module-layout-container">
          <section className="module-page teacher-courses-page teacher-courses-index-page space-y-6 min-w-0">
            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] flex-shrink-0">
                  <BookOpen className="w-5 h-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                      {UI_TEXT.COURSE}
                    </h1>
                    {!isLoading && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                        {courses.length}
                      </span>
                    )}
                  </div>
                  <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                    {stats.active} đang hoạt động • {stats.students} học viên
                  </p>
                </div>
              </div>
              <button type="button" className={tcPrimaryBtn} onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4" />
                Tạo {UI_TEXT.COURSE.toLowerCase()}
              </button>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {(
                [
                  {
                    label: UI_TEXT.TOTAL_COURSES,
                    value: stats.total,
                    Icon: BookOpen,
                    bg: 'bg-[#EEF2FF]',
                    color: 'text-[#4F7EF7]',
                  },
                  {
                    label: 'Đang hoạt động',
                    value: stats.active,
                    Icon: CheckCircle2,
                    bg: 'bg-[#ECFDF5]',
                    color: 'text-[#2EAD7A]',
                  },
                  {
                    label: 'Bản nháp',
                    value: stats.draft,
                    Icon: FileText,
                    bg: 'bg-[#FFF7ED]',
                    color: 'text-[#E07B39]',
                  },
                  {
                    label: 'Học viên',
                    value: stats.students,
                    Icon: Users,
                    bg: 'bg-[#F5F3FF]',
                    color: 'text-[#9B6FE0]',
                  },
                ] as const
              ).map(({ label, value, Icon, bg, color }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl border border-[#E8E6DC] p-4 flex items-center gap-3"
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-4 h-4 ${color}`} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] leading-none tabular-nums">
                      {value}
                    </p>
                    <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5 truncate">
                      {label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col lg:flex-row lg:items-start gap-3">
                <label className="flex-1 min-w-0 flex items-center gap-3 bg-[#FAF9F5] border border-[#E8E6DC] rounded-xl px-4 py-2.5 focus-within:border-[#3898EC] focus-within:shadow-[0_0_0_3px_rgba(56,152,236,0.12)] transition-all duration-150">
                  <Search className="text-[#87867F] w-4 h-4 flex-shrink-0" aria-hidden />
                  <input
                    className="flex-1 min-w-0 font-[Be_Vietnam_Pro] text-[14px] text-[#141413] placeholder:text-[#87867F] bg-transparent outline-none"
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
                      aria-label="Xóa nội dung tìm kiếm"
                      onClick={() => setSearch('')}
                      className="text-[#87867F] hover:text-[#141413] transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </label>

                <select
                  className={tcSelectCls}
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
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
                <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl flex-1 min-w-0">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setFilterStatus(tab.id);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
                        filterStatus === tab.id
                          ? 'bg-white text-[#141413] shadow-sm'
                          : 'text-[#87867F] hover:text-[#5E5D59]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {courses.length > 0 && (
                  <div className="flex items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl flex-shrink-0 sm:ml-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('grid');
                        setCurrentPage(1);
                      }}
                      aria-label="Hiển thị lưới"
                      title="Lưới"
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
                        viewMode === 'grid'
                          ? 'bg-white shadow-md text-[#141413]'
                          : 'bg-[#E8E6DC] border-2 border-[#D1CFC5] text-[#141413] hover:bg-[#DDD9CC]'
                      }`}
                    >
                      <Grid2x2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('list');
                        setCurrentPage(1);
                      }}
                      aria-label="Hiển thị danh sách"
                      title="Danh sách"
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
                        viewMode === 'list'
                          ? 'bg-white shadow-md text-[#141413]'
                          : 'bg-[#E8E6DC] border-2 border-[#D1CFC5] text-[#141413] hover:bg-[#DDD9CC]'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Summary bar ── */}
            {!isLoading && !error && courses.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DC]">
                <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] uppercase tracking-wide">
                  Hiển thị
                </span>
                <strong className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413] tabular-nums">
                  {paginatedCourses.length} / {filteredCourses.length}
                </strong>
                <div className="w-px h-4 bg-[#E8E6DC] hidden sm:block" aria-hidden />
                <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Công khai{' '}
                  <strong className="text-[#141413] font-semibold tabular-nums">{stats.active}</strong>
                </span>
                <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  Nháp{' '}
                  <strong className="text-[#141413] font-semibold tabular-nums">{stats.draft}</strong>
                </span>
              </div>
            )}

            {/* ── Loading ── */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] h-52 animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* ── Error ── */}
            {error && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-400">
                  <AlertCircle className="w-6 h-6" aria-hidden />
                </div>
                <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#B53333] text-center max-w-md px-4">
                  Không thể tải {UI_TEXT.COURSE.toLowerCase()}. Vui lòng thử lại.
                </p>
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
                    <div className="cover-index">
                      #{String((safeCurrentPage - 1) * PAGE_SIZE + idx + 1).padStart(2, '0')}
                    </div>
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
                        <>
                          <CheckCircle2 size={11} /> Chờ duyệt
                        </>
                      ) : course.status === 'REJECTED' ? (
                        <>
                          <AlertCircle size={11} /> Bị từ chối
                        </>
                      ) : course.status === 'ARCHIVED' ? (
                        <>
                          <BookOpen size={11} /> Đã lưu trữ
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
                      {course.description ||
                        `Chưa có mô tả cho ${UI_TEXT.COURSE.toLowerCase()} này.`}
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
                        onClick={() => navigate(`/teacher/courses/${course.id}/review`)}
                      >
                        <Settings2 size={14} /> Quản lý
                      </button>
                      {!course.published &&
                        course.status !== 'PENDING_REVIEW' &&
                        course.status !== 'ARCHIVED' && (
                          <button
                            className="action-toggle"
                            onClick={() => handleSubmitForReview(course)}
                            disabled={submitReviewMutation.isPending}
                            title="Gửi khóa học để admin phê duyệt"
                          >
                            <CheckCircle2 size={14} /> Gửi duyệt
                          </button>
                        )}
                      {/* Published courses cannot be unpublished — backend intentionally blocks it.
                          Only show the toggle button for non-published courses that are approved (PUBLISHED status). */}
                      {!course.published && (
                        <button
                          className="action-toggle"
                          onClick={() => handleTogglePublish(course)}
                          disabled={publishMutation.isPending || course.status !== 'PUBLISHED'}
                          title={
                            course.status !== 'PUBLISHED'
                              ? 'Khóa học cần được admin duyệt trước khi công khai'
                              : 'Công khai khóa học'
                          }
                        >
                          <Eye size={14} /> Công khai
                        </button>
                      )}
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
            <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
              <button
                type="button"
                className={tcSecondaryBtn}
                onClick={() => setCurrentPage((p) => Math.max(1, Math.min(totalPages, p) - 1))}
                disabled={safeCurrentPage === 1}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Trước
              </button>
              <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59] tabular-nums">
                Trang <strong className="text-[#141413]">{safeCurrentPage}</strong> / {totalPages}
              </span>
              <button
                type="button"
                className={tcSecondaryBtn}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, Math.min(totalPages, p) + 1))
                }
                disabled={safeCurrentPage === totalPages}
              >
                Sau <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── Empty: filtered ── */}
          {!isLoading && !error && filteredCourses.length === 0 && courses.length > 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2 px-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F5F4ED] flex items-center justify-center text-[#87867F]">
                <Search className="w-6 h-6 opacity-60" aria-hidden />
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F] text-center max-w-md">
                Không tìm thấy {UI_TEXT.COURSE.toLowerCase()}
                {search ? ` khớp với "${search}"` : ' với bộ lọc này'}.
              </p>
            </div>
          )}

          {/* ── Empty: no courses ── */}
          {!isLoading && !error && courses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F5F4ED] flex items-center justify-center text-[#87867F]">
                <BookOpen className="w-6 h-6 opacity-60" aria-hidden />
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F] text-center max-w-md">
                Bạn chưa có {UI_TEXT.COURSE.toLowerCase()} nào. Hãy tạo{' '}
                {UI_TEXT.COURSE.toLowerCase()} để bắt đầu giảng dạy.
              </p>
              <button type="button" className={tcPrimaryBtn} onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4" /> Tạo {UI_TEXT.COURSE.toLowerCase()} đầu tiên
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
      </div>
    </DashboardLayout>
  );
};

export default TeacherCourses;
