import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowRight,
  Check,
  CheckSquare,
  Eye,
  EyeOff,
  FileText,
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
import {
  useArchiveTemplate,
  useCreateQuestionTemplate,
  useDeleteQuestionTemplate,
  useGetMyQuestionTemplates,
  usePublishTemplate,
  useTogglePublicStatus,
  useUpdateQuestionTemplate,
} from '../../hooks/useQuestionTemplate';
import {
  useApproveQuestion,
  useBulkApproveQuestions,
  useDeleteQuestion,
  useReviewQuestions,
  useUpdateQuestion,
} from '../../hooks/useQuestion';
import {
  TemplateStatus,
  type QuestionTemplateRequest,
  type QuestionTemplateResponse,
  type TemplateDraft,
} from '../../types/questionTemplate';
import type { QuestionResponse } from '../../types/question';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import '../../styles/module-refactor.css';
import { TemplateFormModal } from './TemplateFormModal';
import { TemplateImportModal } from './TemplateImportModal';
import { TemplateTestModal } from './TemplateTestModal';
import MathText from '../../components/common/MathText';
import { useNavigate } from 'react-router-dom';
import './template-review.css';

const statusFilters: Array<'ALL' | TemplateStatus> = [
  'ALL',
  TemplateStatus.DRAFT,
  TemplateStatus.PUBLISHED,
  TemplateStatus.ARCHIVED,
];

const statusClass: Record<TemplateStatus, string> = {
  DRAFT: 'badge draft',
  PUBLISHED: 'badge published',
  ARCHIVED: 'badge archived',
};

const statusLabel: Record<'ALL' | TemplateStatus, string> = {
  ALL: 'Tất cả',
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã xuất bản',
  ARCHIVED: 'Lưu trữ',
};

const cardStatusLabel: Record<TemplateStatus, string> = {
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

export function TemplateDashboard() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | TemplateStatus>('ALL');
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [selected, setSelected] = useState<QuestionTemplateResponse | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTemplateId, setReviewTemplateId] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [editingQuestion, setEditingQuestion] = useState<QuestionResponse | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('');
  const [editExplanation, setEditExplanation] = useState('');

  const { data, isLoading, isError, error, refetch } = useGetMyQuestionTemplates(
    0,
    200,
    'createdAt',
    'DESC'
  );

  const createMutation = useCreateQuestionTemplate();
  const updateMutation = useUpdateQuestionTemplate();
  const deleteMutation = useDeleteQuestionTemplate();
  const publishMutation = usePublishTemplate();
  const archiveMutation = useArchiveTemplate();
  const togglePublicMutation = useTogglePublicStatus();
  const bulkApproveMutation = useBulkApproveQuestions();
  const approveQuestionMutation = useApproveQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();

  const reviewQuestionsQuery = useReviewQuestions(
    reviewTemplateId,
    reviewOpen && Boolean(reviewTemplateId)
  );

  const templates = data?.result?.content ?? [];

  const filtered = useMemo(() => {
    return templates.filter((item) => {
      if (status !== 'ALL' && item.status !== status) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [search, status, templates]);

  const reviewQuestions = reviewQuestionsQuery.data?.result ?? [];

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

  function openCreateFromDraft(draft?: TemplateDraft) {
    setMode('create');
    setSelected(draft as QuestionTemplateResponse | null);
    setFormOpen(true);
  }

  function openReviewModal(templateId?: string) {
    setReviewTemplateId(templateId ?? templates[0]?.id ?? '');
    setReviewOpen(true);
  }

  async function handleApproveSelectedQuestions() {
    if (selectedQuestionIds.size === 0) return;
    try {
      await bulkApproveMutation.mutateAsync(Array.from(selectedQuestionIds));
      setToast({
        type: 'success',
        message: `Đã phê duyệt ${selectedQuestionIds.size} câu hỏi thành công.`,
      });
      setSelectedQuestionIds(new Set());
      void reviewQuestionsQuery.refetch();
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể phê duyệt câu hỏi đã chọn.',
      });
    }
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
      setToast({ type: 'success', message: 'Đã duyệt câu hỏi thành công.' });
      void reviewQuestionsQuery.refetch();
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể duyệt câu hỏi.',
      });
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    try {
      await deleteQuestionMutation.mutateAsync(questionId);
      setToast({ type: 'success', message: 'Đã xóa câu hỏi.' });
      setSelectedQuestionIds((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
      void reviewQuestionsQuery.refetch();
    } catch (error) {
      setToast({
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
      setToast({ type: 'success', message: 'Đã cập nhật câu hỏi.' });
      closeEditQuestion();
      void reviewQuestionsQuery.refetch();
    } catch (error) {
      setToast({
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
    >
      <div className="module-layout-container">
        <section className="module-page">
          <header className="page-header">
            <div>
              <h2>Mẫu câu hỏi</h2>
              <p>Quản lý logic tạo câu hỏi tái sử dụng và vòng đời của mẫu.</p>
            </div>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <button className="btn secondary" onClick={() => setImportOpen(true)}>
                <Upload size={14} />
                Nhập file
              </button>
              <button
                className="btn"
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

          <section className="hero-card">
            <p className="hero-kicker">Phân tách trách nhiệm</p>
            <h2>Soạn mẫu và xét duyệt câu hỏi theo mẫu ngay tại đây</h2>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <button className="btn secondary" onClick={() => openReviewModal()}>
                Xét duyệt theo mẫu <ArrowRight size={14} />
              </button>
              <button className="btn secondary" onClick={() => navigate('/teacher/question-banks')}>
                Sang Ngân hàng câu hỏi để quản lý kho <ArrowRight size={14} />
              </button>
              <button className="btn" onClick={() => navigate('/teacher/assessment-builder')}>
                Tiếp tục lắp đề ở Trình tạo đề
              </button>
            </div>
            <p className="muted" style={{ marginTop: 6 }}>
              Chọn mẫu câu hỏi, xem trước toàn bộ câu đã sinh từ mẫu đó và phê duyệt nhanh theo lô.
            </p>
          </section>

          <div className="toolbar">
            <label className="row" style={{ minWidth: 260 }}>
              <Search size={15} />
              <input
                className="input"
                style={{ border: 0, padding: 0, width: '100%' }}
                placeholder="Tìm mẫu câu hỏi"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className="pill-group">
              {statusFilters.map((item) => (
                <button
                  key={item}
                  className={`pill-btn ${status === item ? 'active' : ''}`}
                  onClick={() => setStatus(item)}
                >
                  {statusLabel[item]}
                </button>
              ))}
            </div>

            <button className="btn secondary" onClick={() => void refetch()}>
              <RefreshCw size={14} />
              Làm mới
            </button>
          </div>

          {isLoading && <div className="empty">Đang tải danh sách mẫu...</div>}
          {isError && (
            <div className="empty">
              {error instanceof Error ? error.message : 'Không thể tải danh sách mẫu'}
            </div>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="empty">Không tìm thấy mẫu phù hợp.</div>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <div className="grid-cards">
              {filtered.map((template) => (
                <article key={template.id} className="data-card">
                  <div className="row">
                    <span className={statusClass[template.status]}>
                      {cardStatusLabel[template.status]}
                    </span>
                    <button
                      className="btn secondary"
                      onClick={() => togglePublicMutation.mutate(template.id)}
                    >
                      {template.isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
                      {template.isPublic ? 'Công khai' : 'Riêng tư'}
                    </button>
                  </div>

                  <div>
                    <h3><MathText text={template.name} /></h3>
                    <p className="muted" style={{ marginTop: 6 }}>
                      <MathText text={template.description || 'Không có mô tả'} />
                    </p>
                  </div>

                  <div className="row" style={{ justifyContent: 'start', flexWrap: 'wrap' }}>
                    <span className="muted">
                      {templateTypeLabel[template.templateType] || template.templateType}
                    </span>
                    <span className="muted">
                      {cognitiveLevelLabel[template.cognitiveLevel] || template.cognitiveLevel}
                    </span>
                    <span className="muted">Đã dùng: {template.usageCount ?? 0} lần</span>
                  </div>

                  <div className="row" style={{ flexWrap: 'wrap' }}>
                    <button
                      className="btn secondary"
                      onClick={() => {
                        setSelected(template);
                        setTestOpen(true);
                      }}
                    >
                      <Play size={14} />
                      Tạo câu hỏi
                    </button>

                    <button
                      className="btn secondary"
                      onClick={() => openReviewModal(template.id)}
                    >
                      <CheckSquare size={14} />
                      Xét duyệt
                    </button>

                    {template.status === TemplateStatus.DRAFT && (
                      <button className="btn" onClick={() => publishMutation.mutate(template.id)}>
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

                    <button
                      className="btn danger"
                      onClick={() => deleteMutation.mutate(template.id)}
                    >
                      <Trash2 size={14} />
                      Xóa
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <TemplateFormModal
            isOpen={formOpen}
            onClose={() => setFormOpen(false)}
            mode={mode}
            initialData={selected}
            onSubmit={saveTemplate}
          />

          <TemplateImportModal
            isOpen={importOpen}
            onClose={() => setImportOpen(false)}
            onUseTemplate={(draft) => {
              setImportOpen(false);
              openCreateFromDraft(draft);
            }}
          />

          {selected && (
            <TemplateTestModal
              isOpen={testOpen}
              onClose={() => setTestOpen(false)}
              template={selected}
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

                  {!reviewTemplateId && <div className="empty">Hãy chọn một mẫu để bắt đầu xét duyệt.</div>}

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
                                    reviewQuestions.filter((question) => question.questionStatus !== 'APPROVED')
                                      .length > 0 &&
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
                                    {question.explanation && (
                                      <p className="muted template-review-question__explanation">
                                        Giải thích: <MathText text={question.explanation} />
                                      </p>
                                    )}
                                  </td>
                                  <td>
                                    <span
                                      className={`template-review-question__status ${isApproved ? 'approved' : 'pending'}`}
                                    >
                                      {questionStatusLabel[question.questionStatus ?? 'UNDER_REVIEW'] ??
                                        (question.questionStatus ?? 'Chờ duyệt')}
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
                                        className="btn"
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
                    className="btn"
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
                    className="btn"
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

          {toast && (
            <div className={`template-review-toast template-review-toast--${toast.type}`}>
              {toast.message}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
