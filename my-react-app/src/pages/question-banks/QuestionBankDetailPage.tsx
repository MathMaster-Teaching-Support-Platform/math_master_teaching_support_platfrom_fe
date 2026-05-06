import { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  EyeOff,
  LayoutGrid,
  ListChecks,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  User,
} from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import { useNavigate, useParams } from 'react-router-dom';
import MathText from '../../components/common/MathText';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  QB_COGNITIVE_OPTIONS,
  QbAddQuestionsModal,
  QbCognitiveBadge,
  QbConfirmDialog,
  QbEmptyState,
  QbErrorState,
  QbInlineNotice,
  QbPageHeader,
  QbQuestionStatusBadge,
  QbSearchInput,
  QbSkeletonList,
  QbToolbar,
  QbVisibilityBadge,
} from '../../components/question-banks/qb-ui';
import { useToast } from '../../context/ToastContext';
import { questionBankService } from '../../services/questionBankService';
import { useGetQuestionsByBank } from '../../hooks/useQuestion';
import {
  useDeleteQuestionBank,
  useGetQuestionBankById,
  useToggleQuestionBankPublicStatus,
  useUpdateQuestionBank,
} from '../../hooks/useQuestionBank';
import '../../styles/qb-design-system.css';
import type { QuestionResponse } from '../../types/question';
import type { CognitiveLevelVi, QuestionBankRequest } from '../../types/questionBank';
import './QuestionBankDetailPage.css';
import { QuestionBankFormModal } from './QuestionBankFormModal';
import { QuestionBankTreeSection } from './QuestionBankTreeSection';

type Tab = 'matrix' | 'all';

type StatusFilter = 'ALL' | 'AI_DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ARCHIVED';

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'AI_DRAFT', label: 'Nháp AI' },
  { value: 'UNDER_REVIEW', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'ARCHIVED', label: 'Đã lưu trữ' },
];

const QUESTION_TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  MCQ: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng/Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  FILL_BLANK: 'Điền khuyết',
  ESSAY: 'Tự luận',
  CODING: 'Lập trình',
};

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export function QuestionBankDetailPage() {
  const { bankId } = useParams<{ bankId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('matrix');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [cognitiveFilter, setCognitiveFilter] = useState<'ALL' | string>('ALL');
  const [chapterFilter, setChapterFilter] = useState<'ALL' | string>('ALL');
  const [chapterOptions, setChapterOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);

  const [questionPage, setQuestionPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bucketContext, setBucketContext] = useState<{
    chapterId: string;
    chapterTitle?: string;
    level: CognitiveLevelVi;
  } | null>(null);
  const [treeRefreshNonce, setTreeRefreshNonce] = useState(0);

  const { data, isLoading, isError, error, refetch } = useGetQuestionBankById(
    bankId ?? '',
    !!bankId
  );
  const {
    data: questionsData,
    isLoading: questionsLoading,
    isError: questionsError,
    error: questionsErrorValue,
    refetch: refetchQuestions,
  } = useGetQuestionsByBank(bankId ?? '', questionPage, pageSize, !!bankId);

  const updateMutation = useUpdateQuestionBank();
  const deleteMutation = useDeleteQuestionBank();
  const togglePublicMutation = useToggleQuestionBankPublicStatus();

  const bank = data?.result;
  const questions = useMemo<QuestionResponse[]>(
    () => questionsData?.result?.content ?? [],
    [questionsData]
  );
  const totalQuestionPages =
    questionsData?.result?.totalPages ??
    (questionsData?.result as { page?: { totalPages?: number } } | undefined)?.page?.totalPages ??
    0;
  const totalQuestionElements =
    questionsData?.result?.totalElements ??
    (questionsData?.result as { page?: { totalElements?: number } } | undefined)?.page
      ?.totalElements ??
    questions.length;

  const filteredQuestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return questions.filter((item: QuestionResponse) => {
      if (statusFilter !== 'ALL' && item.questionStatus !== statusFilter) return false;
      if (cognitiveFilter !== 'ALL' && item.cognitiveLevel !== cognitiveFilter) return false;
      // chapter is shown only on the row text; the field exists on the
      // question record so we filter directly when a chapter is picked.
      if (
        chapterFilter !== 'ALL' &&
        (item as { chapterId?: string }).chapterId !== chapterFilter
      ) {
        return false;
      }
      if (!q) return true;
      const tagMatched = (item.tags ?? []).some((tag) => tag.toLowerCase().includes(q));
      return (
        item.questionText.toLowerCase().includes(q) ||
        (item.explanation?.toLowerCase().includes(q) ?? false) ||
        tagMatched
      );
    });
  }, [questions, search, statusFilter, cognitiveFilter, chapterFilter]);

  useEffect(() => {
    setQuestionPage(0);
  }, [pageSize]);

  // Load chapter list scoped to this bank's grade so the chapter filter only
  // shows relevant options. Re-run when the tree refreshes (e.g., after add).
  useEffect(() => {
    if (!bankId) return;
    let cancelled = false;
    questionBankService
      .getBankTree(bankId)
      .then((res) => {
        if (cancelled) return;
        const chapters = res.result?.chapters ?? [];
        setChapterOptions(
          chapters.map((c) => ({
            id: c.chapterId,
            label: `${c.orderIndex != null ? `Chương ${c.orderIndex}. ` : ''}${c.title}`,
          }))
        );
      })
      .catch(() => {
        if (cancelled) return;
        setChapterOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [bankId, treeRefreshNonce]);

  async function handleSave(payload: QuestionBankRequest) {
    if (!bankId) return;
    // mutateAsync throws on failure so the modal can show inline error.
    await updateMutation.mutateAsync({ id: bankId, request: payload });
    showToast({ type: 'success', message: 'Cập nhật ngân hàng câu hỏi thành công.' });
    await refetch();
  }

  async function handleConfirmDelete() {
    if (!bankId || !bank) return;
    try {
      await deleteMutation.mutateAsync(bankId);
      showToast({ type: 'success', message: `Đã xóa ngân hàng "${bank.name}".` });
      navigate('/teacher/question-banks');
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể xóa ngân hàng câu hỏi.',
      });
      setPendingDelete(false);
    }
  }

  async function handleTogglePublic() {
    if (!bank) return;
    try {
      await togglePublicMutation.mutateAsync(bank.id);
      showToast({
        type: 'success',
        message: bank.isPublic
          ? `Đã chuyển "${bank.name}" thành riêng tư.`
          : `Đã chia sẻ "${bank.name}" công khai.`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Không thể đổi trạng thái chia sẻ của ngân hàng.',
      });
    }
  }

  const hasFilters =
    !!search ||
    statusFilter !== 'ALL' ||
    cognitiveFilter !== 'ALL' ||
    chapterFilter !== 'ALL';

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
    >
      <div className="qb-scope qb-page qbd-page">
        {isLoading && <QbSkeletonList count={3} />}

        {isError && (
          <QbErrorState
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        )}

        {!isLoading && !isError && !bank && (
          <QbEmptyState
            title="Không tìm thấy ngân hàng"
            description="Ngân hàng câu hỏi này không tồn tại hoặc đã bị xóa."
            action={
              <button
                type="button"
                className="qb-btn qb-btn--secondary"
                onClick={() => navigate('/teacher/question-banks')}
              >
                Quay lại danh sách
              </button>
            }
          />
        )}

        {!isLoading && !isError && bank && (
          <>
            <QbPageHeader
              title={bank.name}
              subtitle={bank.description ?? `Ngân hàng có ${bank.questionCount ?? 0} câu hỏi.`}
              titleChip={<QbVisibilityBadge isPublic={bank.isPublic} />}
              onBack={() => navigate('/teacher/question-banks')}
              backLabel="Tất cả ngân hàng"
              actions={
                <>
                  <button
                    type="button"
                    className="qb-btn qb-btn--secondary"
                    onClick={() => {
                      void refetch();
                      void refetchQuestions();
                    }}
                  >
                    <RefreshCw size={14} />
                    <span className="qb-hide-md">Làm mới</span>
                  </button>
                  <button
                    type="button"
                    className="qb-btn qb-btn--secondary"
                    onClick={() => void handleTogglePublic()}
                    disabled={togglePublicMutation.isPending}
                  >
                    {bank.isPublic ? <EyeOff size={14} /> : <Eye size={14} />}
                    {bank.isPublic ? 'Riêng tư' : 'Công khai'}
                  </button>
                  <button
                    type="button"
                    className="qb-btn qb-btn--secondary"
                    onClick={() => setFormOpen(true)}
                  >
                    <Pencil size={14} />
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    className="qb-btn qb-btn--danger-outline"
                    onClick={() => setPendingDelete(true)}
                  >
                    <Trash2 size={14} />
                    Xóa
                  </button>
                </>
              }
            />

            {/* Compact meta strip */}
            <div className="qbd-meta">
              <span className="qbd-meta__item">
                <strong>{bank.questionCount ?? 0}</strong> câu hỏi
              </span>
              {(bank.schoolGradeName || bank.gradeLevel) && (
                <span className="qbd-meta__item">
                  Lớp:{' '}
                  <strong>{bank.schoolGradeName ?? `Lớp ${bank.gradeLevel}`}</strong>
                </span>
              )}
              {bank.subjectName && (
                <span className="qbd-meta__item">
                  Môn: <strong>{bank.subjectName}</strong>
                </span>
              )}
              <span className="qbd-meta__item qbd-meta__item--muted">
                <User size={12} />
                {bank.teacherName || 'Không xác định'}
              </span>
            </div>

            {/* Tabs */}
            <div className="qbd-tabs" role="tablist" aria-label="Chế độ xem">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'matrix'}
                className={`qbd-tab ${activeTab === 'matrix' ? 'qbd-tab--active' : ''}`}
                onClick={() => setActiveTab('matrix')}
              >
                <LayoutGrid size={14} />
                Theo ma trận
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'all'}
                className={`qbd-tab ${activeTab === 'all' ? 'qbd-tab--active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <ListChecks size={14} />
                Tất cả câu hỏi
                <span className="qbd-tab__count">
                  {(bank.questionCount ?? 0).toLocaleString('vi-VN')}
                </span>
              </button>
            </div>

            {activeTab === 'matrix' && bank.schoolGradeId && (
              <QuestionBankTreeSection
                bankId={bank.id}
                refreshNonce={treeRefreshNonce}
                onAddFromMyQuestions={(chapterId, level, chapterTitle) => {
                  setBucketContext({ chapterId, chapterTitle, level });
                  setAddModalOpen(true);
                }}
                onAddFromTemplate={(chapterId, level) => {
                  const params = new URLSearchParams({
                    bankId: bank.id,
                    chapterId,
                    cognitiveLevel: level,
                  });
                  navigate(`/teacher/question-templates?${params.toString()}`);
                }}
              />
            )}

            {activeTab === 'matrix' && !bank.schoolGradeId && (
              <QbInlineNotice tone="warn">
                Ngân hàng này chưa được gắn với lớp. Hãy chỉnh sửa để chọn lớp trước khi sử dụng
                xem theo ma trận.
              </QbInlineNotice>
            )}

            {activeTab === 'all' && (
              <>
                <QbToolbar
                  actions={
                    <button
                      type="button"
                      className="qb-btn qb-btn--primary"
                      onClick={() => {
                        setBucketContext(null);
                        setAddModalOpen(true);
                      }}
                    >
                      <Plus size={14} />
                      Thêm câu hỏi
                    </button>
                  }
                >
                  <QbSearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Tìm trong trang hiện tại..."
                  />
                  <select
                    className="qb-select qbd-filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    aria-label="Lọc theo trạng thái"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="qb-select qbd-filter-select"
                    value={chapterFilter}
                    onChange={(e) => setChapterFilter(e.target.value)}
                    aria-label="Lọc theo chương"
                    disabled={chapterOptions.length === 0}
                  >
                    <option value="ALL">Tất cả chương</option>
                    {chapterOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="qb-select qbd-filter-select"
                    value={cognitiveFilter}
                    onChange={(e) => setCognitiveFilter(e.target.value)}
                    aria-label="Lọc theo mức độ"
                  >
                    <option value="ALL">Tất cả mức độ</option>
                    {QB_COGNITIVE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {hasFilters && (
                    <button
                      type="button"
                      className="qb-btn qb-btn--ghost qb-btn--sm"
                      onClick={() => {
                        setSearch('');
                        setStatusFilter('ALL');
                        setCognitiveFilter('ALL');
                        setChapterFilter('ALL');
                      }}
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </QbToolbar>

                {questionsLoading && <QbSkeletonList count={5} />}

                {questionsError && (
                  <QbErrorState
                    message={
                      questionsErrorValue instanceof Error
                        ? questionsErrorValue.message
                        : undefined
                    }
                    onRetry={() => void refetchQuestions()}
                  />
                )}

                {!questionsLoading && !questionsError && filteredQuestions.length === 0 && (
                  <QbEmptyState
                    title={hasFilters ? 'Không có câu hỏi phù hợp' : 'Ngân hàng này chưa có câu hỏi'}
                    description={
                      hasFilters
                        ? 'Thử bỏ bộ lọc hoặc chuyển sang trang khác.'
                        : 'Bấm "Thêm câu hỏi" để bắt đầu xây dựng ngân hàng.'
                    }
                    action={
                      hasFilters ? (
                        <button
                          type="button"
                          className="qb-btn qb-btn--secondary"
                          onClick={() => {
                            setSearch('');
                            setStatusFilter('ALL');
                            setCognitiveFilter('ALL');
                            setChapterFilter('ALL');
                          }}
                        >
                          Xóa bộ lọc
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="qb-btn qb-btn--primary"
                          onClick={() => {
                            setBucketContext(null);
                            setAddModalOpen(true);
                          }}
                        >
                          <Plus size={14} />
                          Thêm câu hỏi
                        </button>
                      )
                    }
                  />
                )}

                {!questionsLoading && !questionsError && filteredQuestions.length > 0 && (
                  <ul className="qbd-question-list">
                    {filteredQuestions.map((question) => (
                      <li key={question.id} className="qbd-question qb-card">
                        <div className="qbd-question__text">
                          <MathText text={question.questionText} />
                        </div>
                        <div className="qbd-question__meta">
                          <span className="qbd-question__chip">
                            {QUESTION_TYPE_LABEL[question.questionType] ??
                              question.questionType}
                          </span>
                          <QbCognitiveBadge level={question.cognitiveLevel} variant="long" />
                          <QbQuestionStatusBadge status={question.questionStatus} />
                          {typeof question.points === 'number' && (
                            <span className="qbd-question__chip qbd-question__chip--muted">
                              {question.points} điểm
                            </span>
                          )}
                          {question.tags && question.tags.length > 0 && (
                            <span className="qbd-question__chip qbd-question__chip--muted">
                              {question.tags.slice(0, 3).join(' · ')}
                              {question.tags.length > 3
                                ? ` +${question.tags.length - 3}`
                                : ''}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {totalQuestionPages > 0 && (
                  <Pagination
                    page={questionPage}
                    totalPages={totalQuestionPages}
                    totalElements={totalQuestionElements}
                    pageSize={pageSize}
                    onChange={setQuestionPage}
                    onPageSizeChange={(s) => {
                      setPageSize(s);
                      setQuestionPage(0);
                    }}
                    pageSizeOptions={PAGE_SIZE_OPTIONS}
                  />
                )}
              </>
            )}

            <QuestionBankFormModal
              isOpen={formOpen}
              mode="edit"
              initialData={bank}
              onClose={() => setFormOpen(false)}
              onSubmit={handleSave}
            />

            <QbAddQuestionsModal
              isOpen={addModalOpen}
              bankId={bank.id}
              bucketContext={bucketContext}
              onClearBucket={() => setBucketContext(null)}
              onClose={() => {
                setAddModalOpen(false);
                setBucketContext(null);
              }}
              onAssigned={async (count) => {
                showToast({ type: 'success', message: `Đã thêm ${count} câu hỏi.` });
                setAddModalOpen(false);
                setBucketContext(null);
                setTreeRefreshNonce((n) => n + 1);
                await Promise.all([refetch(), refetchQuestions()]);
              }}
            />

            <QbConfirmDialog
              isOpen={pendingDelete}
              tone="danger"
              title="Xóa ngân hàng câu hỏi?"
              message={
                <>
                  Bạn sắp xóa <strong>"{bank.name}"</strong>. Câu hỏi sẽ được gỡ liên kết khỏi
                  ngân hàng nhưng vẫn còn trong hệ thống. Hành động này không thể hoàn tác.
                </>
              }
              confirmLabel="Xóa ngân hàng"
              busy={deleteMutation.isPending}
              onConfirm={handleConfirmDelete}
              onCancel={() => setPendingDelete(false)}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
