import {
  ArrowRight,
  BookOpen,
  Database,
  Edit3,
  FileQuestion,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MathText from '../../components/common/MathText';
import Pagination from '../../components/common/Pagination';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  QbCognitiveBadge,
  QbConfirmDialog,
  QbEmptyState,
  QbErrorState,
  QbPageHeader,
  QbQuestionStatusBadge,
  QbSearchInput,
  QbSkeletonList,
  QbToolbar,
} from '../../components/question-banks/qb-ui';
import { useToast } from '../../context/ToastContext';
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
import './TeacherQuestionManagementPage.css';

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
        message:
          formMode === 'create' ? 'Tạo câu hỏi thành công.' : 'Cập nhật câu hỏi thành công.',
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

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="qb-scope qb-page tqm-page">
        <QbPageHeader
          title="Câu hỏi của tôi"
          subtitle="Tạo, chỉnh sửa, tìm kiếm và quản lý nhanh tất cả câu hỏi bạn đã soạn."
          count={totalElements}
          countLabel={`${totalElements} câu hỏi`}
          actions={
            <>
              <button
                type="button"
                className="qb-btn qb-btn--secondary"
                onClick={() => setBulkImportOpen(true)}
              >
                <FileSpreadsheet size={15} />
                Nhập từ Excel
              </button>
              <button type="button" className="qb-btn qb-btn--primary" onClick={openingCreateModal}>
                <Plus size={15} />
                Tạo câu hỏi
              </button>
            </>
          }
        />

        <nav className="tqm-quicknav" aria-label="Liên kết nhanh">
          <button
            type="button"
            className="tqm-quicknav__item"
            onClick={() => navigate('/teacher/question-banks')}
          >
            <span className="tqm-quicknav__icon tqm-quicknav__icon--blue">
              <Database size={15} />
            </span>
            <span className="tqm-quicknav__text">
              <span className="tqm-quicknav__title">Ngân hàng câu hỏi</span>
              <span className="tqm-quicknav__desc">Quản lý kho câu hỏi dùng cho ma trận đề</span>
            </span>
            <ArrowRight size={14} className="tqm-quicknav__arrow" />
          </button>
          <button
            type="button"
            className="tqm-quicknav__item"
            onClick={() => navigate('/teacher/question-templates')}
          >
            <span className="tqm-quicknav__icon tqm-quicknav__icon--violet">
              <Sparkles size={15} />
            </span>
            <span className="tqm-quicknav__text">
              <span className="tqm-quicknav__title">Mẫu câu hỏi</span>
              <span className="tqm-quicknav__desc">Soạn mẫu và sinh câu hỏi với AI</span>
            </span>
            <ArrowRight size={14} className="tqm-quicknav__arrow" />
          </button>
          <button
            type="button"
            className="tqm-quicknav__item"
            onClick={() => navigate('/teacher/assessments')}
          >
            <span className="tqm-quicknav__icon tqm-quicknav__icon--emerald">
              <BookOpen size={15} />
            </span>
            <span className="tqm-quicknav__text">
              <span className="tqm-quicknav__title">Tạo đề thi</span>
              <span className="tqm-quicknav__desc">Chỉnh sửa và xuất bản đề thi hoàn chỉnh</span>
            </span>
            <ArrowRight size={14} className="tqm-quicknav__arrow" />
          </button>
        </nav>

        <QbToolbar
          actions={
            <button
              type="button"
              className="qb-btn qb-btn--secondary"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              <RefreshCw size={14} />
              <span className="qb-hide-md">Làm mới</span>
            </button>
          }
        >
          <QbSearchInput
            value={searchName}
            onChange={setSearchName}
            placeholder="Tìm theo nội dung câu hỏi..."
          />
        </QbToolbar>

        {isLoading && <QbSkeletonList count={5} />}

        {isError && (
          <QbErrorState
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        )}

        {!isLoading && !isError && questions.length === 0 && (
          <QbEmptyState
            icon={<FileQuestion size={28} />}
            title={hasFilter ? 'Không có câu hỏi phù hợp' : 'Chưa có câu hỏi nào'}
            description={
              hasFilter
                ? 'Thử bỏ từ khóa tìm kiếm hoặc tạo câu hỏi mới.'
                : 'Bắt đầu bằng cách tạo câu hỏi mới hoặc nhập từ tệp Excel.'
            }
            action={
              hasFilter ? (
                <button
                  type="button"
                  className="qb-btn qb-btn--secondary"
                  onClick={() => setSearchName('')}
                >
                  Xóa bộ lọc
                </button>
              ) : (
                <button
                  type="button"
                  className="qb-btn qb-btn--primary"
                  onClick={openingCreateModal}
                >
                  <Plus size={15} />
                  Tạo câu hỏi
                </button>
              )
            }
          />
        )}

        {!isLoading && !isError && questions.length > 0 && (
          <div className="tqm-list">
            {questions.map((question) => (
              <article key={question.id} className="tqm-row qb-card">
                <div className="tqm-row__main">
                  <div className="tqm-row__text">
                    <MathText text={question.questionText} />
                  </div>
                  <div className="tqm-row__meta">
                    <span className="tqm-row__chip">
                      {QUESTION_TYPE_LABEL[question.questionType] ?? question.questionType}
                    </span>
                    <QbCognitiveBadge level={question.cognitiveLevel} variant="long" />
                    <QbQuestionStatusBadge status={question.questionStatus} />
                    <span className="tqm-row__chip tqm-row__chip--muted">
                      Cập nhật {formatDate(question.updatedAt)}
                    </span>
                  </div>
                </div>
                <div className="tqm-row__actions">
                  <button
                    type="button"
                    className="qb-btn qb-btn--secondary qb-btn--sm"
                    onClick={() => openingEditModal(question)}
                  >
                    <Edit3 size={13} />
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    className="qb-btn qb-btn--danger-outline qb-btn--sm"
                    onClick={() => setPendingDelete(question)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={13} />
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onChange={(p) => setPage(p)}
            onPageSizeChange={(size) => setPageSize(size)}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        )}

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
      </div>
    </DashboardLayout>
  );
}
