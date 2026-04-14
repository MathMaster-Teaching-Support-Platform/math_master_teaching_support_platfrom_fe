import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
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

  const { data, isLoading, isError, error, refetch } = useGetExamMatrixById(
    matrixId ?? '',
    !!matrixId
  );
  const { data: tableData, refetch: refetchTable } = useGetExamMatrixTable(
    matrixId ?? '',
    !!matrixId
  );

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
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
    >
      <div className="module-layout-container">
        <section className="module-page">
          <button className="btn secondary" onClick={() => navigate('/teacher/exam-matrices')}>
            <ArrowLeft size={15} />
            Quay lại danh sách ma trận
          </button>

          {isLoading && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem 2rem',
                gap: '1rem',
              }}
            >
              <style>{`@keyframes emxd-spin { to { transform: rotate(360deg); } }`}</style>
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '3px solid #e2e8f0',
                  borderTopColor: '#2563eb',
                  animation: 'emxd-spin 0.75s linear infinite',
                  display: 'inline-block',
                }}
              />
              <p className="muted" style={{ fontSize: '0.9rem' }}>
                Đang tải chi tiết ma trận...
              </p>
            </div>
          )}
          {isError && (
            <div className="empty">
              {error instanceof Error ? error.message : 'Không thể tải chi tiết ma trận'}
            </div>
          )}
          {!isLoading && !isError && !matrix && (
            <div className="empty">Không tìm thấy ma trận.</div>
          )}

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

                {/* Action Buttons */}
                <div className="row" style={{ marginTop: 20, gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className="btn secondary"
                    onClick={() => void refreshMatrix()}
                    disabled={refreshing}
                  >
                    <RefreshCw size={14} />
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

              {/* Matrix Table Header */}
              <div
                className="row"
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
                matrixTotalPointsTarget={matrix.totalPointsTarget}
                canEdit={canEdit}
                onRemoveRow={removeRow}
                percentageDraft={percentageDraft}
                onChangePercentageDraft={setPercentageDraft}
                onSavePercentages={handleSavePercentages}
                savingPercentages={upsertBatchCellsMutation.isPending}
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
