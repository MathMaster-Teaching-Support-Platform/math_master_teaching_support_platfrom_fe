import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  MessageSquare,
  AlertCircle,
  X,
} from 'lucide-react';
import { UI_TEXT } from '../../constants/uiText';
import { useMyResult, useCreateRegradeRequest } from '../../hooks/useGrading';
import { ResultRenderer } from '../../components/question';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import MathText from '../../components/common/MathText';

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

  const shell = (inner: ReactNode) => (
    <DashboardLayout
      role="student"
      user={{ name: 'Student', avatar: '', role: 'student' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-6">{inner}</div>
      </div>
    </DashboardLayout>
  );

  if (isLoading) {
    return shell(
      <div className="grid gap-4 animate-pulse">
        <div className="h-12 w-44 rounded-xl bg-[#E8E6DC]" />
        <div className="h-48 rounded-2xl bg-[#FAF9F5] border border-[#F0EEE6]" />
        <div className="h-32 rounded-2xl bg-[#F5F4ED]" />
      </div>
    );
  }

  if (isError || !result) {
    return shell(
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#E8E6DC] flex items-center justify-center text-[#B0AEA5]">
          <AlertCircle className="w-6 h-6" aria-hidden />
        </div>
        <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F]">Không thể tải kết quả</p>
        <button
          type="button"
          onClick={() => navigate('/student/assessments')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
          Quay lại
        </button>
      </div>
    );
  }

  const scoreDisplay = result.finalScore?.toFixed(1) ?? result.score?.toFixed(1) ?? '0';

  const scoreBadgeClass = (() => {
    const pct = result.percentage ?? 0;
    if (pct >= 70) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (pct >= 40) return 'bg-amber-50 text-amber-900 border-amber-200';
    return 'bg-red-50 text-red-800 border-red-200';
  })();

  const answerPointsClass = (answer: { isCorrect?: boolean | null }) => {
    if (answer.isCorrect === true) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (answer.isCorrect === false) return 'bg-red-50 text-red-800 border-red-200';
    return 'bg-amber-50 text-amber-900 border-amber-200';
  };

  return shell(
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => navigate('/student/assessments')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
            Quay lại
          </button>
          <div>
            <h1 className="font-[Playfair_Display] text-[22px] sm:text-[26px] font-medium text-[#141413] leading-tight">
              {result.assessmentTitle}
            </h1>
            <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-1">
              Kết quả {UI_TEXT.QUIZ.toLowerCase()}
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-[#E8E6DC] bg-[#FAF9F5] p-6 sm:p-8 shadow-[rgba(0,0,0,0.05)_0px_4px_24px]">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <p className="font-[Be_Vietnam_Pro] text-[12px] font-semibold uppercase tracking-wide text-[#87867F] mb-2">
                Điểm số
              </p>
              <p className="font-[Playfair_Display] text-[clamp(2.5rem,6vw,3.5rem)] font-medium text-[#141413] leading-none tabular-nums">
                {scoreDisplay}
                <span className="font-[Be_Vietnam_Pro] text-[18px] font-semibold text-[#87867F]">
                  {' '}
                  / {result.maxScore}
                </span>
              </p>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-xl border text-[13px] font-semibold font-[Be_Vietnam_Pro] ${scoreBadgeClass}`}
            >
              {result.percentage?.toFixed(1)}%
            </span>
          </div>

          <div className="flex flex-col gap-3 min-w-[240px] font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59]">
            {result.timeSpentSeconds ? (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#87867F]" aria-hidden />
                <span>Thời gian: {Math.floor(result.timeSpentSeconds / 60)} phút</span>
              </div>
            ) : null}
            {result.attemptNumber ? (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#87867F]" aria-hidden />
                <span>Lần làm thứ {result.attemptNumber}</span>
              </div>
            ) : null}
            {result.submittedAt ? (
              <p className="text-[#87867F] text-[12px]">
                Nộp lúc: {new Date(result.submittedAt).toLocaleString('vi-VN')}
              </p>
            ) : null}
          </div>
        </div>

        {result.manualAdjustment !== undefined && result.manualAdjustment !== 0 ? (
          <div className="mt-6 rounded-xl border border-[#E8E6DC] bg-white px-4 py-3">
            <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#141413]">
              Điều chỉnh thủ công: {result.manualAdjustment > 0 ? '+' : ''}
              {result.manualAdjustment} điểm
            </p>
            {result.manualAdjustmentReason ? (
              <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-2 leading-relaxed">
                Lý do: {result.manualAdjustmentReason}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowExplanations(!showExplanations)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border font-[Be_Vietnam_Pro] text-[13px] font-medium transition-colors ${
              showExplanations
                ? 'border-[#141413] bg-[#141413] text-[#FAF9F5]'
                : 'border-[#E8E6DC] bg-white text-[#5E5D59] hover:bg-[#F5F4ED]'
            }`}
          >
            <BookOpen className="w-4 h-4" aria-hidden />
            {showExplanations ? 'Ẩn lời giải' : 'Xem lời giải'}
            {showExplanations ? (
              <ChevronUp className="w-4 h-4" aria-hidden />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden />
            )}
          </button>
        </div>
      </section>

      <section>
        <h2 className="font-[Playfair_Display] text-[18px] font-medium text-[#141413] mb-4">
          Chi tiết câu trả lời
        </h2>
        <div className="flex flex-col gap-4">
          {result.answers.map((answer, index) => (
            <article
              key={answer.answerId}
              className="rounded-2xl border border-[#F0EEE6] bg-white p-5 sm:p-6 shadow-[rgba(0,0,0,0.04)_0px_2px_12px]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                <h3 className="font-[Be_Vietnam_Pro] text-[15px] font-semibold text-[#141413]">
                  Câu {index + 1}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[12px] font-semibold font-[Be_Vietnam_Pro] ${answerPointsClass(answer)}`}
                  >
                    {answer.pointsEarned?.toFixed(1) ?? 0} / {answer.maxPoints} điểm
                  </span>
                  {answer.needsManualGrading && !answer.pointsEarned ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-[12px] font-medium font-[Be_Vietnam_Pro]">
                      Đang chấm
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="font-[Be_Vietnam_Pro] text-[14px] text-[#141413] leading-relaxed mb-4">
                <MathText text={answer.questionText} />
              </div>

              <ResultRenderer answer={answer} options={answer.options} />

              {showExplanations && answer.explanation ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
                  <p className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-emerald-900 uppercase tracking-wide mb-2">
                    Lời giải
                  </p>
                  <div className="font-[Be_Vietnam_Pro] text-[14px] text-emerald-950 leading-relaxed">
                    <MathText text={answer.explanation} />
                  </div>
                </div>
              ) : null}

              {answer.feedback ? (
                <div className="mt-4 rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] px-4 py-3">
                  <p className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#87867F] mb-2">
                    Nhận xét từ giáo viên
                  </p>
                  <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#141413] leading-relaxed">
                    {answer.feedback}
                  </p>
                </div>
              ) : null}

              {result.gradesReleased ? (
                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                  onClick={() => {
                    setSelectedQuestionId(answer.questionId);
                    setShowRegradeModal(true);
                  }}
                >
                  <MessageSquare className="w-4 h-4" aria-hidden />
                  Yêu cầu chấm lại
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {showRegradeModal ? (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-[rgba(0,0,0,0.20)_0px_20px_60px] w-full max-w-lg flex flex-col max-h-[90vh]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="regrade-modal-title"
          >
            <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-3 border-b border-[#F0EEE6]">
              <div>
                <h3
                  id="regrade-modal-title"
                  className="font-[Playfair_Display] text-[18px] font-medium text-[#141413]"
                >
                  Yêu cầu chấm lại
                </h3>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-1">
                  Giải thích lý do bạn muốn giáo viên chấm lại câu này
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng"
                className="p-2 rounded-lg text-[#87867F] hover:bg-[#F5F4ED] hover:text-[#141413] transition-colors"
                onClick={() => {
                  setShowRegradeModal(false);
                  setRegradeReason('');
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto">
              <textarea
                className="w-full min-h-[140px] rounded-xl border border-[#E8E6DC] px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] placeholder:text-[#87867F] outline-none focus:border-[#3898EC] focus:ring-[0_0_0_3px_rgba(56,152,236,0.12)] resize-y bg-[#FAF9F5]"
                value={regradeReason}
                onChange={(e) => setRegradeReason(e.target.value)}
                placeholder="Nhập lý do yêu cầu chấm lại..."
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 px-6 pb-6 pt-2 border-t border-[#F0EEE6]">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
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
                className="px-5 py-2.5 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                onClick={handleRegradeRequest}
              >
                {createRegradeRequestMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
