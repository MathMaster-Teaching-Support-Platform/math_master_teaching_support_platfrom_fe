import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  Clock,
  Eye,
  FileText,
  GripVertical,
  ListChecks,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QuestionCard } from '../../components/assessment';
import '../../components/assessment/question-card.css';
import MathText from '../../components/common/MathText';
import Pagination from '../../components/common/Pagination';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { UI_TEXT } from '../../constants/uiText';
import { useToast } from '../../context/ToastContext';
import {
  useAddQuestion,
  useAssessment,
  useAssessmentQuestions,
  useAvailableAssessmentQuestions,
  useDistributeQuestionPoints,
  useGenerateQuestionsForAssessment,
  usePatchAssessment,
  useRemoveQuestion,
  useReorderAssessmentQuestions,
  useSetPointsOverride,
  useUpdateAssessmentQuestionWorkaround,
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

interface SortableQuestionRowProps {
  questionId: string;
  canDrag: boolean;
  children: React.ReactNode;
}

function SortableQuestionRow({ questionId, canDrag, children }: SortableQuestionRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: questionId,
    disabled: !canDrag,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    display: 'flex',
    alignItems: 'stretch',
    gap: 8,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {canDrag && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Kéo để sắp xếp"
          style={{
            cursor: 'grab',
            background: 'transparent',
            border: '1px solid #E8E6DC',
            borderRadius: 6,
            padding: '0 6px',
            color: '#87867F',
            display: 'flex',
            alignItems: 'center',
            touchAction: 'none',
          }}
        >
          <GripVertical size={16} />
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
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
  const patchMutation = usePatchAssessment();
  const addQuestionMutation = useAddQuestion();
  const removeQuestionMutation = useRemoveQuestion();
  const updateAssessmentQuestionMutation = useUpdateAssessmentQuestionWorkaround();
  const reorderQuestionsMutation = useReorderAssessmentQuestions();
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

  // ── Drag-and-drop reorder state ─────────────────────────────────────────
  // Local order is the array of question IDs in the order the user has dragged
  // them into. It's seeded from the server-returned order and reset whenever
  // the server data changes. "Save Order" persists localOrder to the BE.
  const [localOrder, setLocalOrder] = useState<string[]>([]);
  const serverOrder = useMemo(() => questions.map((q) => getQuestionId(q)), [questions]);
  useEffect(() => {
    setLocalOrder(serverOrder);
  }, [serverOrder.join('|')]);

  const orderedQuestions = useMemo(() => {
    if (localOrder.length === 0) return questions;
    const byId = new Map(questions.map((q) => [getQuestionId(q), q]));
    return localOrder.map((qid) => byId.get(qid)).filter((q): q is NonNullable<typeof q> => !!q);
  }, [localOrder, questions]);

  const isOrderDirty =
    localOrder.length === serverOrder.length &&
    localOrder.some((qid, i) => qid !== serverOrder[i]);

  const sortableSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localOrder.indexOf(String(active.id));
    const newIndex = localOrder.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    setLocalOrder((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  async function handleSaveOrder() {
    if (!id || !isOrderDirty) return;
    try {
      await reorderQuestionsMutation.mutateAsync({
        assessmentId: id,
        orders: localOrder.map((qid, idx) => ({ questionId: qid, orderIndex: idx + 1 })),
      });
      showToast({ type: 'success', message: 'Đã lưu thứ tự câu hỏi.' });
      await refetchQuestions();
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể lưu thứ tự câu hỏi.',
      });
    }
  }

  function handleResetOrder() {
    setLocalOrder(serverOrder);
  }

  useEffect(() => {
    if (!assessment) return;
    setAutoTotalPoints(String(assessment.totalPoints ?? 0));
  }, [assessment?.id, assessment?.totalPoints]);

  async function save(payload: AssessmentRequest | Partial<AssessmentRequest>) {
    if (!id) return;
    await patchMutation.mutateAsync({ id, data: payload });
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
      const message = error instanceof Error ? error.message : 'Không thể phân bổ điểm tự động.';
      setQuestionCrudError(message);
      showToast({ type: 'error', message });
    }
  }

  // Reserved for future matrix re-generation feature
  // @ts-ignore - Function reserved for future use
  async function _generateFromMatrix() {
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
          <div className="h-32 rounded-2xl bg-[#FAF9F5] border border-[#F0EEE6] animate-pulse" />
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

    const typeLabel =
      assessmentTypeLabel[assessment.assessmentType] || assessment.assessmentType || '';
    const modeLabel =
      assessmentModeLabel[assessment.assessmentMode || 'DIRECT'] ||
      assessment.assessmentMode ||
      'DIRECT';
    const scoringShort =
      scoringPolicyLabel[assessment.attemptScoringPolicy || 'BEST'] ||
      assessment.attemptScoringPolicy ||
      'BEST';

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

        {/* Page header — same structure as /teacher/mindmaps */}
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
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59] mt-1.5 leading-relaxed m-0">
                {assessment.description?.trim() ? assessment.description : 'Không có mô tả'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {assessment.status === 'DRAFT' && (
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors active:scale-[0.98]"
                onClick={() => setOpenEdit(true)}
              >
                <Pencil size={15} aria-hidden />
                Chỉnh sửa thông tin
              </button>
            )}
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

        {/* Stats — tile grid like /teacher/mindmaps */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(
            [
              {
                label: 'Trạng thái · Loại đề',
                value: assessmentStatusLabel[assessment.status] || assessment.status,
                sub: typeLabel,
                Icon: FileText,
                bg: 'bg-[#FFF7ED]',
                color: 'text-[#E07B39]',
              },
              {
                label: 'Câu hỏi',
                value: assessment.totalQuestions ?? 0,
                sub: `Tổng điểm: ${assessment.totalPoints ?? 0}`,
                Icon: ListChecks,
                bg: 'bg-[#EEF2FF]',
                color: 'text-[#4F7EF7]',
              },
              {
                label: 'Lượt nộp · Chấm điểm',
                value: assessment.submissionCount ?? 0,
                sub: scoringShort,
                Icon: Users,
                bg: 'bg-[#ECFDF5]',
                color: 'text-[#2EAD7A]',
              },
              {
                label: 'Thời gian làm bài',
                value:
                  assessment.timeLimitMinutes != null ? `${assessment.timeLimitMinutes}′` : '∞',
                sub:
                  assessment.timeLimitMinutes != null
                    ? `${assessment.timeLimitMinutes} phút`
                    : 'Không giới hạn',
                Icon: Clock,
                bg: 'bg-[#F5F3FF]',
                color: 'text-[#9B6FE0]',
              },
            ] as const
          ).map(({ label, value, sub, Icon, bg, color }) => (
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
                <p className="font-[Be_Vietnam_Pro] text-[11px] text-[#5E5D59] mt-0.5 truncate">
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        <article className="bg-white rounded-2xl border border-[#E8E6DC] p-4 lg:p-5">
          <h3 className="font-[Playfair_Display] text-[15px] font-medium text-[#141413] m-0 mb-3">
            Thông tin chi tiết
          </h3>
          <dl className="m-0 flex flex-col divide-y divide-[#F0EEE6]">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-3 first:pt-0">
              <dt className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] font-semibold m-0 shrink-0 sm:w-40">
                Bài học
              </dt>
              <dd className="font-[Be_Vietnam_Pro] text-[13px] text-[#141413] font-semibold m-0 sm:flex-1">
                {assessment.lessonTitles?.join(', ') || 'Không có'}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-3">
              <dt className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] font-semibold m-0 shrink-0 sm:w-40">
                Thời gian làm bài
              </dt>
              <dd className="font-[Be_Vietnam_Pro] text-[13px] text-[#141413] font-semibold m-0 sm:flex-1">
                {assessment.timeLimitMinutes != null
                  ? `${assessment.timeLimitMinutes} phút`
                  : 'Không giới hạn'}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-3">
              <dt className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] font-semibold m-0 shrink-0 sm:w-40">
                Chế độ tạo đề
              </dt>
              <dd className="font-[Be_Vietnam_Pro] text-[13px] text-[#141413] font-semibold m-0 sm:flex-1">
                {modeLabel}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-3">
              <dt className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] font-semibold m-0 shrink-0 sm:w-40">
                Ma trận đề
              </dt>
              <dd className="font-[Be_Vietnam_Pro] text-[13px] text-[#141413] font-semibold m-0 sm:flex-1 break-words">
                {assessment.examMatrixName ?? assessment.examMatrixId ?? 'Không có'}
              </dd>
            </div>
          </dl>
        </article>

        <article className="bg-white rounded-2xl border border-[#E8E6DC] overflow-hidden">
          <div className="px-4 py-4 lg:px-6 lg:py-5 border-b border-[#F0EEE6] bg-[#FAF9F5] flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-[Playfair_Display] text-[16px] font-medium text-[#141413] m-0">
              Câu hỏi trong {UI_TEXT.QUIZ.toLowerCase()}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
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
                    type="button"
                    className="btn"
                    onClick={() => void handleDistributePoints()}
                    disabled={questions.length === 0 || distributePointsMutation.isPending}
                  >
                    {distributePointsMutation.isPending
                      ? 'Đang phân bổ...'
                      : 'Phân bổ điểm tự động'}
                  </button>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => void handleDistributePoints()}
                    disabled={questions.length === 0 || distributePointsMutation.isPending}
                  >
                    Reset về auto
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="p-4 lg:p-6 space-y-4">
          {generateError && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 font-[Be_Vietnam_Pro] text-[13px] text-red-700">
              {generateError}
            </div>
          )}
          {questionCrudError && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 font-[Be_Vietnam_Pro] text-[13px] text-red-700">
              {questionCrudError}
            </div>
          )}

          {assessment.status === 'DRAFT' && (
            <details className="add-question-panel">
              <summary className="add-question-panel__summary">
                <span className="add-question-panel__title">
                  <Plus size={14} />
                  Thêm câu hỏi vào bài kiểm tra
                </span>
                <ChevronDown size={16} className="add-question-panel__chevron" aria-hidden="true" />
              </summary>
              <div className="add-question-panel__body">
                <div className="form-grid" style={{ marginBottom: 10 }}>
                  <label>
                    <p className="muted" style={{ marginBottom: 6 }}>
                      Từ khóa
                    </p>
                    <input
                      className="input"
                      placeholder="Tìm theo nội dung câu hỏi..."
                      value={searchKeyword}
                      onChange={(event) => setSearchKeyword(event.target.value)}
                    />
                  </label>
                  <label>
                    <p className="muted" style={{ marginBottom: 6 }}>
                      Thẻ (tag)
                    </p>
                    <input
                      className="input"
                      placeholder="Ví dụ: đại số, hình học..."
                      value={searchTag}
                      onChange={(event) => setSearchTag(event.target.value)}
                    />
                  </label>
                </div>
                <div
                  className="row"
                  style={{ flexWrap: 'wrap', justifyContent: 'start', marginBottom: 8 }}
                >
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
                    {addQuestionMutation.isPending
                      ? 'Đang thêm...'
                      : `Thêm vào bài (${selectedToAdd.size})`}
                  </button>
                  <button className="btn secondary" onClick={() => void refetchSearch()}>
                    <RefreshCw size={14} />
                    Làm mới
                  </button>
                </div>
                {searchLoading && <div className="empty">Đang tìm câu hỏi...</div>}
                {searchError && (
                  <div className="empty" style={{ color: '#b91c1c' }}>
                    Không thể tìm câu hỏi
                  </div>
                )}
                {!searchLoading && !searchError && searchedQuestions.length > 0 && (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th style={{ width: 40 }}>
                            <input
                              type="checkbox"
                              checked={
                                searchedQuestions.length > 0 &&
                                searchedQuestions.every((q) => selectedToAdd.has(q.id))
                              }
                              onChange={(event) =>
                                handleSelectAllSearch(
                                  event.target.checked,
                                  searchedQuestions.map((q) => q.id)
                                )
                              }
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
                                onChange={(event) =>
                                  handleToggleSearchQuestion(event.target.checked, question.id)
                                }
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
            </details>
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
                : `Không thể tải câu hỏi trong ${UI_TEXT.QUIZ.toLowerCase()}.`}
            </div>
          )}

          {!questionsLoading && !questionsError && questions.length === 0 && (
            <div className="question-list__empty">{UI_TEXT.QUIZ} chưa có câu hỏi.</div>
          )}

          {!questionsLoading && !questionsError && orderedQuestions.length > 0 && (
            <>
              {assessment.status === 'DRAFT' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '8px 12px',
                    marginBottom: 8,
                    background: isOrderDirty ? '#FEF3C7' : '#F5F4ED',
                    border: `1px solid ${isOrderDirty ? '#FCD34D' : '#E8E6DC'}`,
                    borderRadius: 8,
                  }}
                >
                  <span style={{ fontSize: 13, color: '#5E5D59' }}>
                    {isOrderDirty
                      ? 'Có thay đổi thứ tự chưa lưu'
                      : 'Kéo biểu tượng ⋮⋮ để sắp xếp lại câu hỏi.'}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {isOrderDirty && (
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={handleResetOrder}
                        disabled={reorderQuestionsMutation.isPending}
                      >
                        Hoàn tác
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => void handleSaveOrder()}
                      disabled={!isOrderDirty || reorderQuestionsMutation.isPending}
                    >
                      <Save size={14} />
                      {reorderQuestionsMutation.isPending ? 'Đang lưu...' : 'Lưu thứ tự'}
                    </button>
                  </div>
                </div>
              )}
              <DndContext
                sensors={sortableSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={localOrder} strategy={verticalListSortingStrategy}>
                  <div className="question-list">
                    {orderedQuestions.map((question, index) => (
                      <SortableQuestionRow
                        key={getQuestionId(question)}
                        questionId={getQuestionId(question)}
                        canDrag={assessment.status === 'DRAFT'}
                      >
                        <QuestionCard
                          question={question}
                          index={index}
                          isDraft={assessment.status === 'DRAFT'}
                          onUpdate={handleUpdateQuestion}
                          onDelete={handleDeleteQuestion}
                          onClearOverride={handleClearOverride}
                          isUpdating={updateAssessmentQuestionMutation.isPending}
                          isDeleting={removeQuestionMutation.isPending}
                          disableOrderEdit
                        />
                      </SortableQuestionRow>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
        <div className="module-layout-container">{renderContent()}</div>
      </div>
    </DashboardLayout>
  );
}
