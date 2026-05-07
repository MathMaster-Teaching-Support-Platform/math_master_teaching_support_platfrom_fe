import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  Database,
  Edit3,
  FileQuestion,
  FileSpreadsheet,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MathText from '../../components/common/MathText';
import Pagination from '../../components/common/Pagination';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { QbCognitiveBadge, QbConfirmDialog, QbQuestionStatusBadge } from '../../components/question-banks/qb-ui';
import { useToast } from '../../context/ToastContext';
import { mockTeacher } from '../../data/mockData';
import { useDebounce } from '../../hooks/useDebounce';
import {
  useCreateQuestion,
  useDeleteQuestion,
  useGetMyQuestions,
  useUpdateQuestion,
} from '../../hooks/useQuestion';
import '../../styles/qb-design-system.css';
import type {
  CreateQuestionRequest,
  QuestionResponse,
  UpdateQuestionRequest,
} from '../../types/question';
import { EnhancedQuestionFormModal } from './EnhancedQuestionFormModal';
import { QuestionBulkImportModal } from './QuestionBulkImportModal';

type FormMode = 'create' | 'edit';

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

function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function TeacherQuestionManagementPage() {
  const navigate = useNavigate();
  const [searchName, setSearchName] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionResponse | null>(null);
  const [pendingDelete, setPendingDelete] = useState<QuestionResponse | null>(null);

  const debouncedSearchName = useDebounce(searchName, 300);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearchName, pageSize]);

  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      sortBy: 'createdAt',
      sortDirection: 'DESC' as const,
      searchName: debouncedSearchName.trim() || undefined,
    }),
    [page, debouncedSearchName, pageSize]
  );

  const { showToast } = useToast();

  const { data, isLoading, isError, error, refetch } = useGetMyQuestions(queryParams);
  const createMutation = useCreateQuestion();
  const updateMutation = useUpdateQuestion();
  const deleteMutation = useDeleteQuestion();

  const questions = useMemo(() => data?.result?.content ?? [], [data]);
  const totalPages =
    data?.result?.totalPages ??
    (data?.result as { page?: { totalPages?: number } } | undefined)?.page?.totalPages ??
    0;
  const totalElements =
    data?.result?.totalElements ??
    (data?.result as { page?: { totalElements?: number } } | undefined)?.page?.totalElements ??
    questions.length;

  const pageStats = useMemo(() => {
    const approved = questions.filter((q) => q.questionStatus === 'APPROVED').length;
    const pendingOrDraft = questions.filter(
      (q) => q.questionStatus === 'UNDER_REVIEW' || q.questionStatus === 'AI_DRAFT'
    ).length;
    const mcq = questions.filter((q) => q.questionType === 'MULTIPLE_CHOICE').length;
    const aiCount = questions.filter((q) => q.questionSourceType === 'AI_GENERATED').length;
    return { approved, pendingOrDraft, mcq, aiCount };
  }, [questions]);

  const openingCreateModal = () => {
    setFormMode('create');
    setSelectedQuestion(null);
    setIsModalOpen(true);
  };

  const openingEditModal = (question: QuestionResponse) => {
    setFormMode('edit');
    setSelectedQuestion(question);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  async function handleSubmitForm(data: Record<string, unknown>) {
    try {
      if (formMode === 'create') {
        const payload: CreateQuestionRequest = {
          questionText: String(data.questionText || ''),
          questionType: data.questionType as CreateQuestionRequest['questionType'],
          difficulty: data.difficulty as CreateQuestionRequest['difficulty'],
          points: typeof data.points === 'number' ? data.points : undefined,
          correctAnswer: data.correctAnswer ? String(data.correctAnswer) : undefined,
          explanation: data.explanation ? String(data.explanation) : undefined,
          tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
          options: data.options as Record<string, unknown> | undefined,
          diagramData: typeof data.diagramData === 'string' ? data.diagramData : undefined,
        };
        await createMutation.mutateAsync(payload);
      } else if (selectedQuestion) {
        const payload: UpdateQuestionRequest = {
          questionText: String(data.questionText || ''),
          difficulty: data.difficulty as UpdateQuestionRequest['difficulty'],
          points: typeof data.points === 'number' ? data.points : undefined,
          correctAnswer: data.correctAnswer ? String(data.correctAnswer) : undefined,
          explanation: data.explanation ? String(data.explanation) : undefined,
          tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
          options: data.options as Record<string, unknown> | undefined,
          diagramData: typeof data.diagramData === 'string' ? data.diagramData : undefined,
        };
        await updateMutation.mutateAsync({ questionId: selectedQuestion.id, request: payload });
      }

      showToast({
        type: 'success',
        message: formMode === 'create' ? 'Tạo câu hỏi thành công.' : 'Cập nhật câu hỏi thành công.',
      });
      closeModal();
      await refetch();
    } catch (error_) {
      showToast({
        type: 'error',
        message: error_ instanceof Error ? error_.message : 'Không thể lưu câu hỏi.',
      });
      throw error_;
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      showToast({ type: 'success', message: 'Đã xóa câu hỏi thành công.' });
      setPendingDelete(null);
      await refetch();
    } catch (error_) {
      showToast({
        type: 'error',
        message: error_ instanceof Error ? error_.message : 'Không thể xóa câu hỏi.',
      });
      setPendingDelete(null);
    }
  }

  const hasFilter = !!searchName;

  const quickLinks = [
    {
      key: 'banks',
      title: 'Ngân hàng câu hỏi',
      desc: 'Quản lý kho câu hỏi dùng cho ma trận đề',
      icon: Database,
      iconBg: 'bg-[#EEF2FF]',
      iconColor: 'text-[#4F7EF7]',
      onClick: () => navigate('/teacher/question-banks'),
    },
    {
      key: 'templates',
      title: 'Mẫu câu hỏi',
      desc: 'Soạn mẫu và sinh câu hỏi với AI',
      icon: Sparkles,
      iconBg: 'bg-[#F5F3FF]',
      iconColor: 'text-[#9B6FE0]',
      onClick: () => navigate('/teacher/question-templates'),
    },
    {
      key: 'assessments',
      title: 'Tạo đề thi',
      desc: 'Chỉnh sửa và công khai đề thi hoàn chỉnh',
      icon: BookOpen,
      iconBg: 'bg-[#ECFDF5]',
      iconColor: 'text-[#2EAD7A]',
      onClick: () => navigate('/teacher/assessments'),
    },
  ] as const;

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar ?? '', role: 'teacher' }}
      notificationCount={5}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-6">
          {/* ── Page header (TeacherMindmaps pattern) ── */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                    Câu hỏi của tôi
                  </h1>
                  {!isLoading && !isError && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                      {totalElements}
                    </span>
                  )}
                </div>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                  {pageStats.approved} đã duyệt • {pageStats.aiCount} AI • {pageStats.pendingOrDraft} chờ /
                  nháp <span className="text-[#B0AEA5]">(trang hiện tại)</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setBulkImportOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Nhập từ Excel
              </button>
              <button
                type="button"
                onClick={openingCreateModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C96442] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150"
              >
                <Plus className="w-3.5 h-3.5" />
                Tạo câu hỏi
              </button>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(
              [
                {
                  label: 'Tổng câu hỏi',
                  value: totalElements,
                  Icon: FileQuestion,
                  bg: 'bg-[#EEF2FF]',
                  color: 'text-[#4F7EF7]',
                },
                {
                  label: 'Đã duyệt (trang)',
                  value: pageStats.approved,
                  Icon: CheckCircle2,
                  bg: 'bg-[#ECFDF5]',
                  color: 'text-[#2EAD7A]',
                },
                {
                  label: 'Chờ / nháp (trang)',
                  value: pageStats.pendingOrDraft,
                  Icon: Clock,
                  bg: 'bg-[#FFF7ED]',
                  color: 'text-[#E07B39]',
                },
                {
                  label: 'Trắc nghiệm (trang)',
                  value: pageStats.mcq,
                  Icon: FileText,
                  bg: 'bg-[#F5F3FF]',
                  color: 'text-[#9B6FE0]',
                },
              ] as const
            ).map(({ label, value, Icon, bg, color }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-[#E8E6DC] p-4 flex items-center gap-3"
              >
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] leading-none">
                    {isLoading ? '…' : value}
                  </p>
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Quick links ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {quickLinks.map(({ key, title, desc, icon: Icon, iconBg, iconColor, onClick }) => (
              <button
                key={key}
                type="button"
                onClick={onClick}
                className="group flex items-center gap-3 w-full text-left p-4 rounded-2xl bg-white border border-[#E8E6DC] hover:shadow-[rgba(0,0,0,0.06)_0px_4px_16px] hover:-translate-y-0.5 transition-all duration-200"
              >
                <div
                  className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <span className="flex-1 min-w-0">
                  <span className="block font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413]">
                    {title}
                  </span>
                  <span className="block font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5 leading-snug">
                    {desc}
                  </span>
                </span>
                <ArrowRight className="w-4 h-4 text-[#B0AEA5] flex-shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-[#C96442]" />
              </button>
            ))}
          </div>

          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="flex-1 w-full flex items-center gap-3 bg-[#FAF9F5] border border-[#E8E6DC] rounded-xl px-4 py-2.5 focus-within:border-[#3898EC] focus-within:shadow-[0_0_0_3px_rgba(56,152,236,0.12)] transition-all duration-150">
              <Search className="text-[#87867F] w-4 h-4 flex-shrink-0" />
              <input
                className="flex-1 font-[Be_Vietnam_Pro] text-[14px] text-[#141413] placeholder:text-[#87867F] bg-transparent outline-none"
                placeholder="Tìm theo nội dung câu hỏi..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              {searchName ? (
                <button
                  type="button"
                  aria-label="Xóa tìm kiếm"
                  onClick={() => setSearchName('')}
                  className="text-[#87867F] hover:text-[#141413] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </label>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>

          {/* ── Summary bar ── */}
          {!isLoading && !isError && questions.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DC]">
              <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] uppercase tracking-wide">
                Hiển thị
              </span>
              <strong className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">
                {questions.length} / {totalElements}
              </strong>
              <div className="w-px h-4 bg-[#E8E6DC] hidden sm:block" />
              <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                Trang{' '}
                <strong className="text-[#141413] font-semibold">
                  {page + 1} / {Math.max(totalPages, 1)}
                </strong>
              </span>
            </div>
          )}

          {/* ── Loading ── */}
          {isLoading && (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] h-[88px] animate-pulse"
                />
              ))}
            </div>
          )}

          {/* ── Error ── */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#B53333] text-center max-w-md">
                {error instanceof Error ? error.message : 'Không thể tải danh sách câu hỏi.'}
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-1 px-4 py-2.5 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] active:scale-[0.98] transition-all duration-150"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* ── Empty ── */}
          {!isLoading && !isError && questions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8E6DC] flex items-center justify-center text-[#B0AEA5]">
                {hasFilter ? <Search className="w-6 h-6" /> : <FileQuestion className="w-6 h-6" />}
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F] text-center">
                {hasFilter
                  ? 'Không có câu hỏi phù hợp với từ khóa.'
                  : 'Chưa có câu hỏi nào. Hãy tạo câu hỏi hoặc nhập từ Excel.'}
              </p>
              {hasFilter ? (
                <button
                  type="button"
                  onClick={() => setSearchName('')}
                  className="mt-1 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                >
                  Xóa bộ lọc
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openingCreateModal}
                  className="mt-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] active:scale-[0.98] transition-all duration-150"
                >
                  Tạo câu hỏi <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* ── List ── */}
          {!isLoading && !isError && questions.length > 0 && (
            <div className="flex flex-col gap-2">
              {questions.map((question) => (
                <article
                  key={question.id}
                  className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] p-4 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-white hover:shadow-[rgba(0,0,0,0.06)_0px_4px_16px] transition-all duration-150"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] flex items-center justify-center flex-shrink-0 text-[#4F7EF7]">
                      <FileQuestion className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="font-[Be_Vietnam_Pro] text-[14px] text-[#141413] leading-snug line-clamp-2 [&_.katex]:text-[13px]">
                        <MathText text={question.questionText} />
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white border border-[#E8E6DC] font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#5E5D59]">
                          {QUESTION_TYPE_LABEL[question.questionType] ?? question.questionType}
                        </span>
                        <QbCognitiveBadge level={question.cognitiveLevel} variant="long" />
                        <QbQuestionStatusBadge status={question.questionStatus} />
                        <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#B0AEA5]">
                          Cập nhật {formatDate(question.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 lg:justify-end">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors inline-flex items-center gap-1.5"
                      onClick={() => openingEditModal(question)}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 font-[Be_Vietnam_Pro] text-[12px] font-medium text-red-600 hover:bg-red-100 transition-colors inline-flex items-center gap-1.5"
                      onClick={() => setPendingDelete(question)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {totalPages > 0 && (
            <div className="pt-2">
              <Pagination
                page={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onChange={(p) => setPage(p)}
                onPageSizeChange={(size) => setPageSize(size)}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
              />
            </div>
          )}
        </div>
      </div>

      <EnhancedQuestionFormModal
        isOpen={isModalOpen}
        mode={formMode}
        initialData={
          selectedQuestion
            ? {
                questionId: selectedQuestion.id,
                questionText: selectedQuestion.questionText,
                questionType: selectedQuestion.questionType,
                difficulty: selectedQuestion.difficulty,
                points: selectedQuestion.points,
                correctAnswer: selectedQuestion.correctAnswer,
                explanation: selectedQuestion.explanation,
                tags: selectedQuestion.tags,
                options: selectedQuestion.options as Record<string, string> | undefined,
                generationMetadata: selectedQuestion.generationMetadata || undefined,
                diagramData: selectedQuestion.diagramData,
                diagramUrl: selectedQuestion.diagramUrl,
              }
            : undefined
        }
        onClose={closeModal}
        onSubmit={(data) => handleSubmitForm(data)}
      />

      <QuestionBulkImportModal
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onSuccess={() => {
          setBulkImportOpen(false);
          void refetch();
        }}
      />

      <QbConfirmDialog
        isOpen={pendingDelete !== null}
        tone="danger"
        title="Xóa câu hỏi này?"
        message="Hành động này sẽ xóa câu hỏi khỏi danh sách của bạn. Câu hỏi đã liên kết với các bài kiểm tra sẽ không bị ảnh hưởng."
        confirmLabel="Xóa câu hỏi"
        busy={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </DashboardLayout>
  );
}
