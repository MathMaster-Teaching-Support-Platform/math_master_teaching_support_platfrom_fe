import { useMemo, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Link2, Pencil, RefreshCw, Search, Trash2, Unlink2 } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import MathText from '../../components/common/MathText';
import {
  useBatchAssignQuestionsToBank,
  useBatchRemoveQuestionsFromBank,
  useGetQuestionsByBank,
  useSearchQuestions,
} from '../../hooks/useQuestion';
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
  const [questionSearchKeyword, setQuestionSearchKeyword] = useState('');
  const [questionSearchPage, setQuestionSearchPage] = useState(0);
  const [questionSearchSize] = useState(10);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [batchMessage, setBatchMessage] = useState<string | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [questionPage, setQuestionPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
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
  const {
    data: searchQuestionsData,
    isLoading: searchQuestionsLoading,
    isError: searchQuestionsError,
    error: searchQuestionsErrorValue,
    refetch: refetchSearchQuestions,
  } = useSearchQuestions(
    {
      keyword: questionSearchKeyword,
      page: questionSearchPage,
      size: questionSearchSize,
    },
    !!bankId
  );

  useEffect(() => {
    if (!bankId) return;
    void refetchSearchQuestions();
  }, [bankId, questionSearchPage, questionSearchSize, questionSearchKeyword, refetchSearchQuestions]);

  const updateMutation = useUpdateQuestionBank();
  const deleteMutation = useDeleteQuestionBank();
  const batchAssignQuestionsMutation = useBatchAssignQuestionsToBank();
  const batchRemoveQuestionsMutation = useBatchRemoveQuestionsFromBank();
  const togglePublicMutation = useToggleQuestionBankPublicStatus();

  const bank = data?.result;
  const questions = questionsData?.result?.content ?? [];
  const totalQuestionPages = questionsData?.result?.totalPages ?? 0;
  const totalQuestionElements = questionsData?.result?.totalElements ?? 0;
  const searchedQuestions = searchQuestionsData?.result?.content ?? [];
  const totalSearchQuestionPages = searchQuestionsData?.result?.totalPages ?? 0;

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

  const allSearchedSelected = useMemo(() => {
    return (
      searchedQuestions.length > 0 &&
      searchedQuestions.every((question) => selectedQuestionIds.has(question.id))
    );
  }, [searchedQuestions, selectedQuestionIds]);

  const hasPendingBatchAction =
    batchAssignQuestionsMutation.isPending || batchRemoveQuestionsMutation.isPending;

  async function handleSave(payload: QuestionBankRequest) {
    if (!bankId) return;
    await updateMutation.mutateAsync({ id: bankId, request: payload });
    await refetch();
  }

  async function handleDelete() {
    if (!bankId || !bank) return;
    const confirmed = globalThis.confirm(
      `Xóa ngân hàng "${bank.name}"? Câu hỏi sẽ được gỡ liên kết khỏi ngân hàng này.`
    );
    if (!confirmed) return;
    await deleteMutation.mutateAsync(bankId);
    navigate('/teacher/question-banks');
  }

  async function handleBatchAssignQuestions() {
    if (!bankId || selectedQuestionIds.size === 0) return;
    setBatchError(null);
    setBatchMessage(null);

    const uniqueQuestionIds = Array.from(new Set(selectedQuestionIds));

    try {
      const response = await batchAssignQuestionsMutation.mutateAsync({
        bankId,
        questionIds: uniqueQuestionIds,
      });
      const updatedCount = response.result ?? uniqueQuestionIds.length;
      setBatchMessage(`Đã cập nhật ${updatedCount} câu hỏi.`);
      setSelectedQuestionIds(new Set());
      await Promise.all([refetch(), refetchQuestions(), refetchSearchQuestions()]);
    } catch (error) {
      setBatchError(error instanceof Error ? error.message : 'Không thể thêm câu hỏi vào question bank.');
    }
  }

  async function handleBatchRemoveQuestions() {
    if (!bankId || selectedQuestionIds.size === 0) return;
    setBatchError(null);
    setBatchMessage(null);

    const uniqueQuestionIds = Array.from(new Set(selectedQuestionIds));

    try {
      const response = await batchRemoveQuestionsMutation.mutateAsync({
        bankId,
        questionIds: uniqueQuestionIds,
      });
      const updatedCount = response.result ?? 0;
      setBatchMessage(`Đã cập nhật ${updatedCount} câu hỏi.`);
      setSelectedQuestionIds(new Set());
      await Promise.all([refetch(), refetchQuestions(), refetchSearchQuestions()]);
    } catch (error) {
      setBatchError(error instanceof Error ? error.message : 'Không thể gỡ câu hỏi khỏi question bank.');
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
                  <span className="muted">Chapter: {bank.chapterTitle || bank.chapterId || 'Chưa gán chapter'}</span>
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

              <article className="data-card" style={{ marginBottom: 16 }}>
                <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div>
                    <h3>Tìm câu hỏi và cập nhật theo lô</h3>
                    <p className="muted">Dùng search để chọn nhiều câu hỏi rồi thêm/gỡ khỏi question bank hiện tại.</p>
                  </div>
                  <span className="muted">Đã chọn: {selectedQuestionIds.size}</span>
                </div>

                <div className="form-grid" style={{ marginTop: 12 }}>
                  <label style={{ gridColumn: '1 / -1' }}>
                    <p className="muted" style={{ marginBottom: 6 }}>Từ khóa</p>
                    <input
                      className="input"
                      placeholder="Ví dụ: hàm số, phương trình, giới hạn..."
                      value={questionSearchKeyword}
                      onChange={(event) => {
                        setQuestionSearchKeyword(event.target.value);
                        setQuestionSearchPage(0);
                      }}
                    />
                  </label>
                </div>

                <div className="row" style={{ flexWrap: 'wrap', marginTop: 12 }}>
                  <button className="btn secondary" onClick={() => void refetchSearchQuestions()}>
                    <RefreshCw size={14} />
                    Làm mới kết quả search
                  </button>
                  <button
                    className="btn"
                    onClick={() => void handleBatchAssignQuestions()}
                    disabled={selectedQuestionIds.size === 0 || hasPendingBatchAction}
                  >
                    <Link2 size={14} />
                    {batchAssignQuestionsMutation.isPending
                      ? 'Đang thêm theo lô...'
                      : `Thêm vào bank (${selectedQuestionIds.size})`}
                  </button>
                  <button
                    className="btn danger"
                    onClick={() => void handleBatchRemoveQuestions()}
                    disabled={selectedQuestionIds.size === 0 || hasPendingBatchAction}
                  >
                    <Unlink2 size={14} />
                    {batchRemoveQuestionsMutation.isPending
                      ? 'Đang gỡ theo lô...'
                      : `Gỡ khỏi bank (${selectedQuestionIds.size})`}
                  </button>
                </div>

                {searchQuestionsLoading && (
                  <div className="empty" style={{ marginTop: 12 }}>Đang tìm câu hỏi...</div>
                )}

                {searchQuestionsError && (
                  <div className="empty" style={{ marginTop: 12 }}>
                    {searchQuestionsErrorValue instanceof Error
                      ? searchQuestionsErrorValue.message
                      : 'Không thể tìm câu hỏi'}
                  </div>
                )}

                {!searchQuestionsLoading && !searchQuestionsError && searchedQuestions.length > 0 && (
                  <div className="table-wrap" style={{ marginTop: 12 }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th style={{ width: 50 }}>
                            <input
                              type="checkbox"
                              checked={allSearchedSelected}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                if (!checked) {
                                  setSelectedQuestionIds(new Set());
                                  return;
                                }
                                setSelectedQuestionIds(new Set(searchedQuestions.map((question) => question.id)));
                              }}
                            />
                          </th>
                          <th>Câu hỏi</th>
                          <th style={{ width: 150 }}>Loại</th>
                          <th style={{ width: 180 }}>Trạng thái</th>
                          <th style={{ width: 220 }}>Thuộc bank</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchedQuestions.map((question) => {
                          const isInCurrentBank = question.questionBankId === bankId;
                          return (
                            <tr key={question.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedQuestionIds.has(question.id)}
                                  onChange={(event) => {
                                    const checked = event.target.checked;
                                    setSelectedQuestionIds((prev) => {
                                      const next = new Set(prev);
                                      if (checked) next.add(question.id);
                                      else next.delete(question.id);
                                      return next;
                                    });
                                  }}
                                />
                              </td>
                              <td>
                                <MathText text={question.questionText} />
                              </td>
                              <td>{questionTypeLabel[question.questionType] || question.questionType}</td>
                              <td>{question.questionStatus || '-'}</td>
                              <td>
                                {isInCurrentBank
                                  ? 'Bank hiện tại'
                                  : question.questionBankName || question.questionBankId || 'Chưa gán'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {!searchQuestionsLoading && !searchQuestionsError && searchedQuestions.length === 0 && (
                  <div className="empty" style={{ marginTop: 12 }}>Không tìm thấy câu hỏi phù hợp.</div>
                )}

                <Pagination
                  page={questionSearchPage}
                  totalPages={totalSearchQuestionPages}
                  totalElements={searchQuestionsData?.result?.totalElements ?? 0}
                  pageSize={questionSearchSize}
                  onChange={setQuestionSearchPage}
                />

                {batchMessage && (
                  <div className="empty" style={{ marginTop: 12, color: '#166534' }}>{batchMessage}</div>
                )}
                {batchError && (
                  <div className="empty" style={{ marginTop: 12, color: '#b91c1c' }}>{batchError}</div>
                )}
              </article>

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
                          <td>
                            <MathText text={question.questionText} />
                            <div className="row" style={{ justifyContent: 'start', flexWrap: 'wrap', marginTop: 6 }}>
                              {question.questionSourceType === 'AI_GENERATED' && <span className="badge draft">AI Generated</span>}
                              {question.questionSourceType === 'TEMPLATE_GENERATED' && <span className="badge approved">Parametric</span>}
                              {question.canonicalQuestionId && <span className="badge published">From Canonical</span>}
                            </div>
                            {question.solutionSteps && (
                              <div className="preview-box" style={{ marginTop: 8 }}>
                                <p className="muted" style={{ marginBottom: 6 }}>Solution Steps</p>
                                <MathText text={question.solutionSteps} />
                              </div>
                            )}
                            {question.diagramData && (
                              <div className="preview-box" style={{ marginTop: 8 }}>
                                <p className="muted" style={{ marginBottom: 6 }}>Diagram</p>
                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                  {JSON.stringify(question.diagramData, null, 2)}
                                </pre>
                              </div>
                            )}
                          </td>
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

              <Pagination
                page={questionPage}
                totalPages={totalQuestionPages}
                totalElements={totalQuestionElements}
                pageSize={pageSize}
                onChange={setQuestionPage}
                onPageSizeChange={(newSize) => { setPageSize(newSize); setQuestionPage(0); }}
                pageSizeOptions={[10, 20, 30, 50]}
              />

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
