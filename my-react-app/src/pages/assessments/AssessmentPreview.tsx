import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flag,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QuestionNavigator from '../../components/assessment/QuestionNavigator';
import MathText from '../../components/common/MathText';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { QuestionRenderer, ResultRenderer } from '../../components/question';
import { UI_TEXT } from '../../constants/uiText';
import { AssessmentService } from '../../services/api/assessment.service';
import '../../styles/module-refactor.css';
import type {
  AssessmentQuestionItem,
  AssessmentResponse,
  PreviewAnswerResult,
  PreviewSubmitResponse,
} from '../../types';
import type { AnswerGradeResponse } from '../../types/grading.types';
import type { AttemptQuestionResponse } from '../../types/studentAssessment.types';

/**
 * Teacher "Làm thử đề" (/teacher/assessments/:id/preview).
 *
 * Same flows as TakeAssessment (one question, navigator, flag, submit confirm)
 * and post-submit review via ResultRenderer — styled with the teacher shell
 * (flush bleed, Playfair titles, terracotta CTAs) like other /teacher pages.
 *
 * Preview-only: no timer/save-and-exit; submit grades in memory via preview-submit.
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
    () =>
      Object.keys(answers).filter((k) => answers[k] !== undefined && answers[k] !== null).length,
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

  const layoutShell = (children: ReactNode) => (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="module-layout-container">{children}</div>
      </div>
    </DashboardLayout>
  );

  // ─── Loading / error / empty ───────────────────────────────────────────────
  if (loading) {
    return layoutShell(
      <div className="space-y-6" aria-busy="true">
        <div className="h-10 w-48 rounded-xl bg-[#FAF9F5] border border-[#F0EEE6] animate-pulse" />
        <div className="h-24 rounded-2xl bg-[#FAF9F5] border border-[#F0EEE6] animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div className="h-[420px] rounded-2xl bg-[#FAF9F5] border border-[#F0EEE6] animate-pulse" />
          <div className="h-[320px] rounded-2xl bg-[#FAF9F5] border border-[#F0EEE6] animate-pulse hidden lg:block" />
        </div>
      </div>
    );
  }

  if (loadError || !assessment) {
    return layoutShell(
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-400">
          <AlertCircle className="w-6 h-6" aria-hidden />
        </div>
        <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] text-center max-w-md m-0">
          {loadError || `Không thể tải ${UI_TEXT.QUIZ.toLowerCase()}`}
        </p>
        {id ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
            onClick={() => navigate(`/teacher/assessments/${id}`)}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Về chi tiết đề
          </button>
        ) : null}
      </div>
    );
  }

  if (totalQuestions === 0) {
    return layoutShell(
      <div className="space-y-6">
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
          onClick={() => navigate(`/teacher/assessments/${id}`)}
        >
          <ArrowLeft size={15} aria-hidden />
          Quay lại chi tiết đề
        </button>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <Eye className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden />
          <p className="font-[Be_Vietnam_Pro] text-[13px] text-amber-950 m-0 leading-relaxed">
            <span className="font-semibold">Chế độ xem trước</span> — không lưu kết quả. Hiện{' '}
            {UI_TEXT.QUIZ.toLowerCase()} chưa có câu hỏi để làm thử.
          </p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return layoutShell(
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] m-0">
          Không có câu hỏi hợp lệ để hiển thị.
        </p>
      </div>
    );
  }

  // ─── Render — mirror TakeAssessment for live taking, AssessmentResult for review ──
  return layoutShell(
    <div className="space-y-6">
      <button
        type="button"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
        onClick={() => navigate(`/teacher/assessments/${id}`)}
      >
        <ArrowLeft size={15} aria-hidden />
        Quay lại chi tiết đề
      </button>

      <div className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 flex items-start gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
          <Eye className="w-4 h-4 text-amber-800" aria-hidden />
        </div>
        <p className="font-[Be_Vietnam_Pro] text-[13px] text-amber-950 m-0 leading-relaxed">
          <span className="font-semibold">Chế độ xem trước</span> — không tính lượt làm, không lưu
          bài và không ảnh hưởng học sinh. Bạn có thể nộp bài để xem chấm thử trong phiên này.
        </p>
      </div>

      {/* Title row — aligned with /teacher/mindmaps */}
      {!result ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] shrink-0">
              <Sparkles className="w-5 h-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] break-words">
                {assessment.title || UI_TEXT.QUIZ}
              </h1>
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5 m-0">
                Làm thử · Câu {currentIndex + 1} / {totalQuestions} · Đã trả lời: {answeredCount}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] shrink-0">
              <Sparkles className="w-5 h-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] break-words">
                Kết quả thử
              </h1>
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5 m-0 truncate">
                {assessment.title}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] active:scale-[0.98] transition-all duration-150"
              onClick={handleReset}
            >
              <RefreshCw size={15} aria-hidden />
              Làm lại
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors active:scale-[0.98]"
              onClick={() => navigate(`/teacher/assessments/${id}`)}
            >
              Đóng xem trước
            </button>
          </div>
        </div>
      )}

      {result ? renderReviewLayout() : renderLiveTakingLayout()}

      {/* Submit confirmation modal */}
      {showSubmitConfirm && !result && (
        <div className="fixed inset-0 z-50 bg-[#141413]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-[rgba(0,0,0,0.18)_0px_20px_48px] w-full max-w-md overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-submit-title"
          >
            <div className="px-6 pt-6 pb-4 border-b border-[#F0EEE6] bg-[#FAF9F5]">
              <h3
                id="preview-submit-title"
                className="font-[Playfair_Display] text-[17px] font-medium text-[#141413] m-0"
              >
                Xác nhận nộp bài (thử)
              </h3>
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-2 m-0 leading-relaxed">
                Chấm thử trên máy chủ — kết quả chỉ hiển thị trong phiên này, không lưu vào hệ
                thống.
              </p>
            </div>
            <div className="px-6 py-5">
              <div className="rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] px-4 py-3 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413] m-0">
                    Đã trả lời: {answeredCount} / {totalQuestions} câu
                  </p>
                  {answeredCount < totalQuestions ? (
                    <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-1.5 m-0">
                      Bạn còn {totalQuestions - answeredCount} câu chưa trả lời — vẫn có thể nộp để
                      xem điểm các câu đã làm.
                    </p>
                  ) : (
                    <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-1.5 m-0">
                      Bạn đã trả lời đủ {totalQuestions} câu.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-6 pb-6 pt-0">
              <button
                type="button"
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                onClick={() => setShowSubmitConfirm(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#C96442] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                onClick={() => void handleSubmit()}
                disabled={submitting}
              >
                {submitting ? 'Đang chấm...' : 'Chấm thử'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /** Live-taking layout — TakeAssessment flow, styled like teacher mindmaps shell */
  function renderLiveTakingLayout() {
    if (!currentQuestion) return null;
    const flagged = Boolean(flags[currentQuestion.questionId]);
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6 lg:gap-8">
        <div className="min-w-0">
          {currentPartInfo ? (
            <div className="rounded-2xl border border-[#E8E6DC] bg-[#FAF9F5] px-4 py-3 mb-5">
              <p className="font-[Playfair_Display] text-[15px] font-medium text-[#141413] m-0">
                {currentPartInfo.partLabel}
              </p>
              <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-1 m-0">
                Câu {currentPartInfo.questionIndexInPart} / {currentPartInfo.totalInPart} trong phần
                này
              </p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-[#E8E6DC] bg-white p-4 sm:p-6 shadow-sm">
            <QuestionRenderer
              question={currentQuestion}
              studentAnswer={answers[currentQuestion.questionId] as string | undefined}
              onAnswerChange={(value) => handleAnswerChange(currentQuestion.questionId, value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-6">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
            >
              <ChevronLeft size={16} aria-hidden />
              Câu trước
            </button>

            <button
              type="button"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-[Be_Vietnam_Pro] text-[13px] font-semibold transition-colors ${
                flagged
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'border border-[#E8E6DC] bg-white text-[#5E5D59] hover:bg-[#F5F4ED]'
              }`}
              onClick={() => handleFlagToggle(currentQuestion.questionId)}
            >
              <Flag size={15} aria-hidden />
              {flagged ? 'Đã đánh dấu' : 'Đánh dấu'}
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              disabled={currentIndex === totalQuestions - 1}
              onClick={() => setCurrentIndex((prev) => prev + 1)}
            >
              Câu sau
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 space-y-4 h-fit">
          <div className="rounded-2xl border border-[#E8E6DC] bg-white p-3 shadow-sm overflow-hidden">
            <QuestionNavigator
              questions={attemptQuestions}
              currentIndex={currentIndex}
              answers={answers}
              flags={flags}
              onNavigate={setCurrentIndex}
            />
          </div>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#C96442] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition-all duration-150"
            onClick={() => setShowSubmitConfirm(true)}
            disabled={submitting}
          >
            {submitting ? 'Đang chấm...' : 'Nộp bài (thử)'}
          </button>
          {submitError ? (
            <p className="font-[Be_Vietnam_Pro] text-[12px] text-red-600 m-0 px-1">{submitError}</p>
          ) : null}
        </div>
      </div>
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
      result.maxScore > 0
        ? Math.round((Number(result.totalScore) / Number(result.maxScore)) * 100)
        : 0;
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#E8E6DC] bg-[#141413] text-[#FAF9F5] p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.12)] relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#C96442]/25 blur-3xl pointer-events-none"
            aria-hidden
          />
          <p className="font-[Be_Vietnam_Pro] text-[12px] uppercase tracking-wide text-[#FAF9F5]/70 m-0">
            Điểm chấm thử
          </p>
          <p className="font-[Playfair_Display] text-[clamp(2rem,5vw,2.75rem)] font-medium text-[#FAF9F5] mt-2 mb-0 tabular-nums">
            {Number(result.totalScore).toFixed(2)}{' '}
            <span className="text-[#FAF9F5]/50 font-normal">/</span>{' '}
            {Number(result.maxScore).toFixed(2)}
          </p>
          <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#FAF9F5]/85 mt-3 m-0">
            {percent}% · Đúng {result.correctCount}/{result.totalQuestions} câu ·{' '}
            <span className="text-[#FAF9F5]/60">Chưa lưu vào hệ thống</span>
          </p>
        </div>

        <div>
          <h2 className="font-[Playfair_Display] text-[17px] font-medium text-[#141413] m-0 mb-4">
            Chi tiết câu trả lời
          </h2>
          <div className="flex flex-col gap-4">
            {result.answers.map((p, index) => {
              const grade = toAnswerGrade(p);
              const badgeClass =
                grade.isCorrect === true
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : grade.isCorrect === false
                    ? 'bg-red-50 text-red-800 border-red-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200';
              return (
                <div
                  key={p.questionId}
                  className="rounded-2xl border border-[#E8E6DC] bg-white p-5 sm:p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <h3 className="font-[Playfair_Display] text-[15px] font-medium text-[#141413] m-0">
                      Câu {index + 1}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full border font-[Be_Vietnam_Pro] text-[11px] font-semibold tabular-nums ${badgeClass}`}
                    >
                      {(grade.pointsEarned ?? 0).toFixed(1)} / {grade.maxPoints} điểm
                    </span>
                  </div>

                  <div className="font-[Be_Vietnam_Pro] text-[14px] text-[#141413] mb-4">
                    <MathText text={grade.questionText} />
                  </div>

                  <ResultRenderer answer={grade} options={grade.options} />

                  {grade.explanation ? (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
                      <p className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-emerald-900 m-0 mb-2">
                        Lời giải
                      </p>
                      <div className="font-[Be_Vietnam_Pro] text-[13px] text-[#14532d]">
                        <MathText text={grade.explanation} />
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}
