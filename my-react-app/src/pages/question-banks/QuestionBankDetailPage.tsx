import { useMemo, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import MathText from '../../components/common/MathText';
import { useGetQuestionsByBank } from '../../hooks/useQuestion';
import {
  useDeleteQuestionBank,
  useGetQuestionBankById,
  useToggleQuestionBankPublicStatus,
  useUpdateQuestionBank,
} from '../../hooks/useQuestionBank';
import type { QuestionResponse } from '../../types/question';
import type { QuestionBankRequest } from '../../types/questionBank';
import '../../styles/module-refactor.css';
import { QuestionBankFormModal } from './QuestionBankFormModal';

const questionTypeLabel: Record<string, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng/Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  ESSAY: 'Tự luận',
  CODING: 'Lập trình',
};

const difficultyLabel: Record<string, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
};

export function QuestionBankDetailPage() {
  const { bankId } = useParams<{ bankId: string }>();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [questionPage, setQuestionPage] = useState(0);
  const [pageSize] = useState(20);
  const [formOpen, setFormOpen] = useState(false);

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
  const questions = questionsData?.result?.content ?? [];
  const totalQuestionPages = questionsData?.result?.totalPages ?? 0;

  const filteredQuestions = useMemo(() => {
    if (!search.trim()) return questions;
    const q = search.toLowerCase();
    return questions.filter((item: QuestionResponse) => {
      const tagMatched = (item.tags ?? []).some((tag) => tag.toLowerCase().includes(q));
      return (
        item.questionText.toLowerCase().includes(q) ||
        (item.explanation?.toLowerCase().includes(q) ?? false) ||
        tagMatched
      );
    });
  }, [questions, search]);

  async function handleSave(payload: QuestionBankRequest) {
    if (!bankId) return;
    await updateMutation.mutateAsync({ id: bankId, request: payload });
    await refetch();
  }

  async function handleDelete() {
    if (!bankId || !bank) return;
    const confirmed = window.confirm(
      `Xóa ngân hàng "${bank.name}"? Câu hỏi sẽ được gỡ liên kết khỏi ngân hàng này.`
    );
    if (!confirmed) return;
    await deleteMutation.mutateAsync(bankId);
    navigate('/teacher/question-banks');
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
    >
      <div className="module-layout-container">
        <section className="module-page">
          <button className="btn secondary" onClick={() => navigate('/teacher/question-banks')}>
            <ArrowLeft size={15} />
            Quay lại ngân hàng câu hỏi
          </button>

          {isLoading && <div className="empty">Đang tải chi tiết ngân hàng câu hỏi...</div>}
          {isError && (
            <div className="empty">
              {error instanceof Error ? error.message : 'Không thể tải chi tiết ngân hàng câu hỏi'}
            </div>
          )}
          {!isLoading && !isError && !bank && (
            <div className="empty">Không tìm thấy ngân hàng câu hỏi.</div>
          )}

          {!isLoading && !isError && bank && (
            <>
              <article className="hero-card">
                <div className="row" style={{ alignItems: 'start', flexWrap: 'wrap' }}>
                  <div>
                    <p className="hero-kicker">Chi tiết ngân hàng câu hỏi</p>
                    <h2>{bank.name}</h2>
                    <p>{bank.description || 'Không có mô tả'}</p>
                  </div>
                  <span className={`badge ${bank.isPublic ? 'published' : 'draft'}`}>
                    {bank.isPublic ? 'Công khai' : 'Riêng tư'}
                  </span>
                </div>

                <div
                  className="row"
                  style={{ justifyContent: 'start', flexWrap: 'wrap', marginTop: 8 }}
                >
                  <span className="muted">Giáo viên: {bank.teacherName || 'Không xác định'}</span>
                  <span className="muted">Số câu hỏi: {bank.questionCount ?? 0}</span>
                </div>

                <div
                  className="toolbar"
                  style={{ marginTop: 14, border: 0, padding: 0, background: 'transparent' }}
                >
                  <button
                    className="btn secondary"
                    onClick={() => {
                      void refetch();
                      void refetchQuestions();
                    }}
                  >
                    <RefreshCw size={14} />
                    Làm mới
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => togglePublicMutation.mutate(bank.id)}
                  >
                    {bank.isPublic ? <EyeOff size={14} /> : <Eye size={14} />}
                    {bank.isPublic ? 'Chuyển riêng tư' : 'Chia sẻ công khai'}
                  </button>
                  <button className="btn secondary" onClick={() => setFormOpen(true)}>
                    <Pencil size={14} />
                    Chỉnh sửa
                  </button>
                  <button className="btn danger" onClick={() => void handleDelete()}>
                    <Trash2 size={14} />
                    Xóa
                  </button>
                </div>
              </article>

              <div className="toolbar">
                <label className="row" style={{ minWidth: 260 }}>
                  <Search size={15} />
                  <input
                    className="input"
                    style={{ border: 0, padding: 0, width: '100%' }}
                    placeholder="Tìm câu hỏi trong trang hiện tại"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
              </div>

              {questionsLoading && <div className="empty">Đang tải danh sách câu hỏi...</div>}
              {questionsError && (
                <div className="empty">
                  {questionsErrorValue instanceof Error
                    ? questionsErrorValue.message
                    : 'Không thể tải danh sách câu hỏi'}
                </div>
              )}
              {!questionsLoading && !questionsError && filteredQuestions.length === 0 && (
                <div className="empty">Không có câu hỏi phù hợp trong ngân hàng này.</div>
              )}

              {!questionsLoading && !questionsError && filteredQuestions.length > 0 && (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Câu hỏi</th>
                        <th>Loại</th>
                        <th>Độ khó</th>
                        <th>Điểm</th>
                        <th>Tags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuestions.map((question) => (
                        <tr key={question.id}>
                          <td><MathText text={question.questionText} /></td>
                          <td>
                            {questionTypeLabel[question.questionType] || question.questionType}
                          </td>
                          <td>
                            {(question.difficulty && difficultyLabel[question.difficulty]) ||
                              question.difficulty ||
                              '-'}
                          </td>
                          <td>{question.points ?? '-'}</td>
                          <td>{(question.tags ?? []).join(', ') || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {totalQuestionPages > 1 && (
                <div className="row" style={{ justifyContent: 'center' }}>
                  <button
                    className="btn secondary"
                    disabled={questionPage === 0}
                    onClick={() => setQuestionPage((prev) => prev - 1)}
                  >
                    Trước
                  </button>
                  <span className="muted">
                    Trang {questionPage + 1} / {totalQuestionPages}
                  </span>
                  <button
                    className="btn secondary"
                    disabled={questionPage >= totalQuestionPages - 1}
                    onClick={() => setQuestionPage((prev) => prev + 1)}
                  >
                    Sau
                  </button>
                </div>
              )}

              <QuestionBankFormModal
                isOpen={formOpen}
                mode="edit"
                initialData={bank}
                onClose={() => setFormOpen(false)}
                onSubmit={handleSave}
              />
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
