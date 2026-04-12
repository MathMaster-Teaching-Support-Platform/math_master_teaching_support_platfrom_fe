import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Plus, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useApproveMatrix,
  useDeleteExamMatrix,
  useGetExamMatrixById,
  useGetExamMatrixTable,
  useRemoveExamMatrixRow,
  useResetMatrix,
} from '../../hooks/useExamMatrix';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { MatrixTable } from '../../components/exam-matrix';
import { examMatrixService } from '../../services/examMatrixService';
import '../../styles/module-refactor.css';
import {
  MatrixStatus,
  type MatrixValidationReport,
} from '../../types/examMatrix';
import { ExamMatrixRowModalRefactored } from './ExamMatrixRowModalRefactored';

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

  const { data, isLoading, isError, error, refetch } = useGetExamMatrixById(
    matrixId ?? '',
    !!matrixId,
  );
  const { data: tableData, refetch: refetchTable } = useGetExamMatrixTable(
    matrixId ?? '',
    !!matrixId,
  );

  const approveMutation = useApproveMatrix();
  const resetMutation = useResetMatrix();
  const deleteMutation = useDeleteExamMatrix();
  const removeRowMutation = useRemoveExamMatrixRow();

  const matrix = data?.result;
  const table = tableData?.result;
  const chapters = table?.chapters ?? [];

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

  async function removeMatrix() {
    if (!matrixId) return;
    if (!window.confirm('Bạn có chắc muốn xóa ma trận này?')) return;
    await deleteMutation.mutateAsync(matrixId);
    navigate('/teacher/exam-matrices');
  }

  async function handleApprove() {
    if (!matrix?.id) return;
    if (!window.confirm('Bạn có chắc muốn phê duyệt ma trận này? Sau khi phê duyệt, bạn không thể chỉnh sửa.')) return;
    await approveMutation.mutateAsync(matrix.id);
    await refetch();
  }

  async function handleReset() {
    if (!matrix?.id) return;
    if (!window.confirm('Bạn có chắc muốn đặt lại ma trận về trạng thái nháp?')) return;
    await resetMutation.mutateAsync(matrix.id);
    await refetch();
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
    >
      <div className="module-layout-container">
        <section className="module-page">
          <button className="btn secondary" onClick={() => navigate('/teacher/exam-matrices')}>
            <ArrowLeft size={15} />
            Quay lại danh sách ma trận
          </button>

          {isLoading && <div className="empty">Đang tải chi tiết ma trận...</div>}
          {isError && (
            <div className="empty">
              {error instanceof Error ? error.message : 'Không thể tải chi tiết ma trận'}
            </div>
          )}
          {!isLoading && !isError && !matrix && <div className="empty">Không tìm thấy ma trận.</div>}

          {!isLoading && !isError && matrix && (
            <>
              {/* Header Card */}
              <article className="hero-card">
                <div className="row" style={{ alignItems: 'start', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 300 }}>
                    <p className="hero-kicker">Ma trận đề kiểm tra</p>
                    <h2 style={{ marginTop: 8, marginBottom: 12 }}>{matrix.name}</h2>
                    <p style={{ marginBottom: 12 }}>{matrix.description || 'Không có mô tả'}</p>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                      <div>
                        <span className="muted" style={{ fontSize: 12 }}>Khối</span>
                        <p style={{ fontWeight: 600, marginTop: 4 }}>
                          {matrix.gradeLevel || table?.gradeLevel || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="muted" style={{ fontSize: 12 }}>Môn học</span>
                        <p style={{ fontWeight: 600, marginTop: 4 }}>
                          {matrix.subjectName || table?.subjectName || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="muted" style={{ fontSize: 12 }}>Tổng điểm</span>
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

                {/* Action Buttons */}
                <div
                  className="row"
                  style={{ marginTop: 20, gap: 8, flexWrap: 'wrap' }}
                >
                  <button
                    className="btn secondary"
                    onClick={() => void refreshMatrix()}
                    disabled={refreshing}
                  >
                    {refreshing ? 'Đang làm mới...' : 'Làm mới'}
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => void runValidation()}
                    disabled={validating}
                  >
                    <ShieldCheck size={15} />
                    {validating ? 'Đang kiểm tra...' : 'Kiểm tra'}
                  </button>
                  {matrix.status === MatrixStatus.DRAFT && (
                    <button
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

              {/* Validation Report */}
              {validation && (
                <article className="data-card" style={{ minHeight: 0 }}>
                  <div className="row" style={{ alignItems: 'start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ marginBottom: 8 }}>Báo cáo kiểm tra</h3>
                      <p className="muted" style={{ fontSize: 13 }}>
                        Lỗi: <strong style={{ color: validation.errors.length > 0 ? '#dc2626' : '#10b981' }}>
                          {validation.errors.length}
                        </strong> | Cảnh báo: <strong style={{ color: validation.warnings.length > 0 ? '#f59e0b' : '#10b981' }}>
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
                      <p style={{ fontWeight: 600, fontSize: 13, color: '#dc2626', marginBottom: 8 }}>
                        Lỗi cần sửa:
                      </p>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {validation.errors.map((item, idx) => (
                          <li key={idx} style={{ color: '#dc2626', fontSize: 13, marginBottom: 4 }}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validation.warnings.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <p style={{ fontWeight: 600, fontSize: 13, color: '#f59e0b', marginBottom: 8 }}>
                        Cảnh báo:
                      </p>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {validation.warnings.map((item, idx) => (
                          <li key={idx} style={{ color: '#f59e0b', fontSize: 13, marginBottom: 4 }}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              )}

              {/* Matrix Table Header */}
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 16 }}>
                <div>
                  <h3 style={{ marginBottom: 4 }}>Bảng ma trận đề</h3>
                  <p className="muted" style={{ fontSize: 13 }}>
                    Ma trận đề theo chuẩn Bộ Giáo dục và Đào tạo
                  </p>
                </div>
                {canEdit && (
                  <button className="btn" onClick={() => setRowModalOpen(true)}>
                    <Plus size={15} />
                    Thêm dòng
                  </button>
                )}
              </div>

              {/* Matrix Table */}
              <MatrixTable
                chapters={chapters}
                gradeLevel={matrix.gradeLevel || table?.gradeLevel}
                subjectName={matrix.subjectName || table?.subjectName}
                canEdit={canEdit}
                onRemoveRow={removeRow}
              />
            </>
          )}

          {/* Add Row Modal */}
          {matrixId && (
            <ExamMatrixRowModalRefactored
              isOpen={rowModalOpen}
              matrixId={matrixId}
              matrixGradeLevel={matrix?.gradeLevel ?? table?.gradeLevel}
              subjectId={matrix?.subjectId ?? table?.subjectId}
              matrixTotalPointsTarget={matrix?.totalPointsTarget}
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
