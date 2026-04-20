import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Database,
  Edit3,
  FileQuestion,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MathText from '../../components/common/MathText';
import Pagination from '../../components/common/Pagination';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useCreateQuestion,
  useDeleteQuestion,
  useGetMyQuestions,
  useUpdateQuestion,
} from '../../hooks/useQuestion';
import '../../styles/module-refactor.css';
import type {
  CreateQuestionRequest,
  QuestionDifficulty,
  QuestionResponse,
  QuestionType,
  UpdateQuestionRequest,
} from '../../types/question';
import './TeacherQuestionManagementPage.css';

type FormMode = 'create' | 'edit';

type QuestionFormState = {
  questionText: string;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  points: string;
  correctAnswer: string;
  explanation: string;
  tags: string;
  optionsJson: string;
};

const initialFormState: QuestionFormState = {
  questionText: '',
  questionType: 'MULTIPLE_CHOICE',
  difficulty: 'MEDIUM',
  points: '1',
  correctAnswer: '',
  explanation: '',
  tags: '',
  optionsJson: '',
};

const questionTypeLabel: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Trac nghiem',
  TRUE_FALSE: 'Dung/Sai',
  SHORT_ANSWER: 'Tra loi ngan',
  ESSAY: 'Tu luan',
  CODING: 'Lap trinh',
};

const difficultyLabel: Record<QuestionDifficulty, string> = {
  EASY: 'De',
  MEDIUM: 'Trung binh',
  HARD: 'Kho',
};

function toTagList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOptionsJson(value: string): Record<string, unknown> | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Options phai la mot JSON object hop le.');
  }

  return parsed as Record<string, unknown>;
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
}

function QuestionFormModal({
  isOpen,
  mode,
  form,
  error,
  saving,
  onClose,
  onChange,
  onSubmit,
}: Readonly<{
  isOpen: boolean;
  mode: FormMode;
  form: QuestionFormState;
  error: string | null;
  saving: boolean;
  onClose: () => void;
  onChange: (field: keyof QuestionFormState, value: string) => void;
  onSubmit: () => void;
}>) {
  if (!isOpen) return null;

  const submitLabel = mode === 'create' ? 'Tao cau hoi' : 'Luu thay doi';

  return (
    <div className="module-layout-container">
      <div className="modal-layer">
        <div className="modal-card">
          <header className="modal-header">
            <div>
              <h3 style={{ margin: 0 }}>
                {mode === 'create' ? 'Tao cau hoi moi' : 'Cap nhat cau hoi'}
              </h3>
              <p className="muted" style={{ margin: '6px 0 0' }}>
                Ho tro soan cau hoi, gan tag va cap nhat noi dung nhanh.
              </p>
            </div>
            <button className="icon-btn" onClick={onClose}>
              <X size={16} />
            </button>
          </header>

          <div className="modal-body">
            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Noi dung cau hoi
              </p>
              <textarea
                className="textarea"
                rows={4}
                value={form.questionText}
                onChange={(event) => onChange('questionText', event.target.value)}
                placeholder="Nhap noi dung cau hoi"
              />
            </label>

            <div className="form-grid">
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Loai cau hoi
                </p>
                <select
                  className="select"
                  value={form.questionType}
                  onChange={(event) => onChange('questionType', event.target.value)}
                  disabled={mode === 'edit'}
                >
                  {Object.entries(questionTypeLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Do kho
                </p>
                <select
                  className="select"
                  value={form.difficulty}
                  onChange={(event) => onChange('difficulty', event.target.value)}
                >
                  {Object.entries(difficultyLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Diem
                </p>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step="0.25"
                  value={form.points}
                  onChange={(event) => onChange('points', event.target.value)}
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Dap an dung
                </p>
                <input
                  className="input"
                  value={form.correctAnswer}
                  onChange={(event) => onChange('correctAnswer', event.target.value)}
                  placeholder="Vi du: A"
                />
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Tag (tach boi dau phay)
                </p>
                <input
                  className="input"
                  value={form.tags}
                  onChange={(event) => onChange('tags', event.target.value)}
                  placeholder="dai-so, lop-9"
                />
              </label>
            </div>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Giai thich
              </p>
              <textarea
                className="textarea"
                rows={3}
                value={form.explanation}
                onChange={(event) => onChange('explanation', event.target.value)}
                placeholder="Nhap loi giai ngan gon"
              />
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Options JSON (khong bat buoc)
              </p>
              <textarea
                className="textarea"
                rows={5}
                value={form.optionsJson}
                onChange={(event) => onChange('optionsJson', event.target.value)}
                placeholder='{"A":"Lua chon A","B":"Lua chon B"}'
              />
            </label>

            {error && (
              <div className="empty" style={{ color: '#b91c1c', padding: '0.9rem 1rem' }}>
                {error}
              </div>
            )}
          </div>

          <footer className="modal-footer">
            <button className="btn secondary" onClick={onClose}>
              Huy
            </button>
            <button className="btn" onClick={onSubmit} disabled={saving}>
              {saving ? 'Dang luu...' : submitLabel}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default function TeacherQuestionManagementPage() {
  const navigate = useNavigate();
  const [searchName, setSearchName] = useState('');
  const [searchTag, setSearchTag] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionResponse | null>(null);
  const [form, setForm] = useState<QuestionFormState>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      size,
      sortBy: 'createdAt',
      sortDirection: 'DESC' as const,
      searchName: searchName.trim() || undefined,
      searchTag: searchTag.trim() || undefined,
    }),
    [page, searchName, searchTag, size]
  );

  const { data, isLoading, isError, error, refetch } = useGetMyQuestions(queryParams);
  const createMutation = useCreateQuestion();
  const updateMutation = useUpdateQuestion();
  const deleteMutation = useDeleteQuestion();

  const questions = useMemo(() => data?.result?.content ?? [], [data]);
  const totalPages = data?.result?.totalPages ?? 0;
  const totalElements = data?.result?.totalElements ?? 0;

  const stats = useMemo(
    () => ({
      easy: questions.filter((q) => q.difficulty === 'EASY').length,
      medium: questions.filter((q) => q.difficulty === 'MEDIUM').length,
      hard: questions.filter((q) => q.difficulty === 'HARD').length,
    }),
    [questions]
  );

  const filteredQuestions = useMemo(() => {
    const qName = searchName.trim().toLowerCase();
    const qTag = searchTag.trim().toLowerCase();

    return questions.filter((question) => {
      const matchName = !qName || question.questionText.toLowerCase().includes(qName);
      const matchTag =
        !qTag || (question.tags ?? []).some((tag) => tag.toLowerCase().includes(qTag));
      return matchName && matchTag;
    });
  }, [questions, searchName, searchTag]);

  const openingCreateModal = () => {
    setFormMode('create');
    setSelectedQuestion(null);
    setForm(initialFormState);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openingEditModal = (question: QuestionResponse) => {
    setFormMode('edit');
    setSelectedQuestion(question);
    setFormError(null);
    setForm({
      questionText: question.questionText,
      questionType: question.questionType,
      difficulty: question.difficulty ?? 'MEDIUM',
      points: question.points == null ? '1' : String(question.points),
      correctAnswer: question.correctAnswer ?? '',
      explanation: question.explanation ?? '',
      tags: (question.tags ?? []).join(', '),
      optionsJson: question.options ? JSON.stringify(question.options, null, 2) : '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError(null);
  };

  const onFormFieldChange = (field: keyof QuestionFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmitForm() {
    const questionText = form.questionText.trim();
    if (!questionText) {
      setFormError('Noi dung cau hoi khong duoc de trong.');
      return;
    }

    const pointsNumber = form.points.trim() === '' ? undefined : Number(form.points);
    if (pointsNumber != null && Number.isNaN(pointsNumber)) {
      setFormError('Diem phai la so hop le.');
      return;
    }

    try {
      setFormError(null);
      const tags = toTagList(form.tags);
      const options = parseOptionsJson(form.optionsJson);

      if (formMode === 'create') {
        const payload: CreateQuestionRequest = {
          questionText,
          questionType: form.questionType,
          difficulty: form.difficulty,
          points: pointsNumber,
          correctAnswer: form.correctAnswer.trim() || undefined,
          explanation: form.explanation.trim() || undefined,
          tags,
          options,
        };
        await createMutation.mutateAsync(payload);
      } else if (selectedQuestion) {
        const payload: UpdateQuestionRequest = {
          questionText,
          difficulty: form.difficulty,
          points: pointsNumber,
          correctAnswer: form.correctAnswer.trim() || undefined,
          explanation: form.explanation.trim() || undefined,
          tags,
          options,
        };
        await updateMutation.mutateAsync({ questionId: selectedQuestion.id, request: payload });
      }

      closeModal();
      await refetch();
    } catch (error_) {
      setFormError(error_ instanceof Error ? error_.message : 'Khong the luu cau hoi.');
    }
  }

  async function handleDeleteQuestion(question: QuestionResponse) {
    const isConfirmed = globalThis.confirm('Ban co chac chan muon xoa cau hoi nay?');
    if (!isConfirmed) return;

    try {
      await deleteMutation.mutateAsync(question.id);
      await refetch();
    } catch (error_) {
      globalThis.alert(error_ instanceof Error ? error_.message : 'Khong the xoa cau hoi.');
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
    >
      <div className="module-layout-container">
        <section className="module-page">
          <header className="page-header tqm-header-row">
            <div className="header-stack">
              <div className="header-kicker">My Questions</div>
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Quản lý câu hỏi của tôi</h2>
                {!isLoading && <span className="count-chip">{questions.length}</span>}
              </div>
              <p className="header-sub">
                Tạo, chỉnh sửa, xóa và tìm nhanh câu hỏi theo nội dung và tag để tái sử dụng trong
                đề thi.
              </p>
            </div>
            <button className="btn" onClick={openingCreateModal}>
              <Plus size={14} />
              Tạo câu hỏi
            </button>
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
                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>
                  {isLoading ? '—' : questions.length}
                </h3>
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
            <span className="search-box" style={{ flex: '1 1 240px' }}>
              <Search size={15} className="search-box__icon" />
              <input
                className="input"
                placeholder="Tìm theo nội dung câu hỏi"
                value={searchName}
                onChange={(event) => {
                  setSearchName(event.target.value);
                  setPage(0);
                }}
              />
              {searchName && (
                <button
                  className="search-box__clear"
                  onClick={() => {
                    setSearchName('');
                    setPage(0);
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </span>

            <span className="search-box" style={{ flex: '1 1 200px' }}>
              <Tag size={15} className="search-box__icon" />
              <input
                className="input"
                placeholder="Tìm theo tag"
                value={searchTag}
                onChange={(event) => {
                  setSearchTag(event.target.value);
                  setPage(0);
                }}
              />
              {searchTag && (
                <button
                  className="search-box__clear"
                  onClick={() => {
                    setSearchTag('');
                    setPage(0);
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </span>

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

          {!isLoading && !isError && filteredQuestions.length === 0 && (
            <div className="empty">
              <FileQuestion size={32} style={{ color: '#94a3b8', marginBottom: 8 }} />
              <p style={{ margin: 0 }}>Không tìm thấy câu hỏi phù hợp.</p>
              {(searchName || searchTag) && (
                <button
                  className="btn secondary"
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    setSearchName('');
                    setSearchTag('');
                  }}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          )}

          {!isLoading && !isError && filteredQuestions.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Cau hoi</th>
                    <th>Loai</th>
                    <th>Do kho</th>
                    <th>Diem</th>
                    <th>Tag</th>
                    <th>Cap nhat</th>
                    <th style={{ width: 190 }}>Thao tac</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((question) => (
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
                            className="btn secondary"
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
            onPageSizeChange={(s) => { setSize(s); setPage(0); }}
          />

          <QuestionFormModal
            isOpen={isModalOpen}
            mode={formMode}
            form={form}
            error={formError}
            saving={isSaving}
            onClose={closeModal}
            onChange={onFormFieldChange}
            onSubmit={() => void handleSubmitForm()}
          />
        </section>
      </div>
    </DashboardLayout>
  );
}
