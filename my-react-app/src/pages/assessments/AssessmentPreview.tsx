import { AlertCircle, ChevronLeft, ChevronRight, Eye, Flag, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QuestionRenderer, ResultRenderer } from '../../components/question';
import QuestionNavigator from '../../components/assessment/QuestionNavigator';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import MathText from '../../components/common/MathText';
import { AssessmentService } from '../../services/api/assessment.service';
import '../../styles/module-refactor.css';
import { UI_TEXT } from '../../constants/uiText';
import type {
  AssessmentResponse,
  AssessmentQuestionItem,
  PreviewAnswerResult,
  PreviewSubmitResponse,
} from '../../types';
import type { AttemptQuestionResponse } from '../../types/studentAssessment.types';
import type { AnswerGradeResponse } from '../../types/grading.types';

/**
 * Teacher "Làm thử đề" page.
 *
 * UI mirrors {@link TakeAssessment} pixel-for-pixel:
 *   - One question at a time (`QuestionRenderer`)
 *   - Part header (Phần I/II/III)
 *   - QuestionNavigator sidebar with answered/flagged state
 *   - Prev / Flag / Next navigation
 *   - Submit confirmation modal with "đã trả lời X / N câu"
 *
 * Differences from the student flow (per scope):
 *   - No countdown timer (not requested)
 *   - No "Lưu và thoát" — preview is stateless
 *   - "Nộp bài (thử)" calls /preview-submit which grades in memory and returns
 *     a result; nothing is persisted
 *   - After grading, the same per-question UI shows correctness + lời giải
 *     inline; "Làm lại" resets local state so the teacher can try again
 */
export default function AssessmentPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Loaded data
  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Live taking state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Submission/result state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<PreviewSubmitResponse | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      AssessmentService.getAssessmentPreview(id),
      AssessmentService.getAssessmentQuestions(id),
    ])
      .then(([detailRes, qRes]) => {
        if (cancelled) return;
        setAssessment(detailRes.result ?? null);
        setQuestions(qRes.result ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Không tải được dữ liệu xem trước');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  /**
   * Adapt the teacher-facing AssessmentQuestionItem[] into the shape the
   * student components expect (AttemptQuestionResponse[]). Field names
   * already overlap heavily; this is a thin adapter.
   */
  const attemptQuestions: AttemptQuestionResponse[] = useMemo(
    () =>
      questions.map((q) => ({
        questionId: q.questionId,
        orderIndex: q.orderIndex,
        questionText: q.questionText,
        questionType: q.questionType ?? 'MULTIPLE_CHOICE',
        options: q.options,
        points: q.points ?? 1,
        diagramData: q.diagramData ?? undefined,
        diagramUrl: q.diagramUrl,
        diagramLatex: q.diagramLatex,
      })) as AttemptQuestionResponse[],
    [questions]
  );

  const currentQuestion = attemptQuestions[currentIndex];
  const totalQuestions = attemptQuestions.length;
  const answeredCount = useMemo(
    () => Object.keys(answers).filter((k) => answers[k] !== undefined && answers[k] !== null).length,
    [answers]
  );

  /** Group questions by part for the part header (matches TakeAssessment). */
  const questionsByPart = useMemo(() => {
    const grouped = new Map<number, AttemptQuestionResponse[]>();
    attemptQuestions.forEach((q) => {
      let part: number;
      if (q.questionType === 'TRUE_FALSE') part = 2;
      else if (q.questionType === 'SHORT_ANSWER') part = 3;
      else part = 1;
      if (!grouped.has(part)) grouped.set(part, []);
      grouped.get(part)!.push(q);
    });
    return grouped;
  }, [attemptQuestions]);

  const currentPartInfo = useMemo(() => {
    if (!currentQuestion) return null;
    const partLabels: Record<number, string> = {
      1: 'Phần I: Trắc nghiệm nhiều lựa chọn',
      2: 'Phần II: Trắc nghiệm Đúng/Sai',
      3: 'Phần III: Trắc nghiệm trả lời ngắn',
    };
    let partNum: number;
    if (currentQuestion.questionType === 'TRUE_FALSE') partNum = 2;
    else if (currentQuestion.questionType === 'SHORT_ANSWER') partNum = 3;
    else partNum = 1;
    const partQuestions = questionsByPart.get(partNum) || [];
    const idxInPart = partQuestions.findIndex((q) => q.questionId === currentQuestion.questionId);
    return {
      partLabel: partLabels[partNum] || `Phần ${partNum}`,
      questionIndexInPart: idxInPart + 1,
      totalInPart: partQuestions.length,
    };
  }, [currentQuestion, questionsByPart]);

  /**
   * Adapt {@link PreviewAnswerResult} to {@link AnswerGradeResponse} so that
   * the student-side {@link ResultRenderer} (and its TF/MCQ/SA result
   * sub-components) can render the preview review identically to how
   * AssessmentResult.tsx renders student post-submit.
   */
  function toAnswerGrade(p: PreviewAnswerResult): AnswerGradeResponse {
    return {
      answerId: p.questionId,
      questionId: p.questionId,
      questionText: p.questionText,
      answerText: p.studentAnswer,
      correctAnswer: p.correctAnswer,
      isCorrect: p.isCorrect,
      pointsEarned: Number(p.pointsEarned),
      maxPoints: Number(p.maxPoints),
      explanation: p.explanation,
      questionType: p.questionType,
      scoringDetail: p.scoringDetail,
      options: (p.options ?? undefined) as Record<string, string> | undefined,
    };
  }

  const handleAnswerChange = useCallback((questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const handleFlagToggle = useCallback((questionId: string) => {
    setFlags((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!id) return;
    setShowSubmitConfirm(false);
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await AssessmentService.previewSubmit(id, answers);
      setResult(res.result ?? null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể chấm bài thử');
    } finally {
      setSubmitting(false);
    }
  }, [id, answers]);

  const handleReset = useCallback(() => {
    setAnswers({});
    setFlags({});
    setCurrentIndex(0);
    setResult(null);
    setSubmitError(null);
  }, []);

  // ─── Loading / error / empty ───────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout
        role="teacher"
        user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
        notificationCount={0}
      >
        <div className="module-layout-container">
          <div className="page-spinner">
            <div className="spinner-ring" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loadError || !assessment || !currentQuestion) {
    return (
      <DashboardLayout
        role="teacher"
        user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
        notificationCount={0}
      >
        <div className="module-layout-container">
          <div className="empty">{loadError || `Không thể tải ${UI_TEXT.QUIZ.toLowerCase()}`}</div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Render — mirror TakeAssessment for live taking, AssessmentResult for review ──
  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
    >
      <div className="module-layout-container">
        <section className="module-page" style={{ maxWidth: '100%' }}>
          {/* Preview-mode banner — always present so teacher knows context */}
          <div
            style={{
              padding: '8px 14px',
              marginBottom: 12,
              backgroundColor: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.85rem',
              color: '#78350f',
            }}
          >
            <Eye size={14} />
            <span>
              <strong>Chế độ xem trước</strong> — không tính lượt làm và không lưu kết quả.
            </span>
          </div>

          {result ? renderReviewLayout() : renderLiveTakingLayout()}

          {/* Submit confirmation modal — identical layout to TakeAssessment */}
          {showSubmitConfirm && !result && (
            <div className="modal-layer">
              <div className="modal-card" style={{ width: 'min(480px, 100%)' }}>
                <div className="modal-header">
                  <div>
                    <h3>Xác nhận nộp bài (thử)</h3>
                    <p className="muted" style={{ marginTop: 4 }}>
                      Đây là chế độ xem trước — bài làm sẽ được chấm nhưng không lưu.
                    </p>
                  </div>
                </div>
                <div className="modal-body">
                  <div
                    className="row"
                    style={{
                      gap: 8,
                      padding: 12,
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 8,
                    }}
                  >
                    <AlertCircle size={16} style={{ color: 'var(--warning-color)' }} />
                    <div>
                      <p>
                        Đã trả lời: {answeredCount} / {totalQuestions} câu
                      </p>
                      {answeredCount < totalQuestions && (
                        <p className="muted" style={{ marginTop: 4, fontSize: '0.875rem' }}>
                          Bạn còn {totalQuestions - answeredCount} câu chưa trả lời
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn secondary"
                    onClick={() => setShowSubmitConfirm(false)}
                  >
                    Hủy
                  </button>
                  <button className="btn" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Đang chấm...' : 'Xác nhận chấm thử'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );

  /** Live-taking layout — pixel-equivalent to TakeAssessment, minus timer/save-and-exit. */
  function renderLiveTakingLayout() {
    if (!currentQuestion) return null;
    return (
      <>
        <header
          className="page-header"
          style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}
        >
          <div>
            <h2>{assessment?.title || UI_TEXT.QUIZ}</h2>
            <p className="muted">
              Câu {currentIndex + 1} / {totalQuestions} • Đã trả lời: {answeredCount}
            </p>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, marginTop: 24 }}>
          <div>
            {currentPartInfo && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#dbeafe',
                  border: '2px solid #3b82f6',
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <h3 style={{ margin: 0, color: '#1e40af', fontSize: '1.1rem' }}>
                  {currentPartInfo.partLabel}
                </h3>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.875rem' }}>
                  Câu {currentPartInfo.questionIndexInPart} / {currentPartInfo.totalInPart} trong
                  phần này
                </p>
              </div>
            )}

            <QuestionRenderer
              question={currentQuestion}
              studentAnswer={answers[currentQuestion.questionId] as string | undefined}
              onAnswerChange={(value) => handleAnswerChange(currentQuestion.questionId, value)}
            />

            <div className="row" style={{ marginTop: 24, justifyContent: 'space-between' }}>
              <button
                className="btn secondary"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
              >
                <ChevronLeft size={14} />
                Câu trước
              </button>

              <button
                className="btn secondary"
                onClick={() => handleFlagToggle(currentQuestion.questionId)}
                style={{
                  backgroundColor: flags[currentQuestion.questionId]
                    ? 'var(--warning-color)'
                    : undefined,
                  color: flags[currentQuestion.questionId] ? 'white' : undefined,
                }}
              >
                <Flag size={14} />
                {flags[currentQuestion.questionId] ? 'Đã đánh dấu' : 'Đánh dấu'}
              </button>

              <button
                className="btn secondary"
                disabled={currentIndex === totalQuestions - 1}
                onClick={() => setCurrentIndex((prev) => prev + 1)}
              >
                Câu sau
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div>
            <QuestionNavigator
              questions={attemptQuestions}
              currentIndex={currentIndex}
              answers={answers}
              flags={flags}
              onNavigate={setCurrentIndex}
            />

            <div style={{ marginTop: 24 }}>
              <button
                className="btn"
                style={{ width: '100%' }}
                onClick={() => setShowSubmitConfirm(true)}
                disabled={submitting}
              >
                {submitting ? 'Đang chấm...' : 'Nộp bài (thử)'}
              </button>
              {submitError && (
                <p style={{ marginTop: 8, color: '#b91c1c', fontSize: '0.85rem' }}>
                  {submitError}
                </p>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  /**
   * Review layout — mirror student AssessmentResult.tsx exactly:
   * - Score banner with Đúng X/Y câu
   * - "Chi tiết câu trả lời" heading + list of all questions
   * - Each card: Câu N + colored badge (điểm) + ResultRenderer + Lời giải block
   */
  function renderReviewLayout() {
    if (!result || !assessment) return null;
    const percent =
      result.maxScore > 0 ? Math.round((Number(result.totalScore) / Number(result.maxScore)) * 100) : 0;
    return (
      <>
        <header
          className="page-header"
          style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}
        >
          <div>
            <h2>Kết quả thử — {assessment.title}</h2>
            <p className="muted">Bài làm chưa được lưu vào hệ thống.</p>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className="btn" onClick={handleReset}>
              <RefreshCw size={14} />
              Làm lại
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => navigate(`/teacher/assessments/${id}`)}
            >
              Đóng xem trước
            </button>
          </div>
        </header>

        {/* Score card — match student result page style */}
        <div
          style={{
            padding: 24,
            background: 'linear-gradient(135deg,#0ea5e9 0%,#1d4ed8 100%)',
            color: 'white',
            borderRadius: 12,
            marginTop: 16,
          }}
        >
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.85 }}>Điểm số</p>
          <p style={{ margin: '6px 0 0', fontSize: '2rem', fontWeight: 700 }}>
            {Number(result.totalScore).toFixed(2)} / {Number(result.maxScore).toFixed(2)}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.95rem', opacity: 0.9 }}>
            {percent}% • Đúng {result.correctCount}/{result.totalQuestions} câu
          </p>
        </div>

        {/* Per-question results — list-all layout matching AssessmentResult */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Chi tiết câu trả lời</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {result.answers.map((p, index) => {
              const grade = toAnswerGrade(p);
              const badgeColor =
                grade.isCorrect === true
                  ? 'var(--success-color)'
                  : grade.isCorrect === false
                    ? 'var(--danger-color)'
                    : 'var(--warning-color)';
              return (
                <div
                  key={p.questionId}
                  style={{
                    padding: 20,
                    backgroundColor: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                  }}
                >
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                    <h4>Câu {index + 1}</h4>
                    <span className="badge" style={{ backgroundColor: badgeColor }}>
                      {(grade.pointsEarned ?? 0).toFixed(1)} / {grade.maxPoints} điểm
                    </span>
                  </div>

                  <p style={{ marginBottom: 12 }}>
                    <MathText text={grade.questionText} />
                  </p>

                  <ResultRenderer answer={grade} options={grade.options} />

                  {grade.explanation && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 16,
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 8,
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 600,
                          color: '#166534',
                          marginBottom: 8,
                          fontSize: '0.9rem',
                        }}
                      >
                        Lời giải
                      </p>
                      <MathText text={grade.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }
}
