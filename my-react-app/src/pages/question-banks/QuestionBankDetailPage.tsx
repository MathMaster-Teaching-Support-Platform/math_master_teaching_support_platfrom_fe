import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  Database,
  Eye,
  EyeOff,
  GraduationCap,
  LayoutGrid,
  ListChecks,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  User,
  X,
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
  QbQuestionStatusBadge,
  QbSkeletonList,
} from '../../components/question-banks/qb-ui';
import { mockTeacher } from '../../data/mockData';
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

const selectCls =
  'w-full lg:w-auto lg:min-w-[168px] border border-[#E8E6DC] rounded-xl px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none bg-white transition-colors focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] disabled:bg-[#F5F4ED] disabled:text-[#87867F]';

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
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar ?? '', role: 'teacher' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="qb-scope w-full px-4 py-8 sm:px-6 lg:px-8 space-y-6">
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
            <button
              type="button"
              onClick={() => navigate('/teacher/question-banks')}
              className="inline-flex items-center gap-1 font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#87867F] hover:text-[#141413] transition-colors -mt-1 mb-1"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden />
              Tất cả ngân hàng
            </button>

            <div className="rounded-2xl border border-[#E8E6DC] bg-white shadow-[rgba(0,0,0,0.04)_0px_4px_24px] overflow-hidden">
              <div className="p-5 lg:p-6 flex flex-col gap-5">
                <div className="flex flex-col xl:flex-row xl:items-start gap-5 xl:justify-between">
                  <div className="flex gap-3 min-w-0">
                    <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] flex-shrink-0">
                      <Database className="w-5 h-5 lg:w-6 lg:h-6" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="font-[Playfair_Display] text-xl sm:text-[22px] font-medium text-[#141413] leading-tight">
                          {bank.name}
                        </h1>
                        {bank.isPublic ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-emerald-700">
                            <Eye className="w-3 h-3" aria-hidden />
                            Công khai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5F4ED] border border-[#E8E6DC] font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#5E5D59]">
                            <EyeOff className="w-3 h-3" aria-hidden />
                            Riêng tư
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 space-y-1.5 max-w-3xl">
                        {bank.description?.trim() ? (
                          <>
                            <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59] leading-relaxed">
                              {bank.description.trim()}
                            </p>
                            <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#B0AEA5]">
                              {(bank.questionCount ?? 0).toLocaleString('vi-VN')} câu hỏi trong ngân hàng
                            </p>
                          </>
                        ) : (
                          <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] leading-relaxed">
                            Ngân hàng có {(bank.questionCount ?? 0).toLocaleString('vi-VN')} câu hỏi.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end xl:flex-shrink-0">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                      onClick={() => {
                        void refetch();
                        void refetchQuestions();
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" aria-hidden />
                      Làm mới
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-50"
                      onClick={() => void handleTogglePublic()}
                      disabled={togglePublicMutation.isPending}
                    >
                      {bank.isPublic ? (
                        <EyeOff className="w-3.5 h-3.5" aria-hidden />
                      ) : (
                        <Eye className="w-3.5 h-3.5" aria-hidden />
                      )}
                      {bank.isPublic ? 'Riêng tư' : 'Công khai'}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                      onClick={() => setFormOpen(true)}
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden />
                      Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-red-200 bg-red-50 font-[Be_Vietnam_Pro] text-[13px] font-medium text-red-600 hover:bg-red-100 transition-colors"
                      onClick={() => setPendingDelete(true)}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden />
                      Xóa
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-[#F0EEE6]">
                  <div className="rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                      <ListChecks className="w-4 h-4 text-[#4F7EF7]" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="font-[Playfair_Display] text-lg font-medium text-[#141413] leading-none tabular-nums">
                        {(bank.questionCount ?? 0).toLocaleString('vi-VN')}
                      </p>
                      <p className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F] mt-1">
                        Câu hỏi
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-4 h-4 text-[#2EAD7A]" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`font-[Be_Vietnam_Pro] text-[13px] font-semibold leading-tight truncate ${
                          bank.schoolGradeName || bank.gradeLevel != null
                            ? 'text-[#141413]'
                            : 'text-[#B0AEA5]'
                        }`}
                      >
                        {bank.schoolGradeName ??
                          (bank.gradeLevel != null ? `Lớp ${bank.gradeLevel}` : 'Chưa gắn lớp')}
                      </p>
                      <p className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F] mt-1">Lớp</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF7ED] flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-[#E07B39]" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`font-[Be_Vietnam_Pro] text-[13px] font-semibold leading-tight truncate ${
                          bank.subjectName ? 'text-[#141413]' : 'text-[#B0AEA5]'
                        }`}
                      >
                        {bank.subjectName ?? 'Chưa gắn môn'}
                      </p>
                      <p className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F] mt-1">
                        Môn học
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-[#9B6FE0]" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413] leading-tight truncate">
                        {bank.teacherName || 'Không xác định'}
                      </p>
                      <p className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F] mt-1">
                        Giáo viên
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="inline-flex p-1 bg-[#F5F4ED] rounded-xl gap-0.5 flex-wrap"
              role="tablist"
              aria-label="Chế độ xem"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'matrix'}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-[Be_Vietnam_Pro] text-[13px] font-medium transition-all duration-150 ${
                  activeTab === 'matrix'
                    ? 'bg-white text-[#141413] shadow-sm'
                    : 'text-[#87867F] hover:text-[#5E5D59]'
                }`}
                onClick={() => setActiveTab('matrix')}
              >
                <LayoutGrid className="w-4 h-4 flex-shrink-0" aria-hidden />
                Theo ma trận
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'all'}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-[Be_Vietnam_Pro] text-[13px] font-medium transition-all duration-150 ${
                  activeTab === 'all'
                    ? 'bg-white text-[#141413] shadow-sm'
                    : 'text-[#87867F] hover:text-[#5E5D59]'
                }`}
                onClick={() => setActiveTab('all')}
              >
                <ListChecks className="w-4 h-4 flex-shrink-0" aria-hidden />
                Tất cả câu hỏi
                <span
                  className={`tabular-nums text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === 'all'
                      ? 'bg-[#EEF2FF] text-[#4F7EF7]'
                      : 'bg-[#E8E6DC] text-[#5E5D59]'
                  }`}
                >
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
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <label className="flex-1 w-full flex items-center gap-3 bg-[#FAF9F5] border border-[#E8E6DC] rounded-xl px-4 py-2.5 focus-within:border-[#C96442] focus-within:shadow-[0_0_0_3px_rgba(201,100,66,0.12)] transition-all duration-150">
                      <Search className="text-[#87867F] w-4 h-4 flex-shrink-0" aria-hidden />
                      <input
                        className="flex-1 font-[Be_Vietnam_Pro] text-[14px] text-[#141413] placeholder:text-[#87867F] bg-transparent outline-none min-w-0"
                        placeholder="Tìm trong trang hiện tại..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Tìm trong trang hiện tại"
                      />
                      {search ? (
                        <button
                          type="button"
                          aria-label="Xóa tìm kiếm"
                          onClick={() => setSearch('')}
                          className="text-[#87867F] hover:text-[#141413] transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : null}
                    </label>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C96442] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150 whitespace-nowrap lg:flex-shrink-0"
                      onClick={() => {
                        setBucketContext(null);
                        setAddModalOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4" aria-hidden />
                      Thêm câu hỏi
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
                    <select
                      className={selectCls}
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
                      className={selectCls}
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
                      className={selectCls}
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
                        className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors sm:ml-auto"
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
                  </div>
                </div>

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
                      <li key={question.id} className="qbd-question">
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
