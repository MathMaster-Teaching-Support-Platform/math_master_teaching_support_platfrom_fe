import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Grid2x2,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MatrixTable } from '../../components/exam-matrix';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useApproveMatrix,
  useBatchUpsertMatrixRowCells,
  useDeleteExamMatrix,
  useGetExamMatrixById,
  useGetExamMatrixTable,
  useRemoveExamMatrixRow,
  useResetMatrix,
} from '../../hooks/useExamMatrix';
import { examMatrixService } from '../../services/examMatrixService';
import '../../styles/module-refactor.css';
import {
  MatrixStatus,
  type BatchUpsertMatrixRowCellsRequest,
  type MatrixCognitiveDistribution,
  type MatrixValidationReport,
} from '../../types/examMatrix';
import { ExamMatrixRowModalRefactored } from './ExamMatrixRowModalRefactored';
import '../courses/TeacherCourses.css';
import './ExamMatrixDashboard.css';

const matrixStatusLabel: Record<string, string> = {
  DRAFT: 'Nháp',
  APPROVED: 'Đã phê duyệt',
  LOCKED: 'Đã khóa',
};

function getPercentageValue(
  distribution: MatrixCognitiveDistribution | undefined,
  level: 'NHAN_BIET' | 'THONG_HIEU' | 'VAN_DUNG' | 'VAN_DUNG_CAO'
): number {
  if (!distribution) return 0;
  if (level === 'NHAN_BIET') {
    return Number(distribution.NHAN_BIET ?? distribution.NB ?? distribution.REMEMBER ?? 0);
  }
  if (level === 'THONG_HIEU') {
    return Number(distribution.THONG_HIEU ?? distribution.TH ?? distribution.UNDERSTAND ?? 0);
  }
  if (level === 'VAN_DUNG') {
    return Number(distribution.VAN_DUNG ?? distribution.VD ?? distribution.APPLY ?? 0);
  }
  return Number(distribution.VAN_DUNG_CAO ?? distribution.VDC ?? distribution.ANALYZE ?? 0);
}

function toPercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((value / total) * 100).toFixed(2));
}

export default function ExamMatrixDetailPageRefactored() {
  const { matrixId } = useParams<{ matrixId: string }>();
  const navigate = useNavigate();

  const [validation, setValidation] = useState<MatrixValidationReport | null>(null);
  const [rowModalOpen, setRowModalOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [percentageDraft, setPercentageDraft] = useState({
    totalQuestionsTarget: 40,
    cognitiveLevelPercentages: {
      NHAN_BIET: 25,
      THONG_HIEU: 25,
      VAN_DUNG: 25,
      VAN_DUNG_CAO: 25,
    },
  });

  const {
    data,
    isLoading: matrixQueryLoading,
    isError,
    error,
    refetch,
  } = useGetExamMatrixById(matrixId ?? '', !!matrixId);
  const {
    data: tableData,
    isLoading: tableQueryLoading,
    refetch: refetchTable,
  } = useGetExamMatrixTable(matrixId ?? '', !!matrixId);

  const isPageLoading = matrixQueryLoading || tableQueryLoading;

  const approveMutation = useApproveMatrix();
  const resetMutation = useResetMatrix();
  const deleteMutation = useDeleteExamMatrix();
  const removeRowMutation = useRemoveExamMatrixRow();
  const upsertBatchCellsMutation = useBatchUpsertMatrixRowCells();

  const matrix = data?.result;
  const table = tableData?.result;
  const chapters = useMemo(() => table?.chapters ?? [], [table]);

  const canEdit = matrix?.status === MatrixStatus.DRAFT;

  useEffect(() => {
    if (!matrix) return;

    const totalQuestionsTarget = Number(
      matrix.totalQuestionsTarget ?? table?.grandTotalQuestions ?? 40
    );
    const fromServer = matrix.cognitiveLevelPercentages;

    const pFromMatrix = {
      NHAN_BIET: getPercentageValue(fromServer, 'NHAN_BIET'),
      THONG_HIEU: getPercentageValue(fromServer, 'THONG_HIEU'),
      VAN_DUNG: getPercentageValue(fromServer, 'VAN_DUNG'),
      VAN_DUNG_CAO: getPercentageValue(fromServer, 'VAN_DUNG_CAO'),
    };
    const matrixTotal =
      pFromMatrix.NHAN_BIET +
      pFromMatrix.THONG_HIEU +
      pFromMatrix.VAN_DUNG +
      pFromMatrix.VAN_DUNG_CAO;
    const hasMatrixPercentages =
      matrixTotal > 0 &&
      matrixTotal <= 100.01 &&
      Object.values(pFromMatrix).every((value) => value >= 0 && value <= 100);

    if (hasMatrixPercentages) {
      setPercentageDraft({
        totalQuestionsTarget,
        cognitiveLevelPercentages: pFromMatrix,
      });
      return;
    }

    const fromTable = table?.grandTotalByCognitive;
    const cFromTable = {
      NHAN_BIET: getPercentageValue(fromTable, 'NHAN_BIET'),
      THONG_HIEU: getPercentageValue(fromTable, 'THONG_HIEU'),
      VAN_DUNG: getPercentageValue(fromTable, 'VAN_DUNG'),
      VAN_DUNG_CAO: getPercentageValue(fromTable, 'VAN_DUNG_CAO'),
    };
    const tableTotal =
      cFromTable.NHAN_BIET + cFromTable.THONG_HIEU + cFromTable.VAN_DUNG + cFromTable.VAN_DUNG_CAO;

    if (tableTotal > 0) {
      setPercentageDraft({
        totalQuestionsTarget: Math.max(1, tableTotal),
        cognitiveLevelPercentages: {
          NHAN_BIET: toPercent(cFromTable.NHAN_BIET, tableTotal),
          THONG_HIEU: toPercent(cFromTable.THONG_HIEU, tableTotal),
          VAN_DUNG: toPercent(cFromTable.VAN_DUNG, tableTotal),
          VAN_DUNG_CAO: toPercent(cFromTable.VAN_DUNG_CAO, tableTotal),
        },
      });
      return;
    }

    setPercentageDraft({
      totalQuestionsTarget,
      cognitiveLevelPercentages: {
        NHAN_BIET: 25,
        THONG_HIEU: 25,
        VAN_DUNG: 25,
        VAN_DUNG_CAO: 25,
      },
    });
  }, [matrix, table]);

  async function handleSavePercentages(request: BatchUpsertMatrixRowCellsRequest) {
    if (!matrixId) return;
    await upsertBatchCellsMutation.mutateAsync({ matrixId, request });
    await refetchTable();
  }

  async function refreshMatrix() {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchTable()]);
    } finally {
      setRefreshing(false);
    }
  }

  async function runValidation() {
    if (!matrixId) return;
    setValidating(true);
    try {
      const result = await examMatrixService.validateMatrix(matrixId);
      setValidation(result.result ?? null);
    } finally {
      setValidating(false);
    }
  }

  async function removeRow(rowId: string) {
    if (!matrixId) return;
    await removeRowMutation.mutateAsync({ matrixId, rowId });
    await refetchTable();
  }

  async function removeMatrix() {
    if (!matrixId) return;
    if (!globalThis.confirm('Bạn có chắc muốn xóa ma trận này?')) return;
    await deleteMutation.mutateAsync(matrixId);
    navigate('/teacher/exam-matrices', { replace: true });
  }

  async function handleApprove() {
    if (!matrix?.id) return;
    if (
      !globalThis.confirm(
        'Bạn có chắc muốn phê duyệt ma trận này? Sau khi phê duyệt, bạn không thể chỉnh sửa.'
      )
    )
      return;
    await approveMutation.mutateAsync(matrix.id);
    await refetch();
  }

  async function handleReset() {
    if (!matrix?.id) return;
    if (!globalThis.confirm('Bạn có chắc muốn đặt lại ma trận về trạng thái nháp?')) return;
    await resetMutation.mutateAsync(matrix.id);
    await refetch();
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Giáo viên', avatar: '', role: 'teacher' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container">
        <section className="module-page teacher-courses-page exam-matrix-dashboard-page exam-matrix-detail-page">
          <div className="exam-matrix-detail-back-row">
            <button
              type="button"
              className="btn secondary"
              onClick={() => navigate('/teacher/exam-matrices')}
            >
              <ArrowLeft size={15} />
              Quay lại danh sách ma trận
            </button>
          </div>

          <header className="page-header courses-header-row exam-matrix-detail-page-header">
            <div className="header-stack">
              <div className="header-kicker">Teacher Studio</div>
              <div className="row" style={{ gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <h2>{isPageLoading ? 'Chi tiết ma trận đề' : 'Ma trận đề'}</h2>
                {matrix && !isPageLoading && (
                  <span
                    className={`badge ${matrix.status.toLowerCase()}`}
                    style={{ fontSize: 12, padding: '4px 10px' }}
                  >
                    {matrixStatusLabel[matrix.status] || matrix.status}
                  </span>
                )}
              </div>
              <p className="header-sub exam-matrix-detail-header-sub">
                {isPageLoading
                  ? 'Đang tải thông tin ma trận và bảng phân bố...'
                  : 'Xem bảng ma trận, điều chỉnh phân bố, kiểm tra và phê duyệt khi sẵn sàng.'}
              </p>
            </div>
          </header>

          {isPageLoading && (
            <div className="exam-matrix-detail-skeleton" aria-busy="true" aria-label="Đang tải">
              <div className="skeleton-detail">
                <div className="skeleton-detail-header">
                  <div className="skeleton-line sk-xs" style={{ maxWidth: 120 }} />
                  <div className="skeleton-line sk-xl" />
                  <div className="skeleton-line sk-md" />
                  <div className="skeleton-line sk-sm" />
                </div>
                <div className="skeleton-section">
                  <div className="skeleton-line sk-lg" style={{ width: '40%' }} />
                  <div
                    className="row"
                    style={{ gap: '1.25rem', flexWrap: 'wrap', marginTop: 8 }}
                  >
                    <div className="skeleton-info-item" style={{ minWidth: 100 }}>
                      <div className="skeleton-line sk-sm" />
                      <div className="skeleton-line sk-md" />
                    </div>
                    <div className="skeleton-info-item" style={{ minWidth: 100 }}>
                      <div className="skeleton-line sk-sm" />
                      <div className="skeleton-line sk-md" />
                    </div>
                    <div className="skeleton-info-item" style={{ minWidth: 80 }}>
                      <div className="skeleton-line sk-sm" />
                      <div className="skeleton-line sk-md" />
                    </div>
                  </div>
                </div>
                <div className="skeleton-section exam-matrix-detail-skeleton-table">
                  <div className="skeleton-line sk-lg" style={{ width: '32%' }} />
                  <div className="skeleton-block" style={{ height: 160 }} />
                </div>
              </div>
            </div>
          )}

          {isError && (
            <div className="empty exam-matrix-detail-empty">
              <AlertCircle
                size={32}
                style={{ opacity: 0.45, color: 'var(--mod-danger)' }}
                aria-hidden
              />
              <p>
                {error instanceof Error ? error.message : 'Không thể tải chi tiết ma trận'}
              </p>
              <button type="button" className="btn secondary" onClick={() => void refetch()}>
                <RefreshCw size={14} />
                Thử lại
              </button>
            </div>
          )}
          {!isPageLoading && !isError && !matrix && (
            <div className="empty exam-matrix-detail-empty">
              <Grid2x2 size={32} style={{ opacity: 0.35 }} aria-hidden />
              <p>Không tìm thấy ma trận.</p>
              <button
                type="button"
                className="btn secondary"
                onClick={() => navigate('/teacher/exam-matrices')}
              >
                <ArrowLeft size={15} />
                Về danh sách
              </button>
            </div>
          )}

          {!isPageLoading && !isError && matrix && (
            <motion.div
              className="exam-matrix-detail-content"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Header Card */}
              <article className="hero-card exam-matrix-detail-hero">
                <div className="row" style={{ alignItems: 'start', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 300 }}>
                    <p className="hero-kicker">Ma trận đề kiểm tra</p>
                    <h2 className="exam-matrix-detail-hero-title" style={{ marginTop: 8, marginBottom: 12 }}>
                      {matrix.name}
                    </h2>
                    <p className="exam-matrix-detail-desc" style={{ marginBottom: 12 }}>
                      {matrix.description || 'Không có mô tả'}
                    </p>
                    <div
                      className="exam-matrix-detail-meta"
                      style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}
                    >
                      <div>
                        <span className="muted" style={{ fontSize: 12 }}>
                          Khối
                        </span>
                        <p style={{ fontWeight: 600, marginTop: 4 }}>
                          {matrix.gradeLevel || table?.gradeLevel || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="muted" style={{ fontSize: 12 }}>
                          Môn học
                        </span>
                        <p style={{ fontWeight: 600, marginTop: 4 }}>
                          {matrix.subjectName || table?.subjectName || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="muted" style={{ fontSize: 12 }}>
                          Tổng điểm
                        </span>
                        <p style={{ fontWeight: 600, marginTop: 4 }}>
                          {matrix.totalPointsTarget || 10}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`badge ${matrix.status.toLowerCase()}`}
                    style={{ fontSize: 13, padding: '6px 12px' }}
                  >
                    {matrixStatusLabel[matrix.status] || matrix.status}
                  </span>
                </div>

                <div
                  className="row exam-matrix-detail-actions"
                  style={{ marginTop: 20, gap: 8, flexWrap: 'wrap' }}
                >
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => void refreshMatrix()}
                    disabled={refreshing}
                  >
                    <RefreshCw size={14} className={refreshing ? 'exam-matrix-nav-spin' : undefined} />
                    {refreshing ? 'Đang làm mới...' : 'Làm mới'}
                  </button>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => void runValidation()}
                    disabled={validating}
                  >
                    <ShieldCheck size={15} />
                    {validating ? 'Đang kiểm tra...' : 'Kiểm tra'}
                  </button>
                  {matrix.status === MatrixStatus.DRAFT && (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => void handleApprove()}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle2 size={15} />
                      {approveMutation.isPending ? 'Đang phê duyệt...' : 'Phê duyệt'}
                    </button>
                  )}
                  {matrix.status === MatrixStatus.APPROVED && (
                    <button
                      type="button"
                      className="btn warn"
                      onClick={() => void handleReset()}
                      disabled={resetMutation.isPending}
                    >
                      <RotateCcw size={15} />
                      {resetMutation.isPending ? 'Đang đặt lại...' : 'Đặt lại'}
                    </button>
                  )}
                  {matrix.status !== MatrixStatus.LOCKED && (
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => void removeMatrix()}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={15} />
                      {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
                    </button>
                  )}
                </div>
              </article>

              {validation && (
                <article className="data-card exam-matrix-validation-card" style={{ minHeight: 0 }}>
                  <div className="row" style={{ alignItems: 'start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ marginBottom: 8 }}>Báo cáo kiểm tra</h3>
                      <p className="muted" style={{ fontSize: 13 }}>
                        Lỗi:{' '}
                        <strong
                          style={{ color: validation.errors.length > 0 ? '#dc2626' : '#10b981' }}
                        >
                          {validation.errors.length}
                        </strong>{' '}
                        | Cảnh báo:{' '}
                        <strong
                          style={{ color: validation.warnings.length > 0 ? '#f59e0b' : '#10b981' }}
                        >
                          {validation.warnings.length}
                        </strong>
                      </p>
                    </div>
                    <span className={`badge ${validation.canApprove ? 'approved' : 'closed'}`}>
                      {validation.canApprove ? 'Sẵn sàng phê duyệt' : 'Cần xử lý'}
                    </span>
                  </div>
                  {validation.errors.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <p
                        style={{ fontWeight: 600, fontSize: 13, color: '#dc2626', marginBottom: 8 }}
                      >
                        Lỗi cần sửa:
                      </p>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {validation.errors.map((item) => (
                          <li
                            key={`error-${item}`}
                            style={{ color: '#dc2626', fontSize: 13, marginBottom: 4 }}
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validation.warnings.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <p
                        style={{ fontWeight: 600, fontSize: 13, color: '#f59e0b', marginBottom: 8 }}
                      >
                        Cảnh báo:
                      </p>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {validation.warnings.map((item) => (
                          <li
                            key={`warning-${item}`}
                            style={{ color: '#f59e0b', fontSize: 13, marginBottom: 4 }}
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              )}

              <div
                className="row exam-matrix-table-heading"
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 24,
                  marginBottom: 16,
                }}
              >
                <div>
                  <h3 style={{ marginBottom: 4 }}>Bảng ma trận đề</h3>
                  <p className="muted" style={{ fontSize: 13 }}>
                    Ma trận đề theo chuẩn Bộ Giáo dục và Đào tạo
                  </p>
                </div>
                {canEdit && (
                  <button type="button" className="btn" onClick={() => setRowModalOpen(true)}>
                    <Plus size={15} />
                    Thêm dòng
                  </button>
                )}
              </div>

              <MatrixTable
                chapters={chapters}
                gradeLevel={matrix.gradeLevel || table?.gradeLevel}
                subjectName={matrix.subjectName || table?.subjectName}
                matrixTotalPointsTarget={matrix.totalPointsTarget}
                canEdit={canEdit}
                onRemoveRow={removeRow}
                percentageDraft={percentageDraft}
                onChangePercentageDraft={setPercentageDraft}
                onSavePercentages={handleSavePercentages}
                savingPercentages={upsertBatchCellsMutation.isPending}
              />
            </motion.div>
          )}

          {/* Add Row Modal */}
          {matrixId && (
            <ExamMatrixRowModalRefactored
              isOpen={rowModalOpen}
              matrixId={matrixId}
              matrixGradeLevel={matrix?.gradeLevel ?? table?.gradeLevel}
              subjectId={matrix?.subjectId ?? table?.subjectId}
              onClose={() => {
                setRowModalOpen(false);
              }}
              onSuccess={() => {
                setRowModalOpen(false);
                void refetchTable();
              }}
            />
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
