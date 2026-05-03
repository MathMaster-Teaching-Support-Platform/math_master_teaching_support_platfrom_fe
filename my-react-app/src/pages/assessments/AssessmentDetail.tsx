import { ArrowLeft, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { UI_TEXT } from '../../constants/uiText';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MathText from '../../components/common/MathText';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useAssessment,
  useAssessmentQuestions,
  useAutoDistributePoints,
  useBatchAddQuestions,
  useBatchUpdatePoints,
  useGenerateQuestionsForAssessment,
  useRemoveQuestion,
  useSearchQuestions,
  useUpdateAssessment,
} from '../../hooks/useAssessment';
import '../../styles/module-refactor.css';
import type { AssessmentRequest } from '../../types';
import AssessmentModal from './AssessmentModal';

const assessmentStatusLabel: Record<string, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã xuất bản',
  CLOSED: 'Đã đóng',
};

const assessmentTypeLabel: Record<string, string> = {
  QUIZ: 'Trắc nghiệm nhanh',
  TEST: 'Bài kiểm tra',
  EXAM: 'Bài thi',
  HOMEWORK: 'Bài tập về nhà',
};

const assessmentModeLabel: Record<string, string> = {
  DIRECT: 'Trực tiếp',
  MATRIX_BASED: 'Theo ma trận đề',
};

const scoringPolicyLabel: Record<string, string> = {
  BEST: 'Lần tốt nhất',
  LATEST: 'Lần gần nhất',
  AVERAGE: 'Điểm trung bình',
};

const COGNITIVE_LEVELS = [
  { key: 'NHAN_BIET', label: 'Nhận biết' },
  { key: 'THONG_HIEU', label: 'Thông hiểu' },
  { key: 'VAN_DUNG', label: 'Vận dụng' },
  { key: 'VAN_DUNG_CAO', label: 'Vận dụng cao' },
];

function getQuestionId(question: { questionId: string; id?: string }) {
  return question.questionId || question.id || '';
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function AssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [openEdit, setOpenEdit] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [crudError, setCrudError] = useState<string | null>(null);

  // Question search picker state
  const [searchKeyword, setSearchKeyword] = useState('');
  const debouncedKeyword = useDebounce(searchKeyword, 300);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Per-row points draft (questionId → value string)
  const [pointsDraft, setPointsDraft] = useState<Record<string, string>>({});

  // Auto-distribute state
  const [totalPointsInput, setTotalPointsInput] = useState('');
  const [distribution, setDistribution] = useState<Record<string, string>>({});

  const { data, isLoading, isError, error, refetch } = useAssessment(id ?? '');
  const {
    data: questionsData,
    isLoading: questionsLoading,
    isError: questionsError,
    error: questionsErrorValue,
    refetch: refetchQuestions,
  } = useAssessmentQuestions(id ?? '', { enabled: !!id });

  const { data: searchData, isFetching: searchFetching } = useSearchQuestions({
    keyword: debouncedKeyword,
    size: 20,
    enabled: debouncedKeyword.length >= 2,
  });

  const updateMutation = useUpdateAssessment();
  const removeQuestionMutation = useRemoveQuestion();
  const batchAddMutation = useBatchAddQuestions();
  const batchUpdatePointsMutation = useBatchUpdatePoints();
  const autoDistributeMutation = useAutoDistributePoints();
  const generateMutation = useGenerateQuestionsForAssessment();

  const assessment = data?.result;
  const questions = questionsData?.result ?? [];
  const searchResults: Array<{ questionId: string; questionText: string; tags?: string[]; cognitiveLevel?: string }> =
    (searchData?.result as unknown as { content?: Array<{ id?: string; questionId?: string; questionText: string; tags?: string[]; cognitiveLevel?: string }> })?.content?.map(
      (q) => ({ questionId: q.id ?? q.questionId ?? '', questionText: q.questionText, tags: q.tags, cognitiveLevel: q.cognitiveLevel })
    ) ?? [];

  // Initialise pointsDraft from loaded questions
  useEffect(() => {
    if (!questions.length) return;
    setPointsDraft((prev) => {
      const next = { ...prev };
      questions.forEach((q) => {
        const qid = getQuestionId(q);
        if (!(qid in next) && q.points != null) {
          next[qid] = String(q.points);
        }
      });
      return next;
    });
  }, [questions]);

  async function save(payload: AssessmentRequest) {
    if (!id) return;
    await updateMutation.mutateAsync({ id, data: payload });
    setOpenEdit(false);
    await refetch();
  }

  const toggleSelectQuestion = useCallback((qid: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(qid) ? next.delete(qid) : next.add(qid);
      return next;
    });
  }, []);

  async function handleBatchAdd() {
    if (!id || selectedIds.size === 0) return;
    setCrudError(null);
    try {
      await batchAddMutation.mutateAsync({ assessmentId: id, questionIds: [...selectedIds] });
      setSelectedIds(new Set());
      setSearchKeyword('');
      await Promise.all([refetchQuestions(), refetch()]);
    } catch (e) {
      setCrudError(e instanceof Error ? e.message : 'Không thể thêm câu hỏi.');
    }
  }

  async function handleRemoveQuestion(questionId: string) {
    if (!id) return;
    setCrudError(null);
    try {
      await removeQuestionMutation.mutateAsync({ assessmentId: id, questionId });
      await Promise.all([refetchQuestions(), refetch()]);
    } catch (e) {
      setCrudError(e instanceof Error ? e.message : 'Không thể xóa câu hỏi.');
    }
  }

  async function handleBatchUpdatePoints() {
    if (!id) return;
    setCrudError(null);
    const payload = questions
      .map((q) => {
        const qid = getQuestionId(q);
        const raw = pointsDraft[qid]?.trim();
        if (!raw) return null;
        const val = Number(raw);
        if (Number.isNaN(val) || val < 0) return null;
        return { id: qid, point: val };
      })
      .filter((x): x is { id: string; point: number } => x !== null);

    if (payload.length === 0) {
      setCrudError('Chưa có điểm nào hợp lệ để cập nhật.');
      return;
    }
    try {
      await batchUpdatePointsMutation.mutateAsync({ assessmentId: id, questions: payload });
      await Promise.all([refetchQuestions(), refetch()]);
    } catch (e) {
      setCrudError(e instanceof Error ? e.message : 'Không thể cập nhật điểm.');
    }
  }

  async function handleAutoDistribute() {
    if (!id) return;
    setCrudError(null);
    const total = Number(totalPointsInput);
    if (Number.isNaN(total) || total <= 0) {
      setCrudError('Tổng điểm phải là số dương.');
      return;
    }
    const dist: Record<string, number> = {};
    for (const [key, val] of Object.entries(distribution)) {
      const n = Number(val);
      if (!Number.isNaN(n) && n > 0) dist[key] = n;
    }
    try {
      await autoDistributeMutation.mutateAsync({
        assessmentId: id,
        totalPoints: total,
        distribution: Object.keys(dist).length > 0 ? dist : undefined,
      });
      await Promise.all([refetchQuestions(), refetch()]);
    } catch (e) {
      setCrudError(e instanceof Error ? e.message : 'Không thể tự động phân điểm.');
    }
  }

  async function generateFromMatrix() {
    if (!assessment?.id || !assessment.examMatrixId) return;
    setGenerateError(null);
    try {
      await generateMutation.mutateAsync({
        assessmentId: assessment.id,
        data: {
          examMatrixId: assessment.examMatrixId,
          reuseApprovedQuestions: true,
          selectionStrategy: 'BANK_FIRST',
        },
      });
      await Promise.all([refetchQuestions(), refetch()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể generate câu hỏi từ matrix.';
      const normalized = message.toUpperCase();
      if (normalized.includes('INSUFFICIENT_QUESTIONS_AVAILABLE') || normalized.includes('INSUFFICIENT QUESTIONS')) {
        setGenerateError('Không đủ câu hỏi trong ngân hàng theo cấu trúc đề. Vui lòng bổ sung thêm câu hỏi.');
        return;
      }
      setGenerateError(message);
    }
  }

  function renderContent() {
    if (isLoading) {
      return (
        <section className="module-page">
          <div className="empty">Đang tải chi tiết {UI_TEXT.QUIZ.toLowerCase()}...</div>
        </section>
      );
    }

    if (isError) {
      return (
        <section className="module-page">
          <div className="empty">
            {error instanceof Error ? error.message : `Không thể tải chi tiết ${UI_TEXT.QUIZ.toLowerCase()}`}
          </div>
        </section>
      );
    }

    if (!assessment) {
      return (
        <section className="module-page">
          <div className="empty">Không tìm thấy {UI_TEXT.QUIZ.toLowerCase()}.</div>
        </section>
      );
    }

    const isDraft = assessment.status === 'DRAFT';
    const isDirect = assessment.assessmentMode !== 'MATRIX_BASED' || !assessment.examMatrixId;

    return (
      <section className="module-page">
        <button className="btn secondary" onClick={() => navigate('/teacher/assessments')}>
          <ArrowLeft size={14} />
          Quay lại danh sách {UI_TEXT.QUIZ.toLowerCase()}
        </button>

        <article className="hero-card">
          <div className="row" style={{ alignItems: 'start', flexWrap: 'wrap' }}>
            <div>
              <p className="hero-kicker">Chi tiết {UI_TEXT.QUIZ.toLowerCase()}</p>
              <h2>{assessment.title}</h2>
              <p>{assessment.description || 'Không có mô tả'}</p>
            </div>
            {isDraft && (
              <button className="btn secondary" onClick={() => setOpenEdit(true)}>
                <Pencil size={14} />
                Chỉnh sửa thông tin
              </button>
            )}
          </div>
        </article>

        <div className="stats-grid">
          <article className="stat-card">
            <p>Trạng thái</p>
            <h3>{assessmentStatusLabel[assessment.status] || assessment.status}</h3>
            <span>{assessmentTypeLabel[assessment.assessmentType] || assessment.assessmentType}</span>
          </article>
          <article className="stat-card">
            <p>Câu hỏi</p>
            <h3>{assessment.totalQuestions}</h3>
            <span>Tổng điểm: {assessment.totalPoints}</span>
          </article>
          <article className="stat-card">
            <p>Lượt nộp</p>
            <h3>{assessment.submissionCount}</h3>
            <span>
              Chính sách:{' '}
              {scoringPolicyLabel[assessment.attemptScoringPolicy || 'BEST'] || assessment.attemptScoringPolicy || 'BEST'}
            </span>
          </article>
        </div>

        <div className="table-wrap">
          <table className="table">
            <tbody>
              <tr><th>Bài học</th><td>{assessment.lessonTitles?.join(', ') || 'Không có'}</td></tr>
              <tr><th>Thời gian làm bài</th><td>{assessment.timeLimitMinutes || 0} phút</td></tr>
              <tr><th>Điểm đạt</th><td>{assessment.passingScore || 0}%</td></tr>
              <tr>
                <th>Chế độ tạo đề</th>
                <td>{assessmentModeLabel[assessment.assessmentMode || 'DIRECT'] || assessment.assessmentMode || 'DIRECT'}</td>
              </tr>
              <tr><th>Ma trận đề</th><td>{assessment.examMatrixId || 'Không có'}</td></tr>
              <tr>
                <th>Lịch làm bài</th>
                <td>
                  {assessment.startDate ? new Date(assessment.startDate).toLocaleString() : 'Chưa đặt lịch'}
                  {' - '}
                  {assessment.endDate ? new Date(assessment.endDate).toLocaleString() : 'Không giới hạn'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Question management ── */}
        <article className="data-card" style={{ marginTop: 16 }}>
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <h3>Câu hỏi trong {UI_TEXT.QUIZ.toLowerCase()}</h3>
            <div className="row" style={{ justifyContent: 'start', flexWrap: 'wrap' }}>
              {isDraft && assessment.assessmentMode === 'MATRIX_BASED' && assessment.examMatrixId && (
                <button
                  className="btn"
                  onClick={() => void generateFromMatrix()}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? 'Đang generate...' : 'Generate from Matrix'}
                </button>
              )}
            </div>
          </div>

          {generateError && <div className="empty" style={{ color: '#b91c1c' }}>{generateError}</div>}
          {crudError && <div className="empty" style={{ color: '#b91c1c' }}>{crudError}</div>}

          {/* ── Search & add questions (only for DIRECT assessments in DRAFT) ── */}
          {isDraft && isDirect && (
            <div className="preview-box" style={{ marginBottom: 16 }}>
              <p className="muted" style={{ marginBottom: 8, fontWeight: 600 }}>
                <Search size={14} style={{ marginRight: 4 }} />
                Tìm kiếm và thêm câu hỏi
              </p>
              <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'start', marginBottom: 8 }}>
                <input
                  className="input"
                  style={{ minWidth: 280 }}
                  placeholder="Nhập từ khóa (ít nhất 2 ký tự)..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                {searchFetching && <span className="muted">Đang tìm...</span>}
              </div>

              {searchResults.length > 0 && (
                <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                  {searchResults.map((q) => {
                    const alreadyAdded = questions.some((aq) => getQuestionId(aq) === q.questionId);
                    const checked = selectedIds.has(q.questionId);
                    return (
                      <label
                        key={q.questionId}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: '8px 12px',
                          cursor: alreadyAdded ? 'not-allowed' : 'pointer',
                          background: alreadyAdded ? '#f9fafb' : 'white',
                          borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                        <input
                          type="checkbox"
                          disabled={alreadyAdded}
                          checked={checked}
                          onChange={() => toggleSelectQuestion(q.questionId)}
                          style={{ marginTop: 3 }}
                        />
                        <div>
                          <MathText text={q.questionText} />
                          <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {q.cognitiveLevel && (
                              <span className="badge draft" style={{ fontSize: 11 }}>{q.cognitiveLevel}</span>
                            )}
                            {q.tags?.map((t) => (
                              <span key={t} className="badge published" style={{ fontSize: 11 }}>{t}</span>
                            ))}
                            {alreadyAdded && <span className="muted" style={{ fontSize: 11 }}>Đã có trong đề</span>}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {selectedIds.size > 0 && (
                <div style={{ marginTop: 10 }}>
                  <button
                    className="btn"
                    onClick={() => void handleBatchAdd()}
                    disabled={batchAddMutation.isPending}
                  >
                    <Plus size={14} />
                    {batchAddMutation.isPending ? 'Đang thêm...' : `Thêm ${selectedIds.size} câu hỏi đã chọn`}
                  </button>
                </div>
              )}
            </div>
          )}

          {questionsLoading && <div className="empty">Đang tải danh sách câu hỏi...</div>}
          {questionsError && (
            <div className="empty">
              {questionsErrorValue instanceof Error ? questionsErrorValue.message : 'Không thể tải câu hỏi.'}
            </div>
          )}
          {!questionsLoading && !questionsError && questions.length === 0 && (
            <div className="empty">{UI_TEXT.QUIZ} chưa có câu hỏi.</div>
          )}

          {!questionsLoading && !questionsError && questions.length > 0 && (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 50 }}>STT</th>
                      <th>Nội dung câu hỏi</th>
                      <th style={{ width: 80 }}>Loại</th>
                      <th style={{ width: 100 }}>Mức độ</th>
                      <th style={{ width: 160 }}>Điểm</th>
                      {isDraft && <th style={{ width: 80 }}>Xóa</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((question) => {
                      const questionId = getQuestionId(question);
                      return (
                        <tr key={questionId}>
                          <td>{question.orderIndex}</td>
                          <td>
                            <MathText text={question.questionText} />
                            <div className="row" style={{ justifyContent: 'start', flexWrap: 'wrap', marginTop: 4 }}>
                              {question.tags?.map((t) => (
                                <span key={t} className="badge published" style={{ fontSize: 11 }}>{t}</span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${question.questionType === 'TRUE_FALSE' ? 'published' : 'draft'}`}>
                              {question.questionType === 'TRUE_FALSE' ? 'TF (4 mệnh đề)' : 
                               question.questionType === 'SHORT_ANSWER' ? 'TL' : 'TN'}
                            </span>
                          </td>
                          <td>
                            {question.cognitiveLevel ? (
                              <span className="badge draft">{question.cognitiveLevel}</span>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>
                          <td>
                            {isDraft ? (
                              <input
                                className="input"
                                type="number"
                                min={0}
                                step={0.25}
                                value={pointsDraft[questionId] ?? String(question.points ?? '')}
                                onChange={(e) =>
                                  setPointsDraft((prev) => ({ ...prev, [questionId]: e.target.value }))
                                }
                                placeholder="Điểm"
                              />
                            ) : (
                              <span>{question.points ?? 0}</span>
                            )}
                          </td>
                          {isDraft && (
                            <td>
                              <button
                                className="btn danger"
                                title="Xóa câu hỏi"
                                onClick={() => void handleRemoveQuestion(questionId)}
                                disabled={removeQuestionMutation.isPending}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Batch actions ── */}
              {isDraft && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Batch save points */}
                  <div>
                    <button
                      className="btn"
                      onClick={() => void handleBatchUpdatePoints()}
                      disabled={batchUpdatePointsMutation.isPending}
                    >
                      {batchUpdatePointsMutation.isPending ? 'Đang lưu...' : 'Lưu điểm tất cả câu hỏi'}
                    </button>
                  </div>

                  {/* Auto distribute */}
                  <div className="preview-box">
                    <p className="muted" style={{ fontWeight: 600, marginBottom: 8 }}>
                      Tự động phân điểm theo mức độ nhận thức
                    </p>
                    <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4, marginBottom: 8 }}>
                      💡 Câu hỏi Đúng/Sai (TF) có 4 mệnh đề, điểm sẽ được phân bổ theo trọng số 4× so với câu hỏi thường.<br />
                      Chấm điểm THPT: 4/4 đúng → 100% điểm, 3/4 đúng → 25% điểm, 0-2/4 đúng → 0 điểm.
                    </p>
                    <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'start', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 12, color: '#6b7280' }}>Tổng điểm</label>
                        <input
                          className="input"
                          type="number"
                          min={0.01}
                          step={0.5}
                          style={{ width: 120 }}
                          placeholder="VD: 10"
                          value={totalPointsInput}
                          onChange={(e) => setTotalPointsInput(e.target.value)}
                        />
                      </div>
                      {COGNITIVE_LEVELS.map(({ key, label }) => (
                        <div key={key}>
                          <label style={{ fontSize: 12, color: '#6b7280' }}>{label} (%)</label>
                          <input
                            className="input"
                            type="number"
                            min={0}
                            max={100}
                            style={{ width: 80 }}
                            placeholder="0"
                            value={distribution[key] ?? ''}
                            onChange={(e) =>
                              setDistribution((prev) => ({ ...prev, [key]: e.target.value }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      className="btn secondary"
                      style={{ marginTop: 10 }}
                      onClick={() => void handleAutoDistribute()}
                      disabled={autoDistributeMutation.isPending}
                    >
                      {autoDistributeMutation.isPending ? 'Đang phân điểm...' : 'Áp dụng phân điểm tự động'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </article>

        <AssessmentModal
          isOpen={openEdit}
          mode="edit"
          initialData={assessment}
          onClose={() => setOpenEdit(false)}
          onSubmit={save}
        />
      </section>
    );
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
    >
      <div className="module-layout-container">{renderContent()}</div>
    </DashboardLayout>
  );
}
