import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Library,
  Ruler,
  Sparkles,
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

  return (
    <>
      <nav className="abf-quicknav">
        <button className="abf-quicknav__item" onClick={() => navigate('/teacher/exam-matrices')}>
          <span className="abf-quicknav__icon abf-nav-indigo">
            <Ruler size={14} />
          </span>
          <span className="abf-quicknav__text">
            <span className="abf-quicknav__title">Ma trận đề</span>
          </span>
          <ArrowRight size={14} className="abf-quicknav__arrow" />
        </button>
        <span className="abf-quicknav__divider" />
        <button
          className="abf-quicknav__item"
          onClick={() => navigate('/teacher/question-templates')}
        >
          <span className="abf-quicknav__icon abf-nav-violet">
            <Sparkles size={14} />
          </span>
          <span className="abf-quicknav__text">
            <span className="abf-quicknav__title">Mẫu câu hỏi</span>
          </span>
          <ArrowRight size={14} className="abf-quicknav__arrow" />
        </button>
        <span className="abf-quicknav__divider" />
        <button className="abf-quicknav__item" onClick={() => navigate('/teacher/question-banks')}>
          <span className="abf-quicknav__icon abf-nav-blue">
            <Library size={14} />
          </span>
          <span className="abf-quicknav__text">
            <span className="abf-quicknav__title">Ngân hàng câu hỏi</span>
          </span>
          <ArrowRight size={14} className="abf-quicknav__arrow" />
        </button>
      </nav>

      <section className="data-card abf-process-card">
        <div className="abf-process-head">
          <h3 className="abf-process-title">Quy trình tạo đề 4 bước</h3>
          <p className="abf-process-subtitle">
            Làm theo thứ tự để lên đề hoàn chỉnh, đúng dữ liệu và đúng quy trình.
          </p>
        </div>
        <ol className="abf-step-list">
          <li className="abf-step">
            <span className="abf-step__num">1</span>
            <div className="abf-step__body">
              <strong className="abf-step__title">Mẫu câu hỏi</strong>
            </div>
            <button
              type="button"
              className="btn secondary btn--tint-violet"
              onClick={() => navigate('/teacher/question-templates')}
            >
              Mở <ArrowRight size={13} />
            </button>
          </li>
          <li className="abf-step">
            <span className="abf-step__num">2</span>
            <div className="abf-step__body">
              <strong className="abf-step__title">Ngân hàng câu hỏi</strong>
            </div>
            <button
              type="button"
              className="btn secondary btn--tint-emerald"
              onClick={() => navigate('/teacher/question-banks')}
            >
              Mở <ArrowRight size={13} />
            </button>
          </li>
          <li className="abf-step">
            <span className="abf-step__num">3</span>
            <div className="abf-step__body">
              <strong className="abf-step__title">Ma trận đề</strong>
            </div>
            <button
              type="button"
              className="btn secondary btn--tint-indigo"
              onClick={() => navigate('/teacher/exam-matrices')}
            >
              Mở <ArrowRight size={13} />
            </button>
          </li>
          <li className="abf-step abf-step--active">
            <span className="abf-step__num abf-step__num--active">4</span>
            <div className="abf-step__body">
              <strong className="abf-step__title">{UI_TEXT.QUIZ}</strong>
            </div>
            <span className="badge draft">Bạn đang ở đây</span>
          </li>
        </ol>
      </section>

      <section className="assessment-builder-flow__orchestration-grid">
        <article className="data-card">
          <h3>Bước 1: Tạo đề thi từ ma trận + ngân hàng</h3>
          <p className="muted" style={{ margin: '0 0 0.6rem' }}>
            Ma trận quyết định cấu trúc (chương, mức độ, số câu). Chọn 1 hoặc nhiều ngân hàng để hệ
            thống random câu hỏi từ pool gộp lại theo tiêu chí ma trận.
          </p>

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

          <div className="row" style={{ flexWrap: 'wrap', marginTop: 12 }}>
            <button
              type="button"
              className="btn btn--feat-indigo"
              onClick={() => void handleGenerate()}
              disabled={!canGenerate}
            >
              {generateMutation.isPending ? 'Đang tạo…' : 'Tạo đề thi từ ma trận đã chọn'}
            </button>
            <button
              type="button"
              className="btn secondary btn--tint-indigo"
              onClick={() => navigate('/teacher/exam-matrices')}
            >
              Quản lý ma trận
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

        <article className="data-card">
          <h3>Bước 2: Rà soát cuối và công khai</h3>
          {!generatedAssessmentId && (
            <p className="empty">Hãy tạo đề nháp trước để bật bước rà soát cuối.</p>
          )}

          {generatedAssessmentId && (
            <>
              <div className="assessment-builder-flow__review-meta">
                <span
                  className={`badge ${generatedAssessment?.status === 'PUBLISHED' ? 'published' : 'draft'}`}
                >
                  {generatedAssessment?.status || 'DRAFT'}
                </span>
                <span className="muted">Mã đề: {generatedAssessmentId}</span>
              </div>

              <div className="assessment-builder-flow__review-stats">
                <div className="stat-card">
                  <p>Tổng số câu hỏi</p>
                  <h3>{generatedQuestions.length}</h3>
                </div>
                <div className="stat-card">
                  <p>Tổng điểm</p>
                  <h3>{generatedAssessment?.totalPoints ?? 0}</h3>
                </div>
              </div>

              {generatedAssessment?.generationSummary && (
                <div className="data-card" style={{ minHeight: 0 }}>
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
                <div className="data-card" style={{ minHeight: 0 }}>
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
                  className={`assessment-builder-flow__publish-summary ${publishSummary.canPublish ? 'ok' : 'warn'}`}
                >
                  <div className="row">
                    {publishSummary.canPublish ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <FileCheck2 size={16} />
                    )}
                    <strong>
                      {publishSummary.canPublish
                        ? 'Sẵn sàng công khai'
                        : 'Cần xử lý trước khi công khai'}
                    </strong>
                  </div>
                  {publishSummary.validationMessage && <p>{publishSummary.validationMessage}</p>}
                </div>
              )}

              <div className="row" style={{ flexWrap: 'wrap' }}>
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
