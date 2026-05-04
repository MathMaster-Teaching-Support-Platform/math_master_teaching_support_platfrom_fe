import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileDown,
  FileSpreadsheet,
  Grid2x2,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MatrixTable } from '../../components/exam-matrix';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
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
import { MatrixStatus, type MatrixValidationReport } from '../../types/examMatrix';
import { exportExamMatrixToExcel, exportExamMatrixToPdf } from '../../utils/examMatrixExport';
import '../courses/TeacherCourses.css';
import './ExamMatrixDashboard.css';
import { ExamMatrixRowModal } from './ExamMatrixRowModal';

const matrixStatusLabel: Record<string, string> = {
  DRAFT: 'Nháp',
  APPROVED: 'Đã phê duyệt',
  LOCKED: 'Đã khóa',
};

export default function ExamMatrixDetailPageRefactored() {
  const { matrixId } = useParams<{ matrixId: string }>();
  const navigate = useNavigate();
  const [validation, setValidation] = useState<MatrixValidationReport | null>(null);
  const [rowModalOpen, setRowModalOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exportBusy, setExportBusy] = useState<'excel' | 'pdf' | null>(null);
  const { showToast } = useToast();

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
  const batchUpsertCellsMutation = useBatchUpsertMatrixRowCells();

  const matrix = data?.result;
  const table = tableData?.result;
  const chapters = useMemo(() => table?.chapters ?? [], [table]);

  const canEdit = matrix?.status === MatrixStatus.DRAFT;

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

  async function handleCellChange(
    matrixId: string,
    updates: import('../../types/examMatrix').BatchUpsertMatrixRowCellsRequest
  ) {
    await batchUpsertCellsMutation.mutateAsync({ matrixId, request: updates });
    await refetchTable();
  }

  async function removeMatrix() {
    if (!matrixId) return;
    if (!globalThis.confirm('Bạn có chắc muốn xóa ma trận này?')) return;
    await deleteMutation.mutateAsync(matrixId);
    navigate('/teacher/exam-matrices', { replace: true });
  }

  async function handleApprove() {
    if (!matrix?.id || !matrix?.name) return;

    const matrixName = matrix.name; // Capture name before mutation

    try {
      await approveMutation.mutateAsync(matrix.id);
      showToast({
        type: 'success',
        message: `Đã phê duyệt ma trận "${matrixName}" thành công!`,
      });
      await refetch();
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể phê duyệt ma trận.',
      });
    }
  }

  async function handleReset() {
    if (!matrix?.id) return;
    if (!globalThis.confirm('Bạn có chắc muốn đặt lại ma trận về trạng thái nháp?')) return;
    await resetMutation.mutateAsync(matrix.id);
    await refetch();
  }

  function handleExportExcel() {
    if (!matrix || !table) return;
    if (!chapters.length) {
      showToast({ type: 'info', message: 'Chưa có dòng ma trận để xuất.' });
      return;
    }
    try {
      setExportBusy('excel');
      exportExamMatrixToExcel({ matrix, table });
      showToast({ type: 'success', message: 'Đã tải file Excel.' });
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể xuất Excel.',
      });
    } finally {
      setExportBusy(null);
    }
  }

  async function handleExportPdf() {
    if (!matrix || !table) return;
    if (!chapters.length) {
      showToast({ type: 'info', message: 'Chưa có dòng ma trận để xuất.' });
      return;
    }
    try {
      setExportBusy('pdf');
      await exportExamMatrixToPdf({ matrix, table });
      showToast({ type: 'success', message: 'Đã tải file PDF.' });
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể xuất PDF.',
      });
    } finally {
      setExportBusy(null);
    }
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
              <div
                className="row"
                style={{ gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}
              >
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
                  <div className="row" style={{ gap: '1.25rem', flexWrap: 'wrap', marginTop: 8 }}>
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
              <p>{error instanceof Error ? error.message : 'Không thể tải chi tiết ma trận'}</p>
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
                    <h2
                      className="exam-matrix-detail-hero-title"
                      style={{ marginTop: 8, marginBottom: 12 }}
                    >
                      {matrix.name}
                    </h2>
                    <p className="exam-matrix-detail-desc" style={{ marginBottom: 12 }}>
                      {matrix.description || 'Không có mô tả'}
                    </p>
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
                    <RefreshCw
                      size={14}
                      className={refreshing ? 'exam-matrix-nav-spin' : undefined}
                    />
                    {refreshing ? 'Đang làm mới...' : 'Làm mới'}
                  </button>
                  <button
                    type="button"
                    className="btn secondary btn--tint-emerald"
                    onClick={() => handleExportExcel()}
                    disabled={!!exportBusy}
                    title="Xuất bảng ma trận ra file .xlsx (dữ liệu đã lưu)"
                  >
                    <FileSpreadsheet size={14} />
                    {exportBusy === 'excel' ? 'Đang xuất...' : 'Xuất Excel'}
                  </button>
                  <button
                    type="button"
                    className="btn secondary btn--tint-indigo"
                    onClick={() => void handleExportPdf()}
                    disabled={!!exportBusy}
                    title="Xuất bảng ma trận ra PDF (ảnh bảng, hỗ trợ tiếng Việt)"
                  >
                    <FileDown size={14} />
                    {exportBusy === 'pdf' ? 'Đang xuất...' : 'Xuất PDF'}
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
                numberOfParts={(matrix as any)?.numberOfParts || (table as any)?.numberOfParts || 1} // ✅ NEW
                parts={table?.parts}
                matrixTotalPointsTarget={matrix.totalPointsTarget}
                canEdit={canEdit}
                onRemoveRow={removeRow}
                onCellChange={handleCellChange}
                matrixId={matrixId}
              />
            </motion.div>
          )}

          {/* Add Row Modal */}
          {matrixId && (
            <ExamMatrixRowModal
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
