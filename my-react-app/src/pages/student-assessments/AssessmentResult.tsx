import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  MessageSquare,
  AlertCircle,
  X,
  XCircle,
  Hourglass,
  Sparkles,
} from 'lucide-react';
import { UI_TEXT } from '../../constants/uiText';
import { useMyResult, useCreateRegradeRequest } from '../../hooks/useGrading';
import { ResultRenderer } from '../../components/question';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import MathText from '../../components/common/MathText';
import type { AnswerGradeResponse, GradingSubmissionResponse } from '../../types/grading.types';

function Shell({ children }: { readonly children: ReactNode }) {
  return (
    <DashboardLayout
      role="student"
      user={{ name: 'Student', avatar: '', role: 'student' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-8">{children}</div>
      </div>
    </DashboardLayout>
  );
}

function tierFromPct(pct: number) {
  if (pct >= 70)
    return {
      key: 'high' as const,
      gradient: 'from-emerald-100/95 via-[#faf9f5] to-teal-50/90',
      orbA: 'bg-emerald-400/35',
      orbB: 'bg-teal-300/20',
      headline: 'Bạn làm khá tốt!',
      sub: 'Giữ vững phong độ và ôn lại phần còn thiếu sót.',
      ring: 'stroke-emerald-500',
      scoreGlow: 'text-emerald-900',
    };
  if (pct >= 40)
    return {
      key: 'mid' as const,
      gradient: 'from-amber-100/90 via-[#faf9f5] to-orange-50/80',
      orbA: 'bg-amber-400/30',
      orbB: 'bg-orange-300/15',
      headline: 'Cần cố gắng thêm',
      sub: 'Xem lại các câu sai và đọc lời giải để tiến bộ nhanh hơn.',
      ring: 'stroke-amber-500',
      scoreGlow: 'text-amber-950',
    };
  return {
    key: 'low' as const,
    gradient: 'from-rose-100/85 via-[#faf9f5] to-[#fef2f2]',
    orbA: 'bg-rose-400/28',
    orbB: 'bg-red-300/12',
    headline: 'Đừng nản lòng',
    sub: 'Mỗi bài làm là cơ hội ôn tập — hãy đọc kỹ phần chi tiết bên dưới.',
    ring: 'stroke-rose-500',
    scoreGlow: 'text-rose-950',
  };
}

function statusBadge(status: GradingSubmissionResponse['status']) {
  const map: Record<string, string> = {
    GRADED: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    SUBMITTED: 'bg-sky-50 text-sky-900 border-sky-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-900 border-amber-200',
    INVALIDATED: 'bg-[#F5F4ED] text-[#5E5D59] border-[#E8E6DC]',
  };
  const label: Record<string, string> = {
    GRADED: 'Đã chấm',
    SUBMITTED: 'Đã nộp',
    IN_PROGRESS: 'Đang làm',
    INVALIDATED: 'Không hợp lệ',
  };
  return {
    className: map[status] ?? map.SUBMITTED,
    label: label[status] ?? status,
  };
}

function MiniStat({
  icon: Icon,
  iconBg,
  label,
  value,
}: {
  readonly icon: LucideIcon;
  readonly iconBg: string;
  readonly label: string;
  readonly value: ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#F0EEE6] bg-white p-4 shadow-[0_2px_20px_rgba(20,20,19,0.04)] transition-all duration-300 hover:border-[#E0DDD4] hover:shadow-[0_12px_36px_rgba(20,20,19,0.07)]">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/[0.04] ${iconBg}`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="font-[Be_Vietnam_Pro] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#87867F]">
            {label}
          </p>
          <div className="mt-0.5 font-[Playfair_Display] text-[22px] font-medium tabular-nums leading-none text-[#141413]">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultHero({
  result,
  pct,
  tier,
  numericScore,
  onBack,
}: {
  readonly result: GradingSubmissionResponse;
  readonly pct: number;
  readonly tier: ReturnType<typeof tierFromPct>;
  readonly numericScore: number;
  readonly onBack: () => void;
}) {
  const sb = statusBadge(result.status);
  const circumference = 2 * Math.PI * 52;
  const progress = Math.min(100, Math.max(0, pct));
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#E8E6DC] shadow-[0_24px_80px_-16px_rgba(20,20,19,0.14)]">
      <div className={`absolute inset-0 bg-gradient-to-br ${tier.gradient}`} aria-hidden />
      <div
        className={`pointer-events-none absolute -left-28 top-1/2 h-[380px] w-[380px] -translate-y-1/2 rounded-full blur-3xl ${tier.orbA}`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-3xl ${tier.orbB}`}
        aria-hidden
      />

      <div className="relative border-b border-white/50 bg-white/[0.2] backdrop-blur-[2px]">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#E8E6DC]/90 bg-white/90 px-3.5 py-2 text-[13px] font-medium text-[#5E5D59] shadow-sm backdrop-blur-md transition-all hover:border-[#d1cfc5] hover:bg-white hover:text-[#141413] active:scale-[0.98] font-[Be_Vietnam_Pro]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Danh sách {UI_TEXT.QUIZ.toLowerCase()}
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold font-[Be_Vietnam_Pro] ${sb.className}`}
            >
              {sb.label}
            </span>
            {result.gradesReleased ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold text-emerald-900 backdrop-blur-sm font-[Be_Vietnam_Pro]">
                <Sparkles className="h-3.5 w-3.5 text-[#C96442]" aria-hidden />
                Đã công bố điểm
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold text-amber-900 backdrop-blur-sm font-[Be_Vietnam_Pro]">
                <Hourglass className="h-3.5 w-3.5" aria-hidden />
                Điểm có thể thay đổi
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative px-6 py-8 sm:px-10 sm:py-10">
        <p className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-[0.2em] text-[#87867F]">
          Kết quả {UI_TEXT.QUIZ.toLowerCase()}
        </p>
        <div className="mt-4 flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-[Playfair_Display] text-[clamp(1.5rem,4vw,2.125rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[#141413]">
              {result.assessmentTitle}
            </h1>
            <p className="mt-4 max-w-xl font-[Playfair_Display] text-[19px] font-medium text-[#141413]/90">
              {tier.headline}
            </p>
            <p className="mt-2 max-w-xl font-[Be_Vietnam_Pro] text-[14px] leading-relaxed text-[#5E5D59]">
              {tier.sub}
            </p>
          </div>

          <div className="flex w-full shrink-0 flex-col items-center gap-6 sm:flex-row lg:w-auto lg:flex-col xl:flex-row">
            <div className="relative flex h-[140px] w-[140px] shrink-0 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  className="stroke-[#E8E6DC]"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  className={`${tier.ring} transition-[stroke-dashoffset] duration-700 ease-out`}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span
                  className={`font-[Playfair_Display] text-[34px] font-medium tabular-nums leading-none ${tier.scoreGlow}`}
                >
                  {numericScore % 1 === 0 ? String(Math.round(numericScore)) : numericScore.toFixed(1)}
                </span>
                <span className="mt-1 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
                  / {result.maxScore} điểm
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/55 px-6 py-4 text-center shadow-inner backdrop-blur-md sm:text-left">
              <p className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#87867F]">
                Tỷ lệ
              </p>
              <p className="mt-1 font-[Playfair_Display] text-[36px] font-medium tabular-nums text-[#141413]">
                {pct.toFixed(1)}
                <span className="text-[22px] text-[#87867F]">%</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AssessmentResult() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [showRegradeModal, setShowRegradeModal] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [regradeReason, setRegradeReason] = useState('');
  const [showExplanations, setShowExplanations] = useState(false);

  const { data, isLoading, isError } = useMyResult(submissionId || '');
  const createRegradeRequestMutation = useCreateRegradeRequest();

  const result = data?.result;

  const handleRegradeRequest = () => {
    if (!result || !selectedQuestionId || !regradeReason.trim()) return;

    createRegradeRequestMutation.mutate(
      {
        submissionId: result.submissionId,
        questionId: selectedQuestionId,
        reason: regradeReason,
      },
      {
        onSuccess: () => {
          setShowRegradeModal(false);
          setSelectedQuestionId('');
          setRegradeReason('');
        },
      }
    );
  };

  const goBack = () => navigate('/student/assessments');

  const answerStats = useMemo(() => {
    if (!result?.answers.length) {
      return { correct: 0, incorrect: 0 };
    }
    let correct = 0;
    let incorrect = 0;
    for (const a of result.answers) {
      if (a.isCorrect === true) correct++;
      else if (a.isCorrect === false) incorrect++;
    }
    return { correct, incorrect };
  }, [result?.answers]);

  if (isLoading) {
    return (
      <Shell>
        <div className="space-y-8">
          <div className="relative h-[320px] overflow-hidden rounded-3xl border border-[#F0EEE6] bg-[#FAF9F5]">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#f5f4ed] via-[#faf9f5] to-[#ebe8e0]" />
            <div className="relative flex flex-col gap-6 p-8 lg:flex-row lg:justify-between">
              <div className="space-y-4 flex-1">
                <div className="h-9 w-48 rounded-xl bg-[#E8E6DC]/90" />
                <div className="h-5 w-32 rounded-lg bg-[#E8E6DC]/70" />
                <div className="h-14 max-w-md rounded-xl bg-[#E8E6DC]/75" />
              </div>
              <div className="h-[140px] w-[140px] shrink-0 rounded-full bg-[#E8E6DC]/60" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((k) => (
              <div
                key={k}
                className="h-[92px] animate-pulse rounded-2xl border border-[#F0EEE6] bg-white"
              />
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-8 w-56 rounded-lg bg-[#E8E6DC]/70" />
            {[1, 2].map((k) => (
              <div key={k} className="h-40 animate-pulse rounded-2xl bg-[#F5F4ED]" />
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  if (isError || !result) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center rounded-3xl border border-[#F0EEE6] bg-[#FAF9F5] px-6 py-20 text-center shadow-inner">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_8px_30px_rgba(20,20,19,0.08)] ring-1 ring-[#E8E6DC]">
            <AlertCircle className="h-8 w-8 text-[#87867F]" aria-hidden />
          </div>
          <p className="mt-6 font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
            Không tải được kết quả
          </p>
          <p className="mt-2 max-w-sm font-[Be_Vietnam_Pro] text-[14px] text-[#87867F]">
            Kiểm tra kết nối hoặc thử mở lại sau.
          </p>
          <button
            type="button"
            onClick={goBack}
            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-[#E8E6DC] bg-white px-5 py-3 text-[13px] font-semibold text-[#141413] shadow-sm transition-all hover:bg-[#F5F4ED] active:scale-[0.98] font-[Be_Vietnam_Pro]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Quay lại danh sách
          </button>
        </div>
      </Shell>
    );
  }

  const numericScore = result.finalScore ?? result.score ?? 0;
  const pct =
    result.percentage ??
    (result.maxScore > 0 ? (numericScore / result.maxScore) * 100 : 0);
  const tier = tierFromPct(pct);

  const borderForAnswer = (answer: AnswerGradeResponse) => {
    if (answer.needsManualGrading && !answer.pointsEarned)
      return 'border-l-amber-500 bg-gradient-to-r from-amber-50/40 to-white';
    if (answer.isCorrect === true) return 'border-l-emerald-500 bg-gradient-to-r from-emerald-50/30 to-white';
    if (answer.isCorrect === false) return 'border-l-red-500 bg-gradient-to-r from-red-50/35 to-white';
    return 'border-l-[#C96442] bg-gradient-to-r from-[#fff7f5]/80 to-white';
  };

  return (
    <Shell>
      <ResultHero
        result={result}
        pct={pct}
        tier={tier}
        numericScore={numericScore}
        onBack={goBack}
      />

      {result.pendingQuestionsCount > 0 ? (
        <div
          role="status"
          className="flex gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-[#fffbeb] px-5 py-4 shadow-[0_8px_30px_-8px_rgba(180,83,9,0.12)]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Hourglass className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="font-[Playfair_Display] text-[17px] font-medium text-amber-950">
              Còn {result.pendingQuestionsCount} câu chờ chấm tay
            </p>
            <p className="mt-1 font-[Be_Vietnam_Pro] text-[13px] leading-relaxed text-amber-900/85">
              Điểm và nhận xét có thể cập nhật sau khi giáo viên hoàn tất chấm.
            </p>
          </div>
        </div>
      ) : null}

      <section aria-labelledby="result-meta-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="result-meta-heading"
              className="font-[Playfair_Display] text-[20px] font-medium text-[#141413]"
            >
              Tóm tắt làm bài
            </h2>
            <p className="mt-1 font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
              Thống kê nhanh theo từng câu
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MiniStat
            icon={CheckCircle2}
            iconBg="bg-emerald-100 text-emerald-700"
            label="Đúng"
            value={answerStats.correct}
          />
          <MiniStat
            icon={XCircle}
            iconBg="bg-red-100 text-red-600"
            label="Sai"
            value={answerStats.incorrect}
          />
          <MiniStat
            icon={Award}
            iconBg="bg-[#EEF2FF] text-indigo-600"
            label="Tự động chấm"
            value={result.autoGradedQuestionsCount}
          />
          <MiniStat
            icon={FileText}
            iconBg="bg-[#F5F4ED] text-[#5E5D59]"
            label="Tổng câu"
            value={result.answers.length}
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.timeSpentSeconds ? (
            <div className="flex items-center gap-3 rounded-2xl border border-[#E8E6DC] bg-white px-4 py-3 shadow-sm">
              <Clock className="h-5 w-5 text-[#87867F]" aria-hidden />
              <div>
                <p className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
                  Thời gian
                </p>
                <p className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413]">
                  {Math.floor(result.timeSpentSeconds / 60)} phút
                </p>
              </div>
            </div>
          ) : null}
          {result.attemptNumber ? (
            <div className="flex items-center gap-3 rounded-2xl border border-[#E8E6DC] bg-white px-4 py-3 shadow-sm">
              <FileText className="h-5 w-5 text-[#87867F]" aria-hidden />
              <div>
                <p className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
                  Lượt làm
                </p>
                <p className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413]">
                  Thứ {result.attemptNumber}
                </p>
              </div>
            </div>
          ) : null}
          {result.submittedAt ? (
            <div className="flex items-center gap-3 rounded-2xl border border-[#E8E6DC] bg-white px-4 py-3 shadow-sm sm:col-span-2 lg:col-span-1">
              <Clock className="h-5 w-5 text-[#87867F]" aria-hidden />
              <div className="min-w-0">
                <p className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
                  Nộp bài
                </p>
                <p className="truncate font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">
                  {new Date(result.submittedAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {result.manualAdjustment !== undefined && result.manualAdjustment !== 0 ? (
        <div className="rounded-3xl border border-[#E8E6DC] bg-white px-6 py-5 shadow-[0_12px_40px_-12px_rgba(20,20,19,0.08)]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#C96442]">
              <Award className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="font-[Playfair_Display] text-[17px] font-medium text-[#141413]">
                Điều chỉnh điểm thủ công
              </p>
              <p className="mt-2 font-[Be_Vietnam_Pro] text-[15px] font-semibold text-[#141413]">
                {result.manualAdjustment > 0 ? '+' : ''}
                {result.manualAdjustment} điểm
              </p>
              {result.manualAdjustmentReason ? (
                <p className="mt-2 font-[Be_Vietnam_Pro] text-[13px] leading-relaxed text-[#5E5D59]">
                  {result.manualAdjustmentReason}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 rounded-3xl border border-[#E8E6DC] bg-[#FAF9F5] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <p className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">
            Lời giải & đáp án gợi ý
          </p>
          <p className="mt-1 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
            Bật để xem phần giải thích từng câu (nếu có).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowExplanations(!showExplanations)}
          className={`inline-flex shrink-0 items-center gap-2 rounded-2xl border px-5 py-3 text-[13px] font-semibold transition-all active:scale-[0.98] font-[Be_Vietnam_Pro] ${
            showExplanations
              ? 'border-[#C96442] bg-[#C96442] text-[#FAF9F5] shadow-[0_10px_30px_-6px_rgba(201,100,66,0.45)]'
              : 'border-[#E8E6DC] bg-white text-[#141413] hover:bg-[#F5F4ED]'
          }`}
        >
          <BookOpen className="h-4 w-4" aria-hidden />
          {showExplanations ? 'Ẩn lời giải' : 'Xem lời giải'}
          {showExplanations ? (
            <ChevronUp className="h-4 w-4" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>

      <section>
        <h2 className="font-[Playfair_Display] text-[20px] font-medium text-[#141413]">
          Chi tiết câu trả lời
        </h2>
        <p className="mt-1 mb-6 font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
          Cuộn để xem từng phần — có thể yêu cầu chấm lại khi điểm đã được công bố.
        </p>
        <div className="flex flex-col gap-5">
          {result.answers.map((answer, index) => (
            <article
              key={answer.answerId}
              className={`relative overflow-hidden rounded-3xl border border-[#F0EEE6] border-l-[5px] bg-white p-5 shadow-[0_8px_30px_-10px_rgba(20,20,19,0.06)] transition-shadow duration-300 hover:shadow-[0_16px_48px_-12px_rgba(20,20,19,0.1)] sm:p-7 ${borderForAnswer(answer)}`}
            >
              <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-[#C96442]/[0.04] blur-2xl" aria-hidden />

              <div className="relative mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#141413] font-[Playfair_Display] text-[15px] font-medium text-[#FAF9F5]">
                    {index + 1}
                  </span>
                  <h3 className="font-[Be_Vietnam_Pro] text-[15px] font-semibold text-[#141413]">
                    Câu {index + 1}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[12px] font-semibold font-[Be_Vietnam_Pro] ${
                      answer.isCorrect === true
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                        : answer.isCorrect === false
                          ? 'border-red-200 bg-red-50 text-red-900'
                          : 'border-amber-200 bg-amber-50 text-amber-950'
                    }`}
                  >
                    {answer.pointsEarned?.toFixed(1) ?? 0} / {answer.maxPoints} điểm
                  </span>
                  {answer.needsManualGrading && !answer.pointsEarned ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-950 font-[Be_Vietnam_Pro]">
                      <Hourglass className="h-3.5 w-3.5" aria-hidden />
                      Chờ chấm
                    </span>
                  ) : null}
                  {answer.isManuallyAdjusted ? (
                    <span className="inline-flex items-center rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-900 font-[Be_Vietnam_Pro]">
                      Điều chỉnh tay
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="relative mb-5 max-w-[65ch] font-[Be_Vietnam_Pro] text-[15px] leading-[1.65] text-[#2d2c27]">
                <MathText text={answer.questionText} />
              </div>

              <div className="relative rounded-2xl border border-[#F0EEE6] bg-[#FAF9F5]/80 px-4 py-4">
                <ResultRenderer answer={answer} options={answer.options} />
              </div>

              {showExplanations && answer.explanation ? (
                <div className="relative mt-5 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-[#ecfdf5] px-5 py-4">
                  <p className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800">
                    Lời giải
                  </p>
                  <div className="mt-2 font-[Be_Vietnam_Pro] text-[14px] leading-relaxed text-emerald-950">
                    <MathText text={answer.explanation} />
                  </div>
                </div>
              ) : null}

              {answer.feedback ? (
                <div className="relative mt-5 rounded-2xl border border-[#E8E6DC] bg-white px-5 py-4 shadow-inner">
                  <p className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
                    Nhận xét từ giáo viên
                  </p>
                  <p className="mt-2 font-[Be_Vietnam_Pro] text-[14px] leading-relaxed text-[#141413]">
                    {answer.feedback}
                  </p>
                </div>
              ) : null}

              {result.gradesReleased ? (
                <button
                  type="button"
                  className="relative mt-5 inline-flex items-center gap-2 rounded-xl border border-[#E8E6DC] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#141413] shadow-sm transition-all hover:border-[#d1cfc5] hover:bg-[#FAF9F5] active:scale-[0.98] font-[Be_Vietnam_Pro]"
                  onClick={() => {
                    setSelectedQuestionId(answer.questionId);
                    setShowRegradeModal(true);
                  }}
                >
                  <MessageSquare className="h-4 w-4 text-[#C96442]" aria-hidden />
                  Yêu cầu chấm lại
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {showRegradeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[#F0EEE6] bg-white shadow-[rgba(0,0,0,0.22)_0px_24px_70px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="regrade-modal-title"
          >
            <div className="relative border-b border-[#F0EEE6] bg-gradient-to-r from-[#FAF9F5] to-white px-6 pb-4 pt-6">
              <div
                className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#C96442] to-[#141413]"
                aria-hidden
              />
              <div className="flex items-start justify-between gap-3 pl-3">
                <div>
                  <h3
                    id="regrade-modal-title"
                    className="font-[Playfair_Display] text-[20px] font-medium text-[#141413]"
                  >
                    Yêu cầu chấm lại
                  </h3>
                  <p className="mt-2 font-[Be_Vietnam_Pro] text-[13px] leading-relaxed text-[#87867F]">
                    Giải thích ngắn gọn để giáo viên xem xét công bằng hơn.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Đóng"
                  className="rounded-xl p-2 text-[#87867F] transition-colors hover:bg-[#F5F4ED] hover:text-[#141413]"
                  onClick={() => {
                    setShowRegradeModal(false);
                    setRegradeReason('');
                  }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              <textarea
                className="min-h-[150px] w-full resize-y rounded-2xl border border-[#E8E6DC] bg-[#FAF9F5] px-4 py-3 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] placeholder:text-[#87867F] outline-none transition-shadow focus:border-[#3898EC] focus:ring-[0_0_0_3px_rgba(56,152,236,0.12)]"
                value={regradeReason}
                onChange={(e) => setRegradeReason(e.target.value)}
                placeholder="Nhập lý do yêu cầu chấm lại..."
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-[#F0EEE6] px-6 py-5">
              <button
                type="button"
                className="rounded-xl border border-[#E8E6DC] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#5E5D59] transition-colors hover:bg-[#F5F4ED] font-[Be_Vietnam_Pro]"
                onClick={() => {
                  setShowRegradeModal(false);
                  setRegradeReason('');
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!regradeReason.trim() || createRegradeRequestMutation.isPending}
                className="rounded-xl bg-[#C96442] px-6 py-2.5 text-[13px] font-semibold text-[#FAF9F5] shadow-[0_10px_28px_-6px_rgba(201,100,66,0.5)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[#ccc] disabled:shadow-none font-[Be_Vietnam_Pro]"
                onClick={handleRegradeRequest}
              >
                {createRegradeRequestMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
