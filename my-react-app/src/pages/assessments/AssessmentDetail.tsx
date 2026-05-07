import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  ChevronDown,
  Clock,
  Eye,
  ListChecks,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MathText from '../../components/common/MathText';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { UI_TEXT } from '../../constants/uiText';
import {
  useAssessment,
  useAssessmentQuestions,
  useAutoDistributePoints,
  useBatchAddQuestions,
  useBatchUpdatePoints,
  useGenerateQuestionsForAssessment,
  usePatchAssessment,
  useRemoveQuestion,
  useSearchQuestions,
  useUpdateAssessment,
} from '../../hooks/useAssessment';
import '../../styles/module-refactor.css';
import type { AssessmentRequest } from '../../types';
import AssessmentModal from './AssessmentModal';

const assessmentStatusLabel: Record<string, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã công khai',
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

const partLabels: Record<number, string> = {
  1: 'Phần I: Trắc nghiệm nhiều lựa chọn',
  2: 'Phần II: Trắc nghiệm Đúng/Sai',
  3: 'Phần III: Trắc nghiệm trả lời ngắn',
};

const COGNITIVE_LEVELS = [
  { key: 'NHAN_BIET', label: 'Nhận biết' },
  { key: 'THONG_HIEU', label: 'Thông hiểu' },
  { key: 'VAN_DUNG', label: 'Vận dụng' },
  { key: 'VAN_DUNG_CAO', label: 'Vận dụng cao' },
];

function assessmentStatusPillClass(status: string): string {
  switch (status) {
    case 'PUBLISHED':
      return 'inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 font-[Be_Vietnam_Pro] text-[12px] font-semibold text-emerald-800 border border-emerald-200';
    case 'CLOSED':
      return 'inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 font-[Be_Vietnam_Pro] text-[12px] font-semibold text-slate-600 border border-slate-200';
    default:
      return 'inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]';
  }
}

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
  const patchMutation = usePatchAssessment();
  const removeQuestionMutation = useRemoveQuestion();
  const batchAddMutation = useBatchAddQuestions();
  const batchUpdatePointsMutation = useBatchUpdatePoints();
  const autoDistributeMutation = useAutoDistributePoints();
  const generateMutation = useGenerateQuestionsForAssessment();

  const assessment = data?.result;
  const questions = questionsData?.result ?? [];
  const searchResults: Array<{
    questionId: string;
    questionText: string;
    tags?: string[];
    cognitiveLevel?: string;
  }> =
    (
      searchData?.result as unknown as {
        content?: Array<{
          id?: string;
          questionId?: string;
          questionText: string;
          tags?: string[];
          cognitiveLevel?: string;
        }>;
      }
    )?.content?.map((q) => ({
      questionId: q.id ?? q.questionId ?? '',
      questionText: q.questionText,
      tags: q.tags,
      cognitiveLevel: q.cognitiveLevel,
    })) ?? [];

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

  async function save(payload: AssessmentRequest | Partial<AssessmentRequest>) {
    if (!id) return;
    // Edit modal computes a diff and sends a partial payload — that lets the
    // teacher patch a single field (e.g. just timeLimitMinutes) without
    // re-submitting every other setting. Empty diff => modal already closed.
    const isPartial = !('title' in payload) || !('assessmentType' in payload);
    if (isPartial) {
      await patchMutation.mutateAsync({ id, data: payload });
    } else {
      await updateMutation.mutateAsync({ id, data: payload as AssessmentRequest });
    }
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

    // Distribute locally and update pointsDraft
    const newPointsDraft = { ...pointsDraft };

    if (Object.keys(dist).length === 0) {
      // Distribute evenly across all questions
      let totalWeight = 0;
      questions.forEach((q) => {
        totalWeight += q.questionType === 'TRUE_FALSE' ? 4 : 1;
      });
      const pointPerWeight = totalWeight > 0 ? total / totalWeight : 0;

      questions.forEach((q) => {
        const w = q.questionType === 'TRUE_FALSE' ? 4 : 1;
        newPointsDraft[getQuestionId(q)] = (pointPerWeight * w).toFixed(2);
      });
    } else {
      // Distribute proportionally by cognitive level
      const questionsByLevel: Record<string, typeof questions> = {};
      questions.forEach((q) => {
        const level = q.cognitiveLevel || 'UNKNOWN';
        if (!questionsByLevel[level]) questionsByLevel[level] = [];
        questionsByLevel[level].push(q);
      });

      for (const [key, percentage] of Object.entries(dist)) {
        const levelQuestions = questionsByLevel[key] || [];
        let totalWeight = 0;
        levelQuestions.forEach((q) => {
          totalWeight += q.questionType === 'TRUE_FALSE' ? 4 : 1;
        });
        const levelPoints = total * (percentage / 100);
        const pointPerWeight = totalWeight > 0 ? levelPoints / totalWeight : 0;

        levelQuestions.forEach((q) => {
          const w = q.questionType === 'TRUE_FALSE' ? 4 : 1;
          newPointsDraft[getQuestionId(q)] = (pointPerWeight * w).toFixed(2);
        });
      }
    }

    setPointsDraft(newPointsDraft);
    // Note: We intentionally don't call the mutation here so the user can review before saving
    // They must click "Lưu điểm tất cả câu hỏi"
    window.alert(
      'Đã phân điểm tạm thời! Bạn hãy kiểm tra lại bảng điểm và nhấn "Lưu điểm tất cả câu hỏi" để lưu thay đổi.'
    );
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
        <div className="space-y-6" aria-busy="true" aria-label="Đang tải">
          <div className="h-10 w-56 rounded-xl bg-[#FAF9F5] border border-[#F0EEE6] animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[88px] rounded-2xl bg-[#FAF9F5] border border-[#F0EEE6] animate-pulse"
              />
            ))}
          </div>
          <div className="h-40 rounded-2xl bg-[#FAF9F5] border border-[#F0EEE6] animate-pulse" />
          <div className="h-64 rounded-2xl bg-[#FAF9F5] border border-[#F0EEE6] animate-pulse" />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-400">
            <AlertCircle className="w-6 h-6" aria-hidden />
          </div>
          <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] text-center max-w-md m-0">
            {error instanceof Error
              ? error.message
              : `Không thể tải chi tiết ${UI_TEXT.QUIZ.toLowerCase()}`}
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
            onClick={() => void refetch()}
          >
            Thử lại
          </button>
        </div>
      );
    }

    if (!assessment) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF9F5] border border-[#E8E6DC] flex items-center justify-center text-[#87867F]">
            <AlertCircle className="w-6 h-6" aria-hidden />
          </div>
          <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] m-0">
            Không tìm thấy {UI_TEXT.QUIZ.toLowerCase()}.
          </p>
        </div>
      );
    }

    const isDraft = assessment.status === 'DRAFT';
    const isDirect = assessment.assessmentMode !== 'MATRIX_BASED' || !assessment.examMatrixId;

    const typeLabel =
      assessmentTypeLabel[assessment.assessmentType] || assessment.assessmentType || '';
    const modeLabel =
      assessmentModeLabel[assessment.assessmentMode || 'DIRECT'] ||
      assessment.assessmentMode ||
      'DIRECT';

    return (
      <div className="space-y-6">
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
          onClick={() => navigate('/teacher/assessments')}
        >
          <ArrowLeft size={15} aria-hidden />
          Quay lại danh sách
        </button>

        {/* Page header — same structure & title styles as /teacher/mindmaps */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] shrink-0">
              <Sparkles className="w-5 h-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] break-words">
                  {assessment.title}
                </h1>
                <span className={assessmentStatusPillClass(assessment.status)}>
                  {assessmentStatusLabel[assessment.status] || assessment.status}
                </span>
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                {typeLabel} · {modeLabel}
                {assessment.examMatrixName ? ` · Ma trận: ${assessment.examMatrixName}` : ''}
              </p>
              {assessment.description ? (
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59] mt-1.5 leading-relaxed m-0">
                  {assessment.description}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors active:scale-[0.98]"
              onClick={() => setOpenEdit(true)}
            >
              <Pencil size={15} aria-hidden />
              Chỉnh sửa
            </button>
            {id ? (
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C96442] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150"
                onClick={() => navigate(`/teacher/assessments/${id}/preview`)}
              >
                Xem trước
                <Eye className="w-3.5 h-3.5" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        {/* Stats — same tile grid as /teacher/mindmaps */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(
            [
              {
                label: 'Câu hỏi',
                value: assessment.totalQuestions ?? 0,
                Icon: ListChecks,
                bg: 'bg-[#EEF2FF]',
                color: 'text-[#4F7EF7]',
              },
              {
                label: 'Tổng điểm',
                value: assessment.totalPoints ?? 0,
                Icon: Award,
                bg: 'bg-[#FFF7ED]',
                color: 'text-[#E07B39]',
              },
              {
                label: 'Lượt nộp',
                value: assessment.submissionCount ?? 0,
                Icon: Users,
                bg: 'bg-[#ECFDF5]',
                color: 'text-[#2EAD7A]',
              },
              {
                label: 'Thời gian',
                value:
                  assessment.timeLimitMinutes != null ? `${assessment.timeLimitMinutes}′` : '∞',
                Icon: Clock,
                bg: 'bg-[#F5F3FF]',
                color: 'text-[#9B6FE0]',
              },
            ] as const
          ).map(({ label, value, Icon, bg, color }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-[#E8E6DC] p-4 flex items-center gap-3"
            >
              <div
                className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}
              >
                <Icon className={`w-4 h-4 ${color}`} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] leading-none truncate">
                  {value}
                </p>
                <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <article className="bg-white rounded-2xl border border-[#E8E6DC] p-4 flex flex-col gap-3">
            <h3 className="font-[Playfair_Display] text-[15px] font-medium text-[#141413] m-0">
              Thời gian
            </h3>
            <dl className="m-0 flex flex-col divide-y divide-[#F0EEE6]">
              <div className="flex items-baseline justify-between gap-3 py-3 first:pt-0">
                <dt className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] font-semibold m-0">
                  Thời gian làm bài
                </dt>
                <dd className="font-[Be_Vietnam_Pro] text-[13px] text-[#141413] font-semibold m-0 text-right">
                  {assessment.timeLimitMinutes != null
                    ? `${assessment.timeLimitMinutes} phút`
                    : 'Không giới hạn'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-3">
                <dt className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] font-semibold m-0">
                  Số lần làm tối đa
                </dt>
                <dd className="font-[Be_Vietnam_Pro] text-[13px] text-[#141413] font-semibold m-0 text-right">
                  {Boolean(assessment.allowMultipleAttempts) ? (
                    <>
                      {assessment.maxAttempts ?? '∞'} lần
                      <span className="font-medium text-[#87867F] text-[11px]">
                        {' '}
                        · cho phép nhiều lần
                      </span>
                    </>
                  ) : (
                    '1 lần'
                  )}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-3">
                <dt className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] font-semibold m-0">
                  Cách chấm khi nhiều lần
                </dt>
                <dd className="font-[Be_Vietnam_Pro] text-[13px] text-[#141413] font-semibold m-0 text-right">
                  {scoringPolicyLabel[assessment.attemptScoringPolicy || 'BEST'] ||
                    assessment.attemptScoringPolicy ||
                    'BEST'}
                </dd>
              </div>
            </dl>
          </article>

          <article className="bg-white rounded-2xl border border-[#E8E6DC] p-4 flex flex-col gap-3">
            <h3 className="font-[Playfair_Display] text-[15px] font-medium text-[#141413] m-0">
              Hiển thị cho học sinh
            </h3>
            <dl className="m-0 flex flex-col divide-y divide-[#F0EEE6]">
              <div className="flex items-baseline justify-between gap-3 py-3 first:pt-0">
                <dt className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] font-semibold m-0">
                  Trộn câu hỏi
                </dt>
                <dd className="font-[Be_Vietnam_Pro] text-[13px] text-[#141413] font-semibold m-0">
                  {assessment.randomizeQuestions ? 'Có' : 'Không'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-3">
                <dt className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] font-semibold m-0">
                  Hiện đáp án sau khi nộp
                </dt>
                <dd className="font-[Be_Vietnam_Pro] text-[13px] text-[#141413] font-semibold m-0">
                  {assessment.showCorrectAnswers ? 'Có' : 'Không'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-3">
                <dt className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] font-semibold m-0">
                  Hiện điểm ngay sau khi nộp
                </dt>
                <dd className="font-[Be_Vietnam_Pro] text-[13px] text-[#141413] font-semibold m-0">
                  {assessment.showScoreImmediately ? 'Có' : 'Không'}
                </dd>
              </div>
            </dl>
          </article>

          <article className="bg-white rounded-2xl border border-[#E8E6DC] p-4 flex flex-col gap-3 md:col-span-2 xl:col-span-1">
            <h3 className="font-[Playfair_Display] text-[15px] font-medium text-[#141413] m-0">
              Trạng thái & ma trận
            </h3>
            <dl className="m-0 flex flex-col divide-y divide-[#F0EEE6]">
              <div className="flex items-baseline justify-between gap-3 py-3 first:pt-0">
                <dt className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] font-semibold m-0">
                  Trạng thái
                </dt>
                <dd className="m-0">
                  <span className={assessmentStatusPillClass(assessment.status)}>
                    {assessmentStatusLabel[assessment.status] || assessment.status}
                  </span>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-3">
                <dt className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] font-semibold m-0">
                  Chế độ tạo đề
                </dt>
                <dd className="font-[Be_Vietnam_Pro] text-[13px] text-[#141413] font-semibold m-0 text-right">
                  {assessmentModeLabel[assessment.assessmentMode || 'DIRECT'] ||
                    assessment.assessmentMode ||
                    'DIRECT'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-3">
                <dt className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] font-semibold m-0">
                  Ma trận đề
                </dt>
                <dd className="font-[Be_Vietnam_Pro] text-[13px] text-[#141413] font-semibold m-0 text-right break-words max-w-[55%]">
                  {assessment.examMatrixName ?? assessment.examMatrixId ?? 'Không liên kết'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-3">
                <dt className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] font-semibold m-0 shrink-0">
                  Bài học liên quan
                </dt>
                <dd className="font-[Be_Vietnam_Pro] text-[13px] text-[#141413] font-semibold m-0 text-right">
                  {assessment.lessonTitles && assessment.lessonTitles.length > 0
                    ? assessment.lessonTitles.join(', ')
                    : 'Không có'}
                </dd>
              </div>
            </dl>
          </article>
        </div>

        {/* ── Question management ── */}
        <article className="bg-white rounded-2xl border border-[#E8E6DC] overflow-hidden">
          <div className="px-4 py-4 lg:px-6 lg:py-5 border-b border-[#F0EEE6] bg-[#FAF9F5] flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-[Playfair_Display] text-[16px] font-medium text-[#141413] m-0">
              Câu hỏi trong {UI_TEXT.QUIZ.toLowerCase()}
            </h3>
            <div className="flex flex-wrap gap-2">
              {isDraft &&
                assessment.assessmentMode === 'MATRIX_BASED' &&
                assessment.examMatrixId && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150"
                    onClick={() => void generateFromMatrix()}
                    disabled={generateMutation.isPending}
                  >
                    {generateMutation.isPending ? 'Đang generate...' : 'Generate from Matrix'}
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  </button>
                )}
            </div>
          </div>

          <div className="p-4 lg:p-6 space-y-4">
          {generateError && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 font-[Be_Vietnam_Pro] text-[13px] text-red-700">
              {generateError}
            </div>
          )}
          {crudError && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 font-[Be_Vietnam_Pro] text-[13px] text-red-700">
              {crudError}
            </div>
          )}

          {/* ── Search & add questions (only for DIRECT assessments in DRAFT) ── */}
          {isDraft && isDirect && (
            <details className="add-question-panel">
              <summary className="add-question-panel__summary">
                <span className="add-question-panel__title">
                  <Plus size={14} />
                  Thêm câu hỏi vào bài kiểm tra
                </span>
                <ChevronDown size={16} className="add-question-panel__chevron" aria-hidden="true" />
              </summary>
              <div className="add-question-panel__body">
                <div
                  className="row"
                  style={{ flexWrap: 'wrap', justifyContent: 'start', marginBottom: 8 }}
                >
                  <div
                    className="row"
                    style={{ alignItems: 'center', gap: 6, flex: 1, minWidth: 280 }}
                  >
                    <Search size={14} style={{ color: '#64748b' }} aria-hidden="true" />
                    <input
                      className="input"
                      style={{ flex: 1 }}
                      placeholder="Nhập từ khóa (ít nhất 2 ký tự)..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                  </div>
                  {searchFetching && <span className="muted">Đang tìm...</span>}
                </div>

                {searchResults.length > 0 && (
                  <div
                    style={{
                      maxHeight: 260,
                      overflowY: 'auto',
                      border: '1px solid #e5e7eb',
                      borderRadius: 6,
                    }}
                  >
                    {searchResults.map((q) => {
                      const alreadyAdded = questions.some(
                        (aq) => getQuestionId(aq) === q.questionId
                      );
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
                            <div
                              style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}
                            >
                              {q.cognitiveLevel && (
                                <span className="badge draft" style={{ fontSize: 11 }}>
                                  {q.cognitiveLevel}
                                </span>
                              )}
                              {q.tags?.map((t) => (
                                <span key={t} className="badge published" style={{ fontSize: 11 }}>
                                  {t}
                                </span>
                              ))}
                              {alreadyAdded && (
                                <span className="muted" style={{ fontSize: 11 }}>
                                  Đã có trong đề
                                </span>
                              )}
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
                      {batchAddMutation.isPending
                        ? 'Đang thêm...'
                        : `Thêm ${selectedIds.size} câu hỏi đã chọn`}
                    </button>
                  </div>
                )}
              </div>
            </details>
          )}

          {questionsLoading && <div className="empty">Đang tải danh sách câu hỏi...</div>}
          {questionsError && (
            <div className="empty">
              {questionsErrorValue instanceof Error
                ? questionsErrorValue.message
                : 'Không thể tải câu hỏi.'}
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
                    {(() => {
                      const grouped: Record<number, typeof questions> = {};
                      questions.forEach((q) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        let part = (q as any).partNumber;
                        if (part === undefined) {
                          if (q.questionType === 'TRUE_FALSE') part = 2;
                          else if (q.questionType === 'SHORT_ANSWER') part = 3;
                          else part = 1;
                        }
                        if (!grouped[part]) grouped[part] = [];
                        grouped[part].push(q);
                      });

                      return Object.keys(grouped)
                        .sort()
                        .map((partKey) => {
                          const partNum = Number(partKey);
                          const partQuestions = grouped[partNum];
                          return (
                            <Fragment key={partNum}>
                              <tr className="bg-[#FAF9F5] border-t border-[#E8E6DC]">
                                <td
                                  colSpan={isDraft ? 6 : 5}
                                  className="font-[Be_Vietnam_Pro] font-semibold text-[#5E5D59] py-2.5 px-3 text-[13px]"
                                >
                                  {partLabels[partNum] || `Phần ${partNum}`} ({partQuestions.length}{' '}
                                  câu)
                                </td>
                              </tr>
                              {partQuestions.map((question) => {
                                const questionId = getQuestionId(question);
                                return (
                                  <tr key={questionId}>
                                    <td>{question.orderIndex}</td>
                                    <td>
                                      <MathText text={question.questionText} />
                                      <div
                                        className="row"
                                        style={{
                                          justifyContent: 'start',
                                          flexWrap: 'wrap',
                                          marginTop: 4,
                                        }}
                                      >
                                        {question.tags?.map((t) => (
                                          <span
                                            key={t}
                                            className="badge published"
                                            style={{ fontSize: 11 }}
                                          >
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td>
                                      <span
                                        className={`badge ${question.questionType === 'TRUE_FALSE' ? 'published' : 'draft'}`}
                                      >
                                        {question.questionType === 'TRUE_FALSE'
                                          ? 'TF'
                                          : question.questionType === 'SHORT_ANSWER'
                                            ? 'TL'
                                            : 'TN'}
                                      </span>
                                    </td>
                                    <td>
                                      {question.cognitiveLevel ? (
                                        <span className="badge draft">
                                          {question.cognitiveLevel}
                                        </span>
                                      ) : (
                                        <span className="muted">—</span>
                                      )}
                                    </td>
                                    <td>
                                      {/* Per-question points stay editable in every status — the
                                          BE accepts updates regardless of DRAFT/PUBLISHED so
                                          teachers can rebalance scoring after the fact without
                                          cloning the assessment. */}
                                      <div>
                                        <input
                                          className="input"
                                          type="number"
                                          min={0}
                                          step={0.25}
                                          value={
                                            pointsDraft[questionId] ?? String(question.points ?? '')
                                          }
                                          onChange={(e) =>
                                            setPointsDraft((prev) => ({
                                              ...prev,
                                              [questionId]: e.target.value,
                                            }))
                                          }
                                          placeholder="Điểm"
                                        />
                                        {question.questionType === 'TRUE_FALSE' &&
                                          (pointsDraft[questionId] || question.points) && (
                                            <div
                                              style={{
                                                fontSize: 11,
                                                color: '#6b7280',
                                                marginTop: 4,
                                              }}
                                            >
                                              {(() => {
                                                const totalPoints = parseFloat(
                                                  pointsDraft[questionId] ||
                                                    String(question.points || 0)
                                                );
                                                const pointPerClause = (totalPoints / 4).toFixed(3);
                                                return (
                                                  <div
                                                    style={{
                                                      display: 'flex',
                                                      flexDirection: 'column',
                                                      gap: 2,
                                                    }}
                                                  >
                                                    <span>
                                                      📋 Mỗi mệnh đề: {pointPerClause} điểm
                                                    </span>
                                                  </div>
                                                );
                                              })()}
                                            </div>
                                          )}
                                      </div>
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
                            </Fragment>
                          );
                        });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* ── Batch actions ──
                  Points editing is unrestricted — drop the DRAFT-only gate so
                  teachers can rebalance scoring after publishing too. */}
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Batch save points */}
                <div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150"
                    onClick={() => void handleBatchUpdatePoints()}
                    disabled={batchUpdatePointsMutation.isPending}
                  >
                    {batchUpdatePointsMutation.isPending
                      ? 'Đang lưu...'
                      : 'Lưu điểm tất cả câu hỏi'}
                  </button>
                </div>

                {/* Auto distribute */}
                <div className="rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] p-4">
                  <p className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#5E5D59] m-0 mb-2">
                    Tự động phân điểm theo mức độ nhận thức
                  </p>
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] m-0 mb-3 leading-relaxed">
                    💡 Câu hỏi Đúng/Sai (TF): mỗi mệnh đề đúng = tổng điểm câu ÷ số mệnh đề.
                    Tổng điểm = số mệnh đề đúng × điểm/mệnh đề.
                  </p>
                  <div
                    className="row"
                    style={{ flexWrap: 'wrap', justifyContent: 'start', gap: 8 }}
                  >
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
                    type="button"
                    className="btn secondary mt-3"
                    onClick={() => void handleAutoDistribute()}
                    disabled={autoDistributeMutation.isPending}
                  >
                    {autoDistributeMutation.isPending
                      ? 'Đang phân điểm...'
                      : 'Áp dụng phân điểm tự động'}
                  </button>
                </div>
              </div>
            </>
          )}
          </div>
        </article>

        <AssessmentModal
          isOpen={openEdit}
          mode="edit"
          initialData={assessment}
          onClose={() => setOpenEdit(false)}
          onSubmit={save}
        />
      </div>
    );
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        {/* No module-page here — matches /teacher/mindmaps full-width content; avoids extra side inset + max-width */}
        <div className="module-layout-container">{renderContent()}</div>
      </div>
    </DashboardLayout>
  );
}
