import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Link2,
  Plus,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import { useNavigate, useParams } from 'react-router-dom';
import MathText from '../../components/common/MathText';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useBatchAssignQuestionsToBank,
  useGetQuestionsByBank,
  useSearchQuestions,
} from '../../hooks/useQuestion';
import {
  useDeleteQuestionBank,
  useGetQuestionBankById,
  useToggleQuestionBankPublicStatus,
  useUpdateQuestionBank,
} from '../../hooks/useQuestionBank';
import '../../styles/module-refactor.css';
import type { QuestionResponse } from '../../types/question';
import type { QuestionBankRequest } from '../../types/questionBank';
import './QuestionBankDetailPage.css';
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

const cognitiveLevelLabel: Record<string, string> = {
  NHAN_BIET: 'NB',
  THONG_HIEU: 'TH',
  VAN_DUNG: 'VD',
  VAN_DUNG_CAO: 'VDC',
  REMEMBER: 'NB',
  UNDERSTAND: 'TH',
  APPLY: 'VD',
  ANALYZE: 'VDC',
};

function extractDiagramLatex(
  diagramData: Record<string, unknown> | string | undefined
): string | null {
  if (!diagramData) return null;
  if (typeof diagramData === 'string') {
    const trimmed = diagramData.trim();
    if (!trimmed) return null;
    // BE may store the field as either raw LaTeX or a JSON-serialized object.
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed) as Record<string, unknown>;
        if (typeof parsed.latex === 'string') return parsed.latex;
        if (typeof parsed.latexCode === 'string') return parsed.latexCode;
        if (typeof parsed.code === 'string') return parsed.code;
      } catch {
        // fall through and treat as raw latex
      }
    }
    return trimmed;
  }
  if (typeof diagramData.latex === 'string') return diagramData.latex;
  if (typeof diagramData.latexCode === 'string') return diagramData.latexCode;
  if (typeof diagramData.code === 'string') return diagramData.code;
  return null;
}

export function QuestionBankDetailPage() {
  const { bankId } = useParams<{ bankId: string }>();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'AI_DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ARCHIVED'
  >('ALL');
  const [cognitiveFilter, setCognitiveFilter] = useState<'ALL' | string>('ALL');
  const [questionSearchKeyword, setQuestionSearchKeyword] = useState('');
  const [questionSearchPage, setQuestionSearchPage] = useState(0);
  const [questionSearchSize] = useState(10);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [batchMessage, setBatchMessage] = useState<string | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [questionPage, setQuestionPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [formOpen, setFormOpen] = useState(false);
  const [addQuestionModalOpen, setAddQuestionModalOpen] = useState(false);

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
    if (!addQuestionModalOpen) return;
    if (!bankId) return;
    void refetchSearchQuestions();
  }, [
    addQuestionModalOpen,
    bankId,
    questionSearchPage,
    questionSearchSize,
    questionSearchKeyword,
    refetchSearchQuestions,
  ]);

  const updateMutation = useUpdateQuestionBank();
  const deleteMutation = useDeleteQuestionBank();
  const batchAssignQuestionsMutation = useBatchAssignQuestionsToBank();
  const togglePublicMutation = useToggleQuestionBankPublicStatus();

  const bank = data?.result;
  const questions = questionsData?.result?.content ?? [];
  const totalQuestionPages =
    questionsData?.result?.totalPages ??
    (questionsData?.result as { page?: { totalPages?: number } } | undefined)?.page?.totalPages ??
    0;
  const totalQuestionElements =
    questionsData?.result?.totalElements ??
    (questionsData?.result as { page?: { totalElements?: number } } | undefined)?.page
      ?.totalElements ??
    questions.length;
  const searchedQuestions = searchQuestionsData?.result?.content ?? [];
  const totalSearchQuestionPages =
    searchQuestionsData?.result?.totalPages ??
    (searchQuestionsData?.result as { page?: { totalPages?: number } } | undefined)?.page
      ?.totalPages ??
    0;
  const totalSearchQuestionElements =
    searchQuestionsData?.result?.totalElements ??
    (searchQuestionsData?.result as { page?: { totalElements?: number } } | undefined)?.page
      ?.totalElements ??
    searchedQuestions.length;

  const filteredQuestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return questions.filter((item: QuestionResponse) => {
      if (statusFilter !== 'ALL' && item.questionStatus !== statusFilter) return false;
      if (cognitiveFilter !== 'ALL' && item.cognitiveLevel !== cognitiveFilter) return false;
      if (!q) return true;
      const tagMatched = (item.tags ?? []).some((tag) => tag.toLowerCase().includes(q));
      return (
        item.questionText.toLowerCase().includes(q) ||
        (item.explanation?.toLowerCase().includes(q) ?? false) ||
        tagMatched
      );
    });
  }, [questions, search, statusFilter, cognitiveFilter]);

  const allSearchedSelected = useMemo(() => {
    return (
      searchedQuestions.length > 0 &&
      searchedQuestions.every((question) => selectedQuestionIds.has(question.id))
    );
  }, [searchedQuestions, selectedQuestionIds]);

  const hasPendingBatchAction = batchAssignQuestionsMutation.isPending;

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
      setAddQuestionModalOpen(false);
      await Promise.all([refetch(), refetchQuestions(), refetchSearchQuestions()]);
    } catch (error) {
      setBatchError(
        error instanceof Error ? error.message : 'Không thể thêm câu hỏi vào ngân hàng câu hỏi.'
      );
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
              <article className="hero-card qbd-hero-card">
                <div className="qbd-hero-top">
                  <div className="qbd-hero-main">
                    <p className="hero-kicker qbd-hero-kicker">Chi tiết ngân hàng câu hỏi</p>
                    <h2 className="qbd-hero-title">{bank.name}</h2>
                    <p className="qbd-hero-subtitle">
                      Ngân hàng có {bank.questionCount ?? 0} câu hỏi.
                    </p>
                    {bank.description && (
                      <p className="qbd-hero-description">
                        <span>Mô tả:</span> {bank.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`badge ${bank.isPublic ? 'published' : 'draft'} qbd-hero-visibility`}
                  >
                    {bank.isPublic ? 'Công khai' : 'Riêng tư'}
                  </span>
                </div>

                <div className="qbd-hero-meta">
                  <span className="qbd-hero-meta__item">
                    <strong>Giáo viên:</strong> {bank.teacherName || 'Không xác định'}
                  </span>
                  <span className="qbd-hero-meta__item">
                    <strong>Số câu hỏi:</strong> {bank.questionCount ?? 0}
                  </span>
                </div>

                <div className="qbd-hero-actions">
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

              <div
                className="toolbar"
                style={{ flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}
              >
                <label className="row" style={{ minWidth: 260, flex: '1 1 260px' }}>
                  <Search size={15} />
                  <input
                    className="input"
                    style={{ border: 0, padding: 0, width: '100%' }}
                    placeholder="Tìm câu hỏi trong trang hiện tại"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="muted" style={{ fontSize: 13 }}>
                    Trạng thái
                  </span>
                  <select
                    className="select"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="AI_DRAFT">Nháp AI</option>
                    <option value="UNDER_REVIEW">Chờ duyệt</option>
                    <option value="APPROVED">Đã duyệt</option>
                    <option value="ARCHIVED">Lưu trữ</option>
                  </select>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="muted" style={{ fontSize: 13 }}>
                    Mức độ
                  </span>
                  <select
                    className="select"
                    value={cognitiveFilter}
                    onChange={(event) => setCognitiveFilter(event.target.value)}
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="NHAN_BIET">Nhận biết</option>
                    <option value="THONG_HIEU">Thông hiểu</option>
                    <option value="VAN_DUNG">Vận dụng</option>
                    <option value="VAN_DUNG_CAO">Vận dụng cao</option>
                  </select>
                </label>
                {(statusFilter !== 'ALL' || cognitiveFilter !== 'ALL' || search) && (
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => {
                      setStatusFilter('ALL');
                      setCognitiveFilter('ALL');
                      setSearch('');
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                )}
                <button
                  className="btn"
                  onClick={() => {
                    setBatchError(null);
                    setBatchMessage(null);
                    setQuestionSearchKeyword('');
                    setQuestionSearchPage(0);
                    setSelectedQuestionIds(new Set());
                    setAddQuestionModalOpen(true);
                  }}
                >
                  <Plus size={14} />
                  Thêm câu hỏi vào ngân hàng
                </button>
              </div>

              {batchMessage && (
                <div className="empty" style={{ marginBottom: 12, color: '#166534' }}>
                  {batchMessage}
                </div>
              )}
              {batchError && (
                <div className="empty" style={{ marginBottom: 12, color: '#b91c1c' }}>
                  {batchError}
                </div>
              )}

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
                        <th>Mức độ</th>
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
                            <div
                              className="row"
                              style={{ justifyContent: 'start', flexWrap: 'wrap', marginTop: 6 }}
                            >
                              {question.questionSourceType === 'AI_GENERATED' && (
                                <span className="badge draft">AI tạo</span>
                              )}
                              {question.questionSourceType === 'TEMPLATE_GENERATED' && (
                                <span className="badge approved">Biến thể mẫu</span>
                              )}
                              {question.canonicalQuestionId && (
                                <span className="badge published">Từ câu chuẩn</span>
                              )}
                            </div>
                            {question.solutionSteps && (
                              <div className="preview-box" style={{ marginTop: 8 }}>
                                <p className="muted" style={{ marginBottom: 6 }}>
                                  Các bước giải
                                </p>
                                <MathText text={question.solutionSteps} />
                              </div>
                            )}
                            {question.diagramData &&
                              (() => {
                                const diagramLatex = extractDiagramLatex(question.diagramData);
                                return diagramLatex ? (
                                  <div className="preview-box" style={{ marginTop: 8 }}>
                                    <p className="muted" style={{ marginBottom: 6 }}>
                                      Hình vẽ
                                    </p>
                                    <MathText text={`$$${diagramLatex}$$`} />
                                  </div>
                                ) : (
                                  <div className="preview-box" style={{ marginTop: 8 }}>
                                    <p className="muted" style={{ marginBottom: 6 }}>
                                      Hình vẽ
                                    </p>
                                    <pre
                                      style={{
                                        margin: 0,
                                        whiteSpace: 'pre-wrap',
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      {JSON.stringify(question.diagramData, null, 2)}
                                    </pre>
                                  </div>
                                );
                              })()}
                          </td>
                          <td>
                            {questionTypeLabel[question.questionType] || question.questionType}
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
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setQuestionPage(0);
                }}
                pageSizeOptions={[10, 20, 30, 50]}
              />

              <QuestionBankFormModal
                isOpen={formOpen}
                mode="edit"
                initialData={bank}
                onClose={() => setFormOpen(false)}
                onSubmit={handleSave}
              />

              {addQuestionModalOpen && (
                <div
                  className="qbd-modal-backdrop"
                  onClick={() => {
                    setAddQuestionModalOpen(false);
                    setSelectedQuestionIds(new Set());
                  }}
                >
                  <article
                    className="data-card qbd-modal"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="qbd-modal__header">
                      <div>
                        <h3>Thêm câu hỏi vào ngân hàng</h3>
                        <p className="muted">
                          Chọn một hoặc nhiều câu hỏi để thêm vào ngân hàng hiện tại.
                        </p>
                      </div>
                      <span className="muted">Đã chọn: {selectedQuestionIds.size}</span>
                    </div>

                    <div className="form-grid" style={{ marginTop: 12 }}>
                      <label style={{ gridColumn: '1 / -1' }}>
                        <p className="muted" style={{ marginBottom: 6 }}>
                          Từ khóa
                        </p>
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
                      <button
                        className="btn secondary"
                        onClick={() => void refetchSearchQuestions()}
                      >
                        <RefreshCw size={14} />
                        Làm mới kết quả tìm kiếm
                      </button>
                      <button
                        className="btn"
                        onClick={() => void handleBatchAssignQuestions()}
                        disabled={selectedQuestionIds.size === 0 || hasPendingBatchAction}
                      >
                        <Link2 size={14} />
                        {batchAssignQuestionsMutation.isPending
                          ? 'Đang thêm theo lô...'
                          : `Thêm vào ngân hàng (${selectedQuestionIds.size})`}
                      </button>
                    </div>

                    {searchQuestionsLoading && (
                      <div className="empty" style={{ marginTop: 12 }}>
                        Đang tìm câu hỏi...
                      </div>
                    )}

                    {searchQuestionsError && (
                      <div className="empty" style={{ marginTop: 12 }}>
                        {searchQuestionsErrorValue instanceof Error
                          ? searchQuestionsErrorValue.message
                          : 'Không thể tìm câu hỏi'}
                      </div>
                    )}

                    {!searchQuestionsLoading &&
                      !searchQuestionsError &&
                      searchedQuestions.length > 0 && (
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
                                      const selectableIds = searchedQuestions
                                        .filter((question) => question.questionBankId !== bankId)
                                        .map((question) => question.id);
                                      setSelectedQuestionIds(new Set(selectableIds));
                                    }}
                                  />
                                </th>
                                <th>Câu hỏi</th>
                                <th style={{ width: 150 }}>Loại</th>
                                <th style={{ width: 180 }}>Trạng thái</th>
                                <th style={{ width: 220 }}>Thuộc ngân hàng</th>
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
                                        disabled={isInCurrentBank}
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
                                    <td>
                                      {questionTypeLabel[question.questionType] ||
                                        question.questionType}
                                    </td>
                                    <td>{question.questionStatus || '-'}</td>
                                    <td>
                                      {isInCurrentBank
                                        ? 'Ngân hàng hiện tại'
                                        : question.questionBankName ||
                                          question.questionBankId ||
                                          'Chưa gán'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                    {!searchQuestionsLoading &&
                      !searchQuestionsError &&
                      searchedQuestions.length === 0 && (
                        <div className="empty" style={{ marginTop: 12 }}>
                          Không tìm thấy câu hỏi phù hợp.
                        </div>
                      )}

                    <Pagination
                      page={questionSearchPage}
                      totalPages={totalSearchQuestionPages}
                      totalElements={totalSearchQuestionElements}
                      pageSize={questionSearchSize}
                      onChange={setQuestionSearchPage}
                    />

                    <div className="qbd-modal__footer">
                      <button
                        className="btn secondary"
                        onClick={() => {
                          setAddQuestionModalOpen(false);
                          setSelectedQuestionIds(new Set());
                        }}
                      >
                        Đóng
                      </button>
                    </div>
                  </article>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
