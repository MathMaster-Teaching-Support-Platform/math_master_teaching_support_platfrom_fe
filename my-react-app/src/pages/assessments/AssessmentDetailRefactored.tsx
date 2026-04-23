import { ArrowLeft, Pencil, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { QuestionCard } from '../../components/assessment';
import {
  useAddQuestion,
  useAssessment,
  useAvailableAssessmentQuestions,
  useAssessmentQuestions,
  useDistributeQuestionPoints,
  useGenerateQuestionsForAssessment,
  useRemoveQuestion,
  useSetPointsOverride,
  useUpdateAssessment,
  useUpdateAssessmentQuestionWorkaround,
} from '../../hooks/useAssessment';
import MathText from '../../components/common/MathText';
import Pagination from '../../components/common/Pagination';
import { useToast } from '../../context/ToastContext';
import '../../styles/module-refactor.css';
import '../../components/assessment/question-card.css';
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

function getQuestionId(question: { questionId: string; id?: string }) {
  return question.questionId || question.id || '';
}

export default function AssessmentDetailRefactored() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [openEdit, setOpenEdit] = useState(false);
  const [newQuestionId, setNewQuestionId] = useState('');
  const [newOrderIndex, setNewOrderIndex] = useState('');
  const [newPointsOverride, setNewPointsOverride] = useState('');
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [questionCrudError, setQuestionCrudError] = useState<string | null>(null);

  // Search-based add question states
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchTag, setSearchTag] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [debouncedTag, setDebouncedTag] = useState('');
  const [searchPage, setSearchPage] = useState(0);
  const [searchPageSize, setSearchPageSize] = useState(20);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [addPoints, setAddPoints] = useState('');
  const [autoTotalPoints, setAutoTotalPoints] = useState('10');

  function handleSelectAllSearch(checked: boolean, questionIds: string[]) {
    setSelectedToAdd((prev) => {
      const next = new Set(prev);
      if (checked) questionIds.forEach((qId) => next.add(qId));
      else questionIds.forEach((qId) => next.delete(qId));
      return next;
    });
  }

  function handleToggleSearchQuestion(checked: boolean, questionId: string) {
    setSelectedToAdd((prev) => {
      const next = new Set(prev);
      if (checked) next.add(questionId);
      else next.delete(questionId);
      return next;
    });
  }

  const { data, isLoading, isError, error, refetch } = useAssessment(id ?? '');
  const {
    data: questionsData,
    isLoading: questionsLoading,
    isError: questionsError,
    error: questionsErrorValue,
    refetch: refetchQuestions,
  } = useAssessmentQuestions(id ?? '', {
    enabled: !!id,
  });
  const updateMutation = useUpdateAssessment();
  const addQuestionMutation = useAddQuestion();
  const removeQuestionMutation = useRemoveQuestion();
  const updateAssessmentQuestionMutation = useUpdateAssessmentQuestionWorkaround();
  const pointsOverrideMutation = useSetPointsOverride();
  const distributePointsMutation = useDistributeQuestionPoints();
  const generateMutation = useGenerateQuestionsForAssessment();

  const {
    data: searchData,
    isLoading: searchLoading,
    isError: searchError,
    refetch: refetchSearch,
  } = useAvailableAssessmentQuestions(
    id ?? '',
    {
      keyword: debouncedKeyword,
      tag: debouncedTag,
      page: searchPage,
      size: searchPageSize,
    },
    { enabled: !!id }
  );
  const searchedQuestions = searchData?.result?.data ?? [];
  const totalSearchPages =
    searchData?.result?.totalPages ??
    (searchData?.result as { page?: { totalPages?: number } } | undefined)?.page?.totalPages ??
    0;
  const totalSearchElements =
    searchData?.result?.totalElements ??
    (searchData?.result as { page?: { totalElements?: number } } | undefined)?.page
      ?.totalElements ??
    searchedQuestions.length;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(searchKeyword.trim());
      setDebouncedTag(searchTag.trim());
      setSearchPage(0);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchKeyword, searchTag]);

  const assessment = data?.result;
  const questions = questionsData?.result ?? [];

  useEffect(() => {
    if (!assessment) return;
    setAutoTotalPoints(String(assessment.totalPoints ?? 0));
  }, [assessment?.id, assessment?.totalPoints]);

  async function save(payload: AssessmentRequest) {
    if (!id) return;
    await updateMutation.mutateAsync({ id, data: payload });
    setOpenEdit(false);
    await refetch();
  }

  // Reserved for future single-question-by-ID add feature
  // @ts-ignore - Function reserved for future use
  async function _addQuestionToAssessment() {
    if (!id) return;
    const normalizedQuestionId = newQuestionId.trim();
    if (!normalizedQuestionId) {
      setQuestionCrudError('Vui lòng nhập Question ID.');
      return;
    }

    const parsedOrderIndex = newOrderIndex.trim() ? Number(newOrderIndex) : undefined;
    if (newOrderIndex.trim() && (Number.isNaN(parsedOrderIndex) || parsedOrderIndex! < 1)) {
      setQuestionCrudError('orderIndex phải là số nguyên dương.');
      return;
    }

    const parsedPoints = newPointsOverride.trim() ? Number(newPointsOverride) : undefined;
    if (newPointsOverride.trim() && (Number.isNaN(parsedPoints) || parsedPoints! < 0)) {
      setQuestionCrudError('pointsOverride phải >= 0.');
      return;
    }

    setQuestionCrudError(null);
    await addQuestionMutation.mutateAsync({
      assessmentId: id,
      data: {
        questionId: normalizedQuestionId,
        orderIndex: parsedOrderIndex,
        pointsOverride: parsedPoints,
      },
    });
    setNewQuestionId('');
    setNewOrderIndex('');
    setNewPointsOverride('');
    await Promise.all([refetchQuestions(), refetch()]);
  }

  async function handleBatchAddFromSearch() {
    if (!id || selectedToAdd.size === 0) return;
    setQuestionCrudError(null);
    const parsedPoints = addPoints.trim() ? Number(addPoints) : undefined;
    if (addPoints.trim() && (Number.isNaN(parsedPoints) || parsedPoints! < 0)) {
      setQuestionCrudError('Điểm phải >= 0.');
      return;
    }
    try {
      await Promise.all(
        Array.from(selectedToAdd).map((qId) =>
          addQuestionMutation.mutateAsync({
            assessmentId: id,
            data: { questionId: qId, pointsOverride: parsedPoints },
          })
        )
      );
      setSelectedToAdd(new Set());
      setAddPoints('');
      await Promise.all([refetchQuestions(), refetch()]);
    } catch (err) {
      setQuestionCrudError(err instanceof Error ? err.message : 'Không thể thêm câu hỏi.');
    }
  }

  async function handleUpdateQuestion(
    questionId: string,
    orderIndex: number,
    pointsOverride: number | null
  ) {
    if (!id) return;
    await updateAssessmentQuestionMutation.mutateAsync({
      assessmentId: id,
      questionId,
      data: {
        orderIndex,
        pointsOverride,
      },
    });
    await Promise.all([refetchQuestions(), refetch()]);
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!id) return;
    await removeQuestionMutation.mutateAsync({ assessmentId: id, questionId });
    await Promise.all([refetchQuestions(), refetch()]);
  }

  async function handleClearOverride(questionId: string) {
    await pointsOverrideMutation.mutateAsync({
      assessmentId: id ?? '',
      data: {
        questionId,
        pointsOverride: null,
      },
    });
    await Promise.all([refetchQuestions(), refetch()]);
  }

  async function handleDistributePoints() {
    if (!id) return;
    setQuestionCrudError(null);
    if (questions.length === 0) {
      setQuestionCrudError('Bài kiểm tra chưa có câu hỏi để phân bổ điểm.');
      return;
    }

    const total = Number(autoTotalPoints.trim());
    if (Number.isNaN(total) || total < 0) {
      setQuestionCrudError('Tổng điểm phải là số >= 0.');
      return;
    }

    try {
      await distributePointsMutation.mutateAsync({
        assessmentId: id,
        totalPoints: total,
        strategy: 'EQUAL',
        scale: 2,
      });
      await Promise.all([refetchQuestions(), refetch()]);
      showToast({ type: 'success', message: 'Đã phân bổ điểm thành công' });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể phân bổ điểm tự động.';
      setQuestionCrudError(message);
      showToast({ type: 'error', message });
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
      const message =
        error instanceof Error ? error.message : 'Không thể generate câu hỏi từ matrix.';
      const normalized = message.toUpperCase();
      if (
        normalized.includes('INSUFFICIENT_QUESTIONS_AVAILABLE') ||
        normalized.includes('INSUFFICIENT QUESTIONS')
      ) {
        setGenerateError(
          'Không đủ câu hỏi trong ngân hàng theo cấu trúc đề. Vui lòng bổ sung thêm câu hỏi.'
        );
        return;
      }
      setGenerateError(message);
    }
  }

  function renderContent() {
    if (isLoading) {
      return (
        <section className="module-page">
          <div className="empty">Đang tải chi tiết bài kiểm tra...</div>
        </section>
      );
    }

    if (isError) {
      return (
        <section className="module-page">
          <div className="empty">
            {error instanceof Error ? error.message : 'Không thể tải chi tiết bài kiểm tra'}
          </div>
        </section>
      );
    }

    if (!assessment) {
      return (
        <section className="module-page">
          <div className="empty">Không tìm thấy bài kiểm tra.</div>
        </section>
      );
    }

    return (
      <section className="module-page">
        <button className="btn secondary" onClick={() => navigate('/teacher/assessments')}>
          <ArrowLeft size={14} />
          Quay lại danh sách bài kiểm tra
        </button>

        <article className="hero-card">
          <div className="row" style={{ alignItems: 'start', flexWrap: 'wrap' }}>
            <div>
              <p className="hero-kicker">Chi tiết bài kiểm tra</p>
              <h2>{assessment.title}</h2>
              <p>{assessment.description || 'Không có mô tả'}</p>
            </div>
            {assessment.status === 'DRAFT' && (
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
            <span>
              {assessmentTypeLabel[assessment.assessmentType] || assessment.assessmentType}
            </span>
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
              Chính sách chấm điểm:{' '}
              {scoringPolicyLabel[assessment.attemptScoringPolicy || 'BEST'] ||
                assessment.attemptScoringPolicy ||
                'BEST'}
            </span>
          </article>
        </div>

        <div className="table-wrap">
          <table className="table">
            <tbody>
              <tr>
                <th>Bài học</th>
                <td>{assessment.lessonTitles?.join(', ') || 'Không có'}</td>
              </tr>
              <tr>
                <th>Thời gian làm bài</th>
                <td>{assessment.timeLimitMinutes || 0} phút</td>
              </tr>
              <tr>
                <th>Điểm đạt</th>
                <td>{assessment.passingScore || 0}%</td>
              </tr>
              <tr>
                <th>Chế độ tạo đề</th>
                <td>
                  {assessmentModeLabel[assessment.assessmentMode || 'DIRECT'] ||
                    assessment.assessmentMode ||
                    'DIRECT'}
                </td>
              </tr>
              <tr>
                <th>Ma trận đề</th>
                <td>{assessment.examMatrixId || 'Không có'}</td>
              </tr>
              <tr>
                <th>Lịch làm bài</th>
                <td>
                  {assessment.startDate
                    ? new Date(assessment.startDate).toLocaleString()
                    : 'Chưa đặt lịch'}{' '}
                  -{' '}
                  {assessment.endDate
                    ? new Date(assessment.endDate).toLocaleString()
                    : 'Không giới hạn'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <article className="data-card" style={{ marginTop: 16 }}>
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <h3>Câu hỏi trong bài kiểm tra</h3>
            <div className="row" style={{ justifyContent: 'start', flexWrap: 'wrap' }}>
              {assessment.status === 'DRAFT' && (
                <>
                  <input
                    className="input"
                    style={{ width: 140 }}
                    type="number"
                    min={0}
                    step={0.01}
                    value={autoTotalPoints}
                    onChange={(event) => setAutoTotalPoints(event.target.value)}
                    placeholder="Tổng điểm"
                  />
                  <button
                    className="btn"
                    onClick={() => void handleDistributePoints()}
                    disabled={questions.length === 0 || distributePointsMutation.isPending}
                  >
                    {distributePointsMutation.isPending
                      ? 'Đang phân bổ...'
                      : 'Phân bổ điểm tự động'}
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => void handleDistributePoints()}
                    disabled={questions.length === 0 || distributePointsMutation.isPending}
                  >
                    Reset về auto
                  </button>
                </>
              )}
              {assessment.status === 'DRAFT' &&
                assessment.assessmentMode === 'MATRIX_BASED' &&
                assessment.examMatrixId && (
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

          {generateError && (
            <div className="empty" style={{ color: '#b91c1c' }}>
              {generateError}
            </div>
          )}
          {questionCrudError && (
            <div className="empty" style={{ color: '#b91c1c' }}>
              {questionCrudError}
            </div>
          )}

          {assessment.status === 'DRAFT' && (
            <div className="preview-box" style={{ marginBottom: 12 }}>
              <p className="muted" style={{ marginBottom: 8 }}>
                Thêm câu hỏi vào assessment
              </p>
              <div className="form-grid" style={{ marginBottom: 10 }}>
                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>Từ khóa</p>
                  <input
                    className="input"
                    placeholder="Tìm theo nội dung câu hỏi..."
                    value={searchKeyword}
                    onChange={(event) => setSearchKeyword(event.target.value)}
                  />
                </label>
                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>Thẻ (tag)</p>
                  <input
                    className="input"
                    placeholder="Ví dụ: đại số, hình học..."
                    value={searchTag}
                    onChange={(event) => setSearchTag(event.target.value)}
                  />
                </label>
              </div>
              <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'start', marginBottom: 8 }}>
                <input
                  className="input"
                  style={{ width: 160 }}
                  type="number"
                  min={0}
                  step={0.25}
                  placeholder="Điểm cho câu hỏi"
                  value={addPoints}
                  onChange={(event) => setAddPoints(event.target.value)}
                />
                <button
                  className="btn"
                  onClick={() => void handleBatchAddFromSearch()}
                  disabled={addQuestionMutation.isPending || selectedToAdd.size === 0}
                >
                  {addQuestionMutation.isPending ? 'Đang thêm...' : `Thêm vào bài (${selectedToAdd.size})`}
                </button>
                <button className="btn secondary" onClick={() => void refetchSearch()}>
                  <RefreshCw size={14} />
                  Làm mới
                </button>
              </div>
              {searchLoading && <div className="empty">Đang tìm câu hỏi...</div>}
              {searchError && <div className="empty" style={{ color: '#b91c1c' }}>Không thể tìm câu hỏi</div>}
              {!searchLoading && !searchError && searchedQuestions.length > 0 && (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>
                          <input
                            type="checkbox"
                            checked={searchedQuestions.length > 0 && searchedQuestions.every((q) => selectedToAdd.has(q.id))}
                            onChange={(event) => handleSelectAllSearch(event.target.checked, searchedQuestions.map((q) => q.id))}
                          />
                        </th>
                        <th>Câu hỏi</th>
                        <th style={{ width: 150 }}>Loại</th>
                        <th style={{ width: 150 }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchedQuestions.map((question) => (
                        <tr key={question.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedToAdd.has(question.id)}
                              onChange={(event) => handleToggleSearchQuestion(event.target.checked, question.id)}
                            />
                          </td>
                          <td>
                            <MathText text={question.questionText} />
                          </td>
                          <td>{question.questionType}</td>
                          <td>{question.questionStatus || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!searchLoading && !searchError && searchedQuestions.length === 0 && (
                <div className="empty">Không tìm thấy câu hỏi. Nhập từ khóa để tìm kiếm.</div>
              )}
              {totalSearchElements > 0 && (
                <Pagination
                  page={searchPage}
                  totalPages={totalSearchPages}
                  totalElements={totalSearchElements}
                  pageSize={searchPageSize}
                  onChange={setSearchPage}
                  onPageSizeChange={(newSize) => {
                    setSearchPageSize(newSize);
                    setSearchPage(0);
                  }}
                />
              )}
            </div>
          )}

          {assessment.generationSummary && (
            <div className="preview-box" style={{ marginBottom: 12 }}>
              <p className="muted" style={{ marginBottom: 6 }}>
                totalQuestionsGenerated: {assessment.generationSummary.totalQuestionsGenerated ?? 0}
              </p>
              {(assessment.generationSummary.warnings || []).length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {(assessment.generationSummary.warnings || []).map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {questionsLoading && (
            <div className="question-list__loading">Đang tải danh sách câu hỏi...</div>
          )}
          
          {questionsError && (
            <div className="question-list__empty" style={{ color: '#dc2626' }}>
              {questionsErrorValue instanceof Error
                ? questionsErrorValue.message
                : 'Không thể tải câu hỏi trong bài kiểm tra.'}
            </div>
          )}
          
          {!questionsLoading && !questionsError && questions.length === 0 && (
            <div className="question-list__empty">Bài kiểm tra chưa có câu hỏi.</div>
          )}

          {!questionsLoading && !questionsError && questions.length > 0 && (
            <div className="question-list">
              {questions.map((question, index) => (
                <QuestionCard
                  key={getQuestionId(question)}
                  question={question}
                  index={index}
                  isDraft={assessment.status === 'DRAFT'}
                  onUpdate={handleUpdateQuestion}
                  onDelete={handleDeleteQuestion}
                  onClearOverride={handleClearOverride}
                  isUpdating={updateAssessmentQuestionMutation.isPending}
                  isDeleting={removeQuestionMutation.isPending}
                />
              ))}
            </div>
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
