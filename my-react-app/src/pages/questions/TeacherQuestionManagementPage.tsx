import { useMemo, useState } from 'react';
import { Edit3, Plus, RefreshCw, Search, Tag, Trash2, X } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import MathText from '../../components/common/MathText';
import {
  useCreateQuestion,
  useDeleteQuestion,
  useGetMyQuestions,
  useUpdateQuestion,
} from '../../hooks/useQuestion';
import type {
  CreateQuestionRequest,
  QuestionDifficulty,
  QuestionResponse,
  QuestionType,
  UpdateQuestionRequest,
} from '../../types/question';
import '../../styles/module-refactor.css';

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
              <p className="muted" style={{ marginBottom: 6 }}>Noi dung cau hoi</p>
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
                <p className="muted" style={{ marginBottom: 6 }}>Loai cau hoi</p>
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
                <p className="muted" style={{ marginBottom: 6 }}>Do kho</p>
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
                <p className="muted" style={{ marginBottom: 6 }}>Diem</p>
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
                <p className="muted" style={{ marginBottom: 6 }}>Dap an dung</p>
                <input
                  className="input"
                  value={form.correctAnswer}
                  onChange={(event) => onChange('correctAnswer', event.target.value)}
                  placeholder="Vi du: A"
                />
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Tag (tach boi dau phay)</p>
                <input
                  className="input"
                  value={form.tags}
                  onChange={(event) => onChange('tags', event.target.value)}
                  placeholder="dai-so, lop-9"
                />
              </label>
            </div>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Giai thich</p>
              <textarea
                className="textarea"
                rows={3}
                value={form.explanation}
                onChange={(event) => onChange('explanation', event.target.value)}
                placeholder="Nhap loi giai ngan gon"
              />
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Options JSON (khong bat buoc)</p>
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
  const [searchName, setSearchName] = useState('');
  const [searchTag, setSearchTag] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
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

  const questions = data?.result?.content ?? [];
  const totalPages = data?.result?.totalPages ?? 0;

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
          <header className="page-header">
            <div>
              <h2>Quan ly cau hoi cua toi</h2>
              <p>
                Tao, chinh sua, xoa va tim nhanh cau hoi theo noi dung va tag de tai su dung trong de thi.
              </p>
            </div>
            <button className="btn" onClick={openingCreateModal}>
              <Plus size={14} />
              Tao cau hoi
            </button>
          </header>

          <section className="hero-card">
            <p className="hero-kicker">Question CRUD</p>
            <h2>Quan ly kho cau hoi ca nhan cua giao vien</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Tim kiem theo ten cau hoi va tag. Neu backend chua ho tro loc server-side, trang van loc o FE.
            </p>
          </section>

          <div className="toolbar">
            <label className="row" style={{ minWidth: 260 }}>
              <Search size={15} />
              <input
                className="input"
                style={{ border: 0, padding: 0, width: '100%' }}
                placeholder="Tim theo noi dung cau hoi"
                value={searchName}
                onChange={(event) => {
                  setSearchName(event.target.value);
                  setPage(0);
                }}
              />
            </label>

            <label className="row" style={{ minWidth: 220 }}>
              <Tag size={15} />
              <input
                className="input"
                style={{ border: 0, padding: 0, width: '100%' }}
                placeholder="Tim theo tag"
                value={searchTag}
                onChange={(event) => {
                  setSearchTag(event.target.value);
                  setPage(0);
                }}
              />
            </label>

            <button className="btn secondary" onClick={() => void refetch()}>
              <RefreshCw size={14} />
              Lam moi
            </button>
          </div>

          {isLoading && <div className="empty">Dang tai danh sach cau hoi...</div>}
          {isError && (
            <div className="empty">
              {error instanceof Error ? error.message : 'Khong the tai danh sach cau hoi.'}
            </div>
          )}

          {!isLoading && !isError && filteredQuestions.length === 0 && (
            <div className="empty">Khong tim thay cau hoi phu hop.</div>
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
                      <td>{questionTypeLabel[question.questionType]}</td>
                      <td>{question.difficulty ? difficultyLabel[question.difficulty] : '-'}</td>
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

          {totalPages > 1 && (
            <div className="row" style={{ justifyContent: 'center' }}>
              <button
                className="btn secondary"
                disabled={page === 0}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Truoc
              </button>
              <span className="muted">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                className="btn secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Sau
              </button>
            </div>
          )}

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
