import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  ArrowLeft,
  BookMarked,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  GraduationCap,
  ListChecks,
  Play,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useAssessmentDetails } from '../../hooks/useStudentAssessment';
import { UI_TEXT } from '../../constants/uiText';
import type { StudentAssessmentResponse } from '../../types/studentAssessment.types';

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

const statusMeta: Record<
  string,
  { pill: string; glow: string; labelVi: string }
> = {
  UPCOMING: {
    pill: 'bg-white/80 text-blue-800 border-blue-200/80 backdrop-blur-sm shadow-sm',
    glow: 'bg-blue-400/25',
    labelVi: 'Sắp mở làm bài',
  },
  IN_PROGRESS: {
    pill: 'bg-white/80 text-amber-900 border-amber-200/80 backdrop-blur-sm shadow-sm',
    glow: 'bg-amber-400/25',
    labelVi: 'Đang trong tiến độ',
  },
  COMPLETED: {
    pill: 'bg-white/80 text-emerald-900 border-emerald-200/80 backdrop-blur-sm shadow-sm',
    glow: 'bg-emerald-400/25',
    labelVi: 'Đã hoàn thành',
  },
};

const typeVisual: Record<
  string,
  {
    Icon: LucideIcon;
    gradient: string;
    orb: string;
    chip: string;
  }
> = {
  QUIZ: {
    Icon: ListChecks,
    gradient: 'from-[#eef2ff] via-[#faf9f5] to-[#ede9fe]',
    orb: 'bg-indigo-500/30',
    chip: 'text-indigo-800 bg-indigo-50/90 border-indigo-200/70',
  },
  TEST: {
    Icon: ClipboardList,
    gradient: 'from-[#eff6ff] via-[#faf9f5] to-[#e0f2fe]',
    orb: 'bg-sky-500/30',
    chip: 'text-sky-900 bg-sky-50/90 border-sky-200/70',
  },
  EXAM: {
    Icon: GraduationCap,
    gradient: 'from-[#fff1f2] via-[#faf9f5] to-[#ffedd5]',
    orb: 'bg-rose-500/25',
    chip: 'text-rose-900 bg-rose-50/90 border-rose-200/70',
  },
  HOMEWORK: {
    Icon: BookMarked,
    gradient: 'from-[#ecfdf5] via-[#faf9f5] to-[#d1fae5]',
    orb: 'bg-emerald-500/25',
    chip: 'text-emerald-900 bg-emerald-50/90 border-emerald-200/70',
  },
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
        <div className="space-y-8">{children}</div>
      </div>
    </DashboardLayout>
  );
}

function StatBentoCard({
  icon: Icon,
  iconBg,
  label,
  children,
  className = '',
}: {
  readonly icon: LucideIcon;
  readonly iconBg: string;
  readonly label: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-[#F0EEE6] bg-white p-5 shadow-[0_2px_20px_rgba(20,20,19,0.04)] transition-all duration-300 hover:border-[#E0DDD4] hover:shadow-[0_12px_40px_rgba(20,20,19,0.08)] ${className}`}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100 bg-[#C96442]/10"
        aria-hidden
      />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} ring-1 ring-black/[0.04]`}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <span className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#87867F]">
            {label}
          </span>
        </div>
        <div className="font-[Be_Vietnam_Pro] text-[15px] font-semibold leading-snug text-[#141413]">
          {children}
        </div>
      </div>
    </div>
  );
}

function DetailHero({
  assessment,
  onBack,
}: {
  readonly assessment: StudentAssessmentResponse;
  readonly onBack: () => void;
}) {
  const tv = typeVisual[assessment.assessmentType] ?? typeVisual.QUIZ;
  const sm = statusMeta[assessment.studentStatus] ?? {
    pill: 'bg-white/70 text-[#5E5D59] border-[#E8E6DC] backdrop-blur-sm',
    glow: 'bg-[#87867F]/20',
    labelVi: '',
  };
  const TypeIcon = tv.Icon;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#E8E6DC] shadow-[0_24px_80px_-16px_rgba(20,20,19,0.14)]">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${tv.gradient}`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute -left-24 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full mix-blend-multiply blur-3xl ${tv.orb}`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full blur-3xl ${sm.glow}`}
        aria-hidden
      />
      <div className="relative border-b border-white/40 bg-white/[0.15] backdrop-blur-[2px]">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
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
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold font-[Be_Vietnam_Pro] ${sm.pill}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
              {statusLabel[assessment.studentStatus] ?? assessment.studentStatus}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold font-[Be_Vietnam_Pro] ${tv.chip}`}
            >
              <TypeIcon className="h-3.5 w-3.5 opacity-90" aria-hidden />
              {assessmentTypeLabel[assessment.assessmentType] ?? assessment.assessmentType}
            </span>
          </div>
        </div>
      </div>

      <div className="relative px-6 pb-8 pt-6 sm:px-10 sm:pb-10 sm:pt-8">
        <p className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-[0.2em] text-[#87867F]">
          Chi tiết {UI_TEXT.QUIZ.toLowerCase()}
        </p>
        <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-[Playfair_Display] text-[clamp(1.75rem,4vw,2.375rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[#141413]">
              {assessment.title}
            </h1>
            {sm.labelVi ? (
              <p className="mt-3 max-w-2xl font-[Be_Vietnam_Pro] text-[14px] leading-relaxed text-[#5E5D59]">
                {sm.labelVi}. Đọc kỹ thông tin dưới đây trước khi{' '}
                {assessment.studentStatus === 'COMPLETED' ? 'xem lại hoặc làm lại' : 'bắt đầu'}.
              </p>
            ) : (
              <p className="mt-3 max-w-2xl font-[Be_Vietnam_Pro] text-[14px] leading-relaxed text-[#5E5D59]">
                Chuẩn bị tốt giúp bạn làm bài tự tin và chính xác hơn.
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-white/60 bg-white/50 px-5 py-4 shadow-inner backdrop-blur-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#141413] text-[#FAF9F5] shadow-lg shadow-black/15">
              <TypeIcon className="h-7 w-7" strokeWidth={1.25} aria-hidden />
            </div>
            <div>
              <p className="font-[Playfair_Display] text-[28px] font-medium leading-none tabular-nums text-[#141413]">
                {assessment.totalQuestions}
              </p>
              <p className="mt-1 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">câu hỏi</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AssessmentDetail() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useAssessmentDetails(assessmentId ?? '');

  const assessment = data?.result;

  const goList = () => navigate('/student/assessments');

  if (isLoading) {
    return (
      <Shell>
        <div className="space-y-8">
          <div className="relative h-[280px] overflow-hidden rounded-3xl border border-[#F0EEE6] bg-[#FAF9F5]">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#f5f4ed] to-[#ebe8e0]" />
            <div className="relative space-y-6 p-8">
              <div className="h-9 w-52 rounded-xl bg-[#E8E6DC]/80" />
              <div className="h-4 w-36 rounded-lg bg-[#E8E6DC]/60" />
              <div className="h-12 max-w-xl rounded-xl bg-[#E8E6DC]/70" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5].map((k) => (
              <div
                key={k}
                className="h-[112px] animate-pulse rounded-2xl border border-[#F0EEE6] bg-white"
              />
            ))}
          </div>
          <div className="h-28 animate-pulse rounded-3xl bg-[#F5F4ED]" />
        </div>
      </Shell>
    );
  }

  if (isError || !assessment) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center rounded-3xl border border-[#F0EEE6] bg-[#FAF9F5] px-6 py-20 text-center shadow-inner">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_8px_30px_rgba(181,51,51,0.12)] ring-1 ring-red-100">
            <AlertCircle className="h-8 w-8 text-red-500" aria-hidden />
          </div>
          <p className="mt-6 max-w-md font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
            Không tải được {UI_TEXT.QUIZ.toLowerCase()}
          </p>
          <p className="mt-2 font-[Be_Vietnam_Pro] text-[14px] text-[#87867F]">
            Vui lòng thử lại hoặc quay về danh sách.
          </p>
          <button
            type="button"
            onClick={goList}
            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-[#E8E6DC] bg-white px-5 py-3 text-[13px] font-semibold text-[#141413] shadow-sm transition-all hover:bg-[#F5F4ED] active:scale-[0.98] font-[Be_Vietnam_Pro]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Quay lại danh sách
          </button>
        </div>
      </Shell>
    );
  }

  const dueDate = assessment.endDate ? new Date(assessment.endDate) : null;
  const isOverdue = Boolean(dueDate && dueDate < new Date());
  const attemptCount = assessment.attemptNumber || 0;

  return (
    <Shell>
      <DetailHero assessment={assessment} onBack={goList} />

      {/* Bento metrics */}
      <section aria-labelledby="detail-metrics-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2
              id="detail-metrics-heading"
              className="font-[Playfair_Display] text-[20px] font-medium text-[#141413]"
            >
              Thông tin làm bài
            </h2>
            <p className="mt-1 font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
              Thời lượng, điểm số và điều kiện nộp bài
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#E8E6DC] bg-[#FAF9F5] px-3 py-1.5 sm:flex">
            <Sparkles className="h-3.5 w-3.5 text-[#C96442]" aria-hidden />
            <span className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#5E5D59]">
              Math Master
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <StatBentoCard
            icon={FileText}
            iconBg="bg-[#EEF2FF] text-indigo-600"
            label="Số câu"
            className="lg:col-span-2"
          >
            <span className="font-[Playfair_Display] text-[26px] font-medium tabular-nums">
              {assessment.totalQuestions}
            </span>{' '}
            <span className="font-normal text-[#87867F]">câu</span>
          </StatBentoCard>

          {assessment.timeLimitMinutes ? (
            <StatBentoCard
              icon={Clock}
              iconBg="bg-[#FFF7ED] text-amber-700"
              label="Thời gian"
              className="lg:col-span-2"
            >
              <span className="font-[Playfair_Display] text-[26px] font-medium tabular-nums">
                {assessment.timeLimitMinutes}
              </span>{' '}
              <span className="font-normal text-[#87867F]">phút</span>
            </StatBentoCard>
          ) : (
            <StatBentoCard
              icon={Clock}
              iconBg="bg-[#F5F4ED] text-[#87867F]"
              label="Thời gian"
              className="lg:col-span-2"
            >
              <span className="text-[#87867F]">Không giới hạn</span>
            </StatBentoCard>
          )}

          <StatBentoCard
            icon={CheckCircle2}
            iconBg="bg-[#ECFDF5] text-emerald-600"
            label="Tổng điểm"
            className="lg:col-span-2"
          >
            <span className="font-[Playfair_Display] text-[26px] font-medium tabular-nums">
              {assessment.totalPoints}
            </span>
          </StatBentoCard>

          {assessment.passingScore != null ? (
            <StatBentoCard
              icon={CheckCircle2}
              iconBg="bg-emerald-50 text-emerald-700"
              label="Điểm đạt"
              className="lg:col-span-3"
            >
              <span className="font-[Playfair_Display] text-[26px] font-medium text-emerald-800 tabular-nums">
                ≥ {assessment.passingScore}
              </span>{' '}
              <span className="text-[13px] font-medium text-[#87867F]">điểm</span>
            </StatBentoCard>
          ) : null}

          {dueDate ? (
            <StatBentoCard
              icon={Clock}
              iconBg={
                isOverdue ? 'bg-red-50 text-red-600' : 'bg-[#EFF6FF] text-blue-600'
              }
              label="Hạn nộp"
              className={
                assessment.passingScore != null ? 'lg:col-span-3' : 'lg:col-span-6'
              }
            >
              <span className={`block text-[14px] leading-snug ${isOverdue ? 'text-red-600' : ''}`}>
                {dueDate.toLocaleString('vi-VN')}
                {isOverdue ? (
                  <span className="mt-1 block text-[12px] font-semibold uppercase tracking-wide text-red-500">
                    Đã quá hạn
                  </span>
                ) : null}
              </span>
            </StatBentoCard>
          ) : null}

          {assessment.allowMultipleAttempts ? (
            <StatBentoCard
              icon={RefreshCw}
              iconBg="bg-[#F5F3FF] text-violet-600"
              label="Lượt làm"
              className="lg:col-span-6"
            >
              Đã dùng{' '}
              <span className="tabular-nums font-semibold text-[#141413]">{attemptCount}</span>
              {assessment.maxAttempts != null
                ? ` / ${assessment.maxAttempts} lượt tối đa`
                : ' lượt'}
            </StatBentoCard>
          ) : null}
        </div>
      </section>

      {/* Instructions */}
      {assessment.description ? (
        <section
          className="relative overflow-hidden rounded-3xl border border-[#E8E6DC] bg-white shadow-[0_16px_48px_-12px_rgba(20,20,19,0.08)]"
          aria-labelledby="instructions-heading"
        >
          <div
            className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#C96442] to-[#141413]"
            aria-hidden
          />
          <div className="px-6 py-7 sm:px-10 sm:py-9 pl-7 sm:pl-11">
            <h2
              id="instructions-heading"
              className="font-[Playfair_Display] text-[18px] font-medium text-[#141413]"
            >
              Hướng dẫn & lưu ý
            </h2>
            <p className="mt-4 max-w-[65ch] whitespace-pre-wrap font-[Be_Vietnam_Pro] text-[15px] leading-[1.65] text-[#3f3e3a]">
              {assessment.description}
            </p>
          </div>
        </section>
      ) : null}

      {!assessment.canStart && assessment.cannotStartReason ? (
        <div
          role="alert"
          className="flex gap-4 rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-[#fffbeb] px-5 py-5 shadow-[0_12px_40px_-8px_rgba(180,83,9,0.15)] sm:px-6 sm:py-6"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertCircle className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="font-[Playfair_Display] text-[17px] font-medium text-amber-950">
              Hiện chưa thể bắt đầu
            </p>
            <p className="mt-2 font-[Be_Vietnam_Pro] text-[14px] leading-relaxed text-amber-900/85">
              {assessment.cannotStartReason}
            </p>
          </div>
        </div>
      ) : null}

      {/* CTA */}
      <section className="relative overflow-hidden rounded-3xl border border-[#E8E6DC] bg-[#141413] text-[#FAF9F5] shadow-[0_24px_80px_-20px_rgba(20,20,19,0.45)]">
        <div
          className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-[#C96442]/35 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-white/5 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-8 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="max-w-lg">
            <p className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B0AEA5]">
              Sẵn sàng?
            </p>
            <p className="mt-3 font-[Playfair_Display] text-[clamp(1.375rem,3vw,1.75rem)] font-medium leading-tight text-[#FAF9F5]">
              {assessment.canStart
                ? 'Bắt đầu làm bài khi bạn đã đọc kỹ hướng dẫn.'
                : 'Kiểm tra lại điều kiện để được phép làm bài.'}
            </p>
            <ul className="mt-5 space-y-2 font-[Be_Vietnam_Pro] text-[13px] text-[#D4D2CC]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#C96442]" aria-hidden />
                Kết nối mạng ổn định; tránh thoát giữa chừng khi đang làm.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#C96442]" aria-hidden />
                Bạn có thể lưu nháp và tiếp tục nếu giáo viên cho phép.
              </li>
            </ul>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[220px]">
            <button
              type="button"
              disabled={!assessment.canStart}
              onClick={() => navigate(`/student/assessments/${assessmentId}/take`)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#C96442] px-8 py-4 text-[14px] font-semibold text-[#FAF9F5] shadow-[0_12px_36px_-8px_rgba(201,100,66,0.55)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#3f3f3c] disabled:text-[#9c9a94] disabled:shadow-none font-[Be_Vietnam_Pro]"
            >
              <Play className="h-5 w-5 opacity-95" aria-hidden />
              {attemptCount > 0 ? 'Làm lại bài' : 'Bắt đầu làm bài'}
            </button>
            {!assessment.canStart ? (
              <p className="text-center font-[Be_Vietnam_Pro] text-[12px] text-[#9c9a94] sm:text-left">
                Nút sẽ kích hoạt khi đủ điều kiện.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </Shell>
  );
}
