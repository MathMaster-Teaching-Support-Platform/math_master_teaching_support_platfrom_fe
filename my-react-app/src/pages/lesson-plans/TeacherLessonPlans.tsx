import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ClipboardList,
  FileText,
  Grid2x2,
  List,
  Pencil,
  Plus,
  Search,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useCreateLessonPlan,
  useDeleteLessonPlan,
  useMyLessonPlans,
  useUpdateLessonPlan,
} from '../../hooks/useLessonPlans';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import '../../styles/module-refactor.css';
import type {
  CreateLessonPlanRequest,
  LessonPlanResponse,
  UpdateLessonPlanRequest,
} from '../../types';
import type {
  ChapterBySubject,
  LessonByChapter,
  SchoolGrade,
  SubjectByGrade,
} from '../../types/lessonSlide.types';
import '../courses/TeacherCourses.css';
import './TeacherLessonPlans.css';

const PAGE_SIZE = 9;

const coverGradients = [
  'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
  'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
  'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
] as const;

const coverAccents = ['#1d4ed8', '#047857', '#6d28d9', '#c2410c', '#0f766e', '#be185d'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const splitLines = (val: string) =>
  val
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Auto-resize textarea ────────────────────────────────────────────────────

function AutoTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [value]);

  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ overflow: 'hidden', resize: 'none' }}
    />
  );
}

// ─── Create Modal (with cascading selectors) ──────────────────────────────────

function CreateLessonPlanModal({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: () => void;
  onSubmit: (data: CreateLessonPlanRequest) => void;
  isLoading: boolean;
}) {
  // Cascading state
  const [gradeId, setGradeId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<LessonByChapter | null>(null);
  const gradesQuery = useQuery({
    queryKey: ['lesson-slide', 'school-grades', 'lesson-plans-modal'],
    queryFn: () => LessonSlideService.getSchoolGrades(true),
    staleTime: 5 * 60_000,
  });
  const subjectsQuery = useQuery({
    queryKey: ['lesson-slide', 'subjects-by-grade', gradeId, 'lesson-plans-modal'],
    queryFn: () => LessonSlideService.getSubjectsBySchoolGrade(gradeId),
    enabled: !!gradeId,
    staleTime: 5 * 60_000,
  });
  const chaptersQuery = useQuery({
    queryKey: ['lesson-slide', 'chapters-by-subject', subjectId, 'lesson-plans-modal'],
    queryFn: () => LessonSlideService.getChaptersBySubject(subjectId),
    enabled: !!subjectId,
    staleTime: 5 * 60_000,
  });
  const lessonsQuery = useQuery({
    queryKey: ['lesson-slide', 'lessons-by-chapter', chapterId, 'lesson-plans-modal'],
    queryFn: () => LessonSlideService.getLessonsByChapter(chapterId),
    enabled: !!chapterId,
    staleTime: 5 * 60_000,
  });
  const grades: SchoolGrade[] = gradesQuery.data?.result || [];
  const subjects: SubjectByGrade[] = subjectsQuery.data?.result || [];
  const chapters: ChapterBySubject[] = chaptersQuery.data?.result || [];
  const lessons: LessonByChapter[] = lessonsQuery.data?.result || [];
  const loadingGrades = gradesQuery.isLoading || gradesQuery.isFetching;
  const loadingSubjects = subjectsQuery.isLoading || subjectsQuery.isFetching;
  const loadingChapters = chaptersQuery.isLoading || chaptersQuery.isFetching;
  const loadingLessons = lessonsQuery.isLoading || lessonsQuery.isFetching;

  // Form fields
  const [objectives, setObjectives] = useState('');
  const [materials, setMaterials] = useState('');
  const [strategy, setStrategy] = useState('');
  const [assessment, setAssessment] = useState('');
  const [notes, setNotes] = useState('');

  // Step: 1 = chọn bài học, 2 = điền nội dung
  const [step, setStep] = useState(1);

  const handleGradeChange = (val: string) => {
    setGradeId(val);
    setSubjectId('');
    setChapterId('');
    setLessonId('');
    setSelectedLesson(null);
  };

  const handleSubjectChange = (val: string) => {
    setSubjectId(val);
    setChapterId('');
    setLessonId('');
    setSelectedLesson(null);
  };

  const handleChapterChange = (val: string) => {
    setChapterId(val);
    setLessonId('');
    setSelectedLesson(null);
  };

  const handleLessonChange = (val: string) => {
    setLessonId(val);
    setSelectedLesson(lessons.find((l) => l.id === val) ?? null);
  };

  function handleSubmit() {
    onSubmit({
      lessonId,
      objectives: splitLines(objectives),
      materialsNeeded: splitLines(materials),
      teachingStrategy: strategy.trim() || undefined,
      assessmentMethods: assessment.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  const totalSteps = 2;

  return (
    <div className="modal-overlay create-course-modal" lang="vi">
      <button type="button" className="modal-backdrop" onClick={onClose} aria-label="Đóng" />
      <div
        className="modal-box wizard-modal-box create-course-wizard lesson-plan-create-wizard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lp-create-title"
      >
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon" aria-hidden>
              <BookOpen size={18} />
            </div>
            <div>
              <h2 id="lp-create-title">Soạn giáo án mới</h2>
              <p>
                Bước {step} trên {totalSteps}
                {selectedLesson && step === 2 ? ` · ${selectedLesson.title}` : ''}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="wizard-steps-indicator">
          <div
            className={`wizard-step-item ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}
          >
            <div className="wizard-step-circle">{step > 1 ? <Check size={18} /> : 1}</div>
            <span className="wizard-step-label">Chọn bài học</span>
          </div>
          <div className={`wizard-step-item ${step === 2 ? 'active' : ''}`}>
            <div className="wizard-step-circle">2</div>
            <span className="wizard-step-label">Soạn nội dung</span>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step === 2) void handleSubmit();
          }}
          className="modal-form"
        >
          <div className="wizard-content-wrapper">
            {step === 1 && (
              <div className="wizard-step-content">
                <div className="form-section-header">
                  <h3>Chọn bài học</h3>
                  <p>Chọn lớp, môn, chương và bài học tương ứng với tiết cần soạn giáo án.</p>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="lp-grade">
                    Lớp <span className="required">*</span>
                  </label>
                  <select
                    id="lp-grade"
                    className="form-select"
                    value={gradeId}
                    onChange={(e) => handleGradeChange(e.target.value)}
                    disabled={loadingGrades}
                  >
                    <option value="">{loadingGrades ? 'Đang tải...' : '-- Chọn lớp --'}</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        Lớp {g.gradeLevel} – {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                {gradeId ? (
                  <div className="form-group">
                    <label className="form-label" htmlFor="lp-subject">
                      Môn học <span className="required">*</span>
                    </label>
                    <select
                      id="lp-subject"
                      className="form-select"
                      value={subjectId}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      disabled={loadingSubjects}
                    >
                      <option value="">{loadingSubjects ? 'Đang tải...' : '-- Chọn môn --'}</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {subjectId ? (
                  <div className="form-group">
                    <label className="form-label" htmlFor="lp-chapter">
                      Chương <span className="required">*</span>
                    </label>
                    <select
                      id="lp-chapter"
                      className="form-select"
                      value={chapterId}
                      onChange={(e) => handleChapterChange(e.target.value)}
                      disabled={loadingChapters}
                    >
                      <option value="">
                        {loadingChapters ? 'Đang tải...' : '-- Chọn chương --'}
                      </option>
                      {chapters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.orderIndex}. {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {chapterId ? (
                  <div className="form-group">
                    <label className="form-label" htmlFor="lp-lesson">
                      Bài học <span className="required">*</span>
                    </label>
                    <select
                      id="lp-lesson"
                      className="form-select"
                      value={lessonId}
                      onChange={(e) => handleLessonChange(e.target.value)}
                      disabled={loadingLessons}
                    >
                      <option value="">
                        {loadingLessons ? 'Đang tải...' : '-- Chọn bài học --'}
                      </option>
                      {lessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.orderIndex}. {l.title}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {selectedLesson ? (
                  <div className="lp-create-selected" role="status">
                    <BookOpen size={16} />
                    <span>
                      Đã chọn: <strong>{selectedLesson.title}</strong>
                    </span>
                  </div>
                ) : null}
              </div>
            )}

            {step === 2 && (
              <div className="wizard-step-content">
                <div className="form-section-header">
                  <h3>Soạn nội dung</h3>
                  <p>Điền mục tiêu, tài liệu và phương pháp — có thể bỏ trống và cập nhật sau.</p>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="lp-objectives">
                    Mục tiêu bài học
                  </label>
                  <p className="form-hint">Mỗi dòng một mục tiêu.</p>
                  <textarea
                    id="lp-objectives"
                    className="form-textarea"
                    rows={4}
                    placeholder={
                      'Học sinh hiểu được khái niệm phương trình bậc nhất\nHọc sinh vận dụng giải được bài tập cơ bản'
                    }
                    value={objectives}
                    onChange={(e) => setObjectives(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="lp-materials">
                    Tài liệu & thiết bị cần thiết
                  </label>
                  <p className="form-hint">Mỗi dòng một mục.</p>
                  <textarea
                    id="lp-materials"
                    className="form-textarea"
                    rows={3}
                    placeholder={'Sách giáo khoa Toán 9 trang 45\nBảng phụ\nMáy chiếu'}
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="lp-strategy">
                    Phương pháp giảng dạy
                  </label>
                  <textarea
                    id="lp-strategy"
                    className="form-textarea"
                    rows={3}
                    placeholder="Thuyết trình kết hợp thảo luận nhóm, đặt câu hỏi gợi mở..."
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="lp-assessment">
                    Phương pháp đánh giá
                  </label>
                  <textarea
                    id="lp-assessment"
                    className="form-textarea"
                    rows={2}
                    placeholder="Kiểm tra miệng đầu giờ, bài tập về nhà trang 48..."
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="lp-notes">
                    Ghi chú thêm
                  </label>
                  <textarea
                    id="lp-notes"
                    className="form-textarea"
                    rows={2}
                    placeholder="Lưu ý đặc biệt cho tiết học này..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="wizard-footer">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  className="btn btn-sand"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="btn btn-terracotta"
                  disabled={!lessonId || isLoading}
                  onClick={() => setStep(2)}
                >
                  Tiếp theo <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-sand"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                >
                  <ArrowLeft size={16} /> Quay lại
                </button>
                <button
                  type="button"
                  className="btn btn-terracotta"
                  disabled={isLoading}
                  onClick={handleSubmit}
                >
                  {isLoading ? (
                    <>
                      <span className="btn-spinner" /> Đang tạo...
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Tạo giáo án
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditLessonPlanModal({
  initial,
  idx,
  onClose,
  onSubmit,
  isLoading,
}: {
  initial: LessonPlanResponse;
  idx: number;
  onClose: () => void;
  onSubmit: (data: UpdateLessonPlanRequest) => void;
  isLoading: boolean;
}) {
  const [objectives, setObjectives] = useState(initial.objectives?.join('\n') ?? '');
  const [materials, setMaterials] = useState(initial.materialsNeeded?.join('\n') ?? '');
  const [strategy, setStrategy] = useState(initial.teachingStrategy ?? '');
  const [assessment, setAssessment] = useState(initial.assessmentMethods ?? '');
  const [notes, setNotes] = useState(initial.notes ?? '');

  const gradient = coverGradients[idx % coverGradients.length];
  const accent = coverAccents[idx % coverAccents.length];

  return (
    <div className="lp-modal-overlay">
      <div className="lp-modal">
        {/* ── Hero strip ── */}
        <div className="lp-edit-hero" style={{ background: gradient }}>
          <div className="lp-detail-hero-overlay" />
          <button className="lp-modal-close lp-detail-close" onClick={onClose} aria-label="Đóng">
            ×
          </button>
          <div className="lp-edit-hero-label">
            <Pencil size={13} />
            Chỉnh sửa giáo án
          </div>
          <h3 className="lp-detail-hero-title" style={{ color: accent }}>
            {initial.lessonTitle ?? 'Giáo án'}
          </h3>
        </div>

        <div className="lp-modal-body lp-edit-body">
          {/* ── Mục tiêu ── */}
          <div className="lp-edit-group lp-eg--blue">
            <div className="lp-edit-group-header">
              <span className="lp-detail-icon-wrap lp-di--blue">
                <Target size={14} />
              </span>
              <span className="lp-edit-group-title">Mục tiêu bài học</span>
              <span className="lp-edit-group-hint">mỗi dòng một mục tiêu</span>
            </div>
            <AutoTextarea
              className="lp-textarea lp-textarea--blue"
              placeholder={'Học sinh hiểu được...\nHọc sinh vận dụng được...'}
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
            />
          </div>

          {/* ── Tài liệu ── */}
          <div className="lp-edit-group lp-eg--amber">
            <div className="lp-edit-group-header">
              <span className="lp-detail-icon-wrap lp-di--amber">
                <BookOpen size={14} />
              </span>
              <span className="lp-edit-group-title">Tài liệu & thiết bị</span>
              <span className="lp-edit-group-hint">mỗi dòng một mục</span>
            </div>
            <AutoTextarea
              className="lp-textarea lp-textarea--amber"
              placeholder={'Sách giáo khoa trang 45\nBảng phụ'}
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
            />
          </div>

          {/* ── Phương pháp giảng dạy ── */}
          <div className="lp-edit-group lp-eg--emerald">
            <div className="lp-edit-group-header">
              <span className="lp-detail-icon-wrap lp-di--emerald">
                <ClipboardList size={14} />
              </span>
              <span className="lp-edit-group-title">Phương pháp giảng dạy</span>
            </div>
            <AutoTextarea
              className="lp-textarea lp-textarea--emerald"
              placeholder="Thuyết trình kết hợp thảo luận nhóm, đặt câu hỏi gợi mở..."
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
            />
          </div>

          {/* ── Phương pháp đánh giá ── */}
          <div className="lp-edit-group lp-eg--violet">
            <div className="lp-edit-group-header">
              <span className="lp-detail-icon-wrap lp-di--violet">
                <FileText size={14} />
              </span>
              <span className="lp-edit-group-title">Phương pháp đánh giá</span>
            </div>
            <AutoTextarea
              className="lp-textarea lp-textarea--violet"
              placeholder="Kiểm tra miệng đầu giờ, bài tập về nhà..."
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
            />
          </div>

          {/* ── Ghi chú ── */}
          <div className="lp-edit-group lp-eg--orange">
            <div className="lp-edit-group-header">
              <span className="lp-detail-icon-wrap lp-di--orange">
                <Pencil size={14} />
              </span>
              <span className="lp-edit-group-title">Ghi chú thêm</span>
            </div>
            <AutoTextarea
              className="lp-textarea lp-textarea--orange"
              placeholder="Lưu ý đặc biệt cho tiết học này..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="lp-modal-footer">
          <button className="lp-btn lp-btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button
            className="lp-btn lp-btn-primary"
            disabled={isLoading}
            onClick={() =>
              onSubmit({
                objectives: splitLines(objectives),
                materialsNeeded: splitLines(materials),
                teachingStrategy: strategy.trim() || undefined,
                assessmentMethods: assessment.trim() || undefined,
                notes: notes.trim() || undefined,
              })
            }
          >
            {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function LessonPlanDetail({
  plan,
  onClose,
  onEdit,
}: {
  plan: LessonPlanResponse;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="modal-overlay create-course-modal" lang="vi">
      <button type="button" className="modal-backdrop" onClick={onClose} aria-label="Đóng" />
      <div
        className="modal-box wizard-modal-box create-course-wizard lesson-plan-view-wizard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lp-view-title"
      >
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon" aria-hidden>
              <BookOpen size={18} />
            </div>
            <div>
              <h2 id="lp-view-title">{plan.lessonTitle ?? 'Chi tiết giáo án'}</h2>
              <p>
                <span className="lp-view-meta">
                  <CalendarDays size={14} aria-hidden />
                  Cập nhật {fmtDate(plan.updatedAt)}
                </span>
              </p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="modal-form">
          <div className="wizard-content-wrapper">
            <div className="lp-view-body">
              {plan.objectives && plan.objectives.length > 0 && (
                <div className="lp-detail-section lp-ds--blue">
                  <div className="lp-detail-section-head">
                    <span className="lp-detail-icon-wrap lp-di--blue">
                      <Target size={14} />
                    </span>
                    <p className="lp-detail-section-title">Mục tiêu bài học</p>
                    <span className="lp-detail-count lp-dc--blue">{plan.objectives.length}</span>
                  </div>
                  <ul className="lp-detail-list">
                    {plan.objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.materialsNeeded && plan.materialsNeeded.length > 0 && (
                <div className="lp-detail-section lp-ds--amber">
                  <div className="lp-detail-section-head">
                    <span className="lp-detail-icon-wrap lp-di--amber">
                      <BookOpen size={14} />
                    </span>
                    <p className="lp-detail-section-title">Tài liệu & thiết bị</p>
                    <span className="lp-detail-count lp-dc--amber">
                      {plan.materialsNeeded.length}
                    </span>
                  </div>
                  <ul className="lp-detail-list">
                    {plan.materialsNeeded.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.teachingStrategy && (
                <div className="lp-detail-section lp-ds--emerald">
                  <div className="lp-detail-section-head">
                    <span className="lp-detail-icon-wrap lp-di--emerald">
                      <ClipboardList size={14} />
                    </span>
                    <p className="lp-detail-section-title">Phương pháp giảng dạy</p>
                  </div>
                  <p className="lp-detail-text">{plan.teachingStrategy}</p>
                </div>
              )}

              {plan.assessmentMethods && (
                <div className="lp-detail-section lp-ds--violet">
                  <div className="lp-detail-section-head">
                    <span className="lp-detail-icon-wrap lp-di--violet">
                      <FileText size={14} />
                    </span>
                    <p className="lp-detail-section-title">Phương pháp đánh giá</p>
                  </div>
                  <p className="lp-detail-text">{plan.assessmentMethods}</p>
                </div>
              )}

              {plan.notes && (
                <div className="lp-detail-section lp-ds--orange">
                  <div className="lp-detail-section-head">
                    <span className="lp-detail-icon-wrap lp-di--orange">
                      <Pencil size={14} />
                    </span>
                    <p className="lp-detail-section-title">Ghi chú</p>
                  </div>
                  <p className="lp-detail-text">{plan.notes}</p>
                </div>
              )}

              {!plan.objectives?.length &&
                !plan.materialsNeeded?.length &&
                !plan.teachingStrategy &&
                !plan.assessmentMethods &&
                !plan.notes && (
                  <div className="lp-detail-empty lp-view-empty">
                    <ClipboardList size={28} aria-hidden />
                    <p>Giáo án này chưa có nội dung chi tiết.</p>
                  </div>
                )}
            </div>
          </div>

          <div className="wizard-footer">
            <button type="button" className="btn btn-sand" onClick={onClose}>
              Đóng
            </button>
            <button type="button" className="btn btn-terracotta" onClick={onEdit}>
              <Pencil size={16} />
              Chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TeacherLessonPlans() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'withObjectives' | 'withMaterials'>(
    'all'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<LessonPlanResponse | null>(null);
  const [viewing, setViewing] = useState<LessonPlanResponse | null>(null);

  const { data, isLoading, isError, error } = useMyLessonPlans();
  const createMutation = useCreateLessonPlan();
  const updateMutation = useUpdateLessonPlan();
  const deleteMutation = useDeleteLessonPlan();

  const plans = useMemo(() => data?.result ?? [], [data]);

  const filtered = useMemo(() => {
    return plans.filter((p) => {
      let statusMatch = true;
      if (filterStatus === 'withObjectives')
        statusMatch = !!(p.objectives && p.objectives.length > 0);
      else if (filterStatus === 'withMaterials')
        statusMatch = !!(p.materialsNeeded && p.materialsNeeded.length > 0);

      const q = search.toLowerCase();
      const searchMatch =
        !q ||
        p.lessonTitle?.toLowerCase().includes(q) ||
        p.teachingStrategy?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q);

      return statusMatch && searchMatch;
    });
  }, [plans, filterStatus, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedFiltered = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safeCurrentPage]);

  const stats = useMemo(
    () => ({
      total: plans.length,
      withObjectives: plans.filter((p) => p.objectives && p.objectives.length > 0).length,
      withMaterials: plans.filter((p) => p.materialsNeeded && p.materialsNeeded.length > 0).length,
      withNotes: plans.filter((p) => p.notes).length,
    }),
    [plans]
  );

  const filterTabs = [
    { id: 'all' as const, label: `Tất cả (${stats.total})` },
    { id: 'withObjectives' as const, label: `Có mục tiêu (${stats.withObjectives})` },
    { id: 'withMaterials' as const, label: `Có tài liệu (${stats.withMaterials})` },
  ];

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Giáo viên', avatar: '', role: 'teacher' }}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container">
        <section className="module-page teacher-courses-page teacher-lesson-plans-page">
          {/* ── Header (aligned with Giáo trình) ── */}
          <header className="page-header courses-header-row">
            <div className="header-stack">
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Giáo án</h2>
                {!isLoading && <span className="count-chip">{plans.length}</span>}
              </div>
              <p className="header-sub">
                {stats.withObjectives} có mục tiêu • {stats.total} giáo án
              </p>
            </div>
            <button type="button" className="btn" onClick={() => setOpenCreate(true)}>
              <Plus size={16} />
              Soạn giáo án mới
            </button>
          </header>

          {/* ── Stats ── */}
          <div className="stats-grid">
            <div className="stat-card stat-blue">
              <div className="stat-icon-wrap" aria-hidden>
                <ClipboardList size={20} />
              </div>
              <div>
                <h3>{stats.total}</h3>
                <p>Tổng giáo án</p>
              </div>
            </div>
            <div className="stat-card stat-emerald">
              <div className="stat-icon-wrap" aria-hidden>
                <Target size={20} />
              </div>
              <div>
                <h3>{stats.withObjectives}</h3>
                <p>Có mục tiêu</p>
              </div>
            </div>
            <div className="stat-card stat-amber">
              <div className="stat-icon-wrap" aria-hidden>
                <BookOpen size={20} />
              </div>
              <div>
                <h3>{stats.withMaterials}</h3>
                <p>Có tài liệu</p>
              </div>
            </div>
            <div className="stat-card stat-violet">
              <div className="stat-icon-wrap" aria-hidden>
                <FileText size={20} />
              </div>
              <div>
                <h3>{stats.withNotes}</h3>
                <p>Có ghi chú</p>
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
                placeholder="Tìm theo tên bài học, phương pháp..."
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
                  onClick={() => {
                    setSearch('');
                    setCurrentPage(1);
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </label>

            <div className="pill-group">
              {filterTabs.map((tab) => (
                <button
                  type="button"
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
                type="button"
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => {
                  setViewMode('grid');
                  setCurrentPage(1);
                }}
                aria-label="Hiển thị dạng lưới"
              >
                <Grid2x2 size={16} />
              </button>
              <button
                type="button"
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => {
                  setViewMode('list');
                  setCurrentPage(1);
                }}
                aria-label="Hiển thị dạng danh sách"
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* ── Summary bar ── */}
          {!isLoading && !isError && plans.length > 0 && (
            <div className="assessment-summary-bar">
              <div className="summary-item summary-item--primary">
                <span className="summary-label">Hiển thị</span>
                <strong className="summary-value">
                  {paginatedFiltered.length} / {filtered.length}
                </strong>
              </div>
              <div className="summary-item">
                <span className="summary-dot summary-dot--progress" />
                <span className="summary-label">Có mục tiêu</span>
                <strong className="summary-value">{stats.withObjectives}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-dot summary-dot--completed" />
                <span className="summary-label">Có tài liệu</span>
                <strong className="summary-value">{stats.withMaterials}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-dot summary-dot--upcoming" />
                <span className="summary-label">Có ghi chú</span>
                <strong className="summary-value">{stats.withNotes}</strong>
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
          {isError && (
            <div className="empty">
              <AlertCircle
                size={28}
                style={{ opacity: 0.5, marginBottom: 8, color: 'var(--mod-danger)' }}
              />
              <p>{error instanceof Error ? error.message : 'Không thể tải danh sách giáo án.'}</p>
            </div>
          )}

          {/* ── Grid ── */}
          {!isLoading && !isError && filtered.length > 0 && (
            <div className={`grid-cards${viewMode === 'list' ? ' list-view' : ''}`}>
              {paginatedFiltered.map((plan, idx) => {
                const gIdx = (safeCurrentPage - 1) * PAGE_SIZE + idx;
                return (
                  <article key={plan.id} className="data-card course-card lp-plan-card">
                    <div
                      className="course-cover lp-plan-cover"
                      style={{
                        background: coverGradients[gIdx % coverGradients.length],
                        color: coverAccents[gIdx % coverAccents.length],
                      }}
                    >
                      <div className="cover-overlay" />
                      <div className="cover-index">#{String(gIdx + 1).padStart(2, '0')}</div>
                      <span className="lp-date-badge">
                        <CalendarDays size={11} />
                        {fmtDate(plan.updatedAt)}
                      </span>
                      <h3 className="cover-title">
                        {plan.lessonTitle ?? `Bài học: ${plan.lessonId.slice(0, 8)}…`}
                      </h3>
                    </div>

                    <div className="course-body">
                      <p className="course-desc">
                        {plan.teachingStrategy || 'Chưa có phương pháp giảng dạy cho giáo án này.'}
                      </p>

                      <div className="course-metrics">
                        {plan.objectives && plan.objectives.length > 0 && (
                          <div className="metric">
                            <Target size={13} />
                            <span>{plan.objectives.length} mục tiêu</span>
                          </div>
                        )}
                        {plan.materialsNeeded && plan.materialsNeeded.length > 0 && (
                          <div className="metric">
                            <BookOpen size={13} />
                            <span>{plan.materialsNeeded.length} tài liệu</span>
                          </div>
                        )}
                        {plan.notes && (
                          <div className="metric">
                            <FileText size={13} />
                            <span>Có ghi chú</span>
                          </div>
                        )}
                      </div>

                      {plan.objectives && plan.objectives.length > 0 && (
                        <div className="lp-objectives">
                          {plan.objectives.slice(0, 2).map((obj, i) => (
                            <span key={i} className="lp-obj-chip" title={obj}>
                              {obj}
                            </span>
                          ))}
                          {plan.objectives.length > 2 && (
                            <span className="lp-obj-more">
                              +{plan.objectives.length - 2} mục tiêu
                            </span>
                          )}
                        </div>
                      )}

                      <div className="course-actions">
                        <button
                          type="button"
                          className="action-primary"
                          onClick={() => setViewing(plan)}
                        >
                          <BookOpen size={14} /> Xem chi tiết
                        </button>
                        <button
                          type="button"
                          className="action-toggle"
                          onClick={() => setEditing(plan)}
                        >
                          <Pencil size={14} /> Sửa
                        </button>
                        <button
                          type="button"
                          className="action-danger"
                          onClick={() => {
                            if (globalThis.confirm('Bạn có chắc muốn xóa giáo án này không?')) {
                              deleteMutation.mutate(plan.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          aria-label="Xóa giáo án"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!isLoading && !isError && filtered.length > PAGE_SIZE && (
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
              >
                Sau <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* ── Empty: filtered ── */}
          {!isLoading && !isError && filtered.length === 0 && plans.length > 0 && (
            <div className="empty">
              <Search size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>Không tìm thấy giáo án{search ? ` khớp với "${search}"` : ' với bộ lọc này'}.</p>
            </div>
          )}

          {/* ── Empty: no plans ── */}
          {!isLoading && !isError && plans.length === 0 && (
            <div className="empty">
              <ClipboardList size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>Bạn chưa có giáo án nào. Hãy soạn giáo án để bắt đầu giảng dạy.</p>
              <button type="button" className="btn" onClick={() => setOpenCreate(true)}>
                <Plus size={16} /> Soạn giáo án đầu tiên
              </button>
            </div>
          )}
        </section>

        {/* Modals bên trong .module-layout-container để CSS create-course (warm, terracotta) áp dụng đúng */}
        {openCreate && (
          <CreateLessonPlanModal
            onClose={() => setOpenCreate(false)}
            onSubmit={async (payload) => {
              await createMutation.mutateAsync(payload);
              setOpenCreate(false);
            }}
            isLoading={createMutation.isPending}
          />
        )}

        {editing && (
          <EditLessonPlanModal
            initial={editing}
            idx={plans.findIndex((p) => p.id === editing.id)}
            onClose={() => setEditing(null)}
            onSubmit={async (payload) => {
              await updateMutation.mutateAsync({ id: editing.id, data: payload });
              setEditing(null);
            }}
            isLoading={updateMutation.isPending}
          />
        )}

        {viewing && (
          <LessonPlanDetail
            plan={viewing}
            onClose={() => setViewing(null)}
            onEdit={() => {
              setEditing(viewing);
              setViewing(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
