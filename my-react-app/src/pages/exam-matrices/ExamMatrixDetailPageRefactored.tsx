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
  Ruler,
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

function matrixStatusPillClass(status: MatrixStatus): string {
  switch (status) {
    case MatrixStatus.DRAFT:
      return 'inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]';
    case MatrixStatus.APPROVED:
      return 'inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 font-[Be_Vietnam_Pro] text-[12px] font-semibold text-emerald-800 border border-emerald-200';
    case MatrixStatus.LOCKED:
      return 'inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 font-[Be_Vietnam_Pro] text-[12px] font-semibold text-slate-600 border border-slate-200';
    default:
      return 'inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]';
  }
}

function matrixDetailShortSubtitle(matrix: { status: MatrixStatus } | null, loading: boolean): string {
  if (loading) return 'Đang tải ma trận và bảng…';
  if (!matrix) return '';
  if (matrix.status === MatrixStatus.DRAFT) return 'Sửa bảng · Lưu trên bảng · Phê duyệt khi xong.';
  if (matrix.status === MatrixStatus.APPROVED) return 'Chỉ xem hoặc xuất file.';
  return 'Chỉ xem.';
}

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
      <div className="px-6 py-8 lg:px-8">
        <div className="module-layout-container">
          <section className="module-page teacher-courses-page exam-matrix-dashboard-page exam-matrix-detail-page">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors mb-5"
              onClick={() => navigate('/teacher/exam-matrices')}
            >
              <ArrowLeft size={15} aria-hidden />
              Quay lại danh sách ma trận
            </button>

            {/* Header — aligned with /teacher/mindmaps */}
            <header className="flex flex-col gap-2 pb-5 mb-2 border-b border-[#E8E6DC]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] shrink-0">
                  <Ruler className="w-5 h-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] m-0 leading-snug">
                      {isPageLoading
                        ? 'Đang tải…'
                        : matrix?.name?.trim() || 'Chi tiết ma trận đề'}
                    </h1>
                    {matrix && !isPageLoading && (
                      <span className={matrixStatusPillClass(matrix.status)}>
                        {matrixStatusLabel[matrix.status] ?? matrix.status}
                      </span>
                    )}
                  </div>
                  <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-1 m-0 leading-relaxed">
                    {matrixDetailShortSubtitle(matrix ?? null, isPageLoading)}
                  </p>
                </div>
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
              {/* Meta + actions (tiêu đề & trạng thái chỉ hiển thị một lần ở header trang) */}
              <article className="hero-card exam-matrix-detail-hero exam-matrix-detail-hero--slim">
                <div style={{ flex: 1, minWidth: 280 }}>
                  <p className="exam-matrix-detail-desc" style={{ margin: '0 0 10px', fontSize: 15 }}>
                    {matrix.description?.trim() ? (
                      matrix.description.trim()
                    ) : (
                      <span className="muted">Chưa có mô tả ngắn cho ma trận này.</span>
                    )}
                  </p>
                  <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {matrix.subjectName && (
                      <span
                        className="exam-matrix-meta-chip"
                        title="Môn học"
                      >
                        {matrix.subjectName}
                      </span>
                    )}
                    {(matrix.gradeLevel || table?.gradeLevel) && (
                      <span className="exam-matrix-meta-chip" title="Khối / lớp">
                        Lớp {matrix.gradeLevel || table?.gradeLevel}
                      </span>
                    )}
                    {typeof matrix.rowCount === 'number' && (
                      <span className="muted" style={{ fontSize: 13 }}>
                        {matrix.rowCount} dòng trong ma trận
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className="row exam-matrix-detail-actions"
                  style={{ marginTop: 18, gap: 8, flexWrap: 'wrap' }}
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
                    title="Xuất ma trận ra file .xlsx (dữ liệu đã lưu)"
                  >
                    <FileSpreadsheet size={14} />
                    {exportBusy === 'excel' ? 'Đang xuất...' : 'Xuất Excel'}
                  </button>
                  <button
                    type="button"
                    className="btn secondary btn--tint-indigo"
                    onClick={() => void handleExportPdf()}
                    disabled={!!exportBusy}
                    title="Xuất ma trận ra PDF (ảnh bảng, hỗ trợ tiếng Việt)"
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
                <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                  <div className="row" style={{ alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h3 style={{ marginBottom: 4 }}>Bảng ma trận đề</h3>
                    {canEdit && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FFF7ED] font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#9a3412] border border-[#FDBA74] uppercase tracking-wide"
                        title="Chỉ lưu khi bấm «Lưu thay đổi» trên bảng"
                      >
                        Chỉnh sửa · Lưu tay
                      </span>
                    )}
                  </div>
                  <p className="muted font-[Be_Vietnam_Pro]" style={{ fontSize: 13, marginTop: 6 }}>
                    {canEdit
                      ? 'Click ô · Enter xác nhận · «Lưu thay đổi» / «Hủy» trên bảng.'
                      : 'Chỉ xem theo chuẩn phân bố đề.'}
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
              bankId={matrix?.questionBankId}
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
      </div>
    </DashboardLayout>
  );
}
