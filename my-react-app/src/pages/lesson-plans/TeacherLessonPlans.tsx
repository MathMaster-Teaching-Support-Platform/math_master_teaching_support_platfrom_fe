import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useMyLessonPlans,
  useCreateLessonPlan,
  useUpdateLessonPlan,
  useDeleteLessonPlan,
} from '../../hooks/useLessonPlans';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import type {
  LessonPlanResponse,
  CreateLessonPlanRequest,
  UpdateLessonPlanRequest,
} from '../../types';
import type {
  SchoolGrade,
  SubjectByGrade,
  ChapterBySubject,
  LessonByChapter,
} from '../../types/lessonSlide.types';
import './TeacherLessonPlans.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const splitLines = (val: string) =>
  val.split('\n').map((s) => s.trim()).filter(Boolean);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });

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
    setSubjectId(''); setChapterId(''); setLessonId('');
    setSubjects([]); setChapters([]); setLessons([]);
    setSelectedLesson(null);
    if (!val) return;
    setLoadingSubjects(true);
    try {
      const r = await LessonSlideService.getSubjectsBySchoolGrade(val);
      setSubjects(r.result || []);
    } finally { setLoadingSubjects(false); }
  };

  const handleSubjectChange = async (val: string) => {
    setSubjectId(val);
    setChapterId(''); setLessonId('');
    setChapters([]); setLessons([]);
    setSelectedLesson(null);
    if (!val) return;
    setLoadingChapters(true);
    try {
      const r = await LessonSlideService.getChaptersBySubject(val);
      setChapters(r.result || []);
    } finally { setLoadingChapters(false); }
  };

  const handleChapterChange = async (val: string) => {
    setChapterId(val);
    setLessonId(''); setLessons([]);
    setSelectedLesson(null);
    if (!val) return;
    setLoadingLessons(true);
    try {
      const r = await LessonSlideService.getLessonsByChapter(val);
      setLessons(r.result || []);
    } finally { setLoadingLessons(false); }
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
            <X size={16} />
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
                <label>Khối lớp <span>*</span></label>
                <select
                  className="lp-input"
                  value={gradeId}
                  onChange={(e) => void handleGradeChange(e.target.value)}
                  disabled={loadingGrades}
                >
                  <option value="">{loadingGrades ? 'Đang tải...' : '-- Chọn khối --'}</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>Khối {g.gradeLevel} – {g.name}</option>
                  ))}
                </select>
              </div>

              {gradeId && (
                <div className="lp-field">
                  <label>Môn học <span>*</span></label>
                  <select
                    className="lp-input"
                    value={subjectId}
                    onChange={(e) => void handleSubjectChange(e.target.value)}
                    disabled={loadingSubjects}
                  >
                    <option value="">{loadingSubjects ? 'Đang tải...' : '-- Chọn môn --'}</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {subjectId && (
                <div className="lp-field">
                  <label>Chương <span>*</span></label>
                  <select
                    className="lp-input"
                    value={chapterId}
                    onChange={(e) => void handleChapterChange(e.target.value)}
                    disabled={loadingChapters}
                  >
                    <option value="">{loadingChapters ? 'Đang tải...' : '-- Chọn chương --'}</option>
                    {chapters.map((c) => (
                      <option key={c.id} value={c.id}>{c.orderIndex}. {c.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {chapterId && (
                <div className="lp-field">
                  <label>Bài học <span>*</span></label>
                  <select
                    className="lp-input"
                    value={lessonId}
                    onChange={(e) => handleLessonChange(e.target.value)}
                    disabled={loadingLessons}
                  >
                    <option value="">{loadingLessons ? 'Đang tải...' : '-- Chọn bài học --'}</option>
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id}>{l.orderIndex}. {l.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedLesson && (
                <div className="lp-selected-lesson">
                  <BookOpen size={14} />
                  <span>Đã chọn: <strong>{selectedLesson.title}</strong></span>
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
                  placeholder={'Học sinh hiểu được khái niệm phương trình bậc nhất\nHọc sinh vận dụng giải được bài tập cơ bản'}
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
              <button className="lp-btn lp-btn-secondary" onClick={onClose}>Hủy</button>
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
              <button
                className="lp-btn lp-btn-primary"
                disabled={isLoading}
                onClick={handleSubmit}
              >
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
  onClose,
  onSubmit,
  isLoading,
}: {
  initial: LessonPlanResponse;
  onClose: () => void;
  onSubmit: (data: UpdateLessonPlanRequest) => void;
  isLoading: boolean;
}) {
  const [objectives, setObjectives] = useState(initial.objectives?.join('\n') ?? '');
  const [materials, setMaterials] = useState(initial.materialsNeeded?.join('\n') ?? '');
  const [strategy, setStrategy] = useState(initial.teachingStrategy ?? '');
  const [assessment, setAssessment] = useState(initial.assessmentMethods ?? '');
  const [notes, setNotes] = useState(initial.notes ?? '');

  return (
    <div className="lp-modal-overlay">
      <div className="lp-modal">
        <div className="lp-modal-header">
          <div>
            <h3>✏️ Chỉnh sửa giáo án</h3>
            <p>{initial.lessonTitle ?? 'Giáo án'}</p>
          </div>
          <button className="lp-modal-close" onClick={onClose} aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <div className="lp-modal-body">
          <div className="lp-field">
            <label>Mục tiêu bài học <span className="lp-field-hint">(mỗi dòng một mục tiêu)</span></label>
            <textarea className="lp-textarea" rows={4}
              placeholder={'Học sinh hiểu được...\nHọc sinh vận dụng được...'}
              value={objectives} onChange={(e) => setObjectives(e.target.value)} />
          </div>
          <div className="lp-field">
            <label>Tài liệu & thiết bị <span className="lp-field-hint">(mỗi dòng một mục)</span></label>
            <textarea className="lp-textarea" rows={3}
              placeholder={'Sách giáo khoa trang 45\nBảng phụ'}
              value={materials} onChange={(e) => setMaterials(e.target.value)} />
          </div>
          <div className="lp-field">
            <label>Phương pháp giảng dạy</label>
            <textarea className="lp-textarea" rows={3}
              placeholder="Thuyết trình kết hợp thảo luận nhóm..."
              value={strategy} onChange={(e) => setStrategy(e.target.value)} />
          </div>
          <div className="lp-field">
            <label>Phương pháp đánh giá</label>
            <textarea className="lp-textarea" rows={2}
              placeholder="Kiểm tra miệng, bài tập về nhà..."
              value={assessment} onChange={(e) => setAssessment(e.target.value)} />
          </div>
          <div className="lp-field">
            <label>Ghi chú thêm</label>
            <textarea className="lp-textarea" rows={2}
              placeholder="Lưu ý đặc biệt..."
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="lp-modal-footer">
          <button className="lp-btn lp-btn-secondary" onClick={onClose}>Hủy</button>
          <button className="lp-btn lp-btn-primary" disabled={isLoading}
            onClick={() => onSubmit({
              objectives: splitLines(objectives),
              materialsNeeded: splitLines(materials),
              teachingStrategy: strategy.trim() || undefined,
              assessmentMethods: assessment.trim() || undefined,
              notes: notes.trim() || undefined,
            })}>
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
    <div className="lp-modal-overlay">
      <div className="lp-modal">
        <div className="lp-modal-header">
          <div>
            <h3>📋 {plan.lessonTitle ?? 'Chi tiết giáo án'}</h3>
            <p>Cập nhật lần cuối: {fmtDate(plan.updatedAt)}</p>
          </div>
          <button className="lp-modal-close" onClick={onClose} aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <div className="lp-modal-body">
          {plan.objectives && plan.objectives.length > 0 && (
            <div className="lp-detail-section">
              <p className="lp-detail-section-title">🎯 Mục tiêu bài học</p>
              <ul className="lp-detail-list">
                {plan.objectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>
          )}

          {plan.materialsNeeded && plan.materialsNeeded.length > 0 && (
            <div className="lp-detail-section">
              <p className="lp-detail-section-title">📦 Tài liệu & thiết bị</p>
              <ul className="lp-detail-list">
                {plan.materialsNeeded.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {plan.teachingStrategy && (
            <div className="lp-detail-section">
              <p className="lp-detail-section-title">🧑‍🏫 Phương pháp giảng dạy</p>
              <p className="lp-detail-text">{plan.teachingStrategy}</p>
            </div>
          )}

          {plan.assessmentMethods && (
            <div className="lp-detail-section">
              <p className="lp-detail-section-title">📝 Phương pháp đánh giá</p>
              <p className="lp-detail-text">{plan.assessmentMethods}</p>
            </div>
          )}

          {plan.notes && (
            <div className="lp-detail-section">
              <p className="lp-detail-section-title">💡 Ghi chú</p>
              <p className="lp-detail-text">{plan.notes}</p>
            </div>
          )}

          {!plan.objectives?.length &&
            !plan.materialsNeeded?.length &&
            !plan.teachingStrategy &&
            !plan.assessmentMethods &&
            !plan.notes && (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>
                Giáo án này chưa có nội dung chi tiết.
              </p>
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
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<LessonPlanResponse | null>(null);
  const [viewing, setViewing] = useState<LessonPlanResponse | null>(null);

  const { data, isLoading, isError, error, refetch } = useMyLessonPlans();
  const createMutation = useCreateLessonPlan();
  const updateMutation = useUpdateLessonPlan();
  const deleteMutation = useDeleteLessonPlan();

  const plans = data?.result ?? [];

  const filtered = plans.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.lessonTitle?.toLowerCase().includes(q) ||
      p.teachingStrategy?.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: plans.length,
    withObjectives: plans.filter((p) => p.objectives && p.objectives.length > 0).length,
    withMaterials: plans.filter((p) => p.materialsNeeded && p.materialsNeeded.length > 0).length,
    withNotes: plans.filter((p) => p.notes).length,
  };

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
    >
      <div className="lesson-plans-page">
        {/* ── Header ── */}
        <header className="lp-header">
          <div className="lp-header-copy">
            <h1>📋 Giáo án của tôi</h1>
            <p>Soạn và quản lý kế hoạch giảng dạy chi tiết cho từng bài học.</p>
          </div>
          <button
            className="lp-btn-create"
            onClick={() => setOpenCreate(true)}
          >
            <Plus size={18} />
            Soạn giáo án mới
          </button>
        </header>

        {/* ── Stats ── */}
        <div className="lp-stats">
          <div className="lp-stat-card">
            <span className="lp-stat-icon blue">📋</span>
            <div>
              <div className="lp-stat-label">Tổng giáo án</div>
              <span className="lp-stat-value">{stats.total}</span>
            </div>
          </div>
          <div className="lp-stat-card">
            <span className="lp-stat-icon green">🎯</span>
            <div>
              <div className="lp-stat-label">Có mục tiêu</div>
              <span className="lp-stat-value">{stats.withObjectives}</span>
            </div>
          </div>
          <div className="lp-stat-card">
            <span className="lp-stat-icon amber">📦</span>
            <div>
              <div className="lp-stat-label">Có tài liệu</div>
              <span className="lp-stat-value">{stats.withMaterials}</span>
            </div>
          </div>
          <div className="lp-stat-card">
            <span className="lp-stat-icon violet">💡</span>
            <div>
              <div className="lp-stat-label">Có ghi chú</div>
              <span className="lp-stat-value">{stats.withNotes}</span>
            </div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="lp-toolbar">
          <div className="lp-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Tìm theo tên bài học, phương pháp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="lp-btn-refresh" onClick={() => void refetch()}>
            <RefreshCw size={14} />
            Làm mới
          </button>
        </div>

        {/* ── States ── */}
        {isLoading && (
          <div className="lp-state">
            <p>Đang tải danh sách giáo án...</p>
          </div>
        )}

        {isError && (
          <div className="lp-state">
            <p style={{ color: '#dc2626' }}>
              {error instanceof Error ? error.message : 'Không thể tải danh sách giáo án.'}
            </p>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="lp-state">
            <div className="lp-empty-icon">
              <ClipboardList size={56} strokeWidth={1.5} />
            </div>
            <h3>{search ? 'Không tìm thấy kết quả' : 'Chưa có giáo án nào'}</h3>
            <p>
              {search
                ? `Không có giáo án nào khớp với "${search}". Thử từ khóa khác nhé.`
                : 'Bắt đầu soạn giáo án đầu tiên để lên kế hoạch giảng dạy hiệu quả hơn.'}
            </p>
            {!search && (
              <button
                className="lp-empty-cta"
                onClick={() => setOpenCreate(true)}
              >
                Soạn giáo án đầu tiên
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}

        {/* ── Cards ── */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="lp-grid">
            {filtered.map((plan) => (
              <article key={plan.id} className="lp-card">
                <div className="lp-card-accent" />
                <div className="lp-card-body">
                  <div className="lp-card-top">
                    <h3 className="lp-card-title">
                      {plan.lessonTitle ?? `Bài học: ${plan.lessonId.slice(0, 8)}…`}
                    </h3>
                    <span className="lp-card-date">{fmtDate(plan.updatedAt)}</span>
                  </div>

                  {plan.teachingStrategy && (
                    <p className="lp-card-strategy">{plan.teachingStrategy}</p>
                  )}

                  {plan.objectives && plan.objectives.length > 0 && (
                    <div className="lp-objectives">
                      {plan.objectives.slice(0, 2).map((obj, i) => (
                        <span key={i} className="lp-obj-chip" title={obj}>
                          {obj}
                        </span>
                      ))}
                      {plan.objectives.length > 2 && (
                        <span className="lp-obj-more">+{plan.objectives.length - 2} mục tiêu</span>
                      )}
                    </div>
                  )}

                  <div className="lp-card-meta">
                    {plan.materialsNeeded && plan.materialsNeeded.length > 0 && (
                      <span className="lp-meta-item">
                        <BookOpen size={13} />
                        {plan.materialsNeeded.length} tài liệu
                      </span>
                    )}
                    {plan.objectives && plan.objectives.length > 0 && (
                      <span className="lp-meta-item">
                        <Target size={13} />
                        {plan.objectives.length} mục tiêu
                      </span>
                    )}
                  </div>
                </div>

                <div className="lp-card-footer">
                  <button className="lp-btn lp-btn-primary" onClick={() => setViewing(plan)}>
                    <BookOpen size={14} />
                    Xem chi tiết
                  </button>
                  <button className="lp-btn lp-btn-secondary" onClick={() => setEditing(plan)}>
                    <Pencil size={14} />
                    Chỉnh sửa
                  </button>                  <button
                    className="lp-btn lp-btn-danger"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn xóa giáo án này không?')) {
                        deleteMutation.mutate(plan.id);
                      }
                    }}
                  >
                    <Trash2 size={14} />
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
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
          onEdit={() => { setEditing(viewing); setViewing(null); }}
        />
      )}
    </DashboardLayout>
  );
}
