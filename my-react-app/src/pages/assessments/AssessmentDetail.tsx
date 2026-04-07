import { ArrowLeft, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useAssessment,
  useAssessmentQuestions,
  useGenerateQuestionsForAssessment,
  useSetPointsOverride,
  useUpdateAssessment,
} from '../../hooks/useAssessment';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import MathText from '../../components/common/MathText';
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

function getQuestionId(question: { questionId: string; id?: string }) {
  return question.questionId || question.id || '';
}

export default function AssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [openEdit, setOpenEdit] = useState(false);
  const [pointsDraft, setPointsDraft] = useState<Record<string, string>>({});
  const [generateError, setGenerateError] = useState<string | null>(null);

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
  const pointsOverrideMutation = useSetPointsOverride();
  const generateMutation = useGenerateQuestionsForAssessment();

  const assessment = data?.result;
  const questions = questionsData?.result ?? [];

  async function save(payload: AssessmentRequest) {
    if (!id) return;
    await updateMutation.mutateAsync({ id, data: payload });
    setOpenEdit(false);
    await refetch();
  }

  function getDraftValue(question: { questionId: string; id?: string; pointsOverride?: number | null }) {
    const questionId = getQuestionId(question);
    if (questionId in pointsDraft) return pointsDraft[questionId];
    if (typeof question.pointsOverride === 'number') return String(question.pointsOverride);
    return '';
  }

  function updatePointsDraft(questionId: string, value: string) {
    setPointsDraft((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }

  async function savePointsOverride(questionId: string) {
    const rawValue = pointsDraft[questionId];
    const trimmedValue = rawValue?.trim() ?? '';

    if (trimmedValue === '') {
      await pointsOverrideMutation.mutateAsync({
        assessmentId: id ?? '',
        data: {
          questionId,
          pointsOverride: null,
        },
      });
    } else {
      const pointsValue = Number(trimmedValue);
      if (Number.isNaN(pointsValue) || pointsValue < 0) return;
      await pointsOverrideMutation.mutateAsync({
        assessmentId: id ?? '',
        data: {
          questionId,
          pointsOverride: pointsValue,
        },
      });
    }

    await Promise.all([refetchQuestions(), refetch()]);
  }

  async function clearPointsOverride(questionId: string) {
    await pointsOverrideMutation.mutateAsync({
      assessmentId: id ?? '',
      data: {
        questionId,
        pointsOverride: null,
      },
    });
    setPointsDraft((prev) => ({ ...prev, [questionId]: '' }));
    await Promise.all([refetchQuestions(), refetch()]);
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
      if (
        normalized.includes('INSUFFICIENT_QUESTIONS_AVAILABLE') ||
        normalized.includes('INSUFFICIENT QUESTIONS')
      ) {
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
              <span className="muted">Có thể chỉnh điểm từng câu bằng pointsOverride</span>
              {assessment.status === 'DRAFT' && assessment.assessmentMode === 'MATRIX_BASED' && assessment.examMatrixId && (
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

          {questionsLoading && <div className="empty">Đang tải danh sách câu hỏi...</div>}
          {questionsError && (
            <div className="empty">
              {questionsErrorValue instanceof Error
                ? questionsErrorValue.message
                : 'Không thể tải câu hỏi trong bài kiểm tra.'}
            </div>
          )}
          {!questionsLoading && !questionsError && questions.length === 0 && (
            <div className="empty">Bài kiểm tra chưa có câu hỏi.</div>
          )}

          {!questionsLoading && !questionsError && questions.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>STT</th>
                    <th>Nội dung câu hỏi</th>
                    <th style={{ width: 150 }}>Điểm hiện tại</th>
                    <th style={{ width: 180 }}>Điểm override</th>
                    <th style={{ width: 260 }}>Thao tác</th>
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
                          <div className="row" style={{ justifyContent: 'start', flexWrap: 'wrap', marginTop: 6 }}>
                            {question.questionSourceType === 'AI_GENERATED' && <span className="badge draft">AI Generated</span>}
                            {question.questionSourceType === 'TEMPLATE_GENERATED' && <span className="badge approved">Parametric</span>}
                            {question.canonicalQuestionId && <span className="badge published">Generated from Canonical</span>}
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
                        <td>{question.points ?? 0}</td>
                        <td>
                          <input
                            className="input"
                            type="number"
                            min={0}
                            step={0.25}
                            value={getDraftValue(question)}
                            onChange={(event) => updatePointsDraft(questionId, event.target.value)}
                            placeholder="Để trống = dùng điểm gốc"
                          />
                        </td>
                        <td>
                          <div className="row" style={{ justifyContent: 'start' }}>
                            <button
                              className="btn"
                              onClick={() => void savePointsOverride(questionId)}
                              disabled={assessment.status !== 'DRAFT' || pointsOverrideMutation.isPending}
                            >
                              Lưu điểm
                            </button>
                            <button
                              className="btn secondary"
                              onClick={() => void clearPointsOverride(questionId)}
                              disabled={assessment.status !== 'DRAFT' || pointsOverrideMutation.isPending}
                            >
                              Xóa override
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
