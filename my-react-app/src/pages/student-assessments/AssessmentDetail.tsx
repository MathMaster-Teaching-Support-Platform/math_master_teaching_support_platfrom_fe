import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Play,
  RefreshCw,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useAssessmentDetails } from '../../hooks/useStudentAssessment';
import { UI_TEXT } from '../../constants/uiText';

const assessmentTypeLabel: Record<string, string> = {
  QUIZ: 'Trắc nghiệm',
  TEST: 'Kiểm tra',
  EXAM: 'Bài thi',
  HOMEWORK: 'Bài tập',
};

const statusLabel: Record<string, string> = {
  UPCOMING: 'Sắp tới',
  IN_PROGRESS: 'Đang làm',
  COMPLETED: 'Đã hoàn thành',
};

const statusPillClass: Record<string, string> = {
  UPCOMING: 'bg-blue-50 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-900 border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

function Shell({ children }: { readonly children: React.ReactNode }) {
  return (
    <DashboardLayout
      role="student"
      user={{ name: 'Student', avatar: '', role: 'student' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-6">{children}</div>
      </div>
    </DashboardLayout>
  );
}

export default function AssessmentDetail() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useAssessmentDetails(assessmentId ?? '');

  const assessment = data?.result;

  if (isLoading) {
    return (
      <Shell>
        <div className="space-y-6 animate-pulse">
          <div className="h-10 w-40 rounded-xl bg-[#E8E6DC]" />
          <div className="rounded-2xl border border-[#F0EEE6] bg-[#FAF9F5] h-36" />
          <div className="rounded-2xl border border-[#E8E6DC] bg-white p-6 space-y-4">
            <div className="h-4 w-48 rounded bg-[#E8E6DC]" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((k) => (
                <div key={k} className="h-16 rounded-xl bg-[#F5F4ED]" />
              ))}
            </div>
          </div>
          <div className="h-20 rounded-2xl bg-[#F5F4ED]" />
        </div>
      </Shell>
    );
  }

  if (isError || !assessment) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-400">
            <AlertCircle className="w-6 h-6" aria-hidden />
          </div>
          <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#B53333] text-center">
            Không thể tải thông tin {UI_TEXT.QUIZ.toLowerCase()}
          </p>
          <button
            type="button"
            onClick={() => navigate('/student/assessments')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
            Quay lại danh sách
          </button>
        </div>
      </Shell>
    );
  }

  const dueDate = assessment.endDate ? new Date(assessment.endDate) : null;
  const isOverdue = dueDate && dueDate < new Date();
  const attemptCount = assessment.attemptNumber || 0;

  const statusPill =
    statusPillClass[assessment.studentStatus] ?? 'bg-[#F5F4ED] text-[#5E5D59] border-[#E8E6DC]';

  return (
    <Shell>
      {/* Hero */}
      <div className="rounded-2xl border border-[#E8E6DC] bg-[#FAF9F5] p-5 shadow-[rgba(0,0,0,0.05)_0px_4px_24px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <button
            type="button"
            onClick={() => navigate('/student/assessments')}
            className="inline-flex self-start items-center gap-2 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
            Quay lại
          </button>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-semibold font-[Be_Vietnam_Pro] ${statusPill}`}
            >
              {statusLabel[assessment.studentStatus] ?? assessment.studentStatus}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#5E5D59]">
              {assessmentTypeLabel[assessment.assessmentType] ?? assessment.assessmentType}
            </span>
          </div>
        </div>
        <h1 className="font-[Playfair_Display] text-[22px] sm:text-[26px] font-medium text-[#141413] mt-4 leading-tight">
          {assessment.title}
        </h1>
      </div>

      {/* Thông tin */}
      <section className="rounded-2xl border border-[#E8E6DC] bg-white p-5 sm:p-6 shadow-[rgba(0,0,0,0.04)_0px_2px_12px]">
        <p className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F] border-b border-[#F0EEE6] pb-3 mb-4">
          Thông tin {UI_TEXT.QUIZ.toLowerCase()}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] p-4">
            <span className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
              Số câu hỏi
            </span>
            <span className="mt-1 flex items-center gap-2 font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413]">
              <FileText className="w-4 h-4 text-[#87867F]" aria-hidden />
              {assessment.totalQuestions} câu
            </span>
          </div>

          {assessment.timeLimitMinutes ? (
            <div className="rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] p-4">
              <span className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
                Thời gian
              </span>
              <span className="mt-1 flex items-center gap-2 font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413]">
                <Clock className="w-4 h-4 text-[#87867F]" aria-hidden />
                {assessment.timeLimitMinutes} phút
              </span>
            </div>
          ) : null}

          <div className="rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] p-4">
            <span className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
              Tổng điểm
            </span>
            <span className="mt-1 block font-[Playfair_Display] text-[20px] font-medium text-[#141413]">
              {assessment.totalPoints} điểm
            </span>
          </div>

          {assessment.passingScore != null ? (
            <div className="rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] p-4">
              <span className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
                Điểm đạt
              </span>
              <span className="mt-1 flex items-center gap-2 font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden />
                {assessment.passingScore} điểm
              </span>
            </div>
          ) : null}

          {dueDate ? (
            <div className="rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] p-4">
              <span className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
                Hạn nộp
              </span>
              <span
                className={`mt-1 flex items-center gap-2 font-[Be_Vietnam_Pro] text-[13px] font-semibold ${isOverdue ? 'text-red-600' : 'text-[#141413]'}`}
              >
                <Clock className="w-4 h-4 shrink-0 text-[#87867F]" aria-hidden />
                {dueDate.toLocaleString('vi-VN')}
                {isOverdue ? ' · Quá hạn' : ''}
              </span>
            </div>
          ) : null}

          {assessment.allowMultipleAttempts ? (
            <div className="rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] p-4">
              <span className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
                Số lần làm
              </span>
              <span className="mt-1 flex items-center gap-2 font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413]">
                <RefreshCw className="w-4 h-4 text-[#87867F]" aria-hidden />
                {attemptCount}
                {assessment.maxAttempts ? ` / ${assessment.maxAttempts}` : ''} lần
              </span>
            </div>
          ) : null}
        </div>

        {assessment.description ? (
          <div className="mt-5 rounded-xl border border-dashed border-[#E8E6DC] bg-[#FAF9F5] p-4">
            <span className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
              Hướng dẫn
            </span>
            <p className="mt-2 font-[Be_Vietnam_Pro] text-[14px] text-[#5E5D59] leading-relaxed whitespace-pre-wrap">
              {assessment.description}
            </p>
          </div>
        ) : null}
      </section>

      {!assessment.canStart && assessment.cannotStartReason ? (
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-amber-900">
              Không thể bắt đầu
            </p>
            <p className="font-[Be_Vietnam_Pro] text-[13px] text-amber-800/90 mt-1 leading-relaxed">
              {assessment.cannotStartReason}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 rounded-2xl border border-[#E8E6DC] bg-white p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between shadow-[rgba(0,0,0,0.04)_0px_2px_12px]">
        <div>
          <p className="font-[Be_Vietnam_Pro] text-[15px] font-semibold text-[#141413]">Bạn đã sẵn sàng?</p>
          <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-1 leading-relaxed">
            {assessment.canStart
              ? 'Đảm bảo kết nối ổn định trước khi bắt đầu làm bài.'
              : (assessment.cannotStartReason ?? `${UI_TEXT.QUIZ} này chưa thể bắt đầu.`)}
          </p>
        </div>
        <button
          type="button"
          disabled={!assessment.canStart}
          onClick={() => navigate(`/student/assessments/${assessmentId}/take`)}
          className="inline-flex items-center justify-center gap-2 min-w-[200px] px-5 py-3 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150"
        >
          <Play className="w-4 h-4" aria-hidden />
          {attemptCount > 0 ? 'Làm lại bài' : 'Bắt đầu làm bài'}
        </button>
      </div>
    </Shell>
  );
}
