import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
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
import './TeacherLessonPlans.css';

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
  const [grades, setGrades] = useState<SchoolGrade[]>([]);
  const [subjects, setSubjects] = useState<SubjectByGrade[]>([]);
  const [chapters, setChapters] = useState<ChapterBySubject[]>([]);
  const [lessons, setLessons] = useState<LessonByChapter[]>([]);

  const [gradeId, setGradeId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<LessonByChapter | null>(null);

  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);

  // Form fields
  const [objectives, setObjectives] = useState('');
  const [materials, setMaterials] = useState('');
  const [strategy, setStrategy] = useState('');
  const [assessment, setAssessment] = useState('');
  const [notes, setNotes] = useState('');

  // Step: 1 = chọn bài học, 2 = điền nội dung
  const [step, setStep] = useState(1);

  useEffect(() => {
    setLoadingGrades(true);
    LessonSlideService.getSchoolGrades(true)
      .then((r) => setGrades(r.result || []))
      .catch(() => {})
      .finally(() => setLoadingGrades(false));
  }, []);

  const handleGradeChange = async (val: string) => {
    setGradeId(val);
    setSubjectId('');
    setChapterId('');
    setLessonId('');
    setSubjects([]);
    setChapters([]);
    setLessons([]);
    setSelectedLesson(null);
    if (!val) return;
    setLoadingSubjects(true);
    try {
      const r = await LessonSlideService.getSubjectsBySchoolGrade(val);
      setSubjects(r.result || []);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleSubjectChange = async (val: string) => {
    setSubjectId(val);
    setChapterId('');
    setLessonId('');
    setChapters([]);
    setLessons([]);
    setSelectedLesson(null);
    if (!val) return;
    setLoadingChapters(true);
    try {
      const r = await LessonSlideService.getChaptersBySubject(val);
      setChapters(r.result || []);
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleChapterChange = async (val: string) => {
    setChapterId(val);
    setLessonId('');
    setLessons([]);
    setSelectedLesson(null);
    if (!val) return;
    setLoadingLessons(true);
    try {
      const r = await LessonSlideService.getLessonsByChapter(val);
      setLessons(r.result || []);
    } finally {
      setLoadingLessons(false);
    }
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

  return (
    <div className="lp-modal-overlay">
      <div className="lp-modal">
        <div className="lp-modal-header">
          <div>
            <h3>✏️ Tạo giáo án mới</h3>
            <p>
              {step === 1
                ? 'Bước 1: Chọn bài học cần soạn giáo án'
                : `Bước 2: Soạn nội dung — ${selectedLesson?.title ?? ''}`}
            </p>
          </div>
          <button className="lp-modal-close" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>

        {/* Step indicator */}
        <div className="lp-steps">
          <div className={`lp-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
            <span className="lp-step-dot">1</span>
            <span>Chọn bài học</span>
          </div>
          <ChevronRight size={14} className="lp-step-arrow" />
          <div className={`lp-step ${step >= 2 ? 'active' : ''}`}>
            <span className="lp-step-dot">2</span>
            <span>Soạn nội dung</span>
          </div>
        </div>

        <div className="lp-modal-body">
          {step === 1 && (
            <>
              <div className="lp-field">
                <label>
                  Khối lớp <span>*</span>
                </label>
                <select
                  className="lp-input"
                  value={gradeId}
                  onChange={(e) => void handleGradeChange(e.target.value)}
                  disabled={loadingGrades}
                >
                  <option value="">{loadingGrades ? 'Đang tải...' : '-- Chọn khối --'}</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      Khối {g.gradeLevel} – {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {gradeId && (
                <div className="lp-field">
                  <label>
                    Môn học <span>*</span>
                  </label>
                  <select
                    className="lp-input"
                    value={subjectId}
                    onChange={(e) => void handleSubjectChange(e.target.value)}
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
              )}

              {subjectId && (
                <div className="lp-field">
                  <label>
                    Chương <span>*</span>
                  </label>
                  <select
                    className="lp-input"
                    value={chapterId}
                    onChange={(e) => void handleChapterChange(e.target.value)}
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
              )}

              {chapterId && (
                <div className="lp-field">
                  <label>
                    Bài học <span>*</span>
                  </label>
                  <select
                    className="lp-input"
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
              )}

              {selectedLesson && (
                <div className="lp-selected-lesson">
                  <BookOpen size={14} />
                  <span>
                    Đã chọn: <strong>{selectedLesson.title}</strong>
                  </span>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div className="lp-field">
                <label>
                  Mục tiêu bài học
                  <span className="lp-field-hint">(mỗi dòng một mục tiêu)</span>
                </label>
                <textarea
                  className="lp-textarea"
                  rows={4}
                  placeholder={
                    'Học sinh hiểu được khái niệm phương trình bậc nhất\nHọc sinh vận dụng giải được bài tập cơ bản'
                  }
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                />
              </div>

              <div className="lp-field">
                <label>
                  Tài liệu & thiết bị cần thiết
                  <span className="lp-field-hint">(mỗi dòng một mục)</span>
                </label>
                <textarea
                  className="lp-textarea"
                  rows={3}
                  placeholder={'Sách giáo khoa Toán 9 trang 45\nBảng phụ\nMáy chiếu'}
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                />
              </div>

              <div className="lp-field">
                <label>Phương pháp giảng dạy</label>
                <textarea
                  className="lp-textarea"
                  rows={3}
                  placeholder="Thuyết trình kết hợp thảo luận nhóm, đặt câu hỏi gợi mở..."
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                />
              </div>

              <div className="lp-field">
                <label>Phương pháp đánh giá</label>
                <textarea
                  className="lp-textarea"
                  rows={2}
                  placeholder="Kiểm tra miệng đầu giờ, bài tập về nhà trang 48..."
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                />
              </div>

              <div className="lp-field">
                <label>Ghi chú thêm</label>
                <textarea
                  className="lp-textarea"
                  rows={2}
                  placeholder="Lưu ý đặc biệt cho tiết học này..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="lp-modal-footer">
          {step === 1 ? (
            <>
              <button className="lp-btn lp-btn-secondary" onClick={onClose}>
                Hủy
              </button>
              <button
                className="lp-btn lp-btn-primary"
                disabled={!lessonId}
                onClick={() => setStep(2)}
              >
                Tiếp theo
                <ChevronRight size={14} />
              </button>
            </>
          ) : (
            <>
              <button className="lp-btn lp-btn-secondary" onClick={() => setStep(1)}>
                ← Quay lại
              </button>
              <button className="lp-btn lp-btn-primary" disabled={isLoading} onClick={handleSubmit}>
                {isLoading ? 'Đang lưu...' : 'Tạo giáo án'}
              </button>
            </>
          )}
        </div>
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
              <span className="lp-detail-icon-wrap lp-di--blue"><Target size={14} /></span>
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
              <span className="lp-detail-icon-wrap lp-di--amber"><BookOpen size={14} /></span>
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
              <span className="lp-detail-icon-wrap lp-di--emerald"><ClipboardList size={14} /></span>
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
              <span className="lp-detail-icon-wrap lp-di--violet"><FileText size={14} /></span>
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
              <span className="lp-detail-icon-wrap lp-di--orange"><Pencil size={14} /></span>
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
  idx,
  onClose,
  onEdit,
}: {
  plan: LessonPlanResponse;
  idx: number;
  onClose: () => void;
  onEdit: () => void;
}) {
  const gradient = coverGradients[idx % coverGradients.length];
  const accent = coverAccents[idx % coverAccents.length];

  return (
    <div className="lp-modal-overlay">
      <div className="lp-modal lp-detail-modal">
        {/* ── Hero banner ── */}
        <div className="lp-detail-hero" style={{ background: gradient }}>
          <div className="lp-detail-hero-overlay" />
          <button className="lp-modal-close lp-detail-close" onClick={onClose} aria-label="Đóng">
            ×
          </button>
          <div className="lp-detail-hero-meta">
            <span className="lp-date-badge">
              <CalendarDays size={11} />
              {fmtDate(plan.updatedAt)}
            </span>
          </div>
          <h3 className="lp-detail-hero-title" style={{ color: accent }}>
            {plan.lessonTitle ?? 'Chi tiết giáo án'}
          </h3>
        </div>

        {/* ── Sections ── */}
        <div className="lp-modal-body lp-detail-body">
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
                <span className="lp-detail-count lp-dc--amber">{plan.materialsNeeded.length}</span>
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
              <div className="lp-detail-empty">
                <ClipboardList size={28} />
                <p>Giáo án này chưa có nội dung chi tiết.</p>
              </div>
            )}
        </div>

        <div className="lp-modal-footer">
          <button className="lp-btn lp-btn-secondary" onClick={onClose}>
            Đóng
          </button>
          <button className="lp-btn lp-btn-primary" onClick={onEdit}>
            <Pencil size={14} />
            Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TeacherLessonPlans() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'withObjectives' | 'withMaterials'>(
    'all'
  );
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
    <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }}>
      <div className="module-layout-container">
        <section className="module-page">
          {/* ── Header ── */}
          <header className="page-header lp-header-row">
            <div className="header-stack">
              <div className="header-kicker">Lesson plan management</div>
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Giáo án của tôi</h2>
                {!isLoading && <span className="count-chip">{plans.length}</span>}
              </div>
              <p className="header-sub">
                {stats.withObjectives} có mục tiêu • {stats.total} tổng giáo án
              </p>
            </div>
            <button className="btn" onClick={() => setOpenCreate(true)}>
              <Plus size={16} />
              Soạn giáo án mới
            </button>
          </header>

          {/* ── Stats ── */}
          <div className="stats-grid">
            <div className="stat-card stat-blue">
              <div className="stat-icon-wrap">
                <ClipboardList size={20} />
              </div>
              <div>
                <h3>{stats.total}</h3>
                <p>Tổng giáo án</p>
              </div>
            </div>
            <div className="stat-card stat-emerald">
              <div className="stat-icon-wrap">
                <Target size={20} />
              </div>
              <div>
                <h3>{stats.withObjectives}</h3>
                <p>Có mục tiêu</p>
              </div>
            </div>
            <div className="stat-card stat-amber">
              <div className="stat-icon-wrap">
                <BookOpen size={20} />
              </div>
              <div>
                <h3>{stats.withMaterials}</h3>
                <p>Có tài liệu</p>
              </div>
            </div>
            <div className="stat-card stat-violet">
              <div className="stat-icon-wrap">
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
                onChange={(e) => setSearch(e.target.value)}
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

            <div className="pill-group">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`pill-btn${filterStatus === tab.id ? ' active' : ''}`}
                  onClick={() => setFilterStatus(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Summary bar ── */}
          {!isLoading && !isError && plans.length > 0 && (
            <div className="assessment-summary-bar">
              <div className="summary-item summary-item--primary">
                <span className="summary-label">Hiển thị</span>
                <strong className="summary-value">
                  {filtered.length} / {plans.length}
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
            <div className="lp-skeleton-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="lp-skeleton-card" />
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
            <div className="grid-cards">
              {filtered.map((plan, idx) => (
                <article key={plan.id} className="data-card lp-plan-card">
                  <div
                    className="lp-plan-cover"
                    style={{
                      background: coverGradients[idx % coverGradients.length],
                      color: coverAccents[idx % coverAccents.length],
                    }}
                  >
                    <div className="lp-cover-overlay" />
                    <div className="lp-cover-index">#{String(idx + 1).padStart(2, '0')}</div>
                    <span className="lp-date-badge">
                      <CalendarDays size={11} />
                      {fmtDate(plan.updatedAt)}
                    </span>
                    <h3 className="lp-cover-title">
                      {plan.lessonTitle ?? `Bài học: ${plan.lessonId.slice(0, 8)}…`}
                    </h3>
                  </div>

                  <div className="lp-card-body">
                    <p className="lp-card-desc">
                      {plan.teachingStrategy || 'Chưa có phương pháp giảng dạy cho giáo án này.'}
                    </p>

                    <div className="lp-card-metrics">
                      {plan.objectives && plan.objectives.length > 0 && (
                        <div className="lp-metric">
                          <Target size={13} />
                          <span>{plan.objectives.length} mục tiêu</span>
                        </div>
                      )}
                      {plan.materialsNeeded && plan.materialsNeeded.length > 0 && (
                        <div className="lp-metric">
                          <BookOpen size={13} />
                          <span>{plan.materialsNeeded.length} tài liệu</span>
                        </div>
                      )}
                      {plan.notes && (
                        <div className="lp-metric">
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

                    <div className="lp-card-actions">
                      <button className="lp-action-primary" onClick={() => setViewing(plan)}>
                        <BookOpen size={14} /> Xem chi tiết
                      </button>
                      <button className="lp-action-toggle" onClick={() => setEditing(plan)}>
                        <Pencil size={14} /> Sửa
                      </button>
                      <button
                        className="lp-action-danger"
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
              ))}
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
              <button className="btn" onClick={() => setOpenCreate(true)}>
                <Plus size={16} /> Soạn giáo án đầu tiên
              </button>
            </div>
          )}
        </section>
      </div>

      {/* ── Modals ── */}
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
          idx={plans.findIndex((p) => p.id === viewing.id)}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
