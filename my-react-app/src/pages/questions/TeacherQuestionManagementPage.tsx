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
  MULTIPLE_CHOICE: 'Trac nghiem',
  TRUE_FALSE: 'Dung/Sai',
  SHORT_ANSWER: 'Tra loi ngan',
  ESSAY: 'Tu luan',
  CODING: 'Lap trinh',
};

const difficultyLabel: Record<string, string> = {
  EASY: 'De',
  MEDIUM: 'Trung binh',
  HARD: 'Kho',
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

  const stats = useMemo(
    () => ({
      easy: questions.filter((q) => q.difficulty === 'EASY').length,
      medium: questions.filter((q) => q.difficulty === 'MEDIUM').length,
      hard: questions.filter((q) => q.difficulty === 'HARD').length,
    }),
    [questions]
  );

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
              <div className="header-kicker"></div>
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Quản lý câu hỏi của tôi</h2>
                {!isLoading && <span className="count-chip">{questions.length}</span>}
              </div>
              <p className="header-sub">
                Tạo, chỉnh sửa, xóa và tìm nhanh câu hỏi theo nội dung và tag để tái sử dụng trong
                đề thi.
              </p>
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

          <div
            className="stats-grid"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}
          >
            <div className="stat-card stat-blue">
              <div className="stat-icon-wrap">
                <Database size={16} />
              </div>
              <div>
                <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>
                  Tổng câu hỏi
                </p>
                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{isLoading ? '—' : totalElements}</h3>
              </div>
            </div>
            <div className="stat-card stat-emerald">
              <div className="stat-icon-wrap">
                <BookOpen size={16} />
              </div>
              <div>
                <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>
                  Mức Dễ
                </p>
                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{isLoading ? '—' : stats.easy}</h3>
              </div>
            </div>
            <div className="stat-card stat-amber">
              <div className="stat-icon-wrap">
                <FileQuestion size={16} />
              </div>
              <div>
                <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>
                  Trung bình
                </p>
                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{isLoading ? '—' : stats.medium}</h3>
              </div>
            </div>
            <div className="stat-card stat-violet">
              <div className="stat-icon-wrap">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>
                  Mức Khó
                </p>
                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{isLoading ? '—' : stats.hard}</h3>
              </div>
            </div>
          </div>

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
            <button
              className="tqm-quicknav__item"
              onClick={() => navigate('/teacher/assessment-builder')}
            >
              <span className="tqm-quicknav__icon tqm-nav-emerald">
                <BookOpen size={14} />
              </span>
              <span className="tqm-quicknav__text">
                <span className="tqm-quicknav__title">Trình tạo đề thi</span>
                <span className="tqm-quicknav__desc">Lắp ráp và xuất bản đề thi hoàn chỉnh</span>
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
                    <th>Loai</th>
                    <th>Mức độ</th>
                    <th>Do kho</th>
                    <th>Diem</th>
                    <th>Tag</th>
                    <th>Cap nhat</th>
                    <th style={{ width: 190 }}>Thao tac</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question) => (
                    <tr key={question.id}>
                      <td>
                        <MathText text={question.questionText} />
                        {question.explanation && (
                          <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
                            {question.explanation}
                          </p>
                        )}
                      </td>
                      <td>
                        <span className="badge">{questionTypeLabel[question.questionType]}</span>
                      </td>
                      <td>
                        {question.cognitiveLevel
                          ? <span className="badge">{cognitiveLevelLabel[question.cognitiveLevel] || question.cognitiveLevel}</span>
                          : '-'}
                      </td>
                      <td>
                        {question.difficulty ? (
                          <span className={`badge badge-${question.difficulty.toLowerCase()}`}>
                            {difficultyLabel[question.difficulty]}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>{question.points ?? '-'}</td>
                      <td>{(question.tags ?? []).join(', ') || '-'}</td>
                      <td>{formatDate(question.updatedAt)}</td>
                      <td>
                        <div className="row" style={{ flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn secondary btn--tint-blue"
                            onClick={() => openingEditModal(question)}
                          >
                            <Edit3 size={14} />
                            Sua
                          </button>
                          <button
                            className="btn danger"
                            onClick={() => void handleDeleteQuestion(question)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 size={14} />
                            Xoa
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
