import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Database,
  Edit3,
  FileQuestion,
  FileSpreadsheet,
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
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import {
  useCreateQuestion,
  useDeleteQuestion,
  useGetMyQuestions,
  useUpdateQuestion,
} from '../../hooks/useQuestion';
import '../../styles/module-refactor.css';
import type {
  CreateQuestionRequest,
  QuestionResponse,
  UpdateQuestionRequest,
} from '../../types/question';
import '../courses/TeacherCourses.css';
import { EnhancedQuestionFormModal } from './EnhancedQuestionFormModal';
import { QuestionBulkImportModal } from './QuestionBulkImportModal';
import './TeacherQuestionManagementPage.css';

type FormMode = 'create' | 'edit';

const questionTypeLabel: Record<string, string> = {
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
};

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
}

export default function TeacherQuestionManagementPage() {
  const navigate = useNavigate();
  const [searchName, setSearchName] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionResponse | null>(null);

  const debouncedSearchName = useDebounce(searchName, 300);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearchName]);

  const queryParams = useMemo(
    () => ({
      page,
      size,
      sortBy: 'createdAt',
      sortDirection: 'DESC' as const,
      searchName: debouncedSearchName.trim() || undefined,
    }),
    [page, debouncedSearchName, size]
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
        message: formMode === 'create' ? 'Tạo câu hỏi thành công.' : 'Cập nhật câu hỏi thành công.',
      });
      closeModal();
      await refetch();
    } catch (error_) {
      showToast({
        type: 'error',
        message: error_ instanceof Error ? error_.message : 'Khong the luu câu hỏi.',
      });
      throw error_;
    }
  }

  async function handleDeleteQuestion(question: QuestionResponse) {
    const isConfirmed = globalThis.confirm('Ban co chac chan muon xoa câu hỏi nay?');
    if (!isConfirmed) return;

    try {
      await deleteMutation.mutateAsync(question.id);
      showToast({ type: 'success', message: 'Đã xóa câu hỏi thành công.' });
      await refetch();
    } catch (error_) {
      showToast({
        type: 'error',
        message: error_ instanceof Error ? error_.message : 'Không thể xóa câu hỏi.',
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
        <section className="module-page teacher-courses-page teacher-question-management-page">
          <header className="page-header courses-header-row">
            <div className="header-stack">
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Quản lý câu hỏi của tôi</h2>
                {!isLoading && <span className="count-chip">{totalElements}</span>}
              </div>
              <p className="header-sub">Tạo, chỉnh sửa, xóa và tìm nhanh câu hỏi</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn secondary" onClick={() => setBulkImportOpen(true)}>
                <FileSpreadsheet size={14} />
                Nhập từ Excel
              </button>
              <button type="button" className="btn btn--feat-blue" onClick={openingCreateModal}>
                <Plus size={14} />
                Tạo câu hỏi
              </button>
            </div>
          </header>

          <nav className="tqm-quicknav">
            <button
              className="tqm-quicknav__item"
              onClick={() => navigate('/teacher/question-banks')}
            >
              <span className="tqm-quicknav__icon tqm-nav-blue">
                <Database size={14} />
              </span>
              <span className="tqm-quicknav__text">
                <span className="tqm-quicknav__title">Ngân hàng câu hỏi</span>
                <span className="tqm-quicknav__desc">Quản lý kho câu hỏi dùng chung</span>
              </span>
              <ArrowRight size={14} className="tqm-quicknav__arrow" />
            </button>
            <span className="tqm-quicknav__divider" />
            <button
              className="tqm-quicknav__item"
              onClick={() => navigate('/teacher/question-templates')}
            >
              <span className="tqm-quicknav__icon tqm-nav-violet">
                <Sparkles size={14} />
              </span>
              <span className="tqm-quicknav__text">
                <span className="tqm-quicknav__title">Mẫu câu hỏi</span>
                <span className="tqm-quicknav__desc">Soạn mẫu và sinh câu hỏi với AI</span>
              </span>
              <ArrowRight size={14} className="tqm-quicknav__arrow" />
            </button>
            <span className="tqm-quicknav__divider" />
            <button className="tqm-quicknav__item" onClick={() => navigate('/teacher/assessments')}>
              <span className="tqm-quicknav__icon tqm-nav-emerald">
                <BookOpen size={14} />
              </span>
              <span className="tqm-quicknav__text">
                <span className="tqm-quicknav__title">Tạo đề thi</span>
                <span className="tqm-quicknav__desc">Chỉnh sửa và xuất bản đề thi hoàn chỉnh</span>
              </span>
              <ArrowRight size={14} className="tqm-quicknav__arrow" />
            </button>
          </nav>

          <div className="toolbar">
            <label className="search-box" style={{ flex: '1 1 240px' }}>
              <span className="search-box__icon" aria-hidden="true">
                <Search size={15} />
              </span>
              <input
                placeholder="Tìm theo nội dung câu hỏi"
                value={searchName}
                onChange={(event) => {
                  setSearchName(event.target.value);
                }}
              />
              {searchName && (
                <button
                  type="button"
                  className="search-box__clear"
                  aria-label="Xóa nội dung tìm kiếm"
                  onClick={() => {
                    setSearchName('');
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </label>

            <button className="btn secondary" onClick={() => void refetch()}>
              <RefreshCw size={14} />
              Làm mới
            </button>
          </div>

          {isLoading && (
            <div className="skeleton-table-row">
              {['s1', 's2', 's3', 's4', 's5'].map((k) => (
                <div key={k} className="skeleton-row" />
              ))}
            </div>
          )}
          {isError && (
            <div className="empty">
              <AlertCircle size={32} style={{ color: '#ef4444', marginBottom: 8 }} />
              <p style={{ margin: 0 }}>
                {error instanceof Error ? error.message : 'Không thể tải danh sách câu hỏi.'}
              </p>
              <button
                className="btn secondary"
                style={{ marginTop: 10 }}
                onClick={() => void refetch()}
              >
                <RefreshCw size={14} /> Thử lại
              </button>
            </div>
          )}

          {!isLoading && !isError && questions.length === 0 && (
            <div className="empty">
              <FileQuestion size={32} style={{ color: '#94a3b8', marginBottom: 8 }} />
              <p style={{ margin: 0 }}>Không tìm thấy câu hỏi phù hợp.</p>
              {searchName && (
                <button
                  className="btn secondary"
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    setSearchName('');
                  }}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          )}

          {!isLoading && !isError && questions.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Câu hỏi</th>
                    <th>Loại</th>
                    <th>Mức độ</th>
                    <th>Cập nhật</th>
                    <th style={{ width: 190 }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question) => (
                    <tr key={question.id}>
                      <td>
                        <MathText text={question.questionText} />
                      </td>
                      <td>
                        <span className="badge">{questionTypeLabel[question.questionType]}</span>
                      </td>
                      <td>
                        {question.cognitiveLevel ? (
                          <span className="badge">
                            {cognitiveLevelLabel[question.cognitiveLevel] ||
                              question.cognitiveLevel}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>{formatDate(question.updatedAt)}</td>
                      <td className="tqm-action-cell">
                        <div className="tqm-action-row">
                          <button
                            type="button"
                            className="btn secondary btn--tint-blue"
                            onClick={() => openingEditModal(question)}
                          >
                            <Edit3 size={14} />
                            Chỉnh Sửa
                          </button>
                          <button
                            className="btn danger"
                            onClick={() => void handleDeleteQuestion(question)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 size={14} />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={size}
            onChange={(p) => setPage(p)}
          />

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
        </section>
      </div>
    </DashboardLayout>
  );
}
