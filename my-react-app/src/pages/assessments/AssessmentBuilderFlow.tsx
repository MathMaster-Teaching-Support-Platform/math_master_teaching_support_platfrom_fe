import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  LayoutTemplate,
  Library,
  TableProperties,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BankCoverageTree } from '../../components/assessments/BankCoverageTree';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { UI_TEXT } from '../../constants/uiText';
import {
  useAssessment,
  useAssessmentQuestions,
  useGenerateAssessmentFromMatrix,
  usePublishAssessment,
  usePublishSummary,
} from '../../hooks/useAssessment';
import { useGetMyExamMatrices } from '../../hooks/useExamMatrix';
import { useGetMyQuestionBanks } from '../../hooks/useQuestionBank';
import { AssessmentService } from '../../services/api/assessment.service';
import '../../styles/module-refactor.css';
import type { BankCoverageCell } from '../../types/assessment.types';
import { MatrixStatus } from '../../types/examMatrix';
import '../courses/TeacherCourses.css';
import './assessment-builder-flow.css';

type ToastState = {
  type: 'success' | 'error';
  message: string;
};

const COG_FULL_LABEL: Record<string, string> = {
  NHAN_BIET: 'Nhận biết',
  THONG_HIEU: 'Thông hiểu',
  VAN_DUNG: 'Vận dụng',
  VAN_DUNG_CAO: 'Vận dụng cao',
  TRUE_FALSE_CLAUSES: 'Đúng/Sai (theo mệnh đề)',
};

export function AssessmentBuilderFlowBody() {
  const navigate = useNavigate();
  const [selectedMatrixId, setSelectedMatrixId] = useState('');
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [generatedAssessmentId, setGeneratedAssessmentId] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);

  // Pre-flight coverage state — updated whenever (matrix, banks) changes.
  const [gaps, setGaps] = useState<BankCoverageCell[]>([]);
  const [coverageOk, setCoverageOk] = useState(false);
  const [validating, setValidating] = useState(false);
  const [coverageError, setCoverageError] = useState<string | null>(null);

  const matrixQuery = useGetMyExamMatrices();
  const banksQuery = useGetMyQuestionBanks(0, 100);
  const generateMutation = useGenerateAssessmentFromMatrix();
  const publishMutation = usePublishAssessment();

  const matrices = useMemo(() => matrixQuery.data?.result ?? [], [matrixQuery.data]);
  const readyMatrices = useMemo(
    () =>
      matrices.filter(
        (item) => item.status === MatrixStatus.APPROVED || item.status === MatrixStatus.LOCKED
      ),
    [matrices]
  );

  const banks = useMemo(() => banksQuery.data?.result?.content ?? [], [banksQuery.data]);

  const selectedMatrix = useMemo(
    () => readyMatrices.find((m) => m.id === selectedMatrixId) ?? null,
    [readyMatrices, selectedMatrixId]
  );

  const selectedBanks = useMemo(
    () => banks.filter((b) => selectedBankIds.includes(b.id)),
    [banks, selectedBankIds]
  );

  // Pre-fill the matrix's stored default bank as a starter; teacher can add
  // more, remove, or replace via the picker.
  useEffect(() => {
    if (!selectedMatrix) return;
    if (selectedBankIds.length > 0) return;
    if (selectedMatrix.questionBankId) {
      setSelectedBankIds([selectedMatrix.questionBankId]);
    }
  }, [selectedMatrix, selectedBankIds.length]);

  // Run coverage validation whenever (matrix, bank set) changes.
  useEffect(() => {
    if (!selectedMatrixId || selectedBankIds.length === 0) {
      setGaps([]);
      setCoverageOk(false);
      setCoverageError(null);
      return;
    }
    let cancelled = false;
    setValidating(true);
    setCoverageError(null);
    AssessmentService.validateBankCoverage({
      examMatrixId: selectedMatrixId,
      questionBankIds: selectedBankIds,
    })
      .then((res) => {
        if (cancelled) return;
        const result = res.result;
        setGaps(result?.cells ?? []);
        setCoverageOk(result?.ok ?? false);
      })
      .catch((err) => {
        if (cancelled) return;
        setGaps([]);
        setCoverageOk(false);
        setCoverageError(err instanceof Error ? err.message : 'Không thể kiểm tra coverage.');
      })
      .finally(() => {
        if (!cancelled) setValidating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMatrixId, selectedBankIds]);

  const assessmentQuery = useAssessment(generatedAssessmentId, {
    enabled: !!generatedAssessmentId,
  });
  const questionsQuery = useAssessmentQuestions(generatedAssessmentId, {
    enabled: !!generatedAssessmentId,
  });
  const summaryQuery = usePublishSummary(generatedAssessmentId, {
    enabled: !!generatedAssessmentId,
  });

  const generatedAssessment = assessmentQuery.data?.result;
  const generatedQuestions = questionsQuery.data?.result ?? [];
  const publishSummary = summaryQuery.data?.result;
  let publishButtonLabel = 'Công khai đề';
  if (publishMutation.isPending) publishButtonLabel = 'Đang công khai...';
  else if (generatedAssessment?.status === 'PUBLISHED') publishButtonLabel = 'Đã công khai';

  const shortageCells = useMemo(() => gaps.filter((g) => g.available < g.required), [gaps]);

  const canGenerate =
    !!selectedMatrixId &&
    selectedBankIds.length > 0 &&
    coverageOk &&
    !generateMutation.isPending &&
    !validating;

  function toggleBank(id: string) {
    setSelectedBankIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  }

  function removeBank(id: string) {
    setSelectedBankIds((prev) => prev.filter((b) => b !== id));
  }

  async function handleGenerate() {
    if (!canGenerate) {
      if (selectedBankIds.length === 0) {
        setToast({
          type: 'error',
          message: 'Vui lòng chọn ít nhất một ngân hàng câu hỏi.',
        });
      } else if (!coverageOk) {
        setToast({
          type: 'error',
          message:
            'Ngân hàng chưa đủ câu cho ma trận. Hãy bổ sung câu hỏi hoặc chọn thêm ngân hàng.',
        });
      }
      return;
    }

    try {
      const response = await generateMutation.mutateAsync({
        examMatrixId: selectedMatrixId,
        questionBankIds: selectedBankIds,
        selectionStrategy: 'BANK_FIRST',
        reuseApprovedQuestions: true,
      });
      const createdId = response.result.id;
      setGeneratedAssessmentId(createdId);
      setToast({
        type: 'success',
        message: 'Đã tạo đề nháp thành công. Tiếp tục bước rà soát cuối và công khai.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo đề nháp.';
      const normalized = message.toUpperCase();
      let friendly = message;
      if (
        normalized.includes('INSUFFICIENT_QUESTIONS_AVAILABLE') ||
        normalized.includes('INSUFFICIENT QUESTIONS')
      ) {
        friendly =
          'Không đủ câu hỏi trong ngân hàng đã chọn theo cấu trúc đề. Hãy thử ngân hàng khác hoặc bổ sung câu hỏi.';
      } else if (normalized.includes('QUESTION_BANK_REQUIRED')) {
        friendly = 'Vui lòng chọn ngân hàng câu hỏi để sinh đề.';
      }
      setToast({ type: 'error', message: friendly });
    }
  }

  async function handlePublish() {
    if (!generatedAssessmentId || publishMutation.isPending) return;

    try {
      await publishMutation.mutateAsync(generatedAssessmentId);
      setToast({ type: 'success', message: 'Đã công khai đề thành công.' });
      void assessmentQuery.refetch();
      void summaryQuery.refetch();
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể công khai đề.',
      });
    }
  }

  const quickLinks = [
    {
      path: '/teacher/exam-matrices',
      title: 'Ma trận đề',
      subtitle: 'Khung chương · mức độ · số câu',
      Icon: TableProperties,
      iconClass:
        'bg-[#E8E6DC] text-[#5E5D59] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-[#D1CFC5]/70',
    },
    {
      path: '/teacher/question-templates',
      title: 'Mẫu câu hỏi',
      subtitle: 'Định dạng & ma trận nhận thức',
      Icon: LayoutTemplate,
      iconClass:
        'bg-gradient-to-br from-amber-100 to-orange-50 text-amber-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-amber-200/70',
    },
    {
      path: '/teacher/question-banks',
      title: 'Ngân hàng câu hỏi',
      subtitle: 'Pool câu để ghép với ma trận',
      Icon: Library,
      iconClass:
        'bg-gradient-to-br from-teal-100 to-emerald-50 text-teal-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-teal-200/70',
    },
  ] as const;

  const pipelineSteps = [
    {
      n: 1,
      title: 'Mẫu câu hỏi',
      hint: 'Chuẩn hoá kiểu câu trước khi nhập ngân hàng',
      path: '/teacher/question-templates',
      tint: 'btn--tint-violet',
    },
    {
      n: 2,
      title: 'Ngân hàng câu hỏi',
      hint: 'Tập câu đủ lớn để random theo ma trận',
      path: '/teacher/question-banks',
      tint: 'btn--tint-emerald',
    },
    {
      n: 3,
      title: 'Ma trận đề',
      hint: 'Định nghĩa phân bổ theo chương & COGNITIVE',
      path: '/teacher/exam-matrices',
      tint: 'btn--tint-indigo',
    },
  ] as const;

  return (
    <>
      <nav
        className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3"
        aria-label="Liên kết nhanh chuẩn bị dữ liệu"
      >
        {quickLinks.map(({ path, title, subtitle, Icon, iconClass }) => (
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            className="group flex w-full items-center gap-4 rounded-2xl border border-[#E8E6DC] bg-[#FAF9F5] p-4 text-left shadow-[rgba(0,0,0,0.03)_0px_2px_12px] transition-all duration-200 hover:border-[#D1CFC5] hover:bg-white hover:shadow-[0px_8px_28px_rgba(0,0,0,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C96442]/35 focus-visible:ring-offset-2"
          >
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-[1.04] ${iconClass}`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413]">
                {title}
              </span>
              <span className="mt-0.5 block font-[Be_Vietnam_Pro] text-[12px] leading-snug text-[#87867F]">
                {subtitle}
              </span>
            </span>
            <ChevronRight
              className="h-5 w-5 shrink-0 text-[#B0AEA5] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#5E5D59]"
              strokeWidth={2}
              aria-hidden
            />
          </button>
        ))}
      </nav>

      <section className="mb-6 rounded-2xl border border-[#E8E6DC] bg-[#FAF9F5] p-5 shadow-[rgba(0,0,0,0.04)_0px_4px_24px] sm:p-6">
        <div className="border-b border-[#F0EEE6] pb-4">
          <p className="font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#87867F]">
            Luồng chuẩn
          </p>
          <h3 className="mt-1 font-[Playfair_Display] text-[19px] font-medium leading-snug text-[#141413]">
            Quy trình tạo đề 4 bước
          </h3>
          <p className="mt-2 max-w-[62ch] font-[Be_Vietnam_Pro] text-[13px] leading-relaxed text-[#87867F]">
            Làm lần lượt để dữ liệu khớp ma trận — tránh thiếu câu hoặc sai cấu trúc khi sinh đề.
          </p>
        </div>
        <ol className="m-0 mt-4 list-none space-y-3 p-0">
          {pipelineSteps.map((step) => (
            <li
              key={step.n}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-[#F0EEE6] bg-white p-3.5 shadow-sm sm:flex-nowrap sm:gap-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#E8E6DC] bg-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-bold text-[#5E5D59]">
                {step.n}
              </span>
              <div className="min-w-0 flex-1">
                <strong className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413]">
                  {step.title}
                </strong>
                <p className="mt-0.5 font-[Be_Vietnam_Pro] text-[12px] leading-snug text-[#87867F]">
                  {step.hint}
                </p>
              </div>
              <button
                type="button"
                className={`btn secondary inline-flex shrink-0 items-center gap-1 ${step.tint}`}
                onClick={() => navigate(step.path)}
              >
                Mở
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              </button>
            </li>
          ))}
          <li className="flex flex-wrap items-center gap-3 rounded-xl border border-[#C96442]/30 bg-gradient-to-br from-[#fffdfb] to-[#FAF9F5] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-[#C96442]/15 sm:flex-nowrap sm:gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#141413] font-[Be_Vietnam_Pro] text-[13px] font-bold text-[#FAF9F5] shadow-sm">
              4
            </span>
            <div className="min-w-0 flex-1">
              <strong className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413]">
                {UI_TEXT.QUIZ}
              </strong>
              <p className="mt-0.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                Ghép ma trận + ngân hàng và sinh đề nháp ngay bên dưới.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full bg-[#E8E6DC] px-3 py-1 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#5E5D59]">
              Bạn đang ở đây
            </span>
          </li>
        </ol>
      </section>

      <section className="assessment-builder-flow__orchestration-grid">
        <article className="data-card abf-orchestration-card-modern">
          <div className="mb-4 border-b border-[#F0EEE6] pb-4">
            <span className="inline-flex items-center rounded-full bg-[#E8E6DC] px-2.5 py-0.5 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#5E5D59]">
              Bước 1
            </span>
            <h3 className="mt-2 font-[Playfair_Display] text-[17px] font-medium leading-snug text-[#141413]">
              Tạo đề thi từ ma trận + ngân hàng
            </h3>
            <p className="mt-2 font-[Be_Vietnam_Pro] text-[13px] leading-relaxed text-[#87867F]">
              Ma trận quyết định cấu trúc (chương, mức độ, số câu). Chọn một hoặc nhiều ngân hàng để hệ
              thống random câu từ pool gộp theo tiêu chí ma trận.
            </p>
          </div>

          <label className="abf-field">
            <span className="abf-field__label">Ma trận đề</span>
            <select
              className="select"
              value={selectedMatrixId}
              onChange={(event) => {
                setSelectedMatrixId(event.target.value);
                setSelectedBankIds([]);
                setGaps([]);
                setCoverageOk(false);
              }}
              disabled={matrixQuery.isLoading}
            >
              <option value="">— Chọn ma trận —</option>
              {readyMatrices.map((matrix) => (
                <option key={matrix.id} value={matrix.id}>
                  {matrix.name}
                  {matrix.gradeLevel ? ` (Lớp ${matrix.gradeLevel})` : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="abf-field">
            <span className="abf-field__label">
              Ngân hàng câu hỏi ({selectedBankIds.length} đã chọn)
            </span>

            {selectedBanks.length > 0 && (
              <div className="abf-bank-chips">
                {selectedBanks.map((b) => (
                  <span key={b.id} className="abf-bank-chip">
                    {b.name}
                    <button
                      type="button"
                      onClick={() => removeBank(b.id)}
                      aria-label={`Bỏ ${b.name}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="abf-bank-picker" role="listbox" aria-multiselectable>
              {banksQuery.isLoading && (
                <p className="muted" style={{ margin: '0.4rem 0' }}>
                  Đang tải ngân hàng…
                </p>
              )}
              {!banksQuery.isLoading && banks.length === 0 && (
                <p className="muted" style={{ margin: '0.4rem 0' }}>
                  Bạn chưa có ngân hàng nào.
                </p>
              )}
              {!banksQuery.isLoading &&
                banks.map((bank) => {
                  const checked = selectedBankIds.includes(bank.id);
                  return (
                    <label
                      key={bank.id}
                      className={`abf-bank-option ${checked ? 'abf-bank-option--checked' : ''}`}
                      role="option"
                      aria-selected={checked}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleBank(bank.id)}
                        disabled={!selectedMatrixId}
                      />
                      <span className="abf-bank-option__main">
                        <span className="abf-bank-option__title">{bank.name}</span>
                        <span className="abf-bank-option__meta">
                          {bank.schoolGradeName ?? 'Chưa gắn lớp'}
                          {bank.subjectName ? ` · ${bank.subjectName}` : ''}
                          {' · '}
                          {bank.questionCount ?? 0} câu
                        </span>
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>

          {selectedMatrixId && selectedBankIds.length > 0 && (
            <div className="abf-coverage">
              <div className="abf-coverage__head">
                <strong>Cấu trúc bank đã chọn</strong>
                {validating && <span className="muted">Đang kiểm tra coverage…</span>}
                {!validating && coverageOk && (
                  <span className="abf-coverage__ok">
                    <CheckCircle2 size={14} /> Đủ câu cho ma trận
                  </span>
                )}
                {!validating && !coverageOk && shortageCells.length > 0 && (
                  <span className="abf-coverage__warn">
                    <AlertTriangle size={14} /> Thiếu {shortageCells.length} ô
                  </span>
                )}
              </div>

              {coverageError && (
                <p className="empty" style={{ marginTop: 8 }}>
                  {coverageError}
                </p>
              )}

              {!coverageError && shortageCells.length > 0 && (
                <ul className="abf-gap-list">
                  {shortageCells.map((cell, idx) => (
                    <li key={idx} className="abf-gap-item">
                      <AlertTriangle size={13} />
                      <span>
                        Bank thiếu <strong>{cell.chapterTitle ?? 'Chương ?'}</strong>
                        {' – '}
                        <strong>
                          {COG_FULL_LABEL[cell.cognitiveLevel ?? ''] ?? cell.cognitiveLevel}
                        </strong>
                        : cần {cell.required} câu, hiện có {cell.available}.
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <BankCoverageTree banks={selectedBanks} gaps={gaps} />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#F0EEE6] pt-4">
            <button
              type="button"
              className="btn btn--feat-indigo inline-flex items-center gap-2"
              onClick={() => void handleGenerate()}
              disabled={!canGenerate}
            >
              {generateMutation.isPending ? 'Đang tạo…' : 'Tạo đề thi từ ma trận đã chọn'}
            </button>
            <button
              type="button"
              className="btn secondary btn--tint-indigo inline-flex items-center gap-1.5"
              onClick={() => navigate('/teacher/exam-matrices')}
            >
              Quản lý ma trận
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </button>
          </div>

          {matrixQuery.isError && (
            <p className="empty">
              {matrixQuery.error instanceof Error
                ? matrixQuery.error.message
                : 'Không thể tải danh sách ma trận.'}
            </p>
          )}
          {banksQuery.isError && (
            <p className="empty">
              {banksQuery.error instanceof Error
                ? banksQuery.error.message
                : 'Không thể tải danh sách ngân hàng.'}
            </p>
          )}
        </article>

        <article className="data-card abf-orchestration-card-modern">
          <div className="mb-4 border-b border-[#F0EEE6] pb-4">
            <span className="inline-flex items-center rounded-full bg-[#E8E6DC] px-2.5 py-0.5 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#5E5D59]">
              Bước 2
            </span>
            <h3 className="mt-2 font-[Playfair_Display] text-[17px] font-medium leading-snug text-[#141413]">
              Rà soát cuối và công khai
            </h3>
            <p className="mt-2 font-[Be_Vietnam_Pro] text-[13px] leading-relaxed text-[#87867F]">
              Sau khi sinh đề nháp, kiểm tra số câu và điều kiện công khai trước khi học sinh làm bài.
            </p>
          </div>
          {!generatedAssessmentId && (
            <div className="rounded-xl border border-dashed border-[#E8E6DC] bg-[#FAF9F5]/80 px-4 py-8 text-center">
              <p className="m-0 font-[Be_Vietnam_Pro] text-[13px] leading-relaxed text-[#87867F]">
                Hoàn tất <strong className="text-[#141413]">Bước 1</strong> để mở khối rà soát và công khai.
              </p>
            </div>
          )}

          {generatedAssessmentId && (
            <>
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#F0EEE6] bg-[#FAF9F5] px-3 py-2.5">
                <span
                  className={`badge ${generatedAssessment?.status === 'PUBLISHED' ? 'published' : 'draft'}`}
                >
                  {generatedAssessment?.status || 'DRAFT'}
                </span>
                <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                  Mã đề:{' '}
                  <code className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] text-[#141413] ring-1 ring-[#E8E6DC]">
                    {generatedAssessmentId}
                  </code>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 rounded-xl border border-[#E8E6DC] bg-white p-4 shadow-[rgba(0,0,0,0.03)_0px_2px_10px]">
                  <p className="m-0 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
                    Tổng câu
                  </p>
                  <p className="m-0 font-[Playfair_Display] text-[26px] font-medium leading-none text-[#141413]">
                    {generatedQuestions.length}
                  </p>
                </div>
                <div className="flex flex-col gap-1 rounded-xl border border-[#E8E6DC] bg-white p-4 shadow-[rgba(0,0,0,0.03)_0px_2px_10px]">
                  <p className="m-0 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
                    Tổng điểm
                  </p>
                  <p className="m-0 font-[Playfair_Display] text-[26px] font-medium leading-none text-[#141413]">
                    {generatedAssessment?.totalPoints ?? 0}
                  </p>
                </div>
              </div>

              {generatedAssessment?.generationSummary && (
                <div className="data-card abf-nested-card min-h-0 rounded-xl border-[#E8E6DC]">
                  <h3>Tạo đề thi từ ma trận đã chọn</h3>
                  <p className="muted">
                    totalQuestionsGenerated:{' '}
                    {generatedAssessment.generationSummary.totalQuestionsGenerated ?? 0}
                  </p>
                  {(generatedAssessment.generationSummary.warnings || []).length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {(generatedAssessment.generationSummary.warnings || []).map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {generatedAssessment?.lessons && generatedAssessment.lessons.length > 0 && (
                <div className="data-card abf-nested-card min-h-0 rounded-xl border-[#E8E6DC]">
                  <h3>Phạm vi bài học</h3>
                  <p className="muted" style={{ marginBottom: 12 }}>
                    Đề này bao gồm {generatedAssessment.lessons.length} bài học (tự động lấy từ ma
                    trận)
                  </p>
                  <div className="lesson-chips">
                    {generatedAssessment.lessons.map((lesson) => (
                      <span key={lesson.lessonId} className="chip">
                        {lesson.chapterName} - {lesson.lessonName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {publishSummary && (
                <div
                  className={`assessment-builder-flow__publish-summary rounded-xl ${publishSummary.canPublish ? 'ok' : 'warn'}`}
                >
                  <div className="flex items-start gap-2">
                    {publishSummary.canPublish ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2} />
                    ) : (
                      <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" strokeWidth={2} />
                    )}
                    <strong className="font-[Be_Vietnam_Pro] text-[13px] font-semibold leading-snug">
                      {publishSummary.canPublish
                        ? 'Sẵn sàng công khai'
                        : 'Cần xử lý trước khi công khai'}
                    </strong>
                  </div>
                  {publishSummary.validationMessage && (
                    <p className="font-[Be_Vietnam_Pro] text-[12px] leading-relaxed">
                      {publishSummary.validationMessage}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  className="btn secondary btn--tint-violet"
                  onClick={() => navigate(`/teacher/assessments/${generatedAssessmentId}`)}
                >
                  Mở chi tiết đề
                </button>
                <button
                  type="button"
                  className="btn btn--feat-emerald"
                  onClick={() => void handlePublish()}
                  disabled={
                    !publishSummary?.canPublish ||
                    publishMutation.isPending ||
                    generatedAssessment?.status === 'PUBLISHED'
                  }
                >
                  {publishButtonLabel}
                </button>
              </div>
            </>
          )}
        </article>
      </section>

      {toast && (
        <div
          className={`assessment-builder-flow__toast assessment-builder-flow__toast--${toast.type}`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}

/**
 * Standalone "Tạo đề thi" page (kept for the legacy /teacher/assessment-builder
 * route, currently redirected). Wraps the body in DashboardLayout + page header.
 */
export default function AssessmentBuilderFlow() {
  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container">
        <section className="module-page teacher-courses-page assessment-builder-flow-page">
          <header className="page-header courses-header-row">
            <div className="header-stack">
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Tạo đề thi</h2>
              </div>
              <p className="header-sub">Tạo đề thi đơn giản cho giáo viên.</p>
            </div>
          </header>
          <AssessmentBuilderFlowBody />
        </section>
      </div>
    </DashboardLayout>
  );
}
