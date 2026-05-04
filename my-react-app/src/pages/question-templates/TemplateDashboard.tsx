import {
  AlertCircle,
  Archive,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  CheckSquare,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Grid2x2,
  List,
  Network,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LatexRenderer from '../../components/common/LatexRenderer';
import MathText from '../../components/common/MathText';
import Pagination from '../../components/common/Pagination';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import {
  useApproveQuestion,
  useBulkApproveQuestions,
  useDeleteQuestion,
  useReviewQuestions,
  useUpdateQuestion,
} from '../../hooks/useQuestion';
import {
  useArchiveTemplate,
  useCreateQuestionTemplate,
  useDeleteQuestionTemplate,
  useGetMyQuestionTemplates,
  usePublishTemplate,
  useTogglePublicStatus,
  useUnpublishTemplate,
  useUpdateQuestionTemplate,
} from '../../hooks/useQuestionTemplate';
import { questionTemplateService } from '../../services/questionTemplateService';
import '../../styles/module-refactor.css';
import type { QuestionResponse } from '../../types/question';
import {
  TemplateStatus,
  type QuestionTemplateRequest,
  type QuestionTemplateResponse,
} from '../../types/questionTemplate';
import '../courses/TeacherCourses.css';
import './template-review.css';
import { TemplateBulkImportModal } from './TemplateBulkImportModal';
import { TemplateFormModal } from './TemplateFormModal';
import { TemplateGenerateModal } from './TemplateGenerateModal';
import { TemplateTestModal } from './TemplateTestModal';

const statusFilters: Array<'ALL' | TemplateStatus> = [
  'ALL',
  TemplateStatus.DRAFT,
  TemplateStatus.PUBLISHED,
  TemplateStatus.ARCHIVED,
];

const statusLabel: Record<'ALL' | TemplateStatus, string> = {
  ALL: 'Tất cả',
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã xuất bản',
  ARCHIVED: 'Lưu trữ',
};

const templateTypeLabel: Record<string, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng/Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  ESSAY: 'Tự luận',
  CODING: 'Lập trình',
};

const cognitiveLevelLabel: Record<string, string> = {
  NHAN_BIET: 'Nhận biết',
  THONG_HIEU: 'Thông hiểu',
  VAN_DUNG: 'Vận dụng',
  VAN_DUNG_CAO: 'Vận dụng cao',
  REMEMBER: 'Nhận biết',
  UNDERSTAND: 'Thông hiểu',
  APPLY: 'Vận dụng',
  ANALYZE: 'Phân tích',
  EVALUATE: 'Đánh giá',
  CREATE: 'Sáng tạo',
};

const questionStatusLabel: Record<string, string> = {
  AI_DRAFT: 'Nháp AI',
  UNDER_REVIEW: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  ARCHIVED: 'Lưu trữ',
};

const coverGradients = [
  'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
  'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
  'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
] as const;

const coverAccents = ['#1d4ed8', '#047857', '#6d28d9', '#c2410c', '#be185d', '#0f766e'] as const;

function extractDiagramLatexStrings(diagramData: unknown): string[] {
  const values: string[] = [];

  const visit = (node: unknown, keyName = '') => {
    if (typeof node === 'string') {
      const trimmed = node.trim();
      if (!trimmed) return;

      // Skip unresolved template placeholders in preview stage.
      if (trimmed.includes('{{') || trimmed.includes('}}')) return;

      // Ignore metadata-like tokens, e.g. function_graph, near_miss.
      const looksLikeIdentifier = /^[a-zA-Z]+(?:_[a-zA-Z0-9]+)+$/.test(trimmed);
      if (looksLikeIdentifier) return;

      const keyLooksLatex = /latex|tex|equation|formula|expression|math/i.test(keyName);
      const hasLatexSyntax = /\$[^$]+\$|\\[a-zA-Z]+/.test(trimmed);
      const hasMathOperators = /[=+\-*/^]/.test(trimmed);
      const hasMathSymbols = /\d|[xyabcnm]|π|√/i.test(trimmed);

      if (keyLooksLatex || hasLatexSyntax || (hasMathOperators && hasMathSymbols)) {
        values.push(trimmed);
      }
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((item) => visit(item, keyName));
      return;
    }

    if (node && typeof node === 'object') {
      Object.entries(node as Record<string, unknown>).forEach(([key, value]) => {
        visit(value, key);
      });
    }
  };

  visit(diagramData);
  return Array.from(new Set(values)).slice(0, 6);
}

function extractPrimaryDiagramLatex(diagramData: unknown): string | null {
  if (typeof diagramData === 'string') {
    const value = diagramData.trim();
    if (!value) return null;
    return value;
  }

  if (!diagramData || typeof diagramData !== 'object' || Array.isArray(diagramData)) {
    return null;
  }

  const record = diagramData as Record<string, unknown>;
  const directCandidates = ['latex', 'tex', 'equation', 'formula', 'expression', 'math', 'diagram'];
  for (const key of directCandidates) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  const discovered = extractDiagramLatexStrings(record);
  return discovered[0]?.trim() ?? null;
}

export function TemplateDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | TemplateStatus>('ALL');
  const [page, setPage] = useState(0);
  const size = 10;
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [formOpen, setFormOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [selected, setSelected] = useState<QuestionTemplateResponse | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateTemplate, setGenerateTemplate] = useState<QuestionTemplateResponse | null>(null);
  const [reviewTemplateId, setReviewTemplateId] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [editingQuestion, setEditingQuestion] = useState<QuestionResponse | null>(null);
  const [activeDiagram, setActiveDiagram] = useState<unknown>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('');
  const [editExplanation, setEditExplanation] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedStatus = status;

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, status]);

  const { data, isLoading, isError, error, refetch } = useGetMyQuestionTemplates(
    page,
    size,
    'createdAt',
    'DESC',
    debouncedSearch.trim() || undefined,
    debouncedStatus === 'ALL' ? undefined : debouncedStatus
  );

  const createMutation = useCreateQuestionTemplate();
  const updateMutation = useUpdateQuestionTemplate();
  const deleteMutation = useDeleteQuestionTemplate();
  const publishMutation = usePublishTemplate();
  const archiveMutation = useArchiveTemplate();
  const unpublishMutation = useUnpublishTemplate();
  const togglePublicMutation = useTogglePublicStatus();
  const bulkApproveMutation = useBulkApproveQuestions();
  const approveQuestionMutation = useApproveQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();

  const reviewQuestionsQuery = useReviewQuestions(
    reviewTemplateId,
    reviewOpen && Boolean(reviewTemplateId)
  );

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const templates = useMemo(() => data?.result?.content ?? [], [data]);
  const totalPages = data?.result?.totalPages ?? 0;
  const totalElements = data?.result?.totalElements ?? 0;

  const stats = useMemo(
    () => ({
      total: totalElements,
      published: templates.filter((t) => t.status === TemplateStatus.PUBLISHED).length,
      draft: templates.filter((t) => t.status === TemplateStatus.DRAFT).length,
      archived: templates.filter((t) => t.status === TemplateStatus.ARCHIVED).length,
    }),
    [templates, totalElements]
  );

  const reviewQuestions = useMemo(
    () => reviewQuestionsQuery.data?.result ?? [],
    [reviewQuestionsQuery.data]
  );
  const activeDiagramLatexCode = extractPrimaryDiagramLatex(activeDiagram);
  const activeDiagramLatexValues = activeDiagram ? extractDiagramLatexStrings(activeDiagram) : [];

  useEffect(() => {
    if (!reviewOpen) return;
    const defaultSelected = reviewQuestions
      .filter((question) => question.questionStatus !== 'APPROVED')
      .map((question) => question.id);
    setSelectedQuestionIds(new Set(defaultSelected));
  }, [reviewOpen, reviewQuestions]);

  async function saveTemplate(payload: QuestionTemplateRequest) {
    if (mode === 'create') {
      await createMutation.mutateAsync(payload);
      return;
    }
    if (!selected) return;
    await updateMutation.mutateAsync({ id: selected.id, request: payload });
  }

  async function openEditTemplate(templateId: string) {
    setEditingTemplateId(templateId);
    try {
      const detail = await questionTemplateService.getQuestionTemplateById(templateId);
      if (!detail.result) throw new Error('Không lấy được chi tiết template.');
      setMode('edit');
      setSelected(detail.result);
      setFormOpen(true);
    } catch (error) {
      showToast({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Không thể tải chi tiết template để chỉnh sửa.',
      });
    } finally {
      setEditingTemplateId(null);
    }
  }

  // function _openCreateFromDraft(draft?: TemplateDraft) {
  //   setMode('create');
  //   setSelected(draft as QuestionTemplateResponse | null);
  //   setFormOpen(true);
  // }

  function openReviewModal(templateId?: string) {
    setReviewTemplateId(templateId ?? templates[0]?.id ?? '');
    setReviewOpen(true);
  }

  async function handleApproveSelectedQuestions() {
    if (selectedQuestionIds.size === 0) return;
    try {
      await bulkApproveMutation.mutateAsync(Array.from(selectedQuestionIds));
      showToast({
        type: 'success',
        message: `Đã phê duyệt ${selectedQuestionIds.size} câu hỏi thành công.`,
      });
      setSelectedQuestionIds(new Set());
      void reviewQuestionsQuery.refetch();
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể phê duyệt câu hỏi đã chọn.',
      });
    }
  }

  async function handleDeleteSelectedQuestions() {
    const questionIds = Array.from(selectedQuestionIds);
    if (questionIds.length === 0) return;
    if (!globalThis.confirm(`Bạn có chắc muốn xóa ${questionIds.length} câu hỏi đã chọn?`)) return;

    const deleteResults = await Promise.allSettled(
      questionIds.map((questionId) => deleteQuestionMutation.mutateAsync(questionId))
    );

    const failedCount = deleteResults.filter((result) => result.status === 'rejected').length;
    const successCount = deleteResults.length - failedCount;

    if (successCount > 0) {
      setSelectedQuestionIds(new Set());
      void reviewQuestionsQuery.refetch();
    }

    if (failedCount === 0) {
      showToast({
        type: 'success',
        message: `Đã xóa ${successCount} câu hỏi thành công.`,
      });
      return;
    }

    if (successCount === 0) {
      showToast({
        type: 'error',
        message: 'Không thể xóa các câu hỏi đã chọn. Vui lòng thử lại.',
      });
      return;
    }

    showToast({
      type: 'error',
      message: `Đã xóa ${successCount} câu hỏi, thất bại ${failedCount} câu.`,
    });
  }

  function toggleQuestionSelection(questionId: string, checked: boolean) {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(questionId);
      else next.delete(questionId);
      return next;
    });
  }

  function openEditQuestion(question: QuestionResponse) {
    setEditingQuestion(question);
    setEditQuestionText(question.questionText ?? '');
    setEditCorrectAnswer(question.correctAnswer ?? '');
    setEditExplanation(question.explanation ?? '');
  }

  function closeEditQuestion() {
    setEditingQuestion(null);
    setEditQuestionText('');
    setEditCorrectAnswer('');
    setEditExplanation('');
  }

  async function handleApproveQuestion(questionId: string) {
    try {
      await approveQuestionMutation.mutateAsync(questionId);
      showToast({ type: 'success', message: 'Đã duyệt câu hỏi thành công.' });
      void reviewQuestionsQuery.refetch();
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể duyệt câu hỏi.',
      });
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!globalThis.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    try {
      await deleteQuestionMutation.mutateAsync(questionId);
      showToast({ type: 'success', message: 'Đã xóa câu hỏi.' });
      setSelectedQuestionIds((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
      void reviewQuestionsQuery.refetch();
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể xóa câu hỏi.',
      });
    }
  }

  async function handleSaveQuestionEdit() {
    if (!editingQuestion) return;
    try {
      await updateQuestionMutation.mutateAsync({
        questionId: editingQuestion.id,
        request: {
          questionText: editQuestionText,
          correctAnswer: editCorrectAnswer,
          explanation: editExplanation,
        },
      });
      showToast({ type: 'success', message: 'Đã cập nhật câu hỏi.' });
      closeEditQuestion();
      void reviewQuestionsQuery.refetch();
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể cập nhật câu hỏi.',
      });
    }
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container">
        <section className="module-page teacher-courses-page template-dashboard-page">
          {/* ── Header ── */}
          <header className="page-header courses-header-row">
            <div className="header-stack">
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Mẫu câu hỏi</h2>
                {!isLoading && <span className="count-chip">{templates.length}</span>}
              </div>
              <p className="header-sub">
                {stats.published} đã xuất bản • {stats.draft} bản nháp
              </p>
            </div>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn secondary btn--tint-violet"
                onClick={() => setBulkImportOpen(true)}
              >
                <Upload size={14} />
                Nhập từ Excel
              </button>

              <button
                type="button"
                className="btn btn--feat-violet"
                onClick={() => {
                  setMode('create');
                  setSelected(null);
                  setFormOpen(true);
                }}
              >
                <Plus size={14} />
                Tạo mẫu mới
              </button>
            </div>
          </header>

          {/* ── Stats ── */}
          <div className="stats-grid">
            <div className="stat-card stat-blue">
              <div className="stat-icon-wrap">
                <FileText size={20} />
              </div>
              <div>
                <h3>{stats.total}</h3>
                <p>Tổng mẫu</p>
              </div>
            </div>
            <div className="stat-card stat-emerald">
              <div className="stat-icon-wrap">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3>{stats.published}</h3>
                <p>Đã xuất bản</p>
              </div>
            </div>
            <div className="stat-card stat-amber">
              <div className="stat-icon-wrap">
                <Network size={20} />
              </div>
              <div>
                <h3>{stats.draft}</h3>
                <p>Bản nháp</p>
              </div>
            </div>
            <div className="stat-card stat-violet">
              <div className="stat-icon-wrap">
                <Archive size={20} />
              </div>
              <div>
                <h3>{stats.archived}</h3>
                <p>Đã lưu trữ</p>
              </div>
            </div>
          </div>

          <section className="hero-card workflow-card">
            <p className="hero-kicker">Quy trình làm việc</p>
            <h2>Làm theo 4 bước để có ngân hàng câu hỏi chất lượng</h2>

            <ol className="workflow-steps" aria-label="Các bước thực hiện">
              <li className="workflow-step">
                <div className="workflow-step-head">
                  <span className="workflow-step-dot">1</span>
                  <div className="workflow-step-icon-wrap wf-blue">
                    <FileText size={17} />
                  </div>
                </div>
                <div className="workflow-step-body">
                  <h4>Soạn mẫu câu hỏi</h4>
                  <p>
                    Tạo mẫu với biến số (a, b...). Hệ thống tự sinh hàng loạt câu hỏi ngẫu nhiên
                    cùng dạng toán.
                  </p>
                  <button
                    type="button"
                    className="btn secondary btn--tint-blue"
                    onClick={() => {
                      setMode('create');
                      setSelected(null);
                      setFormOpen(true);
                    }}
                  >
                    <Plus size={13} /> Tạo mẫu mới
                  </button>
                </div>
              </li>

              <li className="workflow-connector" aria-hidden="true">
                <ArrowRight size={16} />
              </li>

              <li className="workflow-step">
                <div className="workflow-step-head">
                  <span className="workflow-step-dot">2</span>
                  <div className="workflow-step-icon-wrap wf-emerald">
                    <Eye size={17} />
                  </div>
                </div>
                <div className="workflow-step-body">
                  <h4>Xem trước & duyệt câu hỏi</h4>
                  <p>Chọn mẫu, xem toàn bộ câu hỏi đã sinh và phê duyệt nhanh theo lô vào kho.</p>
                  <button
                    type="button"
                    className="btn secondary btn--tint-emerald"
                    onClick={() => openReviewModal()}
                  >
                    <CheckSquare size={13} /> Duyệt theo mẫu
                  </button>
                </div>
              </li>

              <li className="workflow-connector" aria-hidden="true">
                <ArrowRight size={16} />
              </li>

              <li className="workflow-step">
                <div className="workflow-step-head">
                  <span className="workflow-step-dot">3</span>
                  <div className="workflow-step-icon-wrap wf-violet">
                    <Archive size={17} />
                  </div>
                </div>
                <div className="workflow-step-body">
                  <h4>Quản lý ngân hàng câu hỏi</h4>
                  <p>
                    Toàn bộ câu hỏi đã duyệt được lưu vào kho. Tổ chức, tìm kiếm và tái sử dụng tại
                    đây.
                  </p>
                  <button
                    type="button"
                    className="btn secondary btn--tint-violet"
                    onClick={() => navigate('/teacher/question-banks')}
                  >
                    <ArrowRight size={13} /> Mở ngân hàng
                  </button>
                </div>
              </li>

              <li className="workflow-connector" aria-hidden="true">
                <ArrowRight size={16} />
              </li>

              <li className="workflow-step">
                <div className="workflow-step-head">
                  <span className="workflow-step-dot">4</span>
                  <div className="workflow-step-icon-wrap wf-amber">
                    <Save size={17} />
                  </div>
                </div>
                <div className="workflow-step-body">
                  <h4>Tạo đề kiểm tra</h4>
                  <p>
                    Chọn câu hỏi từ kho, lắp thành đề theo cơ cấu ma trận và xuất bản cho học sinh.
                  </p>
                  <button
                    type="button"
                    className="btn btn--feat-amber"
                    onClick={() => navigate('/teacher/assessment-builder')}
                  >
                    Tạo đề ngay
                  </button>
                </div>
              </li>
            </ol>
          </section>

          {/* ── Toolbar ── */}
          <div className="toolbar">
            <label className="search-box">
              <span className="search-box__icon" aria-hidden="true">
                <Search size={15} />
              </span>
              <input
                placeholder="Tìm mẫu câu hỏi..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
              />
              {search && (
                <button
                  type="button"
                  className="search-box__clear"
                  aria-label="Xóa nội dung tìm kiếm"
                  onClick={() => {
                    setSearch('');
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </label>

            <div className="pill-group">
              {statusFilters.map((item) => (
                <button
                  key={item}
                  className={`pill-btn${status === item ? ' active' : ''}`}
                  onClick={() => {
                    setStatus(item);
                  }}
                >
                  {statusLabel[item]}
                </button>
              ))}
            </div>

            <div
              style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
            >
              <button className="btn secondary" onClick={() => void refetch()}>
                <RefreshCw size={14} />
                Làm mới
              </button>
              <div className="view-toggle">
                <button
                  className={viewMode === 'grid' ? 'active' : ''}
                  onClick={() => setViewMode('grid')}
                  aria-label="Hiển thị lưới"
                >
                  <Grid2x2 size={16} />
                </button>
                <button
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                  aria-label="Hiển thị danh sách"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

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
              <p>{error instanceof Error ? error.message : 'Không thể tải danh sách mẫu'}</p>
            </div>
          )}

          {/* ── Empty: no results ── */}
          {!isLoading &&
            !isError &&
            templates.length === 0 &&
            (debouncedSearch || status !== 'ALL') && (
              <div className="empty">
                <Search size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p>Không tìm thấy mẫu phù hợp với bộ lọc.</p>
              </div>
            )}

          {/* ── Empty: no templates ── */}
          {!isLoading && !isError && templates.length === 0 && (
            <div className="empty">
              <FileText size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>Bạn chưa có mẫu câu hỏi nào. Hãy tạo mẫu đầu tiên.</p>
              <button
                type="button"
                className="btn btn--feat-violet"
                style={{ marginTop: '1rem' }}
                onClick={() => {
                  setMode('create');
                  setSelected(null);
                  setFormOpen(true);
                }}
              >
                Tạo mẫu mới
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── Grid ── */}
          {!isLoading && !isError && templates.length > 0 && (
            <div className={`grid-cards${viewMode === 'list' ? ' list-view' : ''}`}>
              {templates.map((template, idx) => (
                <article key={template.id} className="data-card mindmap-card course-card">
                  <div
                    className="mindmap-cover"
                    style={{
                      background: coverGradients[idx % coverGradients.length],
                      color: coverAccents[idx % coverAccents.length],
                    }}
                  >
                    <div className="cover-overlay" />
                    <div className="cover-index">#{String(idx + 1).padStart(2, '0')}</div>
                    {template.status === TemplateStatus.PUBLISHED && (
                      <span className="course-badge badge-live">
                        <Eye size={11} /> Đã xuất bản
                      </span>
                    )}
                    {template.status === TemplateStatus.ARCHIVED && (
                      <span className="course-badge badge-archived">
                        <Archive size={11} /> Lưu trữ
                      </span>
                    )}
                    {template.status === TemplateStatus.DRAFT && (
                      <span className="course-badge badge-draft">
                        <EyeOff size={11} /> Nháp
                      </span>
                    )}
                    <h3 className="cover-title">
                      <MathText text={template.name} />
                    </h3>
                  </div>

                  <div className="mindmap-body">
                    <p className="mindmap-desc">
                      <MathText text={template.description || 'Không có mô tả'} />
                    </p>

                    <div className="mindmap-metrics">
                      <div className="metric">
                        <FileText size={13} />
                        <span>
                          {templateTypeLabel[template.templateType] || template.templateType}
                        </span>
                      </div>
                      <div className="metric">
                        <Network size={13} />
                        <span>
                          {cognitiveLevelLabel[template.cognitiveLevel] || template.cognitiveLevel}
                        </span>
                      </div>

                      {template.chapterName && (
                        <div className="metric">
                          <BookOpen size={13} />
                          <span>{template.chapterName}</span>
                        </div>
                      )}
                      {template.gradeLevel && (
                        <div className="metric">
                          <GraduationCap size={13} />
                          <span>Lớp {template.gradeLevel}</span>
                        </div>
                      )}
                      {template.subjectName && (
                        <div className="metric">
                          <FileText size={13} />
                          <span>{template.subjectName}</span>
                        </div>
                      )}

                      {template.isPublic && (
                        <div className="metric metric--ai">
                          <Eye size={13} />
                          <span>Công khai</span>
                        </div>
                      )}
                    </div>

                    <div className="row" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
                      <button
                        className="btn secondary"
                        onClick={() => {
                          setGenerateTemplate(template);
                          setGenerateOpen(true);
                        }}
                      >
                        <Play size={14} />
                        Sinh câu hỏi
                      </button>
                      <button
                        className="btn secondary"
                        onClick={() => {
                          setSelected(template);
                          setTestOpen(true);
                        }}
                      >
                        <Eye size={14} />
                        Chạy thử
                      </button>
                      <button
                        className="btn secondary"
                        onClick={() => openReviewModal(template.id)}
                      >
                        <CheckSquare size={14} />
                        Xét duyệt
                      </button>
                      <button
                        className="btn secondary"
                        onClick={() => void openEditTemplate(template.id)}
                        disabled={editingTemplateId === template.id}
                      >
                        <Pencil size={14} />
                        {editingTemplateId === template.id ? 'Đang tải...' : 'Chỉnh sửa'}
                      </button>
                      <button
                        className="btn secondary"
                        onClick={() => togglePublicMutation.mutate(template.id)}
                      >
                        {template.isPublic ? <EyeOff size={14} /> : <Eye size={14} />}
                        {template.isPublic ? 'Đặt riêng tư' : 'Công khai'}
                      </button>
                    </div>

                    <div className="mindmap-footer">
                      <div className="row" style={{ gap: '0.35rem', flexWrap: 'wrap' }}>
                        {template.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="badge draft" style={{ fontSize: '0.68rem' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="mindmap-actions">
                        {template.status === TemplateStatus.DRAFT && (
                          <button
                            type="button"
                            className="btn btn--feat-emerald"
                            onClick={() => publishMutation.mutate(template.id)}
                          >
                            <FileText size={14} />
                            Xuất bản
                          </button>
                        )}
                        {template.status === TemplateStatus.PUBLISHED && (
                          <button
                            className="btn warn"
                            onClick={() => archiveMutation.mutate(template.id)}
                          >
                            <Archive size={14} />
                            Lưu trữ
                          </button>
                        )}
                        {template.status === TemplateStatus.PUBLISHED && (
                          <button
                            className="btn secondary"
                            onClick={() => unpublishMutation.mutate(template.id)}
                          >
                            <FileText size={14} />
                            Hủy xuất bản
                          </button>
                        )}
                        <button
                          className="btn danger-outline"
                          onClick={() => deleteMutation.mutate(template.id)}
                        >
                          <Trash2 size={14} />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={size}
            onChange={(p) => setPage(p)}
          />

          <TemplateFormModal
            isOpen={formOpen}
            onClose={() => setFormOpen(false)}
            mode={mode}
            initialData={selected}
            onSubmit={saveTemplate}
          />

          <TemplateBulkImportModal
            isOpen={bulkImportOpen}
            onClose={() => setBulkImportOpen(false)}
            onSuccess={() => {
              setBulkImportOpen(false);
              void refetch();
            }}
          />

          {selected && (
            <TemplateTestModal
              isOpen={testOpen}
              onClose={() => setTestOpen(false)}
              template={selected}
            />
          )}

          {generateTemplate && (
            <TemplateGenerateModal
              isOpen={generateOpen}
              onClose={() => setGenerateOpen(false)}
              template={generateTemplate}
              onGenerated={(message) => showToast({ type: 'success', message })}
            />
          )}



          {reviewOpen && (
            <div className="modal-layer">
              <div className="modal-card template-review-modal">
                <div className="modal-header">
                  <div>
                    <h3>Xét duyệt câu hỏi theo mẫu</h3>
                    <p className="muted" style={{ marginTop: 4 }}>
                      Chọn mẫu để xem trước câu hỏi đã sinh và phê duyệt các câu phù hợp.
                    </p>
                  </div>
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setReviewOpen(false);
                      setSelectedQuestionIds(new Set());
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="modal-body">
                  <div className="template-review-modal__toolbar">
                    <label className="template-review-modal__selector">
                      <span className="muted">Mẫu câu hỏi</span>
                      <select
                        className="select"
                        value={reviewTemplateId}
                        onChange={(event) => {
                          setReviewTemplateId(event.target.value);
                          setSelectedQuestionIds(new Set());
                        }}
                      >
                        <option value="">Chọn mẫu câu hỏi</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      className="btn secondary"
                      onClick={() => void reviewQuestionsQuery.refetch()}
                      disabled={!reviewTemplateId || reviewQuestionsQuery.isFetching}
                    >
                      <RefreshCw size={14} />
                      Làm mới danh sách câu
                    </button>
                  </div>

                  {/* Template metadata info */}
                  {reviewTemplateId &&
                    (() => {
                      const selectedTemplate = templates.find((t) => t.id === reviewTemplateId);
                      if (!selectedTemplate) return null;
                      return (
                        <div
                          className="row"
                          style={{
                            justifyContent: 'start',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            marginTop: 8,
                            marginBottom: 8,
                            paddingLeft: 16,
                          }}
                        >
                          {selectedTemplate.chapterName && (
                            <span className="muted" style={{ fontSize: '0.85rem' }}>
                              <BookOpen
                                size={14}
                                style={{ verticalAlign: 'middle', marginRight: 4 }}
                              />
                              {selectedTemplate.chapterName}
                            </span>
                          )}
                          {selectedTemplate.gradeLevel && (
                            <span className="muted" style={{ fontSize: '0.85rem' }}>
                              <GraduationCap
                                size={14}
                                style={{ verticalAlign: 'middle', marginRight: 4 }}
                              />
                              Lớp {selectedTemplate.gradeLevel}
                            </span>
                          )}
                          {selectedTemplate.cognitiveLevel && (
                            <span className="badge" style={{ fontSize: '0.75rem' }}>
                              {cognitiveLevelLabel[selectedTemplate.cognitiveLevel] ||
                                selectedTemplate.cognitiveLevel}
                            </span>
                          )}
                        </div>
                      );
                    })()}

                  {!reviewTemplateId && (
                    <div className="empty">Hãy chọn một mẫu để bắt đầu xét duyệt.</div>
                  )}

                  {reviewTemplateId && reviewQuestionsQuery.isFetching && (
                    <div className="empty">Đang tải câu hỏi theo mẫu...</div>
                  )}

                  {reviewTemplateId &&
                    !reviewQuestionsQuery.isFetching &&
                    !reviewQuestionsQuery.isError &&
                    reviewQuestions.length === 0 && (
                      <div className="empty">Mẫu này chưa có câu hỏi để xét duyệt.</div>
                    )}

                  {reviewTemplateId && reviewQuestionsQuery.isError && (
                    <div className="empty">
                      {reviewQuestionsQuery.error instanceof Error
                        ? reviewQuestionsQuery.error.message
                        : 'Không thể tải danh sách câu hỏi theo mẫu.'}
                    </div>
                  )}

                  {reviewTemplateId &&
                    !reviewQuestionsQuery.isFetching &&
                    !reviewQuestionsQuery.isError &&
                    reviewQuestions.length > 0 && (
                      <div className="table-wrap template-review-modal__list">
                        <table className="table template-review-table">
                          <thead>
                            <tr>
                              <th style={{ width: 46 }}>
                                <input
                                  type="checkbox"
                                  checked={
                                    reviewQuestions.some(
                                      (question) => question.questionStatus !== 'APPROVED'
                                    ) &&
                                    reviewQuestions
                                      .filter((question) => question.questionStatus !== 'APPROVED')
                                      .every((question) => selectedQuestionIds.has(question.id))
                                  }
                                  onChange={(event) => {
                                    const isChecked = event.target.checked;
                                    const next = new Set(selectedQuestionIds);
                                    reviewQuestions.forEach((question) => {
                                      if (question.questionStatus === 'APPROVED') return;
                                      if (isChecked) next.add(question.id);
                                      else next.delete(question.id);
                                    });
                                    setSelectedQuestionIds(next);
                                  }}
                                />
                              </th>
                              <th>Nội dung câu hỏi</th>
                              <th style={{ width: 120 }}>Trạng thái</th>
                              <th style={{ width: 140 }}>Đáp án</th>
                              <th style={{ width: 290 }}>Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reviewQuestions.map((question) => {
                              const isApproved = question.questionStatus === 'APPROVED';
                              const questionDiagramData = question.diagramData as unknown;
                              const questionDiagramLatexCode =
                                extractPrimaryDiagramLatex(questionDiagramData);
                              const questionDiagramLatexValues = questionDiagramData
                                ? extractDiagramLatexStrings(questionDiagramData)
                                : [];
                              return (
                                <tr key={question.id}>
                                  <td>
                                    <input
                                      type="checkbox"
                                      checked={selectedQuestionIds.has(question.id)}
                                      disabled={isApproved}
                                      onChange={(event) =>
                                        toggleQuestionSelection(question.id, event.target.checked)
                                      }
                                    />
                                  </td>
                                  <td>
                                    <div className="template-review-question__text">
                                      <MathText text={question.questionText} />
                                    </div>
                                    <div
                                      className="row"
                                      style={{
                                        justifyContent: 'start',
                                        flexWrap: 'wrap',
                                        marginTop: 6,
                                      }}
                                    >
                                      {question.questionSourceType === 'AI_GENERATED' && (
                                        <span className="badge draft">AI Generated</span>
                                      )}
                                      {question.questionSourceType === 'TEMPLATE_GENERATED' && (
                                        <span className="badge approved">Parametric</span>
                                      )}
                                      {question.canonicalQuestionId && (
                                        <span className="badge published">From Canonical</span>
                                      )}
                                    </div>
                                    {question.explanation && (
                                      <p className="muted template-review-question__explanation">
                                        Giải thích: <MathText text={question.explanation} />
                                      </p>
                                    )}
                                    {question.solutionSteps && (
                                      <div className="preview-box" style={{ marginTop: 8 }}>
                                        <p className="muted" style={{ marginBottom: 6 }}>
                                          Solution Steps
                                        </p>
                                        <MathText text={question.solutionSteps} />
                                      </div>
                                    )}
                                    {Boolean(questionDiagramData) && (
                                      <div className="preview-box" style={{ marginTop: 8 }}>
                                        <p className="muted" style={{ marginBottom: 6 }}>
                                          Diagram Data
                                        </p>
                                        <button
                                          type="button"
                                          className="btn secondary"
                                          style={{ marginBottom: 8 }}
                                          onClick={() => setActiveDiagram(questionDiagramData)}
                                        >
                                          Xem phong to
                                        </button>

                                        <button
                                          type="button"
                                          className="btn secondary"
                                          onClick={() => setActiveDiagram(questionDiagramData)}
                                          style={{
                                            cursor: 'zoom-in',
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: 0,
                                            border: 'none',
                                            background: 'transparent',
                                            boxShadow: 'none',
                                            color: 'inherit',
                                          }}
                                        >
                                          {questionDiagramLatexCode && (
                                            <LatexRenderer latex={questionDiagramLatexCode} />
                                          )}
                                          {!questionDiagramLatexCode &&
                                            questionDiagramLatexValues.length > 0 && (
                                              <div style={{ marginBottom: 8 }}>
                                                <p className="muted" style={{ marginBottom: 6 }}>
                                                  LaTeX Preview
                                                </p>
                                                <div
                                                  className="row"
                                                  style={{
                                                    flexDirection: 'column',
                                                    alignItems: 'stretch',
                                                    gap: 8,
                                                  }}
                                                >
                                                  {questionDiagramLatexValues.map((latexValue) => (
                                                    <div
                                                      key={`${question.id}-latex-${latexValue}`}
                                                      className="preview-box"
                                                    >
                                                      <LatexRenderer latex={latexValue} />
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          {!questionDiagramLatexCode &&
                                            questionDiagramLatexValues.length === 0 && (
                                              <p className="muted">
                                                Khong co du lieu preview cho diagram nay.
                                              </p>
                                            )}
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    <span
                                      className={`template-review-question__status ${isApproved ? 'approved' : 'pending'}`}
                                    >
                                      {questionStatusLabel[
                                        question.questionStatus ?? 'UNDER_REVIEW'
                                      ] ??
                                        question.questionStatus ??
                                        'Chờ duyệt'}
                                    </span>
                                  </td>
                                  <td>{question.correctAnswer || '-'}</td>
                                  <td>
                                    <div className="row template-review-question__actions">
                                      <button
                                        className="btn secondary"
                                        onClick={() => openEditQuestion(question)}
                                      >
                                        <Pencil size={14} />
                                        Sửa
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn--feat-emerald"
                                        disabled={isApproved || approveQuestionMutation.isPending}
                                        onClick={() => void handleApproveQuestion(question.id)}
                                      >
                                        <Check size={14} />
                                        Duyệt
                                      </button>
                                      <button
                                        className="btn danger"
                                        disabled={deleteQuestionMutation.isPending}
                                        onClick={() => void handleDeleteQuestion(question.id)}
                                      >
                                        <Trash2 size={14} />
                                        Xóa
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => {
                      setReviewOpen(false);
                      setSelectedQuestionIds(new Set());
                    }}
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    disabled={selectedQuestionIds.size === 0 || deleteQuestionMutation.isPending}
                    onClick={() => void handleDeleteSelectedQuestions()}
                  >
                    <Trash2 size={14} />
                    {deleteQuestionMutation.isPending
                      ? 'Đang xóa...'
                      : `Xóa đã chọn (${selectedQuestionIds.size})`}
                  </button>
                  <button
                    type="button"
                    className="btn btn--feat-emerald"
                    disabled={selectedQuestionIds.size === 0 || bulkApproveMutation.isPending}
                    onClick={() => void handleApproveSelectedQuestions()}
                  >
                    <CheckSquare size={14} />
                    {bulkApproveMutation.isPending
                      ? 'Đang phê duyệt...'
                      : `Phê duyệt đã chọn (${selectedQuestionIds.size})`}
                  </button>
                </div>
              </div>
            </div>
          )}



          {editingQuestion && (
            <div className="modal-layer">
              <div className="modal-card template-review-edit-modal">
                <div className="modal-header">
                  <div>
                    <h3>Chỉnh sửa câu hỏi</h3>
                    <p className="muted" style={{ marginTop: 4 }}>
                      Cập nhật nội dung trước khi duyệt.
                    </p>
                  </div>
                  <button className="icon-btn" onClick={closeEditQuestion}>
                    <X size={14} />
                  </button>
                </div>

                <div className="modal-body">
                  <label className="template-review-edit-modal__field">
                    <span className="muted">Nội dung câu hỏi</span>
                    <textarea
                      className="textarea"
                      rows={4}
                      value={editQuestionText}
                      onChange={(event) => setEditQuestionText(event.target.value)}
                    />
                  </label>
                  <label className="template-review-edit-modal__field">
                    <span className="muted">Đáp án đúng</span>
                    <input
                      className="input"
                      value={editCorrectAnswer}
                      onChange={(event) => setEditCorrectAnswer(event.target.value)}
                    />
                  </label>
                  <label className="template-review-edit-modal__field">
                    <span className="muted">Giải thích</span>
                    <textarea
                      className="textarea"
                      rows={3}
                      value={editExplanation}
                      onChange={(event) => setEditExplanation(event.target.value)}
                    />
                  </label>
                </div>

                <div className="modal-footer">
                  <button className="btn secondary" onClick={closeEditQuestion}>
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="btn btn--feat-violet"
                    onClick={() => void handleSaveQuestionEdit()}
                    disabled={updateQuestionMutation.isPending}
                  >
                    <Save size={14} />
                    {updateQuestionMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeDiagram != null && (
            <div className="modal-layer">
              <button
                type="button"
                aria-label="Dong preview"
                onClick={() => setActiveDiagram(null)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                }}
              />
              <div
                className="modal-card"
                style={{ width: 'min(1100px, 96vw)', position: 'relative', zIndex: 1 }}
              >
                <div className="modal-header">
                  <div>
                    <h3>Diagram Preview</h3>
                    <p className="muted" style={{ marginTop: 4 }}>
                      Bam ra ngoai hoac nut X de dong.
                    </p>
                  </div>
                  <button className="icon-btn" onClick={() => setActiveDiagram(null)}>
                    <X size={14} />
                  </button>
                </div>
                <div className="modal-body">
                  {activeDiagramLatexCode && <LatexRenderer latex={activeDiagramLatexCode} />}
                  {!activeDiagramLatexCode && activeDiagramLatexValues.length > 0 && (
                    <div
                      className="row"
                      style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}
                    >
                      {activeDiagramLatexValues.map((latexValue) => (
                        <div key={`diagram-modal-latex-${latexValue}`} className="preview-box">
                          <LatexRenderer latex={latexValue} />
                        </div>
                      ))}
                    </div>
                  )}
                  {!activeDiagramLatexCode && activeDiagramLatexValues.length === 0 && (
                    <div className="empty">Khong co du lieu preview de hien thi.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
